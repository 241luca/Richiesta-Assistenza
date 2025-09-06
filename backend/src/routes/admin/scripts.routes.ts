import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { ResponseFormatter } from '../../utils/responseFormatter';
import logger from '../../utils/logger';

const router = Router();
const execAsync = promisify(exec);

// Lista degli script autorizzati (per sicurezza)
const ALLOWED_SCRIPTS = [
  'check-system',
  'pre-commit-check',
  'validate-work',
  'claude-help'
];

// Path base degli script
const SCRIPTS_PATH = path.join(process.cwd(), '..', 'scripts');

/**
 * GET /api/admin/scripts
 * Ottiene la lista degli script disponibili
 */
router.get('/', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const scripts = [];
    
    for (const scriptName of ALLOWED_SCRIPTS) {
      const scriptPath = path.join(SCRIPTS_PATH, `${scriptName}.sh`);
      const exists = fs.existsSync(scriptPath);
      
      scripts.push({
        name: scriptName,
        displayName: scriptName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        available: exists,
        description: getScriptDescription(scriptName)
      });
    }
    
    return res.json(ResponseFormatter.success(scripts, 'Scripts retrieved'));
  } catch (error) {
    logger.error('Error getting scripts:', error);
    return res.status(500).json(ResponseFormatter.error('Failed to get scripts', 'SCRIPTS_ERROR'));
  }
});

/**
 * POST /api/admin/scripts/run
 * Esegue uno script e ritorna l'output
 */
router.post('/run', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { scriptName } = req.body;
    
    // Validazione sicurezza
    if (!ALLOWED_SCRIPTS.includes(scriptName)) {
      return res.status(400).json(ResponseFormatter.error('Script not allowed', 'INVALID_SCRIPT'));
    }
    
    const scriptPath = path.join(SCRIPTS_PATH, `${scriptName}.sh`);
    
    // Verifica che lo script esista
    if (!fs.existsSync(scriptPath)) {
      return res.status(404).json(ResponseFormatter.error('Script not found', 'SCRIPT_NOT_FOUND'));
    }
    
    // Esegui lo script dalla directory root del progetto
    const projectRoot = path.join(process.cwd(), '..');
    const { stdout, stderr } = await execAsync(`bash ${scriptPath}`, {
      cwd: projectRoot, // Esegui dalla root del progetto
      timeout: 30000,
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });
    
    // Log esecuzione
    logger.info(`Script executed: ${scriptName} by user ${req.user?.id}`);
    
    return res.json(ResponseFormatter.success({
      output: stdout,
      errors: stderr,
      exitCode: 0,
      timestamp: new Date().toISOString()
    }, 'Script executed successfully'));
    
  } catch (error: any) {
    logger.error('Error running script:', error);
    
    // Se è un errore di timeout
    if (error.killed) {
      return res.status(408).json(ResponseFormatter.error('Script timeout', 'TIMEOUT'));
    }
    
    // Se lo script ha restituito un codice di errore
    if (error.code) {
      return res.json(ResponseFormatter.success({
        output: error.stdout || '',
        errors: error.stderr || error.message,
        exitCode: error.code,
        timestamp: new Date().toISOString()
      }, 'Script completed with errors'));
    }
    
    return res.status(500).json(ResponseFormatter.error('Failed to run script', 'EXECUTION_ERROR'));
  }
});

/**
 * POST /api/admin/scripts/stop
 * Ferma uno script in esecuzione (per il futuro)
 */
router.post('/stop', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    // TODO: Implementare stop di processi long-running
    return res.json(ResponseFormatter.success(null, 'Stop functionality not yet implemented'));
  } catch (error) {
    logger.error('Error stopping script:', error);
    return res.status(500).json(ResponseFormatter.error('Failed to stop script', 'STOP_ERROR'));
  }
});

/**
 * Helper per ottenere la descrizione dello script
 */
function getScriptDescription(scriptName: string): string {
  const descriptions: Record<string, string> = {
    'check-system': 'Verifica lo stato del sistema, database, Redis e porte',
    'pre-commit-check': 'Esegue tutti i controlli necessari prima di un commit',
    'validate-work': 'Valida le modifiche fatte al codice',
    'claude-help': 'Mostra la guida rapida per sviluppatori'
  };
  
  return descriptions[scriptName] || 'No description available';
}

export default router;