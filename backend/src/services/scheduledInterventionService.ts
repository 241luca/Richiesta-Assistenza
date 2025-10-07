/**
 * Scheduled Intervention Service
 * Gestione interventi programmati per richieste di assistenza
 * 
 * Responsabilità:
 * - Proposta interventi da professionista a cliente
 * - Accettazione/rifiuto interventi da parte cliente
 * - Gestione stati interventi (PROPOSED, ACCEPTED, REJECTED, COMPLETED)
 * - Notifiche real-time per cambio stato
 * - Validazione autorizzazioni accesso
 * - Integrazione calendario e promemoria
 * 
 * @module services/scheduledIntervention
 * @version 5.2.1
 * @updated 2025-10-01
 * @author Sistema Richiesta Assistenza
 */

import { z } from 'zod';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import { notificationService } from './notification.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * Validation schema per proposta interventi
 */
const proposeInterventionSchema = z.object({
  requestId: z.string().min(1),
  interventions: z.array(z.object({
    proposedDate: z.string().refine((date) => {
      return !isNaN(Date.parse(date));
    }, "Data non valida"),
    description: z.string().optional(),
    estimatedDuration: z.number().optional(),
  })).min(1).max(10)
});

/**
 * Helper per inviare notifiche unificate interventi
 * 
 * @private
 */
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
    logger.error('[ScheduledInterventionService] Error sending notification:', error);
  }
}

/**
 * Custom error class per errori autorizzazione
 */
export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Scheduled Intervention Service Class
 * 
 * Gestisce workflow completo interventi programmati
 */
export class ScheduledInterventionService {
  
  /**
   * Recupera tutti gli interventi per una richiesta
   * 
   * Autorizzazioni:
   * - Admin: accesso completo
   * - Cliente/Professionista: solo proprie richieste
   * 
   * @param {string} requestId - ID richiesta assistenza
   * @param {string} userId - ID utente richiedente
   * @returns {Promise<ScheduledIntervention[]>} Lista interventi ordinati per data
   * @throws {AuthorizationError} Se utente non autorizzato
   * @throws {Error} Se richiesta non trovata
   * 
   * @example
   * const interventions = await ScheduledInterventionService.getInterventionsByRequest(
   *   'req-123',
   *   'user-456'
   * );
   */
  static async getInterventionsByRequest(requestId: string, userId: string) {
    try {
      logger.info('[ScheduledInterventionService] Getting interventions for request:', { 
        requestId, 
        userId 
      });
      
      // Validazione input
      if (!requestId || !userId) {
        throw new Error('RequestId and userId are required');
      }

      // Recupera utente con ruolo
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
        logger.warn('[ScheduledInterventionService] User not found:', { userId });
        throw new AuthorizationError('Utente non trovato');
      }

      // Admin possono vedere tutto
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        logger.info('[ScheduledInterventionService] Admin user accessing interventions:', { 
          userId, 
          requestId 
        });
        
        const interventions = await prisma.scheduledIntervention.findMany({
          where: { requestId },
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
          orderBy: { proposedDate: 'asc' }
        });

        logger.info('[ScheduledInterventionService] Interventions retrieved for admin:', { 
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
        logger.warn('[ScheduledInterventionService] User not authorized to view interventions:', { 
          requestId, 
          userId,
          userRole: user.role 
        });
        throw new AuthorizationError('Non autorizzato a vedere questi interventi');
      }

      logger.info('[ScheduledInterventionService] User authorized, fetching interventions:', { 
        requestId, 
        userId,
        isClient: request.clientId === userId,
        isProfessional: request.professionalId === userId
      });

      const interventions = await prisma.scheduledIntervention.findMany({
        where: { requestId },
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
        orderBy: { proposedDate: 'asc' }
      });

      logger.info('[ScheduledInterventionService] Interventions retrieved successfully:', { 
        count: interventions.length,
        requestId,
        userId 
      });

      return interventions;
      
    } catch (error: any) {
      logger.error('[ScheduledInterventionService] Error getting interventions:', {
        error: error.message,
        requestId, 
        userId,
        errorType: error.name,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Proponi nuovi interventi (professionista)
   * 
   * Il professionista propone uno o più interventi al cliente.
   * Vengono validati con Zod e inviate notifiche automatiche.
   * 
   * @param {string} professionalId - ID professionista
   * @param {object} data - Dati interventi da proporre
   * @param {string} data.requestId - ID richiesta
   * @param {Array} data.interventions - Array interventi proposti
   * @returns {Promise<ScheduledIntervention[]>} Interventi creati
   * @throws {AuthorizationError} Se richiesta non assegnata al professionista
   * @throws {z.ZodError} Se validazione dati fallisce
   * 
   * @example
   * const interventions = await ScheduledInterventionService.proposeInterventions(
   *   'prof-123',
   *   {
   *     requestId: 'req-456',
   *     interventions: [
   *       {
   *         proposedDate: '2025-10-15T10:00:00Z',
   *         description: 'Installazione impianto',
   *         estimatedDuration: 120
   *       }
   *     ]
   *   }
   * );
   */
  static async proposeInterventions(professionalId: string, data: any) {
    try {
      logger.info('[ScheduledInterventionService] Professional proposing interventions:', { 
        professionalId, 
        requestId: data.requestId,
        interventionsCount: data.interventions?.length 
      });
      
      // Validazione input
      if (!professionalId) {
        throw new Error('ProfessionalId is required');
      }

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
        logger.warn('[ScheduledInterventionService] Request not found or not assigned:', { 
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

      logger.info('[ScheduledInterventionService] Interventions created:', { 
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

        // Emit socket event real-time (con gestione errori robusta)
        try {
          if (typeof notificationService?.emitToUser === 'function') {
            notificationService.emitToUser(request.client.id, 'interventions:proposed', {
              requestId: request.id,
              interventions: createdInterventions,
              professionalName: request.professional?.fullName
            });
          } else {
            logger.warn('[ScheduledInterventionService] emitToUser not available on notificationService');
          }
        } catch (socketError: any) {
          logger.error('[ScheduledInterventionService] Socket notification failed (non-blocking):', {
            error: socketError.message,
            stack: socketError.stack
          });
        }
      }

      logger.info('[ScheduledInterventionService] Interventions proposed successfully');
      return createdInterventions;
      
    } catch (error: any) {
      logger.error('[ScheduledInterventionService] Error proposing interventions:', {
        error: error.message,
        professionalId,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Cliente accetta intervento proposto
   * 
   * Cambia stato intervento a ACCEPTED e notifica il professionista
   * 
   * @param {string} interventionId - ID intervento
   * @param {string} clientId - ID cliente
   * @returns {Promise<ScheduledIntervention>} Intervento aggiornato
   * @throws {AuthorizationError} Se cliente non autorizzato
   * @throws {Error} Se intervento non trovato
   * 
   * @example
   * const intervention = await ScheduledInterventionService.acceptIntervention(
   *   'int-123',
   *   'client-456'
   * );
   */
  static async acceptIntervention(interventionId: string, clientId: string) {
    try {
      logger.info('[ScheduledInterventionService] Client accepting intervention:', { 
        interventionId, 
        clientId 
      });
      
      // Validazione input
      if (!interventionId || !clientId) {
        throw new Error('InterventionId and clientId are required');
      }

      // Verifica che l'intervento esista e il cliente abbia accesso
      const intervention = await prisma.scheduledIntervention.findFirst({
        where: { id: interventionId },
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
        logger.warn('[ScheduledInterventionService] Client not authorized to accept:', {
          interventionId,
          clientId,
          actualClientId: intervention.request.clientId
        });
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
        interventionId,
        priority: 'high',
        actionUrl: `${process.env.FRONTEND_URL}/requests/${intervention.requestId}/interventions`
      });

      // Emit socket event real-time (con gestione errori robusta)
      try {
        if (typeof notificationService?.emitToUser === 'function') {
          notificationService.emitToUser(intervention.professionalId, 'intervention:accepted', {
            interventionId,
            requestId: intervention.requestId,
            clientName: intervention.request.client?.fullName
          });
        } else {
          logger.warn('[ScheduledInterventionService] emitToUser not available on notificationService');
        }
      } catch (socketError: any) {
        logger.error('[ScheduledInterventionService] Socket notification failed (non-blocking):', {
          error: socketError.message
        });
      }

      logger.info('[ScheduledInterventionService] Intervention accepted successfully:', { 
        interventionId 
      });
      
      return updatedIntervention;
      
    } catch (error: any) {
      logger.error('[ScheduledInterventionService] Error accepting intervention:', {
        error: error.message,
        interventionId,
        clientId,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Cliente rifiuta intervento proposto
   * 
   * Cambia stato intervento a REJECTED e notifica il professionista
   * 
   * @param {string} interventionId - ID intervento
   * @param {string} clientId - ID cliente
   * @param {string} [reason] - Motivazione rifiuto (opzionale)
   * @returns {Promise<ScheduledIntervention>} Intervento aggiornato
   * @throws {AuthorizationError} Se cliente non autorizzato
   * @throws {Error} Se intervento non trovato
   * 
   * @example
   * const intervention = await ScheduledInterventionService.rejectIntervention(
   *   'int-123',
   *   'client-456',
   *   'Data non disponibile'
   * );
   */
  static async rejectIntervention(interventionId: string, clientId: string, reason?: string) {
    try {
      logger.info('[ScheduledInterventionService] Client rejecting intervention:', { 
        interventionId, 
        clientId, 
        reason 
      });
      
      // Validazione input
      if (!interventionId || !clientId) {
        throw new Error('InterventionId and clientId are required');
      }

      // Verifica che l'intervento esista e il cliente abbia accesso
      const intervention = await prisma.scheduledIntervention.findFirst({
        where: { id: interventionId },
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
        logger.warn('[ScheduledInterventionService] Client not authorized to reject:', {
          interventionId,
          clientId,
          actualClientId: intervention.request.clientId
        });
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
        interventionId,
        priority: 'normal',
        actionUrl: `${process.env.FRONTEND_URL}/requests/${intervention.requestId}/interventions`
      });

      // Emit socket event real-time (con gestione errori robusta)
      try {
        if (typeof notificationService?.emitToUser === 'function') {
          notificationService.emitToUser(intervention.professionalId, 'intervention:rejected', {
            interventionId,
            requestId: intervention.requestId,
            clientName: intervention.request.client?.fullName,
            reason
          });
        } else {
          logger.warn('[ScheduledInterventionService] emitToUser not available on notificationService');
        }
      } catch (socketError: any) {
        logger.error('[ScheduledInterventionService] Socket notification failed (non-blocking):', {
          error: socketError.message
        });
      }

      logger.info('[ScheduledInterventionService] Intervention rejected successfully:', { 
        interventionId 
      });
      
      return updatedIntervention;
      
    } catch (error: any) {
      logger.error('[ScheduledInterventionService] Error rejecting intervention:', {
        error: error.message,
        interventionId,
        clientId,
        stack: error.stack
      });
      throw error;
    }
  }
}

/**
 * Export default singleton
 */
export default ScheduledInterventionService;
