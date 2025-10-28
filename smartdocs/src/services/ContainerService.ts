import { DatabaseClient } from '../database/client';
import { logger } from '../utils/logger';

interface Container {
  id: string;
  type: string;
  name: string;
  description?: string;
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

interface ListOptions {
  type?: string;
  search?: string;
  limit: number;
  offset: number;
}

export class ContainerService {
  private db: DatabaseClient;

  constructor() {
    this.db = DatabaseClient.getInstance();
  }

  async listContainers(options: ListOptions): Promise<Container[]> {
    const { type, search, limit, offset } = options;

    let query = 'SELECT * FROM smartdocs.containers WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (type) {
      query += ` AND metadata->>'category' = $${paramIndex++}`;
      params.push(type);
    }

    if (search) {
      query += ` AND (name ILIKE $${paramIndex++} OR description ILIKE $${paramIndex++})`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await this.db.query(query, params);
    
    // Estrai type e ai_prompt per compatibilità
    return result.rows.map(row => ({
      ...row,
      type: row.metadata?.category,
      ai_prompt: row.ai_prompt
    }));
  }

  async createContainer(data: Partial<Container>): Promise<Container> {
    const query = `
      INSERT INTO smartdocs.containers (
        name, description, metadata, ai_prompt,
        external_owner_id, external_owner_type
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    // Salva il tipo della categoria nei metadata
    const metadata = {
      ...data.metadata,
      category: data.type // Salva il codice categoria
    };

    const result = await this.db.query(query, [
      data.name,
      data.description || null,
      metadata,
      (data as any).ai_prompt || null,
      'system', // Owner di default
      'SYSTEM'  // Tipo owner di default
    ]);

    return {
      ...result.rows[0],
      type: metadata.category, // Restituisci il tipo per compatibilità
      ai_prompt: (data as any).ai_prompt
    };
  }

  async getContainerById(id: string): Promise<Container | null> {
    const query = 'SELECT * FROM smartdocs.containers WHERE id = $1';
    const result = await this.db.query(query, [id]);
    const row = result.rows[0];
    
    if (!row) return null;
    
    return {
      ...row,
      type: row.metadata?.category,
      ai_prompt: row.ai_prompt
    };
  }

  async updateContainer(id: string, updates: Partial<Container>): Promise<Container | null> {
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

    if (updates.metadata !== undefined) {
      fields.push(`metadata = $${paramIndex++}`);
      params.push(updates.metadata);
    }

    if ((updates as any).ai_prompt !== undefined) {
      fields.push(`ai_prompt = $${paramIndex++}`);
      params.push((updates as any).ai_prompt);
    }

    fields.push(`updated_at = NOW()`);

    if (fields.length === 1) {
      return this.getContainerById(id);
    }

    params.push(id);

    const query = `
      UPDATE smartdocs.containers
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.db.query(query, params);
    const row = result.rows[0];
    
    if (!row) return null;
    
    return {
      ...row,
      type: row.metadata?.category,
      ai_prompt: row.ai_prompt
    };
  }

  async deleteContainer(id: string): Promise<void> {
    const query = 'DELETE FROM smartdocs.containers WHERE id = $1';
    await this.db.query(query, [id]);
  }

  async getContainerStats(id: string): Promise<any> {
    const query = `
      SELECT 
        COUNT(d.id) as document_count,
        COUNT(e.id) as embedding_count,
        SUM(LENGTH(d.content)) as total_content_size
      FROM smartdocs.containers c
      LEFT JOIN smartdocs.documents d ON d.container_id = c.id
      LEFT JOIN smartdocs.embeddings e ON e.document_id = d.id
      WHERE c.id = $1
      GROUP BY c.id
    `;

    const result = await this.db.query(query, [id]);
    return result.rows[0] || {
      document_count: 0,
      embedding_count: 0,
      total_content_size: 0
    };
  }

  async clearContainerDocuments(id: string): Promise<{ deletedCount: number }> {
    // First, verify container exists
    const container = await this.getContainerById(id);
    if (!container) {
      throw new Error('Container not found');
    }

    // Get count before deletion
    const stats = await this.getContainerStats(id);
    const documentCount = stats.document_count || 0;

    // Delete all embeddings for documents in this container
    await this.db.query(`
      DELETE FROM smartdocs.embeddings
      WHERE document_id IN (
        SELECT id FROM smartdocs.documents WHERE container_id = $1
      )
    `, [id]);

    // Delete all chunk metadata
    await this.db.query(`
      DELETE FROM smartdocs.chunk_metadata
      WHERE document_id IN (
        SELECT id FROM smartdocs.documents WHERE container_id = $1
      )
    `, [id]);

    // Delete all chunk relationships
    await this.db.query(`
      DELETE FROM smartdocs.chunk_relationships
      WHERE chunk_id_1 IN (
        SELECT chunk_id FROM smartdocs.chunk_metadata WHERE document_id IN (
          SELECT id FROM smartdocs.documents WHERE container_id = $1
        )
      )
      OR chunk_id_2 IN (
        SELECT chunk_id FROM smartdocs.chunk_metadata WHERE document_id IN (
          SELECT id FROM smartdocs.documents WHERE container_id = $1
        )
      )
    `, [id]);

    // Delete all KG relationships
    await this.db.query(`
      DELETE FROM smartdocs.kg_relationships
      WHERE entity1_id IN (
        SELECT id FROM smartdocs.kg_entities WHERE document_id IN (
          SELECT id FROM smartdocs.documents WHERE container_id = $1
        )
      )
      OR entity2_id IN (
        SELECT id FROM smartdocs.kg_entities WHERE document_id IN (
          SELECT id FROM smartdocs.documents WHERE container_id = $1
        )
      )
    `, [id]);

    // Delete all KG entity attributes
    await this.db.query(`
      DELETE FROM smartdocs.kg_entity_attributes
      WHERE entity_id IN (
        SELECT id FROM smartdocs.kg_entities WHERE document_id IN (
          SELECT id FROM smartdocs.documents WHERE container_id = $1
        )
      )
    `, [id]);

    // Delete all KG entity mentions
    await this.db.query(`
      DELETE FROM smartdocs.kg_entity_mentions
      WHERE entity_id IN (
        SELECT id FROM smartdocs.kg_entities WHERE document_id IN (
          SELECT id FROM smartdocs.documents WHERE container_id = $1
        )
      )
    `, [id]);

    // Delete all knowledge graph entities
    await this.db.query(`
      DELETE FROM smartdocs.kg_entities
      WHERE document_id IN (
        SELECT id FROM smartdocs.documents WHERE container_id = $1
      )
    `, [id]);

    // Finally, delete all documents
    await this.db.query(`
      DELETE FROM smartdocs.documents WHERE container_id = $1
    `, [id]);

    logger.info('Container cleared', { containerId: id, deletedDocuments: documentCount });

    return { deletedCount: documentCount };
  }
}
