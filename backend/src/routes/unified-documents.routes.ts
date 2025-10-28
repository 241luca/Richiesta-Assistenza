import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { ResponseFormatter } from '../utils/responseFormatter';
import { unifiedDocumentService } from '../services/unified-document.service';
import { logger } from '../utils/logger';
import { Role } from '@prisma/client';

const router = Router();

/**
 * GET /api/unified-documents
 * Get all documents (legal and form-based) with unified interface
 */
router.get('/',
  authenticate,
  async (req: any, res: any) => {
    try {
      const filters: any = {
        type: req.query.type,
        status: req.query.status,
        documentTypeId: req.query.documentTypeId,
        limit: req.query.limit ? parseInt(req.query.limit) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset) : undefined
      };

      // Only admins can see all documents, others see only their own
      if (req.user.role !== Role.ADMIN && req.user.role !== Role.SUPER_ADMIN) {
        filters.createdBy = req.user.id;
      } else if (req.query.createdBy) {
        filters.createdBy = req.query.createdBy;
      }

      const result = await unifiedDocumentService.getAllDocuments(filters);
      
      return res.json(ResponseFormatter.success(
        result,
        'Documents retrieved successfully'
      ));
    } catch (error: any) {
      logger.error('Error fetching unified documents:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to fetch documents',
        'FETCH_ERROR'
      ));
    }
  }
);

/**
 * GET /api/unified-documents/statistics
 * Get statistics about documents
 */
router.get('/statistics',
  authenticate,
  async (req: any, res: any) => {
    try {
      const filters: any = {};

      // Only admins can see all statistics, others see only their own
      if (req.user.role !== Role.ADMIN && req.user.role !== Role.SUPER_ADMIN) {
        filters.createdBy = req.user.id;
      } else if (req.query.createdBy) {
        filters.createdBy = req.query.createdBy;
      }

      if (req.query.documentTypeId) {
        filters.documentTypeId = req.query.documentTypeId;
      }

      const stats = await unifiedDocumentService.getDocumentStatistics(filters);
      
      return res.json(ResponseFormatter.success(
        stats,
        'Statistics retrieved successfully'
      ));
    } catch (error: any) {
      logger.error('Error fetching document statistics:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to fetch statistics',
        'FETCH_ERROR'
      ));
    }
  }
);

/**
 * GET /api/unified-documents/:type/:id
 * Get a specific document by ID and type
 */
router.get('/:type/:id',
  authenticate,
  async (req: any, res: any) => {
    try {
      const { type, id } = req.params;

      if (type !== 'LEGAL' && type !== 'FORM_BASED') {
        return res.status(400).json(ResponseFormatter.error(
          'Invalid document type. Must be LEGAL or FORM_BASED',
          'INVALID_TYPE'
        ));
      }

      const document = await unifiedDocumentService.getDocumentById(id, type as 'LEGAL' | 'FORM_BASED');

      // Check permissions - only admins or document creator can view
      if (
        req.user.role !== Role.ADMIN && 
        req.user.role !== Role.SUPER_ADMIN && 
        document.createdBy !== req.user.id
      ) {
        return res.status(403).json(ResponseFormatter.error(
          'Access denied',
          'FORBIDDEN'
        ));
      }
      
      return res.json(ResponseFormatter.success(
        document,
        'Document retrieved successfully'
      ));
    } catch (error: any) {
      logger.error('Error fetching document:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json(ResponseFormatter.error(
          error.message,
          'NOT_FOUND'
        ));
      }

      if (error.message.includes('Invalid parameters')) {
        return res.status(400).json(ResponseFormatter.error(
          error.message,
          'INVALID_INPUT'
        ));
      }
      
      return res.status(500).json(ResponseFormatter.error(
        'Failed to fetch document',
        'FETCH_ERROR'
      ));
    }
  }
);

/**
 * POST /api/unified-documents/from-template
 * Create a new document from a form template
 */
router.post('/from-template',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  async (req: any, res: any) => {
    try {
      const { documentTypeId, title, description, formTemplateId, metadata } = req.body;
      
      // Validation
      if (!documentTypeId || !title || !formTemplateId) {
        return res.status(400).json(ResponseFormatter.error(
          'documentTypeId, title, and formTemplateId are required',
          'INVALID_INPUT'
        ));
      }

      const document = await unifiedDocumentService.createDocumentFromForm({
        documentTypeId,
        title,
        description,
        formTemplateId,
        createdBy: req.user.id,
        metadata
      });

      return res.status(201).json(ResponseFormatter.success(
        document,
        'Document created successfully'
      ));
    } catch (error: any) {
      logger.error('Error creating document from template:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json(ResponseFormatter.error(
          error.message,
          'NOT_FOUND'
        ));
      }

      if (error.message.includes('Invalid parameters')) {
        return res.status(400).json(ResponseFormatter.error(
          error.message,
          'INVALID_INPUT'
        ));
      }
      
      return res.status(500).json(ResponseFormatter.error(
        'Failed to create document',
        'CREATE_ERROR'
      ));
    }
  }
);

export default router;
