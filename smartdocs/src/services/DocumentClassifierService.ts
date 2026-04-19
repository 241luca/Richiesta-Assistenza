import { DatabaseClient } from '../database/client';
import { OpenAIService } from './OpenAIService';
import logger from '../utils/logger';

interface ClassificationResult {
  matched: boolean;
  patternId?: string;
  documentType?: string;
  confidence: number;
  method: 'embedding' | 'keyword' | 'none';
  pattern?: any;
}

interface DocumentPattern {
  id: string;
  document_type: string;
  pattern_name: string;
  structure_pattern: any;
  entity_patterns: any;
  relationship_rules: any[];
  example_keywords: string[];
  confidence_threshold: number;
  min_similarity_score: number;
}

/**
 * DocumentClassifierService
 * 
 * Classifies incoming documents to determine if they match known patterns
 * Uses embedding similarity and keyword matching
 */
export class DocumentClassifierService {
  private db: DatabaseClient;
  private openai: OpenAIService;

  constructor(db: DatabaseClient, openai: OpenAIService) {
    this.db = db;
    this.openai = openai;
  }

  /**
   * Classify document and find matching pattern
   */
  async classifyDocument(params: {
    content: string;
    title?: string;
    containerId?: string;
  }): Promise<ClassificationResult> {
    const { content, title, containerId } = params;

    logger.info('[DocumentClassifier] 🔍 Classifying document...');
    logger.info(`[DocumentClassifier] Content length: ${content.length} chars, Title: ${title || 'N/A'}, Container: ${containerId || 'N/A'}`);

    try {
      // 1. Try embedding similarity first (most accurate)
      const embeddingResult = await this.classifyByEmbedding(content, containerId);
      
      // ✅ LOWERED threshold from 0.80 to 0.70 (70% similarity)
      const minThreshold = embeddingResult.pattern?.min_similarity_score || 0.70;
      
      logger.info(`[DocumentClassifier] 📊 Embedding result: matched=${embeddingResult.matched}, confidence=${(embeddingResult.confidence * 100).toFixed(1)}%, threshold=${(minThreshold * 100).toFixed(0)}%`);
      
      if (embeddingResult.matched && embeddingResult.confidence >= minThreshold) {
        logger.info(`[DocumentClassifier] ✅ Matched by embedding: ${embeddingResult.documentType} (${(embeddingResult.confidence * 100).toFixed(1)}%)`);
        return embeddingResult;
      } else if (embeddingResult.confidence > 0) {
        logger.warn(`[DocumentClassifier] ⚠️ Embedding similarity ${(embeddingResult.confidence * 100).toFixed(1)}% is below threshold ${(minThreshold * 100).toFixed(0)}% - trying keywords`);
      }

      // 2. Fallback to keyword matching
      const keywordResult = await this.classifyByKeywords(content, title, containerId);
      
      if (keywordResult.matched && keywordResult.confidence >= 0.50) {
        logger.info(`[DocumentClassifier] ✅ Matched by keywords: ${keywordResult.documentType} (${(keywordResult.confidence * 100).toFixed(1)}%)`);
        return keywordResult;
      }

      // 3. No match found
      logger.warn(`[DocumentClassifier] ❌ No pattern match found (best embedding: ${(embeddingResult.confidence * 100).toFixed(1)}%, best keyword: ${(keywordResult.confidence * 100).toFixed(1)}%)`);
      return {
        matched: false,
        confidence: 0,
        method: 'none'
      };

    } catch (error: any) {
      logger.error('[DocumentClassifier] Classification failed:', error);
      return {
        matched: false,
        confidence: 0,
        method: 'none'
      };
    }
  }

  /**
   * Classify using embedding similarity (most accurate)
   */
  private async classifyByEmbedding(content: string, containerId?: string): Promise<ClassificationResult> {
    try {
      // ✅ Generate STRUCTURE-BASED embedding (not full content)
      // This allows matching documents with same structure but different data
      const structureText = this.extractStructureText(content);
      logger.info(`[DocumentClassifier] 📝 Generated structure text (${structureText.length} chars): ${structureText.substring(0, 200)}...`);
      
      const embedding = await this.openai.createEmbedding(structureText);
      logger.info(`[DocumentClassifier] ✅ Created embedding (${embedding.length} dimensions)`);

      // Query for similar patterns using vector similarity
      let query = `
        SELECT 
          p.id,
          p.document_type,
          p.pattern_name,
          p.structure_pattern,
          p.entity_patterns,
          p.relationship_rules,
          p.example_keywords,
          p.confidence_threshold,
          p.min_similarity_score,
          1 - (p.example_embedding <=> $1::vector) as similarity
        FROM smartdocs.document_patterns p
        WHERE p.is_active = true
          AND p.example_embedding IS NOT NULL
      `;

      const params: any[] = [`[${embedding.join(',')}]`];
      let paramIndex = 2;

      // Filter by container if provided
      if (containerId) {
        query += ` AND ($${paramIndex} = ANY(p.container_ids) OR p.container_ids IS NULL OR array_length(p.container_ids, 1) IS NULL)`;
        params.push(containerId);
        paramIndex++;
      }

      query += `
        ORDER BY similarity DESC
        LIMIT 3
      `;

      logger.info(`[DocumentClassifier] 🔎 Querying patterns with embedding similarity...`);
      const result = await this.db.query(query, params);
      logger.info(`[DocumentClassifier] 📊 Found ${result.rows.length} patterns in database`);

      if (result.rows.length === 0) {
        logger.warn(`[DocumentClassifier] ⚠️ No patterns found in database with embeddings!`);
        return { matched: false, confidence: 0, method: 'embedding' };
      }

      // Log all matches for debugging
      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows[i];
        const similarity = parseFloat(row.similarity);
        logger.info(`[DocumentClassifier]   ${i + 1}. ${row.document_type}: ${(similarity * 100).toFixed(1)}% similarity (threshold: ${(row.min_similarity_score * 100).toFixed(0)}%)`);
      }

      const topMatch = result.rows[0];
      const similarity = parseFloat(topMatch.similarity);

      logger.info(`[DocumentClassifier] 🏆 Top match: ${topMatch.document_type} with ${(similarity * 100).toFixed(1)}% similarity`);

      if (similarity >= topMatch.min_similarity_score) {
        logger.info(`[DocumentClassifier] ✅ MATCH! Similarity ${(similarity * 100).toFixed(1)}% >= threshold ${(topMatch.min_similarity_score * 100).toFixed(0)}%`);
        return {
          matched: true,
          patternId: topMatch.id,
          documentType: topMatch.document_type,
          confidence: similarity,
          method: 'embedding',
          pattern: {
            id: topMatch.id,
            document_type: topMatch.document_type,
            pattern_name: topMatch.pattern_name,
            structure_pattern: topMatch.structure_pattern,
            entity_patterns: topMatch.entity_patterns,
            relationship_rules: topMatch.relationship_rules,
            confidence_threshold: topMatch.confidence_threshold,
            min_similarity_score: topMatch.min_similarity_score
          }
        };
      }

      logger.warn(`[DocumentClassifier] ❌ NO MATCH: Similarity ${(similarity * 100).toFixed(1)}% < threshold ${(topMatch.min_similarity_score * 100).toFixed(0)}%`);
      return { matched: false, confidence: similarity, method: 'embedding' };

    } catch (error: any) {
      logger.error('[DocumentClassifier] Embedding classification failed:', error);
      return { matched: false, confidence: 0, method: 'embedding' };
    }
  }

  /**
   * Classify using keyword matching (fallback, faster but less accurate)
   */
  private async classifyByKeywords(content: string, title?: string, containerId?: string): Promise<ClassificationResult> {
    try {
      // Extract keywords from content
      const contentKeywords = this.extractKeywords(content, title);

      // Get all active patterns
      let query = `
        SELECT 
          id,
          document_type,
          pattern_name,
          structure_pattern,
          entity_patterns,
          relationship_rules,
          example_keywords,
          confidence_threshold,
          min_similarity_score
        FROM smartdocs.document_patterns
        WHERE is_active = true
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (containerId) {
        query += ` AND ($${paramIndex} = ANY(container_ids) OR container_ids IS NULL OR array_length(container_ids, 1) IS NULL)`;
        params.push(containerId);
        paramIndex++;
      }

      const result = await this.db.query(query, params);

      if (result.rows.length === 0) {
        return { matched: false, confidence: 0, method: 'keyword' };
      }

      // Calculate keyword match scores
      let bestMatch: any = null;
      let bestScore = 0;

      for (const pattern of result.rows) {
        const patternKeywords = pattern.example_keywords || [];
        const matchScore = this.calculateKeywordScore(contentKeywords, patternKeywords);

        logger.info(`[DocumentClassifier] Keyword score for ${pattern.document_type}: ${(matchScore * 100).toFixed(1)}%`);

        if (matchScore > bestScore) {
          bestScore = matchScore;
          bestMatch = pattern;
        }
      }

      if (bestScore >= 0.50) { // At least 50% keyword overlap
        return {
          matched: true,
          patternId: bestMatch.id,
          documentType: bestMatch.document_type,
          confidence: bestScore,
          method: 'keyword',
          pattern: {
            id: bestMatch.id,
            document_type: bestMatch.document_type,
            pattern_name: bestMatch.pattern_name,
            structure_pattern: bestMatch.structure_pattern,
            entity_patterns: bestMatch.entity_patterns,
            relationship_rules: bestMatch.relationship_rules,
            confidence_threshold: bestMatch.confidence_threshold,
            min_similarity_score: bestMatch.min_similarity_score
          }
        };
      }

      return { matched: false, confidence: bestScore, method: 'keyword' };

    } catch (error: any) {
      logger.error('[DocumentClassifier] Keyword classification failed:', error);
      return { matched: false, confidence: 0, method: 'keyword' };
    }
  }

  /**
   * Extract keywords from content
   */
  private extractKeywords(content: string, title?: string): string[] {
    const keywords: Set<string> = new Set();

    // Add title words
    if (title) {
      const titleWords = title.toLowerCase().split(/\s+/);
      titleWords.forEach(word => {
        if (word.length > 3) keywords.add(word);
      });
    }

    // Extract ALL CAPS words (likely important)
    const capsWords = content.match(/\b[A-ZÀÈÉÌÒÙ]{4,}\b/g) || [];
    capsWords.forEach(word => keywords.add(word.toLowerCase()));

    // Extract common patterns
    const patterns = [
      /RICHIESTA/gi,
      /ASSISTENZA/gi,
      /FATTURA/gi,
      /PREVENTIVO/gi,
      /CONTRATTO/gi,
      /CLIENTE/gi,
      /TECNICO/gi,
      /INTERVENTO/gi
    ];

    patterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      matches.forEach(match => keywords.add(match.toLowerCase()));
    });

    // Extract ID patterns
    if (/RA-\d{4}-\d{6}/.test(content)) keywords.add('richiesta_assistenza');
    if (/FT-\d{4}-\d{6}/.test(content)) keywords.add('fattura');
    if (/PV-\d{4}-\d{6}/.test(content)) keywords.add('preventivo');

    return Array.from(keywords);
  }

  /**
   * Calculate keyword overlap score
   */
  private calculateKeywordScore(contentKeywords: string[], patternKeywords: string[]): number {
    if (patternKeywords.length === 0) return 0;

    const contentSet = new Set(contentKeywords.map(k => k.toLowerCase()));
    const patternSet = new Set(patternKeywords.map(k => k.toLowerCase()));

    let matches = 0;
    patternKeywords.forEach(keyword => {
      if (contentSet.has(keyword.toLowerCase())) {
        matches++;
      }
    });

    return matches / patternSet.size;
  }

  /**
   * Get pattern by ID
   */
  async getPattern(patternId: string): Promise<DocumentPattern | null> {
    try {
      const result = await this.db.query(
        `SELECT 
          id,
          document_type,
          pattern_name,
          structure_pattern,
          entity_patterns,
          relationship_rules,
          example_keywords,
          confidence_threshold,
          min_similarity_score
        FROM smartdocs.document_patterns
        WHERE id = $1 AND is_active = true`,
        [patternId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error: any) {
      logger.error('[DocumentClassifier] Failed to get pattern:', error);
      return null;
    }
  }

  /**
   * Get all active patterns (for debugging/UI)
   */
  async getAllPatterns(containerId?: string): Promise<DocumentPattern[]> {
    try {
      let query = `
        SELECT 
          id,
          document_type,
          pattern_name,
          structure_pattern,
          entity_patterns,
          relationship_rules,
          example_keywords,
          confidence_threshold,
          min_similarity_score,
          usage_count,
          accuracy_score,
          is_verified
        FROM smartdocs.document_patterns
        WHERE is_active = true
      `;

      const params: any[] = [];

      if (containerId) {
        query += ` AND ($1 = ANY(container_ids) OR container_ids IS NULL OR array_length(container_ids, 1) IS NULL)`;
        params.push(containerId);
      }

      query += ` ORDER BY accuracy_score DESC, usage_count DESC`;

      const result = await this.db.query(query, params);
      return result.rows;
    } catch (error: any) {
      logger.error('[DocumentClassifier] Failed to get all patterns:', error);
      return [];
    }
  }

  /**
   * Extract structure-based text for embedding (ignores specific data)
   */
  private extractStructureText(content: string): string {
    const parts: string[] = [];
    
    // Extract keywords
    const keywords = this.extractKeywords(content);
    parts.push(`Keywords: ${keywords.join(', ')}`);
    
    // Extract section headers
    const sections = this.detectSections(content);
    if (sections.length > 0) {
      parts.push(`Sections: ${sections.join(' | ')}`);
    }
    
    // Detect document features
    const features: string[] = [];
    if (content.includes('|') || /\t/.test(content)) features.push('tables');
    if (/^[\-\*]\s/m.test(content)) features.push('lists');
    if (/\d{4}-\d{2}-\d{2}/.test(content)) features.push('dates');
    if (/[A-Z]{2}-\d{4}-\d{6}/.test(content)) features.push('ID codes');
    
    if (features.length > 0) {
      parts.push(`Features: ${features.join(', ')}`);
    }
    
    return parts.join('\n');
  }

  /**
   * Detect sections in document
   */
  private detectSections(content: string): string[] {
    const sections: string[] = [];
    
    // Markdown headers
    const mdRegex = /^#{1,3}\s+(.+)$/gm;
    let match;
    while ((match = mdRegex.exec(content)) !== null) {
      sections.push(match[1].trim());
    }
    
    // ALL CAPS sections (common in Italian documents)
    const capsRegex = /^([A-ZÀÈÉÌÒÙ\s]{5,})$/gm;
    while ((match = capsRegex.exec(content)) !== null) {
      const section = match[1].trim();
      if (section.length > 5 && section.length < 50 && !sections.includes(section)) {
        sections.push(section);
      }
    }
    
    // "=== SECTION ===" format
    const equalsRegex = /^={3,}\s*(.+?)\s*={3,}$/gm;
    while ((match = equalsRegex.exec(content)) !== null) {
      const section = match[1].trim();
      if (!sections.includes(section)) {
        sections.push(section);
      }
    }
    
    return sections;
  }
}
