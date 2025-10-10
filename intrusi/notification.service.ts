/**
 * Notification Service
 * Gestisce l'invio di notifiche attraverso vari canali (WebSocket, Email, SMS)
 * FIXED: Centralizzato completamente il sistema di notifiche
 * v2.0 - Tutti i servizi devono usare SOLO questo service per Socket.io
 */

import { PrismaClient, Prisma, NotificationPriority } from '@prisma/client';
import { Server } from 'socket.io';
import { logger } from '../utils/logger';
import { sendNotificationToUser, broadcastNotificationToOrganization } from '../websocket/handlers/notification.handler';
import { sendEmail } from './email.service';
import { v4 as uuidv4 } from 'uuid';
import { formatNotification, formatNotificationList } from '../utils/responseFormatter';
import { auditLogService } from './auditLog.service';

const prisma = new PrismaClient();

export interface NotificationData {
  userId?: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  channels?: ('websocket' | 'email' | 'sms' | 'push')[];
}

export class NotificationService {
  private io: Server | null = null;

  constructor() {
    // L'istanza di Socket.io verrà impostata dal server principale
  }

  /**
   * Imposta l'istanza di Socket.io
   * NOTA: Chiamato UNA SOLA VOLTA dal server.ts all'avvio
   */
  setIO(io: Server) {
    this.io = io;
    logger.info('✅ Socket.io instance set in NotificationService');
  }

  /**
   * Ottiene l'istanza di Socket.io
   * INTERNAL USE ONLY - Non esporre pubblicamente!
   */
  private getIO(): Server | null {
    if (!this.io) {
      logger.warn('⚠️ Socket.io not initialized in NotificationService');
    }
    return this.io;
  }

  // ============================================
  // NUOVI METODI CENTRALIZZATI PER SOCKET.IO
  // ============================================

  /**
   * Emette un evento a TUTTI i client connessi
   * Sostituisce: io.emit()
   */
  broadcast(event: string, data: any): void {
    const io = this.getIO();
    if (io) {
      io.emit(event, data);
      logger.debug(`📡 Broadcast event: ${event}`);
    } else {
      logger.warn(`⚠️ Cannot broadcast ${event}: Socket.io not initialized`);
    }
  }

  /**
   * Emette un evento a un utente specifico
   * Sostituisce: io.to(userId).emit()
   */
  emitToUser(userId: string, event: string, data: any): void {
    const io = this.getIO();
    if (io) {
      io.to(`user-${userId}`).emit(event, data);
      logger.debug(`📡 Emit to user ${userId}: ${event}`);
    } else {
      logger.warn(`⚠️ Cannot emit to user ${userId}: Socket.io not initialized`);
    }
  }

  /**
   * Emette un evento a una room specifica
   * Sostituisce: io.to(room).emit()
   */
  emitToRoom(room: string, event: string, data: any): void {
    const io = this.getIO();
    if (io) {
      io.to(room).emit(event, data);
      logger.debug(`📡 Emit to room ${room}: ${event}`);
    } else {
      logger.warn(`⚠️ Cannot emit to room ${room}: Socket.io not initialized`);
    }
  }

  /**
   * Emette un evento a tutti gli utenti con un determinato ruolo
   * Utile per notifiche admin, professional, etc.
   */
  emitToRole(role: string, event: string, data: any): void {
    const io = this.getIO();
    if (io) {
      io.to(`role-${role}`).emit(event, data);
      logger.debug(`📡 Emit to role ${role}: ${event}`);
    } else {
      logger.warn(`⚠️ Cannot emit to role ${role}: Socket.io not initialized`);
    }
  }

  /**
   * Emette un evento a una richiesta specifica
   * Tutti gli utenti che seguono quella richiesta ricevono l'evento
   */
  emitToRequest(requestId: string, event: string, data: any): void {
    const io = this.getIO();
    if (io) {
      io.to(`request-${requestId}`).emit(event, data);
      logger.debug(`📡 Emit to request ${requestId}: ${event}`);
    } else {
      logger.warn(`⚠️ Cannot emit to request ${requestId}: Socket.io not initialized`);
    }
  }

  /**
   * Emette un evento solo agli admin
   */
  emitToAdmins(event: string, data: any): void {
    this.emitToRole('ADMIN', event, data);
    this.emitToRole('SUPER_ADMIN', event, data);
  }

  /**
   * Emette un evento solo ai professional
   */
  emitToProfessionals(event: string, data: any): void {
    this.emitToRole('PROFESSIONAL', event, data);
  }

  // ============================================
  // METODI ORIGINALI MANTENUTI
  // ============================================

  /**
   * Invia una notifica a un utente specifico
   */
  async sendToUser(data: NotificationData): Promise<void> {
    if (!data.userId) {
      throw new Error('userId is required for user notifications');
    }

    try {
      // Recupera le preferenze di notifica dell'utente
      const preferences = await this.getUserPreferences(data.userId);
      const channels = data.channels || this.getDefaultChannels(data.priority);

      // FIXED: Campi database corretti con generazione UUID
      const notification = await prisma.notification.create({
        data: {
          id: uuidv4(), // ✅ FIX 1: Genera sempre UUID
          type: data.type,
          title: data.title,
          content: data.message, // ✅ FIX 2: Usa 'content' non 'message'
          recipientId: data.userId,
          priority: this.normalizePriority(data.priority), // ✅ FIX 3: Converti in MAIUSCOLO
          isRead: false,
          metadata: data.data || {} // Campo corretto per dati extra
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
        promises.push(this.sendEmailNotification(data.userId, data));
      }

      if (channels.includes('sms') && preferences.sms) {
        promises.push(this.sendSMSNotification(data.userId, data));
      }

      if (channels.includes('push') && preferences.push) {
        promises.push(this.sendPushNotification(data.userId, data));
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
          successful: successful,
          failed: failed
        },
        success: failed === 0,
        severity: failed > 0 ? 'WARNING' as any : 'INFO' as any,
        category: 'BUSINESS' as any
      });
      
      logger.info(`Notification sent to user ${data.userId}: ${data.title} (${successful} success, ${failed} failed)`);
    } catch (error) {
      logger.error('Error sending notification to user:', error);
      
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
   * Invia una notifica a tutti gli utenti
   */
  async broadcastToAll(data: NotificationData): Promise<void> {
    try {
      if (this.io) {
        // Broadcast to all connected users
        this.io.emit('notification', {
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data,
          priority: data.priority
        });
      }

      // Invia anche email se necessario
      if (data.channels?.includes('email')) {
        const users = await prisma.user.findMany({
          select: { id: true, email: true }
        });

        await Promise.allSettled(
          users.map(user => this.sendEmailNotification(user.id, data))
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
      
      logger.info(`Notification broadcasted to all users: ${data.title}`);
    } catch (error) {
      logger.error('Error broadcasting notification:', error);
      
      // Registra fallimento nel broadcast
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
   * Invia una notifica a un ruolo specifico
   */
  async sendToRole(role: string, data: NotificationData): Promise<void> {
    try {
      const users = await prisma.user.findMany({
        where: { 
          role: role as any
        },
        select: { id: true }
      });

      await Promise.allSettled(
        users.map(user => this.sendToUser({ ...data, userId: user.id }))
      );

      // Registra invio per ruolo nell'Audit Log
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
          role: role,
          recipientCount: users.length
        },
        success: true,
        severity: 'INFO' as any,
        category: 'BUSINESS' as any
      });
      
      logger.info(`Notification sent to role ${role}: ${data.title} (${users.length} users)`);
    } catch (error) {
      logger.error('Error sending notification to role:', error);
      
      // Registra fallimento nell'invio per ruolo
      await auditLogService.log({
        userId: 'system',
        ipAddress: 'system',
        userAgent: 'notification-service',
        action: 'NOTIFICATION_ROLE_FAILED' as any,
        entityType: 'Notification',
        metadata: {
          type: data.type,
          title: data.title,
          role: role,
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
   * Recupera le preferenze di notifica di un utente
   */
  private async getUserPreferences(userId: string) {
    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId: userId }
    });

    return preferences || {
      email: true,
      push: true,
      sms: false,
      websocket: true, // Default: websocket enabled
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false
    };
  }

  /**
   * Normalizza la priorità per il database (MAIUSCOLO)
   * FIX 3: Converte sempre in maiuscolo per l'enum del database
   */
  private normalizePriority(priority?: string): NotificationPriority {
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
   */
  private getDefaultChannels(priority?: string): ('websocket' | 'email' | 'sms' | 'push')[] {
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
   */
  private async sendEmailNotification(userId: string, data: NotificationData): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true, lastName: true }
      });

      if (!user) return;

      await sendEmail({
        to: user.email,
        subject: data.title,
        html: this.formatEmailContent(data, user)
      });

      // FIXED: Log notifica email nel database
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

      logger.debug(`Email notification sent to ${user.email}`);
    } catch (error) {
      logger.error('Error sending email notification:', error);
      
      // Log errore nel database
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
          failureReason: error.message
        }
      });
    }
  }

  /**
   * Invia notifica via SMS
   */
  private async sendSMSNotification(userId: string, data: NotificationData): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { phone: true }
      });

      if (!user?.phone) return;

      // TODO: Implementare invio SMS con provider (Twilio, etc.)
      logger.debug(`SMS notification would be sent to ${user.phone}`);
      
      // Log nel database
      await prisma.notificationLog.create({
        data: {
          id: uuidv4(),
          recipientId: userId,
          recipientPhone: user.phone,
          channel: 'sms',
          status: 'pending', // Cambierà quando SMS sarà implementato
          content: data.message.substring(0, 160), // SMS ha limite caratteri
          variables: data.data || {}
        }
      });
    } catch (error) {
      logger.error('Error sending SMS notification:', error);
    }
  }

  /**
   * Invia push notification
   */
  private async sendPushNotification(userId: string, data: NotificationData): Promise<void> {
    try {
      // TODO: Implementare push notifications (FCM, etc.)
      logger.debug(`Push notification would be sent to user ${userId}`);
      
      // Log nel database
      await prisma.notificationLog.create({
        data: {
          id: uuidv4(),
          recipientId: userId,
          channel: 'push',
          status: 'pending', // Cambierà quando push sarà implementato
          subject: data.title,
          content: data.message,
          variables: data.data || {}
        }
      });
    } catch (error) {
      logger.error('Error sending push notification:', error);
    }
  }

  /**
   * Formatta il contenuto dell'email
   */
  private formatEmailContent(data: NotificationData, user: any): string {
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

  /**
   * Segna una notifica come letta
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
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Segna tutte le notifiche come lette
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: {
          recipientId: userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Recupera le notifiche non lette
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
      
      return formatNotificationList(notifications);
    } catch (error) {
      logger.error('Error fetching unread notifications:', error);
      throw error;
    }
  }

  /**
   * Conta le notifiche non lette
   */
  async countUnread(userId: string): Promise<number> {
    try {
      return await prisma.notification.count({
        where: {
          recipientId: userId,
          isRead: false
        }
      });
    } catch (error) {
      logger.error('Error counting unread notifications:', error);
      return 0;
    }
  }

  /**
   * Elimina le notifiche vecchie
   */
  async cleanupOldNotifications(daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
          isRead: true
        }
      });

      // Registra cleanup nell'Audit Log
      await auditLogService.log({
        userId: 'system',
        ipAddress: 'system',
        userAgent: 'notification-service',
        action: 'NOTIFICATION_CLEANUP' as any,
        entityType: 'Notification',
        metadata: {
          daysToKeep: daysToKeep,
          deletedCount: result.count,
          cutoffDate: cutoffDate.toISOString()
        },
        success: true,
        severity: 'INFO' as any,
        category: 'SYSTEM' as any
      });
      
      logger.info(`Cleaned up ${result.count} old notifications (older than ${daysToKeep} days)`);
    } catch (error) {
      logger.error('Error cleaning up old notifications:', error);
    }
  }

  /**
   * Crea una notifica diretta nel database (utility method)
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
  }) {
    try {
      return await prisma.notification.create({
        data: {
          id: uuidv4(), // ✅ Sempre genera UUID
          recipientId: params.recipientId,
          type: params.type,
          title: params.title,
          content: params.content, // ✅ Campo corretto
          priority: params.priority || 'NORMAL', // ✅ Default MAIUSCOLO
          metadata: params.metadata || {},
          senderId: params.senderId,
          entityType: params.entityType,
          entityId: params.entityId,
          isRead: false
        }
      });
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Metodo pubblico per ottenere lo stato di Socket.io (per health check)
   * @returns Server instance o null
   */
  public getSocketIOStatus(): { isConnected: boolean; clientsCount: number } {
    const io = this.io;
    if (!io) {
      return { isConnected: false, clientsCount: 0 };
    }
    
    try {
      // Conta i client connessi
      const clientsCount = io.engine?.clientsCount || io.sockets?.sockets?.size || 0;
      return {
        isConnected: true,
        clientsCount
      };
    } catch (error) {
      return { isConnected: false, clientsCount: 0 };
    }
  }
}

// Singleton instance
export const notificationService = new NotificationService();

// Helper functions per retrocompatibilità
export const sendNotification = (data: NotificationData) => notificationService.sendToUser(data);
export const broadcastNotification = (data: NotificationData) => notificationService.broadcastToAll(data);
