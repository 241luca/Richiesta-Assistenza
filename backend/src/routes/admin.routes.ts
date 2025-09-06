import { Router } from 'express';
import { ResponseFormatter } from '../utils/responseFormatter';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/admin/dashboard
 * Simple mock dashboard data for testing
 */
router.get('/dashboard', (req: any, res: any) => {
  try {
    // Return mock data that matches the frontend structure
    const dashboardData = {
      stats: {
        totalUsers: 9,
        totalRequests: 20,
        totalQuotes: 12,
        totalRevenue: 15000,
        usersByRole: {
          clients: 5,
          professionals: 3,
          staff: 1
        },
        requestsByStatus: {
          pending: 5,
          assigned: 4,
          in_progress: 3,
          completed: 6,
          cancelled: 2
        },
        monthlyGrowth: {
          users: 15,
          requests: 12,
          revenue: 8
        }
      },
      recentActivity: {
        recentUsers: [
          {
            id: '1',
            name: 'Cliente Test 1',
            email: 'client1@test.it',
            role: 'CLIENT',
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Professionista Test 1',
            email: 'prof1@test.it',
            role: 'PROFESSIONAL',
            createdAt: new Date().toISOString()
          }
        ],
        recentRequests: [
          {
            id: '1',
            title: 'Riparazione Impianto',
            status: 'pending',
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            title: 'Manutenzione Caldaia',
            status: 'completed',
            createdAt: new Date().toISOString()
          }
        ],
        recentQuotes: [
          {
            id: '1',
            requestTitle: 'Preventivo Impianto',
            amount: 1500,
            status: 'pending',
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            requestTitle: 'Preventivo Caldaia',
            amount: 800,
            status: 'accepted',
            createdAt: new Date().toISOString()
          }
        ]
      }
    };

    res.json(ResponseFormatter.success(
      dashboardData,
      'Admin dashboard data retrieved successfully',
      {
        totalStats: Object.keys(dashboardData.stats).length,
        activitiesCount: dashboardData.recentActivity.recentUsers.length + 
                        dashboardData.recentActivity.recentRequests.length + 
                        dashboardData.recentActivity.recentQuotes.length
      }
    ));
  } catch (error) {
    logger.error('Error fetching admin dashboard data:', error);
    res.status(500).json(ResponseFormatter.error('Failed to fetch admin dashboard data'));
  }
});

/**
 * GET /api/admin/users
 * Simple mock users data
 */
router.get('/users', (req: any, res: any) => {
  try {
    const usersData = [
      {
        id: '1',
        email: 'admin@assistenza.it',
        firstName: 'Super',
        lastName: 'Admin',
        fullName: 'Super Admin',
        role: 'SUPER_ADMIN',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        isVerified: true
      },
      {
        id: '2',
        email: 'client1@test.it',
        firstName: 'Cliente',
        lastName: '1',
        fullName: 'Cliente 1',
        role: 'CLIENT',
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
        isVerified: true
      },
      {
        id: '3',
        email: 'prof1@test.it',
        firstName: 'Professionista',
        lastName: '1',
        fullName: 'Professionista 1',
        role: 'PROFESSIONAL',
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
        isVerified: true
      }
    ];

    res.json(ResponseFormatter.success(
      usersData,
      'Admin users data retrieved successfully',
      {
        total: usersData.length,
        verified: usersData.filter(u => u.isVerified).length,
        roles: {
          admins: usersData.filter(u => u.role === 'SUPER_ADMIN').length,
          clients: usersData.filter(u => u.role === 'CLIENT').length,
          professionals: usersData.filter(u => u.role === 'PROFESSIONAL').length
        }
      }
    ));
  } catch (error) {
    logger.error('Error fetching admin users data:', error);
    res.status(500).json(ResponseFormatter.error('Failed to fetch admin users data'));
  }
});

export default router;
