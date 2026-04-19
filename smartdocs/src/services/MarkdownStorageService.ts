/**
 * MarkdownStorageService.ts
 * 
 * Service for storing and retrieving Markdown documents
 * Dual storage: PostgreSQL (for queries) + MinIO (for archiving)
 * 
 * @author SmartDocs AI
 * @version 1.0.0
 */

import { logger } from '../utils/logger';
import { DatabaseClient } from '../database/client';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';

const db = DatabaseClient.getInstance();

export interface MarkdownDocument {
  id: string;
  documentId: string;
  containerId: string;
  markdown: string;
  originalFormat: string;
  metadata: {
    pageCount?: number;
    wordCount: number;
    tables?: any[];
    formulas?: any[];
    images?: any[];
    conversionEngine: 'docling' | 'paddleocr-vl';
    conversionTime: number;
  };
  minioPath?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface MarkdownChunkData {
  chunkId: string;
  documentId: string;
  markdown: string;
  index: number;
  section?: string;
  level?: number;
  type: 'text' | 'table' | 'code' | 'list' | 'heading';
  metadata: any;
}

export class MarkdownStorageService {
  private minioClient: Minio.Client;
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.MINIO_BUCKET || 'smartdocs';
    this.minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
    });
    logger.info('[MarkdownStorage] Service initialized');
  }

  /**
   * Store markdown document (PostgreSQL + MinIO)
   */
  async storeMarkdown(doc: MarkdownDocument): Promise<string> {
    try {
      logger.info(`[MarkdownStorage] Storing markdown for document: ${doc.documentId}`);

      const markdownId = doc.id || uuidv4();

      // 1. Store in PostgreSQL
      await this.storeInPostgreSQL(markdownId, doc);

      // 2. Store in MinIO (opzionale)
      let minioPath: string | undefined;
      try {
        minioPath = await this.storeInMinIO(markdownId, doc);
      } catch (minioError: any) {
        logger.warn('[MarkdownStorage] MinIO storage skipped:', minioError.message);
        // Continua senza MinIO
      }

      // 3. Update PostgreSQL with MinIO path (se disponibile)
      if (minioPath) {
        await db.query(
          `UPDATE smartdocs.markdown_documents 
           SET minio_path = $1, updated_at = NOW() 
           WHERE id = $2`,
          [minioPath, markdownId]
        );
      }

      logger.info(`[MarkdownStorage] Markdown stored successfully: ${markdownId}`);
      return markdownId;

    } catch (error: any) {
      logger.error('[MarkdownStorage] Error storing markdown:', error);
      throw error;
    }
  }

  /**
   * Store in PostgreSQL
   */
  private async storeInPostgreSQL(id: string, doc: MarkdownDocument): Promise<void> {
    const query = `
      INSERT INTO smartdocs.markdown_documents (
        id, document_id, container_id, markdown, original_format,
        metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (id) DO UPDATE SET
        markdown = EXCLUDED.markdown,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
    `;

    await db.query(query, [
      id,
      doc.documentId,
      doc.containerId,
      doc.markdown,
      doc.originalFormat,
      JSON.stringify(doc.metadata)
    ]);
  }

  /**
   * Store in MinIO
   */
  private async storeInMinIO(id: string, doc: MarkdownDocument): Promise<string> {
    const objectName = `markdown/${doc.containerId}/${id}.md`;
    const buffer = Buffer.from(doc.markdown, 'utf-8');

    const metadata = {
      'Content-Type': 'text/markdown',
      'Document-Id': doc.documentId,
      'Container-Id': doc.containerId
    };

    await this.minioClient.putObject(
      this.bucketName,
      objectName,
      buffer,
      buffer.length,
      metadata
    );

    return objectName;
  }

  /**
   * Retrieve markdown by document ID
   */
  async getMarkdownByDocumentId(documentId: string): Promise<MarkdownDocument | null> {
    try {
      const result = await db.query(
        `SELECT * FROM smartdocs.markdown_documents WHERE document_id = $1`,
        [documentId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        documentId: row.document_id,
        containerId: row.container_id,
        markdown: row.markdown,
        originalFormat: row.original_format,
        metadata: row.metadata,
        minioPath: row.minio_path,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };

    } catch (error: any) {
      logger.error('[MarkdownStorage] Error retrieving markdown:', error);
      throw error;
    }
  }

  /**
   * Store Docling chunks (from Docling hybrid chunking)
   */
  async storeDoclingChunks(chunks: any[], documentId: string): Promise<void> {
    try {
      logger.info(`[MarkdownStorage] Storing ${chunks.length} Docling chunks`);

      for (const chunk of chunks) {
        await db.query(
          `INSERT INTO smartdocs.docling_chunks (
            id, document_id, chunk_index, text, section, level, type, metadata, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
          ON CONFLICT (id) DO NOTHING`,
          [
            uuidv4(),
            documentId,
            chunk.index,
            chunk.text,
            chunk.section,
            chunk.level,
            chunk.type,
            JSON.stringify(chunk.metadata)
          ]
        );
      }

      logger.info(`[MarkdownStorage] Docling chunks stored`);

    } catch (error: any) {
      logger.error('[MarkdownStorage] Error storing Docling chunks:', error);
      throw error;
    }
  }

  /**
   * Get Docling chunks for document
   */
  async getDoclingChunks(documentId: string): Promise<any[]> {
    try {
      const result = await db.query(
        `SELECT * FROM smartdocs.docling_chunks 
         WHERE document_id = $1 
         ORDER BY chunk_index ASC`,
        [documentId]
      );

      return result.rows.map(row => ({
        id: row.id,
        documentId: row.document_id,
        index: row.chunk_index,
        text: row.text,
        section: row.section,
        level: row.level,
        type: row.type,
        metadata: row.metadata
      }));

    } catch (error: any) {
      logger.error('[MarkdownStorage] Error retrieving Docling chunks:', error);
      throw error;
    }
  }

  /**
   * Delete markdown document
   */
  async deleteMarkdown(documentId: string): Promise<void> {
    try {
      // Delete from PostgreSQL
      await db.query(
        `DELETE FROM smartdocs.markdown_documents WHERE document_id = $1`,
        [documentId]
      );

      // Delete Docling chunks
      await db.query(
        `DELETE FROM smartdocs.docling_chunks WHERE document_id = $1`,
        [documentId]
      );

      // Note: MinIO cleanup handled separately if needed

      logger.info(`[MarkdownStorage] Markdown deleted for document: ${documentId}`);

    } catch (error: any) {
      logger.error('[MarkdownStorage] Error deleting markdown:', error);
      throw error;
    }
  }

  /**
   * Get markdown statistics
   */
  async getStatistics(containerId?: string): Promise<any> {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_documents,
          SUM(LENGTH(markdown)) as total_characters,
          AVG(LENGTH(markdown)) as avg_characters,
          SUM((metadata->>'wordCount')::int) as total_words
        FROM smartdocs.markdown_documents
      `;

      const params: any[] = [];
      if (containerId) {
        query += ' WHERE container_id = $1';
        params.push(containerId);
      }

      const result = await db.query(query, params);

      return result.rows[0];

    } catch (error: any) {
      logger.error('[MarkdownStorage] Error getting statistics:', error);
      throw error;
    }
  }
}
