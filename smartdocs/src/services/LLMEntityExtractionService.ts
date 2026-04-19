import { OpenAIService } from './OpenAIService';
import { DatabaseClient } from '../database/client';
import { logger } from '../utils/logger';

/**
 * LLM-Based Entity Extraction Service
 * Uses GPT-3.5-turbo to extract entities and relationships from text
 * 
 * Cost estimate: ~$0.05-0.15 per document (depending on length)
 * 
 * Features:
 * - Smart entity type detection (PERSON, ORGANIZATION, LOCATION, CONCEPT, etc.)
 * - Relationship extraction with context
 * - Confidence scoring
 * - Deduplication with existing entities
 * - Batch processing support
 */

export interface LLMEntity {
  name: string;
  type: 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'CONCEPT' | 'PRODUCT' | 'EVENT' | 'TASK' | 'ROLE' | 'OTHER';
  confidence: number; // 0-1
  context?: string; // Surrounding text snippet
  aliases?: string[]; // Alternative names
  attributes?: Record<string, any>;
}

export interface LLMRelationship {
  source: string;
  target: string;
  type: string;
  confidence: number;
  context?: string;
}

export interface ExtractionResult {
  entities: LLMEntity[];
  relationships: LLMRelationship[];
  summary?: string;
  tokensUsed: number;
  cost: number; // USD
}

export class LLMEntityExtractionService {
  private openai: OpenAIService;
  private db: DatabaseClient;

  constructor() {
    this.openai = new OpenAIService();
    this.db = DatabaseClient.getInstance();
  }

  /**
   * Normalize entity name for consistent matching
   * Removes ALL non-alphanumeric characters except spaces, converts to lowercase
   */
  private normalizeEntityName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/gi, '') // ✅ Remove ALL non-alphanumeric except spaces
      .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
      .trim();
  }

  /**
   * Extract entities and relationships using GPT-3.5-turbo
   */
  async extractFromText(
    text: string,
    documentId: string,
    title?: string,
    options: {
      maxTokens?: number;
      temperature?: number;
      enableSummary?: boolean;
    } = {}
  ): Promise<ExtractionResult> {
    const { maxTokens = 4000, temperature = 0.2, enableSummary = false } = options; // ✅ Increased from 2000 to 4000

    logger.info(`[LLMEntityExtraction] Extracting entities from document: ${documentId}`);

    // Truncate text if too long (max ~12000 chars = ~3000 tokens input)
    const truncatedText = text.length > 12000 ? text.substring(0, 12000) + '...' : text;

    const systemPrompt = `Sei un esperto di estrazione di entità e relazioni da testi in italiano.

Il tuo compito è estrarre TUTTE le entità e relazioni rilevanti da un documento.

**TIPI DI ENTITÀ DA ESTRARRE**:
- PERSON: Persone (es: "Mario Rossi", "Andrea Bianchi")
- ORGANIZATION: Aziende, istituzioni (es: "TechSupport Solutions S.r.l.")
- LOCATION: Luoghi, città (es: "Torino", "Milano")
- ROLE: Ruoli professionali (es: "Ingegnere Informatico Senior")
- CONCEPT: Certificazioni, tecnologie (es: "CCNP", "AWS Solutions Architect")
- PRODUCT: Prodotti, servizi (es: "Database Migration", "ERP")
- TASK: Compiti, progetti (es: "RA-2025-001847")
- EVENT: Eventi, interventi
- OTHER: Altro di rilevante

**REGOLE**:
1. Estrai TUTTE le entità presenti, non limitarti a poche
2. Usa nomi completi e canonici
3. Crea relazioni tra entità correlate
4. Confidence score: 0.7-1.0 per entità certe, 0.5-0.7 per probabili
5. Identifica alias e varianti

**IMPORTANTE**: NON limitare il numero di entità estratte. Il documento può contenere decine di entità.

Rispondi SEMPRE in formato JSON valido.`;

    const userPrompt = `**DOCUMENTO**: ${title || 'Untitled'}

**TESTO**:
${truncatedText}

---

Estrai entità e relazioni in questo formato JSON:

{
  "entities": [
    {
      "name": "Nome Entità",
      "type": "PERSON|ORGANIZATION|LOCATION|CONCEPT|PRODUCT|EVENT|TASK|ROLE|OTHER",
      "confidence": 0.95,
      "context": "breve contesto dal testo",
      "aliases": ["alias1", "alias2"],
      "attributes": { "key": "value" }
    }
  ],
  "relationships": [
    {
      "source": "Entità A",
      "target": "Entità B",
      "type": "tipo_relazione",
      "confidence": 0.90,
      "context": "contesto"
    }
  ]${enableSummary ? ',\n  "summary": "Breve riassunto del documento (max 200 caratteri)"' : ''}
}`;

    try {
      const response = await this.openai.generateChatAnswer(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        {
          ai_model: 'gpt-3.5-turbo',
          ai_temperature: temperature,
          ai_max_tokens: maxTokens
        }
      );

      // Parse JSON response
      let parsed: any;
      try {
        // Remove markdown code blocks if present
        const cleanResponse = response
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        
        parsed = JSON.parse(cleanResponse);
      } catch (parseError) {
        logger.error('[LLMEntityExtraction] JSON parse error:', parseError);
        logger.error('[LLMEntityExtraction] Raw response:', response);
        
        // Fallback: try to extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse LLM response as JSON');
        }
      }

      // Validate and sanitize
      const entities: LLMEntity[] = (parsed.entities || []).map((e: any) => ({
        name: e.name,
        type: e.type || 'OTHER',
        confidence: Math.max(0, Math.min(1, e.confidence || 0.5)),
        context: e.context?.substring(0, 200),
        aliases: e.aliases || [],
        attributes: e.attributes || {}
      }));

      const relationships: LLMRelationship[] = (parsed.relationships || []).map((r: any) => ({
        source: r.source,
        target: r.target,
        type: r.type || 'related_to',
        confidence: Math.max(0, Math.min(1, r.confidence || 0.5)),
        context: r.context?.substring(0, 200)
      }));

      // Estimate tokens used (rough approximation)
      const inputTokens = Math.ceil(systemPrompt.length / 4 + userPrompt.length / 4);
      const outputTokens = Math.ceil(response.length / 4);
      const totalTokens = inputTokens + outputTokens;

      // Cost calculation (GPT-3.5-turbo pricing: $0.5/1M input, $1.5/1M output)
      const inputCost = (inputTokens / 1000000) * 0.5;
      const outputCost = (outputTokens / 1000000) * 1.5;
      const totalCost = inputCost + outputCost;

      logger.info(`[LLMEntityExtraction] Extracted ${entities.length} entities, ${relationships.length} relationships`);
      logger.info(`[LLMEntityExtraction] Tokens: ${totalTokens} (~$${totalCost.toFixed(4)})`);

      return {
        entities,
        relationships,
        summary: parsed.summary,
        tokensUsed: totalTokens,
        cost: totalCost
      };

    } catch (error: any) {
      logger.error('[LLMEntityExtraction] Extraction failed:', error);
      throw error;
    }
  }

  /**
   * Save extracted entities to database with deduplication
   */
  async saveEntitiesToDatabase(
    entities: LLMEntity[],
    documentId: string,
    chunkId: string
  ): Promise<{ saved: number; merged: number }> {
    let saved = 0;
    let merged = 0;

    for (const entity of entities) {
      try {
        // Check if entity already exists
        const existing = await this.db.query(
          `SELECT id, aliases, importance FROM smartdocs.kg_entities 
           WHERE document_id = $1 AND normalized_name = $2 AND type = $3`,
          [documentId, this.normalizeEntityName(entity.name), entity.type]
        );

        if (existing.rows.length > 0) {
          // Merge: update importance and aliases
          const existingAliases = existing.rows[0].aliases || [];
          const mergedAliases = [...new Set([...existingAliases, ...entity.aliases])];
          const newImportance = Math.max(existing.rows[0].importance || 0.5, entity.confidence);

          await this.db.query(
            `UPDATE smartdocs.kg_entities 
             SET aliases = $1, importance = $2, confidence = GREATEST(confidence, $3), frequency = frequency + 1, last_seen = NOW()
             WHERE id = $4`,
            [mergedAliases, newImportance, entity.confidence, existing.rows[0].id]
          );

          merged++;
        } else {
          // Insert new entity WITH ALL AVAILABLE FIELDS
          const { v4: uuidv4 } = require('uuid');
          const entityId = uuidv4(); // ✅ FIX: Use real UUID instead of string concatenation
          
          await this.db.query(
            `INSERT INTO smartdocs.kg_entities (
              id, document_id, name, normalized_name, type, importance, confidence,
              aliases, canonical_form, description, definition, document_ids, chunk_ids,
              frequency, first_occurrence_position, properties, attributes, related_entity_ids,
              is_canonical, canonical_entity_id, merged_from_ids, first_seen, last_seen,
              created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW(), NOW(), NOW(), NOW()
            )`,
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

          saved++;
        }
      } catch (error: any) {
        logger.error(`[LLMEntityExtraction] Failed to save entity "${entity.name}":`, error);
      }
    }

    logger.info(`[LLMEntityExtraction] Saved ${saved} new entities, merged ${merged} existing`);

    return { saved, merged };
  }

  /**
   * Save relationships to database
   */
  async saveRelationshipsToDatabase(
    relationships: LLMRelationship[],
    documentId: string
  ): Promise<number> {
    let saved = 0;

    for (const rel of relationships) {
      try {
        // Find entity IDs (using normalized_name with consistent normalization)
        const sourceResult = await this.db.query(
          `SELECT id FROM smartdocs.kg_entities 
           WHERE document_id = $1 AND normalized_name = $2 
           LIMIT 1`,
          [documentId, this.normalizeEntityName(rel.source)]
        );

        const targetResult = await this.db.query(
          `SELECT id FROM smartdocs.kg_entities 
           WHERE document_id = $1 AND normalized_name = $2 
           LIMIT 1`,
          [documentId, this.normalizeEntityName(rel.target)]
        );

        if (sourceResult.rows.length === 0 || targetResult.rows.length === 0) {
          logger.warn(`[LLMEntityExtraction] Skipping relationship: entity not found (${rel.source} -> ${rel.target})`);
          continue;
        }

        const sourceId = sourceResult.rows[0].id;
        const targetId = targetResult.rows[0].id;

        // Insert relationship WITH ALL AVAILABLE FIELDS
        const { v4: uuidv4 } = require('uuid');
        const relId = uuidv4(); // ✅ FIX: Use real UUID instead of string concatenation
        
        await this.db.query(
          `INSERT INTO smartdocs.kg_relationships (
            id, document_id, entity1_id, entity2_id, relationship_type, strength, confidence,
            is_bidirectional, evidence, supporting_documents, frequency, context, reason,
            properties, first_observed, last_observed, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW(), NOW(), NOW()
          )
          ON CONFLICT (entity1_id, entity2_id, relationship_type) 
          DO UPDATE SET 
            frequency = kg_relationships.frequency + 1,
            strength = GREATEST(kg_relationships.strength, EXCLUDED.strength),
            confidence = GREATEST(kg_relationships.confidence, EXCLUDED.confidence),
            last_observed = NOW()`,
          [
            relId,                                    // id
            documentId,                               // document_id
            sourceId,                                 // entity1_id
            targetId,                                 // entity2_id
            rel.type,                                 // relationship_type
            rel.confidence,                           // strength (use confidence)
            rel.confidence,                           // confidence
            false,                                    // is_bidirectional
            rel.context ? [rel.context] : [],         // evidence (text[] array)
            [documentId],                             // supporting_documents (text[] array)
            1,                                        // frequency (initial)
            rel.context || null,                      // context
            null,                                     // reason
            JSON.stringify({})                        // properties (JSONB)
          ]
        );

        saved++;
      } catch (error: any) {
        logger.error(`[LLMEntityExtraction] Failed to save relationship:`, error);
      }
    }

    logger.info(`[LLMEntityExtraction] Saved ${saved} relationships`);

    return saved;
  }

  /**
   * Full extraction and save pipeline
   */
  async extractAndSave(
    text: string,
    documentId: string,
    chunkId: string,
    title?: string,
    options?: { maxTokens?: number; temperature?: number; enableSummary?: boolean }
  ): Promise<ExtractionResult & { entitiesSaved: number; entitiesMerged: number; relationshipsSaved: number }> {
    // Extract
    const result = await this.extractFromText(text, documentId, title, options);

    // Save entities
    const { saved, merged } = await this.saveEntitiesToDatabase(result.entities, documentId, chunkId);

    // Save relationships
    const relationshipsSaved = await this.saveRelationshipsToDatabase(result.relationships, documentId);

    return {
      ...result,
      entitiesSaved: saved,
      entitiesMerged: merged,
      relationshipsSaved
    };
  }
}
