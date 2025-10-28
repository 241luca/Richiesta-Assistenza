import { DatabaseClient } from '../database/client';
import { logger } from '../utils/logger';
import { OpenAIService } from './OpenAIService';
import { SemanticChunkingService } from './SemanticChunkingService';
import { KnowledgeGraphService } from './KnowledgeGraphService';
import { v4 as uuidv4 } from 'uuid';

interface IngestStructuredDataParams {
  container_id: string;
  source_app: string;
  source_type: 'auto_sync' | 'manual';
  entity_type: string;
  entity_id: string;
  title: string;
  content: string;
  metadata?: Record<string, any>;
  auto_update?: boolean;
  chunk_size?: number;
  chunk_overlap?: number;
}

interface DeleteEntityChunksParams {
  container_id: string;
  source_app?: string;
  entity_type: string;
  entity_id: string;
}

export class StructuredDataIngestionService {
  private db: DatabaseClient;
  private openai: OpenAIService;
  private semanticChunking: SemanticChunkingService;
  private knowledgeGraph: KnowledgeGraphService;

  constructor() {
    this.db = DatabaseClient.getInstance();
    this.openai = new OpenAIService();
    this.semanticChunking = new SemanticChunkingService();
    this.knowledgeGraph = new KnowledgeGraphService();
  }

  /**
   * Ingest structured data from external applications
   * Creates a "virtual document" and generates embeddings
   */
  async ingestStructuredData(params: IngestStructuredDataParams): Promise<{
    documentId: string;
    chunksCreated: number;
    entitiesExtracted: number;
    relationshipsExtracted: number;
    semanticChunking: {
      totalChunks: number;
      averageChunkSize: number;
      minChunkSize: number;
      maxChunkSize: number;
      totalTokens: number;
      avgImportance: number;
    };
    keywords: string[];
  }> {
    const {
      container_id,
      source_app,
      source_type,
      entity_type,
      entity_id,
      title,
      content,
      metadata = {},
      auto_update = true,
      chunk_size = 1000,
      chunk_overlap = 200
    } = params;

    logger.info(`[StructuredDataIngestion] Ingesting ${entity_type} #${entity_id} from ${source_app}`);

    // VALIDATE: Check if container exists
    const containerCheck = await this.db.query(
      'SELECT id FROM smartdocs.containers WHERE id = $1',
      [container_id]
    );
    
    if (containerCheck.rows.length === 0) {
      throw new Error(`Container ${container_id} not found. Please ensure the container exists before syncing.`);
    }

    // Start sync job
    const jobId = await this.createSyncJob({
      container_id,
      source_app,
      entity_type,
      entity_id
    });

    try {
      // 1. Delete existing chunks for this entity
      await this.deleteEntityChunks({
        container_id,
        source_app,
        entity_type,
        entity_id
      });

      // 2. Create virtual document
      const documentId = uuidv4();
      
      const insertDocQuery = `
        INSERT INTO smartdocs.documents (
          id,
          container_id,
          title,
          content,
          source_type,
          source_app,
          entity_type,
          entity_id,
          auto_update,
          last_synced_at,
          processing_status,
          metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), 'PROCESSING', $10)
        RETURNING id
      `;

      await this.db.query(insertDocQuery, [
        documentId,
        container_id,
        title,
        content,
        source_type,
        source_app,
        entity_type,
        entity_id,
        auto_update,
        JSON.stringify({
          ...metadata,
          ingested_at: new Date().toISOString(),
          content_length: content.length
        })
      ]);

      // 3. SEMANTIC CHUNKING: Create intelligent chunks with context windows
      logger.info(`[StructuredDataIngestion] 🧠 Using SEMANTIC CHUNKING for ${entity_type} #${entity_id}`);
      
      const semanticChunks = await this.semanticChunking.chunkDocument(
        content,
        documentId,
        title
      );
      logger.info(`[StructuredDataIngestion] ✅ Created ${semanticChunks.length} semantic chunks`);

      // 4. KNOWLEDGE GRAPH: Extract entities and relationships  
      logger.info(`[StructuredDataIngestion] 🔍 Extracting knowledge graph...`);
      
      // Extract with simple keyword list (no external dependency)
      const simpleKeywords = content
        .toLowerCase()
        .match(/\b[a-zà-ü]{4,}\b/g) || [];
      const topKeywords = [...new Set(simpleKeywords)].slice(0, 20);
      
      const kgResult = await this.knowledgeGraph.extractFromChunk(
        content,
        semanticChunks[0]?.id || documentId,
        documentId,
        title,
        topKeywords
      );
      
      logger.info(`[StructuredDataIngestion] ✅ Extracted ${kgResult.entities.length} entities, ${kgResult.relationships.length} relationships`);

      // 5. Generate embeddings for each semantic chunk
      let chunksCreated = 0;
      for (let i = 0; i < semanticChunks.length; i++) {
        const chunk = semanticChunks[i];
        
        try {
          const embedding = await this.openai.createEmbedding(chunk.content);

          await this.db.query(
            `INSERT INTO smartdocs.embeddings (document_id, chunk_index, chunk_text, embedding)
             VALUES ($1, $2, $3, $4)`,
            [documentId, i, chunk.content, JSON.stringify(embedding)]
          );

          chunksCreated++;
        } catch (error) {
          logger.error(`[StructuredDataIngestion] Error generating embedding for chunk ${i}:`, error);
          throw error;
        }
      }

      // 6. Update document status with semantic chunking metadata
      await this.db.query(
        `UPDATE smartdocs.documents 
         SET processing_status = 'COMPLETED', 
             updated_at = NOW(),
             metadata = metadata || $2::jsonb
         WHERE id = $1`,
        [documentId, JSON.stringify({
          processing_method: 'semantic_chunking',
          semantic_chunks: chunksCreated,
          entities_extracted: kgResult.entities.length,
          relationships_extracted: kgResult.relationships.length,
          processed_at: new Date().toISOString()
        })]
      );

      // 7. Update sync job
      await this.completeSyncJob(jobId, chunksCreated);

      // 8. Update storage stats
      await this.updateStorageStats(container_id, source_app, entity_type);

      logger.info(`[StructuredDataIngestion] ✅ Successfully ingested ${entity_type} #${entity_id}:`);
      logger.info(`  - Semantic chunks: ${chunksCreated}`);
      logger.info(`  - Entities: ${kgResult.entities.length}`);
      logger.info(`  - Relationships: ${kgResult.relationships.length}`);

      // ✅ Get semantic chunking statistics
      const semanticStats = this.semanticChunking.getStatistics(semanticChunks);

      return {
        documentId,
        chunksCreated,
        // ✅ NEW: Include semantic chunking metadata
        entitiesExtracted: kgResult.entities.length,
        relationshipsExtracted: kgResult.relationships.length,
        semanticChunking: {
          totalChunks: semanticStats.totalChunks,
          averageChunkSize: semanticStats.averageChunkSize,
          minChunkSize: semanticStats.minChunkSize,
          maxChunkSize: semanticStats.maxChunkSize,
          totalTokens: semanticStats.totalTokens,
          avgImportance: parseFloat(semanticStats.avgImportance)
        },
        keywords: topKeywords.slice(0, 10)
      };

    } catch (error: any) {
      logger.error('[StructuredDataIngestion] Error:', error);
      
      // Mark sync job as failed
      await this.failSyncJob(jobId, error.message);
      
      throw error;
    }
  }

  /**
   * Delete all chunks for a specific entity
   */
  async deleteEntityChunks(params: DeleteEntityChunksParams): Promise<number> {
    const { container_id, source_app, entity_type, entity_id } = params;

    logger.info(`[StructuredDataIngestion] Deleting chunks for ${entity_type} #${entity_id}`);

    // Find document ID
    let query = `
      SELECT id FROM smartdocs.documents 
      WHERE container_id = $1 
        AND entity_type = $2 
        AND entity_id = $3
    `;
    const queryParams: any[] = [container_id, entity_type, entity_id];

    if (source_app) {
      query += ` AND source_app = $4`;
      queryParams.push(source_app);
    }

    const result = await this.db.query(query, queryParams);

    if (result.rows.length === 0) {
      return 0;
    }

    const documentId = result.rows[0].id;

    // Delete embeddings
    await this.db.query(
      'DELETE FROM smartdocs.embeddings WHERE document_id = $1',
      [documentId]
    );

    // Delete document
    const deleteResult = await this.db.query(
      'DELETE FROM smartdocs.documents WHERE id = $1',
      [documentId]
    );

    return deleteResult.rowCount || 0;
  }

  /**
   * @deprecated Use SemanticChunkingService instead
   * Create text chunks with overlap (LEGACY - kept for backward compatibility)
   */
  private createChunks(text: string, chunkSize: number, overlap: number): string[] {
    logger.warn('[StructuredDataIngestion] ⚠️ Using LEGACY fixed-size chunking. Semantic chunking recommended.');
    
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunk = text.slice(start, end).trim();
      
      if (chunk.length > 0) {
        chunks.push(chunk);
      }

      start += chunkSize - overlap;
      if (start >= text.length) break;
    }

    return chunks;
  }

  /**
   * Create sync job tracking record
   */
  private async createSyncJob(params: {
    container_id: string;
    source_app: string;
    entity_type: string;
    entity_id: string;
  }): Promise<string> {
    const result = await this.db.query(
      `INSERT INTO smartdocs.sync_jobs 
       (container_id, source_app, entity_type, entity_id, status, started_at)
       VALUES ($1, $2, $3, $4, 'running', NOW())
       RETURNING id`,
      [params.container_id, params.source_app, params.entity_type, params.entity_id]
    );

    return result.rows[0].id;
  }

  /**
   * Mark sync job as completed
   */
  private async completeSyncJob(jobId: string, chunksCreated: number): Promise<void> {
    await this.db.query(
      `UPDATE smartdocs.sync_jobs 
       SET status = 'completed', completed_at = NOW(), chunks_created = $1
       WHERE id = $2`,
      [chunksCreated, jobId]
    );
  }

  /**
   * Mark sync job as failed
   */
  private async failSyncJob(jobId: string, errorMessage: string): Promise<void> {
    await this.db.query(
      `UPDATE smartdocs.sync_jobs 
       SET status = 'failed', completed_at = NOW(), error_message = $1
       WHERE id = $2`,
      [errorMessage, jobId]
    );
  }

  /**
   * Update storage usage statistics
   */
  private async updateStorageStats(
    containerId: string,
    sourceApp: string,
    entityType: string
  ): Promise<void> {
    const query = `
      INSERT INTO smartdocs.storage_usage (
        container_id,
        source_type,
        source_app,
        entity_type,
        total_documents,
        total_chunks,
        total_tokens,
        storage_size_bytes,
        last_calculated_at
      )
      SELECT 
        d.container_id,
        d.source_type,
        d.source_app,
        d.entity_type,
        COUNT(DISTINCT d.id) as total_documents,
        COUNT(e.id) as total_chunks,
        SUM(LENGTH(e.chunk_text) / 4) as total_tokens,
        SUM(LENGTH(d.content)) as storage_size_bytes,
        NOW() as last_calculated_at
      FROM smartdocs.documents d
      LEFT JOIN smartdocs.embeddings e ON e.document_id = d.id
      WHERE d.container_id = $1
        AND d.source_app = $2
        AND d.entity_type = $3
      GROUP BY d.container_id, d.source_type, d.source_app, d.entity_type
      ON CONFLICT (container_id, source_type, source_app, entity_type)
      DO UPDATE SET
        total_documents = EXCLUDED.total_documents,
        total_chunks = EXCLUDED.total_chunks,
        total_tokens = EXCLUDED.total_tokens,
        storage_size_bytes = EXCLUDED.storage_size_bytes,
        last_calculated_at = NOW()
    `;

    await this.db.query(query, [containerId, sourceApp, entityType]);
  }

  /**
   * Get storage statistics for a container
   */
  async getStorageStats(containerId: string): Promise<any> {
    const query = `
      SELECT 
        source_type,
        source_app,
        entity_type,
        total_documents,
        total_chunks,
        total_tokens,
        storage_size_bytes,
        last_calculated_at,
        metadata
      FROM smartdocs.storage_usage
      WHERE container_id = $1
      ORDER BY source_type, entity_type
    `;

    const result = await this.db.query(query, [containerId]);

    // Group by source_type
    const stats = {
      auto_sync: {
        total_documents: 0,
        total_chunks: 0,
        total_tokens: 0,
        storage_size_bytes: 0,
        breakdown: {} as any
      },
      manual: {
        total_documents: 0,
        total_chunks: 0,
        total_tokens: 0,
        storage_size_bytes: 0
      },
      total: {
        total_documents: 0,
        total_chunks: 0,
        total_tokens: 0,
        storage_size_bytes: 0
      }
    };

    result.rows.forEach(row => {
      const type = row.source_type === 'auto_sync' ? 'auto_sync' : 'manual';
      
      stats[type].total_documents += row.total_documents;
      stats[type].total_chunks += row.total_chunks;
      stats[type].total_tokens += row.total_tokens;
      stats[type].storage_size_bytes += row.storage_size_bytes;

      if (type === 'auto_sync' && row.entity_type) {
        stats.auto_sync.breakdown[row.entity_type] = {
          documents: row.total_documents,
          chunks: row.total_chunks,
          tokens: row.total_tokens,
          size_bytes: row.storage_size_bytes,
          source_app: row.source_app
        };
      }

      stats.total.total_documents += row.total_documents;
      stats.total.total_chunks += row.total_chunks;
      stats.total.total_tokens += row.total_tokens;
      stats.total.storage_size_bytes += row.storage_size_bytes;
    });

    return stats;
  }
}
