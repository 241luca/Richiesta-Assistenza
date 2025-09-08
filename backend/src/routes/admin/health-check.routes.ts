/**
 * Health Check API Routes
 * Endpoints per la gestione del sistema Health Check dalla Dashboard
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { 
  orchestrator, 
  scheduler, 
  reportGenerator, 
  autoRemediation,
  performanceMonitor 
} from '../../services/health-check-automation';
import { ResponseFormatter } from '../../utils/responseFormatter';
import { logger } from '../../utils/logger';

const router = Router();

// Middleware: solo admin possono accedere
router.use(authenticate);
router.use(requireRole(['ADMIN', 'SUPER_ADMIN']));

/**
 * GET /api/admin/health-check/status
 * Ottiene lo stato generale del sistema
 */
router.get('/status', async (req, res) => {
  try {
    const status = await orchestrator.getSystemStatus();
    return res.json(ResponseFormatter.success(status, 'System status retrieved'));
  } catch (error) {
    logger.error('Error getting health check status:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to get status', 'HEALTH_CHECK_ERROR')
    );
  }
});

/**
 * POST /api/admin/health-check/run
 * Esegue un health check manuale
 */
router.post('/run', async (req, res) => {
  try {
    const { module } = req.body;
    const result = await orchestrator.runManualCheckWithRemediation(module);
    
    return res.json(ResponseFormatter.success(result, 'Health check executed'));
  } catch (error) {
    logger.error('Error running health check:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to run health check', 'RUN_ERROR')
    );
  }
});

/**
 * POST /api/admin/health-check/start
 * Avvia il sistema di automazione
 */
router.post('/start', async (req, res) => {
  try {
    await orchestrator.start();
    return res.json(ResponseFormatter.success(null, 'Automation system started'));
  } catch (error) {
    logger.error('Error starting automation:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to start automation', 'START_ERROR')
    );
  }
});

/**
 * POST /api/admin/health-check/stop
 * Ferma il sistema di automazione
 */
router.post('/stop', async (req, res) => {
  try {
    await orchestrator.stop();
    return res.json(ResponseFormatter.success(null, 'Automation system stopped'));
  } catch (error) {
    logger.error('Error stopping automation:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to stop automation', 'STOP_ERROR')
    );
  }
});

/**
 * GET /api/admin/health-check/schedule
 * Ottiene la configurazione dello scheduler
 */
router.get('/schedule', async (req, res) => {
  try {
    const config = scheduler.getConfig();
    return res.json(ResponseFormatter.success(config, 'Schedule configuration retrieved'));
  } catch (error) {
    logger.error('Error getting schedule config:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to get schedule', 'SCHEDULE_ERROR')
    );
  }
});

/**
 * PUT /api/admin/health-check/schedule
 * Aggiorna la configurazione dello scheduler
 */
router.put('/schedule', async (req, res) => {
  try {
    const config = req.body;
    await scheduler.updateConfig(config);
    return res.json(ResponseFormatter.success(null, 'Schedule updated successfully'));
  } catch (error) {
    logger.error('Error updating schedule:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to update schedule', 'UPDATE_ERROR')
    );
  }
});

/**
 * POST /api/admin/health-check/report
 * Genera un report immediato
 */
router.post('/report', async (req, res) => {
  try {
    const { startDate, endDate, format = 'pdf' } = req.body;
    const report = await reportGenerator.generateReport(startDate, endDate, format);
    
    return res.json(ResponseFormatter.success(
      { filename: report.filename, path: report.path },
      'Report generated successfully'
    ));
  } catch (error) {
    logger.error('Error generating report:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to generate report', 'REPORT_ERROR')
    );
  }
});

/**
 * GET /api/admin/health-check/report/history
 * Ottiene lo storico dei report generati
 */
router.get('/report/history', async (req, res) => {
  try {
    const history = await reportGenerator.getReportHistory();
    return res.json(ResponseFormatter.success(history, 'Report history retrieved'));
  } catch (error) {
    logger.error('Error getting report history:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to get report history', 'HISTORY_ERROR')
    );
  }
});

/**
 * GET /api/admin/health-check/download/:filename
 * Download di un report
 */
router.get('/download/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = await reportGenerator.getReportPath(filename);
    
    if (!filepath) {
      return res.status(404).json(
        ResponseFormatter.error('Report not found', 'NOT_FOUND')
      );
    }
    
    res.download(filepath);
  } catch (error) {
    logger.error('Error downloading report:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to download report', 'DOWNLOAD_ERROR')
    );
  }
});

/**
 * GET /api/admin/health-check/remediation
 * Ottiene le regole di auto-remediation
 */
router.get('/remediation', async (req, res) => {
  try {
    const rules = autoRemediation.getRules();
    return res.json(ResponseFormatter.success(rules, 'Remediation rules retrieved'));
  } catch (error) {
    logger.error('Error getting remediation rules:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to get remediation rules', 'REMEDIATION_ERROR')
    );
  }
});

/**
 * POST /api/admin/health-check/remediation
 * Aggiunge una regola di remediation
 */
router.post('/remediation', async (req, res) => {
  try {
    const rule = req.body;
    await autoRemediation.addRule(rule);
    return res.json(ResponseFormatter.success(null, 'Remediation rule added'));
  } catch (error) {
    logger.error('Error adding remediation rule:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to add remediation rule', 'ADD_RULE_ERROR')
    );
  }
});

/**
 * DELETE /api/admin/health-check/remediation/:id
 * Rimuove una regola di remediation
 */
router.delete('/remediation/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await autoRemediation.removeRule(id);
    return res.json(ResponseFormatter.success(null, 'Remediation rule removed'));
  } catch (error) {
    logger.error('Error removing remediation rule:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to remove remediation rule', 'REMOVE_RULE_ERROR')
    );
  }
});

/**
 * PATCH /api/admin/health-check/remediation/:id/toggle
 * Abilita/disabilita una regola
 */
router.patch('/remediation/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;
    await autoRemediation.toggleRule(id, enabled);
    return res.json(ResponseFormatter.success(null, 'Remediation rule toggled'));
  } catch (error) {
    logger.error('Error toggling remediation rule:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to toggle remediation rule', 'TOGGLE_ERROR')
    );
  }
});

/**
 * GET /api/admin/health-check/performance
 * Ottiene le metriche di performance correnti
 */
router.get('/performance', async (req, res) => {
  try {
    const metrics = await performanceMonitor.getCurrentMetrics();
    return res.json(ResponseFormatter.success(metrics, 'Performance metrics retrieved'));
  } catch (error) {
    logger.error('Error getting performance metrics:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to get performance metrics', 'METRICS_ERROR')
    );
  }
});

/**
 * GET /api/admin/health-check/performance/history
 * Ottiene lo storico delle performance
 */
router.get('/performance/history', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const history = await performanceMonitor.getHistory(
      startDate as string, 
      endDate as string
    );
    return res.json(ResponseFormatter.success(history, 'Performance history retrieved'));
  } catch (error) {
    logger.error('Error getting performance history:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to get performance history', 'PERF_HISTORY_ERROR')
    );
  }
});

/**
 * POST /api/admin/health-check/export
 * Esporta i dati in formato JSON/CSV
 */
router.post('/export', async (req, res) => {
  try {
    const { format = 'json', startDate, endDate } = req.body;
    const data = await orchestrator.exportData(format, startDate, endDate);
    
    res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=health-check-export.${format}`);
    
    return res.send(data);
  } catch (error) {
    logger.error('Error exporting data:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to export data', 'EXPORT_ERROR')
    );
  }
});

/**
 * GET /api/admin/health-check/history
 * Ottiene lo storico dei check generale
 */
router.get('/history', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const history = await orchestrator.getHistory(undefined, Number(limit));
    
    return res.json(ResponseFormatter.success(history, 'History retrieved'));
  } catch (error) {
    logger.error('Error getting history:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to get history', 'HISTORY_ERROR')
    );
  }
});

/**
 * GET /api/admin/health-check/history/:module
 * Ottiene lo storico dei check per un modulo specifico
 */
router.get('/history/:module', async (req, res) => {
  try {
    const { module } = req.params;
    const { limit = 50 } = req.query;
    
    const history = await orchestrator.getHistory(module, Number(limit));
    
    return res.json(ResponseFormatter.success(history, 'Module history retrieved'));
  } catch (error) {
    logger.error('Error getting module history:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to get module history', 'HISTORY_ERROR')
    );
  }
});

export default router;