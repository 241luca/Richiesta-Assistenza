import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ResponseFormatter } from '../utils/responseFormatter';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/system/settings
 * Ottieni impostazioni di sistema
 */
router.get('/', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const settings = await prisma.systemSetting.findFirst();
    
    return res.json(ResponseFormatter.success(
      settings || {},
      'System settings retrieved'
    ));
  } catch (error) {
    return res.status(500).json(ResponseFormatter.error(
      'Error fetching settings',
      'FETCH_ERROR'
    ));
  }
});

export default router;
