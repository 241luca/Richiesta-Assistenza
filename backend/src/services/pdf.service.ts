import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { formatQuote, formatAssistanceRequest } from '../utils/responseFormatter';

const prisma = new PrismaClient();

class PDFService {
  private uploadsDir = path.join(process.cwd(), 'uploads', 'quotes');

  constructor() {
    // Crea la directory se non esiste
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
      logger.info(`Created uploads directory: ${this.uploadsDir}`);
    }
  }

  /**
   * Genera PDF per un preventivo
   */
  async generateQuotePDF(quoteId: string): Promise<string> {
    try {
      logger.info(`Generating PDF for quote: ${quoteId}`);
      
      // Ottieni tutti i dati necessari con le relazioni Prisma corrette
      const rawQuote = await prisma.quote.findUnique({
        where: { id: quoteId },
        include: {
          QuoteItem: { orderBy: { order: 'asc' } },
          User: true,
          AssistanceRequest: {
            include: {
              User_AssistanceRequest_clientIdToUser: true,
              Category: true,
              Subcategory: true
            }
          }
        }
      });

      if (!rawQuote) {
        throw new AppError('Quote not found', 404);
      }

      // Usa il ResponseFormatter per ottenere dati ben strutturati
      const quote = formatQuote(rawQuote);
      console.log('PDF Service - Formatted quote:', quote);

      const fileName = `preventivo-${quote.id}-v${quote.version}.pdf`;
      const filePath = path.join(this.uploadsDir, fileName);

      logger.info(`Creating PDF file at: ${filePath}`);

      // Crea un nuovo documento PDF
      const doc = new PDFDocument({ 
        margin: 40, // Ridotto da 50 per più spazio
        size: 'A4'
      });

      // Crea uno stream e pipe nel file
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header con info azienda - ULTRA COMPATTO
      doc.fontSize(14).text('Sistema Richiesta Assistenza', { align: 'center' }); // Ridotto da 16
      doc.fontSize(9).text('Gestione servizi professionali', { align: 'center' }); // Ridotto da 10
      doc.moveDown(0.8); // Ridotto da 1.5

      // Titolo preventivo - COMPATTO
      doc.fontSize(18).text('PREVENTIVO', { align: 'center' }); // Ridotto da 20
      doc.fontSize(12).text(`N° ${quote.id.slice(0, 8).toUpperCase()}`, { align: 'center' }); // Ridotto da 14
      doc.moveDown(0.3); // Ridotto da 0.5

      // Data e validità - COMPATTO
      doc.fontSize(9); // Ridotto da 10
      doc.text(`Data: ${new Date(quote.createdAt).toLocaleDateString('it-IT')}`, { align: 'right' });
      if (quote.validUntil) {
        doc.text(`Valido fino al: ${new Date(quote.validUntil).toLocaleDateString('it-IT')}`, { align: 'right' });
      }
      doc.moveDown(0.7); // Ridotto da 1

      // Layout a due colonne: PROFESSIONISTA (sinistra) e CLIENTE (destra)
      const currentY = doc.y;
      const leftCol = 40;   // Ridotto da 50
      const rightCol = 290; // Ridotto da 300

      // Box Professionista (SINISTRA) - COMPATTO
      const professional = quote.professional;
      if (professional) {
        doc.fontSize(11).text('PROFESSIONISTA', leftCol, currentY, { underline: true }); // Ridotto da 12
        let profY = currentY + 16; // Ridotto da 20
        doc.fontSize(9); // Ridotto da 10
        doc.text(`${professional.fullName || `${professional.firstName || ''} ${professional.lastName || ''}`.trim() || 'N/A'}`, leftCol, profY);
        profY += 10; // Ridotto da 12
        if (professional.ragioneSociale) {
          doc.text(professional.ragioneSociale, leftCol, profY);
          profY += 10;
        }
        doc.text(`${professional.profession || 'Professionista'}`, leftCol, profY);
        profY += 10;
        doc.text(`${professional.address || 'Indirizzo non specificato'}`, leftCol, profY);
        profY += 10;
        doc.text(`${professional.postalCode || ''} ${professional.city || ''} (${professional.province || ''})`, leftCol, profY);
        profY += 10;
        doc.text(`Tel: ${professional.phone || 'Non specificato'}`, leftCol, profY);
        profY += 10;
        doc.text(`Email: ${professional.email || 'Non specificata'}`, leftCol, profY);
        profY += 10;
        if (professional.partitaIva) {
          doc.text(`P.IVA: ${professional.partitaIva}`, leftCol, profY);
        }
      }

      // Box Cliente (DESTRA) - COMPATTO
      const client = quote.request?.client;
      if (client) {
        doc.fontSize(11).text('CLIENTE', rightCol, currentY, { underline: true });
        let clientY = currentY + 16;
        doc.fontSize(9);
        doc.text(`${client.fullName || `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'N/A'}`, rightCol, clientY);
        clientY += 10;
        if (client.ragioneSociale) {
          doc.text(client.ragioneSociale, rightCol, clientY);
          clientY += 10;
        }
        doc.text(`${client.address || 'Indirizzo non specificato'}`, rightCol, clientY);
        clientY += 10;
        doc.text(`${client.postalCode || ''} ${client.city || ''} (${client.province || ''})`, rightCol, clientY);
        clientY += 10;
        doc.text(`Tel: ${client.phone || 'Non specificato'}`, rightCol, clientY);
        clientY += 10;
        doc.text(`Email: ${client.email || 'Non specificata'}`, rightCol, clientY);
        clientY += 10;
        if (client.codiceFiscale) {
          doc.text(`CF: ${client.codiceFiscale}`, rightCol, clientY);
          clientY += 10;
        }
        if (client.partitaIva) {
          doc.text(`P.IVA: ${client.partitaIva}`, rightCol, clientY);
        }
      }

      // Sposta il cursore sotto entrambe le colonne - MOLTO COMPATTO
      doc.y = currentY + 80; // Drasticamente ridotto da 100
      doc.moveDown(0.2); // Ridotto da 0.3

      // LAYOUT A DUE COLONNE: SERVIZIO RICHIESTO (sx) e DESCRIZIONE LAVORO (dx)
      const contentY = doc.y;
      const leftContentCol = 40;   // Ridotto da 50
      const rightContentCol = 290; // Ridotto da 300

      // SERVIZIO RICHIESTO (SINISTRA) - COMPATTO
      if (quote.request) {
        doc.fontSize(11).text('SERVIZIO RICHIESTO', leftContentCol, contentY, { underline: true });
        let serviceY = contentY + 16;
        doc.fontSize(9);
        
        doc.text(`Richiesta N°: ${quote.request.id.slice(0, 8).toUpperCase()}`, leftContentCol, serviceY);
        serviceY += 12; // Ridotto da 15
        
        doc.text(`Categoria: ${quote.request.category?.name || 'Non specificata'}`, leftContentCol, serviceY, { width: 220 });
        serviceY += 12;
        if (quote.request.subcategory) {
          doc.text(`Sottocategoria: ${quote.request.subcategory.name}`, leftContentCol, serviceY, { width: 220 });
          serviceY += 12;
        }
        doc.text(`Titolo: ${quote.request.title}`, leftContentCol, serviceY, { width: 220 });
      }

      // DESCRIZIONE LAVORO (DESTRA) - COMPATTO
      doc.fontSize(11).text('DESCRIZIONE LAVORO', rightContentCol, contentY, { underline: true });
      let workY = contentY + 16;
      doc.fontSize(9);
      doc.text(quote.title, rightContentCol, workY, { width: 220 });
      workY += 12;
      if (quote.description) {
        doc.text(quote.description, rightContentCol, workY, { width: 220 });
      }

      // Sposta il cursore sotto entrambe le sezioni - SUPER COMPATTO
      doc.y = contentY + 70; // Drasticamente ridotto da 100
      doc.moveDown(0.2);

      // DETTAGLIO PREVENTIVO - COMPATTO
      doc.fontSize(11).text('DETTAGLIO PREVENTIVO', { underline: true });
      doc.moveDown(0.2);

      // Header tabella - COMPATTO
      const tableTop = doc.y;
      const descCol = 40; // Ridotto da 50
      const qtyCol = 280; // Ridotto da 300
      const unitCol = 320; // Ridotto da 350
      const priceCol = 370; // Ridotto da 400
      const totalCol = 450; // Ridotto da 470

      doc.fontSize(9); // Ridotto da 10
      doc.text('Descrizione', descCol, tableTop);
      doc.text('Q.tà', qtyCol, tableTop);
      doc.text('Unità', unitCol, tableTop);
      doc.text('Prezzo Unit.', priceCol, tableTop);
      doc.text('Totale', totalCol, tableTop);

      // Linea sotto header
      doc.moveTo(40, tableTop + 12) // Ridotto da 15
         .lineTo(530, tableTop + 12) // Ridotto larghezza
         .stroke();

      // Items - COMPATTO
      let y = tableTop + 18; // Ridotto da 25
      if (quote.items && quote.items.length > 0) {
        quote.items.forEach((item: any) => {
          const description = item.description.length > 45 
            ? item.description.substring(0, 42) + '...' 
            : item.description;
          
          doc.text(description, descCol, y, { width: 220 });
          doc.text(item.quantity.toString(), qtyCol, y);
          doc.text(item.unit || 'pz', unitCol, y);
          doc.text(`€ ${(item.unitPrice / 100).toFixed(2)}`, priceCol, y);
          doc.text(`€ ${(item.totalPrice / 100).toFixed(2)}`, totalCol, y);
          y += 16; // Ridotto da 20
        });
      }

      doc.y = y + 3; // Ridotto da 5

      // Riepilogo totali - COMPATTO
      const rightAlign = 350; // Ridotto da 380
      const valueAlign = 450; // Ridotto da 470

      doc.fontSize(9);
      
      const subtotal = quote.totalAmount || 0;
      doc.text('Subtotale:', rightAlign, doc.y);
      doc.text(`€ ${(subtotal / 100).toFixed(2)}`, valueAlign, doc.y - 8);
      
      let taxAmount = 0;
      if (quote.items && quote.items.length > 0) {
        taxAmount = quote.items.reduce((sum: number, item: any) => sum + (item.taxAmount || 0), 0);
      }
      if (taxAmount > 0) {
        doc.text('IVA (22%):', rightAlign, doc.y);
        doc.text(`€ ${(taxAmount / 100).toFixed(2)}`, valueAlign, doc.y - 8);
      }
      
      doc.moveTo(rightAlign, doc.y)
         .lineTo(530, doc.y)
         .stroke();
      
      doc.moveDown(0.2);
      
      const totalAmount = subtotal + taxAmount;
      doc.fontSize(11).text('TOTALE:', rightAlign, doc.y);
      doc.text(`€ ${(totalAmount / 100).toFixed(2)}`, valueAlign, doc.y - 10);
      
      if (quote.depositRequired && quote.depositAmount) {
        doc.moveDown(0.3);
        doc.fontSize(9);
        doc.text('Deposito richiesto:', rightAlign, doc.y);
        doc.text(`€ ${(quote.depositAmount / 100).toFixed(2)}`, valueAlign, doc.y - 8);
      }

      // NOTE E CONDIZIONI - ULTRA COMPATTO
      doc.moveDown(0.5);
      const leftNotesCol = 40;

      // Note - solo se ci sono e ultra compatte
      if (quote.notes) {
        doc.fontSize(10).text('NOTE', leftNotesCol, doc.y, { underline: true });
        doc.moveDown(0.1);
        doc.fontSize(8).text(quote.notes, leftNotesCol, doc.y, { width: 480 }); // Ridotto font
        doc.moveDown(0.3);
      }

      // Termini e condizioni - solo se ci sono e ultra compatti
      if (quote.termsConditions) {
        doc.fontSize(10).text('TERMINI E CONDIZIONI', leftNotesCol, doc.y, { underline: true });
        doc.moveDown(0.1);
        doc.fontSize(8).text(quote.termsConditions, leftNotesCol, doc.y, { width: 480 });
      }

      // Footer
      const bottomY = doc.page.height - 40;
      doc.fontSize(7).text(
        `Preventivo generato il ${new Date().toLocaleDateString('it-IT')} - Versione ${quote.version}`,
        40,
        bottomY,
        { align: 'center', width: doc.page.width - 80 }
      );

      // Finalizza il PDF
      doc.end();

      // Aspetta che lo stream finisca di scrivere
      await new Promise<void>((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
      });

      logger.info(`PDF generated successfully: ${filePath}`);

      return filePath;
    } catch (error) {
      logger.error('Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Genera PDF per una richiesta di assistenza
   */
  async generateRequestPDF(requestId: string): Promise<string> {
    try {
      logger.info(`Generating PDF for request: ${requestId}`);
      
      // Ottieni i dati della richiesta
      const rawRequest = await prisma.assistanceRequest.findUnique({
        where: { id: requestId },
        include: {
          User_AssistanceRequest_clientIdToUser: true,
          User_AssistanceRequest_professionalIdToUser: true,
          Category: true,
          Subcategory: true,
          RequestAttachment: true
        }
      });

      if (!rawRequest) {
        throw new AppError('Request not found', 404);
      }

      // ✅ USA RESPONSEFORMATTER come da istruzioni progetto
      const request = formatAssistanceRequest(rawRequest);
      console.log('PDF Service - Formatted request:', request);

      const fileName = `richiesta-${requestId.slice(0, 8)}.pdf`;
      const filePath = path.join(this.uploadsDir, fileName);

      // Crea PDF
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc.fontSize(16).text('Sistema Richiesta Assistenza', { align: 'center' });
      doc.fontSize(10).text('Gestione servizi professionali', { align: 'center' });
      doc.moveDown(2);

      // Titolo
      doc.fontSize(20).text('RICHIESTA DI ASSISTENZA', { align: 'center' });
      doc.fontSize(14).text(`N° ${requestId.slice(0, 8).toUpperCase()}`, { align: 'center' });
      doc.moveDown();

      // Data creazione
      doc.fontSize(10);
      doc.text(`Data creazione: ${new Date(request.createdAt).toLocaleDateString('it-IT')}`, { align: 'right' });
      doc.moveDown(2);

      // Informazioni cliente
      const client = request.client;
      if (client) {
        doc.fontSize(12).text('CLIENTE', { underline: true });
        doc.fontSize(10);
        doc.text(`Nome: ${client.firstName} ${client.lastName}`);
        doc.text(`Email: ${client.email}`);
        doc.text(`Telefono: ${client.phone}`);
        doc.text(`Indirizzo: ${client.address}`);
        doc.text(`Città: ${client.city} (${client.province}) - ${client.postalCode}`);
        doc.moveDown();
      }

      // Dettagli richiesta
      doc.fontSize(12).text('DETTAGLI RICHIESTA', { underline: true });
      doc.fontSize(10);
      doc.text(`Titolo: ${request.title}`);
      doc.text(`Categoria: ${request.category?.name || 'Non specificata'}`);
      if (request.subcategory) {
        doc.text(`Sottocategoria: ${request.subcategory.name}`);
      }
      doc.text(`Priorità: ${request.priority || 'Non specificata'}`);
      doc.text(`Stato: ${request.status}`);
      doc.moveDown();

      // Descrizione
      if (request.description) {
        doc.fontSize(12).text('DESCRIZIONE', { underline: true });
        doc.fontSize(10).text(request.description);
        doc.moveDown();
      }

      // Indirizzo intervento
      doc.fontSize(12).text('LUOGO INTERVENTO', { underline: true });
      doc.fontSize(10);
      doc.text(`Indirizzo: ${request.address || 'Non specificato'}`);
      doc.text(`Città: ${request.city || 'Non specificata'} (${request.province || ''}) - ${request.postalCode || ''}`);
      doc.moveDown();

      // Data richiesta intervento
      if (request.requestedDate) {
        doc.text(`Data richiesta intervento: ${new Date(request.requestedDate).toLocaleDateString('it-IT')}`);
        doc.moveDown();
      }

      // Professionista assegnato
      const professional = request.professional;
      if (professional) {
        doc.fontSize(12).text('PROFESSIONISTA ASSEGNATO', { underline: true });
        doc.fontSize(10);
        doc.text(`Nome: ${professional.firstName} ${professional.lastName}`);
        doc.text(`Email: ${professional.email}`);
        doc.text(`Telefono: ${professional.phone}`);
        if (professional.profession) {
          doc.text(`Professione: ${professional.profession}`);
        }
        doc.moveDown();
      }

      // Allegati
      if (request.attachments && request.attachments.length > 0) {
        doc.fontSize(12).text('ALLEGATI', { underline: true });
        doc.fontSize(10);
        request.attachments.forEach((attachment: any) => {
          doc.text(`• ${attachment.originalName} (${Math.round(attachment.fileSize / 1024)} KB)`);
        });
        doc.moveDown();
      }

      // Footer
      const bottomY = doc.page.height - 50;
      doc.fontSize(8);
      doc.text(
        `Richiesta generata il ${new Date().toLocaleDateString('it-IT')}`,
        50,
        bottomY,
        { align: 'center', width: doc.page.width - 100 }
      );

      doc.end();

      await new Promise<void>((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
      });

      logger.info(`Request PDF generated successfully: ${filePath}`);
      return filePath;
    } catch (error) {
      logger.error('Error generating request PDF:', error);
      throw error;
    }
  }

  /**
   * Genera PDF per confronto preventivi
   */
  async generateComparisonPDF(requestId: string): Promise<string> {
    try {
      const rawQuotes = await prisma.quote.findMany({
        where: { 
          requestId,
          status: { in: ['PENDING', 'ACCEPTED'] }
        },
        include: {
          QuoteItem: { orderBy: { order: 'asc' } },
          User: true
        },
        orderBy: { amount: 'asc' }
      });

      if (rawQuotes.length === 0) {
        throw new AppError('No quotes found for comparison', 404);
      }

      // Usa il ResponseFormatter per ogni quote
      const quotes = rawQuotes.map(formatQuote);

      const fileName = `confronto-preventivi-${requestId}.pdf`;
      const filePath = path.join(this.uploadsDir, fileName);

      const doc = new PDFDocument({ margin: 50, layout: 'landscape' });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Titolo
      doc.fontSize(18).text('CONFRONTO PREVENTIVI', { align: 'center' });
      doc.moveDown();

      // Tabella comparativa semplificata
      doc.fontSize(12).text('Riepilogo Preventivi:', { underline: true });
      doc.moveDown();

      quotes.forEach((quote: any, index: number) => {
        doc.fontSize(11).text(`${index + 1}. ${quote.professional?.fullName || 'Professionista'}`);
        doc.fontSize(10);
        doc.text(`   Totale: € ${((quote.totalAmount || 0) / 100).toFixed(2)}`);
        doc.text(`   Voci: ${quote.items?.length || 0}`);
        doc.text(`   Stato: ${quote.status === 'ACCEPTED' ? 'ACCETTATO' : 'IN ATTESA'}`);
        if (quote.validUntil) {
          doc.text(`   Valido fino: ${new Date(quote.validUntil).toLocaleDateString('it-IT')}`);
        }
        doc.moveDown();
      });

      doc.end();

      await new Promise<void>((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
      });

      return filePath;
    } catch (error) {
      logger.error('Error generating comparison PDF:', error);
      throw error;
    }
  }

  /**
   * Elimina un file PDF
   */
  async deletePDF(fileName: string): Promise<void> {
    const filePath = path.join(this.uploadsDir, fileName);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`Deleted PDF: ${filePath}`);
    }
  }

  /**
   * Ottieni path del PDF
   */
  getPDFPath(fileName: string): string {
    return path.join(this.uploadsDir, fileName);
  }
}

export const pdfService = new PDFService();
