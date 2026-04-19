import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { DocumentTypeConfig, CustomForm, LegalDocument } from '@prisma/client';

interface UnifiedDocument {
  id: string;
  type: 'LEGAL' | 'FORM_BASED';
  title: string;
  description?: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';
  version: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  documentType?: {
    code: string;
    name: string;
    displayName: string;
  };
  isFormBased: boolean;
  metadata?: any;
}

interface CreateDocumentFromFormData {
  documentTypeId: string;
  title: string;
  description?: string;
  formTemplateId: string;
  createdBy: string;
  metadata?: any;
}

export class UnifiedDocumentService {
  /**
   * Get all documents with unified interface
   */
  async getAllDocuments(filters?: {
    type?: string;
    status?: string;
    search?: string; // ✅ NUOVO
    createdBy?: string;
    documentTypeId?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      const limit = filters?.limit || 50;
      const offset = filters?.offset || 0;

      // Determine which types to fetch based on filter
      const shouldFetchLegal = !filters?.type || filters.type === 'LEGAL';
      const shouldFetchFormBased = !filters?.type || filters.type === 'FORM_BASED';

      let legalDocuments: any[] = [];
      let formDocuments: any[] = [];

      // Build where clause for legal documents
      if (shouldFetchLegal) {
        const legalWhere: any = {
          isActive: true
        };

        if (filters?.createdBy) {
          legalWhere.createdBy = filters.createdBy;
        }

        if (filters?.documentTypeId) {
          legalWhere.typeConfigId = filters.documentTypeId;
        }

        // ✅ NUOVO: Search filter
        if (filters?.search) {
          legalWhere.OR = [
            { displayName: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
            { internalName: { contains: filters.search, mode: 'insensitive' } }
          ];
        }

        // Get legal documents
        legalDocuments = await prisma.legalDocument.findMany({
          where: legalWhere,
          include: {
            DocumentTypeConfig: true,
            versions: {
              where: {
                status: 'PUBLISHED'
              },
              orderBy: {
                publishedAt: 'desc'
              },
              take: 1
            },
            User: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          take: limit,
          skip: offset,
          orderBy: {
            updatedAt: 'desc'
          }
        });
      }

      // Build where clause for form-based documents
      if (shouldFetchFormBased) {
        const formWhere: any = {
          isDocumentTemplate: true
        };

        if (filters?.createdBy) {
          formWhere.createdBy = filters.createdBy;
        }

        if (filters?.documentTypeId) {
          formWhere.documentTypeId = filters.documentTypeId;
        }

        // ✅ NUOVO: Search filter
        if (filters?.search) {
          formWhere.OR = [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } }
          ];
        }

        // Get form-based documents
        formDocuments = await prisma.customForm.findMany({
          where: formWhere,
          include: {
            DocumentTypeConfig: true,
            User_CustomForm_createdByToUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            _count: {
              select: {
                CustomFormField: true
              }
            }
          },
          take: limit,
          skip: offset,
          orderBy: {
            updatedAt: 'desc'
          }
        });
      }

      // Convert to unified format
      const unifiedDocuments = [
        ...legalDocuments.map((doc: any) => ({
          id: doc.id,
          type: 'LEGAL' as const,
          title: doc.displayName,
          description: doc.description,
          status: doc.isActive ? 'PUBLISHED' : 'DRAFT',
          version: doc.versions[0]?.version || '1.0.0',
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          createdBy: doc.createdBy,
          createdByUser: doc.User,
          documentType: doc.DocumentTypeConfig ? {
            code: doc.DocumentTypeConfig.code,
            name: doc.DocumentTypeConfig.name,
            displayName: doc.DocumentTypeConfig.displayName
          } : undefined,
          isFormBased: false,
          metadata: doc.metadata
        })),
        ...formDocuments.map((doc: any) => ({
          id: doc.id,
          type: 'FORM_BASED' as const,
          title: doc.name,
          description: doc.description,
          status: doc.isPublished ? 'PUBLISHED' : 'DRAFT',
          version: doc.version.toString(),
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          createdBy: doc.createdBy,
          createdByUser: doc.User_CustomForm_createdByToUser,
          documentType: doc.DocumentTypeConfig ? {
            code: doc.DocumentTypeConfig.code,
            name: doc.DocumentTypeConfig.name,
            displayName: doc.DocumentTypeConfig.displayName
          } : undefined,
          isFormBased: true,
          fieldCount: doc._count?.CustomFormField || 0,
          metadata: doc.documentSettings
        }))
      ];

      // Sort by updatedAt desc
      unifiedDocuments.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      // ✅ NUOVO: Apply status filter AFTER unification
      let filteredDocuments = unifiedDocuments;
      if (filters?.status) {
        filteredDocuments = unifiedDocuments.filter(doc => doc.status === filters.status);
      }

      // Apply limit if we have more documents than requested
      const finalDocuments = filteredDocuments.slice(offset, offset + limit);

      return {
        documents: finalDocuments,
        total: filteredDocuments.length,
        limit,
        offset
      };
    } catch (error: unknown) {
      logger.error('Error fetching unified documents:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Get a single unified document by ID
   */
  async getDocumentById(id: string, type: 'LEGAL' | 'FORM_BASED') {
    try {
      if (!id || !type) {
        throw new Error('Invalid parameters: id and type are required');
      }

      if (type === 'LEGAL') {
        const doc = await prisma.legalDocument.findUnique({
          where: { id },
          include: {
            DocumentTypeConfig: true,
            versions: {
              orderBy: {
                createdAt: 'desc'
              }
            },
            User: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        });

        if (!doc) {
          throw new Error('Legal document not found');
        }

        return {
          id: doc.id,
          type: 'LEGAL' as const,
          title: doc.displayName,
          description: doc.description,
          status: doc.isActive ? 'PUBLISHED' : 'DRAFT',
          versions: doc.versions,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          createdBy: doc.createdBy,
          createdByUser: doc.User,
          documentType: doc.DocumentTypeConfig ? {
            code: doc.DocumentTypeConfig.code,
            name: doc.DocumentTypeConfig.name,
            displayName: doc.DocumentTypeConfig.displayName
          } : undefined,
          isFormBased: false,
          metadata: doc.metadata
        };
      } else {
        const doc = await prisma.customForm.findUnique({
          where: { 
            id,
            isDocumentTemplate: true
          },
          include: {
            DocumentTypeConfig: true,
            User_CustomForm_createdByToUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            CustomFormField: {
              orderBy: {
                displayOrder: 'asc'
              }
            }
          }
        });

        if (!doc) {
          throw new Error('Form-based document not found');
        }

        return {
          id: doc.id,
          type: 'FORM_BASED' as const,
          title: doc.name,
          description: doc.description,
          status: doc.isPublished ? 'PUBLISHED' : 'DRAFT',
          version: doc.version.toString(),
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          createdBy: doc.createdBy,
          createdByUser: doc.User_CustomForm_createdByToUser,
          documentType: doc.DocumentTypeConfig ? {
            code: doc.DocumentTypeConfig.code,
            name: doc.DocumentTypeConfig.name,
            displayName: doc.DocumentTypeConfig.displayName
          } : undefined,
          isFormBased: true,
          fields: doc.CustomFormField,
          fieldCount: doc.CustomFormField.length,
          metadata: doc.documentSettings
        };
      }
    } catch (error: unknown) {
      logger.error('Error fetching document by ID:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Create a new document from a form template
   */
  async createDocumentFromForm(data: CreateDocumentFromFormData) {
    try {
      // Validazione input
      if (!data.documentTypeId || !data.title || !data.formTemplateId || !data.createdBy) {
        throw new Error('Invalid parameters: documentTypeId, title, formTemplateId and createdBy are required');
      }

      // Verify document type exists
      const documentType = await prisma.documentTypeConfig.findUnique({
        where: { id: data.documentTypeId }
      });

      if (!documentType) {
        throw new Error('Document type not found');
      }

      // Verify form template exists and is a template
      const formTemplate = await prisma.customForm.findUnique({
        where: { 
          id: data.formTemplateId,
          isTemplate: true 
        },
        include: {
          CustomFormField: true,
          Subcategory: true
        }
      });

      if (!formTemplate) {
        throw new Error('Form template not found or not a template');
      }

      // Create document in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create a new form instance based on the template
        const newForm = await tx.customForm.create({
          data: {
            name: data.title,
            description: data.description,
            subcategoryId: formTemplate.subcategoryId,
            professionalId: null,
            displayType: formTemplate.displayType,
            createdBy: data.createdBy,
            version: 1,
            isPublished: false,
            isTemplate: false,
            isDocumentTemplate: true,
            documentTypeId: data.documentTypeId,
            documentSettings: {
              requiresApproval: documentType.requiresApproval,
              requiresSignature: documentType.requiresSignature,
              approverRoles: documentType.approverRoles,
              publisherRoles: documentType.publisherRoles,
              ...data.metadata
            },
            enableVersioning: true
          } as any
        });

        // Copy fields from template
        const fieldCopies = await Promise.all(
          formTemplate.CustomFormField.map(field => 
            tx.customFormField.create({
              data: {
                customFormId: newForm.id,
                code: field.code,
                label: field.label,
                placeholder: field.placeholder,
                helpText: field.helpText,
                fieldType: field.fieldType,
                displayOrder: field.displayOrder,
                isRequired: field.isRequired,
                isReadonly: field.isReadonly,
                isHidden: field.isHidden,
                columnSpan: field.columnSpan,
                rowNumber: field.rowNumber,
                groupName: field.groupName,
                sectionCode: field.sectionCode,
                config: field.config,
                validationRules: field.validationRules,
                defaultValue: field.defaultValue,
                possibleValues: field.possibleValues,
                dependencies: field.dependencies,
                showIf: field.showIf,
                requiredIf: field.requiredIf
              } as any
            })
          )
        );

        return {
          ...newForm,
          CustomFormField: fieldCopies
        };
      });

      logger.info(`Document created from form template`, {
        documentId: result.id,
        templateId: data.formTemplateId,
        userId: data.createdBy,
        action: 'CREATE_DOCUMENT_FROM_FORM'
      });

      return result;
    } catch (error: unknown) {
      logger.error('Error creating document from form:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Get statistics about unified documents
   */
  async getDocumentStatistics(filters?: {
    createdBy?: string;
    documentTypeId?: string;
  }) {
    try {
      const legalWhere: any = { isActive: true };
      const formWhere: any = { isDocumentTemplate: true };

      if (filters?.createdBy) {
        legalWhere.createdBy = filters.createdBy;
        formWhere.createdBy = filters.createdBy;
      }

      if (filters?.documentTypeId) {
        legalWhere.typeConfigId = filters.documentTypeId;
        formWhere.documentTypeId = filters.documentTypeId;
      }

      const [legalCount, formCount, legalDraft, formDraft] = await Promise.all([
        prisma.legalDocument.count({ where: legalWhere }),
        prisma.customForm.count({ where: formWhere }),
        prisma.legalDocument.count({ where: { ...legalWhere, isActive: false } }),
        prisma.customForm.count({ where: { ...formWhere, isPublished: false } })
      ]);

      return {
        total: legalCount + formCount,
        legalDocuments: legalCount,
        formBasedDocuments: formCount,
        draftDocuments: legalDraft + formDraft,
        publishedDocuments: (legalCount - legalDraft) + (formCount - formDraft)
      };
    } catch (error: unknown) {
      logger.error('Error fetching document statistics:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
}

export const unifiedDocumentService = new UnifiedDocumentService();
