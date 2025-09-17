import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { logger } from '../utils/logger';
import { KnowledgeBaseAIService } from './knowledge-base-ai.service';

const prisma = new PrismaClient();

interface AiChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

interface AiChatRequest {
  recipientId: string;
  requestId?: string;
  subcategoryId?: string;
  message: string;
  conversationType: 'client_help' | 'professional_help' | 'system_help';
  conversationId?: string;
  userId?: string;
  mode?: 'professional' | 'client';
}

class AiProfessionalService {
  private openaiClient: OpenAI | null = null;
  private conversationCache: Map<string, AiChatMessage[]> = new Map();

  constructor() {
    // Inizializzazione lazy
  }

  private async ensureOpenAIClient(): Promise<void> {
    if (this.openaiClient) return;
    
    try {
      const apiKey = await prisma.apiKey.findFirst({
        where: {
          service: 'OPENAI',
          isActive: true
        }
      });

      if (!apiKey?.key) {
        throw new Error('OpenAI API key not found in database. Please configure in Admin > API Keys');
      }

      logger.info('Loading OpenAI API key from database...');
      
      if (!apiKey.key.startsWith('sk-')) {
        throw new Error('Invalid OpenAI API key format. Key must start with "sk-"');
      }

      this.openaiClient = new OpenAI({
        apiKey: apiKey.key
      });
      
      logger.info('OpenAI client initialized successfully');
    } catch (error) {
      logger.error('Error initializing OpenAI:', error);
      throw error;
    }
  }

  async sendMessage(chatRequest: AiChatRequest): Promise<any> {
    try {
      // Assicura che OpenAI sia inizializzato
      await this.ensureOpenAIClient();
      
      if (!this.openaiClient) {
        throw new Error('Failed to initialize OpenAI client');
      }

      // Recupera conversazione precedente se esiste
      const conversationKey = chatRequest.conversationId || 
        `${chatRequest.userId || 'unknown'}-${chatRequest.subcategoryId || 'general'}`;
      const previousMessages = this.conversationCache.get(conversationKey) || [];

      // Determina il system prompt base sul tipo di conversazione o modalità
      let systemPrompt = 'Sei un assistente AI professionale del Sistema Richiesta Assistenza.';
      let temperature = 0.7;
      let model = 'gpt-3.5-turbo';
      let maxTokens = 2000;
      
      // Se abbiamo professionalId e subcategoryId, cerca le impostazioni personalizzate
      if (chatRequest.professionalId && chatRequest.subcategoryId) {
        try {
          console.log('\n=== DEBUG AI SETTINGS ===');
          console.log('Looking for settings with:');
          console.log('professionalId:', chatRequest.professionalId);
          console.log('subcategoryId:', chatRequest.subcategoryId);
          console.log('mode:', chatRequest.mode);

          // Query per recuperare le impostazioni dalla tabella corretta basata sulla modalità
          let settings = null;
          
          if (chatRequest.mode === 'client') {
            // Per modalità client, cerca nella tabella ClientAiSettings
            const clientSettings = await prisma.clientAiSettings.findFirst({
              where: {
                professionalId: chatRequest.professionalId,
                subcategoryId: chatRequest.subcategoryId
              }
            });
            
            if (clientSettings) {
              console.log('Found CLIENT settings:', clientSettings);
              systemPrompt = clientSettings.systemPrompt || systemPrompt;
              temperature = clientSettings.temperature ?? temperature;
              model = clientSettings.modelName || model;
              maxTokens = clientSettings.maxTokens || maxTokens;
              console.log('Using CLIENT settings - prompt:', systemPrompt.substring(0, 100));
            }
          } else {
            // Per modalità professional, cerca nella tabella ProfessionalAiSettings
            const profSettings = await prisma.professionalAiSettings.findFirst({
              where: {
                professionalId: chatRequest.professionalId,
                subcategoryId: chatRequest.subcategoryId
              }
            });
            
            if (profSettings) {
              console.log('Found PROFESSIONAL settings:', profSettings);
              systemPrompt = profSettings.systemPrompt || systemPrompt;
              temperature = profSettings.temperature ?? temperature;
              model = profSettings.modelName || model;
              maxTokens = profSettings.maxTokens || maxTokens;
              console.log('Using PROFESSIONAL settings - prompt:', systemPrompt.substring(0, 100));
            }
          }
          console.log('FINAL systemPrompt being used:', systemPrompt.substring(0, 100));
          console.log('=== END DEBUG ===\n');

        } catch (error) {
          logger.warn('Errore nel recupero impostazioni personalizzate:', error);
        }
      }
      
      // Se non abbiamo trovato impostazioni personalizzate, usa i default per modalità
      if (systemPrompt === 'Sei un assistente AI professionale del Sistema Richiesta Assistenza.') {
        if (chatRequest.mode === 'client') {
          systemPrompt = `Sei un assistente tecnico esperto e amichevole.
            Fornisci consigli pratici e soluzioni immediate ai clienti.
            Usa un linguaggio semplice e comprensibile.
            Evita tecnicismi non necessari.
            Prioritizza la sicurezza e suggerisci quando è necessario un professionista.`;
        } else if (chatRequest.mode === 'professional' || chatRequest.conversationType === 'professional_help') {
          systemPrompt = `Sei un consulente tecnico esperto per professionisti del settore.
            Fornisci informazioni tecniche dettagliate e precise.
            Suggerisci best practices, normative applicabili e soluzioni professionali.
            Includi consigli su materiali, strumenti e procedure ottimali.`;
        } else if (chatRequest.conversationType === 'client_help') {
          systemPrompt = `Sei un assistente tecnico esperto e amichevole.
            Fornisci consigli pratici e soluzioni immediate ai clienti.
            Usa un linguaggio semplice e comprensibile.
            Prioritizza la sicurezza e suggerisci quando è necessario un professionista.`;
        }
      }

      // Se c'è una sottocategoria, aggiungi contesto
      if (chatRequest.subcategoryId) {
        try {
          const subcategory = await prisma.subcategory.findUnique({
            where: { id: chatRequest.subcategoryId },
            include: {
              category: true
            }
          });
          
          if (subcategory) {
            systemPrompt += `\n\nContesto: Stai assistendo per servizi di ${subcategory.category.name} - ${subcategory.name}.`;
            if (subcategory.description) {
              systemPrompt += ` ${subcategory.description}`;
            }
          }
        } catch (error) {
          logger.warn('Could not load subcategory context:', error);
        }
      }

      // INTEGRAZIONE KNOWLEDGE BASE
      logger.info('=== KNOWLEDGE BASE CHECK ===');
      logger.info('professionalId:', chatRequest.professionalId || 'NOT PROVIDED');
      logger.info('subcategoryId:', chatRequest.subcategoryId || 'NOT PROVIDED');
      logger.info('mode:', chatRequest.mode || 'NOT PROVIDED');
      
      if (chatRequest.professionalId && chatRequest.subcategoryId) {
        try {
          logger.info('Enriching prompt with Knowledge Base...');
          const targetAudience = chatRequest.mode === 'client' ? 'client' : 'professional';
          
          // Arricchisci il prompt con la Knowledge Base
          const enrichedPrompt = await KnowledgeBaseAIService.enrichPromptWithKnowledge(
            chatRequest.professionalId,
            chatRequest.subcategoryId,
            systemPrompt,
            chatRequest.message,
            targetAudience
          );
          
          // Verifica se il prompt è stato effettivamente arricchito
          if (enrichedPrompt !== systemPrompt) {
            systemPrompt = enrichedPrompt;
            logger.info('✅ Prompt SUCCESSFULLY enriched with Knowledge Base context');
          } else {
            logger.info('⚠️ Knowledge Base found but no relevant context added');
          }
        } catch (error) {
          logger.warn('❌ Could not enrich prompt with Knowledge Base:', error);
          // Continua senza Knowledge Base se c'è un errore
        }
      } else {
        logger.warn('⚠️ Knowledge Base NOT used - missing professionalId or subcategoryId');
      }
      logger.info('=== END KNOWLEDGE BASE CHECK ===');

      // Costruisci array messaggi
      const messages: AiChatMessage[] = [
        {
          role: 'system',
          content: systemPrompt
        }
      ];

      // Aggiungi storico conversazione (ultimi 10 messaggi per mantenere contesto)
      messages.push(...previousMessages.slice(-10));

      // Aggiungi nuovo messaggio utente
      messages.push({
        role: 'user',
        content: chatRequest.message
      });

      logger.info('Calling OpenAI API...');
      logger.info('Message count:', messages.length);
      logger.info('Mode:', chatRequest.mode || 'default');

      // Chiama OpenAI
      const completion = await this.openaiClient.chat.completions.create({
        model: model,
        messages: messages as any,
        temperature: temperature,
        max_tokens: maxTokens
      });

      const aiResponse = completion.choices[0].message.content;
      const totalTokens = completion.usage?.total_tokens || 0;
      
      logger.info('OpenAI response received, tokens used:', totalTokens);

      // Aggiorna cache conversazione
      const updatedMessages = [
        ...previousMessages,
        {
          role: 'user' as const,
          content: chatRequest.message,
          timestamp: new Date()
        },
        {
          role: 'assistant' as const,
          content: aiResponse || '',
          timestamp: new Date()
        }
      ];
      this.conversationCache.set(conversationKey, updatedMessages.slice(-50));

      return {
        message: aiResponse,
        tokensUsed: totalTokens,
        model: 'gpt-3.5-turbo',
        conversationId: conversationKey
      };
      
    } catch (error: any) {
      logger.error('Error in sendMessage:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.ensureOpenAIClient();
      
      if (!this.openaiClient) {
        return false;
      }

      // Test semplice con una chiamata minima
      const test = await this.openaiClient.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5
      });

      return !!test.choices[0].message;
    } catch (error) {
      logger.error('OpenAI connection test failed:', error);
      return false;
    }
  }

  clearConversation(conversationId: string): void {
    this.conversationCache.delete(conversationId);
  }

  async getUsageStats(userId?: string): Promise<any> {
    // Placeholder per statistiche future
    return {
      totalConversations: this.conversationCache.size,
      activeConversations: this.conversationCache.size
    };
  }
}

export default new AiProfessionalService();
