import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export class DocumentConfigService {
  /**
   * Ottieni tutte le configurazioni di sistema
   */
  async getAllConfigs(category?: string) {
    try {
      const where: any = {};
      
      if (category) {
        where.category = category;
      }
      
      where.isVisible = true; // Solo configurazioni visibili

      const configs = await prisma.documentSystemConfig.findMany({
        where,
        orderBy: [
          { category: 'asc' },
          { key: 'asc' }
        ]
      });

      // Converti il valore JSON nel tipo corretto
      return configs.map(config => ({
        ...config,
        value: this.parseConfigValue(config.value, config.dataType)
      }));
    } catch (error) {
      logger.error('Error fetching system configs:', error);
      throw error;
    }
  }

  /**
   * Ottieni una configurazione specifica per chiave
   */
  async getConfigByKey(key: string) {
    try {
      const config = await prisma.documentSystemConfig.findUnique({
        where: { key }
      });

      if (!config) {
        return null;
      }

      return {
        ...config,
        value: this.parseConfigValue(config.value, config.dataType)
      };
    } catch (error) {
      logger.error('Error fetching config by key:', error);
      throw error;
    }
  }

  /**
   * Ottieni configurazioni per categoria
   */
  async getConfigsByCategory(category: string) {
    try {
      const configs = await prisma.documentSystemConfig.findMany({
        where: { 
          category,
          isVisible: true 
        },
        orderBy: { key: 'asc' }
      });

      return configs.map(config => ({
        ...config,
        value: this.parseConfigValue(config.value, config.dataType)
      }));
    } catch (error) {
      logger.error('Error fetching configs by category:', error);
      throw error;
    }
  }

  /**
   * Crea o aggiorna una configurazione
   */
  async upsertConfig(key: string, data: any, userId: string) {
    try {
      // Prepara il valore come JSON
      const jsonValue = this.formatConfigValue(data.value, data.dataType);

      const config = await prisma.documentSystemConfig.upsert({
        where: { key },
        create: {
          key,
          value: jsonValue,
          category: data.category || 'general',
          description: data.description,
          dataType: data.dataType || 'string',
          isEditable: data.isEditable ?? true,
          isVisible: data.isVisible ?? true,
          updatedBy: userId
        },
        update: {
          value: jsonValue,
          category: data.category,
          description: data.description,
          dataType: data.dataType,
          isEditable: data.isEditable,
          isVisible: data.isVisible,
          updatedBy: userId,
          updatedAt: new Date()
        }
      });

      return {
        ...config,
        value: this.parseConfigValue(config.value, config.dataType)
      };
    } catch (error) {
      logger.error('Error upserting config:', error);
      throw error;
    }
  }

  /**
   * Aggiorna una configurazione esistente
   */
  async updateConfig(key: string, value: any, userId: string) {
    try {
      const existing = await this.getConfigByKey(key);
      
      if (!existing) {
        throw new Error('Configuration not found');
      }

      if (!existing.isEditable) {
        throw new Error('This configuration is not editable');
      }

      const jsonValue = this.formatConfigValue(value, existing.dataType);

      const updated = await prisma.documentSystemConfig.update({
        where: { key },
        data: {
          value: jsonValue,
          updatedBy: userId,
          updatedAt: new Date()
        }
      });

      // Log audit
      await this.logAudit('UPDATE', key, existing.value, jsonValue, userId);

      return {
        ...updated,
        value: this.parseConfigValue(updated.value, updated.dataType)
      };
    } catch (error) {
      logger.error('Error updating config:', error);
      throw error;
    }
  }

  /**
   * Elimina una configurazione
   */
  async deleteConfig(key: string, userId: string) {
    try {
      const config = await this.getConfigByKey(key);
      
      if (!config) {
        throw new Error('Configuration not found');
      }

      if (!config.isEditable) {
        throw new Error('This configuration cannot be deleted');
      }

      await prisma.documentSystemConfig.delete({
        where: { key }
      });

      // Log audit
      await this.logAudit('DELETE', key, config.value, null, userId);

      return { success: true, message: 'Configuration deleted successfully' };
    } catch (error) {
      logger.error('Error deleting config:', error);
      throw error;
    }
  }

  /**
   * Inizializza le configurazioni di default
   */
  async initializeDefaultConfigs(userId: string) {
    try {
      const defaultConfigs = [
        {
          key: 'enable_auto_approval',
          value: false,
          category: 'workflow',
          description: 'Abilita approvazione automatica documenti',
          dataType: 'boolean'
        },
        {
          key: 'auto_approval_days',
          value: 7,
          category: 'workflow',
          description: 'Giorni per approvazione automatica',
          dataType: 'number'
        },
        {
          key: 'enable_versioning',
          value: true,
          category: 'general',
          description: 'Abilita versionamento documenti',
          dataType: 'boolean'
        },
        {
          key: 'max_versions_per_document',
          value: 10,
          category: 'general',
          description: 'Numero massimo versioni per documento',
          dataType: 'number'
        },
        {
          key: 'require_approval_comment',
          value: true,
          category: 'workflow',
          description: 'Richiedi commento per approvazione',
          dataType: 'boolean'
        },
        {
          key: 'notification_days_before_expiry',
          value: 30,
          category: 'notifications',
          description: 'Giorni prima della scadenza per notifica',
          dataType: 'number'
        },
        {
          key: 'enable_digital_signature',
          value: false,
          category: 'general',
          description: 'Abilita firma digitale',
          dataType: 'boolean'
        },
        {
          key: 'default_document_language',
          value: 'it',
          category: 'general',
          description: 'Lingua di default documenti',
          dataType: 'string'
        },
        {
          key: 'show_version_comparison',
          value: true,
          category: 'ui',
          description: 'Mostra confronto versioni',
          dataType: 'boolean'
        },
        {
          key: 'allow_bulk_operations',
          value: true,
          category: 'ui',
          description: 'Permetti operazioni bulk',
          dataType: 'boolean'
        }
      ];

      const created = [];
      for (const configData of defaultConfigs) {
        const existing = await this.getConfigByKey(configData.key);
        if (!existing) {
          const newConfig = await this.upsertConfig(
            configData.key,
            configData,
            userId
          );
          created.push(newConfig);
        }
      }

      return {
        message: `Initialized ${created.length} default configurations`,
        created
      };
    } catch (error) {
      logger.error('Error initializing default configs:', error);
      throw error;
    }
  }

  /**
   * Parse del valore della configurazione in base al tipo
   */
  private parseConfigValue(value: any, dataType: string): any {
    try {
      if (value === null || value === undefined) return null;

      switch (dataType) {
        case 'boolean':
          if (typeof value === 'boolean') return value;
          if (typeof value === 'string') return value === 'true';
          return Boolean(value);
          
        case 'number':
          if (typeof value === 'number') return value;
          return Number(value);
          
        case 'string':
          if (typeof value === 'string') return value;
          return String(value);
          
        case 'json':
          if (typeof value === 'object') return value;
          if (typeof value === 'string') return JSON.parse(value);
          return value;
          
        default:
          return value;
      }
    } catch (error) {
      logger.error(`Error parsing config value for type ${dataType}:`, error);
      return value;
    }
  }

  /**
   * Formatta il valore per il salvataggio nel database
   */
  private formatConfigValue(value: any, dataType: string): any {
    try {
      switch (dataType) {
        case 'boolean':
          return Boolean(value);
          
        case 'number':
          return Number(value);
          
        case 'string':
          return String(value);
          
        case 'json':
          return typeof value === 'object' ? value : JSON.parse(value);
          
        default:
          return value;
      }
    } catch (error) {
      logger.error(`Error formatting config value for type ${dataType}:`, error);
      return value;
    }
  }

  /**
   * Log delle modifiche per audit
   */
  private async logAudit(
    action: string,
    entityId: string,
    oldValues: any,
    newValues: any,
    userId: string
  ) {
    try {
      await prisma.documentConfigAudit.create({
        data: {
          entityType: 'DocumentSystemConfig',
          entityId,
          action,
          oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
          newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
          userId,
          timestamp: new Date()
        }
      });
    } catch (error) {
      logger.error('Error logging audit:', error);
      // Non propagare l'errore, il log è secondario
    }
  }

  /**
   * Ottieni statistiche delle configurazioni
   */
  async getConfigStatistics() {
    try {
      const configs = await prisma.documentSystemConfig.findMany();
      
      const byCategory = await prisma.documentSystemConfig.groupBy({
        by: ['category'],
        _count: {
          id: true
        }
      });

      const byType = await prisma.documentSystemConfig.groupBy({
        by: ['dataType'],
        _count: {
          id: true
        }
      });

      return {
        total: configs.length,
        editable: configs.filter(c => c.isEditable).length,
        nonEditable: configs.filter(c => !c.isEditable).length,
        visible: configs.filter(c => c.isVisible).length,
        hidden: configs.filter(c => !c.isVisible).length,
        byCategory: byCategory.map(c => ({
          category: c.category,
          count: c._count.id
        })),
        byType: byType.map(t => ({
          type: t.dataType,
          count: t._count.id
        }))
      };
    } catch (error) {
      logger.error('Error getting config statistics:', error);
      throw error;
    }
  }
}

export const documentConfigService = new DocumentConfigService();
