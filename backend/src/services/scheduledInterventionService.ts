import { Request, Response } from 'express';
import { z } from 'zod';
import { getIO } from '../utils/socket';
import { sendEmail } from './email.service';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import { ResponseFormatter } from '../utils/responseFormatter';
import { notificationService } from './notification.service'; // ✅ Import notification service
import { v4 as uuidv4 } from 'uuid';

// Validation schemas
const proposeInterventionSchema = z.object({
  requestId: z.string().uuid(),
  interventions: z.array(z.object({
    proposedDate: z.string().datetime(),
    description: z.string().optional(),
    estimatedDuration: z.number().optional(),
  })).min(1).max(10)
});

// ✅ NUOVO: Helper per inviare notifiche unificate
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
      channels: ['websocket', 'email'] // Notifica sia in-app che email
    });
  } catch (error) {
    logger.error('Error sending intervention notification:', error);
  }
}

// Service class
export class ScheduledInterventionService {
  
  // Lista interventi per richiesta (usando Prisma ORM)
  static async getInterventionsByRequest(requestId: string, userId: string) {
    try {
      logger.info('Getting interventions for request:', { requestId, userId });
      
      // Prima verifica che l'utente abbia accesso alla richiesta
      const request = await prisma.assistanceRequest.findFirst({
        where: {
          id: requestId,
          OR: [
            { clientId: userId },
            { professionalId: userId }
          ]
        }
      });

      if (!request) {
        logger.warn('User not authorized to view interventions:', { requestId, userId });
        throw new Error('Non autorizzato a vedere questi interventi');
      }

      // Usa Prisma ORM per ottenere gli interventi
      const interventions = await prisma.scheduledIntervention.findMany({
        where: {
          requestId: requestId
        },
        include: {
          Professional: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              email: true
            }
          },
          Creator: {
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

      logger.info('Found interventions:', { count: interventions.length });
      return interventions;
    } catch (error) {
      logger.error('Error getting interventions:', error);
      throw error;
    }
  }

  // Proponi date per intervento
  static async proposeInterventions(professionalId: string, data: any) {
    try {
      const { requestId, interventions } = data;
      
      // Verifica che la richiesta esista e sia assegnata al professionista
      const request = await prisma.assistanceRequest.findFirst({
        where: {
          id: requestId,
          professionalId: professionalId,
          status: { in: ['ASSIGNED', 'IN_PROGRESS'] }
        },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              email: true
            }
          },
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

      if (!request) {
        throw new Error('Richiesta non trovata o non assegnata');
      }

      // Crea gli interventi proposti
      const createdInterventions = [];
      for (const intervention of interventions) {
        const created = await prisma.scheduledIntervention.create({
          data: {
            id: uuidv4(),
            requestId,
            professionalId,
            proposedDate: new Date(intervention.proposedDate),
            description: intervention.description,
            estimatedDuration: intervention.estimatedDuration,
            status: 'PROPOSED',
            createdBy: professionalId,
            updatedAt: new Date()
          },
          include: {
            Professional: true
          }
        });
        createdInterventions.push(created);
      }

      // ✅ NUOVO: Invia notifica al cliente
      const professionalName = request.professional?.fullName || 
                              `${request.professional?.firstName} ${request.professional?.lastName}`;
      
      await sendInterventionNotification({
        recipientId: request.clientId,
        type: 'INTERVENTION_PROPOSED',
        title: '📅 Nuove date proposte per intervento',
        message: `${professionalName} ha proposto ${createdInterventions.length} ${createdInterventions.length === 1 ? 'data' : 'date'} per l'intervento. Conferma quella che preferisci.`,
        requestId,
        priority: 'high',
        actionUrl: `${process.env.FRONTEND_URL}/requests/${requestId}/interventions`
      });

      // Emit WebSocket event
      const io = getIO();
      if (io) {
        io.to(`request:${requestId}`).emit('intervention:proposed', {
          requestId,
          interventions: createdInterventions,
          professionalId
        });
      }

      logger.info('Interventions proposed:', { 
        requestId, 
        count: createdInterventions.length 
      });

      return createdInterventions;
    } catch (error) {
      logger.error('Error proposing interventions:', error);
      throw error;
    }
  }

  // Conferma intervento (cliente)
  static async confirmIntervention(clientId: string, interventionId: string) {
    try {
      // Verifica che l'intervento esista e appartenga al cliente
      const intervention = await prisma.scheduledIntervention.findFirst({
        where: {
          id: interventionId,
          AssistanceRequest: {
            clientId: clientId
          },
          status: 'PROPOSED'
        },
        include: {
          AssistanceRequest: {
            include: {
              client: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  fullName: true,
                  email: true
                }
              }
            }
          },
          Professional: {
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

      if (!intervention) {
        throw new Error('Intervento non trovato o non disponibile');
      }

      // Aggiorna lo stato dell'intervento
      const updated = await prisma.scheduledIntervention.update({
        where: { id: interventionId },
        data: {
          status: 'CONFIRMED',
          confirmedDate: intervention.proposedDate,
          clientConfirmed: true,
          updatedAt: new Date()
        }
      });

      // Cancella altri interventi proposti per la stessa richiesta
      await prisma.scheduledIntervention.updateMany({
        where: {
          requestId: intervention.requestId,
          id: { not: interventionId },
          status: 'PROPOSED'
        },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date()
        }
      });

      // ✅ NUOVO: Notifica al professionista
      const clientName = intervention.AssistanceRequest.client?.fullName || 
                        `${intervention.AssistanceRequest.client?.firstName} ${intervention.AssistanceRequest.client?.lastName}`;
      
      await sendInterventionNotification({
        recipientId: intervention.professionalId,
        type: 'INTERVENTION_CONFIRMED',
        title: '✅ Intervento confermato',
        message: `${clientName} ha confermato l'intervento per ${new Date(intervention.proposedDate).toLocaleDateString('it-IT', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit'
        })}`,
        requestId: intervention.requestId,
        interventionId: interventionId,
        priority: 'high'
      });

      // ✅ NUOVO: Notifica di conferma anche al cliente
      await sendInterventionNotification({
        recipientId: clientId,
        type: 'INTERVENTION_CONFIRMATION',
        title: '✅ Intervento programmato con successo',
        message: `Hai confermato l'intervento per ${new Date(intervention.proposedDate).toLocaleDateString('it-IT', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit'
        })}. Il professionista è stato notificato.`,
        requestId: intervention.requestId,
        interventionId: interventionId,
        priority: 'normal'
      });

      // Emit WebSocket event
      const io = getIO();
      if (io) {
        io.to(`request:${intervention.requestId}`).emit('intervention:confirmed', {
          interventionId,
          requestId: intervention.requestId,
          confirmedDate: intervention.proposedDate
        });
      }

      logger.info('Intervention confirmed:', { interventionId });
      return updated;
    } catch (error) {
      logger.error('Error confirming intervention:', error);
      throw error;
    }
  }

  // Rifiuta intervento (cliente)
  static async declineIntervention(clientId: string, interventionId: string, reason?: string) {
    try {
      // Verifica che l'intervento esista e appartenga al cliente
      const intervention = await prisma.scheduledIntervention.findFirst({
        where: {
          id: interventionId,
          AssistanceRequest: {
            clientId: clientId
          },
          status: 'PROPOSED'
        },
        include: {
          AssistanceRequest: {
            include: {
              client: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  fullName: true
                }
              }
            }
          },
          Professional: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true
            }
          }
        }
      });

      if (!intervention) {
        throw new Error('Intervento non trovato o non disponibile');
      }

      // Aggiorna lo stato dell'intervento
      const updated = await prisma.scheduledIntervention.update({
        where: { id: interventionId },
        data: {
          status: 'DECLINED',
          clientDeclineReason: reason,
          updatedAt: new Date()
        }
      });

      // ✅ NUOVO: Notifica al professionista del rifiuto
      const clientName = intervention.AssistanceRequest.client?.fullName || 
                        `${intervention.AssistanceRequest.client?.firstName} ${intervention.AssistanceRequest.client?.lastName}`;
      
      await sendInterventionNotification({
        recipientId: intervention.professionalId,
        type: 'INTERVENTION_DECLINED',
        title: '❌ Data intervento rifiutata',
        message: `${clientName} ha rifiutato la data proposta per l'intervento${reason ? `: ${reason}` : ''}. Proponi una nuova data.`,
        requestId: intervention.requestId,
        interventionId: interventionId,
        priority: 'normal'
      });

      // Emit WebSocket event
      const io = getIO();
      if (io) {
        io.to(`request:${intervention.requestId}`).emit('intervention:declined', {
          interventionId,
          requestId: intervention.requestId,
          reason
        });
      }

      logger.info('Intervention declined:', { interventionId, reason });
      return updated;
    } catch (error) {
      logger.error('Error declining intervention:', error);
      throw error;
    }
  }

  // Completa intervento
  static async completeIntervention(professionalId: string, interventionId: string, data: any) {
    try {
      // Verifica che l'intervento esista e appartenga al professionista
      const intervention = await prisma.scheduledIntervention.findFirst({
        where: {
          id: interventionId,
          professionalId: professionalId,
          status: 'CONFIRMED'
        },
        include: {
          AssistanceRequest: {
            include: {
              client: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  fullName: true,
                  email: true
                }
              }
            }
          },
          Professional: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true
            }
          }
        }
      });

      if (!intervention) {
        throw new Error('Intervento non trovato o non confermato');
      }

      // Aggiorna lo stato dell'intervento
      const updated = await prisma.scheduledIntervention.update({
        where: { id: interventionId },
        data: {
          status: 'COMPLETED',
          actualDuration: data.actualDuration,
          notes: data.notes,
          updatedAt: new Date()
        }
      });

      // ✅ NUOVO: Notifica al cliente del completamento
      const professionalName = intervention.Professional?.fullName || 
                              `${intervention.Professional?.firstName} ${intervention.Professional?.lastName}`;
      
      await sendInterventionNotification({
        recipientId: intervention.AssistanceRequest.clientId,
        type: 'INTERVENTION_COMPLETED',
        title: '✅ Intervento completato',
        message: `${professionalName} ha completato l'intervento. ${data.notes ? `Note: ${data.notes}` : 'Controlla i dettagli e il rapporto di intervento.'}`,
        requestId: intervention.requestId,
        interventionId: interventionId,
        priority: 'high',
        actionUrl: `${process.env.FRONTEND_URL}/requests/${intervention.requestId}/report`
      });

      // Emit WebSocket event
      const io = getIO();
      if (io) {
        io.to(`request:${intervention.requestId}`).emit('intervention:completed', {
          interventionId,
          requestId: intervention.requestId,
          actualDuration: data.actualDuration
        });
      }

      logger.info('Intervention completed:', { interventionId });
      return updated;
    } catch (error) {
      logger.error('Error completing intervention:', error);
      throw error;
    }
  }

  // ✅ NUOVO: Invia promemoria per interventi imminenti
  static async sendInterventionReminders() {
    try {
      // Trova interventi confermati nelle prossime 24 ore
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const upcomingInterventions = await prisma.scheduledIntervention.findMany({
        where: {
          status: 'CONFIRMED',
          proposedDate: {
            gte: new Date(),
            lte: tomorrow
          }
        },
        include: {
          AssistanceRequest: {
            include: {
              client: true
            }
          },
          Professional: true
        }
      });

      for (const intervention of upcomingInterventions) {
        const interventionTime = new Date(intervention.proposedDate).toLocaleDateString('it-IT', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit'
        });

        // Promemoria al cliente
        await sendInterventionNotification({
          recipientId: intervention.AssistanceRequest.clientId,
          type: 'INTERVENTION_REMINDER',
          title: '⏰ Promemoria intervento domani',
          message: `Promemoria: hai un intervento programmato per ${interventionTime} con ${intervention.Professional.fullName || intervention.Professional.firstName}`,
          requestId: intervention.requestId,
          interventionId: intervention.id,
          priority: 'normal'
        });

        // Promemoria al professionista
        await sendInterventionNotification({
          recipientId: intervention.professionalId,
          type: 'INTERVENTION_REMINDER',
          title: '⏰ Promemoria intervento domani',
          message: `Promemoria: hai un intervento programmato per ${interventionTime} presso ${intervention.AssistanceRequest.client.fullName || intervention.AssistanceRequest.client.firstName}`,
          requestId: intervention.requestId,
          interventionId: intervention.id,
          priority: 'normal'
        });
      }

      logger.info(`Sent reminders for ${upcomingInterventions.length} upcoming interventions`);
      return upcomingInterventions.length;
    } catch (error) {
      logger.error('Error sending intervention reminders:', error);
      throw error;
    }
  }

  // Cancella intervento
  static async cancelIntervention(userId: string, interventionId: string, reason?: string) {
    try {
      // Verifica che l'intervento esista e l'utente abbia i permessi
      const intervention = await prisma.scheduledIntervention.findFirst({
        where: {
          id: interventionId,
          OR: [
            { professionalId: userId },
            { AssistanceRequest: { clientId: userId } }
          ],
          status: { in: ['PROPOSED', 'CONFIRMED'] }
        },
        include: {
          AssistanceRequest: {
            include: {
              client: true
            }
          },
          Professional: true
        }
      });

      if (!intervention) {
        throw new Error('Intervento non trovato o non cancellabile');
      }

      // Aggiorna lo stato
      const updated = await prisma.scheduledIntervention.update({
        where: { id: interventionId },
        data: {
          status: 'CANCELLED',
          notes: reason,
          updatedAt: new Date()
        }
      });

      // ✅ NUOVO: Determina chi ha cancellato e notifica l'altra parte
      const isCancelledByClient = userId === intervention.AssistanceRequest.clientId;
      const recipientId = isCancelledByClient ? intervention.professionalId : intervention.AssistanceRequest.clientId;
      const cancellerName = isCancelledByClient 
        ? (intervention.AssistanceRequest.client.fullName || intervention.AssistanceRequest.client.firstName)
        : (intervention.Professional.fullName || intervention.Professional.firstName);

      await sendInterventionNotification({
        recipientId,
        type: 'INTERVENTION_CANCELLED',
        title: '❌ Intervento cancellato',
        message: `${cancellerName} ha cancellato l'intervento programmato${reason ? `: ${reason}` : ''}`,
        requestId: intervention.requestId,
        interventionId: interventionId,
        priority: 'high'
      });

      // Emit WebSocket event
      const io = getIO();
      if (io) {
        io.to(`request:${intervention.requestId}`).emit('intervention:cancelled', {
          interventionId,
          requestId: intervention.requestId,
          cancelledBy: userId,
          reason
        });
      }

      logger.info('Intervention cancelled:', { interventionId, cancelledBy: userId });
      return updated;
    } catch (error) {
      logger.error('Error cancelling intervention:', error);
      throw error;
    }
  }
}

export default ScheduledInterventionService;
