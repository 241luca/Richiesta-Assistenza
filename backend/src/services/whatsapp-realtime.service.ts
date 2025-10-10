/**
 * WhatsApp Realtime Notification Service
 * Sistema notifiche real-time per messaggi WhatsApp via WebSocket
 * FASE 2 - Funzionalità Complete: Notifiche Real-time
 * 
 * VERSIONE CORRETTA: TypeScript Strict Mode
 * Data: 08/10/2025
 * 
 * Integrazione con sistema notifiche e WebSocket esistente
 */

import { Server as SocketServer, Socket } from 'socket.io';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { NotificationService } from './notification.service';
import { auditLogService } from './auditLog.service';
import { Message } from '@wppconnect-team/wppconnect';
import { Prisma } from '@prisma/client';

const notificationService = new NotificationService();

// ==================== INTERFACCE ====================

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

interface AuthenticateData {
  userId: string;
}

interface MarkAsReadData {
  messageId: string;
  userId: string;
}

interface TypingData {
  to: string;
  userId: string;
}

interface UserRecord {
  id: string;
  role: string;
  fullName?: string;
  fiscalCode?: string;
  address?: string;
  phone: string;
  email: string;
}

interface RequestRecord {
  id: string;
  clientId: string;
  professionalId: string | null;
  status: string;
  priority: string;
  createdAt: Date;
}

interface SavedMessage {
  id: string;
  phoneNumber: string;
  message: string;
  timestamp: Date;
  type: string | null;
  senderName: string | null;
}

interface NotificationData {
  title: string;
  message: string;
  type: string;
  priority?: string;
  data?: Record<string, unknown>;
}

// ==================== SERVICE CLASS ====================

export class WhatsAppRealtimeService {
  private io: SocketServer | null = null;
  private connectedClients: Map<string, string> = new Map();

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

    const whatsappNamespace = this.io.of('/whatsapp');

    whatsappNamespace.on('connection', (socket: Socket) => {
      logger.info(`🔗 Nuova connessione WhatsApp WebSocket: ${socket.id}`);

      socket.on('authenticate', async (data: AuthenticateData) => {
        try {
          const { userId } = data;
          if (userId) {
            this.connectedClients.set(userId, socket.id);
            socket.join(`user:${userId}`);

            await this.sendUnreadMessages(userId, socket);

            socket.emit('authenticated', { success: true });
            logger.info(
              `✅ Utente ${userId} autenticato su WhatsApp WebSocket`
            );
          }
        } catch (error) {
          logger.error('Errore autenticazione WebSocket:', error);
          socket.emit('authenticated', { success: false });
        }
      });

      socket.on('markAsRead', async (data: MarkAsReadData) => {
        try {
          const { messageId, userId } = data;
          await this.markMessageAsRead(messageId, userId);
        } catch (error) {
          logger.error('Errore mark as read:', error);
        }
      });

      socket.on('typing', (data: TypingData) => {
        const { to, userId } = data;
        socket.to(`user:${to}`).emit('userTyping', {
          from: userId,
          timestamp: new Date(),
        });
      });

      socket.on('stopTyping', (data: TypingData) => {
        const { to, userId } = data;
        socket.to(`user:${to}`).emit('userStoppedTyping', {
          from: userId,
        });
      });

      socket.on('disconnect', () => {
        for (const [userId, socketId] of this.connectedClients.entries()) {
          if (socketId === socket.id) {
            this.connectedClients.delete(userId);
            logger.info(
              `🔌 Utente ${userId} disconnesso da WhatsApp WebSocket`
            );
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
      logger.info(
        '📨 Gestione messaggio WhatsApp in arrivo per notifiche real-time'
      );

      const phoneNumber = message.from
        .replace('@c.us', '')
        .replace('@g.us', '');

      const saved = await this.saveCompleteMessage(message);

      const realtimeMessage: WhatsAppRealtimeMessage = {
        id: saved.id,
        from: message.from,
        phoneNumber: phoneNumber,
        message: message.body || message.caption || '',
        timestamp: saved.timestamp,
        type: message.type || 'chat',
        isGroup: message.isGroupMsg || false,
        senderName:
          message.notifyName || message.sender?.pushname || phoneNumber,
        media: message.isMedia
          ? {
              type: message.type || 'unknown',
              url: message.deprecatedMms3Url,
              caption: message.caption,
            }
          : undefined,
      };

      await this.notifyAdminsViaWebSocket(realtimeMessage);
      await this.createInAppNotification(realtimeMessage);

      const client = await this.findClientByPhone(phoneNumber);
      if (client) {
        await this.handleClientMessage(client, saved);
      }

      await auditLogService.log({
        action: 'WHATSAPP_MESSAGE_RECEIVED',
        entityType: 'WhatsAppMessage',
        entityId: saved.id,
        details: {
          from: phoneNumber,
          type: message.type,
          isGroup: message.isGroupMsg,
        },
        success: true,
        category: 'SYSTEM',
      });
    } catch (error) {
      logger.error('❌ Errore gestione messaggio real-time:', error);
    }
  }

  /**
   * Salva messaggio completo nel database
   */
  private async saveCompleteMessage(message: Message): Promise<SavedMessage> {
    try {
      const phoneNumber = message.from
        .replace('@c.us', '')
        .replace('@g.us', '');
      const timestamp = message.timestamp
        ? new Date(message.timestamp * 1000)
        : new Date();

      const contact = await prisma.whatsAppContact.upsert({
        where: { phoneNumber },
        update: {
          name: message.notifyName || message.sender?.pushname || phoneNumber,
          pushname: message.sender?.pushname,
          lastMessageAt: timestamp,
          totalMessages: { increment: 1 },
        },
        create: {
          id: `wac_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          phoneNumber,
          name: message.notifyName || message.sender?.pushname || phoneNumber,
          pushname: message.sender?.pushname,
          isMyContact: false,
          isUser: true,
          firstMessageAt: timestamp,
          lastMessageAt: timestamp,
          totalMessages: 1,
          updatedAt: timestamp,
        },
      });

      const saved = await prisma.whatsAppMessage.create({
        data: {
          messageId: message.id || `msg_${Date.now()}`,
          phoneNumber: phoneNumber,
          message: message.body || message.caption || '',
          direction: message.fromMe ? 'outgoing' : 'incoming',
          status: 'RECEIVED',
          senderName:
            message.notifyName || message.sender?.pushname || phoneNumber,
          timestamp: timestamp,

          from: message.from,
          to: message.to,
          author: message.author,
          type: message.type || 'chat',
          mimetype: message.mimetype,
          isGroupMsg: message.isGroupMsg || false,
          chatId: (message.chatId || message.from) as string,
          quotedMsgId: message.quotedMsgId,
          mentionedIds: message.mentionedJidList
            ? ({ list: message.mentionedJidList } as Prisma.InputJsonValue)
            : undefined,
          isMedia: message.isMedia || false,
          isNotification: message.isNotification || false,
          isPSA: message.isPSA || false,
          isStarred: (message as any).isStarred || false,
          isForwarded: message.isForwarded || false,
          fromMe: message.fromMe || false,
          hasReaction: false,

          mediaUrl: message.deprecatedMms3Url,
          caption: message.caption,
          filename: (message as any).filename,

          latitude: (message as any).lat,
          longitude: (message as any).lng,
          locationName: (message as any).loc,

          ack: message.ack || 0,
          invis: message.invis || false,
          star: message.star || false,
          broadcast: message.broadcast || false,
          multicast: (message as any).multicast || false,

          rawData: message as Prisma.InputJsonValue,

          userId: contact.userId,
          contactId: contact.id,
        },
      });

      logger.info(`💾 Messaggio salvato completamente: ${saved.id}`);
      return saved as SavedMessage;
    } catch (error) {
      logger.error('Errore salvataggio messaggio completo:', error);
      throw error;
    }
  }

  /**
   * Notifica admin via WebSocket
   */
  private async notifyAdminsViaWebSocket(
    message: WhatsAppRealtimeMessage
  ): Promise<void> {
    if (!this.io) return;

    try {
      const admins = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'SUPER_ADMIN'] },
        },
      });

      const whatsappNamespace = this.io.of('/whatsapp');

      for (const admin of admins) {
        whatsappNamespace.to(`user:${admin.id}`).emit('newMessage', {
          ...message,
          notification: {
            title: `📱 Nuovo messaggio WhatsApp`,
            body: `Da ${message.senderName}: ${message.message.substring(
              0,
              50
            )}...`,
            icon: 'whatsapp',
            sound: true,
          },
        });

        logger.info(`📤 Notifica WebSocket inviata ad admin ${admin.id}`);
      }

      whatsappNamespace.emit('messageUpdate', {
        type: 'new',
        message: message,
      });
    } catch (error) {
      logger.error('Errore invio notifica WebSocket:', error);
    }
  }

  /**
   * Crea notifica in-app
   */
  private async createInAppNotification(
    message: WhatsAppRealtimeMessage
  ): Promise<void> {
    try {
      const admins = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'SUPER_ADMIN'] },
        },
      });

      for (const admin of admins) {
        await notificationService.sendToUser({
          userId: admin.id,
          title: '📱 Nuovo messaggio WhatsApp',
          message: `${message.senderName}: ${message.message.substring(
            0,
            100
          )}...`,
          type: 'whatsapp_message',
          priority: message.message.toLowerCase().includes('urgente')
            ? 'high'
            : 'medium',
          data: {
            messageId: message.id,
            from: message.phoneNumber,
            timestamp: message.timestamp,
            isGroup: message.isGroup,
          },
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
  private async findClientByPhone(
    phoneNumber: string
  ): Promise<UserRecord | null> {
    try {
      const variants = [
        phoneNumber,
        phoneNumber.replace('39', ''),
        `+${phoneNumber}`,
        `+39${phoneNumber.replace('39', '')}`,
      ];

      const user = await prisma.user.findFirst({
        where: {
          phone: { in: variants },
          role: 'CLIENT',
        },
      });

      return user as UserRecord | null;
    } catch (error) {
      logger.error('Errore ricerca cliente:', error);
      return null;
    }
  }

  /**
   * Gestisce messaggio da cliente conosciuto
   */
  private async handleClientMessage(
    client: UserRecord,
    message: SavedMessage
  ): Promise<void> {
    try {
      const openRequest = await prisma.assistanceRequest.findFirst({
        where: {
          clientId: client.id,
          status: { in: ['PENDING', 'IN_PROGRESS', 'ASSIGNED'] },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (openRequest) {
        await prisma.requestChatMessage.create({
          data: {
            requestId: openRequest.id,
            userId: client.id,
            message: message.message,
            metadata: {
              whatsappMessageId: message.id,
              phoneNumber: message.phoneNumber,
            } as Prisma.InputJsonValue,
          },
        });

        if (openRequest.professionalId) {
          await notificationService.sendToUser({
            userId: openRequest.professionalId,
            title: '💬 Nuovo messaggio dal cliente',
            message: `${client.fullName}: ${message.message.substring(
              0,
              100
            )}...`,
            type: 'request_message',
            data: {
              requestId: openRequest.id,
              messageId: message.id,
            },
          });
        }

        logger.info(
          `📎 Messaggio WhatsApp collegato a richiesta ${openRequest.id}`
        );
      } else {
        if (this.looksLikeAssistanceRequest(message.message)) {
          const newRequest = await prisma.assistanceRequest.create({
            data: {
              clientId: client.id,
              title: `WhatsApp: ${message.message.substring(0, 50)}...`,
              description: message.message,
              status: 'PENDING',
              priority: this.detectPriority(message.message) as any,
              channel: 'WHATSAPP',
              metadata: {
                whatsappMessageId: message.id,
                phoneNumber: message.phoneNumber,
              } as Prisma.InputJsonValue,
            },
          });

          await this.notifyNewRequest(newRequest, client);

          logger.info(
            `🎫 Nuova richiesta assistenza creata da WhatsApp: ${newRequest.id}`
          );
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
      'aiuto',
      'problema',
      'guasto',
      'rotto',
      'non funziona',
      'urgente',
      'assistenza',
      'intervento',
      'riparare',
      'venire',
      'quando',
      'disponibile',
      'costo',
      'preventivo',
    ];

    const lowerMessage = message.toLowerCase();
    return keywords.some((keyword) => lowerMessage.includes(keyword));
  }

  /**
   * Rileva priorità dal messaggio
   */
  private detectPriority(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (
      lowerMessage.includes('urgente') ||
      lowerMessage.includes('emergenza')
    ) {
      return 'URGENT';
    }
    if (
      lowerMessage.includes('importante') ||
      lowerMessage.includes('prima possibile')
    ) {
      return 'HIGH';
    }
    if (
      lowerMessage.includes('quando possibile') ||
      lowerMessage.includes('comodo')
    ) {
      return 'LOW';
    }

    return 'MEDIUM';
  }

  /**
   * Notifica nuova richiesta
   */
  private async notifyNewRequest(
    request: RequestRecord,
    client: UserRecord
  ): Promise<void> {
    try {
      const admins = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'SUPER_ADMIN'] },
        },
      });

      for (const admin of admins) {
        await notificationService.sendToUser({
          userId: admin.id,
          title: '🎫 Nuova richiesta da WhatsApp',
          message: `${client.fullName} ha inviato una richiesta via WhatsApp`,
          type: 'new_request',
          priority: request.priority === 'URGENT' ? 'high' : 'medium',
          data: {
            requestId: request.id,
            clientId: client.id,
            channel: 'WHATSAPP',
          },
        });
      }
    } catch (error) {
      logger.error('Errore notifica nuova richiesta:', error);
    }
  }

  /**
   * Invia messaggi non letti a un utente appena connesso
   */
  private async sendUnreadMessages(
    userId: string,
    socket: Socket
  ): Promise<void> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const unreadMessages = await prisma.whatsAppMessage.findMany({
        where: {
          direction: 'incoming',
          status: { not: 'READ' },
          createdAt: { gte: sevenDaysAgo },
        },
        orderBy: { timestamp: 'desc' },
        take: 50,
      });

      if (unreadMessages.length > 0) {
        socket.emit('unreadMessages', {
          count: unreadMessages.length,
          messages: unreadMessages.map((m) => ({
            id: m.id,
            phoneNumber: m.phoneNumber,
            message: m.message,
            timestamp: m.timestamp,
            type: m.type,
            senderName: m.senderName,
          })),
        });

        logger.info(
          `📤 Inviati ${unreadMessages.length} messaggi non letti a utente ${userId}`
        );
      }
    } catch (error) {
      logger.error('Errore invio messaggi non letti:', error);
    }
  }

  /**
   * Marca messaggio come letto
   */
  private async markMessageAsRead(
    messageId: string,
    userId: string
  ): Promise<void> {
    try {
      await prisma.whatsAppMessage.update({
        where: { id: messageId },
        data: {
          status: 'READ',
          readBy: userId,
        },
      });

      if (this.io) {
        const whatsappNamespace = this.io.of('/whatsapp');
        whatsappNamespace.emit('messageRead', {
          messageId,
          readBy: userId,
          timestamp: new Date(),
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
        timestamp: new Date(),
      });

      logger.info(`📊 Status messaggio ${messageId} aggiornato: ${status}`);
    } catch (error) {
      logger.error('Errore notifica status messaggio:', error);
    }
  }
}

// Singleton
export const whatsAppRealtimeService = new WhatsAppRealtimeService();
