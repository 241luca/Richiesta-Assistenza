import { Router, Request, Response } from 'express';
import { customFormService } from '../services/customForm.service';
import { validate } from '../middleware/validate';
import { body, param, query } from 'express-validator';

const router = Router();

/**
 * GET /api/custom-forms/templates
 * Ottiene tutti i template condivisi
 */
router.get('/templates', [
  query('subcategoryId').optional().isUUID().withMessage('subcategoryId deve essere un UUID valido'),
  query('search').optional().isString().withMessage('search deve essere una stringa'),
  validate
], async (req: Request, res: Response) => {
  try {
    const filters = {
      subcategoryId: req.query.subcategoryId as string,
      search: req.query.search as string
    };

    const result = await customFormService.getTemplates(filters);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error: unknown) {
    console.error('Errore nella route GET /custom-forms/templates:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Errore sconosciuto'
    });
  }
});

/**
 * POST /api/custom-forms/:id/clone
 * Clona un template/form esistente
 */
router.post('/:id/clone', [
  param('id').isLength({ min: 25, max: 25 }).withMessage('ID deve essere un CUID valido'),
  body('newName').optional().isString().withMessage('newName deve essere una stringa'),
  validate
], async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { newName } = req.body;

    const result = await customFormService.cloneForm(id, userId, newName, req);
    res.status(result.success ? 201 : 400).json(result);
  } catch (error: unknown) {
    console.error('Errore nella route POST /custom-forms/:id/clone:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Errore sconosciuto'
    });
  }
});

/**
 * PATCH /api/custom-forms/:id/template
 * Marca o rimuove un form come template condiviso
 */
router.patch('/:id/template', [
  param('id').isLength({ min: 25, max: 25 }).withMessage('ID deve essere un CUID valido'),
  body('isTemplate').isBoolean().withMessage('isTemplate deve essere un boolean'),
  validate
], async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { isTemplate } = req.body;

    const result = isTemplate 
      ? await customFormService.markAsTemplate(id, userId, req)
      : await customFormService.unmarkAsTemplate(id, userId, req);
    
    res.status(result.success ? 200 : 400).json(result);
  } catch (error: unknown) {
    console.error('Errore nella route PATCH /custom-forms/:id/template:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Errore sconosciuto'
    });
  }
});

/**
 * GET /api/custom-forms
 * Ottiene tutti i custom forms con filtri opzionali
 */
router.get('/', [
  query('subcategoryId').optional().isUUID().withMessage('subcategoryId deve essere un UUID valido'),
  // professionalId può essere un UUID o la stringa "null" per i template
  query('professionalId').optional().custom((value) => {
    if (value === 'null') return true;
    if (!value) return true;
    // Validazione UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }).withMessage('professionalId deve essere un UUID valido o "null"'),
  query('isPublished').optional().isBoolean().withMessage('isPublished deve essere un boolean'),
  query('isDefault').optional().isBoolean().withMessage('isDefault deve essere un boolean'),
  query('displayType').optional().isIn(['SIMPLE', 'STANDARD', 'ADVANCED']).withMessage('displayType non valido'),
  query('search').optional().isString().withMessage('search deve essere una stringa'),
  query('isProfessionalView').optional().isBoolean().withMessage('isProfessionalView deve essere un boolean'),
  validate
], async (req: Request, res: Response) => {
  try {
    const filters = {
      subcategoryId: req.query.subcategoryId as string,
      // Converti stringa "null" in null effettivo per i template
      professionalId: req.query.professionalId === 'null' ? null : (req.query.professionalId as string),
      isPublished: req.query.isPublished ? req.query.isPublished === 'true' : undefined,
      isDefault: req.query.isDefault ? req.query.isDefault === 'true' : undefined,
      displayType: req.query.displayType as any,
      search: req.query.search as string,
      isProfessionalView: req.query.isProfessionalView ? req.query.isProfessionalView === 'true' : undefined,
      professionalSubcategoryIds: req.query.professionalSubcategoryIds ? 
        (req.query.professionalSubcategoryIds as string).split(',') : undefined
    };

    const result = await customFormService.getAllCustomForms(filters);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error: unknown) {
    console.error('Errore nella route GET /custom-forms:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Errore sconosciuto'
    });
  }
});

/**
 * GET /api/custom-forms/stats
 * Ottiene le statistiche sui custom forms
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const result = await customFormService.getCustomFormStats();
    res.status(result.success ? 200 : 500).json(result);
  } catch (error: unknown) {
    console.error('Errore nella route GET /custom-forms/stats:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Errore sconosciuto'
    });
  }
});

/**
 * GET /api/custom-forms/professional/:professionalId
 * Ottiene i custom forms per un professionista specifico
 */
router.get('/professional/:professionalId', [
  param('professionalId').isUUID().withMessage('professionalId deve essere un UUID valido'),
  validate
], async (req: Request, res: Response) => {
  try {
    console.log('[CustomFormsRoute] Route chiamata per professionalId:', req.params.professionalId);
    const { professionalId } = req.params;
    console.log('[CustomFormsRoute] Chiamando service...');

    // Aggiungi timeout per evitare hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 30000); // 30 secondi
    });

    const servicePromise = customFormService.getCustomFormsByProfessional(professionalId);

    const result: any = await Promise.race([servicePromise, timeoutPromise]);
    console.log('[CustomFormsRoute] Risultato service:', result.success, result.message);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error: unknown) {
    console.error('Errore nella route GET /custom-forms/professional:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Errore sconosciuto'
    });
  }
});

/**
 * GET /api/custom-forms/subcategory/:subcategoryId
 * Ottiene i custom forms per una sottocategoria specifica
 */
router.get('/subcategory/:subcategoryId', [
  param('subcategoryId').isUUID().withMessage('subcategoryId deve essere un UUID valido'),
  validate
], async (req: Request, res: Response) => {
  try {
    const { subcategoryId } = req.params;
    const result = await customFormService.getCustomFormsBySubcategory(subcategoryId);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error: unknown) {
    console.error('Errore nella route GET /custom-forms/subcategory:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Errore sconosciuto'
    });
  }
});

/**
 * GET /api/custom-forms/:id
 * Ottiene un custom form specifico per ID
 */
router.get('/:id', [
  param('id').isLength({ min: 25, max: 25 }).withMessage('ID deve essere un CUID valido'),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await customFormService.getCustomFormById(id);
    res.status(result.success ? 200 : (result.message?.includes('non trovato') ? 404 : 500)).json(result);
  } catch (error: unknown) {
    console.error('Errore nella route GET /custom-forms/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Errore sconosciuto'
    });
  }
});

/**
 * POST /api/custom-forms
 * Crea un nuovo custom form
 */
router.post('/', [
  body('name').notEmpty().withMessage('Nome è obbligatorio'),
  body('description').optional().isString().withMessage('Descrizione deve essere una stringa'),
  body('subcategoryId').isUUID().withMessage('subcategoryId deve essere un UUID valido'),
  body('professionalId').optional({ nullable: true }).custom((value) => {
    if (value === null) return true; // Template repository
    if (typeof value === 'string' && value.length > 0) {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(value)) throw new Error('professionalId deve essere un UUID valido');
    }
    return true;
  }),
  body('displayType').isIn(['SIMPLE', 'STANDARD', 'ADVANCED']).withMessage('displayType non valido'),
  body('fields').isArray().withMessage('Fields deve essere un array'),
  body('fields.*.code').optional().notEmpty().withMessage('Codice campo è obbligatorio'),
  body('fields.*.label').optional().notEmpty().withMessage('Label campo è obbligatorio'),
  body('fields.*.fieldType').optional().isIn(['TEXT', 'TEXTAREA', 'NUMBER', 'EMAIL', 'PHONE', 'DATE', 'TIME', 'DATETIME', 'SELECT', 'MULTISELECT', 'RADIO', 'CHECKBOX', 'FILE', 'IMAGE', 'BOOLEAN', 'URL', 'PASSWORD', 'HIDDEN']).withMessage('Tipo campo non valido'),
  body('fields.*.displayOrder').optional().isInt({ min: 0 }).withMessage('Ordine visualizzazione deve essere un numero positivo'),
  validate
], async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const result = await customFormService.createCustomForm(req.body, userId, req);
    res.status(result.success ? 201 : 500).json(result);
  } catch (error: unknown) {
    console.error('Errore nella route POST /custom-forms:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Errore sconosciuto'
    });
  }
});

/**
 * PUT /api/custom-forms/:id
 * Aggiorna un custom form esistente
 */
router.put('/:id', [
  param('id').isLength({ min: 25, max: 25 }).withMessage('ID deve essere un CUID valido'),
  body('name').optional().notEmpty().withMessage('Nome non può essere vuoto'),
  body('description').optional().isString().withMessage('Descrizione deve essere una stringa'),
  body('subcategoryId').optional().isUUID().withMessage('subcategoryId deve essere un UUID valido'),
  body('professionalId').optional().isUUID().withMessage('professionalId deve essere un UUID valido'),
  body('displayType').optional().isIn(['SIMPLE', 'STANDARD', 'ADVANCED']).withMessage('displayType non valido'),
  body('fields').optional().isArray().withMessage('Fields deve essere un array'),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const result = await customFormService.updateCustomForm(id, req.body, userId, req);
    res.status(result.success ? 200 : (result.message?.includes('non trovato') ? 404 : 500)).json(result);
  } catch (error: unknown) {
    console.error('Errore nella route PUT /custom-forms/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Errore sconosciuto'
    });
  }
});

/**
 * POST /api/custom-forms/:id/publish
 * Pubblica un custom form
 */
router.post('/:id/publish', [
  param('id').isLength({ min: 25, max: 25 }).withMessage('ID deve essere un CUID valido'),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const result = await customFormService.publishCustomForm(id, userId, req);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error: unknown) {
    console.error('Errore nella route POST /custom-forms/:id/publish:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Errore sconosciuto'
    });
  }
});

/**
 * PATCH /api/custom-forms/:id/set-default
 * Imposta un custom form come default per una sottocategoria
 */
router.patch('/:id/set-default', [
  param('id').isLength({ min: 25, max: 25 }).withMessage('ID deve essere un CUID valido'),
  body('subcategoryId').isUUID().withMessage('subcategoryId deve essere un UUID valido'),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { subcategoryId } = req.body;
    const userId = (req as any).user.id;
    const result = await customFormService.setDefaultCustomForm(id, subcategoryId, userId, req);
    res.status(result.success ? 200 : (result.message?.includes('non trovato') ? 404 : 500)).json(result);
  } catch (error: unknown) {
    console.error('Errore nella route PATCH /custom-forms/:id/set-default:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Errore sconosciuto'
    });
  }
});

/**
 * DELETE /api/custom-forms/:id
 * Elimina un custom form
 */
router.delete('/:id', [
  param('id').isLength({ min: 25, max: 25 }).withMessage('ID deve essere un CUID valido'),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const result = await customFormService.deleteCustomForm(id, userId, req);
    res.status(result.success ? 200 : 500).json(result);
  } catch (error: unknown) {
    console.error('Errore nella route DELETE /custom-forms/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Errore sconosciuto'
    });
  }
});

/**
 * POST /api/custom-forms/:id/send
 * Invia un form a una richiesta di assistenza
 */
router.post('/:id/send', [
  param('id').isLength({ min: 25, max: 25 }).withMessage('ID deve essere un CUID valido'),
  body('requestId').notEmpty().withMessage('requestId è obbligatorio'),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { requestId } = req.body;
    const userId = (req as any).user.id;
    const result = await customFormService.sendFormToRequest(id, requestId, userId, req);
    res.status(result.success ? 201 : (result.message?.includes('già') ? 409 : 400)).json(result);
  } catch (error: unknown) {
    console.error('Errore nella route POST /custom-forms/:id/send:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Errore sconosciuto'
    });
  }
});

/**
 * POST /api/request-forms/:id/save-draft
 * Salva bozza risposte form
 */
router.post('/request-forms/:id/save-draft', [
  param('id').isLength({ min: 25, max: 25 }).withMessage('ID deve essere un CUID valido'),
  body('responses').isArray().withMessage('responses deve essere un array'),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { responses } = req.body;
    const userId = (req as any).user.id;
    const result = await customFormService.saveDraft(id, responses, userId, req);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error: unknown) {
    console.error('Errore nella route POST /request-forms/:id/save-draft:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Errore sconosciuto'
    });
  }
});

/**
 * POST /api/request-forms/:id/submit
 * Invia risposte finali form
 */
router.post('/request-forms/:id/submit', [
  param('id').isLength({ min: 25, max: 25 }).withMessage('ID deve essere un CUID valido'),
  body('responses').isArray().withMessage('responses deve essere un array'),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { responses } = req.body;
    const userId = (req as any).user.id;
    const result = await customFormService.submitForm(id, responses, userId, req);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error: unknown) {
    console.error('Errore nella route POST /request-forms/:id/submit:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Errore sconosciuto'
    });
  }
});

export default router;