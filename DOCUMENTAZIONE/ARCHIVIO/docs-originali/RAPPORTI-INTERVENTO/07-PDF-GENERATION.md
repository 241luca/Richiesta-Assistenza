# 📋 FASE 7 - PDF GENERATION & EXPORT

## OBIETTIVO
Implementare la generazione PDF professionale dei rapporti con template personalizzabili.

## DURATA STIMATA: 12 ore

---

## 📁 STRUTTURA FILE DA CREARE

```
backend/
├── src/
│   ├── services/
│   │   └── reports/
│   │       ├── pdf-generator.service.ts    # Generazione PDF
│   │       ├── pdf-templates.service.ts    # Template PDF
│   │       └── export.service.ts           # Export dati
│   └── utils/
│       └── pdf/
│           ├── pdf-builder.ts              # Builder PDF
│           ├── pdf-styles.ts               # Stili PDF
│           └── pdf-components.ts           # Componenti PDF
│
└── templates/
    └── pdf/
        ├── default.hbs                      # Template default
        ├── professional.hbs                 # Template professional
        ├── minimal.hbs                      # Template minimale
        └── components/
            ├── header.hbs                   # Header template
            ├── footer.hbs                   # Footer template
            ├── signature.hbs                # Firma template
            └── materials.hbs                # Materiali template
```

---

## STEP 7.1 - SERVIZIO GENERAZIONE PDF (6 ore)

### Creare `backend/src/services/reports/pdf-generator.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import * as fs from 'fs-extra';
import * as path from 'path';
import { PrismaService } from '@/services/prisma.service';
import { ConfigService } from '@/services/config.service';
import { StorageService } from '@/services/storage.service';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface PdfOptions {
  templateName?: string;
  format?: 'A4' | 'A3' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  printBackground?: boolean;
  preferCSSPageSize?: boolean;
}

@Injectable()
export class PdfGeneratorService {
  private browser: puppeteer.Browser | null = null;
  private compiledTemplates = new Map<string, handlebars.TemplateDelegate>();

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private storage: StorageService
  ) {
    this.initializeHandlebars();
  }

  /**
   * Inizializza Handlebars con helpers personalizzati
   */
  private initializeHandlebars() {
    // Helper per formattazione date
    handlebars.registerHelper('formatDate', (date: Date | string, formatStr: string = 'dd/MM/yyyy') => {
      if (!date) return '';
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, formatStr, { locale: it });
    });

    // Helper per formattazione valuta
    handlebars.registerHelper('currency', (amount: number) => {
      if (amount === null || amount === undefined) return '€ 0,00';
      return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR'
      }).format(amount);
    });

    // Helper per calcolo IVA
    handlebars.registerHelper('calculateVat', (amount: number, vatRate: number = 22) => {
      const vat = amount * (vatRate / 100);
      return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR'
      }).format(vat);
    });

    // Helper per totale con IVA
    handlebars.registerHelper('totalWithVat', (amount: number, vatRate: number = 22) => {
      const total = amount * (1 + vatRate / 100);
      return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR'
      }).format(total);
    });

    // Helper condizionali
    handlebars.registerHelper('ifEquals', function(arg1: any, arg2: any, options: any) {
      return arg1 === arg2 ? options.fn(this) : options.inverse(this);
    });

    handlebars.registerHelper('ifNotEquals', function(arg1: any, arg2: any, options: any) {
      return arg1 !== arg2 ? options.fn(this) : options.inverse(this);
    });

    // Helper per status badge
    handlebars.registerHelper('statusBadge', (status: string) => {
      const badges = {
        draft: '<span class="badge badge-gray">Bozza</span>',
        completed: '<span class="badge badge-green">Completato</span>',
        signed: '<span class="badge badge-purple">Firmato</span>',
        sent: '<span class="badge badge-blue">Inviato</span>',
        disputed: '<span class="badge badge-red">Contestato</span>'
      };
      return new handlebars.SafeString(badges[status] || status);
    });

    // Helper per base64 immagini
    handlebars.registerHelper('base64Image', (imagePath: string) => {
      try {
        if (imagePath.startsWith('data:')) return imagePath;
        const fullPath = path.join(process.cwd(), 'uploads', imagePath);
        const imageBuffer = fs.readFileSync(fullPath);
        const base64 = imageBuffer.toString('base64');
        const mimeType = path.extname(imagePath).slice(1);
        return `data:image/${mimeType};base64,${base64}`;
      } catch (error) {
        console.error('Error loading image:', error);
        return '';
      }
    });
  }

  /**
   * Inizializza browser Puppeteer
   */
  private async initBrowser(): Promise<puppeteer.Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  /**
   * Compila template Handlebars
   */
  private async compileTemplate(templateName: string): Promise<handlebars.TemplateDelegate> {
    if (!this.compiledTemplates.has(templateName)) {
      const templatePath = path.join(
        process.cwd(),
        'templates',
        'pdf',
        `${templateName}.hbs`
      );
      
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const compiled = handlebars.compile(templateContent);
      this.compiledTemplates.set(templateName, compiled);
    }
    
    return this.compiledTemplates.get(templateName)!;
  }

  /**
   * Genera PDF da rapporto
   */
  async generateReportPdf(
    reportId: string, 
    options: PdfOptions = {}
  ): Promise<Buffer> {
    try {
      // Carica dati rapporto con relazioni
      const report = await this.prisma.interventionReport.findUnique({
        where: { id: reportId },
        include: {
          request: {
            include: {
              client: true,
              category: true,
              subcategory: true
            }
          },
          professional: {
            include: {
              professionalReportSettings: true
            }
          },
          template: {
            include: {
              fields: true
            }
          },
          type: true,
          status: true
        }
      });

      if (!report) {
        throw new Error('Report not found');
      }

      // Prepara dati per template
      const templateData = await this.prepareTemplateData(report);

      // Determina template da usare
      const templateName = options.templateName || 
        report.professional.professionalReportSettings?.pdfTemplate || 
        'default';

      // Compila template
      const template = await this.compileTemplate(templateName);
      const html = template(templateData);

      // Genera CSS
      const css = await this.generateCss(templateName);

      // Genera PDF con Puppeteer
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      // Set content
      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>${css}</style>
        </head>
        <body>
          ${html}
        </body>
        </html>
      `, { waitUntil: 'networkidle0' });

      // Generate PDF
      const pdf = await page.pdf({
        format: options.format || 'A4',
        orientation: options.orientation || 'portrait',
        margin: options.margin || {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        displayHeaderFooter: options.displayHeaderFooter ?? true,
        headerTemplate: options.headerTemplate || this.getDefaultHeader(),
        footerTemplate: options.footerTemplate || this.getDefaultFooter(),
        printBackground: options.printBackground ?? true,
        preferCSSPageSize: options.preferCSSPageSize ?? false
      });

      await page.close();

      // Log generazione
      await this.logPdfGeneration(reportId, templateName);

      return pdf;
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  /**
   * Prepara dati per template
   */
  private async prepareTemplateData(report: any): Promise<any> {
    // Carica configurazione globale
    const config = await this.prisma.interventionReportConfig.findFirst();

    // Carica materiali con totali
    const materials = report.formData?.materials || [];
    const materialsTotal = materials.reduce((sum: number, m: any) => 
      sum + (m.totalPrice || 0), 0
    );
    const materialsVatTotal = materials.reduce((sum: number, m: any) => 
      sum + (m.totalWithVat || 0), 0
    );

    // Prepara foto organizzate per tipo
    const photosByType = {
      prima: [],
      durante: [],
      dopo: []
    };
    
    if (report.photos) {
      report.photos.forEach((photo: any) => {
        if (photosByType[photo.type]) {
          photosByType[photo.type].push(photo);
        }
      });
    }

    // Dati professionista
    const professionalSettings = report.professional.professionalReportSettings;
    const businessData = {
      name: professionalSettings?.businessName || report.professional.fullName,
      logo: professionalSettings?.businessLogo,
      address: professionalSettings?.businessAddress || report.professional.address,
      phone: professionalSettings?.businessPhone || report.professional.phone,
      email: professionalSettings?.businessEmail || report.professional.email,
      website: professionalSettings?.businessWebsite,
      vatNumber: professionalSettings?.vatNumber || report.professional.partitaIva,
      fiscalCode: professionalSettings?.fiscalCode || report.professional.codiceFiscale
    };

    return {
      // Configurazione
      config,
      
      // Report data
      report: {
        ...report,
        formattedNumber: report.reportNumber,
        formattedDate: format(new Date(report.interventionDate), 'dd MMMM yyyy', { locale: it }),
        formattedStartTime: report.startTime,
        formattedEndTime: report.endTime,
        formattedTotalHours: `${report.totalHours || 0}h`
      },
      
      // Request data
      request: report.request,
      
      // Client data
      client: {
        ...report.request.client,
        fullAddress: `${report.request.address}, ${report.request.postalCode} ${report.request.city} (${report.request.province})`
      },
      
      // Professional data
      professional: report.professional,
      business: businessData,
      
      // Materials
      materials,
      materialsTotal,
      materialsVatTotal,
      hasMaterials: materials.length > 0,
      
      // Photos
      photos: report.photos || [],
      photosByType,
      hasPhotos: report.photos?.length > 0,
      
      // Signatures
      signatures: report.signatures || {},
      isSigned: !!report.clientSignedAt,
      professionalSignature: report.signatures?.professional,
      clientSignature: report.signatures?.client,
      
      // Timestamps
      generatedAt: format(new Date(), 'dd/MM/yyyy HH:mm', { locale: it }),
      
      // Metadata
      qrCode: await this.generateQrCode(report.id),
      barcode: await this.generateBarcode(report.reportNumber)
    };
  }

  /**
   * Genera CSS per PDF
   */
  private async generateCss(templateName: string): Promise<string> {
    const cssPath = path.join(
      process.cwd(),
      'templates',
      'pdf',
      'styles',
      `${templateName}.css`
    );

    // CSS base sempre incluso
    const baseCss = `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Helvetica', 'Arial', sans-serif;
        font-size: 10pt;
        line-height: 1.5;
        color: #333;
      }

      .page {
        page-break-after: always;
      }

      .page:last-child {
        page-break-after: auto;
      }

      h1 { font-size: 20pt; margin-bottom: 10pt; }
      h2 { font-size: 16pt; margin-bottom: 8pt; }
      h3 { font-size: 14pt; margin-bottom: 6pt; }
      h4 { font-size: 12pt; margin-bottom: 4pt; }

      table {
        width: 100%;
        border-collapse: collapse;
        margin: 10pt 0;
      }

      th, td {
        padding: 5pt;
        text-align: left;
        border-bottom: 1pt solid #ddd;
      }

      th {
        background-color: #f5f5f5;
        font-weight: bold;
      }

      .text-right { text-align: right; }
      .text-center { text-align: center; }
      .font-bold { font-weight: bold; }
      .mt-1 { margin-top: 5pt; }
      .mt-2 { margin-top: 10pt; }
      .mt-3 { margin-top: 15pt; }
      .mb-1 { margin-bottom: 5pt; }
      .mb-2 { margin-bottom: 10pt; }
      .mb-3 { margin-bottom: 15pt; }

      .badge {
        display: inline-block;
        padding: 2pt 6pt;
        border-radius: 3pt;
        font-size: 8pt;
        font-weight: bold;
      }

      .badge-gray { background: #e5e7eb; color: #6b7280; }
      .badge-green { background: #d1fae5; color: #065f46; }
      .badge-blue { background: #dbeafe; color: #1e40af; }
      .badge-purple { background: #ede9fe; color: #6d28d9; }
      .badge-red { background: #fee2e2; color: #b91c1c; }

      .signature-box {
        border: 1pt solid #ddd;
        padding: 10pt;
        margin: 10pt 0;
        min-height: 80pt;
      }

      .signature-img {
        max-height: 60pt;
        display: block;
        margin: 0 auto;
      }

      .photo-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 10pt;
      }

      .photo-item {
        width: calc(33.333% - 10pt);
      }

      .photo-item img {
        width: 100%;
        height: auto;
        border: 1pt solid #ddd;
      }

      @media print {
        .no-print { display: none !important; }
      }
    `;

    // Prova a caricare CSS specifico del template
    let templateCss = '';
    if (await fs.pathExists(cssPath)) {
      templateCss = await fs.readFile(cssPath, 'utf-8');
    }

    return baseCss + templateCss;
  }

  /**
   * Header predefinito PDF
   */
  private getDefaultHeader(): string {
    return `
      <div style="font-size: 8pt; padding: 0 15mm; width: 100%; display: flex; justify-content: space-between;">
        <span>Rapporto di Intervento</span>
        <span></span>
        <span>Pagina <span class="pageNumber"></span> di <span class="totalPages"></span></span>
      </div>
    `;
  }

  /**
   * Footer predefinito PDF
   */
  private getDefaultFooter(): string {
    return `
      <div style="font-size: 7pt; padding: 0 15mm; width: 100%; text-align: center; color: #666;">
        Documento generato automaticamente il <span>${format(new Date(), 'dd/MM/yyyy HH:mm')}</span>
      </div>
    `;
  }

  /**
   * Genera QR Code
   */
  private async generateQrCode(reportId: string): Promise<string> {
    const QRCode = require('qrcode');
    const url = `${this.config.get('APP_URL')}/reports/view/${reportId}`;
    
    try {
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 100,
        margin: 1
      });
      return qrDataUrl;
    } catch (error) {
      console.error('QR Code generation error:', error);
      return '';
    }
  }

  /**
   * Genera Barcode
   */
  private async generateBarcode(reportNumber: string): Promise<string> {
    const bwipjs = require('bwip-js');
    
    try {
      const png = await bwipjs.toBuffer({
        bcid: 'code128',
        text: reportNumber,
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: 'center'
      });
      
      return `data:image/png;base64,${png.toString('base64')}`;
    } catch (error) {
      console.error('Barcode generation error:', error);
      return '';
    }
  }

  /**
   * Log generazione PDF
   */
  private async logPdfGeneration(reportId: string, templateName: string): Promise<void> {
    await this.prisma.interventionReport.update({
      where: { id: reportId },
      data: {
        pdfGeneratedAt: new Date(),
        metadata: {
          lastPdfTemplate: templateName,
          lastPdfGeneratedAt: new Date().toISOString()
        }
      }
    });
  }

  /**
   * Cleanup browser
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
```

---

## STEP 7.2 - TEMPLATE PDF HANDLEBARS (4 ore)

### Creare `backend/templates/pdf/default.hbs`:

```handlebars
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <title>Rapporto Intervento {{report.reportNumber}}</title>
</head>
<body>
  <div class="page">
    {{!-- Header --}}
    <header>
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20pt;">
        <div>
          {{#if business.logo}}
            <img src="{{base64Image business.logo}}" alt="Logo" style="max-height: 60pt;">
          {{else}}
            <h1>{{business.name}}</h1>
          {{/if}}
        </div>
        
        <div style="text-align: right;">
          <h2>RAPPORTO DI INTERVENTO</h2>
          <p style="font-size: 14pt; font-weight: bold; color: #1e40af;">
            N° {{report.reportNumber}}
          </p>
          <p>{{report.formattedDate}}</p>
        </div>
      </div>

      <div style="border-top: 2pt solid #1e40af; margin: 10pt 0;"></div>
    </header>

    {{!-- Informazioni Professionista --}}
    <section>
      <h3>Professionista</h3>
      <table style="width: 100%;">
        <tr>
          <td style="width: 50%;">
            <strong>{{professional.fullName}}</strong><br>
            {{#if professional.profession}}{{professional.profession}}<br>{{/if}}
            {{business.address}}<br>
            Tel: {{business.phone}}<br>
            Email: {{business.email}}
          </td>
          <td style="width: 50%; text-align: right;">
            {{#if business.vatNumber}}P.IVA: {{business.vatNumber}}<br>{{/if}}
            {{#if business.fiscalCode}}C.F.: {{business.fiscalCode}}<br>{{/if}}
            {{#if business.website}}Web: {{business.website}}{{/if}}
          </td>
        </tr>
      </table>
    </section>

    {{!-- Informazioni Cliente --}}
    <section style="margin-top: 15pt;">
      <h3>Cliente</h3>
      <table style="width: 100%; background: #f9f9f9; padding: 10pt;">
        <tr>
          <td style="width: 50%;">
            <strong>{{client.fullName}}</strong><br>
            {{#if client.ragioneSociale}}{{client.ragioneSociale}}<br>{{/if}}
            {{client.fullAddress}}
          </td>
          <td style="width: 50%;">
            Tel: {{client.phone}}<br>
            Email: {{client.email}}<br>
            {{#if client.codiceFiscale}}C.F.: {{client.codiceFiscale}}{{/if}}
            {{#if client.partitaIva}}P.IVA: {{client.partitaIva}}{{/if}}
          </td>
        </tr>
      </table>
    </section>

    {{!-- Dettagli Intervento --}}
    <section style="margin-top: 15pt;">
      <h3>Dettagli Intervento</h3>
      <table>
        <tr>
          <td style="width: 25%;"><strong>Data:</strong></td>
          <td style="width: 25%;">{{report.formattedDate}}</td>
          <td style="width: 25%;"><strong>Orario:</strong></td>
          <td style="width: 25%;">{{report.formattedStartTime}} - {{report.formattedEndTime}}</td>
        </tr>
        <tr>
          <td><strong>Durata:</strong></td>
          <td>{{report.formattedTotalHours}}</td>
          <td><strong>Tipo:</strong></td>
          <td>{{report.type.name}}</td>
        </tr>
        <tr>
          <td><strong>Categoria:</strong></td>
          <td>{{request.category.name}}</td>
          <td><strong>Sottocategoria:</strong></td>
          <td>{{request.subcategory.name}}</td>
        </tr>
      </table>
    </section>

    {{!-- Problema Riscontrato --}}
    {{#if report.formData.problemDescription}}
    <section style="margin-top: 15pt;">
      <h3>Problema Riscontrato</h3>
      <div style="background: #fff3cd; padding: 10pt; border-left: 3pt solid #ffc107;">
        {{report.formData.problemDescription}}
      </div>
    </section>
    {{/if}}

    {{!-- Lavoro Eseguito --}}
    {{#if report.formData.workPerformed}}
    <section style="margin-top: 15pt;">
      <h3>Lavoro Eseguito</h3>
      <div style="background: #d1fae5; padding: 10pt; border-left: 3pt solid #10b981;">
        {{report.formData.workPerformed}}
      </div>
    </section>
    {{/if}}

    {{!-- Materiali Utilizzati --}}
    {{#if hasMaterials}}
    <section style="margin-top: 15pt; page-break-inside: avoid;">
      <h3>Materiali Utilizzati</h3>
      <table>
        <thead>
          <tr>
            <th>Codice</th>
            <th>Descrizione</th>
            <th class="text-center">Q.tà</th>
            <th class="text-center">UM</th>
            <th class="text-right">Prezzo Unit.</th>
            <th class="text-right">Totale</th>
          </tr>
        </thead>
        <tbody>
          {{#each materials}}
          <tr>
            <td>{{this.code}}</td>
            <td>{{this.name}}</td>
            <td class="text-center">{{this.quantity}}</td>
            <td class="text-center">{{this.unit}}</td>
            <td class="text-right">{{currency this.unitPrice}}</td>
            <td class="text-right">{{currency this.totalPrice}}</td>
          </tr>
          {{/each}}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="5" class="text-right font-bold">Totale Imponibile:</td>
            <td class="text-right font-bold">{{currency materialsTotal}}</td>
          </tr>
          <tr>
            <td colspan="5" class="text-right font-bold">Totale con IVA:</td>
            <td class="text-right font-bold" style="font-size: 12pt;">{{currency materialsVatTotal}}</td>
          </tr>
        </tfoot>
      </table>
    </section>
    {{/if}}

    {{!-- Note e Raccomandazioni --}}
    {{#if report.clientNotes}}
    <section style="margin-top: 15pt;">
      <h3>Note e Raccomandazioni</h3>
      <div style="background: #f0f9ff; padding: 10pt; border-left: 3pt solid #3b82f6;">
        {{report.clientNotes}}
      </div>
    </section>
    {{/if}}

    {{!-- Follow-up --}}
    {{#if report.followUpRequired}}
    <section style="margin-top: 15pt;">
      <h3 style="color: #dc2626;">⚠ Follow-up Richiesto</h3>
      <div style="background: #fee2e2; padding: 10pt; border-left: 3pt solid #dc2626;">
        {{report.followUpNotes}}
      </div>
    </section>
    {{/if}}

    {{!-- Firme --}}
    <section style="margin-top: 30pt;">
      <h3>Firme</h3>
      <table style="width: 100%;">
        <tr>
          <td style="width: 45%;">
            <div class="signature-box">
              <p class="mb-2"><strong>Il Professionista</strong></p>
              {{#if professionalSignature}}
                <img src="{{professionalSignature.data}}" class="signature-img" alt="Firma Professionista">
                <p style="font-size: 8pt; text-align: center; margin-top: 5pt;">
                  Firmato il {{formatDate professionalSignature.timestamp 'dd/MM/yyyy HH:mm'}}
                </p>
              {{else}}
                <div style="height: 60pt;"></div>
                <p style="border-top: 1pt solid #333; margin-top: 30pt; padding-top: 5pt;">
                  {{professional.fullName}}
                </p>
              {{/if}}
            </div>
          </td>
          <td style="width: 10%;"></td>
          <td style="width: 45%;">
            <div class="signature-box">
              <p class="mb-2"><strong>Il Cliente</strong></p>
              {{#if clientSignature}}
                <img src="{{clientSignature.data}}" class="signature-img" alt="Firma Cliente">
                <p style="font-size: 8pt; text-align: center; margin-top: 5pt;">
                  Firmato il {{formatDate clientSignature.timestamp 'dd/MM/yyyy HH:mm'}}
                </p>
              {{else}}
                <div style="height: 60pt;"></div>
                <p style="border-top: 1pt solid #333; margin-top: 30pt; padding-top: 5pt;">
                  {{client.fullName}}
                </p>
              {{/if}}
            </div>
          </td>
        </tr>
      </table>
    </section>

    {{!-- QR Code e Barcode --}}
    <section style="margin-top: 20pt; text-align: center;">
      <table style="width: 100%;">
        <tr>
          <td style="text-align: center;">
            {{#if qrCode}}
              <img src="{{qrCode}}" alt="QR Code" style="width: 80pt;">
              <p style="font-size: 7pt;">Scansiona per visualizzare online</p>
            {{/if}}
          </td>
          <td style="text-align: center;">
            {{#if barcode}}
              <img src="{{barcode}}" alt="Barcode" style="height: 40pt;">
            {{/if}}
          </td>
        </tr>
      </table>
    </section>
  </div>

  {{!-- Pagina Foto (se presenti) --}}
  {{#if hasPhotos}}
  <div class="page">
    <h2>Documentazione Fotografica</h2>
    
    {{#if photosByType.prima}}
    <section style="margin-top: 15pt;">
      <h3>Foto Prima dell'Intervento</h3>
      <div class="photo-grid">
        {{#each photosByType.prima}}
        <div class="photo-item">
          <img src="{{base64Image this.url}}" alt="{{this.caption}}">
          {{#if this.caption}}
          <p style="font-size: 8pt; text-align: center;">{{this.caption}}</p>
          {{/if}}
        </div>
        {{/each}}
      </div>
    </section>
    {{/if}}

    {{#if photosByType.durante}}
    <section style="margin-top: 15pt;">
      <h3>Foto Durante l'Intervento</h3>
      <div class="photo-grid">
        {{#each photosByType.durante}}
        <div class="photo-item">
          <img src="{{base64Image this.url}}" alt="{{this.caption}}">
          {{#if this.caption}}
          <p style="font-size: 8pt; text-align: center;">{{this.caption}}</p>
          {{/if}}
        </div>
        {{/each}}
      </div>
    </section>
    {{/if}}

    {{#if photosByType.dopo}}
    <section style="margin-top: 15pt;">
      <h3>Foto Dopo l'Intervento</h3>
      <div class="photo-grid">
        {{#each photosByType.dopo}}
        <div class="photo-item">
          <img src="{{base64Image this.url}}" alt="{{this.caption}}">
          {{#if this.caption}}
          <p style="font-size: 8pt; text-align: center;">{{this.caption}}</p>
          {{/if}}
        </div>
        {{/each}}
      </div>
    </section>
    {{/if}}
  </div>
  {{/if}}
</body>
</html>
```

---

## ✅ CHECKLIST COMPLETAMENTO FASE 7

### Generazione PDF
- [ ] Servizio PDF generator completo
- [ ] Template Handlebars configurati
- [ ] Helper Handlebars personalizzati
- [ ] Gestione immagini e firme
- [ ] QR Code e Barcode

### Template PDF
- [ ] Template default
- [ ] Template professional
- [ ] Template minimale
- [ ] Template personalizzabili

### Export Dati
- [ ] Export CSV rapporti
- [ ] Export Excel con formattazione
- [ ] Export JSON per backup
- [ ] Export statistiche

### Testing
- [ ] Test generazione PDF
- [ ] Test template multipli
- [ ] Test export formati
- [ ] Test performance

---

## 📝 NOTE PER FASE SUCCESSIVA

La Fase 8 (Testing & Deployment) potrà iniziare con:
- Sistema PDF completo
- Export dati funzionante
- Template personalizzabili

Passare a: `08-TESTING-DEPLOYMENT.md`
