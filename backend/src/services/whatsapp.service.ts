/**
 * WhatsApp Service - Placeholder
 * WPPConnect rimosso - In attesa di nuovo provider
 * @version 6.2.0
 * @date 21 Dicembre 2025
 */

import { prisma } from '../config/database';
import logger from '../utils/logger';
import { NotificationService } from './notification.service';

const notificationService = new NotificationService();

/**
 * Inizializza WhatsApp (DISABILITATO - In attesa nuovo provider)
 */
export async function initializeWhatsApp(): Promise<boolean> {
  try {
    logger.warn('⚠️ WhatsApp provider non configurato - servizio disabilitato');
    logger.info('ℹ️ Configurare nuovo provider WhatsApp in futuro');
    return false;
  } catch (error: unknown) {
    logger.error('❌ Errore inizializzazione WhatsApp:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Ottieni QR Code per connessione (NON DISPONIBILE)
 */
export async function getQRCode(): Promise<string> {
  throw new Error('WhatsApp provider non configurato. Servizio temporaneamente non disponibile.');
}

/**
 * Verifica stato connessione (NON DISPONIBILE)
 */
export async function getConnectionStatus(): Promise<{
  connected: boolean;
  provider: string;
  qrCode?: string;
  message: string;
}> {
  return {
    connected: false,
    provider: 'none',
    message: '⚠️ WhatsApp provider non configurato'
  };
}

/**
 * Invia messaggio di testo (NON DISPONIBILE)
 */
export async function sendMessage(phoneNumber: string, message: string): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  logger.warn(`⚠️ Tentativo invio messaggio a ${phoneNumber} - servizio non disponibile`);
  return {
    success: false,
    error: 'WhatsApp provider non configurato'
  };
}

/**
 * Disconnetti WhatsApp (NON DISPONIBILE)
 */
export async function disconnect(): Promise<void> {
  logger.warn('⚠️ Disconnessione WhatsApp - servizio non configurato');
}

/**
 * Riconnetti WhatsApp (NON DISPONIBILE)
 */
export async function reconnect(): Promise<boolean> {
  logger.warn('⚠️ Riconnessione WhatsApp - servizio non configurato');
  return false;
}

/**
 * Ottieni messaggi non letti (solo database)
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
  } catch (error: unknown) {
    logger.error('❌ Errore recupero messaggi:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

/**
 * Ottieni statistiche WhatsApp (solo database)
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
    
    return {
      totalMessages,
      todayMessages,
      provider: 'none'
    };
  } catch (error: unknown) {
    logger.error('❌ Errore recupero statistiche:', error instanceof Error ? error.message : String(error));
    return {
      totalMessages: 0,
      todayMessages: 0,
      provider: 'none'
    };
  }
}

/**
 * Ottieni tutti i messaggi (solo database)
 */
export async function getAllMessages(limit: number = 50, offset: number = 0): Promise<any[]> {
  try {
    const messages = await prisma.whatsAppMessage.findMany({
      take: limit,
      skip: offset,
      orderBy: { timestamp: 'desc' }
    });
    
    return messages;
  } catch (error: unknown) {
    logger.error('❌ Errore recupero tutti i messaggi:', error instanceof Error ? error.message : String(error));
    return [];
  }
}
