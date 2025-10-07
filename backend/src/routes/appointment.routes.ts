import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// Applica autenticazione a tutti gli endpoint
router.use(authenticate);

/**
 * 🆕 APPOINTMENT ROUTES - Alias per Scheduled Interventions
 * 
 * Questi endpoint sono alias per mantenere la consistency 
 * delle Quick Actions che si aspettano /appointments/ URLs
 */

/**
 * POST /api/appointments/:id/confirm
 * 🆕 QUICK ACTION: Conferma appuntamento (alias per scheduled-interventions accept)
 */
router.post('/:id/confirm', async (req, res) => {
  // Proxy alla route degli scheduled interventions
  req.url = `/api/scheduled-interventions/${req.params.id}/accept`;
  req.method = 'PUT';
  
  // Forward alla route esistente
  const scheduledInterventionsRouter = await import('./scheduledInterventions');
  return scheduledInterventionsRouter.default(req, res);
});

/**
 * POST /api/appointments/:id/cancel
 * 🆕 QUICK ACTION: Cancella appuntamento (alias per scheduled-interventions cancel)
 */
router.post('/:id/cancel', async (req, res) => {
  // Proxy alla route degli scheduled interventions
  req.url = `/api/scheduled-interventions/${req.params.id}`;
  req.method = 'DELETE';
  
  // Forward alla route esistente
  const scheduledInterventionsRouter = await import('./scheduledInterventions');
  return scheduledInterventionsRouter.default(req, res);
});

/**
 * POST /api/appointments/:id/reschedule
 * 🆕 QUICK ACTION: Riprogramma appuntamento
 */
router.post('/:id/reschedule', async (req, res) => {
  // Per ora redirect alla pagina di riprogrammazione
  // In futuro si può implementare la logica specifica
  return res.json({
    success: true,
    message: 'Redirect to reschedule page',
    redirectUrl: `/appointments/${req.params.id}/reschedule`
  });
});

export default router;