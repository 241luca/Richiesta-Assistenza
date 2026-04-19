import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { ResponseFormatter } from '../utils/responseFormatter';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/admin/dashboard
 * Simple admin dashboard endpoint for testing
 */
router.get('/dashboard', authenticate, async (req: any, res: any) => {
  try {
    // Simple count queries first
    const totalUsers = await prisma.user.count();
    const totalRequests = await prisma.assistanceRequest.count();
    const totalQuotes = await prisma.quote.count();
    
    const dashboardData = {
      stats: {
        totalUsers,
        totalRequests,
        totalQuotes,
        totalRevenue: 0,
        usersByRole: {
          clients: 0,
          professionals: 0,
          staff: 0
        },
        requestsByStatus: {
          pending: 0,
          assigned: 0,
          in_progress: 0,
          completed: 0,
          cancelled: 0
        },
        monthlyGrowth: {
          users: 0,
          requests: 0,
          revenue: 0
        }
      },
      recentActivity: {
        recentUsers: [] as any[],
        recentRequests: [] as any[],
        recentQuotes: [] as any[]
      }
    };

    res.json(ResponseFormatter.success(
      dashboardData,
      'Simple admin dashboard data retrieved successfully',
      {
        totalEntities: totalUsers + totalRequests + totalQuotes,
        queriesExecuted: 3
      }
    ));
    
  } catch (error: any) {
    logger.error('Error in simple dashboard:', error instanceof Error ? error.message : String(error));
    res.status(500).json(ResponseFormatter.error(
      'Failed to fetch simple dashboard data',
      error instanceof Error ? error.message : String(error) || 'Unknown error',
      { 
        details: error instanceof Error ? error.message : String(error) || 'Unknown error' 
      }
    ));
  }
});

export default router;
