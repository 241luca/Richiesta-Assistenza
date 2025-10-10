import { wppConnectService } from './wppconnect.service';
import logger from '../utils/logger';
import axios from 'axios';
import { prisma } from '../config/database';

export type WhatsAppProvider = 'wppconnect' | 'evolution';

/**
 * WhatsApp Manager Unificato
 * Gestisce sia WPPConnect che Evolution API
 * WPPConnect è il principale, Evolution è il backup
 */
export class WhatsAppManager {
  private activeProvider: WhatsAppProvider = 'wppconnect';
  private evolutionConfig: any = null;
  private evolutionApi: any = null;
  private isEvolutionAvailable: boolean = false;
  
  constructor() {
    logger.info('🎯 WhatsApp Manager inizializzato con WPPConnect come principale');
  }
  
  /**
   * Inizializza entrambi i servizi
   */
  async initialize(): Promise<void> {
    logger.info('🚀 Inizializzazione WhatsApp Manager...');
    
    // 1. Avvia WPPConnect come principale
    try {
      await wppConnectService.initialize();
      this.activeProvider = 'wppconnect';
      logger.info('✅ WPPConnect attivo come provider principale');
    } catch (error) {
      logger.error('❌ Errore avvio WPPConnect:', error);
      logger.info('🔄 Provo con Evolution API...');
      this.activeProvider = 'evolution';
    }
    
    // 2. Carica configurazione Evolution come backup
    await this.loadEvolutionConfig();
    
    // 3. Avvia monitoring per switch automatico
    this.startHealthMonitoring();
  }
  
  /**
   * Carica configurazione Evolution dal database
   */
  private async loadEvolutionConfig(): Promise<void> {
    try {
      const apiKeyRecord = await prisma.apiKey.findFirst({
        where: {
          service: 'whatsapp',
          isActive: true
        }
      });
      
      if (apiKeyRecord) {
        if (apiKeyRecord.key.startsWith('{')) {
          const config = JSON.parse(apiKeyRecord.key);
          this.evolutionConfig = {
            url: config.apiUrl || config.url || 'http://37.27.89.35:8080',
            apiKey: config.apiKey || config.key,
            instance: config.instance || 'assistenza'
          };
        } else {
          this.evolutionConfig = {
            url: 'http://37.27.89.35:8080',
            apiKey: apiKeyRecord.key,
            instance: 'assistenza'
          };
        }
        
        this.evolutionApi = axios.create({
          baseURL: this.evolutionConfig.url,
          headers: {
            'apikey': this.evolutionConfig.apiKey,
            'Content-Type': 'application/json'
          }
        });
        
        this.isEvolutionAvailable = true;
        logger.info('✅ Evolution API configurato come backup');
      }
    } catch (error) {
      logger.warn('⚠️ Evolution API non configurato:', error);
    }
  }
  
  /**
   * Invia messaggio con fallback automatico
   */
  async sendMessage(to: string, text: string): Promise<any> {
    const phoneNumber = to.replace(/\D/g, '');
    
    // Prova prima con il provider attivo
    if (this.activeProvider === 'wppconnect') {
      try {
        logger.info('📤 Invio con WPPConnect...');
        const result = await wppConnectService.sendMessage(phoneNumber, text);
        return { 
          success: true, 
          provider: 'wppconnect', 
          messageId: result.messageId,
          to: phoneNumber 
        };
      } catch (error) {
        logger.error('❌ WPPConnect fallito, provo Evolution...', error);
        this.activeProvider = 'evolution';
      }
    }
    
    // Fallback su Evolution
    if (this.isEvolutionAvailable) {
      try {
        logger.info('📤 Invio con Evolution API...');
        const response = await this.sendViaEvolution(phoneNumber, text);
        return { success: true, provider: 'evolution', data: response };
      } catch (error) {
        logger.error('❌ Anche Evolution fallito:', error);
        
        // Riprova WPPConnect
        this.activeProvider = 'wppconnect';
        try {
          const result = await wppConnectService.sendMessage(phoneNumber, text);
          return { success: true, provider: 'wppconnect-retry', data: result };
        } catch (retryError) {
          throw new Error('Tutti i provider WhatsApp non disponibili');
        }
      }
    }
    
    throw new Error('Nessun provider WhatsApp disponibile');
  }
  
  /**
   * Invia via Evolution API
   */
  private async sendViaEvolution(to: string, text: string): Promise<any> {
    if (!this.evolutionApi || !this.evolutionConfig) {
      throw new Error('Evolution API non configurato');
    }
    
    const response = await this.evolutionApi.post(
      `/message/sendText/${this.evolutionConfig.instance}`,
      {
        number: to,
        text: text
      },
      { timeout: 5000 } // Timeout breve per Evolution
    );
    
    // Salva nel database
    await prisma.whatsAppMessage.create({
      data: {
        messageId: response.data?.key?.id || `evo_${Date.now()}`,
        phoneNumber: to,
        message: text,
        direction: 'outgoing',
        fromMe: true,
        status: 'SENT',
        timestamp: new Date()
      }
    });
    
    return response.data;
  }
  
  /**
   * Health monitoring continuo
   */
  private startHealthMonitoring(): void {
    setInterval(async () => {
      // Check WPPConnect
      const wppStatus = wppConnectService.getConnectionStatus();
      
      // Check Evolution (veloce)
      let evolutionOk = false;
      if (this.evolutionApi) {
        try {
          const response = await this.evolutionApi.get(
            `/instance/connectionState/${this.evolutionConfig.instance}`,
            { timeout: 2000 }
          );
          evolutionOk = response.data?.instance?.state === 'open';
        } catch (error) {
          // Evolution non risponde
        }
      }
      
      // Decidi quale usare
      if (wppStatus.connected && this.activeProvider !== 'wppconnect') {
        logger.info('🔄 Switch a WPPConnect (principale)');
        this.activeProvider = 'wppconnect';
      } else if (!wppStatus.connected && evolutionOk && this.activeProvider !== 'evolution') {
        logger.info('🔄 Switch a Evolution (backup)');
        this.activeProvider = 'evolution';
      }
      
      logger.debug(`📊 Status: WPP=${wppStatus.connected}, Evolution=${evolutionOk}, Active=${this.activeProvider}`);
      
    }, 30000); // Check ogni 30 secondi
  }
  
  /**
   * Ottieni stato sistema
   */
  getSystemStatus(): any {
    const wppStatus = wppConnectService.getConnectionStatus();
    
    return {
      activeProvider: this.activeProvider,
      wppconnect: {
        connected: wppStatus.connected,
        qrCode: wppStatus.qrCode
      },
      evolution: {
        configured: this.isEvolutionAvailable,
        available: this.activeProvider === 'evolution'
      }
    };
  }
  
  /**
   * Disconnetti tutto
   */
  async disconnect(): Promise<void> {
    await wppConnectService.disconnect();
    logger.info('🔌 WhatsApp Manager disconnesso');
  }
}

// Singleton
export const whatsappManager = new WhatsAppManager();
