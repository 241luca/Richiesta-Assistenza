/**
 * Admin Modules Routes
 * API per gestione completa sistema moduli
 * 
 * Responsabilità:
 * - CRUD moduli e configurazioni
 * - Abilitazione/Disabilitazione con validazione dipendenze
 * - Gestione settings moduli
 * - Storico modifiche con audit
 * - Statistics e monitoring
 * 
 * @module routes/admin/modules
 * @version 1.0.0
 * @updated 2025-10-06
 * @author Sistema Richiesta Assistenza
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { moduleService } from '../../services/module.service';
import { ResponseFormatter } from '../../utils/responseFormatter';
import { logger } from '../../utils/logger';

const router = Router();

// ============================================
// MIDDLEWARE GLOBALI
// ============================================

/**
 * Tutti gli endpoint richiedono autenticazione ADMIN o SUPER_ADMIN
 * Sistema moduli è area riservata agli amministratori
 */
router.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN'));

// ============================================
// ROUTES LETTURA MODULI
// ============================================

/**
 * GET /api/admin/modules
 * Ottieni tutti i moduli con filtri opzionali
 * 
 * Query Parameters:
 * - category: ModuleCategory (CORE, BUSINESS, ADMIN, INTEGRATION, FEATURE)
 * - isEnabled: boolean
 * - isCore: boolean  
 * - search: string (cerca in name, description, code)
 * 
 * @returns {Object} Lista moduli con conteggi settings/history
 * 
 * @example
 * GET /api/admin/modules?category=CORE&isEnabled=true
 * GET /api/admin/modules?search=whats
 */
router.get('/', async (req, res) => {
  try {
    logger.info('[ModulesRoutes] Fetching all modules', {
      userId: req.user.id,
      query: req.query
    });

    const filters = {
      category: req.query.category as any,
      isEnabled: req.query.isEnabled !== undefined ? req.query.isEnabled === 'true' : undefined,
      isCore: req.query.isCore !== undefined ? req.query.isCore === 'true' : undefined,
      search: req.query.search as string
    };

    // Rimuovi filtri undefined
    Object.keys(filters).forEach(key => 
      filters[key] === undefined && delete filters[key]
    );

    const modules = await moduleService.getAllModules(filters);
    
    return res.json(ResponseFormatter.success(
      modules,
      'Moduli recuperati con successo'
    ));
  } catch (error: any) {
    logger.error('[ModulesRoutes] Error fetching modules:', {
      error: error.message,
      userId: req.user.id,
      stack: error.stack
    });
    
    return res.status(500).json(
      ResponseFormatter.error(
        'Errore nel recupero moduli',
        'FETCH_ERROR'
      )
    );
  }
});

/**
 * GET /api/admin/modules/category/:category
 * Ottieni moduli filtrati per categoria
 * 
 * @param {string} category - Categoria moduli (CORE, BUSINESS, etc.)
 * @returns {Object} Lista moduli della categoria
 * 
 * @example
 * GET /api/admin/modules/category/CORE
 */
router.get('/category/:category', async (req, res) => {
  try {
    logger.info('[ModulesRoutes] Fetching modules by category', {
      category: req.params.category,
      userId: req.user.id
    });

    const modules = await moduleService.getModulesByCategory(
      req.params.category as any
    );
    
    return res.json(ResponseFormatter.success(
      modules,
      `Moduli categoria ${req.params.category} recuperati con successo`
    ));
  } catch (error: any) {
    logger.error('[ModulesRoutes] Error fetching modules by category:', {
      error: error.message,
      category: req.params.category,
      userId: req.user.id,
      stack: error.stack
    });
    
    return res.status(400).json(
      ResponseFormatter.error(
        'Categoria non valida o errore recupero',
        'CATEGORY_ERROR'
      )
    );
  }
});

/**
 * GET /api/admin/modules/:code
 * Ottieni singolo modulo con dati completi
 * 
 * @param {string} code - Codice modulo
 * @returns {Object} Modulo con settings, history e conteggi
 * 
 * @example
 * GET /api/admin/modules/reviews
 */
router.get('/:code', async (req, res) => {
  try {
    logger.info('[ModulesRoutes] Fetching module by code', {
      code: req.params.code,
      userId: req.user.id
    });

    const module = await moduleService.getModuleByCode(req.params.code);
    
    return res.json(ResponseFormatter.success(
      module,
      'Modulo recuperato con successo'
    ));
  } catch (error: any) {
    logger.error('[ModulesRoutes] Error fetching module by code:', {
      error: error.message,
      code: req.params.code,
      userId: req.user.id,
      stack: error.stack
    });
    
    return res.status(404).json(
      ResponseFormatter.error(
        'Modulo non trovato',
        'MODULE_NOT_FOUND'
      )
    );
  }
});

// ============================================
// ROUTES ABILITAZIONE/DISABILITAZIONE
// ============================================

/**
 * POST /api/admin/modules/:code/enable
 * Abilita modulo con validazione dipendenze
 * 
 * Body:
 * - reason: string (opzionale, motivo abilitazione)
 * 
 * @param {string} code - Codice modulo da abilitare
 * @returns {Object} Modulo aggiornato
 * 
 * @example
 * POST /api/admin/modules/portfolio/enable
 * { "reason": "Test enable from API" }
 */
router.post('/:code/enable', async (req, res) => {
  try {
    logger.info('[ModulesRoutes] Enabling module', {
      code: req.params.code,
      userId: req.user.id,
      reason: req.body.reason
    });

    const module = await moduleService.enableModule(
      req.params.code,
      req.user.id,
      req.body.reason
    );
    
    return res.json(
      ResponseFormatter.success(
        module, 
        'Modulo abilitato con successo'
      )
    );
  } catch (error: any) {
    logger.error('[ModulesRoutes] Error enabling module:', {
      error: error.message,
      code: req.params.code,
      userId: req.user.id,
      stack: error.stack
    });
    
    return res.status(400).json(
      ResponseFormatter.error(
        error.message,
        'ENABLE_ERROR'
      )
    );
  }
});

/**
 * POST /api/admin/modules/:code/disable
 * Disabilita modulo con validazione moduli dipendenti
 * 
 * Body:
 * - reason: string (opzionale, motivo disabilitazione)
 * 
 * @param {string} code - Codice modulo da disabilitare
 * @returns {Object} Modulo aggiornato
 * 
 * @example
 * POST /api/admin/modules/portfolio/disable
 * { "reason": "Test disable" }
 */
router.post('/:code/disable', async (req, res) => {
  try {
    logger.info('[ModulesRoutes] Disabling module', {
      code: req.params.code,
      userId: req.user.id,
      reason: req.body.reason
    });

    const module = await moduleService.disableModule(
      req.params.code,
      req.user.id,
      req.body.reason
    );
    
    return res.json(
      ResponseFormatter.success(
        module, 
        'Modulo disabilitato con successo'
      )
    );
  } catch (error: any) {
    logger.error('[ModulesRoutes] Error disabling module:', {
      error: error.message,
      code: req.params.code,
      userId: req.user.id,
      stack: error.stack
    });
    
    return res.status(400).json(
      ResponseFormatter.error(
        error.message,
        'DISABLE_ERROR'
      )
    );
  }
});

// ============================================
// ROUTES CONFIGURAZIONE
// ============================================

/**
 * PUT /api/admin/modules/:code/config
 * Aggiorna configurazione JSON modulo
 * 
 * Body:
 * - config: Object (nuova configurazione JSON)
 * 
 * @param {string} code - Codice modulo
 * @returns {Object} Modulo aggiornato
 * 
 * @example
 * PUT /api/admin/modules/whatsapp/config
 * { "config": { "timeout": 5000, "retries": 3 } }
 */
router.put('/:code/config', async (req, res) => {
  try {
    logger.info('[ModulesRoutes] Updating module config', {
      code: req.params.code,
      userId: req.user.id,
      config: req.body.config
    });

    const module = await moduleService.updateModuleConfig(
      req.params.code,
      req.body.config,
      req.user.id
    );
    
    return res.json(
      ResponseFormatter.success(
        module, 
        'Configurazione aggiornata con successo'
      )
    );
  } catch (error: any) {
    logger.error('[ModulesRoutes] Error updating module config:', {
      error: error.message,
      code: req.params.code,
      userId: req.user.id,
      stack: error.stack
    });
    
    return res.status(400).json(
      ResponseFormatter.error(
        error.message,
        'CONFIG_UPDATE_ERROR'
      )
    );
  }
});

// ============================================
// ROUTES SETTINGS
// ============================================

/**
 * GET /api/admin/modules/:code/settings
 * Ottieni tutti i settings di un modulo
 * 
 * @param {string} code - Codice modulo
 * @returns {Object} Lista settings ordinati per categoria e ordine
 * 
 * @example
 * GET /api/admin/modules/whatsapp/settings
 */
router.get('/:code/settings', async (req, res) => {
  try {
    logger.info('[ModulesRoutes] Fetching module settings', {
      code: req.params.code,
      userId: req.user.id
    });

    const settings = await moduleService.getModuleSettings(req.params.code);
    
    return res.json(ResponseFormatter.success(
      settings,
      'Settings recuperati con successo'
    ));
  } catch (error: any) {
    logger.error('[ModulesRoutes] Error fetching module settings:', {
      error: error.message,
      code: req.params.code,
      userId: req.user.id,
      stack: error.stack
    });
    
    return res.status(400).json(
      ResponseFormatter.error(
        'Errore nel recupero settings',
        'SETTINGS_FETCH_ERROR'
      )
    );
  }
});

/**
 * PUT /api/admin/modules/:code/settings/:key
 * Aggiorna singolo setting di un modulo
 * 
 * Body:
 * - value: string (nuovo valore)
 * 
 * @param {string} code - Codice modulo
 * @param {string} key - Chiave setting
 * @returns {Object} Setting aggiornato
 * 
 * @example
 * PUT /api/admin/modules/whatsapp/settings/session_name
 * { "value": "production" }
 */
router.put('/:code/settings/:key', async (req, res) => {
  try {
    logger.info('[ModulesRoutes] Updating module setting', {
      code: req.params.code,
      key: req.params.key,
      value: req.body.value,
      userId: req.user.id
    });

    const setting = await moduleService.updateModuleSetting(
      req.params.code,
      req.params.key,
      req.body.value,
      req.user.id
    );
    
    return res.json(
      ResponseFormatter.success(
        setting, 
        'Setting aggiornato con successo'
      )
    );
  } catch (error: any) {
    logger.error('[ModulesRoutes] Error updating module setting:', {
      error: error.message,
      code: req.params.code,
      key: req.params.key,
      userId: req.user.id,
      stack: error.stack
    });
    
    return res.status(400).json(
      ResponseFormatter.error(
        error.message,
        'SETTING_UPDATE_ERROR'
      )
    );
  }
});

// ============================================
// ROUTES HISTORY & AUDIT
// ============================================

/**
 * GET /api/admin/modules/:code/history
 * Ottieni storico modifiche modulo
 * 
 * Query Parameters:
 * - limit: number (default: 50, max record)
 * 
 * @param {string} code - Codice modulo
 * @returns {Object} Lista modifiche con dati utente
 * 
 * @example
 * GET /api/admin/modules/reviews/history?limit=10
 */
router.get('/:code/history', async (req, res) => {
  try {
    logger.info('[ModulesRoutes] Fetching module history', {
      code: req.params.code,
      limit: req.query.limit,
      userId: req.user.id
    });

    const limit = parseInt(req.query.limit as string) || 50;
    const history = await moduleService.getModuleHistory(
      req.params.code,
      limit
    );
    
    return res.json(ResponseFormatter.success(
      history,
      'Storico recuperato con successo'
    ));
  } catch (error: any) {
    logger.error('[ModulesRoutes] Error fetching module history:', {
      error: error.message,
      code: req.params.code,
      userId: req.user.id,
      stack: error.stack
    });
    
    return res.status(400).json(
      ResponseFormatter.error(
        'Errore nel recupero storico',
        'HISTORY_FETCH_ERROR'
      )
    );
  }
});

// ============================================
// ROUTES UTILITY & STATISTICS
// ============================================

/**
 * GET /api/admin/modules/stats
 * Ottieni statistiche aggregate moduli
 * 
 * @returns {Object} Statistiche complete sistema moduli
 * 
 * @example
 * GET /api/admin/modules/stats
 * Risposta: { total: 66, enabled: 65, disabled: 1, core: 12, byCategory: [...] }
 */
router.get('/stats', async (req, res) => {
  try {
    logger.info('[ModulesRoutes] Fetching module statistics', {
      userId: req.user.id
    });

    const stats = await moduleService.getModuleStats();
    
    return res.json(ResponseFormatter.success(
      stats,
      'Statistiche recuperate con successo'
    ));
  } catch (error: any) {
    logger.error('[ModulesRoutes] Error fetching module stats:', {
      error: error.message,
      userId: req.user.id,
      stack: error.stack
    });
    
    return res.status(500).json(
      ResponseFormatter.error(
        'Errore nel recupero statistiche',
        'STATS_ERROR'
      )
    );
  }
});

/**
 * GET /api/admin/modules/dependencies/validate
 * Valida integrità dipendenze sistema moduli
 * 
 * @returns {Object} Risultato validazione con errori e warning
 * 
 * @example
 * GET /api/admin/modules/dependencies/validate
 * Risposta: { valid: true, errors: [], warnings: [] }
 */
router.get('/dependencies/validate', async (req, res) => {
  try {
    logger.info('[ModulesRoutes] Validating module dependencies', {
      userId: req.user.id
    });

    const validation = await moduleService.validateDependencies();
    
    return res.json(ResponseFormatter.success(
      validation,
      validation.valid ? 'Validazione completata: nessun errore' : 'Validazione completata: errori trovati'
    ));
  } catch (error: any) {
    logger.error('[ModulesRoutes] Error validating dependencies:', {
      error: error.message,
      userId: req.user.id,
      stack: error.stack
    });
    
    return res.status(500).json(
      ResponseFormatter.error(
        'Errore nella validazione dipendenze',
        'VALIDATION_ERROR'
      )
    );
  }
});

/**
 * GET /api/admin/modules/dependencies/list
 * Ottieni lista moduli con dipendenze configurate
 * 
 * @returns {Object} Lista moduli con dependsOn/requiredFor
 * 
 * @example
 * GET /api/admin/modules/dependencies/list
 */
router.get('/dependencies/list', async (req, res) => {
  try {
    logger.info('[ModulesRoutes] Fetching modules with dependencies', {
      userId: req.user.id
    });

    const modules = await moduleService.getModulesWithDependencies();
    
    return res.json(ResponseFormatter.success(
      modules,
      'Moduli con dipendenze recuperati con successo'
    ));
  } catch (error: any) {
    logger.error('[ModulesRoutes] Error fetching modules with dependencies:', {
      error: error.message,
      userId: req.user.id,
      stack: error.stack
    });
    
    return res.status(500).json(
      ResponseFormatter.error(
        'Errore nel recupero dipendenze',
        'DEPENDENCIES_ERROR'
      )
    );
  }
});

export default router;
