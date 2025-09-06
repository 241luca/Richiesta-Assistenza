/**
 * Health Check Avanzato con Monitoring Servizi
 */

import { Router } from 'express';
import { ResponseFormatter } from '../utils/responseFormatter';
import { getCircuitBreakerHealth, getRetryMetrics } from '../utils/retryLogic';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

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
    return res.status(503).json({
      ready: false,
      reason: error.message
    });
  }
});

/**
 * GET /api/health/live
 * Liveness probe per Kubernetes/Docker
 */
router.get('/live', (req, res) => {
  // Se il server risponde, è vivo
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString(),
    pid: process.pid
  });
});

export default router;
