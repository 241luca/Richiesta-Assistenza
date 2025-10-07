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
import { auditService } from './auditLog.service';

const notificationService = new NotificationService();

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
      
      // Salva nel database usando la tabella NotificationTemplate esistente
      const savedTemplate = await prisma.notificationTemplate.create({
        data: {
          name: template.name,
          subject: `WhatsApp: ${template.name}`,
          content: template.content,
          type: 'WHATSAPP',
          category: template.category,
          isActive: template.isActive !== false,
          variables: variables,
          metadata: {
            mediaUrl: template.mediaUrl,
            mediaType: template.mediaType,
            buttons: template.buttons,
            tags: template.tags,
            language: template.language || 'it'
          },
          createdBy: userId
        }
      });
      
      // Log nel sistema audit
      await auditService.log({
        action: 'WHATSAPP_TEMPLATE_CREATED',
        entityType: 'WhatsAppTemplate',
        entityId: savedTemplate.id,
        userId: userId,
        details: {
          templateName: template.name,
          category: template.category
        },
        success: true,
        category: 'BUSINESS'
      });
      
      logger.info(`✅ Template creato: ${savedTemplate.id}`);
      
      return this.mapToWhatsAppTemplate(savedTemplate);
      
    } catch (error: any) {
      logger.error('❌ Errore creazione template:', error);
      throw error;
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
      
      if (!existing || existing.type !== 'WHATSAPP') {
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
          content: updates.content || existing.content,
          category: updates.category || existing.category,
          isActive: updates.isActive !== undefined ? updates.isActive : existing.isActive,
          variables: variables,
          metadata: {
            ...(existing.metadata as any || {}),
            mediaUrl: updates.mediaUrl,
            mediaType: updates.mediaType,
            buttons: updates.buttons,
            tags: updates.tags,
            language: updates.language
          },
          updatedAt: new Date()
        }
      });
      
      // Log nel sistema audit
      await auditService.log({
        action: 'WHATSAPP_TEMPLATE_UPDATED',
        entityType: 'WhatsAppTemplate',
        entityId: templateId,
        userId: userId,
        oldValues: existing,
        newValues: updated,
        success: true,
        category: 'BUSINESS'
      });
      
      logger.info(`✅ Template aggiornato: ${templateId}`);
      
      return this.mapToWhatsAppTemplate(updated);
      
    } catch (error: any) {
      logger.error('❌ Errore aggiornamento template:', error);
      throw error;
    }
  }
  
  /**
   * Ottieni template per ID
   */
  async getTemplate(templateId: string): Promise<WhatsAppTemplate | null> {
    try {
      const template = await prisma.notificationTemplate.findUnique({
        where: { 
          id: templateId,
          type: 'WHATSAPP'
        }
      });
      
      if (!template) return null;
      
      return this.mapToWhatsAppTemplate(template);
      
    } catch (error: any) {
      logger.error('❌ Errore recupero template:', error);
      throw error;
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
      const where: any = {
        type: 'WHATSAPP'
      };
      
      if (filters?.category) {
        where.category = filters.category;
      }
      
      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive;
      }
      
      const templates = await prisma.notificationTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });
      
      // Filtra per tags se richiesto
      let filtered = templates;
      if (filters?.tags && filters.tags.length > 0) {
        filtered = templates.filter(t => {
          const metadata = t.metadata as any;
          const templateTags = metadata?.tags || [];
          return filters.tags!.some(tag => templateTags.includes(tag));
        });
      }
      
      return filtered.map(t => this.mapToWhatsAppTemplate(t));
      
    } catch (error: any) {
      logger.error('❌ Errore recupero templates:', error);
      throw error;
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
  ): Promise<any> {
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
      
      // Aggiorna contatore utilizzo template
      await this.incrementUsageCount(templateId);
      
      // Salva nel database
      await prisma.whatsAppMessage.create({
        data: {
          messageId: result.messageId || `msg_${Date.now()}`,
          phoneNumber: validatedNumber.formatted,
          message: content,
          direction: 'outgoing',
          status: 'SENT',
          timestamp: new Date(),
          type: 'template',
          metadata: {
            templateId: templateId,
            templateName: template.name,
            variables: variables
          }
        }
      });
      
      // Log nel sistema audit
      await auditService.log({
        action: 'WHATSAPP_TEMPLATE_SENT',
        entityType: 'WhatsAppTemplate',
        entityId: templateId,
        userId: userId || null,
        details: {
          to: validatedNumber.formatted,
          templateName: template.name,
          hasVariables: !!variables
        },
        success: true,
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
      
    } catch (error: any) {
      logger.error('❌ Errore invio template:', error);
      
      await auditService.log({
        action: 'WHATSAPP_TEMPLATE_SEND_FAILED',
        entityType: 'WhatsAppTemplate',
        entityId: templateId,
        userId: userId || null,
        errorMessage: error.message,
        success: false,
        category: 'BUSINESS'
      });
      
      throw error;
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
  ): Promise<any> {
    try {
      logger.info(`📤 Invio bulk template ${templateId} a ${recipients.length} destinatari`);
      
      const results = {
        sent: [] as string[],
        failed: [] as { number: string; error: string }[],
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
              
            } catch (error: any) {
              results.failed.push({
                number: recipient,
                error: error.message
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
      await auditService.log({
        action: 'WHATSAPP_TEMPLATE_BULK_SENT',
        entityType: 'WhatsAppTemplate',
        entityId: templateId,
        userId: userId || null,
        details: {
          templateName: template.name,
          totalRecipients: results.total,
          sent: results.sent.length,
          failed: results.failed.length
        },
        success: results.sent.length > 0,
        category: 'BUSINESS'
      });
      
      // Notifica admin se ci sono molti fallimenti
      if (results.failed.length > results.sent.length) {
        await this.notifyBulkSendIssue(template.name, results);
      }
      
      logger.info(`✅ Bulk send completato: ${results.sent.length}/${results.total} inviati`);
      
      return results;
      
    } catch (error: any) {
      logger.error('❌ Errore invio bulk template:', error);
      throw error;
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
          isActive: false,
          deletedAt: new Date()
        }
      });
      
      // Log nel sistema audit
      await auditService.log({
        action: 'WHATSAPP_TEMPLATE_DELETED',
        entityType: 'WhatsAppTemplate',
        entityId: templateId,
        userId: userId,
        details: {
          templateName: template.name
        },
        success: true,
        category: 'BUSINESS'
      });
      
      logger.info(`✅ Template eliminato: ${templateId}`);
      
    } catch (error: any) {
      logger.error('❌ Errore eliminazione template:', error);
      throw error;
    }
  }
  
  /**
   * Ottieni template più usati
   */
  async getMostUsedTemplates(limit: number = 10): Promise<WhatsAppTemplate[]> {
    try {
      const templates = await prisma.notificationTemplate.findMany({
        where: {
          type: 'WHATSAPP',
          isActive: true
        },
        orderBy: {
          usageCount: 'desc'
        },
        take: limit
      });
      
      return templates.map(t => this.mapToWhatsAppTemplate(t));
      
    } catch (error: any) {
      logger.error('❌ Errore recupero template più usati:', error);
      throw error;
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
      
    } catch (error: any) {
      logger.error('❌ Errore clonazione template:', error);
      throw error;
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
   * Incrementa contatore utilizzo
   */
  private async incrementUsageCount(templateId: string): Promise<void> {
    try {
      await prisma.notificationTemplate.update({
        where: { id: templateId },
        data: {
          usageCount: { increment: 1 }
        }
      });
    } catch (error) {
      logger.error('Errore incremento usage count:', error);
    }
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
    } catch (error) {
      logger.error('Errore invio media template:', error);
    }
  }
  
  /**
   * Notifica problemi invio bulk
   */
  private async notifyBulkSendIssue(templateName: string, results: any): Promise<void> {
    try {
      const admins = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'SUPER_ADMIN'] },
          isActive: true
        }
      });
      
      for (const admin of admins) {
        await notificationService.sendToUser(admin.id, {
          title: '⚠️ Problema invio bulk WhatsApp',
          message: `Template "${templateName}": ${results.failed.length}/${results.total} invii falliti`,
          type: 'whatsapp_bulk_issue',
          priority: 'medium',
          data: results
        });
      }
    } catch (error) {
      logger.error('Errore notifica bulk issue:', error);
    }
  }
  
  /**
   * Mappa da NotificationTemplate a WhatsAppTemplate
   */
  private mapToWhatsAppTemplate(dbTemplate: any): WhatsAppTemplate {
    const metadata = dbTemplate.metadata as any || {};
    
    return {
      id: dbTemplate.id,
      name: dbTemplate.name,
      category: dbTemplate.category || 'general',
      content: dbTemplate.content,
      variables: dbTemplate.variables || [],
      mediaUrl: metadata.mediaUrl,
      mediaType: metadata.mediaType,
      buttons: metadata.buttons,
      isActive: dbTemplate.isActive,
      usageCount: dbTemplate.usageCount || 0,
      tags: metadata.tags || [],
      language: metadata.language || 'it'
    };
  }
}

// Singleton
export const whatsAppTemplateService = new WhatsAppTemplateService();
