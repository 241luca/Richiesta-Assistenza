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

// Custom error class per distinguere i tipi di errore
export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

// Service class
export class ScheduledInterventionService {
  
  // Lista interventi per richiesta (usando Prisma ORM)
  static async getInterventionsByRequest(requestId: string, userId: string) {
    try {
      logger.info('Getting interventions for request:', { requestId, userId });
      
      // Prima ottieni i dati dell'utente per verificare se è admin
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

      // Gli admin possono vedere tutto
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        logger.info('Admin user accessing interventions:', { userId, requestId });
        
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

        logger.info('Interventions retrieved for admin:', { 
          count: interventions.length,
          requestId 
        });
        
        return interventions;
      }
      
      // Per utenti non admin, verifica che abbiano accesso alla richiesta
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

  // Proponi interventi multipli (dal professionista)
  static async proposeInterventions(professionalId: string, data: any) {
    try {
      const validated = proposeInterventionSchema.parse(data);
      const { requestId, interventions } = validated;
      
      logger.info('Professional proposing interventions:', { 
        professionalId, 
        requestId, 
        count: interventions.length 
      });
      
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
          requestId, 
          professionalId 
        });
        throw new AuthorizationError('Richiesta non trovata o non assegnata a te');
      }

      // Crea gli interventi proposti
      const createdInterventions = await Promise.all(
        interventions.map(async (intervention) => {
          return await prisma.scheduledIntervention.create({
            data: {
              id: uuidv4(),
              requestId: requestId,
              professionalId: professionalId,
              proposedDate: new Date(intervention.proposedDate),
              description: intervention.description,
              estimatedDuration: intervention.estimatedDuration,
              status: 'PROPOSED',
              createdBy: professionalId
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
              }
            }
          });
        })
      );

      logger.info('Interventions created:', { 
        count: createdInterventions.length,
        requestId 
      });

      // ✅ Invia notifica al cliente utilizzando il notification service
      if (request.client) {
        await sendInterventionNotification({
          recipientId: request.client.id,
          type: 'intervention_proposed',
          title: 'Nuovi Interventi Proposti',
          message: `Il professionista ${request.professional?.fullName} ha proposto ${createdInterventions.length} interventi per la tua richiesta "${request.title}"`,
          requestId: requestId,
          priority: 'high'
        });
      }

      // Emit socket event per aggiornamento real-time
      const io = getIO();
      io.to(`user:${request.clientId}`).emit('interventions:proposed', {
        requestId,
        interventions: createdInterventions,
        professionalName: request.professional?.fullName
      });

      return createdInterventions;
      
    } catch (error: any) {
      logger.error('Error proposing interventions:', error);
      throw error;
    }
  }

  // Accetta/Rifiuta intervento (dal cliente)
  static async respondToIntervention(
    clientId: string, 
    interventionId: string, 
    status: 'CONFIRMED' | 'REJECTED',
    reason?: string
  ) {
    try {
      logger.info('Client responding to intervention:', { 
        clientId, 
        interventionId, 
        status 
      });
      
      // Verifica che l'intervento esista e appartenga al cliente
      const intervention = await prisma.scheduledIntervention.findFirst({
        where: {
          id: interventionId,
          Request: {
            clientId: clientId
          },
          status: 'PROPOSED'
        },
        include: {
          Request: {
            select: {
              id: true,
              title: true,
              clientId: true,
              professionalId: true
            }
          },
          Professional: {
            select: {
              id: true,
              email: true,
              fullName: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      if (!intervention) {
        logger.warn('Intervention not found or not authorized:', { 
          interventionId, 
          clientId 
        });
        throw new AuthorizationError('Intervento non trovato o non autorizzato');
      }

      // Aggiorna lo stato dell'intervento
      const updatedIntervention = await prisma.scheduledIntervention.update({
        where: { id: interventionId },
        data: {
          status: status,
          confirmedAt: status === 'CONFIRMED' ? new Date() : null,
          rejectionReason: status === 'REJECTED' ? reason : null,
          respondedAt: new Date()
        },
        include: {
          Professional: true
        }
      });

      logger.info('Intervention status updated:', { 
        interventionId, 
        status,
        professionalId: intervention.Professional?.id 
      });

      // ✅ Invia notifica al professionista
      if (intervention.Professional) {
        const notificationTitle = status === 'CONFIRMED' 
          ? 'Intervento Confermato' 
          : 'Intervento Rifiutato';
        
        const notificationMessage = status === 'CONFIRMED'
          ? `Il cliente ha confermato l'intervento del ${new Date(intervention.proposedDate).toLocaleDateString('it-IT')} per la richiesta "${intervention.Request.title}"`
          : `Il cliente ha rifiutato l'intervento del ${new Date(intervention.proposedDate).toLocaleDateString('it-IT')} per la richiesta "${intervention.Request.title}"${reason ? `. Motivo: ${reason}` : ''}`;

        await sendInterventionNotification({
          recipientId: intervention.Professional.id,
          type: status === 'CONFIRMED' ? 'intervention_confirmed' : 'intervention_rejected',
          title: notificationTitle,
          message: notificationMessage,
          requestId: intervention.Request.id,
          interventionId: interventionId,
          priority: status === 'CONFIRMED' ? 'high' : 'normal'
        });
      }

      // Emit socket event
      const io = getIO();
      io.to(`user:${intervention.Request.professionalId}`).emit(`intervention:${status.toLowerCase()}`, {
        interventionId,
        requestId: intervention.Request.id,
        proposedDate: intervention.proposedDate,
        reason: reason
      });

      // Se è confermato, aggiorna anche lo stato della richiesta se necessario
      if (status === 'CONFIRMED') {
        await prisma.assistanceRequest.update({
          where: { id: intervention.Request.id },
          data: { 
            status: 'IN_PROGRESS',
            updatedAt: new Date()
          }
        });
      }

      return updatedIntervention;
      
    } catch (error: any) {
      logger.error('Error responding to intervention:', error);
      throw error;
    }
  }

  // Cancella intervento
  static async cancelIntervention(
    userId: string, 
    interventionId: string, 
    reason: string
  ) {
    try {
      logger.info('Cancelling intervention:', { userId, interventionId });
      
      // Verifica che l'intervento esista e l'utente abbia il permesso
      const intervention = await prisma.scheduledIntervention.findFirst({
        where: {
          id: interventionId,
          OR: [
            { professionalId: userId },
            { Request: { clientId: userId } }
          ],
          status: { in: ['PROPOSED', 'CONFIRMED'] }
        },
        include: {
          Request: {
            select: {
              id: true,
              title: true,
              clientId: true,
              professionalId: true,
              client: {
                select: {
                  id: true,
                  email: true,
                  fullName: true
                }
              },
              professional: {
                select: {
                  id: true,
                  email: true,
                  fullName: true
                }
              }
            }
          }
        }
      });

      if (!intervention) {
        logger.warn('Intervention not found or not authorized to cancel:', { 
          interventionId, 
          userId 
        });
        throw new AuthorizationError('Intervento non trovato o non autorizzato alla cancellazione');
      }

      // Aggiorna lo stato a CANCELLED
      const cancelledIntervention = await prisma.scheduledIntervention.update({
        where: { id: interventionId },
        data: {
          status: 'CANCELLED',
          cancellationReason: reason,
          cancelledBy: userId,
          cancelledAt: new Date()
        }
      });

      logger.info('Intervention cancelled:', { interventionId });

      // Determina chi inviare la notifica
      const isClient = intervention.Request.clientId === userId;
      const recipientId = isClient 
        ? intervention.Request.professionalId 
        : intervention.Request.clientId;
      
      const recipientName = isClient 
        ? intervention.Request.professional?.fullName 
        : intervention.Request.client?.fullName;

      const cancellerRole = isClient ? 'cliente' : 'professionista';

      // ✅ Invia notifica all'altra parte
      if (recipientId) {
        await sendInterventionNotification({
          recipientId: recipientId,
          type: 'intervention_cancelled',
          title: 'Intervento Cancellato',
          message: `L'intervento del ${new Date(intervention.proposedDate).toLocaleDateString('it-IT')} è stato cancellato dal ${cancellerRole}. Motivo: ${reason}`,
          requestId: intervention.Request.id,
          interventionId: interventionId,
          priority: 'high'
        });
      }

      // Emit socket event
      const io = getIO();
      io.to(`user:${recipientId}`).emit('intervention:cancelled', {
        interventionId,
        requestId: intervention.Request.id,
        cancelledBy: userId,
        reason
      });

      return cancelledIntervention;
      
    } catch (error: any) {
      logger.error('Error cancelling intervention:', error);
      throw error;
    }
  }

  // Completa intervento
  static async completeIntervention(
    professionalId: string, 
    interventionId: string, 
    completionData: {
      notes?: string;
      actualDuration?: number;
      materialsUsed?: any[];
    }
  ) {
    try {
      logger.info('Completing intervention:', { professionalId, interventionId });
      
      // Verifica che l'intervento esista e appartenga al professionista
      const intervention = await prisma.scheduledIntervention.findFirst({
        where: {
          id: interventionId,
          professionalId: professionalId,
          status: 'CONFIRMED'
        },
        include: {
          Request: {
            select: {
              id: true,
              title: true,
              clientId: true,
              client: {
                select: {
                  id: true,
                  email: true,
                  fullName: true
                }
              }
            }
          },
          Professional: {
            select: {
              fullName: true
            }
          }
        }
      });

      if (!intervention) {
        logger.warn('Intervention not found or not authorized to complete:', { 
          interventionId, 
          professionalId 
        });
        throw new AuthorizationError('Intervento non trovato o non autorizzato al completamento');
      }

      // Aggiorna lo stato a COMPLETED
      const completedIntervention = await prisma.scheduledIntervention.update({
        where: { id: interventionId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          completionNotes: completionData.notes,
          actualDuration: completionData.actualDuration,
          materialsUsed: completionData.materialsUsed
        }
      });

      logger.info('Intervention completed:', { interventionId });

      // ✅ Invia notifica al cliente
      if (intervention.Request.client) {
        await sendInterventionNotification({
          recipientId: intervention.Request.client.id,
          type: 'intervention_completed',
          title: 'Intervento Completato',
          message: `Il professionista ${intervention.Professional?.fullName} ha completato l'intervento per la richiesta "${intervention.Request.title}"`,
          requestId: intervention.Request.id,
          interventionId: interventionId,
          priority: 'normal'
        });
      }

      // Emit socket event
      const io = getIO();
      io.to(`user:${intervention.Request.clientId}`).emit('intervention:completed', {
        interventionId,
        requestId: intervention.Request.id,
        completedAt: new Date()
      });

      // Verifica se tutti gli interventi sono completati
      const allInterventions = await prisma.scheduledIntervention.findMany({
        where: {
          requestId: intervention.Request.id,
          status: { not: 'CANCELLED' }
        }
      });

      const allCompleted = allInterventions.every(int => 
        int.status === 'COMPLETED' || int.status === 'CANCELLED'
      );

      // Se tutti gli interventi sono completati, aggiorna anche la richiesta
      if (allCompleted) {
        await prisma.assistanceRequest.update({
          where: { id: intervention.Request.id },
          data: { 
            status: 'COMPLETED',
            completedDate: new Date()
          }
        });

        logger.info('All interventions completed, request marked as completed:', { 
          requestId: intervention.Request.id 
        });
      }

      return completedIntervention;
      
    } catch (error: any) {
      logger.error('Error completing intervention:', error);
      throw error;
    }
  }

  // Get single intervention
  static async getIntervention(interventionId: string, userId: string) {
    try {
      logger.info('Getting single intervention:', { interventionId, userId });

      // Prima ottieni i dati dell'utente per verificare se è admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      // Build the where clause based on user role
      let whereClause: any = { id: interventionId };
      
      // If not admin, check authorization
      if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
        whereClause = {
          id: interventionId,
          OR: [
            { professionalId: userId },
            { Request: { clientId: userId } }
          ]
        };
      }

      const intervention = await prisma.scheduledIntervention.findFirst({
        where: whereClause,
        include: {
          Professional: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              email: true,
              phone: true
            }
          },
          Request: {
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              clientId: true,
              professionalId: true
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
        }
      });

      if (!intervention) {
        logger.warn('Intervention not found or not authorized:', { 
          interventionId, 
          userId 
        });
        throw new AuthorizationError('Intervento non trovato o non autorizzato');
      }

      logger.info('Intervention retrieved:', { interventionId });
      return intervention;
      
    } catch (error: any) {
      logger.error('Error getting intervention:', error);
      throw error;
    }
  }
}

export default ScheduledInterventionService;
