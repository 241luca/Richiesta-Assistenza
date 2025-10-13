/**
 * Chat Service
 * Sistema di messaggistica real-time per richieste di assistenza
 * 
 * Responsabilità:
 * - Invio e ricezione messaggi chat
 * - Gestione permessi accesso chat
 * - Tracking messaggi letti/non letti
 * - Messaggi di sistema automatici
 * - Notifiche real-time via WebSocket
 * - Chiusura chat automatica
 * - Supporto allegati e formattazione
 * 
 * @module services/chat
 * @version 5.2.1
 * @updated 2025-10-01
 * @author Sistema Richiesta Assistenza
 */

import { MessageType, RequestStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { notificationService } from './notification.service';

/**
 * Interface per input nuovo messaggio
 */
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

/**
 * Interface per aggiornamento messaggio
 */
export interface ChatMessageUpdate {
  message?: string;
  isDeleted?: boolean;
}

/**
 * Chat Service Class
 * 
 * Gestisce tutte le operazioni di messaggistica real-time
 */
class ChatService {
  
  /**
   * Verifica se un utente può accedere alla chat di una richiesta
   * 
   * Regole autorizzazione:
   * - ADMIN/SUPER_ADMIN: accesso a tutte le chat
   * - Cliente: solo propria richiesta
   * - Professionista: solo richieste assegnate
   * 
   * @param {string} userId - ID utente
   * @param {string} requestId - ID richiesta
   * @returns {Promise<boolean>} True se autorizzato
   * 
   * @example
   * const canAccess = await chatService.canAccessChat('user-123', 'req-456');
   */
  async canAccessChat(userId: string, requestId: string): Promise<boolean> {
    try {
      if (!userId || !requestId) {
        return false;
      }

      logger.info('[ChatService] Checking chat access:', { userId, requestId });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (!user) {
        logger.warn('[ChatService] User not found:', { userId });
        return false;
      }

      // Admin possono accedere a tutte le chat
      if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
        logger.info('[ChatService] Admin access granted:', { userId, requestId });
        return true;
      }

      // Verifica se l'utente è il cliente o il professionista
      const request = await prisma.assistanceRequest.findUnique({
        where: { id: requestId },
        select: { 
          clientId: true, 
          professionalId: true,
          status: true
        }
      });

      if (!request) {
        logger.warn('[ChatService] Request not found:', { requestId });
        return false;
      }

      // Cliente può sempre accedere
      if (request.clientId === userId) {
        return true;
      }

      // Professionista può accedere se assegnato
      if (request.professionalId === userId) {
        return true;
      }

      logger.warn('[ChatService] Access denied:', { userId, requestId });
      return false;

    } catch (error) {
      logger.error('[ChatService] Error checking chat access:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        requestId,
        stack: error instanceof Error ? error.stack : undefined
      });
      return false;
    }
  }

  /**
   * Verifica se la chat è attiva
   * 
   * La chat è attiva se la richiesta non è completata o cancellata
   * 
   * @param {string} requestId - ID richiesta
   * @returns {Promise<boolean>} True se chat attiva
   * 
   * @example
   * const isActive = await chatService.isChatActive('req-456');
   */
  async isChatActive(requestId: string): Promise<boolean> {
    try {
      if (!requestId) {
        return false;
      }

      const request = await prisma.assistanceRequest.findUnique({
        where: { id: requestId },
        select: { status: true }
      });

      if (!request) {
        return false;
      }

      const isActive = request.status !== 'COMPLETED' && request.status !== 'CANCELLED';
      
      logger.info('[ChatService] Chat activity check:', { 
        requestId, 
        isActive,
        status: request.status 
      });

      return isActive;

    } catch (error) {
      logger.error('[ChatService] Error checking chat status:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        stack: error instanceof Error ? error.stack : undefined
      });
      return false;
    }
  }

  /**
   * Invia un messaggio nella chat
   * 
   * Verifica autorizzazioni, crea messaggio e invia notifiche
   * 
   * @param {ChatMessageInput} data - Dati messaggio
   * @returns {Promise<any>} Messaggio creato
   * @throws {Error} Se utente non autorizzato o chat chiusa
   * 
   * @example
   * const message = await chatService.sendMessage({
   *   requestId: 'req-123',
   *   userId: 'user-456',
   *   message: 'Ciao, quando puoi venire?',
   *   messageType: 'TEXT'
   * });
   */
  async sendMessage(data: ChatMessageInput) {
    try {
      logger.info('[ChatService] Sending message:', { 
        requestId: data.requestId,
        userId: data.userId,
        messageLength: data.message?.length 
      });

      // Validazione input
      if (!data.requestId || !data.userId || !data.message) {
        throw new Error('RequestId, userId and message are required');
      }

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
        include: ({
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
        } as any)
      });

      // Trasforma per compatibilità frontend (User con maiuscola)
      const formattedMessage = {
        ...message,
        User: (message as any).User || (message as any).user
      };
      delete (formattedMessage as any).user;

      // Invia notifiche
      await this._createChatNotifications(data.requestId, data.userId, data.message);

      logger.info('[ChatService] Message sent successfully:', { 
        messageId: message.id,
        requestId: data.requestId 
      });

      return formattedMessage;

    } catch (error) {
      logger.error('[ChatService] Error sending chat message:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: data.requestId,
        userId: data.userId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Recupera i messaggi di una chat
   * 
   * @param {string} requestId - ID richiesta
   * @param {string} userId - ID utente richiedente
   * @param {number} [limit=50] - Numero massimo messaggi
   * @param {number} [offset=0] - Offset per paginazione
   * @returns {Promise<any[]>} Lista messaggi (ordinati dal più vecchio)
   * @throws {Error} Se utente non autorizzato
   * 
   * @example
   * const messages = await chatService.getMessages('req-123', 'user-456', 50, 0);
   */
  async getMessages(requestId: string, userId: string, limit = 50, offset = 0) {
    try {
      logger.info('[ChatService] Getting messages:', { 
        requestId, 
        userId, 
        limit, 
        offset 
      });

      // Validazione input
      if (!requestId || !userId) {
        throw new Error('RequestId and userId are required');
      }

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
        include: ({
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
        } as any),
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      });

      // Segna i messaggi come letti
      await this.markMessagesAsRead(requestId, userId);

      // Trasforma per compatibilità frontend
      const formattedMessages = messages.map(msg => {
        const formatted = {
          ...msg,
          User: (msg as any).User || (msg as any).user
        };
        delete (formatted as any).user;
        return formatted;
      });

      logger.info('[ChatService] Messages retrieved:', { 
        count: formattedMessages.length,
        requestId 
      });

      return formattedMessages.reverse(); // Dal più vecchio al più recente

    } catch (error) {
      logger.error('[ChatService] Error getting chat messages:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        userId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Modifica un messaggio esistente
   * 
   * Solo l'autore può modificare il proprio messaggio
   * 
   * @param {string} messageId - ID messaggio
   * @param {string} userId - ID utente
   * @param {ChatMessageUpdate} update - Dati da aggiornare
   * @returns {Promise<any>} Messaggio aggiornato
   * @throws {Error} Se utente non autorizzato o chat chiusa
   * 
   * @example
   * const updated = await chatService.updateMessage(
   *   'msg-123',
   *   'user-456',
   *   { message: 'Messaggio corretto' }
   * );
   */
  async updateMessage(messageId: string, userId: string, update: ChatMessageUpdate) {
    try {
      logger.info('[ChatService] Updating message:', { 
        messageId, 
        userId,
        hasNewMessage: !!update.message,
        isDeleted: !!update.isDeleted
      });

      // Validazione input
      if (!messageId || !userId) {
        throw new Error('MessageId and userId are required');
      }

      // Verifica che l'utente sia l'autore
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
        include: ({
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
        } as any)
      });

      // Trasforma per compatibilità frontend
      const formattedMessage = {
        ...updatedMessage,
        User: (updatedMessage as any).User || (updatedMessage as any).user
      };
      delete (formattedMessage as any).user;

      logger.info('[ChatService] Message updated successfully:', { messageId });

      return formattedMessage;

    } catch (error) {
      logger.error('[ChatService] Error updating chat message:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        messageId,
        userId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Elimina un messaggio (soft delete)
   * 
   * @param {string} messageId - ID messaggio
   * @param {string} userId - ID utente
   * @returns {Promise<any>} Messaggio eliminato
   * @throws {Error} Se utente non autorizzato
   * 
   * @example
   * await chatService.deleteMessage('msg-123', 'user-456');
   */
  async deleteMessage(messageId: string, userId: string) {
    return this.updateMessage(messageId, userId, { isDeleted: true });
  }

  /**
   * Segna i messaggi come letti per un utente
   * 
   * Aggiorna il campo readBy per tutti i messaggi non letti
   * 
   * @param {string} requestId - ID richiesta
   * @param {string} userId - ID utente
   * @returns {Promise<void>}
   * 
   * @example
   * await chatService.markMessagesAsRead('req-123', 'user-456');
   */
  async markMessagesAsRead(requestId: string, userId: string): Promise<void> {
    try {
      logger.info('[ChatService] Marking messages as read:', { requestId, userId });

      const messages = await prisma.requestChatMessage.findMany({
        where: {
          requestId,
          userId: { not: userId },
          isDeleted: false
        },
        select: { id: true, readBy: true }
      });

      let markedCount = 0;

      for (const message of messages) {
        let readBy = [];
        try {
          readBy = message.readBy ? JSON.parse(message.readBy as string) : [];
        } catch {
          readBy = [];
        }

        // Verifica se già letto
        const alreadyRead = readBy.some((r: any) => r.userId === userId);
        
        if (!alreadyRead) {
          readBy.push({ userId, readAt: new Date() });
          
          await prisma.requestChatMessage.update({
            where: { id: message.id },
            data: { readBy: JSON.stringify(readBy) }
          });
          
          markedCount++;
        }
      }

      logger.info('[ChatService] Messages marked as read:', { 
        requestId, 
        userId,
        markedCount 
      });

    } catch (error) {
      logger.error('[ChatService] Error marking messages as read:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        userId,
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  /**
   * Conta i messaggi non letti per un utente
   * 
   * @param {string} requestId - ID richiesta
   * @param {string} userId - ID utente
   * @returns {Promise<number>} Numero messaggi non letti
   * 
   * @example
   * const unread = await chatService.getUnreadCount('req-123', 'user-456');
   */
  async getUnreadCount(requestId: string, userId: string): Promise<number> {
    try {
      logger.info('[ChatService] Getting unread count:', { requestId, userId });

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

      logger.info('[ChatService] Unread count:', { 
        requestId, 
        userId, 
        unreadCount 
      });

      return unreadCount;

    } catch (error) {
      logger.error('[ChatService] Error counting unread messages:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        userId,
        stack: error instanceof Error ? error.stack : undefined
      });
      return 0;
    }
  }

  /**
   * Crea un messaggio di sistema iniziale
   * 
   * Chiamato quando viene creata una nuova chat
   * 
   * @param {string} requestId - ID richiesta
   * @returns {Promise<void>}
   * 
   * @example
   * await chatService.createInitialSystemMessage('req-123');
   */
  async createInitialSystemMessage(requestId: string): Promise<void> {
    try {
      logger.info('[ChatService] Creating initial system message:', { requestId });

      const request = await prisma.assistanceRequest.findUnique({
        where: { id: requestId },
        select: {
          title: true,
          status: true,
          clientId: true,
          professionalId: true
        }
      });

      if (!request) {
        logger.warn('[ChatService] Request not found for system message:', { requestId });
        return;
      }

      // Trova utente di sistema (SUPER_ADMIN)
      const systemUser = await prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN' },
        select: { id: true }
      });

      if (!systemUser) {
        logger.error('[ChatService] No system user found');
        return;
      }

      await prisma.requestChatMessage.create({
        data: {
          id: uuidv4(),
          requestId,
          userId: systemUser.id,
          message: `Chat iniziata per la richiesta: "${request.title}". I partecipanti possono ora comunicare qui.`,
          messageType: 'SYSTEM' as MessageType,
          isRead: false,
          updatedAt: new Date()
        }
      });

      // Notifica partecipanti
      const participantIds = [request.clientId];
      if (request.professionalId) {
        participantIds.push(request.professionalId);
      }

      for (const participantId of participantIds) {
        await notificationService.sendToUser({
          userId: participantId,
          type: 'CHAT_STARTED',
          title: 'Chat disponibile',
          message: `La chat per la richiesta "${request.title}" è ora attiva.`,
          priority: 'low',
          data: {
            requestId,
            actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:5193'}/requests/${requestId}/chat`
          },
          channels: ['websocket']
        });
      }

      logger.info('[ChatService] Initial system message created:', { requestId });

    } catch (error) {
      logger.error('[ChatService] Error creating initial system message:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  /**
   * Invia un messaggio di sistema generico
   * 
   * @param {string} requestId - ID richiesta
   * @param {string} message - Testo messaggio
   * @returns {Promise<void>}
   * 
   * @example
   * await chatService.sendSystemMessage('req-123', 'Chat chiusa automaticamente');
   */
  async sendSystemMessage(requestId: string, message: string): Promise<void> {
    try {
      logger.info('[ChatService] Sending system message:', { 
        requestId, 
        messageLength: message.length 
      });

      // Trova utente di sistema
      const systemUser = await prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN' },
        select: { id: true }
      });

      if (!systemUser) {
        logger.error('[ChatService] No system user found for system message');
        return;
      }

      await prisma.requestChatMessage.create({
        data: {
          id: uuidv4(),
          requestId,
          userId: systemUser.id,
          message,
          messageType: 'SYSTEM',
          readBy: JSON.stringify([]),
          updatedAt: new Date()
        }
      });

      logger.info('[ChatService] System message sent:', { requestId });

    } catch (error) {
      logger.error('[ChatService] Error sending system message:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  /**
   * Chiude la chat quando la richiesta viene completata/cancellata
   * 
   * Invia messaggio di sistema e notifica partecipanti
   * 
   * @param {string} requestId - ID richiesta
   * @param {RequestStatus} status - Nuovo stato richiesta
   * @returns {Promise<void>}
   * 
   * @example
   * await chatService.closeChatForRequest('req-123', 'COMPLETED');
   */
  async closeChatForRequest(requestId: string, status: RequestStatus): Promise<void> {
    try {
      logger.info('[ChatService] Closing chat for request:', { requestId, status });

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
        
        // Notifica partecipanti della chiusura
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

      logger.info('[ChatService] Chat closed for request:', { requestId, status });

    } catch (error) {
      logger.error('[ChatService] Error closing chat for request:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        status,
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  /**
   * Crea notifiche chat usando sistema centrale
   * 
   * @private
   * @param {string} requestId - ID richiesta
   * @param {string} senderId - ID mittente
   * @param {string} messageText - Testo messaggio
   * @returns {Promise<void>}
   */
  private async _createChatNotifications(
    requestId: string, 
    senderId: string, 
    messageText: string
  ): Promise<void> {
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

      // Determina destinatari
      const recipientIds: string[] = [];
      
      if (senderId === request.clientId && request.professionalId) {
        recipientIds.push(request.professionalId);
      }
      
      if (senderId === request.professionalId) {
        recipientIds.push(request.clientId);
      }

      if (sender.role === 'ADMIN' || sender.role === 'SUPER_ADMIN') {
        if (senderId !== request.clientId) {
          recipientIds.push(request.clientId);
        }
        if (request.professionalId && senderId !== request.professionalId) {
          recipientIds.push(request.professionalId);
        }
      }

      // Invia notifiche
      for (const recipientId of recipientIds) {
        if (recipientId !== senderId) {
          await notificationService.sendToUser({
            userId: recipientId,
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
            channels: ['websocket']
          });
        }
      }

      logger.info('[ChatService] Chat notifications sent:', { requestId, recipientCount: recipientIds.length });

    } catch (error) {
      logger.error('[ChatService] Error creating chat notifications:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        senderId,
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }
}

/**
 * Export singleton instance
 */
export const chatService = new ChatService();
