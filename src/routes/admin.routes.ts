import { Router } from 'express';
import { ResponseFormatter } from '../utils/responseFormatter';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';

const router = Router();

/**
 * GET /api/admin/dashboard
 * Dashboard data with REAL data from database
 */
router.get('/dashboard', async (req: any, res: any) => {
  try {
    // Parametri di paginazione e ordinamento dalle query
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) || 'desc';
    const skip = (page - 1) * limit;
    
    // Mappa i campi di ordinamento ai campi del database
    const sortFieldMap: any = {
      'date': 'createdAt',
      'title': 'title',
      'status': 'status',
      'priority': 'priority',
      'client': 'client.lastName',
      'professional': 'professional.lastName',
      'requestedDate': 'requestedDate',
      'scheduledDate': 'scheduledDate'
    };
    
    const orderByField = sortFieldMap[sortBy] || 'createdAt';
    
    // Costruisci l'oggetto orderBy per Prisma
    let orderBy: any = {};
    if (orderByField.includes('.')) {
      // Per campi nested come client.lastName
      const [relation, field] = orderByField.split('.');
      orderBy[relation] = { [field]: sortOrder };
    } else {
      orderBy[orderByField] = sortOrder;
    }
    // Recupera dati REALI dal database
    const [totalUsers, totalRequests, totalQuotes, users, requests, quotes, allRequests, totalRequestsCount] = await Promise.all([
      prisma.user.count(),
      prisma.assistanceRequest.count(),
      prisma.quote.count(),
      prisma.user.findMany({ 
        take: 5, 
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          createdAt: true
        }
      }),
      prisma.assistanceRequest.findMany({ 
        take: 5, 
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true
        }
      }),
      prisma.quote.findMany({ 
        take: 5, 
        orderBy: { createdAt: 'desc' },
        include: {
          request: {
            select: { id: true, title: true }
          }
        }
      }),
      // Recupera TUTTE le richieste per la griglia (con paginazione)
      prisma.assistanceRequest.findMany({
        skip,
        take: limit,
        orderBy,
        include: {
          subcategory: {
            select: { id: true, name: true }
          },
          client: {
            select: { id: true, firstName: true, lastName: true }
          },
          professional: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      }),
      // Conta totale richieste per paginazione
      prisma.assistanceRequest.count()
    ]);

    // Conta utenti per ruolo
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: true
    });

    // Conta richieste per stato
    const requestsByStatus = await prisma.assistanceRequest.groupBy({
      by: ['status'],
      _count: true
    });

    // Calcola revenue dai preventivi accettati
    const revenue = await prisma.quote.aggregate({
      where: { status: 'ACCEPTED' },
      _sum: { amount: true }
    });

    // Formatta i dati per il frontend
    const dashboardData = {
      stats: {
        totalUsers,
        totalRequests,
        totalQuotes,
        totalRevenue: revenue._sum.amount ? Number(revenue._sum.amount) : 0,
        usersByRole: {
          clients: usersByRole.find(u => u.role === 'CLIENT')?._count || 0,
          professionals: usersByRole.find(u => u.role === 'PROFESSIONAL')?._count || 0,
          staff: (usersByRole.find(u => u.role === 'ADMIN')?._count || 0) + 
                 (usersByRole.find(u => u.role === 'SUPER_ADMIN')?._count || 0)
        },
        requestsByStatus: {
          pending: requestsByStatus.find(r => r.status === 'PENDING')?._count || 0,
          assigned: requestsByStatus.find(r => r.status === 'ASSIGNED')?._count || 0,
          in_progress: requestsByStatus.find(r => r.status === 'IN_PROGRESS')?._count || 0,
          completed: requestsByStatus.find(r => r.status === 'COMPLETED')?._count || 0,
          cancelled: requestsByStatus.find(r => r.status === 'CANCELLED')?._count || 0
        },
        monthlyGrowth: {
          users: 0, // TODO: Calcolare crescita reale
          requests: 0, // TODO: Calcolare crescita reale
          revenue: 0 // TODO: Calcolare crescita reale
        }
      },
      recentActivity: {
        recentUsers: users.map(user => ({
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        })),
        recentRequests: requests.map(request => ({
          id: request.id,
          title: request.title,
          status: request.status,
          createdAt: request.createdAt
        })),
        recentQuotes: quotes.map(quote => ({
          id: quote.id,
          requestId: quote.request.id, // Aggiungiamo l'ID della richiesta
          requestTitle: quote.request.title,
          amount: Number(quote.amount), // Converti Decimal a number
          status: quote.status,
          createdAt: quote.createdAt
        })),
        // Aggiungiamo le richieste per la griglia
        allRequests: allRequests.map(request => ({
          id: request.id,
          title: request.title,
          status: request.status,
          priority: request.priority,
          subcategory: request.subcategory?.name || 'N/A',
          subcategoryId: request.subcategoryId,
          client: request.client ? `${request.client.firstName} ${request.client.lastName}` : 'N/A',
          professional: request.professional ? `${request.professional.firstName} ${request.professional.lastName}` : null,
          createdAt: request.createdAt,
          requestedDate: request.requestedDate,
          scheduledDate: request.scheduledDate
        })),
        // Aggiungi info paginazione
        pagination: {
          page,
          limit,
          total: totalRequestsCount,
          totalPages: Math.ceil(totalRequestsCount / limit)
        }
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
