import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Cache per le configurazioni
const configCache = new Map<string, any>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minuti

export class KnowledgeBaseConfigService {
  
  /**
   * Ottieni la configurazione per un professionista/sottocategoria/audience
   */
  static async getConfig(
    professionalId: string,
    subcategoryId: string,
    targetAudience: 'professional' | 'client'
  ) {
    const cacheKey = `${professionalId}_${subcategoryId}_${targetAudience}`;
    
    // Controlla la cache
    const cached = configCache.get(cacheKey);
    if (cached && cached.timestamp > Date.now() - CACHE_TTL) {
      return cached.config;
    }
    
    try {
      // Cerca configurazione specifica
      let config = await prisma.knowledgeBaseConfig.findUnique({
        where: {
          professionalId_subcategoryId_targetAudience: {
            professionalId,
            subcategoryId,
            targetAudience
          }
        }
      });
      
      // Se non esiste, crea configurazione di default
      if (!config) {
        config = await this.createDefaultConfig(
          professionalId,
          subcategoryId,
          targetAudience
        );
      }
      
      // Salva in cache
      configCache.set(cacheKey, {
        config,
        timestamp: Date.now()
      });
      
      return config;
    } catch (error) {
      logger.error('Error getting KB config:', error);
      // Ritorna configurazione di default in caso di errore
      return this.getDefaultConfig(targetAudience);
    }
  }
  
  /**
   * Crea configurazione di default
   */
  static async createDefaultConfig(
    professionalId: string,
    subcategoryId: string,
    targetAudience: 'professional' | 'client'
  ) {
    const defaults = this.getDefaultConfig(targetAudience);
    
    try {
      return await prisma.knowledgeBaseConfig.create({
        data: {
          professionalId,
          subcategoryId,
          targetAudience,
          ...defaults
        }
      });
    } catch (error) {
      logger.error('Error creating default KB config:', error);
      return { ...defaults, professionalId, subcategoryId, targetAudience };
    }
  }
  
  /**
   * Configurazione di default basata sul target audience
   */
  static getDefaultConfig(targetAudience: 'professional' | 'client') {
    if (targetAudience === 'professional') {
      return {
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
      };
    } else {
      // Configurazione per clienti - più semplice
      return {
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
      };
    }
  }
  
  /**
   * Aggiorna configurazione
   */
  static async updateConfig(
    professionalId: string,
    subcategoryId: string,
    targetAudience: 'professional' | 'client',
    updates: Partial<any>
  ) {
    const cacheKey = `${professionalId}_${subcategoryId}_${targetAudience}`;
    
    try {
      const config = await prisma.knowledgeBaseConfig.upsert({
        where: {
          professionalId_subcategoryId_targetAudience: {
            professionalId,
            subcategoryId,
            targetAudience
          }
        },
        update: updates,
        create: {
          professionalId,
          subcategoryId,
          targetAudience,
          ...this.getDefaultConfig(targetAudience),
          ...updates
        }
      });
      
      // Invalida cache
      configCache.delete(cacheKey);
      
      return config;
    } catch (error) {
      logger.error('Error updating KB config:', error);
      throw error;
    }
  }
  
  /**
   * Invalida cache
   */
  static invalidateCache(
    professionalId?: string,
    subcategoryId?: string,
    targetAudience?: string
  ) {
    if (professionalId && subcategoryId && targetAudience) {
      const cacheKey = `${professionalId}_${subcategoryId}_${targetAudience}`;
      configCache.delete(cacheKey);
    } else {
      // Invalida tutta la cache
      configCache.clear();
    }
  }
}
