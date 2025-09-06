/**
 * Notification Service
 * Gestisce l'invio di notifiche attraverso vari canali (WebSocket, Email, SMS)
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { Server } from 'socket.io';
import { logger } from '../utils/logger';
import { sendNotificationToUser, broadcastNotificationToOrganization } from '../websocket/handlers/notification.handler';
import { sendEmail } from './email.service';
import { v4 as uuidv4 } from 'uuid';
// AGGIUNTO: ResponseFormatter per formattazione consistente
import { formatNotification, formatNotificationList } from '../utils/responseFormatter';
import { getIO } from '../utils/socket';

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
   */
  setIO(io: Server) {
    this.io = io;
  }

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

      // Salva la notifica nel database
      const notification = await prisma.notification.create({
        data: {
          id: uuidv4(), // Genera UUID per la notifica
          type: data.type,
          title: data.title,
          content: data.message, // Il campo si chiama 'content' non 'message'
          recipientId: data.userId, // Il campo si chiama 'recipientId' non 'userId'
          priority: (data.priority || 'NORMAL').toUpperCase(), // Deve essere maiuscolo
          isRead: false
        }
      });

      // Invia attraverso i canali abilitati
      const promises = [];

      if (channels.includes('websocket') && preferences.inApp && this.io) {
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

      await Promise.allSettled(promises);
      logger.info(`Notification sent to user ${data.userId}: ${data.title}`);
    } catch (error) {
      logger.error('Error sending notification to user:', error);
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

      logger.info(`Notification broadcasted to all users: ${data.title}`);
    } catch (error) {
      logger.error('Error broadcasting notification:', error);
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
          role
        },
        select: { id: true }
      });

      await Promise.allSettled(
        users.map(user => this.sendToUser({ ...data, userId: user.id }))
      );

      logger.info(`Notification sent to role ${role}: ${data.title}`);
    } catch (error) {
      logger.error('Error sending notification to role:', error);
      throw error;
    }
  }

  /**
   * Recupera le preferenze di notifica di un utente
   */
  private async getUserPreferences(userId: string) {
    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId }
    });

    return preferences || {
      email: true,
      push: true,
      sms: false,
      inApp: true
    };
  }

  /**
   * Determina i canali di default basati sulla priorità
   */
  private getDefaultChannels(priority?: string): ('websocket' | 'email' | 'sms' | 'push')[] {
    switch (priority) {
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

      logger.debug(`Email notification sent to ${user.email}`);
    } catch (error) {
      logger.error('Error sending email notification:', error);
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
          userId
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
          userId,
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
      
      // AGGIUNTO: Usa ResponseFormatter per output consistente
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
          userId,
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

      logger.info(`Cleaned up ${result.count} old notifications`);
    } catch (error) {
      logger.error('Error cleaning up old notifications:', error);
    }
  }
}

// Singleton instance
export const notificationService = new NotificationService();

// Helper functions per retrocompatibilità
export const sendNotification = (data: NotificationData) => notificationService.sendToUser(data);
export const broadcastNotification = (data: NotificationData) => notificationService.broadcastToAll(data);
