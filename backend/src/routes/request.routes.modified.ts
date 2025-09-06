import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validateRequest } from '../middleware/validation';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { 
  formatAssistanceRequest, 
  formatAssistanceRequestList,
  formatQuoteList,
  ResponseFormatter 
} from '../utils/responseFormatter';
import { googleMapsService } from '../services/googleMaps.service';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// GET /api/requests - Get all requests (with filters and distances for professionals)
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { status, priority, category, clientId, professionalId } = req.query;
    const user = req.user!;
    
    // Build filter based on user role and query parameters
    let whereClause: any = {};
    
    // Role-based filtering
    if (user.role === 'CLIENT') {
      whereClause.clientId = user.id;
    } else if (user.role === 'PROFESSIONAL') {
      // Il professionista vede le sue richieste assegnate e quelle pending
      whereClause.OR = [
        { professionalId: user.id },
        { status: 'PENDING' }
      ];
    }
    // ADMIN and SUPER_ADMIN can see all requests
    
    // Apply additional filters from query params
    if (status) {
      const statusArray = status.toString().split(',').map(s => s.trim().toUpperCase());
      if (statusArray.length === 1) {
        whereClause.status = statusArray[0];
      } else {
        whereClause.status = { in: statusArray };
      }
    }
    if (priority) {
      whereClause.priority = priority.toString().toUpperCase();
    }
    if (category) {
      whereClause.categoryId = category;
    }
    if (clientId && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
      whereClause.clientId = clientId;
    }
    if (professionalId && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
      whereClause.professionalId = professionalId;
    }
    
    // Fetch requests from database
    const requests = await prisma.assistanceRequest.findMany({
      where: whereClause,
      include: {
        Client: true,
        Professional: true,
        Category: true,
        SubCategory: true,
        quotes: {
          include: {
            User: true
          }
        },
        attachments: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Format requests
    let formattedRequests = formatAssistanceRequestList(requests);
    
    // NUOVO: Calcola le distanze per i professionisti
    if (user.role === 'PROFESSIONAL') {
      // Ottieni l'indirizzo di lavoro del professionista
      const professional = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          workAddress: true,
          workCity: true,
          workProvince: true,
          workPostalCode: true,
          useResidenceAsWorkAddress: true,
          address: true,
          city: true,
          province: true,
          postalCode: true
        }
      });
      
      if (professional) {
        // Determina l'indirizzo da usare
        let professionalAddress = '';
        if (professional.useResidenceAsWorkAddress) {
          professionalAddress = `${professional.address}, ${professional.city} ${professional.province} ${professional.postalCode}`;
        } else if (professional.workAddress && professional.workCity) {
          professionalAddress = `${professional.workAddress}, ${professional.workCity} ${professional.workProvince} ${professional.workPostalCode}`;
        }
        
        // Se c'è un indirizzo valido, calcola le distanze
        if (professionalAddress) {
          // Calcola le distanze in batch (max 10 per evitare timeout)
          const requestsToCalculate = formattedRequests.slice(0, 10);
          
          const requestsWithDistance = await Promise.all(
            requestsToCalculate.map(async (request: any) => {
              try {
                const requestAddress = `${request.address}, ${request.city} ${request.province} ${request.postalCode}`;
                
                // Usa il servizio Google Maps esistente
                const distanceData = await googleMapsService.calculateDistance(
                  professionalAddress,
                  requestAddress
                );
                
                if (distanceData) {
                  return {
                    ...request,
                    distance: distanceData.distanceValue ? distanceData.distanceValue / 1000 : null,
                    distanceText: distanceData.distanceText,
                    duration: distanceData.durationValue ? distanceData.durationValue / 60 : null,
                    durationText: distanceData.durationText
                  };
                }
              } catch (error) {
                console.error(`Error calculating distance for request ${request.id}:`, error);
              }
              return request;
            })
          );
          
          // Unisci le richieste con distanza e quelle senza
          const remainingRequests = formattedRequests.slice(10);
          formattedRequests = [...requestsWithDistance, ...remainingRequests];
        }
      }
    }
    
    res.json(ResponseFormatter.success({
      requests: formattedRequests,
      total: formattedRequests.length
    }));
    
  } catch (error) {
    logger.error('Error fetching requests:', error);
    res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero delle richieste',
      500
    ));
  }
});

// Il resto del file rimane uguale...
export default router;