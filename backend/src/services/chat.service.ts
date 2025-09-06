import { PrismaClient, MessageType, RequestStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export interface ChatMessageInput {
  requestId: string;
  recipientId: string;
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
  async canAccessChat(recipientId: string, requestId: string): Promise<boolean> {
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
          id: uuidv4(), // Genera un UUID per l'id
          requestId: data.requestId,
          recipientId: data.userId,
          message: data.message,
          messageType: data.messageType || 'TEXT',
          attachments: data.attachments || null,
          readBy: JSON.stringify([{ recipientId: data.userId, readAt: new Date() }]),
          updatedAt: new Date()
        },
        include: {
          User: {
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

      // Crea notifica per gli altri partecipanti
      await this.createChatNotifications(data.requestId, data.userId, data.message);

      return message;
    } catch (error) {
      logger.error('Error sending chat message:', error);
      throw error;
    }
  }

  /**
   * Recupera i messaggi di una chat
   */
  async getMessages(requestId: string, recipientId: string, limit = 50, offset = 0) {
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
          User: {
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

      return messages.reverse(); // Inverti per mostrare dal più vecchio al più recente
    } catch (error) {
      logger.error('Error getting chat messages:', error);
      throw error;
    }
  }

  /**
   * Modifica un messaggio
   */
  async updateMessage(messageId: string, recipientId: string, update: ChatMessageUpdate) {
    try {
      // Verifica che l'utente sia l'autore del messaggio
      const message = await prisma.requestChatMessage.findUnique({
        where: { id: messageId },
        select: { recipientId: true, requestId: true }
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
          deletedAt: update.isDeleted ? new Date() : undefined
        },
        include: {
          User: {
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

      return updatedMessage;
    } catch (error) {
      logger.error('Error updating chat message:', error);
      throw error;
    }
  }

  /**
   * Elimina un messaggio (soft delete)
   */
  async deleteMessage(messageId: string, recipientId: string) {
    return this.updateMessage(messageId, userId, { isDeleted: true });
  }

  /**
   * Segna i messaggi come letti
   */
  async markMessagesAsRead(requestId: string, recipientId: string) {
    try {
      const messages = await prisma.requestChatMessage.findMany({
        where: {
          requestId,
          recipientId: { not: userId },
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
  async getUnreadCount(requestId: string, recipientId: string) {
    try {
      const messages = await prisma.requestChatMessage.findMany({
        where: {
          requestId,
          recipientId: { not: userId },
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
        if (!hasRead) unreadCount++;
      }

      return unreadCount;
    } catch (error) {
      logger.error('Error counting unread messages:', error);
      return 0;
    }
  }

  /**
   * Crea notifiche per i partecipanti della chat
   */
  private async createChatNotifications(requestId: string, senderId: string, messageText: string) {
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
        select: { fullName: true, role: true }
      });

      if (!sender) return;

      // Determina chi deve ricevere la notifica
      const recipientIds = [];
      
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
        // Notifica sempre il cliente
        if (senderId !== request.clientId) {
          recipientIds.push(request.clientId);
        }
        // Notifica il professionista se assegnato e diverso dal mittente
        if (request.professionalId && senderId !== request.professionalId) {
          recipientIds.push(request.professionalId);
        }
      }

      // Crea le notifiche
      for (const recipientId of recipientIds) {
        if (recipientId !== senderId) {
          await prisma.notification.create({
            data: {
              id: uuidv4(),
              type: 'CHAT_MESSAGE',
              title: 'Nuovo messaggio nella richiesta',
              content: `${sender.fullName} ha inviato un messaggio nella richiesta "${request.title}": ${messageText.substring(0, 100)}${messageText.length > 100 ? '...' : ''}`,
              recipientId,
              senderId,
              entityType: 'REQUEST',
              entityId: requestId,
              priority: 'NORMAL'
            }
          });
        }
      }
    } catch (error) {
      logger.error('Error creating chat notifications:', error);
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
          status: true
        }
      });

      if (!request) return;

      await prisma.requestChatMessage.create({
        data: {
          requestId,
          recipientId: 'system',
          message: `Chat iniziata per la richiesta: "${request.title}". I partecipanti possono ora comunicare qui.`,
          messageType: 'SYSTEM' as MessageType,
          isRead: false
        }
      });
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
          requestId,
          recipientId: systemUser.id,
          message,
          messageType: 'SYSTEM',
          readBy: JSON.stringify([])
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
      if (status === 'COMPLETED') {
        message = '✅ La richiesta è stata completata. La chat è ora chiusa.';
      } else if (status === 'CANCELLED') {
        message = '❌ La richiesta è stata cancellata. La chat è ora chiusa.';
      }

      if (message) {
        await this.sendSystemMessage(requestId, message);
      }
    } catch (error) {
      logger.error('Error closing chat for request:', error);
    }
  }
}

export const chatService = new ChatService();
