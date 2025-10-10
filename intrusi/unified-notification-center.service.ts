// backend/src/services/unified-notification-center.service.ts
/**
 * Centro Notifiche Unificato
 * Gestisce tutti i canali di comunicazione in modo centralizzato
 */

import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import * as nodemailer from 'nodemailer';
import { Server as SocketServer } from 'socket.io';
import * as webpush from 'web-push';
import { Twilio } from 'twilio';
import { pecService } from './pec.service';
import * as whatsappService from './whatsapp.service';
import * as auditService from './auditLog.service';
import Redis from 'ioredis';

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

// Priorità notifiche
export enum NotificationPriority {
  CRITICAL = 'CRITICAL',   // Tutti i canali disponibili
  URGENT = 'URGENT',       // Canali immediati (Push, WebSocket, SMS)
  HIGH = 'HIGH',           // Canali preferiti + backup
  MEDIUM = 'MEDIUM',       // Solo canale preferito
  LOW = 'LOW'              // Solo in-app o email
}

// Tipo di notifica
export enum NotificationType {
  // Sistema
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  MAINTENANCE = 'MAINTENANCE',
  UPDATE = 'UPDATE',
  
  // Business
  REQUEST_CREATED = 'REQUEST_CREATED',
  QUOTE_RECEIVED = 'QUOTE_RECEIVED',
  QUOTE_ACCEPTED = 'QUOTE_ACCEPTED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  
  // Comunicazione
  MESSAGE = 'MESSAGE',
  REMINDER = 'REMINDER',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  
  // Legal
  COMPLAINT_SENT = 'COMPLAINT_SENT',
  COMPLAINT_RESPONSE = 'COMPLAINT_RESPONSE',
  
  // Marketing
  PROMOTION = 'PROMOTION',
  NEWSLETTER = 'NEWSLETTER'
}

interface NotificationPayload {
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels?: NotificationChannel[];
  templateId?: string;
  scheduledAt?: Date;
  expiresAt?: Date;
  requiresAction?: boolean;
  actionUrl?: string;
  actionLabel?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  metadata?: Record<string, any>;
}

interface NotificationResult {
  notificationId: string;
  channels: Array<{
    channel: NotificationChannel;
    success: boolean;
    messageId?: string;
    deliveredAt?: Date;
    error?: string;
  }>;
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
    start: string; // "22:00"
    end: string;   // "08:00"
  };
  priorities: {
    [key in NotificationPriority]: NotificationChannel[];
  };
  blockedTypes: NotificationType[];
}

interface ChannelResult {
  messageId?: string;
  accepted?: string[];
  status?: string;
  sent?: boolean;
  results?: Array<{ subscriptionId: string; success: boolean; error?: string }>;
  emitted?: boolean;
  stored?: boolean;
  sid?: string;
}

interface UserWithPreferences {
  id: string;
  email?: string;
  phone?: string;
  whatsappNumber?: string;
  pecEmail?: string;
  notificationPreferences?: any;
  pushSubscriptions?: any[];
  preferences?: any;
}

class UnifiedNotificationCenter {
  private io: SocketServer | null = null;
  private emailTransporter: nodemailer.Transporter;
  private smsClient: Twilio | null = null;
  private redis: Redis;
  private pushVapidKeys: { publicKey: string; privateKey: string } | null = null;
  
  constructor() {
    this.initializeServices();
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }
  
  /**
   * Inizializza tutti i servizi di notifica
   */
  private initializeServices(): void {
    // Email (SMTP)
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    // SMS (Twilio)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.smsClient = new Twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    }
    
    // Push Notifications (Web Push)
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      this.pushVapidKeys = {
        publicKey: process.env.VAPID_PUBLIC_KEY,
        privateKey: process.env.VAPID_PRIVATE_KEY
      };
      
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
        this.pushVapidKeys.publicKey,
        this.pushVapidKeys.privateKey
      );
    }
    
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
      // Valida payload
      this.validatePayload(payload);
      
      // Recupera utente e preferenze
      const user = await this.getUserWithPreferences(payload.userId);
      
      if (!user) {
        throw new Error(`Utente ${payload.userId} non trovato`);
      }
      
      // Controlla quiet hours
      if (this.isInQuietHours(user.preferences)) {
        if (payload.priority !== NotificationPriority.CRITICAL && 
            payload.priority !== NotificationPriority.URGENT) {
          // Schedule per dopo quiet hours
          await this.scheduleAfterQuietHours(payload, user);
          return {
            notificationId: 'scheduled',
            channels: [],
            createdAt: new Date()
          };
        }
      }
      
      // Determina canali da utilizzare
      const channels = this.determineChannels(payload, user);
      
      // Crea record notifica
      const notification = await prisma.notification.create({
        data: {
          userId: payload.userId,
          type: payload.type,
          priority: payload.priority,
          title: payload.title,
          message: payload.message,
          data: payload.data || {},
          requiresAction: payload.requiresAction || false,
          actionUrl: payload.actionUrl,
          actionLabel: payload.actionLabel,
          expiresAt: payload.expiresAt,
          metadata: payload.metadata || {},
          status: 'PENDING'
        }
      });
      
      // Invia su ogni canale
      const results = await this.sendToChannels(
        notification.id,
        channels,
        payload,
        user
      );
      
      // Aggiorna stato notifica
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: results.every(r => r.success) ? 'SENT' : 'PARTIAL',
          sentAt: new Date(),
          deliveryStatus: results as any
        }
      });
      
      // Audit log
      await auditService.log({
        action: 'NOTIFICATION_SENT',
        entityType: 'Notification',
        entityId: notification.id,
        userId: payload.userId,
        details: {
          type: payload.type,
          priority: payload.priority,
          channels: channels.map(c => c.toString()),
          results
        },
        severity: 'INFO',
        category: 'COMMUNICATION'
      });
      
      return {
        notificationId: notification.id,
        channels: results,
        createdAt: notification.createdAt
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      logger.error('Errore invio notifica:', error);
      
      // Audit errore
      await auditService.log({
        action: 'NOTIFICATION_FAILED',
        entityType: 'Notification',
        userId: payload.userId,
        details: {
          error: errorMessage,
          payload
        },
        severity: 'ERROR',
        category: 'COMMUNICATION'
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
  ): Promise<Array<{
    channel: NotificationChannel;
    success: boolean;
    messageId?: string;
    deliveredAt?: Date;
    error?: string;
  }>> {
    const results: Array<{
      channel: NotificationChannel;
      success: boolean;
      messageId?: string;
      deliveredAt?: Date;
      error?: string;
    }> = [];
    
    for (const channel of channels) {
      try {
        const result = await this.sendToChannel(channel, payload, user);
        results.push({
          channel,
          success: true,
          messageId: result.messageId || result.sid,
          deliveredAt: new Date()
        });
        
        // Log canale specifico
        await prisma.notificationDelivery.create({
          data: {
            notificationId,
            channel: channel.toString(),
            status: 'DELIVERED',
            messageId: result.messageId || result.sid,
            deliveredAt: new Date()
          }
        });
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
        logger.error(`Errore invio ${channel}:`, error);
        results.push({
          channel,
          success: false,
          error: errorMessage
        });
        
        // Log errore delivery
        await prisma.notificationDelivery.create({
          data: {
            notificationId,
            channel: channel.toString(),
            status: 'FAILED',
            error: errorMessage,
            failedAt: new Date()
          }
        });
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
  ): Promise<ChannelResult> {
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
  private async sendEmail(payload: NotificationPayload, user: UserWithPreferences): Promise<ChannelResult> {
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
        'X-Notification-Id': payload.userId
      }
    };
    
    const result = await this.emailTransporter.sendMail(mailOptions);
    
    return {
      messageId: result.messageId,
      accepted: result.accepted as string[]
    };
  }
  
  /**
   * SMS
   */
  private async sendSMS(payload: NotificationPayload, user: UserWithPreferences): Promise<ChannelResult> {
    if (!this.smsClient) {
      throw new Error('SMS non configurato');
    }
    
    if (!user.phone) {
      throw new Error('Numero telefono non disponibile');
    }
    
    // Formatta messaggio per SMS (max 160 caratteri)
    const smsMessage = this.formatSMSMessage(payload);
    
    const result = await this.smsClient.messages.create({
      body: smsMessage,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: user.phone
    });
    
    return {
      messageId: result.sid,
      status: result.status
    };
  }
  
  /**
   * WHATSAPP
   */
  private async sendWhatsApp(payload: NotificationPayload, user: UserWithPreferences): Promise<ChannelResult> {
    if (!user.whatsappNumber) {
      throw new Error('Numero WhatsApp non disponibile');
    }
    
    const message = this.formatWhatsAppMessage(payload);
    
    await whatsappService.sendMessage(user.whatsappNumber, message);
    
    return {
      messageId: `WA_${Date.now()}`,
      sent: true
    };
  }
  
  /**
   * PEC
   */
  private async sendPEC(payload: NotificationPayload, user: UserWithPreferences): Promise<ChannelResult> {
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
      priority: payload.priority === NotificationPriority.CRITICAL ? 'high' : 'normal'
    });
    
    return {
      messageId: result.messageId
    };
  }
  
  /**
   * PUSH NOTIFICATION (Web Push)
   */
  private async sendPushNotification(payload: NotificationPayload, user: UserWithPreferences): Promise<ChannelResult> {
    // Recupera subscription push dell'utente
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: user.id,
        isActive: true
      }
    });
    
    if (subscriptions.length === 0) {
      throw new Error('Nessuna subscription push attiva');
    }
    
    const pushPayload = {
      title: payload.title,
      body: payload.message,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: {
        notificationId: payload.userId,
        type: payload.type,
        actionUrl: payload.actionUrl,
        ...payload.data
      },
      actions: payload.requiresAction ? [
        {
          action: 'open',
          title: payload.actionLabel || 'Apri'
        },
        {
          action: 'dismiss',
          title: 'Ignora'
        }
      ] : undefined,
      requireInteraction: payload.priority === NotificationPriority.CRITICAL,
      tag: payload.type,
      renotify: true,
      vibrate: this.getVibrationPattern(payload.priority)
    };
    
    const results: Array<{ subscriptionId: string; success: boolean; error?: string }> = [];
    
    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          subscription.subscription as webpush.PushSubscription,
          JSON.stringify(pushPayload)
        );
        
        results.push({
          subscriptionId: subscription.id,
          success: true
        });
        
      } catch (error: any) {
        // Se fallisce, disattiva subscription
        if (error?.statusCode === 410) {
          await prisma.pushSubscription.update({
            where: { id: subscription.id },
            data: { isActive: false }
          });
        }
        
        const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
        results.push({
          subscriptionId: subscription.id,
          success: false,
          error: errorMessage
        });
      }
    }
    
    return {
      messageId: `PUSH_${Date.now()}`,
      results
    };
  }
  
  /**
   * WEBSOCKET (Real-time)
   */
  private async sendWebSocket(payload: NotificationPayload, user: UserWithPreferences): Promise<ChannelResult> {
    if (!this.io) {
      throw new Error('WebSocket non configurato');
    }
    
    // Formatta per WebSocket
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
        ...payload.data
      },
      timestamp: new Date()
    };
    
    // Invia a room utente
    this.io.to(`user:${user.id}`).emit('notification', wsPayload);
    
    // Se critico, invia anche evento speciale
    if (payload.priority === NotificationPriority.CRITICAL) {
      this.io.to(`user:${user.id}`).emit('critical-alert', wsPayload);
    }
    
    // Salva in Redis per retry se offline
    await this.redis.setex(
      `ws:pending:${user.id}:${wsPayload.id}`,
      3600, // 1 ora TTL
      JSON.stringify(wsPayload)
    );
    
    return {
      messageId: wsPayload.id,
      emitted: true
    };
  }
  
  /**
   * IN-APP (Notifiche interne)
   */
  private async sendInApp(payload: NotificationPayload, user: UserWithPreferences): Promise<ChannelResult> {
    // Già salvata nel database principale
    // Qui potremmo fare processing aggiuntivo
    
    // Incrementa badge counter
    await this.incrementBadgeCount(user.id);
    
    // Se WebSocket disponibile, invia update badge
    if (this.io) {
      this.io.to(`user:${user.id}`).emit('badge-update', {
        unreadCount: await this.getUnreadCount(user.id)
      });
    }
    
    return {
      messageId: `INAPP_${Date.now()}`,
      stored: true
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
    notifications: any[];
    total: number;
    unread: number;
  }> {
    const where: any = { userId };
    
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
        include: {
          deliveries: true
        }
      }),
      prisma.notification.count({ where })
    ]);
    
    return {
      notifications,
      total,
      unread: await this.getUnreadCount(userId)
    };
  }
  
  /**
   * Marca come letta
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId
      },
      data: {
        readAt: new Date()
      }
    });
    
    // Aggiorna badge
    await this.decrementBadgeCount(userId);
    
    // Notifica via WebSocket
    if (this.io) {
      this.io.to(`user:${userId}`).emit('notification-read', {
        notificationId,
        unreadCount: await this.getUnreadCount(userId)
      });
    }
  }
  
  /**
   * Marca tutte come lette
   */
  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        userId,
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    });
    
    // Reset badge
    await this.resetBadgeCount(userId);
    
    // Notifica via WebSocket
    if (this.io) {
      this.io.to(`user:${userId}`).emit('all-notifications-read', {
        unreadCount: 0
      });
    }
  }
  
  /**
   * Elimina notifica
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId
      }
    });
  }
  
  /**
   * Gestione preferenze utente
   */
  async updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void> {
    await prisma.userNotificationPreferences.upsert({
      where: { userId },
      create: {
        userId,
        ...preferences
      },
      update: preferences
    });
  }
  
  /**
   * Subscribe push notifications
   */
  async subscribePush(userId: string, subscription: any): Promise<void> {
    // Salva subscription
    await prisma.pushSubscription.create({
      data: {
        userId,
        endpoint: subscription.endpoint,
        subscription,
        userAgent: subscription.userAgent,
        isActive: true
      }
    });
    
    // Invia notifica di benvenuto
    await this.send({
      userId,
      type: NotificationType.SYSTEM_ALERT,
      priority: NotificationPriority.LOW,
      title: '🔔 Notifiche Push Attivate',
      message: 'Riceverai notifiche push su questo dispositivo',
      channels: [NotificationChannel.PUSH]
    });
  }
  
  /**
   * Unsubscribe push
   */
  async unsubscribePush(userId: string, endpoint: string): Promise<void> {
    await prisma.pushSubscription.updateMany({
      where: {
        userId,
        endpoint
      },
      data: {
        isActive: false,
        unsubscribedAt: new Date()
      }
    });
  }
  
  // ========= HELPER FUNCTIONS =========
  
  private validatePayload(payload: NotificationPayload): void {
    if (!payload.userId) throw new Error('userId richiesto');
    if (!payload.type) throw new Error('type richiesto');
    if (!payload.priority) throw new Error('priority richiesta');
    if (!payload.title) throw new Error('title richiesto');
    if (!payload.message) throw new Error('message richiesto');
  }
  
  private async getUserWithPreferences(userId: string): Promise<UserWithPreferences | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        notificationPreferences: true,
        pushSubscriptions: {
          where: { isActive: true }
        }
      }
    });
    
    return user;
  }
  
  private determineChannels(
    payload: NotificationPayload,
    user: UserWithPreferences
  ): NotificationChannel[] {
    // Se specificati canali espliciti
    if (payload.channels && payload.channels.length > 0) {
      return payload.channels;
    }
    
    // Altrimenti determina in base a priorità e preferenze
    const channels: NotificationChannel[] = [];
    const prefs = user.notificationPreferences;
    
    switch (payload.priority) {
      case NotificationPriority.CRITICAL:
        // Tutti i canali disponibili
        if (user.email && prefs?.channels?.email !== false) channels.push(NotificationChannel.EMAIL);
        if (user.phone && prefs?.channels?.sms !== false) channels.push(NotificationChannel.SMS);
        if (user.whatsappNumber && prefs?.channels?.whatsapp !== false) channels.push(NotificationChannel.WHATSAPP);
        if (user.pushSubscriptions && user.pushSubscriptions.length > 0) channels.push(NotificationChannel.PUSH);
        channels.push(NotificationChannel.WEBSOCKET);
        channels.push(NotificationChannel.IN_APP);
        if (user.pecEmail) channels.push(NotificationChannel.PEC);
        break;
        
      case NotificationPriority.URGENT:
        // Canali immediati
        if (user.pushSubscriptions && user.pushSubscriptions.length > 0) channels.push(NotificationChannel.PUSH);
        channels.push(NotificationChannel.WEBSOCKET);
        if (user.whatsappNumber && prefs?.channels?.whatsapp !== false) channels.push(NotificationChannel.WHATSAPP);
        if (user.phone && prefs?.channels?.sms !== false) channels.push(NotificationChannel.SMS);
        channels.push(NotificationChannel.IN_APP);
        break;
        
      case NotificationPriority.HIGH:
        // Canale preferito + email
        channels.push(...this.getPreferredChannels(user, prefs));
        if (user.email && !channels.includes(NotificationChannel.EMAIL)) {
          channels.push(NotificationChannel.EMAIL);
        }
        channels.push(NotificationChannel.IN_APP);
        break;
        
      case NotificationPriority.MEDIUM:
        // Solo canale preferito
        channels.push(...this.getPreferredChannels(user, prefs));
        channels.push(NotificationChannel.IN_APP);
        break;
        
      case NotificationPriority.LOW:
        // Solo in-app e email
        channels.push(NotificationChannel.IN_APP);
        if (user.email && prefs?.channels?.email !== false) {
          channels.push(NotificationChannel.EMAIL);
        }
        break;
    }
    
    // Rimuovi duplicati
    return [...new Set(channels)];
  }
  
  private getPreferredChannels(user: UserWithPreferences, prefs: any): NotificationChannel[] {
    const channels: NotificationChannel[] = [];
    
    // Ordine di preferenza default
    if (user.pushSubscriptions && user.pushSubscriptions.length > 0 && prefs?.channels?.push !== false) {
      channels.push(NotificationChannel.PUSH);
    }
    
    if (user.whatsappNumber && prefs?.channels?.whatsapp !== false) {
      channels.push(NotificationChannel.WHATSAPP);
    }
    
    if (user.email && prefs?.channels?.email !== false) {
      channels.push(NotificationChannel.EMAIL);
    }
    
    return channels;
  }
  
  private isInQuietHours(preferences: any): boolean {
    if (!preferences?.quietHours?.enabled) return false;
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const start = preferences.quietHours.start;
    const end = preferences.quietHours.end;
    
    if (start < end) {
      return currentTime >= start && currentTime < end;
    } else {
      // Attraversa mezzanotte
      return currentTime >= start || currentTime < end;
    }
  }
  
  private async scheduleAfterQuietHours(payload: NotificationPayload, user: UserWithPreferences): Promise<void> {
    const endTime = user.preferences.quietHours.end;
    const [hours, minutes] = endTime.split(':').map(Number);
    
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);
    
    if (scheduledTime < new Date()) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    // Salva per invio schedulato
    await prisma.scheduledNotification.create({
      data: {
        userId: payload.userId,
        type: payload.type,
        priority: payload.priority,
        title: payload.title,
        message: payload.message,
        data: payload.data || {},
        scheduledAt: scheduledTime,
        status: 'SCHEDULED'
      }
    });
  }
  
  private async getEmailTemplate(payload: NotificationPayload): Promise<string> {
    // Carica template se specificato
    if (payload.templateId) {
      const template = await prisma.notificationTemplate.findUnique({
        where: { id: payload.templateId }
      });
      
      if (template) {
        return this.renderTemplate(template.emailBody || '', payload);
      }
    }
    
    // Template default
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
          
          ${payload.requiresAction ? `
            <a href="${payload.actionUrl}" class="action-button">
              ${payload.actionLabel || 'Vai'}
            </a>
          ` : ''}
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
  
  private formatSMSMessage(payload: NotificationPayload): string {
    let message = `${payload.title}: ${payload.message}`;
    
    if (payload.actionUrl) {
      message += ` ${payload.actionUrl}`;
    }
    
    // Tronca a 160 caratteri
    if (message.length > 160) {
      message = message.substring(0, 157) + '...';
    }
    
    return message;
  }
  
  private formatWhatsAppMessage(payload: NotificationPayload): string {
    let message = '';
    
    // Aggiungi emoji in base a priorità
    const priorityEmoji: Record<NotificationPriority, string> = {
      CRITICAL: '🚨',
      URGENT: '⚠️',
      HIGH: '📢',
      MEDIUM: '💬',
      LOW: 'ℹ️'
    };
    
    message += `${priorityEmoji[payload.priority]} `;
    
    // Titolo in grassetto
    message += `*${payload.title}*\n\n`;
    
    // Messaggio
    message += payload.message;
    
    // Action se presente
    if (payload.requiresAction && payload.actionUrl) {
      message += `\n\n🔗 ${payload.actionLabel || 'Clicca qui'}: ${payload.actionUrl}`;
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
    switch (priority) {
      case NotificationPriority.CRITICAL: return '#dc2626';
      case NotificationPriority.URGENT: return '#ea580c';
      case NotificationPriority.HIGH: return '#ca8a04';
      case NotificationPriority.MEDIUM: return '#0891b2';
      case NotificationPriority.LOW: return '#64748b';
      default: return '#64748b';
    }
  }
  
  private getPriorityLabel(priority: NotificationPriority): string {
    switch (priority) {
      case NotificationPriority.CRITICAL: return 'CRITICO - Azione Immediata';
      case NotificationPriority.URGENT: return 'URGENTE';
      case NotificationPriority.HIGH: return 'Priorità Alta';
      case NotificationPriority.MEDIUM: return 'Priorità Media';
      case NotificationPriority.LOW: return 'Informativo';
      default: return '';
    }
  }
  
  private getVibrationPattern(priority: NotificationPriority): number[] {
    switch (priority) {
      case NotificationPriority.CRITICAL:
        return [100, 50, 100, 50, 100, 50, 100]; // Pattern lungo
      case NotificationPriority.URGENT:
        return [100, 50, 100, 50, 100]; // Pattern medio
      case NotificationPriority.HIGH:
        return [100, 50, 100]; // Pattern corto
      default:
        return [100]; // Vibrazione singola
    }
  }
  
  private renderTemplate(template: string, data: any): string {
    let rendered = template;
    
    // Sostituisci variabili {{VAR}}
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    });
    
    return rendered;
  }
  
  private async getUnreadCount(userId: string): Promise<number> {
    return await prisma.notification.count({
      where: {
        userId,
        readAt: null
      }
    });
  }
  
  private async incrementBadgeCount(userId: string): Promise<void> {
    await this.redis.incr(`badge:${userId}`);
  }
  
  private async decrementBadgeCount(userId: string): Promise<void> {
    const current = await this.redis.get(`badge:${userId}`);
    if (current && parseInt(current) > 0) {
      await this.redis.decr(`badge:${userId}`);
    }
  }
  
  private async resetBadgeCount(userId: string): Promise<void> {
    await this.redis.set(`badge:${userId}`, '0');
  }
}

// Export singleton
export const notificationCenter = new UnifiedNotificationCenter();

// ========= SCHEDULER PER NOTIFICHE ==========
import * as cron from 'node-cron';

// Processa notifiche schedulate ogni minuto
cron.schedule('* * * * *', async () => {
  try {
    const scheduled = await prisma.scheduledNotification.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: {
          lte: new Date()
        }
      }
    });
    
    for (const notification of scheduled) {
      try {
        await notificationCenter.send(notification as any);
        
        await prisma.scheduledNotification.update({
          where: { id: notification.id },
          data: {
            status: 'SENT',
            sentAt: new Date()
          }
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
        logger.error('Errore invio notifica schedulata:', error);
        
        await prisma.scheduledNotification.update({
          where: { id: notification.id },
          data: {
            status: 'FAILED',
            error: errorMessage
          }
        });
      }
    }
  } catch (error) {
    logger.error('Errore processing notifiche schedulate:', error);
  }
});

// Pulizia notifiche vecchie ogni giorno
cron.schedule('0 3 * * *', async () => {
  try {
    // Elimina notifiche lette più vecchie di 30 giorni
    await prisma.notification.deleteMany({
      where: {
        readAt: {
          not: null,
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });
    
    // Elimina notifiche non lette più vecchie di 90 giorni
    await prisma.notification.deleteMany({
      where: {
        readAt: null,
        createdAt: {
          lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        }
      }
    });
    
    logger.info('Pulizia notifiche vecchie completata');
  } catch (error) {
    logger.error('Errore pulizia notifiche:', error);
  }
});
