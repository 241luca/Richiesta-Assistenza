import { PrismaClient, Quote, items, QuoteStatus, Prisma } from '@prisma/client';
import { AppError } from '../utils/errors';
import { notificationService } from './notification.service';
// import { emailService } from './email.service'; // COMMENTED: Non esiste ancora
// import { pdfService } from './pdf.service'; // COMMENTED: Non esiste ancora
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
// AGGIUNTO: ResponseFormatter per formattazione consistente
import { formatQuote, formatQuoteList, formatitems } from '../utils/responseFormatter';

const prisma = new PrismaClient();

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
  items: CreateitemsInput[];
  templateId?: string;
}

interface CreateitemsInput {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  discount?: number;
  itemType?: string;
  unit?: string;
  notes?: string;
}

interface UpdateQuoteInput {
  title?: string;
  description?: string;
  validUntil?: Date;
  notes?: string;
  termsConditions?: string;
  internalNotes?: string;
  items?: CreateitemsInput[];
  updateReason?: string;
}

class QuoteService {
  /**
   * Crea un nuovo preventivo con items e calcoli automatici
   */
  async createQuote(input: CreateQuoteInput) {
    // Verifica che la richiesta esista
    const request = await prisma.assistanceRequest.findUnique({
      where: { id: input.requestId },
      include: { category: true, subcategory: true }
    });

    if (!request) {
      throw new AppError('Request not found', 404);
    }

    // Calcola totali
    const calculations = this.calculateQuoteTotals(input.items);

    // Calcola deposito se richiesto
    let depositAmount = null;
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
          description: input.description,
          amount: calculations.totalAmount, // NON dividere per 100
          validUntil: input.validUntil,
          notes: input.notes || null,
          terms: input.termsConditions || null, // Nel DB si chiama 'terms' non 'termsConditions'
          internalNotes: input.internalNotes || null,
          depositRequired: input.requiresDeposit || false,
          requestId: input.requestId,
          professionalId: input.professionalId,
          version: 1,
          updatedAt: new Date(),
          status: 'PENDING',
          // Salva tutti i dettagli nel campo customFields per poterli recuperare
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

      // Crea gli items del preventivo
      const items = await Promise.all(
        input.items.map((item, index) =>
          tx.quoteItem.create({
            data: {
              id: uuidv4(), // Genera UUID per ogni item
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
              taxRate: item.taxRate || 0.22,
              taxAmount: (item.quantity * item.unitPrice) * (item.taxRate || 0.22),
              discount: item.discount || 0,
              order: index + 1, // Usa 'order' invece di 'displayOrder'
              quoteId: quoteId, // Usa il quoteId generato
              // Salva dettagli extra in metadata se necessario
              metadata: {
                itemType: item.itemType || 'service',
                unit: item.unit || 'pz',
                notes: item.notes || null
              }
            }
          })
        )
      );

      // Salva la revisione iniziale per tracciare la creazione
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

    // Invia notifica al cliente
    await this.sendQuoteNotification(quote, request);

    // AGGIUNTO: Usa ResponseFormatter per output consistente
    return formatQuote(quote);
  }

  /**
   * Aggiorna un preventivo creando una nuova versione
   */
  async updateQuote(quoteId: string, input: UpdateQuoteInput, recipientId: string) {
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

    // Prepara i nuovi items se forniti
    const newItems = input.items || existingQuote.items.map(item => ({
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      taxRate: Number(item.taxRate || 0.22),
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
          amount: calculations.totalAmount, // NON dividere per 100
          validUntil: input.validUntil || existingQuote.validUntil,
          notes: input.notes !== undefined ? input.notes : existingQuote.notes,
          terms: input.termsConditions !== undefined ? input.termsConditions : existingQuote.terms,
          internalNotes: input.internalNotes !== undefined ? input.internalNotes : existingQuote.internalNotes,
          version: newVersion,
          updatedAt: new Date(),
          // Aggiorna anche customFields con i nuovi calcoli
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
                taxRate: item.taxRate || 0.22,
                taxAmount: (item.quantity * item.unitPrice) * (item.taxRate || 0.22),
                discount: item.discount || 0,
                order: index + 1, // Usa 'order' invece di 'displayOrder'
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

      // Salva la revisione per tracciare le modifiche
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

    // AGGIUNTO: Usa ResponseFormatter per output consistente
    return formatQuote(updatedQuote);
  }

  /**
   * Accetta un preventivo
   */
  async acceptQuote(quoteId: string, clientId: string) {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { 
        assistanceRequest: true,
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

    // Aggiorna il preventivo e la richiesta
    const updatedQuote = await prisma.$transaction(async (tx) => {
      // Marca questo preventivo come accettato
      const accepted = await tx.quote.update({
        where: { id: quoteId },
        data: {
          status: 'ACCEPTED',
          isSelected: true,
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
          status: 'REJECTED',
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

    // Invia notifiche - FIXED: usa userId
    await notificationService.sendToUser({
      userId: quote.professionalId, // FIXED: usa userId
      type: 'QUOTE_ACCEPTED',
      title: 'Preventivo Accettato',
      message: `Il tuo preventivo per "${quote.assistanceRequest.title}" è stato accettato!`,
      priority: 'high',
      data: {
        quoteId: quote.id,
        requestId: quote.requestId,
        amount: quote.amount,
        clientName: quote.assistanceRequest.client?.fullName || 'Cliente',
        actionUrl: `${process.env.FRONTEND_URL}/quotes/${quote.id}`
      },
      channels: ['websocket', 'email']
    });

    // Se richiede deposito, crea il payment intent
    if (quote.requiresDeposit && quote.depositAmount) {
      // TODO: Integrare con Stripe per creare payment intent
    }

    // AGGIUNTO: Usa ResponseFormatter per output consistente
    return formatQuote(updatedQuote);
  }

  /**
   * Rifiuta un preventivo
   */
  async rejectQuote(quoteId: string, clientId: string, reason?: string) {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { assistanceRequest: true }
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

    // Notifica il professionista - FIXED: usa userId
    await notificationService.sendToUser({
      userId: quote.professionalId, // FIXED: usa userId
      type: 'QUOTE_REJECTED',
      title: 'Preventivo Rifiutato',
      message: `Il tuo preventivo per "${quote.assistanceRequest.title}" è stato rifiutato${reason ? `. Motivo: ${reason}` : ''}`,
      priority: 'normal',
      data: {
        quoteId: quote.id,
        requestId: quote.requestId,
        reason: reason,
        actionUrl: `${process.env.FRONTEND_URL}/quotes/${quote.id}`
      },
      channels: ['websocket', 'email']
    });

    // AGGIUNTO: Usa ResponseFormatter per output consistente
    return formatQuote(updatedQuote);
  }

  /**
   * Ottieni le versioni di un preventivo
   */
  async getQuoteVersions(quoteId: string) {
    const versions = await prisma.quoteRevision.findMany({
      where: { quoteId },
      orderBy: { version: 'desc' }
    });

    return versions;
  }

  /**
   * Crea preventivo da template
   */
  async createFromTemplate(templateId: string, requestId: string, professionalId: string) {
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

    // Crea il preventivo dal template
    const templateData = template.template as any;
    const items = templateData.items || [];
    
    return this.createQuote({
      title: templateData.title || template.name,
      description: template.description,
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
  }

  /**
   * Salva un preventivo come template
   */
  async saveAsTemplate(quoteId: string, name: string, description?: string) {
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

    return template;
  }

  /**
   * Ottieni templates disponibili
   */
  async getTemplates(professionalId: string, categoryId?: string, subcategoryId?: string) {
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

    return templates;
  }

  /**
   * Helper: Calcola totali del preventivo
   */
  private calculateQuoteTotals(items: CreateitemsInput[]) {
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
   * Helper: Calcola deposito basato sulle regole
   */
  private async calculateDeposit(totalAmount: number, categoryId: string, subcategoryId?: string | null) {
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
    return totalAmount * 0.3;
  }

  /**
   * Helper: Applica una regola di deposito
   */
  private applyDepositRule(rule: any, totalAmount: number): number {
    switch (rule.depositType) {
      case 'FIXED':
        return Number(rule.fixedAmount) || 0;

      case 'PERCENTAGE':
        return totalAmount * (rule.percentageAmount / 100);

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
   * Helper: Invia notifica per nuovo preventivo - FIXED: usa userId
   */
  private async sendQuoteNotification(quote: any, request: any) {
    try {
      // FIXED: usa userId invece di recipientId
      await notificationService.sendToUser({
        userId: request.clientId, // FIXED: usa userId
        type: 'NEW_QUOTE',
        title: 'Nuovo Preventivo Ricevuto',
        message: `Hai ricevuto un nuovo preventivo di €${quote.amount} per "${request.title}"`,
        priority: 'high',
        data: {
          quoteId: quote.id,
          requestId: request.id,
          amount: quote.amount,
          professionalName: quote.User?.fullName || 'Professionista',
          actionUrl: `${process.env.FRONTEND_URL}/quotes/${quote.id}`
        },
        channels: ['websocket', 'email']
      });
    } catch (error) {
      logger.error('Error sending quote notification:', error);
    }
  }

  /**
   * Confronta preventivi per una richiesta
   */
  async compareQuotes(requestId: string, clientId: string) {
    // Verifica autorizzazione
    const request = await prisma.assistanceRequest.findUnique({
      where: { id: requestId }
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
        user: {
          select: {
            id: true,
            fullName: true,
            professionData: true,
            hourlyRate: true
          }
        }
      },
      orderBy: { amount: 'asc' }
    });

    // AGGIUNTO: Usa ResponseFormatter per formatting consistente
    const formattedQuotes = formatQuoteList(quotes);
    
    // Prepara dati per confronto con informazioni aggiuntive
    const comparison = formattedQuotes.map((quote: any) => ({
      ...quote,
      itemCount: quote.items ? quote.items.length : 0,
      // Aggiungi metadati utili per il confronto
      _comparison: {
        hasDeposit: !!quote.depositAmount,
        isExpiring: quote.validUntil ? new Date(quote.validUntil) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : false
      }
    }));

    // Calcola statistiche
    const totalAmounts = comparison.map(q => q.totalAmount);
    const stats = {
      count: quotes.length,
      avgAmount: totalAmounts.reduce((sum, amount) => sum + amount, 0) / quotes.length || 0,
      minAmount: quotes.length > 0 ? Math.min(...totalAmounts) : 0,
      maxAmount: quotes.length > 0 ? Math.max(...totalAmounts) : 0,
      priceRange: quotes.length > 0 ? Math.max(...totalAmounts) - Math.min(...totalAmounts) : 0,
      // AGGIUNTO: Statistiche aggiuntive
      hasDeposits: comparison.filter(q => q._comparison.hasDeposit).length,
      expiringSoon: comparison.filter(q => q._comparison.isExpiring).length
    };

    return {
      quotes: comparison,
      stats
    };
  }
}

export const quoteService = new QuoteService();
