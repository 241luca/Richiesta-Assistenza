/**
 * WhatsApp Service - Integrazione con SendApp Cloud
 * Gestisce l'invio/ricezione messaggi WhatsApp
 * INTEGRATO CON SISTEMA AI DUALE
 */

import axios, { AxiosInstance } from 'axios';
import prisma from '../config/database';
import logger from '../utils/logger';
import { getWhatsAppConfig, saveWhatsAppConfig } from './whatsapp-config.service';
import { NotificationService } from './notification.service';
import { dualModeDetector } from './dual-mode-detector.service';
import { dualKBService } from './dual-kb.service';
import { responseSanitizer } from './response-sanitizer.service';
import { DetectionMode } from '../types/professional-whatsapp.types';
import aiDualeHelper from './ai-duale-helper.service';

// Inizializza il servizio notifiche
const notificationService = new NotificationService();

// Client Axios per SendApp
let sendappClient: AxiosInstance | null = null;
let currentConfig: any = null;

/**
 * Carica la configurazione dal database e inizializza il client
 */
async function initializeClient(): Promise<boolean> {
  try {
    const config = await getWhatsAppConfig();
    
    if (!config || !config.accessToken) {
      logger.warn('Configurazione WhatsApp non disponibile nel database');
      return false;
    }
    
    // Salva la configurazione corrente
    currentConfig = config;
    
    // Inizializza client Axios con la configurazione dal database
    sendappClient = axios.create({
      baseURL: config.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    logger.info('Client WhatsApp inizializzato con configurazione dal database');
    logger.info('URL Base:', config.baseURL);
    logger.info('Token presente:', !!config.accessToken);
    return true;
  } catch (error) {
    logger.error('Errore inizializzazione client WhatsApp:', error);
    return false;
  }
}

/**
 * Ottiene il QR Code per il login
 */
export async function getQRCode(): Promise<any> {
  try {
    if (!sendappClient) await initializeClient();
    if (!sendappClient || !currentConfig) throw new Error('Client WhatsApp non inizializzato');
    
    const accessToken = currentConfig.accessToken;
    
    // Recupera l'instance ID SOLO da ApiKey.permissions
    const instanceId = currentConfig.instanceId;
    
    if (!instanceId) {
      throw new Error('Instance ID non configurato. Configuralo nella pagina API Keys.');
    }
    
    logger.info('=== GENERAZIONE QR CODE ===');
    logger.info('Instance ID utilizzato:', instanceId);
    logger.info('Access Token utilizzato:', accessToken);
    logger.info('URL chiamata:', `https://app.sendapp.cloud/api/get_qrcode?instance_id=${instanceId}&access_token=${accessToken}`);
    logger.info('===========================');
    
    const response = await sendappClient.get('/get_qrcode', {
      params: {
        instance_id: instanceId,
        access_token: accessToken
      }
    });
    
    logger.info('Risposta QR Code ricevuta. Tipo:', typeof response.data);
    logger.info('Dati ricevuti:', JSON.stringify(response.data).substring(0, 500));
    
    // L'API potrebbe restituire il QR in diversi formati
    // Proviamo a estrarlo in modo intelligente
    let qrData = response.data;
    
    // Se la risposta contiene direttamente una stringa base64
    if (typeof qrData === 'string' && qrData.includes('data:image')) {
      return qrData;
    }
    
    // Se è un oggetto, cerca il campo giusto
    if (typeof qrData === 'object') {
      // Possibili campi dove potrebbe essere il QR
      const possibleFields = ['qrcode', 'qr_code', 'base64', 'image', 'data', 'url'];
      
      for (const field of possibleFields) {
        if (qrData[field]) {
          logger.info(`QR trovato nel campo: ${field}`);
          return qrData[field];
        }
      }
    }
    
    // Se non troviamo il QR, restituisci comunque la risposta
    logger.warn('QR Code non trovato nella risposta standard, restituisco dati completi');
    return response.data;
    
  } catch (error: any) {
    logger.error('Errore generazione QR Code:', error.response?.data || error.message);
    logger.error('Status code:', error.response?.status);
    
    // Se l'errore contiene informazioni utili, passale al frontend
    if (error.response?.data) {
      throw new Error(JSON.stringify(error.response.data));
    }
    throw error;
  }
}

/**
 * Crea una nuova istanza WhatsApp
 */
export async function createInstance(): Promise<any> {
  try {
    if (!sendappClient) await initializeClient();
    if (!sendappClient || !currentConfig) throw new Error('Client WhatsApp non inizializzato');
    
    const accessToken = currentConfig.accessToken;
    
    logger.info('Creazione nuova istanza WhatsApp...');
    
    const response = await sendappClient.get('/create_instance', {
      params: {
        access_token: accessToken
      }
    });
    
    logger.info('Nuova istanza creata:', response.data);
    
    // Salva il nuovo instance ID nel database
    if (response.data?.instance_id || response.data?.data?.instance_id) {
      const newInstanceId = response.data.instance_id || response.data.data.instance_id;
      await saveWhatsAppConfig({
        ...currentConfig,
        instanceId: newInstanceId
      });
      logger.info('Instance ID aggiornato nel database:', newInstanceId);
    }
    
    return response.data;
  } catch (error: any) {
    logger.error('Errore creazione istanza:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Disconnette WhatsApp
 */
export async function disconnect(): Promise<any> {
  try {
    if (!sendappClient) await initializeClient();
    if (!sendappClient || !currentConfig) throw new Error('Client WhatsApp non inizializzato');
    
    const accessToken = currentConfig.accessToken;
    const instanceId = currentConfig.instanceId;
    
    if (!instanceId) {
      logger.warn('Nessuna istanza da disconnettere');
      return { success: true, message: 'Nessuna istanza attiva' };
    }
    
    logger.info('Disconnessione WhatsApp, instance:', instanceId);
    
    // Prova prima il reset (disconnette e cancella)
    try {
      const response = await sendappClient.get('/reset_instance', {
        params: {
          instance_id: instanceId,
          access_token: accessToken
        }
      });
      
      logger.info('WhatsApp disconnesso con reset:', response.data);
      
      // Aggiorna lo stato nel database
      await saveWhatsAppConfig({
        ...currentConfig,
        isConnected: false,
        phoneNumber: null
      });
      
      return { success: true, message: 'WhatsApp disconnesso' };
      
    } catch (resetError) {
      logger.warn('Reset fallito, provo con reboot...');
      
      // Se reset fallisce, prova con reboot
      const response = await sendappClient.get('/reboot', {
        params: {
          instance_id: instanceId,
          access_token: accessToken
        }
      });
      
      logger.info('WhatsApp disconnesso con reboot:', response.data);
      
      // Aggiorna lo stato nel database
      await saveWhatsAppConfig({
        ...currentConfig,
        isConnected: false,
        phoneNumber: null
      });
      
      return { success: true, message: 'WhatsApp disconnesso' };
    }
    
  } catch (error: any) {
    logger.error('Errore disconnessione:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Verifica lo stato della connessione
 */
export async function getConnectionStatus(): Promise<any> {
  try {
    if (!sendappClient) await initializeClient();
    if (!sendappClient) {
      return {
        connected: false,
        configured: false,
        error: 'Client WhatsApp non inizializzato'
      };
    }
    
    const config = await getWhatsAppConfig();
    
    if (!config || !config.accessToken || !config.instanceId) {
      return {
        connected: false,
        configured: false,
        error: 'WhatsApp non configurato. Configura access token e instance ID in API Keys.'
      };
    }
    
    const accessToken = config.accessToken;
    const instanceId = config.instanceId;
    let isConnected = false;
    
    try {
      const systemConfig = await prisma?.systemConfiguration?.findFirst?.({
        where: { key: 'whatsapp_instance_id' }
      });
      
      if (systemConfig?.value) {
        instanceId = systemConfig.value;
      }
      
      // Recupera lo stato salvato manualmente
      const connectionStatus = await prisma?.systemConfiguration?.findFirst?.({
        where: { key: 'whatsapp_connected_manual' }
      });
      
      isConnected = connectionStatus?.value === 'true';
    } catch (dbError) {
      logger.warn('Errore accesso database per stato WhatsApp:', dbError);
      // Continua con valori di default
    }
    
    return {
      connected: isConnected,
      configured: true,
      instanceId: instanceId,
      accessToken: accessToken,
      message: isConnected 
        ? '✅ WhatsApp CONNESSO (stato manuale)' 
        : '❌ WhatsApp NON CONNESSO - Scansiona il QR Code',
      lastCheck: new Date().toISOString(),
      note: 'SendApp non fornisce un endpoint per verificare lo stato. Usa il pulsante sotto per aggiornare manualmente.'
    };
    
  } catch (error: any) {
    logger.error('Errore verifica stato:', error.message || error);
    return {
      connected: false,
      configured: false,
      error: error.message || 'Errore sconosciuto'
    };
  }
}

// Esporta le altre funzioni necessarie
export {
  initializeClient,
  getWhatsAppConfig,
  setConnectionStatus,
  sendMediaMessage,
  sendTextMessageToGroup,
  sendMediaMessageToGroup,
  setWebhook
};

export async function createInstance(): Promise<any> {
  try {
    if (!sendappClient) await initializeClient();
    if (!sendappClient || !currentConfig) throw new Error('Client WhatsApp non inizializzato');
    
    if (!currentConfig.accessToken) {
      throw new Error('Access token non configurato. Configura in API Keys.');
    }
    
    const accessToken = currentConfig.accessToken;
    
    logger.info('Creazione nuova istanza WhatsApp...');
    
    const response = await sendappClient.get('/create_instance', {
      params: {
        access_token: accessToken
      }
    });
    
    logger.info('Istanza creata:', response.data);
    
    // Salva l'instance ID nel database
    if (response.data?.instance_id) {
      logger.info('Nuovo Instance ID:', response.data.instance_id);
      
      // Salva nel database
      try {
        await prisma.systemConfiguration.upsert({
          where: { key: 'whatsapp_instance_id' },
          update: { value: response.data.instance_id },
          create: {
            key: 'whatsapp_instance_id',
            value: response.data.instance_id,
            description: 'WhatsApp Instance ID from SendApp'
          }
        });
        logger.info('Instance ID salvato nel database');
      } catch (dbError) {
        logger.error('Errore salvataggio instance ID:', dbError);
      }
    }
    
    return response.data;
  } catch (error: any) {
    logger.error('Errore creazione istanza:', error.response?.data || error.message);
    throw error;
  }
}

export async function sendTextMessage(phoneNumber: string, message: string): Promise<any> {
  try {
    if (!sendappClient) await initializeClient();
    if (!sendappClient || !currentConfig) throw new Error('Client WhatsApp non inizializzato');
    
    if (!currentConfig.accessToken || !currentConfig.instanceId) {
      throw new Error('WhatsApp non configurato. Configura access token e instance ID in API Keys.');
    }
    
    const normalizedNumber = phoneNumber.replace(/[^\d]/g, '');
    
    const response = await sendappClient.post('/send', {
      number: normalizedNumber,
      type: 'text',
      message: message,
      instance_id: currentConfig.instanceId,
      access_token: currentConfig.accessToken
    });
    
    return response.data;
  } catch (error: any) {
    logger.error('Errore invio messaggio WhatsApp:', error.response?.data || error.message);
    throw error;
  }
}

export async function sendMediaMessage(phoneNumber: string, message: string, mediaUrl: string, filename?: string): Promise<any> {
  try {
    if (!sendappClient) await initializeClient();
    if (!sendappClient || !currentConfig) throw new Error('Client WhatsApp non inizializzato');
    
    if (!currentConfig.accessToken || !currentConfig.instanceId) {
      throw new Error('WhatsApp non configurato. Configura access token e instance ID in API Keys.');
    }
    
    const normalizedNumber = phoneNumber.replace(/[^\d]/g, '');
    
    const response = await sendappClient.post('/send', {
      number: normalizedNumber,
      type: 'media',
      message: message,
      media_url: mediaUrl,
      filename: filename,
      instance_id: currentConfig.instanceId,
      access_token: currentConfig.accessToken
    });
    
    return response.data;
  } catch (error: any) {
    logger.error('Errore invio media WhatsApp:', error.response?.data || error.message);
    throw error;
  }
}

export async function sendGroupMessage(groupId: string, message: string, mediaUrl?: string): Promise<any> {
  if (mediaUrl) {
    return sendMediaMessageToGroup(groupId, message, mediaUrl);
  } else {
    return sendTextMessageToGroup(groupId, message);
  }
}

export async function sendTextMessageToGroup(groupId: string, message: string): Promise<any> {
  try {
    if (!sendappClient) await initializeClient();
    if (!sendappClient) throw new Error('Client WhatsApp non inizializzato');
    
    const response = await sendappClient.post('/send_group', {
      group_id: groupId,
      type: 'text',
      message: message,
      instance_id: currentConfig.instanceId,
      access_token: currentConfig.accessToken
    });
    
    return response.data;
  } catch (error: any) {
    logger.error('Errore invio messaggio gruppo:', error.response?.data || error.message);
    throw error;
  }
}

export async function sendMediaMessageToGroup(groupId: string, message: string, mediaUrl: string, filename?: string): Promise<any> {
  try {
    if (!sendappClient) await initializeClient();
    if (!sendappClient) throw new Error('Client WhatsApp non inizializzato');
    
    const response = await sendappClient.post('/send_group', {
      group_id: groupId,
      type: 'media',
      message: message,
      media_url: mediaUrl,
      filename: filename,
      instance_id: currentConfig.instanceId,
      access_token: currentConfig.accessToken
    });
    
    return response.data;
  } catch (error: any) {
    logger.error('Errore invio media gruppo:', error.response?.data || error.message);
    throw error;
  }
}

export async function resetInstance(): Promise<any> {
  try {
    if (!sendappClient) await initializeClient();
    if (!sendappClient) throw new Error('Client WhatsApp non inizializzato');
    
    const accessToken = currentConfig.accessToken;
    
    // Recupera l'instance ID corrente
    const systemConfig = await prisma.systemConfiguration.findFirst({
      where: { key: 'whatsapp_instance_id' }
    });
    
    if (systemConfig?.value) {
      const instanceId = systemConfig.value;
      
      logger.info('Reset istanza WhatsApp:', instanceId);
      
      // Chiama l'API per resettare l'istanza
      try {
        const response = await sendappClient.get('/reset_instance', {
          params: {
            instance_id: instanceId,
            access_token: accessToken
          }
        });
        
        logger.info('Istanza resettata:', response.data);
        
        // Rimuovi l'instance ID dal database
        await prisma.systemConfiguration.delete({
          where: { key: 'whatsapp_instance_id' }
        });
        
        return { status: 'success', message: 'Instance reset e ID rimosso dal database' };
      } catch (error: any) {
        logger.error('Errore reset istanza:', error.response?.data || error.message);
        throw error;
      }
    } else {
      return { status: 'info', message: 'Nessuna istanza da resettare' };
    }
  } catch (error: any) {
    logger.error('Errore reset:', error);
    throw error;
  }
}

/**
 * Imposta manualmente lo stato della connessione
 */
export async function setConnectionStatus(connected: boolean): Promise<any> {
  try {
    // Verifica che prisma sia disponibile
    if (!prisma || !prisma.systemConfiguration) {
      throw new Error('Database non disponibile');
    }
    
    await prisma.systemConfiguration.upsert({
      where: { key: 'whatsapp_connected_manual' },
      update: { value: connected.toString() },
      create: {
        key: 'whatsapp_connected_manual',
        value: connected.toString(),
        description: 'Stato connessione WhatsApp (manuale)'
      }
    });
    
    logger.info(`Stato WhatsApp impostato manualmente su: ${connected ? 'CONNESSO' : 'NON CONNESSO'}`);
    
    return {
      success: true,
      connected: connected,
      message: connected 
        ? 'Stato impostato su CONNESSO' 
        : 'Stato impostato su NON CONNESSO'
    };
  } catch (error: any) {
    logger.error('Errore impostazione stato:', error.message || error);
    throw new Error(error.message || 'Errore impostazione stato');
  }
}

export async function rebootInstance(): Promise<any> {
  try {
    logger.info('Riavvio istanza WhatsApp...');
    // SendApp non fornisce un endpoint per il reboot
    // Possiamo solo resettare lo stato
    await setConnectionStatus(false);
    return { 
      status: 'info', 
      message: 'Riavvio simulato - SendApp non supporta il reboot diretto. Riscansiona il QR Code se necessario.' 
    };
  } catch (error: any) {
    logger.error('Errore riavvio:', error);
    throw error;
  }
}

export async function reconnect(): Promise<any> {
  return { status: 'success', message: 'Reconnected' };
}

export async function setWebhook(webhookUrl: string): Promise<any> {
  try {
    if (!sendappClient) await initializeClient();
    if (!sendappClient || !currentConfig) throw new Error('Client WhatsApp non inizializzato');
    
    const accessToken = currentConfig.accessToken;
    const instanceId = await getInstanceIdFromDB();
    
    if (!instanceId) {
      throw new Error('Instance ID non trovato. Genera prima il QR Code.');
    }
    
    logger.info('Configurazione webhook WhatsApp...');
    logger.info('URL Webhook:', webhookUrl);
    logger.info('Instance ID:', instanceId);
    
    // Chiamata API SendApp per configurare il webhook
    const response = await sendappClient.get('/set_webhook', {
      params: {
        webhook_url: webhookUrl,
        enable: true,
        instance_id: instanceId,
        access_token: accessToken
      }
    });
    
    logger.info('Risposta configurazione webhook:', response.data);
    
    // Salva l'URL del webhook nel database
    await saveWhatsAppConfig({
      ...currentConfig,
      webhookUrl: webhookUrl
    });
    
    logger.info('✅ Webhook configurato con successo:', webhookUrl);
    return response.data;
  } catch (error: any) {
    logger.error('Errore configurazione webhook:', error.response?.data || error.message);
    throw error;
  }
}

// Helper function per recuperare l'instance ID da ApiKey
async function getInstanceIdFromDB(): Promise<string> {
  const config = await getWhatsAppConfig();
  return config?.instanceId || '';
}

/**
 * Processa i messaggi in arrivo dal webhook di SendApp
 * Salva i messaggi nel database per tenere traccia delle conversazioni
 */
export async function processIncomingMessage(webhookData: any): Promise<void> {
  try {
    logger.info('=== PROCESSAMENTO MESSAGGIO WHATSAPP IN ARRIVO ===');
    logger.info('Dati webhook completi:', JSON.stringify(webhookData, null, 2));
    
    // Verifica che ci siano dati validi
    if (!webhookData || !webhookData.data) {
      logger.warn('Webhook ricevuto senza dati validi');
      return;
    }
    
    const { data } = webhookData;
    
    // Gestisci diversi tipi di eventi
    if (data.event === 'messages.upsert') {
      // Nuovo messaggio o aggiornamento messaggio
      const messages = data.data?.messages || [];
      
      for (const msg of messages) {
        try {
          // Estrai i dati del messaggio
          const messageKey = msg.key || {};
          const messageContent = msg.message || {};
          
          // Determina il numero del mittente
          let senderNumber = '';
          let isGroup = false;
          let groupId = '';
          
          // Se è un messaggio di gruppo
          if (messageKey.remoteJid?.includes('@g.us')) {
            isGroup = true;
            groupId = messageKey.remoteJid;
            // Il mittente è nel campo participant
            senderNumber = messageKey.participant?.replace('@s.whatsapp.net', '') || '';
          } else {
            // Messaggio diretto
            senderNumber = messageKey.remoteJid?.replace('@s.whatsapp.net', '') || '';
          }
          
          // Se il messaggio è nostro (fromMe: true), skippa il salvataggio
          if (messageKey.fromMe) {
            logger.info('Messaggio inviato da noi, skip salvataggio');
            continue;
          }
          
          // Estrai il contenuto del messaggio
          let messageText = '';
          let messageType = 'text';
          let mediaUrl = null;
          
          // Controlla diversi tipi di contenuto
          if (messageContent.conversation) {
            messageText = messageContent.conversation;
            messageType = 'text';
          } else if (messageContent.extendedTextMessage?.text) {
            messageText = messageContent.extendedTextMessage.text;
            messageType = 'text';
          } else if (messageContent.imageMessage) {
            messageText = messageContent.imageMessage.caption || '📷 Immagine';
            messageType = 'image';
            mediaUrl = messageContent.imageMessage.url || null;
          } else if (messageContent.documentMessage) {
            const fileName = messageContent.documentMessage.fileName || 'Documento';
            const mimeType = messageContent.documentMessage.mimetype || '';
            messageText = `📄 ${fileName}`;
            messageType = 'document';
            mediaUrl = messageContent.documentMessage.url || null;
          } else if (messageContent.audioMessage) {
            const duration = messageContent.audioMessage.seconds || 0;
            messageText = `🎵 Audio (${duration}s)`;
            messageType = 'audio';
            mediaUrl = messageContent.audioMessage.url || null;
          } else if (messageContent.videoMessage) {
            messageText = messageContent.videoMessage.caption || '🎥 Video';
            messageType = 'video';
            mediaUrl = messageContent.videoMessage.url || null;
          } else if (messageContent.locationMessage) {
            const lat = messageContent.locationMessage.degreesLatitude;
            const lng = messageContent.locationMessage.degreesLongitude;
            messageText = `📍 Posizione: ${lat}, ${lng}`;
            messageType = 'location';
            mediaUrl = `https://maps.google.com/maps?q=${lat},${lng}`;
          } else if (messageContent.contactMessage) {
            const displayName = messageContent.contactMessage.displayName || 'Contatto';
            messageText = `👤 Contatto: ${displayName}`;
            messageType = 'contact';
          } else if (messageContent.stickerMessage) {
            messageText = '🎨 Sticker';
            messageType = 'sticker';
            mediaUrl = messageContent.stickerMessage.url || null;
          } else if (messageContent.reactionMessage) {
            const emoji = messageContent.reactionMessage.text || '👍';
            messageText = `Reazione: ${emoji}`;
            messageType = 'reaction';
          } else if (messageContent.pollCreationMessage) {
            const question = messageContent.pollCreationMessage.name || 'Sondaggio';
            const options = messageContent.pollCreationMessage.options || [];
            messageText = `📊 Sondaggio: ${question}\nOpzioni: ${options.map(o => o.optionName).join(', ')}`;
            messageType = 'poll';
          } else if (messageContent.pollUpdateMessage) {
            messageText = '📊 Voto sondaggio';
            messageType = 'poll_vote';
          } else if (messageContent.buttonsMessage) {
            const text = messageContent.buttonsMessage.contentText || '';
            const buttons = messageContent.buttonsMessage.buttons || [];
            messageText = `${text}\n🔘 ${buttons.length} pulsanti`;
            messageType = 'buttons';
          } else if (messageContent.templateMessage) {
            messageText = '📋 Messaggio template';
            messageType = 'template';
          } else if (messageContent.listMessage) {
            const title = messageContent.listMessage.title || 'Lista';
            messageText = `📋 ${title}`;
            messageType = 'list';
          } else if (messageContent.productMessage) {
            messageText = '🛍️ Prodotto';
            messageType = 'product';
          } else if (messageContent.groupInviteMessage) {
            const groupName = messageContent.groupInviteMessage.groupName || 'Gruppo';
            messageText = `📧 Invito al gruppo: ${groupName}`;
            messageType = 'group_invite';
          } else {
            // Tipo di messaggio non riconosciuto - logga per debug
            logger.warn('Tipo di messaggio non riconosciuto:', JSON.stringify(messageContent));
            messageText = 'Messaggio';
            messageType = 'unknown';
          }
          
          // Prepara i dati per il salvataggio
          const messageData = {
            phoneNumber: senderNumber,
            message: messageText,
            type: messageType,
            status: 'received',
            direction: 'inbound' as const,
            mediaUrl: mediaUrl,
            metadata: {
              messageId: messageKey.id,
              pushName: msg.pushName || null,
              timestamp: msg.messageTimestamp,
              isGroup: isGroup,
              groupId: isGroup ? groupId : null,
              rawData: msg // Salva tutti i dati originali per riferimento
            },
            receivedAt: new Date(),
            createdAt: new Date()
          };
          
          logger.info('Salvando messaggio nel database:', {
            from: senderNumber,
            type: messageType,
            text: messageText.substring(0, 50) + '...',
            isGroup: isGroup
          });
          
          // Salva nel database
          const savedMessage = await prisma.whatsAppMessage.create({
            data: messageData
          });
          
          logger.info(`✅ Messaggio salvato con ID: ${savedMessage.id}`);
          
          // ========== INIZIO INTEGRAZIONE AI DUALE ==========
          // Verifica se il professionista ha configurazione AI Duale
          try {
            const professionalConfig = await prisma.professionalWhatsApp.findFirst({
              where: {
                instanceId: currentConfig?.instanceId,
                status: 'ACTIVE'
              }
            });

            if (professionalConfig && professionalConfig.aiEnabled) {
              logger.info('🤖 AI Duale: Configurazione trovata, processando messaggio...');
              
              try {
                // 1. Detect sender type
                const detection = await dualModeDetector.detectSenderType(
                  senderNumber,
                  currentConfig.instanceId
                );
                
                logger.info(`🤖 AI Duale Detection: ${senderNumber} → ${detection.mode} (confidence: ${detection.confidence})`);
                
                // 2. Determina sottocategoria dal messaggio
                const subcategoryId = await aiDualeHelper.determineSubcategoryFromMessage(messageText);
                
                if (!subcategoryId) {
                  logger.warn('🤖 AI Duale: Impossibile determinare sottocategoria, skip AI response');
                } else {
                  // 3. Get appropriate KB for mode and subcategory
                  const kb = await dualKBService.getKBForMode(
                    detection.mode,
                    professionalConfig.id,
                    subcategoryId
                  );
                  
                  // 4. Prepare AI config based on mode
                  const aiConfig = detection.mode === DetectionMode.PROFESSIONAL
                    ? professionalConfig.aiConfigProfessional
                    : professionalConfig.aiConfigClient;
                  
                  if (!aiConfig) {
                    logger.warn(`🤖 AI Duale: Nessuna configurazione AI per modalità ${detection.mode}`);
                  } else {
                    // 5. Generate AI response
                    const aiResponse = await aiDualeHelper.generateAIResponse({
                      message: messageText,
                      kb: kb,
                      config: aiConfig,
                      context: {
                        isGroup,
                        senderName: msg.pushName || senderNumber,
                        messageType
                      }
                    });
                    
                    // 6. Sanitize response if CLIENT mode
                    const finalResponse = responseSanitizer.sanitizeResponse(
                      aiResponse,
                      detection.mode
                    );
                    
                    // 7. Send response via WhatsApp
                    await sendTextMessage(senderNumber, finalResponse);
                    logger.info(`🤖 AI Duale: Risposta inviata (${detection.mode} mode)`);
                    
                    // 8. Log detection result for analytics
                    await aiDualeHelper.saveDetectionResult({
                      whatsappId: professionalConfig.id,
                      phoneNumber: senderNumber,
                      message: messageText,
                      response: finalResponse,
                      detectedMode: detection.mode,
                      confidence: detection.confidence,
                      detectionFactors: detection.factors
                    });
                    
                    // 9. Salva messaggio di risposta nel database
                    await prisma.whatsAppMessage.create({
                      data: {
                        phoneNumber: senderNumber,
                        message: finalResponse,
                        type: 'text',
                        status: 'sent',
                        direction: 'outbound',
                        sentAt: new Date(),
                        metadata: {
                          isAIResponse: true,
                          aiMode: detection.mode,
                          confidence: detection.confidence,
                          replyToId: savedMessage.id,
                          timestamp: Date.now()
                        }
                      }
                    });
                    
                    logger.info('🤖 AI Duale: Processamento completato con successo');
                  }
                }
                
              } catch (aiError: any) {
                logger.error('🤖 AI Duale: Errore nel processamento:', aiError);
                // Fallback to standard response
                await sendTextMessage(senderNumber, 'Grazie per il tuo messaggio. Ti risponderemo al più presto.');
              }
            } else {
              logger.info('🤖 AI Duale: Non configurato o disabilitato per questa istanza');
            }
          } catch (configError: any) {
            logger.error('🤖 AI Duale: Errore recupero configurazione:', configError);
          }
          // ========== FINE INTEGRAZIONE AI DUALE ==========
          
          // Collega il messaggio a un utente esistente se presente
          let user = null;
          try {
            // Cerca l'utente per numero WhatsApp
            user = await prisma.user.findFirst({
              where: {
                OR: [
                  { whatsappNumber: senderNumber },
                  { phone: senderNumber },
                  { phone: `+${senderNumber}` }
                ]
              }
            });
            
            if (user) {
              logger.info(`📱 Messaggio collegato all'utente: ${user.fullName} (${user.email})`);
              
              // Se l'utente non ha il flag WhatsApp, aggiornalo
              if (!user.isWhatsAppUser) {
                await prisma.user.update({
                  where: { id: user.id },
                  data: { 
                    isWhatsAppUser: true,
                    whatsappNumber: senderNumber
                  }
                });
              }
            } else {
              logger.info(`⚠️ Nessun utente trovato per il numero: ${senderNumber}`);
            }
          } catch (userError: any) {
            logger.error('Errore collegamento utente:', userError);
          }
          
          // Recupera gli admin per le notifiche
          let admins: any[] = [];
          try {
            admins = await prisma.user.findMany({
              where: {
                role: { in: ['ADMIN', 'SUPER_ADMIN'] }
              },
              select: { id: true, email: true, fullName: true }
            });
          } catch (error) {
            logger.error('Errore recupero admin:', error);
          }
          
          // Invia notifica agli admin usando il sistema notifiche centralizzato
          try {
            // Prepara il contenuto del messaggio per la notifica
            const notificationMessage = `${msg.pushName || senderNumber}: "${messageText.substring(0, 100)}${messageText.length > 100 ? '...' : ''}"${
              user ? `\n👤 Utente: ${user.fullName}` : '\n⚠️ Numero non registrato'
            }`;
            
            for (const admin of admins) {
              // Usa il sistema notifiche centralizzato
              await notificationService.sendToUser({
                userId: admin.id,
                type: 'WHATSAPP_MESSAGE',
                title: '📱 Nuovo messaggio WhatsApp',
                message: notificationMessage,
                priority: isGroup ? 'normal' : 'high',
                data: {
                  phoneNumber: senderNumber,
                  messageId: savedMessage.id,
                  isGroup: isGroup,
                  groupId: groupId,
                  userId: user?.id || null,
                  pushName: msg.pushName,
                  messageText: messageText
                },
                channels: ['websocket', 'email'] // Invia sia via WebSocket che Email
              });
              
              logger.info(`📬 Notifica inviata all'admin tramite sistema notifiche: ${admin.fullName}`);
            }
            
            // Log audit per tracciare l'evento
            if (user) {
              logger.info(`📱 Messaggio WhatsApp ricevuto da utente registrato: ${user.fullName} (${senderNumber})`);
            } else {
              logger.info(`📱 Messaggio WhatsApp ricevuto da numero non registrato: ${senderNumber}`);
            }
            
          } catch (notifError: any) {
            logger.error('Errore invio notifiche tramite sistema centralizzato:', notifError);
          }
          
          // Risposta automatica SOLO SE CONFIGURATA (non hardcoded!)
          if (!user && !isGroup && !messageKey.fromMe) {
            try {
              // Controlla se la risposta automatica è abilitata nelle impostazioni
              const autoReplySettings = await prisma.systemSetting.findFirst({
                where: { 
                  key: 'whatsapp_auto_reply_enabled' 
                }
              });
              
              // Se non è esplicitamente abilitata, NON rispondere
              if (autoReplySettings?.value !== 'true') {
                logger.info('Risposta automatica disabilitata');
              } else {
                // Recupera il messaggio di risposta dal database
                const autoReplyMessage = await prisma.systemSetting.findFirst({
                  where: { 
                    key: 'whatsapp_auto_reply_message' 
                  }
                });
                
                if (!autoReplyMessage?.value) {
                  logger.info('Nessun messaggio di risposta automatica configurato');
                } else {
                  // Controlla se abbiamo già inviato una risposta recentemente
                  const recentAutoReply = await prisma.whatsAppMessage.findFirst({
                    where: {
                      phoneNumber: senderNumber,
                      direction: 'outbound',
                      metadata: {
                        path: ['isAutoReply'],
                        equals: true
                      },
                      createdAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Ultime 24 ore
                      }
                    },
                    orderBy: { createdAt: 'desc' }
                  });
                  
                  if (recentAutoReply) {
                    logger.info('Risposta automatica già inviata nelle ultime 24 ore, skip');
                  } else {
                    // Invia risposta automatica
                    await sendTextMessage(senderNumber, autoReplyMessage.value);
                    
                    // Salva la risposta automatica nel database
                    await prisma.whatsAppMessage.create({
                      data: {
                        phoneNumber: senderNumber,
                        message: autoReplyMessage.value,
                        type: 'text',
                        status: 'sent',
                        direction: 'outbound',
                        sentAt: new Date(),
                        metadata: {
                          isAutoReply: true,
                          replyToId: savedMessage.id,
                          timestamp: Date.now()
                        }
                      }
                    });
                    
                    logger.info('Risposta automatica inviata (configurata da admin)');
                  }
                }
              }
            } catch (replyError: any) {
              logger.error('Errore gestione risposta automatica:', replyError);
            }
          }
          
        } catch (msgError: any) {
          logger.error('Errore processamento singolo messaggio:', msgError);
          // Continua con il prossimo messaggio
        }
      }
    } else if (data.event === 'messages.update') {
      // Aggiornamento stato messaggio (consegnato, letto, etc.)
      logger.info('Aggiornamento stato messaggio ricevuto');
      
      const updates = data.data || [];
      for (const update of updates) {
        try {
          const messageId = update.key?.id;
          if (!messageId) continue;
          
          // Cerca il messaggio nel database
          const existingMessage = await prisma.whatsAppMessage.findFirst({
            where: {
              metadata: {
                path: ['messageId'],
                equals: messageId
              }
            }
          });
          
          if (existingMessage) {
            // Aggiorna lo stato del messaggio
            let newStatus = existingMessage.status;
            
            if (update.update?.status === 2) {
              newStatus = 'delivered';
            } else if (update.update?.status === 3) {
              newStatus = 'read';
            }
            
            await prisma.whatsAppMessage.update({
              where: { id: existingMessage.id },
              data: {
                status: newStatus,
                deliveredAt: update.update?.status === 2 ? new Date() : existingMessage.deliveredAt,
                readAt: update.update?.status === 3 ? new Date() : existingMessage.readAt
              }
            });
            
            logger.info(`Stato messaggio ${messageId} aggiornato a: ${newStatus}`);
          }
        } catch (updateError: any) {
          logger.error('Errore aggiornamento stato messaggio:', updateError);
        }
      }
    } else if (data.event === 'connection.update') {
      // Aggiornamento stato connessione
      logger.info('Aggiornamento stato connessione:', data.data);
      
      // Aggiorna lo stato della connessione nel database
      if (data.data?.connection === 'open') {
        await setConnectionStatus(true);
      } else if (data.data?.connection === 'close') {
        await setConnectionStatus(false);
      }
    } else {
      // Altri eventi
      logger.info(`Evento webhook ricevuto: ${data.event}`);
    }
    
    logger.info('=== FINE PROCESSAMENTO MESSAGGIO ===');
    
  } catch (error: any) {
    logger.error('Errore grave nel processamento webhook WhatsApp:', error);
    logger.error('Stack trace:', error.stack);
    // Non rilanciare l'errore per evitare retry infiniti da SendApp
  }
}
