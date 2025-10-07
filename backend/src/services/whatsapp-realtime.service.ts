/**
 * WhatsApp Realtime Notification Service
 * Sistema notifiche real-time per messaggi WhatsApp via WebSocket
 * FASE 2 - Funzionalità Complete: Notifiche Real-time
 * 
 * Integrazione con sistema notifiche e WebSocket esistente
 */

import { Server as SocketServer } from 'socket.io';
import { prisma } from '../config/database';
import logger from '../utils/logger';
import { NotificationService } from './notification.service';
import { auditService } from './auditLog.service';
import { Message } from '@wppconnect-team/wppconnect';

const notificationService = new NotificationService();

export interface WhatsAppRealtimeMessage {
  id: string;
  from: string;
  phoneNumber: string;
  message: string;
  timestamp: Date;
  type: string;
  isGroup: boolean;
  senderName?: string;
  media?: {
    type: string;
    url?: string;
    caption?: string;
  };
}

export class WhatsAppRealtimeService {
  private io: SocketServer | null = null;
  private connectedClients: Map<string, string> = new Map(); // userId -> socketId
  
  /**
   * Inizializza il servizio con il server Socket.io esistente
   */
  initialize(io: SocketServer): void {
    this.io = io;
    this.setupSocketHandlers();
    logger.info('🔌 WhatsApp Realtime Service inizializzato');
  }
  
  /**
   * Setup degli handler Socket.io
   */
  private setupSocketHandlers(): void {
    if (!this.io) return;
    
    // Namespace dedicato per WhatsApp
    const whatsappNamespace = this.io.of('/whatsapp');
    
    whatsappNamespace.on('connection', (socket) => {
      logger.info(`🔗 Nuova connessione WhatsApp WebSocket: ${socket.id}`);
      
      // Autentica l'utente
      socket.on('authenticate', async (data) => {
        try {
          const { userId } = data;
          if (userId) {
            this.connectedClients.set(userId, socket.id);
            socket.join(`user:${userId}`);
            
            // Invia messaggi non letti
            await this.sendUnreadMessages(userId, socket);
            
            socket.emit('authenticated', { success: true });
            logger.info(`✅ Utente ${userId} autenticato su WhatsApp WebSocket`);
          }
        } catch (error) {
          logger.error('Errore autenticazione WebSocket:', error);
          socket.emit('authenticated', { success: false });
        }
      });
      
      // Marca messaggio come letto
      socket.on('markAsRead', async (data) => {
        try {
          const { messageId, userId } = data;
          await this.markMessageAsRead(messageId, userId);
        } catch (error) {
          logger.error('Errore mark as read:', error);
        }
      });
      
      // Typing indicator
      socket.on('typing', (data) => {
        const { to, userId } = data;
        socket.to(`user:${to}`).emit('userTyping', {
          from: userId,
          timestamp: new Date()
        });
      });
      
      // Stop typing
      socket.on('stopTyping', (data) => {
        const { to, userId } = data;
        socket.to(`user:${to}`).emit('userStoppedTyping', {
          from: userId
        });
      });
      
      // Disconnessione
      socket.on('disconnect', () => {
        // Rimuovi dalla mappa
        for (const [userId, socketId] of this.connectedClients.entries()) {
          if (socketId === socket.id) {
            this.connectedClients.delete(userId);
            logger.info(`🔌 Utente ${userId} disconnesso da WhatsApp WebSocket`);
            break;
          }
        }
      });
    });
  }
  
  /**
   * Gestisce un messaggio WhatsApp ricevuto
   */
  async handleIncomingMessage(message: Message): Promise<void> {
    try {
      logger.info('📨 Gestione messaggio WhatsApp in arrivo per notifiche real-time');
      
      // Estrai informazioni dal messaggio
      const phoneNumber = message.from.replace('@c.us', '').replace('@g.us', '');
      
      // Salva messaggio completo nel database
      const saved = await this.saveCompleteMessage(message);
      
      // Prepara messaggio per WebSocket
      const realtimeMessage: WhatsAppRealtimeMessage = {
        id: saved.id,
        from: message.from,
        phoneNumber: phoneNumber,
        message: message.body || message.caption || '',
        timestamp: saved.timestamp,
        type: message.type || 'chat',
        isGroup: message.isGroupMsg || false,
        senderName: message.notifyName || message.sender?.pushname || phoneNumber,
        media: message.isMedia ? {
          type: message.type || 'unknown',
          url: message.deprecatedMms3Url,
          caption: message.caption
        } : undefined
      };
      
      // Notifica via WebSocket a tutti gli admin online
      await this.notifyAdminsViaWebSocket(realtimeMessage);
      
      // Crea notifica in-app per tutti gli admin
      await this.createInAppNotification(realtimeMessage);
      
      // Se è un cliente conosciuto, crea/aggiorna ticket
      const client = await this.findClientByPhone(phoneNumber);
      if (client) {
        await this.handleClientMessage(client, saved);
      }
      
      // Log nel sistema audit
      await auditService.log({
        action: 'WHATSAPP_MESSAGE_RECEIVED',
        entityType: 'WhatsAppMessage',
        entityId: saved.id,
        details: {
          from: phoneNumber,
          type: message.type,
          isGroup: message.isGroupMsg
        },
        success: true,
        category: 'SYSTEM'
      });
      
    } catch (error: any) {
      logger.error('❌ Errore gestione messaggio real-time:', error);
    }
  }
  
  /**
   * Salva messaggio completo nel database
   */
  private async saveCompleteMessage(message: Message): Promise<any> {
    try {
      const phoneNumber = message.from.replace('@c.us', '').replace('@g.us', '');
      const timestamp = message.timestamp ? new Date(message.timestamp * 1000) : new Date();
      
      // Prima crea/aggiorna il contatto
      const contact = await prisma.whatsAppContact.upsert({
        where: { phoneNumber },
        update: {
          name: message.notifyName || message.sender?.pushname || phoneNumber,
          pushname: message.sender?.pushname,
          lastMessageAt: timestamp,
          totalMessages: { increment: 1 }
        },
        create: {
          phoneNumber,
          name: message.notifyName || message.sender?.pushname || phoneNumber,
          pushname: message.sender?.pushname,
          isMyContact: false,
          isUser: true,
          firstMessageAt: timestamp,
          lastMessageAt: timestamp,
          totalMessages: 1
        }
      });
      
      // Salva TUTTI i campi del messaggio
      const saved = await prisma.whatsAppMessage.create({
        data: {
          // Campi base
          messageId: message.id || `msg_${Date.now()}`,
          phoneNumber: phoneNumber,
          message: message.body || message.caption || '',
          direction: message.fromMe ? 'outgoing' : 'incoming',
          status: 'RECEIVED',
          senderName: message.notifyName || message.sender?.pushname || phoneNumber,
          timestamp: timestamp,
          
          // Campi dettagliati
          from: message.from,
          to: message.to,
          author: message.author,
          type: message.type || 'chat',
          mimetype: message.mimetype,
          isGroupMsg: message.isGroupMsg || false,
          chatId: message.chatId || message.from,
          quotedMsgId: message.quotedMsgId,
          mentionedIds: message.mentionedJidList ? { list: message.mentionedJidList } : undefined,
          isMedia: message.isMedia || false,
          isNotification: message.isNotification || false,
          isPSA: message.isPSA || false,
          isStarred: message.isStarred || false,
          isForwarded: message.isForwarded || false,
          fromMe: message.fromMe || false,
          hasReaction: false,
          
          // Media fields
          mediaUrl: message.deprecatedMms3Url,
          caption: message.caption,
          filename: message.filename,
          
          // Location fields
          latitude: message.lat,
          longitude: message.lng,
          locationName: message.loc,
          
          // Metadata
          ack: message.ack || 0,
          invis: message.invis || false,
          star: message.star || false,
          broadcast: message.broadcast || false,
          multicast: message.multicast || false,
          
          // Raw data per debug
          rawData: message,
          
          // Collegamenti
          userId: contact.userId,
          contactId: contact.id
        }
      });
      
      logger.info(`💾 Messaggio salvato completamente: ${saved.id}`);
      return saved;
      
    } catch (error: any) {
      logger.error('Errore salvataggio messaggio completo:', error);
      throw error;
    }
  }
  
  /**
   * Notifica admin via WebSocket
   */
  private async notifyAdminsViaWebSocket(message: WhatsAppRealtimeMessage): Promise<void> {
    if (!this.io) return;
    
    try {
      // Trova tutti gli admin online
      const admins = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'SUPER_ADMIN'] },
          isActive: true
        }
      });
      
      const whatsappNamespace = this.io.of('/whatsapp');
      
      for (const admin of admins) {
        // Invia a room specifico dell'admin
        whatsappNamespace.to(`user:${admin.id}`).emit('newMessage', {
          ...message,
          notification: {
            title: `📱 Nuovo messaggio WhatsApp`,
            body: `Da ${message.senderName}: ${message.message.substring(0, 50)}...`,
            icon: 'whatsapp',
            sound: true
          }
        });
        
        logger.info(`📤 Notifica WebSocket inviata ad admin ${admin.id}`);
      }
      
      // Broadcast a tutti i client connessi alla dashboard WhatsApp
      whatsappNamespace.emit('messageUpdate', {
        type: 'new',
        message: message
      });
      
    } catch (error) {
      logger.error('Errore invio notifica WebSocket:', error);
    }
  }
  
  /**
   * Crea notifica in-app
   */
  private async createInAppNotification(message: WhatsAppRealtimeMessage): Promise<void> {
    try {
      // Trova tutti gli admin
      const admins = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'SUPER_ADMIN'] },
          isActive: true
        }
      });
      
      // Crea notifica per ogni admin usando il sistema esistente
      for (const admin of admins) {
        await notificationService.sendToUser(admin.id, {
          title: '📱 Nuovo messaggio WhatsApp',
          message: `${message.senderName}: ${message.message.substring(0, 100)}...`,
          type: 'whatsapp_message',
          priority: message.message.toLowerCase().includes('urgente') ? 'high' : 'medium',
          data: {
            messageId: message.id,
            from: message.phoneNumber,
            timestamp: message.timestamp,
            isGroup: message.isGroup
          }
        });
      }
      
      logger.info(`📨 Notifiche in-app create per ${admins.length} admin`);
      
    } catch (error) {
      logger.error('Errore creazione notifica in-app:', error);
    }
  }
  
  /**
   * Trova cliente dal numero di telefono
   */
  private async findClientByPhone(phoneNumber: string): Promise<any> {
    try {
      // Cerca con diverse varianti del numero
      const variants = [
        phoneNumber,
        phoneNumber.replace('39', ''),
        `+${phoneNumber}`,
        `+39${phoneNumber.replace('39', '')}`
      ];
      
      const user = await prisma.user.findFirst({
        where: {
          phone: { in: variants },
          role: 'CLIENT'
        }
      });
      
      return user;
      
    } catch (error) {
      logger.error('Errore ricerca cliente:', error);
      return null;
    }
  }
  
  /**
   * Gestisce messaggio da cliente conosciuto
   */
  private async handleClientMessage(client: any, message: any): Promise<void> {
    try {
      // Cerca se esiste una richiesta assistenza aperta
      const openRequest = await prisma.assistanceRequest.findFirst({
        where: {
          clientId: client.id,
          status: { in: ['PENDING', 'IN_PROGRESS', 'ASSIGNED'] }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      if (openRequest) {
        // Aggiungi messaggio alla richiesta esistente
        await prisma.requestChatMessage.create({
          data: {
            requestId: openRequest.id,
            senderId: client.id,
            message: message.message,
            metadata: {
              whatsappMessageId: message.id,
              phoneNumber: message.phoneNumber
            }
          }
        });
        
        // Notifica il professionista assegnato
        if (openRequest.professionalId) {
          await notificationService.sendToUser(openRequest.professionalId, {
            title: '💬 Nuovo messaggio dal cliente',
            message: `${client.fullName}: ${message.message.substring(0, 100)}...`,
            type: 'request_message',
            data: {
              requestId: openRequest.id,
              messageId: message.id
            }
          });
        }
        
        logger.info(`📎 Messaggio WhatsApp collegato a richiesta ${openRequest.id}`);
        
      } else {
        // Crea nuova richiesta assistenza se il messaggio sembra una richiesta
        if (this.looksLikeAssistanceRequest(message.message)) {
          const newRequest = await prisma.assistanceRequest.create({
            data: {
              clientId: client.id,
              title: `WhatsApp: ${message.message.substring(0, 50)}...`,
              description: message.message,
              status: 'PENDING',
              priority: this.detectPriority(message.message),
              channel: 'WHATSAPP',
              metadata: {
                whatsappMessageId: message.id,
                phoneNumber: message.phoneNumber
              }
            }
          });
          
          // Notifica admin
          await this.notifyNewRequest(newRequest, client);
          
          logger.info(`🎫 Nuova richiesta assistenza creata da WhatsApp: ${newRequest.id}`);
        }
      }
      
    } catch (error) {
      logger.error('Errore gestione messaggio cliente:', error);
    }
  }
  
  /**
   * Verifica se il messaggio sembra una richiesta di assistenza
   */
  private looksLikeAssistanceRequest(message: string): boolean {
    const keywords = [
      'aiuto', 'problema', 'guasto', 'rotto', 'non funziona',
      'urgente', 'assistenza', 'intervento', 'riparare',
      'venire', 'quando', 'disponibile', 'costo', 'preventivo'
    ];
    
    const lowerMessage = message.toLowerCase();
    return keywords.some(keyword => lowerMessage.includes(keyword));
  }
  
  /**
   * Rileva priorità dal messaggio
   */
  private detectPriority(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('urgente') || lowerMessage.includes('emergenza')) {
      return 'URGENT';
    }
    if (lowerMessage.includes('importante') || lowerMessage.includes('prima possibile')) {
      return 'HIGH';
    }
    if (lowerMessage.includes('quando possibile') || lowerMessage.includes('comodo')) {
      return 'LOW';
    }
    
    return 'MEDIUM';
  }
  
  /**
   * Notifica nuova richiesta
   */
  private async notifyNewRequest(request: any, client: any): Promise<void> {
    try {
      const admins = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'SUPER_ADMIN'] },
          isActive: true
        }
      });
      
      for (const admin of admins) {
        await notificationService.sendToUser(admin.id, {
          title: '🎫 Nuova richiesta da WhatsApp',
          message: `${client.fullName} ha inviato una richiesta via WhatsApp`,
          type: 'new_request',
          priority: request.priority === 'URGENT' ? 'high' : 'medium',
          data: {
            requestId: request.id,
            clientId: client.id,
            channel: 'WHATSAPP'
          }
        });
      }
    } catch (error) {
      logger.error('Errore notifica nuova richiesta:', error);
    }
  }
  
  /**
   * Invia messaggi non letti a un utente appena connesso
   */
  private async sendUnreadMessages(userId: string, socket: any): Promise<void> {
    try {
      // Recupera messaggi non letti degli ultimi 7 giorni
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const unreadMessages = await prisma.whatsAppMessage.findMany({
        where: {
          direction: 'incoming',
          status: { not: 'READ' },
          createdAt: { gte: sevenDaysAgo }
        },
        orderBy: { timestamp: 'desc' },
        take: 50
      });
      
      if (unreadMessages.length > 0) {
        socket.emit('unreadMessages', {
          count: unreadMessages.length,
          messages: unreadMessages.map(m => ({
            id: m.id,
            phoneNumber: m.phoneNumber,
            message: m.message,
            timestamp: m.timestamp,
            type: m.type,
            senderName: m.senderName
          }))
        });
        
        logger.info(`📤 Inviati ${unreadMessages.length} messaggi non letti a utente ${userId}`);
      }
      
    } catch (error) {
      logger.error('Errore invio messaggi non letti:', error);
    }
  }
  
  /**
   * Marca messaggio come letto
   */
  private async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    try {
      await prisma.whatsAppMessage.update({
        where: { id: messageId },
        data: { 
          status: 'READ',
          readAt: new Date(),
          readBy: userId
        }
      });
      
      // Notifica altri client connessi
      if (this.io) {
        const whatsappNamespace = this.io.of('/whatsapp');
        whatsappNamespace.emit('messageRead', {
          messageId,
          readBy: userId,
          timestamp: new Date()
        });
      }
      
      logger.info(`✓ Messaggio ${messageId} marcato come letto da ${userId}`);
      
    } catch (error) {
      logger.error('Errore mark as read:', error);
    }
  }
  
  /**
   * Invia notifica di stato messaggio (sent, delivered, read)
   */
  async notifyMessageStatus(messageId: string, status: string): Promise<void> {
    if (!this.io) return;
    
    try {
      const whatsappNamespace = this.io.of('/whatsapp');
      whatsappNamespace.emit('messageStatusUpdate', {
        messageId,
        status,
        timestamp: new Date()
      });
      
      logger.info(`📊 Status messaggio ${messageId} aggiornato: ${status}`);
      
    } catch (error) {
      logger.error('Errore notifica status messaggio:', error);
    }
  }
}

// Singleton
export const whatsAppRealtimeService = new WhatsAppRealtimeService();
