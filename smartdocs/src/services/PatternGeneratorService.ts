import { DatabaseClient } from '../database/client';
import { OpenAIService } from './OpenAIService';
import logger from '../utils/logger';

interface Entity {
  name: string;
  type: string;
  confidence: number;
  context?: string;
  normalized_name?: string;
}

interface Relationship {
  source: string;
  target: string;
  type: string;
  confidence: number;
}

interface GeneratedPattern {
  document_type: string;
  pattern_name: string;
  description: string;
  structure_pattern: any;
  entity_patterns: any;
  relationship_rules: any[];
  example_embedding?: number[];
  example_text: string;
  example_keywords: string[];
}

/**
 * PatternGeneratorService
 * 
 * Generates reusable regex patterns from AI-extracted entities
 * Stores patterns in database for future hybrid extraction
 */
export class PatternGeneratorService {
  private db: DatabaseClient;
  private openai: OpenAIService;

  constructor(db: DatabaseClient, openai: OpenAIService) {
    this.db = db;
    this.openai = openai;
  }

  /**
   * Generate pattern from extracted entities and relationships
   */
  async generatePattern(params: {
    documentId: string;
    content: string;
    title: string;
    entities: Entity[];
    relationships: Relationship[];
    containerId?: string;
  }): Promise<GeneratedPattern> {
    const { documentId, content, title, entities, relationships, containerId } = params;

    logger.info(`[PatternGenerator] Generating pattern from document ${documentId}`);

    // 1. Detect document type from content and entities
    const documentType = await this.detectDocumentType(content, entities, title);

    // 2. Generate structure pattern
    const structurePattern = this.generateStructurePattern(content, title);

    // 3. Generate entity patterns (regex)
    const entityPatterns = this.generateEntityPatterns(content, entities);

    // 4. Generate relationship rules
    const relationshipRules = this.generateRelationshipRules(relationships, entities);

    // 5. Extract keywords for matching
    const keywords = this.extractKeywords(content, entities);

    // 6. Generate embedding for similarity matching
    // ✅ IMPORTANT: Use STRUCTURE-BASED embedding, not full content!
    // This allows matching documents with same structure but different data
    const structureText = this.generateStructureText(content, structurePattern, keywords);
    
    let embedding: number[] | undefined;
    try {
      logger.info(`[PatternGenerator] 🔄 Generating embedding for pattern (${structureText.length} chars)...`);
      embedding = await this.openai.createEmbedding(structureText);
      
      if (!embedding || embedding.length === 0) {
        throw new Error('OpenAI returned empty embedding');
      }
      
      logger.info(`[PatternGenerator] ✅ Embedding generated successfully (${embedding.length} dimensions)`);
    } catch (embeddingError: any) {
      logger.error(`[PatternGenerator] ❌ CRITICAL: Failed to generate embedding for pattern:`, embeddingError);
      logger.error(`[PatternGenerator] This pattern will NOT be saved (unusable without embedding)`);
      throw new Error(`Cannot create pattern without embedding: ${embeddingError.message}`);
    }

    const pattern: GeneratedPattern = {
      document_type: documentType,
      pattern_name: `${documentType}_auto_${Date.now()}`,
      description: `Auto-generated pattern from ${title}`,
      structure_pattern: structurePattern,
      entity_patterns: entityPatterns,
      relationship_rules: relationshipRules,
      example_embedding: embedding,
      example_text: content.substring(0, 1000),
      example_keywords: keywords
    };

    logger.info(`[PatternGenerator] Generated pattern type: ${documentType}`);

    return pattern;
  }

  /**
   * Save generated pattern to database
   */
  async savePattern(pattern: GeneratedPattern, params: {
    documentId: string;
    containerId?: string;
  }): Promise<string> {
    const { documentId, containerId } = params;

    try {
      // 🔍 DEBUG: Check what embedding we have
      logger.info(`[PatternGenerator] 🔍 Attempting to save pattern for type: ${pattern.document_type}`);
      logger.info(`[PatternGenerator] 🔍 Has embedding: ${pattern.example_embedding ? 'YES ✅' : 'NO ❌'}`);
      if (pattern.example_embedding) {
        logger.info(`[PatternGenerator] 🔍 Embedding length: ${pattern.example_embedding.length} dimensions`);
      }

      // Check if similar pattern already exists WITH embedding
      const existing = await this.db.query(
        `SELECT id, usage_count, example_embedding FROM smartdocs.document_patterns 
         WHERE document_type = $1 
           AND is_active = true 
           AND example_embedding IS NOT NULL
         ORDER BY accuracy_score DESC, usage_count DESC
         LIMIT 1`,
        [pattern.document_type]
      );

      if (existing.rows.length > 0) {
        logger.info(`[PatternGenerator] ✅ Similar pattern exists: ${existing.rows[0].id} (with embedding ✅)`);
        logger.info(`[PatternGenerator] Reusing existing pattern instead of creating duplicate`);
        // Don't create duplicate, just return existing
        return existing.rows[0].id;
      }

      // ⚠️ No existing pattern with embedding found - check if ANY pattern exists without embedding
      const anyExisting = await this.db.query(
        `SELECT id, example_embedding IS NOT NULL as has_embedding FROM smartdocs.document_patterns 
         WHERE document_type = $1 AND is_active = true
         LIMIT 1`,
        [pattern.document_type]
      );

      if (anyExisting.rows.length > 0 && !anyExisting.rows[0].has_embedding) {
        logger.warn(`[PatternGenerator] ⚠️ Found pattern ${anyExisting.rows[0].id} WITHOUT embedding - it will be invisible to classifier!`);
        logger.warn(`[PatternGenerator] 🔧 DISABLING old pattern and creating new one with embedding`);
        
        // 🔥 CRITICAL FIX: Disable the old unusable pattern
        await this.db.query(
          `UPDATE smartdocs.document_patterns 
           SET is_active = false 
           WHERE id = $1`,
          [anyExisting.rows[0].id]
        );
        
        logger.info(`[PatternGenerator] ✅ Disabled pattern ${anyExisting.rows[0].id} (no embedding)`);
      }

      logger.info(`[PatternGenerator] 🏗️ Creating new pattern with embedding...`);

      // ✅ CRITICAL: Ensure we HAVE an embedding before saving
      if (!pattern.example_embedding || pattern.example_embedding.length === 0) {
        logger.error(`[PatternGenerator] ❌ CRITICAL: Cannot save pattern without embedding!`);
        throw new Error('Pattern must have an embedding to be usable by the classifier');
      }

      // Insert new pattern
      const result = await this.db.query(
        `INSERT INTO smartdocs.document_patterns (
          document_type,
          pattern_name,
          description,
          structure_pattern,
          entity_patterns,
          relationship_rules,
          example_embedding,
          example_text,
          example_keywords,
          created_from_document_id,
          container_ids
        ) VALUES ($1, $2, $3, $4, $5, $6, $7::vector, $8, $9, $10, $11)
        RETURNING id`,
        [
          pattern.document_type,
          pattern.pattern_name,
          pattern.description,
          JSON.stringify(pattern.structure_pattern),
          JSON.stringify(pattern.entity_patterns),
          JSON.stringify(pattern.relationship_rules),
          `[${pattern.example_embedding.join(',')}]`,
          pattern.example_text,
          pattern.example_keywords,
          documentId,
          containerId ? [containerId] : []
        ]
      );

      const patternId = result.rows[0].id;
      logger.info(`[PatternGenerator] ✅ New pattern saved with ID: ${patternId}`);
      logger.info(`[PatternGenerator] ✅ Pattern has embedding: YES (${pattern.example_embedding.length} dimensions)`);

      return patternId;
    } catch (error: any) {
      logger.error('[PatternGenerator] Failed to save pattern:', error);
      throw error;
    }
  }

  /**
   * Detect document type from content and entities
   */
  private async detectDocumentType(content: string, entities: Entity[], title: string): Promise<string> {
    // Check for known patterns
    if (content.includes('RICHIESTA DI ASSISTENZA') || /RA-\d{4}-\d{6}/.test(content)) {
      return 'richiesta_assistenza_tecnica';
    }

    if (content.includes('FATTURA') || content.includes('Partita IVA') && content.includes('Totale')) {
      return 'fattura';
    }

    if (content.includes('PREVENTIVO') || content.includes('Validità')) {
      return 'preventivo';
    }

    if (content.includes('CONTRATTO') || content.includes('Le parti')) {
      return 'contratto';
    }

    // Fallback: use entity types to guess
    const taskEntities = entities.filter(e => e.type === 'TASK').length;
    const personEntities = entities.filter(e => e.type === 'PERSON').length;
    const orgEntities = entities.filter(e => e.type === 'ORGANIZATION').length;

    if (taskEntities > 0 && personEntities > 0) {
      return 'documento_tecnico';
    }

    if (orgEntities > personEntities) {
      return 'documento_aziendale';
    }

    return 'documento_generico';
  }

  /**
   * Generate structure pattern
   */
  private generateStructurePattern(content: string, title: string): any {
    const lines = content.split('\n');
    
    return {
      has_title: title ? true : false,
      total_lines: lines.length,
      has_sections: this.detectSections(content),
      has_tables: content.includes('|') || /\t/.test(content),
      has_lists: /^[\-\*]\s/m.test(content),
      has_dates: /\d{4}-\d{2}-\d{2}/.test(content),
      has_ids: /[A-Z]{2}-\d{4}-\d{6}/.test(content),
      line_count_range: this.getLineCountRange(lines.length)
    };
  }

  /**
   * Generate structure-based text for embedding (ignores specific data values)
   */
  private generateStructureText(content: string, structurePattern: any, keywords: string[]): string {
    // Build a text representation of document STRUCTURE, not data
    const parts: string[] = [];
    
    // Add document type indicators (keywords)
    parts.push(`Document type keywords: ${keywords.join(', ')}`);
    
    // Add structure info
    parts.push(`Document structure:`);
    parts.push(`- Sections: ${structurePattern.has_sections.join(', ')}`);
    parts.push(`- Length: ${structurePattern.line_count_range}`);
    
    if (structurePattern.has_tables) parts.push('- Contains tables');
    if (structurePattern.has_lists) parts.push('- Contains lists');
    if (structurePattern.has_dates) parts.push('- Contains dates');
    if (structurePattern.has_ids) parts.push('- Contains ID codes');
    
    // Add section headers only (not content)
    const sections = this.detectSections(content);
    if (sections.length > 0) {
      parts.push(`Section headers: ${sections.join(' | ')}`);
    }
    
    return parts.join('\n');
  }

  /**
   * Detect sections in document
   */
  private detectSections(content: string): string[] {
    const sections: string[] = [];
    const sectionRegex = /^#{1,3}\s+(.+)$/gm;
    let match;

    while ((match = sectionRegex.exec(content)) !== null) {
      sections.push(match[1].trim());
    }

    // Also check for ALL CAPS sections
    const capsRegex = /^([A-ZÀÈÉÌÒÙ\s]{5,})$/gm;
    while ((match = capsRegex.exec(content)) !== null) {
      const section = match[1].trim();
      if (section.length > 5 && section.length < 50) {
        sections.push(section);
      }
    }

    // Remove duplicates and return
    const uniqueSections = sections.filter((v, i, a) => a.indexOf(v) === i);
    return uniqueSections;
  }

  /**
   * Get line count range for matching
   */
  private getLineCountRange(lineCount: number): string {
    if (lineCount < 50) return 'short';
    if (lineCount < 200) return 'medium';
    if (lineCount < 500) return 'long';
    return 'very_long';
  }

  /**
   * Generate entity patterns (regex) from extracted entities
   */
  private generateEntityPatterns(content: string, entities: Entity[]): any {
    const patterns: any = {};

    for (const entity of entities) {
      const entityName = entity.name;
      const normalizedName = entity.normalized_name || entity.name.toLowerCase();
      
      // Try to find the entity in context
      const contextLines = content.split('\n');
      let foundPattern: string | null = null;

      for (const line of contextLines) {
        if (line.toLowerCase().includes(normalizedName)) {
          // Try to extract pattern
          const pattern = this.extractPatternFromLine(line, entityName);
          if (pattern) {
            foundPattern = pattern;
            break;
          }
        }
      }

      if (foundPattern) {
        patterns[normalizedName.replace(/\s+/g, '_')] = {
          regex: foundPattern,
          type: entity.type,
          confidence: entity.confidence,
          example: entityName
        };
      }
    }

    return patterns;
  }

  /**
   * Extract regex pattern from line containing entity
   */
  private extractPatternFromLine(line: string, entityValue: string): string | null {
    // Common patterns: "Label: Value"
    const labelValueMatch = line.match(/^([^:]+):\s*(.+)$/);
    if (labelValueMatch && labelValueMatch[2].includes(entityValue)) {
      const label = this.escapeRegex(labelValueMatch[1]);
      return `${label}:\\s*([\\w\\s\\.,-]+)`;
    }

    // Pattern: "Value - Label"
    if (line.includes(entityValue) && line.includes(' - ')) {
      return `([\\w\\s\\.,-]+)\\s*-\\s*[\\w\\s]+`;
    }

    // Pattern: Just the value (capture similar format)
    const entityPattern = entityValue.replace(/[a-zA-Zà-ù]+/g, '[a-zA-Zà-ù]+')
                                      .replace(/\d+/g, '\\d+')
                                      .replace(/\s+/g, '\\s+');
    
    return entityPattern;
  }

  /**
   * Escape regex special characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Generate relationship rules from extracted relationships
   */
  private generateRelationshipRules(relationships: Relationship[], entities: Entity[]): any[] {
    const rules: any[] = [];

    for (const rel of relationships) {
      // Normalize entity names
      const sourceNorm = rel.source.toLowerCase().replace(/\s+/g, '_');
      const targetNorm = rel.target.toLowerCase().replace(/\s+/g, '_');

      rules.push({
        source: sourceNorm,
        target: targetNorm,
        type: rel.type,
        confidence: rel.confidence
      });
    }

    return rules;
  }

  /**
   * Extract keywords from content and entities
   */
  private extractKeywords(content: string, entities: Entity[]): string[] {
    const keywords: Set<string> = new Set();

    // Add entity names as keywords
    for (const entity of entities) {
      const words = entity.name.split(/\s+/);
      words.forEach(word => {
        if (word.length > 3) {
          keywords.add(word.toLowerCase());
        }
      });
    }

    // Extract important words from content (ALL CAPS, or repeated)
    const capsWords = content.match(/\b[A-ZÀÈÉÌÒÙ]{4,}\b/g) || [];
    capsWords.forEach(word => keywords.add(word.toLowerCase()));

    // Limit to top 20 keywords
    return Array.from(keywords).slice(0, 20);
  }
}
