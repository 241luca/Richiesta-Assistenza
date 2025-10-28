import { DatabaseClient } from '../database/client';
import { logger } from '../utils/logger';

export interface ContainerCategoryGroup {
  id: string;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateGroupData {
  code: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
}

export class ContainerCategoryGroupService {
  private db: DatabaseClient;

  constructor() {
    this.db = DatabaseClient.getInstance();
  }

  /**
   * Lista tutti i gruppi
   */
  async listAll(includeInactive = false): Promise<ContainerCategoryGroup[]> {
    try {
      let query = 'SELECT * FROM smartdocs.container_category_groups';
      
      if (!includeInactive) {
        query += ' WHERE is_active = true';
      }
      
      query += ' ORDER BY sort_order ASC, name ASC';

      const result = await this.db.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error listing container category groups:', error);
      throw error;
    }
  }

  /**
   * Ottieni gruppo per ID
   */
  async getById(id: string): Promise<ContainerCategoryGroup | null> {
    try {
      const query = 'SELECT * FROM smartdocs.container_category_groups WHERE id = $1';
      const result = await this.db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Error getting group ${id}:`, error);
      return null;
    }
  }

  /**
   * Ottieni gruppo per code
   */
  async getByCode(code: string): Promise<ContainerCategoryGroup | null> {
    try {
      const query = 'SELECT * FROM smartdocs.container_category_groups WHERE code = $1';
      const result = await this.db.query(query, [code]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Error getting group by code ${code}:`, error);
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
   * Crea nuovo gruppo
   */
  async create(data: CreateGroupData): Promise<ContainerCategoryGroup> {
    try {
      // Valida slug
      this.validateSlug(data.code);

      // Verifica se code esiste già
      const existing = await this.getByCode(data.code);
      if (existing) {
        throw new Error(`Group with code '${data.code}' already exists`);
      }

      const query = `
        INSERT INTO smartdocs.container_category_groups 
        (code, name, description, icon, color, sort_order, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const result = await this.db.query(query, [
        data.code,
        data.name,
        data.description || null,
        data.icon || null,
        data.color || null,
        data.sort_order || 999,
        data.is_active !== undefined ? data.is_active : true
      ]);

      logger.info(`Container category group created: ${data.code}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating group:', error);
      throw error;
    }
  }

  /**
   * Aggiorna gruppo
   */
  async update(id: string, updates: Partial<CreateGroupData>): Promise<ContainerCategoryGroup | null> {
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
          throw new Error(`Group with code '${updates.code}' already exists`);
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
        UPDATE smartdocs.container_category_groups
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await this.db.query(query, params);
      
      logger.info(`Container category group updated: ${id}`);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating group:', error);
      throw error;
    }
  }

  /**
   * Elimina gruppo
   */
  async delete(id: string): Promise<boolean> {
    try {
      // Verifica se il gruppo è usato in qualche categoria
      const checkQuery = `
        SELECT COUNT(*) as count 
        FROM smartdocs.container_categories 
        WHERE group_name = (SELECT code FROM smartdocs.container_category_groups WHERE id = $1)
      `;
      const checkResult = await this.db.query(checkQuery, [id]);
      
      if (parseInt(checkResult.rows[0].count) > 0) {
        throw new Error('Cannot delete group: it is used by existing categories');
      }

      const query = 'DELETE FROM smartdocs.container_category_groups WHERE id = $1';
      await this.db.query(query, [id]);
      
      logger.info(`Container category group deleted: ${id}`);
      return true;
    } catch (error) {
      logger.error('Error deleting group:', error);
      throw error;
    }
  }

  /**
   * Toggle attivo/disattivo
   */
  async toggleActive(id: string): Promise<ContainerCategoryGroup | null> {
    try {
      const query = `
        UPDATE smartdocs.container_category_groups
        SET is_active = NOT is_active
        WHERE id = $1
        RETURNING *
      `;

      const result = await this.db.query(query, [id]);
      
      logger.info(`Container category group toggled: ${id}`);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error toggling group:', error);
      throw error;
    }
  }

  /**
   * Conta categorie per gruppo
   */
  async getCategoryCount(groupCode: string): Promise<number> {
    try {
      const query = `
        SELECT COUNT(*) as count 
        FROM smartdocs.container_categories 
        WHERE group_name = $1
      `;
      const result = await this.db.query(query, [groupCode]);
      return parseInt(result.rows[0].count) || 0;
    } catch (error) {
      logger.error('Error counting categories:', error);
      return 0;
    }
  }
}
