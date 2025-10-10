/**
 * Servizio per recuperare messaggi da SendApp SENZA webhook
 * Polling sicuro che non espone dati all'esterno
 */

import { getWhatsAppConfig } from './whatsapp-config.service';
import prisma from '../config/database';
import logger from '../utils/logger';
import axios from 'axios';

interface PollingConfig {
  enabled: boolean;
  intervalSeconds: number;
  lastCheck: Date | null;
  isRunning: boolean;
  messagesFound: number;
  errors: number;
}

let pollingInterval: NodeJS.Timeout | null = null;
let pollingConfig: PollingConfig = {
  enabled: false,
  intervalSeconds: 30,
  lastCheck: null,
  isRunning: false,
  messagesFound: 0,
  errors: 0
};

/**
 * Carica configurazione polling dal database
 */
export async function loadPollingConfig() {
  try {
    const config = await prisma.systemConfiguration.findFirst({
      where: { key: 'whatsapp_polling_config' }
    });
    
    if (config?.value) {
      const savedConfig = JSON.parse(config.value);
      pollingConfig = {
        ...pollingConfig,
        ...savedConfig,
        isRunning: false // Reset runtime status
      };
      
      // Se era abilitato, riavvia
      if (savedConfig.enabled) {
        await startMessagePolling(savedConfig.intervalSeconds);
      }
    }
  } catch (error) {
    logger.error('Errore caricamento config polling:', error);
  }
}

/**
 * Salva configurazione polling nel database
 */
async function savePollingConfig() {
  try {
    await prisma.systemConfiguration.upsert({
      where: { key: 'whatsapp_polling_config' },
      update: {
        value: JSON.stringify({
          enabled: pollingConfig.enabled,
          intervalSeconds: pollingConfig.intervalSeconds,
          lastCheck: pollingConfig.lastCheck,
          messagesFound: pollingConfig.messagesFound,
          errors: pollingConfig.errors
        }),
        updatedAt: new Date()
      },
      create: {
        key: 'whatsapp_polling_config',
        value: JSON.stringify(pollingConfig),
        description: 'Configurazione polling messaggi WhatsApp'
      }
    });
  } catch (error) {
    logger.error('Errore salvataggio config polling:', error);
  }
}

/**
 * Avvia il polling per recuperare messaggi
 */
export async function startMessagePolling(intervalSeconds?: number) {
  // Se è già in esecuzione, non fare nulla
  if (pollingInterval && pollingConfig.isRunning) {
    logger.info('⚠️ Polling messaggi già attivo');
    return pollingConfig;
  }
  
  // Aggiorna configurazione
  if (intervalSeconds) {
    pollingConfig.intervalSeconds = intervalSeconds;
  }
  pollingConfig.enabled = true;
  pollingConfig.isRunning = true;
  
  logger.info(`📥 Avvio polling messaggi WhatsApp ogni ${pollingConfig.intervalSeconds} secondi`);
  
  // Esegui subito
  await checkNewMessages();
  
  // Poi ogni X secondi
  pollingInterval = setInterval(async () => {
    if (pollingConfig.enabled) {
      await checkNewMessages();
    }
  }, pollingConfig.intervalSeconds * 1000);
  
  // Salva configurazione
  await savePollingConfig();
  
  return pollingConfig;
}

/**
 * Ferma il polling
 */
export async function stopMessagePolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
  
  pollingConfig.enabled = false;
  pollingConfig.isRunning = false;
  
  logger.info('⏹️ Polling messaggi fermato');
  
  // Salva configurazione
  await savePollingConfig();
  
  return pollingConfig;
}

/**
 * Aggiorna intervallo polling
 */
export async function updatePollingInterval(seconds: number) {
  if (seconds < 10) {
    throw new Error('Intervallo minimo: 10 secondi');
  }
  if (seconds > 3600) {
    throw new Error('Intervallo massimo: 1 ora (3600 secondi)');
  }
  
  const wasRunning = pollingConfig.isRunning;
  
  // Ferma se attivo
  if (wasRunning) {
    await stopMessagePolling();
  }
  
  // Aggiorna intervallo
  pollingConfig.intervalSeconds = seconds;
  
  // Riavvia se era attivo
  if (wasRunning) {
    await startMessagePolling(seconds);
  }
  
  logger.info(`⏱️ Intervallo polling aggiornato a ${seconds} secondi`);
  
  return pollingConfig;
}

/**
 * Controlla se ci sono nuovi messaggi
 */
export async function checkNewMessages() {
  try {
    pollingConfig.lastCheck = new Date();
    
    const config = await getWhatsAppConfig();
    if (!config || !config.accessToken || !config.isActive) {
      logger.warn('⚠️ WhatsApp non configurato o non attivo');
      return { checked: false, reason: 'WhatsApp not configured' };
    }
    
    // Recupera Instance ID SOLO da ApiKey.permissions (il campo che ESISTE)
    const whatsappApiKey = await prisma.apiKey.findFirst({
      where: { 
        service: 'WHATSAPP',
        isActive: true 
      }
    });
    
    // L'Instance ID è nel campo permissions
    let instanceId: string | null = null;
    
    if (whatsappApiKey?.permissions && typeof whatsappApiKey.permissions === 'object') {
      const permissions = whatsappApiKey.permissions as any;
      instanceId = permissions.instanceId || permissions.instance_id || null;
    }
    
    if (!instanceId) {
      logger.warn('⚠️ Instance ID non trovato in ApiKey.permissions. Deve essere configurato nella pagina API Keys.');
      return { checked: false, reason: 'Instance ID not configured in ApiKey.permissions' };
    }
    
    logger.info(`📱 Instance ID: ${instanceId}`);
    
    // Recupera ultimo messaggio per sapere da quando controllare
    const lastMessage = await prisma.whatsAppMessage.findFirst({
      where: { direction: 'inbound' },
      orderBy: { receivedAt: 'desc' }
    });
    
    const since = lastMessage?.receivedAt || new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: ultime 24 ore
    
    logger.info(`🔍 Controllo messaggi da ${since.toLocaleString('it-IT')}`);
    
    let response: any = { data: { messages: [] } };
    
    // Chiama API SendApp per recuperare messaggi
    // Usando l'endpoint corretto di SendApp
    logger.info(`📡 Chiamata API SendApp per recuperare messaggi...`);
    
    try {
      // Prima proviamo a recuperare i chat
      const chatsResponse = await axios.get(`${config.baseURL}/chats/list`, {
        params: {
          instanceId: instanceId
        },
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      logger.info(`📋 Trovate ${chatsResponse.data?.length || 0} chat`);
      
      // Per ogni chat, recuperiamo i messaggi recenti
      let allMessages = [];
      
      if (chatsResponse.data && Array.isArray(chatsResponse.data)) {
        for (const chat of chatsResponse.data.slice(0, 10)) { // Limitiamo a 10 chat per non sovraccaricare
          try {
            const messagesResponse = await axios.get(`${config.baseURL}/messages/list`, {
              params: {
                instanceId: instanceId,
                chatId: chat.id || chat.chatId,
                limit: 20
              },
              headers: {
                'Authorization': `Bearer ${config.accessToken}`,
                'Content-Type': 'application/json'
              },
              timeout: 5000
            });
            
            if (messagesResponse.data?.messages) {
              allMessages = allMessages.concat(messagesResponse.data.messages);
            }
          } catch (err) {
            logger.warn(`⚠️ Errore recupero messaggi per chat ${chat.id}:`, err.message);
          }
        }
      }
      
      // Se non funziona, proviamo endpoint alternativo
      if (allMessages.length === 0) {
        logger.info(`🔄 Tentativo con endpoint alternativo...`);
        const altResponse = await axios.post(`${config.baseURL}/message/list`, {
          instanceId: instanceId
        }, {
          headers: {
            'Authorization': `Bearer ${config.accessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });
        
        if (altResponse.data) {
          allMessages = altResponse.data.messages || altResponse.data || [];
        }
      }
      
      response = { data: { messages: allMessages } };
      logger.info(`📨 Recuperati ${allMessages.length} messaggi totali`);
    } catch (apiError: any) {
      logger.error('❌ Errore chiamata API SendApp:', apiError.message);
      // Continuiamo con array vuoto
      response = { data: { messages: [] } };
    }
    
    let newMessages = 0;
    
    if (response.data?.messages && Array.isArray(response.data.messages)) {
      logger.info(`📨 Trovati ${response.data.messages.length} messaggi da verificare`);
      
      for (const msg of response.data.messages) {
        const saved = await saveIncomingMessage(msg);
        if (saved) newMessages++;
      }
      
      pollingConfig.messagesFound += newMessages;
      
      if (newMessages > 0) {
        logger.info(`✅ Salvati ${newMessages} nuovi messaggi`);
      }
    }
    
    // Salva configurazione aggiornata
    await savePollingConfig();
    
    return {
      checked: true,
      newMessages,
      totalChecked: response.data?.messages?.length || 0,
      lastCheck: pollingConfig.lastCheck
    };
    
  } catch (error: any) {
    pollingConfig.errors++;
    
    // Non loggare come errore se è solo un 404 (nessun messaggio)
    if (error.response?.status === 404) {
      logger.info('📭 Nessun nuovo messaggio');
      return { checked: true, newMessages: 0 };
    }
    
    logger.error('❌ Errore polling messaggi:', error.message);
    
    // Salva errore
    await savePollingConfig();
    
    return {
      checked: false,
      error: error.message
    };
  }
}

/**
 * Salva un messaggio in arrivo nel database
 */
async function saveIncomingMessage(msgData: any): Promise<boolean> {
  try {
    // Controlla se il messaggio esiste già
    const messageId = msgData.message_id || msgData.id || `${msgData.from}_${msgData.timestamp}`;
    
    const existing = await prisma.whatsAppMessage.findFirst({
      where: {
        OR: [
          {
            metadata: {
              path: ['messageId'],
              equals: messageId
            }
          },
          {
            AND: [
              { phoneNumber: msgData.from || msgData.phone },
              { message: msgData.message || msgData.text },
              {
                receivedAt: {
                  gte: new Date(new Date(msgData.timestamp).getTime() - 1000),
                  lte: new Date(new Date(msgData.timestamp).getTime() + 1000)
                }
              }
            ]
          }
        ]
      }
    });
    
    if (existing) {
      return false; // Messaggio già salvato
    }
    
    // Salva nuovo messaggio
    await prisma.whatsAppMessage.create({
      data: {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        phoneNumber: msgData.from || msgData.phone || 'unknown',
        message: msgData.message || msgData.text || '',
        type: msgData.type || msgData.message_type || 'text',
        status: 'received',
        direction: 'inbound',
        mediaUrl: msgData.media_url || msgData.media,
        receivedAt: msgData.timestamp ? new Date(msgData.timestamp) : new Date(),
        sentAt: msgData.sent_at ? new Date(msgData.sent_at) : (msgData.timestamp ? new Date(msgData.timestamp) : new Date()),
        metadata: {
          messageId: messageId,
          pushname: msgData.pushname || msgData.name,
          raw: msgData
        }
      }
    });
    
    logger.info(`✅ Nuovo messaggio salvato da ${msgData.from || msgData.phone}`);
    
    // TODO: Invia notifica real-time via WebSocket
    // const io = getIO();
    // io.emit('new_whatsapp_message', {
    //   from: msgData.from,
    //   message: msgData.message,
    //   timestamp: msgData.timestamp
    // });
    
    return true;
    
  } catch (error: any) {
    logger.error('❌ Errore salvataggio messaggio:', error);
    return false;
  }
}

/**
 * Ottieni stato del polling
 */
export function getStatus(): PollingConfig {
  return { ...pollingConfig };
}

// Inizializza al caricamento del modulo
loadPollingConfig().catch(error => {
  logger.error('Errore inizializzazione polling:', error);
});

// Esporta le funzioni
export const whatsappPolling = {
  start: startMessagePolling,
  stop: stopMessagePolling,
  updateInterval: updatePollingInterval,
  checkNow: checkNewMessages,
  getStatus: getStatus,
  loadConfig: loadPollingConfig
};