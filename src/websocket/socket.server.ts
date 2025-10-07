/**
 * WebSocket Server Configuration - FIXED MEMORY LEAK v3.0
 * Gestisce tutte le connessioni real-time con autenticazione JWT
 * 
 * CHANGELOG v3.0:
 * - Aggiunto cleanup automatico connessioni zombie
 * - Implementato tracking memoria con WeakMap
 * - Aggiunto monitoring connessioni attive
 * - Fix memory leak dopo 72h
 */

import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';
import { 
  handleNotificationEvents,
  handleRequestEvents,
  handleQuoteEvents,
  handleMessageEvents 
} from './handlers';
import { chatService } from '../services/chat.service';

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  connectedAt?: Date;
  lastActivity?: Date;
}

// 🔧 FIX MEMORY LEAK - Tracking migliorato delle connessioni
const userSockets = new Map<string, Set<string>>();
const socketMetadata = new WeakMap<Socket, {
  userId: string;
  connectedAt: Date;
  lastActivity: Date;
}>();

// 📊 Metriche per monitoring
let totalConnections = 0;
let activeConnections = 0;
let peakConnections = 0;

/**
 * Pulisce le connessioni zombie e libera memoria
 */
function cleanupStaleConnections(io: Server) {
  const now = new Date();
  let cleaned = 0;
  
  // Itera su tutte le connessioni
  userSockets.forEach((socketIds, userId) => {
    const validSockets = new Set<string>();
    
    socketIds.forEach(socketId => {
      const socket = io.sockets.sockets.get(socketId);
      
      if (!socket || !socket.connected) {
        // Socket non esiste più o disconnesso - RIMUOVI
        cleaned++;
      } else {
        // Controlla se è zombie (nessuna attività da 30 minuti)
        const metadata = socketMetadata.get(socket);
        if (metadata && metadata.lastActivity) {
          const inactiveMinutes = (now.getTime() - metadata.lastActivity.getTime()) / 1000 / 60;
          
          if (inactiveMinutes > 30) {
            logger.warn(`🧟 Zombie connection detected for user ${userId}, disconnecting...`);
            socket.disconnect(true);
            cleaned++;
          } else {
            validSockets.add(socketId);
          }
        } else {
          validSockets.add(socketId);
        }
      }
    });
    
    // Aggiorna la mappa con solo socket validi
    if (validSockets.size > 0) {
      userSockets.set(userId, validSockets);
    } else {
      userSockets.delete(userId); // Rimuovi completamente l'utente se non ha socket
    }
  });
  
  if (cleaned > 0) {
    logger.info(`🧹 Cleaned ${cleaned} stale connections`);
  }
  
  // Log delle metriche
  activeConnections = io.sockets.sockets.size;
  if (activeConnections > peakConnections) {
    peakConnections = activeConnections;
  }
  
  logger.info(`📊 WebSocket Stats - Active: ${activeConnections}, Peak: ${peakConnections}, Total: ${totalConnections}`);
}

/**
 * Aggiorna l'ultima attività di un socket
 */
function updateSocketActivity(socket: AuthenticatedSocket) {
  const metadata = socketMetadata.get(socket);
  if (metadata) {
    metadata.lastActivity = new Date();
  }
}

/**
 * Middleware di autenticazione per Socket.io
 */
async function authenticateSocket(socket: AuthenticatedSocket, next: (err?: Error) => void) {
  try {
    // Prova a prendere il token da varie fonti
    const token = socket.handshake.auth.token || 
                  socket.handshake.headers.authorization?.replace('Bearer ', '') ||
                  socket.handshake.query.token;
    
    logger.debug(`WebSocket auth attempt - Token present: ${!!token}`);
    
    if (!token) {
      logger.error('WebSocket auth failed: No token provided');
      return next(new Error('Authentication token missing'));
    }

    // Verifica JWT con il secret corretto
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured!');
      return next(new Error('Server configuration error'));
    }
    
    const decoded = jwt.verify(token, jwtSecret) as any;
    logger.debug(`Token decoded successfully for User: ${decoded.userId}`);
    
    // Carica dati utente dal database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        role: true,
        email: true
      }
    });

    if (!user) {
      logger.error(`User not found for ID: ${decoded.userId}`);
      return next(new Error('User not found'));
    }

    // Assegna dati al socket
    socket.userId = user.id;
    socket.userRole = user.role;
    socket.connectedAt = new Date();
    socket.lastActivity = new Date();

    logger.info(`✅ User ${user.email} authenticated via WebSocket`);
    next();
  } catch (error) {
    logger.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
}

/**
 * Inizializza il server WebSocket con tutti gli handler
 */
export function initializeSocketServer(io: Server) {
  // Applica middleware di autenticazione
  io.use(authenticateSocket);

  // 🔧 NUOVO: Cleanup automatico ogni 5 minuti
  const cleanupInterval = setInterval(() => {
    cleanupStaleConnections(io);
  }, 5 * 60 * 1000); // 5 minuti

  // 🔧 NUOVO: Monitoring memoria ogni minuto
  const monitoringInterval = setInterval(() => {
    const memUsage = process.memoryUsage();
    logger.info(`💾 Memory Usage - RSS: ${Math.round(memUsage.rss / 1024 / 1024)}MB, Heap: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
    
    // Alert se memoria troppo alta
    if (memUsage.rss > 2 * 1024 * 1024 * 1024) { // 2GB
      logger.error('⚠️ HIGH MEMORY USAGE DETECTED! Consider restart.');
    }
  }, 60 * 1000); // 1 minuto

  io.on('connection', (socket: AuthenticatedSocket) => {
    if (!socket.userId) {
      logger.error('Socket connection rejected: No userId');
      socket.disconnect();
      return;
    }

    logger.info(`✅ Client connected: ${socket.id} (User: ${socket.userId})`);
    
    totalConnections++;
    activeConnections++;
    
    // 🔧 FIX: Salva metadata nel WeakMap (auto-cleanup quando socket viene garbage collected)
    socketMetadata.set(socket, {
      userId: socket.userId,
      connectedAt: new Date(),
      lastActivity: new Date()
    });

    // Aggiungi socket alla mappa utente
    if (!userSockets.has(socket.userId)) {
      userSockets.set(socket.userId, new Set());
    }
    userSockets.get(socket.userId)!.add(socket.id);

    // Join user-specific room
    socket.join(`user-${socket.userId}`);
    socket.join(`role-${socket.userRole}`);
    
    logger.debug(`Socket ${socket.id} joined rooms: user-${socket.userId}, role-${socket.userRole}`);

    // Notifica altri dispositivi dell'utente
    socket.to(`user-${socket.userId}`).emit('user:online', {
      deviceId: socket.id,
      timestamp: new Date()
    });

    // Registra handlers con activity tracking
    const wrapHandler = (handler: Function) => {
      return (...args: any[]) => {
        updateSocketActivity(socket);
        return handler.apply(socket, args);
      };
    };

    // Notification events
    handleNotificationEvents(socket, io);
    
    // Request events  
    handleRequestEvents(socket, io);
    
    // Quote events
    handleQuoteEvents(socket, io);
    
    // Message/Chat events
    handleMessageEvents(socket, io);

    // Join request-specific rooms
    socket.on('join:request', wrapHandler(async (requestId: string) => {
      try {
        logger.debug(`Socket ${socket.id} joining request room: ${requestId}`);
        
        // Verifica accesso alla richiesta
        const request = await prisma.request.findFirst({
          where: {
            id: requestId,
            OR: [
              { clientId: socket.userId },
              { professionalId: socket.userId }
            ]
          }
        });

        if (request) {
          socket.join(`request-${requestId}`);
          socket.emit('joined:request', { requestId, success: true });
          logger.info(`Socket ${socket.id} joined request room: ${requestId}`);
        } else {
          socket.emit('error', { 
            message: 'Non autorizzato ad accedere a questa richiesta' 
          });
        }
      } catch (error) {
        logger.error('Error joining request room:', error);
        socket.emit('error', { message: 'Errore nel join della room' });
      }
    }));

    // Chat initialization per richieste
    socket.on('chat:init', wrapHandler(async (data: { requestId: string }) => {
      try {
        await chatService.initializeChat(socket, data.requestId);
      } catch (error) {
        logger.error('Error initializing chat:', error);
        socket.emit('error', { message: 'Errore inizializzazione chat' });
      }
    }));

    // Heartbeat per tenere viva la connessione
    socket.on('ping', wrapHandler(() => {
      socket.emit('pong', { timestamp: Date.now() });
    }));

    // 🔧 FIX CRITICO: Cleanup completo su disconnect
    socket.on('disconnect', (reason) => {
      logger.info(`❌ Client disconnected: ${socket.id} (User: ${socket.userId}) - Reason: ${reason}`);
      
      activeConnections--;
      
      if (socket.userId) {
        // Rimuovi dalla mappa utenti
        const userSocketSet = userSockets.get(socket.userId);
        if (userSocketSet) {
          userSocketSet.delete(socket.id);
          
          // Se l'utente non ha più socket, rimuovi completamente
          if (userSocketSet.size === 0) {
            userSockets.delete(socket.userId);
            
            // Notifica che l'utente è offline
            io.to(`user-${socket.userId}`).emit('user:offline', {
              userId: socket.userId,
              timestamp: new Date()
            });
          }
        }
        
        // 🔧 IMPORTANTE: Rimuovi tutti i listener per prevenire memory leak
        socket.removeAllListeners();
        
        // 🔧 IMPORTANTE: Lascia tutte le rooms
        socket.rooms.forEach(room => {
          if (room !== socket.id) {
            socket.leave(room);
          }
        });
      }
      
      // Il metadata verrà automaticamente pulito dal WeakMap quando il socket viene garbage collected
      logger.debug(`Cleanup completed for socket ${socket.id}`);
    });

    // Error handling
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
      updateSocketActivity(socket);
    });
  });

  // 🔧 NUOVO: Cleanup su shutdown del server
  process.on('SIGINT', () => {
    logger.info('🛑 Shutting down WebSocket server...');
    clearInterval(cleanupInterval);
    clearInterval(monitoringInterval);
    
    // Disconnetti tutti i client
    io.sockets.sockets.forEach((socket) => {
      socket.disconnect(true);
    });
    
    // Pulisci le mappe
    userSockets.clear();
    
    logger.info('✅ WebSocket cleanup completed');
  });

  logger.info('🚀 WebSocket server initialized with memory leak protection');
}

// 🔧 NUOVO: Funzione helper per ottenere statistiche
export function getWebSocketStats() {
  return {
    activeConnections,
    peakConnections,
    totalConnections,
    users: userSockets.size,
    memoryUsage: process.memoryUsage()
  };
}