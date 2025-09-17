import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { ResponseFormatter } from '../../utils/responseFormatter';
import { prisma } from '../../config/database';
import logger from '../../utils/logger';

const router = Router();

// Debug log at module load
console.log('scriptConfig.routes.ts loading...');
console.log('Prisma import check:', !!prisma);

// Get all script configurations
router.get('/script-configs', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const scripts = await prisma.scriptConfiguration.findMany({
      orderBy: [
        { order: 'asc' },
        { displayName: 'asc' }
      ]
    });

    return res.json(ResponseFormatter.success(scripts, 'Script configurations retrieved'));
  } catch (error) {
    logger.error('Error fetching script configurations:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to fetch script configurations', 'FETCH_ERROR')
    );
  }
});

// Get single script configuration
router.get('/script-configs/:id', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;

    const script = await prisma.scriptConfiguration.findUnique({
      where: { id }
    });

    if (!script) {
      return res.status(404).json(
        ResponseFormatter.error('Script configuration not found', 'NOT_FOUND')
      );
    }

    return res.json(ResponseFormatter.success(script, 'Script configuration retrieved'));
  } catch (error) {
    logger.error('Error fetching script configuration:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to fetch script configuration', 'FETCH_ERROR')
    );
  }
});

// Get enabled scripts for execution
router.get('/script-configs/enabled/list', authenticate, async (req: any, res) => {
  try {
    // Debug logging
    console.log('=== DEBUG: /script-configs/enabled/list ===');
    console.log('Prisma exists?', !!prisma);
    console.log('Prisma type:', typeof prisma);
    
    if (!prisma) {
      logger.error('Prisma is undefined!');
      return res.status(500).json(
        ResponseFormatter.error('Database connection not available', 'DB_ERROR')
      );
    }
    
    if (!prisma.scriptConfiguration) {
      logger.error('scriptConfiguration model not found in Prisma!');
      console.log('Available Prisma properties:', Object.keys(prisma || {}).slice(0, 20));
      return res.status(500).json(
        ResponseFormatter.error('Database model not configured', 'MODEL_ERROR')
      );
    }
    
    const userRole = req.user.role;
    console.log('User role:', userRole);

    const scripts = await prisma.scriptConfiguration.findMany({
      where: {
        isEnabled: true,
        isVisible: true,
        allowedRoles: {
          has: userRole
        }
      },
      orderBy: [
        { order: 'asc' },
        { displayName: 'asc' }
      ]
    });

    console.log('Scripts found:', scripts.length);
    return res.json(ResponseFormatter.success(scripts, 'Enabled scripts retrieved'));
  } catch (error) {
    logger.error('Error fetching enabled scripts:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to fetch enabled scripts', 'FETCH_ERROR')
    );
  }
});

// Create script configuration
router.post('/script-configs', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const data = req.body;

    // Check if script name already exists
    const existing = await prisma.scriptConfiguration.findUnique({
      where: { scriptName: data.scriptName }
    });

    if (existing) {
      return res.status(400).json(
        ResponseFormatter.error('Script name already exists', 'DUPLICATE_NAME')
      );
    }

    // Remove fields that don't exist in the model
    const { createdBy, lastModifiedBy, ...cleanData } = data;

    const script = await prisma.scriptConfiguration.create({
      data: cleanData
    });

    return res.status(201).json(
      ResponseFormatter.success(script, 'Script configuration created')
    );
  } catch (error) {
    logger.error('Error creating script configuration:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to create script configuration', 'CREATE_ERROR')
    );
  }
});

// Update script configuration
router.put('/script-configs/:id', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Check if script exists
    const existing = await prisma.scriptConfiguration.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json(
        ResponseFormatter.error('Script configuration not found', 'NOT_FOUND')
      );
    }

    // Check for duplicate name
    if (data.scriptName && data.scriptName !== existing.scriptName) {
      const duplicate = await prisma.scriptConfiguration.findUnique({
        where: { scriptName: data.scriptName }
      });

      if (duplicate) {
        return res.status(400).json(
          ResponseFormatter.error('Script name already exists', 'DUPLICATE_NAME')
        );
      }
    }

    // Remove fields that don't exist in the model
    const { createdBy, lastModifiedBy, ...cleanData } = data;

    const script = await prisma.scriptConfiguration.update({
      where: { id },
      data: cleanData
    });

    return res.json(ResponseFormatter.success(script, 'Script configuration updated'));
  } catch (error) {
    logger.error('Error updating script configuration:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to update script configuration', 'UPDATE_ERROR')
    );
  }
});

// Toggle enabled status
router.patch('/script-configs/:id/toggle', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const { id } = req.params;
    const { isEnabled } = req.body;

    const script = await prisma.scriptConfiguration.update({
      where: { id },
      data: {
        isEnabled
      }
    });

    return res.json(ResponseFormatter.success(script, 'Script status updated'));
  } catch (error) {
    logger.error('Error toggling script status:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to toggle script status', 'UPDATE_ERROR')
    );
  }
});

// Delete script configuration
router.delete('/script-configs/:id', authenticate, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.scriptConfiguration.delete({
      where: { id }
    });

    return res.json(ResponseFormatter.success(null, 'Script configuration deleted'));
  } catch (error) {
    logger.error('Error deleting script configuration:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to delete script configuration', 'DELETE_ERROR')
    );
  }
});

export default router;
