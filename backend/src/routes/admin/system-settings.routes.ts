import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ResponseFormatter } from '../../utils/responseFormatter';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/admin/system-settings
 * Ottieni impostazioni di sistema
 */
router.get('/', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const settings = await prisma.systemSetting.findFirst();
    
    return res.json(ResponseFormatter.success(
      settings || {
        maintenanceMode: false,
        allowRegistration: true,
        maxRequestsPerUser: 100,
        defaultCurrency: 'EUR'
      },
      'System settings retrieved'
    ));
  } catch (error) {
    return res.status(500).json(ResponseFormatter.error(
      'Error fetching settings',
      'FETCH_ERROR'
    ));
  }
});

/**
 * PUT /api/admin/system-settings
 * Aggiorna impostazioni di sistema
 */
router.put('/', authenticate, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const settings = await prisma.systemSetting.upsert({
      where: { id: 'default' },
      update: req.body,
      create: { id: 'default', ...req.body }
    });
    
    return res.json(ResponseFormatter.success(
      settings,
      'Settings updated successfully'
    ));
  } catch (error) {
    return res.status(500).json(ResponseFormatter.error(
      'Error updating settings',
      'UPDATE_ERROR'
    ));
  }
});

export default router;
