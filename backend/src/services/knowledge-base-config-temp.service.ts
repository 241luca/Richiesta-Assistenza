import { logger } from '../utils/logger';

// Configurazioni di default temporanee (mentre sistemiamo il database)
const DEFAULT_CONFIG = {
  professional: {
    maxPerDocument: 6000,
    maxTotalCharacters: 12000,
    searchKeywordMinLength: 3,
    contextBeforeKeyword: 500,
    contextAfterKeyword: 500,
    defaultChunkSize: 1500,
    chunkOverlap: 150,
    enableSmartSearch: true,
    enableAutoProcess: false,
    includeFullDocument: false,
    includeMetadata: true,
    includeFileName: true,
    customPromptPrefix: 'Usa terminologia tecnica precisa e dettagliata.',
    customPromptSuffix: 'Fornisci dettagli tecnici completi.',
    cacheEnabled: true,
    cacheTTL: 3600,
    isActive: true
  },
  client: {
    maxPerDocument: 3000,
    maxTotalCharacters: 6000,
    searchKeywordMinLength: 3,
    contextBeforeKeyword: 300,
    contextAfterKeyword: 300,
    defaultChunkSize: 800,
    chunkOverlap: 80,
    enableSmartSearch: true,
    enableAutoProcess: false,
    includeFullDocument: false,
    includeMetadata: false,
    includeFileName: true,
    customPromptPrefix: 'Spiega in modo semplice e comprensibile, evitando tecnicismi.',
    customPromptSuffix: 'Usa un linguaggio accessibile a tutti.',
    cacheEnabled: true,
    cacheTTL: 3600,
    isActive: true
  }
};

export class KnowledgeBaseConfigService {
  
  /**
   * Ottieni la configurazione per un professionista/sottocategoria/audience
   * VERSIONE TEMPORANEA: usa default mentre sistemiamo il database
   */
  static async getConfig(
    professionalId: string,
    subcategoryId: string,
    targetAudience: 'professional' | 'client'
  ) {
    try {
      logger.info('Using default KB config (temporary while fixing database)');
      
      // Per ora ritorna i default basati sul target audience
      const config = targetAudience === 'professional' 
        ? DEFAULT_CONFIG.professional 
        : DEFAULT_CONFIG.client;
      
      return {
        ...config,
        professionalId,
        subcategoryId,
        targetAudience
      };
      
    } catch (error) {
      logger.error('Error getting KB config:', error);
      return this.getDefaultConfig(targetAudience);
    }
  }
  
  /**
   * Configurazione di default basata sul target audience
   */
  static getDefaultConfig(targetAudience: 'professional' | 'client') {
    return targetAudience === 'professional' 
      ? DEFAULT_CONFIG.professional 
      : DEFAULT_CONFIG.client;
  }
  
  /**
   * Aggiorna configurazione (per ora non fa nulla, salva solo in memoria)
   */
  static async updateConfig(
    professionalId: string,
    subcategoryId: string,
    targetAudience: 'professional' | 'client',
    updates: Partial<any>
  ) {
    logger.info('Config update requested (not persisted while database is being fixed):', {
      professionalId,
      subcategoryId,
      targetAudience,
      updates
    });
    
    // Ritorna la configurazione aggiornata (solo in memoria)
    return {
      ...this.getDefaultConfig(targetAudience),
      ...updates,
      professionalId,
      subcategoryId,
      targetAudience
    };
  }
  
  /**
   * Invalida cache (placeholder)
   */
  static invalidateCache(
    professionalId?: string,
    subcategoryId?: string,
    targetAudience?: string
  ) {
    logger.info('Cache invalidation requested');
  }
}
