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
    const includePublishedVersion: any = {
      LegalDocumentVersion: {
        where: {
          status: 'PUBLISHED',  // IMPORTANTE: Solo versioni PUBBLICATE
          effectiveDate: { lte: new Date() },
          OR: [
            { expiryDate: null },
            { expiryDate: { gte: new Date() } }  // Non scadute
          ]
        },
        orderBy: { publishedAt: 'desc' },
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
    };

    const documents = await prisma.legalDocument.findMany({
      where: { isActive: true },
      include: includePublishedVersion
    });

    // IMPORTANTE: Filtra SOLO i documenti che hanno ALMENO UNA versione PUBBLICATA
    // Se un documento non ha versioni pubblicate, NON deve essere visibile ai clienti
    const documentsWithVersion = documents.filter(doc => (doc as any).LegalDocumentVersion?.length > 0);
    
    logger.info(`Dashboard: Found ${documents.length} active documents, ${documentsWithVersion.length} with published versions`);
    
    // Log dettagliato per debug
    documentsWithVersion.forEach(doc => {
      const version = (doc as any).LegalDocumentVersion[0];
      if (version) {
        logger.info(`Document ${doc.displayName}: Version ${version.version}, Status: ${version.status}, PublishedAt: ${version.publishedAt}, EffectiveDate: ${version.effectiveDate}`);
      }
    });

    // Per ogni documento, verifica se l'utente ha già accettato la versione corrente
    const pendingDocuments = [];
    
    for (const doc of documentsWithVersion) {
      const currentVersion = (doc as any).LegalDocumentVersion[0];
      
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
      // Pre-carica gli ID delle richieste del client per usare requestId nei filtri
      const clientRequests = await prisma.assistanceRequest.findMany({
        where: { clientId: userId },
        select: { id: true }
      });
      const clientRequestIds = clientRequests.map(r => r.id);
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
            requestId: { in: clientRequestIds }
          }
        }),
        // Accepted quotes
        prisma.quote.count({
          where: {
            requestId: { in: clientRequestIds },
            status: 'ACCEPTED'
          }
        }),
        // Total spent (sum of all accepted quotes)
        prisma.quote.aggregate({
          where: {
            requestId: { in: clientRequestIds },
            status: 'ACCEPTED'
          },
          _sum: {
            amount: true
          }
        }),
        // NUOVO: Conta interventi programmati da confermare
        prisma.scheduledIntervention.count({
          where: {
            requestId: { in: clientRequestIds },
            status: 'PROPOSED',
            clientConfirmed: false
          }
        }),
        // NUOVO: Conta preventivi in attesa di risposta
        prisma.quote.count({
          where: {
            requestId: { in: clientRequestIds },
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
        } as any
      });

      // NUOVO: Get preventivi da accettare con dettagli
      const quotesToAccept = await prisma.quote.findMany({
        where: {
          requestId: { in: clientRequestIds },
          status: 'PENDING',
          expiresAt: {
            gte: new Date() // Non scaduti
          }
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          AssistanceRequest: {
            select: {
              id: true,
              title: true,
              description: true
            }
          },
          User: {
            select: {
              id: true,
              fullName: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true
            }
          },
          QuoteItem: true
        } as any
      });

      // Get recent quotes
      const recentQuotes = await prisma.quote.findMany({
        where: {
          requestId: { in: clientRequestIds }
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
        } as any
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
          requestId: { in: clientRequestIds },
          status: 'PROPOSED',
          clientConfirmed: false
        },
        take: 5,
        orderBy: { proposedDate: 'asc' },
        include: {
          AssistanceRequest: {
            select: {
              id: true,
              title: true,
              address: true,
              city: true
            }
          },
          User_ScheduledIntervention_professionalIdToUser: {
            select: {
              id: true,
              fullName: true,
              firstName: true,
              lastName: true
            }
          }
        } as any
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
          Category: (request as any).Category?.name || 'Non categorizzato',
          status: request.status.toLowerCase(),
          createdAt: request.createdAt.toISOString(),
          professionalName: (request as any).User_AssistanceRequest_professionalIdToUser ? 
            ((request as any).User_AssistanceRequest_professionalIdToUser.fullName || `${(request as any).User_AssistanceRequest_professionalIdToUser.firstName} ${(request as any).User_AssistanceRequest_professionalIdToUser.lastName}`) : null,
          // NUOVO: Aggiungi i dati dell'indirizzo della richiesta
          address: request.address,
          city: request.city,
          province: request.province,
          // NUOVO: Aggiungi l'indirizzo del professionista se assegnato
          professionalAddress: (request as any).User_AssistanceRequest_professionalIdToUser && (request as any).User_AssistanceRequest_professionalIdToUser.address ? 
            `${(request as any).User_AssistanceRequest_professionalIdToUser.address}, ${(request as any).User_AssistanceRequest_professionalIdToUser.city} (${(request as any).User_AssistanceRequest_professionalIdToUser.province})` : null
        })),
        recentQuotes: recentQuotes.map(quote => ({
          id: quote.id,
          requestTitle: (quote as any).AssistanceRequest?.title,
          amount: Number(quote.amount),
          status: quote.status.toLowerCase(),
          createdAt: quote.createdAt.toISOString(),
          professionalName: (quote as any).User ? 
            (((quote as any).User.fullName) || `${(quote as any).User.firstName} ${(quote as any).User.lastName}`) : null
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
        interventionsToConfirm: interventionsToConfirm.map((intervention: any) => ({
          id: intervention.id,
          requestId: intervention.AssistanceRequest?.id,
          requestTitle: intervention.AssistanceRequest?.title,
          proposedDate: intervention.proposedDate.toISOString(),
          description: intervention.description,
          estimatedDuration: intervention.estimatedDuration,
          professionalName: intervention.User_ScheduledIntervention_professionalIdToUser?.fullName || 
            `${intervention.User_ScheduledIntervention_professionalIdToUser?.firstName} ${intervention.User_ScheduledIntervention_professionalIdToUser?.lastName}`,
          address: intervention.AssistanceRequest?.address ? 
            `${intervention.AssistanceRequest.address}, ${intervention.AssistanceRequest.city}` : 'Da definire',
          status: 'DA_CONFERMARE',
          urgent: true // Flag per evidenziare nell'UI
        })),
        // NUOVO: Aggiungi lista preventivi da accettare
        quotesToAccept: quotesToAccept.map((quote: any) => ({
          id: quote.id,
          requestId: quote.AssistanceRequest?.id,
          requestTitle: quote.AssistanceRequest?.title,
          requestDescription: quote.AssistanceRequest?.description,
          amount: Number(quote.amount),
          professionalName: quote.User?.fullName || 
            `${quote.User?.firstName} ${quote.User?.lastName}`,
          professionalPhone: quote.User?.phone,
          professionalEmail: quote.User?.email,
          items: quote.QuoteItem?.map((item: any) => ({
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
        // Nota: la lista dei documenti legali da accettare è già inclusa sopra
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
        } as any
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
        } as any
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
          Category: (request as any).Category?.name || 'Non categorizzato',
          status: request.status.toLowerCase(),
          createdAt: request.createdAt.toISOString(),
          clientName: (request as any).User_AssistanceRequest_clientIdToUser ? 
            ((request as any).User_AssistanceRequest_clientIdToUser.fullName || `${(request as any).User_AssistanceRequest_clientIdToUser.firstName} ${(request as any).User_AssistanceRequest_clientIdToUser.lastName}`) : null,
          // NUOVO: Aggiungi i dati dell'indirizzo della richiesta
          address: request.address,
          city: request.city,
          province: request.province
        })),
        recentQuotes: recentQuotes.map(quote => ({
          id: quote.id,
          requestTitle: (quote as any).AssistanceRequest?.title,
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
        } as any
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
        } as any
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
            clientName: (request as any).User_AssistanceRequest_clientIdToUser ? 
              ((request as any).User_AssistanceRequest_clientIdToUser.fullName || `${(request as any).User_AssistanceRequest_clientIdToUser.firstName} ${(request as any).User_AssistanceRequest_clientIdToUser.lastName}`) : null,
            // NUOVO: Aggiungi i dati dell'indirizzo
            address: request.address,
            city: request.city,
            province: request.province
          })),
          recentQuotes: recentQuotes.map(quote => ({
            id: quote.id,
            requestTitle: (quote as any).AssistanceRequest?.title,
            amount: Number(quote.amount),
            status: quote.status.toLowerCase(),
            createdAt: quote.createdAt.toISOString()
          }))
        },
        upcomingAppointments: [] as { id: string; requestTitle: string; scheduledDate: string | null; address: string }[]
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