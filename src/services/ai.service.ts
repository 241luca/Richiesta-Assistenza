import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { logger } from '../utils/logger';
import { callOpenAIWithRetry } from '../utils/retryLogic';

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
}

class AiService {
  private openaiClient: OpenAI | null = null;

  constructor() {
    this.initializeOpenAI();
  }

  private async initializeOpenAI() {
    try {
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
        logger.info('OpenAI client initialized successfully');
      } else {
        logger.warn('OpenAI API key not found or inactive');
      }
    } catch (error) {
      logger.error('Error initializing OpenAI:', error);
    }
  }

  async sendMessage(chatRequest: AiChatRequest) {
    try {
      if (!this.openaiClient) {
        await this.initializeOpenAI();
        if (!this.openaiClient) {
          throw new Error('OpenAI client not initialized. Please configure API key.');
        }
      }

      const messages: AiChatMessage[] = [
        {
          role: 'system',
          content: 'Sei un assistente tecnico esperto del Sistema Richiesta Assistenza. Aiuta gli utenti con i loro problemi.'
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

      const aiResponse = completion.choices[0].message.content;

      return {
        message: aiResponse,
        model: 'gpt-3.5-turbo',
        tokensUsed: completion.usage?.total_tokens || 0
      };
    } catch (error) {
      logger.error('Error sending message to AI:', error);
      throw error;
    }
  }
}

export const aiService = new AiService();

// Funzioni esportate per compatibilità
export async function generateAIResponse(prompt: string, model: string = 'gpt-3.5-turbo') {
  try {
    if (!aiService.openaiClient) {
      await aiService.initializeOpenAI();
    }

    const completion = await callOpenAIWithRetry(() => 
      aiService.openaiClient!.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'Sei un assistente AI per un servizio di assistenza tecnica. Rispondi in modo professionale e utile.'
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

    return completion.choices[0].message.content || '';
  } catch (error) {
    logger.error('Error generating AI response:', error);
    throw error;
  }
}

export async function generateEmbedding(text: string) {
  try {
    if (!aiService.openaiClient) {
      await aiService.initializeOpenAI();
    }

    const response = await callOpenAIWithRetry(() => 
      aiService.openaiClient!.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text
      })
    );

    return response.data[0].embedding;
  } catch (error) {
    logger.error('Error generating embedding:', error);
    return null;
  }
}
