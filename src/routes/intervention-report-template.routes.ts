import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { ResponseFormatter } from '../utils/responseFormatter';
import interventionTemplateService from '../services/interventionTemplate.service';

const router = Router();

// ========== TEMPLATE ==========

// GET /api/intervention-reports/templates
router.get('/', authenticate, async (req: any, res) => {
  try {
    const templates = await interventionTemplateService.getTemplates(req.query);
    
    return res.json(ResponseFormatter.success(
      templates,
      'Template recuperati con successo'
    ));
  } catch (error) {
    console.error('Errore recupero template:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero dei template',
      'TEMPLATES_FETCH_ERROR'
    ));
  }
});

// GET /api/intervention-reports/templates/:id
router.get('/:id', authenticate, async (req: any, res) => {
  try {
    const template = await interventionTemplateService.getTemplateById(req.params.id);
    
    return res.json(ResponseFormatter.success(
      template,
      'Template recuperato con successo'
    ));
  } catch (error: any) {
    console.error('Errore recupero template:', error);
    
    if (error.statusCode === 404) {
      return res.status(404).json(ResponseFormatter.error(
        error.message,
        'TEMPLATE_NOT_FOUND'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero del template',
      'TEMPLATE_FETCH_ERROR'
    ));
  }
});

// POST /api/intervention-reports/templates
router.post('/', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const template = await interventionTemplateService.createTemplate(req.body, req.user.id);
    
    return res.json(ResponseFormatter.success(
      template,
      'Template creato con successo'
    ));
  } catch (error: any) {
    console.error('Errore creazione template:', error);
    
    if (error.statusCode === 400) {
      return res.status(400).json(ResponseFormatter.error(
        error.message,
        'TEMPLATE_VALIDATION_ERROR'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella creazione del template',
      'TEMPLATE_CREATE_ERROR'
    ));
  }
});

// PUT /api/intervention-reports/templates/:id
router.put('/:id', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const template = await interventionTemplateService.updateTemplate(
      req.params.id,
      req.body,
      req.user.id
    );
    
    return res.json(ResponseFormatter.success(
      template,
      'Template aggiornato con successo'
    ));
  } catch (error: any) {
    console.error('Errore aggiornamento template:', error);
    
    if (error.statusCode === 404) {
      return res.status(404).json(ResponseFormatter.error(
        error.message,
        'TEMPLATE_NOT_FOUND'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento del template',
      'TEMPLATE_UPDATE_ERROR'
    ));
  }
});

// DELETE /api/intervention-reports/templates/:id
router.delete('/:id', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    await interventionTemplateService.deleteTemplate(req.params.id, req.user.id);
    
    return res.json(ResponseFormatter.success(
      null,
      'Template eliminato con successo'
    ));
  } catch (error: any) {
    console.error('Errore eliminazione template:', error);
    
    if (error.statusCode === 403) {
      return res.status(403).json(ResponseFormatter.error(
        error.message,
        'TEMPLATE_DELETE_FORBIDDEN'
      ));
    }
    
    if (error.statusCode === 404) {
      return res.status(404).json(ResponseFormatter.error(
        error.message,
        'TEMPLATE_NOT_FOUND'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'eliminazione del template',
      'TEMPLATE_DELETE_ERROR'
    ));
  }
});

// POST /api/intervention-reports/templates/:id/clone
router.post('/:id/clone', authenticate, async (req: any, res) => {
  try {
    const template = await interventionTemplateService.cloneTemplate(
      req.params.id,
      req.user.id,
      req.body.name
    );
    
    return res.json(ResponseFormatter.success(
      template,
      'Template clonato con successo'
    ));
  } catch (error: any) {
    console.error('Errore clonazione template:', error);
    
    if (error.statusCode === 404) {
      return res.status(404).json(ResponseFormatter.error(
        error.message,
        'TEMPLATE_NOT_FOUND'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella clonazione del template',
      'TEMPLATE_CLONE_ERROR'
    ));
  }
});

// ========== CAMPI TEMPLATE ==========

// GET /api/intervention-reports/templates/:id/fields
router.get('/:id/fields', authenticate, async (req: any, res) => {
  try {
    const fields = await interventionTemplateService.getTemplateFields(req.params.id);
    
    return res.json(ResponseFormatter.success(
      fields,
      'Campi template recuperati con successo'
    ));
  } catch (error) {
    console.error('Errore recupero campi template:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero dei campi del template',
      'TEMPLATE_FIELDS_FETCH_ERROR'
    ));
  }
});

// POST /api/intervention-reports/templates/:id/fields
router.post('/:id/fields', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const field = await interventionTemplateService.addFieldToTemplate(
      req.params.id,
      req.body
    );
    
    return res.json(ResponseFormatter.success(
      field,
      'Campo aggiunto al template con successo'
    ));
  } catch (error: any) {
    console.error('Errore aggiunta campo:', error);
    
    if (error.statusCode === 400) {
      return res.status(400).json(ResponseFormatter.error(
        error.message,
        'FIELD_VALIDATION_ERROR'
      ));
    }
    
    if (error.statusCode === 404) {
      return res.status(404).json(ResponseFormatter.error(
        error.message,
        'TEMPLATE_NOT_FOUND'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiunta del campo',
      'FIELD_ADD_ERROR'
    ));
  }
});

// PUT /api/intervention-reports/templates/:templateId/fields/:fieldId
router.put('/:templateId/fields/:fieldId', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const field = await interventionTemplateService.updateTemplateField(
      req.params.templateId,
      req.params.fieldId,
      req.body
    );
    
    return res.json(ResponseFormatter.success(
      field,
      'Campo aggiornato con successo'
    ));
  } catch (error: any) {
    console.error('Errore aggiornamento campo:', error);
    
    if (error.statusCode === 404) {
      return res.status(404).json(ResponseFormatter.error(
        error.message,
        'FIELD_NOT_FOUND'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento del campo',
      'FIELD_UPDATE_ERROR'
    ));
  }
});

// DELETE /api/intervention-reports/templates/:templateId/fields/:fieldId
router.delete('/:templateId/fields/:fieldId', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    await interventionTemplateService.deleteTemplateField(
      req.params.templateId,
      req.params.fieldId
    );
    
    return res.json(ResponseFormatter.success(
      null,
      'Campo eliminato con successo'
    ));
  } catch (error: any) {
    console.error('Errore eliminazione campo:', error);
    
    if (error.statusCode === 404) {
      return res.status(404).json(ResponseFormatter.error(
        error.message,
        'FIELD_NOT_FOUND'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'eliminazione del campo',
      'FIELD_DELETE_ERROR'
    ));
  }
});

// POST /api/intervention-reports/templates/:id/fields/reorder
router.post('/:id/fields/reorder', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    await interventionTemplateService.reorderTemplateFields(
      req.params.id,
      req.body.fields
    );
    
    return res.json(ResponseFormatter.success(
      null,
      'Campi riordinati con successo'
    ));
  } catch (error: any) {
    console.error('Errore riordino campi:', error);
    
    if (error.statusCode === 404) {
      return res.status(404).json(ResponseFormatter.error(
        error.message,
        'TEMPLATE_NOT_FOUND'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel riordino dei campi',
      'FIELDS_REORDER_ERROR'
    ));
  }
});

export default router;
