/**
 * SemanticChunkingService.ts
 * 
 * Enterprise-grade semantic document chunking service
 * Implements intelligent text segmentation with context preservation
 * 
 * Features:
 * - Recursive hierarchical splitting (paragraphs → sentences → clauses)
 * - Keyword extraction (TF-IDF approximation)
 * - Importance scoring
 * - Context window (previous/next chunks)
 * - Metadata enrichment
 * - Section detection
 * - Readability analysis
 * 
 * @author SmartDocs AI
 * @version 1.0.0
 * @date 2025-10-26
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SemanticChunk {
  id: string;
  documentId: string;
  index: number;
  content: string;
  title?: string;
  sectionPath: string[];
  previousChunkPreview: string;
  nextChunkPreview: string;
  contextualMetadata: {
    topicKeywords: string[];
    documentType: string;
    importanceScore: number;
    isSectionHeader: boolean;
    sentenceCount: number;
    readabilityScore: number;
  };
  embeddingOptimized: string;
  relatedChunkIds: string[];
  tokens: number;
  characterCount: number;
  metadata: {
    createdAt: Date;
    processedAt?: Date;
    sourceDocument: string;
    chunkingVersion: string;
  };
}

export interface ChunkingConfig {
  minChunkSize?: number;
  maxChunkSize?: number;
  targetChunkSize?: number;
  overlapPercentage?: number;
  contextPreviewSize?: number;
  includeMetadata?: boolean;
  detectSections?: boolean;
  language?: string;
  inputFormat?: 'text' | 'markdown';  // NEW: Support markdown
}

export interface MarkdownSection {
  level: number;
  title: string;
  content: string;
  startLine: number;
  endLine: number;
  children: MarkdownSection[];
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class SemanticChunkingService {
  private config: ChunkingConfig = {
    minChunkSize: 15,      // Minimum 15 chars - filters only noise
    maxChunkSize: 1500,
    targetChunkSize: 600,  // Reduced from 800 to create more chunks
    overlapPercentage: 15,
    contextPreviewSize: 120,
    includeMetadata: true,
    detectSections: true,
    language: 'it'
  };

  private stopWords: Set<string> = new Set();

  constructor(config?: Partial<ChunkingConfig>) {
    this.config = { ...this.config, ...config };
    this.initializeStopWords();
    logger.info('[SemanticChunking] Service initialized with config:', this.config);
  }

  /**
   * MAIN METHOD - Chunk document semantically
   */
  async chunkDocument(
    text: string,
    documentId: string,
    documentTitle?: string,
    format: 'text' | 'markdown' = 'text'  // NEW: format parameter
  ): Promise<SemanticChunk[]> {
    try {
      logger.info(`[SemanticChunking] Starting chunking for document: ${documentId} (format: ${format})`);
      
      if (!text || text.trim().length === 0) {
        logger.warn('[SemanticChunking] Empty text provided');
        return [];
      }

      // Route to appropriate chunking method
      if (format === 'markdown') {
        return await this.chunkMarkdown(text, documentId, documentTitle);
      } else {
        return await this.chunkPlainText(text, documentId, documentTitle);
      }

    } catch (error: any) {
      logger.error('[SemanticChunking] Error:', error);
      throw error;
    }
  }

  /**
   * Chunk plain text (original method)
   */
  private async chunkPlainText(
    text: string,
    documentId: string,
    documentTitle?: string
  ): Promise<SemanticChunk[]> {
    try {
      const cleanedText = this.cleanText(text);
      const paragraphs = this.extractParagraphs(cleanedText);
      const rawChunks = this.groupParagraphsIntoChunks(paragraphs);

      const chunks: SemanticChunk[] = [];
      for (let i = 0; i < rawChunks.length; i++) {
        const chunk = this.createSemanticChunk(
          rawChunks[i],
          i,
          documentId,
          documentTitle || 'Document'
        );

        if (this.validateChunk(chunk)) {
          chunks.push(chunk);
        }
      }

      this.addContextPreviews(chunks);

      if (chunks.length > 1) {
        const relationships = this.buildChunkRelationships(chunks);
        this.applyRelationships(chunks, relationships);
      }

      const stats = this.getStatistics(chunks);
      logger.info(`[SemanticChunking] Completed:`, stats);

      return chunks.filter(c => this.validateChunk(c));

    } catch (error: any) {
      logger.error('[SemanticChunking] Error:', error);
      throw error;
    }
  }

  /**
   * Chunk Markdown document (NEW)
   */
  private async chunkMarkdown(
    markdown: string,
    documentId: string,
    documentTitle?: string
  ): Promise<SemanticChunk[]> {
    try {
      logger.info('[SemanticChunking] Chunking Markdown document with context windows');
      
      // Parse markdown structure
      const sections = this.parseMarkdownSections(markdown);
      
      // Create chunks respecting MD structure
      const chunks: SemanticChunk[] = [];
      let chunkIndex = 0;
      
      for (const section of sections) {
        // Check if section needs splitting
        if (section.content.length > this.config.maxChunkSize!) {
          // Split large section into sub-chunks
          const subChunks = this.splitMarkdownSection(section);
          
          for (const subContent of subChunks) {
            const chunk = this.createMarkdownChunk(
              subContent,
              chunkIndex,
              documentId,
              documentTitle || 'Document',
              section.title,
              section.level
            );
            
            if (this.validateChunk(chunk)) {
              chunks.push(chunk);
              chunkIndex++;
            }
          }
        } else {
          // Section fits in one chunk
          const chunk = this.createMarkdownChunk(
            section.content,
            chunkIndex,
            documentId,
            documentTitle || 'Document',
            section.title,
            section.level
          );
          
          if (this.validateChunk(chunk)) {
            chunks.push(chunk);
            chunkIndex++;
          }
        }
      }
      
      // ✅ NEW: Add context windows like Docling (50 chars before + 50 chars after)
      this.addDoclingStyleContextWindows(chunks, markdown);
      
      // Add context previews (metadata only)
      this.addContextPreviews(chunks);
      
      // Build relationships
      if (chunks.length > 1) {
        const relationships = this.buildChunkRelationships(chunks);
        this.applyRelationships(chunks, relationships);
      }
      
      const stats = this.getStatistics(chunks);
      logger.info('[SemanticChunking] Markdown chunking completed:', stats);
      
      return chunks.filter(c => this.validateChunk(c));
      
    } catch (error: any) {
      logger.error('[SemanticChunking] Markdown chunking error:', error);
      throw error;
    }
  }

  /**
   * Add context windows like Docling: 50 chars before + 50 chars after
   */
  private addDoclingStyleContextWindows(chunks: SemanticChunk[], fullText: string): void {
    logger.info('[SemanticChunking] Adding Docling-style context windows (50 chars before/after)');
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkStart = fullText.indexOf(chunk.content);
      
      if (chunkStart === -1) continue; // Chunk not found in original text
      
      const chunkEnd = chunkStart + chunk.content.length;
      
      // Extract 50 chars before
      const contextBefore = fullText.substring(Math.max(0, chunkStart - 50), chunkStart);
      
      // Extract 50 chars after
      const contextAfter = fullText.substring(chunkEnd, Math.min(fullText.length, chunkEnd + 50));
      
      // 🔥 CRITICAL: Add context to content itself (like Docling)
      if (contextBefore.trim().length > 0 || contextAfter.trim().length > 0) {
        chunk.content = `${contextBefore}${chunk.content}${contextAfter}`.trim();
        chunk.characterCount = chunk.content.length;
        chunk.tokens = Math.ceil(chunk.content.length / 4);
        
        logger.debug(`[SemanticChunking] Chunk #${i}: Added ${contextBefore.length} chars before, ${contextAfter.length} chars after`);
      }
    }
  }

  /**
   * Parse Markdown into sections based on headers
   */
  private parseMarkdownSections(markdown: string): MarkdownSection[] {
    const lines = markdown.split('\n');
    const sections: MarkdownSection[] = [];
    let currentSection: MarkdownSection | null = null;
    let lineNumber = 0;
    
    for (const line of lines) {
      // Detect markdown headers: # H1, ## H2, ### H3, etc.
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      
      if (headerMatch) {
        // Save previous section
        if (currentSection) {
          currentSection.endLine = lineNumber - 1;
          sections.push(currentSection);
        }
        
        // Start new section
        currentSection = {
          level: headerMatch[1].length,
          title: headerMatch[2].trim(),
          content: line + '\n',
          startLine: lineNumber,
          endLine: lineNumber,
          children: []
        };
      } else if (currentSection) {
        // Add line to current section
        currentSection.content += line + '\n';
      } else {
        // No section yet, create default section
        currentSection = {
          level: 0,
          title: 'Introduction',
          content: line + '\n',
          startLine: lineNumber,
          endLine: lineNumber,
          children: []
        };
      }
      
      lineNumber++;
    }
    
    // Save last section
    if (currentSection) {
      currentSection.endLine = lineNumber - 1;
      sections.push(currentSection);
    }
    
    return sections;
  }

  /**
   * Split large Markdown section into smaller chunks
   */
  private splitMarkdownSection(section: MarkdownSection): string[] {
    const chunks: string[] = [];
    const lines = section.content.split('\n');
    let currentChunk = '';
    let inCodeBlock = false;
    let inTable = false;
    
    for (const line of lines) {
      // Detect code block boundaries
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
      }
      
      // Detect table
      if (line.trim().startsWith('|')) {
        inTable = true;
      } else if (inTable && !line.trim().startsWith('|')) {
        inTable = false;
      }
      
      const projectedLength = currentChunk.length + line.length + 1;
      
      // Split logic: don't break code blocks or tables
      if (projectedLength > this.config.maxChunkSize! && 
          !inCodeBlock && 
          !inTable && 
          currentChunk.length > this.config.minChunkSize!) {
        chunks.push(currentChunk.trim());
        currentChunk = line + '\n';
      } else {
        currentChunk += line + '\n';
      }
    }
    
    // Add remaining content
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks.length > 0 ? chunks : [section.content];
  }

  /**
   * Create semantic chunk from Markdown content
   */
  private createMarkdownChunk(
    content: string,
    index: number,
    documentId: string,
    documentTitle: string,
    sectionTitle: string,
    sectionLevel: number
  ): SemanticChunk {
    const keywords = this.extractKeywords(content);
    const documentType = this.classifyContentType(content);
    const importanceScore = this.calculateImportanceScore(content, keywords);
    const isSectionHeader = sectionLevel > 0;
    const sentenceCount = this.countSentences(content);
    const readabilityScore = this.calculateReadabilityScore(content);
    
    const embeddingOptimized = this.createOptimizedEmbeddingText(
      content,
      sectionTitle,
      keywords,
      documentTitle
    );
    
    const tokens = Math.ceil(embeddingOptimized.length / 4);
    
    return {
      id: `${documentId}-${index}-${uuidv4().substring(0, 8)}`,
      documentId,
      index,
      content,
      title: sectionTitle,
      sectionPath: [documentTitle, sectionTitle],
      previousChunkPreview: '',
      nextChunkPreview: '',
      contextualMetadata: {
        topicKeywords: keywords,
        documentType: 'markdown',
        importanceScore,
        isSectionHeader,
        sentenceCount,
        readabilityScore
      },
      embeddingOptimized,
      relatedChunkIds: [],
      tokens,
      characterCount: content.length,
      metadata: {
        createdAt: new Date(),
        sourceDocument: documentId,
        chunkingVersion: '1.0.0-md'
      }
    };
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\t/g, '  ')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/  +/g, ' ')
      .trim();
  }

  private initializeStopWords(): void {
    const stopWords = [
      'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una',
      'e', 'è', 'ma', 'o', 'da', 'di', 'per', 'con', 'su', 'in', 'a',
      'che', 'cosa', 'quando', 'dove', 'come', 'quanto', 'chi',
      'questo', 'quello', 'stesso', 'tale', 'altro'
    ];
    this.stopWords = new Set(stopWords);
  }

  private extractParagraphs(text: string): any[] {
    const paragraphs = text
      .split(/\n\n+/)
      .filter(p => p.trim().length > 0);

    return paragraphs.map((content, index) => ({
      index,
      content: content.trim(),
      length: content.length
    }));
  }

  private groupParagraphsIntoChunks(paragraphs: any[]): any[] {
    const chunks = [];
    let currentChunk: any = {
      paragraphs: [],
      totalLength: 0
    };

    for (const para of paragraphs) {
      const projectedLength = currentChunk.totalLength + para.length + 2;
      
      // Check if this paragraph is a section header (e.g., "CLIENTE:", "PROFESSIONISTA:", "CHAT:")
      const isSectionHeader = this.detectSectionHeader(para.content);
      
      // AGGRESSIVE SPLITTING for structured documents:
      // Create a new chunk every time we hit a section header (if we already have content)
      const shouldSplit = (
        // Hard limit: maxChunkSize exceeded
        (projectedLength > this.config.maxChunkSize! && currentChunk.paragraphs.length > 0) ||
        // Aggressive: Split on ANY section header if we have content (no minimum required!)
        (isSectionHeader && currentChunk.paragraphs.length > 0)
      );

      if (shouldSplit) {
        chunks.push(currentChunk);
        currentChunk = { paragraphs: [], totalLength: 0 };
      }

      currentChunk.paragraphs.push(para);
      currentChunk.totalLength = projectedLength;
    }

    if (currentChunk.paragraphs.length > 0) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * Detect if a paragraph is a section header
   * Examples: "CLIENTE:", "PROFESSIONISTA:", "CHAT (5 messaggi):", "PREVENTIVO:"
   */
  private detectSectionHeader(content: string): boolean {
    const trimmed = content.trim();
    
    // Pattern 1: All caps word(s) followed by colon
    // Examples: "CLIENTE:", "PROFESSIONISTA:", "DATI TECNICI:"
    if (/^[A-ZÀÈÉÌÒÙ][A-ZÀÈÉÌÒÙ\s]{2,50}:/.test(trimmed)) {
      return true;
    }
    
    // Pattern 2: All caps word(s) with parentheses followed by colon
    // Examples: "CHAT (5 messaggi):", "PREVENTIVO (approvato):"
    if (/^[A-ZÀÈÉÌÒÙ][A-ZÀÈÉÌÒÙ\s]{2,50}\([^)]+\):/.test(trimmed)) {
      return true;
    }
    
    // Pattern 3: Common section keywords
    const sectionKeywords = [
      'CLIENTE', 'PROFESSIONISTA', 'PROBLEMA', 'CATEGORIA', 'STATO',
      'DATA', 'CHAT', 'PREVENTIVO', 'RAPPORTO', 'NOTE', 'DETTAGLI',
      'DESCRIZIONE', 'INTERVENTO', 'SOLUZIONE', 'MATERIALI', 'COSTI'
    ];
    
    for (const keyword of sectionKeywords) {
      if (trimmed.startsWith(keyword + ':') || trimmed.startsWith(keyword + ' (')) {
        return true;
      }
    }
    
    return false;
  }

  private createSemanticChunk(
    rawChunk: any,
    index: number,
    documentId: string,
    documentTitle: string
  ): SemanticChunk {
    const content = rawChunk.paragraphs
      .map((p: any) => p.content)
      .join('\n\n');

    const title = this.extractTitle(content);
    const keywords = this.extractKeywords(content);
    const documentType = this.classifyContentType(content);
    const importanceScore = this.calculateImportanceScore(content, keywords);
    const isSectionHeader = this.isSectionHeader(content);
    const sentenceCount = this.countSentences(content);
    const readabilityScore = this.calculateReadabilityScore(content);

    const embeddingOptimized = this.createOptimizedEmbeddingText(
      content,
      title,
      keywords,
      documentTitle
    );

    const tokens = Math.ceil(embeddingOptimized.length / 4);

    return {
      id: `${documentId}-${index}-${uuidv4().substring(0, 8)}`,
      documentId,
      index,
      content,
      title,
      sectionPath: [documentTitle],
      previousChunkPreview: '',
      nextChunkPreview: '',
      contextualMetadata: {
        topicKeywords: keywords,
        documentType,
        importanceScore,
        isSectionHeader,
        sentenceCount,
        readabilityScore
      },
      embeddingOptimized,
      relatedChunkIds: [],
      tokens,
      characterCount: content.length,
      metadata: {
        createdAt: new Date(),
        sourceDocument: documentId,
        chunkingVersion: '1.0.0'
      }
    };
  }

  private extractTitle(content: string): string | undefined {
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 3 && trimmed.length < 100) {
        return trimmed;
      }
    }
    return undefined;
  }

  private extractKeywords(text: string): string[] {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !this.stopWords.has(w));

    const freq = new Map<string, number>();
    words.forEach(w => {
      freq.set(w, (freq.get(w) || 0) + 1);
    });

    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(e => e[0]);
  }

  private classifyContentType(content: string): string {
    if (/^(step|fase|passo|procedura)/i.test(content)) return 'procedure';
    if (/^\s*(\d+\.|•|-|\*)/m.test(content)) return 'list';
    if (/^(nota:|avvertenza:|importante:)/i.test(content)) return 'warning';
    return 'text';
  }

  private calculateImportanceScore(content: string, keywords: string[]): number {
    let score = 0.5;

    const keywordOccurrences = keywords.filter(k => 
      content.toLowerCase().split(k).length > 2
    ).length;
    score += keywordOccurrences * 0.08;

    if (/^\s*(\d+\.|•|-|\*)/m.test(content)) score += 0.15;
    if (/\b(deve|devi|devono|controllare|verificare)\b/i.test(content)) score += 0.12;
    if (/\d+/.test(content)) score += 0.05;
    if (this.isSectionHeader(content)) score += 0.2;

    return Math.min(score, 1.0);
  }

  private isSectionHeader(content: string): boolean {
    const lines = content.split('\n');
    if (lines.length === 0) return false;
    const firstLine = lines[0].trim();
    return firstLine.length < 100 && firstLine.split(' ').length < 15;
  }

  private countSentences(text: string): number {
    return Math.max(1, text.split(/[.!?]+/).filter(s => s.trim().length > 0).length);
  }

  private calculateReadabilityScore(text: string): number {
    const sentences = text.split(/[.!?]+/).length;
    const words = text.split(/\s+/).length;
    if (words === 0 || sentences === 0) return 0.5;
    return Math.min(1.0, words / (sentences * 15));
  }

  private createOptimizedEmbeddingText(
    content: string,
    title: string | undefined,
    keywords: string[],
    documentTitle: string
  ): string {
    const parts = [];
    if (documentTitle && documentTitle !== 'Document') {
      parts.push(`[DOC: ${documentTitle}]`);
    }
    if (title && title !== content) {
      parts.push(`[TITLE: ${title}]`);
    }
    if (keywords.length > 0) {
      parts.push(`[TOPICS: ${keywords.join(', ')}]`);
    }
    parts.push(content);
    return parts.join('\n').substring(0, 2000);
  }

  validateChunk(chunk: SemanticChunk): boolean {
    if (chunk.content.length < this.config.minChunkSize!) return false;
    if (chunk.content.length > this.config.maxChunkSize! * 1.2) return false;
    const substantiveContent = chunk.content.replace(/[\W_]/g, '');
    if (substantiveContent.length < 15) return false;  // At least 15 actual characters
    return true;
  }

  private addContextPreviews(chunks: SemanticChunk[]): void {
    for (let i = 0; i < chunks.length; i++) {
      if (i > 0) {
        const prevContent = chunks[i - 1].content;
        chunks[i].previousChunkPreview = prevContent.substring(
          Math.max(0, prevContent.length - this.config.contextPreviewSize!)
        ).trim();
      }
      if (i < chunks.length - 1) {
        const nextContent = chunks[i + 1].content;
        chunks[i].nextChunkPreview = nextContent.substring(0, this.config.contextPreviewSize!).trim();
      }
    }
  }

  private buildChunkRelationships(chunks: SemanticChunk[]): any[] {
    const relationships: any[] = [];

    for (let i = 0; i < chunks.length - 1; i++) {
      relationships.push({
        chunkId1: chunks[i].id,
        chunkId2: chunks[i + 1].id,
        type: 'sequential',
        strength: 0.95
      });
    }

    for (let i = 0; i < chunks.length; i++) {
      for (let j = i + 2; j < chunks.length; j++) {
        const commonKeywords = chunks[i].contextualMetadata.topicKeywords.filter(
          k => chunks[j].contextualMetadata.topicKeywords.includes(k)
        );
        if (commonKeywords.length > 0) {
          const strength = Math.min(commonKeywords.length / 5, 0.9);
          relationships.push({
            chunkId1: chunks[i].id,
            chunkId2: chunks[j].id,
            type: 'related',
            strength
          });
        }
      }
    }

    return relationships;
  }

  private applyRelationships(chunks: SemanticChunk[], relationships: any[]): void {
    for (const rel of relationships) {
      const chunk1 = chunks.find(c => c.id === rel.chunkId1);
      const chunk2 = chunks.find(c => c.id === rel.chunkId2);

      if (chunk1 && !chunk1.relatedChunkIds.includes(rel.chunkId2)) {
        chunk1.relatedChunkIds.push(rel.chunkId2);
      }
      if (chunk2 && !chunk2.relatedChunkIds.includes(rel.chunkId1)) {
        chunk2.relatedChunkIds.push(rel.chunkId1);
      }
    }
  }

  // ==========================================================================
  // PUBLIC UTILITY METHODS
  // ==========================================================================

  getStatistics(chunks: SemanticChunk[]): any {
    if (chunks.length === 0) return {
      totalChunks: 0,
      averageChunkSize: 0,
      minChunkSize: 0,
      maxChunkSize: 0,
      totalTokens: 0,
      avgImportance: 0
    };

    const sizes = chunks.map(c => c.content.length);
    return {
      totalChunks: chunks.length,
      averageChunkSize: Math.round(sizes.reduce((a, b) => a + b, 0) / chunks.length),
      minChunkSize: Math.min(...sizes),
      maxChunkSize: Math.max(...sizes),
      totalTokens: chunks.reduce((sum, c) => sum + c.tokens, 0),
      avgImportance: (chunks.reduce((sum, c) => sum + c.contextualMetadata.importanceScore, 0) / chunks.length).toFixed(2)
    };
  }
}
