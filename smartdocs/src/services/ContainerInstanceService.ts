import { DatabaseClient } from '../database/client';
import { logger } from '../utils/logger';

export interface ContainerInstance {
  id: string;
  template_code: string;
  owner_id: string; // Changed from number to string to support UUID
  owner_type: 'PROFESSIONAL' | 'CLIENT' | 'ADMIN';
  name: string;
  description?: string;
  ai_prompt?: string;
  
  // AI Settings
  ai_model: string;
  ai_temperature: number;
  ai_max_tokens: number;
  ai_top_p: number;
  ai_frequency_penalty: number;
  ai_presence_penalty: number;
  
  // Knowledge Base and Memories
  knowledge_base_ids?: string[];
  memories_enabled?: boolean;
  memories_config?: Record<string, any>;
  
  // RAG Settings
  chunk_size: number;
  chunk_overlap: number;
  similarity_threshold: number;
  max_results: number;
  
  // Formati e Tipi
  allowed_formats: string[];
  document_types: string[];
  
  storage_path: string;
  metadata?: Record<string, any>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateInstanceData {
  template_code: string;
  owner_id: string; // Changed from number to string to support UUID
  owner_type: 'PROFESSIONAL' | 'CLIENT' | 'ADMIN';
  name: string;
  description?: string;
  ai_prompt?: string;
  
  // AI Settings (opzionali - usano default se non specificati)
  ai_model?: string;
  ai_temperature?: number;
  ai_max_tokens?: number;
  ai_top_p?: number;
  ai_frequency_penalty?: number;
  ai_presence_penalty?: number;
  
  // RAG Settings (opzionali)
  chunk_size?: number;
  chunk_overlap?: number;
  similarity_threshold?: number;
  max_results?: number;
  
  // Formati e Tipi (opzionali)
  allowed_formats?: string[];
  document_types?: string[];
  
  metadata?: Record<string, any>;
}

export interface UpdateInstanceData {
  name?: string;
  description?: string;
  ai_prompt?: string;
  ai_model?: string;
  ai_temperature?: number;
  ai_max_tokens?: number;
  ai_top_p?: number;
  ai_frequency_penalty?: number;
  ai_presence_penalty?: number;
  knowledge_base_ids?: string[];
  memories_enabled?: boolean;
  memories_config?: Record<string, any>;
  chunk_size?: number;
  chunk_overlap?: number;
  similarity_threshold?: number;
  max_results?: number;
  allowed_formats?: string[];
  document_types?: string[];
  is_active?: boolean;
  metadata?: Record<string, any>;
}

export interface ListInstancesOptions {
  owner_id?: string; // Changed from number to string to support UUID
  owner_type?: 'PROFESSIONAL' | 'CLIENT' | 'ADMIN';
  template_code?: string;
  is_active?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export class ContainerInstanceService {
  private db: DatabaseClient;

  constructor() {
    this.db = DatabaseClient.getInstance();
  }

  /**
   * Crea nuova istanza container da template
   */
  async create(data: CreateInstanceData): Promise<ContainerInstance> {
    try {
      // Verifica che il template esista
      const templateExists = await this.db.query(
        'SELECT code FROM smartdocs.container_categories WHERE code = $1 AND is_active = true',
        [data.template_code]
      );

      if (templateExists.rows.length === 0) {
        throw new Error(`Template '${data.template_code}' non trovato o non attivo`);
      }

      // Se ai_prompt non fornito, prendi quello del template
      let aiPrompt = data.ai_prompt;
      if (!aiPrompt) {
        const template = await this.db.query(
          'SELECT default_ai_prompt FROM smartdocs.container_categories WHERE code = $1',
          [data.template_code]
        );
        aiPrompt = template.rows[0]?.default_ai_prompt;
      }

      const query = `
        INSERT INTO smartdocs.container_instances (
          template_code,
          owner_id,
          owner_type,
          name,
          description,
          ai_prompt,
          ai_model,
          ai_temperature,
          ai_max_tokens,
          ai_top_p,
          ai_frequency_penalty,
          ai_presence_penalty,
          chunk_size,
          chunk_overlap,
          similarity_threshold,
          max_results,
          allowed_formats,
          document_types,
          metadata
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
        )
        RETURNING *
      `;

      const result = await this.db.query(query, [
        data.template_code,
        data.owner_id,
        data.owner_type,
        data.name,
        data.description || null,
        aiPrompt || null,
        data.ai_model || 'gpt-4',
        data.ai_temperature ?? 0.7,
        data.ai_max_tokens || 2000,
        data.ai_top_p ?? 1.0,
        data.ai_frequency_penalty ?? 0.0,
        data.ai_presence_penalty ?? 0.0,
        data.chunk_size || 1000,
        data.chunk_overlap || 200,
        data.similarity_threshold ?? 0.7,
        data.max_results || 5,
        JSON.stringify(data.allowed_formats || ['pdf', 'doc', 'docx', 'txt', 'xlsx', 'xls']),
        JSON.stringify(data.document_types || ['document', 'manual', 'report', 'contract', 'invoice']),
        JSON.stringify(data.metadata || {})
      ]);

      logger.info(`Container instance created: ${result.rows[0].id}`, {
        owner: `${data.owner_type}:${data.owner_id}`,
        template: data.template_code
      });

      return this.formatInstance(result.rows[0]);
    } catch (error) {
      logger.error('Error creating container instance:', error);
      throw error;
    }
  }

  /**
   * Lista istanze con filtri
   */
  async list(options: ListInstancesOptions = {}): Promise<ContainerInstance[]> {
    try {
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (options.owner_id !== undefined) {
        conditions.push(`owner_id = $${paramIndex++}`);
        params.push(options.owner_id);
      }

      if (options.owner_type) {
        conditions.push(`owner_type = $${paramIndex++}`);
        params.push(options.owner_type);
      }

      if (options.template_code) {
        conditions.push(`template_code = $${paramIndex++}`);
        params.push(options.template_code);
      }

      if (options.is_active !== undefined) {
        conditions.push(`is_active = $${paramIndex++}`);
        params.push(options.is_active);
      }

      if (options.search) {
        conditions.push(`(
          name ILIKE $${paramIndex} OR 
          description ILIKE $${paramIndex}
        )`);
        params.push(`%${options.search}%`);
        paramIndex++;
      }

      let query = 'SELECT * FROM smartdocs.container_instances';
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY created_at DESC';

      if (options.limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(options.limit);
      }

      if (options.offset) {
        query += ` OFFSET $${paramIndex++}`;
        params.push(options.offset);
      }

      const result = await this.db.query(query, params);
      return result.rows.map(row => this.formatInstance(row));
    } catch (error) {
      logger.error('Error listing container instances:', error);
      throw error;
    }
  }

  /**
   * Ottieni istanza per ID
   */
  async getById(id: string): Promise<ContainerInstance | null> {
    try {
      const query = 'SELECT * FROM smartdocs.container_instances WHERE id = $1';
      const result = await this.db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.formatInstance(result.rows[0]);
    } catch (error) {
      logger.error(`Error getting instance ${id}:`, error);
      return null;
    }
  }

  /**
   * Aggiorna istanza
   */
  async update(id: string, updates: UpdateInstanceData): Promise<ContainerInstance | null> {
    try {
      const fields: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (updates.name !== undefined) {
        fields.push(`name = $${paramIndex++}`);
        params.push(updates.name);
      }

      if (updates.description !== undefined) {
        fields.push(`description = $${paramIndex++}`);
        params.push(updates.description);
      }

      if (updates.ai_prompt !== undefined) {
        fields.push(`ai_prompt = $${paramIndex++}`);
        params.push(updates.ai_prompt);
      }

      if (updates.ai_model !== undefined) {
        fields.push(`ai_model = $${paramIndex++}`);
        params.push(updates.ai_model);
      }

      if (updates.ai_temperature !== undefined) {
        fields.push(`ai_temperature = $${paramIndex++}`);
        params.push(updates.ai_temperature);
      }

      if (updates.ai_max_tokens !== undefined) {
        fields.push(`ai_max_tokens = $${paramIndex++}`);
        params.push(updates.ai_max_tokens);
      }

      if (updates.ai_top_p !== undefined) {
        fields.push(`ai_top_p = $${paramIndex++}`);
        params.push(updates.ai_top_p);
      }

      if (updates.ai_frequency_penalty !== undefined) {
        fields.push(`ai_frequency_penalty = $${paramIndex++}`);
        params.push(updates.ai_frequency_penalty);
      }

      if (updates.ai_presence_penalty !== undefined) {
        fields.push(`ai_presence_penalty = $${paramIndex++}`);
        params.push(updates.ai_presence_penalty);
      }

      if (updates.knowledge_base_ids !== undefined) {
        fields.push(`knowledge_base_ids = $${paramIndex++}`);
        params.push(updates.knowledge_base_ids);
      }

      if (updates.memories_enabled !== undefined) {
        fields.push(`memories_enabled = $${paramIndex++}`);
        params.push(updates.memories_enabled);
      }

      if (updates.memories_config !== undefined) {
        fields.push(`memories_config = $${paramIndex++}`);
        params.push(JSON.stringify(updates.memories_config));
      }

      if (updates.chunk_size !== undefined) {
        fields.push(`chunk_size = $${paramIndex++}`);
        params.push(updates.chunk_size);
      }

      if (updates.chunk_overlap !== undefined) {
        fields.push(`chunk_overlap = $${paramIndex++}`);
        params.push(updates.chunk_overlap);
      }

      if (updates.similarity_threshold !== undefined) {
        fields.push(`similarity_threshold = $${paramIndex++}`);
        params.push(updates.similarity_threshold);
      }

      if (updates.max_results !== undefined) {
        fields.push(`max_results = $${paramIndex++}`);
        params.push(updates.max_results);
      }

      if (updates.allowed_formats !== undefined) {
        fields.push(`allowed_formats = $${paramIndex++}`);
        params.push(JSON.stringify(updates.allowed_formats));
      }

      if (updates.document_types !== undefined) {
        fields.push(`document_types = $${paramIndex++}`);
        params.push(JSON.stringify(updates.document_types));
      }

      if (updates.is_active !== undefined) {
        fields.push(`is_active = $${paramIndex++}`);
        params.push(updates.is_active);
      }

      if (updates.metadata !== undefined) {
        fields.push(`metadata = $${paramIndex++}`);
        params.push(JSON.stringify(updates.metadata));
      }

      if (fields.length === 0) {
        return this.getById(id);
      }

      params.push(id);

      const query = `
        UPDATE smartdocs.container_instances
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await this.db.query(query, params);

      if (result.rows.length === 0) {
        return null;
      }

      logger.info(`Container instance updated: ${id}`);
      return this.formatInstance(result.rows[0]);
    } catch (error) {
      logger.error('Error updating instance:', error);
      throw error;
    }
  }

  /**
   * Elimina istanza
   */
  async delete(id: string): Promise<boolean> {
    try {
      // Verifica se ci sono documenti associati
      const docsCheck = await this.db.query(
        'SELECT COUNT(*) as count FROM smartdocs.documents WHERE container_id = $1',
        [id]
      );

      const docCount = parseInt(docsCheck.rows[0].count);
      if (docCount > 0) {
        throw new Error(`Cannot delete instance: ${docCount} document(s) are associated. Delete documents first.`);
      }

      const query = 'DELETE FROM smartdocs.container_instances WHERE id = $1';
      await this.db.query(query, [id]);

      logger.info(`Container instance deleted: ${id}`);
      return true;
    } catch (error) {
      logger.error('Error deleting instance:', error);
      throw error;
    }
  }

  /**
   * Verifica ownership (per controlli permessi)
   */
  async verifyOwnership(id: string, userId: number, userType: 'PROFESSIONAL' | 'CLIENT' | 'ADMIN'): Promise<boolean> {
    try {
      const query = `
        SELECT id FROM smartdocs.container_instances 
        WHERE id = $1 AND owner_id = $2 AND owner_type = $3
      `;
      
      const result = await this.db.query(query, [id, userId, userType]);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error verifying ownership:', error);
      return false;
    }
  }

  /**
   * Ottieni statistiche istanza
   */
  async getStats(id: string): Promise<any> {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_documents,
          COUNT(*) FILTER (WHERE external_doc_type = 'document') as documents,
          COUNT(*) FILTER (WHERE external_doc_type = 'manual') as manuals,
          COUNT(*) FILTER (WHERE external_doc_type = 'report') as reports,
          0 as total_chunks
        FROM smartdocs.documents
        WHERE container_id = $1
      `;

      const result = await this.db.query(query, [id]);
      return result.rows[0] || {
        total_documents: 0,
        documents: 0,
        manuals: 0,
        reports: 0,
        total_chunks: 0
      };
    } catch (error) {
      logger.error('Error getting instance stats:', error);
      return null;
    }
  }

  /**
   * Formatta istanza (converte JSON da DB)
   */
  private formatInstance(row: any): ContainerInstance {
    return {
      ...row,
      allowed_formats: typeof row.allowed_formats === 'string' 
        ? JSON.parse(row.allowed_formats) 
        : row.allowed_formats,
      document_types: typeof row.document_types === 'string'
        ? JSON.parse(row.document_types)
        : row.document_types,
      knowledge_base_ids: row.knowledge_base_ids || [],
      memories_enabled: row.memories_enabled || false,
      memories_config: typeof row.memories_config === 'string'
        ? JSON.parse(row.memories_config)
        : row.memories_config || {},
      metadata: typeof row.metadata === 'string'
        ? JSON.parse(row.metadata)
        : row.metadata || {}
    };
  }
}
