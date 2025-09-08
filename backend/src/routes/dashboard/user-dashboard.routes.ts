import { Router } from 'express';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { ResponseFormatter } from '../../utils/responseFormatter';

const router = Router();

/**
 * GET /api/dashboard
 * Main dashboard endpoint for all users - returns real data from database
 */
router.get('/', async (req: any, res: any) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role || 'CLIENT';
    
    logger.info(`Dashboard accessed by user ${userId} with role ${userRole}`);

    // Get data based on user role
    if (userRole === 'CLIENT') {
      // Get statistics for client
      const [
        totalRequests,
        pendingRequests,
        inProgressRequests, 
        completedRequests,
        totalQuotes,
        acceptedQuotes,
        totalSpentData
      ] = await Promise.all([
        // Total requests by this client
        prisma.assistanceRequest.count({
          where: { clientId: userId }
        }),
        // Pending requests
        prisma.assistanceRequest.count({
          where: { 
            clientId: userId,
            status: 'PENDING'
          }
        }),
        // In progress requests
        prisma.assistanceRequest.count({
          where: { 
            clientId: userId,
            status: 'IN_PROGRESS'
          }
        }),
        // Completed requests
        prisma.assistanceRequest.count({
          where: { 
            clientId: userId,
            status: 'COMPLETED'
          }
        }),
        // Total quotes received
        prisma.quote.count({
          where: {
            AssistanceRequest: {
              clientId: userId
            }
          }
        }),
        // Accepted quotes
        prisma.quote.count({
          where: {
            AssistanceRequest: {
              clientId: userId
            },
            status: 'ACCEPTED'
          }
        }),
        // Total spent (sum of all accepted quotes)
        prisma.quote.aggregate({
          where: {
            AssistanceRequest: {
              clientId: userId
            },
            status: 'ACCEPTED'
          },
          _sum: {
            amount: true
          }
        })
      ]);

      // Get recent requests with professional info AND address data
      const recentRequests = await prisma.assistanceRequest.findMany({
        where: { clientId: userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          User_AssistanceRequest_professionalIdToUser: {
            select: {
              firstName: true,
              lastName: true,
              fullName: true,
              address: true, // NUOVO: Include l'indirizzo del professionista
              city: true,
              province: true
            }
          },
          Category: {
            select: {
              name: true
            }
          }
        }
      });

      // Get recent quotes
      const recentQuotes = await prisma.quote.findMany({
        where: {
          AssistanceRequest: {
            clientId: userId
          }
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          AssistanceRequest: {
            select: {
              title: true
            }
          },
          User: {
            select: {
              firstName: true,
              lastName: true,
              fullName: true
            }
          }
        }
      });

      // Get upcoming appointments (requests with scheduled dates in the future)
      const upcomingAppointments = await prisma.assistanceRequest.findMany({
        where: {
          clientId: userId,
          scheduledDate: {
            gte: new Date()
          },
          status: {
            in: ['ASSIGNED', 'IN_PROGRESS']
          }
        },
        take: 3,
        orderBy: { scheduledDate: 'asc' },
        select: {
          id: true,
          title: true,
          scheduledDate: true,
          address: true,
          city: true,
          province: true
        }
      });

      // Convert Decimal to number for amount
      const totalSpent = totalSpentData._sum.amount ? Number(totalSpentData._sum.amount) : 0;

      const dashboardData = {
        stats: {
          totalRequests,
          pendingRequests,
          inProgressRequests,
          completedRequests,
          totalQuotes,
          acceptedQuotes,
          totalSpent: totalSpent
        },
        recentRequests: recentRequests.map(request => ({
          id: request.id,
          title: request.title,
          Category: request.category?.name || 'Non categorizzato',
          status: request.status.toLowerCase(),
          createdAt: request.createdAt.toISOString(),
          professionalName: request.User_AssistanceRequest_professionalIdToUser ? 
            (request.User_AssistanceRequest_professionalIdToUser.fullName || `${request.User_AssistanceRequest_professionalIdToUser.firstName} ${request.User_AssistanceRequest_professionalIdToUser.lastName}`) : null,
          // NUOVO: Aggiungi i dati dell'indirizzo della richiesta
          address: request.address,
          city: request.city,
          province: request.province,
          // NUOVO: Aggiungi l'indirizzo del professionista se assegnato
          professionalAddress: request.User_AssistanceRequest_professionalIdToUser && request.User_AssistanceRequest_professionalIdToUser.address ? 
            `${request.User_AssistanceRequest_professionalIdToUser.address}, ${request.User_AssistanceRequest_professionalIdToUser.city} (${request.User_AssistanceRequest_professionalIdToUser.province})` : null
        })),
        recentQuotes: recentQuotes.map(quote => ({
          id: quote.id,
          requestTitle: quote.AssistanceRequest?.title,
          amount: Number(quote.amount),
          status: quote.status.toLowerCase(),
          createdAt: quote.createdAt.toISOString(),
          professionalName: quote.User ? 
            (quote.User.fullName || `${quote.User.firstName} ${quote.User.lastName}`) : null
        })),
        upcomingAppointments: upcomingAppointments.map(apt => ({
          id: apt.id,
          requestTitle: apt.title,
          scheduledDate: apt.scheduledDate?.toISOString() || null,
          address: apt.address ? `${apt.address}, ${apt.city} (${apt.province})` : 'Indirizzo non specificato'
        }))
      };

      res.json(ResponseFormatter.success(dashboardData, 'Dashboard data retrieved successfully'));

    } else if (userRole === 'PROFESSIONAL') {
      // Get statistics for professional
      const [
        totalRequests,
        pendingRequests,
        inProgressRequests,
        completedRequests,
        totalQuotes,
        acceptedQuotes,
        totalEarnedData,
        completedJobs
      ] = await Promise.all([
        // Total requests assigned to this professional
        prisma.assistanceRequest.count({
          where: { professionalId: userId }
        }),
        // Pending/assigned requests
        prisma.assistanceRequest.count({
          where: { 
            professionalId: userId,
            status: { in: ['ASSIGNED', 'PENDING'] }
          }
        }),
        // In progress requests
        prisma.assistanceRequest.count({
          where: { 
            professionalId: userId,
            status: 'IN_PROGRESS'
          }
        }),
        // Completed requests
        prisma.assistanceRequest.count({
          where: { 
            professionalId: userId,
            status: 'COMPLETED'
          }
        }),
        // Total quotes created
        prisma.quote.count({
          where: { professionalId: userId }
        }),
        // Accepted quotes
        prisma.quote.count({
          where: { 
            professionalId: userId,
            status: 'ACCEPTED'
          }
        }),
        // Total earned (sum of all accepted quotes)
        prisma.quote.aggregate({
          where: {
            professionalId: userId,
            status: 'ACCEPTED'
          },
          _sum: {
            amount: true
          }
        }),
        // Completed jobs
        prisma.assistanceRequest.count({
          where: {
            professionalId: userId,
            status: 'COMPLETED'
          }
        })
      ]);

      // Get recent requests with client info AND address data
      const recentRequests = await prisma.assistanceRequest.findMany({
        where: { professionalId: userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          User_AssistanceRequest_clientIdToUser: {
            select: {
              firstName: true,
              lastName: true,
              fullName: true
            }
          },
          Category: {
            select: {
              name: true
            }
          }
        }
      });

      // Get recent quotes
      const recentQuotes = await prisma.quote.findMany({
        where: { professionalId: userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          AssistanceRequest: {
            select: {
              title: true
            }
          }
        }
      });

      // Get upcoming appointments
      const upcomingAppointments = await prisma.assistanceRequest.findMany({
        where: {
          professionalId: userId,
          scheduledDate: {
            gte: new Date()
          },
          status: {
            in: ['ASSIGNED', 'IN_PROGRESS']
          }
        },
        take: 3,
        orderBy: { scheduledDate: 'asc' },
        select: {
          id: true,
          title: true,
          scheduledDate: true,
          address: true,
          city: true,
          province: true
        }
      });

      // Convert Decimal to number for amount
      const totalEarned = totalEarnedData._sum.amount ? Number(totalEarnedData._sum.amount) : 0;

      const dashboardData = {
        stats: {
          totalRequests,
          pendingRequests,
          inProgressRequests,
          completedRequests,
          totalQuotes,
          acceptedQuotes,
          totalEarned: totalEarned,
          averageRating: 0, // Non c'è il campo rating nel database attualmente
          completedJobs
        },
        recentRequests: recentRequests.map(request => ({
          id: request.id,
          title: request.title,
          Category: request.category?.name || 'Non categorizzato',
          status: request.status.toLowerCase(),
          createdAt: request.createdAt.toISOString(),
          clientName: request.User_AssistanceRequest_clientIdToUser ? 
            (request.User_AssistanceRequest_clientIdToUser.fullName || `${request.User_AssistanceRequest_clientIdToUser.firstName} ${request.User_AssistanceRequest_clientIdToUser.lastName}`) : null,
          // NUOVO: Aggiungi i dati dell'indirizzo della richiesta
          address: request.address,
          city: request.city,
          province: request.province
        })),
        recentQuotes: recentQuotes.map(quote => ({
          id: quote.id,
          requestTitle: quote.AssistanceRequest?.title,
          amount: Number(quote.amount),
          status: quote.status.toLowerCase(),
          createdAt: quote.createdAt.toISOString()
        })),
        upcomingAppointments: upcomingAppointments.map(apt => ({
          id: apt.id,
          requestTitle: apt.title,
          scheduledDate: apt.scheduledDate?.toISOString() || null,
          address: apt.address ? `${apt.address}, ${apt.city} (${apt.province})` : 'Indirizzo non specificato'
        }))
      };

      res.json(ResponseFormatter.success(dashboardData, 'Dashboard data retrieved successfully'));

    } else {
      // Admin/Staff dashboard data - SAME AS ADMIN DASHBOARD
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

      // Get users by role - SAME AS ADMIN DASHBOARD
      const [clientsCount, professionalsCount, staffCount] = await Promise.all([
        prisma.user.count({ where: { role: 'CLIENT' } }),
        prisma.user.count({ where: { role: 'PROFESSIONAL' } }),
        prisma.user.count({ 
          where: { 
            role: { in: ['ADMIN', 'SUPER_ADMIN'] }
          } 
        })
      ]);

      // Get recent requests with address data
      const recentRequests = await prisma.assistanceRequest.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          User_AssistanceRequest_clientIdToUser: {
            select: {
              firstName: true,
              lastName: true,
              fullName: true
            }
          },
          Category: {
            select: {
              name: true
            }
          }
        }
      });

      // Get recent quotes
      const recentQuotes = await prisma.quote.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          AssistanceRequest: {
            select: {
              title: true
            }
          }
        }
      });

      // Get recent users - SAME AS ADMIN DASHBOARD
      const recentUsers = await prisma.user.findMany({
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
      });

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
            clientName: request.User_AssistanceRequest_clientIdToUser ? 
              (request.User_AssistanceRequest_clientIdToUser.fullName || `${request.User_AssistanceRequest_clientIdToUser.firstName} ${request.User_AssistanceRequest_clientIdToUser.lastName}`) : null,
            // NUOVO: Aggiungi i dati dell'indirizzo
            address: request.address,
            city: request.city,
            province: request.province
          })),
          recentQuotes: recentQuotes.map(quote => ({
            id: quote.id,
            requestTitle: quote.AssistanceRequest?.title,
            amount: Number(quote.amount),
            status: quote.status.toLowerCase(),
            createdAt: quote.createdAt.toISOString()
          }))
        },
        upcomingAppointments: []
      };

      res.json(ResponseFormatter.success(dashboardData, 'Dashboard data retrieved successfully'));
    }

  } catch (error) {
    logger.error('Error fetching dashboard data:', error);
    res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero dei dati della dashboard',
      'DASHBOARD_ERROR',
      process.env.NODE_ENV === 'development' ? error.message : undefined
    ));
  }
});

export default router;