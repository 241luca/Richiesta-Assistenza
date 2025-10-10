import { Router } from 'express';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { ResponseFormatter } from '../../utils/responseFormatter';

const router = Router();

/**
 * Helper function to get pending legal documents for a user
 */
async function getPendingLegalDocuments(userId: string) {
  try {
    // Ottieni tutti i documenti attivi con la loro versione pubblicata corrente
    const documents = await prisma.legalDocument.findMany({
      where: {
        isActive: true
      },
      include: {
        LegalDocumentVersion: {
          where: {
            status: 'PUBLISHED',  // IMPORTANTE: Solo versioni PUBBLICATE
            effectiveDate: {
              lte: new Date()  // Solo versioni già effettive
            },
            OR: [
              { expiryDate: null },
              { expiryDate: { gte: new Date() } }  // Non scadute
            ]
          },
          orderBy: {
            publishedAt: 'desc'
          },
          take: 1,
          select: {
            id: true,
            version: true,
            status: true,
            title: true,
            summary: true,
            effectiveDate: true,
            publishedAt: true,
            expiryDate: true
          }
        }
      }
    });

    // IMPORTANTE: Filtra SOLO i documenti che hanno ALMENO UNA versione PUBBLICATA
    // Se un documento non ha versioni pubblicate, NON deve essere visibile ai clienti
    const documentsWithVersion = documents.filter(doc => doc.LegalDocumentVersion.length > 0);
    
    logger.info(`Dashboard: Found ${documents.length} active documents, ${documentsWithVersion.length} with published versions`);
    
    // Log dettagliato per debug
    documentsWithVersion.forEach(doc => {
      const version = doc.LegalDocumentVersion[0];
      if (version) {
        logger.info(`Document ${doc.displayName}: Version ${version.version}, Status: ${version.status}, PublishedAt: ${version.publishedAt}, EffectiveDate: ${version.effectiveDate}`);
      }
    });

    // Per ogni documento, verifica se l'utente ha già accettato la versione corrente
    const pendingDocuments = [];
    
    for (const doc of documentsWithVersion) {
      const currentVersion = doc.LegalDocumentVersion[0];
      
      // Verifica se l'utente ha già accettato questa specifica versione
      const acceptance = await prisma.userLegalAcceptance.findFirst({
        where: {
          userId: userId,
          documentId: doc.id,
          versionId: currentVersion.id,
          isActive: true
        }
      });

      // Se non ha accettato questa versione, aggiungilo ai documenti pendenti
      if (!acceptance) {
        pendingDocuments.push({
          documentId: doc.id,
          versionId: currentVersion.id,
          type: doc.type,
          displayName: doc.displayName,
          description: doc.description,
          version: currentVersion.version,
          isRequired: doc.isRequired,
          effectiveDate: currentVersion.effectiveDate.toISOString(),
          summary: currentVersion.summary
        });
      }
    }

    return pendingDocuments;
  } catch (error) {
    logger.error('Error getting pending legal documents:', error);
    return [];
  }
}

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
        totalSpentData,
        // NUOVO: Interventi da confermare
        pendingInterventions,
        // NUOVO: Preventivi da accettare
        pendingQuotes
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
            request: {
              clientId: userId
            }
          }
        }),
        // Accepted quotes
        prisma.quote.count({
          where: {
            request: {
              clientId: userId
            },
            status: 'ACCEPTED'
          }
        }),
        // Total spent (sum of all accepted quotes)
        prisma.quote.aggregate({
          where: {
            request: {
              clientId: userId
            },
            status: 'ACCEPTED'
          },
          _sum: {
            amount: true
          }
        }),
        // NUOVO: Conta interventi programmati da confermare
        prisma.scheduledIntervention.count({
          where: {
            request: {
              clientId: userId
            },
            status: 'PROPOSED',
            clientConfirmed: false
          }
        }),
        // NUOVO: Conta preventivi in attesa di risposta
        prisma.quote.count({
          where: {
            request: {
              clientId: userId
            },
            status: 'PENDING',
            expiresAt: {
              gte: new Date() // Non scaduti
            }
          }
        })
      ]);

      // Get recent requests with professional info AND address data
      const recentRequests = await prisma.assistanceRequest.findMany({
        where: { clientId: userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          professional: {
            select: {
              firstName: true,
              lastName: true,
              fullName: true,
              address: true, // NUOVO: Include l'indirizzo del professionista
              city: true,
              province: true
            }
          },
          category: {
            select: {
              name: true
            }
          }
        }
      });

      // NUOVO: Get preventivi da accettare con dettagli
      const quotesToAccept = await prisma.quote.findMany({
        where: {
          request: {
            clientId: userId
          },
          status: 'PENDING',
          expiresAt: {
            gte: new Date() // Non scaduti
          }
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          request: {
            select: {
              id: true,
              title: true,
              description: true
            }
          },
          professional: {
            select: {
              id: true,
              fullName: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true
            }
          },
          items: true // Include gli items del preventivo
        }
      });

      // Get recent quotes
      const recentQuotes = await prisma.quote.findMany({
        where: {
          request: {
            clientId: userId
          }
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          request: {
            select: {
              title: true
            }
          },
          professional: {
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

      // NUOVO: Get interventi da confermare con dettagli
      const interventionsToConfirm = await prisma.scheduledIntervention.findMany({
        where: {
          request: {
            clientId: userId
          },
          status: 'PROPOSED',
          clientConfirmed: false
        },
        take: 5,
        orderBy: { proposedDate: 'asc' },
        include: {
          request: {
            select: {
              id: true,
              title: true,
              address: true,
              city: true
            }
          },
          professional: {
            select: {
              id: true,
              fullName: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // NUOVO: Get documenti legali da accettare
      const pendingLegalDocuments = await getPendingLegalDocuments(userId);

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
          totalSpent: totalSpent,
          // NUOVO: Aggiungi contatori
          pendingInterventions: pendingInterventions,
          pendingQuotes: pendingQuotes
        },
        recentRequests: recentRequests.map(request => ({
          id: request.id,
          title: request.title,
          Category: request.category?.name || 'Non categorizzato',
          status: request.status.toLowerCase(),
          createdAt: request.createdAt.toISOString(),
          professionalName: request.professional ? 
            (request.professional.fullName || `${request.professional.firstName} ${request.professional.lastName}`) : null,
          // NUOVO: Aggiungi i dati dell'indirizzo della richiesta
          address: request.address,
          city: request.city,
          province: request.province,
          // NUOVO: Aggiungi l'indirizzo del professionista se assegnato
          professionalAddress: request.professional && request.professional.address ? 
            `${request.professional.address}, ${request.professional.city} (${request.professional.province})` : null
        })),
        recentQuotes: recentQuotes.map(quote => ({
          id: quote.id,
          requestTitle: quote.request?.title,
          amount: Number(quote.amount),
          status: quote.status.toLowerCase(),
          createdAt: quote.createdAt.toISOString(),
          professionalName: quote.professional ? 
            (quote.professional.fullName || `${quote.professional.firstName} ${quote.professional.lastName}`) : null
        })),
        upcomingAppointments: upcomingAppointments.map(apt => ({
          id: apt.id,
          requestTitle: apt.title,
          scheduledDate: apt.scheduledDate?.toISOString() || null,
          address: apt.address ? `${apt.address}, ${apt.city} (${apt.province})` : 'Indirizzo non specificato'
        })),
        // NUOVO: Aggiungi documenti legali da accettare
        pendingLegalDocuments: pendingLegalDocuments,
        // NUOVO: Aggiungi lista interventi da confermare
        interventionsToConfirm: interventionsToConfirm.map(intervention => ({
          id: intervention.id,
          requestId: intervention.request.id,
          requestTitle: intervention.request.title,
          proposedDate: intervention.proposedDate.toISOString(),
          description: intervention.description,
          estimatedDuration: intervention.estimatedDuration,
          professionalName: intervention.professional?.fullName || 
            `${intervention.professional?.firstName} ${intervention.professional?.lastName}`,
          address: intervention.request.address ? 
            `${intervention.request.address}, ${intervention.request.city}` : 'Da definire',
          status: 'DA_CONFERMARE',
          urgent: true // Flag per evidenziare nell'UI
        })),
        // NUOVO: Aggiungi lista preventivi da accettare
        quotesToAccept: quotesToAccept.map(quote => ({
          id: quote.id,
          requestId: quote.request.id,
          requestTitle: quote.request.title,
          requestDescription: quote.request.description,
          amount: Number(quote.amount),
          professionalName: quote.professional?.fullName || 
            `${quote.professional?.firstName} ${quote.professional?.lastName}`,
          professionalPhone: quote.professional?.phone,
          professionalEmail: quote.professional?.email,
          items: quote.items?.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            totalPrice: Number(item.totalPrice)
          })) || [],
          expiresAt: quote.expiresAt?.toISOString(),
          validUntil: quote.validUntil?.toISOString(),
          createdAt: quote.createdAt.toISOString(),
          status: 'DA_ACCETTARE',
          urgent: true
        })),
        // NUOVO: Aggiungi documenti legali da accettare
        pendingLegalDocuments: pendingLegalDocuments
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
          client: {
            select: {
              firstName: true,
              lastName: true,
              fullName: true
            }
          },
          category: {
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
          request: {
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

      // NUOVO: Get documenti legali da accettare per il professionista
      const pendingLegalDocuments = await getPendingLegalDocuments(userId);

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
          clientName: request.client ? 
            (request.client.fullName || `${request.client.firstName} ${request.client.lastName}`) : null,
          // NUOVO: Aggiungi i dati dell'indirizzo della richiesta
          address: request.address,
          city: request.city,
          province: request.province
        })),
        recentQuotes: recentQuotes.map(quote => ({
          id: quote.id,
          requestTitle: quote.request?.title,
          amount: Number(quote.amount),
          status: quote.status.toLowerCase(),
          createdAt: quote.createdAt.toISOString()
        })),
        upcomingAppointments: upcomingAppointments.map(apt => ({
          id: apt.id,
          requestTitle: apt.title,
          scheduledDate: apt.scheduledDate?.toISOString() || null,
          address: apt.address ? `${apt.address}, ${apt.city} (${apt.province})` : 'Indirizzo non specificato'
        })),
        // NUOVO: Aggiungi documenti legali da accettare per il professionista
        pendingLegalDocuments: pendingLegalDocuments
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
          client: {
            select: {
              firstName: true,
              lastName: true,
              fullName: true
            }
          },
          category: {
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
          request: {
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
            clientName: request.client ? 
              (request.client.fullName || `${request.client.firstName} ${request.client.lastName}`) : null,
            // NUOVO: Aggiungi i dati dell'indirizzo
            address: request.address,
            city: request.city,
            province: request.province
          })),
          recentQuotes: recentQuotes.map(quote => ({
            id: quote.id,
            requestTitle: quote.request?.title,
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