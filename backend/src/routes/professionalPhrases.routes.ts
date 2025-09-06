import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { ResponseFormatter } from '../utils/responseFormatter';
import professionalPhrasesService from '../services/professionalPhrases.service';

const router = Router();

// Middleware per verificare che sia un professionista
const requireProfessional = requireRole(['PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN']);

// GET /api/professional/phrases - Ottieni tutte le frasi del professionista
router.get('/phrases', authenticate, requireProfessional, async (req: any, res) => {
  try {
    const professionalId = req.user.id;
    const phrases = await professionalPhrasesService.getAllByProfessional(professionalId);
    
    return res.json(ResponseFormatter.success(
      phrases,
      'Frasi recuperate con successo'
    ));
  } catch (error) {
    console.error('Error fetching phrases:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero delle frasi',
      'PHRASES_FETCH_ERROR'
    ));
  }
});

// GET /api/professional/phrases/search - Cerca frasi
router.get('/phrases/search', authenticate, requireProfessional, async (req: any, res) => {
  try {
    const professionalId = req.user.id;
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json(ResponseFormatter.error(
        'Query di ricerca mancante',
        'MISSING_QUERY'
      ));
    }
    
    const phrases = await professionalPhrasesService.search(professionalId, q);
    
    return res.json(ResponseFormatter.success(
      phrases,
      'Ricerca completata'
    ));
  } catch (error) {
    console.error('Error searching phrases:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella ricerca',
      'SEARCH_ERROR'
    ));
  }
});

// GET /api/professional/phrases/category/:category - Ottieni frasi per categoria
router.get('/phrases/category/:category', authenticate, requireProfessional, async (req: any, res) => {
  try {
    const professionalId = req.user.id;
    const { category } = req.params;
    
    const phrases = await professionalPhrasesService.getByCategory(professionalId, category);
    
    return res.json(ResponseFormatter.success(
      phrases,
      'Frasi recuperate con successo'
    ));
  } catch (error) {
    console.error('Error fetching phrases by Category:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero delle frasi',
      'PHRASES_FETCH_ERROR'
    ));
  }
});

// GET /api/professional/phrases/export - Esporta frasi
router.get('/phrases/export', authenticate, requireProfessional, async (req: any, res) => {
  try {
    const professionalId = req.user.id;
    const phrases = await professionalPhrasesService.export(professionalId);
    
    // Imposta headers per download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="frasi-professionali.json"');
    
    return res.json(phrases);
  } catch (error) {
    console.error('Error exporting phrases:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'esportazione',
      'EXPORT_ERROR'
    ));
  }
});

// GET /api/professional/phrases/:id - Ottieni singola frase
router.get('/phrases/:id', authenticate, requireProfessional, async (req: any, res) => {
  try {
    const professionalId = req.user.id;
    const phraseId = parseInt(req.params.id);
    
    if (isNaN(phraseId)) {
      return res.status(400).json(ResponseFormatter.error(
        'ID frase non valido',
        'INVALID_ID'
      ));
    }
    
    const phrase = await professionalPhrasesService.getById(phraseId, professionalId);
    
    return res.json(ResponseFormatter.success(
      phrase,
      'Frase recuperata con successo'
    ));
  } catch (error: any) {
    console.error('Error fetching phrase:', error);
    
    if (error.message === 'Frase non trovata') {
      return res.status(404).json(ResponseFormatter.error(
        'Frase non trovata',
        'PHRASE_NOT_FOUND'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero della frase',
      'PHRASE_FETCH_ERROR'
    ));
  }
});

// POST /api/professional/phrases - Crea nuova frase
router.post('/phrases', authenticate, requireProfessional, async (req: any, res) => {
  try {
    const professionalId = req.user.id;
    const { category, code, title, content, isFavorite } = req.body;
    
    // Validazione
    if (!category || !title || !content) {
      return res.status(400).json(ResponseFormatter.error(
        'Dati mancanti: category, title e content sono obbligatori',
        'MISSING_DATA'
      ));
    }
    
    const validCategories = ['problem', 'solution', 'recommendation', 'note'];
    if (!validCategories.includes(category)) {
      return res.status(400).json(ResponseFormatter.error(
        'Categoria non valida',
        'INVALID_CATEGORY'
      ));
    }
    
    const phrase = await professionalPhrasesService.create({
      professionalId,
      category,
      code: code || '',
      title,
      content,
      isFavorite: isFavorite || false
    });
    
    return res.status(201).json(ResponseFormatter.success(
      phrase,
      'Frase creata con successo'
    ));
  } catch (error) {
    console.error('Error creating phrase:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella creazione della frase',
      'CREATE_ERROR'
    ));
  }
});

// PUT /api/professional/phrases/:id - Aggiorna frase
router.put('/phrases/:id', authenticate, requireProfessional, async (req: any, res) => {
  try {
    const professionalId = req.user.id;
    const phraseId = parseInt(req.params.id);
    
    if (isNaN(phraseId)) {
      return res.status(400).json(ResponseFormatter.error(
        'ID frase non valido',
        'INVALID_ID'
      ));
    }
    
    const phrase = await professionalPhrasesService.update(phraseId, professionalId, req.body);
    
    return res.json(ResponseFormatter.success(
      phrase,
      'Frase aggiornata con successo'
    ));
  } catch (error: any) {
    console.error('Error updating phrase:', error);
    
    if (error.message === 'Frase non trovata') {
      return res.status(404).json(ResponseFormatter.error(
        'Frase non trovata',
        'PHRASE_NOT_FOUND'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento della frase',
      'UPDATE_ERROR'
    ));
  }
});

// DELETE /api/professional/phrases/:id - Elimina frase
router.delete('/phrases/:id', authenticate, requireProfessional, async (req: any, res) => {
  try {
    const professionalId = req.user.id;
    const phraseId = parseInt(req.params.id);
    
    if (isNaN(phraseId)) {
      return res.status(400).json(ResponseFormatter.error(
        'ID frase non valido',
        'INVALID_ID'
      ));
    }
    
    await professionalPhrasesService.delete(phraseId, professionalId);
    
    return res.json(ResponseFormatter.success(
      null,
      'Frase eliminata con successo'
    ));
  } catch (error: any) {
    console.error('Error deleting phrase:', error);
    
    if (error.message === 'Frase non trovata') {
      return res.status(404).json(ResponseFormatter.error(
        'Frase non trovata',
        'PHRASE_NOT_FOUND'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'eliminazione della frase',
      'DELETE_ERROR'
    ));
  }
});

// POST /api/professional/phrases/:id/favorite - Toggle preferito
router.post('/phrases/:id/favorite', authenticate, requireProfessional, async (req: any, res) => {
  try {
    const professionalId = req.user.id;
    const phraseId = parseInt(req.params.id);
    
    if (isNaN(phraseId)) {
      return res.status(400).json(ResponseFormatter.error(
        'ID frase non valido',
        'INVALID_ID'
      ));
    }
    
    const phrase = await professionalPhrasesService.toggleFavorite(phraseId, professionalId);
    
    return res.json(ResponseFormatter.success(
      phrase,
      'Stato preferito aggiornato'
    ));
  } catch (error: any) {
    console.error('Error toggling favorite:', error);
    
    if (error.message === 'Frase non trovata') {
      return res.status(404).json(ResponseFormatter.error(
        'Frase non trovata',
        'PHRASE_NOT_FOUND'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento',
      'UPDATE_ERROR'
    ));
  }
});

// POST /api/professional/phrases/:id/use - Incrementa utilizzo
router.post('/phrases/:id/use', authenticate, requireProfessional, async (req: any, res) => {
  try {
    const phraseId = parseInt(req.params.id);
    
    if (isNaN(phraseId)) {
      return res.status(400).json(ResponseFormatter.error(
        'ID frase non valido',
        'INVALID_ID'
      ));
    }
    
    const phrase = await professionalPhrasesService.incrementUsage(phraseId);
    
    return res.json(ResponseFormatter.success(
      phrase,
      'Utilizzo registrato'
    ));
  } catch (error) {
    console.error('Error incrementing usage:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento',
      'UPDATE_ERROR'
    ));
  }
});

// POST /api/professional/phrases/import - Importa frasi da CSV/JSON
router.post('/phrases/import', authenticate, requireProfessional, async (req: any, res) => {
  try {
    const professionalId = req.user.id;
    const { phrases } = req.body;
    
    if (!phrases || !Array.isArray(phrases)) {
      return res.status(400).json(ResponseFormatter.error(
        'Formato dati non valido',
        'INVALID_FORMAT'
      ));
    }
    
    const imported = await professionalPhrasesService.importFromCSV(professionalId, phrases);
    
    return res.json(ResponseFormatter.success(
      {
        count: imported.length,
        phrases: imported
      },
      `${imported.length} frasi importate con successo`
    ));
  } catch (error) {
    console.error('Error importing phrases:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'importazione',
      'IMPORT_ERROR'
    ));
  }
});

export default router;
