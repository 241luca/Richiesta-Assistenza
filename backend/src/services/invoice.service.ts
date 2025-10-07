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
 * @version 5.2.1
 * @updated 2025-10-01
 * @author Sistema Richiesta Assistenza
 */

import { z } from 'zod';
import { logger } from '../utils/logger';
import { notificationService } from './notification.service';
import { prisma } from '../config/database';
import { Invoice, CreditNote, PaymentRecord, Payment } from '@prisma/client';

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
  issueDate?: string;
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
 * Dati cliente per fattura
 */
interface CustomerData {
  name?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  province?: string;
  vatNumber?: string;
  fiscalCode?: string;
}

/**
 * Fattura con relazioni
 */
interface InvoiceWithRelations extends Invoice {
  professional?: any;
  customer?: any;
  customerData?: CustomerData;
  lineItems?: LineItem[];
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
  private electronicInvoiceProviders: Map<string, any> = new Map();

  constructor() {
    this.initializeProviders();
  }

  /**
   * Crea una nuova fattura nel sistema
   * Calcola automaticamente totali e numera progressivamente
   * 
   * @param {Object} data - Dati fattura da creare
   * @param {string} userId - ID utente che crea la fattura
   * @returns {Promise<Invoice>} Fattura creata
   * @throws {Error} Se creazione fallisce
   * 
   * @example
   * const invoice = await invoiceService.createInvoice({
   *   customerId: 'client-123',
   *   customerName: 'Mario Rossi',
   *   lineItems: [
   *     { description: 'Servizio', quantity: 1, unitPrice: 100 }
   *   ],
   *   paymentTerms: 30
   * }, 'user-456');
   */
  async createInvoice(data: CreateInvoiceData, userId: string): Promise<Invoice> {
    try {
      logger.info('[InvoiceService] Creating invoice', {
        userId,
        customerId: data.customerId,
        documentType: data.documentType
      });

      const invoiceNumber = await this.generateInvoiceNumber(data.documentType || 'INVOICE');
      
      // Calcola totali
      const totals = this.calculateTotals(data.lineItems || []);
      
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          documentType: data.documentType || 'INVOICE',
          issueDate: new Date(data.issueDate || Date.now()),
          dueDate: this.calculateDueDate(data.paymentTerms || 30),
          
          // Cliente
          customerId: data.customerId,
          customerType: data.customerType || 'PRIVATE',
          customerName: data.customerName,
          customerAddress: data.customerAddress,
          customerCity: data.customerCity,
          customerZipCode: data.customerZipCode,
          customerProvince: data.customerProvince,
          customerCountry: data.customerCountry || 'IT',
          customerVatNumber: data.customerVatNumber,
          customerFiscalCode: data.customerFiscalCode,
          customerPec: data.customerPec,
          customerSdiCode: data.customerSdiCode,
          
          // Dettagli
          description: data.description,
          lineItems: data.lineItems,
          
          // Totali
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          totalAmount: totals.totalAmount,
          
          // Pagamento
          paymentTerms: data.paymentTerms || 30,
          paymentMethod: data.paymentMethod || 'BANK_TRANSFER',
          bankDetails: data.bankDetails,
          
          // Note
          notes: data.notes,
          internalNotes: data.internalNotes,
          
          // Metadata
          userId,
          status: 'DRAFT',
          paymentStatus: 'PENDING'
        }
      });
      
      // Genera fattura elettronica se richiesto
      if (await this.requiresElectronicInvoice(data.customerType || 'PRIVATE', data)) {
        await this.createElectronicInvoice(invoice);
      }
      
      logger.info('[InvoiceService] Invoice created successfully', {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount
      });

      return invoice;
      
    } catch (error) {
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
   * Usato per generare fattura automaticamente dopo pagamento completato
   * 
   * @param {string} paymentId - ID pagamento per cui generare fattura
   * @returns {Promise<Invoice>} Fattura generata
   * @throws {Error} Se pagamento non trovato
   * 
   * @example
   * const invoice = await invoiceService.generateInvoice('payment-123');
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
      });

      if (!payment || !payment.client || !payment.professionalId) {
        throw new Error('Payment not found or incomplete data');
      }

      // Crea line items dal pagamento
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
        customerZipCode: payment.client.zipCode || undefined,
        customerProvince: payment.client.province || undefined,
        customerType: 'PRIVATE' as const,
        lineItems,
        paymentTerms: 0, // Già pagata
        documentType: 'INVOICE'
      };

      const invoice = await this.createInvoice(invoiceData, payment.professionalId);

      // Collega fattura al pagamento
      await prisma.payment.update({
        where: { id: paymentId },
        data: { invoiceId: invoice.id }
      });

      logger.info('[InvoiceService] Invoice generated from payment', {
        paymentId,
        invoiceId: invoice.id
      });

      return invoice;

    } catch (error) {
      logger.error('[InvoiceService] Error generating invoice from payment:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        paymentId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Genera fattura elettronica in formato XML per SDI
   * 
   * @private
   * @param {Invoice} invoice - Fattura da convertire in formato elettronico
   * @returns {Promise<void>}
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

      // Prepara dati per fatturazione elettronica
      const xmlData = this.prepareElectronicInvoiceData(invoice);
      
      // Genera XML
      const result = await providerInstance.generateInvoice(xmlData);
      
      // Salva riferimento nel database
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          electronicInvoiceGenerated: true,
          electronicProvider: provider,
          sdiId: result.sdiId,
          xmlFile: result.xmlContent,
          sdiStatus: 'SENT',
        },
      });

      // Controlla se invio automatico è abilitato
      const settings = await prisma.systemSettings.findUnique({
        where: { key: 'invoice_settings' }
      });

      // Invia a SDI se richiesto
      const settingsValue = settings?.value as any;
      if (settingsValue?.autoSendToSDI) {
        const sdiResult = await providerInstance.sendToSDI(result.invoiceId);
        
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            sdiStatus: sdiResult.status,
            sdiResponse: sdiResult.response,
          },
        });
      }

      logger.info('[InvoiceService] Electronic invoice created successfully', {
        invoiceId: invoice.id,
        sdiId: result.sdiId
      });

    } catch (error) {
      logger.error('[InvoiceService] Error creating electronic invoice:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        invoiceId: invoice.id,
        stack: error instanceof Error ? error.stack : undefined
      });
      // Non bloccare il processo principale
    }
  }

  /**
   * Prepara dati fattura nel formato XML SDI
   * 
   * @private
   * @param {Invoice} invoice - Fattura da convertire
   * @returns {Object} Dati strutturati per XML SDI
   */
  private prepareElectronicInvoiceData(invoice: Invoice): any {
    return {
      DatiTrasmissione: {
        IdTrasmittente: {
          IdPaese: 'IT',
          IdCodice: process.env.VAT_NUMBER || '',
        },
        ProgressivoInvio: (invoice.invoiceNumber || '').replace(/[^0-9]/g, ''),
        FormatoTrasmissione: 'FPR12',
        CodiceDestinatario: (invoice as any).customerSdiCode || '0000000',
        PECDestinatario: (invoice as any).customerPec,
      },
      CedentePrestatore: {
        DatiAnagrafici: {
          IdFiscaleIVA: {
            IdPaese: 'IT',
            IdCodice: process.env.VAT_NUMBER,
          },
          Anagrafica: {
            Denominazione: process.env.COMPANY_NAME,
          },
          RegimeFiscale: 'RF01',
        },
        Sede: {
          Indirizzo: process.env.COMPANY_ADDRESS,
          CAP: process.env.COMPANY_ZIP,
          Comune: process.env.COMPANY_CITY,
          Provincia: process.env.COMPANY_PROVINCE,
          Nazione: 'IT',
        },
      },
      CessionarioCommittente: {
        DatiAnagrafici: {
          IdFiscaleIVA: invoice.customerVatNumber ? {
            IdPaese: 'IT',
            IdCodice: invoice.customerVatNumber,
          } : undefined,
          CodiceFiscale: invoice.customerFiscalCode,
          Anagrafica: {
            Denominazione: invoice.customerName,
          },
        },
        Sede: {
          Indirizzo: (invoice as any).customerAddress || '',
          CAP: (invoice as any).customerZipCode || '',
          Comune: (invoice as any).customerCity || '',
          Provincia: (invoice as any).customerProvince || '',
          Nazione: (invoice as any).customerCountry || 'IT',
        },
      },
      DatiGenerali: {
        DatiGeneraliDocumento: {
          TipoDocumento: this.mapDocumentTypeToSDI(invoice.documentType),
          Divisa: 'EUR',
          Data: invoice.issueDate,
          Numero: invoice.invoiceNumber,
        },
      },
      DatiBeniServizi: ((invoice as any).lineItems || []).map((item: LineItem) => ({
        Descrizione: item.description,
        Quantita: item.quantity,
        PrezzoUnitario: item.unitPrice,
        PrezzoTotale: item.quantity * item.unitPrice,
        AliquotaIVA: item.taxRate || 22.00
      })),
    };
  }

  /**
   * Invia fattura al cliente via email con PDF allegato
   * 
   * @private
   * @param {InvoiceWithRelations} invoice - Fattura da inviare
   * @returns {Promise<void>}
   * @throws {Error} Se invio fallisce
   */
  private async sendInvoiceToCustomer(invoice: InvoiceWithRelations): Promise<void> {
    try {
      const customerEmail = (invoice as any).customerEmail;
      
      logger.info('[InvoiceService] Sending invoice to customer', {
        invoiceId: invoice.id,
        customerEmail
      });
      
      if (!customerEmail) {
        throw new Error('Customer email not found');
      }

      // Genera PDF
      const pdfBuffer = await this.generatePDF(invoice.id);
      
      // Prepara email
      const emailData = {
        to: customerEmail,
        subject: `Fattura ${invoice.invoiceNumber} - ${process.env.COMPANY_NAME}`,
        html: `
          <p>Gentile ${invoice.customerName || 'Cliente'},</p>
          <p>In allegato trovi la fattura ${invoice.invoiceNumber} del ${invoice.issueDate}.</p>
          <p>Importo: €${invoice.totalAmount}</p>
          <p>Scadenza: ${invoice.dueDate}</p>
          <br>
          <p>Cordiali saluti,<br>${process.env.COMPANY_NAME}</p>
        `,
        attachments: [{
          filename: `Fattura_${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
        }],
      };
      
      // Invia email
      await notificationService.sendEmail(emailData);
      
      // Aggiorna stato
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          sentAt: new Date(),
          sentTo: customerEmail,
        },
      });
      
      logger.info('[InvoiceService] Invoice sent successfully', {
        invoiceId: invoice.id,
        customerEmail
      });
      
    } catch (error) {
      logger.error('[InvoiceService] Error sending invoice:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        invoiceId: invoice.id,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Genera PDF fattura completo con intestazione, dettagli e footer
   * Include formattazione professionale e branding aziendale
   * 
   * @param {string} invoiceId - ID fattura da convertire in PDF
   * @returns {Promise<Buffer>} Buffer PDF generato
   * @throws {Error} Se fattura non trovata o generazione fallisce
   * 
   * @example
   * const pdfBuffer = await invoiceService.generatePDF('invoice-123');
   * // Salva o invia PDF
   */
  async generatePDF(invoiceId: string): Promise<Buffer> {
    try {
      logger.info('[InvoiceService] Generating PDF', { invoiceId });

      const PDFDocument = require('pdfkit');
      
      // Recupera fattura con tutti i dati
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
      
      return new Promise((resolve, reject) => {
        try {
          const doc = new PDFDocument({ margin: 50 });
          const chunks: Buffer[] = [];
          
          doc.on('data', chunks.push.bind(chunks));
          doc.on('end', () => {
            logger.info('[InvoiceService] PDF generated successfully', { invoiceId });
            resolve(Buffer.concat(chunks));
          });
          doc.on('error', reject);
          
          // Helper per formattare valuta
          const formatCurrency = (amount: number) => {
            return new Intl.NumberFormat('it-IT', {
              style: 'currency',
              currency: 'EUR'
            }).format(amount);
          };
          
          // Helper per formattare data
          const formatDate = (date: Date) => {
            return new Date(date).toLocaleDateString('it-IT');
          };
          
          // HEADER AZIENDA
          doc.fontSize(20).font('Helvetica-Bold')
             .text(process.env.COMPANY_NAME || 'Sistema Assistenza SRL', 50, 50);
          
          doc.fontSize(10).font('Helvetica')
             .text(`P.IVA: ${process.env.COMPANY_VAT || 'IT12345678901'}`, 50, 75)
             .text(`${process.env.COMPANY_ADDRESS || 'Via Example 123'}`, 50, 90)
             .text(`${process.env.COMPANY_ZIP || '20100'} ${process.env.COMPANY_CITY || 'Milano'} (${process.env.COMPANY_PROVINCE || 'MI'})`, 50, 105)
             .text(`Email: ${process.env.COMPANY_EMAIL || 'info@assistenza.it'}`, 50, 120)
             .text(`Tel: ${process.env.COMPANY_PHONE || '+39 02 12345678'}`, 50, 135);
          
          // TIPO DOCUMENTO E NUMERO
          const docTitle = this.getDocumentTitle(invoice.documentType);
          doc.fontSize(18).font('Helvetica-Bold')
             .text(docTitle.toUpperCase(), 400, 50, { align: 'right' });
          
          doc.fontSize(12).font('Helvetica')
             .text(`N° ${invoice.invoiceNumber}`, 400, 75, { align: 'right' })
             .text(`Data: ${formatDate(invoice.issueDate)}`, 400, 95, { align: 'right' });
          
          if (invoice.dueDate) {
            doc.text(`Scadenza: ${formatDate(invoice.dueDate)}`, 400, 115, { align: 'right' });
          }
          
          // DATI CLIENTE
          doc.fontSize(12).font('Helvetica-Bold')
             .text('DESTINATARIO', 50, 180);
          
          const customerData = invoice.customerData || {};
          const customerName = customerData.name || 
                              (invoice.customer as any)?.fullName || 
                              invoice.customerName || 
                              'Cliente';
          
          doc.fontSize(10).font('Helvetica')
             .text(customerName, 50, 200)
             .text(customerData.address || '', 50, 215)
             .text(`${customerData.zipCode || ''} ${customerData.city || ''} (${customerData.province || ''})`, 50, 230);
          
          if (customerData.vatNumber) {
            doc.text(`P.IVA: ${customerData.vatNumber}`, 50, 245);
          }
          if (customerData.fiscalCode) {
            doc.text(`C.F.: ${customerData.fiscalCode}`, 50, 260);
          }
          
          // TABELLA DETTAGLI
          let yPosition = 320;
          
          // Header tabella
          doc.fontSize(10).font('Helvetica-Bold');
          doc.text('DESCRIZIONE', 50, yPosition);
          doc.text('QTÀ', 300, yPosition, { width: 50, align: 'right' });
          doc.text('PREZZO', 360, yPosition, { width: 70, align: 'right' });
          doc.text('IVA %', 440, yPosition, { width: 40, align: 'right' });
          doc.text('TOTALE', 490, yPosition, { width: 80, align: 'right' });
          
          // Linea sotto header
          doc.moveTo(50, yPosition + 15)
             .lineTo(570, yPosition + 15)
             .stroke();
          
          yPosition += 25;
          
          // Righe fattura
          doc.font('Helvetica');
          const lineItems = (invoice.lineItems || []) as LineItem[];
          
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
            doc.text(`${item.vatRate || 22}%`, 440, yPosition, { width: 40, align: 'right' });
            doc.text(formatCurrency(itemTotal), 490, yPosition, { width: 80, align: 'right' });
            
            yPosition += 20;
          }
          
          // Linea sopra totali
          doc.moveTo(350, yPosition)
             .lineTo(570, yPosition)
             .stroke();
          
          yPosition += 10;
          
          // TOTALI
          doc.fontSize(10).font('Helvetica');
          doc.text('Imponibile:', 400, yPosition, { width: 80, align: 'right' });
          doc.text(formatCurrency(invoice.subtotal || 0), 490, yPosition, { width: 80, align: 'right' });
          
          yPosition += 18;
          doc.text(`IVA ${(invoice as any).taxRate || 22}%:`, 400, yPosition, { width: 80, align: 'right' });
          doc.text(formatCurrency(invoice.taxAmount || 0), 490, yPosition, { width: 80, align: 'right' });
          
          yPosition += 18;
          doc.fontSize(12).font('Helvetica-Bold');
          doc.text('TOTALE:', 400, yPosition, { width: 80, align: 'right' });
          doc.text(formatCurrency(invoice.totalAmount || 0), 490, yPosition, { width: 80, align: 'right' });
          
          // NOTE
          if (invoice.notes) {
            yPosition += 40;
            doc.fontSize(10).font('Helvetica-Bold')
               .text('NOTE:', 50, yPosition);
            doc.fontSize(9).font('Helvetica')
               .text(invoice.notes, 50, yPosition + 15, { width: 520 });
          }
          
          // FOOTER
          const bottomY = doc.page.height - 100;
          
          if (invoice.status !== 'PAID') {
            doc.fontSize(8)
               .text('Coordinate bancarie per il pagamento:', 50, bottomY)
               .text(`IBAN: ${process.env.COMPANY_IBAN || 'IT00X0000000000000000000000'}`, 50, bottomY + 13);
          }
          
          doc.end();
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
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
   * 
   * @param {string} invoiceId - ID fattura da aggiornare
   * @param {Object} data - Nuovi dati pagamento
   * @param {string} userId - ID utente che aggiorna
   * @returns {Promise<Invoice>} Fattura aggiornata
   * @throws {Error} Se fattura non trovata
   * 
   * @example
   * const invoice = await invoiceService.updatePaymentStatus(
   *   'invoice-123',
   *   { status: 'PAID', paidAmount: 100 },
   *   'user-456'
   * );
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
      }) as Invoice | null;
      
      if (!invoice) {
        throw new Error('Invoice not found');
      }
      
      // Calcola nuovo stato
      let paymentStatus = data.status;
      let paidAmount = data.paidAmount || 0;
      
      if (data.status === 'PARTIALLY_PAID') {
        paidAmount = (invoice.paidAmount || 0) + (data.paidAmount || 0);
        
        if (paidAmount >= invoice.totalAmount) {
          paymentStatus = 'PAID';
          paidAmount = invoice.totalAmount;
        }
      } else if (data.status === 'PAID') {
        paidAmount = invoice.totalAmount;
      }
      
      // Aggiorna invoice
      const updated = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          paymentStatus,
          paidAmount,
          paymentDate: data.paymentDate ? new Date(data.paymentDate) : undefined,
          paymentMethod: data.paymentMethod,
          notes: data.notes ? `${invoice.notes || ''}\n${data.notes}` : invoice.notes,
        }
      });
      
      // Crea record di pagamento
      if (data.paidAmount && data.paidAmount > 0) {
        await prisma.paymentRecord.create({
          data: {
            invoiceId,
            amount: data.paidAmount,
            paymentDate: new Date(data.paymentDate || Date.now()),
            paymentMethod: data.paymentMethod || 'BANK_TRANSFER',
            reference: `PAY-${Date.now()}`,
            notes: data.notes,
            userId,
          }
        });
      }
      
      // Invia notifica
      if (paymentStatus === 'PAID') {
        await notificationService.createNotification({
          userId: invoice.userId,
          type: 'PAYMENT_RECEIVED',
          title: 'Pagamento ricevuto',
          message: `Il pagamento per la fattura ${invoice.invoiceNumber} è stato ricevuto`,
          data: { invoiceId, amount: paidAmount }
        });
      }
      
      logger.info('[InvoiceService] Payment status updated successfully', {
        invoiceId,
        paymentStatus,
        paidAmount
      });

      return updated;
      
    } catch (error) {
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
   * 
   * @param {string} invoiceId - ID fattura
   * @param {number} amount - Importo pagato
   * @param {string} paymentMethod - Metodo pagamento
   * @param {string} reference - Riferimento pagamento
   * @param {string} userId - ID utente
   * @returns {Promise<void>}
   * 
   * @example
   * await invoiceService.registerPartialPayment(
   *   'invoice-123',
   *   50,
   *   'BANK_TRANSFER',
   *   'BT-2025-001',
   *   'user-456'
   * );
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
      const isFullyPaid = newPaidAmount >= invoice.totalAmount;
      
      // Aggiorna fattura
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaidAmount,
          paymentStatus: isFullyPaid ? 'PAID' : 'PARTIALLY_PAID',
          paymentDate: isFullyPaid ? new Date() : undefined,
        }
      });
      
      // Registra pagamento
      await prisma.paymentRecord.create({
        data: {
          invoiceId,
          amount,
          paymentDate: new Date(),
          paymentMethod,
          reference,
          userId,
        }
      });
      
      logger.info('[InvoiceService] Partial payment registered successfully', {
        invoiceId,
        amount,
        newPaidAmount,
        isFullyPaid
      });
      
      if (isFullyPaid) {
        await notificationService.createNotification({
        userId: invoice.userId || '',
        type: 'INVOICE_PAID',
        title: 'Fattura pagata completamente',
        message: `La fattura ${invoice.invoiceNumber} è stata pagata completamente`,
        data: { invoiceId }
        });
      }
      
    } catch (error) {
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
   * Crea nota di credito per storno parziale o totale
   * 
   * @param {string} originalInvoiceId - ID fattura originale
   * @param {Array} lineItems - Righe della nota di credito
   * @param {string} reason - Motivo della nota di credito
   * @param {string} userId - ID utente
   * @returns {Promise<CreditNote>} Nota di credito creata
   * 
   * @example
   * const creditNote = await invoiceService.createCreditNote(
   *   'invoice-123',
   *   [{ description: 'Storno', quantity: 1, unitPrice: 50 }],
   *   'Prodotto difettoso',
   *   'user-456'
   * );
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
      
      const creditNote = await prisma.creditNote.create({
        data: {
          creditNoteNumber,
          originalInvoiceId,
          issueDate: new Date(),
          
          // Cliente (copia da fattura originale)
          customerId: originalInvoice.customerId,
          customerName: originalInvoice.customerName,
          customerAddress: originalInvoice.customerAddress,
          customerCity: originalInvoice.customerCity,
          customerZipCode: originalInvoice.customerZipCode,
          customerProvince: originalInvoice.customerProvince,
          customerCountry: originalInvoice.customerCountry,
          customerVatNumber: originalInvoice.customerVatNumber,
          customerFiscalCode: originalInvoice.customerFiscalCode,
          
          // Dettagli nota di credito
          reason,
          lineItems,
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          totalAmount: totals.totalAmount,
          
          // Metadata
          userId,
          status: 'ISSUED',
        }
      });
      
      // Aggiorna fattura originale
      await prisma.invoice.update({
        where: { id: originalInvoiceId },
        data: {
          creditNoteId: creditNote.id,
          creditedAmount: totals.totalAmount,
        }
      });
      
      logger.info('[InvoiceService] Credit note created successfully', {
        creditNoteId: creditNote.id,
        creditNoteNumber: creditNote.creditNoteNumber,
        totalAmount: totals.totalAmount
      });

      return creditNote;
      
    } catch (error) {
      logger.error('[InvoiceService] Error creating credit note:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        originalInvoiceId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Invia promemoria pagamento al cliente
   * 
   * @param {string} invoiceId - ID fattura
   * @returns {Promise<void>}
   * @throws {Error} Se fattura non trovata o già pagata
   * 
   * @example
   * await invoiceService.sendPaymentReminder('invoice-123');
   */
  async sendPaymentReminder(invoiceId: string): Promise<void> {
    try {
      logger.info('[InvoiceService] Sending payment reminder', { invoiceId });

      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          user: true
        }
      }) as (Invoice & { user?: any }) | null;
      
      if (!invoice) {
        throw new Error('Invoice not found');
      }
      
      if (invoice.paymentStatus === 'PAID') {
        throw new Error('Invoice already paid');
      }
      
      const daysOverdue = Math.floor((Date.now() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const reminderCount = (invoice.reminderCount || 0) + 1;
      
      // Prepara email promemoria
      const customerEmail = (invoice as any).customerEmail;
      if (!customerEmail) {
        throw new Error('Customer email not found');
      }
      
      const emailData = {
        to: customerEmail,
        subject: `Promemoria pagamento - Fattura ${invoice.invoiceNumber}`,
        html: `
          <p>Gentile ${invoice.customerName || 'Cliente'},</p>
          <p>Ti ricordiamo che la fattura ${invoice.invoiceNumber} del ${invoice.issueDate} 
          risulta ancora non pagata.</p>
          <p>Importo: €${invoice.totalAmount}</p>
          <p>Scadenza: ${invoice.dueDate} (${daysOverdue} giorni fa)</p>
          <br>
          <p>Ti preghiamo di provvedere al pagamento al più presto.</p>
          <br>
          <p>Cordiali saluti,<br>${process.env.COMPANY_NAME}</p>
        `,
      };
      
      await notificationService.sendEmail(emailData);
      
      // Aggiorna contatore promemoria
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          reminderCount,
          lastReminderAt: new Date(),
          paymentStatus: daysOverdue > 30 ? 'OVERDUE' : invoice.paymentStatus,
        }
      });
      
      logger.info('[InvoiceService] Payment reminder sent successfully', {
        invoiceId,
        reminderCount,
        daysOverdue
      });
      
    } catch (error) {
      logger.error('[InvoiceService] Error sending payment reminder:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        invoiceId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Genera numero fattura progressivo per anno
   * 
   * @private
   * @param {string} documentType - Tipo documento
   * @returns {Promise<string>} Numero fattura generato
   */
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
      const lastNumber = parseInt(lastInvoice.invoiceNumber.split('/')[1]);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${year}/${nextNumber.toString().padStart(5, '0')}`;
  }

  /**
   * Genera numero nota di credito progressivo
   * 
   * @private
   * @returns {Promise<string>} Numero nota di credito
   */
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
      const lastNumber = parseInt(lastCreditNote.creditNoteNumber.split('/')[1]);
      nextNumber = lastNumber + 1;
    }

    return `NC${year}/${nextNumber.toString().padStart(5, '0')}`;
  }

  /**
   * Calcola totali da line items
   * 
   * @private
   * @param {LineItem[]} lineItems - Righe fattura
   * @returns {CalculatedTotals} Totali calcolati {subtotal, taxAmount, totalAmount}
   */
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

  /**
   * Calcola data scadenza da giorni
   * 
   * @private
   * @param {number} days - Giorni di termine pagamento
   * @returns {Date} Data scadenza
   */
  private calculateDueDate(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }

  /**
   * Verifica se richiede fattura elettronica
   * 
   * @private
   * @param {string} customerType - Tipo cliente
   * @param {CreateInvoiceData} customerData - Dati cliente
   * @returns {Promise<boolean>} true se richiede fattura elettronica
   */
  private async requiresElectronicInvoice(
    customerType: string,
    customerData: CreateInvoiceData
  ): Promise<boolean> {
    // In Italia, fattura elettronica obbligatoria per B2B e B2G
    if (customerType === 'BUSINESS') {
      return true;
    }

    // Per privati, obbligatoria solo se hanno richiesto SDI
    if (customerData.customerSdiCode && customerData.customerSdiCode !== '0000000') {
      return true;
    }

    // Se hanno PEC, probabilmente la vogliono
    if (customerData.customerPec) {
      return true;
    }

    return false;
  }

  /**
   * Mappa tipo documento a codice SDI
   * 
   * @private
   * @param {string} type - Tipo documento
   * @returns {string} Codice SDI
   */
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

  /**
   * Ottieni prefisso documento
   * 
   * @private
   * @param {string} type - Tipo documento
   * @returns {string} Prefisso
   */
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

  /**
   * Ottieni titolo documento
   * 
   * @private
   * @param {string} type - Tipo documento
   * @returns {string} Titolo
   */
  private getDocumentTitle(type: string): string {
    const titles: Record<string, string> = {
      'INVOICE': 'Fattura',
      'PROFORMA': 'Fattura Proforma',
      'CREDIT_NOTE': 'Nota di Credito',
      'DEBIT_NOTE': 'Nota di Debito',
      'RECEIPT': 'Ricevuta',
    };
    return titles[type] || 'Documento';
  }

  /**
   * Inizializza provider fatturazione elettronica
   * 
   * @private
   */
  private initializeProviders() {
    // TODO: Implementare integrazione con provider reali (Aruba, InfoCert, etc.)
    logger.info('[InvoiceService] Electronic invoice providers initialized');
  }
}

/**
 * Export Singleton Instance
 * Usa questa istanza in tutto il sistema
 */
export const invoiceService = new InvoiceService();