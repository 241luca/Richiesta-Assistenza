import { Router, Request, Response } from 'express';
import { ContainerCategoryGroupService } from '../../services/ContainerCategoryGroupService';
import { logger } from '../../utils/logger';

const router = Router();
const groupService = new ContainerCategoryGroupService();

/**
 * GET /container-category-groups
 * Lista tutti i gruppi
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const groups = await groupService.listAll(includeInactive);

    res.json({
      success: true,
      data: groups
    });
  } catch (error: any) {
    logger.error('Error listing groups:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /container-category-groups/:id
 * Ottieni gruppo per ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const group = await groupService.getById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    res.json({
      success: true,
      data: group
    });
  } catch (error: any) {
    logger.error('Error getting group:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /container-category-groups
 * Crea nuovo gruppo
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { code, name, description, icon, color, sort_order, is_active } = req.body;

    if (!code || !name) {
      return res.status(400).json({
        success: false,
        error: 'Code and name are required'
      });
    }

    const group = await groupService.create({
      code,
      name,
      description,
      icon,
      color,
      sort_order,
      is_active
    });

    res.status(201).json({
      success: true,
      data: group,
      message: 'Group created successfully'
    });
  } catch (error: any) {
    logger.error('Error creating group:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /container-category-groups/:id
 * Aggiorna gruppo
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const group = await groupService.update(id, updates);

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    res.json({
      success: true,
      data: group,
      message: 'Group updated successfully'
    });
  } catch (error: any) {
    logger.error('Error updating group:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /container-category-groups/:id/toggle
 * Toggle attivo/disattivo
 */
router.post('/:id/toggle', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const group = await groupService.toggleActive(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    res.json({
      success: true,
      data: group,
      message: `Group ${group.is_active ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error: any) {
    logger.error('Error toggling group:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /container-category-groups/:id
 * Elimina gruppo
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await groupService.delete(id);

    res.json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error: any) {
    logger.error('Error deleting group:', error);
    
    if (error.message.includes('used by existing categories')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
