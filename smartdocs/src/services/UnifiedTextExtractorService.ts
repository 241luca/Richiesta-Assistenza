/**
 * UnifiedTextExtractorService.ts
 * 
 * Servizio unificato per l'estrazione di testo da diversi formati di documenti
 * Supporta: PDF, DOC, DOCX, XLS, XLSX, TXT, CSV, RTF, ODT
 * 
 * @author SmartDocs AI
 * @version 2.0.0
 */

import { logger } from '../utils/logger';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import * as xlsx from 'xlsx';
import { AdvancedOCRService, AdvancedOCROptions } from './AdvancedOCRService';

export interface ExtractionResult {
  text: string;
  metadata: {
    pageCount?: number;
    wordCount: number;
    characterCount: number;
    language?: string;
    tables?: any[];
    images?: string[];
    author?: string;
    creationDate?: Date;
    modificationDate?: Date;
    title?: string;
  };
  warnings?: string[];
  structuredData?: any;
}

export class UnifiedTextExtractorService {
  
  private advancedOCR: AdvancedOCRService;
  
  // Mapping dei tipi MIME supportati
  private readonly supportedMimeTypes = new Map<string, string>([
    // PDF
    ['application/pdf', 'pdf'],
    
    // Microsoft Word
    ['application/msword', 'doc'],
    ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx'],
    
    // Microsoft Excel
    ['application/vnd.ms-excel', 'xls'],
    ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'xlsx'],
    
    // Text
    ['text/plain', 'txt'],
    ['text/csv', 'csv'],
    ['text/tab-separated-values', 'tsv'],
    
    // Altri formati
    ['application/rtf', 'rtf'],
    ['text/rtf', 'rtf'],
    ['application/vnd.oasis.opendocument.text', 'odt'],
    ['application/vnd.oasis.opendocument.spreadsheet', 'ods']
  ]);

  constructor() {
    this.advancedOCR = new AdvancedOCRService();
    logger.info('[UnifiedTextExtractor] Service initialized with support for: PDF, DOC, DOCX, XLS, XLSX, TXT, CSV, RTF, ODT');
    logger.info('[UnifiedTextExtractor] Advanced OCR (Docling + PaddleOCR-VL) available');
  }

  /**
   * Metodo principale per estrarre testo da qualsiasi formato supportato
   */
  async extractText(
    buffer: Buffer, 
    mimeType: string, 
    fileName?: string,
    useAdvancedOCR?: boolean
  ): Promise<ExtractionResult> {
    
    logger.info(`[UnifiedTextExtractor] Processing file: ${fileName || 'unknown'}, type: ${mimeType}`);
    
    // Determina il tipo di file
    const fileType = this.getFileType(mimeType, fileName);
    
    if (!fileType) {
      throw new Error(`Formato non supportato: ${mimeType}. Formati supportati: PDF, DOC, DOCX, XLS, XLSX, TXT, CSV`);
    }

    // Chiama il metodo di estrazione appropriato
    switch (fileType) {
      case 'pdf':
        // Se richiesto OCR avanzato, usa Docling/PaddleOCR
        if (useAdvancedOCR) {
          return await this.extractWithAdvancedOCR(buffer, mimeType, fileName || 'document.pdf');
        }
        return await this.extractFromPDF(buffer);
      
      case 'doc':
      case 'docx':
        // Docling è eccellente per DOCX
        if (useAdvancedOCR) {
          return await this.extractWithAdvancedOCR(buffer, mimeType, fileName || 'document.docx', { engine: 'docling' });
        }
        return await this.extractFromWord(buffer, fileType);
      
      case 'xls':
      case 'xlsx':
        return await this.extractFromExcel(buffer, fileType);
      
      case 'txt':
        return this.extractFromText(buffer);
      
      case 'csv':
      case 'tsv':
        return await this.extractFromCSV(buffer, fileType === 'tsv');
      
      case 'rtf':
        return await this.extractFromRTF(buffer);
      
      case 'odt':
      case 'ods':
        return await this.extractFromOpenDocument(buffer, fileType);
      
      default:
        throw new Error(`Tipo di file non gestito: ${fileType}`);
    }
  }

  /**
   * Estrae testo da PDF
   */
  private async extractFromPDF(buffer: Buffer): Promise<ExtractionResult> {
    try {
      logger.info('[UnifiedTextExtractor] Extracting from PDF...');
      
      const data = await pdfParse(buffer);
      
      // Conta le parole
      const wordCount = this.countWords(data.text);
      
      return {
        text: data.text,
        metadata: {
          pageCount: data.numpages,
          wordCount,
          characterCount: data.text.length,
          title: data.info?.Title,
          author: data.info?.Author,
          creationDate: data.info?.CreationDate ? new Date(data.info.CreationDate) : undefined,
          modificationDate: data.info?.ModDate ? new Date(data.info.ModDate) : undefined
        }
      };
      
    } catch (error: any) {
      logger.error('[UnifiedTextExtractor] PDF extraction error:', error);
      throw new Error(`Errore nell'estrazione del PDF: ${error.message}`);
    }
  }

  /**
   * Estrae testo da documenti Word (DOC/DOCX)
   */
  private async extractFromWord(buffer: Buffer, type: string): Promise<ExtractionResult> {
    try {
      logger.info(`[UnifiedTextExtractor] Extracting from Word ${type.toUpperCase()}...`);
      
      // Mammoth gestisce sia DOC che DOCX
      const result = await mammoth.extractRawText({ buffer });
      
      // Estrai anche con opzioni avanzate per metadata
      const resultWithOptions = await mammoth.convertToHtml(
        { buffer },
        {
          includeDefaultStyleMap: true,
          convertImage: mammoth.images.imgElement((image) => {
            return image.read("base64").then((imageBuffer) => {
              return {
                src: "data:" + image.contentType + ";base64," + imageBuffer
              };
            });
          })
        }
      );
      
      const text = result.value;
      const wordCount = this.countWords(text);
      
      // Raccolta warning se presenti
      const warnings = [...result.messages, ...resultWithOptions.messages]
        .filter(msg => msg.type === 'warning')
        .map(msg => msg.message);
      
      // Estrai immagini se presenti
      const images: string[] = [];
      const imgMatches = resultWithOptions.value.match(/<img[^>]+src="([^">]+)"/g);
      if (imgMatches) {
        imgMatches.forEach(match => {
          const srcMatch = match.match(/src="([^">]+)"/);
          if (srcMatch) images.push(srcMatch[1]);
        });
      }
      
      return {
        text,
        metadata: {
          wordCount,
          characterCount: text.length,
          images: images.length > 0 ? images : undefined
        },
        warnings: warnings.length > 0 ? warnings : undefined
      };
      
    } catch (error: any) {
      logger.error('[UnifiedTextExtractor] Word extraction error:', error);
      throw new Error(`Errore nell'estrazione del documento Word: ${error.message}`);
    }
  }

  /**
   * Estrae testo e dati da file Excel (XLS/XLSX)
   */
  private async extractFromExcel(buffer: Buffer, type: string): Promise<ExtractionResult> {
    try {
      logger.info(`[UnifiedTextExtractor] Extracting from Excel ${type.toUpperCase()}...`);
      
      // Leggi il workbook
      const workbook = xlsx.read(buffer, { 
        type: 'buffer',
        cellDates: true,
        cellText: true,
        cellFormula: true
      });
      
      let fullText = '';
      const tables: any[] = [];
      const structuredData: any = {};
      
      // Processa ogni foglio
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        
        // Converti in JSON per dati strutturati
        const jsonData = xlsx.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: '',
          raw: false 
        });
        
        // Salva dati strutturati
        structuredData[sheetName] = jsonData;
        tables.push({
          name: sheetName,
          rows: jsonData.length,
          columns: jsonData[0] ? (jsonData[0] as any[]).length : 0,
          data: jsonData
        });
        
        // Converti in testo per l'analisi semantica
        const sheetText = xlsx.utils.sheet_to_txt(worksheet, {
          blankrows: false,
          skipHidden: true
        });
        
        fullText += `\n\n=== Foglio: ${sheetName} ===\n${sheetText}`;
      });
      
      const wordCount = this.countWords(fullText);
      
      return {
        text: fullText.trim(),
        metadata: {
          wordCount,
          characterCount: fullText.length,
          tables
        },
        structuredData
      };
      
    } catch (error: any) {
      logger.error('[UnifiedTextExtractor] Excel extraction error:', error);
      throw new Error(`Errore nell'estrazione del file Excel: ${error.message}`);
    }
  }

  /**
   * Estrae testo da file di testo semplice
   */
  private extractFromText(buffer: Buffer): ExtractionResult {
    logger.info('[UnifiedTextExtractor] Extracting from plain text...');
    
    const text = buffer.toString('utf-8');
    const wordCount = this.countWords(text);
    
    return {
      text,
      metadata: {
        wordCount,
        characterCount: text.length
      }
    };
  }

  /**
   * Estrae dati da file CSV/TSV
   */
  private async extractFromCSV(buffer: Buffer, isTabSeparated: boolean = false): Promise<ExtractionResult> {
    try {
      logger.info(`[UnifiedTextExtractor] Extracting from ${isTabSeparated ? 'TSV' : 'CSV'}...`);
      
      const text = buffer.toString('utf-8');
      
      // Usa xlsx per parsare CSV/TSV
      const workbook = xlsx.read(buffer, {
        type: 'buffer',
        raw: true,
        FS: isTabSeparated ? '\t' : ','
      });
      
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Converti in JSON per dati strutturati
      const jsonData = xlsx.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
        raw: false 
      });
      
      // Genera testo formattato
      const formattedText = xlsx.utils.sheet_to_txt(worksheet, {
        blankrows: false
      });
      
      const wordCount = this.countWords(formattedText);
      
      return {
        text: formattedText,
        metadata: {
          wordCount,
          characterCount: formattedText.length,
          tables: [{
            name: 'data',
            rows: jsonData.length,
            columns: jsonData[0] ? (jsonData[0] as any[]).length : 0,
            data: jsonData
          }]
        },
        structuredData: jsonData
      };
      
    } catch (error: any) {
      logger.error('[UnifiedTextExtractor] CSV/TSV extraction error:', error);
      
      // Fallback: ritorna il testo grezzo
      const text = buffer.toString('utf-8');
      return {
        text,
        metadata: {
          wordCount: this.countWords(text),
          characterCount: text.length
        },
        warnings: [`Impossibile parsare come ${isTabSeparated ? 'TSV' : 'CSV'}, restituito testo grezzo`]
      };
    }
  }

  /**
   * Estrae testo da file RTF (Rich Text Format)
   */
  private async extractFromRTF(buffer: Buffer): Promise<ExtractionResult> {
    logger.info('[UnifiedTextExtractor] Extracting from RTF...');
    
    // Per RTF possiamo fare un parsing base rimuovendo i tag
    let text = buffer.toString('utf-8');
    
    // Rimuove i tag RTF base (versione semplificata)
    text = text.replace(/\\par[\s]?/g, '\n');
    text = text.replace(/\\\w+\s?/g, '');
    text = text.replace(/[{}]/g, '');
    text = text.trim();
    
    const wordCount = this.countWords(text);
    
    return {
      text,
      metadata: {
        wordCount,
        characterCount: text.length
      },
      warnings: ['Estrazione RTF semplificata - alcuni formati potrebbero essere persi']
    };
  }

  /**
   * Estrae testo da OpenDocument (ODT/ODS)
   */
  private async extractFromOpenDocument(buffer: Buffer, type: string): Promise<ExtractionResult> {
    logger.info(`[UnifiedTextExtractor] Extracting from OpenDocument ${type.toUpperCase()}...`);
    
    // Per ora usa mammoth per ODT (supporto parziale)
    if (type === 'odt') {
      try {
        const result = await mammoth.extractRawText({ buffer });
        const text = result.value;
        
        return {
          text,
          metadata: {
            wordCount: this.countWords(text),
            characterCount: text.length
          },
          warnings: ['Supporto ODT parziale tramite Mammoth']
        };
      } catch (error) {
        throw new Error(`Supporto ODT limitato: ${error}`);
      }
    }
    
    // ODS può essere letto da xlsx
    if (type === 'ods') {
      return await this.extractFromExcel(buffer, 'ods');
    }
    
    throw new Error(`Formato OpenDocument ${type} non ancora supportato completamente`);
  }

  /**
   * Determina il tipo di file dal MIME type o dall'estensione
   */
  private getFileType(mimeType: string, fileName?: string): string | null {
    // Prima prova con il MIME type
    if (this.supportedMimeTypes.has(mimeType)) {
      return this.supportedMimeTypes.get(mimeType)!;
    }
    
    // Se non trovato, prova con l'estensione del file
    if (fileName) {
      const extension = fileName.split('.').pop()?.toLowerCase();
      if (extension) {
        // Mappa estensioni comuni
        const extensionMap: Record<string, string> = {
          'pdf': 'pdf',
          'doc': 'doc',
          'docx': 'docx',
          'xls': 'xls',
          'xlsx': 'xlsx',
          'txt': 'txt',
          'csv': 'csv',
          'tsv': 'tsv',
          'rtf': 'rtf',
          'odt': 'odt',
          'ods': 'ods'
        };
        
        return extensionMap[extension] || null;
      }
    }
    
    return null;
  }

  /**
   * Conta le parole in un testo
   */
  private countWords(text: string): number {
    if (!text) return 0;
    
    // Rimuove caratteri speciali e divide per spazi
    const words = text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
    
    return words.length;
  }

  /**
   * Rileva la lingua del testo (base)
   */
  detectLanguage(text: string): string {
    // Implementazione semplice basata su parole comuni
    const italianWords = /\b(il|la|di|che|è|per|un|con|non|si|da|in|su|ma|come|anche|io|se|ho|mi|sono)\b/gi;
    const englishWords = /\b(the|is|at|which|on|and|a|to|in|that|have|I|it|for|not|with|he|as|you|do)\b/gi;
    
    const italianMatches = text.match(italianWords)?.length || 0;
    const englishMatches = text.match(englishWords)?.length || 0;
    
    if (italianMatches > englishMatches * 1.5) {
      return 'it';
    } else if (englishMatches > italianMatches * 1.5) {
      return 'en';
    }
    
    return 'unknown';
  }

  /**
   * Ottieni lista dei formati supportati
   */
  getSupportedFormats(): string[] {
    return Array.from(new Set(this.supportedMimeTypes.values()));
  }

  /**
   * Verifica se un formato è supportato
   */
  isFormatSupported(mimeType: string, fileName?: string): boolean {
    return this.getFileType(mimeType, fileName) !== null;
  }

  /**
   * Estrae testo usando OCR avanzato (Docling o PaddleOCR-VL)
   */
  private async extractWithAdvancedOCR(
    buffer: Buffer,
    mimeType: string,
    fileName: string,
    options: Partial<AdvancedOCROptions> = {}
  ): Promise<ExtractionResult> {
    try {
      logger.info(`[UnifiedTextExtractor] Using Advanced OCR for ${fileName}`);
      
      // Default options
      const ocrOptions: AdvancedOCROptions = {
        engine: options.engine || 'auto',
        enableOCR: true,
        enableTableExtraction: true,
        enableFormulaRecognition: true,
        enableChartRecognition: false,
        ocrLanguages: ['it', 'en'],
        outputFormat: 'markdown',
        imageResolution: 2.0,
        preserveImages: false,
        fullPageOCR: false,
        ...options
      };
      
      const result = await this.advancedOCR.processDocument(
        buffer,
        mimeType,
        fileName,
        ocrOptions
      );
      
      // Converti in ExtractionResult
      return {
        text: result.text,
        metadata: {
          pageCount: result.metadata.pageCount,
          wordCount: result.metadata.wordCount,
          characterCount: result.metadata.characterCount,
          language: result.metadata.language,
          tables: result.metadata.tables,
          images: result.metadata.images?.map(img => img.base64 || img.path || ''),
        },
        warnings: result.warnings,
        structuredData: result.structuredData
      };
      
    } catch (error: any) {
      logger.error('[UnifiedTextExtractor] Advanced OCR failed:', error);
      logger.warn('[UnifiedTextExtractor] Falling back to standard extraction');
      
      // Fallback to standard extraction
      const fileType = this.getFileType(mimeType, fileName);
      if (fileType === 'pdf') {
        return await this.extractFromPDF(buffer);
      } else if (fileType === 'docx' || fileType === 'doc') {
        return await this.extractFromWord(buffer, fileType);
      }
      
      throw error;
    }
  }

  /**
   * Verifica disponibilità motori OCR avanzati
   */
  async checkAdvancedOCRAvailability(): Promise<{ docling: boolean; paddleocr: boolean }> {
    try {
      return await this.advancedOCR.checkEngineAvailability();
    } catch (error) {
      logger.error('[UnifiedTextExtractor] Failed to check OCR engines:', error);
      return { docling: false, paddleocr: false };
    }
  }
}
