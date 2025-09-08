/**
 * Notification Event Handlers
 * Gestisce tutti gli eventi relativi alle notifiche real-time
 * FIXED: Corretti problemi di nomenclatura database e generazione UUID
 */

import { Server } from 'socket.io';
import { PrismaClient, NotificationPriority } from '@prisma/client';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

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

export function handleNotificationEvents(socket: AuthenticatedSocket, io: Server) {
  /**
   * Recupera tutte le notifiche non lette dell'utente
   */
  socket.on('notification:getUnread', async () => {
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          recipientId: socket.userId!,
          isRead: false
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50
      });

      socket.emit('notification:unreadList', {
        notifications,
        count: notifications.length
      });
    } catch (error) {
      logger.error('Error fetching unread notifications:', error);
      socket.emit('error', { message: 'Failed to fetch notifications' });
    }
  });

  /**
   * Segna una notifica come letta
   */
  socket.on('notification:markAsRead', async (notificationId: string) => {
    try {
      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          recipientId: socket.userId!
        }
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      await prisma.notification.update({
        where: { id: notificationId },
        data: { 
          isRead: true, 
          readAt: new Date() 
        }
      });

      socket.emit('notification:marked', { 
        id: notificationId, 
        isRead: true 
      });

      // Aggiorna il contatore
      const unreadCount = await prisma.notification.count({
        where: {
          recipientId: socket.userId!,
          isRead: false
        }
      });

      socket.emit('notification:unreadCount', { count: unreadCount });
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      socket.emit('error', { message: 'Failed to mark notification as read' });
    }
  });

  /**
   * Segna tutte le notifiche come lette
   */
  socket.on('notification:markAllAsRead', async () => {
    try {
      await prisma.notification.updateMany({
        where: {
          recipientId: socket.userId!,
          isRead: false
        },
        data: { 
          isRead: true, 
          readAt: new Date() 
        }
      });

      socket.emit('notification:allMarked', { success: true });
      socket.emit('notification:unreadCount', { count: 0 });
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      socket.emit('error', { message: 'Failed to mark all notifications as read' });
    }
  });

  /**
   * Elimina una notifica
   */
  socket.on('notification:delete', async (notificationId: string) => {
    try {
      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          recipientId: socket.userId!
        }
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      await prisma.notification.delete({
        where: { id: notificationId }
      });

      socket.emit('notification:deleted', { id: notificationId });

      // Aggiorna il contatore
      const unreadCount = await prisma.notification.count({
        where: {
          recipientId: socket.userId!,
          isRead: false
        }
      });

      socket.emit('notification:unreadCount', { count: unreadCount });
    } catch (error) {
      logger.error('Error deleting notification:', error);
      socket.emit('error', { message: 'Failed to delete notification' });
    }
  });

  /**
   * Recupera le preferenze di notifica dell'utente
   */
  socket.on('notification:getPreferences', async () => {
    try {
      const preferences = await prisma.notificationPreference.findUnique({
        where: { userId: socket.userId! }
      });

      socket.emit('notification:preferences', preferences || {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false
      });
    } catch (error) {
      logger.error('Error fetching notification preferences:', error);
      socket.emit('error', { message: 'Failed to fetch preferences' });
    }
  });

  /**
   * Aggiorna le preferenze di notifica
   */
  socket.on('notification:updatePreferences', async (preferences: any) => {
    try {
      const updated = await prisma.notificationPreference.upsert({
        where: { userId: socket.userId! },
        update: preferences,
        create: {
          id: uuidv4(), // ✅ FIX: Genera UUID per nuove preferenze
          userId: socket.userId!,
          ...preferences
        }
      });

      socket.emit('notification:preferencesUpdated', updated);
    } catch (error) {
      logger.error('Error updating notification preferences:', error);
      socket.emit('error', { message: 'Failed to update preferences' });
    }
  });
}

/**
 * Invia una notifica real-time a un utente specifico
 * FIXED: Corretti campi database e generazione UUID
 */
export async function sendNotificationToUser(
  io: Server,
  userId: string,
  notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  }
) {
  try {
    // ✅ FIX: Salva nel database con campi corretti
    const saved = await prisma.notification.create({
      data: {
        id: uuidv4(), // ✅ FIX 1: Genera sempre UUID
        recipientId: userId,
        type: notification.type,
        title: notification.title,
        content: notification.message, // ✅ FIX 2: Usa 'content' non 'message'
        metadata: notification.data || {}, // Campo corretto per dati extra
        priority: normalizePriority(notification.priority), // ✅ FIX 3: Converti in MAIUSCOLO
        isRead: false
      }
    });

    // Invia via WebSocket se l'utente è online
    io.to(`user:${userId}`).emit('notification:new', {
      ...saved,
      timestamp: new Date()
    });

    // Aggiorna il contatore
    const unreadCount = await prisma.notification.count({
      where: {
        recipientId: userId,
        isRead: false
      }
    });

    io.to(`user:${userId}`).emit('notification:unreadCount', { count: unreadCount });

    logger.info(`Notification sent to user ${userId}: ${notification.title}`);
    return saved;
  } catch (error) {
    logger.error('Error sending notification:', error);
    throw error;
  }
}

/**
 * Invia una notifica a tutti gli utenti di un'organizzazione
 * FIXED: Corretti campi database e generazione UUID
 */
export async function broadcastNotificationToOrganization(
  io: Server,
  notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  }
) {
  try {
    // Trova tutti gli utenti dell'organizzazione
    const users = await prisma.user.findMany({
      select: { id: true }
    });

    // ✅ FIX: Crea notifiche per tutti gli utenti con campi corretti
    const notificationData = users.map(user => ({
      id: uuidv4(), // ✅ FIX 1: Genera UUID per ogni notifica
      recipientId: user.id,
      type: notification.type,
      title: notification.title,
      content: notification.message, // ✅ FIX 2: Usa 'content'
      metadata: notification.data || {},
      priority: normalizePriority(notification.priority), // ✅ FIX 3: MAIUSCOLO
      isRead: false
    }));

    const notifications = await prisma.notification.createMany({
      data: notificationData
    });

    // Broadcast via WebSocket
    io.emit('notification:new', {
      ...notification,
      timestamp: new Date()
    });

    return notifications;
  } catch (error) {
    logger.error('Error broadcasting notification:', error);
    throw error;
  }
}

/**
 * Helper per normalizzare la priorità in MAIUSCOLO per il database
 * ✅ FIX 3: Funzione helper per convertire priority
 */
function normalizePriority(priority?: string): NotificationPriority {
  const normalizedPriority = (priority || 'normal').toUpperCase();
  switch (normalizedPriority) {
    case 'LOW':
      return 'LOW';
    case 'HIGH':
      return 'HIGH';
    case 'URGENT':
      return 'URGENT';
    case 'NORMAL':
    default:
      return 'NORMAL';
  }
}

/**
 * Invia una notifica a un gruppo di utenti
 * FIXED: Aggiunto metodo helper con campi corretti
 */
export async function sendNotificationToGroup(
  io: Server,
  userIds: string[],
  notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  }
) {
  try {
    // ✅ Crea notifiche per il gruppo con campi corretti
    const notificationData = userIds.map(userId => ({
      id: uuidv4(), // ✅ FIX 1: UUID per ogni notifica
      recipientId: userId,
      type: notification.type,
      title: notification.title,
      content: notification.message, // ✅ FIX 2: Campo corretto
      metadata: notification.data || {},
      priority: normalizePriority(notification.priority), // ✅ FIX 3: MAIUSCOLO
      isRead: false
    }));

    const notifications = await prisma.notification.createMany({
      data: notificationData
    });

    // Invia via WebSocket a ogni utente
    for (const userId of userIds) {
      io.to(`user:${userId}`).emit('notification:new', {
        ...notification,
        timestamp: new Date()
      });

      // Aggiorna contatore per ogni utente
      const unreadCount = await prisma.notification.count({
        where: {
          recipientId: userId,
          isRead: false
        }
      });

      io.to(`user:${userId}`).emit('notification:unreadCount', { count: unreadCount });
    }

    logger.info(`Notification sent to ${userIds.length} users: ${notification.title}`);
    return notifications;
  } catch (error) {
    logger.error('Error sending notification to group:', error);
    throw error;
  }
}
