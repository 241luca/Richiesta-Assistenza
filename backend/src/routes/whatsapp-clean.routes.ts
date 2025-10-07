/**
 * WhatsApp Routes - Versione Pulita SOLO WPPConnect
 * Nessun riferimento a Evolution o SendApp
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { checkRole } from '../../middleware/checkRole';
import { ResponseFormatter } from '../../utils/responseFormatter';
import whatsappService from '../../services/whatsapp-unified.service';
import logger from '../../utils/logger';

const router = Router();

/**
 * GET /api/whatsapp/status
 * Ottieni stato connessione WhatsApp
 */
router.get('/status', authenticate, async (req: any, res) => {
  try {
    const status = await whatsappService.getStatus();
    
    return res.json(ResponseFormatter.success(status, 'Stato WhatsApp recuperato'));
  } catch (error: any) {
    logger.error('Errore recupero stato:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore recupero stato', 'STATUS_ERROR')
    );
  }
});

/**
 * POST /api/whatsapp/initialize
 * Inizializza connessione WhatsApp
 */
router.post('/initialize', authenticate, checkRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    await whatsappService.initialize();
    
    // Attendi un momento per la generazione del QR
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const status = await whatsappService.getStatus();
    
    return res.json(ResponseFormatter.success(status, 'WhatsApp inizializzato'));
  } catch (error: any) {
    logger.error('Errore inizializzazione:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore inizializzazione WhatsApp', 'INIT_ERROR')
    );
  }
});

/**
 * GET /api/whatsapp/qrcode
 * Genera/Ottieni QR Code
 */
router.get('/qrcode', authenticate, checkRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const status = await whatsappService.getStatus();
    
    if (status.connected) {
      return res.json(ResponseFormatter.success(
        { connected: true, message: 'WhatsApp già connesso' },
        'WhatsApp già connesso'
      ));
    }
    
    if (status.qrCode) {
      return res.json(ResponseFormatter.success(
        { qrCode: status.qrCode },
        'QR Code disponibile'
      ));
    }
    
    // Genera nuovo QR
    const qrCode = await whatsappService.generateQRCode();
    
    return res.json(ResponseFormatter.success(
      { qrCode },
      'QR Code generato'
    ));
  } catch (error: any) {
    logger.error('Errore generazione QR:', error);
    return res.status(500).json(
      ResponseFormatter.error(error.message || 'Errore generazione QR Code', 'QR_ERROR')
    );
  }
});

/**
 * POST /api/whatsapp/send
 * Invia messaggio WhatsApp
 */
router.post('/send', authenticate, async (req: any, res) => {
  try {
    const { recipient, message } = req.body;
    
    if (!recipient || !message) {
      return res.status(400).json(
        ResponseFormatter.error('Destinatario e messaggio richiesti', 'VALIDATION_ERROR')
      );
    }
    
    // Formatta numero (rimuovi caratteri non numerici)
    const phoneNumber = recipient.replace(/\D/g, '');
    
    const result = await whatsappService.sendMessage(phoneNumber, message);
    
    if (!result.success) {
      return res.status(400).json(
        ResponseFormatter.error(result.error || 'Invio messaggio fallito', 'SEND_ERROR')
      );
    }
    
    return res.json(ResponseFormatter.success(result, 'Messaggio inviato con successo'));
  } catch (error: any) {
    logger.error('Errore invio messaggio:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore invio messaggio', 'SEND_ERROR')
    );
  }
});

/**
 * POST /api/whatsapp/disconnect
 * Disconnetti WhatsApp
 */
router.post('/disconnect', authenticate, checkRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    await whatsappService.disconnect();
    
    return res.json(ResponseFormatter.success(null, 'WhatsApp disconnesso'));
  } catch (error: any) {
    logger.error('Errore disconnessione:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore disconnessione', 'DISCONNECT_ERROR')
    );
  }
});

/**
 * POST /api/whatsapp/reconnect
 * Riconnetti WhatsApp
 */
router.post('/reconnect', authenticate, checkRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    await whatsappService.reconnect();
    
    // Attendi per QR
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const status = await whatsappService.getStatus();
    
    return res.json(ResponseFormatter.success(status, 'WhatsApp riconnesso'));
  } catch (error: any) {
    logger.error('Errore riconnessione:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore riconnessione', 'RECONNECT_ERROR')
    );
  }
});

/**
 * GET /api/whatsapp/messages
 * Ottieni messaggi
 */
router.get('/messages', authenticate, async (req: any, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const messages = await whatsappService.getMessages(limit, offset);
    
    return res.json(ResponseFormatter.success(messages, 'Messaggi recuperati'));
  } catch (error: any) {
    logger.error('Errore recupero messaggi:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore recupero messaggi', 'MESSAGES_ERROR')
    );
  }
});

/**
 * PUT /api/whatsapp/messages/:id/read
 * Segna messaggio come letto
 */
router.put('/messages/:id/read', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    
    await whatsappService.markAsRead(id);
    
    return res.json(ResponseFormatter.success(null, 'Messaggio segnato come letto'));
  } catch (error: any) {
    logger.error('Errore marcatura messaggio:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore marcatura messaggio', 'MARK_READ_ERROR')
    );
  }
});

export default router;
