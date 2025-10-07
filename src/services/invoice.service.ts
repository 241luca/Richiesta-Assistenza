import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { notificationService } from './notification.service';

const prisma = new PrismaClient();

// Schema per aggiornamento pagamento
const UpdatePaymentStatusSchema = z.object({
  status: z.enum(['PAID', 'PARTIALLY_PAID', 'OVERDUE']),
  paidAmount: z.number().optional(),
  paymentDate: z.string().optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional()
});

export class InvoiceService {
  private electronicInvoiceProviders: Map<string, any> = new Map();

  constructor() {
    this.initializeProviders();
  }

  /**
   * Crea una nuova fattura
   */
  async createInvoice(data: any, userId: string) {
    try {
      const invoiceNumber = await this.generateInvoiceNumber(data.documentType || 'INVOICE');
      
      // Calcola totali
      const totals = this.calculateTotals(data.lineItems);
      
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
      if (await this.requiresElectronicInvoice(data.customerType, data)) {
        await this.createElectronicInvoice(invoice);
      }
      
      logger.info(`Invoice created: ${invoice.invoiceNumber}`);
      return invoice;
      
    } catch (error) {
      logger.error('Error creating invoice:', error);
      throw error;
    }
  }

  /**
   * Genera fattura elettronica
   */
  private async createElectronicInvoice(invoice: any) {
    try {
      const provider = process.env.ELECTRONIC_INVOICE_PROVIDER || 'aruba';
      const providerInstance = this.electronicInvoiceProviders.get(provider);
      
      if (!providerInstance) {
        logger.warn(`Provider fatturazione elettronica non configurato: ${provider}`);
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
      if (settings?.value?.autoSendToSDI) {
        const sdiResult = await providerInstance.sendToSDI(result.invoiceId);
        
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            sdiStatus: sdiResult.status,
            sdiResponse: sdiResult.response,
          },
        });
      }

      logger.info(`Fattura elettronica creata: ${invoice.invoiceNumber}`);

    } catch (error) {
      logger.error('Errore creazione fattura elettronica:', error);
      // Non bloccare il processo principale
    }
  }

  /**
   * Prepara dati per fattura elettronica
   */
  private prepareElectronicInvoiceData(invoice: any) {
    return {
      DatiTrasmissione: {
        IdTrasmittente: {
          IdPaese: 'IT',
          IdCodice: process.env.VAT_NUMBER || '',
        },
        ProgressivoInvio: invoice.invoiceNumber.replace(/[^0-9]/g, ''),
        FormatoTrasmissione: 'FPR12',
        CodiceDestinatario: invoice.customerSdiCode || '0000000',
        PECDestinatario: invoice.customerPec,
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
          Indirizzo: invoice.customerAddress,
          CAP: invoice.customerZipCode,
          Comune: invoice.customerCity,
          Provincia: invoice.customerProvince,
          Nazione: invoice.customerCountry || 'IT',
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
      DatiBeniServizi: invoice.lineItems.map((item: any) => ({
        Descrizione: item.description,
        Quantita: item.quantity,
        PrezzoUnitario: item.unitPrice,
        PrezzoTotale: item.totalPrice,
        AliquotaIVA: item.taxRate || 22.00,
      })),
    };
  }

  /**
   * Invia fattura al cliente
   */
  private async sendInvoiceToCustomer(invoice: any) {
    try {
      // Genera PDF
      const pdfBuffer = await this.generatePDF(invoice);
      
      // Prepara email
      const emailData = {
        to: invoice.customerEmail,
        subject: `Fattura ${invoice.invoiceNumber} - ${process.env.COMPANY_NAME}`,
        html: `
          <p>Gentile ${invoice.customerName},</p>
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
          sentTo: invoice.customerEmail,
        },
      });
      
      logger.info(`Invoice sent to ${invoice.customerEmail}`);
      
    } catch (error) {
      logger.error('Error sending invoice:', error);
      throw error;
    }
  }

  /**
   * Genera PDF fattura completo
   */
  async generatePDF(invoiceId: string): Promise<Buffer> {
    const PDFDocument = require('pdfkit');
    
    // Recupera fattura con tutti i dati
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        professional: true,
        customer: true
      }
    });
    
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];
        
        doc.on('data', chunks.push.bind(chunks));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
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
        
        const customerData = invoice.customerData as any;
        doc.fontSize(10).font('Helvetica')
           .text(customerData.name || invoice.customer?.fullName || 'Cliente', 50, 200)
           .text(customerData.address || '', 50, 215)
           .text(`${customerData.zipCode || ''} ${customerData.city || ''} (${customerData.province || ''})`, 50, 230);
        
        if (customerData.vatNumber) {
          doc.text(`P.IVA: ${customerData.vatNumber}`, 50, 245);
        }
        if (customerData.fiscalCode) {
          doc.text(`C.F.: ${customerData.fiscalCode}`, 50, 260);
        }
        if (customerData.sdiCode && customerData.sdiCode !== '0000000') {
          doc.text(`Codice SDI: ${customerData.sdiCode}`, 50, 275);
        }
        if (customerData.pecEmail) {
          doc.text(`PEC: ${customerData.pecEmail}`, 50, 290);
        }
        
        // TABELLA DETTAGLI
        let yPosition = 340;
        
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
        const lineItems = invoice.lineItems as any[];
        
        for (const item of lineItems) {
          // Controllo overflow pagina
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
        doc.text(formatCurrency(invoice.subtotal), 490, yPosition, { width: 80, align: 'right' });
        
        yPosition += 18;
        doc.text(`IVA ${invoice.taxRate}%:`, 400, yPosition, { width: 80, align: 'right' });
        doc.text(formatCurrency(invoice.taxAmount), 490, yPosition, { width: 80, align: 'right' });
        
        yPosition += 18;
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('TOTALE:', 400, yPosition, { width: 80, align: 'right' });
        doc.text(formatCurrency(invoice.totalAmount), 490, yPosition, { width: 80, align: 'right' });
        
        // STATO PAGAMENTO
        yPosition += 30;
        doc.fontSize(10).font('Helvetica');
        
        if (invoice.status === 'PAID' || invoice.paidAmount >= invoice.totalAmount) {
          doc.fillColor('green')
             .text('PAGATA', 50, yPosition)
             .fillColor('black');
          if (invoice.paidDate) {
            doc.text(`Pagata il: ${formatDate(invoice.paidDate)}`, 50, yPosition + 15);
          }
        } else if (invoice.paidAmount > 0) {
          doc.fillColor('orange')
             .text(`PARZIALMENTE PAGATA - Ricevuti ${formatCurrency(invoice.paidAmount)}`, 50, yPosition)
             .fillColor('black');
        } else {
          doc.fillColor('red')
             .text('DA PAGARE', 50, yPosition)
             .fillColor('black');
        }
        
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
        
        // Termini di pagamento
        if (invoice.paymentTerms) {
          doc.fontSize(8).font('Helvetica')
             .text(`Termini di pagamento: ${invoice.paymentTerms}`, 50, bottomY);
        }
        
        // Info bancarie per bonifico (se non pagata)
        if (invoice.status !== 'PAID') {
          doc.fontSize(8)
             .text('Coordinate bancarie per il pagamento:', 50, bottomY + 15)
             .text(`IBAN: ${process.env.COMPANY_IBAN || 'IT00X0000000000000000000000'}`, 50, bottomY + 28)
             .text(`BIC/SWIFT: ${process.env.COMPANY_SWIFT || 'XXXXXXXX'}`, 50, bottomY + 41);
        }
        
        // Numero pagina
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          doc.fontSize(8).text(
            `Pagina ${i + 1} di ${pages.count}`,
            50,
            doc.page.height - 50,
            { align: 'center' }
          );
        }
        
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Aggiorna stato pagamento
   */
  async updatePaymentStatus(
    invoiceId: string,
    data: z.infer<typeof UpdatePaymentStatusSchema>,
    userId: string
  ) {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId }
      });
      
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
      
      logger.info(`Payment status updated for invoice ${invoice.invoiceNumber}: ${paymentStatus}`);
      return updated;
      
    } catch (error) {
      logger.error('Error updating payment status:', error);
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
  ) {
    try {
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
      
      logger.info(`Partial payment registered: ${amount} for invoice ${invoice.invoiceNumber}`);
      
      if (isFullyPaid) {
        await notificationService.createNotification({
          userId: invoice.userId,
          type: 'INVOICE_PAID',
          title: 'Fattura pagata completamente',
          message: `La fattura ${invoice.invoiceNumber} è stata pagata completamente`,
          data: { invoiceId }
        });
      }
      
    } catch (error) {
      logger.error('Error registering partial payment:', error);
      throw error;
    }
  }

  /**
   * Crea nota di credito
   */
  async createCreditNote(
    originalInvoiceId: string,
    lineItems: any[],
    reason: string,
    userId: string
  ) {
    try {
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
      
      logger.info(`Credit note created: ${creditNote.creditNoteNumber}`);
      return creditNote;
      
    } catch (error) {
      logger.error('Error creating credit note:', error);
      throw error;
    }
  }

  /**
   * Invia promemoria pagamento
   */
  async sendPaymentReminder(invoiceId: string) {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          user: true
        }
      });
      
      if (!invoice) {
        throw new Error('Invoice not found');
      }
      
      if (invoice.paymentStatus === 'PAID') {
        throw new Error('Invoice already paid');
      }
      
      const daysOverdue = Math.floor((Date.now() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const reminderCount = (invoice.reminderCount || 0) + 1;
      
      // Prepara email promemoria
      const emailData = {
        to: invoice.customerEmail,
        subject: `Promemoria pagamento - Fattura ${invoice.invoiceNumber}`,
        html: `
          <p>Gentile ${invoice.customerName},</p>
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
      
      logger.info(`Payment reminder sent for invoice ${invoice.invoiceNumber} (reminder #${reminderCount})`);
      
    } catch (error) {
      logger.error('Error sending payment reminder:', error);
      throw error;
    }
  }

  /**
   * Genera numero fattura progressivo
   */
  private async generateInvoiceNumber(documentType: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = this.getDocumentPrefix(documentType);
    
    // Trova l'ultimo numero per l'anno corrente
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
   * Genera numero nota di credito
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
   */
  private calculateTotals(lineItems: any[]) {
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
   * Calcola data scadenza
   */
  private calculateDueDate(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }

  /**
   * Verifica se richiede fattura elettronica
   */
  private async requiresElectronicInvoice(
    customerType: string,
    customerData: any
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
   */
  private initializeProviders() {
    // TODO: Implementare integrazione con provider reali (Aruba, InfoCert, etc.)
    logger.info('Electronic invoice providers initialized');
  }
}

export const invoiceService = new InvoiceService();