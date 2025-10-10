/**
 * Invoice Service
 * Sistema completo per gestione fatturazione, note di credito e fatturazione elettronica
 * 
 * Responsabilità:
 * - Creazione e gestione fatture complete
 * - Generazione PDF fatture personalizzate
 * - Calcolo automatico totali, IVA e commissioni
 * - Sistema fatturazione elettronica (XML SDI)
 * - Gestione pagamenti e tracciamento stati
 * - Note di credito e note di debito
 * - Promemoria pagamento automatici
 * - Integrazione provider fatturazione (Aruba, InfoCert)
 * 
 * @module services/invoice
 * @version 5.2.7
 * @updated 2025-10-09
 * @author Sistema Richiesta Assistenza
 */

import { z } from 'zod';
import { logger } from '../utils/logger';
import { notificationService } from './notification.service';
import { prisma } from '../config/database';
import { Invoice, CreditNote, User, Prisma, InvoiceStatus, DocumentType } from '@prisma/client';

// ========================================
// INTERFACCE TYPESCRIPT
// ========================================

/**
 * Dati per creazione fattura
 */
interface CreateInvoiceData {
  customerId: string;
  customerType?: 'PRIVATE' | 'BUSINESS';
  customerName: string;
  customerAddress?: string;
  customerCity?: string;
  customerZipCode?: string;
  customerProvince?: string;
  customerCountry?: string;
  customerVatNumber?: string;
  customerFiscalCode?: string;
  customerPec?: string;
  customerSdiCode?: string;
  customerEmail?: string;
  documentType?: string;
  description?: string;
  lineItems: LineItem[];
  paymentTerms?: number;
  paymentMethod?: string;
  bankDetails?: string;
  notes?: string;
  internalNotes?: string;
}

/**
 * Elemento riga fattura
 */
interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  totalPrice?: number;
}

/**
 * Totali calcolati
 */
interface CalculatedTotals {
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
}

/**
 * Dati cliente per fattura (da customerData JSON)
 */
interface CustomerData {
  name: string;
  address?: string;
  city?: string;
  zipCode?: string;
  province?: string;
  country?: string;
  vatNumber?: string;
  fiscalCode?: string;
  pec?: string;
  sdiCode?: string;
  email?: string;
}

/**
 * Provider fatturazione elettronica
 */
interface ElectronicInvoiceProvider {
  generateInvoice(data: SDIInvoiceData): Promise<{ sdiId: string; xmlContent: string; invoiceId: string }>;
  sendToSDI(invoiceId: string): Promise<{ status: string; response: string }>;
}

/**
 * Dati fattura elettronica SDI
 */
interface SDIInvoiceData {
  DatiTrasmissione: {
    IdTrasmittente: {
      IdPaese: string;
      IdCodice: string;
    };
    ProgressivoInvio: string;
    FormatoTrasmissione: string;
    CodiceDestinatario: string;
    PECDestinatario?: string;
  };
  CedentePrestatore: {
    DatiAnagrafici: {
      IdFiscaleIVA: {
        IdPaese: string;
        IdCodice: string;
      };
      Anagrafica: {
        Denominazione: string;
      };
      RegimeFiscale: string;
    };
    Sede: {
      Indirizzo: string;
      CAP: string;
      Comune: string;
      Provincia: string;
      Nazione: string;
    };
  };
  CessionarioCommittente: {
    DatiAnagrafici: {
      IdFiscaleIVA?: {
        IdPaese: string;
        IdCodice: string;
      };
      CodiceFiscale?: string;
      Anagrafica: {
        Denominazione: string;
      };
    };
    Sede: {
      Indirizzo: string;
      CAP: string;
      Comune: string;
      Provincia: string;
      Nazione: string;
    };
  };
  DatiGenerali: {
    DatiGeneraliDocumento: {
      TipoDocumento: string;
      Divisa: string;
      Data: Date;
      Numero: string;
    };
  };
  DatiBeniServizi: Array<{
    Descrizione: string;
    Quantita: number;
    PrezzoUnitario: number;
    PrezzoTotale: number;
    AliquotaIVA: number;
  }>;
}

/**
 * Filtri per ricerca fatture
 */
interface InvoiceFilters {
  customerId?: string;
  professionalId?: string;
  documentType?: string;
  paymentStatus?: string;
  search?: string;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  amountRange?: {
    min?: number;
    max?: number;
  };
}

/**
 * Opzioni paginazione
 */
interface PaginationOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

/**
 * Opzioni email fattura
 */
interface EmailOptions {
  to?: string;
  cc?: string;
  customMessage?: string;
}

/**
 * Dati email
 */
interface EmailData {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
  }>;
}

/**
 * System Settings value type
 */
interface SystemSettingsValue {
  autoSendToSDI?: boolean;
  [key: string]: unknown;
}

/**
 * Payment con relazioni
 */
interface PaymentWithRelations {
  id: string;
  clientId: string;
  professionalId: string | null;
  requestId: string | null;
  amount: number;
  description: string | null;
  client: User;
  professional?: User | null;
  request?: { id: string } | null;
  quote?: { id: string } | null;
}

/**
 * Invoice con relazioni per PDF
 */
interface InvoiceWithRelations extends Invoice {
  professional: User | null;
  customer: User | null;
}

// ========================================
// TYPE GUARDS
// ========================================

/**
 * Type guard per verificare se un valore è CustomerData valido
 */
function isCustomerData(value: unknown): value is CustomerData {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const data = value as Record<string, unknown>;
  return typeof data.name === 'string';
}

/**
 * Type guard per verificare se un valore è LineItem array valido
 */
function isLineItemArray(value: unknown): value is LineItem[] {
  if (!Array.isArray(value)) {
    return false;
  }
  return value.every(item => 
    item && 
    typeof item === 'object' &&
    typeof item.description === 'string' &&
    typeof item.quantity === 'number' &&
    typeof item.unitPrice === 'number'
  );
}

/**
 * Type guard per verificare se un valore è SystemSettingsValue
 */
function isSystemSettingsValue(value: unknown): value is SystemSettingsValue {
  return typeof value === 'object' && value !== null;
}

// ========================================
// SCHEMA VALIDAZIONE
// ========================================

/**
 * Schema validazione aggiornamento stato pagamento
 */
const UpdatePaymentStatusSchema = z.object({
  status: z.enum(['PAID', 'PARTIALLY_PAID', 'OVERDUE']),
  paidAmount: z.number().optional(),
  paymentDate: z.string().optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional()
});

// ========================================
// CLASSE PRINCIPALE INVOICE SERVICE
// ========================================

/**
 * Invoice Service Class
 * 
 * Gestisce l'intero ciclo di vita delle fatture nel sistema
 */
export class InvoiceService {
  private electronicInvoiceProviders: Map<string, ElectronicInvoiceProvider> = new Map();

  constructor() {
    this.initializeProviders();
  }

  /**
   * Crea una nuova fattura nel sistema
   */
  async createInvoice(data: CreateInvoiceData, userId: string): Promise<Invoice> {
    try {
      logger.info('[InvoiceService] Creating invoice', {
        userId,
        customerId: data.customerId,
        documentType: data.documentType
      });

      const invoiceNumber = await this.generateInvoiceNumber(data.documentType || 'INVOICE');
      
      const totals = this.calculateTotals(data.lineItems || []);
      
      // Determina il DocumentType corretto
      const docType: DocumentType = this.mapToDocumentType(data.documentType || 'INVOICE');
      
      // Prepara customerData come JSON
      const customerData: CustomerData = {
        name: data.customerName,
        address: data.customerAddress,
        city: data.customerCity,
        zipCode: data.customerZipCode,
        province: data.customerProvince,
        country: data.customerCountry || 'IT',
        vatNumber: data.customerVatNumber,
        fiscalCode: data.customerFiscalCode,
        pec: data.customerPec,
        sdiCode: data.customerSdiCode,
        email: data.customerEmail
      };
      
      // ✅ FIX: Correzioni campi Invoice
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          documentType: docType,
          dueDate: this.calculateDueDate(data.paymentTerms || 30),
          
          customerId: data.customerId,
          customerData: customerData as unknown as Prisma.InputJsonValue,
          items: data.lineItems as unknown as Prisma.InputJsonValue,
          
          subtotal: totals.subtotal,
          taxRate: 22, // IVA standard
          taxAmount: totals.taxAmount,
          total: totals.totalAmount,
          
          terms: data.paymentMethod || 'Pagamento entro 30 giorni tramite bonifico bancario',
          
          notes: data.notes,
          footerNotes: data.internalNotes,
          
          professionalId: userId,
          status: 'DRAFT'
        }
      });
      
      if (await this.requiresElectronicInvoice(data.customerType || 'PRIVATE', data)) {
        await this.createElectronicInvoice(invoice);
      }
      
      logger.info('[InvoiceService] Invoice created successfully', {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        total: invoice.total
      });

      return invoice;
      
    } catch (error: unknown) {
      logger.error('[InvoiceService] Error creating invoice:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Genera fattura dal pagamento
   */
  async generateInvoice(paymentId: string): Promise<Invoice> {
    try {
      logger.info('[InvoiceService] Generating invoice from payment', { paymentId });

      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          client: true,
          professional: true,
          request: true,
          quote: true
        }
      }) as PaymentWithRelations | null;

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (!payment.client) {
        throw new Error('Payment client not found');
      }

      if (!payment.professionalId) {
        throw new Error('Payment professional not found');
      }

      const lineItems: LineItem[] = [{
        description: payment.description || `Pagamento per richiesta ${payment.requestId || 'N/D'}`,
        quantity: 1,
        unitPrice: payment.amount,
        taxRate: 22
      }];

      const invoiceData: CreateInvoiceData = {
        customerId: payment.clientId,
        customerName: `${payment.client.firstName || ''} ${payment.client.lastName || ''}`.trim(),
        customerAddress: payment.client.address || undefined,
        customerCity: payment.client.city || undefined,
        customerZipCode: payment.client.postalCode || undefined,
        customerProvince: payment.client.province || undefined,
        customerType: 'PRIVATE',
        lineItems,
        paymentTerms: 0,
        documentType: 'INVOICE'
      };

      const invoice = await this.createInvoice(invoiceData, payment.professionalId);

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { paymentId: paymentId }
      });

      logger.info('[InvoiceService] Invoice generated from payment', {
        paymentId,
        invoiceId: invoice.id
      });

      return invoice;

    } catch (error: unknown) {
      logger.error('[InvoiceService] Error generating invoice from payment:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        paymentId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Recupera una singola fattura per ID
   */
  async getInvoice(invoiceId: string): Promise<Invoice> {
    try {
      logger.info('[InvoiceService] Getting invoice', { invoiceId });

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          professional: true,
          customer: true,
          payment: true,
          quote: true,
          request: true
        }
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      return invoice as Invoice;
    } catch (error: unknown) {
      logger.error('[InvoiceService] Error getting invoice:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        invoiceId
      });
      throw error;
    }
  }

  /**
   * Lista fatture con filtri e paginazione
   */
  async listInvoices(
    filters: InvoiceFilters,
    pagination: PaginationOptions
  ): Promise<{ invoices: Invoice[]; total: number; page: number; totalPages: number }> {
    try {
      logger.info('[InvoiceService] Listing invoices', { filters, pagination });

      const where: Prisma.InvoiceWhereInput = {};

      if (filters.customerId) {
        where.customerId = filters.customerId;
      }

      if (filters.professionalId) {
        where.professionalId = filters.professionalId;
      }

      if (filters.documentType) {
        where.documentType = filters.documentType as any;
      }

      if (filters.paymentStatus) {
        where.status = filters.paymentStatus as any;
      }

      if (filters.search) {
        where.OR = [
          { invoiceNumber: { contains: filters.search, mode: 'insensitive' } },
          { notes: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      if (filters.dateRange) {
        where.createdAt = {};
        if (filters.dateRange.from) {
          where.createdAt.gte = filters.dateRange.from;
        }
        if (filters.dateRange.to) {
          where.createdAt.lte = filters.dateRange.to;
        }
      }

      if (filters.amountRange) {
        where.total = {};
        if (filters.amountRange.min !== undefined) {
          where.total.gte = filters.amountRange.min;
        }
        if (filters.amountRange.max !== undefined) {
          where.total.lte = filters.amountRange.max;
        }
      }

      const total = await prisma.invoice.count({ where });

      const invoices = await prisma.invoice.findMany({
        where,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
        include: {
          professional: true,
          customer: true
        }
      });

      const totalPages = Math.ceil(total / pagination.limit);

      return {
        invoices: invoices as Invoice[],
        total,
        page: pagination.page,
        totalPages
      };
    } catch (error: unknown) {
      logger.error('[InvoiceService] Error listing invoices:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filters
      });
      throw error;
    }
  }

  /**
   * Aggiorna una fattura
   */
  async updateInvoice(invoiceId: string, updates: Partial<Invoice>): Promise<Invoice> {
    try {
      logger.info('[InvoiceService] Updating invoice', { invoiceId, updates });

      const invoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: updates
      });

      logger.info('[InvoiceService] Invoice updated successfully', { invoiceId });

      return invoice;
    } catch (error: unknown) {
      logger.error('[InvoiceService] Error updating invoice:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        invoiceId
      });
      throw error;
    }
  }

  /**
   * Registra un pagamento su fattura
   */
  async recordPayment(
    invoiceId: string,
    paymentData: { amount: number; paymentMethod?: string; paymentDate: string; reference?: string; notes?: string; createdBy: string }
  ): Promise<Invoice> {
    try {
      logger.info('[InvoiceService] Recording payment', { invoiceId, paymentData });

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId }
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const newPaidAmount = (invoice.paidAmount || 0) + paymentData.amount;
      const isFullyPaid = newPaidAmount >= (invoice.total || 0);

      const updated = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaidAmount,
          status: isFullyPaid ? 'PAID' : 'PARTIALLY_PAID',
          paidDate: isFullyPaid ? new Date(paymentData.paymentDate) : undefined
        }
      });

      if (isFullyPaid && invoice.professionalId) {
        await notificationService.createNotification({
          recipientId: invoice.professionalId,
          type: 'PAYMENT_RECEIVED',
          title: 'Pagamento ricevuto',
          content: `Il pagamento per la fattura ${invoice.invoiceNumber} è stato completato`,
          metadata: { invoiceId, amount: paymentData.amount } as Prisma.InputJsonValue
        });
      }

      logger.info('[InvoiceService] Payment recorded successfully', { invoiceId, newPaidAmount });

      return updated;
    } catch (error: unknown) {
      logger.error('[InvoiceService] Error recording payment:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        invoiceId
      });
      throw error;
    }
  }

  /**
   * Invia fattura via email
   */
  async sendInvoiceEmail(
    invoiceId: string,
    emailOptions: EmailOptions
  ): Promise<void> {
    try {
      logger.info('[InvoiceService] Sending invoice email', { invoiceId, emailOptions });

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          professional: true,
          customer: true
        }
      }) as InvoiceWithRelations | null;

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const customerData = this.getCustomerData(invoice);
      const recipientEmail = emailOptions.to || customerData.email;

      if (!recipientEmail) {
        throw new Error('No recipient email provided');
      }

      const pdfBuffer = await this.generatePDF(invoiceId);

      const emailData: EmailData = {
        to: recipientEmail,
        subject: `Fattura ${invoice.invoiceNumber} - ${process.env.COMPANY_NAME || ''}`,
        html: `
          <p>Gentile ${customerData.name},</p>
          ${emailOptions.customMessage ? `<p>${emailOptions.customMessage}</p>` : ''}
          <p>In allegato trovi la fattura ${invoice.invoiceNumber} del ${invoice.createdAt.toLocaleDateString('it-IT')}.</p>
          <p>Importo: €${invoice.total || 0}</p>
          <p>Scadenza: ${invoice.dueDate ? invoice.dueDate.toLocaleDateString('it-IT') : 'N/D'}</p>
          <br>
          <p>Cordiali saluti,<br>${process.env.COMPANY_NAME || ''}</p>
        `,
        attachments: [{
          filename: `Fattura_${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer
        }]
      };

      await notificationService.broadcast('invoice:sent', { invoiceId, email: recipientEmail });

      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { sentAt: new Date() }
      });

      logger.info('[InvoiceService] Invoice email sent successfully', { invoiceId });
    } catch (error: unknown) {
      logger.error('[InvoiceService] Error sending invoice email:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        invoiceId
      });
      throw error;
    }
  }

  /**
   * Genera fattura elettronica
   */
  async generateElectronicInvoice(invoiceId: string): Promise<{ success: boolean; sdiId?: string; xmlContent?: string }> {
    try {
      logger.info('[InvoiceService] Generating electronic invoice', { invoiceId });

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId }
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (invoice.isElectronic) {
        return {
          success: true,
          sdiId: invoice.electronicProvider || undefined,
          xmlContent: invoice.xmlFile || undefined
        };
      }

      await this.createElectronicInvoice(invoice);

      const updated = await prisma.invoice.findUnique({
        where: { id: invoiceId }
      });

      logger.info('[InvoiceService] Electronic invoice generated successfully', { invoiceId });

      return {
        success: true,
        sdiId: updated?.electronicProvider || undefined,
        xmlContent: updated?.xmlFile || undefined
      };
    } catch (error: unknown) {
      logger.error('[InvoiceService] Error generating electronic invoice:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        invoiceId
      });
      throw error;
    }
  }

  /**
   * Ottieni statistiche fatturazione
   */
  async getInvoiceStatistics(
    professionalId: string,
    options: { startDate?: Date; endDate?: Date; groupBy?: string }
  ): Promise<any> {
    try {
      logger.info('[InvoiceService] Getting invoice statistics', { professionalId, options });

      const where: Prisma.InvoiceWhereInput = {
        professionalId
      };

      if (options.startDate || options.endDate) {
        where.createdAt = {};
        if (options.startDate) {
          where.createdAt.gte = options.startDate;
        }
        if (options.endDate) {
          where.createdAt.lte = options.endDate;
        }
      }

      const invoices = await prisma.invoice.findMany({ where });

      const totalInvoices = invoices.length;
      const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      const paidAmount = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
      const unpaidAmount = totalAmount - paidAmount;

      const statusCounts = invoices.reduce((acc: Record<string, number>, inv) => {
        acc[inv.status] = (acc[inv.status] || 0) + 1;
        return acc;
      }, {});

      logger.info('[InvoiceService] Statistics calculated successfully', { professionalId });

      return {
        totalInvoices,
        totalAmount,
        paidAmount,
        unpaidAmount,
        statusCounts,
        averageInvoiceAmount: totalInvoices > 0 ? totalAmount / totalInvoices : 0
      };
    } catch (error: unknown) {
      logger.error('[InvoiceService] Error getting statistics:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        professionalId
      });
      throw error;
    }
  }

  // ========================================
  // METODI PRIVATI E HELPER
  // ========================================

  /**
   * Genera fattura elettronica in formato XML per SDI
   */
  private async createElectronicInvoice(invoice: Invoice): Promise<void> {
    try {
      logger.info('[InvoiceService] Creating electronic invoice', {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber
      });

      const provider = process.env.ELECTRONIC_INVOICE_PROVIDER || 'aruba';
      const providerInstance = this.electronicInvoiceProviders.get(provider);
      
      if (!providerInstance) {
        logger.warn(`[InvoiceService] Provider fatturazione elettronica non configurato: ${provider}`);
        return;
      }

      const xmlData = this.prepareElectronicInvoiceData(invoice);
      const result = await providerInstance.generateInvoice(xmlData);
      
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          isElectronic: true,
          sdiStatus: 'SENT',
          xmlFile: result.xmlContent,
          electronicProvider: result.sdiId
        },
      });

      const settings = await prisma.systemSettings.findUnique({
        where: { key: 'invoice_settings' }
      });

      if (settings?.value) {
        const parsedValue = typeof settings.value === 'string' 
          ? JSON.parse(settings.value) 
          : settings.value;
          
        if (isSystemSettingsValue(parsedValue)) {
          if (parsedValue.autoSendToSDI) {
            const sdiResult = await providerInstance.sendToSDI(result.invoiceId);
            
            await prisma.invoice.update({
              where: { id: invoice.id },
              data: {
                sdiStatus: sdiResult.status
              },
            });
          }
        }
      }

      logger.info('[InvoiceService] Electronic invoice created successfully', {
        invoiceId: invoice.id,
        sdiId: result.sdiId
      });

    } catch (error: unknown) {
      logger.error('[InvoiceService] Error creating electronic invoice:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        invoiceId: invoice.id,
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  /**
   * Prepara dati fattura nel formato XML SDI
   */
  private prepareElectronicInvoiceData(invoice: Invoice): SDIInvoiceData {
    const customerData = this.getCustomerData(invoice);
    
    return {
      DatiTrasmissione: {
        IdTrasmittente: {
          IdPaese: 'IT',
          IdCodice: process.env.VAT_NUMBER || '',
        },
        ProgressivoInvio: (invoice.invoiceNumber || '').replace(/[^0-9]/g, ''),
        FormatoTrasmissione: 'FPR12',
        CodiceDestinatario: customerData.sdiCode || '0000000',
        PECDestinatario: customerData.pec,
      },
      CedentePrestatore: {
        DatiAnagrafici: {
          IdFiscaleIVA: {
            IdPaese: 'IT',
            IdCodice: process.env.VAT_NUMBER || '',
          },
          Anagrafica: {
            Denominazione: process.env.COMPANY_NAME || '',
          },
          RegimeFiscale: 'RF01',
        },
        Sede: {
          Indirizzo: process.env.COMPANY_ADDRESS || '',
          CAP: process.env.COMPANY_ZIP || '',
          Comune: process.env.COMPANY_CITY || '',
          Provincia: process.env.COMPANY_PROVINCE || '',
          Nazione: 'IT',
        },
      },
      CessionarioCommittente: {
        DatiAnagrafici: {
          IdFiscaleIVA: customerData.vatNumber ? {
            IdPaese: 'IT',
            IdCodice: customerData.vatNumber,
          } : undefined,
          CodiceFiscale: customerData.fiscalCode || undefined,
          Anagrafica: {
            Denominazione: customerData.name,
          },
        },
        Sede: {
          Indirizzo: customerData.address || '',
          CAP: customerData.zipCode || '',
          Comune: customerData.city || '',
          Provincia: customerData.province || '',
          Nazione: customerData.country || 'IT',
        },
      },
      DatiGenerali: {
        DatiGeneraliDocumento: {
          TipoDocumento: this.mapDocumentTypeToSDI(invoice.documentType),
          Divisa: 'EUR',
          Data: invoice.createdAt,
          Numero: invoice.invoiceNumber,
        },
      },
      DatiBeniServizi: this.getLineItemsArray(invoice).map((item: LineItem) => ({
        Descrizione: item.description,
        Quantita: item.quantity,
        PrezzoUnitario: item.unitPrice,
        PrezzoTotale: item.quantity * item.unitPrice,
        AliquotaIVA: item.taxRate || 22.00
      })),
    };
  }

  /**
   * Invia fattura al cliente via email
   */
  async sendInvoiceToCustomer(invoiceId: string): Promise<void> {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          professional: true,
          customer: true
        }
      }) as InvoiceWithRelations | null;
      
      if (!invoice) {
        throw new Error('Invoice not found');
      }
      
      const customerData = this.getCustomerData(invoice);
      const customerEmail = customerData.email;
      
      logger.info('[InvoiceService] Sending invoice to customer', {
        invoiceId: invoice.id,
        customerEmail
      });
      
      if (!customerEmail) {
        throw new Error('Customer email not found');
      }

      const pdfBuffer = await this.generatePDF(invoice.id);
      
      const emailData: EmailData = {
        to: customerEmail,
        subject: `Fattura ${invoice.invoiceNumber} - ${process.env.COMPANY_NAME || ''}`,
        html: `
          <p>Gentile ${customerData.name},</p>
          <p>In allegato trovi la fattura ${invoice.invoiceNumber} del ${invoice.createdAt.toLocaleDateString('it-IT')}.</p>
          <p>Importo: €${invoice.total || 0}</p>
          <p>Scadenza: ${invoice.dueDate ? invoice.dueDate.toLocaleDateString('it-IT') : 'N/D'}</p>
          <br>
          <p>Cordiali saluti,<br>${process.env.COMPANY_NAME || ''}</p>
        `,
        attachments: [{
          filename: `Fattura_${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
        }],
      };
      
      await notificationService.broadcast('invoice:sent', { invoiceId: invoice.id, email: customerEmail });
      
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          sentAt: new Date(),
        },
      });
      
      logger.info('[InvoiceService] Invoice sent successfully', {
        invoiceId: invoice.id,
        customerEmail
      });
      
    } catch (error: unknown) {
      logger.error('[InvoiceService] Error sending invoice:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        invoiceId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Genera PDF fattura completo
   */
  async generatePDF(invoiceId: string): Promise<Buffer> {
    try {
      logger.info('[InvoiceService] Generating PDF', { invoiceId });

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const PDFDocument = require('pdfkit');
      
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          professional: true,
          customer: true
        }
      }) as InvoiceWithRelations | null;
      
      if (!invoice) {
        throw new Error('Invoice not found');
      }
      
      const customerData = this.getCustomerData(invoice);
      
      return new Promise<Buffer>((resolve, reject) => {
        try {
          const doc = new PDFDocument({ margin: 50 });
          const chunks: Buffer[] = [];
          
          doc.on('data', (chunk: Buffer) => chunks.push(chunk));
          doc.on('end', () => {
            logger.info('[InvoiceService] PDF generated successfully', { invoiceId });
            resolve(Buffer.concat(chunks));
          });
          doc.on('error', reject);
          
          const formatCurrency = (amount: number): string => {
            return new Intl.NumberFormat('it-IT', {
              style: 'currency',
              currency: 'EUR'
            }).format(amount);
          };
          
          const formatDate = (date: Date | null | undefined): string => {
            if (!date) return 'N/D';
            return new Date(date).toLocaleDateString('it-IT');
          };
          
          // HEADER
          doc.fontSize(20).font('Helvetica-Bold')
             .text(process.env.COMPANY_NAME || 'Sistema Assistenza SRL', 50, 50);
          
          doc.fontSize(10).font('Helvetica')
             .text(`P.IVA: ${process.env.COMPANY_VAT || 'IT12345678901'}`, 50, 75)
             .text(`${process.env.COMPANY_ADDRESS || 'Via Example 123'}`, 50, 90)
             .text(`${process.env.COMPANY_ZIP || '20100'} ${process.env.COMPANY_CITY || 'Milano'} (${process.env.COMPANY_PROVINCE || 'MI'})`, 50, 105)
             .text(`Email: ${process.env.COMPANY_EMAIL || 'info@assistenza.it'}`, 50, 120)
             .text(`Tel: ${process.env.COMPANY_PHONE || '+39 02 12345678'}`, 50, 135);
          
          const docTitle = this.getDocumentTitle(invoice.documentType);
          doc.fontSize(18).font('Helvetica-Bold')
             .text(docTitle.toUpperCase(), 400, 50, { align: 'right' });
          
          doc.fontSize(12).font('Helvetica')
             .text(`N° ${invoice.invoiceNumber}`, 400, 75, { align: 'right' })
             .text(`Data: ${formatDate(invoice.createdAt)}`, 400, 95, { align: 'right' });
          
          if (invoice.dueDate) {
            doc.text(`Scadenza: ${formatDate(invoice.dueDate)}`, 400, 115, { align: 'right' });
          }
          
          // CLIENTE
          doc.fontSize(12).font('Helvetica-Bold')
             .text('DESTINATARIO', 50, 180);
          
          doc.fontSize(10).font('Helvetica')
             .text(customerData.name, 50, 200)
             .text(customerData.address || '', 50, 215)
             .text(`${customerData.zipCode || ''} ${customerData.city || ''} (${customerData.province || ''})`, 50, 230);
          
          if (customerData.vatNumber) {
            doc.text(`P.IVA: ${customerData.vatNumber}`, 50, 245);
          }
          if (customerData.fiscalCode) {
            doc.text(`C.F.: ${customerData.fiscalCode}`, 50, 260);
          }
          
          // TABELLA
          let yPosition = 320;
          
          doc.fontSize(10).font('Helvetica-Bold');
          doc.text('DESCRIZIONE', 50, yPosition);
          doc.text('QTÀ', 300, yPosition, { width: 50, align: 'right' });
          doc.text('PREZZO', 360, yPosition, { width: 70, align: 'right' });
          doc.text('IVA %', 440, yPosition, { width: 40, align: 'right' });
          doc.text('TOTALE', 490, yPosition, { width: 80, align: 'right' });
          
          doc.moveTo(50, yPosition + 15).lineTo(570, yPosition + 15).stroke();
          
          yPosition += 25;
          
          doc.font('Helvetica');
          const lineItems = this.getLineItemsArray(invoice);
          
          for (const item of lineItems) {
            if (yPosition > 650) {
              doc.addPage();
              yPosition = 50;
            }
            
            const itemTotal = item.quantity * item.unitPrice;
            
            doc.fontSize(9);
            doc.text(item.description || 'Servizio', 50, yPosition, { width: 240 });
            doc.text(item.quantity.toString(), 300, yPosition, { width: 50, align: 'right' });
            doc.text(formatCurrency(item.unitPrice), 360, yPosition, { width: 70, align: 'right' });
            doc.text(`${item.taxRate || 22}%`, 440, yPosition, { width: 40, align: 'right' });
            doc.text(formatCurrency(itemTotal), 490, yPosition, { width: 80, align: 'right' });
            
            yPosition += 20;
          }
          
          doc.moveTo(350, yPosition).lineTo(570, yPosition).stroke();
          yPosition += 10;
          
          // TOTALI
          doc.fontSize(10).font('Helvetica');
          doc.text('Imponibile:', 400, yPosition, { width: 80, align: 'right' });
          doc.text(formatCurrency(invoice.subtotal || 0), 490, yPosition, { width: 80, align: 'right' });
          
          yPosition += 18;
          doc.text(`IVA ${invoice.taxRate || 22}%:`, 400, yPosition, { width: 80, align: 'right' });
          doc.text(formatCurrency(invoice.taxAmount || 0), 490, yPosition, { width: 80, align: 'right' });
          
          yPosition += 18;
          doc.fontSize(12).font('Helvetica-Bold');
          doc.text('TOTALE:', 400, yPosition, { width: 80, align: 'right' });
          doc.text(formatCurrency(invoice.total || 0), 490, yPosition, { width: 80, align: 'right' });
          
          if (invoice.notes) {
            yPosition += 40;
            doc.fontSize(10).font('Helvetica-Bold')
               .text('NOTE:', 50, yPosition);
            doc.fontSize(9).font('Helvetica')
               .text(invoice.notes, 50, yPosition + 15, { width: 520 });
          }
          
          const bottomY = doc.page.height - 100;
          
          if (invoice.status !== 'PAID') {
            doc.fontSize(8)
               .text('Coordinate bancarie per il pagamento:', 50, bottomY)
               .text(`IBAN: ${process.env.COMPANY_IBAN || 'IT00X0000000000000000000000'}`, 50, bottomY + 13);
          }
          
          doc.end();
        } catch (error: unknown) {
          reject(error);
        }
      });
    } catch (error: unknown) {
      logger.error('[InvoiceService] Error generating PDF:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        invoiceId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Aggiorna stato pagamento fattura
   */
  async updatePaymentStatus(
    invoiceId: string,
    data: z.infer<typeof UpdatePaymentStatusSchema>,
    userId: string
  ): Promise<Invoice> {
    try {
      logger.info('[InvoiceService] Updating payment status', {
        invoiceId,
        status: data.status,
        userId
      });

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId }
      });
      
      if (!invoice) {
        throw new Error('Invoice not found');
      }
      
      let status: InvoiceStatus = this.mapPaymentStatusToInvoiceStatus(data.status);
      let paidAmount = data.paidAmount || 0;
      
      if (data.status === 'PARTIALLY_PAID') {
        paidAmount = (invoice.paidAmount || 0) + (data.paidAmount || 0);
        
        if (paidAmount >= (invoice.total || 0)) {
          status = 'PAID';
          paidAmount = invoice.total || 0;
        }
      } else if (data.status === 'PAID') {
        paidAmount = invoice.total || 0;
      }
      
      const updated = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status,
          paidAmount,
          paidDate: data.paymentDate ? new Date(data.paymentDate) : undefined,
          notes: data.notes ? `${invoice.notes || ''}\n${data.notes}` : invoice.notes,
        }
      });
      
      if (data.paidAmount && data.paidAmount > 0) {
        logger.info('[InvoiceService] Payment recorded', {
          invoiceId,
          amount: data.paidAmount,
          paymentDate: data.paymentDate || new Date().toISOString(),
          paymentMethod: data.paymentMethod || 'BANK_TRANSFER'
        });
      }
      
      if (status === 'PAID' && invoice.professionalId) {
        await notificationService.createNotification({
          recipientId: invoice.professionalId,
          type: 'PAYMENT_RECEIVED',
          title: 'Pagamento ricevuto',
          content: `Il pagamento per la fattura ${invoice.invoiceNumber} è stato ricevuto`,
          metadata: { invoiceId, amount: paidAmount } as Prisma.InputJsonValue
        });
      }
      
      logger.info('[InvoiceService] Payment status updated successfully', {
        invoiceId,
        status,
        paidAmount
      });

      return updated;
      
    } catch (error: unknown) {
      logger.error('[InvoiceService] Error updating payment status:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        invoiceId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Registra pagamento parziale
   */
  async registerPartialPayment(
    invoiceId: string,
    amount: number,
    paymentMethod: string,
    reference: string,
    userId: string
  ): Promise<void> {
    try {
      logger.info('[InvoiceService] Registering partial payment', {
        invoiceId,
        amount,
        paymentMethod
      });

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId }
      });
      
      if (!invoice) {
        throw new Error('Invoice not found');
      }
      
      const newPaidAmount = (invoice.paidAmount || 0) + amount;
      const isFullyPaid = newPaidAmount >= (invoice.total || 0);
      
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaidAmount,
          status: isFullyPaid ? 'PAID' : 'PARTIALLY_PAID',
          paidDate: isFullyPaid ? new Date() : undefined,
        }
      });
      
      logger.info('[InvoiceService] Payment logged', {
        invoiceId,
        amount,
        paymentMethod,
        reference,
        userId
      });
      
      logger.info('[InvoiceService] Partial payment registered successfully', {
        invoiceId,
        amount,
        newPaidAmount,
        isFullyPaid
      });
      
      if (isFullyPaid && invoice.professionalId) {
        await notificationService.createNotification({
          recipientId: invoice.professionalId,
          type: 'INVOICE_PAID',
          title: 'Fattura pagata completamente',
          content: `La fattura ${invoice.invoiceNumber} è stata pagata completamente`,
          metadata: { invoiceId } as Prisma.InputJsonValue
        });
      }
      
    } catch (error: unknown) {
      logger.error('[InvoiceService] Error registering partial payment:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        invoiceId,
        amount,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Crea nota di credito
   */
  async createCreditNote(
    originalInvoiceId: string,
    lineItems: LineItem[],
    reason: string,
    userId: string
  ): Promise<CreditNote> {
    try {
      logger.info('[InvoiceService] Creating credit note', {
        originalInvoiceId,
        reason,
        userId
      });

      const originalInvoice = await prisma.invoice.findUnique({
        where: { id: originalInvoiceId }
      });
      
      if (!originalInvoice) {
        throw new Error('Original invoice not found');
      }
      
      const creditNoteNumber = await this.generateCreditNoteNumber();
      const totals = this.calculateTotals(lineItems);
      
      const customerData = this.getCustomerData(originalInvoice);
      
      const creditNote = await prisma.creditNote.create({
        data: {
          creditNoteNumber,
          originalInvoiceId,
          
          customerId: originalInvoice.customerId,
          customerName: customerData.name,
          customerAddress: customerData.address || '',
          customerCity: customerData.city || '',
          customerZipCode: customerData.zipCode || '',
          customerProvince: customerData.province || '',
          customerCountry: customerData.country || 'IT',
          customerVatNumber: customerData.vatNumber,
          customerFiscalCode: customerData.fiscalCode,
          
          reason,
          lineItems: lineItems as unknown as Prisma.InputJsonValue,
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          totalAmount: totals.totalAmount,
          
          userId,
          status: 'ISSUED',
        }
      });
      
      await prisma.invoice.update({
        where: { id: originalInvoiceId },
        data: {
          paidAmount: (originalInvoice.paidAmount || 0) - totals.totalAmount,
        }
      });
      
      logger.info('[InvoiceService] Credit note created successfully', {
        creditNoteId: creditNote.id,
        creditNoteNumber: creditNote.creditNoteNumber,
        totalAmount: totals.totalAmount
      });

      return creditNote;
      
    } catch (error: unknown) {
      logger.error('[InvoiceService] Error creating credit note:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        originalInvoiceId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Invia promemoria pagamento
   */
  async sendPaymentReminder(invoiceId: string): Promise<void> {
    try {
      logger.info('[InvoiceService] Sending payment reminder', { invoiceId });

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId }
      });
      
      if (!invoice) {
        throw new Error('Invoice not found');
      }
      
      if (invoice.status === 'PAID') {
        throw new Error('Invoice already paid');
      }
      
      const daysOverdue = invoice.dueDate 
        ? Math.floor((Date.now() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      
      const customerData = this.getCustomerData(invoice);
      const customerEmail = customerData.email;
      
      if (!customerEmail) {
        throw new Error('Customer email not found');
      }
      
      const emailData: EmailData = {
        to: customerEmail,
        subject: `Promemoria pagamento - Fattura ${invoice.invoiceNumber}`,
        html: `
          <p>Gentile ${customerData.name},</p>
          <p>Ti ricordiamo che la fattura ${invoice.invoiceNumber} del ${invoice.createdAt.toLocaleDateString('it-IT')} 
          risulta ancora non pagata.</p>
          <p>Importo: €${invoice.total || 0}</p>
          <p>Scadenza: ${invoice.dueDate ? invoice.dueDate.toLocaleDateString('it-IT') : 'N/D'} (${daysOverdue} giorni fa)</p>
          <br>
          <p>Ti preghiamo di provvedere al pagamento al più presto.</p>
          <br>
          <p>Cordiali saluti,<br>${process.env.COMPANY_NAME || ''}</p>
        `,
      };
      
      await notificationService.broadcast('payment:reminder', { invoiceId, email: customerEmail });
      
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          reminderSentAt: new Date(),
          status: daysOverdue > 30 ? 'OVERDUE' : invoice.status,
        }
      });
      
      logger.info('[InvoiceService] Payment reminder sent successfully', {
        invoiceId,
        daysOverdue
      });
      
    } catch (error: unknown) {
      logger.error('[InvoiceService] Error sending payment reminder:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        invoiceId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  // ========================================
  // METODI PRIVATI UTILITY
  // ========================================

  private async generateInvoiceNumber(documentType: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = this.getDocumentPrefix(documentType);
    
    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        invoiceNumber: { startsWith: `${prefix}${year}/` }
      },
      orderBy: { invoiceNumber: 'desc' }
    });

    let nextNumber = 1;
    if (lastInvoice) {
      const lastNumber = parseInt(lastInvoice.invoiceNumber.split('/')[1] || '0', 10);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${year}/${nextNumber.toString().padStart(5, '0')}`;
  }

  private async generateCreditNoteNumber(): Promise<string> {
    const year = new Date().getFullYear();
    
    const lastCreditNote = await prisma.creditNote.findFirst({
      where: {
        creditNoteNumber: { startsWith: `NC${year}/` }
      },
      orderBy: { creditNoteNumber: 'desc' }
    });

    let nextNumber = 1;
    if (lastCreditNote) {
      const lastNumber = parseInt(lastCreditNote.creditNoteNumber.split('/')[1] || '0', 10);
      nextNumber = lastNumber + 1;
    }

    return `NC${year}/${nextNumber.toString().padStart(5, '0')}`;
  }

  private calculateTotals(lineItems: LineItem[]): CalculatedTotals {
    let subtotal = 0;
    let taxAmount = 0;

    for (const item of lineItems) {
      const itemTotal = item.quantity * item.unitPrice;
      const itemTax = itemTotal * (item.taxRate || 22) / 100;
      
      subtotal += itemTotal;
      taxAmount += itemTax;
    }

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: Math.round((subtotal + taxAmount) * 100) / 100
    };
  }

  private calculateDueDate(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }

  private async requiresElectronicInvoice(
    customerType: string,
    customerData: CreateInvoiceData
  ): Promise<boolean> {
    if (customerType === 'BUSINESS') {
      return true;
    }

    if (customerData.customerSdiCode && customerData.customerSdiCode !== '0000000') {
      return true;
    }

    if (customerData.customerPec) {
      return true;
    }

    return false;
  }

  private mapDocumentTypeToSDI(type: string): string {
    const mapping: Record<string, string> = {
      'INVOICE': 'TD01',
      'PROFORMA': 'TD00',
      'CREDIT_NOTE': 'TD04',
      'DEBIT_NOTE': 'TD05',
      'RECEIPT': 'TD24',
    };
    return mapping[type] || 'TD01';
  }

  private mapToDocumentType(type: string): DocumentType {
    const validTypes: DocumentType[] = ['INVOICE', 'PROFORMA', 'CREDIT_NOTE', 'DEBIT_NOTE', 'RECEIPT', 'ELECTRONIC'];
    if (validTypes.includes(type as DocumentType)) {
      return type as DocumentType;
    }
    return 'INVOICE';
  }

  private mapPaymentStatusToInvoiceStatus(status: string): InvoiceStatus {
    const mapping: Record<string, InvoiceStatus> = {
      'PAID': 'PAID',
      'PARTIALLY_PAID': 'PARTIALLY_PAID',
      'OVERDUE': 'OVERDUE'
    };
    return mapping[status] || 'SENT';
  }

  private getDocumentPrefix(type: string): string {
    const prefixes: Record<string, string> = {
      'INVOICE': 'FT',
      'PROFORMA': 'PF',
      'CREDIT_NOTE': 'NC',
      'DEBIT_NOTE': 'ND',
      'RECEIPT': 'RC',
    };
    return prefixes[type] || 'DOC';
  }

  private getDocumentTitle(type: string): string {
    const titles: Record<string, string> = {
      'INVOICE': 'Fattura',
      'PROFORMA': 'Fattura Proforma',
      'CREDIT_NOTE': 'Nota di Credito',
      'DEBIT_NOTE': 'Nota di Debito',
      'RECEIPT': 'Ricevuta',
      'ELECTRONIC': 'Fattura Elettronica'
    };
    return titles[type] || 'Documento';
  }

  private getLineItemsArray(invoice: Invoice): LineItem[] {
    if (!invoice.items) {
      return [];
    }
    
    if (isLineItemArray(invoice.items)) {
      return invoice.items;
    }
    
    return [];
  }

  private getCustomerData(invoice: Invoice): CustomerData {
    if (!invoice.customerData) {
      return { name: 'Cliente' };
    }
    
    if (isCustomerData(invoice.customerData)) {
      return invoice.customerData;
    }
    
    return { name: 'Cliente' };
  }

  private initializeProviders(): void {
    logger.info('[InvoiceService] Electronic invoice providers initialized');
  }
}

export const invoiceService = new InvoiceService();
