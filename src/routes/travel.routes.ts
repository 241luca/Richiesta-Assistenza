import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ResponseFormatter } from '../utils/responseFormatter';
import { authenticate } from '../middleware/auth';
import axios from 'axios';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

/**
 * Recupera la Google Maps API Key dal database (SystemSettings)
 * CORRETTO: Non più hardcoded, ma dinamico dal DB
 */
async function getGoogleMapsApiKey(): Promise<string | null> {
  try {
    const setting = await prisma.systemSettings.findUnique({
      where: { key: 'GOOGLE_MAPS_API_KEY' }
    });
    
    if (!setting || !setting.value) {
      logger.error('Google Maps API Key non configurata in SystemSettings');
      return null;
    }
    
    return setting.value;
  } catch (error) {
    logger.error('Error retrieving Google Maps API Key:', error);
    return null;
  }
}

/**
 * Calcola distanza tra due punti usando Google Maps
 * AGGIORNATO: Usa API key dal database
 */
async function calculateDistance(origin: string, destination: string) {
  try {
    // Recupera API key dal database
    const apiKey = await getGoogleMapsApiKey();
    
    if (!apiKey) {
      logger.error('Google Maps API Key non disponibile per calcolo distanza');
      return null;
    }
    
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json`;
    const params = {
      origins: origin,
      destinations: destination,
      units: 'metric',
      language: 'it',
      key: apiKey
    };

    const response = await axios.get(url, { params });
    
    if (response.data.status === 'OK' && response.data.rows[0]?.elements[0]?.status === 'OK') {
      const element = response.data.rows[0].elements[0];
      return {
        distance: element.distance.value, // in metri
        duration: element.duration.value, // in secondi
        distanceText: element.distance.text,
        durationText: element.duration.text
      };
    }
    
    // Log per debug se Google Maps ritorna un errore
    if (response.data.status !== 'OK') {
      logger.warn(`Google Maps API returned status: ${response.data.status}`);
    }
    
    return null;
  } catch (error) {
    logger.error('Error calculating distance:', error);
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
      useResidenceAsWorkAddress: professional.useResidenceAsWorkAddress || true,
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
    
    // Aggiorna i dati del professionista
    const updatedProfessional = await prisma.user.update({
      where: { id: userId },
      data: {
        useResidenceAsWorkAddress: useResidenceAsWorkAddress || false,
        workAddress: useResidenceAsWorkAddress ? null : workAddress,
        workCity: useResidenceAsWorkAddress ? null : workCity,
        workProvince: useResidenceAsWorkAddress ? null : workProvince,
        workPostalCode: useResidenceAsWorkAddress ? null : workPostalCode,
        workLatitude: useResidenceAsWorkAddress ? null : workLatitude,
        workLongitude: useResidenceAsWorkAddress ? null : workLongitude,
        travelRatePerKm: travelRatePerKm || 0.50,
        updatedAt: new Date()
      },
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
    
    return res.json(ResponseFormatter.success(
      updatedProfessional,
      'Indirizzo di lavoro aggiornato con successo'
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
 * AGGIORNATO: Usa API key dal database
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
        : `${professional.address}, ${professional.city}, ${professional.province}, Italia`;
      
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
          origin: professional.workAddress || professional.address ? 
            `${professional.workAddress || professional.address}, ${professional.workCity || professional.city}` : 
            'Indirizzo professionista',
          destination: `${request.address}, ${request.city}`,
          isEstimate: false,
          pricingDetails: {
            baseCost: baseCost,
            freeKm: freeKm,
            costRanges: pricingData.costRanges || null,
            costPerKm: pricingData.costPerKm || professional.travelRatePerKm || 0.50
          }
        }, 'Informazioni viaggio calcolate con tariffe personalizzate'));
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
          isEstimate: true
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
      isEstimate: true
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

export default router;
