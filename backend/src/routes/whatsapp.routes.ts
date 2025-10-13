import { Router, Request, Response } from 'express';
import { ResponseFormatter } from '../utils/responseFormatter';
import logger from '../utils/logger';
import { authenticate } from '../middleware/auth';
import { checkRole } from '../middleware/checkRole';
import { auditLogger } from '../middleware/auditLogger';
import { PrismaClient, AuditAction, LogCategory } from '@prisma/client';
import { requireModule } from '../middleware/module.middleware';

// Servizi esistenti
import { wppConnectService } from '../services/wppconnect.service';

// NUOVI SERVIZI AGGIUNTI
import { whatsAppValidation } from '../services/whatsapp-validation.service';
import { whatsAppErrorHandler, WhatsAppErrorType } from '../services/whatsapp-error-handler.service';
import { whatsAppTemplateService } from '../services/whatsapp-template.service';
import { multiAccountService } from '../services/multi-account-whatsapp.service';
import { sessionManager } from '../services/whatsapp-session-manager';
import { healthMonitor } from '../services/whatsapp-health-monitor';

const prisma = new PrismaClient();
const router = Router();

// 🔒 Protegge tutte le routes di WhatsApp
// Se il modulo 'whatsapp' è disabilitato, blocca l'accesso con 403
router.use(requireModule('whatsapp'));

// ====================================
// API MIGLIORATE CON VALIDAZIONE E ERROR HANDLING
// ====================================

/**
 * POST /api/whatsapp/send - Invia messaggio CON VALIDAZIONE
 */
router.post('/send', authenticate, auditLogger({
  action: AuditAction.CREATE,
  category: LogCategory.INTEGRATION,
  entityType: 'WhatsAppMessage',
  captureBody: true,
  captureResponse: true
}), async (req: any, res: Response) => {
  try {
    const { recipient, message, phoneNumber } = req.body;
    
    // Supporta sia 'recipient' che 'phoneNumber' per retrocompatibilità
    const numero = recipient || phoneNumber;
    
    if (!numero || !message) {
      return res.status(400).json(
        ResponseFormatter.error('Destinatario e messaggio richiesti', 'VALIDATION_ERROR')
      );
    }
    
    // NUOVO: Validazione numero completa
    const validated = await whatsAppValidation.validatePhoneNumber(numero, {
      country: 'IT',
      strict: true
    });
    
    if (!validated.isValid) {
      return res.status(400).json(
        ResponseFormatter.error(
          validated.error || 'Numero non valido',
          'INVALID_PHONE_NUMBER',
          { suggestions: ['Verificare il formato del numero', 'Esempio corretto: 3331234567'] }
        )
      );
    }
    
    // NUOVO: Salva numero validato
    await whatsAppValidation.saveValidatedNumber(validated);
    
    // Invia con numero validato
    const result = await wppConnectService.sendMessage(validated.formatted, message);
    
    logger.info(`✅ Messaggio inviato a ${validated.formatted} (${validated.country})`);
    
    return res.json(ResponseFormatter.success({
      ...result,
      formattedNumber: whatsAppValidation.formatForDisplay(validated.formatted, validated.country)
    }, 'Messaggio inviato con successo'));
    
  } catch (error: any) {
    logger.error('Errore invio messaggio:', error);
    
    // NUOVO: Error handling migliorato
    const whatsAppError = await whatsAppErrorHandler.handleError(error, 'sendMessage');
    const suggestions = whatsAppErrorHandler.getSuggestions(whatsAppError);
    
    // Status code basato sul tipo di errore
    let statusCode = 500;
    if (whatsAppError.type === WhatsAppErrorType.VALIDATION_ERROR) statusCode = 400;
    if (whatsAppError.type === WhatsAppErrorType.CONNECTION_ERROR) statusCode = 503;
    if (whatsAppError.type === WhatsAppErrorType.RATE_LIMIT) statusCode = 429;
    
    return res.status(statusCode).json(
      ResponseFormatter.error(
        whatsAppError.userMessage || whatsAppError.message,
        whatsAppError.type,
        { 
          retry: whatsAppError.retry,
          suggestions,
          details: whatsAppError.details 
        }
      )
    );
  }
});

/**
 * POST /api/whatsapp/send-bulk - Invio multiplo CON VALIDAZIONE
 */
router.post('/send-bulk', authenticate, checkRole(['ADMIN', 'SUPER_ADMIN']), auditLogger({
  action: AuditAction.CREATE,
  category: LogCategory.INTEGRATION,
  entityType: 'WhatsAppBulkMessage',
  captureBody: true
}), async (req: any, res: Response) => {
  try {
    const { recipients, message } = req.body;
    
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json(
        ResponseFormatter.error('Lista destinatari richiesta', 'VALIDATION_ERROR')
      );
    }
    
    if (!message) {
      return res.status(400).json(
        ResponseFormatter.error('Messaggio richiesto', 'VALIDATION_ERROR')
      );
    }
    
    // NUOVO: Validazione batch
    const validationResults = await whatsAppValidation.validateBatch(recipients, {
      country: 'IT',
      checkWhatsApp: false // Per velocità
    });
    
    const validNumbers = validationResults.filter(r => r.isValid);
    const invalidNumbers = validationResults.filter(r => !r.isValid);
    
    if (validNumbers.length === 0) {
      return res.status(400).json(
        ResponseFormatter.error('Nessun numero valido nella lista', 'ALL_INVALID_NUMBERS')
      );
    }
    
    // Invia ai numeri validi
    const results = {
      sent: [] as string[],
      failed: [] as { number: string; error: string }[],
      invalid: invalidNumbers.map(r => ({ number: r.formatted, error: r.error }))
    };
    
    // Invio con delay per evitare rate limiting
    for (const validNumber of validNumbers) {
      try {
        await wppConnectService.sendMessage(validNumber.formatted, message);
        results.sent.push(validNumber.formatted);
        
        // Delay tra invii
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error: any) {
        results.failed.push({
          number: validNumber.formatted,
          error: error.message
        });
      }
    }
    
    return res.json(ResponseFormatter.success(results, 'Invio bulk completato'));
    
  } catch (error: any) {
    logger.error('Errore invio bulk:', error);
    
    const whatsAppError = await whatsAppErrorHandler.handleError(error, 'sendBulk');
    
    return res.status(500).json(
      ResponseFormatter.error(whatsAppError.message, 'BULK_SEND_ERROR')
    );
  }
});

// ====================================
// NUOVE API PER TEMPLATE
// ====================================

/**
 * GET /api/whatsapp/templates - Lista template
 */
router.get('/templates', authenticate, async (req: any, res: Response) => {
  try {
    const { category, isActive, tags } = req.query;
    
    const templates = await whatsAppTemplateService.getAllTemplates({
      category,
      isActive: isActive === 'true',
      tags: tags ? tags.split(',') : undefined
    });
    
    return res.json(ResponseFormatter.success(templates, 'Template recuperati'));
    
  } catch (error: any) {
    logger.error('Errore recupero template:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore recupero template', 'FETCH_TEMPLATES_ERROR')
    );
  }
});

/**
 * POST /api/whatsapp/templates - Crea template
 */
router.post('/templates', authenticate, checkRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res: Response) => {
  try {
    const template = await whatsAppTemplateService.createTemplate(req.body, req.user.id);
    
    return res.status(201).json(
      ResponseFormatter.success(template, 'Template creato con successo')
    );
    
  } catch (error: any) {
    logger.error('Errore creazione template:', error);
    return res.status(500).json(
      ResponseFormatter.error(error.message, 'CREATE_TEMPLATE_ERROR')
    );
  }
});

/**
 * PUT /api/whatsapp/templates/:id - Aggiorna template
 */
router.put('/templates/:id', authenticate, checkRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    
    const updated = await whatsAppTemplateService.updateTemplate(id, req.body, req.user.id);
    
    return res.json(ResponseFormatter.success(updated, 'Template aggiornato'));
    
  } catch (error: any) {
    logger.error('Errore aggiornamento template:', error);
    return res.status(500).json(
      ResponseFormatter.error(error.message, 'UPDATE_TEMPLATE_ERROR')
    );
  }
});

/**
 * POST /api/whatsapp/templates/:id/send - Invia messaggio da template
 */
router.post('/templates/:id/send', authenticate, auditLogger({
  action: AuditAction.CREATE,
  category: LogCategory.INTEGRATION,
  entityType: 'WhatsAppTemplateSend',
  captureBody: true,
  captureResponse: true
}), async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { to, variables } = req.body;
    
    if (!to) {
      return res.status(400).json(
        ResponseFormatter.error('Destinatario richiesto', 'VALIDATION_ERROR')
      );
    }
    
    const result = await whatsAppTemplateService.sendFromTemplate(
      id,
      to,
      variables,
      req.user.id
    );
    
    return res.json(ResponseFormatter.success(result, 'Template inviato con successo'));
    
  } catch (error: any) {
    logger.error('Errore invio template:', error);
    
    const whatsAppError = await whatsAppErrorHandler.handleError(error, 'sendTemplate');
    
    return res.status(500).json(
      ResponseFormatter.error(whatsAppError.message, 'TEMPLATE_SEND_ERROR')
    );
  }
});

/**
 * POST /api/whatsapp/templates/:id/send-bulk - Invio bulk da template
 */
router.post('/templates/:id/send-bulk', authenticate, checkRole(['ADMIN', 'SUPER_ADMIN']), auditLogger({
  action: AuditAction.CREATE,
  category: LogCategory.INTEGRATION,
  entityType: 'WhatsAppTemplateBulkSend',
  captureBody: true
}), async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { recipients, commonVariables, individualVariables } = req.body;
    
    if (!recipients || !Array.isArray(recipients)) {
      return res.status(400).json(
        ResponseFormatter.error('Lista destinatari richiesta', 'VALIDATION_ERROR')
      );
    }
    
    const result = await whatsAppTemplateService.sendBulkFromTemplate(
      id,
      recipients,
      commonVariables,
      individualVariables ? new Map(Object.entries(individualVariables)) : undefined,
      req.user.id
    );
    
    return res.json(ResponseFormatter.success(result, 'Invio bulk template completato'));
    
  } catch (error: any) {
    logger.error('Errore invio bulk template:', error);
    return res.status(500).json(
      ResponseFormatter.error(error.message, 'TEMPLATE_BULK_ERROR')
    );
  }
});

/**
 * DELETE /api/whatsapp/templates/:id - Elimina template
 */
router.delete('/templates/:id', authenticate, checkRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    
    await whatsAppTemplateService.deleteTemplate(id, req.user.id);
    
    return res.json(ResponseFormatter.success(null, 'Template eliminato'));
    
  } catch (error: any) {
    logger.error('Errore eliminazione template:', error);
    return res.status(500).json(
      ResponseFormatter.error(error.message, 'DELETE_TEMPLATE_ERROR')
    );
  }
});

/**
 * POST /api/whatsapp/templates/:id/clone - Clona template
 */
router.post('/templates/:id/clone', authenticate, checkRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { newName } = req.body;
    
    if (!newName) {
      return res.status(400).json(
        ResponseFormatter.error('Nome nuovo template richiesto', 'VALIDATION_ERROR')
      );
    }
    
    const cloned = await whatsAppTemplateService.cloneTemplate(id, newName, req.user.id);
    
    return res.status(201).json(
      ResponseFormatter.success(cloned, 'Template clonato con successo')
    );
    
  } catch (error: any) {
    logger.error('Errore clonazione template:', error);
    return res.status(500).json(
      ResponseFormatter.error(error.message, 'CLONE_TEMPLATE_ERROR')
    );
  }
});

/**
 * GET /api/whatsapp/templates/most-used - Template più usati
 */
router.get('/templates/most-used', authenticate, async (req: any, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const templates = await whatsAppTemplateService.getMostUsedTemplates(limit);
    
    return res.json(ResponseFormatter.success(templates, 'Template più usati'));
    
  } catch (error: any) {
    logger.error('Errore recupero template più usati:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore recupero template', 'FETCH_TEMPLATES_ERROR')
    );
  }
});

// ====================================
// API PER VALIDAZIONE
// ====================================

/**
 * POST /api/whatsapp/validate-number - Valida numero
 */
router.post('/validate-number', authenticate, async (req: any, res: Response) => {
  try {
    const { number, country } = req.body;
    
    if (!number) {
      return res.status(400).json(
        ResponseFormatter.error('Numero richiesto', 'VALIDATION_ERROR')
      );
    }
    
    const validated = await whatsAppValidation.validatePhoneNumber(number, {
      country: country || 'IT',
      checkWhatsApp: true
    });
    
    if (!validated.isValid) {
      return res.status(400).json(
        ResponseFormatter.error(
          validated.error || 'Numero non valido',
          'INVALID_NUMBER',
          { formatted: validated.formatted }
        )
      );
    }
    
    return res.json(ResponseFormatter.success({
      ...validated,
      displayFormat: whatsAppValidation.formatForDisplay(validated.formatted, validated.country)
    }, 'Numero valido'));
    
  } catch (error: any) {
    logger.error('Errore validazione numero:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore validazione', 'VALIDATION_ERROR')
    );
  }
});

/**
 * POST /api/whatsapp/validate-batch - Valida multipli numeri
 */
router.post('/validate-batch', authenticate, async (req: any, res: Response) => {
  try {
    const { numbers, country } = req.body;
    
    if (!numbers || !Array.isArray(numbers)) {
      return res.status(400).json(
        ResponseFormatter.error('Lista numeri richiesta', 'VALIDATION_ERROR')
      );
    }
    
    const results = await whatsAppValidation.validateBatch(numbers, {
      country: country || 'IT',
      checkWhatsApp: false
    });
    
    const summary = {
      total: results.length,
      valid: results.filter(r => r.isValid).length,
      invalid: results.filter(r => !r.isValid).length,
      results
    };
    
    return res.json(ResponseFormatter.success(summary, 'Validazione completata'));
    
  } catch (error: any) {
    logger.error('Errore validazione batch:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore validazione batch', 'BATCH_VALIDATION_ERROR')
    );
  }
});

/**
 * POST /api/whatsapp/extract-numbers - Estrai numeri da testo
 */
router.post('/extract-numbers', authenticate, async (req: any, res: Response) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json(
        ResponseFormatter.error('Testo richiesto', 'VALIDATION_ERROR')
      );
    }
    
    const numbers = whatsAppValidation.extractPhoneNumbersFromText(text);
    
    // Valida i numeri estratti
    const validated = await whatsAppValidation.validateBatch(numbers, {
      country: 'IT'
    });
    
    return res.json(ResponseFormatter.success({
      extracted: numbers,
      validated: validated.filter(v => v.isValid)
    }, 'Numeri estratti'));
    
  } catch (error: any) {
    logger.error('Errore estrazione numeri:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore estrazione numeri', 'EXTRACTION_ERROR')
    );
  }
});

// ====================================
// API STATISTICHE ERRORI
// ====================================

/**
 * GET /api/whatsapp/error-stats - Statistiche errori
 */
router.get('/error-stats', authenticate, checkRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res: Response) => {
  try {
    const stats = whatsAppErrorHandler.getErrorStats();
    
    return res.json(ResponseFormatter.success(stats, 'Statistiche errori'));
    
  } catch (error: any) {
    logger.error('Errore recupero statistiche:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore recupero statistiche', 'STATS_ERROR')
    );
  }
});

/**
 * POST /api/whatsapp/error-stats/reset - Reset contatori errori
 */
router.post('/error-stats/reset', authenticate, checkRole(['SUPER_ADMIN']), async (req: any, res: Response) => {
  try {
    whatsAppErrorHandler.resetErrorCounts();
    
    return res.json(ResponseFormatter.success(null, 'Contatori errori resettati'));
    
  } catch (error: any) {
    logger.error('Errore reset contatori:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore reset contatori', 'RESET_ERROR')
    );
  }
});

// ====================================
// ROUTE ESISTENTI (non modificate)
// ====================================

// VECCHIO ENDPOINT - COMMENTATO PERCHÉ DUPLICATO
/*
/**
 * GET /api/whatsapp/messages - Ottieni tutti i messaggi 
*/
/*
router.get('/messages', authenticate, async (req: any, res: Response) => {
try {
const limit = parseInt(req.query.limit as string) || 50;
const offset = parseInt(req.query.offset as string) || 0;

const messages = await prisma.whatsAppMessage.findMany({
take: limit,
skip: offset,
orderBy: { timestamp: 'desc' },
  include: {
    user: true
  }
  });

return res.json(ResponseFormatter.success(messages, 'Messaggi recuperati'));
} catch (error: any) {
logger.error('Errore recupero messaggi:', error);
  return res.status(500).json(
      ResponseFormatter.error('Errore recupero messaggi', 'FETCH_MESSAGES_ERROR')
    );
  }
});
*/

/**
 * GET /api/whatsapp/messages/:phoneNumber - Ottieni messaggi di un numero
 */
router.get('/messages/:phoneNumber', authenticate, async (req: any, res: Response) => {
  try {
    const { phoneNumber } = req.params;
    
    const messages = await prisma.whatsAppMessage.findMany({
      where: { phoneNumber },
      orderBy: { timestamp: 'asc' },
      include: {
        user: true
      }
    });
    
    return res.json(ResponseFormatter.success(messages, 'Messaggi recuperati'));
  } catch (error: any) {
    logger.error('Errore recupero messaggi:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore recupero messaggi', 'FETCH_MESSAGES_ERROR')
    );
  }
});

/**
 * POST /api/whatsapp/messages/:id/read - Segna messaggio come letto
 */
router.post('/messages/:id/read', authenticate, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    
    // Il modello WhatsAppMessage non ha readAt e readBy, solo status
    await prisma.whatsAppMessage.update({
      where: { id },
      data: { 
        status: 'READ'
      }
    });
    
    return res.json(ResponseFormatter.success(null, 'Messaggio segnato come letto'));
  } catch (error: any) {
    logger.error('Errore marcatura messaggio:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore marcatura messaggio', 'MARK_READ_ERROR')
    );
  }
});

/**
 * PUT /api/whatsapp/messages/:id/read - Segna messaggio come letto (retrocompatibilità)
 */
router.put('/messages/:id/read', authenticate, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    
    // Il modello WhatsAppMessage non ha readAt e readBy, solo status
    await prisma.whatsAppMessage.update({
      where: { id },
      data: { 
        status: 'READ'
      }
    });
    
    return res.json(ResponseFormatter.success(null, 'Messaggio segnato come letto'));
  } catch (error: any) {
    logger.error('Errore marcatura messaggio:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore marcatura messaggio', 'MARK_READ_ERROR')
    );
  }
});

/**
 * GET /api/whatsapp/status - Stato connessione
 */
router.get('/status', authenticate, async (req: any, res: Response) => {
  try {
    const status = await wppConnectService.getConnectionStatus();
    const qrCode = await wppConnectService.getQRCodeAsImage();
    const instanceName = wppConnectService.getSessionName();
    
    return res.json(ResponseFormatter.success({
      connected: status.connected,
      status: status.connected ? 'connected' : 'disconnected',
      provider: 'wppconnect',
      qrCode: status.qrCode || qrCode,
      message: status.connected ? 'WhatsApp connesso' : 'WhatsApp non connesso',
      instanceName: instanceName
    }, 'Stato WhatsApp recuperato'));
  } catch (error: any) {
    logger.error('Errore recupero stato:', error);
    
    const whatsAppError = await whatsAppErrorHandler.handleError(error, 'getStatus');
    
    return res.status(500).json(
      ResponseFormatter.error(whatsAppError.message, 'STATUS_ERROR')
    );
  }
});

/**
 * POST /api/whatsapp/initialize - Inizializza connessione
 */
router.post('/initialize', authenticate, checkRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res: Response) => {
  try {
    const success = await wppConnectService.initialize();
    
    // Attendi un momento per la generazione del QR
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const status = await wppConnectService.getConnectionStatus();
    const qrCode = await wppConnectService.getQRCodeAsImage();
    
    return res.json(ResponseFormatter.success({
      success,
      connected: status.connected,
      qrCode: status.qrCode || qrCode
    }, 'WhatsApp inizializzato'));
  } catch (error: any) {
    logger.error('Errore inizializzazione:', error);
    
    const whatsAppError = await whatsAppErrorHandler.handleError(error, 'initialize');
    
    return res.status(500).json(
      ResponseFormatter.error(whatsAppError.message, 'INIT_ERROR')
    );
  }
});

/**
 * GET /api/whatsapp/qrcode - Ottieni QR Code
 */
router.get('/qrcode', authenticate, async (req: any, res: Response) => {
  try {
    const status = await wppConnectService.getConnectionStatus();
    
    if (status.connected) {
      return res.json(ResponseFormatter.success(
        { connected: true, message: 'WhatsApp già connesso' },
        'WhatsApp già connesso'
      ));
    }
    
    let qrCode = status.qrCode || await wppConnectService.getQRCodeAsImage();
    
    if (!qrCode) {
      // Prova a rigenerare
      await wppConnectService.initialize();
      await new Promise(resolve => setTimeout(resolve, 3000));
      qrCode = await wppConnectService.getQRCodeAsImage();
    }
    
    if (qrCode) {
      return res.json(ResponseFormatter.success(
        { qrCode },
        'QR Code disponibile'
      ));
    }
    
    return res.status(400).json(
      ResponseFormatter.error('QR Code non disponibile. Riprova tra qualche secondo.', 'QR_NOT_READY')
    );
  } catch (error: any) {
    logger.error('Errore generazione QR:', error);
    
    const whatsAppError = await whatsAppErrorHandler.handleError(error, 'getQRCode');
    
    if (whatsAppError.type === WhatsAppErrorType.CONNECTION_ERROR && error.message?.includes('già connesso')) {
      return res.json(ResponseFormatter.success(
        { connected: true, message: 'WhatsApp già connesso' },
        'WhatsApp già connesso'
      ));
    }
    
    return res.status(500).json(
      ResponseFormatter.error(whatsAppError.message, 'QR_ERROR')
    );
  }
});

/**
 * POST /api/whatsapp/disconnect - Disconnetti WhatsApp
 */
router.post('/disconnect', authenticate, checkRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res: Response) => {
  try {
    await wppConnectService.disconnect();
    
    return res.json(ResponseFormatter.success(null, 'WhatsApp disconnesso'));
  } catch (error: any) {
    logger.error('Errore disconnessione:', error);
    
    const whatsAppError = await whatsAppErrorHandler.handleError(error, 'disconnect');
    
    return res.status(500).json(
      ResponseFormatter.error(whatsAppError.message, 'DISCONNECT_ERROR')
    );
  }
});

/**
 * POST /api/whatsapp/reconnect - Riconnetti WhatsApp
 */
router.post('/reconnect', authenticate, checkRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res: Response) => {
  try {
    // Disconnetti prima
    await wppConnectService.disconnect();
    
    // Attendi
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Reinizializza
    const success = await wppConnectService.initialize();
    
    // Attendi per QR
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const status = await wppConnectService.getConnectionStatus();
    const qrCode = await wppConnectService.getQRCodeAsImage();
    
    return res.json(ResponseFormatter.success({
      success,
      connected: status.connected,
      qrCode: status.qrCode || qrCode
    }, 'WhatsApp riconnesso'));
  } catch (error: any) {
    logger.error('Errore riconnessione:', error);
    
    const whatsAppError = await whatsAppErrorHandler.handleError(error, 'reconnect');
    
    return res.status(500).json(
      ResponseFormatter.error(whatsAppError.message, 'RECONNECT_ERROR')
    );
  }
});

/**
 * GET /api/whatsapp/contacts - Ottieni contatti WhatsApp
 */
router.get('/contacts', authenticate, async (req: any, res: Response) => {
  try {
    const { isUser, isBusiness, isFavorite } = req.query;
    
    const where: any = {};
    
    if (isUser === 'true') where.isUser = true;
    if (isBusiness === 'true') where.isBusiness = true;
    if (isFavorite === 'true') where.isFavorite = true;
    
    const contacts = await prisma.whatsAppContact.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        User_WhatsAppContact_userIdToUser: {
          select: { id: true, fullName: true, email: true, role: true }
        },
        User_WhatsAppContact_professionalIdToUser: {
          select: { id: true, fullName: true, email: true, role: true }
        },
        WhatsAppGroup: true
        // Rimosso 'messages' che non esiste nella relazione
      } as any
    });
    
    // Normalizza: esponi `user` camelCase e `group` derivati dalle relazioni Prisma
    const contactsNormalized = contacts.map((c: any) => ({
      ...c,
      user: c.User_WhatsAppContact_userIdToUser
        ?? c.User_WhatsAppContact_professionalIdToUser
        ?? null,
      group: c.WhatsAppGroup ?? null,
      // rimuovi chiavi PascalCase se presenti
      User_WhatsAppContact_userIdToUser: undefined,
      User_WhatsAppContact_professionalIdToUser: undefined
    }));

    return res.json(ResponseFormatter.success(contactsNormalized, 'Contatti recuperati'));
  } catch (error: any) {
    logger.error('Errore recupero contatti:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore recupero contatti', 'FETCH_CONTACTS_ERROR')
    );
  }
});

/**
 * GET /api/whatsapp/stats - Statistiche WhatsApp
 */
router.get('/stats', authenticate, async (req: any, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [totalMessages, todayMessages, sentMessages, receivedMessages, totalContacts] = await Promise.all([
      prisma.whatsAppMessage.count(),
      prisma.whatsAppMessage.count({
        where: { createdAt: { gte: today } }
      }),
      prisma.whatsAppMessage.count({
        where: { direction: 'outgoing' }
      }),
      prisma.whatsAppMessage.count({
        where: { direction: 'incoming' }
      }),
      prisma.whatsAppContact.count()
    ]);
    
    // Controlla quando si è connesso l'ultima volta
    const lastConnection = await prisma.systemSetting.findFirst({
      where: { key: 'wpp_connected_at' }
    });
    
    // Ottieni stato connessione
    const status = await wppConnectService.getConnectionStatus();
    
    // Ottieni statistiche errori
    const errorStats = whatsAppErrorHandler.getErrorStats();
    
    return res.json(ResponseFormatter.success({
      messages: {
        total: totalMessages,
        today: todayMessages,
        sent: sentMessages,
        received: receivedMessages
      },
      contacts: {
        total: totalContacts
      },
      connection: {
        isConnected: status.connected,
        connectedSince: lastConnection ? new Date(lastConnection.value) : null,
        provider: 'wppconnect'
      },
      errors: errorStats,
      lastSync: new Date()
    }, 'Statistiche WhatsApp'));
  } catch (error: any) {
    logger.error('Errore recupero statistiche:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore recupero statistiche', 'STATS_ERROR')
    );
  }
});

/**
 * GET /api/whatsapp/system-info - Ottieni informazioni sistema WhatsApp
 */
router.get('/system-info', authenticate, async (req: any, res: Response) => {
  try {
    const systemInfo = await wppConnectService.getSystemInfo();
    return res.json(ResponseFormatter.success(systemInfo, 'Informazioni sistema'));
  } catch (error: any) {
    logger.error('Errore recupero system info:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore recupero informazioni sistema', 'SYSTEM_INFO_ERROR')
    );
  }
});

/**
 * GET /api/whatsapp/detailed-stats - Ottieni statistiche dettagliate
 */
router.get('/detailed-stats', authenticate, async (req: any, res: Response) => {
  try {
    const stats = await wppConnectService.getDetailedStats();
    return res.json(ResponseFormatter.success(stats, 'Statistiche dettagliate'));
  } catch (error: any) {
    logger.error('Errore recupero statistiche dettagliate:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore recupero statistiche', 'DETAILED_STATS_ERROR')
    );
  }
});

/**
 * GET /api/whatsapp/messages - Recupera messaggi WhatsApp
 */
router.get('/messages', authenticate, async (req: any, res: Response) => {
  try {
    const { page = 1, limit = 20, phoneNumber, direction, status } = req.query;
    
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);
    
    // Costruisci filtri
    const where: any = {};
    if (phoneNumber) where.phoneNumber = { contains: phoneNumber as string };
    if (direction) where.direction = direction;
    if (status) where.status = status;
    
    // Query database
    const [messages, total] = await Promise.all([
      prisma.whatsAppMessage.findMany({
        where,
        skip,
        take,
        orderBy: { timestamp: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          },
          request: {
            select: {
              id: true,
              title: true,
              status: true
            }
          }
        }
      }),
      prisma.whatsAppMessage.count({ where })
    ]);
    
    return res.json(ResponseFormatter.success({
      data: messages,
      pagination: {
        page: parseInt(page as string),
        limit: take,
        total,
        pages: Math.ceil(total / take)
      }
    }, 'Messaggi recuperati'));
  } catch (error: any) {
    logger.error('Errore recupero messaggi:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore recupero messaggi', 'MESSAGES_ERROR')
    );
  }
});

/**
 * GET /api/whatsapp/info - Informazioni sistema WhatsApp (alias per retrocompatibilità)
 */
router.get('/info', authenticate, async (req: any, res: Response) => {
  try {
    const info = await wppConnectService.getSystemInfo();
    return res.json(ResponseFormatter.success(info, 'Info WhatsApp'));
  } catch (error: any) {
    logger.error('Errore recupero info:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore recupero info', 'INFO_ERROR')
    );
  }
});

// Importa prisma per le query dirette

/**
 * POST /api/whatsapp/session/backup - Crea backup manuale della sessione
 */
router.post('/session/backup', authenticate, async (req: any, res: Response) => {
  try {
    await sessionManager.backupSession();
    return res.json(ResponseFormatter.success(null, 'Backup sessione creato'));
  } catch (error: any) {
    logger.error('Errore backup sessione:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore backup sessione', 'BACKUP_ERROR')
    );
  }
});

/**
 * POST /api/whatsapp/session/restore - Ripristina sessione salvata
 */
router.post('/session/restore', authenticate, async (req: any, res: Response) => {
  try {
    // Prima disconnetti se connesso
    await wppConnectService.disconnect();
    
    // Aspetta un po'
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Reinizializza con sessione salvata
    await wppConnectService.initialize();
    
    return res.json(ResponseFormatter.success(null, 'Sessione ripristinata'));
  } catch (error: any) {
    logger.error('Errore ripristino sessione:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore ripristino sessione', 'RESTORE_ERROR')
    );
  }
});

/**
 * POST /api/whatsapp/session/autosave - Attiva/disattiva auto-save
 */
router.post('/session/autosave', authenticate, async (req: any, res: Response) => {
  try {
    const { enabled } = req.body;
    
    if (enabled) {
      healthMonitor.start(30000); // Start health monitoring
      return res.json(ResponseFormatter.success(null, 'Auto-save attivato'));
    } else {
      healthMonitor.stop(); // Stop health monitoring
      return res.json(ResponseFormatter.success(null, 'Auto-save disattivato'));
    }
  } catch (error: any) {
    logger.error('Errore cambio auto-save:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore cambio auto-save', 'AUTOSAVE_ERROR')
    );
  }
});

/**
 * DELETE /api/whatsapp/session - Elimina sessione salvata
 */
router.delete('/session', authenticate, async (req: any, res: Response) => {
  try {
    await sessionManager.deleteSession();
    return res.json(ResponseFormatter.success(null, 'Sessione eliminata'));
  } catch (error: any) {
    logger.error('Errore eliminazione sessione:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore eliminazione sessione', 'DELETE_ERROR')
    );
  }
});

/**
 * GET /api/whatsapp/multi-account/status - Stato di tutti gli account WhatsApp
 */
router.get('/multi-account/status', authenticate, checkRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res: Response) => {
  try {
    const data = await multiAccountService.getAllAccountsStatus();
    return res.json(ResponseFormatter.success(data, 'Stato multi-account'));
  } catch (error: any) {
    logger.error('Errore stato multi-account:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore stato multi-account', 'MULTI_ACCOUNT_STATUS_ERROR')
    );
  }
});

/**
 * POST /api/whatsapp/multi-account/add - Aggiungi nuovo account WhatsApp
 */
router.post('/multi-account/add', authenticate, checkRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res: Response) => {
  try {
    const { sessionName, phoneNumber, description, department } = req.body;

    if (!sessionName || !phoneNumber) {
      return res.status(400).json(
        ResponseFormatter.error('sessionName e phoneNumber sono richiesti', 'VALIDATION_ERROR')
      );
    }

    const status = await multiAccountService.addAccount({ sessionName, phoneNumber, description, department });
    return res.json(ResponseFormatter.success(status, 'Account aggiunto'));
  } catch (error: any) {
    logger.error('Errore aggiunta account multi-account:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore aggiunta account', 'MULTI_ACCOUNT_ADD_ERROR')
    );
  }
});

export default router;
