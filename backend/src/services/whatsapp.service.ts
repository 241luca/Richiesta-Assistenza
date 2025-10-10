/**
 * WhatsApp Service - SOLO WPPConnect
 * Servizio unificato che usa esclusivamente WPPConnect
 * Tutte le vecchie references a Evolution rimosse
 */

import { wppConnectService } from './wppconnect.service';
import { prisma } from '../config/database';
import logger from '../utils/logger';
import { NotificationService } from './notification.service';

const notificationService = new NotificationService();

/**
 * Inizializza WPPConnect (unico provider)
 */
export async function initializeWhatsApp(): Promise<boolean> {
  try {
    logger.info('🚀 Inizializzazione WhatsApp (WPPConnect only)');
    await wppConnectService.initialize();
    
    // Salva stato nel database
    await prisma.systemSetting.upsert({
      where: { key: 'whatsapp_provider' },
      create: {
        id: 'whatsapp_provider',
        key: 'whatsapp_provider',
        value: 'wppconnect',
        type: 'string',
        label: 'WhatsApp Provider',
        description: 'Provider WhatsApp attivo',
        category: 'whatsapp',
        updatedAt: new Date()
      },
      update: { 
        value: 'wppconnect',
        updatedAt: new Date()
      }
    });
    
    logger.info('✅ WhatsApp inizializzato con WPPConnect');
    return true;
  } catch (error) {
    logger.error('❌ Errore inizializzazione WhatsApp:', error);
    return false;
  }
}

/**
 * Ottieni QR Code per connessione
 */
export async function getQRCode(): Promise<string> {
  try {
    logger.info('📱 Richiesta QR Code WPPConnect');
    
    const status = await wppConnectService.getConnectionStatus();
    
    if (status.connected) {
      throw new Error('WhatsApp già connesso');
    }
    
    if (!status.qrCode) {
      // Forza rigenerazione QR
      await wppConnectService.initialize();
      
      // Attendi generazione
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const newStatus = await wppConnectService.getConnectionStatus();
      if (!newStatus.qrCode) {
        throw new Error('QR Code non disponibile');
      }
      
      return newStatus.qrCode;
    }
    
    return status.qrCode;
  } catch (error: any) {
    logger.error('❌ Errore generazione QR Code:', error);
    throw new Error(`Errore QR Code: ${error.message}`);
  }
}

/**
 * Verifica stato connessione
 */
export async function getConnectionStatus(): Promise<{
  connected: boolean;
  provider: string;
  qrCode?: string;
  message: string;
}> {
  try {
    const status = await wppConnectService.getConnectionStatus();
    
    return {
      connected: status.connected,
      provider: 'wppconnect',
      qrCode: status.qrCode || undefined,
      message: status.connected 
        ? '✅ WhatsApp connesso (WPPConnect)' 
        : '❌ WhatsApp non connesso'
    };
  } catch (error) {
    logger.error('❌ Errore verifica stato:', error);
    return {
      connected: false,
      provider: 'wppconnect',
      message: '❌ Errore verifica stato WhatsApp'
    };
  }
}

/**
 * Invia messaggio di testo
 */
export async function sendMessage(phoneNumber: string, message: string): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    logger.info(`📤 Invio messaggio a ${phoneNumber}`);
    
    // Verifica connessione
    const status = await getConnectionStatus();
    if (!status.connected) {
      throw new Error('WhatsApp non connesso. Scansiona il QR Code prima.');
    }
    
    // Invia tramite WPPConnect
    const result = await wppConnectService.sendMessage(phoneNumber, message);
    
    if (!result.success) {
      throw new Error(result.error || 'Invio fallito');
    }
    
    logger.info(`✅ Messaggio inviato con successo a ${phoneNumber}`);
    
    return {
      success: true,
      messageId: result.messageId
    };
  } catch (error: any) {
    logger.error(`❌ Errore invio messaggio a ${phoneNumber}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Disconnetti WhatsApp
 */
export async function disconnect(): Promise<void> {
  try {
    logger.info('🔌 Disconnessione WhatsApp');
    await wppConnectService.disconnect();
    logger.info('✅ WhatsApp disconnesso');
  } catch (error) {
    logger.error('❌ Errore disconnessione:', error);
    throw error;
  }
}

/**
 * Riconnetti WhatsApp (reset completo)
 */
export async function reconnect(): Promise<boolean> {
  try {
    logger.info('🔄 Riconnessione WhatsApp');
    
    // Disconnetti prima
    await disconnect();
    
    // Attendi un po'
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Reinizializza
    return await initializeWhatsApp();
  } catch (error) {
    logger.error('❌ Errore riconnessione:', error);
    return false;
  }
}

/**
 * Ottieni messaggi non letti
 */
export async function getUnreadMessages(): Promise<any[]> {
  try {
    const messages = await prisma.whatsAppMessage.findMany({
      where: {
        direction: 'incoming',
        status: { not: 'READ' }
      },
      orderBy: { timestamp: 'desc' },
      take: 50
    });
    
    return messages;
  } catch (error) {
    logger.error('❌ Errore recupero messaggi:', error);
    return [];
  }
}

/**
 * Ottieni statistiche WhatsApp
 */
export async function getWhatsAppStats(): Promise<{
  totalMessages: number;
  todayMessages: number;
  connectedSince?: Date;
  provider: string;
}> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [totalMessages, todayMessages] = await Promise.all([
      prisma.whatsAppMessage.count(),
      prisma.whatsAppMessage.count({
        where: { createdAt: { gte: today } }
      })
    ]);
    
    // Cerca quando si è connesso l'ultima volta
    const lastConnection = await prisma.systemSetting.findFirst({
      where: { key: 'wpp_connected_at' }
    });
    
    return {
      totalMessages,
      todayMessages,
      connectedSince: lastConnection ? new Date(lastConnection.value) : undefined,
      provider: 'wppconnect'
    };
  } catch (error) {
    logger.error('❌ Errore recupero statistiche:', error);
    return {
      totalMessages: 0,
      todayMessages: 0,
      provider: 'wppconnect'
    };
  }
}

/**
 * Ottieni tutti i messaggi
 */
export async function getAllMessages(limit: number = 50, offset: number = 0): Promise<any[]> {
  try {
    const messages = await prisma.whatsAppMessage.findMany({
      take: limit,
      skip: offset,
      orderBy: { timestamp: 'desc' },
      include: {
        // conversation: true // Field doesn't exist
      }
    });
    
    return messages;
  } catch (error) {
    logger.error('❌ Errore recupero tutti i messaggi:', error);
    return [];
  }
}
