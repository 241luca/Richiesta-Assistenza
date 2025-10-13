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
    const interventions = await prisma.scheduledIntervention.findMany({
      where: {
        professionalId: professionalId
      },
      include: {
        request: {
          include: {
            client: true,
            category: true
          }
        }
      }
    });

    // Log per debug
    logger.info('[CalendarSimple] Found interventions:', interventions.length);

    // Formatta per il calendario
    const calendarEvents = interventions.map(intervention => ({
      id: intervention.id,
      title: intervention.description || 
             `${intervention.request?.client?.fullName || 'Cliente'} - ${intervention.request?.category?.name || 'Servizio'}`,
      start: intervention.proposedDate,
      end: new Date(
        new Date(intervention.proposedDate).getTime() + 
        (intervention.estimatedDuration || 60) * 60000
      ),
      status: intervention.status,
      client: intervention.request?.client,
      category: intervention.request?.category,
      requestId: intervention.requestId,
      // Aggiungi anche i dati raw per debug
      _raw: intervention
    }));

    return res.json(ResponseFormatter.success(calendarEvents));
  } catch (error: any) {
    logger.error('[CalendarSimple] Error:', error);
    return res.status(500).json(
      ResponseFormatter.error(error.message || 'Failed to fetch interventions', 'SERVER_ERROR')
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
    const intervention = await prisma.scheduledIntervention.create({
      data: {
        id: uuidv4(),
        request: { connect: { id: requestId } },
        professional: { connect: { id: professionalId } },
        scheduledDateTime: new Date(proposedDate),
        duration: estimatedDuration || 60,
        notes: description || 'Intervento programmato',
        status: 'scheduled',
        updatedAt: new Date()
      },
      include: {
        request: {
          include: {
            client: true,
            category: true
          }
        }
      }
    });
    
    logger.info('[CalendarSimple] Intervention created:', intervention.id);
    
    return res.json(ResponseFormatter.success(intervention, 'Intervento creato con successo'));
  } catch (error: any) {
    logger.error('[CalendarSimple] Error creating intervention:', error);
    return res.status(500).json(
      ResponseFormatter.error(error.message || 'Failed to create intervention', 'SERVER_ERROR')
    );
  }
});

export default router;
