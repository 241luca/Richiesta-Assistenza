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
 * @version 1.0.1
 * @updated 2025-10-08
 * @author Sistema Richiesta Assistenza
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { moduleService } from '../../services/module.service';
import { ResponseFormatter } from '../../utils/responseFormatter';
import { logger } from '../../utils/logger';

const router = Router();

// ============================================
// TYPES & INTERFACES
// ============================================

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    fullName?: string;
  };
}

interface ModuleFilters {
  category?: string;
  isEnabled?: boolean;
  isCore?: boolean;
  search?: string;
}

interface UpdateConfigBody {
  config: Record<string, any>;
}

interface UpdateSettingBody {
  value: string;
}

interface ModuleActionBody {
  reason?: string;
}

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
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json(ResponseFormatter.error('Unauthorized', 'UNAUTHORIZED'));
    }

    logger.info('[ModulesRoutes] Fetching all modules', {
      userId: req.user.id,
      query: req.query
    });

    const filters: ModuleFilters = {};
    
    if (typeof req.query.category === 'string') {
      filters.category = req.query.category;
    }
    
    if (req.query.isEnabled !== undefined && typeof req.query.isEnabled === 'string') {
      filters.isEnabled = req.query.isEnabled === 'true';
    }
    
    if (req.query.isCore !== undefined && typeof req.query.isCore === 'string') {
      filters.isCore = req.query.isCore === 'true';
    }
    
    if (typeof req.query.search === 'string') {
      filters.search = req.query.search;
    }

    const modules = await moduleService.getAllModules(filters);
    
    return res.json(ResponseFormatter.success(
      modules,
      'Moduli recuperati con successo'
    ));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error('[ModulesRoutes] Error fetching modules:', {
      error: errorMessage,
      userId: req.user?.id,
      stack: errorStack
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
router.get('/category/:category', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json(ResponseFormatter.error('Unauthorized', 'UNAUTHORIZED'));
    }

    logger.info('[ModulesRoutes] Fetching modules by category', {
      category: req.params.category,
      userId: req.user.id
    });

    const modules = await moduleService.getModulesByCategory(req.params.category);
    
    return res.json(ResponseFormatter.success(
      modules,
      `Moduli categoria ${req.params.category} recuperati con successo`
    ));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error('[ModulesRoutes] Error fetching modules by category:', {
      error: errorMessage,
      category: req.params.category,
      userId: req.user?.id,
      stack: errorStack
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
router.get('/:code', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json(ResponseFormatter.error('Unauthorized', 'UNAUTHORIZED'));
    }

    logger.info('[ModulesRoutes] Fetching module by code', {
      code: req.params.code,
      userId: req.user.id
    });

    const module = await moduleService.getModuleByCode(req.params.code);
    
    return res.json(ResponseFormatter.success(
      module,
      'Modulo recuperato con successo'
    ));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error('[ModulesRoutes] Error fetching module by code:', {
      error: errorMessage,
      code: req.params.code,
      userId: req.user?.id,
      stack: errorStack
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
router.post('/:code/enable', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json(ResponseFormatter.error('Unauthorized', 'UNAUTHORIZED'));
    }

    const body = req.body as ModuleActionBody;

    logger.info('[ModulesRoutes] Enabling module', {
      code: req.params.code,
      userId: req.user.id,
      reason: body.reason
    });

    const module = await moduleService.enableModule(
      req.params.code,
      req.user.id,
      body.reason
    );
    
    return res.json(
      ResponseFormatter.success(
        module, 
        'Modulo abilitato con successo'
      )
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error('[ModulesRoutes] Error enabling module:', {
      error: errorMessage,
      code: req.params.code,
      userId: req.user?.id,
      stack: errorStack
    });
    
    return res.status(400).json(
      ResponseFormatter.error(
        errorMessage,
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
router.post('/:code/disable', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json(ResponseFormatter.error('Unauthorized', 'UNAUTHORIZED'));
    }

    const body = req.body as ModuleActionBody;

    logger.info('[ModulesRoutes] Disabling module', {
      code: req.params.code,
      userId: req.user.id,
      reason: body.reason
    });

    const module = await moduleService.disableModule(
      req.params.code,
      req.user.id,
      body.reason
    );
    
    return res.json(
      ResponseFormatter.success(
        module, 
        'Modulo disabilitato con successo'
      )
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error('[ModulesRoutes] Error disabling module:', {
      error: errorMessage,
      code: req.params.code,
      userId: req.user?.id,
      stack: errorStack
    });
    
    return res.status(400).json(
      ResponseFormatter.error(
        errorMessage,
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
router.put('/:code/config', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json(ResponseFormatter.error('Unauthorized', 'UNAUTHORIZED'));
    }

    const body = req.body as UpdateConfigBody;

    logger.info('[ModulesRoutes] Updating module config', {
      code: req.params.code,
      userId: req.user.id,
      config: body.config
    });

    const module = await moduleService.updateModuleConfig(
      req.params.code,
      body.config,
      req.user.id
    );
    
    return res.json(
      ResponseFormatter.success(
        module, 
        'Configurazione aggiornata con successo'
      )
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error('[ModulesRoutes] Error updating module config:', {
      error: errorMessage,
      code: req.params.code,
      userId: req.user?.id,
      stack: errorStack
    });
    
    return res.status(400).json(
      ResponseFormatter.error(
        errorMessage,
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
router.get('/:code/settings', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json(ResponseFormatter.error('Unauthorized', 'UNAUTHORIZED'));
    }

    logger.info('[ModulesRoutes] Fetching module settings', {
      code: req.params.code,
      userId: req.user.id
    });

    const settings = await moduleService.getModuleSettings(req.params.code);
    
    return res.json(ResponseFormatter.success(
      settings,
      'Settings recuperati con successo'
    ));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error('[ModulesRoutes] Error fetching module settings:', {
      error: errorMessage,
      code: req.params.code,
      userId: req.user?.id,
      stack: errorStack
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
router.put('/:code/settings/:key', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json(ResponseFormatter.error('Unauthorized', 'UNAUTHORIZED'));
    }

    const body = req.body as UpdateSettingBody;

    logger.info('[ModulesRoutes] Updating module setting', {
      code: req.params.code,
      key: req.params.key,
      value: body.value,
      userId: req.user.id
    });

    const setting = await moduleService.updateModuleSetting(
      req.params.code,
      req.params.key,
      body.value,
      req.user.id
    );
    
    return res.json(
      ResponseFormatter.success(
        setting, 
        'Setting aggiornato con successo'
      )
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error('[ModulesRoutes] Error updating module setting:', {
      error: errorMessage,
      code: req.params.code,
      key: req.params.key,
      userId: req.user?.id,
      stack: errorStack
    });
    
    return res.status(400).json(
      ResponseFormatter.error(
        errorMessage,
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
router.get('/:code/history', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json(ResponseFormatter.error('Unauthorized', 'UNAUTHORIZED'));
    }

    logger.info('[ModulesRoutes] Fetching module history', {
      code: req.params.code,
      limit: req.query.limit,
      userId: req.user.id
    });

    const limitQuery = req.query.limit;
    const limit = typeof limitQuery === 'string' ? parseInt(limitQuery, 10) : 50;
    
    const history = await moduleService.getModuleHistory(
      req.params.code,
      limit
    );
    
    return res.json(ResponseFormatter.success(
      history,
      'Storico recuperato con successo'
    ));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error('[ModulesRoutes] Error fetching module history:', {
      error: errorMessage,
      code: req.params.code,
      userId: req.user?.id,
      stack: errorStack
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
router.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json(ResponseFormatter.error('Unauthorized', 'UNAUTHORIZED'));
    }

    logger.info('[ModulesRoutes] Fetching module statistics', {
      userId: req.user.id
    });

    const stats = await moduleService.getModuleStats();
    
    return res.json(ResponseFormatter.success(
      stats,
      'Statistiche recuperate con successo'
    ));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error('[ModulesRoutes] Error fetching module stats:', {
      error: errorMessage,
      userId: req.user?.id,
      stack: errorStack
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
router.get('/dependencies/validate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json(ResponseFormatter.error('Unauthorized', 'UNAUTHORIZED'));
    }

    logger.info('[ModulesRoutes] Validating module dependencies', {
      userId: req.user.id
    });

    const validation = await moduleService.validateDependencies();
    
    return res.json(ResponseFormatter.success(
      validation,
      validation.valid ? 'Validazione completata: nessun errore' : 'Validazione completata: errori trovati'
    ));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error('[ModulesRoutes] Error validating dependencies:', {
      error: errorMessage,
      userId: req.user?.id,
      stack: errorStack
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
router.get('/dependencies/list', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json(ResponseFormatter.error('Unauthorized', 'UNAUTHORIZED'));
    }

    logger.info('[ModulesRoutes] Fetching modules with dependencies', {
      userId: req.user.id
    });

    const modules = await moduleService.getModulesWithDependencies();
    
    return res.json(ResponseFormatter.success(
      modules,
      'Moduli con dipendenze recuperati con successo'
    ));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error('[ModulesRoutes] Error fetching modules with dependencies:', {
      error: errorMessage,
      userId: req.user?.id,
      stack: errorStack
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
