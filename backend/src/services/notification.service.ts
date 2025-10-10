/**
 * Notification Service
 * Gestisce l'invio di notifiche multi-canale (WebSocket, Email, SMS, Push)
 * Sistema centralizzato per Socket.io v3.0
 * 
 * Responsabilità:
 * - Gestione completa Socket.io centralizzata
 * - Invio notifiche multi-canale (WebSocket, Email, SMS, Push)
 * - Gestione preferenze utente per notifiche
 * - Tracking notifiche con audit log
 * - Cleanup automatico notifiche vecchie
 * - Broadcasting a utenti, ruoli, richieste
 * - Health check Socket.io
 * 
 * @module services/notification
 * @version 5.2.1
 * @updated 2025-10-01
 * @author Sistema Richiesta Assistenza
 */

import { prisma } from '../config/database';
import { Prisma, NotificationPriority } from '@prisma/client';
import { Server } from 'socket.io';
import { logger } from '../utils/logger';
import { sendNotificationToUser, broadcastNotificationToOrganization } from '../websocket/handlers/notification.handler';
import { emailService } from './email.service';
import { v4 as uuidv4 } from 'uuid';
import { auditLogService } from './auditLog.service';

/**
 * Interfaccia per i dati di notifica
 */
export interface NotificationData {
  userId?: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  channels?: ('websocket' | 'email' | 'sms' | 'push')[];
}

/**
 * Notification Service Class
 * Gestisce tutte le notifiche del sistema in modo centralizzato
 */
export class NotificationService {
  private io: Server | null = null;

  constructor() {
    // L'istanza di Socket.io verrà impostata dal server principale
    logger.info('[NotificationService] Service initialized');
  }

  // ============================================
  // SOCKET.IO MANAGEMENT
  // ============================================

  /**
   * Imposta l'istanza di Socket.io
   * NOTA: Chiamato UNA SOLA VOLTA dal server.ts all'avvio
   * 
   * @param {Server} io - Istanza Socket.io
   */
  setIO(io: Server): void {
    this.io = io;
    logger.info('[NotificationService] ✅ Socket.io instance set successfully');
  }

  /**
   * Ottiene l'istanza di Socket.io
   * INTERNAL USE ONLY - Non esporre pubblicamente!
   * 
   * @private
   * @returns {Server | null} Istanza Socket.io o null se non inizializzata
   */
  private getIO(): Server | null {
    if (!this.io) {
      logger.warn('[NotificationService] ⚠️ Socket.io not initialized');
    }
    return this.io;
  }

  // ============================================
  // METODI CENTRALIZZATI SOCKET.IO (v3.0)
  // ============================================

  /**
   * Emette un evento a TUTTI i client connessi
   * Sostituisce: io.emit()
   * 
   * @param {string} event - Nome evento
   * @param {any} data - Dati da inviare
   * 
   * @example
   * notificationService.broadcast('system:maintenance', { 
   *   message: 'Maintenance scheduled', 
   *   time: '22:00' 
   * });
   */
  broadcast(event: string, data: any): void {
    try {
      const io = this.getIO();
      if (io) {
        io.emit(event, data);
        logger.debug(`[NotificationService] 📡 Broadcast event: ${event}`);
      } else {
        logger.warn(`[NotificationService] ⚠️ Cannot broadcast ${event}: Socket.io not initialized`);
      }
    } catch (error) {
      logger.error('[NotificationService] Error in broadcast:', {
        error: error instanceof Error ? error.message : 'Unknown',
        event,
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  /**
   * Emette un evento a un utente specifico
   * Sostituisce: io.to(userId).emit()
   * 
   * @param {string} userId - ID utente
   * @param {string} event - Nome evento
   * @param {any} data - Dati da inviare
   * 
   * @example
   * notificationService.emitToUser('user123', 'quote:received', { quoteId: 'q456' });
   */
  emitToUser(userId: string, event: string, data: any): void {
    try {
      const io = this.getIO();
      if (io) {
        io.to(`user-${userId}`).emit(event, data);
        logger.debug(`[NotificationService] 📡 Emit to user ${userId}: ${event}`);
      } else {
        logger.warn(`[NotificationService] ⚠️ Cannot emit to user ${userId}: Socket.io not initialized`);
      }
    } catch (error) {
      logger.error('[NotificationService] Error in emitToUser:', {
        error: error instanceof Error ? error.message : 'Unknown',
        userId,
        event,
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  /**
   * Emette un evento a una room specifica
   * Sostituisce: io.to(room).emit()
   * 
   * @param {string} room - Nome room
   * @param {string} event - Nome evento
   * @param {any} data - Dati da inviare
   * 
   * @example
   * notificationService.emitToRoom('chat-123', 'message:new', { text: 'Hello' });
   */
  emitToRoom(room: string, event: string, data: any): void {
    try {
      const io = this.getIO();
      if (io) {
        io.to(room).emit(event, data);
        logger.debug(`[NotificationService] 📡 Emit to room ${room}: ${event}`);
      } else {
        logger.warn(`[NotificationService] ⚠️ Cannot emit to room ${room}: Socket.io not initialized`);
      }
    } catch (error) {
      logger.error('[NotificationService] Error in emitToRoom:', {
        error: error instanceof Error ? error.message : 'Unknown',
        room,
        event,
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  /**
   * Emette un evento a tutti gli utenti con un determinato ruolo
   * 
   * @param {string} role - Ruolo utente (ADMIN, PROFESSIONAL, CLIENT, etc.)
   * @param {string} event - Nome evento
   * @param {any} data - Dati da inviare
   * 
   * @example
   * notificationService.emitToRole('ADMIN', 'alert:high', { message: 'Critical error' });
   */
  emitToRole(role: string, event: string, data: any): void {
    try {
      const io = this.getIO();
      if (io) {
        io.to(`role-${role}`).emit(event, data);
        logger.debug(`[NotificationService] 📡 Emit to role ${role}: ${event}`);
      } else {
        logger.warn(`[NotificationService] ⚠️ Cannot emit to role ${role}: Socket.io not initialized`);
      }
    } catch (error) {
      logger.error('[NotificationService] Error in emitToRole:', {
        error: error instanceof Error ? error.message : 'Unknown',
        role,
        event,
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  /**
   * Emette un evento a una richiesta specifica
   * Tutti gli utenti che seguono quella richiesta ricevono l'evento
   * 
   * @param {string} requestId - ID richiesta
   * @param {string} event - Nome evento
   * @param {any} data - Dati da inviare
   * 
   * @example
   * notificationService.emitToRequest('req123', 'status:changed', { 
   *   oldStatus: 'PENDING', 
   *   newStatus: 'IN_PROGRESS' 
   * });
   */
  emitToRequest(requestId: string, event: string, data: any): void {
    try {
      const io = this.getIO();
      if (io) {
        io.to(`request-${requestId}`).emit(event, data);
        logger.debug(`[NotificationService] 📡 Emit to request ${requestId}: ${event}`);
      } else {
        logger.warn(`[NotificationService] ⚠️ Cannot emit to request ${requestId}: Socket.io not initialized`);
      }
    } catch (error) {
      logger.error('[NotificationService] Error in emitToRequest:', {
        error: error instanceof Error ? error.message : 'Unknown',
        requestId,
        event,
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  /**
   * Emette un evento solo agli amministratori
   * 
   * @param {string} event - Nome evento
   * @param {any} data - Dati da inviare
   * 
   * @example
   * notificationService.emitToAdmins('system:error', { level: 'critical' });
   */
  emitToAdmins(event: string, data: any): void {
    this.emitToRole('ADMIN', event, data);
    this.emitToRole('SUPER_ADMIN', event, data);
  }

  /**
   * Emette un evento solo ai professionisti
   * 
   * @param {string} event - Nome evento
   * @param {any} data - Dati da inviare
   * 
   * @example
   * notificationService.emitToProfessionals('request:new', { requestId: 'req123' });
   */
  emitToProfessionals(event: string, data: any): void {
    this.emitToRole('PROFESSIONAL', event, data);
  }

  // ============================================
  // NOTIFICHE MULTI-CANALE
  // ============================================

  /**
   * Invia una notifica a un utente specifico attraverso i canali abilitati
   * 
   * @param {NotificationData} data - Dati notifica
   * @returns {Promise<void>}
   * @throws {Error} Se userId mancante o errore invio
   * 
   * @example
   * await notificationService.sendToUser({
   *   userId: 'user123',
   *   type: 'quote_received',
   *   title: 'Nuovo Preventivo',
   *   message: 'Hai ricevuto un nuovo preventivo',
   *   priority: 'high',
   *   channels: ['websocket', 'email']
   * });
   */
  async sendToUser(data: NotificationData): Promise<void> {
    if (!data.userId) {
      throw new Error('userId is required for user notifications');
    }

    try {
      logger.info(`[NotificationService] Sending notification to user: ${data.userId}`, {
        type: data.type,
        title: data.title
      });

      // Recupera le preferenze di notifica dell'utente
      const preferences = await this._getUserPreferences(data.userId);
      const channels = data.channels || this._getDefaultChannels(data.priority);

      // Crea notifica nel database
      const notification = await prisma.notification.create({
        data: {
          id: uuidv4(),
          type: data.type,
          title: data.title,
          content: data.message,
          recipientId: data.userId,
          priority: this._normalizePriority(data.priority),
          isRead: false,
          metadata: data.data || {}
        }
      });

      // Invia attraverso i canali abilitati
      const promises = [];

      if (channels.includes('websocket') && preferences.websocket && this.io) {
        promises.push(
          sendNotificationToUser(this.io, data.userId, {
            type: data.type,
            title: data.title,
            message: data.message,
            data: data.data,
            priority: data.priority
          })
        );
      }

      if (channels.includes('email') && preferences.email) {
        promises.push(this._sendEmailNotification(data.userId, data));
      }

      if (channels.includes('sms') && preferences.sms) {
        promises.push(this._sendSMSNotification(data.userId, data));
      }

      if (channels.includes('push') && preferences.push) {
        promises.push(this._sendPushNotification(data.userId, data));
      }

      const results = await Promise.allSettled(promises);
      
      // Conta successi e fallimenti
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      // Registra nell'Audit Log
      await auditLogService.log({
        userId: data.userId,
        ipAddress: 'system',
        userAgent: 'notification-service',
        action: 'NOTIFICATION_SENT' as any,
        entityType: 'Notification',
        entityId: notification.id,
        newValues: {
          type: data.type,
          title: data.title,
          channels: channels.join(', '),
          priority: data.priority
        },
        metadata: {
          channelsUsed: channels,
          successful,
          failed
        },
        success: failed === 0,
        severity: failed > 0 ? 'WARNING' as any : 'INFO' as any,
        category: 'BUSINESS' as any
      });
      
      logger.info(`[NotificationService] Notification sent successfully`, {
        userId: data.userId,
        title: data.title,
        successful,
        failed
      });
    } catch (error) {
      logger.error('[NotificationService] Error sending notification to user:', {
        error: error instanceof Error ? error.message : 'Unknown',
        userId: data.userId,
        type: data.type,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Registra fallimento nell'Audit Log
      await auditLogService.log({
        userId: data.userId,
        ipAddress: 'system',
        userAgent: 'notification-service',
        action: 'NOTIFICATION_FAILED' as any,
        entityType: 'Notification',
        metadata: {
          type: data.type,
          title: data.title,
          error: (error as Error).message
        },
        success: false,
        errorMessage: (error as Error).message,
        severity: 'ERROR' as any,
        category: 'BUSINESS' as any
      });
      
      throw error;
    }
  }

  /**
   * Invia una notifica broadcast a tutti gli utenti
   * 
   * @param {NotificationData} data - Dati notifica
   * @returns {Promise<void>}
   * @throws {Error} Se errore invio
   * 
   * @example
   * await notificationService.broadcastToAll({
   *   type: 'system_maintenance',
   *   title: 'Manutenzione Programmata',
   *   message: 'Il sistema sarà offline dalle 22:00',
   *   priority: 'urgent'
   * });
   */
  async broadcastToAll(data: NotificationData): Promise<void> {
    try {
      logger.info('[NotificationService] Broadcasting notification to all users', {
        type: data.type,
        title: data.title
      });

      if (this.io) {
        // Broadcast via WebSocket
        this.io.emit('notification', {
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data,
          priority: data.priority
        });
      }

      // Invia anche email se richiesto
      if (data.channels?.includes('email')) {
        const users = await prisma.user.findMany({
          select: { id: true, email: true }
        });

        await Promise.allSettled(
          users.map(user => this._sendEmailNotification(user.id, data))
        );
      }

      // Registra broadcast nell'Audit Log
      await auditLogService.log({
        userId: 'system',
        ipAddress: 'system',
        userAgent: 'notification-service',
        action: 'NOTIFICATION_BROADCAST' as any,
        entityType: 'Notification',
        newValues: {
          type: data.type,
          title: data.title,
          channels: data.channels?.join(', ') || 'websocket'
        },
        metadata: {
          broadcast: true,
          channelsUsed: data.channels || ['websocket']
        },
        success: true,
        severity: 'INFO' as any,
        category: 'BUSINESS' as any
      });
      
      logger.info('[NotificationService] Broadcast completed successfully', {
        type: data.type,
        title: data.title
      });
    } catch (error) {
      logger.error('[NotificationService] Error broadcasting notification:', {
        error: error instanceof Error ? error.message : 'Unknown',
        type: data.type,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Registra fallimento
      await auditLogService.log({
        userId: 'system',
        ipAddress: 'system',
        userAgent: 'notification-service',
        action: 'NOTIFICATION_BROADCAST_FAILED' as any,
        entityType: 'Notification',
        metadata: {
          type: data.type,
          title: data.title,
          error: (error as Error).message
        },
        success: false,
        errorMessage: (error as Error).message,
        severity: 'ERROR' as any,
        category: 'BUSINESS' as any
      });
      
      throw error;
    }
  }

  /**
   * Invia una notifica a tutti gli utenti con un determinato ruolo
   * 
   * @param {string} role - Ruolo target (ADMIN, PROFESSIONAL, CLIENT, etc.)
   * @param {NotificationData} data - Dati notifica
   * @returns {Promise<void>}
   * @throws {Error} Se errore invio
   * 
   * @example
   * await notificationService.sendToRole('ADMIN', {
   *   type: 'system_alert',
   *   title: 'Errore Critico',
   *   message: 'Verificare il server database',
   *   priority: 'urgent'
   * });
   */
  async sendToRole(role: string, data: NotificationData): Promise<void> {
    try {
      logger.info(`[NotificationService] Sending notification to role: ${role}`, {
        type: data.type
      });

      const users = await prisma.user.findMany({
        where: { 
          role: role as any
        },
        select: { id: true }
      });

      await Promise.allSettled(
        users.map(user => this.sendToUser({ ...data, userId: user.id }))
      );

      // Registra nell'Audit Log
      await auditLogService.log({
        userId: 'system',
        ipAddress: 'system',
        userAgent: 'notification-service',
        action: 'NOTIFICATION_SENT_TO_ROLE' as any,
        entityType: 'Notification',
        newValues: {
          type: data.type,
          title: data.title,
          targetRole: role,
          userCount: users.length
        },
        metadata: {
          role,
          recipientCount: users.length
        },
        success: true,
        severity: 'INFO' as any,
        category: 'BUSINESS' as any
      });
      
      logger.info(`[NotificationService] Notification sent to role successfully`, {
        role,
        userCount: users.length
      });
    } catch (error) {
      logger.error('[NotificationService] Error sending notification to role:', {
        error: error instanceof Error ? error.message : 'Unknown',
        role,
        type: data.type,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Registra fallimento
      await auditLogService.log({
        userId: 'system',
        ipAddress: 'system',
        userAgent: 'notification-service',
        action: 'NOTIFICATION_ROLE_FAILED' as any,
        entityType: 'Notification',
        metadata: {
          type: data.type,
          title: data.title,
          role,
          error: (error as Error).message
        },
        success: false,
        errorMessage: (error as Error).message,
        severity: 'ERROR' as any,
        category: 'BUSINESS' as any
      });
      
      throw error;
    }
  }

  // ============================================
  // GESTIONE NOTIFICHE
  // ============================================

  /**
   * Segna una notifica come letta
   * 
   * @param {string} notificationId - ID notifica
   * @param {string} userId - ID utente
   * @returns {Promise<void>}
   * @throws {Error} Se errore aggiornamento
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          recipientId: userId
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      logger.debug('[NotificationService] Notification marked as read', {
        notificationId,
        userId
      });
    } catch (error) {
      logger.error('[NotificationService] Error marking notification as read:', {
        error: error instanceof Error ? error.message : 'Unknown',
        notificationId,
        userId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Segna tutte le notifiche di un utente come lette
   * 
   * @param {string} userId - ID utente
   * @returns {Promise<void>}
   * @throws {Error} Se errore aggiornamento
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          recipientId: userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      logger.info('[NotificationService] All notifications marked as read', {
        userId,
        count: result.count
      });
    } catch (error) {
      logger.error('[NotificationService] Error marking all notifications as read:', {
        error: error instanceof Error ? error.message : 'Unknown',
        userId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Recupera le notifiche non lette di un utente
   * 
   * @param {string} userId - ID utente
   * @param {number} limit - Numero massimo notifiche (default: 50)
   * @returns {Promise<any[]>} Lista notifiche non lette (PURE DATA)
   * @throws {Error} Se errore recupero
   */
  async getUnread(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          recipientId: userId,
          isRead: false
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
      });
      
      logger.debug('[NotificationService] Retrieved unread notifications', {
        userId,
        count: notifications.length
      });

      // ✅ RETURN PURE DATA (no ResponseFormatter)
      return notifications;
    } catch (error) {
      logger.error('[NotificationService] Error fetching unread notifications:', {
        error: error instanceof Error ? error.message : 'Unknown',
        userId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Conta le notifiche non lette di un utente
   * 
   * @param {string} userId - ID utente
   * @returns {Promise<number>} Numero notifiche non lette
   */
  async countUnread(userId: string): Promise<number> {
    try {
      const count = await prisma.notification.count({
        where: {
          recipientId: userId,
          isRead: false
        }
      });

      return count;
    } catch (error) {
      logger.error('[NotificationService] Error counting unread notifications:', {
        error: error instanceof Error ? error.message : 'Unknown',
        userId,
        stack: error instanceof Error ? error.stack : undefined
      });
      return 0;
    }
  }

  /**
   * Elimina le notifiche vecchie già lette
   * 
   * @param {number} daysToKeep - Giorni di retention (default: 30)
   * @returns {Promise<void>}
   */
  async cleanupOldNotifications(daysToKeep: number = 30): Promise<void> {
    try {
      logger.info('[NotificationService] Starting notifications cleanup', {
        daysToKeep
      });

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
          isRead: true
        }
      });

      // Registra nell'Audit Log
      await auditLogService.log({
        userId: 'system',
        ipAddress: 'system',
        userAgent: 'notification-service',
        action: 'NOTIFICATION_CLEANUP' as any,
        entityType: 'Notification',
        metadata: {
          daysToKeep,
          deletedCount: result.count,
          cutoffDate: cutoffDate.toISOString()
        },
        success: true,
        severity: 'INFO' as any,
        category: 'SYSTEM' as any
      });
      
      logger.info('[NotificationService] Cleanup completed successfully', {
        deletedCount: result.count,
        daysToKeep
      });
    } catch (error) {
      logger.error('[NotificationService] Error cleaning up old notifications:', {
        error: error instanceof Error ? error.message : 'Unknown',
        daysToKeep,
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  /**
   * Crea una notifica diretta nel database (utility method)
   * 
   * @param {Object} params - Parametri notifica
   * @returns {Promise<any>} Notifica creata (PURE DATA)
   * @throws {Error} Se errore creazione
   */
  async createNotification(params: {
    recipientId: string;
    type: string;
    title: string;
    content: string;
    priority?: NotificationPriority;
    metadata?: any;
    senderId?: string;
    entityType?: string;
    entityId?: string;
  }): Promise<any> {
    try {
      const notification = await prisma.notification.create({
        data: {
          id: uuidv4(),
          recipientId: params.recipientId,
          type: params.type,
          title: params.title,
          content: params.content,
          priority: params.priority || 'NORMAL',
          metadata: params.metadata || {},
          senderId: params.senderId,
          entityType: params.entityType,
          entityId: params.entityId,
          isRead: false
        }
      });

      logger.info('[NotificationService] Notification created', {
        notificationId: notification.id,
        recipientId: params.recipientId
      });

      // ✅ RETURN PURE DATA
      return notification;
    } catch (error) {
      logger.error('[NotificationService] Error creating notification:', {
        error: error instanceof Error ? error.message : 'Unknown',
        recipientId: params.recipientId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Ottiene lo stato di Socket.io (per health check)
   * 
   * @returns {{ isConnected: boolean; clientsCount: number }}
   */
  public getSocketIOStatus(): { isConnected: boolean; clientsCount: number } {
    const io = this.io;
    if (!io) {
      return { isConnected: false, clientsCount: 0 };
    }
    
    try {
      const clientsCount = io.engine?.clientsCount || io.sockets?.sockets?.size || 0;
      return {
        isConnected: true,
        clientsCount
      };
    } catch (error) {
      logger.error('[NotificationService] Error getting Socket.io status:', {
        error: error instanceof Error ? error.message : 'Unknown'
      });
      return { isConnected: false, clientsCount: 0 };
    }
  }

  // ============================================
  // METODI PRIVATI
  // ============================================

  /**
   * Recupera le preferenze di notifica di un utente
   * 
   * @private
   * @param {string} userId - ID utente
   * @returns {Promise<any>} Preferenze utente
   */
  private async _getUserPreferences(userId: string): Promise<any> {
    try {
      const preferences = await prisma.notificationPreference.findUnique({
        where: { userId }
      });

      return preferences || {
        email: true,
        push: true,
        sms: false,
        websocket: true,
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false
      };
    } catch (error) {
      logger.warn('[NotificationService] Error fetching user preferences, using defaults', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown'
      });
      return {
        email: true,
        push: true,
        sms: false,
        websocket: true
      };
    }
  }

  /**
   * Normalizza la priorità per il database (MAIUSCOLO)
   * 
   * @private
   * @param {string} priority - Priorità input
   * @returns {NotificationPriority} Priorità normalizzata
   */
  private _normalizePriority(priority?: string): NotificationPriority {
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
   * Determina i canali di default basati sulla priorità
   * 
   * @private
   * @param {string} priority - Priorità notifica
   * @returns {Array} Canali da usare
   */
  private _getDefaultChannels(priority?: string): ('websocket' | 'email' | 'sms' | 'push')[] {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return ['websocket', 'email', 'sms', 'push'];
      case 'high':
        return ['websocket', 'email', 'push'];
      case 'normal':
        return ['websocket', 'email'];
      case 'low':
      default:
        return ['websocket'];
    }
  }

  /**
   * Invia notifica via email
   * 
   * @private
   * @param {string} userId - ID utente
   * @param {NotificationData} data - Dati notifica
   * @returns {Promise<void>}
   */
  private async _sendEmailNotification(userId: string, data: NotificationData): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true, lastName: true }
      });

      if (!user) return;

      await emailService.sendEmail({
        to: user.email,
        subject: data.title,
        html: this._formatEmailContent(data, user)
      });

      // Log nel database
      await prisma.notificationLog.create({
        data: {
          id: uuidv4(),
          recipientId: userId,
          recipientEmail: user.email,
          channel: 'email',
          status: 'sent',
          subject: data.title,
          content: data.message,
          variables: data.data || {},
          sentAt: new Date()
        }
      });

      logger.debug('[NotificationService] Email notification sent', {
        userId,
        email: user.email
      });
    } catch (error) {
      logger.error('[NotificationService] Error sending email notification:', {
        error: error instanceof Error ? error.message : 'Unknown',
        userId
      });
      
      // Log errore nel database
      try {
        await prisma.notificationLog.create({
          data: {
            id: uuidv4(),
            recipientId: userId,
            channel: 'email',
            status: 'failed',
            subject: data.title,
            content: data.message,
            variables: data.data || {},
            failedAt: new Date(),
            failureReason: (error as Error).message
          }
        });
      } catch (logError) {
        logger.error('[NotificationService] Failed to log email error', { logError });
      }
    }
  }

  /**
   * Invia notifica via SMS (TODO: implementare provider)
   * 
   * @private
   * @param {string} userId - ID utente
   * @param {NotificationData} data - Dati notifica
   * @returns {Promise<void>}
   */
  private async _sendSMSNotification(userId: string, data: NotificationData): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { phone: true }
      });

      if (!user?.phone) return;

      // TODO: Implementare invio SMS con provider (Twilio, etc.)
      logger.debug('[NotificationService] SMS notification would be sent', {
        userId,
        phone: user.phone
      });
      
      // Log nel database
      await prisma.notificationLog.create({
        data: {
          id: uuidv4(),
          recipientId: userId,
          recipientPhone: user.phone,
          channel: 'sms',
          status: 'pending',
          content: data.message.substring(0, 160),
          variables: data.data || {}
        }
      });
    } catch (error) {
      logger.error('[NotificationService] Error sending SMS notification:', {
        error: error instanceof Error ? error.message : 'Unknown',
        userId
      });
    }
  }

  /**
   * Invia push notification (TODO: implementare FCM)
   * 
   * @private
   * @param {string} userId - ID utente
   * @param {NotificationData} data - Dati notifica
   * @returns {Promise<void>}
   */
  private async _sendPushNotification(userId: string, data: NotificationData): Promise<void> {
    try {
      // TODO: Implementare push notifications (FCM, etc.)
      logger.debug('[NotificationService] Push notification would be sent', {
        userId
      });
      
      // Log nel database
      await prisma.notificationLog.create({
        data: {
          id: uuidv4(),
          recipientId: userId,
          channel: 'push',
          status: 'pending',
          subject: data.title,
          content: data.message,
          variables: data.data || {}
        }
      });
    } catch (error) {
      logger.error('[NotificationService] Error sending push notification:', {
        error: error instanceof Error ? error.message : 'Unknown',
        userId
      });
    }
  }

  /**
   * Formatta il contenuto dell'email con template HTML
   * 
   * @private
   * @param {NotificationData} data - Dati notifica
   * @param {any} user - Dati utente
   * @returns {string} HTML formattato
   */
  private _formatEmailContent(data: NotificationData, user: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3B82F6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #3B82F6; 
            color: white; 
            text-decoration: none; 
            border-radius: 4px;
            margin-top: 16px;
          }
          .footer { margin-top: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${data.title}</h2>
          </div>
          <div class="content">
            <p>Ciao ${user.firstName},</p>
            <p>${data.message}</p>
            ${data.data?.actionUrl ? `
              <a href="${data.data.actionUrl}" class="button">Visualizza Dettagli</a>
            ` : ''}
          </div>
          <div class="footer">
            <p>Questa è una notifica automatica dal Sistema di Richiesta Assistenza.</p>
            <p>Per modificare le tue preferenze di notifica, accedi al tuo profilo.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

/**
 * Export Singleton Instance
 * Usa questa istanza in tutto il sistema
 */
export const notificationService = new NotificationService();

/**
 * Helper functions per retrocompatibilità
 * @deprecated Usa notificationService.sendToUser() invece
 */
export const sendNotification = (data: NotificationData) => notificationService.sendToUser(data);

/**
 * @deprecated Usa notificationService.broadcastToAll() invece
 */
export const broadcastNotification = (data: NotificationData) => notificationService.broadcastToAll(data);
