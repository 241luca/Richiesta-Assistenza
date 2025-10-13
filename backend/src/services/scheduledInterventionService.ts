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
        
        const interventionsRaw = await prisma.scheduledIntervention.findMany({
          where: { requestId },
          orderBy: { proposedDate: 'asc' }
        });

        // Risolve professional e createdByUser con query esplicite
        const professionalIds = Array.from(new Set(interventionsRaw.map((i: any) => i.professionalId).filter(Boolean)));
        const createdByIds = Array.from(new Set(interventionsRaw.map((i: any) => i.createdBy).filter(Boolean)));

        const [professionals, creators] = await Promise.all([
          professionalIds.length
            ? prisma.user.findMany({
                where: { id: { in: professionalIds } },
                select: { id: true, firstName: true, lastName: true, fullName: true, email: true }
              })
            : Promise.resolve([]),
          createdByIds.length
            ? prisma.user.findMany({
                where: { id: { in: createdByIds } },
                select: { id: true, firstName: true, lastName: true, fullName: true }
              })
            : Promise.resolve([])
        ]);

        const proMap = new Map(professionals.map((u) => [u.id, u]));
        const creatorMap = new Map(creators.map((u) => [u.id, u]));

        const interventions = interventionsRaw.map((i: any) => ({
          ...i,
          professional: proMap.get(i.professionalId) || null,
          createdByUser: i.createdBy ? (creatorMap.get(i.createdBy) || null) : null
        }));

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

      const interventionsRaw = await prisma.scheduledIntervention.findMany({
        where: { requestId },
        orderBy: { proposedDate: 'asc' }
      });

      const professionalIds = Array.from(new Set(interventionsRaw.map((i: any) => i.professionalId).filter(Boolean)));
      const createdByIds = Array.from(new Set(interventionsRaw.map((i: any) => i.createdBy).filter(Boolean)));

      const [professionals, creators] = await Promise.all([
        professionalIds.length
          ? prisma.user.findMany({
              where: { id: { in: professionalIds } },
              select: { id: true, firstName: true, lastName: true, fullName: true, email: true }
            })
          : Promise.resolve([]),
        createdByIds.length
          ? prisma.user.findMany({
              where: { id: { in: createdByIds } },
              select: { id: true, firstName: true, lastName: true, fullName: true }
            })
          : Promise.resolve([])
      ]);

      const proMap = new Map(professionals.map((u) => [u.id, u]));
      const creatorMap = new Map(creators.map((u) => [u.id, u]));

      const interventions = interventionsRaw.map((i: any) => ({
        ...i,
        professional: proMap.get(i.professionalId) || null,
        createdByUser: i.createdBy ? (creatorMap.get(i.createdBy) || null) : null
      }));

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
        select: {
          id: true,
          clientId: true,
          professionalId: true,
          title: true
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
            // Nessun include: risolviamo professional più sotto
          });
        })
      );

      const [client, professionalUser] = await Promise.all([
        prisma.user.findUnique({
          where: { id: request.clientId },
          select: { id: true, email: true, fullName: true, firstName: true, lastName: true }
        }),
        prisma.user.findUnique({
          where: { id: request.professionalId },
          select: { id: true, fullName: true, firstName: true, lastName: true, email: true }
        })
      ]);

      logger.info('[ScheduledInterventionService] Interventions created:', { 
        count: createdInterventions.length,
        requestId: validatedData.requestId 
      });

      const createdInterventionsNormalized = (createdInterventions as any[]).map((i) => ({
        ...i,
        professional: professionalUser || null
      }));

      // Invia notifica al cliente
      if (client) {
        await sendInterventionNotification({
          recipientId: client.id,
          type: 'interventions_proposed',
          title: 'Nuovi Interventi Proposti',
          message: `Il professionista ${professionalUser?.fullName} ha proposto ${createdInterventions.length} interventi per la tua richiesta "${request.title}"`,
          requestId: request.id,
          priority: 'high',
          actionUrl: `${process.env.FRONTEND_URL}/requests/${request.id}/interventions`
        });

        // Emit socket event real-time (con gestione errori robusta)
        try {
          if (typeof notificationService?.emitToUser === 'function') {
            notificationService.emitToUser(client.id, 'interventions:proposed', {
              requestId: request.id,
              interventions: createdInterventionsNormalized,
              professionalName: professionalUser?.fullName
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
      return createdInterventionsNormalized;
      
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
        select: {
          id: true,
          requestId: true,
          professionalId: true,
          proposedDate: true
        }
      });

      if (!intervention) {
        throw new Error('Intervento non trovato');
      }

      const requestForIntervention = await prisma.assistanceRequest.findUnique({
        where: { id: intervention.requestId },
        select: { clientId: true }
      });

      if (!requestForIntervention || requestForIntervention.clientId !== clientId) {
        logger.warn('[ScheduledInterventionService] Client not authorized to accept:', {
          interventionId,
          clientId,
          actualClientId: requestForIntervention?.clientId
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
        select: {
          id: true,
          requestId: true,
          professionalId: true,
          proposedDate: true,
          status: true,
          clientConfirmed: true,
          confirmedDate: true,
          updatedAt: true
        }
      });

      const [clientUserForMsg, professionalUserForMsg] = await Promise.all([
        prisma.user.findUnique({
          where: { id: requestForIntervention.clientId },
          select: { fullName: true, id: true }
        }),
        prisma.user.findUnique({
          where: { id: intervention.professionalId },
          select: { id: true, firstName: true, lastName: true, fullName: true, email: true }
        })
      ]);

      // Invia notifica al professionista
      await sendInterventionNotification({
        recipientId: intervention.professionalId,
        type: 'intervention_accepted',
        title: 'Intervento Accettato',
        message: `Il cliente ${clientUserForMsg?.fullName} ha accettato l'intervento proposto per il ${new Date(intervention.proposedDate).toLocaleDateString('it-IT')}`,
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
            clientName: clientUserForMsg?.fullName
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
      
      return { ...updatedIntervention, professional: professionalUserForMsg } as any;
      
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
        select: {
          id: true,
          requestId: true,
          professionalId: true,
          proposedDate: true
        }
      });

      if (!intervention) {
        throw new Error('Intervento non trovato');
      }

      const requestForIntervention = await prisma.assistanceRequest.findUnique({
        where: { id: intervention.requestId },
        select: { clientId: true }
      });

      if (!requestForIntervention || requestForIntervention.clientId !== clientId) {
        logger.warn('[ScheduledInterventionService] Client not authorized to reject:', {
          interventionId,
          clientId,
          actualClientId: requestForIntervention?.clientId
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
        select: {
          id: true,
          requestId: true,
          professionalId: true,
          proposedDate: true,
          status: true,
          clientConfirmed: true,
          clientDeclineReason: true,
          updatedAt: true
        }
      });

      const [clientUserForMsg, professionalUserForMsg] = await Promise.all([
        prisma.user.findUnique({
          where: { id: requestForIntervention.clientId },
          select: { fullName: true, id: true }
        }),
        prisma.user.findUnique({
          where: { id: intervention.professionalId },
          select: { id: true, firstName: true, lastName: true, fullName: true, email: true }
        })
      ]);

      // Invia notifica al professionista
      await sendInterventionNotification({
        recipientId: intervention.professionalId,
        type: 'intervention_rejected',
        title: 'Intervento Rifiutato',
        message: `Il cliente ${clientUserForMsg?.fullName} ha rifiutato l'intervento proposto per il ${new Date(intervention.proposedDate).toLocaleDateString('it-IT')}${reason ? `. Motivo: ${reason}` : ''}`,
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
            clientName: clientUserForMsg?.fullName,
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
      
      return { ...updatedIntervention, professional: professionalUserForMsg } as any;
      
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
