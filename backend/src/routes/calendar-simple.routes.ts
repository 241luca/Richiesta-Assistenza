import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ResponseFormatter } from '../utils/responseFormatter';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/calendar-simple/interventions - Endpoint semplificato per il calendario
router.get('/interventions', authenticate, async (req: AuthRequest, res) => {
  try {
    const professionalId = req.user!.id;
    
    logger.info('[CalendarSimple] Fetching interventions for professional:', professionalId);
    
    // Query semplice e diretta
    const interventions = await (prisma.scheduledIntervention.findMany as any)({
      where: {
        professionalId: professionalId
      },
      include: {
        AssistanceRequest: {
          include: {
            client: true,
            Category: true
          }
        }
      }
    });

    // Log per debug
    logger.info('[CalendarSimple] Found interventions:', interventions.length);

    // Formatta per il calendario
    const calendarEvents = interventions.map((intervention: any) => ({
      id: intervention.id,
      title: intervention.description || 
             `${intervention.AssistanceRequest?.client?.fullName || 'Cliente'} - ${intervention.AssistanceRequest?.Category?.name || 'Servizio'}`,
      start: intervention.proposedDate,
      end: new Date(
        new Date(intervention.proposedDate).getTime() + 
        (intervention.estimatedDuration || 60) * 60000
      ),
      status: intervention.status,
      client: intervention.AssistanceRequest?.client,
      category: intervention.AssistanceRequest?.Category,
      requestId: intervention.requestId,
      // Aggiungi anche i dati raw per debug
      _raw: intervention
    }));

    return res.json(ResponseFormatter.success(calendarEvents));
  } catch (error: any) {
    logger.error('[CalendarSimple] Error:', error instanceof Error ? error.message : String(error));
    return res.status(500).json(
      ResponseFormatter.error(error instanceof Error ? error.message : String(error) || 'Failed to fetch interventions', 'SERVER_ERROR')
    );
  }
});

// POST /api/calendar-simple/interventions - Crea intervento semplificato
router.post('/interventions', authenticate, async (req: AuthRequest, res) => {
  try {
    const professionalId = req.user!.id;
    const { requestId, proposedDate, description, estimatedDuration } = req.body;
    
    logger.info('[CalendarSimple] Creating intervention:', { 
      professionalId, 
      requestId,
      proposedDate 
    });
    
    // Crea l'intervento direttamente senza notifiche
    const intervention = await (prisma.scheduledIntervention.create as any)({
      data: {
        id: uuidv4(),
        AssistanceRequest: { connect: { id: requestId } },
        User_ScheduledIntervention_professionalIdToUser: { connect: { id: professionalId } },
        proposedDate: new Date(proposedDate),
        estimatedDuration: estimatedDuration || 60,
        description: description || 'Intervento programmato',
        status: 'scheduled',
        createdBy: professionalId,
        updatedAt: new Date()
      },
      include: {
        AssistanceRequest: {
          include: {
            client: true,
            Category: true
          }
        }
      }
    });
    
    logger.info('[CalendarSimple] Intervention created:', intervention.id);
    
    return res.json(ResponseFormatter.success(intervention, 'Intervento creato con successo'));
  } catch (error: any) {
    logger.error('[CalendarSimple] Error creating intervention:', error instanceof Error ? error.message : String(error));
    return res.status(500).json(
      ResponseFormatter.error(error instanceof Error ? error.message : String(error) || 'Failed to create intervention', 'SERVER_ERROR')
    );
  }
});

export default router;
