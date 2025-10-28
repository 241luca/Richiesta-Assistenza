import { Router, Request, Response } from 'express';
import { ContainerCategoryService } from '../../services/ContainerCategoryService';
import { logger } from '../../utils/logger';

const router = Router();
const categoryService = new ContainerCategoryService();

/**
 * GET /container-categories
 * Lista tutte le categorie container
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const categories = await categoryService.listAll(includeInactive);

    res.json({
      success: true,
      data: categories
    });
  } catch (error: any) {
    logger.error('Error listing container categories:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /container-categories/grouped
 * Lista categorie raggruppate per group_name
 */
router.get('/grouped', async (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const grouped = await categoryService.listGrouped(includeInactive);

    res.json({
      success: true,
      data: grouped
    });
  } catch (error: any) {
    logger.error('Error listing grouped categories:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /container-categories/:id
 * Ottieni categoria per ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await categoryService.getById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error: any) {
    logger.error('Error getting category:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /container-categories
 * Crea nuova categoria
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { code, name, description, icon, color, group_name, sort_order, is_active } = req.body;

    if (!code || !name) {
      return res.status(400).json({
        success: false,
        error: 'Code and name are required'
      });
    }

    const category = await categoryService.create({
      code,
      name,
      description,
      icon,
      color,
      group_name,
      sort_order,
      is_active
    });

    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    });
  } catch (error: any) {
    logger.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /container-categories/:id
 * Aggiorna categoria
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const category = await categoryService.update(id, updates);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category,
      message: 'Category updated successfully'
    });
  } catch (error: any) {
    logger.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /container-categories/:id/toggle
 * Toggle attivo/disattivo
 */
router.post('/:id/toggle', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await categoryService.toggleActive(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category,
      message: `Category ${category.is_active ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error: any) {
    logger.error('Error toggling category:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /container-categories/:id
 * Elimina categoria
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await categoryService.delete(id);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error: any) {
    logger.error('Error deleting category:', error);
    
    if (error.message.includes('used by existing containers')) {
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
