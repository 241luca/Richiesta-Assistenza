import { Request, Response } from 'express';
import { z } from 'zod';
import { getIO } from '../utils/socket';
import { sendEmail } from './email.service';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import { ResponseFormatter } from '../utils/responseFormatter';

// Validation schemas
const proposeInterventionSchema = z.object({
  requestId: z.string().uuid(),
  interventions: z.array(z.object({
    proposedDate: z.string().datetime(),
    description: z.string().optional(),
    estimatedDuration: z.number().optional(),
  })).min(1).max(10)
});

// Helper function per inviare notifiche WebSocket
async function sendWebSocketNotification(recipientId: string, data: any) {
  const io = getIO();
  if (io) {
    io.to(`User:${recipientId}`).emit('notification', data);
  }
}

// Helper function per inviare email
async function sendEmailNotification(options: any) {
  try {
    await sendEmail(
      options.to,
      options.subject,
      `
        <h2>${options.subject}</h2>
        <p>Ciao ${options.data.userName},</p>
        <p>${options.data.content || ''}</p>
        ${options.data.confirmUrl ? `<p><a href="${options.data.confirmUrl}">Clicca qui per vedere i dettagli</a></p>` : ''}
        ${options.data.viewUrl ? `<p><a href="${options.data.viewUrl}">Visualizza richiesta</a></p>` : ''}
      `,
      undefined,
      options.data
    );
  } catch (error) {
    logger.error('Error sending email notification:', error);
  }
}

// Service class
export class ScheduledInterventionService {
  
  // Lista interventi per richiesta (usando Prisma ORM)
  static async getInterventionsByRequest(requestId: string, recipientId: string) {
    try {
      logger.info('Getting interventions for request:', { requestId, userId: recipientId });
      
      // Prima verifica che l'utente abbia accesso alla richiesta
      const request = await prisma.assistanceRequest.findFirst({
        where: {
          id: requestId,
          OR: [
            { clientId: recipientId },
            { professionalId: recipientId }
          ]
        }
      });

      if (!request) {
        logger.warn('User not authorized to view interventions:', { requestId, userId: recipientId });
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
              lastName: true
            }
          },
          acceptedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          report: {
            select: {
              id: true,
              reportNumber: true
            }
          }
        },
        orderBy: {
          interventionNumber: 'asc'
        }
      });

      logger.info('Found interventions:', { count: interventions.length });

      return interventions;
      
    } catch (error: any) {
      logger.error('Error fetching interventions:', error);
      throw error;
    }
  }
  
  // Proponi uno o più interventi (Handler per Express)
  static async proposeInterventions(req: Request, res: Response) {
    try {
      const { requestId, interventions } = proposeInterventionSchema.parse(req.body);
      const professionalId = (req as any).user?.id;
      
      if (!professionalId) {
        return res.status(401).json(ResponseFormatter.error('Non autorizzato', 'UNAUTHORIZED'));
      }

      // Verifica che il professionista sia assegnato alla richiesta
      const request = await prisma.assistanceRequest.findFirst({
        where: {
          id: requestId,
          professionalId: professionalId
        }
      });

      if (!request) {
        return res.status(403).json(ResponseFormatter.error('Non sei assegnato a questa richiesta', 'FORBIDDEN'));
      }

      // Ottieni il numero dell'ultimo intervento
      const lastIntervention = await prisma.scheduledIntervention.findFirst({
        where: { requestId },
        orderBy: { interventionNumber: 'desc' }
      });
      
      const startNumber = lastIntervention ? lastIntervention.interventionNumber + 1 : 1;

      // Crea tutti gli interventi proposti
      const createdInterventions = await Promise.all(
        interventions.map((intervention, index) => 
          prisma.scheduledIntervention.create({
            data: {
              requestId,
              professionalId,
              proposedDate: new Date(intervention.proposedDate),
              description: intervention.description,
              estimatedDuration: intervention.estimatedDuration,
              interventionNumber: startNumber + index,
              status: 'PROPOSED'
            },
            include: {
              Professional: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          })
        )
      );

      // Invia notifica al cliente
      await ScheduledInterventionService.notifyClient(request.clientId, requestId, createdInterventions.length);

      res.status(201).json(ResponseFormatter.success(
        createdInterventions,
        'Interventi proposti con successo'
      ));

    } catch (error: any) {
      logger.error('Error proposing interventions:', error);
      res.status(500).json(ResponseFormatter.error(
        'Errore nella proposta interventi',
        'PROPOSAL_ERROR'
      ));
    }
  }

  // Accetta intervento (Handler per Express)
  static async acceptIntervention(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      // Verifica che sia il cliente
      const intervention = await prisma.scheduledIntervention.findFirst({
        where: { id },
        include: {
          request: {
            select: {
              clientId: true,
              title: true
            }
          }
        }
      });

      if (!intervention) {
        return res.status(404).json(ResponseFormatter.error('Intervento non trovato', 'NOT_FOUND'));
      }

      if (intervention.request.clientId !== userId) {
        return res.status(403).json(ResponseFormatter.error('Solo il cliente può accettare', 'FORBIDDEN'));
      }

      if (intervention.status !== 'PROPOSED') {
        return res.status(400).json(ResponseFormatter.error('Intervento già processato', 'ALREADY_PROCESSED'));
      }

      // Accetta l'intervento
      const updated = await prisma.scheduledIntervention.update({
        where: { id },
        data: {
          status: 'ACCEPTED',
          acceptedBy: userId,
          acceptedAt: new Date(),
          confirmedDate: intervention.proposedDate
        }
      });

      // Notifica il professionista
      await ScheduledInterventionService.notifyProfessional(
        intervention.professionalId,
        intervention.requestId,
        'accepted',
        intervention.request.title
      );

      res.json(ResponseFormatter.success(updated, 'Intervento accettato'));

    } catch (error: any) {
      logger.error('Error accepting intervention:', error);
      res.status(500).json(ResponseFormatter.error('Errore nell\'accettazione', 'ACCEPT_ERROR'));
    }
  }

  // Rifiuta intervento (Handler per Express)
  static async rejectIntervention(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { rejectedReason } = req.body;
      const userId = (req as any).user?.id;

      // Verifica che sia il cliente
      const intervention = await prisma.scheduledIntervention.findFirst({
        where: { id },
        include: {
          request: {
            select: {
              clientId: true,
              title: true
            }
          }
        }
      });

      if (!intervention) {
        return res.status(404).json(ResponseFormatter.error('Intervento non trovato', 'NOT_FOUND'));
      }

      if (intervention.request.clientId !== userId) {
        return res.status(403).json(ResponseFormatter.error('Solo il cliente può rifiutare', 'FORBIDDEN'));
      }

      if (intervention.status !== 'PROPOSED') {
        return res.status(400).json(ResponseFormatter.error('Intervento già processato', 'ALREADY_PROCESSED'));
      }

      // Rifiuta l'intervento
      const updated = await prisma.scheduledIntervention.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectedReason
        }
      });

      // Notifica il professionista
      await ScheduledInterventionService.notifyProfessional(
        intervention.professionalId,
        intervention.requestId,
        'rejected',
        intervention.request.title
      );

      res.json(ResponseFormatter.success(updated, 'Intervento rifiutato'));

    } catch (error: any) {
      logger.error('Error rejecting intervention:', error);
      res.status(500).json(ResponseFormatter.error('Errore nel rifiuto', 'REJECT_ERROR'));
    }
  }

  // Cancella intervento (Handler per Express)  
  static async cancelIntervention(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const intervention = await prisma.scheduledIntervention.findFirst({
        where: {
          id,
          professionalId: userId,
          status: 'PROPOSED'
        }
      });

      if (!intervention) {
        return res.status(404).json(ResponseFormatter.error('Intervento non trovato o non modificabile', 'NOT_FOUND'));
      }

      await prisma.scheduledIntervention.update({
        where: { id },
        data: { status: 'CANCELLED' }
      });

      res.json(ResponseFormatter.success(null, 'Intervento cancellato'));

    } catch (error: any) {
      logger.error('Error cancelling intervention:', error);
      res.status(500).json(ResponseFormatter.error('Errore nella cancellazione', 'CANCEL_ERROR'));
    }
  }

  // Helper: Notifica cliente
  private static async notifyClient(clientId: string, requestId: string, count: number) {
    try {
      const notification = await prisma.notification.create({
        data: {
          type: 'INTERVENTIONS_PROPOSED',
          title: 'Nuovi interventi proposti',
          content: `Sono stati proposti ${count} interventi per la tua richiesta. Conferma le date proposte.`,
          recipientId: clientId,
          entityType: 'request',
          entityId: requestId,
          priority: 'HIGH'
        }
      });

      await sendWebSocketNotification(clientId, {
        type: 'INTERVENTIONS_PROPOSED',
        title: notification.title,
        content: notification.content,
        requestId,
        notificationId: notification.id
      });

      const user = await prisma.user.findUnique({
        where: { id: clientId },
        include: { NotificationPreference: true }
      });

      if (user?.notificationPreference?.emailNotifications !== false) {
        await sendEmailNotification({
          to: user.email,
          subject: 'Nuovi interventi proposti per la tua richiesta',
          data: {
            userName: `${user.firstName} ${user.lastName}`,
            content: `Sono stati proposti ${count} nuovi interventi. Accedi per confermare le date.`,
            confirmUrl: `${process.env.FRONTEND_URL}/requests/${requestId}`
          }
        });
      }
    } catch (error) {
      logger.error('Error sending client notification:', error);
    }
  }

  // Helper: Notifica professionista
  private static async notifyProfessional(professionalId: string, requestId: string, action: string, requestTitle: string) {
    try {
      const title = action === 'accepted' ? 'Intervento accettato' : 'Intervento rifiutato';
      const content = action === 'accepted'
        ? `Il cliente ha accettato la data proposta per "${requestTitle}"`
        : `Il cliente ha rifiutato la data proposta per "${requestTitle}". Controlla la chat per alternative.`;

      const notification = await prisma.notification.create({
        data: {
          type: `INTERVENTION_${action.toUpperCase()}`,
          title,
          content,
          recipientId: professionalId,
          entityType: 'request',
          entityId: requestId,
          priority: action === 'rejected' ? 'HIGH' : 'NORMAL'
        }
      });

      await sendWebSocketNotification(professionalId, {
        type: `INTERVENTION_${action.toUpperCase()}`,
        title,
        content,
        requestId,
        notificationId: notification.id
      });
    } catch (error) {
      logger.error('Error sending professional notification:', error);
    }
  }
}
