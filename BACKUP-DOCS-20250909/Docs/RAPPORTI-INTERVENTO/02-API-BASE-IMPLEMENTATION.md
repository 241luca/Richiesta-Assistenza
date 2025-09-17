# 📋 FASE 2 - IMPLEMENTAZIONE API BASE (CONTINUA)

### STEP 2.2 - SERVICE TEMPLATE (CONTINUAZIONE)

```typescript
              displayOrder: field.displayOrder || (index + 1) * 10
            }))
          } : undefined
        },
        include: {
          fields: {
            include: {
              fieldType: true
            }
          }
        }
      });
      
      // Incrementa contatore utilizzo
      await prisma.interventionReportTemplate.update({
        where: { id: template.id },
        data: { version: 1 }
      });
      
      return template;
    } catch (error) {
      logger.error('Errore creazione template:', error);
      throw error;
    }
  }
  
  async updateTemplate(id: string, data: any, userId: string) {
    try {
      // Verifica esistenza
      const existing = await this.getTemplateById(id);
      
      // Verifica permessi
      if (existing.createdBy !== userId && !data.isAdmin) {
        throw new AppError('Non autorizzato a modificare questo template', 403);
      }
      
      // Gestisci campi separatamente
      const { fields, ...templateData } = data;
      
      // Aggiorna template
      const template = await prisma.interventionReportTemplate.update({
        where: { id },
        data: {
          ...templateData,
          version: { increment: 1 },
          updatedAt: new Date()
        }
      });
      
      // Aggiorna campi se forniti
      if (fields) {
        // Elimina campi esistenti
        await prisma.interventionTemplateField.deleteMany({
          where: { templateId: id }
        });
        
        // Ricrea campi
        for (const field of fields) {
          await prisma.interventionTemplateField.create({
            data: {
              ...field,
              templateId: id
            }
          });
        }
      }
      
      return this.getTemplateById(id);
    } catch (error) {
      logger.error('Errore aggiornamento template:', error);
      throw error;
    }
  }
  
  async deleteTemplate(id: string, userId: string) {
    try {
      const template = await this.getTemplateById(id);
      
      // Verifica permessi
      if (template.createdBy !== userId && !userId.includes('admin')) {
        throw new AppError('Non autorizzato a eliminare questo template', 403);
      }
      
      // Verifica utilizzo
      const usage = await prisma.interventionReport.count({
        where: { templateId: id }
      });
      
      if (usage > 0) {
        throw new AppError('Template utilizzato in rapporti, impossibile eliminare', 400);
      }
      
      // Elimina campi
      await prisma.interventionTemplateField.deleteMany({
        where: { templateId: id }
      });
      
      // Elimina template
      await prisma.interventionReportTemplate.delete({
        where: { id }
      });
      
      return { success: true };
    } catch (error) {
      logger.error('Errore eliminazione template:', error);
      throw error;
    }
  }
  
  async cloneTemplate(id: string, userId: string, newName: string) {
    try {
      const original = await this.getTemplateById(id);
      
      // Prepara dati clone
      const cloneData = {
        name: newName || `${original.name} (Copia)`,
        description: original.description,
        subcategoryId: original.subcategoryId,
        categoryId: original.categoryId,
        isGeneric: original.isGeneric,
        settings: original.settings,
        requiredSections: original.requiredSections,
        layout: original.layout,
        createdBy: userId,
        isActive: true,
        isDefault: false,
        isPublic: false
      };
      
      // Crea clone con campi
      const clone = await prisma.interventionReportTemplate.create({
        data: {
          ...cloneData,
          fields: {
            create: original.fields.map((field: any) => ({
              code: field.code,
              label: field.label,
              placeholder: field.placeholder,
              helpText: field.helpText,
              tooltip: field.tooltip,
              fieldTypeId: field.fieldTypeId,
              sectionCode: field.sectionCode,
              displayOrder: field.displayOrder,
              columnSpan: field.columnSpan,
              rowNumber: field.rowNumber,
              groupName: field.groupName,
              isRequired: field.isRequired,
              isReadonly: field.isReadonly,
              isHidden: field.isHidden,
              showOnPDF: field.showOnPDF,
              showOnClient: field.showOnClient,
              showOnMobile: field.showOnMobile,
              config: field.config,
              dependencies: field.dependencies,
              calculations: field.calculations,
              validationRules: field.validationRules,
              defaultValue: field.defaultValue,
              possibleValues: field.possibleValues,
              showIf: field.showIf,
              requiredIf: field.requiredIf
            }))
          }
        },
        include: {
          fields: true
        }
      });
      
      return clone;
    } catch (error) {
      logger.error('Errore clonazione template:', error);
      throw error;
    }
  }
  
  // ========== CAMPI TEMPLATE ==========
  
  async addFieldToTemplate(templateId: string, fieldData: any) {
    try {
      // Verifica template
      await this.getTemplateById(templateId);
      
      // Verifica unicità code nel template
      const existing = await prisma.interventionTemplateField.findUnique({
        where: {
          templateId_code: {
            templateId,
            code: fieldData.code
          }
        }
      });
      
      if (existing) {
        throw new AppError('Codice campo già esistente nel template', 400);
      }
      
      // Calcola displayOrder se non fornito
      if (!fieldData.displayOrder) {
        const maxOrder = await prisma.interventionTemplateField.aggregate({
          where: { templateId },
          _max: { displayOrder: true }
        });
        fieldData.displayOrder = (maxOrder._max.displayOrder || 0) + 10;
      }
      
      const field = await prisma.interventionTemplateField.create({
        data: {
          ...fieldData,
          templateId
        },
        include: {
          fieldType: true
        }
      });
      
      return field;
    } catch (error) {
      logger.error('Errore aggiunta campo:', error);
      throw error;
    }
  }
  
  async updateTemplateField(templateId: string, fieldId: string, data: any) {
    try {
      const field = await prisma.interventionTemplateField.update({
        where: { 
          id: fieldId,
          templateId // Assicura che il campo appartenga al template
        },
        data,
        include: {
          fieldType: true
        }
      });
      
      return field;
    } catch (error) {
      logger.error('Errore aggiornamento campo:', error);
      throw error;
    }
  }
  
  async deleteTemplateField(templateId: string, fieldId: string) {
    try {
      await prisma.interventionTemplateField.delete({
        where: { 
          id: fieldId,
          templateId
        }
      });
      
      return { success: true };
    } catch (error) {
      logger.error('Errore eliminazione campo:', error);
      throw error;
    }
  }
  
  async reorderTemplateFields(templateId: string, fieldOrders: any[]) {
    try {
      // Aggiorna ordine per ogni campo
      const updates = fieldOrders.map(item => 
        prisma.interventionTemplateField.update({
          where: { id: item.fieldId, templateId },
          data: { displayOrder: item.order }
        })
      );
      
      await prisma.$transaction(updates);
      
      return { success: true };
    } catch (error) {
      logger.error('Errore riordino campi:', error);
      throw error;
    }
  }
}

export default new InterventionTemplateService();
```

---

### STEP 2.3 - SERVICE RAPPORTI (4 ore)

#### Creare `backend/src/services/interventionReportOperations.service.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import interventionReportService from './interventionReport.service';
import NotificationService from './notification.service';

const prisma = new PrismaClient();

class InterventionReportOperationsService {
  // ========== CRUD RAPPORTI ==========
  
  async getReports(filters: any, userId: string, userRole: string) {
    try {
      const where: any = {};
      
      // Filtri base per ruolo
      if (userRole === 'PROFESSIONAL') {
        where.professionalId = userId;
      } else if (userRole === 'CLIENT') {
        where.clientId = userId;
      }
      
      // Filtri aggiuntivi
      if (filters.requestId) where.requestId = filters.requestId;
      if (filters.statusId) where.statusId = filters.statusId;
      if (filters.typeId) where.typeId = filters.typeId;
      if (filters.isDraft !== undefined) where.isDraft = filters.isDraft;
      
      // Filtri data
      if (filters.dateFrom || filters.dateTo) {
        where.interventionDate = {};
        if (filters.dateFrom) {
          where.interventionDate.gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          where.interventionDate.lte = new Date(filters.dateTo);
        }
      }
      
      // Ricerca testo
      if (filters.search) {
        where.OR = [
          { reportNumber: { contains: filters.search, mode: 'insensitive' } },
          { internalNotes: { contains: filters.search, mode: 'insensitive' } },
          { clientNotes: { contains: filters.search, mode: 'insensitive' } }
        ];
      }
      
      const reports = await prisma.interventionReport.findMany({
        where,
        include: {
          request: {
            select: {
              id: true,
              title: true,
              address: true,
              city: true
            }
          },
          professional: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true
            }
          },
          client: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true
            }
          },
          template: {
            select: {
              id: true,
              name: true
            }
          },
          status: true,
          type: true
        },
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0
      });
      
      // Count totale
      const total = await prisma.interventionReport.count({ where });
      
      return {
        data: reports,
        total,
        limit: filters.limit || 50,
        offset: filters.offset || 0
      };
    } catch (error) {
      logger.error('Errore recupero rapporti:', error);
      throw error;
    }
  }
  
  async getReportById(id: string, userId: string, userRole: string) {
    try {
      const report = await prisma.interventionReport.findUnique({
        where: { id },
        include: {
          request: true,
          professional: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              businessName: true
            }
          },
          client: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              address: true,
              city: true
            }
          },
          template: {
            include: {
              fields: {
                include: {
                  fieldType: true
                },
                orderBy: { displayOrder: 'asc' }
              }
            }
          },
          status: true,
          type: true
        }
      });
      
      if (!report) {
        throw new AppError('Rapporto non trovato', 404);
      }
      
      // Verifica permessi
      if (userRole === 'PROFESSIONAL' && report.professionalId !== userId) {
        throw new AppError('Non autorizzato a visualizzare questo rapporto', 403);
      }
      
      if (userRole === 'CLIENT' && report.clientId !== userId) {
        throw new AppError('Non autorizzato a visualizzare questo rapporto', 403);
      }
      
      // Aggiorna visualizzazione se cliente
      if (userRole === 'CLIENT' && !report.viewedByClientAt) {
        await prisma.interventionReport.update({
          where: { id },
          data: {
            viewedByClientAt: new Date(),
            clientIp: userId, // In produzione, prendere IP reale
            clientUserAgent: 'Web' // In produzione, prendere user agent reale
          }
        });
        
        // Notifica professionista
        await NotificationService.sendNotification({
          recipientId: report.professionalId,
          type: 'REPORT_VIEWED',
          title: 'Rapporto visualizzato',
          content: `Il cliente ${report.client.fullName} ha visualizzato il rapporto ${report.reportNumber}`,
          entityType: 'report',
          entityId: report.id
        });
      }
      
      return report;
    } catch (error) {
      logger.error('Errore recupero rapporto:', error);
      throw error;
    }
  }
  
  async createReport(data: any, userId: string) {
    try {
      // Verifica richiesta
      const request = await prisma.assistanceRequest.findUnique({
        where: { id: data.requestId },
        include: { client: true }
      });
      
      if (!request) {
        throw new AppError('Richiesta non trovata', 404);
      }
      
      // Verifica autorizzazione
      if (request.professionalId !== userId) {
        throw new AppError('Non autorizzato a creare rapporto per questa richiesta', 403);
      }
      
      // Genera numero rapporto
      const reportNumber = await interventionReportService.getNextReportNumber();
      
      // Ottieni stato default
      const defaultStatus = await prisma.interventionReportStatus.findFirst({
        where: { isDefault: true }
      });
      
      if (!defaultStatus) {
        throw new AppError('Stato default non configurato', 500);
      }
      
      // Prepara dati
      const reportData = {
        reportNumber,
        requestId: data.requestId,
        professionalId: userId,
        clientId: request.clientId,
        templateId: data.templateId,
        statusId: data.statusId || defaultStatus.id,
        typeId: data.typeId,
        interventionDate: new Date(data.interventionDate),
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : null,
        totalHours: data.totalHours || null,
        travelTime: data.travelTime || null,
        formData: data.formData || {},
        materials: data.materials || null,
        materialsTotal: data.materialsTotal || null,
        photos: data.photos || null,
        signatures: data.signatures || null,
        gpsData: data.gpsData || null,
        weatherData: data.weatherData || null,
        internalNotes: data.internalNotes || null,
        clientNotes: data.clientNotes || null,
        followUpRequired: data.followUpRequired || false,
        followUpNotes: data.followUpNotes || null,
        isDraft: data.isDraft !== false,
        metadata: data.metadata || null
      };
      
      // Crea rapporto
      const report = await prisma.interventionReport.create({
        data: reportData,
        include: {
          status: true,
          type: true
        }
      });
      
      // Aggiorna richiesta se completata
      if (data.completeRequest) {
        await prisma.assistanceRequest.update({
          where: { id: data.requestId },
          data: {
            status: 'COMPLETED',
            completedDate: new Date()
          }
        });
      }
      
      // Notifica cliente se non bozza
      if (!reportData.isDraft) {
        await NotificationService.sendNotification({
          recipientId: request.clientId,
          type: 'REPORT_CREATED',
          title: 'Nuovo rapporto di intervento',
          content: `È disponibile il rapporto di intervento ${reportNumber} per la richiesta "${request.title}"`,
          entityType: 'report',
          entityId: report.id
        });
      }
      
      return report;
    } catch (error) {
      logger.error('Errore creazione rapporto:', error);
      throw error;
    }
  }
  
  async updateReport(id: string, data: any, userId: string) {
    try {
      // Verifica esistenza e permessi
      const report = await this.getReportById(id, userId, 'PROFESSIONAL');
      
      // Verifica se modificabile
      if (!report.status.allowEdit) {
        throw new AppError('Rapporto non modificabile in questo stato', 403);
      }
      
      // Calcola ore se forniti start/end
      if (data.startTime && data.endTime) {
        const start = new Date(data.startTime);
        const end = new Date(data.endTime);
        data.totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }
      
      // Aggiorna rapporto
      const updated = await prisma.interventionReport.update({
        where: { id },
        data: {
          ...data,
          version: { increment: 1 },
          updatedAt: new Date()
        },
        include: {
          status: true,
          type: true
        }
      });
      
      return updated;
    } catch (error) {
      logger.error('Errore aggiornamento rapporto:', error);
      throw error;
    }
  }
  
  async deleteReport(id: string, userId: string) {
    try {
      const report = await this.getReportById(id, userId, 'PROFESSIONAL');
      
      // Verifica se eliminabile
      if (!report.status.allowDelete) {
        throw new AppError('Rapporto non eliminabile in questo stato', 403);
      }
      
      await prisma.interventionReport.delete({
        where: { id }
      });
      
      return { success: true };
    } catch (error) {
      logger.error('Errore eliminazione rapporto:', error);
      throw error;
    }
  }
  
  // ========== OPERAZIONI SPECIALI ==========
  
  async signReport(id: string, signatureData: any, userId: string, userRole: string) {
    try {
      const report = await this.getReportById(id, userId, userRole);
      
      // Prepara dati firma
      const signatures = report.signatures || {};
      const now = new Date();
      
      if (userRole === 'PROFESSIONAL') {
        signatures.professional = {
          signature: signatureData.signature,
          signedAt: now,
          name: signatureData.name || report.professional.fullName
        };
        
        await prisma.interventionReport.update({
          where: { id },
          data: {
            signatures,
            professionalSignedAt: now
          }
        });
      } else if (userRole === 'CLIENT') {
        signatures.client = {
          signature: signatureData.signature,
          signedAt: now,
          name: signatureData.name || report.client.fullName
        };
        
        await prisma.interventionReport.update({
          where: { id },
          data: {
            signatures,
            clientSignedAt: now
          }
        });
        
        // Notifica professionista
        await NotificationService.sendNotification({
          recipientId: report.professionalId,
          type: 'REPORT_SIGNED',
          title: 'Rapporto firmato dal cliente',
          content: `Il rapporto ${report.reportNumber} è stato firmato da ${report.client.fullName}`,
          entityType: 'report',
          entityId: report.id
        });
      }
      
      // Se entrambi hanno firmato, cambia stato
      if (signatures.professional && signatures.client) {
        const signedStatus = await prisma.interventionReportStatus.findFirst({
          where: { code: 'signed' }
        });
        
        if (signedStatus) {
          await prisma.interventionReport.update({
            where: { id },
            data: { statusId: signedStatus.id }
          });
        }
      }
      
      return { success: true };
    } catch (error) {
      logger.error('Errore firma rapporto:', error);
      throw error;
    }
  }
  
  async sendReportToClient(id: string, userId: string) {
    try {
      const report = await this.getReportById(id, userId, 'PROFESSIONAL');
      
      if (report.isDraft) {
        throw new AppError('Impossibile inviare una bozza', 400);
      }
      
      // Aggiorna stato
      const sentStatus = await prisma.interventionReportStatus.findFirst({
        where: { code: 'sent' }
      });
      
      if (sentStatus) {
        await prisma.interventionReport.update({
          where: { id },
          data: {
            statusId: sentStatus.id,
            sentToClientAt: new Date()
          }
        });
      }
      
      // Invia notifica email e in-app
      await NotificationService.sendNotification({
        recipientId: report.clientId,
        type: 'REPORT_SENT',
        title: 'Rapporto di intervento disponibile',
        content: `Il rapporto ${report.reportNumber} per l'intervento del ${report.interventionDate.toLocaleDateString()} è disponibile per la consultazione`,
        entityType: 'report',
        entityId: report.id,
        channels: ['email', 'inapp']
      });
      
      return { success: true };
    } catch (error) {
      logger.error('Errore invio rapporto:', error);
      throw error;
    }
  }
}

export default new InterventionReportOperationsService();
```

---

### STEP 2.4 - ROUTES CONFIGURAZIONE (2 ore)

#### Creare `backend/src/routes/intervention-report-config.routes.ts`:

```typescript
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { ResponseFormatter } from '../utils/responseFormatter';
import interventionReportService from '../services/interventionReport.service';
import logger from '../utils/logger';

const router = Router();

// ========== CONFIGURAZIONE GLOBALE ==========

// GET /api/intervention-reports/config
router.get('/config', authenticate, async (req: any, res) => {
  try {
    const config = await interventionReportService.getConfig();
    
    return res.json(ResponseFormatter.success(
      config,
      'Configurazione recuperata con successo'
    ));
  } catch (error) {
    logger.error('Errore recupero configurazione:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero della configurazione',
      'CONFIG_FETCH_ERROR'
    ));
  }
});

// PUT /api/intervention-reports/config
router.put('/config', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const config = await interventionReportService.updateConfig(req.body);
    
    return res.json(ResponseFormatter.success(
      config,
      'Configurazione aggiornata con successo'
    ));
  } catch (error) {
    logger.error('Errore aggiornamento configurazione:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento della configurazione',
      'CONFIG_UPDATE_ERROR'
    ));
  }
});

// ========== TIPI CAMPO ==========

// GET /api/intervention-reports/field-types
router.get('/field-types', authenticate, async (req: any, res) => {
  try {
    const fieldTypes = await interventionReportService.getFieldTypes(req.query);
    
    return res.json(ResponseFormatter.success(
      fieldTypes,
      'Tipi campo recuperati con successo'
    ));
  } catch (error) {
    logger.error('Errore recupero tipi campo:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero dei tipi campo',
      'FIELD_TYPES_FETCH_ERROR'
    ));
  }
});

// POST /api/intervention-reports/field-types
router.post('/field-types', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const fieldType = await interventionReportService.createFieldType(req.body);
    
    return res.json(ResponseFormatter.success(
      fieldType,
      'Tipo campo creato con successo'
    ));
  } catch (error: any) {
    logger.error('Errore creazione tipo campo:', error);
    
    if (error.statusCode === 400) {
      return res.status(400).json(ResponseFormatter.error(
        error.message,
        'FIELD_TYPE_VALIDATION_ERROR'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella creazione del tipo campo',
      'FIELD_TYPE_CREATE_ERROR'
    ));
  }
});

// PUT /api/intervention-reports/field-types/:id
router.put('/field-types/:id', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const fieldType = await interventionReportService.updateFieldType(req.params.id, req.body);
    
    return res.json(ResponseFormatter.success(
      fieldType,
      'Tipo campo aggiornato con successo'
    ));
  } catch (error) {
    logger.error('Errore aggiornamento tipo campo:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento del tipo campo',
      'FIELD_TYPE_UPDATE_ERROR'
    ));
  }
});

// DELETE /api/intervention-reports/field-types/:id
router.delete('/field-types/:id', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    await interventionReportService.deleteFieldType(req.params.id);
    
    return res.json(ResponseFormatter.success(
      null,
      'Tipo campo eliminato con successo'
    ));
  } catch (error: any) {
    logger.error('Errore eliminazione tipo campo:', error);
    
    if (error.statusCode === 403) {
      return res.status(403).json(ResponseFormatter.error(
        error.message,
        'FIELD_TYPE_DELETE_FORBIDDEN'
      ));
    }
    
    if (error.statusCode === 400) {
      return res.status(400).json(ResponseFormatter.error(
        error.message,
        'FIELD_TYPE_IN_USE'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'eliminazione del tipo campo',
      'FIELD_TYPE_DELETE_ERROR'
    ));
  }
});

// ========== STATI ==========

// GET /api/intervention-reports/statuses
router.get('/statuses', authenticate, async (req: any, res) => {
  try {
    const statuses = await interventionReportService.getStatuses(req.query);
    
    return res.json(ResponseFormatter.success(
      statuses,
      'Stati recuperati con successo'
    ));
  } catch (error) {
    logger.error('Errore recupero stati:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero degli stati',
      'STATUSES_FETCH_ERROR'
    ));
  }
});

// POST /api/intervention-reports/statuses
router.post('/statuses', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const status = await interventionReportService.createStatus(req.body);
    
    return res.json(ResponseFormatter.success(
      status,
      'Stato creato con successo'
    ));
  } catch (error: any) {
    logger.error('Errore creazione stato:', error);
    
    if (error.statusCode === 400) {
      return res.status(400).json(ResponseFormatter.error(
        error.message,
        'STATUS_VALIDATION_ERROR'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella creazione dello stato',
      'STATUS_CREATE_ERROR'
    ));
  }
});

// PUT /api/intervention-reports/statuses/:id
router.put('/statuses/:id', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const status = await interventionReportService.updateStatus(req.params.id, req.body);
    
    return res.json(ResponseFormatter.success(
      status,
      'Stato aggiornato con successo'
    ));
  } catch (error) {
    logger.error('Errore aggiornamento stato:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento dello stato',
      'STATUS_UPDATE_ERROR'
    ));
  }
});

// ========== TIPI INTERVENTO ==========

// GET /api/intervention-reports/types
router.get('/types', authenticate, async (req: any, res) => {
  try {
    const types = await interventionReportService.getInterventionTypes(req.query);
    
    return res.json(ResponseFormatter.success(
      types,
      'Tipi intervento recuperati con successo'
    ));
  } catch (error) {
    logger.error('Errore recupero tipi intervento:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero dei tipi intervento',
      'TYPES_FETCH_ERROR'
    ));
  }
});

// POST /api/intervention-reports/types
router.post('/types', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const type = await interventionReportService.createInterventionType(req.body);
    
    return res.json(ResponseFormatter.success(
      type,
      'Tipo intervento creato con successo'
    ));
  } catch (error: any) {
    logger.error('Errore creazione tipo intervento:', error);
    
    if (error.statusCode === 400) {
      return res.status(400).json(ResponseFormatter.error(
        error.message,
        'TYPE_VALIDATION_ERROR'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella creazione del tipo intervento',
      'TYPE_CREATE_ERROR'
    ));
  }
});

// PUT /api/intervention-reports/types/:id
router.put('/types/:id', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const type = await interventionReportService.updateInterventionType(req.params.id, req.body);
    
    return res.json(ResponseFormatter.success(
      type,
      'Tipo intervento aggiornato con successo'
    ));
  } catch (error) {
    logger.error('Errore aggiornamento tipo intervento:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento del tipo intervento',
      'TYPE_UPDATE_ERROR'
    ));
  }
});

// ========== SEZIONI ==========

// GET /api/intervention-reports/sections
router.get('/sections', authenticate, async (req: any, res) => {
  try {
    const sections = await interventionReportService.getSections(req.query);
    
    return res.json(ResponseFormatter.success(
      sections,
      'Sezioni recuperate con successo'
    ));
  } catch (error) {
    logger.error('Errore recupero sezioni:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero delle sezioni',
      'SECTIONS_FETCH_ERROR'
    ));
  }
});

// POST /api/intervention-reports/sections
router.post('/sections', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const section = await interventionReportService.createSection(req.body);
    
    return res.json(ResponseFormatter.success(
      section,
      'Sezione creata con successo'
    ));
  } catch (error: any) {
    logger.error('Errore creazione sezione:', error);
    
    if (error.statusCode === 400) {
      return res.status(400).json(ResponseFormatter.error(
        error.message,
        'SECTION_VALIDATION_ERROR'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella creazione della sezione',
      'SECTION_CREATE_ERROR'
    ));
  }
});

// PUT /api/intervention-reports/sections/:id
router.put('/sections/:id', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const section = await interventionReportService.updateSection(req.params.id, req.body);
    
    return res.json(ResponseFormatter.success(
      section,
      'Sezione aggiornata con successo'
    ));
  } catch (error) {
    logger.error('Errore aggiornamento sezione:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento della sezione',
      'SECTION_UPDATE_ERROR'
    ));
  }
});

export default router;
```

---

### STEP 2.5 - REGISTRAZIONE ROUTES (30 minuti)

#### Aggiornare `backend/src/routes/index.ts`:

```typescript
// Aggiungere import
import interventionReportConfigRoutes from './intervention-report-config.routes';
import interventionReportTemplateRoutes from './intervention-report-template.routes';
import interventionReportRoutes from './intervention-report.routes';
import interventionReportMaterialRoutes from './intervention-report-material.routes';
import interventionReportProfessionalRoutes from './intervention-report-professional.routes';

// Aggiungere registrazione routes
app.use('/api/intervention-reports', interventionReportConfigRoutes);
app.use('/api/intervention-reports/templates', interventionReportTemplateRoutes);
app.use('/api/intervention-reports', interventionReportRoutes);
app.use('/api/intervention-reports/materials', interventionReportMaterialRoutes);
app.use('/api/intervention-reports/professional', interventionReportProfessionalRoutes);
```

---

## ✅ CHECKLIST COMPLETAMENTO FASE 2

### Services
- [ ] interventionReport.service.ts creato
- [ ] interventionTemplate.service.ts creato
- [ ] interventionReportOperations.service.ts creato
- [ ] interventionMaterial.service.ts creato
- [ ] interventionProfessional.service.ts creato

### Routes
- [ ] intervention-report-config.routes.ts creato
- [ ] intervention-report-template.routes.ts creato
- [ ] intervention-report.routes.ts creato
- [ ] intervention-report-material.routes.ts creato
- [ ] intervention-report-professional.routes.ts creato
- [ ] Routes registrate in index.ts

### Testing API
- [ ] Test configurazione (GET/PUT)
- [ ] Test CRUD tipi campo
- [ ] Test CRUD stati
- [ ] Test CRUD tipi intervento
- [ ] Test CRUD template
- [ ] Test CRUD rapporti
- [ ] Test firma digitale
- [ ] Test invio cliente

### Validazioni
- [ ] Tutte le routes usano ResponseFormatter
- [ ] Validazione input con Zod
- [ ] Controllo permessi per ruolo
- [ ] Error handling completo

### Performance
- [ ] Query ottimizzate con select
- [ ] Paginazione implementata
- [ ] Cache dove necessario

---

## 📝 NOTE PER FASE SUCCESSIVA

La Fase 3 (Admin Panel) potrà iniziare con:
- API complete e funzionanti
- Endpoints testati
- Documentazione API pronta
- ResponseFormatter su tutte le routes

Passare a: `03-ADMIN-PANEL-IMPLEMENTATION.md`
