import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';
// Usa la versione completa con database
import { KnowledgeBaseConfigService } from './knowledge-base-config.service';

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

      logger.info(`Found ${documents.length} documents to process`);

      for (const doc of documents) {
        try {
          // Estrai il testo
          const text = await this.extractTextFromDocument(doc.filePath);
          
          if (text) {
            // Dividi in chunks per l'elaborazione
            const chunks = this.splitTextIntoChunks(text, 1000);
            
            // Aggiorna il documento nel DATABASE
            await prisma.knowledgeBase.update({
              where: { id: doc.id },
              data: {
                isProcessed: true,
                processedAt: new Date(),
                metadata: {
                  chunks: chunks.length,
                  textLength: text.length,
                  processedChunks: chunks.map((chunk, index) => ({
                    index,
                    text: chunk.substring(0, 200) + '...', // Salva solo preview
                    length: chunk.length
                  }))
                }
              }
            });
            
            logger.info(`Processed document ${doc.id}: ${chunks.length} chunks created`);
          }
        } catch (error) {
          logger.error(`Error processing document ${doc.id}:`, error);
        }
      }

      return {
        processed: documents.length,
        success: true
      };
    } catch (error) {
      logger.error('Error processing knowledge base documents:', error);
      throw error;
    }
  }

  /**
   * Divide il testo in chunks gestibili
   */
  static splitTextIntoChunks(text: string, chunkSize: number = 1000): string[] {
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
   * Ora usa le configurazioni dal database
   */
  static async getRelevantContext(
    professionalId: string,
    subcategoryId: string,
    query: string,
    targetAudience: 'professional' | 'client'
  ): Promise<string[]> {
    try {
      logger.info('Getting relevant context from Knowledge Base');
      logger.info('Parameters:', { professionalId, subcategoryId, targetAudience, query });
      
      // CARICA CONFIGURAZIONI DAL DATABASE
      const config = await KnowledgeBaseConfigService.getConfig(
        professionalId,
        subcategoryId,
        targetAudience
      );
      
      logger.info('Using configuration:', {
        maxPerDocument: config.maxPerDocument,
        maxTotalCharacters: config.maxTotalCharacters,
        enableSmartSearch: config.enableSmartSearch
      });
      
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

      logger.info(`Found ${documents.length} documents in Knowledge Base`);

      if (documents.length === 0) {
        logger.warn('No documents found in Knowledge Base');
        return [];
      }

      // Estrai il contenuto dai documenti
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
          logger.info(`Reached character limit (${config.maxTotalCharacters}), stopping context extraction`);
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
                if (metadata.processedChunks) {
                  contexts.push(`[Documento processato con ${metadata.chunks || 0} sezioni]`);
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
              
              logger.info(`Added ${textToInclude.length} characters from ${fileName}`);
            }
          } catch (error) {
            logger.warn(`Could not read file ${doc.filePath}:`, error);
          }
        }
      }
      
      // Aggiungi prompt suffix se configurato
      if (config.customPromptSuffix) {
        contexts.push(config.customPromptSuffix);
      }

      logger.info(`Extracted ${contexts.length} context pieces (${totalCharacters} total characters) from Knowledge Base`);
      return contexts;
    } catch (error) {
      logger.error('Error getting relevant context:', error);
      return [];
    }
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
