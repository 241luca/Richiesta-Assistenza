import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { ResponseFormatter } from '../utils/responseFormatter';
import interventionReportService from '../services/interventionReport.service';

const router = Router();

// ========== CONFIGURAZIONE GLOBALE ==========

// GET /api/intervention-reports/config
router.get('/config', authenticate, async (req: any, res) => {
  try {
    const config = await interventionReportService.getConfig();
    
    return res.json(ResponseFormatter.success(
      config,
      'Configurazione recuperata con successo'
    ));
  } catch (error) {
    console.error('Errore recupero configurazione:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero della configurazione',
      'CONFIG_FETCH_ERROR'
    ));
  }
});

// PUT /api/intervention-reports/config
router.put('/config', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const config = await interventionReportService.updateConfig(req.body);
    
    return res.json(ResponseFormatter.success(
      config,
      'Configurazione aggiornata con successo'
    ));
  } catch (error) {
    console.error('Errore aggiornamento configurazione:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento della configurazione',
      'CONFIG_UPDATE_ERROR'
    ));
  }
});

// ========== TIPI CAMPO ==========

// GET /api/intervention-reports/field-types
router.get('/field-types', authenticate, async (req: any, res) => {
  try {
    const fieldTypes = await interventionReportService.getFieldTypes(req.query);
    
    return res.json(ResponseFormatter.success(
      fieldTypes,
      'Tipi campo recuperati con successo'
    ));
  } catch (error) {
    console.error('Errore recupero tipi campo:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero dei tipi campo',
      'FIELD_TYPES_FETCH_ERROR'
    ));
  }
});

// POST /api/intervention-reports/field-types
router.post('/field-types', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const fieldType = await interventionReportService.createFieldType(req.body);
    
    return res.json(ResponseFormatter.success(
      fieldType,
      'Tipo campo creato con successo'
    ));
  } catch (error: any) {
    console.error('Errore creazione tipo campo:', error);
    
    if (error.statusCode === 400) {
      return res.status(400).json(ResponseFormatter.error(
        error.message,
        'FIELD_TYPE_VALIDATION_ERROR'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella creazione del tipo campo',
      'FIELD_TYPE_CREATE_ERROR'
    ));
  }
});

// PUT /api/intervention-reports/field-types/:id
router.put('/field-types/:id', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const fieldType = await interventionReportService.updateFieldType(req.params.id, req.body);
    
    return res.json(ResponseFormatter.success(
      fieldType,
      'Tipo campo aggiornato con successo'
    ));
  } catch (error) {
    console.error('Errore aggiornamento tipo campo:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento del tipo campo',
      'FIELD_TYPE_UPDATE_ERROR'
    ));
  }
});

// DELETE /api/intervention-reports/field-types/:id
router.delete('/field-types/:id', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    await interventionReportService.deleteFieldType(req.params.id);
    
    return res.json(ResponseFormatter.success(
      null,
      'Tipo campo eliminato con successo'
    ));
  } catch (error: any) {
    console.error('Errore eliminazione tipo campo:', error);
    
    if (error.statusCode === 403) {
      return res.status(403).json(ResponseFormatter.error(
        error.message,
        'FIELD_TYPE_DELETE_FORBIDDEN'
      ));
    }
    
    if (error.statusCode === 404) {
      return res.status(404).json(ResponseFormatter.error(
        error.message,
        'FIELD_TYPE_NOT_FOUND'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'eliminazione del tipo campo',
      'FIELD_TYPE_DELETE_ERROR'
    ));
  }
});

// ========== STATI ==========

// GET /api/intervention-reports/statuses
router.get('/statuses', authenticate, async (req: any, res) => {
  try {
    const statuses = await interventionReportService.getStatuses(req.query);
    
    return res.json(ResponseFormatter.success(
      statuses,
      'Stati recuperati con successo'
    ));
  } catch (error) {
    console.error('Errore recupero stati:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero degli stati',
      'STATUSES_FETCH_ERROR'
    ));
  }
});

// POST /api/intervention-reports/statuses
router.post('/statuses', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const status = await interventionReportService.createStatus(req.body);
    
    return res.json(ResponseFormatter.success(
      status,
      'Stato creato con successo'
    ));
  } catch (error: any) {
    console.error('Errore creazione stato:', error);
    
    if (error.statusCode === 400) {
      return res.status(400).json(ResponseFormatter.error(
        error.message,
        'STATUS_VALIDATION_ERROR'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella creazione dello stato',
      'STATUS_CREATE_ERROR'
    ));
  }
});

// PUT /api/intervention-reports/statuses/:id
router.put('/statuses/:id', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const status = await interventionReportService.updateStatus(req.params.id, req.body);
    
    return res.json(ResponseFormatter.success(
      status,
      'Stato aggiornato con successo'
    ));
  } catch (error) {
    console.error('Errore aggiornamento stato:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento dello stato',
      'STATUS_UPDATE_ERROR'
    ));
  }
});

// ========== TIPI INTERVENTO ==========

// GET /api/intervention-reports/types
router.get('/types', authenticate, async (req: any, res) => {
  try {
    const types = await interventionReportService.getInterventionTypes(req.query);
    
    return res.json(ResponseFormatter.success(
      types,
      'Tipi intervento recuperati con successo'
    ));
  } catch (error) {
    console.error('Errore recupero tipi intervento:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero dei tipi intervento',
      'TYPES_FETCH_ERROR'
    ));
  }
});

// POST /api/intervention-reports/types
router.post('/types', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const type = await interventionReportService.createInterventionType(req.body);
    
    return res.json(ResponseFormatter.success(
      type,
      'Tipo intervento creato con successo'
    ));
  } catch (error: any) {
    console.error('Errore creazione tipo intervento:', error);
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella creazione del tipo intervento',
      'TYPE_CREATE_ERROR'
    ));
  }
});

// PUT /api/intervention-reports/types/:id
router.put('/types/:id', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const type = await interventionReportService.updateInterventionType(req.params.id, req.body);
    
    return res.json(ResponseFormatter.success(
      type,
      'Tipo intervento aggiornato con successo'
    ));
  } catch (error) {
    console.error('Errore aggiornamento tipo intervento:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento del tipo intervento',
      'TYPE_UPDATE_ERROR'
    ));
  }
});

// ========== SEZIONI ==========

// GET /api/intervention-reports/sections
router.get('/sections', authenticate, async (req: any, res) => {
  try {
    const sections = await interventionReportService.getSections(req.query);
    
    return res.json(ResponseFormatter.success(
      sections,
      'Sezioni recuperate con successo'
    ));
  } catch (error) {
    console.error('Errore recupero sezioni:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero delle sezioni',
      'SECTIONS_FETCH_ERROR'
    ));
  }
});

// POST /api/intervention-reports/sections
router.post('/sections', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const section = await interventionReportService.createSection(req.body);
    
    return res.json(ResponseFormatter.success(
      section,
      'Sezione creata con successo'
    ));
  } catch (error: any) {
    console.error('Errore creazione sezione:', error);
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella creazione della sezione',
      'SECTION_CREATE_ERROR'
    ));
  }
});

// PUT /api/intervention-reports/sections/:id
router.put('/sections/:id', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const section = await interventionReportService.updateSection(req.params.id, req.body);
    
    return res.json(ResponseFormatter.success(
      section,
      'Sezione aggiornata con successo'
    ));
  } catch (error) {
    console.error('Errore aggiornamento sezione:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento della sezione',
      'SECTION_UPDATE_ERROR'
    ));
  }
});

export default router;
