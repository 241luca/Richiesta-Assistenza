/**
 * WhatsApp Health Monitor
 * DISABILITATO - WPPConnect rimosso
 * @version 6.2.0
 */

import logger from '../utils/logger';

class WhatsAppHealthMonitor {
  private checkInterval: NodeJS.Timeout | null = null;
  
  /**
   * Inizia il monitoraggio (DISABILITATO)
   */
  start(intervalMs: number = 30000): void {
    logger.warn('⚠️ WhatsApp Health Monitor disabilitato - provider non configurato');
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
}

export const healthMonitor = new WhatsAppHealthMonitor();
