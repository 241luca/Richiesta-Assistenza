import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { ResponseFormatter } from '../../utils/responseFormatter';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { Role } from '@prisma/client';

const router = Router();

/**
 * GET /api/admin/document-config/stats
 * Ottieni statistiche configurazione sistema documenti
 */
router.get('/stats',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  async (req: any, res: any) => {
    try {
      const [
        systemConfigs,
        customFields,
        uiConfigs,
        permissions,
        notifications,
        workflows,
        categories
      ] = await Promise.all([
        prisma.documentSystemConfig.count(),
        prisma.documentCustomField.count(),
        prisma.documentUIConfig.count(),
        prisma.documentPermission.count(),
        prisma.documentNotificationTemplate.count(),
        prisma.approvalWorkflowConfig.count(),
        prisma.documentCategory.count()
      ]);

      const stats = {
        settings: systemConfigs,
        customFields,
        uiConfigs,
        permissions,
        notifications,
        workflows,
        categories
      };

      return res.json(ResponseFormatter.success(stats));
    } catch (error: any) {
      logger.error('Error fetching config stats:', error);
      return res.status(500).json(
        ResponseFormatter.error('Failed to fetch stats', 'STATS_ERROR')
      );
    }
  }
);

/**
 * GET /api/admin/document-permissions/stats
 * Ottieni statistiche sui permessi documenti
 */
router.get('/permissions-stats',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  async (req: any, res: any) => {
    try {
      const configured = await prisma.documentPermission.count();
      
      const byRole = await prisma.documentPermission.groupBy({
        by: ['role'],
        _count: true
      });

      const stats = {
        configured,
        byRole: byRole.map(r => ({
          role: r.role,
          count: r._count
        }))
      };

      return res.json(ResponseFormatter.success(stats));
    } catch (error: any) {
      logger.error('Error fetching permission stats:', error);
      return res.status(500).json(
        ResponseFormatter.error('Failed to fetch stats', 'STATS_ERROR')
      );
    }
  }
);

/**
 * GET /api/admin/document-notifications/stats
 * Ottieni statistiche sui template notifiche
 */
router.get('/notifications-stats',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  async (req: any, res: any) => {
    try {
      const [total, active] = await Promise.all([
        prisma.documentNotificationTemplate.count(),
        prisma.documentNotificationTemplate.count({ 
          where: { isActive: true } 
        })
      ]);

      const stats = {
        total,
        active,
        inactive: total - active
      };

      return res.json(ResponseFormatter.success(stats));
    } catch (error: any) {
      logger.error('Error fetching notification stats:', error);
      return res.status(500).json(
        ResponseFormatter.error('Failed to fetch stats', 'STATS_ERROR')
      );
    }
  }
);

export default router;
