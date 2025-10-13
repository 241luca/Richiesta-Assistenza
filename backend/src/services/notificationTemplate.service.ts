/**
 * Professional Notification Template Service
 * Gestisce template, eventi e invio notifiche professionali
 * 
 * VERSIONE CORRETTA: TypeScript Strict Mode
 * Data: 08/10/2025
 */

import { PrismaClient, NotificationPriority, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import Handlebars from 'handlebars';

const prisma = new PrismaClient();

// ==================== TIPI ====================

interface TemplateVariable {
  name: string;
  defaultValue?: string | number | boolean;
  type?: string;
  required?: boolean;
}

interface TemplateData {
  subject?: string | null;
  content: string;
  variables?: Record<string, unknown>;
}

interface NotificationTemplate {
  id: string;
  code: string;
  name: string;
  subject: string | null;
  htmlContent: string;
  textContent: string | null;
  smsContent: string | null;
  whatsappContent: string | null;
  channels: string[];
  priority: NotificationPriority;
  isActive: boolean;
  isSystem: boolean;
  emailBody?: string;
}

interface EventConditions {
  minAmount?: number;
  requiredStatus?: string;
  [key: string]: unknown;
}

interface EventData {
  recipientId: string;
  variables: Record<string, unknown>;
  [key: string]: unknown;
}

// ==================== REGISTRAZIONE HELPER HANDLEBARS ====================

Handlebars.registerHelper('formatDate', (date: Date) => {
  return new Date(date).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
});

Handlebars.registerHelper('formatCurrency', (amount: number) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
});

Handlebars.registerHelper('uppercase', (str: string) => {
  return str?.toUpperCase();
});

Handlebars.registerHelper('lowercase', (str: string) => {
  return str?.toLowerCase();
});

// ==================== DTO INTERFACES ====================

export interface CreateTemplateDto {
  code: string;
  name: string;
  description?: string;
  category: string;
  subject?: string;
  htmlContent: string;
  textContent?: string;
  smsContent?: string;
  whatsappContent?: string;
  variables: TemplateVariable[];
  channels: string[];
  priority?: NotificationPriority;
  isActive?: boolean;
}

export interface CreateEventDto {
  code: string;
  name: string;
  description?: string;
  eventType: string;
  entityType?: string;
  conditions?: EventConditions;
  templateId: string;
  delay?: number;
  retryPolicy?: Record<string, unknown>;
}

export interface SendNotificationDto {
  templateCode: string;
  recipientId: string;
  variables: Record<string, unknown>;
  channels?: string[];
  priority?: NotificationPriority;
  scheduledFor?: Date;
}

// ==================== SERVICE CLASS ====================

export class NotificationTemplateService {
  /**
   * Recupera tutti i template con filtri opzionali
   */
  async getAllTemplates(filters?: {
    Category?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<unknown[]> {
    try {
      const where: Prisma.NotificationTemplateWhereInput = {};

      if (filters?.Category && filters.Category !== 'all') {
        where.category = filters.Category;
      }

      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      if (filters?.search) {
        where.OR = [
          { code: { contains: filters.search, mode: 'insensitive' } },
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      const templates = await prisma.notificationTemplate.findMany({
        where,
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      });

      logger.info(`Retrieved ${templates.length} templates`);
      return templates;
    } catch (error) {
      logger.error('Error fetching templates:', error);
      throw error;
    }
  }

  /**
   * Recupera un template per codice
   */
  async getTemplateByCode(code: string): Promise<NotificationTemplate> {
    try {
      const template = await prisma.notificationTemplate.findUnique({
        where: { code },
      });

      if (!template) {
        throw new Error(`Template with code ${code} not found`);
      }

      return template as NotificationTemplate;
    } catch (error) {
      logger.error(`Error fetching template ${code}:`, error);
      throw error;
    }
  }

  /**
   * Recupera un template per ID
   */
  async getTemplateById(id: string): Promise<NotificationTemplate> {
    try {
      const template = await prisma.notificationTemplate.findUnique({
        where: { id },
      });

      if (!template) {
        throw new Error(`Template with id ${id} not found`);
      }

      return template as NotificationTemplate;
    } catch (error) {
      logger.error(`Error fetching template ${id}:`, error);
      throw error;
    }
  }

  /**
   * Crea un nuovo template di notifica
   */
  async createTemplate(
    data: CreateTemplateDto,
    userId?: string
  ): Promise<unknown> {
    try {
      this.validateTemplate(data.htmlContent, data.variables);

      if (data.textContent) {
        this.validateTemplate(data.textContent, data.variables);
      }

      if (data.smsContent) {
        this.validateTemplate(data.smsContent, data.variables);
      }

      const template = await prisma.notificationTemplate.create({
        data: {
          id: uuidv4(),
          code: data.code,
          name: data.name,
          description: data.description,
          category: data.category,
          subject: data.subject,
          htmlContent: data.htmlContent,
          textContent: data.textContent,
          smsContent: data.smsContent,
          whatsappContent: data.whatsappContent,
          // Cast to Prisma JSON types to satisfy InputJsonValue
          variables: data.variables as unknown as Prisma.InputJsonValue,
          channels: data.channels as unknown as Prisma.InputJsonValue,
          priority: data.priority ?? NotificationPriority.NORMAL,
          isActive: data.isActive ?? true,
          createdBy: userId,
          updatedBy: userId,
          updatedAt: new Date(),
        },
      });

      logger.info(`Template created: ${template.code}`);
      return template;
    } catch (error) {
      logger.error('Error creating template:', error);
      throw error;
    }
  }

  /**
   * Aggiorna un template esistente
   */
  async updateTemplate(
    id: string,
    data: Partial<CreateTemplateDto>,
    userId?: string
  ): Promise<unknown> {
    try {
      const existing = await this.getTemplateById(id);
      if (existing.isSystem) {
        throw new Error('System templates cannot be modified');
      }

      if (data.htmlContent && data.variables) {
        this.validateTemplate(data.htmlContent, data.variables);
      }

      if (data.textContent && data.variables) {
        this.validateTemplate(data.textContent, data.variables);
      }

      if (data.smsContent && data.variables) {
        this.validateTemplate(data.smsContent, data.variables);
      }

      const template = await prisma.notificationTemplate.update({
        where: { id },
        data: {
          code: data.code,
          name: data.name,
          description: data.description,
          category: data.category,
          subject: data.subject,
          htmlContent: data.htmlContent,
          textContent: data.textContent,
          smsContent: data.smsContent,
          whatsappContent: data.whatsappContent,
          variables:
            data.variables !== undefined
              ? (data.variables as unknown as Prisma.InputJsonValue)
              : undefined,
          channels:
            data.channels !== undefined
              ? (data.channels as unknown as Prisma.InputJsonValue)
              : undefined,
          priority: data.priority,
          isActive: data.isActive,
          updatedBy: userId,
          updatedAt: new Date(),
          version: { increment: 1 },
        },
      });

      logger.info(`Template updated: ${template.code}`);
      return template;
    } catch (error) {
      logger.error(`Error updating template ${id}:`, error);
      throw error;
    }
  }

  /**
   * Elimina un template
   */
  async deleteTemplate(id: string): Promise<{ success: boolean }> {
    try {
      const existing = await this.getTemplateById(id);
      if (existing.isSystem) {
        throw new Error('System templates cannot be deleted');
      }

      await prisma.notificationTemplate.delete({
        where: { id },
      });

      logger.info(`Template deleted: ${existing.code}`);
      return { success: true };
    } catch (error) {
      logger.error(`Error deleting template ${id}:`, error);
      throw error;
    }
  }

  /**
   * Compila un template con variabili
   */
  async compileTemplate(
    templateId: string,
    variables: Record<string, unknown>,
    channel: string = 'email'
  ): Promise<{ subject: string | null; content: string; channel: string }> {
    try {
      const template = await this.getTemplateById(templateId);

      let content = '';
      switch (channel) {
        case 'email':
          content = template.htmlContent;
          break;
        case 'sms':
          content = template.smsContent || '';
          break;
        case 'whatsapp':
          content = template.whatsappContent || '';
          break;
        default:
          content = template.textContent || '';
      }

      const compiledTemplate = Handlebars.compile(content);
      const renderedContent = compiledTemplate(variables);

      return {
        subject: template.subject
          ? Handlebars.compile(template.subject)(variables)
          : null,
        content: renderedContent,
        channel,
      };
    } catch (error) {
      logger.error('Error compiling template:', error);
      throw error;
    }
  }

  /**
   * Recupera tutti gli eventi
   */
  async getAllEvents(filters?: {
    eventType?: string;
    isActive?: boolean;
  }): Promise<unknown[]> {
    try {
      const where: Prisma.NotificationEventWhereInput = {};

      if (filters?.eventType) {
        where.eventType = filters.eventType;
      }

      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      const events = await prisma.notificationEvent.findMany({
        where,
        include: {
          NotificationTemplate: true,
        },
        orderBy: [{ eventType: 'asc' }, { name: 'asc' }],
      });

      return events;
    } catch (error) {
      logger.error('Error fetching events:', error);
      throw error;
    }
  }

  /**
   * Crea un nuovo evento
   */
  async createEvent(data: CreateEventDto): Promise<unknown> {
    try {
      const event = await prisma.notificationEvent.create({
        data: {
          id: uuidv4(),
          code: data.code,
          name: data.name,
          description: data.description,
          eventType: data.eventType,
          entityType: data.entityType,
          conditions:
            data.conditions !== undefined
              ? (data.conditions as unknown as Prisma.InputJsonValue)
              : undefined,
          delay: data.delay ?? 0,
          retryPolicy:
            data.retryPolicy !== undefined
              ? (data.retryPolicy as unknown as Prisma.InputJsonValue)
              : undefined,
          updatedAt: new Date(),
          NotificationTemplate: { connect: { id: data.templateId } },
        },
        include: {
          NotificationTemplate: true,
        },
      });

      logger.info(`Event created: ${event.code}`);
      return event;
    } catch (error) {
      logger.error('Error creating event:', error);
      throw error;
    }
  }

  /**
   * Aggiorna un evento esistente
   */
  async updateEvent(
    id: string,
    data: Partial<CreateEventDto>
  ): Promise<unknown> {
    try {
      const event = await prisma.notificationEvent.update({
        where: { id },
        data: {
          code: data.code,
          name: data.name,
          description: data.description,
          eventType: data.eventType,
          entityType: data.entityType,
          conditions:
            data.conditions !== undefined
              ? (data.conditions as unknown as Prisma.InputJsonValue)
              : undefined,
          delay: data.delay,
          retryPolicy:
            data.retryPolicy !== undefined
              ? (data.retryPolicy as unknown as Prisma.InputJsonValue)
              : undefined,
          updatedAt: new Date(),
          ...(data.templateId
            ? { NotificationTemplate: { connect: { id: data.templateId } } }
            : {}),
        },
        include: {
          NotificationTemplate: true,
        },
      });

      logger.info(`Event updated: ${event.code}`);
      return event;
    } catch (error) {
      logger.error(`Error updating event ${id}:`, error);
      throw error;
    }
  }

  /**
   * Elimina un evento
   */
  async deleteEvent(id: string): Promise<{ success: boolean }> {
    try {
      const event = await prisma.notificationEvent.findUnique({
        where: { id },
      });

      if (!event) {
        throw new Error(`Event with id ${id} not found`);
      }

      await prisma.notificationEvent.delete({
        where: { id },
      });

      logger.info(`Event deleted: ${event.code}`);
      return { success: true };
    } catch (error) {
      logger.error(`Error deleting event ${id}:`, error);
      throw error;
    }
  }

  /**
   * Trigger di un evento
   */
  async triggerEvent(
    eventCode: string,
    data: EventData
  ): Promise<void> {
    try {
      const event = await prisma.notificationEvent.findUnique({
        where: { code: eventCode },
        include: {
          NotificationTemplate: true,
        },
      });

      if (!event) {
        throw new Error(`Event with code ${eventCode} not found`);
      }

      if (!event.isActive) {
        logger.warn(`Event ${eventCode} is not active`);
        return;
      }

      // Valuta le condizioni
      if (event.conditions) {
        const shouldSend = await this.evaluateConditions(
          event.conditions as EventConditions,
          data
        );
        if (!shouldSend) {
          logger.info(`Event ${eventCode} conditions not met`);
          return;
        }
      }

      // Prepara l'invio
      const notificationData: SendNotificationDto = {
        templateCode: event.NotificationTemplate.code,
        recipientId: data.recipientId,
        variables: data.variables,
        priority: event.NotificationTemplate.priority,
      };

      // Se c'è un delay, schedula la notifica
      if (event.delay && event.delay > 0) {
        const scheduledFor = new Date(Date.now() + event.delay * 60 * 1000);
        await this.scheduleNotification({
          ...notificationData,
          scheduledFor,
        });
      } else {
        await this.sendNotification(notificationData);
      }

      logger.info(`Triggered event ${eventCode} for recipient ${data.recipientId}`);
    } catch (error) {
      logger.error(`Error triggering event ${eventCode}:`, error);
      throw error;
    }
  }

  /**
   * Invia una notifica immediata
   */
  async sendNotification(data: SendNotificationDto): Promise<unknown[]> {
    try {
      const template = await this.getTemplateByCode(data.templateCode);

      if (!template.isActive) {
        throw new Error('Template is not active');
      }

      const channels = data.channels || template.channels;
      const results: unknown[] = [];

      for (const channel of channels) {
        if (!template.channels.includes(channel)) {
          logger.warn(
            `Channel ${channel} not enabled for template ${template.code}`
          );
          continue;
        }

        const result = await this.sendViaChannel(
          template,
          data.recipientId,
          data.variables,
          channel,
          data.priority || template.priority
        );

        results.push(result);
      }

      return results;
    } catch (error) {
      logger.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Schedula una notifica
   */
  async scheduleNotification(data: SendNotificationDto): Promise<unknown[]> {
    try {
      const template = await this.getTemplateByCode(data.templateCode);

      if (!template.isActive) {
        throw new Error('Template is not active');
      }

      const channels = data.channels || template.channels;
      const queueEntries: unknown[] = [];

      for (const channel of channels) {
        if (!template.channels.includes(channel)) {
          continue;
        }

        const queueEntry = await prisma.notificationQueue.create({
          data: {
            id: uuidv4(),
            templateId: template.id,
            recipientId: data.recipientId,
            channel,
            priority: data.priority || template.priority,
            scheduledFor: data.scheduledFor || new Date(),
            data: {
              variables: data.variables,
              subject: template.subject,
              content: this.getContentForChannel(template, channel),
            } as Prisma.InputJsonValue,
          },
        });

        queueEntries.push(queueEntry);
      }

      logger.info(
        `Scheduled ${queueEntries.length} notifications for template ${template.code}`
      );
      return queueEntries;
    } catch (error) {
      logger.error('Error scheduling notification:', error);
      throw error;
    }
  }

  /**
   * Processa la coda delle notifiche
   */
  async processQueue(limit: number = 100): Promise<unknown[]> {
    try {
      const notifications = await prisma.notificationQueue.findMany({
        where: {
          status: 'pending',
          scheduledFor: { lte: new Date() },
        },
        orderBy: [{ priority: 'desc' }, { scheduledFor: 'asc' }],
        take: limit,
      });

      const results: unknown[] = [];

      for (const notification of notifications) {
        try {
          await prisma.notificationQueue.update({
            where: { id: notification.id },
            data: { status: 'processing' },
          });

          const template = await this.getTemplateById(notification.templateId);

          // Safely extract variables from JSON payload
          const payload = notification.data as unknown;
          const variables =
            typeof payload === 'object' && payload !== null && 'variables' in (payload as Record<string, unknown>)
              ? (((payload as Record<string, unknown>).variables as unknown) as Record<string, unknown>)
              : {};

          const result = await this.sendViaChannel(
            template,
            notification.recipientId,
            variables,
            notification.channel,
            notification.priority
          );

          await prisma.notificationQueue.update({
            where: { id: notification.id },
            data: {
              status: 'sent',
              processedAt: new Date(),
            },
          });

          results.push(result);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          logger.error(`Error processing notification ${notification.id}:`, error);

          await prisma.notificationQueue.update({
            where: { id: notification.id },
            data: {
              status: 'failed',
              attempts: { increment: 1 },
              lastAttemptAt: new Date(),
              nextRetryAt: new Date(Date.now() + 5 * 60 * 1000),
              error: errorMessage,
            },
          });
        }
      }

      logger.info(`Processed ${results.length} notifications from queue`);
      return results;
    } catch (error) {
      logger.error('Error processing queue:', error);
      throw error;
    }
  }

  /**
   * Recupera le statistiche delle notifiche
   */
  async getStatistics(filters?: {
    startDate?: Date;
    endDate?: Date;
    channel?: string;
    templateId?: string;
  }): Promise<{
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    deliveryRate: number;
    failureRate: number;
    byChannel: Array<{ channel: string; count: number }>;
    byTemplate: unknown[];
  }> {
    try {
      const where: Prisma.NotificationLogWhereInput = {};

      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.createdAt.lte = filters.endDate;
        }
      }

      if (filters?.channel) {
        where.channel = filters.channel;
      }

      if (filters?.templateId) {
        where.templateId = filters.templateId;
      }

      const [total, sent, delivered, failed] = await Promise.all([
        prisma.notificationLog.count({ where }),
        prisma.notificationLog.count({ where: { ...where, status: 'sent' } }),
        prisma.notificationLog.count({
          where: { ...where, status: 'delivered' },
        }),
        prisma.notificationLog.count({ where: { ...where, status: 'failed' } }),
      ]);

      const byChannel = await prisma.notificationLog.groupBy({
        by: ['channel'],
        where,
        _count: true,
      });

      const byTemplate = await prisma.notificationLog.groupBy({
        by: ['templateId'],
        where,
        _count: true,
      });

      return {
        total,
        sent,
        delivered,
        failed,
        deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
        failureRate: total > 0 ? (failed / total) * 100 : 0,
        byChannel: byChannel.map((item) => ({
          channel: item.channel,
          count: item._count,
        })),
        byTemplate,
      };
    } catch (error) {
      logger.error('Error getting statistics:', error);
      throw error;
    }
  }

  // ==================== METODI PRIVATI ====================

  /**
   * Valida che un template sia compilabile
   */
  private validateTemplate(
    template: string,
    variables: TemplateVariable[]
  ): void {
    try {
      const compiledTemplate = Handlebars.compile(template);
      const testVariables: Record<string, unknown> = {};

      for (const variable of variables) {
        testVariables[variable.name] = variable.defaultValue || 'test';
      }

      compiledTemplate(testVariables);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Invalid template: ${errorMessage}`);
    }
  }

  /**
   * Recupera il contenuto appropriato per il canale
   */
  private getContentForChannel(
    template: NotificationTemplate,
    channel: string
  ): string {
    switch (channel) {
      case 'email':
        return template.htmlContent;
      case 'sms':
        return template.smsContent || '';
      case 'whatsapp':
        return template.whatsappContent || '';
      default:
        return template.textContent || '';
    }
  }

  /**
   * Invia una notifica attraverso un canale specifico
   */
  private async sendViaChannel(
    template: NotificationTemplate,
    recipientId: string,
    variables: Record<string, unknown>,
    channel: string,
    priority: NotificationPriority
  ): Promise<unknown> {
    try {
      const recipient = await prisma.user.findUnique({
        where: { id: recipientId },
      });

      if (!recipient) {
        throw new Error(`Recipient ${recipientId} not found`);
      }

      const content = this.getContentForChannel(template, channel);
      const compiledTemplate = Handlebars.compile(content);
      const renderedContent = compiledTemplate(variables);

      let subject: string | null = null;
      if (template.subject) {
        const compiledSubject = Handlebars.compile(template.subject);
        subject = compiledSubject(variables);
      }

      const log = await prisma.notificationLog.create({
        data: {
          id: uuidv4(),
          templateId: template.id,
          recipientId,
          recipientEmail: recipient.email,
          recipientPhone: recipient.phone,
          channel,
          status: 'pending',
          subject,
          content: renderedContent,
          variables: variables as Prisma.InputJsonValue,
        },
      });

      logger.info(`Sending ${channel} notification to ${recipientId}`);

      await prisma.notificationLog.update({
        where: { id: log.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      });

      return log;
    } catch (error) {
      logger.error(`Error sending via ${channel}:`, error);
      throw error;
    }
  }

  /**
   * Valuta le condizioni per un evento
   */
  private async evaluateConditions(
    conditions: EventConditions,
    data: EventData
  ): Promise<boolean> {
    try {
      if (conditions.minAmount && data.variables.amount) {
        const amount = Number(data.variables.amount);
        if (amount < conditions.minAmount) {
          return false;
        }
      }

      if (conditions.requiredStatus && data.variables.status) {
        if (data.variables.status !== conditions.requiredStatus) {
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error('Error evaluating conditions:', error);
      return false;
    }
  }
}

// Singleton instance
export const notificationTemplateService = new NotificationTemplateService();
