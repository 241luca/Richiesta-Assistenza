import 'dotenv/config';
import { DatabaseClient } from './database/client';
import { logger } from './utils/logger';
import { OpenAIService } from './services/OpenAIService';
import { SemanticChunkingService } from './services/SemanticChunkingService';
import { KnowledgeGraphService } from './services/KnowledgeGraphService';
import { LLMEntityExtractionService } from './services/LLMEntityExtractionService'; // ✅ NEW

const db = DatabaseClient.getInstance();
const openai = new OpenAIService();
const semanticChunker = new SemanticChunkingService({
  minChunkSize: 200,
  maxChunkSize: 1500,
  targetChunkSize: 900,
  overlapPercentage: 15
});
const knowledgeGraph = new KnowledgeGraphService();
const llmExtractor = new LLMEntityExtractionService(); // ✅ NEW: Optional LLM-based extraction

// ============================================================================
// UTILITY: RETRY LOGIC CON BACKOFF ESPONENZIALE
// ============================================================================
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000,
  operation: string = 'operation'
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      logger.debug(`[Worker] Attempt ${attempt + 1}/${maxRetries} for ${operation}`);
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      if (attempt < maxRetries - 1) {
        const delayMs = initialDelayMs * Math.pow(2, attempt); // Backoff esponenziale
        logger.warn(
          `[Worker] Retry attempt ${attempt + 1} failed for ${operation}, waiting ${delayMs}ms...`,
          { error: error.message }
        );
        await sleep(delayMs);
      } else {
        logger.error(
          `[Worker] ❌ All ${maxRetries} retries exhausted for ${operation}`,
          { error: error.message }
        );
      }
    }
  }
  
  throw lastError;
}

// Utility: Sleep
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// TIPO SYNC JOB
// ============================================================================
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
  retry_count?: number;
}

// ============================================================================
// MAIN PROCESSING LOGIC
// ============================================================================
async function processJob(job: SyncJob): Promise<void> {
  const jobStartTime = Date.now();
  let currentPhase = 'INITIALIZATION';
  
  logger.info(
    `[Worker] 🔄 Processing job ${job.id} (${job.entity_type}:${job.entity_id})` +
    ` [Retry: ${job.retry_count || 0}/3]`
  );

  try {
    // Update status to processing
    currentPhase = 'STATUS_UPDATE';
    await db.query(`
      UPDATE smartdocs.sync_jobs 
      SET status = 'processing', started_at = NOW()
      WHERE id = $1
    `, [job.id]);

    // Extract text content
    currentPhase = 'TEXT_EXTRACTION';
    const textContent = extractTextContent(job);
    
    if (!textContent || textContent.trim().length === 0) {
      throw new Error('No text content to process');
    }

    logger.info(`[Worker] 📄 Text length: ${textContent.length} chars`);

    // ========================================================================
    // PHASE 0: CREATE OR VERIFY DOCUMENT RECORD
    // ========================================================================
    currentPhase = 'DOCUMENT_CREATION';
    logger.info(`[Worker] 📝 Creating document record...`);
    
    try {
      await retryWithBackoff(
        () => db.query(`
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
        ]),
        2,
        1000,
        'document_creation'
      );
      logger.info(`[Worker] ✅ Document record ready: ${job.entity_id}`);
    } catch (error: any) {
      throw new Error(`Document creation failed: ${error.message}`);
    }

    // ========================================================================
    // PHASE 1: SEMANTIC CHUNKING
    // ========================================================================
    currentPhase = 'SEMANTIC_CHUNKING';
    logger.info(`[Worker] 🧠 Starting semantic chunking...`);
    
    const semanticChunks = await retryWithBackoff(
      () => semanticChunker.chunkDocument(
        textContent,
        job.entity_id,
        job.metadata?.title || `Document ${job.entity_id}`
      ),
      2,
      1000,
      'semantic_chunking'
    );

    const stats = semanticChunker.getStatistics(semanticChunks);
    logger.info(`[Worker] ✅ Semantic chunking complete:`, stats);

    if (semanticChunks.length === 0) {
      throw new Error('Semantic chunking produced no chunks');
    }

    // ========================================================================
    // PHASE 2: KNOWLEDGE GRAPH EXTRACTION (CON ERROR TRACKING)
    // ========================================================================
    currentPhase = 'KNOWLEDGE_GRAPH_EXTRACTION';
    logger.info(`[Worker] 🕸️ Extracting knowledge graph...`);
    
    // ✅ NEW: Check if LLM extraction is enabled for this job (via metadata flag)
    const useLLMExtraction = job.metadata?.use_llm_extraction === true;
    
    if (useLLMExtraction) {
      logger.info(`[Worker] 🤖 Using LLM-based entity extraction (GPT-3.5-turbo)`);
    }
    
    let totalEntities = 0;
    let totalRelationships = 0;
    let failedChunks = 0;
    let llmExtractionCost = 0;

    for (const chunk of semanticChunks) {
      try {
        if (useLLMExtraction) {
          // ✅ NEW: LLM-based extraction (more accurate, has cost)
          const llmResult = await retryWithBackoff(
            () => llmExtractor.extractAndSave(
              chunk.content,
              job.entity_id,
              chunk.id,
              job.metadata?.title || 'Document',
              { maxTokens: 1500, temperature: 0.3 }
            ),
            2,
            2000,
            `llm_extraction_chunk_${chunk.index}`
          );
          
          totalEntities += llmResult.entitiesSaved + llmResult.entitiesMerged;
          totalRelationships += llmResult.relationshipsSaved;
          llmExtractionCost += llmResult.cost;
          
          logger.info(
            `[Worker] 💰 Chunk ${chunk.index}: ${llmResult.entities.length} entities ` +
            `($${llmResult.cost.toFixed(4)})`
          );
        } else {
          // Default: Regex-based extraction (fast, free)
          const { entities, relationships } = await retryWithBackoff(
            () => knowledgeGraph.extractFromChunk(
              chunk.content,
              chunk.id,
              job.entity_id,
              job.metadata?.title || 'Document',
              chunk.contextualMetadata.topicKeywords
            ),
            2,
            1000,
            `kg_extraction_chunk_${chunk.index}`
          );
          
          totalEntities += entities.length;
          totalRelationships += relationships.length;
        }
      } catch (error: any) {
        failedChunks++;
        logger.warn(
          `[Worker] ⚠️ KG extraction failed for chunk ${chunk.index}:`,
          { error: error.message, chunk_id: chunk.id }
        );
      }
    }

    // Avviso se troppi chunk hanno fallito
    if (failedChunks > semanticChunks.length * 0.5) {
      logger.warn(
        `[Worker] ⚠️ WARNING: ${failedChunks}/${semanticChunks.length} chunks failed KG extraction!`
      );
    }

    logger.info(
      `[Worker] ✅ KG extraction complete:`,
      {
        method: useLLMExtraction ? 'LLM (GPT-3.5)' : 'Regex-based',
        entities: totalEntities,
        relationships: totalRelationships,
        failed_chunks: failedChunks,
        ...(useLLMExtraction && { total_cost_usd: llmExtractionCost.toFixed(4) })
      }
    );

    // ========================================================================
    // PHASE 3: SAVE CHUNK METADATA
    // ========================================================================
    currentPhase = 'CHUNK_METADATA_SAVE';
    logger.info(`[Worker] 💾 Saving chunk metadata...`);
    
    let metadataSaved = 0;
    for (const chunk of semanticChunks) {
      try {
        await retryWithBackoff(
          () => db.query(`
            INSERT INTO smartdocs.chunk_metadata (
              document_id, chunk_id, chunk_index,
              title, section_path, topic_keywords, content_type,
              importance_score, is_section_header, heading_level,
              readability_score, sentence_count, word_count,
              previous_chunk_preview, next_chunk_preview,
              related_chunk_ids, parent_chunk_id, child_chunk_ids,
              embedding_text, embedding_text_length, tokens,
              chunking_version, processed_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
            ON CONFLICT (document_id, chunk_index) DO UPDATE SET
              importance_score = EXCLUDED.importance_score,
              updated_at = NOW()
          `, [
            job.entity_id,
            chunk.id,
            chunk.index,
            chunk.title,
            null, // section_path
            chunk.contextualMetadata.topicKeywords,
            chunk.contextualMetadata.documentType,
            chunk.contextualMetadata.importanceScore,
            chunk.contextualMetadata.isSectionHeader,
            0, // heading_level
            chunk.contextualMetadata.readabilityScore,
            chunk.contextualMetadata.sentenceCount,
            chunk.content.split(/\s+/).length, // word_count
            chunk.previousChunkPreview || null,
            chunk.nextChunkPreview || null,
            chunk.relatedChunkIds || [],
            null, // parent_chunk_id
            [], // child_chunk_ids
            chunk.embeddingOptimized,
            chunk.embeddingOptimized?.length || 0,
            chunk.tokens,
            '2.0', // chunking_version
            new Date() // processed_at
          ]),
          2,
          800,
          `chunk_metadata_${chunk.index}`
        );
        metadataSaved++;
      } catch (error: any) {
        logger.error(
          `[Worker] ❌ Failed to save metadata for chunk ${chunk.index}:`,
          { error: error.message }
        );
        // Continua comunque
      }
    }

    logger.info(`[Worker] ✅ Chunk metadata saved: ${metadataSaved}/${semanticChunks.length}`);

    // ========================================================================
    // PHASE 4: GENERATE EMBEDDINGS (CON RETRY)
    // ========================================================================
    currentPhase = 'EMBEDDING_GENERATION';
    logger.info(`[Worker] 🎯 Generating embeddings...`);
    
    let chunksCreated = 0;
    let embeddingsFailed = 0;
    
    for (const chunk of semanticChunks) {
      try {
        const chunkEmbedding = await retryWithBackoff(
          () => openai.createEmbedding(chunk.embeddingOptimized),
          3,
          2000,
          `embedding_chunk_${chunk.index}`
        );
        
        await retryWithBackoff(
          () => db.query(`
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
            `[${chunkEmbedding.join(',')}]`,
            JSON.stringify({
              title: chunk.title,
              keywords: chunk.contextualMetadata.topicKeywords,
              importance: chunk.contextualMetadata.importanceScore,
              entity_type: job.entity_type,
              source_type: job.source_type
            }),
            chunk.tokens
          ]),
          2,
          1000,
          `embedding_save_${chunk.index}`
        );
        
        chunksCreated++;
      } catch (error: any) {
        embeddingsFailed++;
        logger.error(
          `[Worker] ❌ Failed to create/save embedding for chunk ${chunk.index}:`,
          { error: error.message }
        );
      }
    }

    logger.warn(
      `[Worker] Embeddings processed: ${chunksCreated} OK, ${embeddingsFailed} FAILED`
    );

    // ========================================================================
    // MARK AS COMPLETED
    // ========================================================================
    const totalDuration = Date.now() - jobStartTime;
    
    await db.query(`
      UPDATE smartdocs.sync_jobs 
      SET 
        status = 'completed', 
        completed_at = NOW(),
        chunks_created = $2,
        metadata = jsonb_set(
          COALESCE(metadata, '{}'::jsonb),
          '{processing_metrics}',
          $3::jsonb
        )
      WHERE id = $1
    `, [
      job.id,
      chunksCreated,
      JSON.stringify({
        total_duration_ms: totalDuration,
        chunks_semantic: semanticChunks.length,
        chunks_embeddings: chunksCreated,
        entities_extracted: totalEntities,
        relationships_extracted: totalRelationships,
        failed_chunks_kg: failedChunks,
        failed_embeddings: embeddingsFailed,
        completed_at: new Date().toISOString()
      })
    ]);

    logger.info(
      `[Worker] ✅ Job ${job.id} completed successfully\n` +
      `  ⏱️  Duration: ${totalDuration}ms\n` +
      `  📊 Chunks: ${chunksCreated}/${semanticChunks.length}\n` +
      `  🧠 Entities: ${totalEntities}\n` +
      `  🕸️  Relationships: ${totalRelationships}\n` +
      `  ⭐ Avg Importance: ${stats.avgImportance}` +
      (useLLMExtraction ? `\n  💰 LLM Cost: $${llmExtractionCost.toFixed(4)}` : '')
    );

  } catch (error: any) {
    const totalDuration = Date.now() - jobStartTime;
    
    logger.error(
      `[Worker] ❌ Job ${job.id} failed at phase: ${currentPhase}`,
      {
        error: error.message,
        stack: error.stack,
        duration_ms: totalDuration
      }
    );

    // Incrementa retry count
    const retryCount = (job.retry_count || 0) + 1;
    const maxRetries = 3;
    
    let newStatus = 'pending'; // Riprova
    if (retryCount >= maxRetries) {
      newStatus = 'failed'; // Troppi tentativi
      logger.error(
        `[Worker] ⚠️ Job ${job.id} giving up after ${retryCount} retries`
      );
    }

    try {
      await db.query(`
        UPDATE smartdocs.sync_jobs 
        SET 
          status = $2,
          completed_at = NOW(),
          retry_count = $3,
          error_message = $4,
          metadata = jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{last_error}',
            $5::jsonb
          )
        WHERE id = $1
      `, [
        job.id,
        newStatus,
        retryCount,
        `${error.message} (Phase: ${currentPhase}, Attempt: ${retryCount}/${maxRetries})`,
        JSON.stringify({
          phase: currentPhase,
          error_message: error.message,
          retry_attempt: retryCount,
          max_retries: maxRetries,
          failed_at: new Date().toISOString(),
          duration_ms: totalDuration
        })
      ]);
    } catch (dbError: any) {
      logger.error('[Worker] Failed to update job status after error:', dbError);
    }
  }
}

// ============================================================================
// TEXT EXTRACTION
// ============================================================================
function extractTextContent(job: SyncJob): string {
  if (!job.content) return '';
  
  if (typeof job.content === 'string') {
    return job.content;
  }
  
  if (job.content.text) {
    return job.content.text;
  }
  
  if (job.content.content) {
    return job.content.content;
  }
  
  return JSON.stringify(job.content);
}

// ============================================================================
// JOB POLLING (CON BATCH LIMIT E MEMORY MANAGEMENT)
// ============================================================================
async function pollForJobs(): Promise<void> {
  try {
    // ✅ FIX #1: BATCH LIMIT - Processa solo 5 job per ciclo
    const BATCH_SIZE = 5;
    
    logger.debug(`[Worker] Polling for pending jobs (batch size: ${BATCH_SIZE})...`);
    
    // Get pending jobs
    const result = await db.query(`
      SELECT * FROM smartdocs.sync_jobs
      WHERE status = 'pending'
      ORDER BY created_at ASC
      LIMIT $1
    `, [BATCH_SIZE]);

    if (result.rows.length > 0) {
      logger.info(
        `[Worker] Found ${result.rows.length} pending jobs` +
        (result.rows.length === BATCH_SIZE ? ` (batch limit reached)` : '')
      );
      
      for (const job of result.rows as SyncJob[]) {
        await processJob(job);
      }
    } else {
      logger.debug('[Worker] No pending jobs');
    }

    // Check for stuck processing jobs (>5 minutes)
    logger.debug('[Worker] Checking for stuck jobs...');
    
    const stuckResult = await db.query(`
      SELECT * FROM smartdocs.sync_jobs
      WHERE status = 'processing'
        AND started_at < NOW() - INTERVAL '5 minutes'
      LIMIT 10
    `);

    if (stuckResult.rows.length > 0) {
      logger.warn(
        `[Worker] Found ${stuckResult.rows.length} stuck jobs, attempting recovery...`
      );
      
      // Reset con incremento retry count
      for (const stuckJob of stuckResult.rows) {
        const newRetryCount = (stuckJob.retry_count || 0) + 1;
        const maxRetries = 3;
        
        let newStatus = 'pending';
        if (newRetryCount >= maxRetries) {
          newStatus = 'failed';
          logger.warn(`[Worker] Stuck job ${stuckJob.id} exceeded max retries`);
        }
        
        await db.query(`
          UPDATE smartdocs.sync_jobs
          SET 
            status = $2,
            started_at = NULL,
            retry_count = $3,
            error_message = $4,
            metadata = jsonb_set(
              COALESCE(metadata, '{}'::jsonb),
              '{stuck_recovery}',
              $5::jsonb
            )
          WHERE id = $1
        `, [
          stuckJob.id,
          newStatus,
          newRetryCount,
          `Job stuck for >5 minutes (Attempt: ${newRetryCount}/${maxRetries})`,
          JSON.stringify({
            recovered_at: new Date().toISOString(),
            was_stuck_minutes: 5,
            retry_attempt: newRetryCount
          })
        ]);
      }
    }

  } catch (error) {
    logger.error('[Worker] Error polling for jobs:', error);
  }
}

// ============================================================================
// MONITORING (Memory e Connection Pool)
// ============================================================================
function startMonitoring(): void {
  // Monitor memory usage ogni 60 secondi
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const rssMB = Math.round(memUsage.rss / 1024 / 1024);
    
    logger.debug('[Worker] Memory Status', {
      heap_used_mb: heapUsedMB,
      heap_total_mb: heapTotalMB,
      rss_mb: rssMB,
      external_mb: Math.round(memUsage.external / 1024 / 1024)
    });
    
    // ⚠️ Avviso se heap > 500MB
    if (memUsage.heapUsed > 500 * 1024 * 1024) {
      logger.warn(
        `[Worker] ⚠️ HIGH MEMORY USAGE: ${heapUsedMB}MB / ${heapTotalMB}MB`
      );
    }
  }, 60000);
}

// ============================================================================
// MAIN
// ============================================================================
async function main() {
  logger.info('');
  logger.info('╔════════════════════════════════════════════════════════╗');
  logger.info('║  🧠 SmartDocs Enterprise Worker v2 (FIXED)    ║');
  logger.info('║  Semantic Chunking + Knowledge Graph + Retry  ║');
  logger.info('╚════════════════════════════════════════════════════════╝');
  logger.info('');
  logger.info(`📊 Polling interval: ${process.env.WORKER_POLL_INTERVAL || 5000}ms`);
  logger.info(`💾 Database: ${process.env.DATABASE_URL?.split('@')[1] || 'configured'}`);
  logger.info(`🤖 OpenAI: ${process.env.OPENAI_API_KEY ? 'configured' : 'NOT SET'}`);
  logger.info(`🔄 Batch size: 5 jobs per poll`);
  logger.info(`🔁 Max retries: 3 per job`);
  logger.info('');

  // Start monitoring
  startMonitoring();

  const pollInterval = parseInt(process.env.WORKER_POLL_INTERVAL || '5000');
  
  logger.info(`[Worker] 🔄 Setting up polling interval: ${pollInterval}ms`);
  
  setInterval(async () => {
    logger.debug('[Worker] ⏰ Poll cycle started...');
    try {
      await pollForJobs();
    } catch (error) {
      logger.error('[Worker] ❌ Error in polling interval:', error);
    }
  }, pollInterval);

  // Initial poll
  logger.info('[Worker] 🚀 Running initial poll...');
  await pollForJobs();
  
  logger.info('✅ Worker v2 ready and polling for jobs...');
  logger.info('');
}

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================
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
