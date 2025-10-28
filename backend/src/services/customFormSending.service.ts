/**
 * Custom Form Sending Service
 * Gestisce l'invio di form a richieste e la compilazione da parte dei clienti
 * 
 * @module services/customFormSending
 * @version 1.0.0
 */

import { PrismaClient, RequestCustomForm, RequestCustomFormResponse } from '@prisma/client';
import { ResponseFormatter } from '../utils/responseFormatter';
import { auditLogService } from './auditLog.service';
import { notificationService } from './notification.service';
import { moduleService } from './module.service';

const prisma = new PrismaClient();

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
    fieldType: string;
    value?: string;
    valueJson?: any;
  }>;
  submittedBy: string;
}

export interface RequestCustomFormWithDetails extends RequestCustomForm {
  CustomForm: {
    id: string;
    name: string;
    description: string | null;
    Fields: Array<{
      id: string;
      code: string;
      label: string;
      fieldType: string;
      isRequired: boolean;
      config: any;
      possibleValues: any;
    }>;
  };
  Responses: Array<{
    id: string;
    fieldId: string;
    fieldName: string;
    fieldType: string;
    value: string | null;
    valueJson: any;
  }>;
}

class CustomFormSendingService {
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
   * Invia un custom form a una richiesta specifica
   * Il professionista invia il form al cliente dopo l'assegnazione
   */
  async sendFormToRequest(data: SendFormToRequestData, req?: any) {
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
          Fields: {
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
          requestId: data.requestId,
          customFormId: data.customFormId,
          isCompleted: false
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
      const requestInfo = req ? auditLogService.extractRequestInfo(req) : {};
      await auditLogService.log({
        ...requestInfo,
        userId: data.senderId,
        ipAddress: requestInfo.ipAddress || 'system',
        userAgent: requestInfo.userAgent || 'custom-form-sending-service',
        action: 'CREATE' as any,
        entityType: 'RequestCustomForm',
        entityId: requestCustomForm.id,
        newValues: {
          requestId: data.requestId,
          customFormId: data.customFormId,
          formName: customForm.name
        },
        success: true,
        severity: 'INFO' as any,
        category: 'BUSINESS' as any
      });

      // ✅ Notifica il cliente
      await notificationService.sendToUser({
        userId: request.clientId,
        type: 'custom_form_received',
        title: 'Nuovo Modulo da Compilare',
        message: `Il professionista ${request.professional?.firstName} ti ha inviato il modulo "${customForm.name}" da compilare`,
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
    } catch (error) {
      console.error('Errore nell\'invio del form:', error);
      
      // Log errore
      const requestInfo = req ? auditLogService.extractRequestInfo(req) : {};
      await auditLogService.log({
        ...requestInfo,
        userId: data.senderId,
        ipAddress: requestInfo.ipAddress || 'system',
        userAgent: requestInfo.userAgent || 'custom-form-sending-service',
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
   * Ottiene tutti i form inviati a una richiesta specifica
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
            select: {
              id: true,
              name: true,
              description: true,
              displayType: true,
              Fields: {
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
          Responses: {
            select: {
              id: true,
              fieldId: true,
              fieldName: true,
              fieldType: true,
              value: true,
              valueJson: true
            }
          },
          SubmittedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          Request: {
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
    } catch (error) {
      console.error('Errore nel recupero dei form della richiesta:', error);
      return ResponseFormatter.error('Errore nel recupero dei form');
    }
  }

  /**
   * Ottiene un form specifico con le risposte
   */
  async getFormWithResponses(requestCustomFormId: string) {
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
              Fields: {
                orderBy: { displayOrder: 'asc' }
              }
            }
          },
          Responses: true,
          Request: {
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
    } catch (error) {
      console.error('Errore nel recupero del form:', error);
      return ResponseFormatter.error('Errore nel recupero del form');
    }
  }

  /**
   * Salva le risposte di un form (save draft)
   * Permette salvataggi parziali senza completare il form
   */
  async saveFormResponses(data: SubmitFormResponseData, req?: any) {
    try {
      const isEnabled = await this.isModuleEnabled();
      if (!isEnabled) {
        return ResponseFormatter.error('Modulo custom-forms disabilitato');
      }

      // Verifica che il form esista
      const requestForm = await prisma.requestCustomForm.findUnique({
        where: { id: data.requestCustomFormId },
        include: {
          Request: {
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
        const responses = [];
        
        for (const response of data.responses) {
          const saved = await tx.requestCustomFormResponse.upsert({
            where: {
              requestCustomFormId_fieldId: {
                requestCustomFormId: data.requestCustomFormId,
                fieldId: response.fieldId
              }
            },
            create: {
              requestCustomFormId: data.requestCustomFormId,
              fieldId: response.fieldId,
              fieldName: response.fieldName,
              fieldType: response.fieldType as any,
              value: response.value,
              valueJson: response.valueJson
            },
            update: {
              value: response.value,
              valueJson: response.valueJson,
              updatedAt: new Date()
            }
          });
          
          responses.push(saved);
        }
        
        return responses;
      });

      // ✅ Audit Log
      const requestInfo = req ? auditLogService.extractRequestInfo(req) : {};
      await auditLogService.log({
        ...requestInfo,
        userId: data.submittedBy,
        ipAddress: requestInfo.ipAddress || 'system',
        userAgent: requestInfo.userAgent || 'custom-form-sending-service',
        action: 'UPDATE' as any,
        entityType: 'RequestCustomFormResponse',
        entityId: data.requestCustomFormId,
        newValues: {
          responsesCount: data.responses.length,
          isDraft: true
        },
        success: true,
        severity: 'INFO' as any,
        category: 'BUSINESS' as any
      });

      return ResponseFormatter.success(
        savedResponses,
        'Risposte salvate come bozza'
      );
    } catch (error) {
      console.error('Errore nel salvataggio delle risposte:', error);
      return ResponseFormatter.error('Errore nel salvataggio delle risposte');
    }
  }

  /**
   * Completa la compilazione del form (submit final)
   * Marca il form come completato e notifica il professionista
   */
  async submitFormResponse(data: SubmitFormResponseData, req?: any) {
    try {
      const isEnabled = await this.isModuleEnabled();
      if (!isEnabled) {
        return ResponseFormatter.error('Modulo custom-forms disabilitato');
      }

      // Verifica che il form esista
      const requestForm = await prisma.requestCustomForm.findUnique({
        where: { id: data.requestCustomFormId },
        include: {
          Request: {
            select: { 
              clientId: true, 
              professionalId: true,
              title: true
            }
          },
          CustomForm: {
            select: { 
              name: true,
              Fields: {
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
      const requiredFieldIds = requestForm.CustomForm.Fields.map(f => f.id);
      const providedFieldIds = data.responses.map(r => r.fieldId);
      const missingFields = requiredFieldIds.filter(id => !providedFieldIds.includes(id));

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
        const responses = [];
        for (const response of data.responses) {
          const saved = await tx.requestCustomFormResponse.upsert({
            where: {
              requestCustomFormId_fieldId: {
                requestCustomFormId: data.requestCustomFormId,
                fieldId: response.fieldId
              }
            },
            create: {
              requestCustomFormId: data.requestCustomFormId,
              fieldId: response.fieldId,
              fieldName: response.fieldName,
              fieldType: response.fieldType as any,
              value: response.value,
              valueJson: response.valueJson
            },
            update: {
              value: response.value,
              valueJson: response.valueJson,
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
      const requestInfo = req ? auditLogService.extractRequestInfo(req) : {};
      await auditLogService.log({
        ...requestInfo,
        userId: data.submittedBy,
        ipAddress: requestInfo.ipAddress || 'system',
        userAgent: requestInfo.userAgent || 'custom-form-sending-service',
        action: 'UPDATE' as any,
        entityType: 'RequestCustomForm',
        entityId: data.requestCustomFormId,
        newValues: {
          isCompleted: true,
          responsesCount: data.responses.length,
          formName: requestForm.CustomForm.name
        },
        success: true,
        severity: 'INFO' as any,
        category: 'BUSINESS' as any
      });

      // ✅ Notifica il professionista
      if (requestForm.Request.professionalId) {
        await notificationService.sendToUser({
          userId: requestForm.Request.professionalId,
          type: 'custom_form_completed',
          title: 'Modulo Compilato dal Cliente',
          message: `Il cliente ha completato il modulo "${requestForm.CustomForm.name}" per la richiesta "${requestForm.Request.title}"`,
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
    } catch (error) {
      console.error('Errore nella compilazione del form:', error);
      
      // Log errore
      const requestInfo = req ? auditLogService.extractRequestInfo(req) : {};
      await auditLogService.log({
        ...requestInfo,
        userId: data.submittedBy,
        ipAddress: requestInfo.ipAddress || 'system',
        userAgent: requestInfo.userAgent || 'custom-form-sending-service',
        action: 'UPDATE' as any,
        entityType: 'RequestCustomForm',
        entityId: data.requestCustomFormId,
        success: false,
        errorMessage: (error as Error).message,
        severity: 'ERROR' as any,
        category: 'BUSINESS' as any
      });
      
      return ResponseFormatter.error('Errore nella compilazione del form');
    }
  }

  /**
   * Elimina un form inviato a una richiesta
   * Solo il professionista che l'ha inviato può eliminarlo
   */
  async removeFormFromRequest(requestCustomFormId: string, userId: string, req?: any) {
    try {
      const isEnabled = await this.isModuleEnabled();
      if (!isEnabled) {
        return ResponseFormatter.error('Modulo custom-forms disabilitato');
      }

      // Verifica che il form esista
      const requestForm = await prisma.requestCustomForm.findUnique({
        where: { id: requestCustomFormId },
        include: {
          Request: {
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
      if (requestForm.Request.professionalId !== userId) {
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
      const requestInfo = req ? auditLogService.extractRequestInfo(req) : {};
      await auditLogService.log({
        ...requestInfo,
        userId,
        ipAddress: requestInfo.ipAddress || 'system',
        userAgent: requestInfo.userAgent || 'custom-form-sending-service',
        action: 'DELETE' as any,
        entityType: 'RequestCustomForm',
        entityId: requestCustomFormId,
        oldValues: {
          formName: requestForm.CustomForm.name,
          isCompleted: requestForm.isCompleted
        },
        success: true,
        severity: 'WARNING' as any,
        category: 'BUSINESS' as any
      });

      return ResponseFormatter.success(null, 'Form rimosso con successo');
    } catch (error) {
      console.error('Errore nella rimozione del form:', error);
      return ResponseFormatter.error('Errore nella rimozione del form');
    }
  }

  /**
   * Marca un form come verificato dal professionista
   * Solo il professionista della richiesta può verificare
   */
  async verifyForm(requestCustomFormId: string, userId: string, isVerified: boolean, req?: any) {
    try {
      // Verifica che il form esista
      const requestForm = await prisma.requestCustomForm.findUnique({
        where: { id: requestCustomFormId },
        include: {
          Request: {
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
      if (requestForm.Request.professionalId !== userId) {
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
      const requestInfo = req ? auditLogService.extractRequestInfo(req) : {};
      await auditLogService.log({
        ...requestInfo,
        userId,
        ipAddress: requestInfo.ipAddress || 'system',
        userAgent: requestInfo.userAgent || 'custom-form-sending-service',
        action: 'UPDATE' as any,
        entityType: 'RequestCustomForm',
        entityId: requestCustomFormId,
        newValues: {
          isVerifiedByProfessional: isVerified
        },
        success: true,
        severity: 'INFO' as any,
        category: 'BUSINESS' as any
      });

      const message = isVerified 
        ? 'Form marcato come verificato correttamente'
        : 'Verifica form rimossa';

      return ResponseFormatter.success(updatedForm, message);
    } catch (error) {
      console.error('Errore nella verifica del form:', error);
      return ResponseFormatter.error('Errore nella verifica del form');
    }
  }
}

export const customFormSendingService = new CustomFormSendingService();
