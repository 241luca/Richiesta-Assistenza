/**
 * Shell Scripts Routes
 * API endpoints per eseguire gli script shell originali
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { shellScriptsService } from '../../services/shell-scripts.service';
import { ResponseFormatter } from '../../utils/responseFormatter';
// Logger semplificato
const logger = {
  info: (...args: any[]) => console.log('[ShellScripts Routes]', ...args),
  error: (...args: any[]) => console.error('[ShellScripts Routes]', ...args)
};

const router = Router();

// Middleware: solo admin possono accedere
router.use(authenticate);
router.use(requireRole(['ADMIN', 'SUPER_ADMIN']));

/**
 * GET /api/admin/scripts
 * Ottiene la lista degli script shell disponibili
 */
router.get('/', async (req: any, res) => {
  try {
    const scripts = shellScriptsService.getScripts();
    
    return res.json(ResponseFormatter.success(
      scripts,
      'Scripts retrieved successfully'
    ));
  } catch (error) {
    logger.error('Error getting scripts:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to get scripts', 'SCRIPTS_ERROR')
    );
  }
});

/**
 * POST /api/admin/scripts/run
 * Esegue uno script shell
 */
router.post('/run', async (req: any, res) => {
  try {
    const { scriptName } = req.body;
    
    if (!scriptName) {
      return res.status(400).json(
        ResponseFormatter.error('Script name is required', 'MISSING_SCRIPT_NAME')
      );
    }

    logger.info(`📝 User ${req.user.email} is executing script: ${scriptName}`);
    
    // Esegui lo script
    const result = await shellScriptsService.executeScript(scriptName);
    
    return res.json(ResponseFormatter.success(
      result,
      'Script executed successfully'
    ));
  } catch (error: any) {
    logger.error('Error executing script:', error);
    return res.status(500).json(
      ResponseFormatter.error(
        error.message || 'Failed to execute script',
        'EXECUTION_ERROR'
      )
    );
  }
});

export default router;
