import { create, Whatsapp, Message, SocketState } from '@wppconnect-team/wppconnect';
import { prisma } from '../config/database';
import logger from '../utils/logger';

export class WPPConnectService {
  private client: Whatsapp | null = null;
  private isConnected: boolean = false;
  private sessionName: string = 'assistenza-wpp';
  private qrCode: string | null = null;
  
  constructor() {
    logger.info('🚀 WPPConnect Service inizializzato');
  }
  
  /**
   * Inizializza WPPConnect
   */
  async initialize(): Promise<void> {
    try {
      logger.info('📱 Avvio WPPConnect...');
      
      this.client = await create({
        session: this.sessionName,
        multidevice: true,  // FORZA MULTI-DEVICE!
        folderNameToken: '../tokens', // Salva i token fuori da src
        catchQR: (base64Qr, asciiQR) => {
          this.qrCode = base64Qr;
          logger.info('📱 QR Code generato');
          console.log('QR ASCII:', asciiQR);
        },
        statusFind: (statusSession, session) => {
          logger.info(`📊 Status sessione ${session}: ${statusSession}`);
          
          if (statusSession === 'isLogged' || statusSession === 'inChat') {
            this.isConnected = true;
            this.qrCode = null;
          }
        },
        headless: true,
        devtools: false,
        useChrome: true,
        debug: false,
        logQR: false,
        browserArgs: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ],
        puppeteerOptions: {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        },
        autoClose: 60000,
        createPathFileToken: true,
        waitForLogin: true
      });
      
      logger.info('✅ WPPConnect connesso con successo!');
      this.isConnected = true;
      
      await this.setupEventHandlers();
      
    } catch (error: any) {
      logger.error('❌ Errore inizializzazione WPPConnect:', error);
      this.isConnected = false;
      throw error;
    }
  }
  
  /**
   * Setup degli event handlers
   */
  private async setupEventHandlers(): Promise<void> {
    if (!this.client) return;
    
    // Handler messaggi in arrivo
    this.client.onMessage(async (message: Message) => {
      try {
        logger.info(`📨 Messaggio ricevuto da ${message.from}: ${message.body?.substring(0, 50)}...`);
        
        await this.saveMessageToDatabase(message);
        
      } catch (error: any) {
        logger.error('Errore gestione messaggio:', error);
      }
    });
    
    // Handler cambio stato
    this.client.onStateChange((state: SocketState) => {
      logger.info(`🔄 Stato cambiato: ${state}`);
      
      if (state === SocketState.CONFLICT || state === SocketState.UNPAIRED) {
        logger.warn('⚠️ Conflitto o non accoppiato, provo a riconnettermi...');
        this.client?.useHere();
      }
      
      if (state === SocketState.CONNECTED) {
        this.isConnected = true;
      }
    });
    
    // Handler ACK (conferme lettura)
    this.client.onAck(async (ack) => {
      logger.info(`✓ ACK ricevuto:`, {
        id: ack.id,
        ack: ack.ack
      });
      
      await this.updateMessageStatus(ack.id._serialized, ack.ack);
    });
  }
  
  /**
   * Invia un messaggio di testo
   */
  async sendMessage(to: string, text: string): Promise<any> {
    if (!this.client || !this.isConnected) {
      throw new Error('WPPConnect non connesso');
    }
    
    try {
      // Formatta il numero correttamente per l'Italia
      let cleanNumber = to.replace(/\D/g, ''); // Rimuovi tutto tranne numeri
      
      // Se non inizia con 39, aggiungi il prefisso Italia
      if (!cleanNumber.startsWith('39')) {
        cleanNumber = '39' + cleanNumber;
      }
      
      const formattedNumber = cleanNumber + '@c.us';
      
      logger.info(`📤 Invio messaggio WPPConnect a ${formattedNumber}`);
      logger.info(`📧 Testo: ${text.substring(0, 50)}...`);
      
      // INVIO REALE via WPPConnect
      const result = await this.client.sendText(formattedNumber, text);
      
      logger.info('✅ Risultato invio:', result);
      
      // Salva messaggio inviato nel DB
      await prisma.whatsAppMessage.create({
        data: {
          messageId: result?.id || `msg_${Date.now()}`,
          phoneNumber: cleanNumber,
          message: text,
          direction: 'outgoing',
          status: 'SENT',
          timestamp: new Date()
        }
      });
      
      logger.info('✅ Messaggio salvato nel database');
      
      // Restituisci solo i dati essenziali per evitare circular reference
      return {
        success: true,
        messageId: result?.id || `msg_${Date.now()}`,
        to: formattedNumber,
        status: 'sent'
      };
      
    } catch (error: any) {
      logger.error('❌ Errore invio messaggio WPPConnect:', error);
      throw error;
    }
  }
  
  /**
   * Salva messaggio nel database
   */
  private async saveMessageToDatabase(message: Message): Promise<void> {
    try {
      const phoneNumber = message.from.replace('@c.us', '').replace('@g.us', '');
      
      await prisma.whatsAppMessage.create({
        data: {
          messageId: message.id,
          phoneNumber: phoneNumber,
          message: message.body || '[Media]',
          direction: 'incoming',
          status: 'RECEIVED',
          senderName: message.sender?.pushname || phoneNumber,
          timestamp: new Date(message.timestamp * 1000)
        }
      });
      
      logger.info('💾 Messaggio salvato nel database');
      
    } catch (error: any) {
      logger.error('Errore salvataggio messaggio:', error);
    }
  }
  
  /**
   * Aggiorna stato messaggio
   */
  private async updateMessageStatus(messageId: string, status: number): Promise<void> {
    try {
      let statusText = 'SENT';
      if (status === 2) statusText = 'DELIVERED';
      if (status === 3) statusText = 'READ';
      
      await prisma.whatsAppMessage.updateMany({
        where: { messageId },
        data: { status: statusText }
      });
      
    } catch (error: any) {
      logger.error('Errore aggiornamento stato:', error);
    }
  }
  
  /**
   * Ottieni il QR Code come immagine base64
   */
  getQRCodeAsImage(): string | null {
    return this.qrCode;
  }
  
  /**
   * Ottieni stato connessione
   */
  getConnectionStatus(): { connected: boolean; qrCode: string | null } {
    return {
      connected: this.isConnected,
      qrCode: this.qrCode  // Questo è già in formato data:image/png;base64,...
    };
  }
  
  /**
   * Disconnetti
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.logout();
      await this.client.close();
      this.client = null;
      this.isConnected = false;
      logger.info('🔌 WPPConnect disconnesso');
    }
  }
}

// Singleton
export const wppConnectService = new WPPConnectService();
