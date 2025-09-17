/**
 * Configurazione Webhook per Ricezione Messaggi WhatsApp
 * CORREZIONE: Gestione corretta direzione messaggi (inbound/outbound)
 * Data Fix: 16 Settembre 2025
 */

import { Router } from 'express';
import { ResponseFormatter } from '../utils/responseFormatter';
import * as whatsappService from '../services/whatsapp.service';
import { saveWhatsAppConfig, getWhatsAppConfig } from '../services/whatsapp-config.service';
import logger from '../utils/logger';
import prisma from '../config/database';

const router = Router();

/**
 * POST /api/whatsapp/webhook
 * Endpoint che riceve TUTTI gli eventi da SendApp:
 * - Messaggi in arrivo
 * - Stati messaggi (sent, delivered, read)
 * - Stato connessione
 * - Eventi sistema
 */
router.post('/webhook', async (req, res) => {
  try {
    logger.info('📨 Webhook WhatsApp ricevuto');
    logger.info('Headers:', req.headers);
    logger.info('Body completo:', JSON.stringify(req.body, null, 2));
    
    // NUOVO FORMATO SENDAPP
    const { instance_id, data } = req.body;
    
    if (!data) {
      logger.warn('⚠️ Webhook senza campo data');
      return res.status(200).json({ success: true, message: 'No data' });
    }
    
    const eventType = data.event;
    logger.info(`📌 Tipo evento: ${eventType}`);
    
    // Gestisci in base al tipo di evento SendApp
    if (eventType === 'messages.upsert' || eventType === 'message') {
      // MESSAGGIO IN ARRIVO - formato SendApp
      logger.info('📩 Evento messaggio rilevato');
      
      // I messaggi sono in data.data.messages
      const messageData = data.data;
      if (messageData && messageData.messages && Array.isArray(messageData.messages)) {
        logger.info(`📬 Trovati ${messageData.messages.length} messaggi da elaborare`);
        for (const msg of messageData.messages) {
          await handleSendAppMessage(msg, instance_id);
        }
      } else {
        logger.warn('⚠️ Formato messaggi non riconosciuto:', JSON.stringify(data.data, null, 2));
      }
      
    } else if (eventType === 'messages.update') {
      // AGGIORNAMENTO STATO MESSAGGIO
      logger.info('📊 Aggiornamento stato messaggio');
      const updates = data.data || [];
      for (const update of updates) {
        await handleSendAppStatusUpdate(update);
      }
      
    } else if (eventType === 'connection.update') {
      // STATO CONNESSIONE
      logger.info('🔌 Aggiornamento connessione');
      await handleSendAppConnectionUpdate(data.data);
      
    } else if (eventType === 'contacts.update') {
      // AGGIORNAMENTO CONTATTI - possiamo ignorare
      logger.info('👤 Aggiornamento contatti (ignorato)');
      
    } else {
      // EVENTO NON GESTITO
      logger.info(`❓ Evento non gestito: ${eventType}`);
      logger.info('Dati evento:', JSON.stringify(data.data, null, 2));
    }
    
    // SendApp si aspetta sempre una risposta 200
    return res.status(200).json({ 
      success: true,
      message: 'Webhook received'
    });
    
  } catch (error: any) {
    logger.error('Errore gestione webhook:', error);
    // Importante: restituire sempre 200 per non far ritentare SendApp
    return res.status(200).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Funzione per gestire messaggi nel formato SendApp
async function handleSendAppMessage(msg: any, instanceId: string) {
  try {
    logger.info('📌 ANALISI MESSAGGIO SENDAPP');
    logger.info('Struttura messaggio completa:', JSON.stringify(msg, null, 2));
    
    // Estrai i dati dal formato SendApp
    const messageData = msg.message || msg;
    const key = msg.key || {};
    
    // CORREZIONE DEFINITIVA: Verifica fromMe per determinare la direzione
    // fromMe = false significa che è un messaggio RICEVUTO (da salvare)
    // fromMe = true significa che è un messaggio INVIATO da noi (da saltare)
    const isFromMe = key.fromMe === true || key.fromMe === 'true' || key.fromMe === 1;
    
    logger.info(`🔍 ANALISI DIREZIONE MESSAGGIO:`);
    logger.info(`   - key.fromMe raw: ${key.fromMe} (tipo: ${typeof key.fromMe})`);
    logger.info(`   - isFromMe interpretato: ${isFromMe}`);
    logger.info(`   - Direzione: ${isFromMe ? '📤 OUTBOUND (nostro messaggio inviato)' : '📥 INBOUND (messaggio ricevuto)'}`);
    
    // IMPORTANTE: Processiamo SOLO i messaggi RICEVUTI (fromMe = false)
    if (isFromMe) {
      logger.info('⏭️ Messaggio OUTBOUND (nostro) - SKIP');
      logger.info('   Questo è un messaggio che abbiamo inviato noi, non serve salvarlo di nuovo');
      return; // Skip messaggi outbound
    }
    
    logger.info('✅ Messaggio INBOUND (ricevuto) - PROCEDO AL SALVATAGGIO');
    
    // Estrai numero telefono
    let phoneNumber = key.remoteJid || key.participant || msg.from || 'unknown';
    phoneNumber = phoneNumber.replace('@s.whatsapp.net', '').replace('@g.us', '');
    
    // Estrai testo messaggio
    let messageText = '';
    if (messageData.conversation) {
      messageText = messageData.conversation;
    } else if (messageData.extendedTextMessage?.text) {
      messageText = messageData.extendedTextMessage.text;
    } else if (messageData.text) {
      messageText = messageData.text;
    } else if (typeof messageData === 'string') {
      messageText = messageData;
    }
    
    // Se non c'è contenuto, ignora
    if (!messageText && !messageData.imageMessage && !messageData.documentMessage) {
      logger.info('Messaggio senza contenuto testuale, ignorato');
      return;
    }
    
    // Determina il tipo
    let messageType = 'text';
    if (messageData.imageMessage) messageType = 'image';
    if (messageData.documentMessage) messageType = 'document';
    if (messageData.audioMessage) messageType = 'audio';
    if (messageData.videoMessage) messageType = 'video';
    
    logger.info(`📱 Salvataggio messaggio RICEVUTO da ${phoneNumber}: ${messageText?.substring(0, 50)}...`);
    
    // Salva nel database usando i CAMPI CORRETTI dello schema
    // Schema: phoneNumber, message, direction, status, messageId, timestamp, mediaUrl, mediaType, metadata
    const savedMessage = await prisma.whatsAppMessage.create({
      data: {
        phoneNumber: phoneNumber,  // Campo corretto
        message: messageText || '[Media]',  // Campo corretto (non 'content')
        direction: 'inbound',  // Messaggi ricevuti
        status: 'received',
        messageId: key.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        mediaUrl: messageData.imageMessage?.url || messageData.documentMessage?.url || null,
        mediaType: messageType === 'text' ? null : messageType,
        metadata: {
          instanceId: instanceId,
          pushName: msg.pushName || msg.pushname,
          fromNumber: phoneNumber,
          messageKey: key,
          rawMessage: msg
        }
      }
    });
    
    logger.info(`✅ Messaggio INBOUND salvato con ID: ${savedMessage.id}`);
    logger.info(`   Da: ${phoneNumber}`);
    logger.info(`   Testo: ${messageText?.substring(0, 100)}`);
    
  } catch (error) {
    logger.error('❌ ERRORE gestione messaggio SendApp:', error);
    logger.error('Messaggio raw che ha causato errore:', JSON.stringify(msg, null, 2));
  }
}

// Funzione per gestire aggiornamenti stato nel formato SendApp
async function handleSendAppStatusUpdate(update: any) {
  try {
    logger.info('📊 Aggiornamento stato messaggio');
    logger.info('Update data:', JSON.stringify(update, null, 2));
    
    // Estrai info dall'update
    const key = update.key || {};
    const messageId = key.id;
    const status = update.update?.status;
    
    if (messageId && status) {
      logger.info(`   Message ID: ${messageId}`);
      logger.info(`   Nuovo stato: ${status}`);
      
      // Cerca il messaggio nel database
      const message = await prisma.whatsAppMessage.findFirst({
        where: {
          OR: [
            { messageId: messageId },
            { rawData: { path: ['messageId'], equals: messageId } }
          ]
        },
        orderBy: { timestamp: 'desc' }
      });
      
      if (message) {
        // Aggiorna lo stato
        await prisma.whatsAppMessage.update({
          where: { id: message.id },
          data: {
            status: status,
            updatedAt: new Date()
          }
        });
        
        logger.info(`✅ Stato messaggio aggiornato a: ${status}`);
      } else {
        logger.info('⚠️ Messaggio non trovato nel database per aggiornare lo stato');
      }
    }
    
  } catch (error) {
    logger.error('Errore gestione stato SendApp:', error);
  }
}

// Funzione per gestire connessione nel formato SendApp
async function handleSendAppConnectionUpdate(data: any) {
  try {
    logger.info('🔌 Aggiornamento connessione WhatsApp');
    logger.info('Connection data:', JSON.stringify(data, null, 2));
    
    const isConnected = data?.connection === 'open' || data?.status === 'connected';
    
    // Aggiorna stato nel database
    await prisma.systemConfiguration.upsert({
      where: { key: 'whatsapp_connected_manual' },
      update: { 
        value: isConnected.toString(),
        updatedAt: new Date()
      },
      create: {
        key: 'whatsapp_connected_manual',
        value: isConnected.toString(),
        description: 'Stato connessione WhatsApp (da webhook)'
      }
    });
    
    logger.info(`✅ Stato connessione aggiornato: ${isConnected ? 'CONNESSO' : 'DISCONNESSO'}`);
    
    if (!isConnected) {
      logger.warn('⚠️ WhatsApp disconnesso! Verificare la connessione.');
    }
    
  } catch (error) {
    logger.error('Errore gestione connessione SendApp:', error);
  }
}

/**
 * POST /api/whatsapp/configure-webhook
 * Configura l'URL del webhook nel sistema
 */
router.post('/configure-webhook', async (req, res) => {
  try {
    const { webhookUrl } = req.body;
    
    if (!webhookUrl) {
      return res.status(400).json(
        ResponseFormatter.error('URL webhook richiesto', 'WEBHOOK_URL_REQUIRED')
      );
    }
    
    // Recupera la configurazione attuale
    const currentConfig = await getWhatsAppConfig();
    
    if (!currentConfig) {
      return res.status(400).json(
        ResponseFormatter.error('Configurazione WhatsApp non trovata', 'CONFIG_NOT_FOUND')
      );
    }
    
    // Aggiorna la configurazione con il nuovo webhook URL
    await saveWhatsAppConfig({
      ...currentConfig,
      webhookUrl: webhookUrl
    });
    
    // Configura il webhook su SendApp
    const response = await whatsappService.setWebhook(webhookUrl);
    
    logger.info('✅ Webhook configurato:', webhookUrl);
    
    return res.json(ResponseFormatter.success({
      webhookUrl,
      configured: true,
      message: 'Webhook configurato con successo'
    }, 'Webhook configurato'));
    
  } catch (error: any) {
    logger.error('Errore configurazione webhook:', error);
    return res.status(500).json(
      ResponseFormatter.error(error.message || 'Errore configurazione webhook', 'WEBHOOK_CONFIG_ERROR')
    );
  }
});

/**
 * GET /api/whatsapp/webhook-status
 * Verifica lo stato del webhook
 */
router.get('/webhook-status', async (req, res) => {
  try {
    const config = await getWhatsAppConfig();
    
    if (!config) {
      return res.json(ResponseFormatter.success({
        configured: false,
        webhookUrl: null,
        message: 'Configurazione WhatsApp non trovata'
      }));
    }
    
    return res.json(ResponseFormatter.success({
      configured: !!config.webhookUrl,
      webhookUrl: config.webhookUrl || null,
      message: config.webhookUrl 
        ? `Webhook configurato: ${config.webhookUrl}`
        : 'Webhook non configurato'
    }, 'Stato webhook'));
    
  } catch (error: any) {
    logger.error('Errore verifica webhook:', error);
    return res.status(500).json(
      ResponseFormatter.error(error.message || 'Errore verifica webhook', 'WEBHOOK_STATUS_ERROR')
    );
  }
});

/**
 * GET /api/whatsapp/messages
 * Recupera tutti i messaggi WhatsApp
 */
router.get('/messages', async (req, res) => {
  try {
    const { direction, phoneNumber, limit = 50, offset = 0 } = req.query;
    
    const where: any = {};
    
    if (direction) {
      where.direction = direction as string;
    }
    
    if (phoneNumber) {
      where.phoneNumber = { contains: phoneNumber as string };
    }
    
    const messages = await prisma.whatsAppMessage.findMany({
      where,
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      orderBy: { timestamp: 'desc' }
    });
    
    const total = await prisma.whatsAppMessage.count({ where });
    
    // Conta per direzione
    const inboundCount = await prisma.whatsAppMessage.count({
      where: { direction: 'inbound' }
    });
    
    const outboundCount = await prisma.whatsAppMessage.count({
      where: { direction: 'outbound' }
    });
    
    return res.json(ResponseFormatter.success({
      messages,
      total,
      stats: {
        inbound: inboundCount,
        outbound: outboundCount
      },
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    }, 'Messaggi recuperati'));
    
  } catch (error: any) {
    logger.error('Errore recupero messaggi:', error);
    return res.status(500).json(
      ResponseFormatter.error(error.message || 'Errore recupero messaggi', 'GET_MESSAGES_ERROR')
    );
  }
});

export default router;
