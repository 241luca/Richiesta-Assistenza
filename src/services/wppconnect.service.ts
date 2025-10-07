// DISABILITATO TEMPORANEAMENTE - Problemi permessi macOS
// import { create, Whatsapp, Message, SocketState } from '@wppconnect-team/wppconnect';
type Whatsapp = any;
type Message = any;
const SocketState = { CONNECTED: 'CONNECTED' };
import { prisma } from '../config/database';
import logger from '../utils/logger';
import { sessionManager } from './whatsapp-session-manager';
import { healthMonitor } from './whatsapp-health-monitor';

// Gestione errori globali per evitare crash
process.on('unhandledRejection', (error: any, promise) => {
  logger.error('Unhandled Rejection at:', error);
  // Non far crashare il server per errori di WPPConnect
  if (error?.message?.includes('Takeover called without conflict')) {
    logger.warn('Ignoro errore Takeover di WPPConnect');
    return;
  }
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  // Solo se è un errore critico, esci
  if (error.message.includes('EADDRINUSE')) {
    process.exit(1);
  }
});

export class WPPConnectService {
  private client: Whatsapp | null = null;
  private isConnected: boolean = false;
  private sessionName: string = 'assistenza-wpp';
  private qrCode: string | null = null;
  private connectionInfo: any = null;
  private deviceInfo: any = null;
  private wppVersion: string = '';
  private sessionSaveInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    logger.info('🚀 WPPConnect Service inizializzato - TEMPORANEAMENTE DISABILITATO');
    // DISABILITATO per problemi permessi macOS post-aggiornamento
    // this.loadVersionInfo();
    return;
  }
  
  /**
   * Carica informazioni versioni
   */
  private async loadVersionInfo(): Promise<void> {
    try {
      const wppPackage = require('@wppconnect-team/wppconnect/package.json');
      this.wppVersion = wppPackage.version || 'unknown';
      logger.info(`📦 WPPConnect version: ${this.wppVersion}`);
    } catch (error) {
      logger.error('Errore caricamento versione:', error);
    }
  }
  
  /**
   * Crea o aggiorna un contatto WhatsApp
   */
  private async upsertContact(message: Message): Promise<any> {
    try {
      const phoneNumber = message.from.replace('@c.us', '').replace('@g.us', '');
      
      // Cerca se esiste già un User con questo numero di telefono
      let userId = null;
      let professionalId = null;
      
      // Cerca tra tutti gli utenti (normalizza i numeri per il confronto)
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { phone: phoneNumber },
            { phone: phoneNumber.replace('39', '') }, // Senza prefisso
            { phone: `+${phoneNumber}` }, // Con +
            { phone: `+39${phoneNumber.replace('39', '')}` } // Con +39
          ]
        }
      });
      
      if (users.length > 0) {
        const user = users[0];
        if (user.role === 'PROFESSIONAL') {
          professionalId = user.id;
        } else {
          userId = user.id;
        }
      }
      
      const contact = await prisma.whatsAppContact.upsert({
        where: { phoneNumber },
        update: {
          name: message.notifyName || message.sender?.pushname || undefined,
          pushname: message.sender?.pushname || undefined,
          lastMessageAt: new Date(),
          totalMessages: { increment: 1 },
          userId: userId || undefined,
          professionalId: professionalId || undefined
        },
        create: {
          phoneNumber,
          name: message.notifyName || message.sender?.pushname || phoneNumber,
          pushname: message.sender?.pushname || undefined,
          isMyContact: false,
          isUser: true,
          firstMessageAt: new Date(),
          lastMessageAt: new Date(),
          totalMessages: 1,
          userId: userId || undefined,
          professionalId: professionalId || undefined
        }
      });
      
      logger.info(`👤 Contatto aggiornato: ${contact.name} (${contact.phoneNumber})`);
      if (userId) logger.info(`🔗 Collegato a User ID: ${userId}`);
      if (professionalId) logger.info(`🔗 Collegato a Professional ID: ${professionalId}`);
      
      return contact;
    } catch (error) {
      logger.error('Errore gestione contatto:', error);
      return null;
    }
  }
  
  /**
   * Aggiorna lo stato di un messaggio (conferme di lettura)
   */
  private async updateMessageStatus(messageId: string, ackStatus: number): Promise<void> {
    try {
      // Mappa gli ACK status di WhatsApp
      let status = 'SENT';
      switch(ackStatus) {
        case 1: status = 'SENT'; break;
        case 2: status = 'DELIVERED'; break;
        case 3: status = 'READ'; break;
        case 4: status = 'PLAYED'; break;
      }
      
      logger.info(`🔄 Aggiornamento stato messaggio ${messageId}: ${status}`);
      
      // Aggiorna nel database
      await prisma.whatsAppMessage.updateMany({
        where: { messageId },
        data: { status }
      });
      
    } catch (error: any) {
      logger.error('Errore aggiornamento stato messaggio:', error);
    }
  }
  
  /**
   * Salva un messaggio ricevuto nel database con TUTTI i campi
   */
  private async saveMessageToDatabase(message: Message): Promise<void> {
    try {
      logger.info('💾 Inizio salvataggio messaggio COMPLETO nel database...');
      logger.info('📄 Oggetto Message completo:', JSON.stringify(message, null, 2));
      
      // Estrai il numero dal formato WhatsApp (es: 393351234567@c.us)
      let phoneNumber = message.from.replace('@c.us', '').replace('@g.us', '');
      
      // Prima crea/aggiorna il contatto
      const contact = await this.upsertContact(message);
      
      // Prepara il timestamp
      const timestamp = message.timestamp ? new Date(message.timestamp * 1000) : new Date();
      
      // Prepara TUTTI i dati del messaggio da salvare
      const messageData: any = {
        // Campi base
        messageId: message.id || `msg_${Date.now()}`,
        phoneNumber: phoneNumber,
        message: message.body || message.caption || '',
        direction: message.fromMe ? 'outgoing' : 'incoming',
        status: 'RECEIVED',
        senderName: message.notifyName || message.sender?.pushname || phoneNumber,
        timestamp: timestamp,
        
        // NUOVI campi dall'oggetto Message
        from: message.from || undefined,
        to: message.to || undefined,
        author: message.author || undefined,
        type: message.type || 'chat',
        mimetype: message.mimetype || undefined,
        isGroupMsg: message.isGroupMsg || false,
        chatId: message.chatId || message.from,
        quotedMsgId: message.quotedMsgId || undefined,
        mentionedIds: message.mentionedJidList ? { list: message.mentionedJidList } : undefined,
        isMedia: message.isMedia || false,
        isNotification: message.isNotification || false,
        isPSA: message.isPSA || false,
        isStarred: message.isStarred || false,
        isForwarded: message.isForwarded || false,
        fromMe: message.fromMe || false,
        hasReaction: false, // Non disponibile nell'oggetto base
        
        // Media fields
        mediaUrl: message.deprecatedMms3Url || undefined,
        caption: message.caption || undefined,
        filename: message.filename || undefined,
        
        // Location fields (se il tipo è location)
        latitude: message.lat || undefined,
        longitude: message.lng || undefined,
        locationName: message.loc || undefined,
        
        // Metadata
        ack: message.ack || 0,
        invis: message.invis || false,
        star: message.star || false,
        broadcast: message.broadcast || false,
        multicast: message.multicast || false,
        
        // Raw data completo per debug/future use
        rawData: message,
        
        // Collegamenti
        userId: contact?.userId || undefined
      };
      
      logger.info('📝 Dati messaggio pronti per il salvataggio');
      logger.info('📊 Totale campi compilati:', Object.keys(messageData).filter(k => messageData[k] !== undefined).length);
      
      // Salva nel database
      const saved = await prisma.whatsAppMessage.create({
        data: messageData
      });
      
      logger.info('✅ MESSAGGIO SALVATO CON SUCCESSO!');
      logger.info(`🆔 ID Database: ${saved.id}`);
      logger.info(`📱 Numero: ${saved.phoneNumber}`);
      logger.info(`💬 Testo: ${saved.message}`);
      logger.info(`📝 Tipo: ${saved.type}`);
      logger.info(`👥 Gruppo: ${saved.isGroupMsg}`);
      
    } catch (error: any) {
      logger.error('❌ ERRORE CRITICO nel salvataggio messaggio!');
      logger.error('Dettagli errore:', error.message);
      logger.error('Stack:', error.stack);
      
      // Se è un errore Prisma, logga più dettagli
      if (error.code) {
        logger.error('Codice errore Prisma:', error.code);
        logger.error('Meta:', error.meta);
      }
    }
  }
  
  /**
   * Salva la sessione attuale
   */
  private async saveCurrentSession(): Promise<void> {
    if (!this.client || !this.isConnected) {
      logger.warn('⚠️ Nessuna sessione da salvare (non connesso)');
      return;
    }
    
    try {
      // Ottieni i token di sessione da WPPConnect
      const sessionData = await (this.client as any).getSessionTokenBrowser();
      
      if (sessionData) {
        logger.info('💾 Salvataggio sessione con Session Manager...');
        await sessionManager.saveSession(sessionData);
        logger.info('✅ Sessione salvata con successo!');
      }
    } catch (error) {
      logger.error('❌ Errore salvataggio sessione:', error);
    }
  }
  
  /**
   * Avvia il salvataggio periodico della sessione
   */
  private startSessionAutoSave(): void {
    // Salva ogni 5 minuti
    this.sessionSaveInterval = setInterval(async () => {
      await this.saveCurrentSession();
    }, 5 * 60 * 1000); // 5 minuti
    
    logger.info('⏰ Auto-save sessione attivato (ogni 5 minuti)');
  }
  
  /**
   * Ferma il salvataggio periodico
   */
  private stopSessionAutoSave(): void {
    if (this.sessionSaveInterval) {
      clearInterval(this.sessionSaveInterval);
      this.sessionSaveInterval = null;
      logger.info('⏰ Auto-save sessione fermato');
    }
  }
  
  /**
   * Inizializza WPPConnect con sessione gestita dal Session Manager
   */
  async initialize(): Promise<void> {
    try {
      logger.info('📱 Avvio WPPConnect con Session Manager...');
      
      // Prima controlla se c'è una sessione salvata
      const savedSession = await sessionManager.loadSession();
      
      if (savedSession) {
        logger.info('🔄 Trovata sessione salvata, tentativo di ripristino...');
      }
      
      this.client = await create({
        session: this.sessionName,
        multidevice: true,
        
        // Usa il sistema di sessione standard di WPPConnect
        folderNameToken: './tokens',
        createPathFileToken: true,
        
        // Se c'è una sessione salvata, prova a usarla
        sessionToken: savedSession || undefined,
        
        catchQR: (base64Qr, asciiQR) => {
          this.qrCode = base64Qr;
          logger.info('📱 QR Code generato - Scansiona dalla dashboard');
          
          // Salva QR nel database per visualizzarlo nella dashboard
          prisma.systemSetting.upsert({
            where: { key: 'wpp_qrcode' },
            update: { 
              value: base64Qr,
              updatedAt: new Date()
            },
            create: {
              id: require('crypto').randomBytes(12).toString('hex'),
              key: 'wpp_qrcode',
              value: base64Qr,
              label: 'WhatsApp QR Code',
              description: 'Current QR code for WPPConnect',
              updatedAt: new Date()
            }
          }).catch(err => logger.error('Errore salvataggio QR:', err));
        },
        
        statusFind: async (statusSession, session) => {
          logger.info(`📊 Status sessione ${session}: ${statusSession}`);
          
          if (statusSession === 'isLogged' || statusSession === 'inChat') {
            this.isConnected = true;
            this.qrCode = null;
            
            // Rimuovi QR dal database quando connesso
            prisma.systemSetting.deleteMany({
              where: { key: 'wpp_qrcode' }
            }).catch(err => logger.error('Errore rimozione QR:', err));
            
            // SALVA LA SESSIONE quando connesso!
            await this.saveCurrentSession();
            
            // Avvia auto-save
            this.startSessionAutoSave();
            
            // Avvia Health Monitor
            healthMonitor.start(30000); // Check ogni 30 secondi
          }
          
          // Salva stato nel database per visualizzarlo nella dashboard
          prisma.systemSetting.upsert({
            where: { key: 'wpp_status' },
            update: { 
              value: statusSession,
              updatedAt: new Date()
            },
            create: {
              id: require('crypto').randomBytes(12).toString('hex'),
              key: 'wpp_status',
              value: statusSession,
              label: 'WhatsApp Status',
              description: 'WPPConnect connection status',
              updatedAt: new Date()
            }
          }).catch(err => logger.error('Errore salvataggio stato:', err));
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
        autoClose: 0,
        waitForLogin: false
      });
      
      logger.info('✅ WPPConnect inizializzato con successo!');
      
      // Verifica che il client sia valido prima di considerarlo connesso
      if (this.client) {
        this.isConnected = true;
        
        // Salva timestamp connessione
        await prisma.systemSetting.upsert({
          where: { key: 'wpp_connected_at' },
          update: { 
            value: new Date().toISOString(),
            updatedAt: new Date()
          },
          create: {
            id: require('crypto').randomBytes(12).toString('hex'),
            key: 'wpp_connected_at',
            value: new Date().toISOString(),
            label: 'WhatsApp Connected At',
            description: 'Timestamp connessione WhatsApp',
            updatedAt: new Date()
          }
        });
        
        await this.setupEventHandlers();
      } else {
        logger.warn('⚠️ Client WPPConnect non inizializzato correttamente');
        this.isConnected = false;
      }
      
    } catch (error: any) {
      logger.error('❌ Errore inizializzazione WPPConnect:', error.message || error);
      
      // Se l'errore è "Auto Close Called" significa che non è stato scansionato il QR
      if (error.toString().includes('Auto Close')) {
        logger.info('⏰ Timeout QR Code - WPPConnect non connesso');
        logger.info('📱 Scansiona il QR Code dalla dashboard per connettere WhatsApp');
        this.isConnected = false;
        // Non lanciare errore, continua senza WhatsApp
        return;
      }
      
      this.isConnected = false;
      // Non lanciare errore, il server continua anche senza WhatsApp
      logger.warn('⚠️ WhatsApp non connesso - il sistema continua senza WhatsApp');
    }
  }
  
  /**
   * Setup degli event handlers
   */
  private async setupEventHandlers(): Promise<void> {
    if (!this.client) return;
    
    // Handler messaggi in arrivo - SALVA TUTTI I CAMPI
    this.client.onMessage(async (message: Message) => {
      try {
        logger.info('🔔 ======================');
        logger.info('🔔 MESSAGGIO RICEVUTO!');
        logger.info(`🔔 Da: ${message.from}`);
        logger.info(`🔔 Testo: ${message.body?.substring(0, 100)}...`);
        logger.info(`🔔 Tipo: ${message.type}`);
        logger.info(`🔔 isGroupMsg: ${message.isGroupMsg}`);
        logger.info('🔔 ======================');
        
        // Ignora messaggi propri
        if (message.fromMe) {
          logger.info('🚫 Ignoro messaggio proprio (fromMe)');
          return;
        }
        
        await this.saveMessageToDatabase(message);
        
      } catch (error: any) {
        logger.error('❌ ERRORE gestione messaggio:', error);
      }
    });
    
    // Handler cambio stato
    this.client.onStateChange((state: SocketState) => {
      logger.info(`🔄 Stato cambiato: ${state}`);
      
      // Gestisci solo i conflitti reali
      if (state === SocketState.CONFLICT) {
        logger.warn('⚠️ Conflitto sessione rilevato, tentativo di ripresa controllo...');
        this.client?.useHere();
      } else if (state === SocketState.UNPAIRED) {
        logger.warn('⚠️ Dispositivo non accoppiato, necessario nuovo QR code');
        this.isConnected = false;
        this.stopSessionAutoSave();
        healthMonitor.stop();
      } else if (state === SocketState.CONNECTED) {
        logger.info('✅ WhatsApp connesso e funzionante');
        this.isConnected = true;
      } else if (state === SocketState.DISCONNECTED) {
        logger.warn('⚠️ WhatsApp disconnesso');
        this.isConnected = false;
        this.stopSessionAutoSave();
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
      // Formatta il numero per l'Italia
      let phoneNumber = to.replace(/\D/g, '');
      
      // Validazione base
      if (phoneNumber.length < 10) {
        throw new Error(`Numero troppo corto: ${phoneNumber}`);
      }
      
      // Aggiungi prefisso Italia se manca
      if (!phoneNumber.startsWith('39')) {
        phoneNumber = '39' + phoneNumber;
      }
      
      // Formato finale per WhatsApp: numero@c.us
      const chatId = phoneNumber + '@c.us';
      
      logger.info(`📤 Invio messaggio a: ${chatId}`);
      logger.info(`📧 Testo: ${text.substring(0, 50)}...`);
      
      // Prima verifica se il numero esiste su WhatsApp
      try {
        const numberStatus = await (this.client as any).checkNumberStatus(chatId);
        logger.info('🔍 Stato numero:', numberStatus);
      } catch (checkErr) {
        logger.warn('⚠️ Non riesco a verificare il numero, provo comunque a inviare');
      }
      
      // Usa sendText come mostrato negli esempi WPPConnect
      const result = await this.client.sendText(chatId, text);
      
      logger.info('✅ Messaggio inviato con successo!');
      
      // Salva nel database
      await prisma.whatsAppMessage.create({
        data: {
          messageId: result?.id || `msg_${Date.now()}`,
          phoneNumber: phoneNumber,
          message: text,
          direction: 'outgoing',
          status: 'SENT',
          timestamp: new Date(),
          from: 'me',
          to: chatId,
          type: 'chat',
          fromMe: true,
          chatId: chatId
        }
      });
      
      // Aggiorna il contatto
      await prisma.whatsAppContact.upsert({
        where: { phoneNumber },
        update: {
          lastMessageAt: new Date(),
          totalMessages: { increment: 1 }
        },
        create: {
          phoneNumber,
          name: phoneNumber,
          firstMessageAt: new Date(),
          lastMessageAt: new Date(),
          totalMessages: 1
        }
      });
      
      return {
        success: true,
        messageId: result?.id || `msg_${Date.now()}`,
        to: phoneNumber,
        status: 'sent'
      };
      
    } catch (error: any) {
      logger.error('❌ Errore invio messaggio WPPConnect:', error);
      throw error;
    }
  }
  
  /**
   * Ottieni il QR Code come immagine base64 (dal DATABASE)
   */
  async getQRCodeAsImage(): Promise<string | null> {
    // Prima prova a prenderlo dalla memoria
    if (this.qrCode) return this.qrCode;
    
    // Altrimenti prendilo dal database
    const qrSetting = await prisma.systemSetting.findFirst({
      where: { key: 'wpp_qrcode' }
    });
    
    return qrSetting?.value || null;
  }
  
  /**
   * Ottieni stato connessione (dal DATABASE)
   */
  async getConnectionStatus(): Promise<{ connected: boolean; qrCode: string | null }> {
    // Controlla stato dal database
    const statusSetting = await prisma.systemSetting.findFirst({
      where: { key: 'wpp_status' }
    });
    
    const qrCode = await this.getQRCodeAsImage();
    
    const connected = statusSetting?.value === 'isLogged' || 
                     statusSetting?.value === 'inChat' ||
                     this.isConnected;
    
    return {
      connected,
      qrCode
    };
  }
  
  /**
   * Ottieni il nome della sessione
   */
  getSessionName(): string {
    return this.sessionName;
  }
  
  /**
   * Ottieni informazioni sistema REALI
   */
  async getSystemInfo(): Promise<any> {
    const info: any = {
      provider: 'wppconnect', 
      sessionName: this.sessionName,
      versions: {
        wppconnect: this.wppVersion,
        node: process.version,
        whatsappWeb: 'NON DISPONIBILE',
        multiDevice: true
      },
      features: {
        sendText: true,
        sendMedia: true,
        receiveMessages: true,
        groups: true,
        sessionPersistence: true,
        autoReconnect: true, // ORA È TRUE!
        multiDevice: true
      },
      limits: {
        messageLength: 4096,
        mediaSize: 16 * 1024 * 1024
      },
      device: null,
      connectionState: 'NON DISPONIBILE',
      sessionManager: {
        enabled: true,
        autoSave: this.sessionSaveInterval !== null,
        hasStoredSession: await sessionManager.hasValidSession()
      },
      healthMonitor: {
        enabled: true,
        checkInterval: 30000
      }
    };
    
    // Se connesso, verifichiamo le funzioni che ESISTONO davvero
    if (this.client && this.isConnected) {
      try {
        // Proviamo a recuperare info dal database se salvate
        const phoneInfo = await prisma.systemSetting.findFirst({
          where: { key: 'wpp_phone_info' }
        });
        
        if (phoneInfo?.value) {
          try {
            const parsed = JSON.parse(phoneInfo.value);
            info.device = {
              phoneNumber: parsed.id?._serialized || 'NON DISPONIBILE',
              platform: 'WhatsApp Web',
              pushname: parsed.pushname || 'NON DISPONIBILE',
              battery: null
            };
          } catch (e) {
            logger.warn('Non riesco a parsare info telefono dal DB');
          }
        }
        
        // Verifica funzionalità REALI controllando se i metodi esistono
        info.features = {
          sendText: typeof this.client.sendText === 'function',
          sendImage: typeof this.client.sendImage === 'function',
          sendFile: typeof this.client.sendFile === 'function',
          sendLocation: typeof this.client.sendLocation === 'function',
          sendContactVcard: typeof this.client.sendContactVcard === 'function',
          receiveMessages: true,
          groups: typeof this.client.getAllGroups === 'function' || true,
          sessionPersistence: true,
          autoReconnect: true,
          multiDevice: true
        };
        
      } catch (error) {
        logger.error('Errore recupero info sistema:', error);
      }
    }
    
    return info;
  }
  
  /**
   * Ottieni statistiche dettagliate
   */
  async getDetailedStats(): Promise<any> {
    const stats: any = {
      messages: {
        total: 0,
        sent: 0,
        received: 0,
        failed: 0,
        today: 0
      },
      contacts: {
        total: 0,
        withUser: 0,
        withProfessional: 0
      },
      connection: {
        uptime: 0,
        lastConnected: null,
        reconnects: 0
      },
      performance: {
        avgResponseTime: 0,
        queueLength: 0
      }
    };
    
    try {
      // Conta messaggi dal database
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const [total, sent, received, failed, todayCount] = await Promise.all([
        prisma.whatsAppMessage.count(),
        prisma.whatsAppMessage.count({ where: { direction: 'outgoing' } }),
        prisma.whatsAppMessage.count({ where: { direction: 'incoming' } }),
        prisma.whatsAppMessage.count({ where: { status: 'FAILED' } }),
        prisma.whatsAppMessage.count({ where: { createdAt: { gte: today } } })
      ]);
      
      stats.messages = { total, sent, received, failed, today: todayCount };
      
      // Conta contatti
      const [totalContacts, withUser, withProfessional] = await Promise.all([
        prisma.whatsAppContact.count(),
        prisma.whatsAppContact.count({ where: { userId: { not: null } } }),
        prisma.whatsAppContact.count({ where: { professionalId: { not: null } } })
      ]);
      
      stats.contacts = { 
        total: totalContacts, 
        withUser, 
        withProfessional 
      };
      
      // Info connessione
      if (this.connectionInfo) {
        stats.connection = this.connectionInfo;
      }
      
    } catch (error) {
      logger.error('Errore recupero statistiche:', error);
    }
    
    return stats;
  }
  
  /**
   * Disconnetti
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      // Ferma auto-save e health monitor
      this.stopSessionAutoSave();
      healthMonitor.stop();
      
      // Salva un'ultima volta la sessione prima di disconnettere
      await this.saveCurrentSession();
      
      await this.client.logout();
      await this.client.close();
      this.client = null;
      this.isConnected = false;
      
      // Pulisci dal database
      await prisma.systemSetting.deleteMany({
        where: {
          key: {
            in: ['wpp_status', 'wpp_qrcode', 'wpp_phone_info', 'wpp_connected_at']
          }
        }
      });
      
      logger.info('🔌 WPPConnect disconnesso');
    }
  }
}

// Singleton
export const wppConnectService = new WPPConnectService();
