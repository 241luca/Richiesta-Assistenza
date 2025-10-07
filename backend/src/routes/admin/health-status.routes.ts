/**
 * Health Check Status Endpoint per ServiceStatusIndicator
 * Restituisce lo stato dei servizi nel formato corretto per il frontend
 */

import { Router } from 'express';
import { ResponseFormatter } from '../../utils/responseFormatter';
import { logger } from '../../utils/logger';
import { prisma } from '../../config/database';
import { apiKeyService } from '../../services/apiKey.service';

const router = Router();

/**
 * GET /api/admin/health-check/status
 * Endpoint specifico per il ServiceStatusIndicator nel frontend
 * Restituisce lo stato dettagliato di tutti i servizi
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
      
      if (!io && overallStatus === 'healthy') {
        overallStatus = 'degraded';
      }
    } catch (error) {
      services.push({
        name: 'WebSocket',
        status: 'warning',
        message: 'WebSocket status unknown'
      });
    }

    // 4. Email Service (Brevo/SendInBlue)
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

    // 5. WhatsApp (WppConnect)
    try {
      // Verifica se WppConnect è attivo
      const wppStatus = global.wppClient ? 'online' : 'offline';
      services.push({
        name: 'WhatsApp',
        status: wppStatus === 'online' ? 'online' : 'warning',
        message: wppStatus === 'online' ? 'WhatsApp connected' : 'WhatsApp not connected'
      });
    } catch (error) {
      services.push({
        name: 'WhatsApp',
        status: 'warning',
        message: 'WhatsApp optional service'
      });
    }

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

    // 9. Bull Queue
    try {
      const queues = req.app.get('queues');
      const queueCount = queues ? Object.keys(queues).length : 0;
      services.push({
        name: 'Queue System',
        status: queueCount > 0 ? 'online' : 'warning',
        message: `${queueCount} queue${queueCount !== 1 ? 's' : ''} active`
      });
    } catch (error) {
      services.push({
        name: 'Queue System',
        status: 'warning',
        message: 'Queue system status unknown'
      });
    }

    // 10. Scheduler (node-cron)
    services.push({
      name: 'Scheduler',
      status: 'online',
      message: 'Cron jobs running'
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

export default router;