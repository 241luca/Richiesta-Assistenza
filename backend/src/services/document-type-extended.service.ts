import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { DocumentTypeService } from './document-type.service';
import { DocumentTypeConfig, CustomForm, DocumentFormTemplate } from '@prisma/client';

export class ExtendedDocumentTypeService extends DocumentTypeService {
  /**
   * Get document type with form template information
   */
  async getExtendedType(id: string) {
    try {
      // Validazione input
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid document type ID');
      }

      const type = await prisma.documentTypeConfig.findUnique({
        where: { id }
      });

      if (!type) {
        throw new Error('Document type not found');
      }

      // Get related CustomForm through the formTemplateId field
      let formTemplateName = null;
      let formTemplateFields = 0;
      
      if (type.formTemplateId) {
        const customForm = await prisma.customForm.findUnique({
          where: { id: type.formTemplateId },
          select: {
            name: true,
            _count: {
              select: { CustomFormField: true }
            }
          }
        });
        formTemplateName = customForm?.name || null;
        formTemplateFields = customForm?._count?.CustomFormField || 0;
      }

      // Get statistics
      const [documentCount, templateCount] = await Promise.all([
        prisma.legalDocument.count({
          where: { typeConfigId: id }
        }),
        prisma.documentFormTemplate.count({
          where: { documentTypeId: id }
        })
      ]);

      return {
        ...type,
        formTemplateName,
        formTemplateFields,
        documentCount,
        templateCount
      };
    } catch (error) {
      logger.error('Error fetching extended document type:', error);
      throw error;
    }
  }

  /**
   * Get all document types with extended information
   */
  async getAllExtendedTypes(filters?: any) {
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

      // Ottimizzazione: Query aggregate fuori dal loop per evitare N+1
      const typeIds = types.map(t => t.id);
      const formTemplateIds = types.map(t => t.formTemplateId).filter(Boolean) as string[];

      // Fetch tutti i custom forms in una query
      const customForms = formTemplateIds.length > 0 ? await prisma.customForm.findMany({
        where: { id: { in: formTemplateIds } },
        select: {
          id: true,
          name: true,
          _count: {
            select: { CustomFormField: true }
          }
        }
      }) : [];

      // Mappa per accesso rapido
      const formMap = new Map(customForms.map(f => [f.id, f]));

      // Fetch document counts in parallelo
      const [documentCounts, templateCounts] = await Promise.all([
        prisma.legalDocument.groupBy({
          by: ['typeConfigId'],
          where: { typeConfigId: { in: typeIds } },
          _count: { id: true }
        }),
        prisma.documentFormTemplate.groupBy({
          by: ['documentTypeId'],
          where: { documentTypeId: { in: typeIds } },
          _count: { id: true }
        })
      ]);

      // Mappa per accesso rapido
      const docCountMap = new Map(documentCounts.map(d => [d.typeConfigId, d._count.id]));
      const templateCountMap = new Map(templateCounts.map(t => [t.documentTypeId, t._count.id]));

      // Costruisci risultato finale
      const extendedTypes = types.map((type: DocumentTypeConfig) => {
        const formTemplate = type.formTemplateId ? formMap.get(type.formTemplateId) : null;
        
        return {
          ...type,
          formTemplateName: formTemplate?.name || null,
          formTemplateFields: formTemplate?._count?.CustomFormField || 0,
          documentCount: docCountMap.get(type.id) || 0,
          templateCount: templateCountMap.get(type.id) || 0
        };
      });

      return extendedTypes;
    } catch (error) {
      logger.error('Error fetching extended document types:', error);
      throw error;
    }
  }

  /**
   * Link a form template to a document type
   */
  async linkFormTemplate(documentTypeId: string, formTemplateId: string, isDefault: boolean, userId: string) {
    try {
      // Validazione input
      if (!documentTypeId || !formTemplateId || !userId) {
        throw new Error('Invalid parameters: documentTypeId, formTemplateId and userId are required');
      }

      // Verify document type exists
      const documentType = await this.getTypeById(documentTypeId);
      
      // Verify form template exists and is a template
      const formTemplate = await prisma.customForm.findUnique({
        where: { 
          id: formTemplateId,
          isTemplate: true 
        }
      });

      if (!formTemplate) {
        throw new Error('Form template not found or not a template');
      }

      // Usa transazione per garantire consistenza dei dati
      const result = await prisma.$transaction(async (tx) => {
        // Se questo deve essere il default, rimuovi il flag da tutti gli altri
        if (isDefault) {
          await tx.documentFormTemplate.updateMany({
            where: {
              documentTypeId,
              isDefault: true
            },
            data: {
              isDefault: false
            }
          });
        }

        // Create or update the link
        const link = await tx.documentFormTemplate.upsert({
          where: {
            documentTypeId_formId: {
              documentTypeId,
              formId: formTemplateId
            }
          },
          create: {
            documentTypeId,
            formId: formTemplateId,
            isDefault
          },
          update: {
            isDefault
          }
        });

        // If this is the default template, update the document type
        if (isDefault) {
          await tx.documentTypeConfig.update({
            where: { id: documentTypeId },
            data: {
              formTemplateId: formTemplateId
            }
          });
        }

        return link;
      });

      logger.info(`Form template ${formTemplateId} linked to document type ${documentTypeId}`, {
        userId,
        isDefault,
        action: 'LINK_TEMPLATE'
      });

      return result;
    } catch (error) {
      logger.error('Error linking form template:', error);
      throw error;
    }
  }

  /**
   * Get all form templates for a document type
   */
  async getFormTemplatesForType(documentTypeId: string) {
    try {
      // Validazione input
      if (!documentTypeId) {
        throw new Error('Invalid document type ID');
      }

      // Ottimizzazione: usa _count invece di query separate
      const links = await prisma.documentFormTemplate.findMany({
        where: { documentTypeId },
        include: {
          CustomForm: {
            include: {
              _count: {
                select: { CustomFormField: true }
              }
            }
          }
        }
      });

      const templates = links.map((link) => ({
        ...link.CustomForm,
        fieldCount: link.CustomForm._count?.CustomFormField || 0,
        isDefault: link.isDefault
      }));

      const defaultTemplate = templates.find((t) => t.isDefault);

      return {
        defaultTemplate,
        availableTemplates: templates.filter((t) => !t.isDefault)
      };
    } catch (error) {
      logger.error('Error fetching form templates:', error);
      throw error;
    }
  }

  /**
   * Unlink a form template from a document type
   */
  async unlinkFormTemplate(documentTypeId: string, formTemplateId: string, userId: string) {
    try {
      // Validazione input
      if (!documentTypeId || !formTemplateId || !userId) {
        throw new Error('Invalid parameters: documentTypeId, formTemplateId and userId are required');
      }

      // Verify the link exists
      const existingLink = await prisma.documentFormTemplate.findUnique({
        where: {
          documentTypeId_formId: {
            documentTypeId,
            formId: formTemplateId
          }
        }
      });

      if (!existingLink) {
        throw new Error('Form template link not found');
      }

      // Usa transazione per garantire consistenza
      await prisma.$transaction(async (tx) => {
        // Delete the link
        await tx.documentFormTemplate.delete({
          where: {
            documentTypeId_formId: {
              documentTypeId,
              formId: formTemplateId
            }
          }
        });

        // If this was the default template, clear the reference in document type
        const documentType = await tx.documentTypeConfig.findUnique({
          where: { id: documentTypeId }
        });

        if (documentType?.formTemplateId === formTemplateId) {
          await tx.documentTypeConfig.update({
            where: { id: documentTypeId },
            data: {
              formTemplateId: null
            }
          });
        }
      });

      logger.info(`Form template ${formTemplateId} unlinked from document type ${documentTypeId}`, {
        userId,
        action: 'UNLINK_TEMPLATE'
      });

      return {
        success: true,
        message: 'Form template unlinked successfully'
      };
    } catch (error) {
      logger.error('Error unlinking form template:', error);
      throw error;
    }
  }

  /**
   * Set a form template as the default for a document type
   */
  async setDefaultFormTemplate(documentTypeId: string, formTemplateId: string, userId: string) {
    try {
      // Validazione input
      if (!documentTypeId || !formTemplateId || !userId) {
        throw new Error('Invalid parameters: documentTypeId, formTemplateId and userId are required');
      }

      // Set the new default template (linkFormTemplate gestisce già la rimozione degli altri default)
      const result = await this.linkFormTemplate(documentTypeId, formTemplateId, true, userId);

      logger.info(`Set default form template ${formTemplateId} for document type ${documentTypeId}`, {
        userId,
        action: 'SET_DEFAULT_TEMPLATE'
      });

      return result;
    } catch (error) {
      logger.error('Error setting default form template:', error);
      throw error;
    }
  }
}

export const extendedDocumentTypeService = new ExtendedDocumentTypeService();