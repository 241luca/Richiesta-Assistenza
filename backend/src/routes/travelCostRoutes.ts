import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { ResponseFormatter } from '../utils/responseFormatter';

const router = Router();

// GET /api/travel/professional/:professionalId/cost-settings
router.get('/professional/:professionalId/cost-settings', authenticate, async (req, res) => {
  try {
    const { professionalId } = req.params;
    
    // Ritorna sempre dati di default per ora
    const defaultSettings = {
      professionalId: professionalId,
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
  } catch (error) {
    console.error('Error in cost-settings:', error);
    return ResponseFormatter.error(res, 'Errore nel recupero delle impostazioni');
  }
});

// Altri endpoint che potrebbero esistere
router.get('/cost-settings', authenticate, async (req, res) => {
  return ResponseFormatter.success(res, {}, 'OK');
});

export default router;
