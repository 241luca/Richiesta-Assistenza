import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';
// Usa la versione completa con database
import { KnowledgeBaseConfigService } from './knowledge-base-config.service';
// Import SmartDocs client per semantic chunking
import { getSmartDocsClient } from './smartdocs-client.service';

const prisma = new PrismaClient();

/**
 * Service per processare e integrare la Knowledge Base con l'AI
 */
export class KnowledgeBaseAIService {
  
  /**
   * Estrae il testo da un documento della Knowledge Base
   */
  static async extractTextFromDocument(documentPath: string): Promise<string> {
    try {
      const ext = path.extname(documentPath).toLowerCase();
      
      if (['.txt', '.md'].includes(ext)) {
        return fs.readFileSync(documentPath, 'utf8');
      } else if (ext === '.pdf') {
        // Per ora ritorniamo una stringa vuota per i PDF
        // In futuro useremo pdf-parse
        logger.warn(`PDF extraction not yet implemented for: ${documentPath}`);
        return '[Contenuto PDF - richiede pdf-parse per estrarre il testo]';
      } else {
        logger.warn(`Unsupported file type for text extraction: ${ext}`);
        return '';
      }
    } catch (error) {
      logger.error('Error extracting text from document:', error);
      return '';
    }
  }

  /**
   * Processa tutti i documenti non processati per un professionista/sottocategoria
   * NUOVO: Usa SmartDocs con semantic chunking + knowledge graph
   */
  static async processDocuments(
    professionalId: string, 
    subcategoryId: string,
    targetAudience: 'professional' | 'client'
  ) {
    try {
      // Recupera documenti non processati dal DATABASE
      const documents = await prisma.knowledgeBase.findMany({
        where: {
          professionalId,
          subcategoryId,
          targetAudience,
          isProcessed: false,
          isActive: true
        }
      });

      logger.info(`[KnowledgeBase] Found ${documents.length} documents to process with SEMANTIC CHUNKING`);

      const smartdocs = getSmartDocsClient();
      let processed = 0;
      let failed = 0;

      for (const doc of documents) {
        try {
          // Estrai il testo
          const text = await this.extractTextFromDocument(doc.filePath);
          
          if (text && text.length > 50) {
            logger.info(`[KnowledgeBase] Processing document ${doc.id} with SmartDocs...`);
            
            // NUOVO: Usa SmartDocs per semantic chunking + knowledge graph
            const result = await smartdocs.ingestDocument({
              type: 'knowledge_base',
              title: doc.originalName || `Document ${doc.id}`,
              content: text,
              metadata: {
                professional_id: professionalId,
                subcategory_id: subcategoryId,
                target_audience: targetAudience,
                document_id: doc.id,
                file_type: doc.fileType,
                original_path: doc.filePath
              }
            });
            
            // Aggiorna il documento nel DATABASE con info SmartDocs
            await prisma.knowledgeBase.update({
              where: { id: doc.id },
              data: {
                isProcessed: true,
                processedAt: new Date(),
                metadata: {
                  processing_method: 'semantic_chunking',
                  smartdocs_document_id: result.documentId,
                  semantic_chunks: result.chunksCreated,
                  text_length: text.length,
                  processed_at: new Date().toISOString(),
                  // Manteniamo backward compatibility
                  chunks: result.chunksCreated,
                  textLength: text.length
                }
              }
            });
            
            logger.info(`[KnowledgeBase] ✅ Processed document ${doc.id}: ${result.chunksCreated} semantic chunks created`);
            processed++;
          } else {
            logger.warn(`[KnowledgeBase] Skipping document ${doc.id}: text too short or empty`);
            failed++;
          }
        } catch (error) {
          logger.error(`[KnowledgeBase] ❌ Error processing document ${doc.id}:`, error);
          failed++;
        }
      }

      logger.info(`[KnowledgeBase] Processing complete: ${processed} processed, ${failed} failed`);

      return {
        processed,
        failed,
        total: documents.length,
        success: true
      };
    } catch (error) {
      logger.error('[KnowledgeBase] Error processing documents:', error);
      throw error;
    }
  }

  /**
   * @deprecated Usa SmartDocs per semantic chunking invece di chunk fissi
   * Divide il testo in chunks gestibili (LEGACY - mantenuto per backward compatibility)
   */
  static splitTextIntoChunks(text: string, chunkSize: number = 1000): string[] {
    logger.warn('[KnowledgeBase] ⚠️ Using LEGACY fixed-size chunking. Consider using SmartDocs semantic chunking instead.');
    
    const chunks: string[] = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > chunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += ' ' + sentence;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  /**
   * Recupera il contesto rilevante dalla Knowledge Base per una query
   * NUOVO: Usa SmartDocs RAG (Retrieval Augmented Generation) con semantic search
   */
  static async getRelevantContext(
    professionalId: string,
    subcategoryId: string,
    query: string,
    targetAudience: 'professional' | 'client'
  ): Promise<string[]> {
    try {
      logger.info('[KnowledgeBase] Getting relevant context with SEMANTIC SEARCH');
      logger.info('[KnowledgeBase] Parameters:', { professionalId, subcategoryId, targetAudience, query });
      
      // CARICA CONFIGURAZIONI DAL DATABASE
      const config = await KnowledgeBaseConfigService.getConfig(
        professionalId,
        subcategoryId,
        targetAudience
      );
      
      logger.info('[KnowledgeBase] Configuration loaded:', {
        maxPerDocument: config.maxPerDocument,
        maxTotalCharacters: config.maxTotalCharacters,
        enableSmartSearch: config.enableSmartSearch
      });

      // NUOVO: Usa SmartDocs per ricerca semantica invece di ricerca manuale
      const smartdocs = getSmartDocsClient();
      
      try {
        // Query SmartDocs per documenti rilevanti
        // Nota: SmartDocs cerca automaticamente tra tutti i documenti indicizzati
        // Il filtro per professionalId/subcategoryId avviene durante l'ingest (metadata)
        const smartdocsResult = await smartdocs.query({
          question: query,
          limit: 5 // Top 5 chunk più rilevanti
        });

        if (smartdocsResult.success && smartdocsResult.results && smartdocsResult.results.length > 0) {
          logger.info(`[KnowledgeBase] ✅ Found ${smartdocsResult.results.length} relevant chunks via SmartDocs semantic search`);
          
          const contexts: string[] = [];
          let totalCharacters = 0;
          
          // Aggiungi prompt custom se configurato
          if (config.customPromptPrefix) {
            contexts.push(config.customPromptPrefix);
          }
          
          // Aggiungi i chunk più rilevanti da SmartDocs
          for (const result of smartdocsResult.results) {
            if (totalCharacters >= config.maxTotalCharacters) {
              logger.info(`[KnowledgeBase] Reached character limit (${config.maxTotalCharacters}), stopping`);
              break;
            }
            
            const remainingSpace = config.maxTotalCharacters - totalCharacters;
            const maxForThisChunk = Math.min(config.maxPerDocument, remainingSpace);
            
            // Include nome documento se disponibile e configurato
            if (config.includeFileName && result.metadata?.title) {
              contexts.push(`\n=== ${result.metadata.title} (Rilevanza: ${(result.score * 100).toFixed(1)}%) ===`);
            }
            
            // Aggiungi il contenuto del chunk (troncato se necessario)
            let chunkContent = result.content;
            if (chunkContent.length > maxForThisChunk) {
              chunkContent = chunkContent.substring(0, maxForThisChunk) + '...';
            }
            
            contexts.push(`Contenuto:\n${chunkContent}`);
            totalCharacters += chunkContent.length;
            
            logger.info(`[KnowledgeBase] Added chunk with ${chunkContent.length} chars (score: ${result.score.toFixed(3)})`);
          }
          
          // Aggiungi prompt suffix se configurato
          if (config.customPromptSuffix) {
            contexts.push(config.customPromptSuffix);
          }

          logger.info(`[KnowledgeBase] ✅ Extracted ${contexts.length} context pieces (${totalCharacters} chars) via SEMANTIC SEARCH`);
          return contexts;
        } else {
          logger.warn('[KnowledgeBase] No results from SmartDocs semantic search');
        }
      } catch (smartdocsError) {
        logger.warn('[KnowledgeBase] SmartDocs query failed, falling back to legacy method:', smartdocsError);
      }
      
      // FALLBACK: Usa il metodo legacy se SmartDocs non è disponibile
      logger.info('[KnowledgeBase] Using LEGACY context retrieval method');
      return await this.getLegacyRelevantContext(
        professionalId,
        subcategoryId,
        query,
        targetAudience,
        config
      );
      
    } catch (error) {
      logger.error('[KnowledgeBase] Error getting relevant context:', error);
      return [];
    }
  }

  /**
   * @deprecated Metodo legacy per backward compatibility
   * Recupera contesto usando ricerca manuale invece di semantic search
   */
  private static async getLegacyRelevantContext(
    professionalId: string,
    subcategoryId: string,
    query: string,
    targetAudience: 'professional' | 'client',
    config: any
  ): Promise<string[]> {
    logger.warn('[KnowledgeBase] ⚠️ Using LEGACY manual search. Semantic search recommended.');
    
    // Recupera i documenti dal DATABASE
    const documents = await prisma.knowledgeBase.findMany({
      where: {
        professionalId,
        subcategoryId,
        targetAudience,
        isActive: true
      },
      select: {
        id: true,
        originalName: true,
        filePath: true,
        fileType: true,
        metadata: true,
        isProcessed: true
      }
    });

    logger.info(`[KnowledgeBase] Found ${documents.length} documents in database`);

    if (documents.length === 0) {
      logger.warn('[KnowledgeBase] No documents found');
      return [];
    }

    // Estrai il contenuto dai documenti (METODO LEGACY)
    const contexts: string[] = [];
    let totalCharacters = 0;
    
    // Aggiungi prompt custom se configurato
    if (config.customPromptPrefix) {
      contexts.push(config.customPromptPrefix);
    }
    
    for (const doc of documents) {
      const fileName = doc.originalName || 'Documento';
      
      // Se abbiamo già troppi caratteri, interrompi
      if (totalCharacters >= config.maxTotalCharacters) {
        logger.info(`[KnowledgeBase] Reached character limit (${config.maxTotalCharacters})`);
        break;
      }
      
      // Include nome file se configurato
      if (config.includeFileName) {
        contexts.push(`\n=== Documento: ${fileName} ===`);
      }
      
      // Leggi il contenuto del file se esiste
      if (doc.filePath && fs.existsSync(doc.filePath)) {
        try {
          const content = await this.extractTextFromDocument(doc.filePath);
          if (content) {
            // Determina quanti caratteri possiamo ancora aggiungere
            const remainingSpace = config.maxTotalCharacters - totalCharacters;
            const maxForThisDoc = Math.min(config.maxPerDocument, remainingSpace);
            
            // Se il documento è processato e ha chunks, usa quelli (se configurato)
            if (config.includeMetadata && doc.isProcessed && doc.metadata && typeof doc.metadata === 'object') {
              const metadata = doc.metadata as any;
              if (metadata.semantic_chunks || metadata.chunks) {
                const chunkCount = metadata.semantic_chunks || metadata.chunks;
                const method = metadata.processing_method || 'fixed';
                contexts.push(`[Documento processato: ${chunkCount} chunks (${method})]`);
              }
            }
            
            // Estrai la porzione di testo rilevante
            let textToInclude = content;
            
            // Se includeFullDocument è true, prendi tutto (fino al limite)
            if (config.includeFullDocument) {
              textToInclude = content.substring(0, maxForThisDoc);
              if (content.length > maxForThisDoc) {
                textToInclude += '...';
              }
            }
            // Altrimenti usa la ricerca intelligente se abilitata
            else if (config.enableSmartSearch && content.length > maxForThisDoc) {
              // Cerca di includere parti che contengono parole chiave dalla query
              const queryWords = query.toLowerCase()
                .split(' ')
                .filter(w => w.length >= config.searchKeywordMinLength);
              
              if (queryWords.length > 0) {
                // Trova la prima occorrenza di una parola chiave
                let bestPosition = 0;
                for (const word of queryWords) {
                  const pos = content.toLowerCase().indexOf(word);
                  if (pos > 0) {
                    bestPosition = Math.max(0, pos - config.contextBeforeKeyword);
                    break;
                  }
                }
                
                const contextStart = bestPosition;
                const contextEnd = bestPosition + config.contextBeforeKeyword + config.contextAfterKeyword;
                textToInclude = '...' + content.substring(contextStart, Math.min(contextEnd, contextStart + maxForThisDoc)) + '...';
              } else {
                // Altrimenti prendi l'inizio del documento
                textToInclude = content.substring(0, maxForThisDoc) + '...';
              }
            }
            // Se smart search è disabilitata, prendi solo l'inizio
            else if (content.length > maxForThisDoc) {
              textToInclude = content.substring(0, maxForThisDoc) + '...';
            }
            
            contexts.push(`Contenuto:\n${textToInclude}`);
            totalCharacters += textToInclude.length;
            
            logger.info(`[KnowledgeBase] Added ${textToInclude.length} characters from ${fileName}`);
          }
        } catch (error) {
          logger.warn(`[KnowledgeBase] Could not read file ${doc.filePath}:`, error);
        }
      }
    }
    
    // Aggiungi prompt suffix se configurato
    if (config.customPromptSuffix) {
      contexts.push(config.customPromptSuffix);
    }

    logger.info(`[KnowledgeBase] 🔍 LEGACY: Extracted ${contexts.length} context pieces (${totalCharacters} chars)`);
    return contexts;
  }

  /**
   * Integra la Knowledge Base nel prompt dell'AI
   */
  static async enrichPromptWithKnowledge(
    professionalId: string,
    subcategoryId: string,
    basePrompt: string,
    userQuery: string,
    targetAudience: 'professional' | 'client'
  ): Promise<string> {
    try {
      const contexts = await this.getRelevantContext(
        professionalId,
        subcategoryId,
        userQuery,
        targetAudience
      );

      if (contexts.length === 0) {
        logger.info('No relevant context found in Knowledge Base');
        return basePrompt;
      }

      const enrichedPrompt = `
${basePrompt}

KNOWLEDGE BASE DISPONIBILE:
${contexts.join('\n')}

IMPORTANTE: Usa le informazioni dalla Knowledge Base quando pertinenti alla domanda dell'utente.
Adatta il linguaggio al target audience: ${targetAudience === 'professional' ? 'tecnico e dettagliato' : 'semplice e comprensibile'}.
`;

      logger.info('Prompt enriched with Knowledge Base content');
      return enrichedPrompt;
    } catch (error) {
      logger.error('Error enriching prompt with knowledge:', error);
      return basePrompt;
    }
  }
}
