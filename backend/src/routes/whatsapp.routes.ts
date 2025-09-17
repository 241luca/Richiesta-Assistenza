/**
 * WhatsApp Routes
 * Gestisce le API per l'integrazione WhatsApp
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { Role } from '@prisma/client';
import { ResponseFormatter } from '../utils/responseFormatter';
import * as whatsappService from '../services/whatsapp.service';
import logger from '../utils/logger';
import prisma from '../config/database';

const router = Router();

/**
 * GET /api/whatsapp/status
 * Verifica lo stato della connessione WhatsApp
 */
router.get('/status', authenticate, async (req, res) => {
  try {
    const status = await whatsappService.getConnectionStatus();
    return res.json(ResponseFormatter.success(status, 'Stato WhatsApp recuperato'));
  } catch (error: any) {
    logger.error('Errore recupero stato WhatsApp:', error);
    return res.status(500).json(
      ResponseFormatter.error(error.message || 'Errore recupero stato', 'WHATSAPP_STATUS_ERROR')
    );
  }
});

/**
 * POST /api/whatsapp/create-instance
 * Crea una nuova istanza WhatsApp
 */
router.post('/create-instance', authenticate, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), async (req, res) => {
  try {
    const result = await whatsappService.createInstance();
    return res.json(ResponseFormatter.success(result, 'Istanza WhatsApp creata con successo'));
  } catch (error: any) {
    logger.error('Errore creazione istanza:', error);
    return res.status(500).json(
      ResponseFormatter.error(error.message || 'Errore creazione istanza', 'CREATE_INSTANCE_ERROR')
    );
  }
});

/**
 * GET /api/whatsapp/qr-code
 * Genera il QR Code per il login
 */
router.get('/qr-code', authenticate, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), async (req, res) => {
  try {
    const qrCodeData = await whatsappService.getQRCode();
    
    // L'API di SendApp restituisce il QR in formato base64 o come URL
    // Verifica cosa abbiamo ricevuto e formatta correttamente
    let base64 = '';
    
    if (typeof qrCodeData === 'string') {
      // Se è una stringa, assumiamo sia già base64
      base64 = qrCodeData;
    } else if (qrCodeData?.qrcode) {
      // Se c'è un campo qrcode nell'oggetto
      base64 = qrCodeData.qrcode;
    } else if (qrCodeData?.base64) {
      // Se c'è un campo base64 nell'oggetto
      base64 = qrCodeData.base64;
    } else if (qrCodeData?.message?.includes('base64')) {
      // Se il QR è nel messaggio
      base64 = qrCodeData.message;
    }
    
    return res.json(ResponseFormatter.success({ base64 }, 'QR Code generato'));
  } catch (error: any) {
    logger.error('Errore generazione QR Code:', error);
    return res.status(500).json(
      ResponseFormatter.error(error.message || 'Errore generazione QR Code', 'QR_CODE_ERROR')
    );
  }
});

/**
 * POST /api/whatsapp/disconnect
 * Disconnette WhatsApp
 */
router.post('/disconnect', authenticate, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), async (req, res) => {
  try {
    const result = await whatsappService.disconnect();
    return res.json(ResponseFormatter.success(result, 'WhatsApp disconnesso'));
  } catch (error: any) {
    logger.error('Errore disconnessione WhatsApp:', error);
    return res.status(500).json(
      ResponseFormatter.error(error.message || 'Errore disconnessione', 'DISCONNECT_ERROR')
    );
  }
});

/**
 * POST /api/whatsapp/set-status
 * Imposta manualmente lo stato della connessione
 */
router.post('/set-status', authenticate, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), async (req, res) => {
  try {
    const { connected } = req.body;
    const result = await whatsappService.setConnectionStatus(connected === true);
    return res.json(ResponseFormatter.success(result, 'Stato aggiornato'));
  } catch (error: any) {
    logger.error('Errore impostazione stato:', error);
    return res.status(500).json(
      ResponseFormatter.error(error.message || 'Errore impostazione stato', 'SET_STATUS_ERROR')
    );
  }
});

/**
 * POST /api/whatsapp/set-webhook
 * Configura il webhook per ricevere messaggi
 */
router.post('/set-webhook', authenticate, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), async (req, res) => {
  try {
    const { webhookUrl } = req.body;
    const result = await whatsappService.setWebhook(webhookUrl);
    return res.json(ResponseFormatter.success(result, 'Webhook configurato'));
  } catch (error: any) {
    logger.error('Errore configurazione webhook:', error);
    return res.status(500).json(
      ResponseFormatter.error(error.message || 'Errore configurazione webhook', 'WEBHOOK_ERROR')
    );
  }
});

/**
 * POST /api/whatsapp/send
 * Invia un messaggio WhatsApp
 */
router.post('/send', authenticate, async (req: any, res) => {
  try {
    const { phoneNumber, message, mediaUrl, filename } = req.body;
    
    if (!phoneNumber || !message) {
      return res.status(400).json(
        ResponseFormatter.error('Numero di telefono e messaggio sono obbligatori', 'MISSING_FIELDS')
      );
    }
    
    let result;
    if (mediaUrl) {
      result = await whatsappService.sendMediaMessage(phoneNumber, message, mediaUrl, filename);
    } else {
      result = await whatsappService.sendTextMessage(phoneNumber, message);
    }
    
    // Salva il messaggio inviato nel database
    try {
      await prisma.whatsAppMessage.create({
        data: {
          phoneNumber,
          message,
          direction: 'outgoing',
          status: 'sent',
          mediaUrl: mediaUrl || null,
          mediaType: mediaUrl ? 'media' : null,
          userId: req.user.id || null,
          timestamp: new Date(),
          metadata: {
            sentBy: req.user.id,
            sentByName: `${req.user.firstName} ${req.user.lastName}`,
            sentByEmail: req.user.email,
            filename: filename || null
          }
        }
      });
      logger.info(`Messaggio salvato nel database per ${phoneNumber}`);
    } catch (dbError) {
      logger.error('Errore salvataggio messaggio nel database:', dbError);
      // Non bloccare l'invio se il salvataggio fallisce
    }
    
    // Log audit
    logger.info(`Messaggio WhatsApp inviato da ${req.user.email} a ${phoneNumber}`);
    
    return res.json(ResponseFormatter.success(result, 'Messaggio inviato con successo'));
  } catch (error: any) {
    logger.error('Errore invio messaggio:', error);
    return res.status(500).json(
      ResponseFormatter.error(error.message || 'Errore invio messaggio', 'SEND_MESSAGE_ERROR')
    );
  }
});

/**
 * POST /api/whatsapp/send-group
 * Invia un messaggio a un gruppo WhatsApp
 */
router.post('/send-group', authenticate, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), async (req: any, res) => {
  try {
    const { groupId, message, mediaUrl } = req.body;
    
    if (!groupId || !message) {
      return res.status(400).json(
        ResponseFormatter.error('ID gruppo e messaggio sono obbligatori', 'MISSING_FIELDS')
      );
    }
    
    const result = await whatsappService.sendGroupMessage(groupId, message, mediaUrl);
    
    logger.info(`Messaggio gruppo WhatsApp inviato da ${req.user.email} a ${groupId}`);
    
    return res.json(ResponseFormatter.success(result, 'Messaggio gruppo inviato'));
  } catch (error: any) {
    logger.error('Errore invio messaggio gruppo:', error);
    return res.status(500).json(
      ResponseFormatter.error(error.message || 'Errore invio messaggio gruppo', 'SEND_GROUP_ERROR')
    );
  }
});

/**
 * POST /api/whatsapp/broadcast
 * Invia un messaggio broadcast a più numeri
 */
router.post('/broadcast', authenticate, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), async (req: any, res) => {
  try {
    const { phoneNumbers, message, mediaUrl } = req.body;
    
    if (!phoneNumbers || !message) {
      return res.status(400).json(
        ResponseFormatter.error('Numeri e messaggio sono obbligatori', 'MISSING_FIELDS')
      );
    }
    
    const numbers = Array.isArray(phoneNumbers) ? phoneNumbers : phoneNumbers.split(',').map((n: string) => n.trim());
    const results = [];
    const errors = [];
    
    for (const number of numbers) {
      try {
        const result = mediaUrl 
          ? await whatsappService.sendMediaMessage(number, message, mediaUrl)
          : await whatsappService.sendTextMessage(number, message);
        results.push({ number, success: true, result });
      } catch (error: any) {
        errors.push({ number, success: false, error: error.message });
      }
    }
    
    logger.info(`Broadcast WhatsApp inviato da ${req.user.email} a ${numbers.length} numeri`);
    
    return res.json(ResponseFormatter.success(
      { sent: results, failed: errors },
      `Broadcast inviato: ${results.length} successi, ${errors.length} errori`
    ));
  } catch (error: any) {
    logger.error('Errore broadcast:', error);
    return res.status(500).json(
      ResponseFormatter.error(error.message || 'Errore broadcast', 'BROADCAST_ERROR')
    );
  }
});

/**
 * POST /api/whatsapp/reboot
 * Riavvia l'istanza WhatsApp
 */
router.post('/reboot', authenticate, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), async (req, res) => {
  try {
    const result = await whatsappService.rebootInstance();
    return res.json(ResponseFormatter.success(result, 'Istanza riavviata'));
  } catch (error: any) {
    logger.error('Errore riavvio istanza:', error);
    return res.status(500).json(
      ResponseFormatter.error(error.message || 'Errore riavvio', 'REBOOT_ERROR')
    );
  }
});

/**
 * POST /api/whatsapp/reset
 * Reset completo dell'istanza WhatsApp
 */
router.post('/reset', authenticate, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), async (req, res) => {
  try {
    const result = await whatsappService.resetInstance();
    return res.json(ResponseFormatter.success(result, 'Istanza resettata'));
  } catch (error: any) {
    logger.error('Errore reset istanza:', error);
    return res.status(500).json(
      ResponseFormatter.error(error.message || 'Errore reset', 'RESET_ERROR')
    );
  }
});

/**
 * POST /api/whatsapp/reconnect
 * Riconnetti l'istanza WhatsApp
 */
router.post('/reconnect', authenticate, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), async (req, res) => {
  try {
    const result = await whatsappService.reconnect();
    return res.json(ResponseFormatter.success(result, 'Istanza riconnessa'));
  } catch (error: any) {
    logger.error('Errore riconnessione:', error);
    return res.status(500).json(
      ResponseFormatter.error(error.message || 'Errore riconnessione', 'RECONNECT_ERROR')
    );
  }
});

/**
 * POST /api/whatsapp/webhook
 * Webhook per ricevere messaggi da SendApp
 */
router.post('/webhook', async (req, res) => {
  try {
    logger.info('Webhook WhatsApp ricevuto:', JSON.stringify(req.body, null, 2));
    
    // Processa il webhook in background
    whatsappService.processIncomingMessage(req.body).catch(error => {
      logger.error('Errore processamento webhook:', error);
    });
    
    // Rispondi immediatamente a SendApp
    return res.status(200).json({ success: true });
  } catch (error: any) {
    logger.error('Errore webhook:', error);
    return res.status(200).json({ success: false }); // Sempre 200 per evitare retry
  }
});

/**
 * GET /api/whatsapp/export/:phoneNumber
 * Esporta la chat in formato testo
 */
router.get('/export/:phoneNumber', authenticate, async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    
    const messages = await prisma.whatsAppMessage.findMany({
      where: { phoneNumber },
      orderBy: { createdAt: 'asc' }
    });
    
    // Genera il file di testo
    let content = `Chat WhatsApp con ${phoneNumber}\n`;
    content += `Esportata il: ${new Date().toLocaleString('it-IT')}\n`;
    content += `Totale messaggi: ${messages.length}\n`;
    content += '='.repeat(50) + '\n\n';
    
    messages.forEach(msg => {
      const date = new Date(msg.createdAt).toLocaleString('it-IT');
      const direction = msg.direction === 'inbound' ? '📥 Ricevuto' : '📤 Inviato';
      content += `[${date}] ${direction}\n`;
      content += `${msg.message}\n`;
      if (msg.mediaUrl) {
        content += `Media: ${msg.mediaUrl}\n`;
      }
      content += '\n';
    });
    
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="chat_${phoneNumber}.txt"`);
    return res.send(content);
  } catch (error: any) {
    logger.error('Errore export chat:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore export', 'EXPORT_ERROR')
    );
  }
});

/**
 * POST /api/whatsapp/send-media
 * Invia un messaggio con media
 */
router.post('/send-media', authenticate, async (req: any, res) => {
  try {
    const { phoneNumber, message, mediaUrl, mediaType } = req.body;
    
    if (!phoneNumber || !mediaUrl) {
      return res.status(400).json(
        ResponseFormatter.error('Numero e media URL obbligatori', 'MISSING_FIELDS')
      );
    }
    
    const result = await whatsappService.sendMediaMessage(
      phoneNumber,
      message || '',
      mediaUrl
    );
    
    // Salva nel database
    await prisma.whatsAppMessage.create({
      data: {
        phoneNumber,
        message: message || `📎 Media ${mediaType || 'file'}`,
        type: mediaType || 'document',
        status: 'sent',
        direction: 'outbound',
        mediaUrl,
        timestamp: new Date(),
        metadata: {
          sentBy: req.user.id,
          sentByName: req.user.fullName
        }
      }
    });
    
    logger.info(`Media inviato da ${req.user.email} a ${phoneNumber}`);
    
    return res.json(ResponseFormatter.success(result, 'Media inviato'));
  } catch (error: any) {
    logger.error('Errore invio media:', error);
    return res.status(500).json(
      ResponseFormatter.error(error.message || 'Errore invio media', 'SEND_MEDIA_ERROR')
    );
  }
});

/**
 * GET /api/whatsapp/templates
 * Recupera i template di risposta
 */
router.get('/templates', authenticate, async (req, res) => {
  try {
    // Per ora restituiamo template statici, in futuro dal database
    const templates = [
      { id: 1, name: 'Saluto', text: 'Ciao! Come posso aiutarti?' },
      { id: 2, name: 'Attesa', text: 'Un momento, verifico e ti rispondo subito.' },
      { id: 3, name: 'Grazie', text: 'Grazie per averci contattato! A presto!' },
      { id: 4, name: 'Orari', text: 'I nostri orari sono:\n• Lun-Ven: 9:00-18:00\n• Sab: 9:00-13:00' },
      { id: 5, name: 'Contatti', text: 'Per assistenza urgente chiama il numero principale.' },
      { id: 6, name: 'Indirizzo', text: 'Ci trovi in Via Roma 1, 00100 Roma' },
      { id: 7, name: 'Preventivo', text: 'Per un preventivo gratuito, inviaci i dettagli della tua richiesta.' },
      { id: 8, name: 'Conferma', text: 'Confermo la ricezione del tuo messaggio. Ti risponderò al più presto.' }
    ];
    
    return res.json(ResponseFormatter.success(templates, 'Template recuperati'));
  } catch (error: any) {
    logger.error('Errore recupero template:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore recupero template', 'TEMPLATES_ERROR')
    );
  }
});

/**
 * DELETE /api/whatsapp/messages/:id
 * Elimina un messaggio (soft delete)
 */
router.delete('/messages/:id', authenticate, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Soft delete - aggiorna solo lo status
    await prisma.whatsAppMessage.update({
      where: { id },
      data: {
        status: 'deleted',
        metadata: {
          deletedBy: req.user.id,
          deletedAt: new Date().toISOString()
        }
      }
    });
    
    return res.json(ResponseFormatter.success(null, 'Messaggio eliminato'));
  } catch (error: any) {
    logger.error('Errore eliminazione messaggio:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore eliminazione', 'DELETE_ERROR')
    );
  }
});

/**
 * GET /api/whatsapp/settings
 * Recupera tutte le impostazioni WhatsApp
 */
router.get('/settings', authenticate, async (req, res) => {
  try {
    // Recupera tutte le impostazioni WhatsApp dal database
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          startsWith: 'whatsapp_'
        }
      }
    });
    
    // Converti in oggetto strutturato
    const settingsObj: any = {
      autoReplyEnabled: false,
      autoReplyMessage: '',
      autoReplyDelay: 0,
      pollingEnabled: false,
      pollingInterval: 30,
      notifyAdminsNewNumber: true,
      notifyAdminsNewMessage: true
    };
    
    settings.forEach(setting => {
      switch(setting.key) {
        case 'whatsapp_auto_reply_enabled':
          settingsObj.autoReplyEnabled = setting.value === 'true';
          break;
        case 'whatsapp_auto_reply_message':
          settingsObj.autoReplyMessage = setting.value;
          break;
        case 'whatsapp_auto_reply_delay':
          settingsObj.autoReplyDelay = parseInt(setting.value) || 0;
          break;
        case 'whatsapp_polling_enabled':
          settingsObj.pollingEnabled = setting.value === 'true';
          break;
        case 'whatsapp_polling_interval':
          settingsObj.pollingInterval = parseInt(setting.value) || 30;
          break;
        case 'whatsapp_notify_admins_new_number':
          settingsObj.notifyAdminsNewNumber = setting.value === 'true';
          break;
        case 'whatsapp_notify_admins_new_message':
          settingsObj.notifyAdminsNewMessage = setting.value === 'true';
          break;
        case 'whatsapp_business_hours':
          try {
            settingsObj.businessHours = JSON.parse(setting.value);
          } catch (e) {
            // Ignora errori di parsing
          }
          break;
      }
    });
    
    return res.json(ResponseFormatter.success(settingsObj, 'Impostazioni recuperate'));
  } catch (error: any) {
    logger.error('Errore recupero impostazioni WhatsApp:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore recupero impostazioni', 'SETTINGS_ERROR')
    );
  }
});

/**
 * POST /api/whatsapp/settings
 * Salva o aggiorna una impostazione di sistema WhatsApp
 */
router.post('/settings', authenticate, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), async (req: any, res) => {
  try {
    const { key, value } = req.body;
    
    if (!key || value === undefined) {
      return res.status(400).json(
        ResponseFormatter.error('Key e value sono obbligatori', 'MISSING_FIELDS')
      );
    }
    
    // Upsert: aggiorna se esiste, altrimenti crea
    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: {
        value,
        updatedAt: new Date()
      },
      create: {
        key,
        value,
        category: 'WHATSAPP',
        description: `Impostazione WhatsApp: ${key}`
      }
    });
    
    logger.info(`Impostazione ${key} aggiornata da ${req.user.email}`);
    
    return res.json(ResponseFormatter.success(setting, 'Impostazione salvata'));
  } catch (error: any) {
    logger.error('Errore salvataggio impostazione:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore salvataggio', 'SAVE_ERROR')
    );
  }
});

/**
 * GET /api/whatsapp/messages
 * Recupera lo storico messaggi
 */
router.get('/messages', authenticate, async (req, res) => {
  try {
    const { phoneNumber, limit = 50, offset = 0 } = req.query;
    
    const where: any = {};
    if (phoneNumber) {
      where.phoneNumber = phoneNumber as string;
    }
    
    const messages = await prisma.whatsAppMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset)
    });
    
    const total = await prisma.whatsAppMessage.count({ where });
    
    return res.json(ResponseFormatter.success(
      { messages, total },
      'Messaggi recuperati'
    ));
  } catch (error: any) {
    logger.error('Errore recupero messaggi:', error);
    return res.status(500).json(
      ResponseFormatter.error(error.message || 'Errore recupero messaggi', 'GET_MESSAGES_ERROR')
    );
  }
});

/**
 * GET /api/whatsapp/stats
 * Statistiche WhatsApp
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const stats = await prisma.whatsAppMessage.groupBy({
      by: ['direction', 'status'],
      _count: true
    });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayMessages = await prisma.whatsAppMessage.count({
      where: {
        createdAt: { gte: today }
      }
    });
    
    const totalMessages = await prisma.whatsAppMessage.count();
    
    return res.json(ResponseFormatter.success({
      stats,
      todayMessages,
      totalMessages
    }, 'Statistiche WhatsApp'));
  } catch (error: any) {
    logger.error('Errore recupero statistiche:', error);
    return res.status(500).json(
      ResponseFormatter.error(error.message || 'Errore statistiche', 'STATS_ERROR')
    );
  }
});

// Import necessario per Prisma
import { prisma } from '../config/database';

export default router;
