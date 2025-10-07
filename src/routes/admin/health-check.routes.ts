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
} from '../../services/health-check-automation/index';
import { ResponseFormatter } from '../../utils/responseFormatter';
import { logger } from '../../utils/logger';
import { prisma } from '../../config/database';
import { notificationService } from '../../services/notification.service';
import { apiKeyService } from '../../services/apiKey.service';

const router = Router();

// Middleware: solo admin possono accedere
router.use(authenticate);
router.use(requireRole(['ADMIN', 'SUPER_ADMIN']));

/**
 * GET /api/admin/health-check/status
 * Ottiene lo stato dettagliato di tutti i servizi per il ServiceStatusIndicator
 */
router.get('/status', async (req: any, res: any) => {
  try {
    const services = [];
    let overallStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';

    // 1. PostgreSQL Database
    try {
      const startTime = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - startTime;
      
      services.push({
        name: 'PostgreSQL',
        status: 'online',
        latency,
        message: `Database responsive (${latency}ms)`
      });
    } catch (error) {
      services.push({
        name: 'PostgreSQL',
        status: 'offline',
        message: 'Database connection failed'
      });
      overallStatus = 'critical';
    }

    // 2. Redis Cache
    try {
      const redisClient = req.app.get('redis');
      if (redisClient && redisClient.status === 'ready') {  // ioredis usa 'status' non 'isOpen'
        const startTime = Date.now();
        await redisClient.ping();
        const latency = Date.now() - startTime;
        
        services.push({
          name: 'Redis',
          status: 'online',
          latency,
          message: `Cache responsive (${latency}ms)`
        });
      } else {
        services.push({
          name: 'Redis',
          status: 'offline',
          message: 'Redis not connected or not ready'
        });
        if (overallStatus === 'healthy') overallStatus = 'degraded';
      }
    } catch (error) {
      services.push({
        name: 'Redis',
        status: 'offline',
        message: 'Cache connection failed'
      });
      if (overallStatus === 'healthy') overallStatus = 'degraded';
    }

    // 3. Socket.io/WebSocket
    try {
      // Proviamo a verificare se Socket.io esiste nell'app
      const io = req.app.get('io');
      
      if (io) {
        // Socket.io esiste, contiamo i client
        let socketCount = 0;
        try {
          // Prova diversi modi per contare i client
          if (io.engine && io.engine.clientsCount !== undefined) {
            socketCount = io.engine.clientsCount;
          } else if (io.sockets && io.sockets.sockets) {
            socketCount = io.sockets.sockets.size;
          }
        } catch (e) {
          socketCount = 0;
        }
        
        services.push({
          name: 'WebSocket',
          status: 'online',
          message: `${socketCount} client${socketCount !== 1 ? 's' : ''} connected`
        });
      } else {
        // Socket.io non trovato nell'app, proviamo con notificationService
        try {
          const socketStatus = notificationService.getSocketIOStatus();
          services.push({
            name: 'WebSocket', 
            status: socketStatus.isConnected ? 'online' : 'offline',
            message: `${socketStatus.clientsCount} client${socketStatus.clientsCount !== 1 ? 's' : ''} connected`
          });
          
          if (!socketStatus.isConnected && overallStatus === 'healthy') {
            overallStatus = 'degraded';
          }
        } catch (innerError) {
          // NotificationService non ha il metodo o errore
          services.push({
            name: 'WebSocket',
            status: 'offline',
            message: 'WebSocket not initialized'
          });
          if (overallStatus === 'healthy') overallStatus = 'degraded';
        }
      }
    } catch (error) {
      logger.error('Error checking WebSocket status:', error);
      services.push({
        name: 'WebSocket',
        status: 'warning',
        message: 'WebSocket check failed'
      });
    }

    // 4. Email Service
    try {
      const emailKey = await apiKeyService.getApiKey('BREVO');
      services.push({
        name: 'Email',
        status: emailKey ? 'online' : 'warning',
        message: emailKey ? 'Email service configured' : 'Email API key missing'
      });
    } catch (error) {
      services.push({
        name: 'Email',
        status: 'warning',
        message: 'Email API key check failed'
      });
    }

    // 5. WhatsApp
    services.push({
      name: 'WhatsApp',
      status: 'warning',
      message: 'WhatsApp optional service'
    });

    // 6. OpenAI API
    try {
      const openAIKey = await apiKeyService.getApiKey('OPENAI');
      services.push({
        name: 'OpenAI',
        status: openAIKey ? 'online' : 'warning',
        message: openAIKey ? 'AI service configured' : 'OpenAI API key missing'
      });
    } catch (error) {
      services.push({
        name: 'OpenAI',
        status: 'warning',
        message: 'OpenAI API key check failed'
      });
    }

    // 7. Stripe Payments
    try {
      const stripeKey = await apiKeyService.getApiKey('STRIPE');
      services.push({
        name: 'Stripe',
        status: stripeKey ? 'online' : 'warning',
        message: stripeKey ? 'Payment service configured' : 'Stripe API key missing'
      });
    } catch (error) {
      services.push({
        name: 'Stripe',
        status: 'warning',
        message: 'Stripe API key check failed'
      });
    }

    // 8. Google Maps API
    try {
      const mapsKey = await apiKeyService.getApiKey('GOOGLE_MAPS');
      services.push({
        name: 'Google Maps',
        status: mapsKey ? 'online' : 'warning',
        message: mapsKey ? 'Maps service configured' : 'Google Maps API key missing'
      });
    } catch (error) {
      services.push({
        name: 'Google Maps',
        status: 'warning',
        message: 'Google Maps API key check failed'
      });
    }
    });

    // Determina lo stato generale
    const offlineCount = services.filter(s => s.status === 'offline').length;
    const warningCount = services.filter(s => s.status === 'warning').length;
    
    if (offlineCount > 1) {
      overallStatus = 'critical';
    } else if (offlineCount > 0 || warningCount > 4) {
      overallStatus = 'degraded';
    }

    // Restituisce nel formato esatto atteso dal frontend
    res.json(ResponseFormatter.success({
      overall: overallStatus,
      services,
      timestamp: new Date().toISOString()
    }));

  } catch (error) {
    logger.error('Error checking system health:', error);
    res.status(500).json(ResponseFormatter.error(
      'Failed to check system health',
      'HEALTH_CHECK_ERROR'
    ));
  }
});

/**
 * GET /api/admin/health-check/modules
 * Ottiene la lista dei moduli disponibili
 */
router.get('/modules', async (req, res) => {
  try {
    const modules = [
      { 
        id: 'auth', 
        name: '🔐 Authentication System', 
        description: 'Controlla JWT, 2FA, sessioni e sicurezza login',
        checks: ['JWT Secret Configuration', '2FA Adoption', 'Session Store', 'Failed Login Monitoring']
      },
      { 
        id: 'database', 
        name: '📊 Database System', 
        description: 'Verifica connessioni PostgreSQL, performance e dimensioni',
        checks: ['Database Connection', 'Query Performance', 'Database Size', 'Active Connections']
      },
      { 
        id: 'redis', 
        name: '🔴 Redis Cache',  // NUOVO MODULO SEPARATO
        description: 'Monitora il sistema di cache Redis per sessioni e dati temporanei',
        checks: ['Redis Connection', 'Memory Usage', 'Key Count', 'Client Connections', 'Operations Performance', 'Data Persistence']
      },
      { 
        id: 'websocket', 
        name: '🔌 WebSocket Server',  // NUOVO MODULO SEPARATO
        description: 'Verifica il server Socket.io per comunicazioni real-time',
        checks: ['Socket.io Server', 'Active Connections', 'Namespaces', 'Active Rooms', 'Connection Latency', 'Socket Authentication']
      },
      { 
        id: 'emailservice', 
        name: '📧 Email Service',  // NUOVO MODULO SEPARATO
        description: 'Controlla il servizio email Brevo per invio notifiche',
        checks: ['Brevo API Configuration', 'API Connection', 'Email Quota', 'Delivery Rate', 'Email Templates', 'Verified Senders']
      },
      { 
        id: 'notification', 
        name: '📨 Notification System', 
        description: 'Monitora il sistema notifiche multi-canale',
        checks: ['Email Service Config', 'Delivery Rate', 'WebSocket Connections', 'Unread Notifications']
      },
      { 
        id: 'backup', 
        name: '💾 Backup System', 
        description: 'Controlla backup automatici e manuali',
        checks: ['Last Backup Time', 'Backup Schedule', 'Failed Backups', 'Storage Space']
      },
      { 
        id: 'chat', 
        name: '💬 Chat System', 
        description: 'Analizza messaggi real-time e response time',
        checks: ['Active Chats', 'Message Volume', 'Response Time', 'Unread Messages']
      },
      { 
        id: 'payment', 
        name: '💰 Payment System', 
        description: 'Verifica integrazione Stripe e transazioni',
        checks: ['Stripe Configuration', 'Payment Success Rate', 'Pending Payments', 'Transaction Volume']
      },
      { 
        id: 'ai', 
        name: '🤖 AI System', 
        description: 'Monitora OpenAI, token usage e costi',
        checks: ['OpenAI Configuration', 'Token Usage', 'Response Time', 'API Costs', 'Rate Limiting']
      },
      { 
        id: 'request', 
        name: '📋 Request System', 
        description: 'Gestione richieste assistenza e preventivi',
        checks: ['Active Requests', 'Pending Assignments', 'Completion Time', 'Quote Acceptance Rate']
      }
    ];
    
    return res.json(ResponseFormatter.success(modules, 'Modules list retrieved'));
  } catch (error) {
    logger.error('Error getting modules list:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to get modules', 'MODULES_ERROR')
    );
  }
});

/**
 * POST /api/admin/health-check/run
 * Esegue un health check manuale per un modulo specifico o tutti
 */
router.post('/run', async (req, res) => {
  try {
    const { module } = req.body;
    
    // Importa il servizio healthCheck reale
    const { healthCheckService } = require('../../services/healthCheck.service');
    
    let result;
    if (module) {
      // Esegue check singolo e ritorna il summary aggiornato
      console.log(`[API] Running single check for module: ${module}`);
      result = await healthCheckService.runSingleCheck(module);
      
      // runSingleCheck ora ritorna già il summary completo con solo il modulo aggiornato
      // Aggiungiamo un flag per indicare quale modulo è stato appena testato
      const summaryWithFlag = {
        ...result,
        singleModuleTest: {
          module: module,
          timestamp: new Date(),
          // Trova il modulo appena testato nei risultati
          moduleResult: result.modules.find(m => m.module === module)
        }
      };
      
      return res.json(ResponseFormatter.success(
        summaryWithFlag,
        `Health check executed for ${module}`
      ));
    } else {
      // Esegue tutti i check
      console.log('[API] Running all health checks');
      result = await healthCheckService.runAllChecks();
      return res.json(ResponseFormatter.success(result, 'All health checks executed'));
    }
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