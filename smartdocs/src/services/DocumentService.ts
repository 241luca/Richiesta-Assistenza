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
    // TODO: Implement text extraction based on file type
    // For now, just read text files
    if (file.mimetype.startsWith('text/')) {
      return fs.readFileSync(file.path, 'utf-8');
    }
    return '';
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
