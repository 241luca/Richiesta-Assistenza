import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { requireModule } from '../middleware/module.middleware';
import { ResponseFormatter } from '../utils/responseFormatter';
import interventionReportOperationsService from '../services/interventionReportOperations.service';
import { safeAuditLog } from '../utils/safeAuditLog';
import { AuditAction, LogSeverity, LogCategory } from '@prisma/client';

const router = Router();

// 🔒 Protegge tutte le routes dei rapporti di intervento
// Se il modulo 'intervention-reports' è disabilitato, blocca l'accesso con 403
router.use(requireModule('intervention-reports'));

// ========== ROUTES CLIENTE ==========

// GET /api/intervention-reports/client/my-reports
router.get('/client/my-reports', authenticate, async (req: any, res) => {
  try {
    // Solo clienti possono accedere ai propri rapporti
    if (req.user.role !== 'CLIENT') {
      return res.status(403).json(ResponseFormatter.error(
        'Accesso riservato ai clienti',
        'CLIENT_ONLY'
      ));
    }
    
    const filters = {
      ...req.query,
      clientId: req.user.id  // Filtra per cliente corrente
    };
    
    const reports = await interventionReportOperationsService.getReports(
      filters,
      req.user.id,
      req.user.role
    );
    
    return res.json(ResponseFormatter.success(
      reports,
      'Rapporti recuperati con successo'
    ));
  } catch (error) {
    console.error('Errore recupero rapporti cliente:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero dei rapporti',
      'CLIENT_REPORTS_ERROR'
    ));
  }
});

// GET /api/intervention-reports/client/stats
router.get('/client/stats', authenticate, async (req: any, res) => {
  try {
    // Solo clienti possono accedere alle proprie statistiche
    if (req.user.role !== 'CLIENT') {
      return res.status(403).json(ResponseFormatter.error(
        'Accesso riservato ai clienti',
        'CLIENT_ONLY'
      ));
    }
    
    const stats = await interventionReportOperationsService.getClientStatistics(
      req.user.id
    );
    
    return res.json(ResponseFormatter.success(
      stats,
      'Statistiche recuperate con successo'
    ));
  } catch (error) {
    console.error('Errore recupero statistiche cliente:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero delle statistiche',
      'CLIENT_STATS_ERROR'
    ));
  }
});

// POST /api/intervention-reports/client/:id/sign
router.post('/client/:id/sign', authenticate, async (req: any, res) => {
  try {
    // Solo clienti possono firmare
    if (req.user.role !== 'CLIENT') {
      return res.status(403).json(ResponseFormatter.error(
        'Solo i clienti possono firmare i rapporti',
        'CLIENT_ONLY'
      ));
    }
    
    const { signature } = req.body;
    
    const report = await interventionReportOperationsService.signReportAsClient(
      req.params.id,
      req.user.id,
      signature
    );
    
    // Audit log per firma rapporto
    await safeAuditLog({
      action: AuditAction.UPDATE,
      entityType: 'InterventionReport',
      entityId: req.params.id,
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
      success: true,
      severity: LogSeverity.INFO,
      category: LogCategory.BUSINESS,
      metadata: {
        action: 'CLIENT_SIGNATURE',
        reportNumber: report.reportNumber
      }
    });
    
    return res.json(ResponseFormatter.success(
      report,
      'Rapporto firmato con successo'
    ));
  } catch (error: any) {
    console.error('Errore firma rapporto:', error);
    
    if (error.statusCode === 404) {
      return res.status(404).json(ResponseFormatter.error(
        error.message,
        'REPORT_NOT_FOUND'
      ));
    }
    
    if (error.statusCode === 403) {
      return res.status(403).json(ResponseFormatter.error(
        error.message,
        'SIGN_FORBIDDEN'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella firma del rapporto',
      'SIGN_ERROR'
    ));
  }
});

// POST /api/intervention-reports/client/:id/rate
router.post('/client/:id/rate', authenticate, async (req: any, res) => {
  try {
    // Solo clienti possono valutare
    if (req.user.role !== 'CLIENT') {
      return res.status(403).json(ResponseFormatter.error(
        'Solo i clienti possono valutare i rapporti',
        'CLIENT_ONLY'
      ));
    }
    
    const { rating, comment } = req.body;
    
    const report = await interventionReportOperationsService.rateReport(
      req.params.id,
      req.user.id,
      rating,
      comment
    );
    
    // Audit log per valutazione rapporto
    await safeAuditLog({
      action: AuditAction.UPDATE,
      entityType: 'InterventionReport',
      entityId: req.params.id,
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
      success: true,
      severity: LogSeverity.INFO,
      category: LogCategory.BUSINESS,
      metadata: {
        action: 'CLIENT_RATING',
        rating,
        reportNumber: report.reportNumber
      }
    });
    
    return res.json(ResponseFormatter.success(
      report,
      'Valutazione registrata con successo'
    ));
  } catch (error: any) {
    console.error('Errore valutazione rapporto:', error);
    
    if (error.statusCode === 404) {
      return res.status(404).json(ResponseFormatter.error(
        error.message,
        'REPORT_NOT_FOUND'
      ));
    }
    
    if (error.statusCode === 403) {
      return res.status(403).json(ResponseFormatter.error(
        error.message,
        'RATE_FORBIDDEN'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella valutazione del rapporto',
      'RATE_ERROR'
    ));
  }
});

// ========== RAPPORTI ==========

// GET /api/intervention-reports/reports
router.get('/reports', authenticate, async (req: any, res) => {
  try {
    const reports = await interventionReportOperationsService.getReports(
      req.query,
      req.user.id,
      req.user.role
    );
    
    return res.json(ResponseFormatter.success(
      reports,
      'Rapporti recuperati con successo'
    ));
  } catch (error) {
    console.error('Errore recupero rapporti:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero dei rapporti',
      'REPORTS_FETCH_ERROR'
    ));
  }
});

// GET /api/intervention-reports/reports/:id
router.get('/reports/:id', authenticate, async (req: any, res) => {
  try {
    const report = await interventionReportOperationsService.getReportById(
      req.params.id,
      req.user.id,
      req.user.role
    );
    
    return res.json(ResponseFormatter.success(
      report,
      'Rapporto recuperato con successo'
    ));
  } catch (error: any) {
    console.error('Errore recupero rapporto:', error);
    
    if (error.statusCode === 404) {
      return res.status(404).json(ResponseFormatter.error(
        error.message,
        'REPORT_NOT_FOUND'
      ));
    }
    
    if (error.statusCode === 403) {
      return res.status(403).json(ResponseFormatter.error(
        error.message,
        'REPORT_ACCESS_DENIED'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero del rapporto',
      'REPORT_FETCH_ERROR'
    ));
  }
});

// POST /api/intervention-reports/reports
router.post('/reports', authenticate, async (req: any, res) => {
  try {
    // Solo professionisti possono creare rapporti
    if (req.user.role !== 'PROFESSIONAL' && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json(ResponseFormatter.error(
        'Solo i professionisti possono creare rapporti',
        'UNAUTHORIZED_CREATE_REPORT'
      ));
    }
    
    const report = await interventionReportOperationsService.createReport(
      req.body,
      req.user.id
    );
    
    // Audit log per creazione rapporto
    await safeAuditLog({
      action: AuditAction.CREATE,
      entityType: 'InterventionReport',
      entityId: report.id,
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
      success: true,
      severity: LogSeverity.INFO,
      category: LogCategory.BUSINESS,
      metadata: {
        requestId: report.requestId,
        reportNumber: report.reportNumber,
        interventionType: report.interventionType
      }
    });
    
    return res.json(ResponseFormatter.success(
      report,
      'Rapporto creato con successo'
    ));
  } catch (error: any) {
    console.error('Errore creazione rapporto:', error);
    
    if (error.statusCode === 400) {
      return res.status(400).json(ResponseFormatter.error(
        error.message,
        'REPORT_VALIDATION_ERROR'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella creazione del rapporto',
      'REPORT_CREATE_ERROR'
    ));
  }
});

// PUT /api/intervention-reports/reports/:id
router.put('/reports/:id', authenticate, async (req: any, res) => {
  try {
    const report = await interventionReportOperationsService.updateReport(
      req.params.id,
      req.body,
      req.user.id
    );
    
    // Audit log per aggiornamento rapporto
    await safeAuditLog({
      action: AuditAction.UPDATE,
      entityType: 'InterventionReport',
      entityId: req.params.id,
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
      success: true,
      severity: LogSeverity.INFO,
      category: LogCategory.BUSINESS,
      metadata: {
        reportNumber: report.reportNumber,
        status: report.status
      }
    });
    
    return res.json(ResponseFormatter.success(
      report,
      'Rapporto aggiornato con successo'
    ));
  } catch (error: any) {
    console.error('Errore aggiornamento rapporto:', error);
    
    if (error.statusCode === 404) {
      return res.status(404).json(ResponseFormatter.error(
        error.message,
        'REPORT_NOT_FOUND'
      ));
    }
    
    if (error.statusCode === 403) {
      return res.status(403).json(ResponseFormatter.error(
        error.message,
        'REPORT_UPDATE_FORBIDDEN'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento del rapporto',
      'REPORT_UPDATE_ERROR'
    ));
  }
});

// DELETE /api/intervention-reports/reports/:id
router.delete('/reports/:id', authenticate, async (req: any, res) => {
  try {
    await interventionReportOperationsService.deleteReport(
      req.params.id,
      req.user.id
    );
    
    // Audit log per eliminazione rapporto
    await safeAuditLog({
      action: AuditAction.DELETE,
      entityType: 'InterventionReport',
      entityId: req.params.id,
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
      success: true,
      severity: LogSeverity.WARNING,
      category: LogCategory.BUSINESS,
      metadata: {
        deletedBy: req.user.id
      }
    });
    
    return res.json(ResponseFormatter.success(
      null,
      'Rapporto eliminato con successo'
    ));
  } catch (error: any) {
    console.error('Errore eliminazione rapporto:', error);
    
    if (error.statusCode === 404) {
      return res.status(404).json(ResponseFormatter.error(
        error.message,
        'REPORT_NOT_FOUND'
      ));
    }
    
    if (error.statusCode === 403) {
      return res.status(403).json(ResponseFormatter.error(
        error.message,
        'REPORT_DELETE_FORBIDDEN'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'eliminazione del rapporto',
      'REPORT_DELETE_ERROR'
    ));
  }
});

// ========== OPERAZIONI SPECIALI ==========

// POST /api/intervention-reports/reports/:id/sign
router.post('/reports/:id/sign', authenticate, async (req: any, res) => {
  try {
    const result = await interventionReportOperationsService.signReport(
      req.params.id,
      req.body,
      req.user.id,
      req.user.role
    );
    
    return res.json(ResponseFormatter.success(
      result,
      'Firma aggiunta con successo'
    ));
  } catch (error: any) {
    console.error('Errore firma rapporto:', error);
    
    if (error.statusCode === 404) {
      return res.status(404).json(ResponseFormatter.error(
        error.message,
        'REPORT_NOT_FOUND'
      ));
    }
    
    if (error.statusCode === 403) {
      return res.status(403).json(ResponseFormatter.error(
        error.message,
        'SIGN_FORBIDDEN'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella firma del rapporto',
      'SIGN_ERROR'
    ));
  }
});

// POST /api/intervention-reports/reports/:id/send
router.post('/reports/:id/send', authenticate, async (req: any, res) => {
  try {
    // Solo il professionista può inviare il rapporto
    if (req.user.role !== 'PROFESSIONAL' && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json(ResponseFormatter.error(
        'Solo il professionista può inviare il rapporto',
        'SEND_FORBIDDEN'
      ));
    }
    
    const result = await interventionReportOperationsService.sendReportToClient(
      req.params.id,
      req.user.id
    );
    
    return res.json(ResponseFormatter.success(
      result,
      'Rapporto inviato al cliente con successo'
    ));
  } catch (error: any) {
    console.error('Errore invio rapporto:', error);
    
    if (error.statusCode === 404) {
      return res.status(404).json(ResponseFormatter.error(
        error.message,
        'REPORT_NOT_FOUND'
      ));
    }
    
    if (error.statusCode === 400) {
      return res.status(400).json(ResponseFormatter.error(
        error.message,
        'SEND_ERROR'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'invio del rapporto',
      'SEND_ERROR'
    ));
  }
});

// GET /api/intervention-reports/reports/:id/pdf
router.get('/reports/:id/pdf', authenticate, async (req: any, res) => {
  try {
    const result = await interventionReportOperationsService.generatePDF(
      req.params.id,
      req.user.id,
      req.user.role
    );
    
    return res.json(ResponseFormatter.success(
      result,
      'PDF generato con successo'
    ));
  } catch (error: any) {
    console.error('Errore generazione PDF:', error);
    
    if (error.statusCode === 404) {
      return res.status(404).json(ResponseFormatter.error(
        error.message,
        'REPORT_NOT_FOUND'
      ));
    }
    
    if (error.statusCode === 403) {
      return res.status(403).json(ResponseFormatter.error(
        error.message,
        'PDF_ACCESS_DENIED'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella generazione del PDF',
      'PDF_GENERATION_ERROR'
    ));
  }
});

// POST /api/intervention-reports/reports/:id/duplicate
router.post('/reports/:id/duplicate', authenticate, async (req: any, res) => {
  try {
    // Solo il professionista può duplicare il proprio rapporto
    if (req.user.role !== 'PROFESSIONAL' && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json(ResponseFormatter.error(
        'Solo il professionista può duplicare il rapporto',
        'DUPLICATE_FORBIDDEN'
      ));
    }
    
    const report = await interventionReportOperationsService.duplicateReport(
      req.params.id,
      req.user.id
    );
    
    return res.json(ResponseFormatter.success(
      report,
      'Rapporto duplicato con successo'
    ));
  } catch (error: any) {
    console.error('Errore duplicazione rapporto:', error);
    
    if (error.statusCode === 404) {
      return res.status(404).json(ResponseFormatter.error(
        error.message,
        'REPORT_NOT_FOUND'
      ));
    }
    
    if (error.statusCode === 403) {
      return res.status(403).json(ResponseFormatter.error(
        error.message,
        'DUPLICATE_FORBIDDEN'
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella duplicazione del rapporto',
      'DUPLICATE_ERROR'
    ));
  }
});

// GET /api/intervention-reports/statistics
router.get('/statistics', authenticate, async (req: any, res) => {
  try {
    const stats = await interventionReportOperationsService.getReportStatistics(
      req.user.id,
      req.user.role
    );
    
    return res.json(ResponseFormatter.success(
      stats,
      'Statistiche recuperate con successo'
    ));
  } catch (error) {
    console.error('Errore recupero statistiche:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero delle statistiche',
      'STATISTICS_FETCH_ERROR'
    ));
  }
});

export default router;
