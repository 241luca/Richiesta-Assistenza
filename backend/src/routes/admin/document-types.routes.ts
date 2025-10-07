import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { ResponseFormatter } from '../../utils/responseFormatter';
import { documentTypeService } from '../../services/document-type.service';
import { logger } from '../../utils/logger';
import { Role } from '@prisma/client';

const router = Router();

/**
 * GET /api/admin/document-types
 * Ottieni tutti i tipi di documento
 */
router.get('/',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  async (req: any, res: any) => {
    try {
      const filters = {
        isActive: req.query.isActive,
        category: req.query.category,
        isRequired: req.query.isRequired
      };

      const types = await documentTypeService.getAllTypes(filters);

      return res.json(ResponseFormatter.success(
        types,
        'Document types retrieved successfully'
      ));
    } catch (error: any) {
      logger.error('Error fetching document types:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to fetch document types',
        'FETCH_ERROR'
      ));
    }
  }
);

/**
 * GET /api/admin/document-types/stats
 * Endpoint per statistiche rapide compatibile con frontend
 */
router.get('/stats',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  async (req: any, res: any) => {
    try {
      const stats = await documentTypeService.getStatistics();
      return res.json(ResponseFormatter.success(stats));
    } catch (error: any) {
      logger.error('Error fetching stats:', error);
      return res.status(500).json(
        ResponseFormatter.error('Failed to fetch stats', 'STATS_ERROR')
      );
    }
  }
);

/**
 * GET /api/admin/document-types/statistics
 * Ottieni statistiche sui tipi di documento
 */
router.get('/statistics',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  async (req: any, res: any) => {
    try {
      const stats = await documentTypeService.getTypeStatistics();

      return res.json(ResponseFormatter.success(
        stats,
        'Statistics retrieved successfully'
      ));
    } catch (error: any) {
      logger.error('Error fetching statistics:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to fetch statistics',
        'FETCH_ERROR'
      ));
    }
  }
);

/**
 * POST /api/admin/document-types/initialize-defaults
 * Inizializza i tipi di documento di default
 */
router.post('/initialize-defaults',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  async (req: any, res: any) => {
    try {
      const result = await documentTypeService.initializeDefaultTypes(req.user.id);

      return res.json(ResponseFormatter.success(
        result,
        'Default types initialized successfully'
      ));
    } catch (error: any) {
      logger.error('Error initializing defaults:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to initialize defaults',
        'INIT_ERROR'
      ));
    }
  }
);

/**
 * GET /api/admin/document-types/:id
 * Ottieni un tipo di documento specifico
 */
router.get('/:id',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  async (req: any, res: any) => {
    try {
      const type = await documentTypeService.getTypeById(req.params.id);

      return res.json(ResponseFormatter.success(
        type,
        'Document type retrieved successfully'
      ));
    } catch (error: any) {
      logger.error('Error fetching document type:', error);
      
      if (error.message === 'Document type not found') {
        return res.status(404).json(ResponseFormatter.error(
          'Document type not found',
          'NOT_FOUND'
        ));
      }
      
      return res.status(500).json(ResponseFormatter.error(
        'Failed to fetch document type',
        'FETCH_ERROR'
      ));
    }
  }
);

/**
 * POST /api/admin/document-types
 * Crea un nuovo tipo di documento
 */
router.post('/',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  async (req: any, res: any) => {
    try {
      const newType = await documentTypeService.createType(req.body, req.user.id);

      return res.status(201).json(ResponseFormatter.success(
        newType,
        'Document type created successfully'
      ));
    } catch (error: any) {
      logger.error('Error creating document type:', error);
      
      if (error.message.includes('already exists')) {
        return res.status(400).json(ResponseFormatter.error(
          error.message,
          'DUPLICATE_ERROR'
        ));
      }
      
      return res.status(500).json(ResponseFormatter.error(
        'Failed to create document type',
        'CREATE_ERROR'
      ));
    }
  }
);

/**
 * PUT /api/admin/document-types/:id
 * Aggiorna un tipo di documento
 */
router.put('/:id',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  async (req: any, res: any) => {
    try {
      const updatedType = await documentTypeService.updateType(
        req.params.id,
        req.body,
        req.user.id
      );

      return res.json(ResponseFormatter.success(
        updatedType,
        'Document type updated successfully'
      ));
    } catch (error: any) {
      logger.error('Error updating document type:', error);
      
      if (error.message === 'Document type not found') {
        return res.status(404).json(ResponseFormatter.error(
          'Document type not found',
          'NOT_FOUND'
        ));
      }
      
      if (error.message.includes('already exists')) {
        return res.status(400).json(ResponseFormatter.error(
          error.message,
          'DUPLICATE_ERROR'
        ));
      }
      
      return res.status(500).json(ResponseFormatter.error(
        'Failed to update document type',
        'UPDATE_ERROR'
      ));
    }
  }
);

/**
 * PATCH /api/admin/document-types/:id/toggle-status
 * Attiva/Disattiva un tipo di documento
 */
router.patch('/:id/toggle-status',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  async (req: any, res: any) => {
    try {
      const { isActive } = req.body;
      
      if (typeof isActive !== 'boolean') {
        return res.status(400).json(ResponseFormatter.error(
          'isActive must be a boolean value',
          'INVALID_INPUT'
        ));
      }

      const updatedType = await documentTypeService.toggleTypeStatus(
        req.params.id,
        isActive,
        req.user.id
      );

      return res.json(ResponseFormatter.success(
        updatedType,
        `Document type ${isActive ? 'activated' : 'deactivated'} successfully`
      ));
    } catch (error: any) {
      logger.error('Error toggling document type status:', error);
      
      if (error.message === 'Document type not found') {
        return res.status(404).json(ResponseFormatter.error(
          'Document type not found',
          'NOT_FOUND'
        ));
      }
      
      return res.status(500).json(ResponseFormatter.error(
        'Failed to toggle document type status',
        'UPDATE_ERROR'
      ));
    }
  }
);

/**
 * DELETE /api/admin/document-types/:id
 * Elimina un tipo di documento
 */
router.delete('/:id',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  async (req: any, res: any) => {
    try {
      const result = await documentTypeService.deleteType(req.params.id, req.user.id);

      return res.json(ResponseFormatter.success(
        result,
        'Document type deleted successfully'
      ));
    } catch (error: any) {
      logger.error('Error deleting document type:', error);
      
      if (error.message === 'Document type not found') {
        return res.status(404).json(ResponseFormatter.error(
          'Document type not found',
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
        'Failed to delete document type',
        'DELETE_ERROR'
      ));
    }
  }
);

export default router;
