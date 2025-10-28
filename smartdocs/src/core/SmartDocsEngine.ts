import { DatabaseClient } from '../database/client';
import { DatabaseClient } from '../database/client';
import { OpenAIService } from '../services/OpenAIService';
import { ChunkingService } from '../services/ChunkingService';
import { logger } from '../utils/logger';

export class SmartDocsEngine {
  private db: DatabaseClient;
  private openai: OpenAIService;
  private chunking: ChunkingService;

  constructor() {
    this.db = DatabaseClient.getInstance();
    this.openai = new OpenAIService();
    this.chunking = new ChunkingService();
  }

  async ingest(data: any) {
    const { type, content, title, containerId, metadata } = data;

    // Crea documento
    const docQuery = `
      INSERT INTO smartdocs.documents (container_id, type, title, content, metadata)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const docResult = await this.db.query(docQuery, [
      containerId || null,
      type,
      title || 'Untitled',
      content,
      metadata || {}
    ]);

    const document = docResult.rows[0];

    // Chunking del contenuto
    const chunks = this.chunking.splitText(content);

    // Genera embeddings per ogni chunk
    let chunksProcessed = 0;
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await this.openai.createEmbedding(chunk);

      const embQuery = `
        INSERT INTO smartdocs.embeddings (document_id, chunk_index, chunk_text, embedding, metadata)
        VALUES ($1, $2, $3, $4, $5)
      `;

      await this.db.query(embQuery, [
        document.id,
        i,
        chunk,
        JSON.stringify(embedding),
        { chunkSize: chunk.length }
      ]);

      chunksProcessed++;
    }

    logger.info('Document ingested successfully', {
      documentId: document.id,
      chunksProcessed
    });

    return {
      documentId: document.id,
      chunksProcessed,
      document
    };
  }

  async query(params: any) {
    const { question, containerId, limit = 5, threshold = 0.7, conversationHistory = [], systemPrompt } = params;

    // Get container settings if containerId is provided
    let containerSettings = null;
    if (containerId) {
      const containerQuery = await this.db.query(
        `SELECT name, ai_model, ai_temperature, ai_max_tokens, ai_prompt, chunk_size, chunk_overlap
         FROM smartdocs.container_instances WHERE id = $1`,
        [containerId]
      );
      if (containerQuery.rows.length > 0) {
        containerSettings = containerQuery.rows[0];
      }
    }

    // Genera embedding della domanda
    const questionEmbedding = await this.openai.createEmbedding(question);

    // Query similarità vettoriale
    let query = `
      SELECT 
        e.chunk_text,
        d.title,
        COALESCE(d.entity_type, d.external_doc_type, 'document') as type,
        d.id as document_id,
        1 - (e.embedding <=> $1) as similarity
      FROM smartdocs.embeddings e
      JOIN smartdocs.documents d ON d.id = e.document_id
      WHERE 1=1
    `;

    const params_arr: any[] = [JSON.stringify(questionEmbedding)];
    let paramIndex = 2;

    if (containerId) {
      query += ` AND d.container_id = $${paramIndex++}`;
      params_arr.push(containerId);
    }

    query += `
      ORDER BY e.embedding <=> $1
      LIMIT $${paramIndex}
    `;
    params_arr.push(limit);

    // Log della query per debug
    logger.info(`[SmartDocsEngine] Executing vector query:`, {
      containerId,
      limit,
      threshold,
      paramsCount: params_arr.length,
      embeddingLength: Array.isArray(questionEmbedding) ? questionEmbedding.length : 'unknown'
    });

    const result = await this.db.query(query, params_arr);

    logger.info(`[SmartDocsEngine] Vector search found ${result.rows.length} chunks before threshold filter`);
    result.rows.forEach((row, i) => {
      logger.info(`  Chunk ${i+1}: similarity=${row.similarity.toFixed(4)}, title="${row.title}"`);
    });

    const sources = result.rows.filter(row => row.similarity >= threshold);

    logger.info(`[SmartDocsEngine] After threshold ${threshold}: ${sources.length} sources remaining`);

    // Build context from sources
    const context = sources.map((s, idx) => 
      `[DOCUMENTO ${idx + 1}: ${s.title}]\n${s.chunk_text}`
    ).join('\n\n---\n\n');
    
    // Build conversation messages for CHAT mode
    const messages = [];
    
    // System message with custom prompt (from params), container prompt, or default
    const finalSystemPrompt = systemPrompt || containerSettings?.ai_prompt || 
      `Sei un assistente AI specializzato nel rispondere a domande basandoti esclusivamente sul contesto fornito.

REGOLE IMPORTANTI:
- Rispondi SOLO usando le informazioni dal contesto fornito
- Se il contesto non contiene informazioni sufficienti, rispondi: "Non ho informazioni sufficienti per rispondere"
- Cita i documenti di riferimento quando possibile (es: "Secondo il Documento 1...")
- Sii preciso e conciso
- Se trovi informazioni contrastanti, segnalalo`;
    
    messages.push({
      role: 'system',
      content: finalSystemPrompt
    });
    
    // Add conversation history (if provided)
    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...conversationHistory);
    }
    
    // Add current context and question
    messages.push({
      role: 'user',
      content: `CONTESTO:
${context}

---

DOMANDA: ${question}`
    });

    // Generate answer using CHAT mode
    const answer = await this.openai.generateChatAnswer(messages, containerSettings);

    // Build debug info with the complete prompt
    const debugInfo = {
      model: containerSettings?.ai_model || 'gpt-4',
      temperature: containerSettings?.ai_temperature || 0.7,
      max_tokens: containerSettings?.ai_max_tokens || 1000,
      messages: messages,
      messagesCount: messages.length,
      systemPrompt: finalSystemPrompt,
      context: context,
      contextLength: context.length,
      sourcesUsed: sources.length,
      conversationHistoryLength: conversationHistory?.length || 0
    };

    return {
      answer,
      sources,
      metadata: {
        sourcesCount: sources.length,
        threshold,
        question,
        containerSettings: containerSettings ? {
          name: containerSettings.name,
          model: containerSettings.ai_model,
          temperature: containerSettings.ai_temperature,
          max_tokens: containerSettings.ai_max_tokens,
          chunk_size: containerSettings.chunk_size,
          chunk_overlap: containerSettings.chunk_overlap,
          custom_prompt: containerSettings.ai_prompt
        } : null
      },
      debug: debugInfo  // ✅ NEW: Complete debug information
    };
  }

  async classify(params: any) {
    const { content, types } = params;

    const result = await this.openai.classify(content, types);

    return result;
  }

  async extract(params: any) {
    const { content, schema } = params;

    const result = await this.openai.extractStructuredData(content, schema);

    return result;
  }
}
