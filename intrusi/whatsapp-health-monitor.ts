/**
 * WhatsApp Health Monitor
 * Monitora lo stato della connessione e auto-ripristina se necessario
 */

import { wppConnectService } from './wppconnect.service';
import { sessionManager } from './whatsapp-session-manager';
import logger from '../utils/logger';

class WhatsAppHealthMonitor {
  private checkInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  /**
   * Inizia il monitoraggio
   */
  start(intervalMs: number = 30000): void {
    if (this.checkInterval) {
      logger.warn('Health monitor già attivo');
      return;
    }
    
    logger.info('🏥 Avvio Health Monitor WhatsApp...');
    
    // Check immediato
    this.checkHealth();
    
    // Check periodico
    this.checkInterval = setInterval(() => {
      this.checkHealth();
    }, intervalMs);
  }
  
  /**
   * Ferma il monitoraggio
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      logger.info('🏥 Health Monitor fermato');
    }
  }
  
  /**
   * Controlla lo stato di salute
   */
  private async checkHealth(): Promise<void> {
    try {
      const status = await wppConnectService.getConnectionStatus();
      
      if (!status.connected) {
        logger.warn('⚠️ WhatsApp disconnesso rilevato dal Health Monitor');
        
        // Tenta auto-reconnect
        await this.attemptReconnect();
      } else {
        // Resetta contatore se connesso
        if (this.reconnectAttempts > 0) {
          logger.info('✅ WhatsApp riconnesso con successo');
          this.reconnectAttempts = 0;
        }
        
        // Backup periodico della sessione (ogni 6 ore)
        if (Math.random() < 0.01) { // ~1% chance = circa ogni 6 ore con check ogni 30 sec
          await sessionManager.backupSession();
        }
      }
    } catch (error) {
      logger.error('Errore health check:', error);
    }
  }
  
  /**
   * Tenta riconnessione automatica
   */
  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('❌ Raggiunto limite tentativi riconnessione');
      
      // Invia notifica admin
      this.notifyAdmin('WhatsApp disconnesso dopo 5 tentativi di riconnessione');
      
      return;
    }
    
    this.reconnectAttempts++;
    logger.info(`🔄 Tentativo riconnessione ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
    
    try {
      // Prima controlla se c'è una sessione salvata
      if (await sessionManager.hasValidSession()) {
        await wppConnectService.initialize();
        
        // Verifica se ha funzionato
        await new Promise(resolve => setTimeout(resolve, 5000));
        const status = await wppConnectService.getConnectionStatus();
        
        if (status.connected) {
          logger.info('✅ Riconnessione riuscita!');
          this.reconnectAttempts = 0;
          return;
        }
      }
    } catch (error) {
      logger.error(`Tentativo ${this.reconnectAttempts} fallito:`, error);
    }
    
    // Aspetta prima del prossimo tentativo (backoff esponenziale)
    const waitTime = Math.min(this.reconnectAttempts * 10000, 60000);
    logger.info(`⏳ Prossimo tentativo tra ${waitTime/1000} secondi`);
    
    setTimeout(() => {
      this.checkHealth();
    }, waitTime);
  }
  
  /**
   * Notifica l'admin di problemi
   */
  private notifyAdmin(message: string): void {
    // Implementa notifica via email/SMS/altro
    logger.error(`📨 NOTIFICA ADMIN: ${message}`);
    
    // Se hai un servizio email configurato:
    // emailService.send({
    //   to: process.env.ADMIN_EMAIL,
    //   subject: 'WhatsApp Alert - Sistema Richiesta Assistenza',
    //   body: message
    // });
    
    // Per ora logga solo, ma puoi implementare notifiche reali
    // via email, SMS, Telegram, Slack, etc.
  }
}

export const healthMonitor = new WhatsAppHealthMonitor();
