import { DatabaseClient } from '../database/client';
import { StorageService } from './StorageService';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

interface Document {
  id: string;
  container_id?: string;
  type: string;
  title: string;
  content?: string;
  storage_url?: string;
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

export class DocumentService {
  private db: DatabaseClient;
  private storage: StorageService;

  constructor() {
    this.db = DatabaseClient.getInstance();
    this.storage = new StorageService();
  }

  async listDocuments(options: any): Promise<Document[]> {
    const { containerId, type, limit, offset } = options;

    let query = 'SELECT * FROM smartdocs.documents WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (containerId) {
      query += ` AND container_id = $${paramIndex++}`;
      params.push(containerId);
    }

    if (type) {
      query += ` AND type = $${paramIndex++}`;
      params.push(type);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await this.db.query(query, params);
    return result.rows;
  }

  async uploadDocument(data: any): Promise<Document> {
    const { file, containerId, type, metadata } = data;

    // Upload to storage
    const storageUrl = await this.storage.uploadFile(file);

    // Extract text content if possible
    const content = await this.extractTextContent(file);

    const query = `
      INSERT INTO smartdocs.documents (container_id, type, title, content, storage_url, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await this.db.query(query, [
      containerId || null,
      type || 'unknown',
      file.originalname,
      content,
      storageUrl,
      metadata || {}
    ]);

    // Clean up temp file
    fs.unlinkSync(file.path);

    return result.rows[0];
  }

  async getDocumentById(id: string): Promise<Document | null> {
    const query = 'SELECT * FROM smartdocs.documents WHERE id = $1';
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }

  async deleteDocument(id: string): Promise<void> {
    const doc = await this.getDocumentById(id);
    
    if (doc && doc.storage_url) {
      await this.storage.deleteFile(doc.storage_url);
    }

    const query = 'DELETE FROM smartdocs.documents WHERE id = $1';
    await this.db.query(query, [id]);
  }

  async downloadDocument(id: string) {
    const doc = await this.getDocumentById(id);
    
    if (!doc) {
      throw new Error('Document not found');
    }

    const stream = await this.storage.downloadFile(doc.storage_url!);

    return {
      stream,
      filename: doc.title,
      mimetype: this.getMimeType(doc.title)
    };
  }

  private async extractTextContent(file: any): Promise<string> {
    try {
      // ✅ File size check (50MB max)
      const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
      const fileSize = file.size || (fs.existsSync(file.path) ? fs.statSync(file.path).size : 0);
      
      if (fileSize > MAX_FILE_SIZE) {
        logger.warn(`[DocumentService] File too large: ${fileSize} bytes (max: ${MAX_FILE_SIZE})`);
        return '';
      }

      // ✅ Plain text files
      if (file.mimetype.startsWith('text/')) {
        return fs.readFileSync(file.path, 'utf-8');
      }
      
      // ✅ PDF extraction
      if (file.mimetype === 'application/pdf' || 
          file.originalname?.toLowerCase().endsWith('.pdf')) {
        try {
          const pdfParse = require('pdf-parse');
          const dataBuffer = fs.readFileSync(file.path);
          
          // Timeout wrapper for PDF parsing
          const data: any = await this.withTimeout(
            pdfParse(dataBuffer),
            30000,
            'PDF extraction timeout'
          );
          
          logger.info(`[DocumentService] Extracted ${data.numpages} pages from PDF (${data.text.length} chars)`);
          return data.text;
        } catch (pdfError: any) {
          logger.warn('[DocumentService] PDF extraction failed:', pdfError.message);
          return '';
        }
      }
      
      // ✅ DOCX extraction
      if (file.mimetype?.includes('wordprocessingml') || 
          file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.originalname?.toLowerCase().endsWith('.docx')) {
        try {
          const mammoth = require('mammoth');
          
          const result: any = await this.withTimeout(
            mammoth.extractRawText({ path: file.path }),
            30000,
            'DOCX extraction timeout'
          );
          
          logger.info(`[DocumentService] Extracted DOCX: ${result.value.length} chars`);
          return result.value;
        } catch (docxError: any) {
          logger.warn('[DocumentService] DOCX extraction failed:', docxError.message);
          return '';
        }
      }
      
      // ✅ XLSX extraction
      if (file.mimetype?.includes('spreadsheetml') || 
          file.mimetype === 'application/vnd.ms-excel' ||
          file.originalname?.toLowerCase().endsWith('.xlsx') ||
          file.originalname?.toLowerCase().endsWith('.xls')) {
        try {
          const xlsx = require('xlsx');
          const workbook = xlsx.readFile(file.path);
          let fullText = '';
          
          for (const sheetName of workbook.SheetNames) {
            fullText += `\n## Sheet: ${sheetName}\n`;
            const sheet = workbook.Sheets[sheetName];
            const csv = xlsx.utils.sheet_to_csv(sheet, {
              RS: '\n',
              FS: ' | '
            });
            fullText += csv;
          }
          
          logger.info(`[DocumentService] Extracted XLSX: ${workbook.SheetNames.length} sheets, ${fullText.length} chars`);
          return fullText;
        } catch (xlsxError: any) {
          logger.warn('[DocumentService] XLSX extraction failed:', xlsxError.message);
          return '';
        }
      }
      
      // ✅ CSV as text
      if (file.mimetype === 'text/csv' || file.originalname?.endsWith('.csv')) {
        return fs.readFileSync(file.path, 'utf-8');
      }
      
      // ✅ JSON as formatted text
      if (file.mimetype === 'application/json' || file.originalname?.endsWith('.json')) {
        const raw = fs.readFileSync(file.path, 'utf-8');
        try {
          const parsed = JSON.parse(raw);
          return JSON.stringify(parsed, null, 2);
        } catch {
          return raw; // Return raw if parsing fails
        }
      }
      
      logger.warn(`[DocumentService] Unsupported file type: ${file.mimetype}`);
      return '';
      
    } catch (error: any) {
      logger.error('[DocumentService] Unexpected error in extractTextContent:', error);
      return '';
    }
  }

  /**
   * Timeout wrapper for async operations
   */
  private withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error(errorMessage)), ms)
      )
    ]);
  }

  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
      '.json': 'application/json'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  // ✅ NEW: Advanced debugging methods
  async getDocumentChunks(documentId: string) {
    try {
      const result = await this.db.query(`
        SELECT 
          cm.*,
          e.chunk_text,
          e.chunk_index as embedding_index
        FROM smartdocs.chunk_metadata cm
        LEFT JOIN smartdocs.embeddings e ON e.document_id = cm.document_id AND e.chunk_index = cm.chunk_index
        WHERE cm.document_id = $1
        ORDER BY cm.chunk_index
      `, [documentId]);

      return result.rows.map(row => ({
        id: row.chunk_id,
        documentId: row.document_id,
        index: row.chunk_index,
        content: row.chunk_text || '',
        title: row.title,
        sectionPath: row.section_path || ['Document'],
        previousChunkPreview: row.previous_chunk_preview || '',
        nextChunkPreview: row.next_chunk_preview || '',
        contextualMetadata: {
          topicKeywords: row.topic_keywords || [],
          documentType: row.content_type || 'text',
          importanceScore: row.importance_score || 0.5,
          isSectionHeader: row.is_section_header || false,
          sentenceCount: row.sentence_count || 1,
          readabilityScore: row.readability_score || 0.5
        },
        embeddingOptimized: '',
        relatedChunkIds: row.related_chunk_ids || [],
        tokens: row.tokens || 0,
        characterCount: (row.chunk_text || '').length
      }));
    } catch (error) {
      logger.error('[DocumentService] Error getting chunks:', error);
      return [];
    }
  }

  async getDocumentAnalysis(documentId: string) {
    try {
      const [chunks, entities, relationships] = await Promise.all([
        this.getDocumentChunks(documentId),
        this.getEntities(documentId),
        this.getRelationships(documentId)
      ]);

      return {
        chunks,
        entities,
        relationships,
        stats: {
          totalChunks: chunks.length,
          totalTokens: chunks.reduce((sum: number, c: any) => sum + c.tokens, 0),
          avgChunkSize: chunks.length > 0
            ? Math.round(chunks.reduce((sum: number, c: any) => sum + c.characterCount, 0) / chunks.length)
            : 0,
          totalEntities: entities.length,
          totalRelationships: relationships.length,
          entityTypes: Array.from(new Set(entities.map((e: any) => e.type))),
          relationshipTypes: Array.from(new Set(relationships.map((r: any) => r.type)))
        }
      };
    } catch (error) {
      logger.error('[DocumentService] Error getting analysis:', error);
      throw error;
    }
  }

  private async getEntities(documentId: string) {
    try {
      const result = await this.db.query(`
        SELECT 
          id,
          document_id,
          chunk_id,
          name,
          type,
          importance,
          frequency,
          context,
          aliases
        FROM smartdocs.kg_entities
        WHERE document_id = $1
        ORDER BY importance DESC, frequency DESC
      `, [documentId]);

      return result.rows;
    } catch (error) {
      logger.error('[DocumentService] Error getting entities:', error);
      return [];
    }
  }

  private async getRelationships(documentId: string) {
    try {
      const result = await this.db.query(`
        SELECT 
          id,
          document_id,
          source_entity_id,
          target_entity_id,
          type,
          confidence,
          context
        FROM smartdocs.kg_relationships
        WHERE document_id = $1
        ORDER BY confidence DESC
      `, [documentId]);

      return result.rows;
    } catch (error) {
      logger.error('[DocumentService] Error getting relationships:', error);
      return [];
    }
  }
}
