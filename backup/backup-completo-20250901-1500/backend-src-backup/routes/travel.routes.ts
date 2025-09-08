import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ResponseFormatter } from '../utils/responseFormatter';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/travel/calculate
 * Calcola distanza e tempo di viaggio
 */
router.get('/calculate', authenticate, async (req, res) => {
  try {
    const { from, to } = req.query;
    
    // Placeholder per calcolo distanza
    // In produzione useresti Google Maps Distance Matrix API
    const mockDistance = {
      distance: '15 km',
      duration: '20 minuti',
      cost: 10 // in euro
    };
    
    return res.json(ResponseFormatter.success(
      mockDistance,
      'Travel calculation completed'
    ));
  } catch (error) {
    return res.status(500).json(ResponseFormatter.error(
      'Error calculating travel',
      'CALCULATION_ERROR'
    ));
  }
});

export default router;
