/**
 * Quote Service - Sistema Preventivi
 * Data: 09/10/2025
 * Versione: 2.1.0 - TypeScript Strict Compliant (Full)
 * 
 * CHANGELOG v2.1.0:
 * - Rimossi TUTTI i cast 'any' pericolosi
 * - Aggiunte interfacce complete per template e metadata
 * - Type guards per validazione runtime
 * - Tipi espliciti per tutti i metodi
 * - Fix metodi notification service
 * - Validazione sicura per ranges e JSON data
 */

import { 
  PrismaClient, 
  Quote, 
  QuoteItem, 
  QuoteRevision,
  QuoteTemplate,
  DepositRule,
  AssistanceRequest,
  QuoteStatus, 
  Prisma 
} from '@prisma/client';
import { AppError } from '../utils/errors';
import { notificationService } from './notification.service';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { formatQuote, formatQuoteList } from '../utils/responseFormatter';

const prisma = new PrismaClient();

// ========================================
// TYPES & INTERFACES
// ========================================

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

interface CreateQuoteItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  discount?: number;
  itemType?: string;
  unit?: string;
  notes?: string | null;
}

interface UpdateQuoteInput {
  title?: string;
  description?: string | null;
  validUntil?: Date;
  notes?: string | null;
  termsConditions?: string;
  internalNotes?: string | null;
  items?: CreateQuoteItemInput[];
  updateReason?: string;
}

interface QuoteTotals {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
}

interface QuoteWithItems extends Quote {
  items: QuoteItem[];
}

interface AssistanceRequestWithRelations extends AssistanceRequest {
  category: { id: string; name: string } | null;
  subcategory: { id: string; name: string } | null;
  client?: { id: string; fullName: string | null } | null;
}

interface DepositRange {
  min: number;
  max: number;
  amount?: number;
  percentage?: number;
}

interface DepositRuleWithRanges extends DepositRule {
  ranges?: DepositRange[];
}

interface ComparisonMetadata {
  hasDeposit: boolean;
  isExpiring: boolean;
}

interface QuoteComparison {
  quotes: Array<FormattedQuote & { _comparison: ComparisonMetadata }>;
  stats: {
    count: number;
    avgAmount: number;
    minAmount: number;
    maxAmount: number;
    priceRange: number;
    hasDeposits: number;
    expiringSoon: number;
  };
}

// Interfaccia per template data
interface QuoteTemplateData {
  title?: string;
  notes?: string | null;
  terms?: string | null;
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
    discount?: number;
    notes?: string | null;
  }>;
}

// Interfaccia per formatted quote
interface FormattedQuote {
  id: string;
  title: string;
  amount: number;
  totalAmount?: number;
  items?: CreateQuoteItemInput[];
  depositAmount?: number | null;
  validUntil?: Date | null;
  status: QuoteStatus;
}

// Type guards
function isQuoteTemplateData(data: unknown): data is QuoteTemplateData {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    (obj.title === undefined || typeof obj.title === 'string') &&
    (obj.notes === undefined || typeof obj.notes === 'string' || obj.notes === null) &&
    (obj.terms === undefined || typeof obj.terms === 'string' || obj.terms === null) &&
    (obj.items === undefined || Array.isArray(obj.items))
  );
}

function isDepositRange(data: unknown): data is DepositRange {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.min === 'number' &&
    typeof obj.max === 'number' &&
    (obj.amount === undefined || typeof obj.amount === 'number') &&
    (obj.percentage === undefined || typeof obj.percentage === 'number')
  );
}

function isDepositRanges(data: unknown): data is DepositRange[] {
  return Array.isArray(data) && data.every(isDepositRange);
}

// ========================================
// SERVICE CLASS
// ========================================

class QuoteService {
  /**
   * Crea un nuovo preventivo con items e calcoli automatici
   */
  async createQuote(input: CreateQuoteInput): Promise<FormattedQuote> {
    // Verifica che la richiesta esista
    const request = await prisma.assistanceRequest.findUnique({
      where: { id: input.requestId },
      include: { 
        category: true, 
        subcategory: true,
        client: { select: { id: true, fullName: true } }
      }
    }) as AssistanceRequestWithRelations | null;

    if (!request) {
      throw new AppError('Request not found', 404);
    }

    // Calcola totali
    const calculations = this.calculateQuoteTotals(input.items);

    // Calcola deposito se richiesto
    let depositAmount: number | null = null;
    if (input.requiresDeposit) {
      depositAmount = await this.calculateDeposit(
        calculations.totalAmount,
        request.categoryId,
        request.subcategoryId
      );
    }

    // Crea il preventivo con gli items in una transazione
    const quote = await prisma.$transaction(async (tx) => {
      // Genera un UUID per il nuovo preventivo
      const quoteId = uuidv4();
      
      // Crea il preventivo
      const newQuote = await tx.quote.create({
        data: {
          id: quoteId,
          title: input.title,
          description: input.description || null,
          amount: calculations.totalAmount,
          validUntil: input.validUntil || null,
          notes: input.notes || null,
          terms: input.termsConditions || null,
          internalNotes: input.internalNotes || null,
          depositRequired: input.requiresDeposit || false,
          depositAmount: depositAmount,
          requestId: input.requestId,
          professionalId: input.professionalId,
          version: 1,
          updatedAt: new Date(),
          status: 'PENDING' as QuoteStatus,
          customFields: {
            subtotal: calculations.subtotal,
            taxAmount: calculations.taxAmount,
            discountAmount: calculations.discountAmount,
            totalAmount: calculations.totalAmount,
            depositAmount: depositAmount,
            calculationDetails: calculations
          } as Prisma.InputJsonValue
        }
      });

      // Crea gli items del preventivo
      const items = await Promise.all(
        input.items.map((item, index) =>
          tx.quoteItem.create({
            data: {
              id: uuidv4(),
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
              taxRate: item.taxRate || 22,
              taxAmount: (item.quantity * item.unitPrice) * ((item.taxRate || 22) / 100),
              discount: item.discount || 0,
              order: index + 1,
              notes: item.notes || null,
              quoteId: quoteId,
              metadata: {
                itemType: item.itemType || 'service',
                unit: item.unit || 'pz',
                notes: item.notes || null
              } as Prisma.InputJsonValue
            }
          })
        )
      );

      // Salva la revisione iniziale per tracciare la creazione
      await tx.quoteRevision.create({
        data: {
          id: uuidv4(),
          quoteId: quoteId,
          userId: input.professionalId,
          version: 1,
          changes: {
            action: 'created',
            quote: {
              id: newQuote.id,
              title: newQuote.title,
              amount: newQuote.amount
            },
            items: items.map(item => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice
            })),
            calculations: calculations
          } as Prisma.InputJsonValue,
          reason: 'Creazione preventivo iniziale'
        }
      });

      return { ...newQuote, items };
    });

    // Invia notifica al cliente
    await this.sendQuoteNotification(quote, request);

    return formatQuote(quote) as FormattedQuote;
  }

  /**
   * Aggiorna un preventivo creando una nuova versione
   */
  async updateQuote(
    quoteId: string, 
    input: UpdateQuoteInput, 
    userId: string
  ): Promise<FormattedQuote> {
    const existingQuote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { items: true }
    }) as QuoteWithItems | null;

    if (!existingQuote) {
      throw new AppError('Quote not found', 404);
    }

    if (existingQuote.status !== 'DRAFT' && existingQuote.status !== 'PENDING') {
      throw new AppError('Cannot update quote in current status', 400);
    }

    // Prepara i nuovi items se forniti
    const newItems: CreateQuoteItemInput[] = input.items || existingQuote.items.map(item => ({
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      taxRate: Number(item.taxRate || 22),
      discount: Number(item.discount || 0),
      notes: item.notes
    }));

    // Calcola i nuovi totali
    const calculations = this.calculateQuoteTotals(newItems);

    // Aggiorna il preventivo con nuova versione
    const updatedQuote = await prisma.$transaction(async (tx) => {
      // Incrementa la versione
      const newVersion = existingQuote.version + 1;

      // Aggiorna il preventivo
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
            lastUpdatedAt: new Date().toISOString()
          } as Prisma.InputJsonValue
        }
      });

      // Se ci sono nuovi items, elimina i vecchi e crea i nuovi
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
                taxRate: item.taxRate || 22,
                taxAmount: (item.quantity * item.unitPrice) * ((item.taxRate || 22) / 100),
                discount: item.discount || 0,
                order: index + 1,
                notes: item.notes || null,
                quoteId: quoteId,
                metadata: {
                  itemType: 'service',
                  unit: 'pz'
                } as Prisma.InputJsonValue
              }
            })
          )
        );
      }

      // Salva la revisione per tracciare le modifiche
      await tx.quoteRevision.create({
        data: {
          id: uuidv4(),
          quoteId: quoteId,
          userId: existingQuote.professionalId,
          version: newVersion,
          changes: {
            action: 'updated',
            before: {
              title: existingQuote.title,
              amount: existingQuote.amount
            },
            after: {
              title: quote.title,
              amount: quote.amount
            },
            items: input.items ? items.map(i => ({
              description: i.description,
              quantity: i.quantity,
              unitPrice: i.unitPrice
            })) : undefined,
            calculations: calculations
          } as Prisma.InputJsonValue,
          reason: input.updateReason || 'Aggiornamento preventivo'
        }
      });

      return quote;
    });

    return formatQuote(updatedQuote) as FormattedQuote;
  }

  /**
   * Accetta un preventivo
   */
  async acceptQuote(quoteId: string, clientId: string): Promise<FormattedQuote> {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { 
        request: {
          include: {
            client: { select: { id: true, fullName: true } }
          }
        },
        professional: { select: { id: true, fullName: true } }
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

    // Aggiorna il preventivo e la richiesta
    const updatedQuote = await prisma.$transaction(async (tx) => {
      // Marca questo preventivo come accettato
      const accepted = await tx.quote.update({
        where: { id: quoteId },
        data: {
          status: 'ACCEPTED' as QuoteStatus,
          acceptedAt: new Date()
        }
      });

      // Rifiuta automaticamente gli altri preventivi per la stessa richiesta
      await tx.quote.updateMany({
        where: {
          requestId: quote.requestId,
          id: { not: quoteId },
          status: 'PENDING'
        },
        data: {
          status: 'REJECTED' as QuoteStatus,
          rejectedAt: new Date()
        }
      });

      // Aggiorna lo stato della richiesta
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

    // Invia notifiche
    await notificationService.emitToUser(
      quote.professionalId,
      'QUOTE_ACCEPTED',
      {
        quoteId: quote.id,
        requestId: quote.requestId,
        amount: quote.amount,
        clientName: quote.request.client?.fullName || 'Cliente',
        title: quote.request.title,
        message: `Il tuo preventivo per "${quote.request.title}" è stato accettato!`
      }
    );

    // Se richiede deposito, crea il payment intent
    if (quote.depositRequired && quote.depositAmount) {
      // TODO: Integrare con Stripe per creare payment intent
    }

    return formatQuote(updatedQuote) as FormattedQuote;
  }

  /**
   * Rifiuta un preventivo
   */
  async rejectQuote(
    quoteId: string, 
    clientId: string, 
    reason?: string
  ): Promise<FormattedQuote> {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { 
        request: {
          select: { 
            id: true, 
            clientId: true, 
            title: true 
          }
        }
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

    const existingMetadata = quote.metadata as Prisma.JsonObject || {};
    
    const updatedQuote = await prisma.quote.update({
      where: { id: quoteId },
      data: {
        status: 'REJECTED' as QuoteStatus,
        rejectedAt: new Date(),
        metadata: {
          ...existingMetadata,
          rejectionReason: reason || null
        } as Prisma.InputJsonValue
      }
    });

    // Notifica il professionista
    await notificationService.emitToUser(
      quote.professionalId,
      'QUOTE_REJECTED',
      {
        quoteId: quote.id,
        requestId: quote.requestId,
        reason: reason,
        title: quote.request.title,
        message: `Il tuo preventivo per "${quote.request.title}" è stato rifiutato${reason ? `. Motivo: ${reason}` : ''}`
      }
    );

    return formatQuote(updatedQuote) as FormattedQuote;
  }

  /**
   * Ottieni le versioni di un preventivo
   */
  async getQuoteVersions(quoteId: string): Promise<QuoteRevision[]> {
    const versions = await prisma.quoteRevision.findMany({
      where: { quoteId },
      orderBy: { version: 'desc' }
    });

    return versions;
  }

  /**
   * Crea preventivo da template
   */
  async createFromTemplate(
    templateId: string, 
    requestId: string, 
    professionalId: string
  ): Promise<FormattedQuote> {
    const template = await prisma.quoteTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      throw new AppError('Template not found', 404);
    }

    const request = await prisma.assistanceRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      throw new AppError('Request not found', 404);
    }

    // ✅ Validazione tipo sicura per template data
    const templateData = template.template;
    
    if (!isQuoteTemplateData(templateData)) {
      throw new AppError('Invalid template data format', 400);
    }
    
    const items = Array.isArray(templateData.items) ? templateData.items : [];
    
    return this.createQuote({
      title: templateData.title || template.name,
      description: template.description || undefined,
      notes: templateData.notes || undefined,
      termsConditions: templateData.terms || undefined,
      requestId,
      professionalId,
      items: items.map((item) => ({
        description: item.description || '',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        taxRate: item.taxRate || 22,
        discount: item.discount || 0,
        notes: item.notes || null
      }))
    });
  }

  /**
   * Salva un preventivo come template
   */
  async saveAsTemplate(
    quoteId: string, 
    name: string, 
    description?: string
  ): Promise<QuoteTemplate> {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { 
        items: { orderBy: { order: 'asc' } },
        request: { 
          include: { 
            category: { select: { id: true, name: true } }, 
            subcategory: { select: { id: true, name: true } } 
          } 
        }
      }
    });

    if (!quote) {
      throw new AppError('Quote not found', 404);
    }

    const template = await prisma.quoteTemplate.create({
      data: {
        id: uuidv4(),
        name,
        description: description || null,
        template: {
          title: quote.title,
          notes: quote.notes,
          terms: quote.terms,
          items: quote.items.map(item => ({
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            taxRate: Number(item.taxRate || 22),
            discount: Number(item.discount || 0),
            notes: item.notes
          }))
        } as Prisma.InputJsonValue,
        userId: quote.professionalId,
        isPublic: false
      }
    });

    return template;
  }

  /**
   * Ottieni templates disponibili
   */
  async getTemplates(
    professionalId: string, 
    categoryId?: string, 
    subcategoryId?: string
  ): Promise<QuoteTemplate[]> {
    const where: Prisma.QuoteTemplateWhereInput = {
      OR: [
        { isPublic: true },
        { userId: professionalId }
      ]
    };

    const templates = await prisma.quoteTemplate.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' }
      ]
    });

    return templates;
  }

  /**
   * Confronta preventivi per una richiesta
   */
  async compareQuotes(
    requestId: string, 
    clientId: string
  ): Promise<QuoteComparison> {
    // Verifica autorizzazione
    const request = await prisma.assistanceRequest.findUnique({
      where: { id: requestId },
      select: { id: true, clientId: true }
    });

    if (!request || request.clientId !== clientId) {
      throw new AppError('Unauthorized', 403);
    }

    // Ottieni tutti i preventivi
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
            professionId: true,
            hourlyRate: true
          }
        }
      },
      orderBy: { amount: 'asc' }
    });

    // Usa ResponseFormatter per formatting consistente
    const formattedQuotes = formatQuoteList(quotes);
    
    // Prepara dati per confronto con informazioni aggiuntive
    const comparison = (formattedQuotes as FormattedQuote[]).map((quote) => ({
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
    const totalAmounts = comparison.map(q => q.totalAmount || q.amount || 0);
    const stats = {
      count: quotes.length,
      avgAmount: totalAmounts.length > 0
        ? totalAmounts.reduce((sum, amount) => sum + amount, 0) / quotes.length
        : 0,
      minAmount: quotes.length > 0 ? Math.min(...totalAmounts) : 0,
      maxAmount: quotes.length > 0 ? Math.max(...totalAmounts) : 0,
      priceRange: quotes.length > 0 
        ? Math.max(...totalAmounts) - Math.min(...totalAmounts) 
        : 0,
      hasDeposits: comparison.filter(q => q._comparison.hasDeposit).length,
      expiringSoon: comparison.filter(q => q._comparison.isExpiring).length
    };

    return {
      quotes: comparison,
      stats
    };
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  /**
   * Helper: Calcola totali del preventivo
   */
  private calculateQuoteTotals(items: CreateQuoteItemInput[]): QuoteTotals {
    let subtotal = 0;
    let taxAmount = 0;
    let discountAmount = 0;

    items.forEach(item => {
      const itemTotal = item.quantity * item.unitPrice;
      const itemDiscount = item.discount || 0;
      const itemTax = (itemTotal - itemDiscount) * ((item.taxRate || 22) / 100);

      subtotal += itemTotal;
      discountAmount += itemDiscount;
      taxAmount += itemTax;
    });

    const totalAmount = subtotal - discountAmount + taxAmount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100
    };
  }

  /**
   * Helper: Calcola deposito basato sulle regole
   */
  private async calculateDeposit(
    totalAmount: number, 
    categoryId: string, 
    subcategoryId?: string | null
  ): Promise<number> {
    // Cerca prima una regola specifica per sottocategoria
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
        return this.applyDepositRule(subcategoryRule, totalAmount);
      }
    }

    // Cerca una regola per categoria
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
      return this.applyDepositRule(categoryRule, totalAmount);
    }

    // Usa regola di default
    const defaultRule = await prisma.depositRule.findFirst({
      where: {
        isDefault: true,
        isActive: true
      }
    });

    if (defaultRule) {
      return this.applyDepositRule(defaultRule, totalAmount);
    }

    // Default: 30% del totale
    return Math.round(totalAmount * 0.3 * 100) / 100;
  }

  /**
   * Helper: Applica una regola di deposito
   */
  private applyDepositRule(rule: DepositRule, totalAmount: number): number {
    switch (rule.depositType) {
      case 'FIXED':
        return Number(rule.fixedAmount) || 0;

      case 'PERCENTAGE':
        return Math.round(totalAmount * (Number(rule.percentageAmount) / 100) * 100) / 100;

      case 'RANGES': {
        // ✅ Validazione tipo sicura per ranges
        const rangesData = rule.rangeRules;
        
        if (!isDepositRanges(rangesData)) {
          logger.warn('Invalid ranges data in deposit rule');
          return 0;
        }

        for (const range of rangesData) {
          if (totalAmount >= range.min && totalAmount <= range.max) {
            if (range.amount) {
              return Number(range.amount);
            } else if (range.percentage) {
              return Math.round(totalAmount * (Number(range.percentage) / 100) * 100) / 100;
            }
          }
        }
        break;
      }
    }

    return 0;
  }

  /**
   * Helper: Invia notifica per nuovo preventivo
   */
  private async sendQuoteNotification(
    quote: QuoteWithItems, 
    request: AssistanceRequestWithRelations
  ): Promise<void> {
    try {
      await notificationService.emitToUser(
        request.clientId,
        'NEW_QUOTE',
        {
          quoteId: quote.id,
          requestId: request.id,
          amount: quote.amount,
          title: request.title,
          professionalName: 'Professionista',
          message: `Hai ricevuto un nuovo preventivo di €${quote.amount} per "${request.title}"`
        }
      );
    } catch (error) {
      logger.error('Error sending quote notification:', error);
    }
  }
}

export const quoteService = new QuoteService();
