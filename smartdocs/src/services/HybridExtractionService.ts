import { DatabaseClient } from '../database/client';
import { OpenAIService } from './OpenAIService';
import { LLMEntityExtractionService } from './LLMEntityExtractionService';
import { KnowledgeGraphService } from './KnowledgeGraphService';
import { DocumentClassifierService } from './DocumentClassifierService';
import { PatternGeneratorService } from './PatternGeneratorService';
import logger from '../utils/logger';

interface ExtractionResult {
  method: 'ai' | 'regex' | 'pattern';
  entities: any[];
  relationships: any[];
  entitiesSaved: number;
  relationshipsSaved: number;
  cost: number;
  processingTimeMs: number;
  patternUsed?: {
    id: string;
    type: string;
    name: string;
  };
  patternCreated?: boolean;
  classificationConfidence?: number;
}

/**
 * HybridExtractionService
 * 
 * Intelligent orchestrator that decides:
 * 1. Check if document matches known pattern → Use Regex (fast, free)
 * 2. No match → Use AI (slow, costs money) + Generate new pattern
 * 3. Track usage and accuracy for continuous improvement
 */
export class HybridExtractionService {
  private db: DatabaseClient;
  private openai: OpenAIService;
  private llmExtractor: LLMEntityExtractionService;
  private kgService: KnowledgeGraphService;
  private classifier: DocumentClassifierService;
  private patternGenerator: PatternGeneratorService;

  constructor(
    db: DatabaseClient,
    openai: OpenAIService,
    llmExtractor: LLMEntityExtractionService,
    kgService: KnowledgeGraphService
  ) {
    this.db = db;
    this.openai = openai;
    this.llmExtractor = llmExtractor;
    this.kgService = kgService;
    this.classifier = new DocumentClassifierService(db, openai);
    this.patternGenerator = new PatternGeneratorService(db, openai);
  }

  /**
   * Main extraction method - decides AI vs Regex automatically
   */
  async extract(params: {
    content: string;
    documentId: string;
    chunkId: string;
    title?: string;
    containerId?: string;
    forceAI?: boolean; // Override to force AI extraction
  }): Promise<ExtractionResult> {
    const { content, documentId, chunkId, title, containerId, forceAI = false } = params;
    const startTime = Date.now();

    logger.info(`[HybridExtraction] Starting extraction for document ${documentId}`);
    logger.info(`[HybridExtraction] forceAI=${forceAI}, containerId=${containerId}, title=${title}`);

    try {
      // Step 1: Classify document (unless forcing AI)
      let classification = null;
      
      if (!forceAI) {
        logger.info(`[HybridExtraction] 🔍 Calling classifier.classifyDocument()...`);
        
        classification = await this.classifier.classifyDocument({
          content,
          title,
          containerId
        });

        logger.info(`[HybridExtraction] 📊 Classification result: matched=${classification.matched}, confidence=${(classification.confidence * 100).toFixed(1)}%, method=${classification.method}`);
      } else {
        logger.info(`[HybridExtraction] ⚠️ forceAI=true, skipping classification`);
      }

      // Step 2: Decide extraction method
      if (classification && classification.matched && classification.pattern) {
        // ✅ PATTERN MATCHED → Use Regex extraction
        logger.info(`[HybridExtraction] ✅ Pattern matched! Using pattern extraction`);
        return await this.extractWithPattern(
          classification.pattern,
          content,
          documentId,
          chunkId,
          title,
          startTime,
          classification
        );
      } else {
        // ❌ NO MATCH → Use AI extraction + Create new pattern
        logger.info(`[HybridExtraction] ❌ No pattern match, using AI extraction`);
        return await this.extractWithAI(
          content,
          documentId,
          chunkId,
          title,
          containerId,
          startTime
        );
      }

    } catch (error: any) {
      logger.error('[HybridExtraction] Extraction failed:', error);
      throw error;
    }
  }

  /**
   * Extract using regex pattern (fast, free)
   */
  private async extractWithPattern(
    pattern: any,
    content: string,
    documentId: string,
    chunkId: string,
    title: string | undefined,
    startTime: number,
    classification: any
  ): Promise<ExtractionResult> {
    logger.info(`[HybridExtraction] 🚀 Using PATTERN extraction: ${pattern.document_type}`);

    try {
      const entities: any[] = [];
      const relationships: any[] = [];

      // Extract entities using regex patterns
      const entityPatterns = pattern.entity_patterns || {};
      
      for (const [entityKey, entityDef] of Object.entries(entityPatterns)) {
        const def = entityDef as any;
        const regex = new RegExp(def.regex, 'gm');
        let match;

        while ((match = regex.exec(content)) !== null) {
          if (match[1]) {
            entities.push({
              name: match[1].trim(),
              type: def.type || 'OTHER',
              confidence: def.confidence || 0.90,
              source: 'pattern',
              pattern_key: entityKey
            });
          }
        }
      }

      // Save entities to database WITH ALL AVAILABLE FIELDS
      let entitiesSaved = 0;
      const entityMap = new Map<string, string>(); // name -> id

      for (const entity of entities) {
        const { v4: uuidv4 } = require('uuid');
        const entityId = uuidv4();
        
        const result = await this.db.query(
          `INSERT INTO smartdocs.kg_entities (
            id, document_id, name, normalized_name, type, importance, confidence,
            aliases, canonical_form, description, definition, document_ids, chunk_ids,
            frequency, first_occurrence_position, properties, attributes, related_entity_ids,
            is_canonical, canonical_entity_id, merged_from_ids, first_seen, last_seen,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW(), NOW(), NOW(), NOW()
          )
          ON CONFLICT (document_id, normalized_name, type)
          DO UPDATE SET
            importance = GREATEST(EXCLUDED.importance, smartdocs.kg_entities.importance),
            frequency = smartdocs.kg_entities.frequency + 1,
            last_seen = NOW()
          RETURNING id`,
          [
            entityId,                                      // id
            documentId,                                    // document_id
            entity.name,                                   // name
            this.normalizeEntityName(entity.name),         // normalized_name
            entity.type,                                   // type
            entity.confidence,                             // importance (use confidence)
            entity.confidence,                             // confidence
            entity.aliases || [],                          // aliases (text[] ARRAY - NO JSON.stringify!)
            entity.name,                                   // canonical_form (use original name)
            entity.context || null,                        // description
            null,                                          // definition (can be populated later)
            [documentId],                                  // document_ids (text[] ARRAY - NO JSON.stringify!)
            [chunkId],                                     // chunk_ids (text[] ARRAY - NO JSON.stringify!)
            1,                                             // frequency (initial)
            0,                                             // first_occurrence_position
            JSON.stringify({}),                            // properties (JSONB)
            JSON.stringify({}),                            // attributes (JSONB)
            [],                                            // related_entity_ids (text[] ARRAY - empty for now)
            true,                                          // is_canonical
            null,                                          // canonical_entity_id
            []                                             // merged_from_ids (text[] ARRAY - empty for now)
          ]
        );

        // Map the actual database ID (handles both INSERT and UPDATE cases)
        if (result.rows && result.rows.length > 0) {
          const actualId = result.rows[0].id;
          entityMap.set(this.normalizeEntityName(entity.name), actualId);
          entitiesSaved++;
        }
      }

      // 🔥 NEW: Extract relationships using KnowledgeGraphService (not pattern rules)
      // Pattern handles ENTITY extraction (fast, cheap), KG handles RELATIONSHIPS (dynamic, context-aware)
      logger.info(`[HybridExtraction] 🔗 Extracting relationships using KnowledgeGraphService...`);
      
      let relationshipsSaved = 0;
      
      try {
        // Use KG service to build relationships from extracted entities
        const kgResult = await this.kgService.extractFromChunk(
          content,
          chunkId,
          documentId,
          title,
          [] // No keywords needed - we already have entities
        );
        
        relationshipsSaved = kgResult.relationships.length;
        
        logger.info(`[HybridExtraction] ✅ KG Service extracted ${relationshipsSaved} relationships`);
      } catch (kgError: any) {
        logger.error(`[HybridExtraction] ⚠️ KG relationship extraction failed:`, kgError.message);
        // Don't fail the entire extraction - entities are still valuable
        relationshipsSaved = 0;
      }

      const processingTimeMs = Date.now() - startTime;

      // Log pattern usage
      await this.logPatternUsage({
        patternId: pattern.id,
        documentId,
        containerId: undefined,
        success: true,
        embeddingSimilarity: classification.method === 'embedding' ? classification.confidence : null,
        keywordMatchScore: classification.method === 'keyword' ? classification.confidence : null,
        entitiesExtracted: entitiesSaved,
        relationshipsExtracted: relationshipsSaved,
        extractionTimeMs: processingTimeMs
      });

      // Update pattern stats
      await this.updatePatternStats(pattern.id, true);

      logger.info(`[HybridExtraction] ✅ Pattern extraction completed: ${entitiesSaved} entities, ${relationshipsSaved} relationships in ${processingTimeMs}ms`);
      logger.info(`[HybridExtraction] 💡 Strategy: Pattern (entities) + KG Service (relationships) = HYBRID ⚡`);

      return {
        method: 'pattern',
        entities,
        relationships: [], // Relationships are now in the DB via KG Service
        entitiesSaved,
        relationshipsSaved,
        cost: 0, // No cost!
        processingTimeMs,
        patternUsed: {
          id: pattern.id,
          type: pattern.document_type,
          name: pattern.pattern_name
        },
        classificationConfidence: classification.confidence
      };

    } catch (error: any) {
      logger.error('[HybridExtraction] Pattern extraction failed, falling back to AI:', error);
      
      // Log failure
      await this.logPatternUsage({
        patternId: pattern.id,
        documentId,
        containerId: undefined,
        success: false,
        errorMessage: error.message,
        fallbackToAI: true,
        extractionTimeMs: Date.now() - startTime
      });

      await this.updatePatternStats(pattern.id, false);

      // Fallback to AI
      return await this.extractWithAI(content, documentId, chunkId, title, undefined, startTime);
    }
  }

  /**
   * Extract using AI (slow, costs money) + Generate pattern for future
   */
  private async extractWithAI(
    content: string,
    documentId: string,
    chunkId: string,
    title: string | undefined,
    containerId: string | undefined,
    startTime: number
  ): Promise<ExtractionResult> {
    logger.info('[HybridExtraction] 🤖 Using AI extraction (no pattern found)');

    try {
      // Use LLM extraction
      const llmResult = await this.llmExtractor.extractAndSave(
        content,
        documentId,
        chunkId,
        title,
        {
          maxTokens: 4000,
          temperature: 0.2,
          enableSummary: false
        }
      );

      const processingTimeMs = Date.now() - startTime;

      // ✅ ALWAYS create pattern from AI results (removed >= 3 entities condition)
      let patternCreated = false;
      
      if (llmResult.entities.length > 0) { // At least 1 entity required
        try {
          logger.info(`[HybridExtraction] 🏛️ Creating new pattern from ${llmResult.entities.length} entities`);
          
          const pattern = await this.patternGenerator.generatePattern({
            documentId,
            content,
            title: title || '',
            entities: llmResult.entities,
            relationships: llmResult.relationships || [],
            containerId
          });

          const patternId = await this.patternGenerator.savePattern(pattern, {
            documentId,
            containerId
          });

          logger.info(`[HybridExtraction] ✅ New pattern created: ${patternId} - Type: ${pattern.document_type}`);
          patternCreated = true;
        } catch (patternError: any) {
          logger.error('[HybridExtraction] ❌ Failed to create pattern:', patternError.message);
          logger.warn('[HybridExtraction] ⚠️ Continuing without pattern (AI extraction succeeded)');
          // Don't throw - AI extraction worked, just pattern creation failed
          // This can happen if embedding generation fails
        }
      } else {
        logger.warn('[HybridExtraction] ⚠️ No entities extracted - cannot create pattern');
      }

      logger.info(`[HybridExtraction] ✅ AI extraction completed: ${llmResult.entitiesSaved} entities, ${llmResult.relationshipsSaved} relationships, cost: $${llmResult.cost.toFixed(4)}`);

      return {
        method: 'ai',
        entities: llmResult.entities,
        relationships: llmResult.relationships || [],
        entitiesSaved: llmResult.entitiesSaved,
        relationshipsSaved: llmResult.relationshipsSaved,
        cost: llmResult.cost,
        processingTimeMs,
        patternCreated
      };

    } catch (error: any) {
      logger.error('[HybridExtraction] AI extraction failed:', error);
      throw error;
    }
  }

  /**
   * Normalize entity name for consistent matching
   */
  private normalizeEntityName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Log pattern usage for analytics
   */
  private async logPatternUsage(params: {
    patternId: string;
    documentId: string;
    containerId?: string;
    success: boolean;
    embeddingSimilarity?: number | null;
    keywordMatchScore?: number | null;
    entitiesExtracted?: number;
    relationshipsExtracted?: number;
    extractionTimeMs: number;
    errorMessage?: string;
    fallbackToAI?: boolean;
  }): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO smartdocs.pattern_usage_log (
          pattern_id,
          document_id,
          container_id,
          used_at,
          success,
          embedding_similarity,
          keyword_match_score,
          entities_extracted,
          relationships_extracted,
          extraction_time_ms,
          error_message,
          fallback_to_ai
        ) VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          params.patternId,
          params.documentId,
          params.containerId || null,
          params.success,
          params.embeddingSimilarity || null,
          params.keywordMatchScore || null,
          params.entitiesExtracted || 0,
          params.relationshipsExtracted || 0,
          params.extractionTimeMs,
          params.errorMessage || null,
          params.fallbackToAI || false
        ]
      );
    } catch (error: any) {
      logger.error('[HybridExtraction] Failed to log pattern usage:', error);
    }
  }

  /**
   * Update pattern statistics
   */
  private async updatePatternStats(patternId: string, success: boolean): Promise<void> {
    try {
      if (success) {
        await this.db.query(
          `UPDATE smartdocs.document_patterns 
           SET usage_count = usage_count + 1,
               success_count = success_count + 1,
               last_used_at = NOW()
           WHERE id = $1`,
          [patternId]
        );
      } else {
        await this.db.query(
          `UPDATE smartdocs.document_patterns 
           SET usage_count = usage_count + 1,
               failure_count = failure_count + 1,
               last_used_at = NOW()
           WHERE id = $1`,
          [patternId]
        );
      }
    } catch (error: any) {
      logger.error('[HybridExtraction] Failed to update pattern stats:', error);
    }
  }

  /**
   * Get extraction statistics
   */
  async getStatistics(containerId?: string): Promise<any> {
    try {
      let query = `
        SELECT 
          COUNT(*) FILTER (WHERE success = true AND fallback_to_ai = false) as pattern_successes,
          COUNT(*) FILTER (WHERE success = false OR fallback_to_ai = true) as pattern_failures,
          AVG(extraction_time_ms) FILTER (WHERE success = true AND fallback_to_ai = false) as avg_pattern_time_ms,
          COUNT(*) FILTER (WHERE fallback_to_ai = true) as ai_fallbacks
        FROM smartdocs.pattern_usage_log
      `;

      const params: any[] = [];

      if (containerId) {
        query += ` WHERE container_id = $1`;
        params.push(containerId);
      }

      const result = await this.db.query(query, params);
      
      return result.rows[0];
    } catch (error: any) {
      logger.error('[HybridExtraction] Failed to get statistics:', error);
      return null;
    }
  }
}
