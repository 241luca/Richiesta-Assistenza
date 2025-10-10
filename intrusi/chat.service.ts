import { PrismaClient, MessageType, RequestStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
// ✅ FIX: Importa il servizio notifiche centrale
import { notificationService } from './notification.service';

const prisma = new PrismaClient();

export interface ChatMessageInput {
  requestId: string;
  userId: string;
  message: string;
  messageType?: MessageType;
  attachments?: Array<{
    fileName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
  }>;
}

export interface ChatMessageUpdate {
  message?: string;
  isDeleted?: boolean;
}

class ChatService {
  /**
   * Verifica se un utente può accedere alla chat di una richiesta
   */
  async canAccessChat(userId: string, requestId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (!user) return false;

      // Admin (tutti i livelli) possono accedere a tutte le chat
      if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
        return true;
      }

      // Verifica se l'utente è il cliente o il professionista della richiesta
      const request = await prisma.assistanceRequest.findUnique({
        where: { id: requestId },
        select: { 
          clientId: true, 
          professionalId: true,
          status: true
        }
      });

      if (!request) return false;

      // Cliente può sempre accedere alla propria richiesta
      if (request.clientId === userId) return true;

      // Professionista può accedere solo se assegnato
      if (request.professionalId === userId) return true;

      return false;
    } catch (error) {
      logger.error('Error checking chat access:', error);
      return false;
    }
  }

  /**
   * Verifica se la chat è attiva (richiesta non completata/cancellata)
   */
  async isChatActive(requestId: string): Promise<boolean> {
    try {
      const request = await prisma.assistanceRequest.findUnique({
        where: { id: requestId },
        select: { status: true }
      });

      if (!request) return false;

      return request.status !== 'COMPLETED' && request.status !== 'CANCELLED';
    } catch (error) {
      logger.error('Error checking chat status:', error);
      return false;
    }
  }

  /**
   * Invia un messaggio nella chat
   */
  async sendMessage(data: ChatMessageInput) {
    try {
      // Verifica accesso
      const canAccess = await this.canAccessChat(data.userId, data.requestId);
      if (!canAccess) {
        throw new Error('Non hai accesso a questa chat');
      }

      // Verifica se la chat è attiva
      const isActive = await this.isChatActive(data.requestId);
      if (!isActive) {
        throw new Error('La chat è chiusa per questa richiesta');
      }

      // Crea il messaggio
      const message = await prisma.requestChatMessage.create({
        data: {
          id: uuidv4(),
          requestId: data.requestId,
          userId: data.userId,
          message: data.message,
          messageType: data.messageType || 'TEXT',
          attachments: data.attachments || null,
          readBy: JSON.stringify([{ userId: data.userId, readAt: new Date() }]),
          updatedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              avatar: true,
              role: true
            }
          }
        }
      });

      // Trasforma per compatibilità con il frontend (User con maiuscola)
      const formattedMessage = {
        ...message,
        User: message.user
      };
      delete (formattedMessage as any).user;

      // ✅ FIX: Usa il sistema di notifiche centrale
      await this.createChatNotificationsV2(data.requestId, data.userId, data.message);

      return formattedMessage;
    } catch (error) {
      logger.error('Error sending chat message:', error);
      throw error;
    }
  }

  /**
   * Recupera i messaggi di una chat
   */
  async getMessages(requestId: string, userId: string, limit = 50, offset = 0) {
    try {
      // Verifica accesso
      const canAccess = await this.canAccessChat(userId, requestId);
      if (!canAccess) {
        throw new Error('Non hai accesso a questa chat');
      }

      const messages = await prisma.requestChatMessage.findMany({
        where: {
          requestId,
          isDeleted: false
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              avatar: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      });

      // Segna i messaggi come letti
      await this.markMessagesAsRead(requestId, userId);

      // Trasforma per compatibilità con il frontend (User con maiuscola)
      const formattedMessages = messages.map(msg => {
        const formatted = {
          ...msg,
          User: msg.user
        };
        delete (formatted as any).user;
        return formatted;
      });

      return formattedMessages.reverse(); // Inverti per mostrare dal più vecchio al più recente
    } catch (error) {
      logger.error('Error getting chat messages:', error);
      throw error;
    }
  }

  /**
   * Modifica un messaggio
   */
  async updateMessage(messageId: string, userId: string, update: ChatMessageUpdate) {
    try {
      // Verifica che l'utente sia l'autore del messaggio
      const message = await prisma.requestChatMessage.findUnique({
        where: { id: messageId },
        select: { userId: true, requestId: true }
      });

      if (!message || message.userId !== userId) {
        throw new Error('Non puoi modificare questo messaggio');
      }

      // Verifica se la chat è ancora attiva
      const isActive = await this.isChatActive(message.requestId);
      if (!isActive) {
        throw new Error('La chat è chiusa per questa richiesta');
      }

      const updatedMessage = await prisma.requestChatMessage.update({
        where: { id: messageId },
        data: {
          message: update.message,
          isEdited: update.message ? true : undefined,
          editedAt: update.message ? new Date() : undefined,
          isDeleted: update.isDeleted,
          deletedAt: update.isDeleted ? new Date() : undefined,
          updatedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              avatar: true,
              role: true
            }
          }
        }
      });

      // Trasforma per compatibilità con il frontend (User con maiuscola)
      const formattedMessage = {
        ...updatedMessage,
        User: updatedMessage.user
      };
      delete (formattedMessage as any).user;

      return formattedMessage;
    } catch (error) {
      logger.error('Error updating chat message:', error);
      throw error;
    }
  }

  /**
   * Elimina un messaggio (soft delete)
   */
  async deleteMessage(messageId: string, userId: string) {
    return this.updateMessage(messageId, userId, { isDeleted: true });
  }

  /**
   * Segna i messaggi come letti
   */
  async markMessagesAsRead(requestId: string, userId: string) {
    try {
      const messages = await prisma.requestChatMessage.findMany({
        where: {
          requestId,
          userId: { not: userId },
          isDeleted: false
        },
        select: { id: true, readBy: true }
      });

      for (const message of messages) {
        let readBy = [];
        try {
          readBy = message.readBy ? JSON.parse(message.readBy as string) : [];
        } catch {
          readBy = [];
        }

        // Verifica se l'utente ha già letto il messaggio
        const alreadyRead = readBy.some((r: any) => r.userId === userId);
        
        if (!alreadyRead) {
          readBy.push({ userId, readAt: new Date() });
          
          await prisma.requestChatMessage.update({
            where: { id: message.id },
            data: {
              readBy: JSON.stringify(readBy)
            }
          });
        }
      }
    } catch (error) {
      logger.error('Error marking messages as read:', error);
    }
  }

  /**
   * Conta i messaggi non letti
   */
  async getUnreadCount(requestId: string, userId: string) {
    try {
      const messages = await prisma.requestChatMessage.findMany({
        where: {
          requestId,
          userId: { not: userId },
          isDeleted: false
        },
        select: { readBy: true }
      });

      let unreadCount = 0;
      
      for (const message of messages) {
        let readBy = [];
        try {
          readBy = message.readBy ? JSON.parse(message.readBy as string) : [];
        } catch {
          readBy = [];
        }

        const hasRead = readBy.some((r: any) => r.userId === userId);
        if (!hasRead) {
          unreadCount++;
        }
      }

      return unreadCount;
    } catch (error) {
      logger.error('Error counting unread messages:', error);
      return 0;
    }
  }

  /**
   * ✅ FIX: NUOVO METODO - Crea notifiche chat usando il sistema centrale
   * Sostituisce il vecchio metodo createChatNotifications
   */
  private async createChatNotificationsV2(requestId: string, senderId: string, messageText: string) {
    try {
      const request = await prisma.assistanceRequest.findUnique({
        where: { id: requestId },
        select: {
          clientId: true,
          professionalId: true,
          title: true
        }
      });

      if (!request) return;

      const sender = await prisma.user.findUnique({
        where: { id: senderId },
        select: { fullName: true, firstName: true, role: true }
      });

      if (!sender) return;

      // Determina chi deve ricevere la notifica
      const recipientIds: string[] = [];
      
      // Se il mittente è il cliente, notifica il professionista
      if (senderId === request.clientId && request.professionalId) {
        recipientIds.push(request.professionalId);
      }
      
      // Se il mittente è il professionista, notifica il cliente
      if (senderId === request.professionalId) {
        recipientIds.push(request.clientId);
      }

      // Se il mittente è admin/staff, notifica sia cliente che professionista
      if (sender.role === 'ADMIN' || sender.role === 'SUPER_ADMIN') {
        if (senderId !== request.clientId) {
          recipientIds.push(request.clientId);
        }
        if (request.professionalId && senderId !== request.professionalId) {
          recipientIds.push(request.professionalId);
        }
      }

      // ✅ FIX: Usa il servizio notifiche centrale per ogni destinatario
      for (const recipientId of recipientIds) {
        if (recipientId !== senderId) {
          await notificationService.sendToUser({
            userId: recipientId, // ✅ Campo corretto
            type: 'CHAT_MESSAGE',
            title: `Nuovo messaggio da ${sender.fullName || sender.firstName}`,
            message: `${sender.fullName || sender.firstName} ha scritto nella richiesta "${request.title}": ${messageText.substring(0, 100)}${messageText.length > 100 ? '...' : ''}`,
            priority: 'normal',
            data: {
              requestId,
              senderId,
              senderName: sender.fullName || sender.firstName,
              messagePreview: messageText.substring(0, 100),
              actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:5193'}/requests/${requestId}/chat`
            },
            channels: ['websocket'] // Solo websocket per i messaggi chat, non email
          });
        }
      }

      logger.info(`Chat notifications sent for request ${requestId}`);
    } catch (error) {
      logger.error('Error creating chat notifications:', error);
      // Non far fallire l'invio del messaggio se le notifiche falliscono
    }
  }

  /**
   * Crea un messaggio di sistema iniziale per una nuova chat
   */
  async createInitialSystemMessage(requestId: string): Promise<void> {
    try {
      const request = await prisma.assistanceRequest.findUnique({
        where: { id: requestId },
        select: {
          title: true,
          status: true,
          clientId: true,
          professionalId: true
        }
      });

      if (!request) return;

      // Trova un utente di sistema o usa l'ID del primo admin
      const systemUser = await prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN' },
        select: { id: true }
      });

      if (!systemUser) {
        logger.error('No system user found for system message');
        return;
      }

      await prisma.requestChatMessage.create({
        data: {
          id: uuidv4(), // ✅ FIX: Genera UUID
          requestId,
          userId: systemUser.id,
          message: `Chat iniziata per la richiesta: "${request.title}". I partecipanti possono ora comunicare qui.`,
          messageType: 'SYSTEM' as MessageType,
          isRead: false,
          updatedAt: new Date()
        }
      });

      // ✅ FIX: Notifica i partecipanti che la chat è iniziata
      const participantIds = [request.clientId];
      if (request.professionalId) {
        participantIds.push(request.professionalId);
      }

      for (const participantId of participantIds) {
        await notificationService.sendToUser({
          userId: participantId,
          type: 'CHAT_STARTED',
          title: 'Chat disponibile',
          message: `La chat per la richiesta "${request.title}" è ora attiva. Puoi comunicare con gli altri partecipanti.`,
          priority: 'low',
          data: {
            requestId,
            actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:5193'}/requests/${requestId}/chat`
          },
          channels: ['websocket']
        });
      }
    } catch (error) {
      logger.error('Error creating initial system message:', error);
    }
  }

  /**
   * Invia un messaggio di sistema quando la richiesta viene chiusa
   */
  async sendSystemMessage(requestId: string, message: string) {
    try {
      // Trova un utente di sistema o usa l'ID del primo admin
      const systemUser = await prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN' },
        select: { id: true }
      });

      if (!systemUser) {
        logger.error('No system user found for system message');
        return;
      }

      await prisma.requestChatMessage.create({
        data: {
          id: uuidv4(), // ✅ FIX: Genera UUID
          requestId,
          userId: systemUser.id,
          message,
          messageType: 'SYSTEM',
          readBy: JSON.stringify([]),
          updatedAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Error sending system message:', error);
    }
  }

  /**
   * Chiudi la chat quando la richiesta viene completata o cancellata
   */
  async closeChatForRequest(requestId: string, status: RequestStatus) {
    try {
      let message = '';
      let notificationTitle = '';
      let notificationType = '';
      
      if (status === 'COMPLETED') {
        message = '✅ La richiesta è stata completata. La chat è ora chiusa.';
        notificationTitle = 'Richiesta completata';
        notificationType = 'REQUEST_COMPLETED';
      } else if (status === 'CANCELLED') {
        message = '❌ La richiesta è stata cancellata. La chat è ora chiusa.';
        notificationTitle = 'Richiesta cancellata';
        notificationType = 'REQUEST_CANCELLED';
      }

      if (message) {
        await this.sendSystemMessage(requestId, message);
        
        // ✅ FIX: Notifica i partecipanti della chiusura
        const request = await prisma.assistanceRequest.findUnique({
          where: { id: requestId },
          select: {
            title: true,
            clientId: true,
            professionalId: true
          }
        });

        if (request) {
          const participantIds = [request.clientId];
          if (request.professionalId) {
            participantIds.push(request.professionalId);
          }

          for (const participantId of participantIds) {
            await notificationService.sendToUser({
              userId: participantId,
              type: notificationType,
              title: notificationTitle,
              message: `La richiesta "${request.title}" è stata ${status === 'COMPLETED' ? 'completata' : 'cancellata'}. La chat è stata chiusa.`,
              priority: 'normal',
              data: {
                requestId,
                status
              },
              channels: ['websocket', 'email']
            });
          }
        }
      }
    } catch (error) {
      logger.error('Error closing chat for request:', error);
    }
  }
}

export const chatService = new ChatService();
