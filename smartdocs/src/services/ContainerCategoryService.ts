import { DatabaseClient } from '../database/client';
import { logger } from '../utils/logger';

export interface ContainerCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  group_name?: string;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCategoryData {
  code: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  group_name?: string;
  sort_order?: number;
  is_active?: boolean;
}

export class ContainerCategoryService {
  private db: DatabaseClient;

  constructor() {
    this.db = DatabaseClient.getInstance();
  }

  /**
   * Lista tutte le categorie
   */
  async listAll(includeInactive = false): Promise<ContainerCategory[]> {
    try {
      let query = 'SELECT * FROM smartdocs.container_categories';
      
      if (!includeInactive) {
        query += ' WHERE is_active = true';
      }
      
      query += ' ORDER BY group_name ASC, sort_order ASC, name ASC';

      const result = await this.db.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error listing container categories:', error);
      throw error;
    }
  }

  /**
   * Lista categorie raggruppate per group_name
   */
  async listGrouped(includeInactive = false): Promise<Record<string, ContainerCategory[]>> {
    try {
      const categories = await this.listAll(includeInactive);
      
      const grouped: Record<string, ContainerCategory[]> = {};
      
      categories.forEach(cat => {
        const group = cat.group_name || 'Altro';
        if (!grouped[group]) {
          grouped[group] = [];
        }
        grouped[group].push(cat);
      });
      
      return grouped;
    } catch (error) {
      logger.error('Error listing grouped categories:', error);
      throw error;
    }
  }

  /**
   * Ottieni categoria per ID
   */
  async getById(id: string): Promise<ContainerCategory | null> {
    try {
      const query = 'SELECT * FROM smartdocs.container_categories WHERE id = $1';
      const result = await this.db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Error getting category ${id}:`, error);
      return null;
    }
  }

  /**
   * Ottieni categoria per code
   */
  async getByCode(code: string): Promise<ContainerCategory | null> {
    try {
      const query = 'SELECT * FROM smartdocs.container_categories WHERE code = $1';
      const result = await this.db.query(query, [code]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Error getting category by code ${code}:`, error);
      return null;
    }
  }

  /**
   * Valida lo slug (code)
   */
  private validateSlug(slug: string): void {
    if (!slug || slug.trim() === '') {
      throw new Error('Code cannot be empty');
    }

    if (/\s/.test(slug)) {
      throw new Error('Code cannot contain spaces. Use hyphens (-) or underscores (_) instead.');
    }

    if (!/^[a-z0-9-_]+$/.test(slug)) {
      throw new Error('Code must contain only lowercase letters, numbers, hyphens (-) and underscores (_)');
    }
  }

  /**
   * Crea nuova categoria
   */
  async create(data: CreateCategoryData): Promise<ContainerCategory> {
    try {
      // Valida slug
      this.validateSlug(data.code);

      // Verifica se code esiste già
      const existing = await this.getByCode(data.code);
      if (existing) {
        throw new Error(`Category with code '${data.code}' already exists`);
      }

      const query = `
        INSERT INTO smartdocs.container_categories 
        (code, name, description, icon, color, group_name, sort_order, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const result = await this.db.query(query, [
        data.code,
        data.name,
        data.description || null,
        data.icon || null,
        data.color || null,
        data.group_name || 'Altro',
        data.sort_order || 999,
        data.is_active !== undefined ? data.is_active : true
      ]);

      logger.info(`Container category created: ${data.code}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating category:', error);
      throw error;
    }
  }

  /**
   * Aggiorna categoria
   */
  async update(id: string, updates: Partial<CreateCategoryData>): Promise<ContainerCategory | null> {
    try {
      const fields: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (updates.code !== undefined) {
        // Valida slug
        this.validateSlug(updates.code);

        // Verifica unicità code
        const existing = await this.getByCode(updates.code);
        if (existing && existing.id !== id) {
          throw new Error(`Category with code '${updates.code}' already exists`);
        }
        fields.push(`code = $${paramIndex++}`);
        params.push(updates.code);
      }

      if (updates.name !== undefined) {
        fields.push(`name = $${paramIndex++}`);
        params.push(updates.name);
      }

      if (updates.description !== undefined) {
        fields.push(`description = $${paramIndex++}`);
        params.push(updates.description);
      }

      if (updates.icon !== undefined) {
        fields.push(`icon = $${paramIndex++}`);
        params.push(updates.icon);
      }

      if (updates.color !== undefined) {
        fields.push(`color = $${paramIndex++}`);
        params.push(updates.color);
      }

      if (updates.group_name !== undefined) {
        fields.push(`group_name = $${paramIndex++}`);
        params.push(updates.group_name);
      }

      if (updates.sort_order !== undefined) {
        fields.push(`sort_order = $${paramIndex++}`);
        params.push(updates.sort_order);
      }

      if (updates.is_active !== undefined) {
        fields.push(`is_active = $${paramIndex++}`);
        params.push(updates.is_active);
      }

      if (fields.length === 0) {
        return this.getById(id);
      }

      params.push(id);

      const query = `
        UPDATE smartdocs.container_categories
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await this.db.query(query, params);
      
      logger.info(`Container category updated: ${id}`);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating category:', error);
      throw error;
    }
  }

  /**
   * Elimina categoria
   */
  async delete(id: string): Promise<boolean> {
    try {
      // Verifica se la categoria è usata in qualche container
      const checkQuery = 'SELECT COUNT(*) as count FROM smartdocs.containers WHERE type = (SELECT code FROM smartdocs.container_categories WHERE id = $1)';
      const checkResult = await this.db.query(checkQuery, [id]);
      
      if (parseInt(checkResult.rows[0].count) > 0) {
        throw new Error('Cannot delete category: it is used by existing containers');
      }

      const query = 'DELETE FROM smartdocs.container_categories WHERE id = $1';
      await this.db.query(query, [id]);
      
      logger.info(`Container category deleted: ${id}`);
      return true;
    } catch (error) {
      logger.error('Error deleting category:', error);
      throw error;
    }
  }

  /**
   * Toggle attivo/disattivo
   */
  async toggleActive(id: string): Promise<ContainerCategory | null> {
    try {
      const query = `
        UPDATE smartdocs.container_categories
        SET is_active = NOT is_active
        WHERE id = $1
        RETURNING *
      `;

      const result = await this.db.query(query, [id]);
      
      logger.info(`Container category toggled: ${id}`);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error toggling category:', error);
      throw error;
    }
  }
}
