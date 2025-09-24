import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export class DocumentTypeService {
  /**
   * Ottieni tutti i tipi di documento
   */
  async getAllTypes(filters?: any) {
    try {
      const where: any = {};
      
      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive === 'true' || filters.isActive === true;
      }
      
      if (filters?.category) {
        where.category = filters.category;
      }
      
      if (filters?.isRequired !== undefined) {
        where.isRequired = filters.isRequired === 'true' || filters.isRequired === true;
      }

      const types = await prisma.documentTypeConfig.findMany({
        where,
        orderBy: [
          { sortOrder: 'asc' },
          { displayName: 'asc' }
        ]
      });

      return types;
    } catch (error) {
      logger.error('Error fetching document types:', error);
      throw error;
    }
  }

  /**
   * Ottieni statistiche sui tipi di documento
   */
  async getStatistics() {
    try {
      const [total, active, inactive, required, system] = await Promise.all([
        prisma.documentTypeConfig.count(),
        prisma.documentTypeConfig.count({ where: { isActive: true } }),
        prisma.documentTypeConfig.count({ where: { isActive: false } }),
        prisma.documentTypeConfig.count({ where: { isRequired: true } }),
        prisma.documentTypeConfig.count({ where: { isSystem: true } })
      ]);

      return {
        total,
        active,
        inactive,
        required,
        system,
        custom: total - system
      };
    } catch (error) {
      logger.error('Error fetching document type statistics:', error);
      throw error;
    }
  }

  /**
   * Alias per getStatistics per compatibilità
   */
  async getTypeStatistics() {
    return this.getStatistics();
  }

  /**
   * Ottieni un tipo di documento per ID
   */
  async getTypeById(id: string) {
    try {
      const type = await prisma.documentTypeConfig.findUnique({
        where: { id }
      });

      if (!type) {
        throw new Error('Document type not found');
      }

      return type;
    } catch (error) {
      logger.error('Error fetching document type:', error);
      throw error;
    }
  }

  /**
   * Ottieni un tipo di documento per codice
   */
  async getTypeByCode(code: string) {
    try {
      const type = await prisma.documentTypeConfig.findUnique({
        where: { code }
      });

      return type;
    } catch (error) {
      logger.error('Error fetching document type by code:', error);
      throw error;
    }
  }

  /**
   * Crea un nuovo tipo di documento
   */
  async createType(data: any, userId: string) {
    try {
      // Verifica se il codice esiste già
      const existing = await this.getTypeByCode(data.code);
      if (existing) {
        throw new Error('Document type with this code already exists');
      }

      // Prepara i dati
      const typeData: any = {
        code: data.code,
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        icon: data.icon,
        color: data.color,
        category: data.category,
        sortOrder: data.sortOrder || 0,
        isSystem: data.isSystem || false,
        isActive: data.isActive ?? true,
        isRequired: data.isRequired || false,
        requiresApproval: data.requiresApproval ?? true,
        requiresSignature: data.requiresSignature || false,
        notifyOnCreate: data.notifyOnCreate ?? true,
        notifyOnUpdate: data.notifyOnUpdate ?? true,
        notifyOnExpiry: data.notifyOnExpiry ?? true,
        expiryDays: data.expiryDays,
        defaultTemplate: data.defaultTemplate,
        variables: data.variables,
        workflowSteps: data.workflowSteps,
        approverRoles: data.approverRoles || ['SUPER_ADMIN'],
        publisherRoles: data.publisherRoles || ['SUPER_ADMIN', 'ADMIN'],
        metadata: data.metadata,
        createdBy: userId
      };

      const newType = await prisma.documentTypeConfig.create({
        data: typeData
      });

      // Log audit
      await this.logAudit('CREATE', newType.id, null, newType, userId);

      return newType;
    } catch (error: any) {
      logger.error('Error creating document type:', error);
      throw error;
    }
  }

  /**
   * Aggiorna un tipo di documento
   */
  async updateType(id: string, data: any, userId: string) {
    try {
      // Ottieni il tipo esistente
      const existingType = await this.getTypeById(id);

      // Se sta cambiando il codice, verifica che non esista già
      if (data.code && data.code !== existingType.code) {
        const duplicate = await this.getTypeByCode(data.code);
        if (duplicate) {
          throw new Error('Document type with this code already exists');
        }
      }

      // Non permettere modifiche ai tipi di sistema per alcuni campi
      if (existingType.isSystem) {
        delete data.code;
        delete data.isSystem;
      }

      // Prepara i dati per l'aggiornamento
      const updateData: any = {};
      
      // Solo includi i campi che sono stati passati
      if (data.code !== undefined) updateData.code = data.code;
      if (data.name !== undefined) updateData.name = data.name;
      if (data.displayName !== undefined) updateData.displayName = data.displayName;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.icon !== undefined) updateData.icon = data.icon;
      if (data.color !== undefined) updateData.color = data.color;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.isRequired !== undefined) updateData.isRequired = data.isRequired;
      if (data.requiresApproval !== undefined) updateData.requiresApproval = data.requiresApproval;
      if (data.requiresSignature !== undefined) updateData.requiresSignature = data.requiresSignature;
      if (data.notifyOnCreate !== undefined) updateData.notifyOnCreate = data.notifyOnCreate;
      if (data.notifyOnUpdate !== undefined) updateData.notifyOnUpdate = data.notifyOnUpdate;
      if (data.notifyOnExpiry !== undefined) updateData.notifyOnExpiry = data.notifyOnExpiry;
      if (data.expiryDays !== undefined) updateData.expiryDays = data.expiryDays;
      if (data.defaultTemplate !== undefined) updateData.defaultTemplate = data.defaultTemplate;
      if (data.variables !== undefined) updateData.variables = data.variables;
      if (data.workflowSteps !== undefined) updateData.workflowSteps = data.workflowSteps;
      if (data.approverRoles !== undefined) updateData.approverRoles = data.approverRoles;
      if (data.publisherRoles !== undefined) updateData.publisherRoles = data.publisherRoles;
      if (data.metadata !== undefined) updateData.metadata = data.metadata;

      const updatedType = await prisma.documentTypeConfig.update({
        where: { id },
        data: updateData
      });

      // Log audit
      await this.logAudit('UPDATE', id, existingType, updatedType, userId);

      return updatedType;
    } catch (error) {
      logger.error('Error updating document type:', error);
      throw error;
    }
  }

  /**
   * Cambia lo stato di un tipo di documento
   */
  async toggleTypeStatus(id: string, isActive: boolean, userId: string) {
    try {
      const existingType = await this.getTypeById(id);

      const updatedType = await prisma.documentTypeConfig.update({
        where: { id },
        data: { isActive }
      });

      // Log audit
      await this.logAudit(
        isActive ? 'ACTIVATE' : 'DEACTIVATE',
        id,
        existingType,
        updatedType,
        userId
      );

      return updatedType;
    } catch (error) {
      logger.error('Error toggling document type status:', error);
      throw error;
    }
  }

  /**
   * Elimina un tipo di documento
   */
  async deleteType(id: string, userId: string) {
    try {
      const existingType = await this.getTypeById(id);

      // Non permettere l'eliminazione di tipi di sistema
      if (existingType.isSystem) {
        throw new Error('Cannot delete system document types');
      }

      // Verifica se ci sono documenti legali collegati
      const linkedDocuments = await prisma.legalDocument.count({
        where: { typeConfigId: id }
      });

      if (linkedDocuments > 0) {
        throw new Error(`Cannot delete document type. ${linkedDocuments} documents are using this type`);
      }

      // Elimina il tipo
      await prisma.documentTypeConfig.delete({
        where: { id }
      });

      // Log audit
      await this.logAudit('DELETE', id, existingType, null, userId);

      return {
        success: true,
        message: 'Document type deleted successfully'
      };
    } catch (error: any) {
      logger.error('Error deleting document type:', error);
      throw error;
    }
  }

  /**
   * Log audit per le modifiche
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
          entityType: 'DocumentTypeConfig',
          entityId,
          action,
          oldValues: oldValues ? oldValues : undefined,
          newValues: newValues ? newValues : undefined,
          userId
        }
      });
    } catch (error) {
      logger.error('Error logging audit:', error);
      // Non lanciare errore per non bloccare l'operazione principale
    }
  }

  /**
   * Inizializza i tipi di documento di default
   */
  async initializeDefaultTypes(userId: string) {
    try {
      const defaultTypes = [
        {
          code: 'PRIVACY_POLICY',
          name: 'Privacy Policy',
          displayName: 'Informativa sulla Privacy',
          description: 'Informativa sul trattamento dei dati personali (GDPR)',
          icon: 'ShieldCheckIcon',
          color: 'blue',
          category: 'Legal',
          sortOrder: 1,
          isSystem: true,
          isActive: true,
          isRequired: true,
          requiresApproval: true,
          requiresSignature: false
        },
        {
          code: 'TERMS_SERVICE',
          name: 'Terms of Service',
          displayName: 'Termini e Condizioni',
          description: 'Termini e condizioni di utilizzo del servizio',
          icon: 'DocumentTextIcon',
          color: 'green',
          category: 'Legal',
          sortOrder: 2,
          isSystem: true,
          isActive: true,
          isRequired: true,
          requiresApproval: true,
          requiresSignature: false
        },
        {
          code: 'COOKIE_POLICY',
          name: 'Cookie Policy',
          displayName: 'Cookie Policy',
          description: 'Informativa sui cookie e tecnologie simili',
          icon: 'CakeIcon',
          color: 'yellow',
          category: 'Legal',
          sortOrder: 3,
          isSystem: true,
          isActive: true,
          isRequired: false,
          requiresApproval: true,
          requiresSignature: false
        }
      ];

      const created = [];
      for (const typeData of defaultTypes) {
        const existing = await this.getTypeByCode(typeData.code);
        if (!existing) {
          const newType = await this.createType(typeData, userId);
          created.push(newType);
        }
      }

      return {
        message: `Initialized ${created.length} default document types`,
        created
      };
    } catch (error) {
      logger.error('Error initializing default types:', error);
      throw error;
    }
  }
}

export const documentTypeService = new DocumentTypeService();
