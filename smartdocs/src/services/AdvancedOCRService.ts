/**
 * AdvancedOCRService.ts
 * 
 * Servizio avanzato per OCR e parsing documenti complessi
 * Integra Docling e PaddleOCR-VL per massima precisione
 * 
 * STRATEGIA:
 * - Docling: DOCX, HTML, multi-format, tabelle complesse
 * - PaddleOCR-VL: PDF multilingua, formule matematiche, documenti scientifici
 * - Auto-selection basata su tipo documento e complessità
 * 
 * @author SmartDocs AI
 * @version 1.0.0
 */

import { logger } from '../utils/logger';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import FormData from 'form-data';
import { createReadStream } from 'fs';

export interface AdvancedOCROptions {
  engine?: 'auto' | 'docling' | 'paddleocr-vl' | 'marker';  // ✅ Added Marker
  enableOCR?: boolean;
  enableTableExtraction?: boolean;
  enableFormulaRecognition?: boolean;
  enableChartRecognition?: boolean;
  ocrLanguages?: string[];  // ['it', 'en', 'es', ...]
  outputFormat?: 'markdown' | 'json' | 'html' | 'text';
  imageResolution?: number; // Scale factor (1 = 72 DPI, 2 = 144 DPI)
  preserveImages?: boolean;
  fullPageOCR?: boolean;
}

export interface AdvancedOCRResult {
  text: string;
  markdown?: string;
  html?: string;
  json?: any;
  metadata: {
    engine: 'docling' | 'paddleocr-vl' | 'marker';  // ✅ Added Marker
    pageCount?: number;
    wordCount: number;
    characterCount: number;
    language?: string;
    tables?: TableData[];
    formulas?: FormulaData[];
    charts?: ChartData[];
    images?: ImageData[];
    processingTime: number;
    confidence?: number;
  };
  warnings?: string[];
  structuredData?: any;
  doclingChunks?: DoclingChunk[];  // Chunks from Docling hybrid chunking
  chunkingStrategy?: 'docling-hybrid' | 'none';
}

export interface TableData {
  index: number;
  rows: number;
  columns: number;
  content: any[][];
  csv?: string;
  html?: string;
  pageNumber?: number;
}

export interface FormulaData {
  index: number;
  latex?: string;
  text: string;
  pageNumber?: number;
  confidence?: number;
}

export interface ChartData {
  index: number;
  type: string;
  description?: string;
  imageBase64?: string;
  pageNumber?: number;
}

export interface ImageData {
  index: number;
  type: 'figure' | 'picture' | 'diagram';
  base64?: string;
  path?: string;
  width?: number;
  height?: number;
  pageNumber?: number;
}

export interface DoclingChunk {
  text: string;
  index: number;
  section?: string;
  level?: number;
  type: 'text' | 'table' | 'code' | 'list' | 'heading';
  metadata: {
    start_char: number;
    end_char: number;
    parent_section?: string;
    tokens?: number;
  };
}

export class AdvancedOCRService {
  private pythonScriptPath: string;
  private pythonPath: string;
  private tempDir: string;
  private markerServiceUrl: string = 'http://localhost:8001';
  private paddleServiceUrl: string = 'http://localhost:8002';

  constructor() {
    this.pythonScriptPath = path.join(__dirname, '../../scripts/advanced_ocr.py');
    this.tempDir = path.join(__dirname, '../../temp/ocr');
    
    // Use Python from venv if available, otherwise system python3
    const venvPython = path.join(__dirname, '../../venv_ocr/bin/python3');
    this.pythonPath = require('fs').existsSync(venvPython) ? venvPython : 'python3';
    
    this.ensureTempDir();
    
    logger.info('[AdvancedOCR] Service initialized with Docling + Marker (Docker) + PaddleOCR (Docker)');
    logger.info(`[AdvancedOCR] Marker service: ${this.markerServiceUrl}`);
    logger.info(`[AdvancedOCR] PaddleOCR service: ${this.paddleServiceUrl}`);
    logger.info(`[AdvancedOCR] Using Python: ${this.pythonPath}`);
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      logger.warn('[AdvancedOCR] Could not create temp directory:', error);
    }
  }

  /**
   * Processa un documento con OCR avanzato
   */
  async processDocument(
    buffer: Buffer,
    mimeType: string,
    fileName: string,
    options: AdvancedOCROptions = {}
  ): Promise<AdvancedOCRResult> {
    const startTime = Date.now();
    
    // Determina engine ottimale
    const engine = this.selectEngine(mimeType, fileName, options.engine);
    
    logger.info(`[AdvancedOCR] Processing ${fileName} with engine: ${engine}`);
    
    // Salva file temporaneo
    const tempFilePath = await this.saveTempFile(buffer, fileName);
    
    try {
      let result: AdvancedOCRResult;
      
      // ✅ FORCE BEST OPTIONS for Docling
      const enhancedOptions = {
        ...options,
        enableTableExtraction: true,      // Always true
        preserveImages: true,              // Always true for better MD
        imageResolution: options.imageResolution || 2.0,  // High quality
      };
      
      if (engine === 'docling') {
        result = await this.processWithDocling(tempFilePath, enhancedOptions);
      } else if (engine === 'marker') {
        result = await this.processWithMarker(tempFilePath, enhancedOptions);
      } else {
        result = await this.processWithPaddleOCR(tempFilePath, enhancedOptions);
      }
      
      // Aggiungi tempo di processamento
      result.metadata.processingTime = Date.now() - startTime;
      result.metadata.engine = engine;
      
      logger.info(`[AdvancedOCR] Processing completed in ${result.metadata.processingTime}ms`);
      
      return result;
      
    } finally {
      // Cleanup file temporaneo
      await this.cleanupTempFile(tempFilePath);
    }
  }

  /**
   * Processa con Docling
   */
  private async processWithDocling(
    filePath: string,
    options: AdvancedOCROptions
  ): Promise<AdvancedOCRResult> {
    logger.info('[AdvancedOCR] Processing with Docling...');
    
    const args = [
      this.pythonScriptPath,
      '--engine', 'docling',
      '--input', filePath,
      '--output-format', options.outputFormat || 'markdown',
      // ✅ ALWAYS enable accurate table extraction
      '--enable-tables'
    ];
    
    // ✅ Enable OCR for scanned PDFs (auto-detect or explicit flag)
    if (options.enableOCR) {
      args.push('--enable-ocr');
      if (options.ocrLanguages && options.ocrLanguages.length > 0) {
        args.push('--ocr-lang', options.ocrLanguages.join(','));
      }
      if (options.fullPageOCR) {
        args.push('--full-page-ocr');
      }
    }
    
    // ✅ Preserve images for better document structure (default TRUE)
    if (options.preserveImages !== false) {
      args.push('--preserve-images');
      if (options.imageResolution) {
        args.push('--image-resolution', options.imageResolution.toString());
      }
    }
    
    const result = await this.executePythonScript(args);
    
    return this.parseDoclingResult(result);
  }

  /**
   * ✅ Processa con PaddleOCR (Docker microservice)
   */
  private async processWithPaddleOCR(
    filePath: string,
    options: AdvancedOCROptions
  ): Promise<AdvancedOCRResult> {
    logger.info('[AdvancedOCR] Processing with PaddleOCR Docker service...');
    
    try {
      const formData = new FormData();
      formData.append('file', createReadStream(filePath));
      
      const response = await axios.post(
        `${this.paddleServiceUrl}/ocr`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 120000, // 2 min timeout
        }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'PaddleOCR failed');
      }
      
      const text = response.data.text || '';
      const wordCount = this.countWords(text);
      
      return {
        text,
        markdown: text, // PaddleOCR returns plain text
        metadata: {
          engine: 'paddleocr-vl',
          wordCount,
          characterCount: text.length,
          processingTime: 0, // Will be set by caller
        },
        chunkingStrategy: 'none',
      };
      
    } catch (error: any) {
      logger.error('[AdvancedOCR] PaddleOCR Docker service error:', error.message || String(error));
      
      if (error.code === 'ECONNREFUSED') {
        throw new Error('PaddleOCR service not available. Ensure Docker container is running on port 8002');
      }
      
      throw new Error(error.message || 'PaddleOCR processing failed');
    }
  }

  /**
   * ✅ Processa con Marker (Docker microservice)
   */
  private async processWithMarker(
    filePath: string,
    options: AdvancedOCROptions
  ): Promise<AdvancedOCRResult> {
    logger.info('[AdvancedOCR] Processing with Marker Docker service...');
    
    try {
      const formData = new FormData();
      formData.append('file', createReadStream(filePath));
      
      const response = await axios.post(
        `${this.markerServiceUrl}/convert`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 300000, // 5 min timeout
        }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Marker conversion failed');
      }
      
      const markdown = response.data.markdown || '';
      const wordCount = this.countWords(markdown);
      
      return {
        text: markdown,
        markdown: markdown,
        metadata: {
          engine: 'marker',
          wordCount,
          characterCount: markdown.length,
          processingTime: 0, // Will be set by caller
          images: response.data.metadata?.images || [],
        },
        chunkingStrategy: 'none',
      };
      
    } catch (error: any) {
      logger.error('[AdvancedOCR] Marker Docker service error:', error.message || String(error));
      
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Marker service not available. Ensure Docker container is running on port 8001');
      }
      
      throw new Error(error.message || 'Marker processing failed');
    }
  }

  /**
   * Esegue script Python
   */
  private async executePythonScript(args: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const python = spawn(this.pythonPath, args);
      
      let stdout = '';
      let stderr = '';
      
      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        const chunk = data.toString();
        stderr += chunk;
        // ✅ Log stderr in real-time for Marker progress
        if (chunk.includes('Loading') || chunk.includes('Processing') || chunk.includes('Models')) {
          logger.info('[AdvancedOCR] Progress:', chunk.trim());
        }
      });
      
      python.on('close', (code) => {
        if (code !== 0) {
          logger.error('[AdvancedOCR] Python script failed');
          logger.error('[AdvancedOCR] Exit code:', code);
          logger.error('[AdvancedOCR] STDERR:', stderr);
          logger.error('[AdvancedOCR] STDOUT:', stdout);
          logger.error('[AdvancedOCR] Command args:', args.join(' '));
          
          // Try to parse error JSON from stdout
          let errorMessage = stderr || 'Unknown error';
          try {
            const errorJson = JSON.parse(stdout || stderr);
            if (errorJson.error) {
              errorMessage = errorJson.error;
            }
          } catch (e) {
            // Not JSON, use raw output
          }
          
          reject(new Error(`OCR failed: ${errorMessage}`));
        } else {
          try {
            const result = JSON.parse(stdout);
            
            // Check if it's an error response even with code 0
            if (result.success === false) {
              logger.error('[AdvancedOCR] OCR returned error:', result.error);
              reject(new Error(`OCR failed: ${result.error}`));
              return;
            }
            
            resolve(result);
          } catch (error) {
            logger.error('[AdvancedOCR] Failed to parse Python output:', stdout.substring(0, 500));
            logger.error('[AdvancedOCR] STDERR:', stderr.substring(0, 500));
            reject(new Error('Failed to parse OCR result'));
          }
        }
      });
      
      python.on('error', (error) => {
        logger.error('[AdvancedOCR] Failed to spawn Python process:', error);
        reject(error);
      });
    });
  }

  /**
   * Seleziona engine ottimale
   */
  private selectEngine(
    mimeType: string,
    fileName: string,
    preferredEngine?: 'auto' | 'docling' | 'paddleocr-vl' | 'marker'
  ): 'docling' | 'paddleocr-vl' | 'marker' {
    // ✅ PaddleOCR RE-ENABLED
    if (preferredEngine && preferredEngine !== 'auto') {
      logger.info(`[AdvancedOCR] Using preferred engine: ${preferredEngine}`);
      return preferredEngine;
    }
    
    // Auto-selection based on file type
    const lowerFileName = fileName.toLowerCase();
    
    // Use PaddleOCR for scanned documents, images, or documents with complex layouts
    if (lowerFileName.match(/\.(png|jpg|jpeg|tiff|bmp)$/)) {
      logger.info('[AdvancedOCR] Auto-selecting PaddleOCR for image file');
      return 'paddleocr-vl';
    }
    
    // Default to Docling for structured documents (PDF, DOCX)
    logger.info('[AdvancedOCR] Auto-selecting Docling for structured document');
    return 'docling';
  }

  /**
   * Salva file temporaneo
   */
  private async saveTempFile(buffer: Buffer, fileName: string): Promise<string> {
    const tempFileName = `${uuidv4()}_${fileName}`;
    const tempFilePath = path.join(this.tempDir, tempFileName);
    await fs.writeFile(tempFilePath, buffer);
    return tempFilePath;
  }

  /**
   * Rimuove file temporaneo
   */
  private async cleanupTempFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      logger.warn('[AdvancedOCR] Failed to cleanup temp file:', error);
    }
  }

  /**
   * Parsea risultato Docling
   */
  private parseDoclingResult(result: any): AdvancedOCRResult {
    const wordCount = this.countWords(result.text || result.markdown || '');
    
    return {
      text: result.text || result.markdown || '',
      markdown: result.markdown,
      html: result.html,
      json: result.json,
      metadata: {
        engine: 'docling',
        pageCount: result.metadata?.page_count,
        wordCount,
        characterCount: (result.text || result.markdown || '').length,
        language: result.metadata?.language,
        tables: result.tables || [],
        images: result.images || [],
        processingTime: 0  // Will be set by caller
      },
      warnings: result.warnings,
      structuredData: result.structured_data,
      doclingChunks: result.docling_chunks || [],  // Chunks from Docling
      chunkingStrategy: result.docling_chunks ? 'docling-hybrid' : 'none'
    };
  }

  /**
   * Parsea risultato PaddleOCR-VL
   */
  private parsePaddleOCRResult(result: any): AdvancedOCRResult {
    const wordCount = this.countWords(result.text || result.markdown || '');
    
    return {
      text: result.text || result.markdown || '',
      markdown: result.markdown,
      html: result.html,
      json: result.json,
      metadata: {
        engine: 'paddleocr-vl',
        pageCount: result.metadata?.page_count,
        wordCount,
        characterCount: (result.text || result.markdown || '').length,
        language: result.metadata?.language,
        tables: result.tables || [],
        formulas: result.formulas || [],
        charts: result.charts || [],
        images: result.images || [],
        confidence: result.metadata?.confidence,
        processingTime: 0  // Will be set by caller
      },
      warnings: result.warnings,
      structuredData: result.structured_data
    };
  }

  /**
   * ✅ Parsea risultato Marker
   */
  private parseMarkerResult(result: any): AdvancedOCRResult {
    const wordCount = this.countWords(result.text || result.markdown || '');
    
    return {
      text: result.text || result.markdown || '',
      markdown: result.markdown,
      html: result.html,
      json: result.json,
      metadata: {
        engine: 'marker',
        pageCount: result.metadata?.page_count,
        wordCount,
        characterCount: (result.text || result.markdown || '').length,
        language: result.metadata?.language,
        tables: result.tables || [],
        images: result.images || [],
        processingTime: 0  // Will be set by caller
      },
      warnings: result.warnings,
      structuredData: result.structured_data
    };
  }

  /**
   * Conta parole
   */
  private countWords(text: string): number {
    if (!text) return 0;
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }

  /**
   * Verifica se i motori OCR sono disponibili
   */
  async checkEngineAvailability(): Promise<{ docling: boolean; paddleocr: boolean }> {
    try {
      const checkArgs = [this.pythonScriptPath, '--check-engines'];
      const result = await this.executePythonScript(checkArgs);
      
      return {
        docling: result.docling || false,
        paddleocr: result.paddleocr || false
      };
    } catch (error) {
      logger.error('[AdvancedOCR] Failed to check engine availability:', error);
      return { docling: false, paddleocr: false };
    }
  }
}
