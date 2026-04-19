/**
 * WhatsApp Manager Service
 * DISABILITATO - WPPConnect rimosso
 * @version 6.2.0
 * @date 21 Dicembre 2025
 */

import logger from '../utils/logger';
import { prisma } from '../config/database';

export type WhatsAppProvider = 'none';

/**
 * WhatsApp Manager - Placeholder
 * In attesa di nuovo provider WhatsApp
 */
export class WhatsAppManager {
  private activeProvider: WhatsAppProvider = 'none';
  
  constructor() {
    logger.warn('⚠️ WhatsApp Manager inizializzato senza provider');
  }
  
  /**
   * Inizializza (DISABILITATO)
   */
  async initialize(): Promise<void> {
    logger.warn('⚠️ WhatsApp Manager disabilitato - provider non configurato');
    logger.info('ℹ️ Configurare nuovo provider WhatsApp in futuro');
  }
  
  /**
   * Invia messaggio (NON DISPONIBILE)
   */
  async sendMessage(to: string, text: string): Promise<any> {
    logger.warn(`⚠️ Tentativo invio messaggio a ${to} - servizio non disponibile`);
    throw new Error('WhatsApp provider non configurato');
  }
  
  /**
   * Ottieni stato sistema
   */
  getSystemStatus(): any {
    return {
      activeProvider: 'none',
      connected: false,
      message: 'Provider WhatsApp non configurato'
    };
  }
  
  /**
   * Disconnetti (NON DISPONIBILE)
   */
  async disconnect(): Promise<void> {
    logger.warn('⚠️ Disconnessione WhatsApp - servizio non configurato');
  }
}

// Singleton
export const whatsappManager = new WhatsAppManager();
