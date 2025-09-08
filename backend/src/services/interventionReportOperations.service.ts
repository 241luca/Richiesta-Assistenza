import { AppError } from '../utils/errors';
import interventionReportService from './interventionReport.service';
import { notificationService } from './notification.service'; // ✅ AGGIUNTO
import { prisma } from '../config/database'; // ✅ AGGIUNTO
import { v4 as uuidv4 } from 'uuid'; // ✅ AGGIUNTO
import { logger } from '../utils/logger'; // ✅ AGGIUNTO

class InterventionReportOperationsService {
  // ========== CRUD RAPPORTI ==========
  
  async getReports(filters: any, userId: string, userRole: string) {
    try {
      // Mock data per test (mantenuto per compatibilità)
      let reports = [
        {
          id: '1',
          reportNumber: 'RAPP-2024-0001',
          requestId: '1',
          professionalId: '2',
          clientId: '3',
          templateId: '1',
          statusId: '1',
          typeId: '3',
          interventionDate: new Date('2024-01-15'),
          startTime: new Date('2024-01-15T09:00:00'),
          endTime: new Date('2024-01-15T11:00:00'),
          totalHours: 2,
          travelTime: 0.5,
          formData: {
            client_name: 'Mario Rossi',
            client_address: 'Via Roma 1, Milano',
            intervention_description: 'Riparazione perdita rubinetto cucina'
          },
          materials: null,
          materialsTotal: null,
          photos: null,
          signatures: null,
          isDraft: false,
          viewedByClientAt: null,
          sentToClientAt: new Date('2024-01-15T15:00:00'),
          professionalSignedAt: new Date('2024-01-15T11:30:00'),
          clientSignedAt: null,
          createdAt: new Date('2024-01-15T11:35:00'),
          version: 1
        },
        {
          id: '2',
          reportNumber: 'RAPP-2024-0002',
          requestId: '2',
          professionalId: '2',
          clientId: '4',
          templateId: '2',
          statusId: '2',
          typeId: '2',
          interventionDate: new Date('2024-01-16'),
          startTime: new Date('2024-01-16T14:00:00'),
          endTime: new Date('2024-01-16T16:30:00'),
          totalHours: 2.5,
          travelTime: 0.25,
          formData: {
            client_name: 'Luigi Bianchi',
            client_address: 'Via Milano 15, Roma',
            intervention_description: 'Manutenzione impianto elettrico'
          },
          materials: [
            { name: 'Interruttore', quantity: 2, price: 15 },
            { name: 'Cavo elettrico', quantity: 5, price: 3 }
          ],
          materialsTotal: 45,
          photos: null,
          signatures: {
            professional: {
              signature: 'base64_signature_data',
              signedAt: new Date('2024-01-16T16:35:00'),
              name: 'Tecnico Giovanni'
            }
          },
          isDraft: false,
          viewedByClientAt: new Date('2024-01-16T18:00:00'),
          sentToClientAt: new Date('2024-01-16T17:00:00'),
          professionalSignedAt: new Date('2024-01-16T16:35:00'),
          clientSignedAt: null,
          createdAt: new Date('2024-01-16T16:40:00'),
          version: 2
        }
      ];
      
      // Filtra per ruolo
      if (userRole === 'PROFESSIONAL') {
        reports = reports.filter(r => r.professionalId === userId);
      } else if (userRole === 'CLIENT') {
        reports = reports.filter(r => r.clientId === userId);
      }
      
      // Altri filtri
      if (filters.requestId) {
        reports = reports.filter(r => r.requestId === filters.requestId);
      }
      
      if (filters.statusId) {
        reports = reports.filter(r => r.statusId === filters.statusId);
      }
      
      if (filters.isDraft !== undefined) {
        reports = reports.filter(r => r.isDraft === filters.isDraft);
      }
      
      // Paginazione
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      const paginatedReports = reports.slice(offset, offset + limit);
      
      return {
        data: paginatedReports,
        total: reports.length,
        limit,
        offset
      };
    } catch (error) {
      console.error('Errore recupero rapporti:', error);
      throw error;
    }
  }
  
  async getReportById(id: string, userId: string, userRole: string) {
    try {
      const allReports = await this.getReports({}, userId, userRole);
      const report = allReports.data.find((r: any) => r.id === id);
      
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
        report.viewedByClientAt = new Date();
        console.log('Rapporto visualizzato dal cliente:', id);
        
        // ✅ NUOVO: Notifica al professionista che il cliente ha visualizzato il rapporto
        try {
          await notificationService.sendToUser({
            userId: report.professionalId,
            type: 'REPORT_VIEWED',
            title: '👁️ Rapporto visualizzato',
            message: `Il cliente ha visualizzato il rapporto ${report.reportNumber}`,
            priority: 'low',
            data: {
              reportId: id,
              reportNumber: report.reportNumber,
              clientId: report.clientId
            },
            channels: ['websocket']
          });
        } catch (error) {
          logger.error('Error sending report viewed notification:', error);
        }
      }
      
      // Aggiungi dati correlati mock
      const enrichedReport = {
        ...report,
        request: {
          id: report.requestId,
          title: 'Richiesta assistenza #' + report.requestId,
          address: 'Via Test 1',
          city: 'Milano'
        },
        professional: {
          id: report.professionalId,
          fullName: 'Giovanni Tecnico',
          email: 'giovanni@example.com',
          phone: '3331234567'
        },
        client: {
          id: report.clientId,
          fullName: 'Mario Rossi',
          email: 'mario@example.com',
          phone: '3339876543',
          address: 'Via Roma 1',
          city: 'Milano'
        },
        template: {
          id: report.templateId,
          name: 'Template Standard'
        },
        status: {
          id: report.statusId,
          name: 'Bozza',
          code: 'draft',
          color: '#6B7280'
        },
        type: {
          id: report.typeId,
          name: 'Riparazione',
          code: 'repair'
        }
      };
      
      return enrichedReport;
    } catch (error) {
      console.error('Errore recupero rapporto:', error);
      throw error;
    }
  }
  
  async createReport(data: any, userId: string) {
    try {
      // Genera numero rapporto
      const reportNumber = await interventionReportService.getNextReportNumber();
      
      // Prepara dati
      const report = {
        id: uuidv4(),
        reportNumber,
        requestId: data.requestId,
        professionalId: userId,
        clientId: data.clientId,
        templateId: data.templateId || '1',
        statusId: data.statusId || '1',
        typeId: data.typeId || '1',
        interventionDate: new Date(data.interventionDate),
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : null,
        totalHours: data.totalHours || 0,
        travelTime: data.travelTime || 0,
        formData: data.formData || {},
        materials: data.materials || null,
        materialsTotal: data.materialsTotal || null,
        photos: data.photos || null,
        signatures: data.signatures || null,
        isDraft: data.isDraft !== false,
        professionalSignedAt: null,
        clientSignedAt: null,
        sentToClientAt: null,
        viewedByClientAt: null,
        createdAt: new Date(),
        version: 1
      };
      
      // ✅ NUOVO: Notifica al cliente della creazione del rapporto (solo se non è bozza)
      if (!report.isDraft) {
        try {
          await notificationService.sendToUser({
            userId: report.clientId,
            type: 'REPORT_CREATED',
            title: '📋 Nuovo rapporto di intervento',
            message: `È stato creato un nuovo rapporto di intervento (${report.reportNumber}) per la tua richiesta`,
            priority: 'normal',
            data: {
              reportId: report.id,
              reportNumber: report.reportNumber,
              requestId: report.requestId,
              actionUrl: `${process.env.FRONTEND_URL}/reports/${report.id}`
            },
            channels: ['websocket', 'email']
          });
        } catch (error) {
          logger.error('Error sending report created notification:', error);
        }
      }
      
      console.log('Rapporto creato:', report);
      return report;
    } catch (error) {
      console.error('Errore creazione rapporto:', error);
      throw error;
    }
  }
  
  async updateReport(id: string, data: any, userId: string) {
    try {
      // Recupera rapporto esistente
      const existingReport = await this.getReportById(id, userId, 'PROFESSIONAL');
      
      if (!existingReport) {
        throw new AppError('Rapporto non trovato', 404);
      }
      
      // Verifica permessi
      if (existingReport.professionalId !== userId) {
        throw new AppError('Non autorizzato a modificare questo rapporto', 403);
      }
      
      // Aggiorna dati
      const updatedReport = {
        ...existingReport,
        ...data,
        id, // Mantieni ID originale
        reportNumber: existingReport.reportNumber, // Mantieni numero originale
        version: existingReport.version + 1,
        updatedAt: new Date()
      };
      
      // ✅ NUOVO: Se il rapporto passa da bozza a definitivo, notifica il cliente
      if (existingReport.isDraft && !data.isDraft) {
        try {
          await notificationService.sendToUser({
            userId: existingReport.clientId,
            type: 'REPORT_FINALIZED',
            title: '✅ Rapporto completato',
            message: `Il rapporto di intervento ${existingReport.reportNumber} è stato completato ed è disponibile per la visualizzazione`,
            priority: 'high',
            data: {
              reportId: id,
              reportNumber: existingReport.reportNumber,
              requestId: existingReport.requestId,
              actionUrl: `${process.env.FRONTEND_URL}/reports/${id}`
            },
            channels: ['websocket', 'email']
          });
        } catch (error) {
          logger.error('Error sending report finalized notification:', error);
        }
      }
      
      console.log('Rapporto aggiornato:', updatedReport);
      return updatedReport;
    } catch (error) {
      console.error('Errore aggiornamento rapporto:', error);
      throw error;
    }
  }
  
  async deleteReport(id: string, userId: string) {
    try {
      // Verifica esistenza e permessi
      const report = await this.getReportById(id, userId, 'PROFESSIONAL');
      
      if (!report) {
        throw new AppError('Rapporto non trovato', 404);
      }
      
      if (report.professionalId !== userId) {
        throw new AppError('Non autorizzato a eliminare questo rapporto', 403);
      }
      
      // Non permettere eliminazione se firmato
      if (report.professionalSignedAt || report.clientSignedAt) {
        throw new AppError('Non è possibile eliminare un rapporto firmato', 400);
      }
      
      console.log('Rapporto eliminato:', id);
      return { success: true, message: 'Rapporto eliminato con successo' };
    } catch (error) {
      console.error('Errore eliminazione rapporto:', error);
      throw error;
    }
  }
  
  // ========== FIRMA RAPPORTI ==========
  
  async signReport(id: string, signature: any, userId: string, userRole: string) {
    try {
      const report = await this.getReportById(id, userId, userRole);
      
      if (!report) {
        throw new AppError('Rapporto non trovato', 404);
      }
      
      // Verifica che il rapporto non sia una bozza
      if (report.isDraft) {
        throw new AppError('Non è possibile firmare una bozza', 400);
      }
      
      // Prepara dati firma
      const signatureData = {
        signature: signature.data,
        signedAt: new Date(),
        name: signature.name || 'Nome non specificato',
        ip: signature.ip || null,
        device: signature.device || null
      };
      
      // Aggiorna firma in base al ruolo
      if (userRole === 'PROFESSIONAL') {
        report.signatures = report.signatures || {};
        report.signatures.professional = signatureData;
        report.professionalSignedAt = signatureData.signedAt;
        
        // ✅ NUOVO: Notifica al cliente che il professionista ha firmato
        try {
          await notificationService.sendToUser({
            userId: report.clientId,
            type: 'REPORT_SIGNED_BY_PROFESSIONAL',
            title: '✍️ Rapporto firmato dal professionista',
            message: `Il professionista ha firmato il rapporto ${report.reportNumber}. Ora puoi visualizzarlo e firmarlo a tua volta.`,
            priority: 'high',
            data: {
              reportId: id,
              reportNumber: report.reportNumber,
              requestId: report.requestId,
              professionalName: report.professional?.fullName,
              actionUrl: `${process.env.FRONTEND_URL}/reports/${id}/sign`
            },
            channels: ['websocket', 'email']
          });
        } catch (error) {
          logger.error('Error sending professional signed notification:', error);
        }
        
      } else if (userRole === 'CLIENT') {
        report.signatures = report.signatures || {};
        report.signatures.client = signatureData;
        report.clientSignedAt = signatureData.signedAt;
        
        // ✅ NUOVO: Notifica al professionista che il cliente ha firmato
        try {
          await notificationService.sendToUser({
            userId: report.professionalId,
            type: 'REPORT_SIGNED_BY_CLIENT',
            title: '✅ Rapporto firmato dal cliente',
            message: `Il cliente ha firmato il rapporto ${report.reportNumber}. Il rapporto è ora completo.`,
            priority: 'normal',
            data: {
              reportId: id,
              reportNumber: report.reportNumber,
              requestId: report.requestId,
              clientName: report.client?.fullName,
              actionUrl: `${process.env.FRONTEND_URL}/reports/${id}`
            },
            channels: ['websocket', 'email']
          });
          
          // ✅ NUOVO: Se entrambi hanno firmato, notifica completamento
          if (report.professionalSignedAt && report.clientSignedAt) {
            // Notifica ad entrambi del completamento
            await notificationService.sendToUser({
              userId: report.clientId,
              type: 'REPORT_FULLY_SIGNED',
              title: '🎉 Rapporto completato',
              message: `Il rapporto ${report.reportNumber} è stato firmato da entrambe le parti ed è ora completo.`,
              priority: 'normal',
              data: {
                reportId: id,
                reportNumber: report.reportNumber,
                requestId: report.requestId
              },
              channels: ['websocket']
            });
            
            await notificationService.sendToUser({
              userId: report.professionalId,
              type: 'REPORT_FULLY_SIGNED',
              title: '🎉 Rapporto completato',
              message: `Il rapporto ${report.reportNumber} è stato firmato da entrambe le parti ed è ora completo.`,
              priority: 'normal',
              data: {
                reportId: id,
                reportNumber: report.reportNumber,
                requestId: report.requestId
              },
              channels: ['websocket']
            });
          }
        } catch (error) {
          logger.error('Error sending client signed notification:', error);
        }
      }
      
      console.log('Rapporto firmato:', { id, role: userRole });
      return report;
    } catch (error) {
      console.error('Errore firma rapporto:', error);
      throw error;
    }
  }
  
  // ========== INVIO RAPPORTI ==========
  
  async sendReportToClient(id: string, userId: string) {
    try {
      const report = await this.getReportById(id, userId, 'PROFESSIONAL');
      
      if (!report) {
        throw new AppError('Rapporto non trovato', 404);
      }
      
      if (report.professionalId !== userId) {
        throw new AppError('Non autorizzato a inviare questo rapporto', 403);
      }
      
      if (report.isDraft) {
        throw new AppError('Non è possibile inviare una bozza', 400);
      }
      
      // Aggiorna timestamp invio
      report.sentToClientAt = new Date();
      
      // ✅ NUOVO: Notifica al cliente dell'invio del rapporto
      try {
        await notificationService.sendToUser({
          userId: report.clientId,
          type: 'REPORT_SENT',
          title: '📧 Rapporto di intervento inviato',
          message: `Ti è stato inviato il rapporto di intervento ${report.reportNumber}. Clicca per visualizzarlo.`,
          priority: 'high',
          data: {
            reportId: id,
            reportNumber: report.reportNumber,
            requestId: report.requestId,
            professionalName: report.professional?.fullName,
            actionUrl: `${process.env.FRONTEND_URL}/reports/${id}`
          },
          channels: ['websocket', 'email']
        });
      } catch (error) {
        logger.error('Error sending report sent notification:', error);
      }
      
      console.log('Rapporto inviato al cliente:', { id, clientId: report.clientId });
      return {
        success: true,
        message: 'Rapporto inviato con successo al cliente'
      };
    } catch (error) {
      console.error('Errore invio rapporto:', error);
      throw error;
    }
  }
  
  // ========== STATISTICHE ==========
  
  async getReportStats(userId: string, userRole: string) {
    try {
      const allReports = await this.getReports({}, userId, userRole);
      const reports = allReports.data;
      
      const stats = {
        total: reports.length,
        draft: reports.filter((r: any) => r.isDraft).length,
        sent: reports.filter((r: any) => r.sentToClientAt).length,
        signed: reports.filter((r: any) => r.clientSignedAt).length,
        pending: reports.filter((r: any) => !r.isDraft && !r.clientSignedAt).length,
        thisMonth: reports.filter((r: any) => {
          const date = new Date(r.createdAt);
          const now = new Date();
          return date.getMonth() === now.getMonth() && 
                 date.getFullYear() === now.getFullYear();
        }).length,
        totalHours: reports.reduce((sum: number, r: any) => sum + (r.totalHours || 0), 0),
        averageHours: reports.length > 0 
          ? reports.reduce((sum: number, r: any) => sum + (r.totalHours || 0), 0) / reports.length
          : 0
      };
      
      return stats;
    } catch (error) {
      console.error('Errore calcolo statistiche:', error);
      throw error;
    }
  }
}

export default new InterventionReportOperationsService();
