/**
 * Maps Routes
 * Endpoints per Google Maps e calcolo distanze
 * IMPORTANTE: Seguire ISTRUZIONI-PROGETTO.md - SEMPRE usare ResponseFormatter
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth';
import GoogleMapsService from '../services/googleMaps.service';
import { ApiKeyService } from '../services/apiKey.service';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { ResponseFormatter } from '../utils/responseFormatter';

const router = Router();

// Rate limiting per autocomplete (pubblico ma protetto)
const autocompleteLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  limit: 50, // Max 50 richieste per IP ogni 15 min
  standardHeaders: 'draft-8', // Standard headers IETF
  legacyHeaders: false, // Disabilita X-RateLimit-* headers
  message: ResponseFormatter.error(
    'Troppe richieste di autocompletamento. Riprova tra 15 minuti',
    'RATE_LIMIT_EXCEEDED'
  ),
  // Trust proxy se configurato
  skip: (req, res) => {
    // Skip per IP interni o di sviluppo
    const allowedIPs = ['127.0.0.1', '::1', 'localhost'];
    return allowedIPs.includes(req.ip || '');
  }
});

/**
 * GET /api/maps/config
 * Ottiene la configurazione Google Maps (per frontend)
 * PUBLIC ENDPOINT - Non richiede autenticazione
 */
router.get('/config', async (req, res) => {
  try {
    // ✅ USA ApiKeyService per decriptare automaticamente la chiave
    const apiKeyService = new ApiKeyService();
    const apiKey = await apiKeyService.getApiKey('GOOGLE_MAPS', true); // unmask = true per ottenere chiave decriptata

    if (!apiKey) {
      return res.status(404).json(ResponseFormatter.error(
        'Google Maps API key non configurata nel database',
        'API_KEY_NOT_FOUND'
      ));
    }

    // La chiave è già decriptata grazie a unmask: true
    const decryptedKey = apiKey.key;

    // 🔍 DEBUG: Log della chiave decriptata
    logger.info(`📤 Invio Google Maps API key DECRIPTATA al frontend:`);
    logger.info(`   Lunghezza: ${decryptedKey?.length || 0} caratteri`);
    logger.info(`   Prefisso: ${decryptedKey?.substring(0, 10) || 'VUOTA'}...`);
    logger.info(`   Contiene ':' (criptata?): ${decryptedKey?.includes(':') ? 'SÌ ⚠️ PROBLEMA!' : 'NO ✅'}`);
    logger.info(`   Inizia con AIzaSy?: ${decryptedKey?.startsWith('AIzaSy') ? 'SÌ ✅' : 'NO ⚠️'}`);
    
    // ✅ SEMPRE ResponseFormatter.success
    return res.json(ResponseFormatter.success({
      apiKey: decryptedKey,
      isConfigured: true
    }, 'Configurazione Google Maps recuperata'));
  } catch (error: unknown) {
    logger.error('Error fetching Google Maps config:', error instanceof Error ? error.message : String(error));
    // ✅ SEMPRE ResponseFormatter.error
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero configurazione',
      'CONFIG_ERROR'
    ));
  }
});

/**
 * GET /api/maps/geocode
 * Geocodifica un indirizzo (pubblico per tool admin)
 * ✅ Usa GoogleMapsService con cache intelligente
 */
router.get('/geocode', async (req, res) => {
  try {
    const { address } = req.query;

    if (!address || typeof address !== 'string') {
      return res.status(400).json(ResponseFormatter.error(
        'Indirizzo richiesto',
        'ADDRESS_REQUIRED'
      ));
    }

    const coordinates = await GoogleMapsService.geocode(address);

    if (!coordinates) {
      return res.status(404).json(ResponseFormatter.error(
        'Indirizzo non trovato',
        'ADDRESS_NOT_FOUND'
      ));
    }

    return res.json(ResponseFormatter.success(
      coordinates,
      'Indirizzo geocodificato con successo'
    ));
  } catch (error: unknown) {
    logger.error('Geocoding error:', error instanceof Error ? error.message : String(error));
    return res.status(500).json(ResponseFormatter.error(
      'Errore durante la geocodifica',
      'GEOCODING_ERROR'
    ));
  }
});

/**
 * POST /api/maps/geocode
 * Geocodifica un indirizzo (UNICO ENDPOINT - eliminato GET duplicato)
 * ✅ Usa GoogleMapsService con cache intelligente
 */
router.post('/geocode', authenticate, async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json(ResponseFormatter.error(
        'Indirizzo richiesto',
        'ADDRESS_REQUIRED'
      ));
    }

    const coordinates = await GoogleMapsService.geocode(address);

    if (!coordinates) {
      return res.status(404).json(ResponseFormatter.error(
        'Indirizzo non trovato',
        'ADDRESS_NOT_FOUND'
      ));
    }

    return res.json(ResponseFormatter.success(
      coordinates,
      'Indirizzo geocodificato con successo'
    ));
  } catch (error: unknown) {
    logger.error('Geocoding error:', error instanceof Error ? error.message : String(error));
    return res.status(500).json(ResponseFormatter.error(
      'Errore durante la geocodifica',
      'GEOCODING_ERROR'
    ));
  }
});

/**
 * POST /api/maps/calculate-distance
 * Calcola distanza tra due punti
 */
router.post('/calculate-distance', authenticate, async (req, res) => {
  try {
    const { origin, destination, mode = 'driving' } = req.body;

    if (!origin || !destination) {
      return res.status(400).json(ResponseFormatter.error(
        'Origine e destinazione richieste',
        'PARAMS_REQUIRED'
      ));
    }

    const result = await GoogleMapsService.calculateDistance(
      origin,
      destination,
      {
        mode
      }
    );

    if (!result) {
      return res.status(404).json(ResponseFormatter.error(
        'Impossibile calcolare la distanza',
        'DISTANCE_CALC_FAILED'
      ));
    }

    return res.json(ResponseFormatter.success(
      result,
      'Distanza calcolata con successo'
    ));
  } catch (error: unknown) {
    logger.error('Distance calculation error:', error instanceof Error ? error.message : String(error));
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel calcolo della distanza',
      'DISTANCE_ERROR'
    ));
  }
});

/**
 * POST /api/maps/calculate-distances
 * Calcola distanze multiple in batch (ottimizzato)
 */
router.post('/calculate-distances', authenticate, async (req: any, res) => {
  try {
    const { origin, requestIds, mode = 'driving' } = req.body;

    if (!origin || !requestIds || !Array.isArray(requestIds)) {
      return res.status(400).json(ResponseFormatter.error(
        'Origine e array di richieste richiesti',
        'PARAMS_REQUIRED'
      ));
    }

    // Recupera le richieste con indirizzi
    const requests = await prisma.assistanceRequest.findMany({
      where: {
        id: { in: requestIds }
      },
      select: {
        id: true,
        address: true,
        city: true,
        province: true,
        postalCode: true,
        latitude: true,
        longitude: true
      }
    });

    if (requests.length === 0) {
      return res.json(ResponseFormatter.success({
        distances: []
      }, 'Nessuna richiesta trovata'));
    }

    // Prepara le destinazioni
    const destinations = requests.map(req => {
      // Usa coordinate se disponibili
      if (req.latitude && req.longitude) {
        return { lat: req.latitude, lng: req.longitude };
      }
      // Altrimenti costruisci l'indirizzo
      const addressParts = [];
      if (req.address) addressParts.push(req.address);
      if (req.city) addressParts.push(req.city);
      if (req.province) addressParts.push(req.province);
      if (req.postalCode) addressParts.push(req.postalCode);
      return addressParts.join(', ') + ', Italia';
    });

    // Calcola distanze in batch
    const results = await GoogleMapsService.calculateMultipleDistances(
      origin,
      destinations,
      {
        mode
      }
    );

    // Mappa i risultati con gli ID delle richieste
    const distances: Array<{
      requestId: string;
      distance: number | null;
      duration: number | null;
      durationInTraffic?: number;
      distanceText?: string;
      durationText?: string;
      error?: string;
    }> = requests.map((request, index) => {
      const distanceResult = results[index];
      
      if (!distanceResult) {
        return {
          requestId: request.id,
          distance: null as number | null,
          duration: null as number | null,
          error: 'Calcolo non riuscito'
        };
      }

      return {
        requestId: request.id,
        distance: distanceResult.distance as number,
        duration: distanceResult.duration as number,
        durationInTraffic: distanceResult.durationInTraffic,
        distanceText: distanceResult.distanceText,
        durationText: distanceResult.durationText
      };
    });

    // Filtra solo i risultati validi
    const validDistances = distances.filter(d => d.distance !== null);

    return res.json(ResponseFormatter.success({
      distances: validDistances,
      total: validDistances.length,
      failed: distances.length - validDistances.length
    }, 'Distanze calcolate con successo'));
  } catch (error: unknown) {
    logger.error('Batch distance calculation error:', error instanceof Error ? error.message : String(error));
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel calcolo delle distanze',
      'BATCH_DISTANCE_ERROR'
    ));
  }
});

/**
 * POST /api/maps/directions
 * Ottiene indicazioni stradali tra due punti
 */
router.post('/directions', authenticate, async (req, res) => {
  try {
    const { 
      origin, 
      destination, 
      mode = 'driving',
      waypoints,
      optimizeWaypoints = false,
      avoid,
      departureTime,
      alternatives = false
    } = req.body;

    if (!origin || !destination) {
      return res.status(400).json(ResponseFormatter.error(
        'Origine e destinazione richieste',
        'PARAMS_REQUIRED'
      ));
    }

    const result = await GoogleMapsService.calculateDistance(
      origin,
      destination,
      {
        mode
      }
    );

    if (!result) {
      return res.status(404).json(ResponseFormatter.error(
        'Impossibile calcolare il percorso',
        'DIRECTIONS_CALC_FAILED'
      ));
    }

    // Salva il percorso nello storico se c'è un requestId
    if (req.body.requestId && req.user) {
      try {
        const client: any = (prisma as any);
        if (client.routeHistory?.create) {
          await client.routeHistory.create({
          data: {
            requestId: req.body.requestId,
            professionalId: req.user.id,
            originAddress: typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`,
            originLat: typeof origin === 'string' ? 0 : origin.lat,
            originLng: typeof origin === 'string' ? 0 : origin.lng,
            destinationAddress: typeof destination === 'string' ? destination : `${destination.lat},${destination.lng}`,
            destinationLat: typeof destination === 'string' ? 0 : destination.lat,
            destinationLng: typeof destination === 'string' ? 0 : destination.lng,
            distance: result.distance,
            duration: result.duration,
            durationInTraffic: (result as any)?.durationInTraffic,
            polyline: (result as any)?.polyline,
            travelCost: req.body.travelCost
          }
          });
        }
      } catch (err) {
        logger.warn('Failed to save route history:', err);
      }
    }

    return res.json(ResponseFormatter.success(
      result,
      'Percorso calcolato con successo'
    ));
  } catch (error: unknown) {
    logger.error('Directions error:', error instanceof Error ? error.message : String(error));
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel calcolo del percorso',
      'DIRECTIONS_ERROR'
    ));
  }
});

/**
 * POST /api/maps/autocomplete
 * Suggerimenti per autocompletamento indirizzi
 * PUBBLICO con rate limiting (necessario per registrazione)
 */
router.post('/autocomplete', autocompleteLimit, async (req, res) => {
  try {
    const { 
      input, 
      location,
      radius,
      types,
      componentRestrictions
    } = req.body;

    if (!input) {
      return res.status(400).json(ResponseFormatter.error(
        'Input richiesto',
        'INPUT_REQUIRED'
      ));
    }

    const results = await GoogleMapsService.autocomplete(input, {
      location,
      radius,
      types,
      componentRestrictions
    });

    return res.json(ResponseFormatter.success(
      results,
      'Suggerimenti recuperati'
    ));
  } catch (error: unknown) {
    logger.error('Autocomplete error:', error instanceof Error ? error.message : String(error));
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero suggerimenti',
      'AUTOCOMPLETE_ERROR'
    ));
  }
});

/**
 * POST /api/maps/place-details
 * Dettagli di un luogo da place_id
 * AUTENTICATO per sicurezza (anche se non usato attualmente)
 */
router.post('/place-details', authenticate, async (req, res) => {
  try {
    const { placeId, fields } = req.body;

    if (!placeId) {
      return res.status(400).json(ResponseFormatter.error(
        'Place ID richiesto',
        'PLACE_ID_REQUIRED'
      ));
    }

    const details = await GoogleMapsService.getPlaceDetails(placeId, fields);

    if (!details) {
      return res.status(404).json(ResponseFormatter.error(
        'Dettagli luogo non trovati',
        'PLACE_NOT_FOUND'
      ));
    }

    return res.json(ResponseFormatter.success(
      details,
      'Dettagli luogo recuperati'
    ));
  } catch (error: unknown) {
    logger.error('Place details error:', error instanceof Error ? error.message : String(error));
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero dettagli',
      'PLACE_DETAILS_ERROR'
    ));
  }
});

/**
 * POST /api/maps/validate-address
 * Valida e normalizza un indirizzo
 */
router.post('/validate-address', authenticate, async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json(ResponseFormatter.error(
        'Indirizzo richiesto',
        'ADDRESS_REQUIRED'
      ));
    }

    const coordinates = await GoogleMapsService.geocode(address);

    const validation = {
      isValid: !!coordinates,
      formattedAddress: address,
      coordinates: coordinates || null
    };

    return res.json(ResponseFormatter.success(
      validation,
      validation.isValid ? 'Indirizzo valido' : 'Indirizzo non valido'
    ));
  } catch (error: unknown) {
    logger.error('Address validation error:', error instanceof Error ? error.message : String(error));
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella validazione indirizzo',
      'VALIDATION_ERROR'
    ));
  }
});

/**
 * GET /api/maps/usage-stats
 * Statistiche utilizzo Google Maps (solo admin)
 */
router.get('/usage-stats', authenticate, async (req: any, res) => {
  try {
    // Verifica che sia admin
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json(ResponseFormatter.error(
        'Accesso negato',
        'FORBIDDEN'
      ));
    }

    const stats = await GoogleMapsService.getUsageStats();

    return res.json(ResponseFormatter.success(
      stats,
      'Statistiche utilizzo recuperate'
    ));
  } catch (error: unknown) {
    logger.error('Usage stats error:', error instanceof Error ? error.message : String(error));
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero statistiche',
      'STATS_ERROR'
    ));
  }
});

/**
 * POST /api/maps/cleanup-cache
 * Pulisce la cache avanzata Redis+Database con statistiche dettagliate (solo admin)
 * ✅ AGGIORNATO v5.1 - Supporta Redis + Database + Memoria
 */
router.post('/cleanup-cache', authenticate, async (req: any, res) => {
  try {
    // Verifica che sia admin
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json(ResponseFormatter.error(
        'Accesso negato',
        'FORBIDDEN'
      ));
    }

    const cleanupResult = await GoogleMapsService.cleanupCache();

    if (cleanupResult.success) {
      return res.json(ResponseFormatter.success(
        {
          redisCleared: cleanupResult.redisCleared || 0,
          databaseCleared: cleanupResult.databaseCleared || 0,
          memoryCleared: cleanupResult.memoryCleared || 0,
          totalFreedMB: cleanupResult.totalFreedMB || 0,
          totalItems: (cleanupResult.redisCleared || 0) + (cleanupResult.databaseCleared || 0) + (cleanupResult.memoryCleared || 0)
        },
        `🧹 Cache Redis pulita! Redis: ${cleanupResult.redisCleared || 0}, DB: ${cleanupResult.databaseCleared || 0}, Spazio: ${cleanupResult.totalFreedMB || 0}MB`
      ));
    } else {
      return res.status(207).json(ResponseFormatter.error(
        `⚠️ Pulizia parziale completata: ${cleanupResult.errors.join(', ')}`,
        'PARTIAL_CLEANUP_ERROR',
        {
          redisCleared: cleanupResult.redisCleared || 0,
          databaseCleared: cleanupResult.databaseCleared || 0,
          memoryCleared: cleanupResult.memoryCleared || 0,
          totalFreedMB: cleanupResult.totalFreedMB || 0,
          errors: cleanupResult.errors
        }
      ));
    }
  } catch (error: unknown) {
    logger.error('Cache cleanup error:', error instanceof Error ? error.message : String(error));
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella pulizia cache',
      'CLEANUP_ERROR'
    ));
  }
});

export default router;
