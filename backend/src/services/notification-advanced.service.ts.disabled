// ================================
// Advanced Notification Service v5.1
// Sistema notifiche potenziato con batch e retry
// ================================

import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { auditService } from './audit.service';

/**
 * Tipi supportati per notifiche
 */
export interface NotificationRequest {
  userId: string;
  templateKey?: string;
  channel: 'EMAIL' | 'WHATSAPP' | 'SMS' | 'PEC' | 'IN_APP';
  customContent?: {
    subject?: string;
    body: string;
  };
  variables?: Record<string, any>;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL';
  scheduledAt?: Date;
  metadata?: any;
}

/**
 * Service avanzato per notifiche batch e retry
 */
class AdvancedNotificationService {
  
  /**
   * Invia notifica singola
   */
  async send(request: NotificationRequest): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: request.userId }
      });

      if (!user) {
        throw new Error(`User ${request.userId} not found`);
      }

      let template = null;
      if (request.templateKey) {
        template = await prisma.notificationTemplate.findUnique({
          where: { code: request.templateKey }
        });

        if (!template) {
          throw new Error(`Template ${request.templateKey} not found`);
        }
      }

      // Contenuto finale
      let subject = request.customContent?.subject || template?.subject || '';
      let body = request.customContent?.body || template?.htmlContent || '';

      // Sostituzione variabili
      if (request.variables) {
        for (const [key, value] of Object.entries(request.variables)) {
          const placeholder = `{{${key}}}`;
          subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
          body = body.replace(new RegExp(placeholder, 'g'), String(value));
        }
      }

      // Log della notifica
      const notificationLog = await prisma.notificationLog.create({
        data: {
          recipientId: request.userId,
          channel: request.channel,
          status: 'PENDING',
          subject,
          content: body,
          variables: request.variables as any,
          templateId: template?.id,
          metadata: request.metadata as any
        }
      });

      // Invio effettivo (simulato)
      const success = await this.sendToChannel(request.channel, user, subject, body);

      // Aggiorna stato
      await prisma.notificationLog.update({
        where: { id: notificationLog.id },
        data: {
          status: success ? 'SENT' : 'FAILED',
          sentAt: success ? new Date() : null,
          failureReason: success ? null : 'Invio fallito'
        }
      });

    } catch (error: any) {
      logger.error('Errore invio notifica:', error);
      throw error;
    }
  }

  /**
   * Invia notifica batch a più utenti
   */
  async sendBatch(batchId: string): Promise<void> {
    try {
      const batch = await prisma.notificationBatch.findUnique({
        where: { id: batchId },
        include: {
          template: true
        }
      });

      if (!batch) {
        throw new Error(`Batch ${batchId} not found`);
      }

      // Ottieni destinatari
      const recipients = await this.getBatchRecipients(batch);

      let sentCount = 0;
      let failedCount = 0;

      // Invia a ogni destinatario
      for (const recipient of recipients) {
        try {
          await this.send({
            userId: recipient.id,
            templateKey: batch.template?.code,
            channel: batch.channel as any,
            variables: batch.variables as any,
            priority: batch.priority as any,
            metadata: {
              batchId: batch.id,
              ...batch.metadata as any
            }
          });
          sentCount++;
        } catch (error) {
          logger.error(`Errore invio a ${recipient.id}:`, error);
          failedCount++;
        }
      }

      // Aggiorna statistiche batch
      await prisma.notificationBatch.update({
        where: { id: batchId },
        data: {
          status: failedCount === recipients.length ? 'FAILED' : 'SENT',
          sentCount,
          failedCount,
          totalRecipients: recipients.length
        }
      });

      // Audit log
      await auditService.log({
        action: 'NOTIFICATION_BATCH_SENT',
        entityType: 'NotificationBatch',
        entityId: batchId,
        userId: batch.createdBy,
        details: {
          templateKey: batch.template?.code,
          recipients: recipients.length,
          sent: sentCount,
          failed: failedCount
        },
        severity: 'INFO',
        category: 'COMMUNICATION'
      });

    } catch (error) {
      logger.error('Errore invio batch:', error);

      await prisma.notificationBatch.update({
        where: { id: batchId },
        data: { status: 'FAILED' }
      });

      throw error;
    }
  }

  /**
   * Ottieni destinatari batch
   */
  private async getBatchRecipients(batch: any): Promise<any[]> {
    switch (batch.targetType) {
      case 'ALL_USERS':
        return await prisma.user.findMany({
          where: { isActive: true }
        });

      case 'ROLE':
        return await prisma.user.findMany({
          where: {
            role: batch.targetRole,
            isActive: true
          }
        });

      case 'CUSTOM':
        return await prisma.user.findMany({
          where: {
            id: { in: batch.targetIds },
            isActive: true
          }
        });

      default:
        return [];
    }
  }

  /**
   * Invio effettivo per canale
   */
  private async sendToChannel(
    channel: string, 
    user: any, 
    subject: string, 
    body: string
  ): Promise<boolean> {
    try {
      switch (channel) {
        case 'EMAIL':
          // Implementazione email
          logger.info(`EMAIL inviata a ${user.email}: ${subject}`);
          return true;

        case 'WHATSAPP':
          const whatsappMessage = this.formatForWhatsApp(body);
          logger.info(`WhatsApp inviato a ${user.phone}: ${whatsappMessage}`);
          return true;

        case 'SMS':
          logger.info(`SMS inviato a ${user.phone}: ${body}`);
          return true;

        case 'IN_APP':
          await prisma.notification.create({
            data: {
              recipientId: user.id,
              title: subject,
              content: body,
              type: 'SYSTEM'
            }
          });
          return true;

        default:
          logger.warn(`Canale ${channel} non supportato`);
          return false;
      }
    } catch (error) {
      logger.error(`Errore invio ${channel}:`, error);
      return false;
    }
  }

  /**
   * Formatta messaggio per WhatsApp
   */
  private formatForWhatsApp(message: string, priority?: string): string {
    let prefix = '';

    switch (priority) {
      case 'CRITICAL':
        prefix = '🚨 **URGENTE** 🚨\n\n';
        break;
      case 'URGENT':
        prefix = '⚠️ **IMPORTANTE** ⚠️\n\n';
        break;
      case 'HIGH':
        prefix = '📢 ';
        break;
      default:
        prefix = '💬 ';
    }

    // Converti HTML base in formato WhatsApp
    let formatted = message
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]*>/g, '') // Rimuovi altri tag HTML
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');

    return prefix + formatted;
  }

  /**
   * Verifica stato consegna notifiche
   */
  async checkDeliveryStatus(): Promise<void> {
    // Controlla notifiche pending da più di 5 minuti
    const pendingNotifications = await prisma.notificationLog.findMany({
      where: {
        status: 'SENT',
        deliveredAt: null,
        sentAt: {
          lt: new Date(Date.now() - 5 * 60 * 1000)
        }
      }
    });

    for (const notification of pendingNotifications) {
      try {
        // Per ora simuliamo
        const delivered = Math.random() > 0.1; // 90% success rate

        if (delivered) {
          await prisma.notificationLog.update({
            where: { id: notification.id },
            data: {
              status: 'DELIVERED',
              deliveredAt: new Date()
            }
          });
        }
      } catch (error) {
        logger.error('Errore check delivery:', error);
      }
    }
  }

  /**
   * Gestisci notifiche fallite con retry
   */
  async retryFailedNotifications(): Promise<void> {
    const failedNotifications = await prisma.notificationLog.findMany({
      where: {
        status: 'FAILED',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Ultime 24h
        }
      },
      include: {
        template: true
      },
      take: 50 // Processa 50 alla volta
    });

    for (const notification of failedNotifications) {
      try {
        // Riprova invio
        await this.send({
          userId: notification.recipientId,
          templateKey: notification.template?.code,
          channel: notification.channel as any,
          customContent: notification.template ? undefined : {
            subject: notification.subject || undefined,
            body: notification.content
          },
          metadata: {
            ...notification.metadata as any,
            retryAttempt: ((notification.metadata as any)?.retryAttempt || 0) + 1
          }
        });

        // Marca originale come retry effettuato
        await prisma.notificationLog.update({
          where: { id: notification.id },
          data: {
            metadata: {
              ...notification.metadata as any,
              retriedAt: new Date()
            }
          }
        });

      } catch (error) {
        logger.error('Errore retry notifica:', error);
      }
    }
  }

  /**
   * Statistiche notifiche
   */
  async getStatistics(startDate: Date, endDate: Date): Promise<any> {
    const stats = await prisma.notificationLog.groupBy({
      by: ['channel', 'status'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: true
    });

    const byTemplate = await prisma.notificationLog.groupBy({
      by: ['templateId'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        templateId: { not: null }
      },
      _count: true
    });

    return {
      byChannelAndStatus: stats,
      byTemplate,
      period: { start: startDate, end: endDate }
    };
  }
}

// Export singleton
export const notificationService = new AdvancedNotificationService();
