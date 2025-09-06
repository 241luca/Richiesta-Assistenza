import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { ResponseFormatter } from '../utils/responseFormatter';
import interventionProfessionalService from '../services/interventionProfessional.service';

const router = Router();

// Middleware per verificare che l'utente sia un professionista
const requireProfessional = (req: any, res: any, next: any) => {
  if (req.user.role !== 'PROFESSIONAL' && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json(ResponseFormatter.error(
      'Accesso riservato ai professionisti',
      'PROFESSIONAL_ONLY'
    ));
  }
  next();
};

// ========== TEMPLATE PERSONALIZZATI ==========

// GET /api/intervention-reports/professional/templates
router.get('/templates', authenticate, requireProfessional, async (req: any, res) => {
  try {
    const templates = await interventionProfessionalService.getProfessionalTemplates(req.user.id);
    
    return res.json(ResponseFormatter.success(
      templates,
      'Template personalizzati recuperati con successo'
    ));
  } catch (error) {
    console.error('Errore recupero template personalizzati:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero dei template personalizzati',
      'TEMPLATES_FETCH_ERROR'
    ));
  }
});

// POST /api/intervention-reports/professional/templates
router.post('/templates', authenticate, requireProfessional, async (req: any, res) => {
  try {
    const template = await interventionProfessionalService.createProfessionalTemplate(
      req.user.id,
      req.body
    );
    
    return res.json(ResponseFormatter.success(
      template,
      'Template personalizzato creato con successo'
    ));
  } catch (error: any) {
    console.error('Errore creazione template personalizzato:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella creazione del template personalizzato',
      'TEMPLATE_CREATE_ERROR'
    ));
  }
});

// ========== FRASI RICORRENTI ==========

// GET /api/intervention-reports/professional/phrases
router.get('/phrases', authenticate, requireProfessional, async (req: any, res) => {
  try {
    const { category, search } = req.query;
    const phrases = await interventionProfessionalService.getProfessionalPhrases(
      req.user.id,
      category,
      search
    );
    
    return res.json(ResponseFormatter.success(
      phrases,
      'Frasi ricorrenti recuperate con successo'
    ));
  } catch (error) {
    console.error('Errore recupero frasi ricorrenti:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero delle frasi ricorrenti',
      'PHRASES_FETCH_ERROR'
    ));
  }
});

// POST /api/intervention-reports/professional/phrases
router.post('/phrases', authenticate, requireProfessional, async (req: any, res) => {
  try {
    const phrase = await interventionProfessionalService.createProfessionalPhrase(
      req.user.id,
      req.body
    );
    
    return res.json(ResponseFormatter.success(
      phrase,
      'Frase ricorrente creata con successo'
    ));
  } catch (error: any) {
    console.error('Errore creazione frase ricorrente:', error);
    
    if (error.statusCode === 400) {
      return res.status(400).json(ResponseFormatter.error(
        error.message,
        'PHRASE_VALIDATION_ERROR'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella creazione della frase ricorrente',
      'PHRASE_CREATE_ERROR'
    ));
  }
});

// PUT /api/intervention-reports/professional/phrases/:id
router.put('/phrases/:id', authenticate, requireProfessional, async (req: any, res) => {
  try {
    const phrase = await interventionProfessionalService.updateProfessionalPhrase(
      req.user.id,
      req.params.id,
      req.body
    );
    
    return res.json(ResponseFormatter.success(
      phrase,
      'Frase ricorrente aggiornata con successo'
    ));
  } catch (error: any) {
    console.error('Errore aggiornamento frase ricorrente:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento della frase ricorrente',
      'PHRASE_UPDATE_ERROR'
    ));
  }
});

// DELETE /api/intervention-reports/professional/phrases/:id
router.delete('/phrases/:id', authenticate, requireProfessional, async (req: any, res) => {
  try {
    await interventionProfessionalService.deleteProfessionalPhrase(
      req.user.id,
      req.params.id
    );
    
    return res.json(ResponseFormatter.success(
      null,
      'Frase ricorrente eliminata con successo'
    ));
  } catch (error) {
    console.error('Errore eliminazione frase ricorrente:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'eliminazione della frase ricorrente',
      'PHRASE_DELETE_ERROR'
    ));
  }
});

// POST /api/intervention-reports/professional/phrases/:id/favorite
router.post('/phrases/:id/favorite', authenticate, requireProfessional, async (req: any, res) => {
  try {
    const phrase = await interventionProfessionalService.togglePhraseFavorite(
      req.user.id,
      req.params.id,
      req.body.isFavorite
    );
    
    return res.json(ResponseFormatter.success(
      phrase,
      'Preferito aggiornato con successo'
    ));
  } catch (error) {
    console.error('Errore toggle preferito:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento del preferito',
      'FAVORITE_UPDATE_ERROR'
    ));
  }
});

// ========== MATERIALI PERSONALIZZATI ==========

// GET /api/intervention-reports/professional/materials
router.get('/materials', authenticate, requireProfessional, async (req: any, res) => {
  try {
    const { category, search } = req.query;
    const materials = await interventionProfessionalService.getProfessionalMaterials(
      req.user.id,
      category,
      search
    );
    
    return res.json(ResponseFormatter.success(
      materials,
      'Materiali personalizzati recuperati con successo'
    ));
  } catch (error) {
    console.error('Errore recupero materiali personalizzati:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero dei materiali personalizzati',
      'MATERIALS_FETCH_ERROR'
    ));
  }
});

// GET /api/intervention-reports/professional/material-categories
router.get('/material-categories', authenticate, requireProfessional, async (req: any, res) => {
  try {
    const categories = await interventionProfessionalService.getMaterialCategories(req.user.id);
    
    return res.json(ResponseFormatter.success(
      categories,
      'Categorie materiali recuperate con successo'
    ));
  } catch (error) {
    console.error('Errore recupero categorie materiali:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero delle categorie materiali',
      'CATEGORIES_FETCH_ERROR'
    ));
  }
});

// POST /api/intervention-reports/professional/materials
router.post('/materials', authenticate, requireProfessional, async (req: any, res) => {
  try {
    const material = await interventionProfessionalService.createProfessionalMaterial(
      req.user.id,
      req.body
    );
    
    return res.json(ResponseFormatter.success(
      material,
      'Materiale personalizzato creato con successo'
    ));
  } catch (error: any) {
    console.error('Errore creazione materiale personalizzato:', error);
    
    if (error.statusCode === 400) {
      return res.status(400).json(ResponseFormatter.error(
        error.message,
        'MATERIAL_VALIDATION_ERROR'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella creazione del materiale personalizzato',
      'MATERIAL_CREATE_ERROR'
    ));
  }
});

// PUT /api/intervention-reports/professional/materials/:id
router.put('/materials/:id', authenticate, requireProfessional, async (req: any, res) => {
  try {
    const material = await interventionProfessionalService.updateProfessionalMaterial(
      req.user.id,
      req.params.id,
      req.body
    );
    
    return res.json(ResponseFormatter.success(
      material,
      'Materiale personalizzato aggiornato con successo'
    ));
  } catch (error: any) {
    console.error('Errore aggiornamento materiale personalizzato:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento del materiale personalizzato',
      'MATERIAL_UPDATE_ERROR'
    ));
  }
});

// PATCH /api/intervention-reports/professional/materials/:id
router.patch('/materials/:id', authenticate, requireProfessional, async (req: any, res) => {
  try {
    const material = await interventionProfessionalService.toggleMaterialActive(
      req.user.id,
      req.params.id,
      req.body.isActive
    );
    
    return res.json(ResponseFormatter.success(
      material,
      'Stato materiale aggiornato con successo'
    ));
  } catch (error) {
    console.error('Errore toggle stato materiale:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento dello stato del materiale',
      'MATERIAL_STATUS_UPDATE_ERROR'
    ));
  }
});

// DELETE /api/intervention-reports/professional/materials/:id
router.delete('/materials/:id', authenticate, requireProfessional, async (req: any, res) => {
  try {
    await interventionProfessionalService.deleteProfessionalMaterial(
      req.user.id,
      req.params.id
    );
    
    return res.json(ResponseFormatter.success(
      null,
      'Materiale personalizzato eliminato con successo'
    ));
  } catch (error) {
    console.error('Errore eliminazione materiale personalizzato:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'eliminazione del materiale personalizzato',
      'MATERIAL_DELETE_ERROR'
    ));
  }
});

// ========== IMPOSTAZIONI ==========

// GET /api/intervention-reports/professional/settings
router.get('/settings', authenticate, requireProfessional, async (req: any, res) => {
  try {
    const settings = await interventionProfessionalService.getProfessionalSettings(req.user.id);
    
    return res.json(ResponseFormatter.success(
      settings,
      'Impostazioni recuperate con successo'
    ));
  } catch (error) {
    console.error('Errore recupero impostazioni:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero delle impostazioni',
      'SETTINGS_FETCH_ERROR'
    ));
  }
});

// PUT /api/intervention-reports/professional/settings
router.put('/settings', authenticate, requireProfessional, async (req: any, res) => {
  try {
    const settings = await interventionProfessionalService.updateProfessionalSettings(
      req.user.id,
      req.body
    );
    
    return res.json(ResponseFormatter.success(
      settings,
      'Impostazioni aggiornate con successo'
    ));
  } catch (error) {
    console.error('Errore aggiornamento impostazioni:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento delle impostazioni',
      'SETTINGS_UPDATE_ERROR'
    ));
  }
});

// ========== STATISTICHE ==========

// GET /api/intervention-reports/professional/stats
router.get('/stats', authenticate, requireProfessional, async (req: any, res) => {
  try {
    const { range = 'month' } = req.query;
    const stats = await interventionProfessionalService.getProfessionalStatistics(
      req.user.id,
      range
    );
    
    return res.json(ResponseFormatter.success(
      stats,
      'Statistiche recuperate con successo'
    ));
  } catch (error) {
    console.error('Errore recupero statistiche:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero delle statistiche',
      'STATISTICS_FETCH_ERROR'
    ));
  }
});

// GET /api/intervention-reports/professional/recent
router.get('/recent', authenticate, requireProfessional, async (req: any, res) => {
  try {
    const reports = await interventionProfessionalService.getRecentReports(
      req.user.id,
      req.query.limit || 10
    );
    
    return res.json(ResponseFormatter.success(
      reports,
      'Rapporti recenti recuperati con successo'
    ));
  } catch (error) {
    console.error('Errore recupero rapporti recenti:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero dei rapporti recenti',
      'RECENT_REPORTS_ERROR'
    ));
  }
});

export default router;
