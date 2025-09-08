/**
 * Script Manager Routes
 * API endpoints per la gestione ed esecuzione degli script amministrativi
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { scriptManager } from '../../services/scripts.service';
import { ResponseFormatter } from '../../utils/responseFormatter';
import { logger } from '../../utils/logger';
import { z } from 'zod';

const router = Router();

// Middleware: solo admin possono accedere
router.use(authenticate);
router.use(requireRole(['ADMIN', 'SUPER_ADMIN']));

/**
 * GET /api/admin/scripts
 * Ottiene la lista degli script disponibili
 */
router.get('/', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const scripts = await scriptManager.getScripts(userId, userRole);
    const categories = scriptManager.getCategories();
    
    return res.json(ResponseFormatter.success(
      { scripts, categories },
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
 * GET /api/admin/scripts/:id
 * Ottiene i dettagli di uno script
 */
router.get('/:id', async (req, res) => {
  try {
    const scriptId = req.params.id;
    const script = await scriptManager.getScript(scriptId);
    
    if (!script) {
      return res.status(404).json(
        ResponseFormatter.error('Script not found', 'SCRIPT_NOT_FOUND')
      );
    }
    
    return res.json(ResponseFormatter.success(script, 'Script retrieved'));
  } catch (error) {
    logger.error('Error getting script:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to get script', 'SCRIPT_ERROR')
    );
  }
});

/**
 * POST /api/admin/scripts/:id/execute
 * Esegue uno script
 */
router.post('/:id/execute', async (req: any, res) => {
  try {
    const scriptId = req.params.id;
    const parameters = req.body.parameters || {};
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Esegui script
    const execution = await scriptManager.executeScript(
      scriptId,
      parameters,
      userId,
      userRole
    );
    
    return res.json(ResponseFormatter.success(
      execution,
      'Script execution started'
    ));
  } catch (error: any) {
    logger.error('Error executing script:', error);
    
    if (error.message === 'Insufficient permissions') {
      return res.status(403).json(
        ResponseFormatter.error('Insufficient permissions', 'FORBIDDEN')
      );
    }
    
    if (error.message.includes('not found')) {
      return res.status(404).json(
        ResponseFormatter.error(error.message, 'NOT_FOUND')
      );
    }
    
    if (error.message.includes('Required parameter') || error.message.includes('must be')) {
      return res.status(400).json(
        ResponseFormatter.error(error.message, 'VALIDATION_ERROR')
      );
    }
    
    return res.status(500).json(
      ResponseFormatter.error('Failed to execute script', 'EXECUTION_ERROR')
    );
  }
});

/**
 * GET /api/admin/scripts/:id/history
 * Ottiene lo storico delle esecuzioni di uno script
 */
router.get('/:id/history', async (req, res) => {
  try {
    const scriptId = req.params.id;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const history = await scriptManager.getScriptHistory(scriptId, limit);
    
    return res.json(ResponseFormatter.success(
      history,
      'Script history retrieved'
    ));
  } catch (error) {
    logger.error('Error getting script history:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to get script history', 'HISTORY_ERROR')
    );
  }
});

/**
 * GET /api/admin/scripts/execution/:runId
 * Ottiene lo stato di un'esecuzione
 */
router.get('/execution/:runId', async (req, res) => {
  try {
    const runId = req.params.runId;
    const execution = scriptManager.getExecution(runId);
    
    if (!execution) {
      return res.status(404).json(
        ResponseFormatter.error('Execution not found', 'EXECUTION_NOT_FOUND')
      );
    }
    
    return res.json(ResponseFormatter.success(
      execution,
      'Execution status retrieved'
    ));
  } catch (error) {
    logger.error('Error getting execution status:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to get execution status', 'STATUS_ERROR')
    );
  }
});

/**
 * GET /api/admin/scripts/execution/:runId/output
 * Ottiene l'output di un'esecuzione
 */
router.get('/execution/:runId/output', async (req, res) => {
  try {
    const runId = req.params.runId;
    const output = scriptManager.getExecutionOutput(runId);
    
    return res.json(ResponseFormatter.success(
      { output },
      'Execution output retrieved'
    ));
  } catch (error) {
    logger.error('Error getting execution output:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to get execution output', 'OUTPUT_ERROR')
    );
  }
});

/**
 * POST /api/admin/scripts/reload
 * Ricarica il registry degli script (SUPER_ADMIN only)
 */
router.post('/reload', requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    await scriptManager.reloadRegistry();
    
    return res.json(ResponseFormatter.success(
      null,
      'Script registry reloaded successfully'
    ));
  } catch (error) {
    logger.error('Error reloading registry:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to reload registry', 'RELOAD_ERROR')
    );
  }
});

export default router;