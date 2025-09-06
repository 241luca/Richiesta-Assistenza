import { Router } from 'express';
import { prisma } from '../../config/database';
import { ResponseFormatter } from '../../utils/responseFormatter';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * GET /api/admin/dashboard
 * Returns dashboard statistics for admin with REAL data from database
 */
router.get('/', async (req: any, res: any) => {
  try {
    logger.info('Admin dashboard accessed');

    // Get real statistics from database
    const [
      totalUsers,
      totalRequests,
      pendingRequests,
      assignedRequests,
      inProgressRequests,
      completedRequests,
      cancelledRequests,
      totalQuotes,
      acceptedQuotes,
      totalRevenueData
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      // Total requests
      prisma.assistanceRequest.count(),
      // Pending requests
      prisma.assistanceRequest.count({
        where: { status: 'PENDING' }
      }),
      // Assigned requests
      prisma.assistanceRequest.count({
        where: { status: 'ASSIGNED' }
      }),
      // In progress requests
      prisma.assistanceRequest.count({
        where: { status: 'IN_PROGRESS' }
      }),
      // Completed requests
      prisma.assistanceRequest.count({
        where: { status: 'COMPLETED' }
      }),
      // Cancelled requests
      prisma.assistanceRequest.count({
        where: { status: 'CANCELLED' }
      }),
      // Total quotes
      prisma.quote.count(),
      // Accepted quotes
      prisma.quote.count({
        where: { status: 'ACCEPTED' }
      }),
      // Total revenue (sum of all accepted quotes)
      prisma.quote.aggregate({
        where: { status: 'ACCEPTED' },
        _sum: {
          amount: true
        }
      })
    ]);

    // Get users by role
    const [clientsCount, professionalsCount, staffCount] = await Promise.all([
      prisma.user.count({ where: { role: 'CLIENT' } }),
      prisma.user.count({ where: { role: 'PROFESSIONAL' } }),
      prisma.user.count({ 
        where: { 
          role: { in: ['ADMIN', 'SUPER_ADMIN'] }
        } 
      })
    ]);

    // Get recent activity data
    const [recentUsers, recentRequests, recentQuotes] = await Promise.all([
      // Recent users
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          fullName: true,
          email: true,
          role: true,
          createdAt: true
        }
      }),
      // Recent requests
      prisma.assistanceRequest.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          client: {
            select: {
              firstName: true,
              lastName: true,
              fullName: true
            }
          }
        }
      }),
      // Recent quotes
      prisma.quote.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
          request: {
            select: {
              title: true
            }
          }
        }
      })
    ]);

    // Convert Decimal to number for amount
    const totalRevenue = totalRevenueData._sum.amount ? Number(totalRevenueData._sum.amount) : 0;

    const dashboardData = {
      stats: {
        totalUsers,
        totalRequests,
        totalQuotes,
        totalRevenue,
        usersByRole: {
          clients: clientsCount,
          professionals: professionalsCount,
          staff: staffCount
        },
        requestsByStatus: {
          pending: pendingRequests,
          assigned: assignedRequests,
          in_progress: inProgressRequests,
          completed: completedRequests,
          cancelled: cancelledRequests
        },
        monthlyGrowth: {
          users: 15, // Placeholder - potremmo calcolare questo confrontando con il mese scorso
          requests: 12, // Placeholder
          revenue: 8 // Placeholder
        }
      },
      recentActivity: {
        recentUsers: recentUsers.map(user => ({
          id: user.id,
          name: user.fullName || `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt.toISOString()
        })),
        recentRequests: recentRequests.map(request => ({
          id: request.id,
          title: request.title,
          status: request.status.toLowerCase(),
          createdAt: request.createdAt.toISOString(),
          clientName: request.client ? 
            (request.client.fullName || `${request.client.firstName} ${request.client.lastName}`) : null
        })),
        recentQuotes: recentQuotes.map(quote => ({
          id: quote.id,
          requestTitle: quote.request?.title,
          amount: Number(quote.amount),
          status: quote.status.toLowerCase(),
          createdAt: quote.createdAt.toISOString()
        }))
      }
    };

    res.json(ResponseFormatter.success(
      dashboardData,
      'Admin dashboard data retrieved successfully',
      {
        totalStats: Object.keys(dashboardData.stats).length,
        recentUsersCount: dashboardData.recentActivity.recentUsers.length,
        recentRequestsCount: dashboardData.recentActivity.recentRequests.length,
        recentQuotesCount: dashboardData.recentActivity.recentQuotes.length
      }
    ));
  } catch (error) {
    logger.error('Error fetching admin dashboard data:', error);
    res.status(500).json(ResponseFormatter.error(
      'Failed to fetch admin dashboard data',
      'ADMIN_DASHBOARD_ERROR',
      process.env.NODE_ENV === 'development' ? error.message : undefined
    ));
  }
});

export default router;
