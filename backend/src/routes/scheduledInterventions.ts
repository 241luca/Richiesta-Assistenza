import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ResponseFormatter } from '../utils/responseFormatter';
import { logger } from '../utils/logger';
import { logInfo, logError } from '../middleware/requestId';

const router = Router();

// Import the service and AuthorizationError
let scheduledInterventionService: any;
let AuthorizationError: any;

// Lazy load the service to avoid circular dependencies
const getService = async () => {
  if (!scheduledInterventionService) {
    const module = await import('../services/scheduledInterventionService');
    scheduledInterventionService = module.ScheduledInterventionService || module.default;
    AuthorizationError = module.AuthorizationError;
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
      requestId: req.params.requestId,
      errorType: error.name
    });
    
    // Gestisci errori di autorizzazione con status 403
    if (error.name === 'AuthorizationError' || error.message.includes('Non autorizzato')) {
      return res.status(403).json(ResponseFormatter.error(
        error.message || 'Non autorizzato a vedere questi interventi',
        'FORBIDDEN'
      ));
    }
    
    // Altri errori con status 500
    return res.status(500).json(ResponseFormatter.error(
      error.message || 'Failed to fetch scheduled interventions',
      'FETCH_ERROR'
    ));
  }
});

// POST /api/scheduled-interventions - Proponi interventi (professionista)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const professionalId = req.user?.id;
    
    if (!professionalId) {
      return res.status(401).json(ResponseFormatter.error(
        'Authentication required',
        'UNAUTHORIZED'
      ));
    }
    
    const service = await getService();
    
    logInfo(req, 'Professional proposing interventions', { 
      professionalId,
      requestId: req.body.requestId,
      interventionsCount: req.body.interventions?.length
    });
    
    const result = await service.proposeInterventions(professionalId, req.body);
    
    logInfo(req, 'Interventions proposed successfully', {
      count: result.length
    });
    
    return res.status(201).json(ResponseFormatter.success(
      result,
      'Interventi proposti con successo'
    ));
    
  } catch (error: any) {
    logError(req, 'Error proposing interventions', { 
      error: error.message,
      errorType: error.name
    });
    
    if (error.name === 'AuthorizationError') {
      return res.status(403).json(ResponseFormatter.error(
        error.message || 'Non autorizzato a proporre interventi',
        'FORBIDDEN'
      ));
    }
    
    if (error.name === 'ZodError') {
      logError(req, 'Validation error details', {
        errors: error.errors,
        receivedData: req.body
      });
      return res.status(400).json(ResponseFormatter.error(
        'Dati non validi',
        'VALIDATION_ERROR',
        error.errors
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Failed to propose interventions',
      'CREATE_ERROR'
    ));
  }
});

// PUT /api/scheduled-interventions/:id/respond - Accetta/Rifiuta intervento (cliente)
router.put('/:id/respond', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const clientId = req.user?.id;
    
    if (!clientId) {
      return res.status(401).json(ResponseFormatter.error(
        'Authentication required',
        'UNAUTHORIZED'
      ));
    }
    
    if (!status || !['CONFIRMED', 'REJECTED'].includes(status)) {
      return res.status(400).json(ResponseFormatter.error(
        'Status deve essere CONFIRMED o REJECTED',
        'INVALID_STATUS'
      ));
    }
    
    logInfo(req, 'Client responding to intervention', { 
      interventionId: id,
      clientId,
      status,
      reason
    });
    
    const service = await getService();
    const result = await service.respondToIntervention(clientId, id, status, reason);
    
    logInfo(req, 'Intervention response processed', {
      interventionId: id,
      status
    });
    
    const message = status === 'CONFIRMED' 
      ? 'Intervento confermato con successo'
      : 'Intervento rifiutato con successo';
    
    return res.json(ResponseFormatter.success(
      result,
      message
    ));
    
  } catch (error: any) {
    logError(req, 'Error responding to intervention', { 
      error: error.message,
      interventionId: req.params.id,
      errorType: error.name
    });
    
    if (error.name === 'AuthorizationError') {
      return res.status(403).json(ResponseFormatter.error(
        error.message || 'Non autorizzato a rispondere a questo intervento',
        'FORBIDDEN'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Failed to respond to intervention',
      'UPDATE_ERROR'
    ));
  }
});

// DELETE /api/scheduled-interventions/:id - Cancella intervento
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json(ResponseFormatter.error(
        'Authentication required',
        'UNAUTHORIZED'
      ));
    }
    
    if (!reason) {
      return res.status(400).json(ResponseFormatter.error(
        'Motivo della cancellazione richiesto',
        'REASON_REQUIRED'
      ));
    }
    
    logInfo(req, 'Cancelling scheduled intervention', { 
      interventionId: id,
      userId,
      reason
    });
    
    const service = await getService();
    const result = await service.cancelIntervention(userId, id, reason);
    
    logInfo(req, 'Intervention cancelled successfully', {
      interventionId: id
    });
    
    return res.json(ResponseFormatter.success(
      result,
      'Intervento cancellato con successo'
    ));
    
  } catch (error: any) {
    logError(req, 'Error cancelling intervention', { 
      error: error.message,
      interventionId: req.params.id,
      errorType: error.name
    });
    
    if (error.name === 'AuthorizationError') {
      return res.status(403).json(ResponseFormatter.error(
        error.message || 'Non autorizzato a cancellare questo intervento',
        'FORBIDDEN'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Failed to cancel intervention',
      'DELETE_ERROR'
    ));
  }
});

// PUT /api/scheduled-interventions/:id/complete - Completa intervento (professionista)
router.put('/:id/complete', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const professionalId = req.user?.id;
    const completionData = req.body;
    
    if (!professionalId) {
      return res.status(401).json(ResponseFormatter.error(
        'Authentication required',
        'UNAUTHORIZED'
      ));
    }
    
    logInfo(req, 'Completing intervention', { 
      interventionId: id,
      professionalId,
      completionData
    });
    
    const service = await getService();
    const result = await service.completeIntervention(professionalId, id, completionData);
    
    logInfo(req, 'Intervention completed successfully', {
      interventionId: id
    });
    
    return res.json(ResponseFormatter.success(
      result,
      'Intervento completato con successo'
    ));
    
  } catch (error: any) {
    logError(req, 'Error completing intervention', { 
      error: error.message,
      interventionId: req.params.id,
      errorType: error.name
    });
    
    if (error.name === 'AuthorizationError') {
      return res.status(403).json(ResponseFormatter.error(
        error.message || 'Non autorizzato a completare questo intervento',
        'FORBIDDEN'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Failed to complete intervention',
      'UPDATE_ERROR'
    ));
  }
});

// PUT /api/scheduled-interventions/:id/accept - Cliente accetta intervento
router.put('/:id/accept', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const clientId = req.user?.id;
    
    if (!clientId) {
      return res.status(401).json(ResponseFormatter.error(
        'Authentication required',
        'UNAUTHORIZED'
      ));
    }
    
    logInfo(req, 'Client accepting intervention', { 
      interventionId: id,
      clientId
    });
    
    const service = await getService();
    const result = await service.acceptIntervention(id, clientId);
    
    logInfo(req, 'Intervention accepted', {
      interventionId: id
    });
    
    return res.json(ResponseFormatter.success(
      result,
      'Intervento accettato con successo'
    ));
    
  } catch (error: any) {
    logError(req, 'Error accepting intervention', { 
      error: error.message,
      interventionId: req.params.id,
      errorType: error.name
    });
    
    if (error.name === 'AuthorizationError' || error.message.includes('Non autorizzato')) {
      return res.status(403).json(ResponseFormatter.error(
        error.message || 'Non autorizzato ad accettare questo intervento',
        'FORBIDDEN'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Failed to accept intervention',
      'UPDATE_ERROR'
    ));
  }
});

// PUT /api/scheduled-interventions/:id/reject - Cliente rifiuta intervento
router.put('/:id/reject', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const clientId = req.user?.id;
    const { reason } = req.body;
    
    if (!clientId) {
      return res.status(401).json(ResponseFormatter.error(
        'Authentication required',
        'UNAUTHORIZED'
      ));
    }
    
    logInfo(req, 'Client rejecting intervention', { 
      interventionId: id,
      clientId,
      reason
    });
    
    const service = await getService();
    const result = await service.rejectIntervention(id, clientId, reason);
    
    logInfo(req, 'Intervention rejected', {
      interventionId: id
    });
    
    return res.json(ResponseFormatter.success(
      result,
      'Intervento rifiutato con successo'
    ));
    
  } catch (error: any) {
    logError(req, 'Error rejecting intervention', { 
      error: error.message,
      interventionId: req.params.id,
      errorType: error.name
    });
    
    if (error.name === 'AuthorizationError' || error.message.includes('Non autorizzato')) {
      return res.status(403).json(ResponseFormatter.error(
        error.message || 'Non autorizzato a rifiutare questo intervento',
        'FORBIDDEN'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Failed to reject intervention',
      'UPDATE_ERROR'
    ));
  }
});

// GET /api/scheduled-interventions/:id - Get single intervention
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json(ResponseFormatter.error(
        'Authentication required',
        'UNAUTHORIZED'
      ));
    }
    
    logInfo(req, 'Fetching single intervention', { 
      interventionId: id,
      userId
    });
    
    const service = await getService();
    const intervention = await service.getIntervention(id, userId);
    
    logInfo(req, 'Intervention retrieved', {
      interventionId: id
    });
    
    return res.json(ResponseFormatter.success(
      intervention,
      'Intervento recuperato con successo'
    ));
    
  } catch (error: any) {
    logError(req, 'Error fetching intervention', { 
      error: error.message,
      interventionId: req.params.id,
      errorType: error.name
    });
    
    if (error.name === 'AuthorizationError') {
      return res.status(403).json(ResponseFormatter.error(
        error.message || 'Non autorizzato a vedere questo intervento',
        'FORBIDDEN'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Failed to fetch intervention',
      'FETCH_ERROR'
    ));
  }
});

export default router;
