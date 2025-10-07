/**
 * Location Routes - Tracking Live Professionisti
 * Endpoints per gestire il tracking in tempo reale delle posizioni
 * 
 * Endpoints disponibili:
 * - POST /update - Aggiorna posizione professionista
 * - GET /professional/:id - Ottiene posizione corrente
 * - GET /request/:id/tracking - Tracking per richiesta specifica  
 * - GET /active - Lista professionisti con tracking attivo
 * - DELETE /clear - Rimuove tracking (va offline)
 * - GET /stats - Statistiche sistema (admin)
 * 
 * @module routes/location
 * @version 1.0.0
 * @author Sistema Richiesta Assistenza
 */

import { Router } from 'express';
import { z } from 'zod';
import { locationService } from '../services/location.service';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { rateLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validation';
import { ResponseFormatter } from '../utils/responseFormatter';
import { auditLogger } from '../middleware/auditLogger';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import { notificationService } from '../services/notification.service';

const router = Router();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const updateLocationSchema = z.object({
  body: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracy: z.number().min(0).max(1000).optional(),
    heading: z.number().min(0).max(360).optional(),
    speed: z.number().min(0).optional()
  })
});

const getTrackingSchema = z.object({
  params: z.object({
    requestId: z.string().uuid()
  })
});

const getProfessionalLocationSchema = z.object({
  params: z.object({
    professionalId: z.string().uuid()
  })
});

// ============================================
// ENDPOINTS
// ============================================

/**
 * POST /api/location/update
 * Aggiorna la posizione del professionista corrente
 * 
 * Solo per professionisti autenticati
 * Rate limit: 60 aggiornamenti al minuto (1 al secondo)
 */
router.post(
  '/update',
  authenticate,
  requireRole(['PROFESSIONAL']),
  rateLimiter({ points: 60, duration: 60 }), // 60 richieste al minuto
  validateRequest(updateLocationSchema),
  auditLogger('LOCATION_UPDATE'),
  async (req, res, next) => {
    try {
      const professionalId = req.user!.id;
      const { latitude, longitude, accuracy, heading, speed } = req.body;

      logger.info(`[LocationRoutes] Updating location for professional: ${professionalId}`, {
        lat: latitude,
        lng: longitude,
        accuracy
      });

      // Aggiorna posizione
      const location = await locationService.updateProfessionalLocation(
        professionalId,
        {
          latitude,
          longitude,
          accuracy,
          heading,
          speed,
          timestamp: new Date()
        }
      );

      return res.json(ResponseFormatter.success(
        location,
        'Posizione aggiornata con successo'
      ));

    } catch (error) {
      logger.error('[LocationRoutes] Error updating location:', {
        error: error instanceof Error ? error.message : 'Unknown',
        professionalId: req.user?.id,
        stack: error instanceof Error ? error.stack : undefined
      });

      return res.status(500).json(ResponseFormatter.error(
        'Errore nell\'aggiornamento della posizione',
        'LOCATION_UPDATE_ERROR'
      ));
    }
  }
);

/**
 * GET /api/location/professional/:professionalId
 * Ottiene la posizione corrente di un professionista
 * 
 * Accessibile a:
 * - Il professionista stesso
 * - Clienti con richieste attive con quel professionista
 * - Admin
 */
router.get(
  '/professional/:professionalId',
  authenticate,
  rateLimiter({ points: 100, duration: 60 }),
  validateRequest(getProfessionalLocationSchema),
  async (req, res, next) => {
    try {
      const { professionalId } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Verifica autorizzazioni
      if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
        // Admin possono vedere tutto
      } else if (userRole === 'PROFESSIONAL' && userId === professionalId) {
        // Il professionista può vedere la sua posizione
      } else if (userRole === 'CLIENT') {
        // Il cliente può vedere solo se ha richieste attive con questo professionista
        const activeRequest = await prisma.assistanceRequest.findFirst({
          where: {
            clientId: userId,
            professionalId: professionalId,
            status: 'IN_PROGRESS'
          }
        });

        if (!activeRequest) {
          return res.status(403).json(ResponseFormatter.error(
            'Non autorizzato a visualizzare questa posizione',
            'UNAUTHORIZED_ACCESS'
          ));
        }
      } else {
        return res.status(403).json(ResponseFormatter.error(
          'Accesso negato',
          'FORBIDDEN'
        ));
      }

      // Ottieni posizione
      const location = locationService.getCurrentLocation(professionalId);

      if (!location) {
        return res.status(404).json(ResponseFormatter.error(
          'Posizione non disponibile o professionista offline',
          'LOCATION_NOT_FOUND'
        ));
      }

      return res.json(ResponseFormatter.success(
        location,
        'Posizione recuperata con successo'
      ));

    } catch (error) {
      logger.error('[LocationRoutes] Error getting professional location:', {
        error: error instanceof Error ? error.message : 'Unknown',
        professionalId: req.params.professionalId,
        userId: req.user?.id,
        stack: error instanceof Error ? error.stack : undefined
      });

      return res.status(500).json(ResponseFormatter.error(
        'Errore nel recupero della posizione',
        'LOCATION_FETCH_ERROR'
      ));
    }
  }
);

/**
 * GET /api/location/request/:requestId/tracking
 * Ottiene dati completi di tracking per una richiesta specifica
 * 
 * Include:
 * - Posizione professionista
 * - Posizione destinazione
 * - ETA calcolato
 * - Storia tracking
 */
router.get(
  '/request/:requestId/tracking',
  authenticate,
  rateLimiter({ points: 30, duration: 60 }),
  validateRequest(getTrackingSchema),
  async (req, res, next) => {
    try {
      const { requestId } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Verifica che la richiesta esista e l'utente sia autorizzato
      const request = await prisma.assistanceRequest.findUnique({
        where: { id: requestId },
        include: {
          client: {
            select: { id: true, firstName: true, lastName: true }
          },
          professional: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      });

      if (!request) {
        return res.status(404).json(ResponseFormatter.error(
          'Richiesta non trovata',
          'REQUEST_NOT_FOUND'
        ));
      }

      // Verifica autorizzazioni
      const isAuthorized = 
        userRole === 'ADMIN' || 
        userRole === 'SUPER_ADMIN' ||
        userId === request.clientId ||
        userId === request.professionalId;

      if (!isAuthorized) {
        return res.status(403).json(ResponseFormatter.error(
          'Non autorizzato a visualizzare questo tracking',
          'UNAUTHORIZED_ACCESS'
        ));
      }

      // Ottieni posizione corrente del professionista
      const professionalLocation = request.professionalId 
        ? locationService.getCurrentLocation(request.professionalId)
        : null;

      // Calcola ETA se abbiamo tutte le coordinate
      let eta = null;
      if (professionalLocation && request.latitude && request.longitude) {
        eta = await locationService.calculateETA(
          {
            latitude: professionalLocation.latitude,
            longitude: professionalLocation.longitude
          },
          {
            latitude: request.latitude,
            longitude: request.longitude
          }
        );
      }

      const trackingData = {
        requestId: request.id,
        request: {
          title: request.title,
          status: request.status,
          address: request.address,
          city: request.city,
          latitude: request.latitude,
          longitude: request.longitude,
          scheduledDate: request.scheduledDate
        },
        client: request.client,
        professional: request.professional,
        professionalLocation,
        eta,
        isTrackingActive: !!professionalLocation,
        lastUpdate: professionalLocation?.timestamp || null
      };

      return res.json(ResponseFormatter.success(
        trackingData,
        'Dati tracking recuperati con successo'
      ));

    } catch (error) {
      logger.error('[LocationRoutes] Error getting request tracking:', {
        error: error instanceof Error ? error.message : 'Unknown',
        requestId: req.params.requestId,
        userId: req.user?.id,
        stack: error instanceof Error ? error.stack : undefined
      });

      return res.status(500).json(ResponseFormatter.error(
        'Errore nel recupero dei dati di tracking',
        'TRACKING_FETCH_ERROR'
      ));
    }
  }
);

/**
 * GET /api/location/active
 * Lista di tutti i professionisti con tracking attivo
 * 
 * Solo per admin - per monitoraggio generale
 */
router.get(
  '/active',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  rateLimiter({ points: 20, duration: 60 }),
  async (req, res, next) => {
    try {
      logger.info('[LocationRoutes] Getting active professional locations');

      const activeLocations = locationService.getAllActiveLocations();
      
      // Arricchisci con dati dei professionisti
      const professionalsData = await Promise.all(
        Array.from(activeLocations.keys()).map(async (professionalId) => {
          const location = activeLocations.get(professionalId);
          
          const professional = await prisma.user.findUnique({
            where: { id: professionalId },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profession: true,
              status: true
            }
          });

          return {
            professional,
            location,
            isActive: !!location
          };
        })
      );

      return res.json(ResponseFormatter.success(
        {
          count: professionalsData.length,
          professionals: professionalsData.filter(p => p.professional)
        },
        'Lista professionisti attivi recuperata'
      ));

    } catch (error) {
      logger.error('[LocationRoutes] Error getting active locations:', {
        error: error instanceof Error ? error.message : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined
      });

      return res.status(500).json(ResponseFormatter.error(
        'Errore nel recupero delle posizioni attive',
        'ACTIVE_LOCATIONS_ERROR'
      ));
    }
  }
);

/**
 * DELETE /api/location/clear
 * Il professionista rimuove il suo tracking (va offline)
 * 
 * Utile quando:
 * - Termina il turno di lavoro
 * - Non vuole più essere tracciato
 * - Chiude l'app mobile
 */
router.delete(
  '/clear',
  authenticate,
  requireRole(['PROFESSIONAL']),
  rateLimiter({ points: 10, duration: 60 }),
  auditLogger('LOCATION_CLEAR'),
  async (req, res, next) => {
    try {
      const professionalId = req.user!.id;

      logger.info(`[LocationRoutes] Clearing location for professional: ${professionalId}`);

      // Rimuovi tracking
      locationService.clearProfessionalLocation(professionalId);

      // Notifica clienti con richieste attive
      const activeRequests = await prisma.assistanceRequest.findMany({
        where: {
          professionalId,
          status: 'IN_PROGRESS'
        },
        select: {
          id: true,
          clientId: true
        }
      });

      // Invia notifica ai clienti interessati
      for (const request of activeRequests) {
        try {
          // Via WebSocket
          notificationService.emitToUser(request.clientId, 'professional:offline', {
            requestId: request.id,
            professionalId,
            message: 'Il professionista ha disattivato il tracking'
          });
        } catch (notifyError) {
          logger.warn('[LocationRoutes] Failed to notify client about professional offline', {
            clientId: request.clientId,
            error: notifyError
          });
        }
      }

      return res.json(ResponseFormatter.success(
        { 
          cleared: true,
          timestamp: new Date(),
          notifiedClients: activeRequests.length
        },
        'Tracking disattivato con successo'
      ));

    } catch (error) {
      logger.error('[LocationRoutes] Error clearing location:', {
        error: error instanceof Error ? error.message : 'Unknown',
        professionalId: req.user?.id,
        stack: error instanceof Error ? error.stack : undefined
      });

      return res.status(500).json(ResponseFormatter.error(
        'Errore nella disattivazione del tracking',
        'LOCATION_CLEAR_ERROR'
      ));
    }
  }
);

/**
 * GET /api/location/stats
 * Statistiche del sistema di tracking
 * 
 * Solo admin - per monitoraggio prestazioni
 */
router.get(
  '/stats',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  rateLimiter({ points: 10, duration: 60 }),
  async (req, res, next) => {
    try {
      logger.debug('[LocationRoutes] Getting location service stats');

      const stats = locationService.getStats();

      // Aggiungi statistiche dal database
      const dbStats = await prisma.assistanceRequest.groupBy({
        by: ['status'],
        where: {
          status: 'IN_PROGRESS',
          professionalId: { not: null }
        },
        _count: {
          id: true
        }
      });

      const activeRequestsCount = dbStats.reduce((sum, group) => sum + group._count.id, 0);

      const completeStats = {
        ...stats,
        activeRequests: activeRequestsCount,
        timestamp: new Date(),
        systemHealth: {
          cacheEfficiency: stats.etaCacheSize > 0 ? 
            (stats.activeLocations / stats.etaCacheSize * 100).toFixed(1) + '%' : 'N/A',
          memoryUsage: `${stats.cacheSize + stats.etaCacheSize} objects`,
          isHealthy: stats.activeLocations >= 0 && stats.cacheSize < 1000
        }
      };

      return res.json(ResponseFormatter.success(
        completeStats,
        'Statistiche sistema tracking recuperate'
      ));

    } catch (error) {
      logger.error('[LocationRoutes] Error getting location stats:', {
        error: error instanceof Error ? error.message : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined
      });

      return res.status(500).json(ResponseFormatter.error(
        'Errore nel recupero delle statistiche',
        'STATS_ERROR'
      ));
    }
  }
);

/**
 * POST /api/location/test-eta
 * Endpoint di test per calcolare ETA tra due punti
 * 
 * Utile per debugging e test
 * Solo admin in ambiente di sviluppo
 */
if (process.env.NODE_ENV === 'development') {
  router.post(
    '/test-eta',
    authenticate,
    requireRole(['ADMIN', 'SUPER_ADMIN']),
    validateRequest(z.object({
      body: z.object({
        fromLat: z.number().min(-90).max(90),
        fromLng: z.number().min(-180).max(180),
        toLat: z.number().min(-90).max(90),
        toLng: z.number().min(-180).max(180)
      })
    })),
    async (req, res, next) => {
      try {
        const { fromLat, fromLng, toLat, toLng } = req.body;

        logger.info('[LocationRoutes] Testing ETA calculation', {
          from: { lat: fromLat, lng: fromLng },
          to: { lat: toLat, lng: toLng }
        });

        const eta = await locationService.calculateETA(
          { latitude: fromLat, longitude: fromLng },
          { latitude: toLat, longitude: toLng }
        );

        return res.json(ResponseFormatter.success(
          eta,
          eta ? 'ETA calcolato con successo' : 'Impossibile calcolare ETA'
        ));

      } catch (error) {
        logger.error('[LocationRoutes] Error testing ETA:', {
          error: error instanceof Error ? error.message : 'Unknown',
          stack: error instanceof Error ? error.stack : undefined
        });

        return res.status(500).json(ResponseFormatter.error(
          'Errore nel test ETA',
          'ETA_TEST_ERROR'
        ));
      }
    }
  );
}

export default router;
