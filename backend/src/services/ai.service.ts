/**
 * AI Service
 * Gestisce l'integrazione con OpenAI per assistenza AI agli utenti
 * 
 * Responsabilità:
 * - Inizializzazione client OpenAI con API key da database
 * - Invio messaggi chat a GPT-3.5/GPT-4
 * - Generazione embeddings per knowledge base
 * - Retry logic con circuit breaker
 * - Logging uso token e costi
 * - Conversazioni client e professional
 * 
 * @module services/ai
 * @version 5.2.1
 * @updated 2025-10-01
 * @author Sistema Richiesta Assistenza
 */

import { prisma } from '../config/database';
import OpenAI from 'openai';
import { logger } from '../utils/logger';
import { callOpenAIWithRetry } from '../utils/retryLogic';

/**
 * Messaggio chat AI
 */
interface AiChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

/**
 * Richiesta chat AI
 */
interface AiChatRequest {
  recipientId: string;
  requestId?: string;
  subcategoryId?: string;
  message: string;
  conversationType: 'client_help' | 'professional_help' | 'system_help';
  conversationId?: string;
}

/**
 * AI Service Class
 * Gestisce tutte le interazioni con OpenAI
 */
class AiService {
  private openaiClient: OpenAI | null = null;

  constructor() {
    logger.info('[AiService] Service initialized');
    this.initializeOpenAI();
  }

  /**
   * Inizializza il client OpenAI recuperando l'API key dal database
   * 
   * @private
   * @returns {Promise<void>}
   */
  private async initializeOpenAI(): Promise<void> {
    try {
      logger.info('[AiService] Initializing OpenAI client');

      const apiKey = await prisma.apiKey.findFirst({
        where: {
          service: 'OPENAI',
          isActive: true
        }
      });

      if (apiKey?.key) {
        this.openaiClient = new OpenAI({
          apiKey: apiKey.key
        });
        logger.info('[AiService] ✅ OpenAI client initialized successfully');
      } else {
        logger.warn('[AiService] ⚠️ OpenAI API key not found or inactive');
      }
    } catch (error) {
      logger.error('[AiService] Error initializing OpenAI:', {
        error: error instanceof Error ? error.message : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  /**
   * Invia un messaggio al sistema AI e riceve una risposta
   * 
   * @param {AiChatRequest} chatRequest - Richiesta chat
   * @returns {Promise<{ message: string; model: string; tokensUsed: number }>} Risposta AI
   * @throws {Error} Se client non inizializzato o errore OpenAI
   * 
   * @example
   * const response = await aiService.sendMessage({
   *   recipientId: 'user123',
   *   message: 'Come posso creare una richiesta?',
   *   conversationType: 'client_help'
   * });
   * console.log(response.message); // Risposta AI
   * console.log(response.tokensUsed); // Token consumati
   */
  async sendMessage(chatRequest: AiChatRequest): Promise<{
    message: string;
    model: string;
    tokensUsed: number;
  }> {
    try {
      logger.info('[AiService] Sending message to AI', {
        recipientId: chatRequest.recipientId,
        conversationType: chatRequest.conversationType,
        messageLength: chatRequest.message.length
      });

      // Verifica che il client sia inizializzato
      if (!this.openaiClient) {
        await this.initializeOpenAI();
        if (!this.openaiClient) {
          throw new Error('OpenAI client not initialized. Please configure API key.');
        }
      }

      // Prepara i messaggi per la conversazione
      const messages: AiChatMessage[] = [
        {
          role: 'system',
          content: 'Sei un assistente tecnico esperto del Sistema Richiesta Assistenza. Aiuta gli utenti con i loro problemi in modo chiaro e professionale.'
        },
        {
          role: 'user',
          content: chatRequest.message
        }
      ];

      // Usa retry logic con circuit breaker
      const completion = await callOpenAIWithRetry(() => 
        this.openaiClient!.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: messages as any,
          temperature: 0.7,
          max_tokens: 2048
        })
      );

      const aiResponse = (completion as any).choices[0].message.content || '';

      logger.info('[AiService] AI response generated successfully', {
        recipientId: chatRequest.recipientId,
        tokensUsed: (completion as any).usage?.total_tokens || 0,
        model: 'gpt-3.5-turbo'
      });

      // ✅ RETURN PURE DATA
      return {
        message: aiResponse,
        model: 'gpt-3.5-turbo',
        tokensUsed: completion.usage?.total_tokens || 0
      };
    } catch (error) {
      logger.error('[AiService] Error sending message to AI:', {
        error: error instanceof Error ? error.message : 'Unknown',
        recipientId: chatRequest.recipientId,
        conversationType: chatRequest.conversationType,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Ottiene l'istanza del client OpenAI (per funzioni esportate)
   * 
   * @private
   * @returns {OpenAI | null}
   */
  private getClient(): OpenAI | null {
    return this.openaiClient;
  }

  /**
   * Reinizializza il client OpenAI (se necessario)
   * 
   * @returns {Promise<void>}
   */
  async reinitialize(): Promise<void> {
    logger.info('[AiService] Reinitializing OpenAI client');
    this.openaiClient = null;
    await this.initializeOpenAI();
  }
}

/**
 * Export Singleton Instance
 * Usa questa istanza in tutto il sistema
 */
export const aiService = new AiService();

/**
 * Genera una risposta AI da un prompt semplice
 * 
 * @param {string} prompt - Testo prompt
 * @param {string} model - Modello OpenAI (default: gpt-3.5-turbo)
 * @returns {Promise<string>} Risposta AI (PURE DATA)
 * @throws {Error} Se client non inizializzato o errore OpenAI
 * 
 * @example
 * const response = await generateAIResponse('Spiegami come funziona il sistema');
 */
export async function generateAIResponse(
  prompt: string, 
  model: string = 'gpt-3.5-turbo'
): Promise<string> {
  try {
    logger.info('[AiService] Generating AI response', {
      promptLength: prompt.length,
      model
    });

    // Verifica inizializzazione
    if (!(aiService as any).openaiClient) {
      await (aiService as any).initializeOpenAI();
      
      if (!(aiService as any).openaiClient) {
        throw new Error('OpenAI client not initialized');
      }
    }

    const completion = await callOpenAIWithRetry(() => 
      (aiService as any).openaiClient!.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'Sei un assistente AI per un servizio di assistenza tecnica. Rispondi in modo professionale, chiaro e utile.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2048
      })
    );

    const response = (completion as any).choices[0].message.content || '';

    logger.info('[AiService] AI response generated', {
      promptLength: prompt.length,
      responseLength: response.length,
      tokensUsed: completion.usage?.total_tokens || 0
    });

    // ✅ RETURN PURE DATA (string)
    return response;
  } catch (error) {
    logger.error('[AiService] Error generating AI response:', {
      error: error instanceof Error ? error.message : 'Unknown',
      promptLength: prompt.length,
      model,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

/**
 * Genera un embedding vettoriale per un testo (per knowledge base)
 * 
 * @param {string} text - Testo da convertire in embedding
 * @returns {Promise<number[] | null>} Array di numeri (embedding) o null se errore
 * 
 * @example
 * const embedding = await generateEmbedding('Testo da indicizzare');
 * if (embedding) {
 *   // Salva embedding nel database
 *   await saveToKnowledgeBase(text, embedding);
 * }
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    logger.info('[AiService] Generating embedding', {
      textLength: text.length
    });

    // Verifica inizializzazione
    if (!(aiService as any).openaiClient) {
      await (aiService as any).initializeOpenAI();
      
      if (!(aiService as any).openaiClient) {
        logger.warn('[AiService] Cannot generate embedding: OpenAI client not initialized');
        return null;
      }
    }

    const response = await callOpenAIWithRetry(() => 
      (aiService as any).openaiClient!.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text
      })
    );

    const embedding = (response as any).data[0].embedding;

    logger.info('[AiService] Embedding generated successfully', {
      textLength: text.length,
      embeddingDimensions: embedding.length
    });

    // ✅ RETURN PURE DATA (array)
    return embedding;
  } catch (error) {
    logger.error('[AiService] Error generating embedding:', {
      error: error instanceof Error ? error.message : 'Unknown',
      textLength: text.length,
      stack: error instanceof Error ? error.stack : undefined
    });
    return null;
  }
}
