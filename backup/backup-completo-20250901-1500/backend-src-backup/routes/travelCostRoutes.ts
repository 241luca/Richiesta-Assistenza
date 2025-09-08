import { Router } from 'express';
import { authenticateUser } from '../middlewares/auth';
import { travelCostService } from '../services/travelCostService';
import { ResponseFormatter } from '../utils/responseFormatter';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/travel/cost-settings
 * Recupera le impostazioni dei costi di viaggio per il professionista corrente
 */
router.get('/cost-settings', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return ResponseFormatter.unauthorized(res, 'Utente non autenticato');
    }

    // Verifica che l'utente sia un professionista
    if (req.user?.role !== 'PROFESSIONAL') {
      return ResponseFormatter.forbidden(res, 'Solo i professionisti possono accedere alle impostazioni dei costi');
    }

    const settings = await travelCostService.getCostSettings(userId);
    
    if (!settings) {
      // Ritorna impostazioni di default se non esistono
      const defaultSettings = {
        professionalId: userId,
        baseCost: 1000, // €10.00
        freeDistanceKm: 0,
        isActive: false,
        costRanges: [
          { fromKm: 0, toKm: 10, costPerKm: 100 },
          { fromKm: 10, toKm: 50, costPerKm: 80 },
          { fromKm: 50, toKm: null, costPerKm: 60 }
        ],
        supplements: [
          { supplementType: 'WEEKEND', percentage: 20, fixedAmount: 0, isActive: false },
          { supplementType: 'NIGHT', percentage: 30, fixedAmount: 0, isActive: false },
          { supplementType: 'HOLIDAY', percentage: 50, fixedAmount: 0, isActive: false },
          { supplementType: 'URGENT', percentage: 0, fixedAmount: 2000, isActive: false }
        ]
      };
      
      return ResponseFormatter.success(res, defaultSettings, 'Impostazioni di default');
    }

    return ResponseFormatter.success(res, settings, 'Impostazioni recuperate con successo');
  } catch (error) {
    logger.error('Error fetching cost settings:', error);
    return ResponseFormatter.error(res, 'Errore nel recupero delle impostazioni');
  }
});

/**
 * POST /api/travel/cost-settings
 * Salva o aggiorna le impostazioni dei costi di viaggio
 */
router.post('/cost-settings', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return ResponseFormatter.unauthorized(res, 'Utente non autenticato');
    }

    // Verifica che l'utente sia un professionista
    if (req.user?.role !== 'PROFESSIONAL') {
      return ResponseFormatter.forbidden(res, 'Solo i professionisti possono modificare le impostazioni dei costi');
    }

    const settingsData = {
      ...req.body,
      professionalId: userId
    };

    // Validazione base
    if (settingsData.baseCost < 0) {
      return ResponseFormatter.badRequest(res, 'Il costo base non può essere negativo');
    }

    if (settingsData.freeDistanceKm < 0) {
      return ResponseFormatter.badRequest(res, 'La distanza gratuita non può essere negativa');
    }

    // Validazione scaglioni
    if (settingsData.costRanges && settingsData.costRanges.length > 0) {
      for (let i = 0; i < settingsData.costRanges.length - 1; i++) {
        const current = settingsData.costRanges[i];
        const next = settingsData.costRanges[i + 1];
        
        if (current.toKm === null || current.toKm === undefined) {
          return ResponseFormatter.badRequest(res, `Lo scaglione ${i + 1} deve avere un limite superiore`);
        }
        
        if (next.fromKm !== current.toKm) {
          return ResponseFormatter.badRequest(res, `Gap o sovrapposizione tra scaglioni ${i + 1} e ${i + 2}`);
        }
      }
    }

    const savedSettings = await travelCostService.saveCostSettings(settingsData);
    
    return ResponseFormatter.success(res, savedSettings, 'Impostazioni salvate con successo');
  } catch (error) {
    logger.error('Error saving cost settings:', error);
    return ResponseFormatter.error(res, 'Errore nel salvataggio delle impostazioni');
  }
});

/**
 * GET /api/travel/professional/:id/cost-settings
 * Recupera le impostazioni dei costi di viaggio per un professionista specifico (pubblico)
 */
router.get('/professional/:id/cost-settings', async (req, res) => {
  try {
    const professionalId = req.params.id;
    
    const settings = await travelCostService.getCostSettings(professionalId);
    
    if (!settings || !settings.isActive) {
      return ResponseFormatter.notFound(res, 'Impostazioni non disponibili per questo professionista');
    }

    // Rimuovi informazioni sensibili per la visualizzazione pubblica
    const publicSettings = {
      baseCost: settings.baseCost,
      freeDistanceKm: settings.freeDistanceKm,
      costRanges: settings.costRanges,
      supplements: settings.supplements?.filter(s => s.isActive),
      isActive: settings.isActive
    };

    return ResponseFormatter.success(res, publicSettings, 'Impostazioni pubbliche recuperate');
  } catch (error) {
    logger.error('Error fetching public cost settings:', error);
    return ResponseFormatter.error(res, 'Errore nel recupero delle impostazioni pubbliche');
  }
});

/**
 * POST /api/travel/calculate-cost
 * Calcola il costo del trasferimento per un professionista
 */
router.post('/calculate-cost', async (req, res) => {
  try {
    const { professionalId, distanceKm, options } = req.body;
    
    if (!professionalId || distanceKm === undefined) {
      return ResponseFormatter.badRequest(res, 'Parametri mancanti');
    }

    if (distanceKm < 0) {
      return ResponseFormatter.badRequest(res, 'La distanza non può essere negativa');
    }

    const cost = await travelCostService.calculateTravelCost(
      professionalId,
      distanceKm,
      options
    );
    
    return ResponseFormatter.success(res, cost, 'Costo calcolato con successo');
  } catch (error) {
    logger.error('Error calculating travel cost:', error);
    return ResponseFormatter.error(res, 'Errore nel calcolo del costo');
  }
});

export default router;