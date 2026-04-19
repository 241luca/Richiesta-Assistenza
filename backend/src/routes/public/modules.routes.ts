/**
 * Public Modules Routes
 * API pubbliche per recuperare informazioni sui moduli
 * 
 * Responsabilità:
 * - Fornire informazioni sui moduli abilitati/disabilitati
 * - Esporre impostazioni pubbliche dei moduli
 * - Permettere al frontend di adattarsi allo stato dei moduli
 * 
 * @module routes/public/modules
 * @version 1.0.0
 * @created 2025-01-27
 * @author Sistema Richiesta Assistenza
 */

import { Router, Request, Response } from 'express';
import { moduleService } from '../../services/module.service';
import { ResponseFormatter } from '../../utils/responseFormatter';
import { logger } from '../../utils/logger';

const router = Router();

// ============================================
// PUBLIC ENDPOINTS - NO AUTH REQUIRED
// ============================================

/**
 * GET /api/public/modules/:code
 * Ottieni informazioni pubbliche di un modulo specifico
 * 
 * @param {string} code - Codice del modulo (es: 'image-management')
 * @returns {Object} Informazioni pubbliche del modulo
 * 
 * @example
 * GET /api/public/modules/image-management
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "code": "image-management",
 *     "name": "Gestione Immagini",
 *     "isEnabled": true,
 *     "settings": {
 *       "maxFileSize": "5242880",
 *       "allowedFormats": "jpg,jpeg,png,gif,webp",
 *       "enableAvatarUpload": "true",
 *       "enableImageRecognition": "false",
 *       "enableImageReminders": "true"
 *     }
 *   }
 * }
 */
router.get('/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    logger.info('[PublicModulesRoutes] Fetching module info', {
      code,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Recupera il modulo dal service
    const module = await moduleService.getModuleByCode(code);
    
    if (!module) {
      logger.warn('[PublicModulesRoutes] Module not found', { code });
      return res.status(404).json(
        ResponseFormatter.error(
          `Modulo '${code}' non trovato`,
          'MODULE_NOT_FOUND'
        )
      );
    }

    // Prepara le informazioni pubbliche del modulo
    const publicModuleInfo = {
      code: module.code,
      name: module.name,
      description: module.description,
      isEnabled: module.isEnabled,
      category: module.category,
      version: module.version,
      settings: module.ModuleSetting ? module.ModuleSetting.reduce((acc: Record<string, string>, setting: any) => {
        // Esponi solo le impostazioni pubbliche (non sensibili)
        const publicSettings = [
          'maxFileSize',
          'allowedFormats', 
          'enableAvatarUpload',
          'enableImageRecognition',
          'enableImageReminders',
          'reminderPosition',
          'reminderStyle',
          'storagePath'
        ];
        
        if (publicSettings.includes(setting.key)) {
          acc[setting.key] = setting.value;
        }
        
        return acc;
      }, {}) : {}
    };

    logger.info('[PublicModulesRoutes] Module info retrieved successfully', {
      code,
      isEnabled: module.isEnabled,
      settingsCount: Object.keys(publicModuleInfo.settings).length
    });

    return res.json(ResponseFormatter.success(
      publicModuleInfo,
      'Informazioni modulo recuperate con successo'
    ));

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error('[PublicModulesRoutes] Error fetching module info:', {
      error: errorMessage,
      code: req.params.code,
      stack: errorStack
    });
    
    return res.status(500).json(
      ResponseFormatter.error(
        'Errore nel recupero informazioni modulo',
        'FETCH_ERROR'
      )
    );
  }
});

/**
 * GET /api/public/modules
 * Ottieni lista dei moduli pubblici abilitati
 * 
 * @returns {Object} Lista moduli pubblici abilitati
 * 
 * @example
 * GET /api/public/modules
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "code": "image-management",
 *       "name": "Gestione Immagini", 
 *       "isEnabled": true,
 *       "category": "FEATURE"
 *     }
 *   ]
 * }
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    logger.info('[PublicModulesRoutes] Fetching enabled modules list', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Recupera solo i moduli abilitati
    const modules = await moduleService.getAllModules({ isEnabled: true });
    
    // Prepara le informazioni pubbliche dei moduli
    const publicModules = modules.map((module: any) => ({
      code: module.code,
      name: module.name,
      description: module.description,
      isEnabled: module.isEnabled,
      category: module.category,
      version: module.version
    }));

    logger.info('[PublicModulesRoutes] Enabled modules list retrieved', {
      count: publicModules.length
    });

    return res.json(ResponseFormatter.success(
      publicModules,
      'Lista moduli abilitati recuperata con successo'
    ));

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error('[PublicModulesRoutes] Error fetching modules list:', {
      error: errorMessage,
      stack: errorStack
    });
    
    return res.status(500).json(
      ResponseFormatter.error(
        'Errore nel recupero lista moduli',
        'FETCH_ERROR'
      )
    );
  }
});

export default router;