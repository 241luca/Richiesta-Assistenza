/**
 * WhatsApp Service Adapter
 * Usa le API Keys dal database invece del .env
 * Supporta solo Evolution API (SendApp rimosso)
 * 
 * @version 4.0.0 - Versione semplificata
 * @date 21 Settembre 2025
 */

import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import crypto from 'crypto';

class WhatsAppAdapterService {
  private evolutionService: any = null;
  private config: any = null;
  private initialized = false;

  constructor() {
    // Inizializzazione differita
  }

  /**
   * Decripta i dati salvati o estrae la configurazione
   */
  private decryptData(encryptedData: string): any {
    try {
      // Caso 1: È già un JSON stringificato
      if (encryptedData.startsWith('{') && encryptedData.endsWith('}')) {
        return JSON.parse(encryptedData);
      }
      
      // Caso 2: È una stringa API key semplice (Evolution)
      if (!encryptedData.includes(':')) {
        // È solo la API key, costruiamo l'oggetto config
        return {
          apiUrl: 'http://37.27.89.35:8080',  // URL di Evolution
          apiKey: encryptedData,  // La stringa è la API key stessa
          webhookUrl: 'http://37.27.89.35:3201/api/whatsapp/webhook'
        };
      }

      // Caso 3: È criptato (vecchio formato)
      const algorithm = 'aes-256-cbc';
      const secretKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
      
      const [ivHex, encrypted] = encryptedData.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      
      const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey.padEnd(32).slice(0, 32)), iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      logger.error('Error decrypting WhatsApp config:', error);
      return null;
    }
  }

  /**
   * Inizializza il servizio leggendo la configurazione dal database
   */
  async initialize() {
    try {
      if (this.initialized) {
        logger.debug('WhatsApp service already initialized');
        return;
      }

      // Recupera la configurazione WhatsApp dal database
      const apiKeyRecord = await prisma.apiKey.findFirst({
        where: {
          service: 'whatsapp',
          isActive: true
        }
      });

      if (!apiKeyRecord) {
        logger.warn('No WhatsApp configuration found in database');
        return;
      }

      // Decripta la configurazione
      this.config = this.decryptData(apiKeyRecord.key);
      
      if (!this.config) {
        logger.error('Failed to decrypt WhatsApp configuration');
        return;
      }

      logger.info('WhatsApp configuration loaded from database');
      logger.info(`Provider: Evolution API (Self-Hosted)`);
      logger.info(`URL: ${this.config.apiUrl}`);

      // Usa il servizio semplificato
      try {
        const { default: evolutionSimpleService } = await import('./evolution-whatsapp-simple.service');
        this.evolutionService = evolutionSimpleService;
        this.initialized = true;
        logger.info('✅ Evolution WhatsApp Service (Simple) initialized successfully');
      } catch (importError) {
        logger.error('Failed to import Evolution service:', importError);
      }
      
    } catch (error) {
      logger.error('Failed to initialize WhatsApp service:', error);
    }
  }

  /**
   * Reinizializza il servizio (utile dopo cambio configurazione)
   */
  async refresh() {
    this.initialized = false;
    await this.initialize();
  }

  /**
   * Ottieni il servizio attivo
   */
  private async getActiveService() {
    if (!this.initialized) {
      await this.initialize();
    }
    
    if (!this.evolutionService) {
      throw new Error('WhatsApp service not initialized. Check API Keys configuration.');
    }
    return this.evolutionService;
  }

  // ===== METODI PUBBLICI =====

  /**
   * Crea o recupera un'istanza WhatsApp
   */
  async createInstance(instanceName?: string) {
    try {
      const service = await this.getActiveService();
      return await service.createInstance(instanceName);
    } catch (error: any) {
      logger.error('Error in createInstance:', error);
      throw error;
    }
  }

  /**
   * Ottieni QR code per collegare WhatsApp
   */
  async getQRCode(instanceName?: string) {
    try {
      const service = await this.getActiveService();
      return await service.getQRCode(instanceName);
    } catch (error: any) {
      logger.error('Error in getQRCode:', error);
      throw error;
    }
  }

  /**
   * Verifica stato connessione
   */
  async checkConnectionStatus(instanceName?: string) {
    try {
      const service = await this.getActiveService();
      return await service.checkConnectionStatus(instanceName);
    } catch (error) {
      logger.error('Error checking connection status:', error);
      return { connected: false, error: error.message };
    }
  }

  /**
   * Invia messaggio
   */
  async sendMessage(to: string, message: string, options?: any) {
    try {
      const service = await this.getActiveService();
      return await service.sendMessage(to, message, options);
    } catch (error: any) {
      logger.error('Error in sendMessage:', error);
      throw error;
    }
  }

  /**
   * Invia media (immagini, documenti, etc.)
   */
  async sendMedia(to: string, mediaUrl: string, type: 'image' | 'document' | 'audio' | 'video', caption?: string) {
    try {
      const service = await this.getActiveService();
      return await service.sendMedia(to, mediaUrl, type, caption);
    } catch (error: any) {
      logger.error('Error in sendMedia:', error);
      throw error;
    }
  }

  /**
   * Ottieni lista chat
   */
  async getChats(instanceName?: string) {
    try {
      const service = await this.getActiveService();
      return await service.getChats(instanceName);
    } catch (error: any) {
      logger.error('Error in getChats:', error);
      return [];
    }
  }

  /**
   * Ottieni messaggi di una chat
   */
  async getChatMessages(chatId: string, limit?: number, instanceName?: string) {
    try {
      const service = await this.getActiveService();
      return await service.getChatMessages(chatId, limit, instanceName);
    } catch (error: any) {
      logger.error('Error in getChatMessages:', error);
      return [];
    }
  }

  /**
   * Crea gruppo WhatsApp
   */
  async createGroup(name: string, participants: string[], instanceName?: string) {
    try {
      const service = await this.getActiveService();
      return await service.createGroup(name, participants, instanceName);
    } catch (error: any) {
      logger.error('Error in createGroup:', error);
      throw error;
    }
  }

  /**
   * Invia messaggio a gruppo
   */
  async sendGroupMessage(groupId: string, message: string, instanceName?: string) {
    try {
      const service = await this.getActiveService();
      return await service.sendGroupMessage(groupId, message, instanceName);
    } catch (error: any) {
      logger.error('Error in sendGroupMessage:', error);
      throw error;
    }
  }

  /**
   * Invia broadcast (messaggio multiplo)
   */
  async sendBroadcast(numbers: string[], message: string, instanceName?: string) {
    try {
      const service = await this.getActiveService();
      return await service.sendBroadcast(numbers, message, instanceName);
    } catch (error: any) {
      logger.error('Error in sendBroadcast:', error);
      throw error;
    }
  }

  /**
   * Verifica se un numero ha WhatsApp
   */
  async checkNumberExists(phoneNumber: string, instanceName?: string) {
    try {
      const service = await this.getActiveService();
      return await service.checkNumberExists(phoneNumber, instanceName);
    } catch (error: any) {
      logger.error('Error in checkNumberExists:', error);
      return { exists: false };
    }
  }

  /**
   * Disconnetti istanza
   */
  async logout(instanceName?: string) {
    try {
      const service = await this.getActiveService();
      return await service.logout(instanceName);
    } catch (error: any) {
      logger.error('Error in logout:', error);
      throw error;
    }
  }

  /**
   * Elimina istanza
   */
  async deleteInstance(instanceName?: string) {
    try {
      const service = await this.getActiveService();
      return await service.deleteInstance(instanceName);
    } catch (error: any) {
      logger.error('Error in deleteInstance:', error);
      throw error;
    }
  }

  /**
   * Gestisci webhook in arrivo
   */
  async handleWebhook(body: any) {
    try {
      const service = await this.getActiveService();
      return await service.handleWebhook(body);
    } catch (error: any) {
      logger.error('Error in handleWebhook:', error);
      return { success: false };
    }
  }

  /**
   * Ottieni informazioni sul provider corrente
   */
  getProviderInfo() {
    if (!this.config) {
      return {
        provider: 'none',
        status: 'not_configured',
        features: []
      };
    }

    return {
      provider: 'evolution',
      status: 'active',
      url: this.config.apiUrl,
      features: [
        'unlimited_messages',
        'groups',
        'broadcast',
        'media',
        'multi_instance',
        'number_check',
        'self_hosted'
      ]
    };
  }
}

// Export singleton
export const whatsappService = new WhatsAppAdapterService();
