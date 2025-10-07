import { Server as SocketServer, Socket } from 'socket.io';
import { Server } from 'http';
import { chatService } from '../services/chat.service';
import { logger } from '../utils/logger';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export class ChatWebSocket {
  private io: SocketServer;
  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  constructor(server: Server) {
    this.io = new SocketServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5193',
        credentials: true
      },
      path: '/socket.io/chat'
    });

    this.initialize();
  }

  private initialize() {
    // Middleware per autenticazione
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info(`User ${socket.userId} connected to chat`);

      // Aggiungi l'utente alla mappa degli utenti connessi
      if (socket.userId) {
        if (!this.connectedUsers.has(socket.userId)) {
          this.connectedUsers.set(socket.userId, new Set());
        }
        this.connectedUsers.get(socket.userId)?.add(socket.id);
      }

      // Join a una chat room specifica per la richiesta
      socket.on('join-request-chat', async (requestId: string) => {
        try {
          if (!socket.userId) return;

          // Verifica se l'utente può accedere alla chat
          const canAccess = await chatService.canAccessChat(socket.userId, requestId);
          if (!canAccess) {
            socket.emit('error', { message: 'Non hai accesso a questa chat' });
            return;
          }

          // Unisciti alla room della richiesta
          socket.join(`request-${requestId}`);
          logger.info(`User ${socket.userId} joined chat room for request ${requestId}`);

          // Invia i messaggi iniziali
          const messages = await chatService.getMessages(requestId, socket.userId);
          socket.emit('initial-messages', messages);

          // Notifica agli altri che l'utente è online
          socket.to(`request-${requestId}`).emit('user-joined', {
            userId: socket.userId,
            timestamp: new Date()
          });
        } catch (error) {
          logger.error('Error joining chat room:', error);
          socket.emit('error', { message: 'Errore nell\'accesso alla chat' });
        }
      });

      // Lascia una chat room
      socket.on('leave-request-chat', (requestId: string) => {
        socket.leave(`request-${requestId}`);
        logger.info(`User ${socket.userId} left chat room for request ${requestId}`);

        // Notifica agli altri che l'utente è offline
        socket.to(`request-${requestId}`).emit('user-left', {
          userId: socket.userId,
          timestamp: new Date()
        });
      });

      // Invia un messaggio
      socket.on('send-message', async (data: {
        requestId: string;
        message: string;
        messageType?: string;
        attachments?: any[];
      }) => {
        try {
          if (!socket.userId) return;

          // Invia il messaggio tramite il service
          const newMessage = await chatService.sendMessage({
            requestId: data.requestId,
            userId: socket.userId,
            message: data.message,
            messageType: data.messageType as any,
            attachments: data.attachments
          });

          // Invia il messaggio a tutti nella room (incluso il mittente)
          this.io.to(`request-${data.requestId}`).emit('new-message', newMessage);

          // Invia notifica push agli utenti offline
          await this.sendPushNotificationToOfflineUsers(data.requestId, socket.userId, data.message);
        } catch (error: any) {
          logger.error('Error sending message via WebSocket:', error);
          socket.emit('error', { message: error.message || 'Errore nell\'invio del messaggio' });
        }
      });

      // Modifica un messaggio
      socket.on('edit-message', async (data: {
        messageId: string;
        requestId: string;
        message: string;
      }) => {
        try {
          if (!socket.userId) return;

          const updatedMessage = await chatService.updateMessage(
            data.messageId,
            socket.userId,
            { message: data.message }
          );

          // Notifica tutti nella room della modifica
          this.io.to(`request-${data.requestId}`).emit('message-edited', updatedMessage);
        } catch (error: any) {
          logger.error('Error editing message via WebSocket:', error);
          socket.emit('error', { message: error.message || 'Errore nella modifica del messaggio' });
        }
      });

      // Elimina un messaggio
      socket.on('delete-message', async (data: {
        messageId: string;
        requestId: string;
      }) => {
        try {
          if (!socket.userId) return;

          const deletedMessage = await chatService.deleteMessage(data.messageId, socket.userId);

          // Notifica tutti nella room dell'eliminazione
          this.io.to(`request-${data.requestId}`).emit('message-deleted', {
            messageId: data.messageId,
            deletedBy: socket.userId,
            timestamp: new Date()
          });
        } catch (error: any) {
          logger.error('Error deleting message via WebSocket:', error);
          socket.emit('error', { message: error.message || 'Errore nell\'eliminazione del messaggio' });
        }
      });

      // Indicatore di digitazione
      socket.on('typing', (data: { requestId: string; isTyping: boolean }) => {
        socket.to(`request-${data.requestId}`).emit('user-typing', {
          userId: socket.userId,
          isTyping: data.isTyping,
          timestamp: new Date()
        });
      });

      // Segna messaggi come letti
      socket.on('mark-as-read', async (data: { requestId: string }) => {
        try {
          if (!socket.userId) return;

          await chatService.markMessagesAsRead(data.requestId, socket.userId);

          // Notifica il mittente che i suoi messaggi sono stati letti
          socket.to(`request-${data.requestId}`).emit('messages-read', {
            readBy: socket.userId,
            requestId: data.requestId,
            timestamp: new Date()
          });
        } catch (error) {
          logger.error('Error marking messages as read via WebSocket:', error);
        }
      });

      // Disconnessione
      socket.on('disconnect', () => {
        logger.info(`User ${socket.userId} disconnected from chat`);

        // Rimuovi l'utente dalla mappa degli utenti connessi
        if (socket.userId) {
          const userSockets = this.connectedUsers.get(socket.userId);
          if (userSockets) {
            userSockets.delete(socket.id);
            if (userSockets.size === 0) {
              this.connectedUsers.delete(socket.userId);
            }
          }
        }
      });
    });
  }

  /**
   * Invia una notifica push agli utenti offline
   */
  private async sendPushNotificationToOfflineUsers(requestId: string, senderId: string, message: string) {
    // Questa funzione può essere espansa per inviare notifiche push reali
    // Per ora logga solo l'evento
    logger.info(`Would send push notification for request ${requestId} from ${senderId}: ${message}`);
  }

  /**
   * Invia un messaggio di sistema a una chat
   */
  public sendSystemMessage(requestId: string, message: any) {
    this.io.to(`request-${requestId}`).emit('system-message', message);
  }

  /**
   * Chiudi una chat quando la richiesta viene completata
   */
  public closeChatForRequest(requestId: string, status: string) {
    this.io.to(`request-${requestId}`).emit('chat-closed', {
      requestId,
      status,
      timestamp: new Date()
    });
  }

  /**
   * Verifica se un utente è online
   */
  public isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  /**
   * Ottieni il numero di utenti online in una chat
   */
  public getOnlineUsersInChat(requestId: string): number {
    const room = this.io.sockets.adapter.rooms.get(`request-${requestId}`);
    return room ? room.size : 0;
  }
}

export default ChatWebSocket;
