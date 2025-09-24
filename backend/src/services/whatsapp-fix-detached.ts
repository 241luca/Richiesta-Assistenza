/**
 * Fix per errore "detached frame" in WPPConnect
 * Aggiunge un check della connessione prima di ogni invio
 */

import { wppConnectService } from '../src/services/wppconnect.service';

// Aggiungi questo metodo al servizio WPPConnect per verificare la connessione
async function checkAndReconnect() {
  try {
    // Prova a fare una chiamata semplice per verificare se il client è ancora connesso
    if (wppConnectService.client) {
      await wppConnectService.client.getConnectionState();
      return true;
    }
    return false;
  } catch (error: any) {
    if (error.message?.includes('detached Frame')) {
      console.log('⚠️ Frame detached, reinizializzo...');
      
      // Resetta il client
      wppConnectService.client = null;
      wppConnectService.isConnected = false;
      
      // Reinizializza
      await wppConnectService.initialize();
      
      // Attendi un po'
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      return wppConnectService.isConnected;
    }
    throw error;
  }
}

// PATCH: Modifica il metodo sendMessage per controllare prima
const originalSendMessage = wppConnectService.sendMessage;
wppConnectService.sendMessage = async function(to: string, message: string) {
  try {
    // Controlla connessione prima di inviare
    const isOk = await checkAndReconnect();
    if (!isOk) {
      throw new Error('WhatsApp non connesso, riprova tra qualche secondo');
    }
    
    // Chiama il metodo originale
    return await originalSendMessage.call(this, to, message);
    
  } catch (error: any) {
    if (error.message?.includes('detached Frame')) {
      console.log('🔄 Riprovo dopo reconnect...');
      await checkAndReconnect();
      return await originalSendMessage.call(this, to, message);
    }
    throw error;
  }
};

export { checkAndReconnect };
