import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { ResponseFormatter } from '../../utils/responseFormatter';
import { documentCategoryService } from '../../services/document-category.service';
import { logger } from '../../utils/logger';
import { Role } from '@prisma/client';

const router = Router();

/**
 * GET /api/admin/document-categories
 * Ottieni tutte le categorie di documento
 */
router.get('/',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  async (req: any, res: any) => {
    try {
      const filters = {
        isActive: req.query.isActive,
        parentId: req.query.parentId
      };

      const categories = await documentCategoryService.getAllCategories(filters);

      return res.json(ResponseFormatter.success(
        categories,
        'Categories retrieved successfully'
      ));
    } catch (error: any) {
      logger.error('Error fetching categories:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to fetch categories',
        'FETCH_ERROR'
      ));
    }
  }
);

/**
 * GET /api/admin/document-categories/stats
 * Ottieni statistiche rapide categorie
 */
router.get('/stats',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  async (req: any, res: any) => {
    try {
      const stats = await documentCategoryService.getStatistics();
      return res.json(ResponseFormatter.success(stats));
    } catch (error: any) {
      logger.error('Error fetching category stats:', error);
      return res.status(500).json(
        ResponseFormatter.error('Failed to fetch stats', 'STATS_ERROR')
      );
    }
  }
);

/**
 * GET /api/admin/document-categories/tree
 * Ottieni l'albero gerarchico delle categorie
 */
router.get('/tree',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  async (req: any, res: any) => {
    try {
      // Per ora ritorna un array vuoto
      // Quando le tabelle saranno create, costruiremo l'albero gerarchico
      const tree = [];
      
      return res.json(ResponseFormatter.success(
        tree,
        'Category tree retrieved successfully'
      ));
    } catch (error) {
      logger.error('Error fetching category tree:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to fetch category tree',
        'FETCH_ERROR'
      ));
    }
  }
);

/**
 * POST /api/admin/document-categories/initialize-defaults
 * Inizializza categorie di default
 */
router.post('/initialize-defaults',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  async (req: any, res: any) => {
    try {
      // Per ora ritorna successo senza fare nulla
      // Quando le tabelle saranno create, inizializzeremo le categorie di default
      const result = {
        message: 'Default categories initialization not yet implemented',
        categoriesCreated: 0
      };
      
      return res.json(ResponseFormatter.success(
        result,
        'Initialize defaults completed'
      ));
    } catch (error) {
      logger.error('Error initializing defaults:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to initialize defaults',
        'INIT_ERROR'
      ));
    }
  }
);

/**
 * GET /api/admin/document-categories/:id
 * Ottieni una categoria specifica
 */
router.get('/:id',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  async (req: any, res: any) => {
    try {
      const category = await documentCategoryService.getCategoryById(req.params.id);

      return res.json(ResponseFormatter.success(
        category,
        'Category retrieved successfully'
      ));
    } catch (error: any) {
      logger.error('Error fetching category:', error);
      
      if (error.message === 'Category not found') {
        return res.status(404).json(ResponseFormatter.error(
          'Category not found',
          'NOT_FOUND'
        ));
      }
      
      return res.status(500).json(ResponseFormatter.error(
        'Failed to fetch category',
        'FETCH_ERROR'
      ));
    }
  }
);

/**
 * POST /api/admin/document-categories
 * Crea una nuova categoria
 */
router.post('/',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  async (req: any, res: any) => {
    try {
      const newCategory = await documentCategoryService.createCategory(
        req.body,
        req.user.id
      );

      return res.status(201).json(ResponseFormatter.success(
        newCategory,
        'Category created successfully'
      ));
    } catch (error: any) {
      logger.error('Error creating category:', error);
      
      if (error.message.includes('already exists')) {
        return res.status(400).json(ResponseFormatter.error(
          error.message,
          'DUPLICATE_ERROR'
        ));
      }
      
      return res.status(500).json(ResponseFormatter.error(
        'Failed to create category',
        'CREATE_ERROR'
      ));
    }
  }
);

/**
 * PUT /api/admin/document-categories/:id
 * Aggiorna una categoria
 */
router.put('/:id',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  async (req: any, res: any) => {
    try {
      const updatedCategory = await documentCategoryService.updateCategory(
        req.params.id,
        req.body,
        req.user.id
      );

      return res.json(ResponseFormatter.success(
        updatedCategory,
        'Category updated successfully'
      ));
    } catch (error: any) {
      logger.error('Error updating category:', error);
      
      if (error.message === 'Category not found') {
        return res.status(404).json(ResponseFormatter.error(
          'Category not found',
          'NOT_FOUND'
        ));
      }
      
      return res.status(500).json(ResponseFormatter.error(
        'Failed to update category',
        'UPDATE_ERROR'
      ));
    }
  }
);

/**
 * DELETE /api/admin/document-categories/:id
 * Elimina una categoria
 */
router.delete('/:id',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  async (req: any, res: any) => {
    try {
      const result = await documentCategoryService.deleteCategory(
        req.params.id,
        req.user.id
      );

      return res.json(ResponseFormatter.success(
        result,
        'Category deleted successfully'
      ));
    } catch (error: any) {
      logger.error('Error deleting category:', error);
      
      if (error.message === 'Category not found') {
        return res.status(404).json(ResponseFormatter.error(
          'Category not found',
          'NOT_FOUND'
        ));
      }
      
      if (error.message.includes('Cannot delete')) {
        return res.status(400).json(ResponseFormatter.error(
          error.message,
          'DELETE_RESTRICTED'
        ));
      }
      
      return res.status(500).json(ResponseFormatter.error(
        'Failed to delete category',
        'DELETE_ERROR'
      ));
    }
  }
);

export default router;
