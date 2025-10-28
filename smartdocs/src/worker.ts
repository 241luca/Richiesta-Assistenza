import 'dotenv/config';
import { DatabaseClient } from './database/client';
import { logger } from './utils/logger';
import { OpenAIService } from './services/OpenAIService';
import { SemanticChunkingService } from './services/SemanticChunkingService';
import { KnowledgeGraphService } from './services/KnowledgeGraphService';

const db = DatabaseClient.getInstance();
const openai = new OpenAIService();
const semanticChunker = new SemanticChunkingService({
  minChunkSize: 200,
  maxChunkSize: 1500,
  targetChunkSize: 900,
  overlapPercentage: 15
});
const knowledgeGraph = new KnowledgeGraphService();

interface SyncJob {
  id: string;
  container_id: string;
  entity_type: string;
  entity_id: string;
  source_type: string;
  status: string;
  content: any;
  metadata: any;
  started_at: Date | null;
  completed_at: Date | null;
  error_message: string | null;
  chunks_created: number;
}

async function processJob(job: SyncJob): Promise<void> {
  logger.info(`[Worker] 🔄 Processing job ${job.id} (${job.entity_type}:${job.entity_id})`);

  try {
    // Update status to processing
    await db.query(`
      UPDATE smartdocs.sync_jobs 
      SET status = 'processing', started_at = NOW()
      WHERE id = $1
    `, [job.id]);

    // Extract text content
    const textContent = extractTextContent(job);
    
    if (!textContent || textContent.trim().length === 0) {
      throw new Error('No text content to process');
    }

    logger.info(`[Worker] 📄 Text length: ${textContent.length} chars`);

    // PHASE 0: CREATE OR VERIFY DOCUMENT RECORD
    logger.info(`[Worker] 📝 Creating document record...`);
    await db.query(`
      INSERT INTO smartdocs.documents (id, container_id, title, content, metadata)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE SET
        content = EXCLUDED.content,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
    `, [
      job.entity_id,
      job.container_id,
      job.metadata?.title || `Document ${job.entity_id}`,
      textContent,
      JSON.stringify({
        entity_type: job.entity_type,
        source_type: job.source_type,
        processed_by_worker: true,
        ...job.metadata
      })
    ]);
    logger.info(`[Worker] ✅ Document record ready: ${job.entity_id}`);

    // PHASE 1: SEMANTIC CHUNKING
    logger.info(`[Worker] 🧠 Starting semantic chunking...`);
    const semanticChunks = await semanticChunker.chunkDocument(
      textContent,
      job.entity_id,
      job.metadata?.title || `Document ${job.entity_id}`
    );

    const stats = semanticChunker.getStatistics(semanticChunks);
    logger.info(`[Worker] ✅ Semantic chunking complete:`, stats);

    // PHASE 2: KNOWLEDGE GRAPH EXTRACTION
    logger.info(`[Worker] 🕸️ Extracting knowledge graph...`);
    let totalEntities = 0;
    let totalRelationships = 0;

    for (const chunk of semanticChunks) {
      try {
        const { entities, relationships } = await knowledgeGraph.extractFromChunk(
          chunk.content,
          chunk.id,
          job.entity_id,
          job.metadata?.title || 'Document',
          chunk.contextualMetadata.topicKeywords
        );
        
        totalEntities += entities.length;
        totalRelationships += relationships.length;
      } catch (error: any) {
        logger.warn(`[Worker] ⚠️ KG extraction failed for chunk ${chunk.index}:`, error.message);
        // Continue with next chunk
      }
    }

    logger.info(`[Worker] ✅ KG extraction complete: ${totalEntities} entities, ${totalRelationships} relationships`);

    // PHASE 3: SAVE CHUNK METADATA
    logger.info(`[Worker] 💾 Saving chunk metadata...`);
    for (const chunk of semanticChunks) {
      await db.query(`
        INSERT INTO smartdocs.chunk_metadata (
          document_id, chunk_id, chunk_index,
          title, topic_keywords, content_type,
          importance_score, is_section_header,
          readability_score, sentence_count,
          previous_chunk_preview, next_chunk_preview,
          related_chunk_ids, embedding_text, tokens
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (document_id, chunk_index) DO UPDATE SET
          importance_score = EXCLUDED.importance_score,
          updated_at = NOW()
      `, [
        job.entity_id,
        chunk.id,
        chunk.index,
        chunk.title,
        chunk.contextualMetadata.topicKeywords,
        chunk.contextualMetadata.documentType,
        chunk.contextualMetadata.importanceScore,
        chunk.contextualMetadata.isSectionHeader,
        chunk.contextualMetadata.readabilityScore,
        chunk.contextualMetadata.sentenceCount,
        chunk.previousChunkPreview,
        chunk.nextChunkPreview,
        chunk.relatedChunkIds,
        chunk.embeddingOptimized,
        chunk.tokens
      ]);
    }

    // PHASE 4: GENERATE EMBEDDINGS
    logger.info(`[Worker] 🎯 Generating embeddings...`);
    let chunksCreated = 0;
    
    for (const chunk of semanticChunks) {
      const chunkEmbedding = await openai.createEmbedding(chunk.embeddingOptimized);
      
      await db.query(`
        INSERT INTO smartdocs.embeddings
          (document_id, container_id, chunk_index, chunk_text, embedding, metadata, token_count)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (document_id, chunk_index) DO UPDATE SET
          embedding = EXCLUDED.embedding,
          chunk_text = EXCLUDED.chunk_text
      `, [
        job.entity_id,
        job.container_id,
        chunk.index,
        chunk.content,
        `[${chunkEmbedding.join(',')}]`, // PostgreSQL vector format
        JSON.stringify({
          title: chunk.title,
          keywords: chunk.contextualMetadata.topicKeywords,
          importance: chunk.contextualMetadata.importanceScore,
          entity_type: job.entity_type,
          source_type: job.source_type
        }),
        chunk.tokens
      ]);
      
      chunksCreated++;
    }

    // Mark as completed
    await db.query(`
      UPDATE smartdocs.sync_jobs 
      SET status = 'completed', 
          completed_at = NOW(),
          chunks_created = $2
      WHERE id = $1
    `, [job.id, chunksCreated]);

    logger.info(
      `[Worker] ✅ Job ${job.id} completed successfully\n` +
      `  📊 Chunks: ${chunksCreated}\n` +
      `  🧠 Entities: ${totalEntities}\n` +
      `  🕸️ Relationships: ${totalRelationships}\n` +
      `  ⭐ Avg Importance: ${stats.avgImportance}`
    );

  } catch (error: any) {
    logger.error(`[Worker] ❌ Job ${job.id} failed:`, error);

    await db.query(`
      UPDATE smartdocs.sync_jobs 
      SET status = 'failed',
          completed_at = NOW(),
          error_message = $2
      WHERE id = $1
    `, [job.id, error.message || 'Unknown error']);
  }
}

function extractTextContent(job: SyncJob): string {
  if (!job.content) return '';
  
  // Handle different content structures
  if (typeof job.content === 'string') {
    return job.content;
  }
  
  if (job.content.text) {
    return job.content.text;
  }
  
  if (job.content.content) {
    return job.content.content;
  }
  
  // Fallback to JSON stringification
  return JSON.stringify(job.content);
}

async function pollForJobs(): Promise<void> {
  try {
    // Get pending jobs
    const result = await db.query(`
      SELECT * FROM smartdocs.sync_jobs
      WHERE status = 'pending'
      ORDER BY created_at ASC
      LIMIT 10
    `);

    if (result.rows.length > 0) {
      logger.info(`[Worker] Found ${result.rows.length} pending jobs`);
      
      for (const job of result.rows as SyncJob[]) {
        await processJob(job);
      }
    }

    // Also check for stuck processing jobs (>5 minutes)
    const stuckResult = await db.query(`
      SELECT * FROM smartdocs.sync_jobs
      WHERE status = 'processing'
        AND started_at < NOW() - INTERVAL '5 minutes'
      LIMIT 5
    `);

    if (stuckResult.rows.length > 0) {
      logger.warn(`[Worker] Found ${stuckResult.rows.length} stuck jobs, resetting to pending`);
      
      await db.query(`
        UPDATE smartdocs.sync_jobs
        SET status = 'pending', started_at = NULL
        WHERE status = 'processing'
          AND started_at < NOW() - INTERVAL '5 minutes'
      `);
    }

  } catch (error) {
    logger.error('[Worker] Error polling for jobs:', error);
  }
}

async function main() {
  logger.info('');
  logger.info('╔════════════════════════════════════════════════════════╗');
  logger.info('║     🧠 SmartDocs Enterprise Worker             ║');
  logger.info('║     Semantic Chunking + Knowledge Graph        ║');
  logger.info('╚════════════════════════════════════════════════════════╝');
  logger.info('');
  logger.info(`📊 Polling interval: ${process.env.WORKER_POLL_INTERVAL || 5000}ms`);
  logger.info(`💾 Database: ${process.env.DATABASE_URL?.split('@')[1] || 'configured'}`);
  logger.info(`🤖 OpenAI: ${process.env.OPENAI_API_KEY ? 'configured' : 'NOT SET'}`);
  logger.info('');

  const pollInterval = parseInt(process.env.WORKER_POLL_INTERVAL || '5000');
  
  setInterval(async () => {
    await pollForJobs();
  }, pollInterval);

  // Initial poll
  await pollForJobs();
  
  logger.info('✅ Worker ready and polling for jobs...');
  logger.info('');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('[Worker] Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('[Worker] Shutting down gracefully...');
  process.exit(0);
});

main().catch((error) => {
  logger.error('[Worker] Fatal error:', error);
  process.exit(1);
});
