import { PrismaClient, CustomForm, CustomFormField, CustomFormFieldType, CustomFormDisplayType, CustomFormCommissionStatus, CustomFormCommissionPriority } from '@prisma/client';
 import { ResponseFormatter } from '../utils/responseFormatter';
import { moduleService } from './module.service';
import { auditLogService } from './auditLog.service';
import { notificationService } from './notification.service';

const prisma = new PrismaClient();

export interface CustomFormWithFields extends CustomForm {
  CustomFormField: CustomFormField[];
  Subcategory?: {
    id: string;
    name: string;
  };
  User_CustomForm_createdByToUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  User_CustomForm_professionalIdToUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateCustomFormData {
  name: string;
  description?: string;
  subcategoryId: string;
  professionalId?: string;
  displayType: CustomFormDisplayType;
  fields: CreateCustomFormFieldData[];
  documentCategoryIds?: string[]; // ✅ NUOVO: IDs delle categorie documento
}

export interface CreateCustomFormFieldData {
  code: string;
  label: string;
  fieldType: CustomFormFieldType;
  displayOrder: number;
  isRequired?: boolean;
  isReadonly?: boolean;
  isHidden?: boolean;
  columnSpan?: number;
  rowNumber?: number;
  groupName?: string;
  sectionCode?: string;
  config?: any;
  validationRules?: any;
  defaultValue?: string;
  possibleValues?: string[];
  dependencies?: any;
  showIf?: any;
  requiredIf?: any;
}

export interface CustomFormFilters {
  subcategoryId?: string;
  professionalId?: string | null;
  isProfessionalView?: boolean; // Indica se la richiesta proviene da un professional (per mostrare i suoi + template)
  professionalSubcategoryIds?: string[]; // IDs delle sottocategorie abilitate per il professional
  currentUserId?: string; // ID dell'utente corrente (per fallback se non ha professionalId)
  isPublished?: boolean;
  isDefault?: boolean;
  displayType?: CustomFormDisplayType;
  search?: string;
}

class CustomFormService {
  /**
   * Verifica se il modulo custom-forms è abilitato
   */
  async isModuleEnabled(): Promise<boolean> {
    try {
      return await moduleService.isModuleEnabled('custom-forms');
    } catch (error) {
      console.error('Errore verifica modulo custom-forms:', error);
      return false;
    }
  }

  /**
   * Ottiene tutti i custom forms con filtri opzionali
   */
  async getAllCustomForms(filters: CustomFormFilters = {}) {
    try {
      console.log('🔍 CustomFormService.getAllCustomForms - Filters received:', filters);
      
      const isEnabled = await this.isModuleEnabled();
      if (!isEnabled) {
        return ResponseFormatter.success([], 'Modulo custom-forms disabilitato');
      }

      const where: any = {};

      if (filters.subcategoryId) {
        where.subcategoryId = filters.subcategoryId;
      }

      // Gestione professionalId: può essere undefined (tutti), null (solo template), o un ID specifico
      // IMPORTANTE: Se è un ID specifico E isProfessionalView=true, mostra i suoi + i template
      if (filters.professionalId !== undefined) {
        if (filters.professionalId === null) {
          // Solo template repository
          where.professionalId = null;
        } else if (filters.isProfessionalView) {
          // Professional: mostra i suoi form E i template (OR query)
          // Se ha professionalSubcategoryIds, filtra i template solo per quelle sottocategorie
          if (filters.professionalSubcategoryIds && filters.professionalSubcategoryIds.length > 0) {
            where.OR = [
              { professionalId: filters.professionalId },
              { 
                AND: [
                  { professionalId: null }, // Template repository
                  { subcategoryId: { in: filters.professionalSubcategoryIds } } // Solo sue sottocategorie
                ]
              }
            ];
          } else {
            // Fallback: mostra tutti i template
            where.OR = [
              { professionalId: filters.professionalId },
              { professionalId: null }
            ];
          }
        } else {
          // Admin che filtra per un professional specifico (solo i suoi)
          where.professionalId = filters.professionalId;
        }
      }

      if (filters.isPublished !== undefined) {
        where.isPublished = filters.isPublished;
      }

      if (filters.isDefault !== undefined) {
        where.isDefault = filters.isDefault;
      }

      if (filters.displayType) {
        where.displayType = filters.displayType;
      }

      // Gestione search: se c'è già OR (per professionalId), combina con AND
      if (filters.search) {
        const searchCondition = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ];
        
        if (where.OR) {
          // Abbiamo già OR per professionalId, usiamo AND per combinare
          where.AND = [
            { OR: where.OR }, // Mantieni la condizione professionalId OR template
            { OR: searchCondition } // Aggiungi search
          ];
          delete where.OR; // Rimuovi OR dalla radice
        } else {
          // Nessun conflitto, usa OR direttamente
          where.OR = searchCondition;
        }
      }

      console.log('🔍 CustomFormService - WHERE clause:', JSON.stringify(where, null, 2));

      const customForms = await prisma.customForm.findMany({
        where,
        include: {
          CustomFormField: {
            orderBy: { displayOrder: 'asc' }
          },
          Subcategory: {
            select: { 
              id: true, 
              name: true,
              Category: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          User_CustomForm_createdByToUser: {
            select: { id: true, firstName: true, lastName: true }
          },
          User_CustomForm_professionalIdToUser: {
            select: { id: true, firstName: true, lastName: true }
          },
          documentCategories: { // ✅ NUOVO: Include categorie documento
            include: {
              documentCategory: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  description: true,
                  icon: true,
                  color: true
                }
              }
            }
          }
        },
        orderBy: [
          { isDefault: 'desc' },
          { isPublished: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      return ResponseFormatter.success(customForms, 'Custom forms recuperati con successo');
    } catch (error) {
      console.error('Errore nel recupero dei custom forms:', error);
      return ResponseFormatter.error('Errore nel recupero dei custom forms');
    }
  }

  /**
   * Ottiene un custom form per ID
   */
  async getCustomFormById(id: string) {
    try {
      const isEnabled = await this.isModuleEnabled();
      if (!isEnabled) {
        return ResponseFormatter.error('Modulo custom-forms disabilitato');
      }

      const customForm = await prisma.customForm.findUnique({
        where: { id },
        include: {
          CustomFormField: {
            orderBy: { displayOrder: 'asc' }
          },
          Subcategory: {
            select: { id: true, name: true }
          },
          User_CustomForm_createdByToUser: {
            select: { id: true, firstName: true, lastName: true }
          },
          User_CustomForm_professionalIdToUser: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      });

      if (!customForm) {
        return ResponseFormatter.error('Custom form non trovato');
      }

      return ResponseFormatter.success(customForm, 'Custom form recuperato con successo');
    } catch (error) {
      console.error('Errore nel recupero del custom form:', error);
      return ResponseFormatter.error('Errore nel recupero del custom form');
    }
  }

  /**
   * Ottiene i custom forms per un professionista specifico
   */
  async getCustomFormsByProfessional(professionalId: string) {
    try {
      const isEnabled = await this.isModuleEnabled();
      if (!isEnabled) {
        return ResponseFormatter.success([], 'Modulo custom-forms disabilitato');
      }

      const customForms = await prisma.customForm.findMany({
        where: {
          professionalId
        },
        include: {
          CustomFormField: {
            orderBy: { displayOrder: 'asc' }
          },
          Subcategory: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      // Trasforma i dati per il frontend - aggiungi subcategoryName
      const transformedForms = customForms.map((form: any) => ({
        ...form,
        subcategoryName: form.subcategory?.name || 'Categoria non specificata'
      }));

      return ResponseFormatter.success(transformedForms, 'Custom forms per professionista recuperati con successo');
    } catch (error) {
      console.error('Errore nel recupero dei custom forms per professionista:', error);
      return ResponseFormatter.error('Errore nel recupero dei custom forms per professionista');
    }
  }

  /**
   * Ottiene i custom forms per una sottocategoria specifica
   */
  async getCustomFormsBySubcategory(subcategoryId: string) {
    try {
      const isEnabled = await this.isModuleEnabled();
      if (!isEnabled) {
        return ResponseFormatter.success([], 'Modulo custom-forms disabilitato');
      }

      const customForms = await prisma.customForm.findMany({
        where: {
          subcategoryId,
          isPublished: true
        },
        include: {
          CustomFormField: {
            orderBy: { displayOrder: 'asc' }
          }
        },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      return ResponseFormatter.success(customForms, 'Custom forms per sottocategoria recuperati con successo');
    } catch (error) {
      console.error('Errore nel recupero dei custom forms per sottocategoria:', error);
      return ResponseFormatter.error('Errore nel recupero dei custom forms per sottocategoria');
    }
  }

  /**
   * Crea un nuovo custom form
   */
  async createCustomForm(data: CreateCustomFormData, createdBy: string, req?: any) {
    try {
      const isEnabled = await this.isModuleEnabled();
      if (!isEnabled) {
        return ResponseFormatter.error('Modulo custom-forms disabilitato');
      }

      // Validazione dei dati
      if (!data.name || !data.subcategoryId || !data.fields) {
        return ResponseFormatter.error('Dati obbligatori mancanti');
      }

      // Verifica che la sottocategoria esista
      const subcategory = await prisma.subcategory.findUnique({
        where: { id: data.subcategoryId }
      });

      if (!subcategory) {
        return ResponseFormatter.error('Sottocategoria non trovata');
      }

      // Crea il custom form con i campi in una transazione
      const customForm = await prisma.$transaction(async (tx) => {
        const newCustomForm = await tx.customForm.create({
          data: {
            name: data.name,
            description: data.description,
            subcategoryId: data.subcategoryId,
            professionalId: data.professionalId,
            displayType: data.displayType,
            createdBy,
            version: 1,
            isDefault: false,
            isPublished: false
          }
        });

        // ✅ NUOVO: Crea le relazioni con le categorie documento
        if (data.documentCategoryIds && data.documentCategoryIds.length > 0) {
          await Promise.all(
            data.documentCategoryIds.map(categoryId =>
              tx.customFormDocumentCategory.create({
                data: {
                  customFormId: newCustomForm.id,
                  documentCategoryId: categoryId
                }
              })
            )
          );
        }

        // Crea i campi (solo se l'array non è vuoto)
        const fields = data.fields.length > 0 
          ? await Promise.all(
              data.fields.map(field => {
                const fieldData = {
                  customFormId: newCustomForm.id,
                  code: field.code,
                  label: field.label,
                  fieldType: field.fieldType,
                  displayOrder: field.displayOrder,
                  isRequired: field.isRequired || false,
                  isReadonly: field.isReadonly || false,
                  isHidden: field.isHidden || false,
                  columnSpan: field.columnSpan || 12,
                  rowNumber: field.rowNumber || 1,
                  groupName: field.groupName,
                  sectionCode: field.sectionCode,
                  config: field.config,
                  validationRules: field.validationRules,
                  defaultValue: field.defaultValue,
                  possibleValues: field.possibleValues ? JSON.stringify(field.possibleValues) : null,
                  dependencies: field.dependencies,
                  showIf: field.showIf,
                  requiredIf: field.requiredIf
                };
                return tx.customFormField.create({
                  data: fieldData
                });
              })
            )
          : [];

        return { ...newCustomForm, fields };
      });

      // ✅ Audit Log Integration
      const requestInfo = req ? auditLogService.extractRequestInfo(req) : {};
      await auditLogService.log({
        ...requestInfo,
        userId: createdBy,
        ipAddress: requestInfo.ipAddress || 'system',
        userAgent: requestInfo.userAgent || 'custom-form-service',
        action: 'CREATE' as any,
        entityType: 'CustomForm',
        entityId: customForm.id,
        newValues: {
          name: data.name,
          subcategoryId: data.subcategoryId,
          displayType: data.displayType,
          fieldsCount: data.fields.length
        },
        success: true,
        severity: 'INFO' as any,
        category: 'BUSINESS' as any
      });

      // ✅ Notification Integration
      // Notifica il professionista (se specificato) o l'admin
      const recipientId = data.professionalId || createdBy;
      await notificationService.sendToUser({
        userId: recipientId,
        type: 'custom_form_created',
        title: 'Nuovo Form Creato',
        message: `Il form "${data.name}" è stato creato con successo`,
        data: {
          formId: customForm.id,
          formName: data.name,
          fieldsCount: data.fields.length
        },
        priority: 'normal',
        channels: ['websocket']
      });

      return ResponseFormatter.success(customForm, 'Custom form creato con successo');
    } catch (error) {
      console.error('Errore nella creazione del custom form:', error);
      
      // Log errore nell'audit log
      const requestInfo = req ? auditLogService.extractRequestInfo(req) : {};
      await auditLogService.log({
        ...requestInfo,
        userId: createdBy,
        ipAddress: requestInfo.ipAddress || 'system',
        userAgent: requestInfo.userAgent || 'custom-form-service',
        action: 'CREATE' as any,
        entityType: 'CustomForm',
        success: false,
        errorMessage: (error as Error).message,
        severity: 'ERROR' as any,
        category: 'BUSINESS' as any
      });
      
      return ResponseFormatter.error('Errore nella creazione del custom form');
    }
  }

  /**
   * Aggiorna un custom form esistente
   */
  async updateCustomForm(id: string, data: Partial<CreateCustomFormData>, updatedBy: string, req?: any) {
    try {
      const isEnabled = await this.isModuleEnabled();
      if (!isEnabled) {
        return ResponseFormatter.error('Modulo custom-forms disabilitato');
      }

      // Verifica che il custom form esista
      const existingForm = await prisma.customForm.findUnique({
        where: { id },
        include: { Fields: true }
      });

      if (!existingForm) {
        return ResponseFormatter.error('Custom form non trovato');
      }

      // Aggiorna il custom form in una transazione
      const updatedForm = await prisma.$transaction(async (tx) => {
        const updated = await tx.customForm.update({
          where: { id },
          data: {
            name: data.name,
            description: data.description,
            subcategoryId: data.subcategoryId,
            professionalId: data.professionalId,
            displayType: data.displayType,
            version: existingForm.version + 1,
            updatedAt: new Date()
          }
        });

        // Se ci sono nuovi campi, gestiscili con attenzione
        if (data.fields) {
          // Verifica se ci sono risposte associate a questo form
          const hasResponses = await tx.requestCustomFormResponse.findFirst({
            where: {
              RequestCustomForm: {
                customFormId: id
              }
            }
          });

          if (hasResponses) {
            // ⚠️ NON eliminare i campi se ci sono risposte!
            // Invece, aggiorna i campi esistenti e aggiungi i nuovi
            // Questo preserva l'integrità dei dati delle risposte
            
            // Ottieni i campi esistenti
            const existingFields = await tx.customFormField.findMany({
              where: { customFormId: id }
            });

            // Crea una mappa dei campi esistenti per code
            const existingFieldsMap = new Map(
              existingFields.map(f => [f.code, f])
            );

            // Aggiorna o crea i campi
            await Promise.all(
              data.fields.map(async (field) => {
                const existingField = existingFieldsMap.get(field.code);
                
                if (existingField) {
                  // Aggiorna campo esistente
                  return tx.customFormField.update({
                    where: { id: existingField.id },
                    data: {
                      label: field.label,
                      fieldType: field.fieldType,
                      displayOrder: field.displayOrder,
                      isRequired: field.isRequired ?? false,
                      isReadonly: field.isReadonly ?? false,
                      isHidden: field.isHidden ?? false,
                      columnSpan: field.columnSpan ?? 12,
                      rowNumber: field.rowNumber ?? 1,
                      groupName: field.groupName,
                      sectionCode: field.sectionCode,
                      config: field.config || {},
                      validationRules: field.validationRules || {},
                      defaultValue: field.defaultValue,
                      possibleValues: field.possibleValues,
                      dependencies: field.dependencies,
                      showIf: field.showIf,
                      requiredIf: field.requiredIf
                    }
                  });
                } else {
                  // Crea nuovo campo
                  return tx.customFormField.create({
                    data: {
                      code: field.code,
                      label: field.label,
                      fieldType: field.fieldType,
                      displayOrder: field.displayOrder,
                      isRequired: field.isRequired ?? false,
                      isReadonly: field.isReadonly ?? false,
                      isHidden: field.isHidden ?? false,
                      columnSpan: field.columnSpan ?? 12,
                      rowNumber: field.rowNumber ?? 1,
                      groupName: field.groupName,
                      sectionCode: field.sectionCode,
                      config: field.config || {},
                      validationRules: field.validationRules || {},
                      defaultValue: field.defaultValue,
                      possibleValues: field.possibleValues,
                      dependencies: field.dependencies,
                      showIf: field.showIf,
                      requiredIf: field.requiredIf,
                      customFormId: id
                    }
                  });
                }
              })
            );

            // NOTA: Non eliminiamo i campi che non sono più presenti
            // per preservare l'integrità delle risposte esistenti
            
          } else {
            // ✅ Nessuna risposta - possiamo eliminare e ricreare tranquillamente
            await tx.customFormField.deleteMany({
              where: { customFormId: id }
            });

            await Promise.all(
              data.fields.map(field => 
                tx.customFormField.create({
                  data: {
                    code: field.code,
                    label: field.label,
                    fieldType: field.fieldType,
                    displayOrder: field.displayOrder,
                    isRequired: field.isRequired ?? false,
                    isReadonly: field.isReadonly ?? false,
                    isHidden: field.isHidden ?? false,
                    columnSpan: field.columnSpan ?? 12,
                    rowNumber: field.rowNumber ?? 1,
                    groupName: field.groupName,
                    sectionCode: field.sectionCode,
                    config: field.config || {},
                    validationRules: field.validationRules || {},
                    defaultValue: field.defaultValue,
                    possibleValues: field.possibleValues,
                    dependencies: field.dependencies,
                    showIf: field.showIf,
                    requiredIf: field.requiredIf,
                    customFormId: id
                  }
                })
              )
            );
          }
        }

        // Ricarica il form con tutti i campi, sottocategoria e professional
        const formWithFields = await tx.customForm.findUnique({
          where: { id },
          include: {
            CustomFormField: {
              orderBy: { displayOrder: 'asc' }
            },
            Subcategory: {
              select: { id: true, name: true }
            },
            User_CustomForm_professionalIdToUser: {
              select: { id: true, firstName: true, lastName: true }
            },
            User_CustomForm_createdByToUser: {
              select: { id: true, firstName: true, lastName: true }
            }
          }
        });

        return formWithFields;
      });

      // ✅ Audit Log Integration
      const requestInfo = req ? auditLogService.extractRequestInfo(req) : {};
      await auditLogService.log({
        ...requestInfo,
        userId: updatedBy,
        ipAddress: requestInfo.ipAddress || 'system',
        userAgent: requestInfo.userAgent || 'custom-form-service',
        action: 'UPDATE' as any,
        entityType: 'CustomForm',
        entityId: id,
        oldValues: {
          name: existingForm.name,
          description: existingForm.description,
          version: existingForm.version
        },
        newValues: {
          name: data.name || existingForm.name,
          description: data.description || existingForm.description,
          version: existingForm.version + 1
        },
        success: true,
        severity: 'INFO' as any,
        category: 'BUSINESS' as any
      });

      // ✅ Notification Integration
      const recipientId = existingForm.professionalId || existingForm.createdBy;
      if (recipientId && recipientId !== updatedBy) {
        await notificationService.sendToUser({
          userId: recipientId,
          type: 'custom_form_updated',
          title: 'Form Aggiornato',
          message: `Il form "${data.name || existingForm.name}" è stato modificato`,
          data: {
            formId: id,
            formName: data.name || existingForm.name,
            version: existingForm.version + 1
          },
          priority: 'normal',
          channels: ['websocket']
        });
      }

      return ResponseFormatter.success(updatedForm, 'Custom form aggiornato con successo');
    } catch (error) {
      console.error('Errore nell\'aggiornamento del custom form:', error);
      
      // Log errore
      const requestInfo = req ? auditLogService.extractRequestInfo(req) : {};
      await auditLogService.log({
        ...requestInfo,
        userId: updatedBy,
        ipAddress: requestInfo.ipAddress || 'system',
        userAgent: requestInfo.userAgent || 'custom-form-service',
        action: 'UPDATE' as any,
        entityType: 'CustomForm',
        entityId: id,
        success: false,
        errorMessage: (error as Error).message,
        severity: 'ERROR' as any,
        category: 'BUSINESS' as any
      });
      
      return ResponseFormatter.error('Errore nell\'aggiornamento del custom form');
    }
  }

  /**
   * Pubblica un custom form
   */
  async publishCustomForm(id: string, publishedBy: string, req?: any) {
    try {
      const isEnabled = await this.isModuleEnabled();
      if (!isEnabled) {
        return ResponseFormatter.error('Modulo custom-forms disabilitato');
      }

      const customForm = await prisma.customForm.update({
        where: { id },
        data: {
          isPublished: true,
          approvedBy: publishedBy,
          updatedAt: new Date()
        },
        include: {
          CustomFormField: {
            orderBy: { displayOrder: 'asc' }
          }
        }
      });

      // ✅ Audit Log Integration
      const requestInfo = req ? auditLogService.extractRequestInfo(req) : {};
      await auditLogService.log({
        ...requestInfo,
        userId: publishedBy,
        ipAddress: requestInfo.ipAddress || 'system',
        userAgent: requestInfo.userAgent || 'custom-form-service',
        action: 'UPDATE' as any,
        entityType: 'CustomForm',
        entityId: id,
        newValues: {
          isPublished: true,
          status: 'PUBLISHED',
          approvedBy: publishedBy
        },
        success: true,
        severity: 'INFO' as any,
        category: 'BUSINESS' as any
      });

      // ✅ Notification Integration
      // Notifica il creatore del form
      if (customForm.createdBy !== publishedBy) {
        await notificationService.sendToUser({
          userId: customForm.createdBy,
          type: 'custom_form_published',
          title: 'Form Pubblicato',
          message: `Il form "${customForm.name}" è stato pubblicato e ora è disponibile`,
          data: {
            formId: id,
            formName: customForm.name,
            publishedBy
          },
          priority: 'high',
          channels: ['websocket', 'email']
        });
      }

      return ResponseFormatter.success(customForm, 'Custom form pubblicato con successo');
    } catch (error) {
      console.error('Errore nella pubblicazione del custom form:', error);
      
      // Log errore
      const requestInfo = req ? auditLogService.extractRequestInfo(req) : {};
      await auditLogService.log({
        ...requestInfo,
        userId: publishedBy,
        ipAddress: requestInfo.ipAddress || 'system',
        userAgent: requestInfo.userAgent || 'custom-form-service',
        action: 'UPDATE' as any,
        entityType: 'CustomForm',
        entityId: id,
        success: false,
        errorMessage: (error as Error).message,
        severity: 'ERROR' as any,
        category: 'BUSINESS' as any
      });
      
      return ResponseFormatter.error('Errore nella pubblicazione del custom form');
    }
  }

  /**
   * Elimina un custom form
   */
  async deleteCustomForm(id: string, deletedBy: string, req?: any) {
    try {
      const isEnabled = await this.isModuleEnabled();
      if (!isEnabled) {
        return ResponseFormatter.error('Modulo custom-forms disabilitato');
      }

      // Recupera il form prima di eliminarlo (per audit log)
      const existingForm = await prisma.customForm.findUnique({
        where: { id },
        select: { name: true, createdBy: true, professionalId: true }
      });

      if (!existingForm) {
        return ResponseFormatter.error('Custom form non trovato');
      }

      // Elimina il custom form e i suoi campi in una transazione
      await prisma.$transaction(async (tx) => {
        await tx.customFormField.deleteMany({
          where: { customFormId: id }
        });

        await tx.customForm.delete({
          where: { id }
        });
      });

      // ✅ Audit Log Integration
      const requestInfo = req ? auditLogService.extractRequestInfo(req) : {};
      await auditLogService.log({
        ...requestInfo,
        userId: deletedBy,
        ipAddress: requestInfo.ipAddress || 'system',
        userAgent: requestInfo.userAgent || 'custom-form-service',
        action: 'DELETE' as any,
        entityType: 'CustomForm',
        entityId: id,
        oldValues: {
          name: existingForm.name
        },
        success: true,
        severity: 'WARNING' as any,
        category: 'BUSINESS' as any
      });

      // ✅ Notification Integration
      // Notifica il creatore se non è lui che sta eliminando
      if (existingForm.createdBy !== deletedBy) {
        await notificationService.sendToUser({
          userId: existingForm.createdBy,
          type: 'custom_form_deleted',
          title: 'Form Eliminato',
          message: `Il form "${existingForm.name}" è stato eliminato`,
          data: {
            formId: id,
            formName: existingForm.name,
            deletedBy
          },
          priority: 'high',
          channels: ['websocket', 'email']
        });
      }

      return ResponseFormatter.success(null, 'Custom form eliminato con successo');
    } catch (error) {
      console.error('Errore nell\'eliminazione del custom form:', error);
      
      // Log errore
      const requestInfo = req ? auditLogService.extractRequestInfo(req) : {};
      await auditLogService.log({
        ...requestInfo,
        userId: deletedBy,
        ipAddress: requestInfo.ipAddress || 'system',
        userAgent: requestInfo.userAgent || 'custom-form-service',
        action: 'DELETE' as any,
        entityType: 'CustomForm',
        entityId: id,
        success: false,
        errorMessage: (error as Error).message,
        severity: 'ERROR' as any,
        category: 'BUSINESS' as any
      });
      
      return ResponseFormatter.error('Errore nell\'eliminazione del custom form');
    }
  }

  /**
   * Ottiene le statistiche sui custom forms
   */
  async getCustomFormStats() {
    try {
      const isEnabled = await this.isModuleEnabled();
      if (!isEnabled) {
        return ResponseFormatter.success({
          total: 0,
          published: 0,
          draft: 0,
          bySubcategory: []
        }, 'Modulo custom-forms disabilitato');
      }

      const [total, published, draft, bySubcategory] = await Promise.all([
        prisma.customForm.count(),
        prisma.customForm.count({ where: { isPublished: true } }),
        prisma.customForm.count({ where: { isPublished: false } }),
        prisma.customForm.groupBy({
          by: ['subcategoryId'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } }
        })
      ]);

      const stats = {
        total,
        published,
        draft,
        bySubcategory
      };

      return ResponseFormatter.success(stats, 'Statistiche custom forms recuperate con successo');
    } catch (error) {
      console.error('Errore nel recupero delle statistiche:', error);
      return ResponseFormatter.error('Errore nel recupero delle statistiche');
    }
  }

  /**
   * Imposta un custom form come default per una sottocategoria
   */
  async setDefaultCustomForm(id: string, subcategoryId: string, setBy: string, req?: any) {
    try {
      const isEnabled = await this.isModuleEnabled();
      if (!isEnabled) {
        return ResponseFormatter.error('Modulo custom-forms disabilitato');
      }

      // Verifica che il custom form esista
      const customForm = await prisma.customForm.findUnique({
        where: { id }
      });

      if (!customForm) {
        return ResponseFormatter.error('Custom form non trovato');
      }

      // Verifica che il custom form sia pubblicato
      if (!customForm.isPublished) {
        return ResponseFormatter.error('Solo i custom form pubblicati possono essere impostati come default');
      }

      // Rimuovi il flag default da tutti gli altri custom form della stessa sottocategoria
      await prisma.customForm.updateMany({
        where: {
          subcategoryId: subcategoryId,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      });

      // Imposta il custom form corrente come default
      const updatedCustomForm = await prisma.customForm.update({
        where: { id },
        data: {
          isDefault: true,
          subcategoryId: subcategoryId // Assicurati che sia associato alla sottocategoria corretta
        },
        include: {
          Fields: {
            orderBy: { displayOrder: 'asc' }
          },
          Subcategory: {
            select: { id: true, name: true }
          },
          Professional: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      });

      // ✅ Audit Log Integration
      const requestInfo = req ? auditLogService.extractRequestInfo(req) : {};
      await auditLogService.log({
        ...requestInfo,
        userId: setBy,
        ipAddress: requestInfo.ipAddress || 'system',
        userAgent: requestInfo.userAgent || 'custom-form-service',
        action: 'UPDATE' as any,
        entityType: 'CustomForm',
        entityId: id,
        newValues: {
          isDefault: true,
          subcategoryId
        },
        success: true,
        severity: 'INFO' as any,
        category: 'BUSINESS' as any
      });

      // ✅ Notification Integration
      // Notifica il creatore del form
      if (customForm.createdBy !== setBy) {
        await notificationService.sendToUser({
          userId: customForm.createdBy,
          type: 'custom_form_set_default',
          title: 'Form Impostato come Default',
          message: `Il form "${customForm.name}" è ora il form di default per la categoria`,
          data: {
            formId: id,
            formName: customForm.name,
            subcategoryId
          },
          priority: 'normal',
          channels: ['websocket']
        });
      }

      return ResponseFormatter.success(updatedCustomForm, 'Custom form impostato come default con successo');
    } catch (error) {
      console.error('Errore nell\'impostazione del custom form come default:', error);
      
      // Log errore
      const requestInfo = req ? auditLogService.extractRequestInfo(req) : {};
      await auditLogService.log({
        ...requestInfo,
        userId: setBy,
        ipAddress: requestInfo.ipAddress || 'system',
        userAgent: requestInfo.userAgent || 'custom-form-service',
        action: 'UPDATE' as any,
        entityType: 'CustomForm',
        entityId: id,
        success: false,
        errorMessage: (error as Error).message,
        severity: 'ERROR' as any,
        category: 'BUSINESS' as any
      });
      
      return ResponseFormatter.error('Errore nell\'impostazione del custom form come default');
    }
  }

  /**
   * Ottiene tutti i template condivisi
   * Templates sono form pubblicati marcati come template
   */
  async getTemplates(filters: { subcategoryId?: string; search?: string } = {}) {
    try {
      const isEnabled = await this.isModuleEnabled();
      if (!isEnabled) {
        return ResponseFormatter.success([], 'Modulo custom-forms disabilitato');
      }

      const where: any = {
        isTemplate: true,
        isPublished: true
      };

      if (filters.subcategoryId) {
        where.subcategoryId = filters.subcategoryId;
      }

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      const templates = await prisma.customForm.findMany({
        where,
        include: {
          Fields: {
            orderBy: { displayOrder: 'asc' }
          },
          Subcategory: {
            select: { id: true, name: true }
          },
          CreatedBy: {
            select: { id: true, firstName: true, lastName: true }
          }
        },
        orderBy: [
          { usageCount: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      return ResponseFormatter.success(templates, 'Template recuperati con successo');
    } catch (error) {
      console.error('Errore nel recupero dei template:', error);
      return ResponseFormatter.error('Errore nel recupero dei template');
    }
  }

  /**
   * Clona un template/form esistente
   * Crea una nuova copia per il professionista
   */
  async cloneForm(formId: string, clonedBy: string, newName?: string, req?: any) {
    try {
      const isEnabled = await this.isModuleEnabled();
      if (!isEnabled) {
        return ResponseFormatter.error('Modulo custom-forms disabilitato');
      }

      // Recupera il form originale
      const originalForm = await prisma.customForm.findUnique({
        where: { id: formId },
        include: {
          Fields: {
            orderBy: { displayOrder: 'asc' }
          }
        }
      });

      if (!originalForm) {
        return ResponseFormatter.error('Form originale non trovato');
      }

      // Verifica che sia pubblicato (solo i form pubblicati possono essere clonati)
      if (!originalForm.isPublished) {
        return ResponseFormatter.error('Solo i form pubblicati possono essere clonati');
      }

      // Crea il clone in transazione
      const clonedForm = await prisma.$transaction(async (tx) => {
        // Crea il nuovo form
        const newForm = await tx.customForm.create({
          data: {
            name: newName || `${originalForm.name} (Copia)`,
            description: originalForm.description,
            subcategoryId: originalForm.subcategoryId,
            professionalId: clonedBy,
            displayType: originalForm.displayType,
            createdBy: clonedBy,
            version: 1,
            isDefault: false,
            isPublished: false,
            isTemplate: false // Il clone non è un template
          }
        });

        // Clona tutti i campi
        const clonedFields = await Promise.all(
          originalForm.Fields.map(field => 
            tx.customFormField.create({
              data: {
                customFormId: newForm.id,
                code: field.code,
                label: field.label,
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
              }
            })
          )
        );

        // Incrementa il contatore di utilizzo del form originale
        await tx.customForm.update({
          where: { id: formId },
          data: {
            usageCount: { increment: 1 }
          }
        });

        return { ...newForm, Fields: clonedFields };
      });

      // ✅ Audit Log
      const requestInfo = req ? auditLogService.extractRequestInfo(req) : {};
      await auditLogService.log({
        ...requestInfo,
        userId: clonedBy,
        ipAddress: requestInfo.ipAddress || 'system',
        userAgent: requestInfo.userAgent || 'custom-form-service',
        action: 'CREATE' as any,
        entityType: 'CustomForm',
        entityId: clonedForm.id,
        newValues: {
          name: clonedForm.name,
          clonedFrom: formId,
          originalName: originalForm.name
        },
        success: true,
        severity: 'INFO' as any,
        category: 'BUSINESS' as any
      });

      // ✅ Notification
      await notificationService.sendToUser({
        userId: clonedBy,
        type: 'custom_form_cloned',
        title: 'Form Clonato',
        message: `Il form "${originalForm.name}" è stato clonato con successo`,
        data: {
          formId: clonedForm.id,
          formName: clonedForm.name,
          originalFormId: formId
        },
        priority: 'normal',
        channels: ['websocket']
      });

      return ResponseFormatter.success(clonedForm, 'Form clonato con successo');
    } catch (error) {
      console.error('Errore nella clonazione del form:', error);
      
      // Log errore
      const requestInfo = req ? auditLogService.extractRequestInfo(req) : {};
      await auditLogService.log({
        ...requestInfo,
        userId: clonedBy,
        ipAddress: requestInfo.ipAddress || 'system',
        userAgent: requestInfo.userAgent || 'custom-form-service',
        action: 'CREATE' as any,
        entityType: 'CustomForm',
        success: false,
        errorMessage: (error as Error).message,
        severity: 'ERROR' as any,
        category: 'BUSINESS' as any
      });
      
      return ResponseFormatter.error('Errore nella clonazione del form');
    }
  }

  /**
   * Marca un form come template condiviso
   * Solo gli admin possono creare template
   */
  async markAsTemplate(formId: string, markedBy: string, req?: any) {
    try {
      const isEnabled = await this.isModuleEnabled();
      if (!isEnabled) {
        return ResponseFormatter.error('Modulo custom-forms disabilitato');
      }

      // Recupera il form
      const form = await prisma.customForm.findUnique({
        where: { id: formId }
      });

      if (!form) {
        return ResponseFormatter.error('Form non trovato');
      }

      // Verifica che sia pubblicato
      if (!form.isPublished) {
        return ResponseFormatter.error('Solo i form pubblicati possono diventare template');
      }

      // Marca come template
      const templateForm = await prisma.customForm.update({
        where: { id: formId },
        data: {
          isTemplate: true,
          professionalId: null // I template non appartengono a un professionista specifico
        },
        include: {
          Fields: {
            orderBy: { displayOrder: 'asc' }
          }
        }
      });

      // ✅ Audit Log
      const requestInfo = req ? auditLogService.extractRequestInfo(req) : {};
      await auditLogService.log({
        ...requestInfo,
        userId: markedBy,
        ipAddress: requestInfo.ipAddress || 'system',
        userAgent: requestInfo.userAgent || 'custom-form-service',
        action: 'UPDATE' as any,
        entityType: 'CustomForm',
        entityId: formId,
        newValues: {
          isTemplate: true,
          formName: form.name
        },
        success: true,
        severity: 'INFO' as any,
        category: 'BUSINESS' as any
      });

      return ResponseFormatter.success(templateForm, 'Form marcato come template con successo');
    } catch (error) {
      console.error('Errore nel marcare il form come template:', error);
      return ResponseFormatter.error('Errore nel marcare il form come template');
    }
  }

  /**
   * Rimuove il flag template da un form
   */
  async unmarkAsTemplate(formId: string, unmarkedBy: string, req?: any) {
    try {
      const isEnabled = await this.isModuleEnabled();
      if (!isEnabled) {
        return ResponseFormatter.error('Modulo custom-forms disabilitato');
      }

      const form = await prisma.customForm.update({
        where: { id: formId },
        data: {
          isTemplate: false
        }
      });

      // ✅ Audit Log
      const requestInfo = req ? auditLogService.extractRequestInfo(req) : {};
      await auditLogService.log({
        ...requestInfo,
        userId: unmarkedBy,
        ipAddress: requestInfo.ipAddress || 'system',
        userAgent: requestInfo.userAgent || 'custom-form-service',
        action: 'UPDATE' as any,
        entityType: 'CustomForm',
        entityId: formId,
        newValues: {
          isTemplate: false
        },
        success: true,
        severity: 'INFO' as any,
        category: 'BUSINESS' as any
      });

      return ResponseFormatter.success(form, 'Template disattivato con successo');
    } catch (error) {
      console.error('Errore nel rimuovere il template:', error);
      return ResponseFormatter.error('Errore nel rimuovere il template');
    }
  }

  /**
   * Invia un form a una richiesta di assistenza
   */
  async sendFormToRequest(formId: string, requestId: string, sentBy: string, req?: any) {
    try {
      const isEnabled = await this.isModuleEnabled();
      if (!isEnabled) {
        return ResponseFormatter.error('Modulo custom-forms disabilitato');
      }

      // Verifica che il form esista ed sia pubblicato
      const form = await prisma.customForm.findUnique({
        where: { id: formId }
      });

      if (!form) {
        return ResponseFormatter.error('Form non trovato');
      }

      if (!form.isPublished) {
        return ResponseFormatter.error('Solo i form pubblicati possono essere inviati');
      }

      // Verifica che la richiesta esista
      const request = await prisma.assistanceRequest.findUnique({
        where: { id: requestId }
      });

      if (!request) {
        return ResponseFormatter.error('Richiesta non trovata');
      }

      // Crea l'associazione (permettiamo invii multipli dello stesso form)
      const requestForm = await prisma.requestCustomForm.create({
        data: {
          requestId,
          customFormId: formId,
          isCompleted: false
        },
        include: {
          CustomForm: {
            include: {
              Fields: {
                orderBy: { displayOrder: 'asc' }
              }
            }
          },
          Request: {
            select: {
              id: true,
              title: true,
              client: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        }
      });

      // ✅ Audit Log
      const requestInfo = req ? auditLogService.extractRequestInfo(req) : {};
      await auditLogService.log({
        ...requestInfo,
        userId: sentBy,
        ipAddress: requestInfo.ipAddress || 'system',
        userAgent: requestInfo.userAgent || 'custom-form-service',
        action: 'CREATE' as any,
        entityType: 'RequestCustomForm',
        entityId: requestForm.id,
        newValues: {
          formId,
          formName: form.name,
          requestId,
          requestTitle: request.title
        },
        success: true,
        severity: 'INFO' as any,
        category: 'BUSINESS' as any
      });

      // ✅ Notification al cliente
      if (requestForm.Request.client) {
        await notificationService.sendToUser({
          userId: requestForm.Request.client.id,
          type: 'custom_form_sent',
          title: 'Nuovo Form da Compilare',
          message: `Il professionista ti ha inviato il form "${form.name}" per la richiesta "${request.title}"`,
          data: {
            formId,
            formName: form.name,
            requestId,
            requestTitle: request.title,
            requestFormId: requestForm.id
          },
          priority: 'normal',
          channels: ['websocket', 'email']
        });
      }

      return ResponseFormatter.success(requestForm, 'Form inviato con successo al cliente');
    } catch (error) {
      console.error('Errore nell\'invio del form:', error);
      
      // Log errore
      const requestInfo = req ? auditLogService.extractRequestInfo(req) : {};
      await auditLogService.log({
        ...requestInfo,
        userId: sentBy,
        ipAddress: requestInfo.ipAddress || 'system',
        userAgent: requestInfo.userAgent || 'custom-form-service',
        action: 'CREATE' as any,
        entityType: 'RequestCustomForm',
        success: false,
        errorMessage: (error as Error).message,
        severity: 'ERROR' as any,
        category: 'BUSINESS' as any
      });
      
      return ResponseFormatter.error('Errore nell\'invio del form');
    }
  }

  /**
   * Ottiene tutti i form inviati per una richiesta
   */
  async getRequestForms(requestId: string) {
    try {
      const isEnabled = await this.isModuleEnabled();
      if (!isEnabled) {
        return ResponseFormatter.success([], 'Modulo custom-forms disabilitato');
      }

      const requestForms = await prisma.requestCustomForm.findMany({
        where: { requestId },
        include: {
          CustomForm: {
            include: {
              Fields: {
                orderBy: { displayOrder: 'asc' }
              },
              Subcategory: {
                select: { id: true, name: true }
              }
            }
          },
          Request: {
            select: {
              id: true,
              requestNumber: true,
              professional: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          SubmittedBy: {
            select: { id: true, firstName: true, lastName: true }
          },
          Responses: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return ResponseFormatter.success(requestForms, 'Form della richiesta recuperati con successo');
    } catch (error) {
      console.error('Errore nel recupero dei form della richiesta:', error);
      return ResponseFormatter.error('Errore nel recupero dei form');
    }
  }

  /**
   * Salva le risposte parziali (bozza) del form
   */
  async saveDraft(requestCustomFormId: string, responses: any[], savedBy: string, req?: any) {
    try {
      const isEnabled = await this.isModuleEnabled();
      if (!isEnabled) {
        return ResponseFormatter.error('Modulo custom-forms disabilitato');
      }

      // Verifica che il requestCustomForm esista
      const requestForm = await prisma.requestCustomForm.findUnique({
        where: { id: requestCustomFormId }
      });

      if (!requestForm) {
        return ResponseFormatter.error('Form richiesta non trovato');
      }

      // Elimina le risposte esistenti e inserisci le nuove
      await prisma.$transaction(async (tx) => {
        // Elimina risposte esistenti
        await tx.requestCustomFormResponse.deleteMany({
          where: { requestCustomFormId }
        });

        // Inserisci nuove risposte
        if (responses && responses.length > 0) {
          await tx.requestCustomFormResponse.createMany({
            data: responses.map(r => ({
              requestCustomFormId,
              fieldId: r.fieldId,
              fieldName: r.fieldName,
              fieldType: r.fieldType,
              value: r.value,
              valueJson: r.valueJson
            }))
          });
        }
      });

      return ResponseFormatter.success(null, 'Bozza salvata con successo');
    } catch (error) {
      console.error('Errore nel salvataggio della bozza:', error);
      return ResponseFormatter.error('Errore nel salvataggio');
    }
  }

  /**
   * Invia le risposte finali del form (marca come completato)
   */
  async submitForm(requestCustomFormId: string, responses: any[], submittedBy: string, req?: any) {
    try {
      const isEnabled = await this.isModuleEnabled();
      if (!isEnabled) {
        return ResponseFormatter.error('Modulo custom-forms disabilitato');
      }

      // Verifica che il requestCustomForm esista
      const requestForm = await prisma.requestCustomForm.findUnique({
        where: { id: requestCustomFormId },
        include: {
          CustomForm: {
            include: {
              Fields: true
            }
          },
          Request: {
            select: {
              id: true,
              title: true,
              professionalId: true
            }
          }
        }
      });

      if (!requestForm) {
        return ResponseFormatter.error('Form richiesta non trovato');
      }

      // Validazione: verifica campi obbligatori
      const requiredFields = requestForm.CustomForm.Fields.filter(f => f.isRequired);
      const responseFieldIds = responses.map(r => r.fieldId);
      const missingFields = requiredFields.filter(f => !responseFieldIds.includes(f.id));

      if (missingFields.length > 0) {
        return ResponseFormatter.error(`Campi obbligatori mancanti: ${missingFields.map(f => f.label).join(', ')}`);
      }

      // Salva risposte e marca come completato
      await prisma.$transaction(async (tx) => {
        // Elimina risposte esistenti
        await tx.requestCustomFormResponse.deleteMany({
          where: { requestCustomFormId }
        });

        // Inserisci nuove risposte
        await tx.requestCustomFormResponse.createMany({
          data: responses.map(r => ({
            requestCustomFormId,
            fieldId: r.fieldId,
            fieldName: r.fieldName,
            fieldType: r.fieldType,
            value: r.value,
            valueJson: r.valueJson
          }))
        });

        // Marca come completato
        await tx.requestCustomForm.update({
          where: { id: requestCustomFormId },
          data: {
            isCompleted: true,
            submittedAt: new Date(),
            submittedBy
          }
        });
      });

      // ✅ Audit Log
      const requestInfo = req ? auditLogService.extractRequestInfo(req) : {};
      await auditLogService.log({
        ...requestInfo,
        userId: submittedBy,
        ipAddress: requestInfo.ipAddress || 'system',
        userAgent: requestInfo.userAgent || 'custom-form-service',
        action: 'UPDATE' as any,
        entityType: 'RequestCustomForm',
        entityId: requestCustomFormId,
        newValues: {
          isCompleted: true,
          responsesCount: responses.length
        },
        success: true,
        severity: 'INFO' as any,
        category: 'BUSINESS' as any
      });

      // ✅ Notification al professional
      if (requestForm.Request.professionalId) {
        await notificationService.sendToUser({
          userId: requestForm.Request.professionalId,
          type: 'custom_form_completed',
          title: 'Form Completato',
          message: `Il cliente ha completato il form "${requestForm.CustomForm.name}" per la richiesta "${requestForm.Request.title}"`,
          data: {
            formId: requestForm.customFormId,
            formName: requestForm.CustomForm.name,
            requestId: requestForm.requestId,
            requestTitle: requestForm.Request.title,
            requestFormId: requestCustomFormId
          },
          priority: 'normal',
          channels: ['websocket', 'email']
        });
      }

      return ResponseFormatter.success(null, 'Form completato con successo');
    } catch (error) {
      console.error('Errore nell\'invio del form:', error);
      
      // Log errore
      const requestInfo = req ? auditLogService.extractRequestInfo(req) : {};
      await auditLogService.log({
        ...requestInfo,
        userId: submittedBy,
        ipAddress: requestInfo.ipAddress || 'system',
        userAgent: requestInfo.userAgent || 'custom-form-service',
        action: 'UPDATE' as any,
        entityType: 'RequestCustomForm',
        success: false,
        errorMessage: (error as Error).message,
        severity: 'ERROR' as any,
        category: 'BUSINESS' as any
      });
      
      return ResponseFormatter.error('Errore nell\'invio del form');
    }
  }
}

export const customFormService = new CustomFormService();