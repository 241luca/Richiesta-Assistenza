import { Router } from 'express';
import { prisma } from '../../config/database';
import { ResponseFormatter } from '../../utils/responseFormatter';
import { logger } from '../../utils/logger';

const router = Router();

// GET /api/public/system-settings/basic
// Endpoint pubblico per ottenere le impostazioni di base (logo, nome, etc.)
router.get('/basic', async (req, res) => {
  try {
    // Lista delle chiavi pubbliche che possono essere esposte senza autenticazione
    const publicKeys = [
      'site_name',
      'site_logo_url',
      'site_favicon_url',
      'site_claim',
      'company_name',
      'site_version',
      'company_address',
      'company_phone',
      'company_email'
    ];

    const settings = await prisma.systemSettings.findMany({
      where: {
        key: {
          in: publicKeys
        },
        isActive: true
      },
      select: {
        key: true,
        value: true
      }
    });

    return res.json(ResponseFormatter.success(
      settings,
      'Impostazioni pubbliche recuperate'
    ));
  } catch (error) {
    logger.error('Errore nel recupero delle impostazioni pubbliche:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero delle impostazioni',
      'FETCH_ERROR'
    ));
  }
});

export default router;
