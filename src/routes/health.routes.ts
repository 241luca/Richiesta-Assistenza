/**
 * Health Check Avanzato con Monitoring Servizi
 */

import { Router } from 'express';
import { ResponseFormatter } from '../utils/responseFormatter';
import { getCircuitBreakerHealth, getRetryMetrics } from '../utils/retryLogic';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { apiKeyService } from '../services/apiKey.service';

const router = Router();

/**
 * GET /api/health
 * Health check base
 */
router.get('/', async (req, res) => {
  const startTime = Date.now();
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    checks: {} as Record<string, any>
  };

  // 1. Check Database
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = {
      status: 'healthy',
      responseTime: Date.now() - startTime + 'ms'
    };
  } catch (error: any) {
    health.status = 'degraded';
    health.checks.database = {
      status: 'unhealthy',
      error: error.message
    };
  }

  // 2. Check Memory
  const memUsage = process.memoryUsage();
  const memLimit = 512 * 1024 * 1024; // 512MB limite
  health.checks.memory = {
    status: memUsage.heapUsed < memLimit ? 'healthy' : 'warning',
    usage: {
      rss: `${(memUsage.rss / 1024 / 1024).toFixed(1)}MB`,
      heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(1)}MB`,
      heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(1)}MB`,
      external: `${(memUsage.external / 1024 / 1024).toFixed(1)}MB`
    }
  };

  // 3. Check Circuit Breakers
  const circuitBreakers = getCircuitBreakerHealth();
  const hasOpenCircuit = Object.values(circuitBreakers).some(
    (cb: any) => cb.state === 'OPEN'
  );
  
  health.checks.circuitBreakers = {
    status: hasOpenCircuit ? 'degraded' : 'healthy',
    services: circuitBreakers
  };

  if (hasOpenCircuit) {
    health.status = 'degraded';
  }

  // 4. Response Time
  health.responseTime = `${Date.now() - startTime}ms`;

  // Determine HTTP status code
  const statusCode = health.status === 'healthy' ? 200 : 503;

  return res.status(statusCode).json(ResponseFormatter.success(health, 'Health check'));
});

/**
 * GET /api/health/detailed
 * Health check dettagliato con tutti i servizi
 */
router.get('/detailed', async (req, res) => {
  const checks: Record<string, any> = {};

  // 1. Database Check
  try {
    const dbStart = Date.now();
    const result = await prisma.$queryRaw`SELECT COUNT(*) as users FROM "User"`;
    checks.database = {
      status: 'healthy',
      responseTime: `${Date.now() - dbStart}ms`,
      userCount: (result as any)[0].users
    };
  } catch (error: any) {
    checks.database = {
      status: 'unhealthy',
      error: error.message
    };
  }

  // 2. Redis Check (se configurato)
  try {
    // Assumendo che Redis sia configurato
    // const redis = getRedisClient();
    // await redis.ping();
    checks.redis = {
      status: 'not_configured',
      note: 'Redis cache not enabled'
    };
  } catch (error: any) {
    checks.redis = {
      status: 'unhealthy',
      error: error.message
    };
  }

  // 3. External Services con Circuit Breakers
  const retryMetrics = getRetryMetrics();
  checks.externalServices = retryMetrics;

  // 4. System Resources
  const cpuUsage = process.cpuUsage();
  checks.system = {
    cpu: {
      User: `${(cpuUsage.user / 1000000).toFixed(2)}s`,
      system: `${(cpuUsage.system / 1000000).toFixed(2)}s`
    },
    memory: {
      rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(1)}MB`,
      heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)}MB`,
      heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(1)}MB`
    },
    uptime: `${(process.uptime() / 60).toFixed(1)} minutes`,
    nodeVersion: process.version,
    platform: process.platform
  };

  // 5. Application Metrics
  try {
    const [requestCount, userCount, activeRequests] = await Promise.all([
      prisma.assistanceRequest.count(),
      prisma.user.count(),
      prisma.assistanceRequest.count({
        where: {
          status: {
            in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS']
          }
        }
      })
    ]);

    checks.application = {
      totalRequests: requestCount,
      totalUsers: userCount,
      activeRequests,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    };
  } catch (error: any) {
    checks.application = {
      status: 'error',
      error: error.message
    };
  }

  // 6. Security Status
  checks.security = {
    rateLimiting: 'enabled',
    securityHeaders: 'enabled',
    compression: 'enabled',
    requestIdTracking: 'enabled',
    twoFactorAuth: 'available'
  };

  return res.json(ResponseFormatter.success(checks, 'Detailed health check'));
});

/**
 * GET /api/health/ready
 * Readiness probe per Kubernetes/Docker
 */
router.get('/ready', async (req, res) => {
  try {
    // Verifica che il database sia accessibile
    await prisma.$queryRaw`SELECT 1`;
    
    // Verifica che non ci siano circuit breaker aperti critici
    const circuitBreakers = getCircuitBreakerHealth();
    const criticalServicesDown = ['stripe', 'openai'].some(
      service => circuitBreakers[service]?.state === 'OPEN'
    );

    if (criticalServicesDown) {
      return res.status(503).json({
        ready: false,
        reason: 'Critical services unavailable'
      });
    }

    return res.status(200).json({
      ready: true,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Readiness check failed:', error);
    return res.status(503).json(
      ResponseFormatter.error('Readiness check failed', 'CHECK_FAILED', {
        ready: false,
        reason: error.message
      })
    );
  }
});

/**
 * GET /api/health/live
 * Liveness probe per Kubernetes/Docker
 */
router.get('/live', (req, res) => {
  // Se il server risponde, è vivo
  return res.status(200).json(
    ResponseFormatter.success({
      alive: true,
      timestamp: new Date().toISOString(),
      pid: process.pid
    }, 'System alive')
  );
});

/**
 * GET /api/health/detailed
 * Endpoint dettagliato per il ServiceStatusIndicator nel frontend
 */
router.get('/detailed', async (req: any, res: any) => {
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
      if (redisClient && redisClient.isOpen) {
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
          message: 'Redis not connected'
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
      const io = req.app.get('io');
      const socketCount = io ? io.engine?.clientsCount || 0 : 0;
      
      services.push({
        name: 'WebSocket',
        status: io ? 'online' : 'offline',
        message: `${socketCount} client${socketCount !== 1 ? 's' : ''} connected`
      });
    } catch (error) {
      services.push({
        name: 'WebSocket',
        status: 'warning',
        message: 'WebSocket status unknown'
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

    // Determina lo stato generale
    const offlineCount = services.filter(s => s.status === 'offline').length;
    const warningCount = services.filter(s => s.status === 'warning').length;
    
    if (offlineCount > 1) {
      overallStatus = 'critical';
    } else if (offlineCount > 0 || warningCount > 4) {
      overallStatus = 'degraded';
    }

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

export default router;
