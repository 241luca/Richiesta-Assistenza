// BACKUP DEL FILE ORIGINALE - 30 OTTOBRE 2025
// Fatto prima dell'uniformazione con worker.ts
// FIXED: 1 NOV 2025 - Now saves chunks to chunk_metadata table AND uses markdown for extraction

import { DatabaseClient } from '../database/client';
import { logger } from '../utils/logger';
import { OpenAIService } from './OpenAIService';
import { SemanticChunkingService } from './SemanticChunkingService';
import { KnowledgeGraphService } from './KnowledgeGraphService';
import { LLMEntityExtractionService } from './LLMEntityExtractionService'; // ✅ NEW
import { HybridExtractionService } from './HybridExtractionService'; // ✅ NEW: Hybrid AI+Pattern
import { AdvancedOCRService } from './AdvancedOCRService'; // ✅ NEW: MD conversion
import { MarkdownStorageService } from './MarkdownStorageService'; // ✅ NEW: MD storage
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
  // ✅ NEW: MD-first pipeline options
  use_markdown?: boolean; // Convert to MD and use MD chunking
  file_path?: string; // For document files (PDF, DOCX) - needed for OCR
  ocr_engine?: 'docling' | 'paddleocr-vl' | 'auto';
  chunking_method?: 'docling' | 'semantic' | 'both'; // For comparison
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
  private llmExtractor: LLMEntityExtractionService; // ✅ LLM-based extraction
  private hybridExtractor: HybridExtractionService; // ✅ NEW: Hybrid AI+Pattern extraction
  private advancedOCR: AdvancedOCRService; // ✅ NEW: MD conversion
  private markdownStorage: MarkdownStorageService; // ✅ NEW: MD storage

  constructor() {
    this.db = DatabaseClient.getInstance();
    this.openai = new OpenAIService();
    this.semanticChunking = new SemanticChunkingService();
    this.knowledgeGraph = new KnowledgeGraphService();
    this.llmExtractor = new LLMEntityExtractionService();
    this.hybridExtractor = new HybridExtractionService(
      this.db,
      this.openai,
      this.llmExtractor,
      this.knowledgeGraph
    ); // ✅ NEW
    this.advancedOCR = new AdvancedOCRService(); // ✅ NEW: MD conversion
    this.markdownStorage = new MarkdownStorageService(); // ✅ NEW: MD storage
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
    hybridExtraction?: {
      method: string;
      cost: number;
      pattern: any;
    };
    markdown?: string; // ✅ NEW: Include markdown if conversion was performed
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
      chunk_overlap = 200,
      // ✅ NEW: MD-first pipeline
      use_markdown = false,
      file_path,
      ocr_engine = 'auto',
      chunking_method = 'semantic'
    } = params;

    logger.info(`[StructuredDataIngestion] Ingesting ${entity_type} #${entity_id} from ${source_app}`);

    // ✅ VALIDATE: Check if container exists in containers table
    const containerCheck = await this.db.query(
      'SELECT id, name FROM smartdocs.containers WHERE id = $1',
      [container_id]
    );
    
    if (containerCheck.rows.length === 0) {
      throw new Error(
        `Container '${container_id}' not found. ` +
        `Please create the container first or use an existing container ID.`
      );
    }
    
    logger.info(`[StructuredDataIngestion] ✅ Container validated: ${containerCheck.rows[0].name}`);

    // Start sync job
    const jobId = await this.createSyncJob({
      container_id,
      source_app,
      entity_type,
      entity_id
    });

    try {
      // 1. Delete existing chunks for this entity
      // Solo se entity_type e entity_id sono definiti
      if (entity_type && entity_id) {
        await this.deleteEntityChunks({
          container_id,
          source_app,
          entity_type,
          entity_id
        });
      } else {
        logger.warn('[StructuredDataIngestion] Skipping delete: entity_type or entity_id is null/undefined');
      }

      // 2. Create virtual document WITH ALL METADATA
      const documentId = uuidv4();
      
      // ✅ NEW: MD-first pipeline - CONVERT but DON'T STORE YET
      let markdownContent = content;
      let markdownId: string | undefined;
      let doclingChunks: any[] = [];
      let ocrResult: any = null;
      
      if (use_markdown && file_path) {
        logger.info(`[StructuredDataIngestion] 🔄 Converting to Markdown using ${ocr_engine}`);
        
        // Read file buffer
        const fileBuffer = await require('fs').promises.readFile(file_path);
        const fileName = file_path.split('/').pop() || 'document';
        const mimeType = this.getMimeType(fileName);
        
        // Convert document to MD using AdvancedOCRService
        ocrResult = await this.advancedOCR.processDocument(
          fileBuffer,
          mimeType,
          fileName,
          {
            engine: ocr_engine === 'auto' ? 'auto' : ocr_engine,
            enableOCR: true,
            enableTableExtraction: true,
            enableFormulaRecognition: true,
            outputFormat: 'markdown'
          }
        );
        
        markdownContent = ocrResult.markdown || ocrResult.text || content;
        doclingChunks = ocrResult.doclingChunks || [];
        
        logger.info(`[StructuredDataIngestion] ✅ Markdown converted (${markdownContent.length} chars)`);
      }
      
      // Calculate content hash for deduplication
      const crypto = require('crypto');
      const contentToHash = use_markdown ? markdownContent : content;
      const contentHash = crypto.createHash('sha256').update(contentToHash).digest('hex');
      
      // Determine file info if available
      let fileSize: number | null = null;
      let mimeType: string | null = null;
      let fileName: string | null = null;
      
      if (file_path) {
        const fs = require('fs');
        const stats = fs.statSync(file_path);
        fileSize = stats.size;
        fileName = file_path.split('/').pop() || null;
        mimeType = this.getMimeType(fileName || '');
      }
      
      // Detect language (simple heuristic - default to 'it' for Italian)
      const language = 'it'; // TODO: Implement proper language detection
      
      const insertDocQuery = `
        INSERT INTO smartdocs.documents (
          id, container_id, external_doc_type, external_doc_id, title, content,
          content_hash, storage_url, file_size, mime_type, metadata, language,
          processing_status, processing_error, error_message, created_at, updated_at,
          source_type, entity_type, entity_id, source_app, last_synced_at, auto_update
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW(), $16, $17, $18, $19, NOW(), $20
        )
        RETURNING id
      `;

      await this.db.query(insertDocQuery, [
        documentId,                                           // id
        container_id,                                         // container_id
        entity_type,                                          // external_doc_type (same as entity_type)
        entity_id,                                            // external_doc_id (same as entity_id)
        title,                                                // title
        use_markdown ? markdownContent : content,             // content (use MD if converted)
        contentHash,                                          // content_hash
        file_path || null,                                    // storage_url (original file path)
        fileSize,                                             // file_size
        mimeType,                                             // mime_type
        JSON.stringify({                                      // metadata (JSONB)
          ...metadata,
          ingested_at: new Date().toISOString(),
          content_length: contentToHash.length,
          uses_markdown: use_markdown,
          ocr_engine: use_markdown ? ocr_engine : undefined,
          original_filename: fileName,
          chunking_method: chunking_method,
          semantic_chunking_enabled: true,
          hybrid_extraction_enabled: true  // Will be determined later
        }),
        language,                                             // language
        'PROCESSING',                                         // processing_status
        null,                                                 // processing_error
        null,                                                 // error_message
        source_type,                                          // source_type
        entity_type,                                          // entity_type
        entity_id,                                            // entity_id
        source_app,                                           // source_app
        auto_update                                           // auto_update
      ]);
      
      // ✅ NEW: NOW store Markdown AFTER document is created
      if (use_markdown && ocrResult) {
        markdownId = await this.markdownStorage.storeMarkdown({
          id: uuidv4(),
          documentId,
          containerId: container_id,
          markdown: markdownContent,
          originalFormat: file_path!.split('.').pop() || 'unknown',
          metadata: {
            pageCount: ocrResult.metadata.pageCount,
            wordCount: ocrResult.metadata.wordCount,
            tables: ocrResult.metadata.tables,
            formulas: ocrResult.metadata.formulas,
            images: ocrResult.metadata.images,
            conversionEngine: ocrResult.metadata.engine,
            conversionTime: ocrResult.metadata.processingTime
          },
          createdAt: new Date()
        });
        
        // Store Docling chunks if available
        if (doclingChunks.length > 0) {
          await this.markdownStorage.storeDoclingChunks(doclingChunks, documentId);
          logger.info(`[StructuredDataIngestion] ✅ Stored ${doclingChunks.length} Docling chunks`);
        }
        
        // Update document metadata with markdown_id
        await this.db.query(
          `UPDATE smartdocs.documents SET metadata = metadata || $1::jsonb WHERE id = $2`,
          [JSON.stringify({ markdown_id: markdownId }), documentId]
        );
        
        logger.info(`[StructuredDataIngestion] ✅ Markdown stored: ${markdownId}`);
      }

      // 3. SEMANTIC CHUNKING: Create intelligent chunks with context windows
      logger.info(`[StructuredDataIngestion] 🧠 Using SEMANTIC CHUNKING for ${entity_type} #${entity_id}`);
      
      // ✅ NEW: Route to appropriate chunking method
      const inputFormat = use_markdown ? 'markdown' : 'text';
      const textToChunk = use_markdown ? markdownContent : content;
      
      const semanticChunks = await this.semanticChunking.chunkDocument(
        textToChunk,
        documentId,
        title,
        inputFormat
      );
      logger.info(`[StructuredDataIngestion] ✅ Created ${semanticChunks.length} semantic chunks (${inputFormat} mode)`);
      
      // ✅ Log chunking comparison if both methods used
      if (chunking_method === 'both' && doclingChunks.length > 0) {
        logger.info(`[StructuredDataIngestion] 🔬 Chunking comparison:`);
        logger.info(`  - Docling hybrid: ${doclingChunks.length} chunks`);
        logger.info(`  - Semantic custom: ${semanticChunks.length} chunks`);
      }

      // 4. KNOWLEDGE GRAPH: Extract entities and relationships
      // ✅ NEW: Using HYBRID EXTRACTION (AI + Pattern Learning)
      logger.info(`[StructuredDataIngestion] 🔍 Hybrid Extraction: Checking for patterns...`);
      
      const useHybrid = metadata?.use_hybrid_extraction !== false; // Default true
      const forceAI = metadata?.use_llm_extraction === true; // Force AI if explicitly requested
      
      let totalEntities = 0;
      let totalRelationships = 0;
      let extractionCost = 0;
      let extractionMethod = 'regex';
      let patternInfo: any = null;
      let topKeywords: string[] = [];
      
      if (useHybrid) {
        // ✅ HYBRID EXTRACTION: Automatically chooses best method
        // ✅ FIX: Use markdownContent if converted, otherwise use original content
        const contentForExtraction = use_markdown ? markdownContent : content;
        
        try {
          const hybridResult = await this.hybridExtractor.extract({
            content: contentForExtraction, // ✅ FIXED: Use markdown content if available
            documentId,
            chunkId: semanticChunks[0]?.id || documentId,
            title,
            containerId: container_id,
            forceAI
          });
          
          totalEntities = hybridResult.entitiesSaved;
          totalRelationships = hybridResult.relationshipsSaved;
          extractionCost = hybridResult.cost;
          extractionMethod = hybridResult.method;
          
          if (hybridResult.patternUsed) {
            patternInfo = hybridResult.patternUsed;
            logger.info(
              `[StructuredDataIngestion] ✅ PATTERN extraction: ${patternInfo.type} ` +
              `(${totalEntities} entities, ${totalRelationships} relationships, $0, ${hybridResult.processingTimeMs}ms)`
            );
          } else if (hybridResult.method === 'ai') {
            logger.info(
              `[StructuredDataIngestion] 🤖 AI extraction: ${totalEntities} entities, ` +
              `${totalRelationships} relationships, $${extractionCost.toFixed(4)}, ${hybridResult.processingTimeMs}ms`
            );
            if (hybridResult.patternCreated) {
              logger.info(`[StructuredDataIngestion] 🎓 New pattern learned from this document`);
            }
          }
          
        } catch (error: any) {
          logger.error('[StructuredDataIngestion] Hybrid extraction failed, falling back to regex:', error);
          
          // ✅ FIX: Use markdownContent if converted, otherwise use original content
          const contentForExtraction = use_markdown ? markdownContent : content;
          
          // Fallback to regex
          const simpleKeywords = contentForExtraction.toLowerCase().match(/\b[a-zà-ü]{4,}\b/g) || [];
          topKeywords = [...new Set(simpleKeywords)].slice(0, 20);
          
          const kgResult = await this.knowledgeGraph.extractFromChunk(
            contentForExtraction,
            semanticChunks[0]?.id || documentId,
            documentId,
            title,
            topKeywords
          );
          
          totalEntities = kgResult.entities.length;
          totalRelationships = kgResult.relationships.length;
          extractionMethod = 'regex_fallback';
        }
      } else {
        // Legacy mode: Use old LLM or Regex extraction
        const useLLMExtraction = metadata?.use_llm_extraction === true;
        
        // ✅ FIX: Use markdownContent if converted, otherwise use original content
        const contentForExtraction = use_markdown ? markdownContent : content;
        
        if (useLLMExtraction) {
          // Old LLM extraction
          const llmMaxTokens = metadata?.llm_max_tokens || 4000;
          const llmTemperature = metadata?.llm_temperature ?? 0.2;
          const llmEnableSummary = metadata?.llm_enable_summary ?? true;

          const llmResult = await this.llmExtractor.extractAndSave(
            contentForExtraction, // ✅ FIXED
            documentId,
            semanticChunks[0]?.id || documentId,
            title,
            { maxTokens: llmMaxTokens, temperature: llmTemperature, enableSummary: llmEnableSummary }
          );
          
          totalEntities = llmResult.entitiesSaved + llmResult.entitiesMerged;
          totalRelationships = llmResult.relationshipsSaved;
          extractionCost = llmResult.cost;
          extractionMethod = 'ai_legacy';
          
          if (llmResult.summary) {
            metadata.llm_summary = llmResult.summary;
          }
        } else {
          // Old regex extraction
          const simpleKeywords = contentForExtraction.toLowerCase().match(/\b[a-zà-ü]{4,}\b/g) || [];
          topKeywords = [...new Set(simpleKeywords)].slice(0, 20);
          
          const kgResult = await this.knowledgeGraph.extractFromChunk(
            contentForExtraction, // ✅ FIXED
            semanticChunks[0]?.id || documentId,
            documentId,
            title,
            topKeywords
          );
          
          totalEntities = kgResult.entities.length;
          totalRelationships = kgResult.relationships.length;
          extractionMethod = 'regex_legacy';
        }
      }

      // 5. Generate embeddings for each semantic chunk AND save chunks to chunk_metadata
      let chunksCreated = 0;
      for (let i = 0; i < semanticChunks.length; i++) {
        const chunk = semanticChunks[i];
        
        try {
          // ✅ Generate a proper UUID for chunk_metadata (chunk.id might be custom format)
          const { v4: uuidv4 } = require('uuid');
          const chunkMetadataId = uuidv4();
          
          // ✅ SAVE CHUNK to chunk_metadata table WITH FULL SEMANTIC METADATA
          await this.db.query(
            `INSERT INTO smartdocs.chunk_metadata (
              id, document_id, chunk_id, chunk_index, title, section_path,
              topic_keywords, content_type, importance_score, is_section_header,
              heading_level, readability_score, sentence_count, word_count,
              previous_chunk_preview, next_chunk_preview, related_chunk_ids,
              parent_chunk_id, child_chunk_ids, embedding_text, embedding_text_length,
              tokens, chunking_version, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, NOW())`,
            [
              chunkMetadataId,                                             // id (proper UUID)
              documentId,                                                  // document_id
              chunk.id,                                                    // chunk_id (original custom ID)
              i,                                                           // chunk_index
              chunk.title || null,                                         // title
              chunk.sectionPath || [],                                     // section_path (text[] ARRAY - NO JSON.stringify!)
              chunk.contextualMetadata?.topicKeywords || [],               // topic_keywords (text[] ARRAY - NO JSON.stringify!)
              chunk.contextualMetadata?.documentType || 'unknown',         // content_type
              chunk.contextualMetadata?.importanceScore || 0.5,            // importance_score
              chunk.contextualMetadata?.isSectionHeader || false,          // is_section_header
              null,                                                        // heading_level (can be extracted later)
              chunk.contextualMetadata?.readabilityScore || 0,             // readability_score
              chunk.contextualMetadata?.sentenceCount || 0,                // sentence_count
              chunk.content.split(/\s+/).length,                           // word_count
              chunk.previousChunkPreview || null,                          // previous_chunk_preview
              chunk.nextChunkPreview || null,                              // next_chunk_preview
              chunk.relatedChunkIds || [],                                 // related_chunk_ids (text[] ARRAY - NO JSON.stringify!)
              null,                                                        // parent_chunk_id
              [],                                                          // child_chunk_ids (text[] ARRAY - empty for now)
              chunk.embeddingOptimized || chunk.content,                   // embedding_text (optimized version)
              (chunk.embeddingOptimized || chunk.content).length,          // embedding_text_length
              chunk.tokens || 0,                                           // tokens
              chunk.metadata?.chunkingVersion || '2.0',                    // chunking_version
            ]
          );
          
          // Generate embedding using optimized text (with metadata headers)
          const embedding = await this.openai.createEmbedding(chunk.embeddingOptimized || chunk.content);

          // ✅ SAVE EMBEDDING with FULL METADATA
          // NOTE: chunk_text stores the CLEAN content for display/retrieval
          //       embedding_text (in metadata) stores the optimized version used for embedding generation
          await this.db.query(
            `INSERT INTO smartdocs.embeddings (
              document_id, container_id, chunk_index, chunk_text, embedding, 
              metadata, token_count, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
            [
              documentId,                                    // document_id
              container_id,                                  // container_id
              i,                                             // chunk_index
              chunk.content,                                 // chunk_text (CLEAN content for display/retrieval)
              JSON.stringify(embedding),                     // embedding (vector)
              JSON.stringify({                               // metadata (JSONB)
                chunk_id: chunk.id,
                title: chunk.title,
                section_path: chunk.sectionPath,
                topic_keywords: chunk.contextualMetadata?.topicKeywords || [],
                importance_score: chunk.contextualMetadata?.importanceScore || 0.5,
                is_section_header: chunk.contextualMetadata?.isSectionHeader || false,
                readability_score: chunk.contextualMetadata?.readabilityScore || 0,
                sentence_count: chunk.contextualMetadata?.sentenceCount || 0,
                word_count: chunk.content.split(/\s+/).length,
                document_type: chunk.contextualMetadata?.documentType || 'unknown',
                chunking_version: chunk.metadata?.chunkingVersion || '2.0',
                embedding_text: chunk.embeddingOptimized      // Optimized text used for embedding (with headers)
              }),
              chunk.tokens || 0                              // token_count
            ]
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
          processing_method: extractionMethod,
          semantic_chunks: chunksCreated,
          entities_extracted: totalEntities,
          relationships_extracted: totalRelationships,
          extraction_cost: extractionCost,
          pattern_used: patternInfo,
          processed_at: new Date().toISOString()
        })]
      );

      // 7. Update sync job
      await this.completeSyncJob(jobId, chunksCreated);

      // 8. Update storage stats
      await this.updateStorageStats(container_id, source_app, entity_type);

      logger.info(`[StructuredDataIngestion] ✅ Successfully ingested ${entity_type} #${entity_id}:`);
      logger.info(`  - Semantic chunks: ${chunksCreated}`);
      logger.info(`  - Entities: ${totalEntities}`);
      logger.info(`  - Relationships: ${totalRelationships}`);
      logger.info(`  - Method: ${extractionMethod}`);
      if (extractionCost > 0) {
        logger.info(`  - Cost: $${extractionCost.toFixed(4)}`);
      }
      if (patternInfo) {
        logger.info(`  - Pattern: ${patternInfo.name} (${patternInfo.type})`);
      }

      // ✅ Get semantic chunking statistics
      const semanticStats = this.semanticChunking.getStatistics(semanticChunks);

      return {
        documentId,
        chunksCreated,
        entitiesExtracted: totalEntities,
        relationshipsExtracted: totalRelationships,
        semanticChunking: {
          totalChunks: semanticStats.totalChunks,
          averageChunkSize: semanticStats.averageChunkSize,
          minChunkSize: semanticStats.minChunkSize,
          maxChunkSize: semanticStats.maxChunkSize,
          totalTokens: semanticStats.totalTokens,
          avgImportance: parseFloat(semanticStats.avgImportance)
        },
        keywords: topKeywords.slice(0, 10),
        hybridExtraction: {
          method: extractionMethod,
          cost: extractionCost,
          pattern: patternInfo
        },
        // ✅ NEW: Include markdown if conversion was performed
        markdown: use_markdown ? markdownContent : undefined
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
   * Update storage usage statistics WITH ALL FIELDS
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
        last_calculated_at,
        metadata
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
        NOW() as last_calculated_at,
        jsonb_build_object(
          'last_update_timestamp', NOW(),
          'entity_types', jsonb_agg(DISTINCT d.entity_type),
          'document_count_by_status', (
            SELECT jsonb_object_agg(processing_status, cnt)
            FROM (
              SELECT processing_status, COUNT(*) as cnt
              FROM smartdocs.documents
              WHERE container_id = d.container_id
                AND source_app = d.source_app
                AND entity_type = d.entity_type
              GROUP BY processing_status
            ) status_counts
          ),
          'total_embeddings', COUNT(e.id),
          'avg_chunk_size', AVG(LENGTH(e.chunk_text)),
          'total_entities', (
            SELECT COUNT(*)
            FROM smartdocs.kg_entities ke
            WHERE ke.document_id IN (
              SELECT id FROM smartdocs.documents
              WHERE container_id = d.container_id
                AND source_app = d.source_app
                AND entity_type = d.entity_type
            )
          ),
          'total_relationships', (
            SELECT COUNT(*)
            FROM smartdocs.kg_relationships kr
            WHERE kr.document_id IN (
              SELECT id FROM smartdocs.documents
              WHERE container_id = d.container_id
                AND source_app = d.source_app
                AND entity_type = d.entity_type
            )
          )
        ) as metadata
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
        last_calculated_at = NOW(),
        metadata = EXCLUDED.metadata
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

  /**
   * Get MIME type from filename
   */
  private getMimeType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'doc': 'application/msword',
      'html': 'text/html',
      'htm': 'text/html',
      'txt': 'text/plain',
      'md': 'text/markdown'
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }
}