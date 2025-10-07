// backend/src/routes/audit.routes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validate } from '../middleware/validation';
import { auditLogService } from '../services/auditLog.service';
import { ResponseFormatter } from '../utils/responseFormatter';
import { prisma } from '../config/database';
import { z } from 'zod';
import { Parser } from 'json2csv';
import { AuditAction, LogCategory, LogSeverity } from '@prisma/client';

const router = Router();

// Schema di validazione per la ricerca
const searchSchema = z.object({
  userId: z.string().optional(),
  action: z.nativeEnum(AuditAction).optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  category: z.nativeEnum(LogCategory).optional(),
  severity: z.nativeEnum(LogSeverity).optional(),
  success: z.string().optional().transform(val => val === undefined ? undefined : val === 'true'),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  limit: z.string().default('50').transform(val => parseInt(val)),
  offset: z.string().default('0').transform(val => parseInt(val))
});

/**
 * GET /api/audit/logs
 * Recupera i log di audit con filtri
 * Solo ADMIN e SUPER_ADMIN
 */
router.get('/logs', 
  authenticate, 
  requireRole(['ADMIN', 'SUPER_ADMIN']), 
  async (req, res) => {
    try {
      const filters = searchSchema.parse(req.query);
      
      // Converti le date da string a Date
      if (filters.fromDate) filters.fromDate = new Date(filters.fromDate) as any;
      if (filters.toDate) filters.toDate = new Date(filters.toDate) as any;
      
      const result = await auditLogService.search(filters as any);
      
      return res.json(ResponseFormatter.success(
        result,
        'Audit logs retrieved successfully'
      ));
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to fetch audit logs',
        'FETCH_ERROR'
      ));
    }
});

/**
 * GET /api/audit/active-users
 * Ottieni gli utenti che si sono loggati recentemente
 */
router.get('/active-users',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  async (req, res) => {
    try {
      const { days = 7 } = req.query;
      
      // Calcola la data di cutoff
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - Number(days));
      
      // Trova tutti i login recenti
      const recentLogins = await prisma.auditLog.findMany({
        where: {
          action: 'LOGIN_SUCCESS',
          timestamp: { gte: cutoffDate },
          userId: { not: null }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              role: true,
              lastLoginAt: true
            }
          }
        },
        orderBy: { timestamp: 'desc' },
        distinct: ['userId'], // Un record per utente
        take: 100 // Limita a 100 utenti
      });
      
      // Formatta i risultati
      const activeUsers = recentLogins.map(log => ({
        userId: log.userId,
        email: log.user?.email || log.userEmail,
        fullName: log.user?.fullName,
        role: log.user?.role || log.userRole,
        lastLogin: log.timestamp,
        loginCount: 1, // Verrà calcolato dopo
        ipAddress: log.ipAddress
      }));
      
      // Conta i login per ogni utente
      for (const user of activeUsers) {
        const count = await prisma.auditLog.count({
          where: {
            userId: user.userId,
            action: 'LOGIN_SUCCESS',
            timestamp: { gte: cutoffDate }
          }
        });
        user.loginCount = count;
      }
      
      return res.json(ResponseFormatter.success(
        {
          users: activeUsers,
          total: activeUsers.length,
          period: `${days} giorni`
        },
        'Utenti attivi recuperati con successo'
      ));
    } catch (error: any) {
      console.error('Error fetching active users:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Errore nel recupero degli utenti attivi',
        'FETCH_ERROR'
      ));
    }
});

/**
 * GET /api/audit/statistics
 * Ottieni statistiche aggregate dei log
 */
router.get('/statistics',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  async (req, res) => {
    try {
      const { fromDate, toDate, groupBy } = req.query;
      
      const filters: any = {};
      if (fromDate) filters.fromDate = new Date(fromDate as string);
      if (toDate) filters.toDate = new Date(toDate as string);
      if (groupBy) filters.groupBy = groupBy as any;
      
      const stats = await auditLogService.getStatistics(filters);
      
      return res.json(ResponseFormatter.success(
        stats,
        'Statistics retrieved successfully'
      ));
    } catch (error: any) {
      console.error('Error fetching statistics:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to fetch statistics',
        'STATS_ERROR'
      ));
    }
});

/**
 * GET /api/audit/export
 * Esporta i log in formato CSV
 */
router.get('/export',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  async (req, res) => {
    try {
      const filters = searchSchema.parse(req.query);
      
      // Converti le date
      if (filters.fromDate) filters.fromDate = new Date(filters.fromDate) as any;
      if (filters.toDate) filters.toDate = new Date(filters.toDate) as any;
      
      // Rimuovi limite per export
      const exportFilters = { ...filters, limit: 10000 };
      const result = await auditLogService.search(exportFilters as any);
      
      // Prepara i dati per CSV
      const csvData = result.logs.map(log => ({
        Timestamp: log.timestamp,
        User: log.user?.fullName || log.user?.email || log.userId || 'System',
        UserRole: log.user?.role || log.userRole || '',
        Action: log.action,
        EntityType: log.entityType,
        EntityId: log.entityId,
        Success: log.success ? 'Yes' : 'No',
        IP: log.ipAddress,
        Endpoint: log.endpoint,
        ResponseTime: log.responseTime,
        StatusCode: log.statusCode,
        ErrorMessage: log.errorMessage,
        Category: log.category,
        Severity: log.severity
      }));
      
      // Genera CSV
      const parser = new Parser();
      const csv = parser.parse(csvData);
      
      // Invia il file
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
      return res.send(csv);
    } catch (error: any) {
      console.error('Error exporting audit logs:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to export audit logs',
        'EXPORT_ERROR'
      ));
    }
});

/**
 * GET /api/audit/user/:userId
 * Ottieni i log di un utente specifico
 */
router.get('/user/:userId',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      
      const result = await auditLogService.search({
        userId,
        limit: Number(limit),
        offset: Number(offset)
      });
      
      return res.json(ResponseFormatter.success(
        result,
        'User audit logs retrieved successfully'
      ));
    } catch (error: any) {
      console.error('Error fetching user audit logs:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to fetch user audit logs',
        'FETCH_ERROR'
      ));
    }
});

/**
 * GET /api/audit/entity/:entityType/:entityId
 * Ottieni i log di una specifica entità
 */
router.get('/entity/:entityType/:entityId',
  authenticate,
  async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const user = (req as any).user;
      
      // Verifica autorizzazioni
      // ADMIN e SUPER_ADMIN possono vedere tutto
      // Altri utenti solo le proprie entità
      const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);
      
      if (!isAdmin) {
        // Verifica che l'utente abbia accesso all'entità
        // Questa logica dipende dal tipo di entità
        // Per ora permettiamo solo di vedere i propri dati
        if (entityType === 'User' && entityId !== user.id) {
          return res.status(403).json(ResponseFormatter.error(
            'Access denied',
            'FORBIDDEN'
          ));
        }
      }
      
      const result = await auditLogService.search({
        entityType,
        entityId,
        limit: 50
      });
      
      return res.json(ResponseFormatter.success(
        result,
        'Entity audit logs retrieved successfully'
      ));
    } catch (error: any) {
      console.error('Error fetching entity audit logs:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to fetch entity audit logs',
        'FETCH_ERROR'
      ));
    }
});

/**
 * POST /api/audit/search
 * Ricerca avanzata nei log
 */
router.post('/search',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  validate(z.object({
    body: searchSchema
  })),
  async (req, res) => {
    try {
      const filters = req.body;
      
      // Converti le date
      if (filters.fromDate) filters.fromDate = new Date(filters.fromDate);
      if (filters.toDate) filters.toDate = new Date(filters.toDate);
      
      const result = await auditLogService.search(filters);
      
      return res.json(ResponseFormatter.success(
        result,
        'Search completed successfully'
      ));
    } catch (error: any) {
      console.error('Error searching audit logs:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to search audit logs',
        'SEARCH_ERROR'
      ));
    }
});

/**
 * GET /api/audit/alerts
 * Ottieni gli alert configurati
 */
router.get('/alerts',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  async (req, res) => {
    try {
      const alerts = await prisma.auditLogAlert.findMany({
        orderBy: { createdAt: 'desc' }
      });
      
      return res.json(ResponseFormatter.success(
        alerts,
        'Alerts retrieved successfully'
      ));
    } catch (error: any) {
      console.error('Error fetching alerts:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to fetch alerts',
        'FETCH_ERROR'
      ));
    }
});

/**
 * POST /api/audit/alerts
 * Crea un nuovo alert
 */
router.post('/alerts',
  authenticate,
  requireRole(['SUPER_ADMIN']),
  validate(z.object({
    body: z.object({
      name: z.string(),
      description: z.string().optional(),
      condition: z.object({
        action: z.nativeEnum(AuditAction).optional(),
        severity: z.nativeEnum(LogSeverity).optional(),
        category: z.nativeEnum(LogCategory).optional(),
        success: z.boolean().optional()
      }),
      severity: z.nativeEnum(LogSeverity),
      notifyEmails: z.array(z.string().email()).optional(),
      notifyWebhook: z.string().url().optional()
    })
  })),
  async (req, res) => {
    try {
      const alert = await prisma.auditLogAlert.create({
        data: {
          ...req.body,
          condition: req.body.condition,
          notifyEmails: req.body.notifyEmails
        }
      });
      
      return res.status(201).json(ResponseFormatter.success(
        alert,
        'Alert created successfully'
      ));
    } catch (error: any) {
      console.error('Error creating alert:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to create alert',
        'CREATE_ERROR'
      ));
    }
});

/**
 * DELETE /api/audit/cleanup
 * Pulisci i log vecchi secondo le retention policy
 */
router.delete('/cleanup',
  authenticate,
  requireRole(['SUPER_ADMIN']),
  async (req, res) => {
    try {
      await auditLogService.cleanupOldLogs();
      
      return res.json(ResponseFormatter.success(
        null,
        'Cleanup completed successfully'
      ));
    } catch (error: any) {
      console.error('Error during cleanup:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to cleanup logs',
        'CLEANUP_ERROR'
      ));
    }
});

export default router;
