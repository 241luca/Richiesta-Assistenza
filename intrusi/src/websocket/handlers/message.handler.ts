/**
 * Message Event Handlers
 * Gestisce tutti gli eventi relativi alla chat e messaggistica
 */

import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';
import { notificationService } from '../../services/notification.service'; // CHANGED: usa il service unificato

const prisma = new PrismaClient();

interface AuthenticatedSocket {
  id: string;
  userId?: string;
  userRole?: string;
  emit: (event: string, data: any) => void;
  join: (room: string) => void;
  to: (room: string) => any;
  on: (event: string, callback: (...args: any[]) => void) => void;
}

interface MessageData {
  recipientId: string;
  content: string;
  requestId?: string;
  attachments?: string[];
}

export function handleMessageEvents(socket: AuthenticatedSocket, io: Server) {
  /**
   * Invia un nuovo messaggio
   */
  socket.on('message:send', async (data: MessageData) => {
    try {
      // Verifica che mittente e destinatario siano nella stessa organizzazione
      const recipient = await prisma.user.findFirst({
        where: {
          id: data.recipientId,
        }
      });

      if (!recipient) {
        throw new Error('Recipient not found or not in same organization');
      }

      // Se il messaggio è legato a una richiesta, verifica l'accesso
      if (data.requestId) {
        const request = await prisma.assistanceRequest.findFirst({
          where: {
            id: data.requestId,
            OR: [
              { clientId: socket.userId },
              { professionalId: socket.userId },
              { clientId: data.recipientId },
              { professionalId: data.recipientId }
            ]
          }
        });

        if (!request) {
          throw new Error('Request not found or access denied');
        }
      }

      // Salva il messaggio nel database
      const message = await prisma.message.create({
        data: {
          content: data.content,
          senderId: socket.userId!,
          recipientId: data.recipientId,
          requestId: data.requestId,
          attachments: data.attachments || [],
          isRead: false
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      });

      // Invia il messaggio al destinatario se online
      io.to(`User:${data.recipientId}`).emit('message:new', {
        ...message,
        timestamp: new Date()
      });

      // Conferma al mittente
      socket.emit('message:sent', {
        ...message,
        timestamp: new Date()
      });

      // Invia notifica se il destinatario è offline o non nella chat - UPDATED: usa notification service
      const recipientSockets = await io.in(`User:${data.recipientId}`).fetchSockets();
      if (recipientSockets.length === 0) {
        await notificationService.sendToUser({
          userId: data.recipientId, // FIXED: usa userId
          type: 'NEW_MESSAGE',
          title: 'Nuovo Messaggio',
          message: `${message.sender.firstName} ${message.sender.lastName}: ${data.content.substring(0, 100)}${data.content.length > 100 ? '...' : ''}`,
          data: { 
            messageId: message.id, 
            senderId: socket.userId,
            senderName: `${message.sender.firstName} ${message.sender.lastName}`,
            requestId: data.requestId,
            actionUrl: data.requestId ? `${process.env.FRONTEND_URL}/requests/${data.requestId}#chat` : `${process.env.FRONTEND_URL}/messages`
          },
          priority: 'normal',
          channels: ['websocket', 'email']
        });
      }

      logger.info(`Message sent from ${socket.userId} to ${data.recipientId}`);
    } catch (error) {
      logger.error('Error sending message:', error);
      socket.emit('error', { message: error instanceof Error ? error.message : 'Failed to send message' });
    }
  });

  /**
   * Segna i messaggi come letti
   */
  socket.on('message:markAsRead', async (messageIds: string[]) => {
    try {
      // Verifica che i messaggi siano destinati all'utente
      const messages = await prisma.message.findMany({
        where: {
          id: { in: messageIds },
          recipientId: socket.userId!,
          isRead: false
        }
      });

      if (messages.length === 0) {
        return;
      }

      // Aggiorna i messaggi
      await prisma.message.updateMany({
        where: {
          id: { in: messageIds },
          recipientId: socket.userId!
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      // Notifica il mittente che i messaggi sono stati letti
      const senderIds = [...new Set(messages.map(m => m.senderId))];
      senderIds.forEach(senderId => {
        io.to(`User:${senderId}`).emit('message:read', {
          messageIds,
          readBy: socket.userId,
          timestamp: new Date()
        });
      });

      socket.emit('message:markedAsRead', { messageIds });
      logger.debug(`Messages marked as read: ${messageIds.join(', ')}`);
    } catch (error) {
      logger.error('Error marking messages as read:', error);
      socket.emit('error', { message: 'Failed to mark messages as read' });
    }
  });

  /**
   * Recupera la cronologia dei messaggi con un utente
   */
  socket.on('message:getHistory', async (data: { 
    otherUserId: string; 
    requestId?: string;
    limit?: number;
    before?: string;
  }) => {
    try {
      // Verifica che l'altro utente sia nella stessa organizzazione
      const otherUser = await prisma.user.findFirst({
        where: {
          id: data.otherUserId,
        }
      });

      if (!otherUser) {
        throw new Error('User not found or not in same organization');
      }

      // Costruisci la query
      const whereClause: any = {
        OR: [
          { senderId: socket.userId, recipientId: data.otherUserId },
          { senderId: data.otherUserId, recipientId: socket.userId }
        ]
      };

      if (data.requestId) {
        whereClause.requestId = data.requestId;
      }

      if (data.before) {
        whereClause.createdAt = { lt: new Date(data.before) };
      }

      // Recupera i messaggi
      const messages = await prisma.message.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: data.limit || 50,
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      });

      // Segna come letti i messaggi ricevuti
      const unreadMessageIds = messages
        .filter(m => m.recipientId === socket.userId && !m.isRead)
        .map(m => m.id);

      if (unreadMessageIds.length > 0) {
        await prisma.message.updateMany({
          where: { id: { in: unreadMessageIds } },
          data: { 
            isRead: true, 
            readAt: new Date() 
          }
        });

        // Notifica il mittente
        io.to(`User:${data.otherUserId}`).emit('message:read', {
          messageIds: unreadMessageIds,
          readBy: socket.userId,
          timestamp: new Date()
        });
      }

      socket.emit('message:history', {
        messages: messages.reverse(), // Ordina dal più vecchio al più recente
        hasMore: messages.length === (data.limit || 50)
      });
    } catch (error) {
      logger.error('Error fetching message history:', error);
      socket.emit('error', { message: error instanceof Error ? error.message : 'Failed to fetch message history' });
    }
  });

  /**
   * Gestisci indicatori di digitazione
   */
  socket.on('typing:start', async (data: { recipientId: string; requestId?: string }) => {
    try {
      // Verifica che il destinatario sia nella stessa organizzazione
      const recipient = await prisma.user.findFirst({
        where: {
          id: data.recipientId,
        }
      });

      if (!recipient) {
        return;
      }

      // Invia l'indicatore di digitazione
      io.to(`User:${data.recipientId}`).emit('typing:update', {
        recipientId: socket.userId,
        requestId: data.requestId,
        isTyping: true,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Error sending typing indicator:', error);
    }
  });

  socket.on('typing:stop', async (data: { recipientId: string; requestId?: string }) => {
    try {
      // Verifica che il destinatario sia nella stessa organizzazione
      const recipient = await prisma.user.findFirst({
        where: {
          id: data.recipientId,
        }
      });

      if (!recipient) {
        return;
      }

      // Invia l'indicatore di stop digitazione
      io.to(`User:${data.recipientId}`).emit('typing:update', {
        recipientId: socket.userId,
        requestId: data.requestId,
        isTyping: false,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Error sending typing stop indicator:', error);
    }
  });

  /**
   * Elimina un messaggio
   */
  socket.on('message:delete', async (messageId: string) => {
    try {
      // Verifica che il messaggio appartenga all'utente
      const message = await prisma.message.findFirst({
        where: {
          id: messageId,
          senderId: socket.userId!
        }
      });

      if (!message) {
        throw new Error('Message not found or not authorized to delete');
      }

      // Soft delete - marca come eliminato invece di rimuovere
      await prisma.message.update({
        where: { id: messageId },
        data: {
          isDeleted: true,
          deletedAt: new Date()
        }
      });

      // Notifica il destinatario
      io.to(`User:${message.recipientId}`).emit('message:deleted', {
        messageId,
        deletedBy: socket.userId,
        timestamp: new Date()
      });

      socket.emit('message:deleteSuccess', { messageId });
      logger.info(`Message ${messageId} deleted by user ${socket.userId}`);
    } catch (error) {
      logger.error('Error deleting message:', error);
      socket.emit('error', { message: error instanceof Error ? error.message : 'Failed to delete message' });
    }
  });
}

/**
 * Conta i messaggi non letti per un utente
 */
export async function getUnreadMessageCount(recipientId: string): Promise<number> {
  try {
    return await prisma.message.count({
      where: {
        recipientId: userId,
        isRead: false,
        isDeleted: false
      }
    });
  } catch (error) {
    logger.error('Error counting unread messages:', error);
    return 0;
  }
}

/**
 * Recupera le conversazioni recenti per un utente
 */
export async function getRecentConversations(recipientId: string) {
  try {
    // Query complessa per ottenere le conversazioni recenti
    const conversations = await prisma.$queryRaw`
      SELECT DISTINCT ON (other_user_id)
        CASE 
          WHEN m."senderId" = ${userId} THEN m."recipientId"
          ELSE m."senderId"
        END as other_user_id,
        m.id as last_message_id,
        m.content as last_message,
        m."createdAt" as last_message_date,
        m."isRead" as is_read,
        u."firstName",
        u."lastName",
        u."avatar",
        u."status"
      FROM "Message" m
      INNER JOIN "User" u ON u.id = CASE 
        WHEN m."senderId" = ${userId} THEN m."recipientId"
        ELSE m."senderId"
      END
      WHERE (m."senderId" = ${userId} OR m."recipientId" = ${userId})
        AND m."isDeleted" = false
      ORDER BY other_user_id, m."createdAt" DESC
      LIMIT 20
    `;

    return conversations;
  } catch (error) {
    logger.error('Error fetching recent conversations:', error);
    return [];
  }
}
