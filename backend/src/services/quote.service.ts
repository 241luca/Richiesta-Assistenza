/**
 * Quote Service
 * Gestione completa dei preventivi e loro ciclo di vita
 * 
 * Responsabilità:
 * - CRUD operazioni preventivi
 * - Calcolo automatico totali, IVA, sconti
 * - Gestione versioning preventivi
 * - Accettazione/Rifiuto preventivi
 * - Sistema template preventivi
 * - Calcolo depositi basato su regole
 * - Confronto preventivi
 * - Notifiche eventi preventivo
 * 
 * @module services/quote
 * @version 5.2.2
 * @updated 2025-10-09
 * @author Sistema Richiesta Assistenza
 * @fixed TypeScript errors - aligned with Prisma schema
 */

import { prisma } from '../config/database';
import { Prisma, Quote, QuoteRevision, QuoteTemplate, DepositRule } from '@prisma/client';
import { AppError } from '../utils/errors';
import { notificationService } from './notification.service';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

/**
 * Interface per creazione preventivo
 */
interface CreateQuoteInput {
  title: string;
  description?: string;
  validUntil?: Date;
  notes?: string;
  termsConditions?: string;
  internalNotes?: string;
  requiresDeposit?: boolean;
  requestId: string;
  professionalId: string;
  items: CreateQuoteItemInput[];
  templateId?: string;
}

/**
 * Interface per item preventivo
 */
interface CreateQuoteItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  discount?: number;
  itemType?: string;
  unit?: string;
  notes?: string;
}

/**
 * Interface per aggiornamento preventivo
 */
interface UpdateQuoteInput {
  title?: string;
  description?: string;
  validUntil?: Date;
  notes?: string;
  termsConditions?: string;
  internalNotes?: string;
  items?: CreateQuoteItemInput[];
  updateReason?: string;
}

/**
 * Interface per i totali del preventivo
 */
interface QuoteTotals {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
}

/**
 * Interface per custom fields quote
 */
interface QuoteCustomFields {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  depositAmount: number | null;
  calculationDetails: QuoteTotals;
  lastUpdatedBy?: string;
  lastUpdatedAt?: Date;
}

/**
 * Interface per template data
 */
interface QuoteTemplateData {
  title?: string;
  notes?: string | null;
  terms?: string | null;
  items?: Array<{
    description: string;
    quantity?: number;
    unitPrice?: number;
    taxRate?: number;
    discount?: number;
    notes?: string;
  }>;
}

/**
 * Quote Service Class
 * 
 * Gestisce il ciclo di vita completo dei preventivi:
 * creazione, versioning, accettazione/rifiuto, templates.
 */
class QuoteService {
  
  /**
   * Crea un nuovo preventivo con items e calcoli automatici
   * 
   * @param {CreateQuoteInput} input - Dati preventivo
   * @returns {Promise<Quote & { items: any[] }>} Preventivo creato con items
   * @throws {AppError} Se richiesta non trovata (404)
   */
  async createQuote(input: CreateQuoteInput): Promise<Quote & { items: any[] }> {
    try {
      logger.info('[QuoteService] Creating new quote', { 
        title: input.title,
        requestId: input.requestId,
        professionalId: input.professionalId
      });

      // Verifica esistenza richiesta
      const request = await prisma.assistanceRequest.findUnique({
        where: { id: input.requestId },
        include: { category: true, subcategory: true }
      });

      if (!request) {
        throw new AppError('Request not found', 404);
      }

      // Calcola totali
      const calculations = this.calculateQuoteTotals(input.items);
      logger.info('[QuoteService] Quote totals calculated', calculations);

      // Calcola deposito se richiesto
      let depositAmount: number | null = null;
      if (input.requiresDeposit) {
        depositAmount = await this.calculateDeposit(
          calculations.totalAmount,
          request.categoryId
        );
        logger.info(`[QuoteService] Deposit calculated: ${depositAmount}`);
      }

      // Transazione: crea preventivo + items + revisione
      const quote = await prisma.$transaction(async (tx) => {
        const quoteId = uuidv4();
        
        const customFields: QuoteCustomFields = {
          subtotal: calculations.subtotal,
          taxAmount: calculations.taxAmount,
          discountAmount: calculations.discountAmount,
          totalAmount: calculations.totalAmount,
          depositAmount: depositAmount,
          calculationDetails: calculations
        };
        
        // Crea preventivo
        const newQuote = await tx.quote.create({
          data: {
            id: quoteId,
            title: input.title,
            description: input.description,
            amount: calculations.totalAmount,
            validUntil: input.validUntil,
            notes: input.notes || null,
            terms: input.termsConditions || null,
            internalNotes: input.internalNotes || null,
            depositRequired: input.requiresDeposit || false,
            depositAmount: depositAmount,
            requestId: input.requestId,
            professionalId: input.professionalId,
            version: 1,
            updatedAt: new Date(),
            status: 'PENDING',
            customFields: customFields as any
          }
        });

        // Crea items
        const items = await Promise.all(
          input.items.map((item, index) =>
            tx.quoteItem.create({
              data: {
                id: uuidv4(),
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.quantity * item.unitPrice,
                taxRate: item.taxRate || 0.22,
                taxAmount: (item.quantity * item.unitPrice) * (item.taxRate || 0.22),
                discount: item.discount || 0,
                order: index + 1,
                quoteId: quoteId,
                notes: item.notes,
                metadata: {
                  itemType: item.itemType || 'service',
                  unit: item.unit || 'pz',
                  notes: item.notes || null
                }
              }
            })
          )
        );

        // Crea revisione iniziale
        await tx.quoteRevision.create({
          data: {
            id: uuidv4(),
            quoteId: quoteId,
            userId: input.professionalId, // ✅ CORRETTO: userId invece di recipientId
            version: 1,
            changes: {
              action: 'created',
              quote: {
                id: newQuote.id,
                title: newQuote.title,
                amount: Number(newQuote.amount)
              },
              itemsCount: items.length,
              totalAmount: calculations.totalAmount
            } as any,
            reason: 'Creazione preventivo iniziale'
          }
        });

        return { ...newQuote, items };
      });

      logger.info(`[QuoteService] Quote created successfully: ${quote.id}`);

      // Invia notifica (non-blocking)
      try {
        await this._sendQuoteNotification(quote, request);
      } catch (notificationError) {
        logger.error('[QuoteService] Error sending quote notification:', notificationError);
      }

      return quote;
      
    } catch (error) {
      logger.error('[QuoteService] Error creating quote:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        title: input.title,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Aggiorna un preventivo creando una nuova versione
   * 
   * @param {string} quoteId - ID preventivo
   * @param {UpdateQuoteInput} input - Dati da aggiornare
   * @param {string} userId - ID utente (per audit)
   * @returns {Promise<Quote>} Preventivo aggiornato
   * @throws {AppError} Se preventivo non trovato o non modificabile
   */
  async updateQuote(quoteId: string, input: UpdateQuoteInput, userId: string): Promise<Quote> {
    try {
      logger.info(`[QuoteService] Updating quote: ${quoteId}`);

      // Verifica esistenza e stato
      const existingQuote = await prisma.quote.findUnique({
        where: { id: quoteId },
        include: { items: true }
      });

      if (!existingQuote) {
        throw new AppError('Quote not found', 404);
      }

      if (existingQuote.status !== 'DRAFT' && existingQuote.status !== 'PENDING') {
        throw new AppError('Cannot update quote in current status', 400);
      }

      // Prepara items (nuovi o esistenti)
      const newItems = input.items || existingQuote.items.map(item => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        taxRate: Number(item.taxRate || 0.22),
        discount: Number(item.discount || 0),
        notes: item.notes || undefined
      }));

      // Calcola totali
      const calculations = this.calculateQuoteTotals(newItems);
      logger.info('[QuoteService] Updated totals calculated', calculations);

      // Transazione aggiornamento
      const updatedQuote = await prisma.$transaction(async (tx) => {
        const newVersion = existingQuote.version + 1;

        const customFields: QuoteCustomFields = {
          subtotal: calculations.subtotal,
          taxAmount: calculations.taxAmount,
          discountAmount: calculations.discountAmount,
          totalAmount: calculations.totalAmount,
          depositAmount: existingQuote.depositAmount ? Number(existingQuote.depositAmount) : null,
          calculationDetails: calculations,
          lastUpdatedBy: userId,
          lastUpdatedAt: new Date()
        };

        // Aggiorna preventivo
        const quote = await tx.quote.update({
          where: { id: quoteId },
          data: {
            title: input.title || existingQuote.title,
            description: input.description !== undefined ? input.description : existingQuote.description,
            amount: calculations.totalAmount,
            validUntil: input.validUntil || existingQuote.validUntil,
            notes: input.notes !== undefined ? input.notes : existingQuote.notes,
            terms: input.termsConditions !== undefined ? input.termsConditions : existingQuote.terms,
            internalNotes: input.internalNotes !== undefined ? input.internalNotes : existingQuote.internalNotes,
            version: newVersion,
            updatedAt: new Date(),
            customFields: customFields as any
          }
        });

        // Aggiorna items se forniti
        let items = existingQuote.items;
        if (input.items) {
          await tx.quoteItem.deleteMany({
            where: { quoteId: quoteId }
          });

          items = await Promise.all(
            newItems.map((item, index) => 
              tx.quoteItem.create({
                data: {
                  id: uuidv4(),
                  description: item.description,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  totalPrice: item.quantity * item.unitPrice,
                  taxRate: item.taxRate || 0.22,
                  taxAmount: (item.quantity * item.unitPrice) * (item.taxRate || 0.22),
                  discount: item.discount || 0,
                  order: index + 1,
                  notes: item.notes,
                  quoteId: quoteId,
                  metadata: {
                    itemType: 'service',
                    unit: 'pz'
                  }
                }
              })
            )
          );
        }

        // Salva revisione
        await tx.quoteRevision.create({
          data: {
            id: uuidv4(),
            quoteId: quoteId,
            userId: userId, // ✅ CORRETTO: userId invece di recipientId
            version: newVersion,
            changes: {
              action: 'updated',
              oldAmount: Number(existingQuote.amount),
              newAmount: Number(quote.amount),
              itemsUpdated: !!input.items,
              totalAmount: calculations.totalAmount
            } as any,
            reason: input.updateReason || 'Aggiornamento preventivo'
          }
        });

        return quote;
      });

      logger.info(`[QuoteService] Quote updated successfully: ${quoteId} v${updatedQuote.version}`);

      return updatedQuote;
      
    } catch (error) {
      logger.error('[QuoteService] Error updating quote:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        quoteId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Accetta un preventivo
   * 
   * @param {string} quoteId - ID preventivo
   * @param {string} clientId - ID cliente (per autorizzazione)
   * @returns {Promise<Quote>} Preventivo accettato
   * @throws {AppError} Se preventivo non trovato, non autorizzato o non in stato PENDING
   */
  async acceptQuote(quoteId: string, clientId: string): Promise<Quote> {
    try {
      logger.info(`[QuoteService] Accepting quote: ${quoteId} by client: ${clientId}`);

      // Verifica quote e autorizzazione - ✅ CORRETTO: usa 'request' invece di 'assistanceRequest'
      const quote = await prisma.quote.findUnique({
        where: { id: quoteId },
        include: { 
          request: { include: { client: true } }, // ✅ CORRETTO
          professional: true // ✅ CORRETTO
        }
      });

      if (!quote) {
        throw new AppError('Quote not found', 404);
      }

      if (quote.request.clientId !== clientId) {
        throw new AppError('Unauthorized', 403);
      }

      if (quote.status !== 'PENDING') {
        throw new AppError('Quote is not in pending status', 400);
      }

      // Transazione accettazione
      const updatedQuote = await prisma.$transaction(async (tx) => {
        // Accetta questo preventivo - ✅ RIMOSSO isSelected che non esiste
        const accepted = await tx.quote.update({
          where: { id: quoteId },
          data: {
            status: 'ACCEPTED',
            acceptedAt: new Date()
          }
        });

        // Rifiuta altri preventivi per stessa richiesta
        await tx.quote.updateMany({
          where: {
            requestId: quote.requestId,
            id: { not: quoteId },
            status: 'PENDING'
          },
          data: {
            status: 'REJECTED',
            rejectedAt: new Date()
          }
        });

        // Aggiorna richiesta
        await tx.assistanceRequest.update({
          where: { id: quote.requestId },
          data: {
            status: 'ASSIGNED',
            professionalId: quote.professionalId,
            assignedAt: new Date()
          }
        });

        return accepted;
      });

      logger.info(`[QuoteService] Quote accepted successfully: ${quoteId}`);

      // Notifica professionista
      try {
        const clientName = quote.request.client?.fullName || 'Cliente';
        
        await notificationService.sendToUser({
          userId: quote.professionalId,
          type: 'QUOTE_ACCEPTED',
          title: 'Preventivo Accettato',
          message: `Il tuo preventivo per "${quote.request.title}" è stato accettato!`,
          priority: 'high',
          data: {
            quoteId: quote.id,
            requestId: quote.requestId,
            amount: Number(quote.amount),
            clientName: clientName
          },
          channels: ['websocket', 'email']
        });
      } catch (notificationError) {
        logger.error('[QuoteService] Error sending acceptance notification:', notificationError);
      }

      // TODO: Se richiede deposito, crea payment intent Stripe
      if (quote.depositRequired && quote.depositAmount) {
        logger.info(`[QuoteService] Deposit required: ${quote.depositAmount} - TODO: Create Stripe Payment Intent`);
      }

      return updatedQuote;
      
    } catch (error) {
      logger.error('[QuoteService] Error accepting quote:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        quoteId,
        clientId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Rifiuta un preventivo
   * 
   * @param {string} quoteId - ID preventivo
   * @param {string} clientId - ID cliente (per autorizzazione)
   * @param {string} reason - Motivo rifiuto (opzionale)
   * @returns {Promise<Quote>} Preventivo rifiutato
   * @throws {AppError} Se preventivo non trovato o non autorizzato
   */
  async rejectQuote(quoteId: string, clientId: string, reason?: string): Promise<Quote> {
    try {
      logger.info(`[QuoteService] Rejecting quote: ${quoteId} by client: ${clientId}`, { reason });

      // Verifica e autorizzazione - ✅ CORRETTO: usa 'request' invece di 'assistanceRequest'
      const quote = await prisma.quote.findUnique({
        where: { id: quoteId },
        include: { 
          request: { include: { client: true } } // ✅ CORRETTO
        }
      });

      if (!quote) {
        throw new AppError('Quote not found', 404);
      }

      if (quote.request.clientId !== clientId) {
        throw new AppError('Unauthorized', 403);
      }

      if (quote.status !== 'PENDING') {
        throw new AppError('Quote is not in pending status', 400);
      }

      // Rifiuta preventivo - ✅ CORRETTO: usa rejectionReason invece di metadata
      const updatedQuote = await prisma.quote.update({
        where: { id: quoteId },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectionReason: reason || null // ✅ CORRETTO
        }
      });

      logger.info(`[QuoteService] Quote rejected successfully: ${quoteId}`);

      // Notifica professionista
      try {
        const reasonText = reason ? `. Motivo: ${reason}` : '';
        
        await notificationService.sendToUser({
          userId: quote.professionalId,
          type: 'QUOTE_REJECTED',
          title: 'Preventivo Rifiutato',
          message: `Il tuo preventivo per "${quote.request.title}" è stato rifiutato${reasonText}`,
          priority: 'normal',
          data: {
            quoteId: quote.id,
            requestId: quote.requestId,
            reason: reason
          },
          channels: ['websocket', 'email']
        });
      } catch (notificationError) {
        logger.error('[QuoteService] Error sending rejection notification:', notificationError);
      }

      return updatedQuote;
      
    } catch (error) {
      logger.error('[QuoteService] Error rejecting quote:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        quoteId,
        clientId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Ottieni le versioni (revisioni) di un preventivo
   * 
   * @param {string} quoteId - ID preventivo
   * @returns {Promise<QuoteRevision[]>} Lista revisioni ordinate per versione
   * @throws {Error} Se query fallisce
   */
  async getQuoteVersions(quoteId: string): Promise<QuoteRevision[]> {
    try {
      logger.info(`[QuoteService] Fetching versions for quote: ${quoteId}`);

      const versions = await prisma.quoteRevision.findMany({
        where: { quoteId },
        orderBy: { version: 'desc' }
      });

      logger.info(`[QuoteService] Found ${versions.length} versions for quote ${quoteId}`);
      return versions;
      
    } catch (error) {
      logger.error('[QuoteService] Error fetching quote versions:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        quoteId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Crea preventivo da template
   * 
   * @param {string} templateId - ID template
   * @param {string} requestId - ID richiesta
   * @param {string} professionalId - ID professionista
   * @returns {Promise<Quote & { items: any[] }>} Preventivo creato
   * @throws {AppError} Se template o richiesta non trovati
   */
  async createFromTemplate(
    templateId: string, 
    requestId: string, 
    professionalId: string
  ): Promise<Quote & { items: any[] }> {
    try {
      logger.info('[QuoteService] Creating quote from template', { templateId, requestId, professionalId });

      // Verifica template
      const template = await prisma.quoteTemplate.findUnique({
        where: { id: templateId }
      });

      if (!template) {
        throw new AppError('Template not found', 404);
      }

      // Verifica richiesta
      const request = await prisma.assistanceRequest.findUnique({
        where: { id: requestId }
      });

      if (!request) {
        throw new AppError('Request not found', 404);
      }

      // Prepara dati da template
      const templateData = template.template as QuoteTemplateData;
      const items = templateData.items || [];
      
      const quote = await this.createQuote({
        title: templateData.title || template.name,
        description: template.description || undefined,
        notes: templateData.notes || undefined,
        termsConditions: templateData.terms || undefined,
        requestId,
        professionalId,
        items: items.map((item) => ({
          description: item.description,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          taxRate: item.taxRate || 0.22,
          discount: item.discount || 0,
          notes: item.notes
        }))
      });

      logger.info(`[QuoteService] Quote created from template: ${quote.id}`);
      return quote;
      
    } catch (error) {
      logger.error('[QuoteService] Error creating quote from template:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        templateId,
        requestId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Salva un preventivo come template riutilizzabile
   * 
   * @param {string} quoteId - ID preventivo
   * @param {string} name - Nome template
   * @param {string} description - Descrizione template (opzionale)
   * @returns {Promise<QuoteTemplate>} Template creato
   * @throws {AppError} Se preventivo non trovato
   */
  async saveAsTemplate(quoteId: string, name: string, description?: string): Promise<QuoteTemplate> {
    try {
      logger.info(`[QuoteService] Saving quote as template: ${quoteId}`, { name });

      // ✅ CORRETTO: include items e usa 'request'
      const quote = await prisma.quote.findUnique({
        where: { id: quoteId },
        include: { 
          items: { orderBy: { order: 'asc' } },
          request: { include: { category: true, subcategory: true } }
        }
      });

      if (!quote) {
        throw new AppError('Quote not found', 404);
      }

      const templateData: QuoteTemplateData = {
        title: quote.title,
        notes: quote.notes,
        terms: quote.terms,
        items: quote.items.map(item => ({
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          taxRate: Number(item.taxRate || 0.22),
          discount: Number(item.discount || 0),
          notes: item.notes || undefined
        }))
      };

      const template = await prisma.quoteTemplate.create({
        data: {
          id: uuidv4(),
          name,
          description,
          template: templateData as any,
          user: { connect: { id: quote.professionalId } }, // ✅ CORRETTO: usa connect per la relazione
          isPublic: false
        }
      });

      logger.info(`[QuoteService] Template created: ${template.id}`);
      return template;
      
    } catch (error) {
      logger.error('[QuoteService] Error saving quote as template:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        quoteId,
        name,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Ottieni templates disponibili per un professionista
   * 
   * @param {string} professionalId - ID professionista
   * @param {string} categoryId - ID categoria (opzionale, per filtro)
   * @param {string} subcategoryId - ID sottocategoria (opzionale, per filtro)
   * @returns {Promise<QuoteTemplate[]>} Lista templates
   * @throws {Error} Se query fallisce
   */
  async getTemplates(
    professionalId: string, 
    categoryId?: string, 
    subcategoryId?: string
  ): Promise<QuoteTemplate[]> {
    try {
      logger.info('[QuoteService] Fetching templates', { professionalId, categoryId, subcategoryId });

      const where: Prisma.QuoteTemplateWhereInput = {
        OR: [
          { isPublic: true },
          { userId: professionalId } // ✅ CORRETTO
        ]
      };

      const templates = await prisma.quoteTemplate.findMany({
        where,
        orderBy: [
          { createdAt: 'desc' }
        ]
      });

      logger.info(`[QuoteService] Found ${templates.length} templates`);
      return templates;
      
    } catch (error) {
      logger.error('[QuoteService] Error fetching templates:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        professionalId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Confronta preventivi per una richiesta
   * 
   * @param {string} requestId - ID richiesta
   * @param {string} clientId - ID cliente (per autorizzazione)
   * @returns {Promise<{ quotes: any[]; stats: any }>} Confronto e statistiche
   * @throws {AppError} Se non autorizzato
   */
  async compareQuotes(requestId: string, clientId: string): Promise<{ quotes: any[]; stats: any }> {
    try {
      logger.info('[QuoteService] Comparing quotes', { requestId, clientId });

      // Verifica autorizzazione
      const request = await prisma.assistanceRequest.findUnique({
        where: { id: requestId }
      });

      if (!request || request.clientId !== clientId) {
        throw new AppError('Unauthorized', 403);
      }

      // Ottieni preventivi - ✅ CORRETTO: usa 'professional' invece di 'user'
      const quotes = await prisma.quote.findMany({
        where: { 
          requestId,
          status: { in: ['PENDING', 'ACCEPTED'] }
        },
        include: {
          items: { orderBy: { order: 'asc' } },
          professional: {
            select: {
              id: true,
              fullName: true,
              profession: true,
              hourlyRate: true
            }
          }
        },
        orderBy: { amount: 'asc' }
      });

      // Prepara dati comparazione
      const comparison = quotes.map((quote) => {
        const isExpiring = quote.validUntil 
          ? new Date(quote.validUntil) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
          : false;
          
        return {
          ...quote,
          itemCount: quote.items ? quote.items.length : 0,
          _comparison: {
            hasDeposit: !!quote.depositAmount,
            isExpiring
          }
        };
      });

      // Calcola statistiche
      const totalAmounts = comparison.map(q => Number(q.amount));
      const stats = {
        count: quotes.length,
        avgAmount: totalAmounts.length > 0 
          ? totalAmounts.reduce((sum, amount) => sum + amount, 0) / quotes.length 
          : 0,
        minAmount: quotes.length > 0 ? Math.min(...totalAmounts) : 0,
        maxAmount: quotes.length > 0 ? Math.max(...totalAmounts) : 0,
        priceRange: quotes.length > 0 ? Math.max(...totalAmounts) - Math.min(...totalAmounts) : 0,
        hasDeposits: comparison.filter(q => q._comparison.hasDeposit).length,
        expiringSoon: comparison.filter(q => q._comparison.isExpiring).length
      };

      logger.info('[QuoteService] Comparison completed', { 
        quoteCount: quotes.length,
        avgAmount: stats.avgAmount 
      });

      return {
        quotes: comparison,
        stats
      };
      
    } catch (error) {
      logger.error('[QuoteService] Error comparing quotes:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        clientId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Helper: Calcola totali del preventivo
   * 
   * @private
   * @param {CreateQuoteItemInput[]} items - Lista items preventivo
   * @returns {QuoteTotals} Totali calcolati
   */
  private calculateQuoteTotals(items: CreateQuoteItemInput[]): QuoteTotals {
    let subtotal = 0;
    let taxAmount = 0;
    let discountAmount = 0;

    items.forEach(item => {
      const itemTotal = item.quantity * item.unitPrice;
      const itemDiscount = item.discount || 0;
      const itemTax = (itemTotal - itemDiscount) * (item.taxRate || 0.22);

      subtotal += itemTotal;
      discountAmount += itemDiscount;
      taxAmount += itemTax;
    });

    const totalAmount = subtotal - discountAmount + taxAmount;

    return {
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount
    };
  }

  /**
   * Helper: Calcola deposito basato su percentuale default
   * 
   * ⚠️ NOTA: Sistema semplificato perché i campi necessari di DepositRule non esistono nello schema
   * 
   * @private
   * @param {number} totalAmount - Importo totale preventivo
   * @param {string} categoryId - ID categoria
   * @returns {Promise<number>} Importo deposito (default 30%)
   */
  private async calculateDeposit(
    totalAmount: number, 
    categoryId: string
  ): Promise<number> {
    try {
      // ✅ SISTEMA SEMPLIFICATO: Il modello DepositRule nello schema non ha i campi
      // necessari (minQuoteAmount, maxQuoteAmount, priority, etc.)
      // Per ora usiamo una logica semplice con regole base
      
      const rule = await prisma.depositRule.findFirst({
        where: {
          categoryId: categoryId,
          isActive: true
        }
      });

      if (rule) {
        // Usa la regola trovata
        if (rule.depositType === 'FIXED' && rule.fixedAmount) {
          return Number(rule.fixedAmount);
        } else if (rule.depositType === 'PERCENTAGE' && rule.percentageAmount) {
          return totalAmount * (rule.percentageAmount / 100);
        }
      }

      // Default: 30% come deposito standard
      logger.info('[QuoteService] Using default deposit calculation (30%)');
      return totalAmount * 0.3;
      
    } catch (error) {
      logger.error('[QuoteService] Error calculating deposit, using default 30%:', error);
      return totalAmount * 0.3;
    }
  }

  /**
   * Helper: Invia notifica per nuovo preventivo
   * 
   * @private
   * @param {any} quote - Preventivo creato
   * @param {any} request - Richiesta associata
   */
  private async _sendQuoteNotification(quote: any, request: any): Promise<void> {
    try {
      await notificationService.sendToUser({
        userId: request.clientId,
        type: 'NEW_QUOTE',
        title: 'Nuovo Preventivo Ricevuto',
        message: `Hai ricevuto un nuovo preventivo di €${quote.amount} per "${request.title}"`,
        priority: 'high',
        data: {
          quoteId: quote.id,
          requestId: request.id,
          amount: Number(quote.amount)
        },
        channels: ['websocket', 'email']
      });
    } catch (error) {
      logger.error('[QuoteService] Error sending quote notification:', error);
      // Non blocca il flusso
    }
  }
}

/**
 * Export Singleton Instance
 * Usa questa istanza in tutto il sistema
 */
export const quoteService = new QuoteService();
