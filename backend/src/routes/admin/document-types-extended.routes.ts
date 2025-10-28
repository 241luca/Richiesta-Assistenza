import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { ResponseFormatter } from '../../utils/responseFormatter';
import { extendedDocumentTypeService } from '../../services/document-type-extended.service';
import { logger } from '../../utils/logger';
import { Role } from '@prisma/client';

const router = Router();

/**
 * GET /api/admin/document-types-extended
 * Get all document types with extended information (form templates, stats)
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

      const types = await extendedDocumentTypeService.getAllExtendedTypes(filters);

      return res.json(ResponseFormatter.success(
        types,
        'Extended document types retrieved successfully'
      ));
    } catch (error: any) {
      logger.error('Error fetching extended document types:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to fetch extended document types',
        'FETCH_ERROR'
      ));
    }
  }
);

/**
 * GET /api/admin/document-types-extended/:id
 * Get extended information for a specific document type
 */
router.get('/:id',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  async (req: any, res: any) => {
    try {
      const type = await extendedDocumentTypeService.getExtendedType(req.params.id);
      
      return res.json(ResponseFormatter.success(
        type,
        'Extended document type retrieved successfully'
      ));
    } catch (error: any) {
      logger.error('Error fetching extended document type:', error);
      
      if (error.message === 'Document type not found') {
        return res.status(404).json(ResponseFormatter.error(
          'Document type not found',
          'NOT_FOUND'
        ));
      }

      if (error.message === 'Invalid document type ID') {
        return res.status(400).json(ResponseFormatter.error(
          error.message,
          'INVALID_INPUT'
        ));
      }
      
      return res.status(500).json(ResponseFormatter.error(
        'Failed to fetch extended document type',
        'FETCH_ERROR'
      ));
    }
  }
);

/**
 * POST /api/admin/document-types-extended/:id/link-template
 * Link a form template to a document type
 */
router.post('/:id/link-template',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  async (req: any, res: any) => {
    try {
      const { formTemplateId, isDefault } = req.body;
      
      if (!formTemplateId) {
        return res.status(400).json(ResponseFormatter.error(
          'Form template ID is required',
          'INVALID_INPUT'
        ));
      }

      const result = await extendedDocumentTypeService.linkFormTemplate(
        req.params.id,
        formTemplateId,
        isDefault || false,
        req.user.id
      );

      return res.json(ResponseFormatter.success(
        result,
        'Form template linked successfully'
      ));
    } catch (error: any) {
      logger.error('Error linking form template:', error);
      
      if (error.message === 'Document type not found') {
        return res.status(404).json(ResponseFormatter.error(
          'Document type not found',
          'NOT_FOUND'
        ));
      }
      
      if (error.message.includes('Form template not found')) {
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
        'Failed to link form template',
        'LINK_ERROR'
      ));
    }
  }
);

/**
 * DELETE /api/admin/document-types-extended/:id/unlink-template/:templateId
 * Unlink a form template from a document type
 */
router.delete('/:id/unlink-template/:templateId',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  async (req: any, res: any) => {
    try {
      const result = await extendedDocumentTypeService.unlinkFormTemplate(
        req.params.id,
        req.params.templateId,
        req.user.id
      );

      return res.json(ResponseFormatter.success(
        result,
        'Form template unlinked successfully'
      ));
    } catch (error: any) {
      logger.error('Error unlinking form template:', error);
      
      if (error.message === 'Form template link not found') {
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
        'Failed to unlink form template',
        'UNLINK_ERROR'
      ));
    }
  }
);

/**
 * GET /api/admin/document-types-extended/:id/templates
 * Get all form templates for a document type
 */
router.get('/:id/templates',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  async (req: any, res: any) => {
    try {
      const templates = await extendedDocumentTypeService.getFormTemplatesForType(req.params.id);
      
      return res.json(ResponseFormatter.success(
        templates,
        'Form templates retrieved successfully'
      ));
    } catch (error: any) {
      logger.error('Error fetching form templates:', error);
      
      if (error.message === 'Invalid document type ID') {
        return res.status(400).json(ResponseFormatter.error(
          error.message,
          'INVALID_INPUT'
        ));
      }
      
      return res.status(500).json(ResponseFormatter.error(
        'Failed to fetch form templates',
        'FETCH_ERROR'
      ));
    }
  }
);

/**
 * PUT /api/admin/document-types-extended/:id/default-template
 * Set a form template as the default for a document type
 */
router.put('/:id/default-template',
  authenticate,
  requireRole([Role.SUPER_ADMIN]),
  async (req: any, res: any) => {
    try {
      const { formTemplateId } = req.body;
      
      if (!formTemplateId) {
        return res.status(400).json(ResponseFormatter.error(
          'Form template ID is required',
          'INVALID_INPUT'
        ));
      }

      const result = await extendedDocumentTypeService.setDefaultFormTemplate(
        req.params.id,
        formTemplateId,
        req.user.id
      );

      return res.json(ResponseFormatter.success(
        result,
        'Default form template set successfully'
      ));
    } catch (error: any) {
      logger.error('Error setting default form template:', error);
      
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
        'Failed to set default form template',
        'SET_DEFAULT_ERROR'
      ));
    }
  }
);

export default router;
