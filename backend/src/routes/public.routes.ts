import { Router } from 'express';
import { ResponseFormatter } from '../utils/responseFormatter';

const router = Router();

/**
 * GET /api/public/health
 * Health check pubblico
 */
router.get('/health', (req, res) => {
  return res.json(ResponseFormatter.success(
    {
      status: 'ok',
      timestamp: new Date().toISOString()
    },
    'Service is healthy'
  ));
});

/**
 * GET /api/public/info
 * Informazioni pubbliche sistema
 */
router.get('/info', (req, res) => {
  return res.json(ResponseFormatter.success(
    {
      name: 'Sistema Richiesta Assistenza',
      version: '1.0.0',
      description: 'Piattaforma professionale per gestione richieste assistenza'
    },
    'System info'
  ));
});

export default router;
