/**
 * Custom Form Sending Service
 * Gestisce l'invio di form a richieste e la compilazione da parte dei clienti
 * 
 * @module services/customFormSending
 * @version 1.0.2
 * 
 * ⚠️ NOTA: Questo service usa ResponseFormatter che andrebbe solo nelle routes.
 * In futuro andrà refactorizzato per ritornare dati diretti e lanciare errori.
 */

import { prisma } from '../config/database';
import type { CustomFormFieldType, Prisma } from '@prisma/client';
import type { Request } from 'express';
import { ResponseFormatter } from '../utils/responseFormatter';
import { auditLogService } from './auditLog.service';
import { notificationService } from './notification.service';
import { moduleService } from './module.service';

export interface SendFormToRequestData {
  requestId: string;
  customFormId: string;
  senderId: string;
}

export interface SubmitFormResponseData {
  requestCustomFormId: string;
  responses: Array<{
    fieldId: string;
    fieldName: string;
    fieldType: CustomFormFieldType;
    value?: string;
    valueJson?: unknown;
  }>;
  submittedBy: string;
}

export interface RequestCustomFormWithDetails {
  id: string;
  requestId: string;
  customFormId: string;
  isCompleted: boolean;
  submittedAt: Date | null;
  submittedBy: string | null;
  CustomForm: {
    id: string;
    name: string;
    description: string | null;
    CustomFormField: Array<{
      id: string;
      code: string;
      label: string;
      fieldType: CustomFormFieldType;
      isRequired: boolean;
      config: unknown;
      possibleValues: unknown;
    }>;
  };
  RequestCustomFormResponse: Array<{
    id: string;
    fieldId: string;
    fieldName: string;
    fieldType: CustomFormFieldType;
    value: string | null;
    valueJson: unknown;
  }>;
}

// Helper per estrarre messaggio di errore
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error instanceof Error ? error.message : String(error);
  }
  return String(error);
}

class CustomFormSendingService {
  /**
   * Verifica se il modulo custom-forms è abilitato
   */
  async isModuleEnabled(): Promise<boolean> {
    try {
      return await moduleService.isModuleEnabled('custom-forms');
    } catch (error: unknown) {
      console.error('Errore verifica modulo custom-forms:', error);
      return false;
    }
  }

  /**
   * Invia un custom form a una richiesta specifica
   * Il professionista invia il form al cliente dopo l'assegnazione
   */
  async sendFormToRequest(data: SendFormToRequestData, req?: unknown): Promise<unknown> {
    try {
      const isEnabled = await this.isModuleEnabled();
      if (!isEnabled) {
        return ResponseFormatter.error('Modulo custom-forms disabilitato');
      }

      // Validazione dati
      if (!data.requestId || !data.customFormId || !data.senderId) {
        return ResponseFormatter.error('Dati obbligatori mancanti');
      }

      // Verifica che la richiesta esista
      const request = await prisma.assistanceRequest.findUnique({
        where: { id: data.requestId },
        include: {
          client: {
            select: { id: true, email: true, firstName: true, lastName: true }
          },
          professional: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      });

      if (!request) {
        return ResponseFormatter.error('Richiesta non trovata');
      }

      // Verifica che il sender sia il professionista assegnato
      if (request.professionalId !== data.senderId) {
        return ResponseFormatter.error('Solo il professionista assegnato può inviare form');
      }

      // Verifica che il form esista ed è pubblicato
      const customForm = await prisma.customForm.findUnique({
        where: { id: data.customFormId },
        include: {
          CustomFormField: {
            orderBy: { displayOrder: 'asc' }
          }
        }
      });

      if (!customForm) {
        return ResponseFormatter.error('Form non trovato');
      }

      if (!customForm.isPublished) {
        return ResponseFormatter.error('Solo i form pubblicati possono essere inviati');
      }

      // Verifica se il form è già stato inviato a questa richiesta
      const existing = await prisma.requestCustomForm.findUnique({
        where: {
          requestId_customFormId: {
            requestId: data.requestId,
            customFormId: data.customFormId
          }
        }
      });

      if (existing) {
        return ResponseFormatter.error('Form già inviato a questa richiesta');
      }

      // Crea il collegamento tra form e richiesta
      const requestCustomForm = await prisma.requestCustomForm.create({
        data: {
          id: `rcf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          requestId: data.requestId,
          customFormId: data.customFormId,
          isCompleted: false,
          updatedAt: new Date()
        },
        include: {
          CustomForm: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        }
      });

      // ✅ Audit Log
      const requestInfo = req ? auditLogService.extractRequestInfo(req as unknown as Request) : {};
      await auditLogService.log({
        ...requestInfo,
        userId: data.senderId,
        ipAddress: (requestInfo as Record<string, unknown>).ipAddress as string || 'system',
        userAgent: (requestInfo as Record<string, unknown>).userAgent as string || 'custom-form-sending-service',
        action: 'CREATE',
        entityType: 'RequestCustomForm',
        entityId: requestCustomForm.id,
        newValues: {
          requestId: data.requestId,
          customFormId: data.customFormId,
          formName: customForm.name
        },
        success: true,
        severity: 'INFO',
        category: 'BUSINESS'
      });

      // ✅ Notifica il cliente
      await notificationService.sendToUser({
        userId: request.clientId,
        type: 'custom_form_received',
        title: 'Nuovo Modulo da Compilare',
        message: `Il professionista ${request.professional?.firstName || ''} ti ha inviato il modulo "${customForm.name}" da compilare`,
        data: {
          requestId: data.requestId,
          formId: customForm.id,
          formName: customForm.name,
          requestCustomFormId: requestCustomForm.id
        },
        priority: 'high',
        channels: ['websocket', 'email']
      });

      return ResponseFormatter.success(
        requestCustomForm,
        'Form inviato con successo al cliente'
      );
    } catch (error: unknown) {
      console.error('Errore nell\'invio del form:', error);
      
      // Log errore
      const requestInfo = req ? auditLogService.extractRequestInfo(req as unknown as Request) : {};
      await auditLogService.log({
        ...requestInfo,
        userId: data.senderId,
        ipAddress: (requestInfo as Record<string, unknown>).ipAddress as string || 'system',
        userAgent: (requestInfo as Record<string, unknown>).userAgent as string || 'custom-form-sending-service',
        action: 'CREATE',
        entityType: 'RequestCustomForm',
        success: false,
        errorMessage: getErrorMessage(error),
        severity: 'ERROR',
        category: 'BUSINESS'
      });
      
      return ResponseFormatter.error('Errore nell\'invio del form');
    }
  }

  /**
   * Ottiene tutti i form inviati a una richiesta specifica
   */
  async getRequestForms(requestId: string): Promise<unknown> {
    try {
      const isEnabled = await this.isModuleEnabled();
      if (!isEnabled) {
        return ResponseFormatter.success([], 'Modulo custom-forms disabilitato');
      }

      const requestForms = await prisma.requestCustomForm.findMany({
        where: { requestId },
        include: {
          CustomForm: {
            select: {
              id: true,
              name: true,
              description: true,
              displayType: true,
              CustomFormField: {
                orderBy: { displayOrder: 'asc' },
                select: {
                  id: true,
                  code: true,
                  label: true,
                  fieldType: true,
                  isRequired: true,
                  isReadonly: true,
                  isHidden: true,
                  config: true,
                  validationRules: true,
                  possibleValues: true,
                  defaultValue: true,
                  showIf: true,
                  requiredIf: true,
                  displayOrder: true,
                  columnSpan: true,
                  rowNumber: true,
                  groupName: true,
                  sectionCode: true
                }
              }
            }
          },
          RequestCustomFormResponse: {
            select: {
              id: true,
              fieldId: true,
              fieldName: true,
              fieldType: true,
              value: true,
              valueJson: true
            }
          },
          User: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          AssistanceRequest: {
            select: {
              professional: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return ResponseFormatter.success(
        requestForms,
        'Form della richiesta recuperati con successo'
      );
    } catch (error: unknown) {
      console.error('Errore nel recupero dei form della richiesta:', error);
      return ResponseFormatter.error('Errore nel recupero dei form');
    }
  }

  /**
   * Ottiene un form specifico con le risposte
   */
  async getFormWithResponses(requestCustomFormId: string): Promise<unknown> {
    try {
      const isEnabled = await this.isModuleEnabled();
      if (!isEnabled) {
        return ResponseFormatter.error('Modulo custom-forms disabilitato');
      }

      const requestForm = await prisma.requestCustomForm.findUnique({
        where: { id: requestCustomFormId },
        include: {
          CustomForm: {
            include: {
              CustomFormField: {
                orderBy: { displayOrder: 'asc' }
              }
            }
          },
          RequestCustomFormResponse: true,
          AssistanceRequest: {
            select: {
              id: true,
              title: true,
              clientId: true,
              professionalId: true
            }
          }
        }
      });

      if (!requestForm) {
        return ResponseFormatter.error('Form non trovato');
      }

      return ResponseFormatter.success(
        requestForm,
        'Form recuperato con successo'
      );
    } catch (error: unknown) {
      console.error('Errore nel recupero del form:', error);
      return ResponseFormatter.error('Errore nel recupero del form');
    }
  }

  /**
   * Salva le risposte di un form (save draft)
   * Permette salvataggi parziali senza completare il form
   */
  async saveFormResponses(data: SubmitFormResponseData, req?: unknown): Promise<unknown> {
    try {
      const isEnabled = await this.isModuleEnabled();
      if (!isEnabled) {
        return ResponseFormatter.error('Modulo custom-forms disabilitato');
      }

      // Verifica che il form esista
      const requestForm = await prisma.requestCustomForm.findUnique({
        where: { id: data.requestCustomFormId },
        include: {
          AssistanceRequest: {
            select: { clientId: true, professionalId: true }
          },
          CustomForm: {
            select: { name: true }
          }
        }
      });

      if (!requestForm) {
        return ResponseFormatter.error('Form non trovato');
      }

      // Salva le risposte in transazione
      const savedResponses = await prisma.$transaction(async (tx) => {
        const responses: unknown[] = [];
        
        for (const response of data.responses) {
          const saved = await tx.requestCustomFormResponse.upsert({
            where: {
              requestCustomFormId_fieldId: {
                requestCustomFormId: data.requestCustomFormId,
                fieldId: response.fieldId
              }
            },
            create: {
              id: `rcfr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              requestCustomFormId: data.requestCustomFormId,
              fieldId: response.fieldId,
              fieldName: response.fieldName,
              fieldType: response.fieldType,
              value: response.value,
              valueJson: response.valueJson as Prisma.InputJsonValue,
              updatedAt: new Date()
            },
            update: {
              value: response.value,
              valueJson: response.valueJson as Prisma.InputJsonValue,
              updatedAt: new Date()
            }
          });
          
          responses.push(saved);
        }
        
        return responses;
      });

      // ✅ Audit Log
      const requestInfo = req ? auditLogService.extractRequestInfo(req as unknown as Request) : {};
      await auditLogService.log({
        ...requestInfo,
        userId: data.submittedBy,
        ipAddress: (requestInfo as Record<string, unknown>).ipAddress as string || 'system',
        userAgent: (requestInfo as Record<string, unknown>).userAgent as string || 'custom-form-sending-service',
        action: 'UPDATE',
        entityType: 'RequestCustomFormResponse',
        entityId: data.requestCustomFormId,
        newValues: {
          responsesCount: data.responses.length,
          isDraft: true
        },
        success: true,
        severity: 'INFO',
        category: 'BUSINESS'
      });

      return ResponseFormatter.success(
        savedResponses,
        'Risposte salvate come bozza'
      );
    } catch (error: unknown) {
      console.error('Errore nel salvataggio delle risposte:', error);
      return ResponseFormatter.error('Errore nel salvataggio delle risposte');
    }
  }

  /**
   * Completa la compilazione del form (submit final)
   * Marca il form come completato e notifica il professionista
   */
  async submitFormResponse(data: SubmitFormResponseData, req?: unknown): Promise<unknown> {
    try {
      const isEnabled = await this.isModuleEnabled();
      if (!isEnabled) {
        return ResponseFormatter.error('Modulo custom-forms disabilitato');
      }

      // Verifica che il form esista
      const requestForm = await prisma.requestCustomForm.findUnique({
        where: { id: data.requestCustomFormId },
        include: {
          AssistanceRequest: {
            select: { 
              clientId: true, 
              professionalId: true,
              title: true
            }
          },
          CustomForm: {
            select: { 
              name: true,
              CustomFormField: {
                where: { isRequired: true },
                select: { id: true, code: true, label: true }
              }
            }
          }
        }
      });

      if (!requestForm) {
        return ResponseFormatter.error('Form non trovato');
      }

      // Verifica che tutte le risposte obbligatorie siano presenti
      const requiredFieldIds = requestForm.CustomForm.CustomFormField.map((f) => f.id);
      const providedFieldIds = data.responses.map((r) => r.fieldId);
      const missingFields = requiredFieldIds.filter((id: string) => !providedFieldIds.includes(id));

      if (missingFields.length > 0) {
        return ResponseFormatter.error(
          'Campi obbligatori mancanti',
          'VALIDATION_ERROR',
          { missingFields }
        );
      }

      // Salva le risposte e marca come completato in transazione
      const result = await prisma.$transaction(async (tx) => {
        // Salva tutte le risposte
        const responses: unknown[] = [];
        for (const response of data.responses) {
          const saved = await tx.requestCustomFormResponse.upsert({
            where: {
              requestCustomFormId_fieldId: {
                requestCustomFormId: data.requestCustomFormId,
                fieldId: response.fieldId
              }
            },
            create: {
              id: `rcfr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              requestCustomFormId: data.requestCustomFormId,
              fieldId: response.fieldId,
              fieldName: response.fieldName,
              fieldType: response.fieldType,
              value: response.value,
              valueJson: response.valueJson as Prisma.InputJsonValue,
              updatedAt: new Date()
            },
            update: {
              value: response.value,
              valueJson: response.valueJson as Prisma.InputJsonValue,
              updatedAt: new Date()
            }
          });
          responses.push(saved);
        }

        // Marca il form come completato
        const completed = await tx.requestCustomForm.update({
          where: { id: data.requestCustomFormId },
          data: {
            isCompleted: true,
            submittedAt: new Date(),
            submittedBy: data.submittedBy
          }
        });

        return { completed, responses };
      });

      // ✅ Audit Log
      const requestInfo = req ? auditLogService.extractRequestInfo(req as unknown as Request) : {};
      await auditLogService.log({
        ...requestInfo,
        userId: data.submittedBy,
        ipAddress: (requestInfo as Record<string, unknown>).ipAddress as string || 'system',
        userAgent: (requestInfo as Record<string, unknown>).userAgent as string || 'custom-form-sending-service',
        action: 'UPDATE',
        entityType: 'RequestCustomForm',
        entityId: data.requestCustomFormId,
        newValues: {
          isCompleted: true,
          responsesCount: data.responses.length,
          formName: requestForm.CustomForm.name
        },
        success: true,
        severity: 'INFO',
        category: 'BUSINESS'
      });

      // ✅ Notifica il professionista
      if (requestForm.AssistanceRequest.professionalId) {
        await notificationService.sendToUser({
          userId: requestForm.AssistanceRequest.professionalId,
          type: 'custom_form_completed',
          title: 'Modulo Compilato dal Cliente',
          message: `Il cliente ha completato il modulo "${requestForm.CustomForm.name}" per la richiesta "${requestForm.AssistanceRequest.title}"`,
          data: {
            requestId: requestForm.requestId,
            formId: requestForm.customFormId,
            formName: requestForm.CustomForm.name,
            requestCustomFormId: data.requestCustomFormId
          },
          priority: 'high',
          channels: ['websocket', 'email']
        });
      }

      return ResponseFormatter.success(
        result.completed,
        'Form completato con successo'
      );
    } catch (error: unknown) {
      console.error('Errore nella compilazione del form:', error);
      
      // Log errore
      const requestInfo = req ? auditLogService.extractRequestInfo(req as unknown as Request) : {};
      await auditLogService.log({
        ...requestInfo,
        userId: data.submittedBy,
        ipAddress: (requestInfo as Record<string, unknown>).ipAddress as string || 'system',
        userAgent: (requestInfo as Record<string, unknown>).userAgent as string || 'custom-form-sending-service',
        action: 'UPDATE',
        entityType: 'RequestCustomForm',
        entityId: data.requestCustomFormId,
        success: false,
        errorMessage: getErrorMessage(error),
        severity: 'ERROR',
        category: 'BUSINESS'
      });
      
      return ResponseFormatter.error('Errore nella compilazione del form');
    }
  }

  /**
   * Elimina un form inviato a una richiesta
   * Solo il professionista che l'ha inviato può eliminarlo
   */
  async removeFormFromRequest(requestCustomFormId: string, userId: string, req?: unknown): Promise<unknown> {
    try {
      const isEnabled = await this.isModuleEnabled();
      if (!isEnabled) {
        return ResponseFormatter.error('Modulo custom-forms disabilitato');
      }

      // Verifica che il form esista
      const requestForm = await prisma.requestCustomForm.findUnique({
        where: { id: requestCustomFormId },
        include: {
          AssistanceRequest: {
            select: { professionalId: true }
          },
          CustomForm: {
            select: { name: true }
          }
        }
      });

      if (!requestForm) {
        return ResponseFormatter.error('Form non trovato');
      }

      // Verifica autorizzazione
      if (requestForm.AssistanceRequest.professionalId !== userId) {
        return ResponseFormatter.error('Non autorizzato a rimuovere questo form');
      }

      // Non permettere eliminazione se già compilato
      if (requestForm.isCompleted) {
        return ResponseFormatter.error('Non è possibile rimuovere un form già compilato');
      }

      // Elimina il form e le risposte in transazione
      await prisma.$transaction(async (tx) => {
        await tx.requestCustomFormResponse.deleteMany({
          where: { requestCustomFormId }
        });
        
        await tx.requestCustomForm.delete({
          where: { id: requestCustomFormId }
        });
      });

      // ✅ Audit Log
      const requestInfo = req ? auditLogService.extractRequestInfo(req as unknown as Request) : {};
      await auditLogService.log({
        ...requestInfo,
        userId,
        ipAddress: (requestInfo as Record<string, unknown>).ipAddress as string || 'system',
        userAgent: (requestInfo as Record<string, unknown>).userAgent as string || 'custom-form-sending-service',
        action: 'DELETE',
        entityType: 'RequestCustomForm',
        entityId: requestCustomFormId,
        oldValues: {
          formName: requestForm.CustomForm.name,
          isCompleted: requestForm.isCompleted
        },
        success: true,
        severity: 'WARNING',
        category: 'BUSINESS'
      });

      return ResponseFormatter.success(null, 'Form rimosso con successo');
    } catch (error: unknown) {
      console.error('Errore nella rimozione del form:', error);
      return ResponseFormatter.error('Errore nella rimozione del form');
    }
  }

  /**
   * Marca un form come verificato dal professionista
   * Solo il professionista della richiesta può verificare
   */
  async verifyForm(requestCustomFormId: string, userId: string, isVerified: boolean, req?: unknown): Promise<unknown> {
    try {
      // Verifica che il form esista
      const requestForm = await prisma.requestCustomForm.findUnique({
        where: { id: requestCustomFormId },
        include: {
          AssistanceRequest: {
            select: {
              id: true,
              title: true,
              professionalId: true
            }
          },
          CustomForm: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!requestForm) {
        return ResponseFormatter.error('Form non trovato');
      }

      // Verifica che l'utente sia il professionista assegnato alla richiesta
      if (requestForm.AssistanceRequest.professionalId !== userId) {
        return ResponseFormatter.error('Solo il professionista assegnato può verificare questo form');
      }

      // Verifica che il form sia stato completato
      if (!requestForm.isCompleted) {
        return ResponseFormatter.error('Impossibile verificare un form non ancora completato');
      }

      // Aggiorna il flag di verifica
      const updatedForm = await prisma.requestCustomForm.update({
        where: { id: requestCustomFormId },
        data: {
          isVerifiedByProfessional: isVerified,
          updatedAt: new Date()
        }
      });

      // ✅ Audit Log
      const requestInfo = req ? auditLogService.extractRequestInfo(req as unknown as Request) : {};
      await auditLogService.log({
        ...requestInfo,
        userId,
        ipAddress: (requestInfo as Record<string, unknown>).ipAddress as string || 'system',
        userAgent: (requestInfo as Record<string, unknown>).userAgent as string || 'custom-form-sending-service',
        action: 'UPDATE',
        entityType: 'RequestCustomForm',
        entityId: requestCustomFormId,
        newValues: {
          isVerifiedByProfessional: isVerified
        },
        success: true,
        severity: 'INFO',
        category: 'BUSINESS'
      });

      const message = isVerified 
        ? 'Form marcato come verificato correttamente'
        : 'Verifica form rimossa';

      return ResponseFormatter.success(updatedForm, message);
    } catch (error: unknown) {
      console.error('Errore nella verifica del form:', error);
      return ResponseFormatter.error('Errore nella verifica del form');
    }
  }
}

export const customFormSendingService = new CustomFormSendingService();
