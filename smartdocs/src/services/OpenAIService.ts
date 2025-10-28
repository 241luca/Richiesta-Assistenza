import OpenAI from 'openai';
import { logger } from '../utils/logger';
import { ApiKeyService } from './ApiKeyService';

export class OpenAIService {
  private client: OpenAI | null = null;
  private apiKey: string | null = null;

  constructor() {
    // Client will be initialized lazily when API key is loaded
  }

  private async ensureClient(): Promise<OpenAI> {
    if (this.client) {
      return this.client;
    }

    // Load API key from database using ApiKeyService (decrypts automatically)
    const apiKeyService = new ApiKeyService();
    const apiKeyData = await apiKeyService.getByService('openai', true); // unmask = true to get decrypted key

    if (!apiKeyData || !apiKeyData.key_value) {
      throw new Error('OpenAI API key not found in database. Please configure it in SmartDocs settings.');
    }

    this.apiKey = apiKeyData.key_value;
    this.client = new OpenAI({
      apiKey: this.apiKey
    });

    logger.info('OpenAI client initialized with API key from database');
    return this.client;
  }

  async createEmbedding(text: string): Promise<number[]> {
    const client = await this.ensureClient();
    
    try {
      const response = await client.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text
      });

      return response.data[0].embedding;
    } catch (error) {
      logger.error('Error creating embedding', error);
      throw error;
    }
  }

  async generateAnswer(question: string, sources: any[], containerSettings?: any): Promise<string> {
    const client = await this.ensureClient();
    const context = sources.map(s => s.chunk_text).join('\n\n');

    // Use custom prompt from container or default
    const defaultPrompt = `Basandoti SOLO sul seguente contesto, rispondi alla domanda.
Se non trovi la risposta nel contesto, rispondi "Non ho informazioni sufficienti per rispondere".

CONTESTO:
${context}

DOMANDA: ${question}

RISPOSTA:`;

    const customPromptTemplate = containerSettings?.ai_prompt;
    const prompt = customPromptTemplate 
      ? customPromptTemplate
          .replace('{context}', context)
          .replace('{question}', question)
      : defaultPrompt;

    // Use container settings or defaults
    const model = containerSettings?.ai_model || 'gpt-4';
    const temperature = parseFloat(containerSettings?.ai_temperature) || 0.3;
    const max_tokens = parseInt(containerSettings?.ai_max_tokens) || 500;

    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: 'Sei un assistente che risponde SOLO basandosi sul contesto fornito.' },
          { role: 'user', content: prompt }
        ],
        temperature,
        max_tokens
      });

      return response.choices[0].message.content || 'Nessuna risposta generata';
    } catch (error) {
      logger.error('Error generating answer', error);
      throw error;
    }
  }

  /**
   * Generate answer using CHAT mode with conversation history
   * This is the NEW preferred method for RAG queries
   */
  async generateChatAnswer(messages: any[], containerSettings?: any): Promise<string> {
    const client = await this.ensureClient();

    // Use container settings or defaults
    const model = containerSettings?.ai_model || 'gpt-4';
    const temperature = parseFloat(containerSettings?.ai_temperature) || 0.3;
    const max_tokens = parseInt(containerSettings?.ai_max_tokens) || 1000;

    try {
      const response = await client.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens
      });

      return response.choices[0].message.content || 'Nessuna risposta generata';
    } catch (error) {
      logger.error('Error generating chat answer', error);
      throw error;
    }
  }

  async classify(content: string, types?: string[]): Promise<any> {
    const client = await this.ensureClient();
    const typesList = types?.join(', ') || 'rapportino, manuale, fattura, contratto, altro';

    const prompt = `Classifica il seguente documento in una di queste categorie: ${typesList}

DOCUMENTO:
${content.substring(0, 1000)}

Rispondi SOLO con un JSON nel formato:
{
  "type": "categoria",
  "confidence": 0.95,
  "reason": "breve spiegazione"
}`;

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      logger.error('Error classifying document', error);
      throw error;
    }
  }

  async extractStructuredData(content: string, schema?: any): Promise<any> {
    const client = await this.ensureClient();
    const schemaPrompt = schema 
      ? `Segui questo schema: ${JSON.stringify(schema)}`
      : 'Estrai tutti i dati strutturati che riesci a trovare';

    const prompt = `Estrai dati strutturati dal seguente documento.
${schemaPrompt}

DOCUMENTO:
${content.substring(0, 2000)}

Rispondi con un JSON valido.`;

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      const data = JSON.parse(response.choices[0].message.content || '{}');

      return {
        data,
        metadata: {
          model: 'gpt-4',
          extractedFields: Object.keys(data).length
        }
      };
    } catch (error) {
      logger.error('Error extracting data', error);
      throw error;
    }
  }
}
