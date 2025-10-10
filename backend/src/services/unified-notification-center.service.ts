// backend/src/services/unified-notification-center.service.ts
/**
 * Centro Notifiche Unificato
 * Gestisce tutti i canali di comunicazione in modo centralizzato
 * 
 * VERSIONE CORRETTA: TypeScript Strict Mode + AuditLog Fix
 * Data: 09/10/2025
 */

import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import * as nodemailer from 'nodemailer';
import { Server as SocketServer } from 'socket.io';
import { Prisma, NotificationPriority as PrismaNotificationPriority } from '@prisma/client';
// import * as webpush from 'web-push'; // Commentato temporaneamente
// import * as twilio from 'twilio'; // Commentato temporaneamente
import { pecService } from './pec.service';
import * as whatsappService from './whatsapp.service';
import { auditLogService } from './auditLog.service'; // ✅ CORRETTO
import * as Redis from 'ioredis';

// ==================== TIPI ====================

// Tipi di canali disponibili
export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  PEC = 'PEC',
  PUSH = 'PUSH',
  WEBSOCKET = 'WEBSOCKET',
  IN_APP = 'IN_APP'
}

// ✅ Importa direttamente il tipo Prisma e usalo come type locale
type NotificationPriority = PrismaNotificationPriority;

// Tipo di notifica
export enum NotificationType {
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  MAINTENANCE = 'MAINTENANCE',
  UPDATE = 'UPDATE',
  REQUEST_CREATED = 'REQUEST_CREATED',
  QUOTE_RECEIVED = 'QUOTE_RECEIVED',
  QUOTE_ACCEPTED = 'QUOTE_ACCEPTED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  MESSAGE = 'MESSAGE',
  REMINDER = 'REMINDER',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  COMPLAINT_SENT = 'COMPLAINT_SENT',
  COMPLAINT_RESPONSE = 'COMPLAINT_RESPONSE',
  PROMOTION = 'PROMOTION',
  NEWSLETTER = 'NEWSLETTER'
}

interface NotificationAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

interface NotificationPayload {
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  channels?: NotificationChannel[];
  templateId?: string;
  scheduledAt?: Date;
  expiresAt?: Date;
  requiresAction?: boolean;
  actionUrl?: string;
  actionLabel?: string;
  attachments?: NotificationAttachment[];
  metadata?: Record<string, unknown>;
}

interface ChannelResult {
  channel: NotificationChannel;
  success: boolean;
  messageId?: string;
  deliveredAt?: Date;
  error?: string;
}

interface NotificationResult {
  notificationId: string;
  channels: ChannelResult[];
  createdAt: Date;
}

interface UserPreferences {
  userId: string;
  channels: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
    push: boolean;
    inApp: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  priorities: {
    [key in NotificationPriority]: NotificationChannel[];
  };
  blockedTypes: NotificationType[];
}

interface SendResult {
  messageId: string;
  accepted?: string[];
  sent?: boolean;
  emitted?: boolean;
  stored?: boolean;
}

interface UserWithPreferences {
  id: string;
  email: string;
  phone: string | null;
  whatsappNumber: string | null;
  pecEmail: string | null;
  notificationPreference: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    smsNotifications?: boolean;
    notificationTypes?: any;
    quietHoursStart?: string | null;
    quietHoursEnd?: string | null;
  } | null;
  pushSubscriptions: Array<{
    id: string;
    isActive: boolean;
  }>;
  preferences?: {
    quietHours?: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
}

class UnifiedNotificationCenter {
  private io: SocketServer | null = null;
  private emailTransporter: nodemailer.Transporter;
  private smsClient: unknown | null = null; // twilio non installato
  private redis: Redis.Redis;
  private pushVapidKeys: unknown; // webpush non installato

  constructor() {
    this.initializeServices();
    this.redis = new Redis.Redis(
      process.env.REDIS_URL || 'redis://localhost:6379'
    );
  }

  /**
   * Inizializza tutti i servizi di notifica
   */
  private initializeServices(): void {
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    logger.info('✅ Centro Notifiche Unificato inizializzato');
  }

  /**
   * Imposta il server Socket.io per WebSocket
   */
  setSocketServer(io: SocketServer): void {
    this.io = io;
    logger.info('✅ WebSocket server collegato al Centro Notifiche');
  }

  /**
   * Invia notifica attraverso tutti i canali appropriati
   */
  async send(payload: NotificationPayload): Promise<NotificationResult> {
    try {
      this.validatePayload(payload);

      const user = await this.getUserWithPreferences(payload.userId);

      if (!user) {
        throw new Error(`Utente ${payload.userId} non trovato`);
      }

      if (this.isInQuietHours(user.preferences)) {
        if (
          payload.priority !== NotificationPriority.CRITICAL &&
          payload.priority !== NotificationPriority.URGENT
        ) {
          await this.scheduleAfterQuietHours(payload, user);
          return {
            notificationId: 'scheduled',
            channels: [],
            createdAt: new Date(),
          };
        }
      }

      const channels = this.determineChannels(payload, user);

      const notification = await prisma.notification.create({
        data: {
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          recipientId: payload.userId,
          type: payload.type,
          priority: payload.priority as any, // ✅ Cast per compatibilitÃ 
          title: payload.title,
          content: payload.message,
          metadata: (payload.metadata || {}) as Prisma.InputJsonValue,
        },
      });

      const results = await this.sendToChannels(
        notification.id,
        channels,
        payload,
        user
      );

      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          readAt: results.every((r) => r.success) ? new Date() : null,
        },
      });

      // ✅ Log Audit con campi obbligatori
      await auditLogService.log({
        action: 'CREATE', // Azione generica, puoi personalizzare
        entityType: 'Notification',
        entityId: notification.id,
        userId: payload.userId,
        ipAddress: 'notification-service', // Sistema automatico
        userAgent: 'unified-notification-center', // Service name
        success: true,
        severity: 'INFO',
        category: 'BUSINESS',
        metadata: {
          type: payload.type,
          priority: payload.priority,
          channels: channels.map((c) => c.toString()),
          results,
        },
      });

      return {
        notificationId: notification.id,
        channels: results,
        createdAt: notification.createdAt,
      };
    } catch (error) {
      logger.error('Errore invio notifica:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // ✅ Log Audit errore
      await auditLogService.log({
        action: 'CREATE',
        entityType: 'Notification',
        userId: payload.userId,
        ipAddress: 'notification-service',
        userAgent: 'unified-notification-center',
        success: false,
        errorMessage: errorMessage,
        severity: 'ERROR',
        category: 'BUSINESS',
        metadata: {
          error: errorMessage,
          payload,
        },
      });

      throw error;
    }
  }

  /**
   * Invia su canali specifici
   */
  private async sendToChannels(
    notificationId: string,
    channels: NotificationChannel[],
    payload: NotificationPayload,
    user: UserWithPreferences
  ): Promise<ChannelResult[]> {
    const results: ChannelResult[] = [];

    for (const channel of channels) {
      try {
        const result = await this.sendToChannel(channel, payload, user);
        results.push({
          channel,
          success: true,
          messageId: result.messageId,
          deliveredAt: new Date(),
        });

        // TODO: Uncomment dopo aver creato tabella NotificationDelivery
        /*
        await prisma.notificationDelivery.create({
          data: {
            notificationId,
            channel: channel.toString(),
            status: 'DELIVERED',
            messageId: result.messageId,
            deliveredAt: new Date(),
          },
        });
        */
      } catch (error) {
        logger.error(`Errore invio ${channel}:`, error);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        results.push({
          channel,
          success: false,
          error: errorMessage,
        });

        // TODO: Uncomment dopo aver creato tabella NotificationDelivery
        /*
        await prisma.notificationDelivery.create({
          data: {
            notificationId,
            channel: channel.toString(),
            status: 'FAILED',
            error: errorMessage,
            failedAt: new Date(),
          },
        });
        */
      }
    }

    return results;
  }

  /**
   * Invia su singolo canale
   */
  private async sendToChannel(
    channel: NotificationChannel,
    payload: NotificationPayload,
    user: UserWithPreferences
  ): Promise<SendResult> {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return await this.sendEmail(payload, user);
      case NotificationChannel.SMS:
        return await this.sendSMS(payload, user);
      case NotificationChannel.WHATSAPP:
        return await this.sendWhatsApp(payload, user);
      case NotificationChannel.PEC:
        return await this.sendPEC(payload, user);
      case NotificationChannel.PUSH:
        return await this.sendPushNotification(payload, user);
      case NotificationChannel.WEBSOCKET:
        return await this.sendWebSocket(payload, user);
      case NotificationChannel.IN_APP:
        return await this.sendInApp(payload, user);
      default:
        throw new Error(`Canale ${channel} non supportato`);
    }
  }

  /**
   * EMAIL
   */
  private async sendEmail(
    payload: NotificationPayload,
    user: UserWithPreferences
  ): Promise<SendResult> {
    const template = await this.getEmailTemplate(payload);

    const mailOptions: nodemailer.SendMailOptions = {
      from: process.env.SMTP_FROM || 'noreply@assistenza.it',
      to: user.email,
      subject: payload.title,
      html: template,
      attachments: payload.attachments,
      headers: {
        'X-Priority': this.getEmailPriority(payload.priority),
        'X-Notification-Type': payload.type,
        'X-Notification-Id': payload.userId,
      },
    };

    const result = await this.emailTransporter.sendMail(mailOptions);

    return {
      messageId: result.messageId,
      accepted: result.accepted as string[],
    };
  }

  /**
   * SMS - Temporaneamente disabilitato
   */
  private async sendSMS(
    payload: NotificationPayload,
    user: UserWithPreferences
  ): Promise<SendResult> {
    throw new Error('SMS temporaneamente disabilitato - twilio non installato');
  }

  /**
   * WHATSAPP
   */
  private async sendWhatsApp(
    payload: NotificationPayload,
    user: UserWithPreferences
  ): Promise<SendResult> {
    if (!user.whatsappNumber) {
      throw new Error('Numero WhatsApp non disponibile');
    }

    const message = this.formatWhatsAppMessage(payload);

    await whatsappService.sendMessage(user.whatsappNumber, message);

    return {
      messageId: `WA_${Date.now()}`,
      sent: true,
    };
  }

  /**
   * PEC
   */
  private async sendPEC(
    payload: NotificationPayload,
    user: UserWithPreferences
  ): Promise<SendResult> {
    const pecAddress = user.pecEmail || process.env.DEFAULT_PEC_TO;

    if (!pecAddress) {
      throw new Error('Indirizzo PEC non disponibile');
    }

    const result = await pecService.sendPec({
      to: pecAddress,
      subject: `[${payload.priority}] ${payload.title}`,
      html: await this.getEmailTemplate(payload),
      attachments: payload.attachments,
      returnReceipt: true,
      priority:
        payload.priority === NotificationPriority.CRITICAL ? 'high' : 'normal',
    });

    return {
      messageId: result.messageId,
    };
  }

  /**
   * PUSH NOTIFICATION (Web Push) - Temporaneamente disabilitato
   */
  private async sendPushNotification(
    payload: NotificationPayload,
    user: UserWithPreferences
  ): Promise<SendResult> {
    throw new Error(
      'Push notifications temporaneamente disabilitate - webpush non installato'
    );
  }

  /**
   * WEBSOCKET (Real-time)
   */
  private async sendWebSocket(
    payload: NotificationPayload,
    user: UserWithPreferences
  ): Promise<SendResult> {
    if (!this.io) {
      throw new Error('WebSocket non configurato');
    }

    const wsPayload = {
      id: `WS_${Date.now()}`,
      type: 'notification',
      priority: payload.priority,
      data: {
        title: payload.title,
        message: payload.message,
        type: payload.type,
        actionUrl: payload.actionUrl,
        actionLabel: payload.actionLabel,
        requiresAction: payload.requiresAction,
        ...payload.data,
      },
      timestamp: new Date(),
    };

    this.io.to(`user:${user.id}`).emit('notification', wsPayload);

    if (payload.priority === NotificationPriority.CRITICAL) {
      this.io.to(`user:${user.id}`).emit('critical-alert', wsPayload);
    }

    await this.redis.setex(
      `ws:pending:${user.id}:${wsPayload.id}`,
      3600,
      JSON.stringify(wsPayload)
    );

    return {
      messageId: wsPayload.id,
      emitted: true,
    };
  }

  /**
   * IN-APP (Notifiche interne)
   */
  private async sendInApp(
    payload: NotificationPayload,
    user: UserWithPreferences
  ): Promise<SendResult> {
    await this.incrementBadgeCount(user.id);

    if (this.io) {
      this.io.to(`user:${user.id}`).emit('badge-update', {
        unreadCount: await this.getUnreadCount(user.id),
      });
    }

    return {
      messageId: `INAPP_${Date.now()}`,
      stored: true,
    };
  }

  /**
   * CENTRO NOTIFICHE UI
   */
  async getNotifications(
    userId: string,
    filters?: {
      read?: boolean;
      type?: NotificationType;
      priority?: NotificationPriority;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<{
    notifications: unknown[];
    total: number;
    unread: number;
  }> {
    const where: Prisma.NotificationWhereInput = { recipientId: userId };

    if (filters?.read !== undefined) {
      where.readAt = filters.read ? { not: null } : null;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.priority) {
      where.priority = filters.priority;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 20,
        skip: filters?.offset || 0,
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      total,
      unread: await this.getUnreadCount(userId),
    };
  }

  /**
   * Marca come letta
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        recipientId: userId,
      },
      data: {
        readAt: new Date(),
      },
    });

    await this.decrementBadgeCount(userId);

    if (this.io) {
      this.io.to(`user:${userId}`).emit('notification-read', {
        notificationId,
        unreadCount: await this.getUnreadCount(userId),
      });
    }
  }

  /**
   * Marca tutte come lette
   */
  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        recipientId: userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    await this.resetBadgeCount(userId);

    if (this.io) {
      this.io.to(`user:${userId}`).emit('all-notifications-read', {
        unreadCount: 0,
      });
    }
  }

  /**
   * Elimina notifica
   */
  async deleteNotification(
    notificationId: string,
    userId: string
  ): Promise<void> {
    await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        recipientId: userId,
      },
    });
  }

  /**
   * Gestione preferenze utente
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<void> {
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) throw new Error('User not found');

    await prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        id: `np_${userId}_${Date.now()}`,
        user: { connect: { id: userId } }, // ✅ FIX: Connessione relazione
        emailNotifications: preferences.channels?.email ?? true,
        pushNotifications: preferences.channels?.push ?? true,
        smsNotifications: preferences.channels?.sms ?? false,
        quietHoursStart: preferences.quietHours?.start || null,
        quietHoursEnd: preferences.quietHours?.end || null,
      },
      update: {
        emailNotifications: preferences.channels?.email,
        pushNotifications: preferences.channels?.push,
        smsNotifications: preferences.channels?.sms,
        quietHoursStart: preferences.quietHours?.start || null,
        quietHoursEnd: preferences.quietHours?.end || null,
      },
    });
  }

  /**
   * Subscribe push notifications - Temporaneamente disabilitato
   */
  async subscribePush(userId: string, subscription: unknown): Promise<void> {
    throw new Error(
      'Push notifications temporaneamente disabilitate - webpush non installato'
    );
  }

  /**
   * Unsubscribe push
   */
  async unsubscribePush(userId: string, endpoint: string): Promise<void> {
    // TODO: Implementare quando tabella pushSubscription sarà creata
    logger.info(`Unsubscribe push per ${userId} - endpoint: ${endpoint}`);
  }

  // ========= HELPER FUNCTIONS =========

  private validatePayload(payload: NotificationPayload): void {
    if (!payload.userId) throw new Error('userId richiesto');
    if (!payload.type) throw new Error('type richiesto');
    if (!payload.priority) throw new Error('priority richiesta');
    if (!payload.title) throw new Error('title richiesto');
    if (!payload.message) throw new Error('message richiesto');
  }

  private async getUserWithPreferences(
    userId: string
  ): Promise<UserWithPreferences | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        notificationPreference: true,
      },
    });

    if (!user) return null;

    // ✅ FIX: Cast safe senza type assertion
    return {
      ...user,
      whatsappNumber: user.phone, // Fallback
      pecEmail: null, // TODO: Aggiungere campo al DB
      pushSubscriptions: [], // TODO: Aggiungere quando tabella esistente
      preferences: user.notificationPreference ? {
        quietHours: {
          enabled: !!(user.notificationPreference.quietHoursStart && user.notificationPreference.quietHoursEnd),
          start: user.notificationPreference.quietHoursStart || '22:00',
          end: user.notificationPreference.quietHoursEnd || '07:00'
        }
      } : undefined
    };
  }

  private determineChannels(
    payload: NotificationPayload,
    user: UserWithPreferences
  ): NotificationChannel[] {
    if (payload.channels && payload.channels.length > 0) {
      return payload.channels;
    }

    const channels: NotificationChannel[] = [];
    const prefs = user.notificationPreference;

    switch (payload.priority) {
      case NotificationPriority.CRITICAL:
        if (user.email && prefs?.emailNotifications !== false)
          channels.push(NotificationChannel.EMAIL);
        if (user.phone && prefs?.smsNotifications !== false)
          channels.push(NotificationChannel.SMS);
        if (user.whatsappNumber)
          channels.push(NotificationChannel.WHATSAPP);
        channels.push(NotificationChannel.WEBSOCKET);
        channels.push(NotificationChannel.IN_APP);
        if (user.pecEmail) channels.push(NotificationChannel.PEC);
        break;

      case NotificationPriority.URGENT:
        channels.push(NotificationChannel.WEBSOCKET);
        if (user.whatsappNumber)
          channels.push(NotificationChannel.WHATSAPP);
        if (user.phone && prefs?.smsNotifications !== false)
          channels.push(NotificationChannel.SMS);
        channels.push(NotificationChannel.IN_APP);
        break;

      case NotificationPriority.HIGH:
        if (user.email && prefs?.emailNotifications !== false) {
          channels.push(NotificationChannel.EMAIL);
        }
        channels.push(NotificationChannel.IN_APP);
        break;

      case NotificationPriority.MEDIUM:
        channels.push(NotificationChannel.IN_APP);
        break;

      case NotificationPriority.LOW:
        channels.push(NotificationChannel.IN_APP);
        break;
    }

    return Array.from(new Set(channels));
  }

  private isInQuietHours(
    preferences: UserWithPreferences['preferences']
  ): boolean {
    if (!preferences?.quietHours?.enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    const start = preferences.quietHours.start;
    const end = preferences.quietHours.end;

    if (start < end) {
      return currentTime >= start && currentTime < end;
    } else {
      return currentTime >= start || currentTime < end;
    }
  }

  private async scheduleAfterQuietHours(
    payload: NotificationPayload,
    user: UserWithPreferences
  ): Promise<void> {
    const endTime = user.preferences?.quietHours?.end;

    if (!endTime) {
      throw new Error('Quiet hours end time not configured');
    }

    const [hours, minutes] = endTime.split(':').map(Number);

    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    if (scheduledTime < new Date()) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    // TODO: Implementare quando tabella scheduledNotification sarà creata
    logger.info(`Notifica schedulata per ${scheduledTime.toISOString()}`);
  }

  private async getEmailTemplate(
    payload: NotificationPayload
  ): Promise<string> {
    if (payload.templateId) {
      const template = await prisma.notificationTemplate.findUnique({
        where: { id: payload.templateId },
      });

      if (template && template.htmlContent) {
        return this.renderTemplate(template.htmlContent, payload as any);
      }
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
          }
          .content {
            background: white;
            padding: 30px;
            border: 1px solid #e0e0e0;
            border-radius: 0 0 10px 10px;
          }
          .priority-${payload.priority.toLowerCase()} {
            color: ${this.getPriorityColor(payload.priority)};
            font-weight: bold;
          }
          .action-button {
            display: inline-block;
            padding: 12px 24px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${payload.title}</h1>
          <span class="priority-${payload.priority.toLowerCase()}">
            ${this.getPriorityLabel(payload.priority)}
          </span>
        </div>
        <div class="content">
          <p>${payload.message.replace(/\n/g, '<br>')}</p>
          
          ${
            payload.requiresAction
              ? `
            <a href="${payload.actionUrl}" class="action-button">
              ${payload.actionLabel || 'Vai'}
            </a>
          `
              : ''
          }
        </div>
        <div class="footer">
          <p>Questa è una notifica automatica dal sistema di assistenza.</p>
          <p>Non rispondere a questa email.</p>
          <p>
            <a href="${process.env.FRONTEND_URL}/notifications/preferences">
              Gestisci preferenze notifiche
            </a>
          </p>
        </div>
      </body>
      </html>
    `;
  }

  private formatWhatsAppMessage(payload: NotificationPayload): string {
    let message = '';

    const priorityEmoji: Record<NotificationPriority, string> = {
      CRITICAL: '🚨',
      URGENT: '⚠️',
      HIGH: '📢',
      MEDIUM: '💬',
      LOW: 'ℹ️',
    };

    message += `${priorityEmoji[payload.priority]} `;
    message += `*${payload.title}*\n\n`;
    message += payload.message;

    if (payload.requiresAction && payload.actionUrl) {
      message += `\n\n🔗 ${payload.actionLabel || 'Clicca qui'}: ${
        payload.actionUrl
      }`;
    }

    return message;
  }

  private getEmailPriority(priority: NotificationPriority): string {
    switch (priority) {
      case NotificationPriority.CRITICAL:
      case NotificationPriority.URGENT:
        return '1 (Highest)';
      case NotificationPriority.HIGH:
        return '2 (High)';
      case NotificationPriority.MEDIUM:
        return '3 (Normal)';
      default:
        return '4 (Low)';
    }
  }

  private getPriorityColor(priority: NotificationPriority): string {
    const colors: Record<NotificationPriority, string> = {
      CRITICAL: '#dc2626',
      URGENT: '#ea580c',
      HIGH: '#ca8a04',
      MEDIUM: '#0891b2',
      LOW: '#64748b',
    };
    return colors[priority] || '#64748b';
  }

  private getPriorityLabel(priority: NotificationPriority): string {
    const labels: Record<NotificationPriority, string> = {
      CRITICAL: 'CRITICO - Azione Immediata',
      URGENT: 'URGENTE',
      HIGH: 'Priorità Alta',
      MEDIUM: 'Priorità Media',
      LOW: 'Informativo',
    };
    return labels[priority] || '';
  }

  private renderTemplate(
    template: string,
    data: Record<string, unknown>
  ): string {
    let rendered = template;

    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, String(value ?? ''));
    });

    return rendered;
  }

  private async getUnreadCount(userId: string): Promise<number> {
    return await prisma.notification.count({
      where: {
        recipientId: userId,
        readAt: null,
      },
    });
  }

  private async incrementBadgeCount(userId: string): Promise<void> {
    await this.redis.incr(`badge:${userId}`);
  }

  private async decrementBadgeCount(userId: string): Promise<void> {
    const current = await this.redis.get(`badge:${userId}`);
    if (current && parseInt(current, 10) > 0) {
      await this.redis.decr(`badge:${userId}`);
    }
  }

  private async resetBadgeCount(userId: string): Promise<void> {
    await this.redis.set(`badge:${userId}`, '0');
  }
}

// Export singleton
export const notificationCenter = new UnifiedNotificationCenter();
