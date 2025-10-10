/**
 * WhatsApp Template Service
 * Sistema di template messaggi per WhatsApp
 * FASE 2 - Funzionalità Complete: Template System
 * 
 * Usa il sistema di notifiche e audit log esistente
 */

import { prisma } from '../config/database';
import logger from '../utils/logger';
import { whatsAppValidation } from './whatsapp-validation.service';
import { wppConnectService } from './wppconnect.service';
import { NotificationService } from './notification.service';
import { auditLogService } from './auditLog.service';
import { createId } from '@paralleldrive/cuid2';

const notificationService = new NotificationService();

// ===== TIPI TYPESCRIPT =====

export interface WhatsAppTemplate {
  id?: string;
  name: string;
  category: string;
  content: string;
  variables?: string[];
  mediaUrl?: string;
  mediaType?: 'image' | 'document' | 'audio' | 'video';
  buttons?: TemplateButton[];
  isActive?: boolean;
  usageCount?: number;
  tags?: string[];
  language?: string;
}

export interface TemplateButton {
  type: 'url' | 'phone' | 'quick_reply';
  text: string;
  value: string;
}

export interface TemplateVariables {
  [key: string]: string | number | Date;
}

interface TemplateMetadata {
  mediaUrl?: string;
  mediaType?: string;
  buttons?: TemplateButton[];
  tags?: string[];
  language?: string;
  usageCount?: number;
  isWhatsApp?: boolean;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  to: string;
  template: string;
}

interface BulkSendResult {
  sent: string[];
  failed: Array<{ number: string; error: string }>;
  total: number;
}

interface DbTemplate {
  id: string;
  code: string;
  name: string;
  priority: string;
  description: string | null;
  category: string;
  htmlContent: string;
  textContent: string | null;
  whatsappContent: string | null;
  variables: any;
  channels: any;
  isActive: boolean;
  isSystem: boolean;
  version: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class WhatsAppTemplateService {
  
  /**
   * Crea un nuovo template
   */
  async createTemplate(template: WhatsAppTemplate, userId: string): Promise<WhatsAppTemplate> {
    try {
      logger.info(`📝 Creazione template: ${template.name}`);
      
      // Valida template
      this.validateTemplate(template);
      
      // Estrai variabili dal contenuto
      const variables = this.extractVariables(template.content);
      
      // Prepara metadata come JSON
      const metadata: TemplateMetadata = {
        mediaUrl: template.mediaUrl,
        mediaType: template.mediaType,
        buttons: template.buttons,
        tags: template.tags,
        language: template.language || 'it',
        usageCount: 0,
        isWhatsApp: true
      };
      
      // Salva nel database usando la tabella NotificationTemplate esistente
      const savedTemplate = await prisma.notificationTemplate.create({
        data: {
          id: createId(),
          code: `whatsapp_${Date.now()}`,
          name: template.name,
          subject: `WhatsApp: ${template.name}`,
          htmlContent: template.content,
          textContent: template.content,
          whatsappContent: template.content,
          category: template.category,
          isActive: template.isActive !== false,
          variables: variables,
          channels: ['whatsapp'],
          priority: 'NORMAL',
          createdBy: userId,
          updatedAt: new Date()
        }
      });
      
      // Log nel sistema audit
      await auditLogService.log({
        action: 'CREATE',
        entityType: 'WhatsAppTemplate',
        entityId: savedTemplate.id,
        userId: userId,
        ipAddress: 'system',
        userAgent: 'whatsapp-template-service',
        metadata: {
          templateName: template.name,
          category: template.category
        },
        success: true,
        severity: 'INFO',
        category: 'BUSINESS'
      });
      
      logger.info(`✅ Template creato: ${savedTemplate.id}`);
      
      return this.mapToWhatsAppTemplate(savedTemplate);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('❌ Errore creazione template:', error);
      throw new Error(`Failed to create template: ${errorMessage}`);
    }
  }
  
  /**
   * Aggiorna un template esistente
   */
  async updateTemplate(templateId: string, updates: Partial<WhatsAppTemplate>, userId: string): Promise<WhatsAppTemplate> {
    try {
      logger.info(`📝 Aggiornamento template: ${templateId}`);
      
      // Recupera template esistente
      const existing = await prisma.notificationTemplate.findUnique({
        where: { id: templateId }
      });
      
      if (!existing) {
        throw new Error('Template WhatsApp non trovato');
      }
      
      // Estrai nuove variabili se content è cambiato
      const variables = updates.content ? 
        this.extractVariables(updates.content) : 
        existing.variables;
      
      // Aggiorna nel database
      const updated = await prisma.notificationTemplate.update({
        where: { id: templateId },
        data: {
          name: updates.name || existing.name,
          htmlContent: updates.content || existing.htmlContent,
          textContent: updates.content || existing.textContent,
          whatsappContent: updates.content || existing.whatsappContent,
          category: updates.category || existing.category,
          isActive: updates.isActive !== undefined ? updates.isActive : existing.isActive,
          variables: variables,
          updatedBy: userId,
          updatedAt: new Date()
        }
      });
      
      // Log nel sistema audit
      await auditLogService.log({
        action: 'UPDATE',
        entityType: 'WhatsAppTemplate',
        entityId: templateId,
        userId: userId,
        ipAddress: 'system',
        userAgent: 'whatsapp-template-service',
        oldValues: existing,
        newValues: updated,
        success: true,
        severity: 'INFO',
        category: 'BUSINESS'
      });
      
      logger.info(`✅ Template aggiornato: ${templateId}`);
      
      return this.mapToWhatsAppTemplate(updated);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('❌ Errore aggiornamento template:', error);
      throw new Error(`Failed to update template: ${errorMessage}`);
    }
  }
  
  /**
   * Ottieni template per ID
   */
  async getTemplate(templateId: string): Promise<WhatsAppTemplate | null> {
    try {
      const template = await prisma.notificationTemplate.findUnique({
        where: { id: templateId }
      });
      
      if (!template) return null;
      
      return this.mapToWhatsAppTemplate(template);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('❌ Errore recupero template:', error);
      throw new Error(`Failed to get template: ${errorMessage}`);
    }
  }
  
  /**
   * Ottieni tutti i template
   */
  async getAllTemplates(filters?: {
    category?: string;
    isActive?: boolean;
    tags?: string[];
  }): Promise<WhatsAppTemplate[]> {
    try {
      const where: Record<string, unknown> = {
        category: filters?.category
      };
      
      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive;
      }
      
      const templates = await prisma.notificationTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });
      
      return templates.map(t => this.mapToWhatsAppTemplate(t));
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('❌ Errore recupero templates:', error);
      throw new Error(`Failed to get templates: ${errorMessage}`);
    }
  }
  
  /**
   * Invia messaggio usando un template
   */
  async sendFromTemplate(
    templateId: string,
    to: string,
    variables?: TemplateVariables,
    userId?: string
  ): Promise<SendResult> {
    try {
      logger.info(`📤 Invio da template ${templateId} a ${to}`);
      
      // Valida numero destinatario
      const validatedNumber = await whatsAppValidation.validatePhoneNumber(to);
      if (!validatedNumber.isValid) {
        throw new Error(`Numero non valido: ${validatedNumber.error}`);
      }
      
      // Recupera template
      const template = await this.getTemplate(templateId);
      if (!template) {
        throw new Error('Template non trovato');
      }
      
      if (!template.isActive) {
        throw new Error('Template non attivo');
      }
      
      // Sostituisci variabili nel contenuto
      let content = template.content;
      if (variables) {
        content = this.replaceVariables(content, variables);
      }
      
      // Ottieni client WPPConnect
      const client = wppConnectService;
      
      // Invia messaggio
      const result = await client.sendMessage(validatedNumber.formatted, content);
      
      // Salva nel database
      await prisma.whatsAppMessage.create({
        data: {
          messageId: result.messageId || `msg_${Date.now()}`,
          phoneNumber: validatedNumber.formatted,
          message: content,
          direction: 'outgoing',
          status: 'SENT',
          timestamp: new Date(),
          type: 'template'
        }
      });
      
      // Log nel sistema audit
      await auditLogService.log({
        action: 'CREATE',
        entityType: 'WhatsAppMessage',
        entityId: result.messageId || '',
        userId: userId || undefined,
        ipAddress: 'system',
        userAgent: 'whatsapp-template-service',
        metadata: {
          to: validatedNumber.formatted,
          templateName: template.name,
          hasVariables: !!variables
        },
        success: true,
        severity: 'INFO',
        category: 'BUSINESS'
      });
      
      // Invia media se presente nel template
      if (template.mediaUrl && template.mediaType) {
        await this.sendTemplateMedia(
          validatedNumber.formatted, 
          template.mediaUrl, 
          template.mediaType
        );
      }
      
      logger.info(`✅ Template inviato con successo a ${to}`);
      
      return {
        success: true,
        messageId: result.messageId,
        to: validatedNumber.formatted,
        template: template.name
      };
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('❌ Errore invio template:', error);
      
      await auditLogService.log({
        action: 'CREATE',
        entityType: 'WhatsAppMessage',
        entityId: templateId,
        userId: userId || undefined,
        ipAddress: 'system',
        userAgent: 'whatsapp-template-service',
        errorMessage: errorMessage,
        success: false,
        severity: 'ERROR',
        category: 'BUSINESS'
      });
      
      throw new Error(`Failed to send template: ${errorMessage}`);
    }
  }
  
  /**
   * Invia template a multipli destinatari (broadcast)
   */
  async sendBulkFromTemplate(
    templateId: string,
    recipients: string[],
    commonVariables?: TemplateVariables,
    individualVariables?: Map<string, TemplateVariables>,
    userId?: string
  ): Promise<BulkSendResult> {
    try {
      logger.info(`📤 Invio bulk template ${templateId} a ${recipients.length} destinatari`);
      
      const results: BulkSendResult = {
        sent: [],
        failed: [],
        total: recipients.length
      };
      
      // Recupera template una volta sola
      const template = await this.getTemplate(templateId);
      if (!template || !template.isActive) {
        throw new Error('Template non trovato o non attivo');
      }
      
      // Invia a batch per evitare rate limiting
      const batchSize = 10;
      const delay = 2000; // 2 secondi tra batch
      
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (recipient) => {
            try {
              // Combina variabili comuni e individuali
              const variables = {
                ...commonVariables,
                ...(individualVariables?.get(recipient) || {})
              };
              
              await this.sendFromTemplate(
                templateId,
                recipient,
                variables,
                userId
              );
              
              results.sent.push(recipient);
              
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              results.failed.push({
                number: recipient,
                error: errorMessage
              });
            }
          })
        );
        
        // Delay tra batch
        if (i + batchSize < recipients.length) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      // Log nel sistema audit
      await auditLogService.log({
        action: 'CREATE',
        entityType: 'WhatsAppBulkSend',
        entityId: templateId,
        userId: userId || undefined,
        ipAddress: 'system',
        userAgent: 'whatsapp-template-service',
        metadata: {
          templateName: template.name,
          totalRecipients: results.total,
          sent: results.sent.length,
          failed: results.failed.length
        },
        success: results.sent.length > 0,
        severity: 'INFO',
        category: 'BUSINESS'
      });
      
      // Notifica admin se ci sono molti fallimenti
      if (results.failed.length > results.sent.length) {
        await this.notifyBulkSendIssue(template.name, results);
      }
      
      logger.info(`✅ Bulk send completato: ${results.sent.length}/${results.total} inviati`);
      
      return results;
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('❌ Errore invio bulk template:', error);
      throw new Error(`Failed to send bulk template: ${errorMessage}`);
    }
  }
  
  /**
   * Elimina un template
   */
  async deleteTemplate(templateId: string, userId: string): Promise<void> {
    try {
      logger.info(`🗑️ Eliminazione template: ${templateId}`);
      
      const template = await prisma.notificationTemplate.findUnique({
        where: { id: templateId }
      });
      
      if (!template) {
        throw new Error('Template non trovato');
      }
      
      // Soft delete (marca come inattivo)
      await prisma.notificationTemplate.update({
        where: { id: templateId },
        data: { 
          isActive: false
        }
      });
      
      // Log nel sistema audit
      await auditLogService.log({
        action: 'DELETE',
        entityType: 'WhatsAppTemplate',
        entityId: templateId,
        userId: userId,
        ipAddress: 'system',
        userAgent: 'whatsapp-template-service',
        metadata: {
          templateName: template.name
        },
        success: true,
        severity: 'INFO',
        category: 'BUSINESS'
      });
      
      logger.info(`✅ Template eliminato: ${templateId}`);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('❌ Errore eliminazione template:', error);
      throw new Error(`Failed to delete template: ${errorMessage}`);
    }
  }
  
  /**
   * Ottieni template più usati
   */
  async getMostUsedTemplates(limit: number = 10): Promise<WhatsAppTemplate[]> {
    try {
      const templates = await prisma.notificationTemplate.findMany({
        where: {
          isActive: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });
      
      return templates.map(t => this.mapToWhatsAppTemplate(t));
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('❌ Errore recupero template più usati:', error);
      throw new Error(`Failed to get most used templates: ${errorMessage}`);
    }
  }
  
  /**
   * Clona un template esistente
   */
  async cloneTemplate(templateId: string, newName: string, userId: string): Promise<WhatsAppTemplate> {
    try {
      const original = await this.getTemplate(templateId);
      if (!original) {
        throw new Error('Template originale non trovato');
      }
      
      const cloned = await this.createTemplate({
        ...original,
        name: newName,
        usageCount: 0
      }, userId);
      
      logger.info(`✅ Template clonato: ${original.name} → ${newName}`);
      
      return cloned;
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('❌ Errore clonazione template:', error);
      throw new Error(`Failed to clone template: ${errorMessage}`);
    }
  }
  
  // ========== METODI PRIVATI ==========
  
  /**
   * Valida un template
   */
  private validateTemplate(template: WhatsAppTemplate): void {
    if (!template.name || template.name.trim().length === 0) {
      throw new Error('Nome template richiesto');
    }
    
    if (!template.content || template.content.trim().length === 0) {
      throw new Error('Contenuto template richiesto');
    }
    
    if (template.content.length > 4096) {
      throw new Error('Contenuto template troppo lungo (max 4096 caratteri)');
    }
    
    if (!template.category) {
      throw new Error('Categoria template richiesta');
    }
    
    // Valida buttons se presenti
    if (template.buttons && template.buttons.length > 0) {
      if (template.buttons.length > 3) {
        throw new Error('Massimo 3 bottoni per template');
      }
      
      for (const button of template.buttons) {
        if (!button.text || !button.type || !button.value) {
          throw new Error('Bottone template non valido');
        }
        
        if (button.text.length > 20) {
          throw new Error('Testo bottone troppo lungo (max 20 caratteri)');
        }
      }
    }
  }
  
  /**
   * Estrae variabili dal contenuto del template
   */
  private extractVariables(content: string): string[] {
    const regex = /\{\{(\w+)\}\}/g;
    const variables: Set<string> = new Set();
    
    let match;
    while ((match = regex.exec(content)) !== null) {
      variables.add(match[1]);
    }
    
    return Array.from(variables);
  }
  
  /**
   * Sostituisce le variabili nel contenuto
   */
  private replaceVariables(content: string, variables: TemplateVariables): string {
    let result = content;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      let formattedValue = String(value);
      
      // Formatta date
      if (value instanceof Date) {
        formattedValue = value.toLocaleDateString('it-IT');
      }
      
      result = result.replace(regex, formattedValue);
    }
    
    return result;
  }
  
  /**
   * Invia media del template
   */
  private async sendTemplateMedia(
    to: string,
    mediaUrl: string,
    mediaType: string
  ): Promise<void> {
    try {
      // TODO: Implementare invio media quando il servizio è pronto
      logger.info(`📎 Invio media template: ${mediaType} a ${to}`);
    } catch (error: unknown) {
      logger.error('Errore invio media template:', error);
    }
  }
  
  /**
   * Notifica problemi invio bulk
   */
  private async notifyBulkSendIssue(templateName: string, results: BulkSendResult): Promise<void> {
    try {
      const admins = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'SUPER_ADMIN'] }
        }
      });
      
      for (const admin of admins) {
        // Crea notifica semplice nel database
        await prisma.notification.create({
          data: {
            id: createId(),
            type: 'whatsapp_bulk_issue',
            title: '⚠️ Problema invio bulk WhatsApp',
            content: `Template "${templateName}": ${results.failed.length}/${results.total} invii falliti`,
            priority: 'NORMAL',
            recipientId: admin.id
          }
        });
      }
    } catch (error: unknown) {
      logger.error('Errore notifica bulk issue:', error);
    }
  }
  
  /**
   * Mappa da NotificationTemplate a WhatsAppTemplate
   */
  private mapToWhatsAppTemplate(dbTemplate: any): WhatsAppTemplate {
    const content = dbTemplate.whatsappContent || dbTemplate.textContent || dbTemplate.htmlContent || '';
    
    return {
      id: dbTemplate.id,
      name: dbTemplate.name,
      category: dbTemplate.category || 'general',
      content: content,
      variables: Array.isArray(dbTemplate.variables) ? dbTemplate.variables : [],
      isActive: dbTemplate.isActive,
      usageCount: 0,
      tags: [],
      language: 'it'
    };
  }
}

// Singleton
export const whatsAppTemplateService = new WhatsAppTemplateService();
