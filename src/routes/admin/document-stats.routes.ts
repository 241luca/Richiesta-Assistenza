import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { ResponseFormatter } from '../../utils/responseFormatter';
import { prisma } from '../../lib/prisma';

const router = Router();

/**
 * GET /api/admin/document-types/stats
 * Ottiene le statistiche dei tipi documento
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const [total, active] = await Promise.all([
      prisma.documentTypeConfig.count(),
      prisma.documentTypeConfig.count({
        where: { isActive: true }
      })
    ]);

    return res.json(ResponseFormatter.success({
      total,
      active,
      inactive: total - active
    }));
  } catch (error) {
    return res.status(500).json(
      ResponseFormatter.error('Errore nel recupero statistiche', 'STATS_ERROR')
    );
  }
});

/**
 * GET /api/admin/document-categories/stats
 * Ottiene le statistiche delle categorie
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const [total, active] = await Promise.all([
      prisma.documentCategory.count(),
      prisma.documentCategory.count({
        where: { isActive: true }
      })
    ]);

    return res.json(ResponseFormatter.success({
      total,
      active,
      inactive: total - active
    }));
  } catch (error) {
    return res.status(500).json(
      ResponseFormatter.error('Errore nel recupero statistiche', 'STATS_ERROR')
    );
  }
});

/**
 * GET /api/admin/document-permissions/stats
 * Ottiene le statistiche dei permessi
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const configured = await prisma.documentPermission.count();
    
    const byRole = await prisma.documentPermission.groupBy({
      by: ['role'],
      _count: true
    });

    return res.json(ResponseFormatter.success({
      configured,
      byRole
    }));
  } catch (error) {
    return res.status(500).json(
      ResponseFormatter.error('Errore nel recupero statistiche', 'STATS_ERROR')
    );
  }
});

export default router;
