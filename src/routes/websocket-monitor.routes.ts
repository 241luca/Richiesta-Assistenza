/**
 * WebSocket Monitoring Routes
 * Endpoints per monitorare lo stato delle connessioni WebSocket
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { ResponseFormatter } from '../utils/responseFormatter';
import { getWebSocketStats } from '../websocket/socket.server';
import { logger } from '../utils/logger';
import { Role } from '@prisma/client';

const router = Router();

/**
 * GET /api/admin/websocket/stats
 * Ottieni statistiche WebSocket in tempo reale
 */
router.get('/stats',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  (req, res) => {
    try {
      const stats = getWebSocketStats();
      
      // Aggiungi informazioni extra
      const enhanced = {
        ...stats,
        memoryUsageMB: {
          rss: Math.round(stats.memoryUsage.rss / 1024 / 1024),
          heapTotal: Math.round(stats.memoryUsage.heapTotal / 1024 / 1024),
          heapUsed: Math.round(stats.memoryUsage.heapUsed / 1024 / 1024),
          external: Math.round(stats.memoryUsage.external / 1024 / 1024),
        },
        timestamp: new Date(),
        uptime: process.uptime(),
        health: stats.memoryUsage.rss < 2 * 1024 * 1024 * 1024 ? 'healthy' : 'warning'
      };
      
      res.json(ResponseFormatter.success(enhanced, 'WebSocket stats retrieved'));
    } catch (error) {
      logger.error('Error getting WebSocket stats:', error);
      res.status(500).json(
        ResponseFormatter.error('Failed to get WebSocket stats', 'STATS_ERROR')
      );
    }
  }
);

/**
 * POST /api/admin/websocket/cleanup
 * Forza cleanup manuale delle connessioni zombie
 */
router.post('/cleanup',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  (req, res) => {
    try {
      // Trigger manual cleanup (da implementare in socket.server.ts)
      logger.info('Manual WebSocket cleanup triggered by admin');
      
      res.json(ResponseFormatter.success(
        { message: 'Cleanup triggered' },
        'WebSocket cleanup initiated'
      ));
    } catch (error) {
      logger.error('Error during WebSocket cleanup:', error);
      res.status(500).json(
        ResponseFormatter.error('Failed to cleanup WebSocket', 'CLEANUP_ERROR')
      );
    }
  }
);

export default router;