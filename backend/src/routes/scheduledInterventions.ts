import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ResponseFormatter } from '../utils/responseFormatter';
import { logger } from '../utils/logger';
import { logInfo, logError } from '../middleware/requestId';

const router = Router();

// Import the service
let scheduledInterventionService: any;

// Lazy load the service to avoid circular dependencies
const getService = async () => {
  if (!scheduledInterventionService) {
    const module = await import('../services/scheduledInterventionService');
    scheduledInterventionService = module.ScheduledInterventionService || module.default;
  }
  return scheduledInterventionService;
};

// Tutte le route richiedono autenticazione
router.use(authenticate);

// GET /api/scheduled-interventions/request/:requestId - Lista interventi per richiesta
router.get('/request/:requestId', async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json(ResponseFormatter.error(
        'Authentication required',
        'UNAUTHORIZED'
      ));
    }
    
    logInfo(req, 'Fetching scheduled interventions for request', { requestId, userId });
    
    const service = await getService();
    
    // Usa il metodo statico del service
    const interventions = await service.getInterventionsByRequest(requestId, userId);
    
    logInfo(req, 'Scheduled interventions retrieved', { 
      requestId, 
      count: interventions.length 
    });
    
    return res.json(ResponseFormatter.success(
      interventions,
      'Scheduled interventions retrieved successfully'
    ));
    
  } catch (error: any) {
    logError(req, 'Error fetching scheduled interventions', { 
      error: error.message,
      requestId: req.params.requestId 
    });
    
    return res.status(500).json(ResponseFormatter.error(
      error.message || 'Failed to fetch scheduled interventions',
      'FETCH_ERROR'
    ));
  }
});

// POST /api/scheduled-interventions - Proponi interventi (professionista)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const service = await getService();
    
    logInfo(req, 'Creating scheduled intervention', { 
      professionalId: req.user?.id,
      body: req.body 
    });
    
    if (service.proposeInterventions) {
      // Se il metodo è già un handler Express
      if (service.proposeInterventions.length === 2 || service.proposeInterventions.length === 3) {
        return service.proposeInterventions(req, res);
      }
      // Altrimenti chiamalo come funzione normale
      const result = await service.proposeInterventions(req.body, req.user?.id);
      return res.json(ResponseFormatter.success(
        result,
        'Intervention proposed successfully'
      ));
    }
    
    return res.status(501).json(ResponseFormatter.error(
      'Method not implemented',
      'NOT_IMPLEMENTED'
    ));
    
  } catch (error: any) {
    logError(req, 'Error proposing intervention', { 
      error: error.message 
    });
    
    return res.status(500).json(ResponseFormatter.error(
      'Failed to propose intervention',
      'CREATE_ERROR',
      { error: error.message }
    ));
  }
});

// PUT /api/scheduled-interventions/:id/accept - Accetta intervento (cliente)
router.put('/:id/accept', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const service = await getService();
    
    logInfo(req, 'Accepting scheduled intervention', { 
      interventionId: id,
      clientId: req.user?.id 
    });
    
    if (service.acceptIntervention) {
      // Se il metodo è già un handler Express
      if (service.acceptIntervention.length === 2 || service.acceptIntervention.length === 3) {
        return service.acceptIntervention(req, res);
      }
      // Altrimenti chiamalo come funzione normale
      const result = await service.acceptIntervention(id, req.user?.id);
      return res.json(ResponseFormatter.success(
        result,
        'Intervention accepted successfully'
      ));
    }
    
    return res.status(501).json(ResponseFormatter.error(
      'Method not implemented',
      'NOT_IMPLEMENTED'
    ));
    
  } catch (error: any) {
    logError(req, 'Error accepting intervention', { 
      error: error.message,
      interventionId: req.params.id 
    });
    
    return res.status(500).json(ResponseFormatter.error(
      'Failed to accept intervention',
      'UPDATE_ERROR',
      { error: error.message }
    ));
  }
});

// PUT /api/scheduled-interventions/:id/reject - Rifiuta intervento (cliente)
router.put('/:id/reject', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const service = await getService();
    
    logInfo(req, 'Rejecting scheduled intervention', { 
      interventionId: id,
      clientId: req.user?.id 
    });
    
    if (service.rejectIntervention) {
      // Se il metodo è già un handler Express
      if (service.rejectIntervention.length === 2 || service.rejectIntervention.length === 3) {
        return service.rejectIntervention(req, res);
      }
      // Altrimenti chiamalo come funzione normale
      const result = await service.rejectIntervention(id, req.user?.id);
      return res.json(ResponseFormatter.success(
        result,
        'Intervention rejected successfully'
      ));
    }
    
    return res.status(501).json(ResponseFormatter.error(
      'Method not implemented',
      'NOT_IMPLEMENTED'
    ));
    
  } catch (error: any) {
    logError(req, 'Error rejecting intervention', { 
      error: error.message,
      interventionId: req.params.id 
    });
    
    return res.status(500).json(ResponseFormatter.error(
      'Failed to reject intervention',
      'UPDATE_ERROR',
      { error: error.message }
    ));
  }
});

// DELETE /api/scheduled-interventions/:id - Cancella intervento (professionista)
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const service = await getService();
    
    logInfo(req, 'Cancelling scheduled intervention', { 
      interventionId: id,
      professionalId: req.user?.id 
    });
    
    if (service.cancelIntervention) {
      // Se il metodo è già un handler Express
      if (service.cancelIntervention.length === 2 || service.cancelIntervention.length === 3) {
        return service.cancelIntervention(req, res);
      }
      // Altrimenti chiamalo come funzione normale
      const result = await service.cancelIntervention(id, req.user?.id);
      return res.json(ResponseFormatter.success(
        result,
        'Intervention cancelled successfully'
      ));
    }
    
    return res.status(501).json(ResponseFormatter.error(
      'Method not implemented',
      'NOT_IMPLEMENTED'
    ));
    
  } catch (error: any) {
    logError(req, 'Error cancelling intervention', { 
      error: error.message,
      interventionId: req.params.id 
    });
    
    return res.status(500).json(ResponseFormatter.error(
      'Failed to cancel intervention',
      'DELETE_ERROR',
      { error: error.message }
    ));
  }
});

export default router;
