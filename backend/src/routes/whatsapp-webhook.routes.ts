/**
 * WhatsApp Webhook Routes
 * Riceve eventi da Evolution API
 */

import { Router } from 'express';
import { ResponseFormatter } from '../utils/responseFormatter';
import logger from '../utils/logger';

const router = Router();

// Store per QR codes temporanei (in produzione usare Redis)
const qrCodeStore = new Map<string, any>();

// Webhook endpoint per Evolution API
router.post('/webhook/:instance', async (req, res) => {
  try {
    const { instance } = req.params;
    const event = req.body;
    
    logger.info(`Webhook received for instance ${instance}:`, {
      event: event.event,
      instance: event.instance
    });
    
    // Gestisci diversi tipi di eventi
    switch (event.event) {
      case 'qrcode.updated':
      case 'QRCODE_UPDATED':
        logger.info('QR Code received:', {
          instance,
          hasQR: !!event.qrcode
        });
        
        // Salva il QR code
        if (event.qrcode) {
          qrCodeStore.set(instance, {
            qrcode: event.qrcode,
            timestamp: new Date(),
            base64: event.base64 || event.qrcode.base64 || event.qrcode
          });
        }
        break;
        
      case 'connection.update':
      case 'CONNECTION_UPDATE':
        logger.info('Connection update:', {
          instance,
          state: event.state || event.data?.state
        });
        break;
        
      case 'messages.upsert':
      case 'MESSAGES_UPSERT':
        logger.info('New message:', {
          instance,
          from: event.data?.key?.remoteJid
        });
        break;
        
      default:
        logger.info('Other event:', event.event);
    }
    
    // Evolution API si aspetta una risposta 200
    return res.status(200).json({ success: true });
    
  } catch (error) {
    logger.error('Webhook error:', error);
    return res.status(200).json({ success: true }); // Sempre 200 per Evolution
  }
});

// Endpoint per recuperare QR code salvato
router.get('/qrcode/:instance', async (req, res) => {
  try {
    const { instance } = req.params;
    const qrData = qrCodeStore.get(instance);
    
    if (!qrData) {
      return res.status(404).json(
        ResponseFormatter.error('QR code not found', 'QR_NOT_FOUND')
      );
    }
    
    // Controlla se il QR non è troppo vecchio (5 minuti)
    const age = Date.now() - qrData.timestamp.getTime();
    if (age > 5 * 60 * 1000) {
      qrCodeStore.delete(instance);
      return res.status(404).json(
        ResponseFormatter.error('QR code expired', 'QR_EXPIRED')
      );
    }
    
    return res.json(ResponseFormatter.success({
      qrcode: qrData.base64 || qrData.qrcode,
      timestamp: qrData.timestamp
    }));
    
  } catch (error) {
    logger.error('Get QR error:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to get QR code', 'QR_ERROR')
    );
  }
});

// Endpoint per configurare webhook in Evolution API
router.post('/setup-webhook', async (req, res) => {
  try {
    const { instanceName, webhookUrl } = req.body;
    
    // Qui dovremmo chiamare Evolution API per configurare il webhook
    // Ma lo faremo dal frontend per ora
    
    return res.json(ResponseFormatter.success({
      message: 'Use this webhook URL in Evolution API',
      webhookUrl: `${webhookUrl}/api/whatsapp/webhook/${instanceName}`,
      events: ['QRCODE_UPDATED', 'CONNECTION_UPDATE', 'MESSAGES_UPSERT']
    }));
    
  } catch (error) {
    logger.error('Setup webhook error:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to setup webhook', 'WEBHOOK_ERROR')
    );
  }
});

export default router;
