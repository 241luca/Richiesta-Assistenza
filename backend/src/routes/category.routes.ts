import { Router } from 'express';
import { z } from 'zod';
// authenticate is applied globally in server.ts
import { requireRole } from '../middleware/rbac';
import { validateRequest } from '../middleware/validation';
import { categoryService } from '../services/category.service';
import { ResponseFormatter } from '../utils/responseFormatter';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    icon: z.string().max(255).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3B82F6'),
    isActive: z.boolean().default(true),
    displayOrder: z.number().int().default(0),
  }),
});

const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    slug: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    icon: z.string().max(255).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    isActive: z.boolean().optional(),
    displayOrder: z.number().int().optional(),
  }),
});

// GET /api/categories - Get all categories
router.get(
  '/',
  async (req, res, next) => {
    try {
      const { withProfessionals } = req.query;
      
      // Se richiesto, ritorna solo categorie con professionisti
      if (withProfessionals === 'true') {
        logger.info('[CATEGORIES] Fetching categories with professionals filter');
        
        try {
          // Query diretta per trovare categorie con professionisti
          // Usando il nome corretto della tabella: Subcategory (non ProfessionalSubcategory)
          const categoriesWithProfessionals = await prisma.$queryRaw`
            SELECT DISTINCT c.*
            FROM "Category" c
            WHERE c."isActive" = true
            AND EXISTS (
              SELECT 1 
              FROM "Subcategory" s
              INNER JOIN "ProfessionalUserSubcategory" pus ON pus."subcategoryId" = s.id
              INNER JOIN "User" u ON u.id = pus."userId"
              WHERE s."categoryId" = c.id
              AND s."isActive" = true
              AND u.role = 'PROFESSIONAL'
            )
            ORDER BY c."displayOrder", c.name
          `;
          
          logger.info(`[CATEGORIES] Found ${(categoriesWithProfessionals as any[]).length} categories with professionals`);
          
          // Se non trova categorie con professionisti, usa fallback
          if ((categoriesWithProfessionals as any[]).length === 0) {
            logger.warn('[CATEGORIES] No categories with professionals found, using fallback');
            const allCategories = await categoryService.getAllCategories();
            return res.json(ResponseFormatter.success(
              allCategories, 
              'No categories with professionals found, showing all categories'
            ));
          }
          
          return res.json(ResponseFormatter.success(
            categoriesWithProfessionals, 
            'Categories with professionals retrieved successfully'
          ));
          
        } catch (queryError) {
          logger.error('[CATEGORIES] Query error:', queryError);
          // Fallback se la query raw fallisce
          const allCategories = await categoryService.getAllCategories();
          return res.json(ResponseFormatter.success(
            allCategories, 
            'Using all categories due to query error'
          ));
        }
      }
      
      // Altrimenti ritorna tutte le categorie
      const categories = await categoryService.getAllCategories();
      res.json(ResponseFormatter.success(
        categories, 
        'Categories retrieved successfully'
      ));
    } catch (error) {
      logger.error('[CATEGORIES] Error fetching categories:', error);
      res.json(ResponseFormatter.error(
        'Failed to fetch categories',
        'CATEGORIES_FETCH_ERROR'
      ));
    }
  }
);

// GET /api/categories/:id - Get a specific category
router.get(
  '/:id',
  async (req, res, next) => {
    try {
      const category = await categoryService.getCategoryById(
        req.params.id
      );

      if (!category) {
        return res.json(ResponseFormatter.error(
          'Category not found',
          'CATEGORY_NOT_FOUND'
        ));
      }

      res.json(ResponseFormatter.success(
        category,
        'Category retrieved successfully'
      ));
    } catch (error) {
      res.json(ResponseFormatter.error(
        'Failed to fetch category',
        'CATEGORY_FETCH_ERROR'
      ));
    }
  }
);

// POST /api/categories - Create a new category (admin only)
router.post(
  '/',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  validateRequest(createCategorySchema),
  async (req, res, next) => {
    try {
      const category = await categoryService.createCategory(
        req.body
      );
      res.status(201).json(ResponseFormatter.success(
        category,
        'Category created successfully'
      ));
    } catch (error) {
      res.json(ResponseFormatter.error(
        'Failed to create category',
        'CATEGORY_CREATE_ERROR'
      ));
    }
  }
);

// PUT /api/categories/:id - Update a category (admin only)
router.put(
  '/:id',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  validateRequest(updateCategorySchema),
  async (req, res, next) => {
    try {
      const category = await categoryService.updateCategory(
        req.params.id,
        req.body
      );

      if (!category) {
        return res.json(ResponseFormatter.error(
          'Category not found',
          'CATEGORY_NOT_FOUND'
        ));
      }

      res.json(ResponseFormatter.success(
        category,
        'Category updated successfully'
      ));
    } catch (error) {
      res.json(ResponseFormatter.error(
        'Failed to update category',
        'CATEGORY_UPDATE_ERROR'
      ));
    }
  }
);

// DELETE /api/categories/:id - Delete a category (admin only)
router.delete(
  '/:id',
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  async (req, res, next) => {
    try {
      const deleted = await categoryService.deleteCategory(
        req.params.id
      );

      if (!deleted) {
        return res.json(ResponseFormatter.error(
          'Category not found',
          'CATEGORY_NOT_FOUND'
        ));
      }

      res.status(204).json(ResponseFormatter.success(
        null,
        'Category deleted successfully'
      ));
    } catch (error) {
      res.json(ResponseFormatter.error(
        'Failed to delete category',
        'CATEGORY_DELETE_ERROR'
      ));
    }
  }
);

export default router;
