import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface SystemSettingData {
  key: string;
  value: string;
  type?: string;
  label?: string;
  description?: string;
  category?: string;
  isEditable?: boolean;
  isPublic?: boolean;
  validation?: any;
  metadata?: any;
}

export class SystemSettingsService {
  /**
   * Get all system settings grouped by category
   */
  async getAllSettings() {
    try {
      const settings = await prisma.systemSetting.findMany({
        orderBy: [
          { Category: 'asc' },
          { key: 'asc' }
        ]
      });

      // Group by category
      const grouped = settings.reduce((acc, setting) => {
        if (!acc[setting.category]) {
          acc[setting.category] = [];
        }
        acc[setting.category].push(setting);
        return acc;
      }, {} as Record<string, typeof settings>);

      return grouped;
    } catch (error) {
      logger.error('Error getting all system settings:', error);
      throw new Error('Failed to fetch system settings');
    }
  }

  /**
   * Get settings by category
   */
  async getSettingsByCategory(Category: string) {
    try {
      const settings = await prisma.systemSetting.findMany({
        where: { category },
        orderBy: { key: 'asc' }
      });

      return settings;
    } catch (error) {
      logger.error(`Error getting settings for category '${category}':`, error);
      throw error;
    }
  }

  /**
   * Get single setting by key
   */
  async getSetting(key: string) {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: key.toUpperCase() }
      });

      return setting;
    } catch (error) {
      logger.error(`Error getting setting '${key}':`, error);
      throw error;
    }
  }

  /**
   * Get setting value (typed)
   */
  async getSettingValue<T = string>(key: string): Promise<T | null> {
    try {
      const setting = await this.getSetting(key);
      if (!setting) return null;

      // Parse value based on type
      switch (setting.type) {
        case 'boolean':
          return (setting.value === 'true') as T;
        case 'number':
          return parseFloat(setting.value) as T;
        case 'json':
          return JSON.parse(setting.value) as T;
        default:
          return setting.value as T;
      }
    } catch (error) {
      logger.error(`Error getting setting value '${key}':`, error);
      return null;
    }
  }

  /**
   * Get public settings (for frontend)
   */
  async getPublicSettings() {
    try {
      const settings = await prisma.systemSetting.findMany({
        where: { isPublic: true },
        select: {
          key: true,
          value: true,
          type: true,
          label: true,
          category: true
        }
      });

      // Convert to key-value object with typed values
      const result = {} as Record<string, any>;
      settings.forEach(setting => {
        let value: any = setting.value;
        
        switch (setting.type) {
          case 'boolean':
            value = setting.value === 'true';
            break;
          case 'number':
            value = parseFloat(setting.value);
            break;
          case 'json':
            value = JSON.parse(setting.value);
            break;
        }
        
        result[setting.key] = value;
      });

      return result;
    } catch (error) {
      logger.error('Error getting public settings:', error);
      throw error;
    }
  }

  /**
   * Create or update setting
   */
  async setSetting(key: string, value: string, options?: Partial<SystemSettingData>) {
    try {
      const setting = await prisma.systemSetting.upsert({
        where: { key: key.toUpperCase() },
        update: {
          value: value,
          label: options?.label,
          description: options?.description,
          Category: options?.category,
          type: options?.type,
          isEditable: options?.isEditable,
          isPublic: options?.isPublic,
          validation: options?.validation,
          metadata: options?.metadata,
          updatedAt: new Date()
        },
        create: {
          key: key.toUpperCase(),
          value: value,
          type: options?.type || 'string',
          label: options?.label || key,
          description: options?.description,
          Category: options?.category || 'general',
          isEditable: options?.isEditable ?? true,
          isPublic: options?.isPublic ?? false,
          validation: options?.validation,
          metadata: options?.metadata
        }
      });

      logger.info(`Setting '${key}' updated successfully`);
      return setting;
    } catch (error) {
      logger.error(`Error setting '${key}':`, error);
      throw error;
    }
  }

  /**
   * Update setting value with validation
   */
  async updateSetting(key: string, value: string) {
    try {
      const existing = await this.getSetting(key);
      if (!existing) {
        throw new Error(`Setting '${key}' not found`);
      }

      if (!existing.isEditable) {
        throw new Error(`Setting '${key}' is not editable`);
      }

      // Validate value if validation rules exist
      if (existing.validation) {
        this.validateSettingValue(value, existing.validation, existing.type);
      }

      const updated = await prisma.systemSetting.update({
        where: { key: key.toUpperCase() },
        data: {
          value: value,
          updatedAt: new Date()
        }
      });

      logger.info(`Setting '${key}' updated to '${value}'`);
      return updated;
    } catch (error) {
      logger.error(`Error updating setting '${key}':`, error);
      throw error;
    }
  }

  /**
   * Delete setting
   */
  async deleteSetting(key: string) {
    try {
      const setting = await this.getSetting(key);
      if (!setting) {
        throw new Error(`Setting '${key}' not found`);
      }

      if (!setting.isEditable) {
        throw new Error(`Setting '${key}' cannot be deleted`);
      }

      await prisma.systemSetting.delete({
        where: { key: key.toUpperCase() }
      });

      logger.info(`Setting '${key}' deleted successfully`);
    } catch (error) {
      logger.error(`Error deleting setting '${key}':`, error);
      throw error;
    }
  }

  /**
   * Get footer configuration
   */
  async getFooterConfig() {
    try {
      const footerSettings = await this.getSettingsByCategory('footer');
      const brandingSettings = await this.getSettingsByCategory('branding');
      
      const config = {} as Record<string, string>;
      [...footerSettings, ...brandingSettings].forEach(setting => {
        config[setting.key] = setting.value;
      });

      return {
        text: config.FOOTER_TEXT || '© 2025 Sistema Richiesta Assistenza',
        version: config.FOOTER_VERSION || 'v2.0',
        edition: config.FOOTER_EDITION || 'Enterprise Edition',
        appName: config.APP_NAME || 'Richiesta Assistenza',
        companyName: config.COMPANY_NAME || 'LM Tecnologie'
      };
    } catch (error) {
      logger.error('Error getting footer config:', error);
      throw error;
    }
  }

  /**
   * Validate setting value against validation rules
   */
  private validateSettingValue(value: string, validation: any, type: string) {
    if (type === 'number') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        throw new Error('Value must be a number');
      }
      if (validation.min !== undefined && numValue < validation.min) {
        throw new Error(`Value must be >= ${validation.min}`);
      }
      if (validation.max !== undefined && numValue > validation.max) {
        throw new Error(`Value must be <= ${validation.max}`);
      }
    }

    if (type === 'string') {
      if (validation.minLength && value.length < validation.minLength) {
        throw new Error(`Value must be at least ${validation.minLength} characters`);
      }
      if (validation.maxLength && value.length > validation.maxLength) {
        throw new Error(`Value must be at most ${validation.maxLength} characters`);
      }
      if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
        throw new Error('Value does not match required pattern');
      }
    }

    if (type === 'boolean' && !['true', 'false'].includes(value)) {
      throw new Error('Value must be true or false');
    }
  }
}

export const systemSettingsService = new SystemSettingsService();
