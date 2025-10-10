import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface AiChatRequest {
  recipientId: string;
  requestId?: string;
  subcategoryId?: string;
  message: string;
  conversationType: 'client_help' | 'professional_help' | 'system_help';
}

class AiSimpleService {
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
        logger.info('OpenAI client initialized');
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
          throw new Error('OpenAI non configurato. Configura la chiave API in Admin > API Keys > AI');
        }
      }

      // Determina il prompt in base al tipo di conversazione
      let systemPrompt = 'Sei un assistente esperto del Sistema Richiesta Assistenza.';
      
      if (chatRequest.conversationType === 'system_help') {
        systemPrompt = 'Sei un assistente che aiuta gli utenti a usare il Sistema Richiesta Assistenza. Spiega in modo semplice e chiaro come utilizzare le funzionalità del sistema.';
      } else if (chatRequest.conversationType === 'client_help') {
        systemPrompt = 'Sei un assistente tecnico che aiuta i clienti con i loro problemi. Fornisci consigli pratici e soluzioni immediate.';
      } else if (chatRequest.conversationType === 'professional_help') {
        systemPrompt = 'Sei un consulente tecnico esperto che aiuta i professionisti. Fornisci informazioni tecniche dettagliate, suggerimenti su materiali e procedure.';
      }

      // Se c'è una richiesta, aggiungi contesto
      if (chatRequest.requestId) {
        const request = await prisma.assistanceRequest.findUnique({
          where: { id: chatRequest.requestId },
          include: {
            Client: {
              select: {
                firstName: true,
                city: true
              }
            }
          }
        });

        if (request) {
          systemPrompt += ` La richiesta attuale riguarda: ${request.title}. Descrizione: ${request.description}`;
        }
      }

      const completion = await this.openaiClient.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: chatRequest.message }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const response = completion.choices[0].message.content;

      return {
        message: response,
        model: 'gpt-3.5-turbo',
        tokensUsed: completion.usage?.total_tokens || 0
      };
    } catch (error) {
      logger.error('Error in AI service:', error);
      throw error;
    }
  }
}

export const aiSimpleService = new AiSimpleService();
