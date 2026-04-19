import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Service for managing SmartDocs sync configuration
 */
export class SmartDocsConfigService {
  /**
   * Get global sync configuration
   */
  async getGlobalConfig() {
    try {
      const config = await prisma.$queryRaw`
        SELECT * FROM smartdocs.sync_config LIMIT 1
      `;
      return Array.isArray(config) ? config[0] : null;
    } catch (error: unknown) {
      logger.error('[SmartDocsConfig] Failed to get global config', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Update global sync configuration
   */
  async updateGlobalConfig(data: {
    enabled?: boolean;
    default_container_id?: string;
    sync_requests?: boolean;
    sync_chats?: boolean;
    sync_quotes?: boolean;
    sync_reports?: boolean;
    sync_profiles?: boolean;
    sync_forms?: boolean;
    sync_payments?: boolean;
    chunk_size?: number;
    chunk_overlap?: number;
    auto_sync_delay_ms?: number;
    batch_sync_enabled?: boolean;
    batch_sync_size?: number;
  }) {
    try {
      const setClauses: any[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          setClauses.push(`${key} = $${paramIndex++}`);
          values.push(value);
        }
      });

      if (setClauses.length === 0) {
        throw new Error('No fields to update');
      }

      const query = `
        UPDATE smartdocs.sync_config 
        SET ${setClauses.join(', ')}, updated_at = NOW()
        WHERE id = 1
        RETURNING *
      `;

      const result = await prisma.$queryRawUnsafe(query, ...values);
      return Array.isArray(result) ? result[0] : null;
    } catch (error: unknown) {
      logger.error('[SmartDocsConfig] Failed to update global config', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Get all category exclusions
   */
  async getCategoryExclusions() {
    try {
      const exclusions = await prisma.$queryRaw`
        SELECT * FROM smartdocs.v_category_exclusions
        ORDER BY category_id, subcategory_id
      `;
      return exclusions;
    } catch (error: unknown) {
      logger.error('[SmartDocsConfig] Failed to get category exclusions', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Add category exclusion
   */
  async addCategoryExclusion(data: {
    category_id?: number;
    subcategory_id?: number;
    reason?: string;
    created_by?: number;
  }) {
    try {
      const result = await prisma.$queryRaw`
        INSERT INTO smartdocs.category_sync_exclusions 
          (category_id, subcategory_id, excluded, reason, created_by)
        VALUES (${data.category_id || null}, ${data.subcategory_id || null}, true, ${data.reason || null}, ${data.created_by || null})
        ON CONFLICT (category_id, subcategory_id) 
        DO UPDATE SET excluded = true, reason = ${data.reason || null}, updated_at = NOW()
        RETURNING *
      `;
      return Array.isArray(result) ? result[0] : null;
    } catch (error: unknown) {
      logger.error('[SmartDocsConfig] Failed to add category exclusion', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Remove category exclusion
   */
  async removeCategoryExclusion(id: number) {
    try {
      await prisma.$queryRaw`
        DELETE FROM smartdocs.category_sync_exclusions WHERE id = ${id}
      `;
      return { success: true };
    } catch (error: unknown) {
      logger.error('[SmartDocsConfig] Failed to remove category exclusion', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Get all user sync overrides
   */
  async getUserOverrides() {
    try {
      const overrides = await prisma.$queryRaw`
        SELECT * FROM smartdocs.v_user_sync_overrides
        ORDER BY user_id
      `;
      return overrides;
    } catch (error: unknown) {
      logger.error('[SmartDocsConfig] Failed to get user overrides', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Get user override
   */
  async getUserOverride(userId: number, userType: 'client' | 'professional') {
    try {
      const result = await prisma.$queryRaw`
        SELECT * FROM smartdocs.user_sync_overrides
        WHERE user_id = ${userId} AND user_type = ${userType}
      `;
      return Array.isArray(result) ? result[0] : null;
    } catch (error: unknown) {
      logger.error('[SmartDocsConfig] Failed to get user override', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Set user override
   */
  async setUserOverride(data: {
    user_id: number;
    user_type: 'client' | 'professional';
    enabled?: boolean;
    custom_container_id?: string;
    sync_requests?: boolean;
    sync_chats?: boolean;
    sync_quotes?: boolean;
    sync_reports?: boolean;
    sync_profiles?: boolean;
    sync_forms?: boolean;
    sync_payments?: boolean;
    notes?: string;
    created_by?: number;
  }) {
    try {
      const fields = [];
      const values = [];
      
      fields.push('user_id', 'user_type');
      values.push(data.user_id, data.user_type);

      if (data.enabled !== undefined) {
        fields.push('enabled');
        values.push(data.enabled);
      }
      if (data.custom_container_id !== undefined) {
        fields.push('custom_container_id');
        values.push(data.custom_container_id);
      }
      if (data.sync_requests !== undefined) {
        fields.push('sync_requests');
        values.push(data.sync_requests);
      }
      if (data.sync_chats !== undefined) {
        fields.push('sync_chats');
        values.push(data.sync_chats);
      }
      if (data.sync_quotes !== undefined) {
        fields.push('sync_quotes');
        values.push(data.sync_quotes);
      }
      if (data.sync_reports !== undefined) {
        fields.push('sync_reports');
        values.push(data.sync_reports);
      }
      if (data.sync_profiles !== undefined) {
        fields.push('sync_profiles');
        values.push(data.sync_profiles);
      }
      if (data.sync_forms !== undefined) {
        fields.push('sync_forms');
        values.push(data.sync_forms);
      }
      if (data.sync_payments !== undefined) {
        fields.push('sync_payments');
        values.push(data.sync_payments);
      }
      if (data.notes !== undefined) {
        fields.push('notes');
        values.push(data.notes);
      }
      if (data.created_by !== undefined) {
        fields.push('created_by');
        values.push(data.created_by);
      }

      const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
      const updateFields = fields.slice(2).map(f => `${f} = EXCLUDED.${f}`).join(', ');

      const query = `
        INSERT INTO smartdocs.user_sync_overrides (${fields.join(', ')})
        VALUES (${placeholders})
        ON CONFLICT (user_id, user_type) 
        DO UPDATE SET ${updateFields}, updated_at = NOW()
        RETURNING *
      `;

      const result = await prisma.$queryRawUnsafe(query, ...values);
      return Array.isArray(result) ? result[0] : null;
    } catch (error: unknown) {
      logger.error('[SmartDocsConfig] Failed to set user override', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Delete user override
   */
  async deleteUserOverride(userId: number, userType: 'client' | 'professional') {
    try {
      await prisma.$queryRaw`
        DELETE FROM smartdocs.user_sync_overrides
        WHERE user_id = ${userId} AND user_type = ${userType}
      `;
      return { success: true };
    } catch (error: unknown) {
      logger.error('[SmartDocsConfig] Failed to delete user override', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Get entity exclusions
   */
  async getEntityExclusions(entityType?: string) {
    try {
      const query = entityType
        ? `SELECT * FROM smartdocs.entity_sync_exclusions WHERE entity_type = $1 ORDER BY created_at DESC`
        : `SELECT * FROM smartdocs.entity_sync_exclusions ORDER BY created_at DESC`;
      
      const result = entityType
        ? await prisma.$queryRawUnsafe(query, entityType)
        : await prisma.$queryRaw`SELECT * FROM smartdocs.entity_sync_exclusions ORDER BY created_at DESC`;
      
      return result;
    } catch (error: unknown) {
      logger.error('[SmartDocsConfig] Failed to get entity exclusions', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Add entity exclusion
   */
  async addEntityExclusion(data: {
    entity_type: string;
    entity_id: string;
    reason?: string;
    created_by?: number;
  }) {
    try {
      const result = await prisma.$queryRaw`
        INSERT INTO smartdocs.entity_sync_exclusions 
          (entity_type, entity_id, excluded, reason, created_by)
        VALUES (${data.entity_type}, ${data.entity_id}, true, ${data.reason || null}, ${data.created_by || null})
        ON CONFLICT (entity_type, entity_id)
        DO UPDATE SET excluded = true, reason = ${data.reason || null}
        RETURNING *
      `;
      return Array.isArray(result) ? result[0] : null;
    } catch (error: unknown) {
      logger.error('[SmartDocsConfig] Failed to add entity exclusion', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Remove entity exclusion
   */
  async removeEntityExclusion(id: number) {
    try {
      await prisma.$queryRaw`
        DELETE FROM smartdocs.entity_sync_exclusions WHERE id = ${id}
      `;
      return { success: true };
    } catch (error: unknown) {
      logger.error('[SmartDocsConfig] Failed to remove entity exclusion', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Check if sync is enabled for a request (using DB function)
   */
  async isSyncEnabledForRequest(params: {
    request_id: number;
    category_id?: number;
    subcategory_id?: number;
    user_id?: number;
    user_type?: 'client' | 'professional';
  }): Promise<boolean> {
    try {
      const result = await prisma.$queryRaw<Array<{ is_sync_enabled_for_request: boolean }>>`
        SELECT smartdocs.is_sync_enabled_for_request(
          ${params.request_id},
          ${params.category_id || null},
          ${params.subcategory_id || null},
          ${params.user_id || null},
          ${params.user_type || 'client'}
        ) as is_sync_enabled_for_request
      `;
      return result[0]?.is_sync_enabled_for_request || false;
    } catch (error: unknown) {
      logger.error('[SmartDocsConfig] Failed to check sync enabled', error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  /**
   * Get effective sync config for user (using DB function)
   */
  async getUserSyncConfig(userId: number | string, userType: 'client' | 'professional') {
    try {
      const result = await prisma.$queryRaw`
        SELECT * FROM smartdocs.get_user_sync_config(${String(userId)}, ${userType})
      `;
      return Array.isArray(result) ? result[0] : null;
    } catch (error: unknown) {
      logger.error('[SmartDocsConfig] Failed to get user sync config', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
}

export const smartDocsConfigService = new SmartDocsConfigService();
export default smartDocsConfigService;
