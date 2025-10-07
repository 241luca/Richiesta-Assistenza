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
 * @version 5.2.1
 * @updated 2025-10-01
 * @author Sistema Richiesta Assistenza
 */

import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
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
   * @returns {Promise<Object>} Preventivo creato con items
   * @throws {AppError} Se richiesta non trovata (404)
   * 
   * @example
   * const quote = await quoteService.createQuote({
   *   title: 'Preventivo Riparazione',
   *   requestId: 'req-123',
   *   professionalId: 'prof-456',
   *   items: [{ description: 'Servizio', quantity: 1, unitPrice: 100 }]
   * });
   */
  async createQuote(input: CreateQuoteInput) {
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
      let depositAmount = null;
      if (input.requiresDeposit) {
        depositAmount = await this.calculateDeposit(
          calculations.totalAmount,
          request.categoryId,
          request.subcategoryId
        );
        logger.info(`[QuoteService] Deposit calculated: ${depositAmount}`);
      }

      // Transazione: crea preventivo + items + revisione
      const quote = await prisma.$transaction(async (tx) => {
        const quoteId = uuidv4();
        
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
            customFields: {
              subtotal: calculations.subtotal,
              taxAmount: calculations.taxAmount,
              discountAmount: calculations.discountAmount,
              totalAmount: calculations.totalAmount,
              depositAmount: depositAmount,
              calculationDetails: calculations
            }
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
            recipientId: input.professionalId,
            version: 1,
            changes: {
              action: 'created',
              quote: newQuote,
              items: items,
              calculations: calculations
            },
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

      // Return PURE DATA (NO ResponseFormatter!)
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
   * @param {string} recipientId - ID destinatario (per audit)
   * @returns {Promise<Object>} Preventivo aggiornato
   * @throws {AppError} Se preventivo non trovato o non modificabile
   * 
   * @example
   * const updated = await quoteService.updateQuote('quote-123', {
   *   title: 'Preventivo Aggiornato',
   *   items: [...]
   * }, 'prof-456');
   */
  async updateQuote(quoteId: string, input: UpdateQuoteInput, recipientId: string) {
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
            customFields: {
              subtotal: calculations.subtotal,
              taxAmount: calculations.taxAmount,
              discountAmount: calculations.discountAmount,
              totalAmount: calculations.totalAmount,
              depositAmount: existingQuote.depositAmount,
              calculationDetails: calculations,
              lastUpdatedBy: existingQuote.professionalId,
              lastUpdatedAt: new Date()
            }
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
            recipientId: existingQuote.professionalId,
            version: newVersion,
            changes: {
              action: 'updated',
              before: existingQuote,
              after: quote,
              items: input.items ? items : undefined,
              calculations: calculations
            },
            reason: input.updateReason || 'Aggiornamento preventivo'
          }
        });

        return quote;
      });

      logger.info(`[QuoteService] Quote updated successfully: ${quoteId} v${updatedQuote.version}`);

      // Return PURE DATA
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
   * @returns {Promise<Object>} Preventivo accettato
   * @throws {AppError} Se preventivo non trovato, non autorizzato o non in stato PENDING
   * 
   * @example
   * const accepted = await quoteService.acceptQuote('quote-123', 'client-456');
   */
  async acceptQuote(quoteId: string, clientId: string) {
    try {
      logger.info(`[QuoteService] Accepting quote: ${quoteId} by client: ${clientId}`);

      // Verifica quote e autorizzazione
      const quote = await prisma.quote.findUnique({
        where: { id: quoteId },
        include: { 
          assistanceRequest: { include: { client: true } },
          user: true
        }
      });

      if (!quote) {
        throw new AppError('Quote not found', 404);
      }

      if (quote.assistanceRequest.clientId !== clientId) {
        throw new AppError('Unauthorized', 403);
      }

      if (quote.status !== 'PENDING') {
        throw new AppError('Quote is not in pending status', 400);
      }

      // Transazione accettazione
      const updatedQuote = await prisma.$transaction(async (tx) => {
        // Accetta questo preventivo
        const accepted = await tx.quote.update({
          where: { id: quoteId },
          data: {
            status: 'ACCEPTED',
            isSelected: true,
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
        await notificationService.sendToUser({
          userId: quote.professionalId,
          type: 'QUOTE_ACCEPTED',
          title: 'Preventivo Accettato',
          message: `Il tuo preventivo per "${quote.assistanceRequest.title}" è stato accettato!`,
          priority: 'high',
          data: {
            quoteId: quote.id,
            requestId: quote.requestId,
            amount: quote.amount,
            clientName: quote.assistanceRequest.client?.fullName || 'Cliente'
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
   * @returns {Promise<Object>} Preventivo rifiutato
   * @throws {AppError} Se preventivo non trovato o non autorizzato
   * 
   * @example
   * const rejected = await quoteService.rejectQuote(
   *   'quote-123', 
   *   'client-456', 
   *   'Prezzo troppo alto'
   * );
   */
  async rejectQuote(quoteId: string, clientId: string, reason?: string) {
    try {
      logger.info(`[QuoteService] Rejecting quote: ${quoteId} by client: ${clientId}`, { reason });

      // Verifica e autorizzazione
      const quote = await prisma.quote.findUnique({
        where: { id: quoteId },
        include: { 
          assistanceRequest: { include: { client: true } }
        }
      });

      if (!quote) {
        throw new AppError('Quote not found', 404);
      }

      if (quote.assistanceRequest.clientId !== clientId) {
        throw new AppError('Unauthorized', 403);
      }

      if (quote.status !== 'PENDING') {
        throw new AppError('Quote is not in pending status', 400);
      }

      // Rifiuta preventivo
      const updatedQuote = await prisma.quote.update({
        where: { id: quoteId },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          metadata: {
            ...((quote.metadata as any) || {}),
            rejectionReason: reason
          }
        }
      });

      logger.info(`[QuoteService] Quote rejected successfully: ${quoteId}`);

      // Notifica professionista
      try {
        await notificationService.sendToUser({
          userId: quote.professionalId,
          type: 'QUOTE_REJECTED',
          title: 'Preventivo Rifiutato',
          message: `Il tuo preventivo per "${quote.assistanceRequest.title}" è stato rifiutato${reason ? `. Motivo: ${reason}` : ''}`,
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
   * @returns {Promise<Array>} Lista revisioni ordinate per versione
   * @throws {Error} Se query fallisce
   */
  async getQuoteVersions(quoteId: string) {
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
   * @returns {Promise<Object>} Preventivo creato
   * @throws {AppError} Se template o richiesta non trovati
   * 
   * @example
   * const quote = await quoteService.createFromTemplate(
   *   'template-123',
   *   'request-456',
   *   'prof-789'
   * );
   */
  async createFromTemplate(templateId: string, requestId: string, professionalId: string) {
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
      const templateData = template.template as any;
      const items = templateData.items || [];
      
      const quote = await this.createQuote({
        title: templateData.title || template.name,
        description: template.description || undefined,
        notes: templateData.notes,
        termsConditions: templateData.terms,
        requestId,
        professionalId,
        items: items.map((item: any) => ({
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
   * @returns {Promise<Object>} Template creato
   * @throws {AppError} Se preventivo non trovato
   * 
   * @example
   * const template = await quoteService.saveAsTemplate(
   *   'quote-123',
   *   'Template Riparazione Standard',
   *   'Template per riparazioni standard impianto'
   * );
   */
  async saveAsTemplate(quoteId: string, name: string, description?: string) {
    try {
      logger.info(`[QuoteService] Saving quote as template: ${quoteId}`, { name });

      const quote = await prisma.quote.findUnique({
        where: { id: quoteId },
        include: { 
          items: { orderBy: { order: 'asc' } },
          assistanceRequest: { include: { category: true, subcategory: true } }
        }
      });

      if (!quote) {
        throw new AppError('Quote not found', 404);
      }

      const template = await prisma.quoteTemplate.create({
        data: {
          id: uuidv4(),
          name,
          description,
          template: {
            title: quote.title,
            notes: quote.notes,
            terms: quote.terms,
            items: quote.items.map(item => ({
              description: item.description,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
              taxRate: Number(item.taxRate || 0.22),
              discount: Number(item.discount || 0),
              notes: item.notes
            }))
          },
          recipientId: quote.professionalId,
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
   * @returns {Promise<Array>} Lista templates
   * @throws {Error} Se query fallisce
   */
  async getTemplates(professionalId: string, categoryId?: string, subcategoryId?: string) {
    try {
      logger.info('[QuoteService] Fetching templates', { professionalId, categoryId, subcategoryId });

      const where: Prisma.QuoteTemplateWhereInput = {
        OR: [
          { isPublic: true },
          { recipientId: professionalId }
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
   * @returns {Promise<Object>} { quotes: Array, stats: Object }
   * @throws {AppError} Se non autorizzato
   * 
   * @example
   * const comparison = await quoteService.compareQuotes('req-123', 'client-456');
   * // { quotes: [...], stats: { count: 3, avgAmount: 1500, ... } }
   */
  async compareQuotes(requestId: string, clientId: string) {
    try {
      logger.info('[QuoteService] Comparing quotes', { requestId, clientId });

      // Verifica autorizzazione
      const request = await prisma.assistanceRequest.findUnique({
        where: { id: requestId }
      });

      if (!request || request.clientId !== clientId) {
        throw new AppError('Unauthorized', 403);
      }

      // Ottieni preventivi
      const quotes = await prisma.quote.findMany({
        where: { 
          requestId,
          status: { in: ['PENDING', 'ACCEPTED'] }
        },
        include: {
          items: { orderBy: { order: 'asc' } },
          user: {
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
      const comparison = quotes.map((quote) => ({
        ...quote,
        itemCount: quote.items ? quote.items.length : 0,
        _comparison: {
          hasDeposit: !!quote.depositAmount,
          isExpiring: quote.validUntil 
            ? new Date(quote.validUntil) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
            : false
        }
      }));

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

      // Return PURE DATA
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
   * @param {Array} items - Lista items preventivo
   * @returns {Object} { subtotal, taxAmount, discountAmount, totalAmount }
   */
  private calculateQuoteTotals(items: CreateQuoteItemInput[]) {
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
   * Helper: Calcola deposito basato su regole configurate
   * 
   * @private
   * @param {number} totalAmount - Importo totale preventivo
   * @param {string} categoryId - ID categoria
   * @param {string|null} subcategoryId - ID sottocategoria (opzionale)
   * @returns {Promise<number>} Importo deposito
   */
  private async calculateDeposit(
    totalAmount: number, 
    categoryId: string, 
    subcategoryId?: string | null
  ): Promise<number> {
    try {
      // 1. Cerca regola per sottocategoria
      if (subcategoryId) {
        const subcategoryRule = await prisma.depositRule.findFirst({
          where: {
            subcategoryId,
            isActive: true,
            OR: [
              { minQuoteAmount: { lte: totalAmount }, maxQuoteAmount: { gte: totalAmount } },
              { minQuoteAmount: { lte: totalAmount }, maxQuoteAmount: null },
              { minQuoteAmount: null, maxQuoteAmount: { gte: totalAmount } },
              { minQuoteAmount: null, maxQuoteAmount: null }
            ]
          },
          orderBy: { priority: 'desc' }
        });

        if (subcategoryRule) {
          return this._applyDepositRule(subcategoryRule, totalAmount);
        }
      }

      // 2. Cerca regola per categoria
      const categoryRule = await prisma.depositRule.findFirst({
        where: {
          categoryId,
          subcategoryId: null,
          isActive: true,
          OR: [
            { minQuoteAmount: { lte: totalAmount }, maxQuoteAmount: { gte: totalAmount } },
            { minQuoteAmount: { lte: totalAmount }, maxQuoteAmount: null },
            { minQuoteAmount: null, maxQuoteAmount: { gte: totalAmount } },
            { minQuoteAmount: null, maxQuoteAmount: null }
          ]
        },
        orderBy: { priority: 'desc' }
      });

      if (categoryRule) {
        return this._applyDepositRule(categoryRule, totalAmount);
      }

      // 3. Usa regola default
      const defaultRule = await prisma.depositRule.findFirst({
        where: {
          isDefault: true,
          isActive: true
        }
      });

      if (defaultRule) {
        return this._applyDepositRule(defaultRule, totalAmount);
      }

      // 4. Default fallback: 30%
      return totalAmount * 0.3;
      
    } catch (error) {
      logger.error('[QuoteService] Error calculating deposit, using default 30%:', error);
      return totalAmount * 0.3;
    }
  }

  /**
   * Helper: Applica una regola di deposito
   * 
   * @private
   * @param {Object} rule - Regola deposito
   * @param {number} totalAmount - Importo totale
   * @returns {number} Importo deposito calcolato
   */
  private _applyDepositRule(rule: any, totalAmount: number): number {
    switch (rule.depositType) {
      case 'FIXED':
        return Number(rule.fixedAmount) || 0;

      case 'PERCENTAGE':
        return totalAmount * (Number(rule.percentageAmount) / 100);

      case 'RANGES':
        const ranges = (rule.ranges as any[]) || [];
        for (const range of ranges) {
          if (totalAmount >= range.min && totalAmount <= range.max) {
            if (range.amount) {
              return range.amount;
            } else if (range.percentage) {
              return totalAmount * (range.percentage / 100);
            }
          }
        }
        break;
    }

    return 0;
  }

  /**
   * Helper: Invia notifica per nuovo preventivo
   * 
   * @private
   * @param {Object} quote - Preventivo creato
   * @param {Object} request - Richiesta associata
   */
  private async _sendQuoteNotification(quote: any, request: any) {
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
          amount: quote.amount,
          professionalName: quote.user?.fullName || 'Professionista'
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
