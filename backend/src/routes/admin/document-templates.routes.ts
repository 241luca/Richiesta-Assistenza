import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { validateRequest } from '../../middleware/validation';
import * as documentTemplateService from '../../services/admin/document-template.service';
import { ResponseFormatter } from '../../utils/responseFormatter';
import { z } from 'zod';
import logger from '../../utils/logger';

const router = Router();

// Schema di validazione per creare un template
const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.string().min(1),
  content: z.string().min(1),
  metadata: z.object({
    tags: z.array(z.string()).optional(),
    category: z.string().optional(),
    isPublic: z.boolean().optional()
  }).optional()
});

// Schema di validazione per aggiornare un template
const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  content: z.string().min(1).optional(),
  metadata: z.object({
    tags: z.array(z.string()).optional(),
    category: z.string().optional(),
    isPublic: z.boolean().optional()
  }).optional()
});

// GET /api/admin/document-templates - Lista tutti i template
router.get('/', 
  authenticate, 
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  async (req: any, res) => {
    try {
      const templates = await documentTemplateService.getAllTemplates(req.user.id);
      return res.json(ResponseFormatter.success(templates, 'Templates retrieved successfully'));
    } catch (error) {
      logger.error('Error fetching document templates:', error);
      return res.status(500).json(
        ResponseFormatter.error('Failed to fetch templates', 'FETCH_ERROR')
      );
    }
  }
);

// GET /api/admin/document-templates/:id - Ottieni un template specifico
router.get('/:id',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  async (req: any, res) => {
    try {
      const template = await documentTemplateService.getTemplateById(req.params.id, req.user.id);
      if (!template) {
        return res.status(404).json(
          ResponseFormatter.error('Template not found', 'NOT_FOUND')
        );
      }
      return res.json(ResponseFormatter.success(template, 'Template retrieved successfully'));
    } catch (error) {
      logger.error('Error fetching template:', error);
      return res.status(500).json(
        ResponseFormatter.error('Failed to fetch template', 'FETCH_ERROR')
      );
    }
  }
);

// POST /api/admin/document-templates - Crea un nuovo template
router.post('/',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  validateRequest(createTemplateSchema),
  async (req: any, res) => {
    try {
      const template = await documentTemplateService.createTemplate({
        ...req.body,
        createdById: req.user.id
      });
      return res.status(201).json(
        ResponseFormatter.success(template, 'Template created successfully')
      );
    } catch (error) {
      logger.error('Error creating template:', error);
      return res.status(500).json(
        ResponseFormatter.error('Failed to create template', 'CREATE_ERROR')
      );
    }
  }
);

// PUT /api/admin/document-templates/:id - Aggiorna un template
router.put('/:id',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  validateRequest(updateTemplateSchema),
  async (req: any, res) => {
    try {
      const template = await documentTemplateService.updateTemplate(
        req.params.id,
        req.user.id,
        req.body
      );
      if (!template) {
        return res.status(404).json(
          ResponseFormatter.error('Template not found', 'NOT_FOUND')
        );
      }
      return res.json(ResponseFormatter.success(template, 'Template updated successfully'));
    } catch (error) {
      logger.error('Error updating template:', error);
      return res.status(500).json(
        ResponseFormatter.error('Failed to update template', 'UPDATE_ERROR')
      );
    }
  }
);

// DELETE /api/admin/document-templates/:id - Elimina un template
router.delete('/:id',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  async (req: any, res) => {
    try {
      const deleted = await documentTemplateService.deleteTemplate(req.params.id, req.user.id);
      if (!deleted) {
        return res.status(404).json(
          ResponseFormatter.error('Template not found', 'NOT_FOUND')
        );
      }
      return res.json(ResponseFormatter.success(null, 'Template deleted successfully'));
    } catch (error) {
      logger.error('Error deleting template:', error);
      return res.status(500).json(
        ResponseFormatter.error('Failed to delete template', 'DELETE_ERROR')
      );
    }
  }
);

// POST /api/admin/document-templates/from-document - Crea template da documento esistente
router.post('/from-document',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  validateRequest(z.object({
    documentId: z.string(),
    versionId: z.string().optional(),
    name: z.string().min(1).max(255),
    description: z.string().optional()
  })),
  async (req: any, res) => {
    try {
      const template = await documentTemplateService.createTemplateFromDocument({
        ...req.body,
        createdById: req.user.id
      });
      return res.status(201).json(
        ResponseFormatter.success(template, 'Template created from document successfully')
      );
    } catch (error) {
      logger.error('Error creating template from document:', error);
      return res.status(500).json(
        ResponseFormatter.error('Failed to create template from document', 'CREATE_ERROR')
      );
    }
  }
);

export default router;
