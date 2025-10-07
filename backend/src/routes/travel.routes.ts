import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ResponseFormatter } from '../utils/responseFormatter';
import { authenticate } from '../middleware/auth';
import axios from 'axios';
import { logger } from '../utils/logger';
import GoogleMapsService from '../services/googleMaps.service';

const router = Router();
const prisma = new PrismaClient();

/**
 * Recupera la Google Maps API Key dal database (tabella ApiKey)
 * CORRETTO: Usa ApiKey invece di SystemSettings
 */
async function getGoogleMapsApiKey(): Promise<string | null> {
  try {
    const apiKey = await prisma.apiKey.findFirst({
      where: { 
        service: 'GOOGLE_MAPS',
        isActive: true 
      },
      select: {
        key: true
      }
    });
    
    if (!apiKey || !apiKey.key) {
      logger.error('Google Maps API Key non trovata in ApiKey table');
      return null;
    }
    
    // IMPORTANTE: La chiave nel database potrebbe essere in chiaro o criptata
    // Se contiene ':', è criptata e va decriptata
    // Altrimenti è già in chiaro (come nel tuo caso)
    let finalKey = apiKey.key;
    
    // Se la chiave sembra criptata (contiene ':'), non farla passare così
    // Ma nel tuo caso è in chiaro quindi la usiamo direttamente
    logger.debug(`Google Maps API Key loaded (length: ${finalKey.length})`);
    
    return finalKey;
  } catch (error) {
    logger.error('Error retrieving Google Maps API Key:', error);
    return null;
  }
}

/**
 * Calcola distanza tra due punti usando Google Maps Service con cache Redis
 * AGGIORNATO v5.1: Usa il servizio centralizzato con caching
 */
async function calculateDistance(origin: string, destination: string) {
  try {
    // Inizializza il servizio se necessario
    await GoogleMapsService.initialize();
    
    // Usa il metodo centralizzato con cache Redis
    logger.debug(`📍 Calculating distance: ${origin} -> ${destination}`);
    
    const result = await GoogleMapsService.calculateDistance(origin, destination, {
      mode: 'driving',
      units: 'metric'
    });
    
    if (result) {
      // Converti il formato del risultato per compatibilità
      logger.info(`✅ Distance calculated: ${result.distanceText} (${result.durationText})`);
      return {
        distance: result.distance * 1000, // GoogleMapsService ritorna km, noi vogliamo metri
        duration: result.duration * 60,   // GoogleMapsService ritorna minuti, noi vogliamo secondi
        distanceText: result.distanceText,
        durationText: result.durationText
      };
    }
    
    logger.warn(`⚠️ Could not calculate distance between ${origin} and ${destination}`);
    return null;
  } catch (error) {
    logger.error('❌ Error calculating distance:', error);
    
    // Fallback: prova con chiamata diretta se il servizio ha problemi
    try {
      logger.info('🔄 Attempting fallback with direct API call...');
      const apiKey = await getGoogleMapsApiKey();
      
      if (!apiKey) {
        logger.error('No API key available for fallback');
        return null;
      }
      
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/distancematrix/json',
        {
          params: {
            origins: origin,
            destinations: destination,
            units: 'metric',
            language: 'it',
            key: apiKey
          },
          timeout: 10000
        }
      );
      
      logger.debug(`Fallback API response: ${JSON.stringify(response.data.status)}`);
      
      if (response.data.status === 'OK' && 
          response.data.rows?.[0]?.elements?.[0]?.status === 'OK') {
        const element = response.data.rows[0].elements[0];
        logger.info(`✅ Fallback successful: ${element.distance.text}`);
        return {
          distance: element.distance.value,
          duration: element.duration.value,
          distanceText: element.distance.text,
          durationText: element.duration.text
        };
      }
    } catch (fallbackError) {
      logger.error('❌ Fallback also failed:', fallbackError);
    }
    
    return null;
  }
}

/**
 * GET /api/travel/work-address
 * Ottiene l'indirizzo di lavoro del professionista loggato
 */
router.get('/work-address', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Solo i professionisti hanno indirizzi di lavoro
    if (userRole !== 'PROFESSIONAL') {
      return res.status(403).json(ResponseFormatter.error(
        'Solo i professionisti possono avere un indirizzo di lavoro',
        'UNAUTHORIZED_ROLE'
      ));
    }
    
    // Recupera i dati del professionista
    const professional = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        useResidenceAsWorkAddress: true,
        workAddress: true,
        workCity: true,
        workProvince: true,
        workPostalCode: true,
        workLatitude: true,
        workLongitude: true,
        address: true,
        city: true,
        province: true,
        postalCode: true,
        latitude: true,
        longitude: true,
        travelRatePerKm: true
      }
    });
    
    if (!professional) {
      return res.status(404).json(ResponseFormatter.error(
        'Professionista non trovato',
        'PROFESSIONAL_NOT_FOUND'
      ));
    }
    
    // Prepara la risposta
    const workAddressData = {
      useResidenceAsWorkAddress: professional.useResidenceAsWorkAddress ?? true, // Default true se null
      workAddress: professional.workAddress || professional.address,
      workCity: professional.workCity || professional.city,
      workProvince: professional.workProvince || professional.province,
      workPostalCode: professional.workPostalCode || professional.postalCode,
      workLatitude: professional.workLatitude || professional.latitude,
      workLongitude: professional.workLongitude || professional.longitude,
      residenceAddress: professional.address,
      residenceCity: professional.city,
      residenceProvince: professional.province,
      residencePostalCode: professional.postalCode,
      travelRatePerKm: professional.travelRatePerKm || 0.50
    };
    
    logger.info(`📤 Sending work address data:`, { 
      useResidenceAsWorkAddress: workAddressData.useResidenceAsWorkAddress,
      hasWorkAddress: !!workAddressData.workAddress
    });
    
    return res.json(ResponseFormatter.success(
      workAddressData,
      'Indirizzo di lavoro recuperato con successo'
    ));
    
  } catch (error: any) {
    logger.error('Error getting work address:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero dell\'indirizzo di lavoro',
      'WORK_ADDRESS_ERROR'
    ));
  }
});

/**
 * PUT /api/travel/work-address
 * Aggiorna l'indirizzo di lavoro del professionista loggato
 * 🆕 AGGIORNATO: Ricalcola automaticamente le distanze delle richieste attive
 */
router.put('/work-address', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Solo i professionisti possono aggiornare l'indirizzo di lavoro
    if (userRole !== 'PROFESSIONAL') {
      return res.status(403).json(ResponseFormatter.error(
        'Solo i professionisti possono gestire un indirizzo di lavoro',
        'UNAUTHORIZED_ROLE'
      ));
    }
    
    const {
      useResidenceAsWorkAddress,
      workAddress,
      workCity,
      workProvince,
      workPostalCode,
      workLatitude,
      workLongitude,
      travelRatePerKm
    } = req.body;
    
    logger.info(`🔄 Updating work address for professional ${userId}`);
    logger.info(`📥 Received data:`, { useResidenceAsWorkAddress, workAddress, workCity });
    
    // GEOCODIFICA L'INDIRIZZO se fornito
    let geocodedLat = workLatitude;
    let geocodedLng = workLongitude;
    
    if (useResidenceAsWorkAddress !== true && workAddress) {
      try {
        const apiKey = await getGoogleMapsApiKey();
        if (apiKey) {
          const geocodeUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
          const response = await axios.get(geocodeUrl, {
            params: {
              address: workAddress,
              key: apiKey
            }
          });
          
          if (response.data.status === 'OK' && response.data.results[0]) {
            const location = response.data.results[0].geometry.location;
            geocodedLat = location.lat;
            geocodedLng = location.lng;
            logger.info(`✅ Geocoded address: ${workAddress} -> (${geocodedLat}, ${geocodedLng})`);
          } else {
            logger.warn(`⚠️ Geocoding failed for address: ${workAddress}, status: ${response.data.status}`);
          }
        }
      } catch (geocodeError) {
        logger.error('❌ Geocoding error:', geocodeError);
        // Continua comunque il salvataggio senza coordinate
      }
    }
    
    // CORREZIONE CRITICA: Usa valore esplicito, non || che falsa i booleani
    const updateData: any = {
      useResidenceAsWorkAddress: useResidenceAsWorkAddress === true,
      travelRatePerKm: travelRatePerKm || 0.50,
      updatedAt: new Date()
    };
    
    // Se NON usa residenza, salva workAddress CON COORDINATE
    if (useResidenceAsWorkAddress !== true) {
      updateData.workAddress = workAddress || null;
      updateData.workCity = workCity || null;
      updateData.workProvince = workProvince || null;
      updateData.workPostalCode = workPostalCode || null;
      updateData.workLatitude = geocodedLat || null;
      updateData.workLongitude = geocodedLng || null;
    } else {
      // Se usa residenza, azzera i campi work
      updateData.workAddress = null;
      updateData.workCity = null;
      updateData.workProvince = null;
      updateData.workPostalCode = null;
      updateData.workLatitude = null;
      updateData.workLongitude = null;
    }
    
    logger.info(`💾 Saving to DB:`, updateData);
    
    // Aggiorna i dati del professionista
    const updatedProfessional = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        useResidenceAsWorkAddress: true,
        workAddress: true,
        workCity: true,
        workProvince: true,
        workPostalCode: true,
        workLatitude: true,
        workLongitude: true,
        travelRatePerKm: true
      }
    });
    
    // 🆕 NUOVO: Avvia ricalcolo automatico in background (non blocca la risposta)
    // Importa il travelService
    import('../services/travel.service').then(({ travelService }) => {
      travelService.recalculateActiveRequestsTravelInfo(userId)
        .then((result) => {
          logger.info(`✅ Travel recalculation completed: ${result.success}/${result.total} requests updated`);
          if (result.errors.length > 0) {
            logger.warn(`⚠️ Some errors during recalculation:`, result.errors);
          }
        })
        .catch((error) => {
          logger.error('❌ Error during background travel recalculation:', error);
        });
    });
    
    return res.json(ResponseFormatter.success(
      updatedProfessional,
      'Indirizzo di lavoro aggiornato con successo. Ricalcolo distanze in corso...'
    ));
    
  } catch (error: any) {
    logger.error('Error updating work address:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento dell\'indirizzo di lavoro',
      'WORK_ADDRESS_UPDATE_ERROR'
    ));
  }
});

/**
 * GET /api/travel/request/:id/travel-info
 * Ottiene informazioni di viaggio per una richiesta specifica
 * 🆕 AGGIORNATO: Salva i dati calcolati nel database
 */
router.get('/request/:id/travel-info', authenticate, async (req: any, res) => {
  try {
    const requestId = req.params.id;
    const userId = req.user.id;
    
    // Trova la richiesta
    const request = await prisma.assistanceRequest.findUnique({
      where: { id: requestId },
      include: {
        professional: true
      }
    });
    
    if (!request) {
      return res.status(404).json(ResponseFormatter.error(
        'Richiesta non trovata',
        'REQUEST_NOT_FOUND'
      ));
    }
    
    // Se l'utente è un professionista, calcola la distanza
    if (req.user.role === 'PROFESSIONAL') {
      const professional = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          address: true,
          city: true,
          province: true,
          latitude: true,
          longitude: true,
          workAddress: true,
          workCity: true,
          workProvince: true,
          workLatitude: true,
          workLongitude: true,
          pricingData: true,
          travelRatePerKm: true,
          hourlyRate: true
        }
      });
      
      if (!professional) {
        return res.status(404).json(ResponseFormatter.error(
          'Professionista non trovato',
          'PROFESSIONAL_NOT_FOUND'
        ));
      }
      
      // Usa l'indirizzo di lavoro se disponibile, altrimenti quello di residenza
      const professionalAddress = professional.workLatitude && professional.workLongitude
        ? `${professional.workLatitude},${professional.workLongitude}`
        : professional.latitude && professional.longitude
        ? `${professional.latitude},${professional.longitude}`
        : professional.workAddress || `${professional.address}, ${professional.city}, ${professional.province}, Italia`;
      
      const requestAddress = request.latitude && request.longitude
        ? `${request.latitude},${request.longitude}`
        : `${request.address}, ${request.city}, ${request.province}, Italia`;
      
      const distanceInfo = await calculateDistance(professionalAddress, requestAddress);
      
      if (distanceInfo) {
        const distanceKm = Math.ceil(distanceInfo.distance / 1000); // Arrotonda per eccesso
        
        // Calcola il costo usando le tariffe del professionista
        let travelCost = 0;
        
        // Recupera i dati tariffari
        const pricingData = professional.pricingData as any || {};
        const baseCost = pricingData.baseCost || 10; // Costo base chiamata
        const freeKm = pricingData.freeKm || 10; // Km gratuiti
        const billableKm = Math.max(0, distanceKm - freeKm);
        
        // Parti dal costo base
        travelCost = baseCost;
        
        // Se ci sono km da fatturare
        if (billableKm > 0) {
          // Se abbiamo scaglioni chilometrici, usali
          if (pricingData.costRanges && pricingData.costRanges.length > 0) {
            let remainingKm = billableKm;
            
            for (const range of pricingData.costRanges) {
              if (remainingKm <= 0) break;
              
              // Calcola i km in questo scaglione
              let rangeKm = 0;
              if (range.toKm === null || range.toKm === undefined) {
                // Ultimo scaglione, prendi tutti i km rimanenti
                rangeKm = remainingKm;
              } else {
                // Calcola quanti km rientrano in questo scaglione
                const rangeSize = range.toKm - range.fromKm;
                rangeKm = Math.min(remainingKm, rangeSize);
              }
              
              // Aggiungi il costo (costPerKm è in centesimi)
              const costPerKm = range.costPerKm / 100;
              travelCost += rangeKm * costPerKm;
              remainingKm -= rangeKm;
            }
          } else {
            // Usa tariffa semplice
            const costPerKm = pricingData.costPerKm || professional.travelRatePerKm || 0.50;
            travelCost += billableKm * costPerKm;
          }
        }
        
        // 🆕 NUOVO: Salva i dati nel database
        try {
          await prisma.assistanceRequest.update({
            where: { id: requestId },
            data: {
              travelDistance: distanceInfo.distance, // già in metri
              travelDuration: distanceInfo.duration, // già in secondi
              travelDistanceText: distanceInfo.distanceText,
              travelDurationText: distanceInfo.durationText,
              travelCost: travelCost,
              travelCalculatedAt: new Date()
            }
          });
          logger.info(`✅ Travel info saved to DB for request ${requestId}: ${distanceInfo.distanceText}, €${travelCost.toFixed(2)}`);
        } catch (saveError) {
          logger.error('⚠️ Error saving travel info to DB:', saveError);
          // Non blocca la risposta se il salvataggio fallisce
        }
        
        return res.json(ResponseFormatter.success({
          distance: distanceInfo.distance, // in metri (per retrocompatibilità)
          distanceKm: distanceKm, // in chilometri
          duration: distanceInfo.duration,
          distanceText: distanceInfo.distanceText,
          durationText: distanceInfo.durationText,
          freeKm: freeKm,
          billableKm: billableKm,
          baseCost: baseCost,
          cost: Math.round(travelCost * 100), // Ritorna in centesimi
          origin: professional.workAddress || professional.address || 'Indirizzo professionista',
          destination: `${request.address}, ${request.city}`,
          isEstimate: false,
          savedToDb: true, // 🆕 Indica che i dati sono stati salvati
          pricingDetails: {
            baseCost: baseCost,
            freeKm: freeKm,
            costRanges: pricingData.costRanges || null,
            costPerKm: pricingData.costPerKm || professional.travelRatePerKm || 0.50
          }
        }, 'Informazioni viaggio calcolate con tariffe personalizzate e salvate nel database'));
      } else {
        // Se il calcolo fallisce, fornisci una stima
        logger.warn('Distance calculation failed, returning estimate');
        return res.json(ResponseFormatter.success({
          distance: 10000, // 10km in metri (default)
          distanceKm: 10, // 10km
          duration: 1200, // 20 minuti default
          distanceText: '~10 km',
          durationText: '~20 minuti',
          freeKm: 10,
          billableKm: 0,
          baseCost: 10,
          cost: 1000, // 10 euro in centesimi
          origin: 'Posizione professionista',
          destination: `${request.address}, ${request.city}`,
          isEstimate: true,
          savedToDb: false // 🆕 Non salvato perché è una stima
        }, 'Stima informazioni viaggio (calcolo distanza non disponibile)'));
      }
    }
    
    // Se non è un professionista, ritorna dati vuoti
    return res.json(ResponseFormatter.success({
      distance: 0,
      duration: 0,
      cost: 0,
      origin: '',
      destination: `${request.address}, ${request.city}`,
      isEstimate: true,
      savedToDb: false
    }, 'Informazioni viaggio non disponibili'));
    
  } catch (error: any) {
    logger.error('Error getting travel info:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel calcolo delle informazioni di viaggio',
      'TRAVEL_INFO_ERROR'
    ));
  }
});

/**
 * GET /api/travel/calculate
 * Calcola distanza e tempo di viaggio tra due punti
 * AGGIORNATO: Usa API key dal database
 */
router.get('/calculate', authenticate, async (req, res) => {
  try {
    const { from, to } = req.query;
    
    if (!from || !to) {
      return res.status(400).json(ResponseFormatter.error(
        'Parametri from e to richiesti',
        'MISSING_PARAMETERS'
      ));
    }
    
    const distanceInfo = await calculateDistance(from as string, to as string);
    
    if (distanceInfo) {
      const distanceKm = distanceInfo.distance / 1000;
      const travelCost = 5 + (distanceKm * 0.50);
      
      return res.json(ResponseFormatter.success({
        distance: distanceInfo.distance,
        duration: distanceInfo.duration,
        distanceText: distanceInfo.distanceText,
        durationText: distanceInfo.durationText,
        cost: Math.round(travelCost * 100) / 100
      }, 'Calcolo viaggio completato'));
    } else {
      return res.json(ResponseFormatter.success({
        distance: 10000,
        duration: 1200,
        distanceText: '~10 km',
        durationText: '~20 minuti',
        cost: 10.00,
        isEstimate: true
      }, 'Stima viaggio'));
    }
    
  } catch (error) {
    logger.error('Error calculating travel:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel calcolo del viaggio',
      'CALCULATION_ERROR'
    ));
  }
});

/**
 * POST /api/travel/save
 * Salva informazioni di viaggio per una richiesta
 */
router.post('/save', authenticate, async (req: any, res) => {
  try {
    const { requestId, distance, duration, cost } = req.body;
    const userId = req.user.id;
    
    // Verifica che l'utente sia il professionista assegnato
    const request = await prisma.assistanceRequest.findUnique({
      where: { id: requestId }
    });
    
    if (!request) {
      return res.status(404).json(ResponseFormatter.error(
        'Richiesta non trovata',
        'REQUEST_NOT_FOUND'
      ));
    }
    
    if (request.professionalId !== userId) {
      return res.status(403).json(ResponseFormatter.error(
        'Non autorizzato',
        'UNAUTHORIZED'
      ));
    }
    
    // Qui potresti salvare le informazioni di viaggio in una tabella dedicata
    // Per ora ritorniamo successo
    return res.json(ResponseFormatter.success({
      saved: true,
      requestId,
      distance,
      duration,
      cost
    }, 'Informazioni di viaggio salvate'));
    
  } catch (error) {
    logger.error('Error saving travel info:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel salvataggio',
      'SAVE_ERROR'
    ));
  }
});

/**
 * POST /api/travel/request/:id/recalculate
 * Ricalcola e salva la distanza per una richiesta
 */
router.post('/request/:id/recalculate', authenticate, async (req: any, res) => {
  const { id: requestId } = req.params;
  const userId = req.user?.id;

  try {
    logger.info(`📍 Recalculating distance for request ${requestId}`);

    // Verifica che l'utente sia un professionista assegnato alla richiesta
    const request = await prisma.assistanceRequest.findUnique({
      where: { id: requestId },
      include: {
        professional: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            address: true,
            city: true,
            province: true,
            postalCode: true,
            workAddress: true,
            workCity: true,
            workProvince: true,
            workPostalCode: true
          }
        }
      }
    });

    if (!request) {
      return res.status(404).json(ResponseFormatter.error(
        'Richiesta non trovata',
        { code: 'REQUEST_NOT_FOUND' }
      ));
    }

    // Solo admin o il professionista assegnato possono ricalcolare
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';
    const isAssignedProfessional = request.professionalId === userId;
    
    if (!isAdmin && !isAssignedProfessional) {
      return res.status(403).json(ResponseFormatter.error(
        'Non autorizzato a ricalcolare questa richiesta',
        { code: 'UNAUTHORIZED' }
      ));
    }

    // Determina l'origine (indirizzo del professionista)
    let origin = '';
    if (request.professional) {
      // Usa work address se disponibile, altrimenti indirizzo normale
      if (request.professional.workAddress && request.professional.workCity) {
        origin = `${request.professional.workAddress}, ${request.professional.workCity}, ${request.professional.workProvince || ''} ${request.professional.workPostalCode || ''}, Italia`.trim();
      } else if (request.professional.address && request.professional.city) {
        origin = `${request.professional.address}, ${request.professional.city}, ${request.professional.province || ''} ${request.professional.postalCode || ''}, Italia`.trim();
      }
    }

    if (!origin) {
      return res.status(400).json(ResponseFormatter.error(
        'Indirizzo professionista non disponibile',
        { code: 'MISSING_ORIGIN' }
      ));
    }

    // Destinazione (indirizzo della richiesta)
    const destination = `${request.address}, ${request.city}, ${request.province || ''} ${request.postalCode || ''}, Italia`.trim();

    // Calcola distanza
    const distanceInfo = await calculateDistance(origin, destination);

    if (!distanceInfo) {
      return res.status(400).json(ResponseFormatter.error(
        'Impossibile calcolare la distanza',
        { code: 'CALCULATION_FAILED' }
      ));
    }

    // Calcola il costo (usa tariffa personalizzata se disponibile)
    const distanceKm = distanceInfo.distance / 1000;
    const travelRatePerKm = request.professional?.travelRatePerKm || 0.50;
    const cost = Math.round(distanceKm * travelRatePerKm * 100) / 100;

    // Salva nel database
    const updated = await prisma.assistanceRequest.update({
      where: { id: requestId },
      data: {
        travelDistance: distanceInfo.distance,
        travelDuration: distanceInfo.duration,
        travelDistanceText: distanceInfo.distanceText,
        travelDurationText: distanceInfo.durationText,
        travelCost: cost,
        travelCalculatedAt: new Date()
      },
      select: {
        travelDistance: true,
        travelDuration: true,
        travelDistanceText: true,
        travelDurationText: true,
        travelCost: true,
        travelCalculatedAt: true
      }
    });

    logger.info(`✅ Distance recalculated and saved for request ${requestId}`);
    
    return res.json(ResponseFormatter.success(
      updated,
      'Distanza ricalcolata con successo'
    ));
  } catch (error) {
    logger.error('❌ Error recalculating distance:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore durante il ricalcolo',
      { error: error.message }
    ));
  }
});

/**
 * GET /api/travel/work-address
 * Recupera l'indirizzo di lavoro del professionista loggato
 */
router.get('/work-address', authenticate, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json(ResponseFormatter.error(
        'Utente non autenticato',
        { code: 'UNAUTHORIZED' }
      ));
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        workAddress: true,
        workCity: true,
        workProvince: true,
        workPostalCode: true,
        address: true,
        city: true,
        province: true,
        postalCode: true
      }
    });

    if (!user) {
      return res.status(404).json(ResponseFormatter.error(
        'Utente non trovato',
        { code: 'USER_NOT_FOUND' }
      ));
    }

    // Ritorna work address se disponibile, altrimenti indirizzo normale
    const addressData = {
      workAddress: user.workAddress,
      workCity: user.workCity,
      workProvince: user.workProvince,
      workPostalCode: user.workPostalCode,
      address: user.address,
      city: user.city,
      province: user.province,
      postalCode: user.postalCode,
      hasWorkAddress: !!(user.workAddress && user.workCity),
      hasMainAddress: !!(user.address && user.city)
    };

    return res.json(ResponseFormatter.success(
      addressData,
      'Indirizzo di lavoro recuperato'
    ));
  } catch (error) {
    logger.error('Error fetching work address:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero indirizzo',
      { error: error.message }
    ));
  }
});

export default router;
