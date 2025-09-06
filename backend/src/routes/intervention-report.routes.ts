import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { ResponseFormatter } from '../utils/responseFormatter';
import interventionReportOperationsService from '../services/interventionReportOperations.service';

const router = Router();

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
