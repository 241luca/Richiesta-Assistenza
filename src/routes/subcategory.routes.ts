import { logger } from '../utils/logger';
import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { subcategoryService } from '../services/subcategory.service';
import { validateRequest } from '../middleware/validation';
import { ResponseFormatter, formatSubcategoryList, formatSubcategory } from '../utils/responseFormatter';
import { prisma } from '../config/database';

const router = Router();

// Validation schemas
const createSubcategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    categoryId: z.string().uuid(),
    requirements: z.string().optional(),
    color: z.string().optional(),
    textColor: z.string().optional(),
    isActive: z.boolean().optional(),
    displayOrder: z.number().optional(),
    metadata: z.any().optional(),
  }),
});

const updateSubcategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    slug: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    requirements: z.string().optional(),
    color: z.string().optional(),
    textColor: z.string().optional(),
    isActive: z.boolean().optional(),
    displayOrder: z.number().optional(),
    metadata: z.any().optional(),
  }),
});

const querySubcategoriesSchema = z.object({
  query: z.object({
    categoryId: z.string().uuid().optional(),
    isActive: z.enum(['true', 'false']).optional(),
    includeAiSettings: z.enum(['true', 'false']).optional(),
  }),
});

// GET /api/subcategories - Get all subcategories with optional filters
router.get(
  '/',
  authenticate,
  validateRequest(querySubcategoriesSchema),
  async (req, res, next) => {
    try {
      const { categoryId, isActive, includeAiSettings } = req.query;
      
      const filters = {
        categoryId: categoryId as string | undefined,
        isActive: isActive ? isActive === 'true' : undefined,
      };

      const subcategories = await subcategoryService.getSubcategories(
        filters,
        includeAiSettings === 'true'
      );

      // ✅ USO CORRETTO ResponseFormatter
      res.json(ResponseFormatter.success(
        formatSubcategoryList(subcategories),
        'Subcategories retrieved successfully'
      ));
    } catch (error) {
      console.error('Subcategory route error:', error);
      logger.error('Subcategory route error:', error);
      next(error);
    }
  }
);

// GET /api/subcategories/by-category/:categoryId - Get subcategories by category
router.get(
  '/by-category/:categoryId',
  authenticate,
  async (req, res, next) => {
    try {
      const subcategories = await subcategoryService.getSubcategories(
        { categoryId: req.params.categoryId },
        false
      );

      // ✅ USO CORRETTO ResponseFormatter
      res.json(ResponseFormatter.success(
        formatSubcategoryList(subcategories),
        'Subcategories retrieved successfully'
      ));
    } catch (error) {
      console.error('Subcategory route error:', error);
      logger.error('Subcategory route error:', error);
      next(error);
    }
  }
);

// GET /api/subcategories/:id - Get a specific subcategory
router.get(
  '/:id',
  authenticate,
  async (req, res, next) => {
    try {
      const subcategory = await subcategoryService.getSubcategoryById(
        req.params.id
      );

      if (!subcategory) {
        // ✅ USO CORRETTO ResponseFormatter per errore
        return res.status(404).json(ResponseFormatter.error(
          'Subcategory not found',
          'SUBCATEGORY_NOT_FOUND'
        ));
      }

      // ✅ USO CORRETTO ResponseFormatter
      res.json(ResponseFormatter.success(
        formatSubcategory(subcategory),
        'Subcategory retrieved successfully'
      ));
    } catch (error) {
      console.error('Subcategory route error:', error);
      logger.error('Subcategory route error:', error);
      next(error);
    }
  }
);

// POST /api/subcategories - Create a new subcategory (admin only)
router.post(
  '/',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  validateRequest(createSubcategorySchema),
  async (req, res, next) => {
    try {
      const subcategory = await subcategoryService.createSubcategory(
        req.body
      );

      // ✅ USO CORRETTO ResponseFormatter per creazione
      res.status(201).json(ResponseFormatter.success(
        formatSubcategory(subcategory),
        'Subcategory created successfully'
      ));
    } catch (error) {
      console.error('Subcategory route error:', error);
      logger.error('Subcategory route error:', error);
      next(error);
    }
  }
);

// PUT /api/subcategories/:id - Update a subcategory (admin only)
router.put(
  '/:id',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  validateRequest(updateSubcategorySchema),
  async (req, res, next) => {
    try {
      const subcategory = await subcategoryService.updateSubcategory(
        req.params.id,
        req.body
      );

      if (!subcategory) {
        // ✅ USO CORRETTO ResponseFormatter per errore
        return res.status(404).json(ResponseFormatter.error(
          'Subcategory not found',
          'SUBCATEGORY_NOT_FOUND'
        ));
      }

      // ✅ USO CORRETTO ResponseFormatter
      res.json(ResponseFormatter.success(
        formatSubcategory(subcategory),
        'Subcategory updated successfully'
      ));
    } catch (error) {
      console.error('Subcategory route error:', error);
      logger.error('Subcategory route error:', error);
      next(error);
    }
  }
);

// DELETE /api/subcategories/:id - Delete a subcategory (admin only)
router.delete(
  '/:id',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  async (req, res, next) => {
    try {
      const success = await subcategoryService.deleteSubcategory(
        req.params.id
      );

      if (!success) {
        // ✅ USO CORRETTO ResponseFormatter per errore
        return res.status(404).json(ResponseFormatter.error(
          'Subcategory not found',
          'SUBCATEGORY_NOT_FOUND'
        ));
      }

      // ✅ USO CORRETTO ResponseFormatter per operazione
      res.json(ResponseFormatter.success(
        null,
        'Subcategory deleted successfully'
      ));
    } catch (error) {
      console.error('Subcategory route error:', error);
      logger.error('Subcategory route error:', error);
      next(error);
    }
  }
);

// GET /api/subcategories/by-category/:categoryId - Get subcategories by category
router.get(
  '/by-category/:categoryId',
  authenticate,
  async (req, res, next) => {
    try {
      const { categoryId } = req.params;
      
      const subcategories = await prisma.subcategory.findMany({
        where: {
          categoryId: categoryId,
          isActive: true
        },
        orderBy: {
          displayOrder: 'asc'
        }
      });

      res.json(ResponseFormatter.success(
        subcategories,
        'Subcategories retrieved successfully'
      ));
    } catch (error) {
      console.error('Subcategory route error:', error);
      logger.error('Subcategory route error:', error);
      next(error);
    }
  }
);

// GET /api/subcategories/:id/professionals - Get professionals for a subcategory
router.get(
  '/:id/professionals',
  authenticate,
  async (req, res, next) => {
    try {
      const professionals = await subcategoryService.getSubcategoryProfessionals(
        req.params.id
      );

      // ✅ USO CORRETTO ResponseFormatter
      res.json(ResponseFormatter.success(
        professionals,
        'Professionals retrieved successfully'
      ));
    } catch (error) {
      console.error('Subcategory route error:', error);
      logger.error('Subcategory route error:', error);
      next(error);
    }
  }
);

// POST /api/subcategories/:id/ai-settings - Update AI settings for a subcategory (admin only)
router.post(
  '/:id/ai-settings',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  async (req, res, next) => {
    try {
      const aiSettings = await subcategoryService.updateAiSettings(
        req.params.id,
        req.body
      );

      // ✅ USO CORRETTO ResponseFormatter
      res.json(ResponseFormatter.success(
        aiSettings,
        'AI settings updated successfully'
      ));
    } catch (error) {
      console.error('Subcategory route error:', error);
      logger.error('Subcategory route error:', error);
      next(error);
    }
  }
);

export default router;