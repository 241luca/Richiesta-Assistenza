import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { ResponseFormatter } from '../utils/responseFormatter';
import interventionMaterialService from '../services/interventionMaterial.service';

const router = Router();

// ========== MATERIALI ==========

// GET /api/intervention-reports/materials
router.get('/', authenticate, async (req: any, res) => {
  try {
    const materials = await interventionMaterialService.getMaterials(req.query);
    
    return res.json(ResponseFormatter.success(
      materials,
      'Materiali recuperati con successo'
    ));
  } catch (error) {
    console.error('Errore recupero materiali:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero dei materiali',
      'MATERIALS_FETCH_ERROR'
    ));
  }
});

// GET /api/intervention-reports/materials/categories
router.get('/categories', authenticate, async (req: any, res) => {
  try {
    const categories = await interventionMaterialService.getMaterialCategories();
    
    return res.json(ResponseFormatter.success(
      categories,
      'Categorie materiali recuperate con successo'
    ));
  } catch (error) {
    console.error('Errore recupero categorie:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero delle categorie',
      'CATEGORIES_FETCH_ERROR'
    ));
  }
});

// GET /api/intervention-reports/materials/most-used
router.get('/most-used', authenticate, async (req: any, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const materials = await interventionMaterialService.getMostUsedMaterials(limit);
    
    return res.json(ResponseFormatter.success(
      materials,
      'Materiali più utilizzati recuperati con successo'
    ));
  } catch (error) {
    console.error('Errore recupero materiali più usati:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero dei materiali più utilizzati',
      'MOST_USED_FETCH_ERROR'
    ));
  }
});

// GET /api/intervention-reports/materials/search
router.get('/search', authenticate, async (req: any, res) => {
  try {
    if (!req.query.q) {
      return res.status(400).json(ResponseFormatter.error(
        'Parametro di ricerca mancante',
        'SEARCH_QUERY_MISSING'
      ));
    }
    
    const materials = await interventionMaterialService.searchMaterials(req.query.q);
    
    return res.json(ResponseFormatter.success(
      materials,
      'Ricerca materiali completata'
    ));
  } catch (error) {
    console.error('Errore ricerca materiali:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella ricerca dei materiali',
      'SEARCH_ERROR'
    ));
  }
});

// GET /api/intervention-reports/materials/:id
router.get('/:id', authenticate, async (req: any, res) => {
  try {
    const material = await interventionMaterialService.getMaterialById(req.params.id);
    
    return res.json(ResponseFormatter.success(
      material,
      'Materiale recuperato con successo'
    ));
  } catch (error: any) {
    console.error('Errore recupero materiale:', error);
    
    if (error.statusCode === 404) {
      return res.status(404).json(ResponseFormatter.error(
        error.message,
        'MATERIAL_NOT_FOUND'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero del materiale',
      'MATERIAL_FETCH_ERROR'
    ));
  }
});

// GET /api/intervention-reports/materials/code/:code
router.get('/code/:code', authenticate, async (req: any, res) => {
  try {
    const material = await interventionMaterialService.getMaterialByCode(req.params.code);
    
    return res.json(ResponseFormatter.success(
      material,
      'Materiale recuperato con successo'
    ));
  } catch (error: any) {
    console.error('Errore recupero materiale per codice:', error);
    
    if (error.statusCode === 404) {
      return res.status(404).json(ResponseFormatter.error(
        error.message,
        'MATERIAL_NOT_FOUND'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero del materiale',
      'MATERIAL_FETCH_ERROR'
    ));
  }
});

// POST /api/intervention-reports/materials
router.post('/', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const material = await interventionMaterialService.createMaterial(req.body);
    
    return res.json(ResponseFormatter.success(
      material,
      'Materiale creato con successo'
    ));
  } catch (error: any) {
    console.error('Errore creazione materiale:', error);
    
    if (error.statusCode === 400) {
      return res.status(400).json(ResponseFormatter.error(
        error.message,
        'MATERIAL_VALIDATION_ERROR'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella creazione del materiale',
      'MATERIAL_CREATE_ERROR'
    ));
  }
});

// PUT /api/intervention-reports/materials/:id
router.put('/:id', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const material = await interventionMaterialService.updateMaterial(
      req.params.id,
      req.body
    );
    
    return res.json(ResponseFormatter.success(
      material,
      'Materiale aggiornato con successo'
    ));
  } catch (error: any) {
    console.error('Errore aggiornamento materiale:', error);
    
    if (error.statusCode === 404) {
      return res.status(404).json(ResponseFormatter.error(
        error.message,
        'MATERIAL_NOT_FOUND'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento del materiale',
      'MATERIAL_UPDATE_ERROR'
    ));
  }
});

// DELETE /api/intervention-reports/materials/:id
router.delete('/:id', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    await interventionMaterialService.deleteMaterial(req.params.id);
    
    return res.json(ResponseFormatter.success(
      null,
      'Materiale eliminato con successo'
    ));
  } catch (error: any) {
    console.error('Errore eliminazione materiale:', error);
    
    if (error.statusCode === 404) {
      return res.status(404).json(ResponseFormatter.error(
        error.message,
        'MATERIAL_NOT_FOUND'
      ));
    }
    
    if (error.statusCode === 400) {
      return res.status(400).json(ResponseFormatter.error(
        error.message,
        'MATERIAL_IN_USE'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'eliminazione del materiale',
      'MATERIAL_DELETE_ERROR'
    ));
  }
});

// ========== IMPORT/EXPORT ==========

// POST /api/intervention-reports/materials/import
router.post('/import', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    if (!req.body.materials || !Array.isArray(req.body.materials)) {
      return res.status(400).json(ResponseFormatter.error(
        'Formato dati non valido',
        'INVALID_IMPORT_FORMAT'
      ));
    }
    
    const result = await interventionMaterialService.importMaterials(req.body.materials);
    
    return res.json(ResponseFormatter.success(
      result,
      `Import completato: ${result.success} importati, ${result.failed} falliti`
    ));
  } catch (error) {
    console.error('Errore import materiali:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore durante l\'importazione dei materiali',
      'IMPORT_ERROR'
    ));
  }
});

// GET /api/intervention-reports/materials/export
router.get('/export', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const result = await interventionMaterialService.exportMaterials(req.query);
    
    return res.json(ResponseFormatter.success(
      result,
      'Export materiali completato'
    ));
  } catch (error) {
    console.error('Errore export materiali:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore durante l\'esportazione dei materiali',
      'EXPORT_ERROR'
    ));
  }
});

export default router;
