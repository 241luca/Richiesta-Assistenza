/**
 * Advanced SmartDocs Service
 * Funzionalità avanzate per testing e debugging di SmartDocs
 */

import api from './api';

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
}

export interface KGEntity {
  id: string;
  document_id: string;
  chunk_id: string;
  name: string;
  type: string;
  importance: number;
  frequency: number;
  context?: string;
  aliases?: string[];
}

export interface KGRelationship {
  id: string;
  document_id: string;
  source_entity_id: string;
  target_entity_id: string;
  type: string;
  confidence: number;
  context?: string;
}

class SmartDocsAdvancedService {
  /**
   * Carica i chunk semantici di un documento
   */
  async getDocumentChunks(documentId: string): Promise<SemanticChunk[]> {
    try {
      // Usa proxy backend autenticato
      const response = await api.get(`/smartdocs/documents/${documentId}/chunks`);
      const data = response.data;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load chunks');
      }

      return data.data || [];
    } catch (error: any) {
      console.error('[SmartDocsAdvanced] Error loading chunks:', error);
      throw error;
    }
  }

  /**
   * Carica le entità estratte da un documento
   */
  async getDocumentEntities(documentId: string): Promise<KGEntity[]> {
    try {
      const response = await api.get('/smartdocs/knowledge-graph/entities', {
        params: { documentId }
      });
      const data = response.data;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load entities');
      }

      return data.data || [];
    } catch (error: any) {
      console.error('[SmartDocsAdvanced] Error loading entities:', error);
      throw error;
    }
  }

  /**
   * Carica le relazioni estratte da un documento
   */
  async getDocumentRelationships(documentId: string): Promise<KGRelationship[]> {
    try {
      const response = await api.get('/smartdocs/knowledge-graph/relationships', {
        params: { documentId }
      });
      const data = response.data;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load relationships');
      }

      return data.data || [];
    } catch (error: any) {
      console.error('[SmartDocsAdvanced] Error loading relationships:', error);
      throw error;
    }
  }

  /**
   * Carica tutte le info complete di un documento (chunks + KG)
   */
  async getDocumentAnalysis(documentId: string) {
    try {
      const [chunks, entities, relationships] = await Promise.all([
        this.getDocumentChunks(documentId),
        this.getDocumentEntities(documentId),
        this.getDocumentRelationships(documentId)
      ]);

      return {
        chunks,
        entities,
        relationships,
        stats: {
          totalChunks: chunks.length,
          totalTokens: chunks.reduce((sum, c) => sum + c.tokens, 0),
          avgChunkSize: chunks.length > 0 
            ? Math.round(chunks.reduce((sum, c) => sum + c.characterCount, 0) / chunks.length)
            : 0,
          totalEntities: entities.length,
          totalRelationships: relationships.length,
          entityTypes: Array.from(new Set(entities.map(e => e.type))),
          relationshipTypes: Array.from(new Set(relationships.map(r => r.type)))
        }
      };
    } catch (error: any) {
      console.error('[SmartDocsAdvanced] Error loading document analysis:', error);
      throw error;
    }
  }

  /**
   * Testa una query con dettagli avanzati
   */
  async testQuery(params: {
    question: string;
    containerId?: string;
    systemPrompt?: string;
    threshold?: number;
    limit?: number;
  }) {
    try {
      const response = await api.post('/smartdocs/ask', {
        question: params.question,
        container_id: params.containerId,
        threshold: params.threshold ?? 0.7,
        limit: params.limit ?? 5,
        systemPrompt: params.systemPrompt,
        includeDebug: true
      });

      const data = response.data;
      
      if (!data.success) {
        throw new Error(data.error || 'Query failed');
      }

      return {
        answer: data.data.answer,
        sources: data.data.sources,
        debug: data.data.debug,
        metadata: data.data.metadata
      };
    } catch (error: any) {
      console.error('[SmartDocsAdvanced] Error testing query:', error);
      throw error;
    }
  }
}

export const smartDocsAdvancedService = new SmartDocsAdvancedService();
export default smartDocsAdvancedService;
