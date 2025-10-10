/**
 * Professional Notification Template Service
 * Gestisce template, eventi e invio notifiche professionali
 */

import { PrismaClient, NotificationPriority, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import Handlebars from 'handlebars';

const prisma = new PrismaClient();

// Registra helper Handlebars personalizzati
Handlebars.registerHelper('formatDate', (date: Date) => {
  return new Date(date).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
});

Handlebars.registerHelper('formatCurrency', (amount: number) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
});

Handlebars.registerHelper('uppercase', (str: string) => {
  return str?.toUpperCase();
});

Handlebars.registerHelper('lowercase', (str: string) => {
  return str?.toLowerCase();
});

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
  variables: any[];
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
  conditions?: any;
  templateId: string;
  delay?: number;
  retryPolicy?: any;
}

export interface SendNotificationDto {
  templateCode: string;
  recipientId: string;
  variables: Record<string, any>;
  channels?: string[];
  priority?: NotificationPriority;
  scheduledFor?: Date;
}

export class NotificationTemplateService {
  /**
   * Recupera tutti i template con filtri opzionali
   */
  async getAllTemplates(filters?: {
    category?: string;
    isActive?: boolean;
    search?: string;
  }) {
    try {
      const where: Prisma.NotificationTemplateWhereInput = {};
      
      if (filters?.category && filters.category !== 'all') {
        where.category = filters.category;
      }
      
      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive;
      }
      
      if (filters?.search) {
        where.OR = [
          { code: { contains: filters.search, mode: 'insensitive' } },
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      const templates = await prisma.notificationTemplate.findMany({
        where,
        orderBy: [
          { category: 'asc' },
          { name: 'asc' }
        ]
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
  async getTemplateByCode(code: string) {
    try {
      const template = await prisma.notificationTemplate.findUnique({
        where: { code }
      });
      
      if (!template) {
        throw new Error(`Template with code ${code} not found`);
      }
      
      return template;
    } catch (error) {
      logger.error(`Error fetching template ${code}:`, error);
      throw error;
    }
  }

  /**
   * Recupera un template per ID
   */
  async getTemplateById(id: string) {
    try {
      const template = await prisma.notificationTemplate.findUnique({
        where: { id }
      });
      
      if (!template) {
        throw new Error(`Template with id ${id} not found`);
      }
      
      return template;
    } catch (error) {
      logger.error(`Error fetching template ${id}:`, error);
      throw error;
    }
  }

  /**
   * Crea un nuovo template di notifica
   */
  async createTemplate(data: CreateTemplateDto, userId?: string) {
    try {
      // Valida che il template HTML sia compilabile
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
          ...data,
          createdBy: userId,
          updatedBy: userId
        }
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
  async updateTemplate(id: string, data: Partial<CreateTemplateDto>, userId?: string) {
    try {
      // Verifica che il template non sia di sistema
      const existing = await this.getTemplateById(id);
      if (existing.isSystem) {
        throw new Error('System templates cannot be modified');
      }

      // Valida i nuovi template se forniti
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
          ...data,
          updatedBy: userId,
          version: { increment: 1 }
        }
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
  async deleteTemplate(id: string) {
    try {
      // Verifica che il template non sia di sistema
      const existing = await this.getTemplateById(id);
      if (existing.isSystem) {
        throw new Error('System templates cannot be deleted');
      }

      await prisma.notificationTemplate.delete({
        where: { id }
      });

      logger.info(`Template deleted: ${existing.code}`);
      return { success: true };
    } catch (error) {
      logger.error(`Error deleting template ${id}:`, error);
      throw error;
    }
  }

  /**
   * Recupera tutti gli eventi
   */
  async getAllEvents(filters?: {
    eventType?: string;
    isActive?: boolean;
  }) {
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
          NotificationTemplate: true
        },
        orderBy: [
          { eventType: 'asc' },
          { name: 'asc' }
        ]
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
  async createEvent(data: CreateEventDto) {
    try {
      const event = await prisma.notificationEvent.create({
        data: {
          id: uuidv4(),
          ...data
        },
        include: {
          NotificationTemplate: true
        }
      });

      logger.info(`Event created: ${event.code}`);
      return event;
    } catch (error) {
      logger.error('Error creating event:', error);
      throw error;
    }
  }

  /**
   * Aggiorna un evento
   */
  async updateEvent(id: string, data: Partial<CreateEventDto>) {
    try {
      const event = await prisma.notificationEvent.update({
        where: { id },
        data
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
  async deleteEvent(id: string) {
    try {
      await prisma.notificationEvent.delete({
        where: { id }
      });

      logger.info(`Event deleted: ${id}`);
      return { success: true };
    } catch (error) {
      logger.error(`Error deleting event ${id}:`, error);
      throw error;
    }
  }

  /**
   * Preview di un template con variabili
   */
  async previewTemplate(templateCode: string, variables: Record<string, any>, channel: string = 'email') {
    try {
      const template = await this.getTemplateByCode(templateCode);
      
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
        subject: template.subject ? Handlebars.compile(template.subject)(variables) : null,
        content: renderedContent,
        channel
      };
    } catch (error) {
      logger.error('Error previewing template:', error);
      throw error;
    }
  }

  /**
   * Invia una notifica immediata
   */
  async sendNotification(data: SendNotificationDto) {
    try {
      const template = await this.getTemplateByCode(data.templateCode);
      
      if (!template.isActive) {
        throw new Error('Template is not active');
      }

      const channels = data.channels || template.channels;
      const results = [];

      for (const channel of channels as string[]) {
        if (!template.channels.includes(channel)) {
          logger.warn(`Channel ${channel} not enabled for template ${template.code}`);
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
  async scheduleNotification(data: SendNotificationDto) {
    try {
      const template = await this.getTemplateByCode(data.templateCode);
      
      if (!template.isActive) {
        throw new Error('Template is not active');
      }

      const channels = data.channels || template.channels;
      const queueEntries = [];

      for (const channel of channels as string[]) {
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
              content: this.getContentForChannel(template, channel)
            }
          }
        });

        queueEntries.push(queueEntry);
      }

      logger.info(`Scheduled ${queueEntries.length} notifications for template ${template.code}`);
      return queueEntries;
    } catch (error) {
      logger.error('Error scheduling notification:', error);
      throw error;
    }
  }

  /**
   * Processa la coda delle notifiche
   */
  async processQueue(limit: number = 100) {
    try {
      const notifications = await prisma.notificationQueue.findMany({
        where: {
          status: 'pending',
          scheduledFor: { lte: new Date() }
        },
        orderBy: [
          { priority: 'desc' },
          { scheduledFor: 'asc' }
        ],
        take: limit
      });

      const results = [];
      
      for (const notification of notifications) {
        try {
          // Segna come in elaborazione
          await prisma.notificationQueue.update({
            where: { id: notification.id },
            data: { status: 'processing' }
          });

          // Recupera il template
          const template = await this.getTemplateById(notification.templateId);
          
          // Invia la notifica
          const result = await this.sendViaChannel(
            template,
            notification.recipientId,
            notification.data as any,
            notification.channel,
            notification.priority
          );

          // Aggiorna lo stato
          await prisma.notificationQueue.update({
            where: { id: notification.id },
            data: { 
              status: 'sent',
              processedAt: new Date()
            }
          });

          results.push(result);
        } catch (error) {
          logger.error(`Error processing notification ${notification.id}:`, error);
          
          // Aggiorna con errore e retry
          await prisma.notificationQueue.update({
            where: { id: notification.id },
            data: {
              status: 'failed',
              attempts: { increment: 1 },
              lastAttemptAt: new Date(),
              nextRetryAt: new Date(Date.now() + 5 * 60 * 1000), // Retry in 5 minuti
              error: error.message
            }
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
   * Gestisce gli eventi del sistema
   */
  async handleEvent(eventType: string, entityType: string, entityId: string, data: any) {
    try {
      // Trova gli eventi attivi per questo tipo
      const events = await prisma.notificationEvent.findMany({
        where: {
          eventType,
          entityType,
          isActive: true
        },
        include: {
          NotificationTemplate: true
        }
      });

      for (const event of events) {
        // Valuta le condizioni
        if (event.conditions) {
          const shouldSend = await this.evaluateConditions(event.conditions, data);
          if (!shouldSend) {
            continue;
          }
        }

        // Prepara l'invio
        const notificationData: SendNotificationDto = {
          templateCode: event.NotificationTemplate.code,
          recipientId: data.recipientId,
          variables: data.variables,
          priority: event.NotificationTemplate.priority
        };

        // Se c'è un delay, schedula la notifica
        if (event.delay > 0) {
          const scheduledFor = new Date(Date.now() + event.delay * 60 * 1000);
          await this.scheduleNotification({
            ...notificationData,
            scheduledFor
          });
        } else {
          // Altrimenti invia subito
          await this.sendNotification(notificationData);
        }
      }

      logger.info(`Handled event ${eventType} for ${entityType} ${entityId}`);
    } catch (error) {
      logger.error(`Error handling event ${eventType}:`, error);
      throw error;
    }
  }

  /**
   * Metodi privati di supporto
   */
  
  private validateTemplate(template: string, variables: any[]) {
    try {
      const compiledTemplate = Handlebars.compile(template);
      const testVariables = {};
      
      // Crea variabili di test
      for (const variable of variables) {
        testVariables[variable.name] = variable.defaultValue || 'test';
      }
      
      // Prova a compilare
      compiledTemplate(testVariables);
    } catch (error) {
      throw new Error(`Invalid template: ${error.message}`);
    }
  }

  private getContentForChannel(template: any, channel: string): string {
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

  private async sendViaChannel(
    template: any,
    recipientId: string,
    variables: any,
    channel: string,
    priority: NotificationPriority
  ) {
    try {
      // Recupera il destinatario
      const recipient = await prisma.user.findUnique({
        where: { id: recipientId }
      });

      if (!recipient) {
        throw new Error(`Recipient ${recipientId} not found`);
      }

      // Compila il template
      const content = this.getContentForChannel(template, channel);
      const compiledTemplate = Handlebars.compile(content);
      const renderedContent = compiledTemplate(variables);
      
      let subject = null;
      if (template.subject) {
        const compiledSubject = Handlebars.compile(template.subject);
        subject = compiledSubject(variables);
      }

      // Log della notifica
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
          variables
        }
      });

      // Qui dovresti implementare l'invio effettivo per ogni canale
      // Per ora simuliamo solo il successo
      logger.info(`Sending ${channel} notification to ${recipientId}`);
      
      // Aggiorna lo stato
      await prisma.notificationLog.update({
        where: { id: log.id },
        data: {
          status: 'sent',
          sentAt: new Date()
        }
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
  private async evaluateConditions(conditions: any, data: any): Promise<boolean> {
    // Implementazione semplificata - può essere estesa
    try {
      if (conditions.minAmount && data.variables.amount) {
        if (data.variables.amount < conditions.minAmount) {
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

  /**
   * Recupera le statistiche delle notifiche
   */
  async getStatistics(filters?: {
    startDate?: Date;
    endDate?: Date;
    channel?: string;
    templateId?: string;
  }) {
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
        prisma.notificationLog.count({ where: { ...where, status: 'delivered' } }),
        prisma.notificationLog.count({ where: { ...where, status: 'failed' } })
      ]);

      const byChannel = await prisma.notificationLog.groupBy({
        by: ['channel'],
        where,
        _count: true
      });

      const byTemplate = await prisma.notificationLog.groupBy({
        by: ['templateId'],
        where,
        _count: true
      });

      return {
        total,
        sent,
        delivered,
        failed,
        deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
        failureRate: total > 0 ? (failed / total) * 100 : 0,
        byChannel: byChannel.map(item => ({
          channel: item.channel,
          count: item._count
        })),
        byTemplate
      };
    } catch (error) {
      logger.error('Error getting statistics:', error);
      throw error;
    }
  }

  /**
   * Aggiorna un evento esistente
   */
  async updateEvent(id: string, data: Partial<CreateEventDto>) {
    try {
      const event = await prisma.notificationEvent.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        },
        include: {
          NotificationTemplate: true
        }
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
  async deleteEvent(id: string) {
    try {
      const event = await prisma.notificationEvent.findUnique({
        where: { id }
      });

      if (!event) {
        throw new Error(`Event with id ${id} not found`);
      }

      await prisma.notificationEvent.delete({
        where: { id }
      });

      logger.info(`Event deleted: ${event.code}`);
      return { success: true };
    } catch (error) {
      logger.error(`Error deleting event ${id}:`, error);
      throw error;
    }
  }
}

// Singleton instance
export const notificationTemplateService = new NotificationTemplateService();
