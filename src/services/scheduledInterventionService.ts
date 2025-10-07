import { Request, Response } from 'express';
import { z } from 'zod';
import { sendEmail } from './email.service';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import { ResponseFormatter } from '../utils/responseFormatter';
import { notificationService } from './notification.service';
import { v4 as uuidv4 } from 'uuid';

// Validation schemas
const proposeInterventionSchema = z.object({
  requestId: z.string().min(1),  // Cambiato da uuid() a string generico
  interventions: z.array(z.object({
    proposedDate: z.string().refine((date) => {
      // Verifica che sia una data valida
      return !isNaN(Date.parse(date));
    }, "Data non valida"),
    description: z.string().optional(),
    estimatedDuration: z.number().optional(),
  })).min(1).max(10)
});

// Helper per inviare notifiche unificate
async function sendInterventionNotification(params: {
  recipientId: string;
  type: string;
  title: string;
  message: string;
  requestId: string;
  interventionId?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  actionUrl?: string;
}) {
  try {
    await notificationService.sendToUser({
      userId: params.recipientId,
      type: params.type,
      title: params.title,
      message: params.message,
      priority: params.priority || 'normal',
      data: {
        requestId: params.requestId,
        interventionId: params.interventionId,
        actionUrl: params.actionUrl || `${process.env.FRONTEND_URL}/requests/${params.requestId}/interventions`
      },
      channels: ['websocket', 'email']
    });
  } catch (error) {
    logger.error('Error sending intervention notification:', error);
  }
}

// Custom error class
export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

// Service class
export class ScheduledInterventionService {
  
  // Lista interventi per richiesta
  static async getInterventionsByRequest(requestId: string, userId: string) {
    try {
      logger.info('Getting interventions for request:', { requestId, userId });
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          role: true,
          firstName: true,
          lastName: true 
        }
      });

      if (!user) {
        logger.warn('User not found:', { userId });
        throw new AuthorizationError('Utente non trovato');
      }

      // Admin possono vedere tutto
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        logger.info('Admin user accessing interventions:', { userId, requestId });
        
        const interventions = await prisma.scheduledIntervention.findMany({
          where: {
            requestId: requestId
          },
          include: {
            professional: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                fullName: true,
                email: true
              }
            },
            createdByUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                fullName: true
              }
            }
          },
          orderBy: {
            proposedDate: 'asc'
          }
        });

        logger.info('Interventions retrieved for admin:', { 
          count: interventions.length,
          requestId 
        });
        
        return interventions;
      }
      
      // Per utenti non admin, verifica accesso alla richiesta
      const request = await prisma.assistanceRequest.findFirst({
        where: {
          id: requestId,
          OR: [
            { clientId: userId },
            { professionalId: userId }
          ]
        },
        select: {
          id: true,
          clientId: true,
          professionalId: true,
          title: true
        }
      });

      if (!request) {
        logger.warn('User not authorized to view interventions:', { 
          requestId, 
          userId,
          userRole: user.role 
        });
        throw new AuthorizationError('Non autorizzato a vedere questi interventi');
      }

      logger.info('User authorized, fetching interventions:', { 
        requestId, 
        userId,
        isClient: request.clientId === userId,
        isProfessional: request.professionalId === userId
      });

      const interventions = await prisma.scheduledIntervention.findMany({
        where: {
          requestId: requestId
        },
        include: {
          professional: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              email: true
            }
          },
          createdByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true
            }
          }
        },
        orderBy: {
          proposedDate: 'asc'
        }
      });

      logger.info('Interventions retrieved successfully:', { 
        count: interventions.length,
        requestId,
        userId 
      });

      return interventions;
      
    } catch (error: any) {
      logger.error('Error getting interventions:', error.message, { 
        requestId, 
        userId,
        errorType: error.name 
      });
      throw error;
    }
  }

  // NUOVO: Proponi interventi (professionista)
  static async proposeInterventions(professionalId: string, data: any) {
    try {
      logger.info('Professional proposing interventions:', { 
        professionalId, 
        requestId: data.requestId,
        interventionsCount: data.interventions?.length 
      });
      
      // Valida i dati con Zod
      const validatedData = proposeInterventionSchema.parse(data);
      
      // Verifica che la richiesta esista e sia assegnata al professionista
      const request = await prisma.assistanceRequest.findFirst({
        where: {
          id: validatedData.requestId,
          professionalId: professionalId,
          status: { in: ['ASSIGNED', 'IN_PROGRESS'] }
        },
        include: {
          client: {
            select: {
              id: true,
              email: true,
              fullName: true,
              firstName: true,
              lastName: true
            }
          },
          professional: {
            select: {
              id: true,
              fullName: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      if (!request) {
        logger.warn('Request not found or not assigned to professional:', { 
          requestId: validatedData.requestId, 
          professionalId 
        });
        throw new AuthorizationError('Richiesta non trovata o non assegnata a questo professionista');
      }

      // Crea gli interventi proposti
      const createdInterventions = await Promise.all(
        validatedData.interventions.map(async (intervention) => {
          const now = new Date();
          return await prisma.scheduledIntervention.create({
            data: {
              id: uuidv4(),
              requestId: validatedData.requestId,
              professionalId: professionalId,
              status: 'PROPOSED',
              proposedDate: new Date(intervention.proposedDate),
              description: intervention.description || `Intervento per: ${request.title}`,
              estimatedDuration: intervention.estimatedDuration || 60,
              createdBy: professionalId,
              createdAt: now,
              updatedAt: now
            },
            include: {
              professional: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  fullName: true,
                  email: true
                }
              }
            }
          });
        })
      );

      logger.info('Interventions created:', { 
        count: createdInterventions.length,
        requestId: validatedData.requestId 
      });

      // Invia notifica al cliente
      if (request.client) {
        await sendInterventionNotification({
          recipientId: request.client.id,
          type: 'interventions_proposed',
          title: 'Nuovi Interventi Proposti',
          message: `Il professionista ${request.professional?.fullName} ha proposto ${createdInterventions.length} interventi per la tua richiesta "${request.title}"`,
          requestId: request.id,
          priority: 'high',
          actionUrl: `${process.env.FRONTEND_URL}/requests/${request.id}/interventions`
        });

        // Emit socket event per aggiornamento real-time usando notificationService
        notificationService.emitToUser(request.client.id, 'interventions:proposed', {
          requestId: request.id,
          interventions: createdInterventions,
          professionalName: request.professional?.fullName
        });
      }

      return createdInterventions;
      
    } catch (error: any) {
      logger.error('Error proposing interventions:', error);
      throw error;
    }
  }

  // NUOVO: Cliente accetta intervento
  static async acceptIntervention(interventionId: string, clientId: string) {
    try {
      logger.info('Client accepting intervention:', { interventionId, clientId });
      
      // Verifica che l'intervento esista e il cliente abbia accesso
      const intervention = await prisma.scheduledIntervention.findFirst({
        where: {
          id: interventionId
        },
        include: {
          request: {
            include: {
              client: true,
              professional: true
            }
          },
          professional: true
        }
      });

      if (!intervention) {
        throw new Error('Intervento non trovato');
      }

      if (intervention.request.clientId !== clientId) {
        throw new AuthorizationError('Non autorizzato ad accettare questo intervento');
      }

      // Aggiorna lo stato dell'intervento
      const updatedIntervention = await prisma.scheduledIntervention.update({
        where: { id: interventionId },
        data: {
          status: 'ACCEPTED',
          clientConfirmed: true,
          confirmedDate: new Date(),
          updatedAt: new Date()
        },
        include: {
          professional: true,
          request: true
        }
      });

      // Invia notifica al professionista
      await sendInterventionNotification({
        recipientId: intervention.professionalId,
        type: 'intervention_accepted',
        title: 'Intervento Accettato',
        message: `Il cliente ${intervention.request.client?.fullName} ha accettato l'intervento proposto per il ${new Date(intervention.proposedDate).toLocaleDateString('it-IT')}`,
        requestId: intervention.requestId,
        priority: 'high',
        actionUrl: `${process.env.FRONTEND_URL}/requests/${intervention.requestId}/interventions`
      });

      // Emit socket event per aggiornamento real-time usando notificationService
      notificationService.emitToUser(intervention.professionalId, 'intervention:accepted', {
        interventionId,
        requestId: intervention.requestId,
        clientName: intervention.request.client?.fullName
      });

      logger.info('Intervention accepted successfully:', { interventionId });
      return updatedIntervention;
      
    } catch (error: any) {
      logger.error('Error accepting intervention:', error);
      throw error;
    }
  }

  // NUOVO: Cliente rifiuta intervento
  static async rejectIntervention(interventionId: string, clientId: string, reason?: string) {
    try {
      logger.info('Client rejecting intervention:', { interventionId, clientId, reason });
      
      // Verifica che l'intervento esista e il cliente abbia accesso
      const intervention = await prisma.scheduledIntervention.findFirst({
        where: {
          id: interventionId
        },
        include: {
          request: {
            include: {
              client: true,
              professional: true
            }
          },
          professional: true
        }
      });

      if (!intervention) {
        throw new Error('Intervento non trovato');
      }

      if (intervention.request.clientId !== clientId) {
        throw new AuthorizationError('Non autorizzato a rifiutare questo intervento');
      }

      // Aggiorna lo stato dell'intervento
      const updatedIntervention = await prisma.scheduledIntervention.update({
        where: { id: interventionId },
        data: {
          status: 'REJECTED',
          clientConfirmed: false,
          clientDeclineReason: reason,
          updatedAt: new Date()
        },
        include: {
          professional: true,
          request: true
        }
      });

      // Invia notifica al professionista
      await sendInterventionNotification({
        recipientId: intervention.professionalId,
        type: 'intervention_rejected',
        title: 'Intervento Rifiutato',
        message: `Il cliente ${intervention.request.client?.fullName} ha rifiutato l'intervento proposto per il ${new Date(intervention.proposedDate).toLocaleDateString('it-IT')}${reason ? `. Motivo: ${reason}` : ''}`,
        requestId: intervention.requestId,
        priority: 'normal',
        actionUrl: `${process.env.FRONTEND_URL}/requests/${intervention.requestId}/interventions`
      });

      // Emit socket event per aggiornamento real-time usando notificationService
      notificationService.emitToUser(intervention.professionalId, 'intervention:rejected', {
        interventionId,
        requestId: intervention.requestId,
        clientName: intervention.request.client?.fullName,
        reason
      });

      logger.info('Intervention rejected successfully:', { interventionId });
      return updatedIntervention;
      
    } catch (error: any) {
      logger.error('Error rejecting intervention:', error);
      throw error;
    }
  }

  // Altri metodi esistenti...
  // (respondToIntervention, cancelIntervention, completeIntervention, getIntervention)
}

export default ScheduledInterventionService;
