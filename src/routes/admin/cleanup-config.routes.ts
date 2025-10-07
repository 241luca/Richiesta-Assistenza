// 🚀 ROUTES PER CRUD COMPLETO CONFIGURAZIONE CLEANUP
// backend/src/routes/admin/cleanup-config.routes.ts

import { Router } from 'express';
import { ResponseFormatter } from '../../utils/responseFormatter';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import * as cleanupConfigService from '../../services/cleanup-config-crud.service';
import { logger } from '../../utils/logger';

const router = Router();

// Middleware per admin
const adminOnly = [authenticate, requireRole(['ADMIN', 'SUPER_ADMIN'])];

// ==========================================
// CONFIGURAZIONE PRINCIPALE
// ==========================================

/**
 * GET /api/admin/cleanup-config
 * Ottieni tutte le configurazioni
 */
router.get('/config', ...adminOnly, async (req, res) => {
  try {
    const configs = await cleanupConfigService.getAllCleanupConfigs();
    return res.json(ResponseFormatter.success(configs, 'Configurazioni recuperate'));
  } catch (error: any) {
    logger.error('Errore recupero configurazioni:', error);
    return res.status(500).json(ResponseFormatter.error(error.message));
  }
});

/**
 * GET /api/admin/cleanup-config/:id
 * Ottieni configurazione specifica
 */
router.get('/config/:id', ...adminOnly, async (req, res) => {
  try {
    const config = await cleanupConfigService.getCleanupConfig(req.params.id);
    if (!config) {
      return res.status(404).json(ResponseFormatter.error('Configurazione non trovata'));
    }
    return res.json(ResponseFormatter.success(config, 'Configurazione recuperata'));
  } catch (error: any) {
    logger.error('Errore recupero configurazione:', error);
    return res.status(500).json(ResponseFormatter.error(error.message));
  }
});

/**
 * POST /api/admin/cleanup-config
 * Crea nuova configurazione
 */
router.post('/config', ...adminOnly, async (req, res) => {
  try {
    const config = await cleanupConfigService.createCleanupConfig(req.body);
    return res.status(201).json(ResponseFormatter.success(config, 'Configurazione creata'));
  } catch (error: any) {
    logger.error('Errore creazione configurazione:', error);
    return res.status(500).json(ResponseFormatter.error(error.message));
  }
});

/**
 * PUT /api/admin/cleanup-config/:id
 * Aggiorna configurazione
 */
router.put('/config/:id', ...adminOnly, async (req, res) => {
  try {
    const config = await cleanupConfigService.updateCleanupConfig(req.params.id, req.body);
    return res.json(ResponseFormatter.success(config, 'Configurazione aggiornata'));
  } catch (error: any) {
    logger.error('Errore aggiornamento configurazione:', error);
    return res.status(500).json(ResponseFormatter.error(error.message));
  }
});

/**
 * DELETE /api/admin/cleanup-config/:id
 * Elimina configurazione
 */
router.delete('/config/:id', ...adminOnly, async (req, res) => {
  try {
    await cleanupConfigService.deleteCleanupConfig(req.params.id);
    return res.json(ResponseFormatter.success(null, 'Configurazione eliminata'));
  } catch (error: any) {
    logger.error('Errore eliminazione configurazione:', error);
    return res.status(500).json(ResponseFormatter.error(error.message));
  }
});

// ==========================================
// PATTERN
// ==========================================

/**
 * GET /api/admin/cleanup-config/patterns
 * Ottieni tutti i pattern
 */
router.get('/patterns', ...adminOnly, async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const patterns = await cleanupConfigService.getCleanupPatterns(includeInactive);
    return res.json(ResponseFormatter.success(patterns, 'Pattern recuperati'));
  } catch (error: any) {
    logger.error('Errore recupero pattern:', error);
    return res.status(500).json(ResponseFormatter.error(error.message));
  }
});

/**
 * GET /api/admin/cleanup-config/patterns/:id
 * Ottieni pattern specifico
 */
router.get('/patterns/:id', ...adminOnly, async (req, res) => {
  try {
    const pattern = await cleanupConfigService.getCleanupPattern(req.params.id);
    if (!pattern) {
      return res.status(404).json(ResponseFormatter.error('Pattern non trovato'));
    }
    return res.json(ResponseFormatter.success(pattern, 'Pattern recuperato'));
  } catch (error: any) {
    logger.error('Errore recupero pattern:', error);
    return res.status(500).json(ResponseFormatter.error(error.message));
  }
});

/**
 * POST /api/admin/cleanup-config/patterns
 * Crea nuovo pattern
 */
router.post('/patterns', ...adminOnly, async (req, res) => {
  try {
    const pattern = await cleanupConfigService.createCleanupPattern(req.body);
    return res.status(201).json(ResponseFormatter.success(pattern, 'Pattern creato'));
  } catch (error: any) {
    logger.error('Errore creazione pattern:', error);
    return res.status(500).json(ResponseFormatter.error(error.message));
  }
});

/**
 * PUT /api/admin/cleanup-config/patterns/:id
 * Aggiorna pattern
 */
router.put('/patterns/:id', ...adminOnly, async (req, res) => {
  try {
    const pattern = await cleanupConfigService.updateCleanupPattern(req.params.id, req.body);
    return res.json(ResponseFormatter.success(pattern, 'Pattern aggiornato'));
  } catch (error: any) {
    logger.error('Errore aggiornamento pattern:', error);
    return res.status(500).json(ResponseFormatter.error(error.message));
  }
});

/**
 * DELETE /api/admin/cleanup-config/patterns/:id
 * Elimina pattern
 */
router.delete('/patterns/:id', ...adminOnly, async (req, res) => {
  try {
    await cleanupConfigService.deleteCleanupPattern(req.params.id);
    return res.json(ResponseFormatter.success(null, 'Pattern eliminato'));
  } catch (error: any) {
    logger.error('Errore eliminazione pattern:', error);
    return res.status(500).json(ResponseFormatter.error(error.message));
  }
});

// ==========================================
// FILE ESCLUSI
// ==========================================

/**
 * GET /api/admin/cleanup-config/excluded-files
 * Ottieni tutti i file esclusi
 */
router.get('/excluded-files', ...adminOnly, async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const files = await cleanupConfigService.getCleanupExcludedFiles(includeInactive);
    return res.json(ResponseFormatter.success(files, 'File esclusi recuperati'));
  } catch (error: any) {
    logger.error('Errore recupero file esclusi:', error);
    return res.status(500).json(ResponseFormatter.error(error.message));
  }
});

/**
 * GET /api/admin/cleanup-config/excluded-files/:id
 * Ottieni file escluso specifico
 */
router.get('/excluded-files/:id', ...adminOnly, async (req, res) => {
  try {
    const file = await cleanupConfigService.getCleanupExcludedFile(req.params.id);
    if (!file) {
      return res.status(404).json(ResponseFormatter.error('File escluso non trovato'));
    }
    return res.json(ResponseFormatter.success(file, 'File escluso recuperato'));
  } catch (error: any) {
    logger.error('Errore recupero file escluso:', error);
    return res.status(500).json(ResponseFormatter.error(error.message));
  }
});

/**
 * POST /api/admin/cleanup-config/excluded-files
 * Crea nuovo file escluso
 */
router.post('/excluded-files', ...adminOnly, async (req, res) => {
  try {
    const file = await cleanupConfigService.createCleanupExcludedFile(req.body);
    return res.status(201).json(ResponseFormatter.success(file, 'File escluso creato'));
  } catch (error: any) {
    logger.error('Errore creazione file escluso:', error);
    return res.status(500).json(ResponseFormatter.error(error.message));
  }
});

/**
 * PUT /api/admin/cleanup-config/excluded-files/:id
 * Aggiorna file escluso
 */
router.put('/excluded-files/:id', ...adminOnly, async (req, res) => {
  try {
    const file = await cleanupConfigService.updateCleanupExcludedFile(req.params.id, req.body);
    return res.json(ResponseFormatter.success(file, 'File escluso aggiornato'));
  } catch (error: any) {
    logger.error('Errore aggiornamento file escluso:', error);
    return res.status(500).json(ResponseFormatter.error(error.message));
  }
});

/**
 * DELETE /api/admin/cleanup-config/excluded-files/:id
 * Elimina file escluso
 */
router.delete('/excluded-files/:id', ...adminOnly, async (req, res) => {
  try {
    await cleanupConfigService.deleteCleanupExcludedFile(req.params.id);
    return res.json(ResponseFormatter.success(null, 'File escluso eliminato'));
  } catch (error: any) {
    logger.error('Errore eliminazione file escluso:', error);
    return res.status(500).json(ResponseFormatter.error(error.message));
  }
});

// ==========================================
// DIRECTORY ESCLUSE
// ==========================================

/**
 * GET /api/admin/cleanup-config/excluded-directories
 * Ottieni tutte le directory escluse
 */
router.get('/excluded-directories', ...adminOnly, async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const dirs = await cleanupConfigService.getCleanupExcludedDirectories(includeInactive);
    return res.json(ResponseFormatter.success(dirs, 'Directory escluse recuperate'));
  } catch (error: any) {
    logger.error('Errore recupero directory escluse:', error);
    return res.status(500).json(ResponseFormatter.error(error.message));
  }
});

/**
 * GET /api/admin/cleanup-config/excluded-directories/:id
 * Ottieni directory esclusa specifica
 */
router.get('/excluded-directories/:id', ...adminOnly, async (req, res) => {
  try {
    const dir = await cleanupConfigService.getCleanupExcludedDirectory(req.params.id);
    if (!dir) {
      return res.status(404).json(ResponseFormatter.error('Directory esclusa non trovata'));
    }
    return res.json(ResponseFormatter.success(dir, 'Directory esclusa recuperata'));
  } catch (error: any) {
    logger.error('Errore recupero directory esclusa:', error);
    return res.status(500).json(ResponseFormatter.error(error.message));
  }
});

/**
 * POST /api/admin/cleanup-config/excluded-directories
 * Crea nuova directory esclusa
 */
router.post('/excluded-directories', ...adminOnly, async (req, res) => {
  try {
    const dir = await cleanupConfigService.createCleanupExcludedDirectory(req.body);
    return res.status(201).json(ResponseFormatter.success(dir, 'Directory esclusa creata'));
  } catch (error: any) {
    logger.error('Errore creazione directory esclusa:', error);
    return res.status(500).json(ResponseFormatter.error(error.message));
  }
});

/**
 * PUT /api/admin/cleanup-config/excluded-directories/:id
 * Aggiorna directory esclusa
 */
router.put('/excluded-directories/:id', ...adminOnly, async (req, res) => {
  try {
    const dir = await cleanupConfigService.updateCleanupExcludedDirectory(req.params.id, req.body);
    return res.json(ResponseFormatter.success(dir, 'Directory esclusa aggiornata'));
  } catch (error: any) {
    logger.error('Errore aggiornamento directory esclusa:', error);
    return res.status(500).json(ResponseFormatter.error(error.message));
  }
});

/**
 * DELETE /api/admin/cleanup-config/excluded-directories/:id
 * Elimina directory esclusa
 */
router.delete('/excluded-directories/:id', ...adminOnly, async (req, res) => {
  try {
    await cleanupConfigService.deleteCleanupExcludedDirectory(req.params.id);
    return res.json(ResponseFormatter.success(null, 'Directory esclusa eliminata'));
  } catch (error: any) {
    logger.error('Errore eliminazione directory esclusa:', error);
    return res.status(500).json(ResponseFormatter.error(error.message));
  }
});

export default router;
