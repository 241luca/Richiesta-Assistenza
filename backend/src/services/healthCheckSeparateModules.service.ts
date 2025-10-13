/**
 * Health Check Service - ESTENSIONE MODULI SEPARATI
 * Implementazione di Redis, WebSocket ed EmailService come moduli indipendenti
 * Data: 11 Settembre 2025
 * UPDATED: Rimosso getIO, usa notificationService per Socket.io
 * UPDATED v5.1: Usa API keys dal database
 */

import { PrismaClient } from '@prisma/client';
import { redis } from '../config/redis';
import axios from 'axios';
import { HealthCheckResult } from './healthCheck.service';
import { notificationService } from './notification.service';
import { apiKeyService } from './apiKey.service';

const prisma = new PrismaClient();

/**
 * NUOVO MODULO SEPARATO: Redis Cache System
 * Controllo dedicato per Redis indipendentemente da altri moduli
 */
export async function checkRedisSystem(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const checks: any[] = [];
  const metrics: Record<string, any> = {};
  const warnings: string[] = [];
  const errors: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  try {
    // 1. Test connessione Redis
    try {
      const pingStart = Date.now();
      const pong = await redis.ping();
      const pingTime = Date.now() - pingStart;
      
      metrics.ping_time_ms = pingTime;
      
      if (pong !== 'PONG') {
        checks.push({
          description: 'Redis Connection',
          status: 'fail',
          message: 'Redis not responding correctly',
          severity: 'critical'
        });
        errors.push('Redis connection failed');
        score -= 50;
      } else if (pingTime > 50) {
        checks.push({
          description: 'Redis Connection',
          status: 'warn',
          message: `Connection slow: ${pingTime}ms`,
          severity: 'medium'
        });
        warnings.push('Redis connection is slow');
        score -= 10;
      } else {
        checks.push({
          description: 'Redis Connection',
          status: 'pass',
          message: `Connected in ${pingTime}ms`
        });
      }
    } catch (error) {
      checks.push({
        description: 'Redis Connection',
        status: 'fail',
        message: 'Cannot connect to Redis',
        severity: 'critical'
      });
      errors.push('Redis is not available');
      score -= 50;
    }

    // 2. Memoria utilizzata
    try {
      const info = await redis.info('memory');
      const memoryUsed = info.match(/used_memory_human:(.+)/)?.[1]?.trim();
      const memoryMax = info.match(/maxmemory_human:(.+)/)?.[1]?.trim();
      
      metrics.memory_used = memoryUsed || 'unknown';
      metrics.memory_max = memoryMax || 'unlimited';
      
      // Estrai valore numerico per calcoli
      const usedBytes = parseInt(info.match(/used_memory:(\d+)/)?.[1] || '0');
      const maxBytes = parseInt(info.match(/maxmemory:(\d+)/)?.[1] || '0');
      
      if (maxBytes > 0) {
        const usagePercent = Math.round((usedBytes / maxBytes) * 100);
        metrics.memory_usage_percent = usagePercent;
        
        if (usagePercent > 90) {
          checks.push({
            description: 'Memory Usage',
            status: 'fail',
            message: `Critical: ${usagePercent}% used`,
            severity: 'critical'
          });
          errors.push('Redis memory almost full');
          score -= 30;
        } else if (usagePercent > 75) {
          checks.push({
            description: 'Memory Usage',
            status: 'warn',
            message: `High usage: ${usagePercent}%`,
            severity: 'medium'
          });
          warnings.push('Redis memory usage is high');
          recommendations.push('Consider increasing Redis memory limit');
          score -= 15;
        } else {
          checks.push({
            description: 'Memory Usage',
            status: 'pass',
            message: `Normal: ${memoryUsed} used`
          });
        }
      } else {
        checks.push({
          description: 'Memory Usage',
          status: 'pass',
          message: `Using ${memoryUsed} (no limit set)`
        });
      }
    } catch (error) {
      checks.push({
        description: 'Memory Usage',
        status: 'error',
        message: 'Could not check memory',
        severity: 'low'
      });
    }

    // 3. Numero di chiavi
    try {
      const dbSize = await redis.dbsize();
      metrics.total_keys = dbSize;
      
      if (dbSize > 100000) {
        checks.push({
          description: 'Key Count',
          status: 'warn',
          message: `High key count: ${dbSize}`,
          severity: 'medium'
        });
        warnings.push('Large number of keys in Redis');
        recommendations.push('Review key expiration policies');
        score -= 10;
      } else {
        checks.push({
          description: 'Key Count',
          status: 'pass',
          message: `${dbSize} keys stored`
        });
      }
    } catch (error) {
      checks.push({
        description: 'Key Count',
        status: 'error',
        message: 'Could not count keys',
        severity: 'low'
      });
    }

    // 4. Connessioni client attive
    try {
      const info = await redis.info('clients');
      const connectedClients = parseInt(info.match(/connected_clients:(\d+)/)?.[1] || '0');
      metrics.connected_clients = connectedClients;
      
      if (connectedClients > 100) {
        checks.push({
          description: 'Client Connections',
          status: 'warn',
          message: `High connections: ${connectedClients}`,
          severity: 'low'
        });
        warnings.push('Many Redis connections');
        score -= 5;
      } else {
        checks.push({
          description: 'Client Connections',
          status: 'pass',
          message: `${connectedClients} clients connected`
        });
      }
    } catch (error) {
      checks.push({
        description: 'Client Connections',
        status: 'error',
        message: 'Could not check connections',
        severity: 'low'
      });
    }

    // 5. Performance - Operations per second
    try {
      const info = await redis.info('stats');
      const opsPerSec = parseInt(info.match(/instantaneous_ops_per_sec:(\d+)/)?.[1] || '0');
      metrics.ops_per_second = opsPerSec;
      
      checks.push({
        description: 'Operations Performance',
        status: 'pass',
        message: `${opsPerSec} ops/second`
      });
    } catch (error) {
      checks.push({
        description: 'Operations Performance',
        status: 'error',
        message: 'Could not check performance',
        severity: 'low'
      });
    }

    // 6. Persistenza su disco
    try {
      const info = await redis.info('persistence');
      const lastSave = info.match(/rdb_last_save_time:(\d+)/)?.[1];
      
      if (lastSave) {
        const lastSaveDate = new Date(parseInt(lastSave) * 1000);
        const hoursSinceBackup = Math.round((Date.now() - lastSaveDate.getTime()) / (1000 * 60 * 60));
        metrics.last_save_hours_ago = hoursSinceBackup;
        
        if (hoursSinceBackup > 24) {
          checks.push({
            description: 'Data Persistence',
            status: 'warn',
            message: `Last save ${hoursSinceBackup}h ago`,
            severity: 'medium'
          });
          warnings.push('Redis backup is old');
          score -= 10;
        } else {
          checks.push({
            description: 'Data Persistence',
            status: 'pass',
            message: `Last save ${hoursSinceBackup}h ago`
          });
        }
      }
    } catch (error) {
      checks.push({
        description: 'Data Persistence',
        status: 'error',
        message: 'Could not check persistence',
        severity: 'low'
      });
    }

  } catch (error: any) {
    errors.push(`Redis check failed: ${error.message}`);
    score = 0;
  }

  return {
    module: 'redis',
    displayName: 'Redis Cache System',
    timestamp: new Date(),
    status: score >= 80 ? 'healthy' : score >= 60 ? 'warning' : 'critical',
    score: Math.max(0, score),
    checks,
    metrics,
    warnings,
    errors,
    recommendations,
    executionTime: Date.now() - startTime
  };
}

/**
 * NUOVO MODULO SEPARATO: WebSocket Server
 * Controllo dedicato per Socket.io indipendentemente da altri moduli
 */
export async function checkWebSocketSystem(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const checks: any[] = [];
  const metrics: Record<string, any> = {};
  const warnings: string[] = [];
  const errors: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  try {
    // Verifica stato e metriche dal NotificationService
    if (!notificationService) {
      checks.push({
        description: 'NotificationService',
        status: 'fail',
        message: 'NotificationService non disponibile',
        severity: 'critical'
      });
      errors.push('NotificationService non è in esecuzione');
      score = 0;
    } else {
      const ws = notificationService.getWebSocketMetrics();

      metrics.websocket_clients = ws.clientsCount;
      metrics.websocket_rooms = ws.roomsCount;
      metrics.websocket_namespaces = ws.namespaces;

      if (!ws.isConnected) {
        checks.push({
          description: 'Socket.io Server',
          status: 'fail',
          message: 'Socket.io non inizializzato',
          severity: 'critical'
        });
        errors.push('Socket.io non è inizializzato');
        score = 0;
      } else {
        checks.push({
          description: 'Socket.io Server',
          status: 'pass',
          message: `${ws.clientsCount} connessioni attive`
        });

        // Avvisi su condizioni tipiche
        if (ws.clientsCount === 0) {
          checks.push({
            description: 'Connessioni WebSocket',
            status: 'warn',
            message: 'Nessuna connessione WebSocket attiva',
            severity: 'low'
          });
          warnings.push('Nessun client WebSocket connesso');
          score -= 5;
        }

        if (ws.roomsCount > 1000) {
          checks.push({
            description: 'Numero stanze',
            status: 'warn',
            message: `Molte stanze attive (${ws.roomsCount})`,
            severity: 'medium'
          });
          warnings.push('Elevato numero di stanze WebSocket');
          recommendations.push('Valutare cleanup/ottimizzazione delle room');
          score -= 10;
        } else {
          checks.push({
            description: 'Numero stanze',
            status: 'pass',
            message: `${ws.roomsCount} stanze attive`
          });
        }

        checks.push({
          description: 'Namespaces',
          status: 'info',
          message: `Namespaces: ${ws.namespaces.join(', ') || '/'}`
        });
      }
    }

  } catch (error: any) {
    errors.push(`WebSocket check failed: ${error.message}`);
    score = 0;
  }

  return {
    module: 'websocket',
    displayName: 'WebSocket Server',
    timestamp: new Date(),
    status: score >= 80 ? 'healthy' : score >= 60 ? 'warning' : 'critical',
    score: Math.max(0, score),
    checks,
    metrics,
    warnings,
    errors,
    recommendations,
    executionTime: Date.now() - startTime
  };
}

/**
 * NUOVO MODULO SEPARATO: Email Service (Brevo)
 * Controllo dedicato per il servizio email indipendentemente da altri moduli
 */
export async function checkEmailService(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const checks: any[] = [];
  const metrics: Record<string, any> = {};
  const warnings: string[] = [];
  const errors: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  try {
    // 1. Verifica configurazione API Brevo dal database
    const apiKeyData = await apiKeyService.getApiKey('BREVO', true);
    const apiKey = apiKeyData?.key;
    
    if (!apiKey) {
      checks.push({
        description: 'Brevo API Configuration',
        status: 'fail',
        message: 'API key not configured',
        severity: 'critical'
      });
      errors.push('Email service not configured');
      score -= 50;
      
      return {
        module: 'emailservice',
        displayName: 'Email Service (Brevo)',
        timestamp: new Date(),
        status: 'critical',
        score,
        checks,
        metrics,
        warnings,
        errors,
        recommendations: ['Configure BREVO_API_KEY'],
        executionTime: Date.now() - startTime
      };
    }

    checks.push({
      description: 'Brevo API Configuration',
      status: 'pass',
      message: 'API key configured'
    });

    // 2. Test connessione API Brevo
    try {
      const response = await axios.get('https://api.brevo.com/v3/account', {
        headers: {
          'api-key': apiKey,
          'accept': 'application/json'
        },
        timeout: 5000
      });

      if (response.status === 200) {
        const accountData = response.data;
        metrics.account_email = accountData.email;
        metrics.plan_type = accountData.plan?.[0]?.type || 'unknown';
        
        checks.push({
          description: 'Brevo API Connection',
          status: 'pass',
          message: 'Connected successfully'
        });
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        checks.push({
          description: 'Brevo API Connection',
          status: 'fail',
          message: 'Invalid API key',
          severity: 'critical'
        });
        errors.push('Invalid Brevo API key');
        score -= 40;
      } else {
        checks.push({
          description: 'Brevo API Connection',
          status: 'warn',
          message: 'Connection failed',
          severity: 'high'
        });
        warnings.push('Cannot connect to Brevo');
        score -= 20;
      }
    }

    // 3. Verifica quota email
    try {
      const response = await axios.get('https://api.brevo.com/v3/account', {
        headers: {
          'api-key': apiKey,
          'accept': 'application/json'
        },
        timeout: 5000
      });

      const credits = response.data.plan?.[0]?.credits;
      if (credits !== undefined) {
        metrics.email_credits = credits;
        
        if (credits < 100) {
          checks.push({
            description: 'Email Quota',
            status: 'warn',
            message: `Low credits: ${credits}`,
            severity: 'high'
          });
          warnings.push('Low email credits');
          recommendations.push('Top up email credits');
          score -= 20;
        } else {
          checks.push({
            description: 'Email Quota',
            status: 'pass',
            message: `${credits} credits available`
          });
        }
      }
    } catch (error) {
      checks.push({
        description: 'Email Quota',
        status: 'error',
        message: 'Could not check quota',
        severity: 'medium'
      });
    }

    // 4. Statistiche invio (ultime 24h)
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const response = await axios.get('https://api.brevo.com/v3/smtp/statistics/aggregatedReport', {
        headers: {
          'api-key': apiKey,
          'accept': 'application/json'
        },
        params: {
          startDate: yesterday.toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        },
        timeout: 5000
      });

      if (response.data) {
        const stats = response.data;
        metrics.emails_sent_24h = stats.requests || 0;
        metrics.delivered_24h = stats.delivered || 0;
        metrics.bounced_24h = stats.hardBounces + stats.softBounces || 0;
        metrics.opened_24h = stats.opens || 0;
        
        const deliveryRate = metrics.emails_sent_24h > 0 
          ? Math.round((metrics.delivered_24h / metrics.emails_sent_24h) * 100)
          : 100;
        
        metrics.delivery_rate = deliveryRate;
        
        if (deliveryRate < 95 && metrics.emails_sent_24h > 0) {
          checks.push({
            description: 'Email Delivery Rate (24h)',
            status: 'warn',
            message: `Delivery rate: ${deliveryRate}%`,
            severity: 'medium'
          });
          warnings.push('Low email delivery rate');
          recommendations.push('Check bounced emails');
          score -= 15;
        } else {
          checks.push({
            description: 'Email Delivery Rate (24h)',
            status: 'pass',
            message: `Delivery rate: ${deliveryRate}%`
          });
        }
      }
    } catch (error) {
      checks.push({
        description: 'Email Delivery Rate (24h)',
        status: 'error',
        message: 'Could not fetch statistics',
        severity: 'low'
      });
    }

    // 5. Verifica template configurati
    try {
      const response = await axios.get('https://api.brevo.com/v3/smtp/templates', {
        headers: {
          'api-key': apiKey,
          'accept': 'application/json'
        },
        params: {
          limit: 50
        },
        timeout: 5000
      });

      const templates = response.data.templates || [];
      metrics.email_templates = templates.length;
      
      if (templates.length === 0) {
        checks.push({
          description: 'Email Templates',
          status: 'warn',
          message: 'No templates configured',
          severity: 'medium'
        });
        warnings.push('No email templates');
        recommendations.push('Create email templates');
        score -= 10;
      } else {
        checks.push({
          description: 'Email Templates',
          status: 'pass',
          message: `${templates.length} templates configured`
        });
      }
    } catch (error) {
      checks.push({
        description: 'Email Templates',
        status: 'error',
        message: 'Could not check templates',
        severity: 'low'
      });
    }

    // 6. Verifica domini verificati
    try {
      const response = await axios.get('https://api.brevo.com/v3/senders', {
        headers: {
          'api-key': apiKey,
          'accept': 'application/json'
        },
        timeout: 5000
      });

      const senders = response.data.senders || [];
      metrics.verified_senders = senders.length;
      
      if (senders.length === 0) {
        checks.push({
          description: 'Verified Senders',
          status: 'warn',
          message: 'No verified senders',
          severity: 'high'
        });
        warnings.push('No verified email senders');
        recommendations.push('Verify sender domains');
        score -= 20;
      } else {
        checks.push({
          description: 'Verified Senders',
          status: 'pass',
          message: `${senders.length} verified senders`
        });
      }
    } catch (error) {
      checks.push({
        description: 'Verified Senders',
        status: 'error',
        message: 'Could not check senders',
        severity: 'medium'
      });
    }

  } catch (error: any) {
    errors.push(`Email service check failed: ${error.message}`);
    score = 0;
  }

  return {
    module: 'emailservice',
    displayName: 'Email Service (Brevo)',
    timestamp: new Date(),
    status: score >= 80 ? 'healthy' : score >= 60 ? 'warning' : 'critical',
    score: Math.max(0, score),
    checks,
    metrics,
    warnings,
    errors,
    recommendations,
    executionTime: Date.now() - startTime
  };
}

/**
 * CONTROLLO COMPLETO: Sistema AI (OpenAI)
 * Questo modulo era mancante nel service principale
 */
export async function checkAISystem(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const checks: any[] = [];
  const metrics: Record<string, any> = {};
  const warnings: string[] = [];
  const errors: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  try {
    // 1. Verifica configurazione OpenAI dal database
    const apiKeyData = await apiKeyService.getApiKey('OPENAI', true);
    const apiKey = apiKeyData?.key;
    
    if (!apiKey) {
      checks.push({
        description: 'OpenAI API Configuration',
        status: 'fail',
        message: 'API key not configured',
        severity: 'critical'
      });
      errors.push('AI service not configured');
      score -= 50;
      
      return {
        module: 'ai',
        displayName: 'Sistema AI (OpenAI)',
        timestamp: new Date(),
        status: 'critical',
        score,
        checks,
        metrics,
        warnings,
        errors,
        recommendations: ['Configure OPENAI_API_KEY'],
        executionTime: Date.now() - startTime
      };
    }

    checks.push({
      description: 'OpenAI API Configuration',
      status: 'pass',
      message: 'API key configured'
    });

    // 2. Test connessione OpenAI
    try {
      const response = await axios.get('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      if (response.status === 200) {
        const models = response.data.data || [];
        metrics.available_models = models.length;
        
        checks.push({
          description: 'OpenAI API Connection',
          status: 'pass',
          message: `Connected, ${models.length} models available`
        });
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        checks.push({
          description: 'OpenAI API Connection',
          status: 'fail',
          message: 'Invalid API key',
          severity: 'critical'
        });
        errors.push('Invalid OpenAI API key');
        score -= 40;
      } else {
        checks.push({
          description: 'OpenAI API Connection',
          status: 'warn',
          message: 'Connection failed',
          severity: 'high'
        });
        warnings.push('Cannot connect to OpenAI');
        score -= 20;
      }
    }

    // 3. Verifica utilizzo token (dalle tabelle del database)
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Conta conversazioni AI nelle ultime 24h (usiamo AiConversation)
      const aiUsage = await prisma.aiConversation.findMany({
        where: {
          createdAt: { gte: yesterday }
        },
        select: {
          totalTokens: true,
          startedAt: true,
          endedAt: true
        }
      });
      
      const totalTokens = aiUsage.reduce((sum, log) => sum + (log.totalTokens || 0), 0);
      metrics.tokens_used_24h = totalTokens;
      metrics.requests_24h = aiUsage.length;
      
      if (totalTokens > 100000) {
        checks.push({
          description: 'Token Usage (24h)',
          status: 'warn',
          message: `High usage: ${totalTokens} tokens`,
          severity: 'medium'
        });
        warnings.push('High AI token usage');
        recommendations.push('Monitor AI costs');
        score -= 10;
      } else {
        checks.push({
          description: 'Token Usage (24h)',
          status: 'pass',
          message: `${totalTokens} tokens used`
        });
      }
    } catch (error) {
      checks.push({
        description: 'Token Usage (24h)',
        status: 'error',
        message: 'Could not check usage',
        severity: 'low'
      });
    }

    // 4. Tempo di risposta medio
    try {
      const recentLogs = await prisma.aiConversation.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        },
        select: {
          startedAt: true,
          endedAt: true
        }
      });
      
      if (recentLogs.length > 0) {
        const responseTimes = recentLogs
          .map(log => (log.endedAt && log.startedAt) ? (log.endedAt.getTime() - log.startedAt.getTime()) : 0)
          .filter(rt => rt > 0);
        
        const avgResponseTime = responseTimes.length > 0
          ? responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length
          : 0;
        
        metrics.avg_response_time_ms = Math.round(avgResponseTime);
        
        if (avgResponseTime > 5000) {
          checks.push({
            description: 'AI Response Time',
            status: 'warn',
            message: `Slow: ${Math.round(avgResponseTime)}ms avg`,
            severity: 'medium'
          });
          warnings.push('Slow AI responses');
          score -= 10;
        } else {
          checks.push({
            description: 'AI Response Time',
            status: 'pass',
            message: `${Math.round(avgResponseTime)}ms average`
          });
        }
      }
    } catch (error) {
      checks.push({
        description: 'AI Response Time',
        status: 'error',
        message: 'Could not check response times',
        severity: 'low'
      });
    }

    // 5. Rate limiting
    try {
      const rateLimitKey = `ai:ratelimit:${new Date().getHours()}`;
      const currentRequests = await redis.get(rateLimitKey);
      
      metrics.requests_this_hour = parseInt(currentRequests || '0');
      
      // Assumiamo un limite di 1000 richieste/ora
      const maxRequestsPerHour = 1000;
      
      if (metrics.requests_this_hour > maxRequestsPerHour * 0.8) {
        checks.push({
          description: 'AI Rate Limiting',
          status: 'warn',
          message: `Near limit: ${metrics.requests_this_hour}/${maxRequestsPerHour}`,
          severity: 'medium'
        });
        warnings.push('Approaching AI rate limit');
        score -= 10;
      } else {
        checks.push({
          description: 'AI Rate Limiting',
          status: 'pass',
          message: `${metrics.requests_this_hour} requests this hour`
        });
      }
    } catch (error) {
      checks.push({
        description: 'AI Rate Limiting',
        status: 'error',
        message: 'Could not check rate limits',
        severity: 'low'
      });
    }

  } catch (error: any) {
    errors.push(`AI system check failed: ${error.message}`);
    score = 0;
  }

  return {
    module: 'ai',
    displayName: 'Sistema AI (OpenAI)',
    timestamp: new Date(),
    status: score >= 80 ? 'healthy' : score >= 60 ? 'warning' : 'critical',
    score: Math.max(0, score),
    checks,
    metrics,
    warnings,
    errors,
    recommendations,
    executionTime: Date.now() - startTime
  };
}
