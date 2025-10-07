import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { ResponseFormatter } from '../utils/responseFormatter';
import * as cleanupConfigService from '../services/cleanup-config.service';
import logger from '../utils/logger';
import { auditLogService } from '../services/auditLog.service';
import { notificationService } from '../services/notification.service';
import { prisma } from '../config/database';

const router = Router();

// Tutte le route richiedono autenticazione e ruolo ADMIN o SUPER_ADMIN
router.use(authenticate);
router.use(requireRole(['ADMIN', 'SUPER_ADMIN']));

// ==========================================
// CONFIGURAZIONE PRINCIPALE
// ==========================================

// GET /api/cleanup/config - Ottiene la configurazione
router.get('/config', async (req, res) => {
  try {
    const config = await cleanupConfigService.getCleanupConfig();
    return res.json(ResponseFormatter.success(config, 'Configurazione recuperata'));
  } catch (error) {
    logger.error('Errore recupero configurazione:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore nel recupero configurazione', 'CONFIG_ERROR')
    );
  }
});

// PUT /api/cleanup/config - Aggiorna la configurazione
router.put('/config', async (req: any, res) => {
  try {
    const oldConfig = await cleanupConfigService.getCleanupConfig();
    const config = await cleanupConfigService.updateCleanupConfig(req.body);
    
    // Log nell'Audit Log
    await auditLogService.log({
      action: 'CLEANUP_CONFIG_UPDATED' as any,
      entityType: 'CleanupConfig',
      entityId: config.id,
      userId: req.user?.id || 'system',
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'System',
      oldValues: oldConfig,
      newValues: config,
      metadata: {
        changedFields: Object.keys(req.body)
      },
      success: true,
      severity: 'INFO' as any,
      category: 'SYSTEM' as any
    });
    
    // Notifica agli admin
    try {
      const adminUsers = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'SUPER_ADMIN'] },
          id: { not: req.user?.id } // Non notificare chi ha fatto la modifica
        },
        select: { id: true, fullName: true }
      });
      
      for (const admin of adminUsers) {
        try {
          // Il servizio notifiche si aspetta userId DENTRO l'oggetto data
          await notificationService.sendToUser({
            userId: admin.id,  // userId deve essere dentro l'oggetto!
            title: 'Configurazione Cleanup Aggiornata',
            message: `La configurazione del sistema di cleanup è stata modificata da ${req.user?.fullName || 'Sistema'}`,
            type: 'config_changed',
            priority: 'NORMAL',
            data: {
              updatedBy: req.user?.id,
              updatedByName: req.user?.fullName,
              changedFields: Object.keys(req.body)
            }
          });
        } catch (notifError: any) {
          // Log errore notifica ma non bloccare il salvataggio
          logger.warn(`Errore invio notifica ad admin ${admin.id}:`, notifError.message);
        }
      }
    } catch (notifError: any) {
      // Se le notifiche falliscono, non bloccare il salvataggio
      logger.warn('Errore invio notifiche configurazione:', notifError.message);
    }
    
    return res.json(ResponseFormatter.success(config, 'Configurazione aggiornata'));
  } catch (error) {
    logger.error('Errore aggiornamento configurazione:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore nell\'aggiornamento configurazione', 'UPDATE_ERROR')
    );
  }
});

// ==========================================
// PATTERN
// ==========================================

// GET /api/cleanup/patterns - Lista pattern
router.get('/patterns', async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const patterns = await cleanupConfigService.getCleanupPatterns(includeInactive);
    return res.json(ResponseFormatter.success(patterns, 'Pattern recuperati'));
  } catch (error) {
    logger.error('Errore recupero pattern:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore nel recupero pattern', 'FETCH_ERROR')
    );
  }
});

// POST /api/cleanup/patterns - Crea nuovo pattern
router.post('/patterns', async (req, res) => {
  try {
    const pattern = await cleanupConfigService.createCleanupPattern(req.body);
    return res.status(201).json(ResponseFormatter.success(pattern, 'Pattern creato'));
  } catch (error) {
    logger.error('Errore creazione pattern:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore nella creazione pattern', 'CREATE_ERROR')
    );
  }
});

// PUT /api/cleanup/patterns/:id - Aggiorna pattern
router.put('/patterns/:id', async (req, res) => {
  try {
    const pattern = await cleanupConfigService.updateCleanupPattern(req.params.id, req.body);
    return res.json(ResponseFormatter.success(pattern, 'Pattern aggiornato'));
  } catch (error) {
    logger.error('Errore aggiornamento pattern:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore nell\'aggiornamento pattern', 'UPDATE_ERROR')
    );
  }
});

// DELETE /api/cleanup/patterns/:id - Elimina pattern
router.delete('/patterns/:id', async (req, res) => {
  try {
    await cleanupConfigService.deleteCleanupPattern(req.params.id);
    return res.json(ResponseFormatter.success(null, 'Pattern eliminato'));
  } catch (error) {
    logger.error('Errore eliminazione pattern:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore nell\'eliminazione pattern', 'DELETE_ERROR')
    );
  }
});

// ==========================================
// FILE ESCLUSI
// ==========================================

// GET /api/cleanup/exclude-files - Lista file esclusi
router.get('/exclude-files', async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const files = await cleanupConfigService.getExcludedFiles(includeInactive);
    return res.json(ResponseFormatter.success(files, 'File esclusi recuperati'));
  } catch (error) {
    logger.error('Errore recupero file esclusi:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore nel recupero file esclusi', 'FETCH_ERROR')
    );
  }
});

// POST /api/cleanup/exclude-files - Aggiungi file escluso
router.post('/exclude-files', async (req, res) => {
  try {
    const file = await cleanupConfigService.createExcludedFile(req.body);
    return res.status(201).json(ResponseFormatter.success(file, 'File escluso aggiunto'));
  } catch (error) {
    logger.error('Errore aggiunta file escluso:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore nell\'aggiunta file escluso', 'CREATE_ERROR')
    );
  }
});

// PUT /api/cleanup/exclude-files/:id - Aggiorna file escluso
router.put('/exclude-files/:id', async (req: any, res) => {
  try {
    const file = await cleanupConfigService.updateExcludedFile(req.params.id, req.body);
    
    // Log nell'Audit Log
    await auditLogService.log({
      action: 'CLEANUP_EXCLUDED_FILE_UPDATED' as any,
      entityType: 'CleanupExcludedFile',
      entityId: req.params.id,
      userId: req.user?.id,
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'System',
      metadata: {
        fileName: file.fileName,
        updatedFields: Object.keys(req.body)
      },
      success: true,
      severity: 'INFO' as any,
      category: 'SYSTEM' as any
    });
    
    return res.json(ResponseFormatter.success(file, 'File escluso aggiornato'));
  } catch (error) {
    logger.error('Errore aggiornamento file escluso:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore nell\'aggiornamento file escluso', 'UPDATE_ERROR')
    );
  }
});

// DELETE /api/cleanup/exclude-files/:id - Rimuovi file escluso
router.delete('/exclude-files/:id', async (req, res) => {
  try {
    await cleanupConfigService.deleteExcludedFile(req.params.id);
    return res.json(ResponseFormatter.success(null, 'File escluso rimosso'));
  } catch (error) {
    logger.error('Errore rimozione file escluso:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore nella rimozione file escluso', 'DELETE_ERROR')
    );
  }
});

// ==========================================
// DIRECTORY ESCLUSE
// ==========================================

// GET /api/cleanup/exclude-dirs - Lista directory escluse
router.get('/exclude-dirs', async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const dirs = await cleanupConfigService.getExcludedDirectories(includeInactive);
    return res.json(ResponseFormatter.success(dirs, 'Directory escluse recuperate'));
  } catch (error) {
    logger.error('Errore recupero directory escluse:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore nel recupero directory escluse', 'FETCH_ERROR')
    );
  }
});

// POST /api/cleanup/exclude-dirs - Aggiungi directory esclusa
router.post('/exclude-dirs', async (req, res) => {
  try {
    const dir = await cleanupConfigService.createExcludedDirectory(req.body);
    return res.status(201).json(ResponseFormatter.success(dir, 'Directory esclusa aggiunta'));
  } catch (error) {
    logger.error('Errore aggiunta directory esclusa:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore nell\'aggiunta directory esclusa', 'CREATE_ERROR')
    );
  }
});

// PUT /api/cleanup/exclude-dirs/:id - Aggiorna directory esclusa
router.put('/exclude-dirs/:id', async (req: any, res) => {
  try {
    const dir = await cleanupConfigService.updateExcludedDirectory(req.params.id, req.body);
    
    // Log nell'Audit Log
    await auditLogService.log({
      action: 'CLEANUP_EXCLUDED_DIR_UPDATED' as any,
      entityType: 'CleanupExcludedDirectory',
      entityId: req.params.id,
      userId: req.user?.id,
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'System',
      metadata: {
        directory: dir.directory,
        updatedFields: Object.keys(req.body)
      },
      success: true,
      severity: 'INFO' as any,
      category: 'SYSTEM' as any
    });
    
    return res.json(ResponseFormatter.success(dir, 'Directory esclusa aggiornata'));
  } catch (error) {
    logger.error('Errore aggiornamento directory esclusa:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore nell\'aggiornamento directory esclusa', 'UPDATE_ERROR')
    );
  }
});

// DELETE /api/cleanup/exclude-dirs/:id - Rimuovi directory esclusa
router.delete('/exclude-dirs/:id', async (req, res) => {
  try {
    await cleanupConfigService.deleteExcludedDirectory(req.params.id);
    return res.json(ResponseFormatter.success(null, 'Directory esclusa rimossa'));
  } catch (error) {
    logger.error('Errore rimozione directory esclusa:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore nella rimozione directory esclusa', 'DELETE_ERROR')
    );
  }
});

// ==========================================
// PROGRAMMAZIONE
// ==========================================

// GET /api/cleanup/schedules - Lista programmazioni
router.get('/schedules', async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const schedules = await cleanupConfigService.getCleanupSchedules(includeInactive);
    return res.json(ResponseFormatter.success(schedules, 'Programmazioni recuperate'));
  } catch (error) {
    logger.error('Errore recupero programmazioni:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore nel recupero programmazioni', 'FETCH_ERROR')
    );
  }
});

// POST /api/cleanup/schedules - Crea programmazione
router.post('/schedules', async (req, res) => {
  try {
    const schedule = await cleanupConfigService.createCleanupSchedule(req.body);
    return res.status(201).json(ResponseFormatter.success(schedule, 'Programmazione creata'));
  } catch (error) {
    logger.error('Errore creazione programmazione:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore nella creazione programmazione', 'CREATE_ERROR')
    );
  }
});

// PUT /api/cleanup/schedules/:id - Aggiorna programmazione
router.put('/schedules/:id', async (req, res) => {
  try {
    const schedule = await cleanupConfigService.updateCleanupSchedule(req.params.id, req.body);
    return res.json(ResponseFormatter.success(schedule, 'Programmazione aggiornata'));
  } catch (error) {
    logger.error('Errore aggiornamento programmazione:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore nell\'aggiornamento programmazione', 'UPDATE_ERROR')
    );
  }
});

// DELETE /api/cleanup/schedules/:id - Elimina programmazione
router.delete('/schedules/:id', async (req, res) => {
  try {
    await cleanupConfigService.deleteCleanupSchedule(req.params.id);
    return res.json(ResponseFormatter.success(null, 'Programmazione eliminata'));
  } catch (error) {
    logger.error('Errore eliminazione programmazione:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore nell\'eliminazione programmazione', 'DELETE_ERROR')
    );
  }
});

// ==========================================
// STATISTICHE E LOG
// ==========================================

// GET /api/cleanup/stats - Ottiene statistiche
router.get('/stats', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const stats = await cleanupConfigService.getCleanupStats(days);
    return res.json(ResponseFormatter.success(stats, 'Statistiche recuperate'));
  } catch (error) {
    logger.error('Errore recupero statistiche:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore nel recupero statistiche', 'FETCH_ERROR')
    );
  }
});

// GET /api/cleanup/logs - Ottiene log esecuzioni
router.get('/logs', async (req, res) => {
  try {
    const filters = {
      executionId: req.query.executionId as string,
      operation: req.query.operation as string,
      status: req.query.status as string,
      executedBy: req.query.executedBy as string,
      from: req.query.from as string,
      to: req.query.to as string,
      limit: parseInt(req.query.limit as string) || 100
    };
    
    const logs = await cleanupConfigService.getCleanupLogs(filters);
    return res.json(ResponseFormatter.success(logs, 'Log recuperati'));
  } catch (error) {
    logger.error('Errore recupero log:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore nel recupero log', 'FETCH_ERROR')
    );
  }
});

export default router;