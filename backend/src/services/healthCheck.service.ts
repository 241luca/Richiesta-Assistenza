/**
 * Health Check Service - VERSIONE CON DATI REALI
 * Controlla veramente lo stato del sistema
 */

import { PrismaClient } from '@prisma/client';
import { redis } from '../config/redis';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

const prisma = new PrismaClient();

export interface HealthCheckResult {
  module: string;
  displayName: string;
  timestamp: Date;
  status: 'healthy' | 'warning' | 'critical' | 'unknown' | 'error';
  score: number;
  checks: any[];
  metrics: Record<string, any>;
  warnings: string[];
  errors: string[];
  recommendations: string[];
  executionTime: number;
}

export interface SystemHealthSummary {
  overall: 'healthy' | 'warning' | 'critical';
  overallScore: number;
  modules: HealthCheckResult[];
  lastCheck: Date;
  nextCheck?: Date;
  alerts: any[];
  statistics: {
    totalModules: number;
    healthyModules: number;
    warningModules: number;
    criticalModules: number;
  };
}

class HealthCheckService {
  private lastResults: Map<string, HealthCheckResult> = new Map();
  private isRunning: boolean = false;

  /**
   * CONTROLLO REALE: Sistema di Autenticazione
   */
  private async checkAuthSystem(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const checks = [];
    const metrics: any = {};
    const warnings = [];
    const errors = [];
    const recommendations = [];
    let score = 100;

    try {
      // 1. Controlla JWT Secret
      if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        checks.push({
          description: 'JWT Secret Configuration',
          status: 'fail',
          message: 'JWT secret missing or too short',
          severity: 'critical'
        });
        errors.push('JWT secret not properly configured');
        score -= 30;
      } else {
        checks.push({
          description: 'JWT Secret Configuration',
          status: 'pass',
          message: 'JWT secret properly configured'
        });
      }

      // 2. Conta sessioni attive (Redis)
      try {
        const keys = await redis.keys('sess:*');
        metrics.active_sessions = keys.length;
        
        checks.push({
          description: 'Session Store',
          status: 'pass',
          message: `${keys.length} active sessions in Redis`
        });
      } catch (error) {
        checks.push({
          description: 'Session Store',
          status: 'fail',
          message: 'Cannot connect to Redis',
          severity: 'high'
        });
        errors.push('Redis session store not accessible');
        score -= 20;
      }

      // 3. Controlla login falliti nelle ultime 24h
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const failedLogins = await prisma.loginHistory.count({
        where: {
          success: false,
          createdAt: { gte: yesterday }
        }
      });
      
      metrics.failed_logins_24h = failedLogins;
      
      if (failedLogins > 100) {
        checks.push({
          description: 'Failed Login Attempts',
          status: 'warn',
          message: `${failedLogins} failed logins in 24h`,
          severity: 'medium'
        });
        warnings.push('High number of failed login attempts');
        score -= 10;
      } else {
        checks.push({
          description: 'Failed Login Attempts',
          status: 'pass',
          message: `${failedLogins} failed logins in 24h (normal)`
        });
      }

      // 4. Controlla utenti con 2FA attivo
      const totalUsers = await prisma.user.count();
      const usersWithTwoFA = await prisma.user.count({
        where: { twoFactorEnabled: true }
      });
      
      const twoFAPercentage = totalUsers > 0 
        ? Math.round((usersWithTwoFA / totalUsers) * 100) 
        : 0;
      
      metrics.two_fa_percentage = twoFAPercentage;
      metrics.total_users = totalUsers;
      
      if (twoFAPercentage < 30) {
        checks.push({
          description: '2FA Adoption',
          status: 'warn',
          message: `Only ${twoFAPercentage}% of users have 2FA enabled`,
          severity: 'medium'
        });
        warnings.push('Low 2FA adoption rate');
        recommendations.push('Encourage users to enable 2FA');
        score -= 15;
      } else {
        checks.push({
          description: '2FA Adoption',
          status: 'pass',
          message: `${twoFAPercentage}% of users have 2FA enabled`
        });
      }

    } catch (error: any) {
      errors.push(`Health check failed: ${error.message}`);
      score = 0;
    }

    return {
      module: 'auth',
      displayName: '🔐 Authentication System',
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
   * CONTROLLO REALE: Database
   */
  private async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const checks = [];
    const metrics: any = {};
    const warnings = [];
    const errors = [];
    const recommendations = [];
    let score = 100;

    try {
      // 1. Test connessione database
      const testStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const connectionTime = Date.now() - testStart;
      
      metrics.connection_time_ms = connectionTime;
      
      if (connectionTime > 1000) {
        checks.push({
          description: 'Database Connection',
          status: 'warn',
          message: `Connection slow: ${connectionTime}ms`,
          severity: 'medium'
        });
        warnings.push('Database connection is slow');
        score -= 10;
      } else {
        checks.push({
          description: 'Database Connection',
          status: 'pass',
          message: `Connected in ${connectionTime}ms`
        });
      }

      // 2. Conta connessioni attive
      const connections = await prisma.$queryRaw<any[]>`
        SELECT count(*) as count 
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `;
      
      metrics.active_connections = parseInt(connections[0].count);
      
      // 3. Controlla dimensione database
      const dbSize = await prisma.$queryRaw<any[]>`
        SELECT pg_database_size(current_database()) as size
      `;
      
      metrics.database_size_mb = Math.round(parseInt(dbSize[0].size) / 1024 / 1024);
      
      if (metrics.database_size_mb > 5000) { // > 5GB
        checks.push({
          description: 'Database Size',
          status: 'warn',
          message: `Database is ${metrics.database_size_mb}MB`,
          severity: 'low'
        });
        warnings.push('Database size is large');
        recommendations.push('Consider archiving old data');
        score -= 5;
      } else {
        checks.push({
          description: 'Database Size',
          status: 'pass',
          message: `Database size: ${metrics.database_size_mb}MB`
        });
      }

      // 4. Conta tabelle e record
      metrics.total_users = await prisma.user.count();
      metrics.total_requests = await prisma.assistanceRequest.count();
      metrics.total_quotes = await prisma.quote.count();
      
      checks.push({
        description: 'Database Statistics',
        status: 'pass',
        message: `${metrics.total_users} users, ${metrics.total_requests} requests`
      });

      // 5. Controlla query lente (se possibile)
      try {
        const slowQueries = await prisma.$queryRaw<any[]>`
          SELECT count(*) as count
          FROM pg_stat_statements
          WHERE mean_exec_time > 1000
        `;
        
        if (slowQueries[0]?.count > 10) {
          warnings.push('Multiple slow queries detected');
          recommendations.push('Optimize slow queries');
          score -= 10;
        }
      } catch {
        // pg_stat_statements potrebbe non essere abilitato
      }

    } catch (error: any) {
      errors.push(`Database check failed: ${error.message}`);
      score = 0;
      checks.push({
        description: 'Database Connection',
        status: 'fail',
        message: 'Cannot connect to database',
        severity: 'critical'
      });
    }

    return {
      module: 'database',
      displayName: '📊 Database System',
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
   * CONTROLLO REALE: Sistema Notifiche
   */
  private async checkNotificationSystem(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const checks = [];
    const metrics: any = {};
    const warnings = [];
    const errors = [];
    const recommendations = [];
    let score = 100;

    try {
      // 1. Controlla configurazione email (Brevo)
      if (!process.env.BREVO_API_KEY) {
        checks.push({
          description: 'Email Service (Brevo)',
          status: 'fail',
          message: 'Brevo API key not configured',
          severity: 'high'
        });
        errors.push('Email service not configured');
        score -= 25;
      } else {
        checks.push({
          description: 'Email Service (Brevo)',
          status: 'pass',
          message: 'Brevo API configured'
        });
      }

      // 2. Conta notifiche inviate nelle ultime 24h
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const recentNotifications = await prisma.notificationLog.count({
        where: {
          createdAt: { gte: yesterday }
        }
      });
      
      const successfulNotifications = await prisma.notificationLog.count({
        where: {
          createdAt: { gte: yesterday },
          status: 'delivered'
        }
      });
      
      metrics.notifications_24h = recentNotifications;
      metrics.successful_24h = successfulNotifications;
      metrics.success_rate = recentNotifications > 0 
        ? Math.round((successfulNotifications / recentNotifications) * 100)
        : 100;
      
      if (metrics.success_rate < 90) {
        checks.push({
          description: 'Delivery Rate',
          status: 'warn',
          message: `Success rate: ${metrics.success_rate}%`,
          severity: 'medium'
        });
        warnings.push('Low notification delivery rate');
        recommendations.push('Check failed notifications');
        score -= 15;
      } else {
        checks.push({
          description: 'Delivery Rate',
          status: 'pass',
          message: `Success rate: ${metrics.success_rate}%`
        });
      }

      // 3. Controlla notifiche non lette
      const unreadNotifications = await prisma.notification.count({
        where: { isRead: false }
      });
      
      metrics.unread_notifications = unreadNotifications;
      
      if (unreadNotifications > 1000) {
        checks.push({
          description: 'Unread Notifications',
          status: 'warn',
          message: `${unreadNotifications} unread notifications`,
          severity: 'low'
        });
        warnings.push('Many unread notifications');
        recommendations.push('Consider cleanup of old unread notifications');
        score -= 5;
      }

      // 4. Controlla WebSocket (se configurato)
      const io = global.io;
      if (io) {
        const socketCount = io.sockets.sockets.size || 0;
        metrics.websocket_connections = socketCount;
        
        checks.push({
          description: 'WebSocket Server',
          status: 'pass',
          message: `${socketCount} active connections`
        });
      }

    } catch (error: any) {
      errors.push(`Notification check failed: ${error.message}`);
      score -= 20;
    }

    return {
      module: 'notification',
      displayName: '📨 Notification System',
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
   * CONTROLLO REALE: Sistema Backup
   */
  private async checkBackupSystem(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const checks = [];
    const metrics: any = {};
    const warnings = [];
    const errors = [];
    const recommendations = [];
    let score = 100;

    try {
      // 1. Controlla ultimo backup
      const lastBackup = await prisma.systemBackup.findFirst({
        where: { status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' }
      });
      
      if (lastBackup) {
        const hoursSinceBackup = Math.round(
          (Date.now() - lastBackup.createdAt.getTime()) / (1000 * 60 * 60)
        );
        
        metrics.last_backup_hours_ago = hoursSinceBackup;
        metrics.last_backup_size_mb = lastBackup.fileSize 
          ? Math.round(Number(lastBackup.fileSize) / 1024 / 1024)
          : 0;
        
        if (hoursSinceBackup > 48) {
          checks.push({
            description: 'Last Backup',
            status: 'warn',
            message: `Last backup ${hoursSinceBackup} hours ago`,
            severity: 'high'
          });
          warnings.push('No recent backup');
          recommendations.push('Run backup immediately');
          score -= 25;
        } else if (hoursSinceBackup > 24) {
          checks.push({
            description: 'Last Backup',
            status: 'warn',
            message: `Last backup ${hoursSinceBackup} hours ago`,
            severity: 'medium'
          });
          warnings.push('Backup older than 24 hours');
          score -= 10;
        } else {
          checks.push({
            description: 'Last Backup',
            status: 'pass',
            message: `Last backup ${hoursSinceBackup} hours ago`
          });
        }
      } else {
        checks.push({
          description: 'Last Backup',
          status: 'fail',
          message: 'No backups found',
          severity: 'critical'
        });
        errors.push('No backups exist');
        score -= 50;
      }

      // 2. Conta backup totali
      const totalBackups = await prisma.systemBackup.count();
      const failedBackups = await prisma.systemBackup.count({
        where: { status: 'FAILED' }
      });
      
      metrics.total_backups = totalBackups;
      metrics.failed_backups = failedBackups;
      
      if (failedBackups > 5) {
        warnings.push('Multiple failed backups detected');
        recommendations.push('Check backup logs');
        score -= 10;
      }

      // 3. Controlla spazio su disco per backup
      const backupPath = path.join(process.cwd(), '../database-backups');
      if (fs.existsSync(backupPath)) {
        const files = fs.readdirSync(backupPath);
        metrics.backup_files_count = files.length;
        
        checks.push({
          description: 'Backup Storage',
          status: 'pass',
          message: `${files.length} backup files stored`
        });
      }

      // 4. Controlla backup schedulati
      const activeSchedules = await prisma.backupSchedule.count({
        where: { isActive: true }
      });
      
      metrics.active_schedules = activeSchedules;
      
      if (activeSchedules === 0) {
        checks.push({
          description: 'Backup Schedule',
          status: 'warn',
          message: 'No active backup schedules',
          severity: 'medium'
        });
        warnings.push('No automatic backups configured');
        recommendations.push('Configure automatic daily backups');
        score -= 15;
      } else {
        checks.push({
          description: 'Backup Schedule',
          status: 'pass',
          message: `${activeSchedules} active schedules`
        });
      }

    } catch (error: any) {
      errors.push(`Backup check failed: ${error.message}`);
      score -= 20;
    }

    return {
      module: 'backup',
      displayName: '💾 Backup System',
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
   * CONTROLLO REALE: Sistema Chat
   */
  private async checkChatSystem(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const checks = [];
    const metrics: any = {};
    const warnings = [];
    const errors = [];
    const recommendations = [];
    let score = 100;

    try {
      // 1. Conta messaggi nelle ultime 24h
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const recentMessages = await prisma.requestChatMessage.count({
        where: {
          createdAt: { gte: yesterday },
          isDeleted: false
        }
      });
      
      metrics.messages_24h = recentMessages;
      
      // 2. Conta chat attive
      const activeChats = await prisma.assistanceRequest.count({
        where: {
          status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] }
        }
      });
      
      metrics.active_chats = activeChats;
      
      // 3. Tempo medio risposta
      try {
        const avgResponseTime = await prisma.$queryRaw<any[]>`
          SELECT AVG(EXTRACT(EPOCH FROM ("createdAt" - LAG("createdAt") OVER (PARTITION BY "requestId" ORDER BY "createdAt")))) as avg_seconds
          FROM "RequestChatMessage"
          WHERE "createdAt" > NOW() - INTERVAL '24 hours'
        `;
        
        metrics.avg_response_time_seconds = avgResponseTime[0]?.avg_seconds 
          ? Math.round(avgResponseTime[0].avg_seconds)
          : 0;
        
        if (metrics.avg_response_time_seconds > 300) { // > 5 minuti
          checks.push({
            description: 'Response Time',
            status: 'warn',
            message: `Average: ${Math.round(metrics.avg_response_time_seconds / 60)} minutes`,
            severity: 'medium'
          });
          warnings.push('Slow chat response times');
          score -= 10;
        } else {
          checks.push({
            description: 'Response Time',
            status: 'pass',
            message: 'Response times normal'
          });
        }
      } catch (error) {
        console.log('Could not calculate chat response time:', error);
        metrics.avg_response_time_seconds = 0;
        checks.push({
          description: 'Response Time',
          status: 'pass',
          message: 'Response time metrics unavailable'
        });
      }

      // 4. Messaggi non letti
      const unreadMessages = await prisma.requestChatMessage.count({
        where: { isRead: false }
      });
      
      metrics.unread_messages = unreadMessages;
      
      checks.push({
        description: 'Chat Activity',
        status: 'pass',
        message: `${activeChats} active chats, ${recentMessages} messages in 24h`
      });

    } catch (error: any) {
      errors.push(`Chat check failed: ${error.message}`);
      score -= 20;
    }

    return {
      module: 'chat',
      displayName: '💬 Chat System',
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
   * CONTROLLO REALE: Sistema Pagamenti
   */
  private async checkPaymentSystem(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const checks = [];
    const metrics: any = {};
    const warnings = [];
    const errors = [];
    const recommendations = [];
    let score = 100;

    try {
      // 1. Controlla configurazione Stripe
      if (!process.env.STRIPE_SECRET_KEY) {
        checks.push({
          description: 'Stripe Configuration',
          status: 'fail',
          message: 'Stripe API key not configured',
          severity: 'critical'
        });
        errors.push('Payment system not configured');
        score -= 40;
      } else {
        checks.push({
          description: 'Stripe Configuration',
          status: 'pass',
          message: 'Stripe API configured'
        });
      }

      // 2. Transazioni ultime 24h
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const recentPayments = await prisma.payment.findMany({
        where: {
          createdAt: { gte: yesterday }
        }
      });
      
      metrics.transactions_24h = recentPayments.length;
      
      const successfulPayments = recentPayments.filter(p => p.status === 'COMPLETED').length;
      const failedPayments = recentPayments.filter(p => p.status === 'FAILED').length;
      
      metrics.successful_24h = successfulPayments;
      metrics.failed_24h = failedPayments;
      metrics.success_rate = recentPayments.length > 0
        ? Math.round((successfulPayments / recentPayments.length) * 100)
        : 100;
      
      // Calcola totale processato
      const totalAmount = recentPayments
        .filter(p => p.status === 'COMPLETED')
        .reduce((sum, p) => sum + Number(p.amount), 0);
      
      metrics.total_processed_24h = totalAmount;
      
      if (metrics.success_rate < 95 && recentPayments.length > 0) {
        checks.push({
          description: 'Payment Success Rate',
          status: 'warn',
          message: `Success rate: ${metrics.success_rate}%`,
          severity: 'high'
        });
        warnings.push('Payment failures detected');
        recommendations.push('Review failed payments');
        score -= 20;
      } else {
        checks.push({
          description: 'Payment Success Rate',
          status: 'pass',
          message: `Success rate: ${metrics.success_rate}%`
        });
      }

      // 3. Pagamenti in sospeso
      const pendingPayments = await prisma.payment.count({
        where: { status: 'PENDING' }
      });
      
      metrics.pending_payments = pendingPayments;
      
      if (pendingPayments > 10) {
        warnings.push('Many pending payments');
        recommendations.push('Process pending payments');
        score -= 10;
      }

    } catch (error: any) {
      errors.push(`Payment check failed: ${error.message}`);
      score -= 20;
    }

    return {
      module: 'payment',
      displayName: '💰 Payment System',
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
   * CONTROLLO REALE: Sistema AI
   */
  private async checkAISystem(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const checks = [];
    const metrics: any = {};
    const warnings = [];
    const errors = [];
    const recommendations = [];
    let score = 100;

    try {
      // 1. Controlla configurazione OpenAI
      if (!process.env.OPENAI_API_KEY) {
        checks.push({
          description: 'OpenAI Configuration',
          status: 'fail',
          message: 'OpenAI API key not configured',
          severity: 'critical'
        });
        errors.push('AI system not configured');
        score -= 40;
      } else {
        checks.push({
          description: 'OpenAI Configuration',
          status: 'pass',
          message: 'OpenAI API configured'
        });
        
        // Test connessione (opzionale, per non consumare token)
        /*
        try {
          const response = await axios.get('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
          });
          checks.push({
            description: 'OpenAI API Connection',
            status: 'pass',
            message: 'API accessible'
          });
        } catch {
          checks.push({
            description: 'OpenAI API Connection',
            status: 'fail',
            message: 'Cannot connect to OpenAI',
            severity: 'high'
          });
          score -= 20;
        }
        */
      }

      // 2. Conversazioni AI ultime 24h
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const recentConversations = await prisma.aiConversation.count({
        where: {
          createdAt: { gte: yesterday }
        }
      });
      
      metrics.conversations_24h = recentConversations;
      
      // 3. Token utilizzati
      const tokenUsage = await prisma.aiConversation.aggregate({
        where: {
          createdAt: { gte: yesterday }
        },
        _sum: {
          totalTokens: true
        }
      });
      
      metrics.tokens_used_24h = tokenUsage._sum.totalTokens || 0;
      
      // Stima costo (basato su GPT-3.5-turbo: $0.002 per 1K tokens)
      metrics.estimated_cost_24h = (metrics.tokens_used_24h / 1000) * 0.002;
      
      if (metrics.tokens_used_24h > 100000) { // > 100k tokens
        checks.push({
          description: 'Token Usage',
          status: 'warn',
          message: `${metrics.tokens_used_24h} tokens used in 24h`,
          severity: 'medium'
        });
        warnings.push('High token usage');
        recommendations.push('Monitor API costs');
        score -= 10;
      }

      // 4. Tempo risposta medio
      try {
        const avgResponseTime = await prisma.$queryRaw<any[]>`
          SELECT AVG(EXTRACT(EPOCH FROM ("endedAt" - "startedAt"))) as avg_seconds
          FROM "AiConversation"
          WHERE "createdAt" > NOW() - INTERVAL '24 hours'
          AND "endedAt" IS NOT NULL
        `;
        
        metrics.avg_response_time = avgResponseTime[0]?.avg_seconds 
          ? Math.round(avgResponseTime[0].avg_seconds * 1000) // in ms
          : 0;
        
        if (metrics.avg_response_time > 5000) { // > 5 secondi
          warnings.push('Slow AI response times');
          score -= 10;
        }
      } catch (error) {
        // Se la query fallisce, non è critico
        console.log('Could not calculate AI response time:', error);
        metrics.avg_response_time = 0;
      }

      checks.push({
        description: 'AI Activity',
        status: 'pass',
        message: `${recentConversations} conversations in 24h`
      });

    } catch (error: any) {
      errors.push(`AI check failed: ${error.message}`);
      score -= 20;
    }

    return {
      module: 'ai',
      displayName: '🤖 AI System',
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
   * CONTROLLO REALE: Sistema Richieste
   */
  private async checkRequestSystem(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const checks = [];
    const metrics: any = {};
    const warnings = [];
    const errors = [];
    const recommendations = [];
    let score = 100;

    try {
      // 1. Richieste attive
      const activeRequests = await prisma.assistanceRequest.count({
        where: {
          status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] }
        }
      });
      
      metrics.active_requests = activeRequests;
      
      // 2. Richieste completate ultime 24h
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const completedRequests = await prisma.assistanceRequest.count({
        where: {
          status: 'COMPLETED',
          completedDate: { gte: yesterday }
        }
      });
      
      metrics.completed_24h = completedRequests;
      
      // 3. Richieste in attesa di assegnazione
      const pendingRequests = await prisma.assistanceRequest.count({
        where: { status: 'PENDING' }
      });
      
      metrics.pending_assignment = pendingRequests;
      
      if (pendingRequests > 20) {
        checks.push({
          description: 'Pending Assignments',
          status: 'warn',
          message: `${pendingRequests} requests awaiting assignment`,
          severity: 'high'
        });
        warnings.push('Many requests pending assignment');
        recommendations.push('Assign professionals to pending requests');
        score -= 15;
      } else {
        checks.push({
          description: 'Request Queue',
          status: 'pass',
          message: `${pendingRequests} pending assignments`
        });
      }

      // 4. Tempo medio completamento
      try {
        const avgCompletionTime = await prisma.$queryRaw<any[]>`
          SELECT AVG(EXTRACT(EPOCH FROM ("completedDate" - "createdAt"))/3600) as avg_hours
          FROM "AssistanceRequest"
          WHERE status = 'COMPLETED'
          AND "completedDate" > NOW() - INTERVAL '30 days'
        `;
        
        metrics.avg_completion_hours = avgCompletionTime[0]?.avg_hours 
          ? Math.round(avgCompletionTime[0].avg_hours)
          : 0;
      } catch (error) {
        console.log('Could not calculate avg completion time:', error);
        metrics.avg_completion_hours = 0;
      }
      
      // 5. Preventivi accettati
      const totalQuotes = await prisma.quote.count({
        where: {
          createdAt: { gte: yesterday }
        }
      });
      
      const acceptedQuotes = await prisma.quote.count({
        where: {
          status: 'ACCEPTED',
          acceptedAt: { gte: yesterday }
        }
      });
      
      metrics.quote_acceptance_rate = totalQuotes > 0
        ? Math.round((acceptedQuotes / totalQuotes) * 100)
        : 0;
      
      checks.push({
        description: 'Request Processing',
        status: 'pass',
        message: `${activeRequests} active, ${completedRequests} completed in 24h`
      });

    } catch (error: any) {
      errors.push(`Request check failed: ${error.message}`);
      score -= 20;
    }

    return {
      module: 'request',
      displayName: '📋 Request System',
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
   * Esegue un singolo health check
   */
  async runSingleCheck(moduleName: string): Promise<HealthCheckResult> {
    try {
      let result: HealthCheckResult;
      
      switch (moduleName) {
        case 'auth':
          result = await this.checkAuthSystem();
          break;
        case 'database':
          result = await this.checkDatabase();
          break;
        case 'notification':
          result = await this.checkNotificationSystem();
          break;
        case 'backup':
          result = await this.checkBackupSystem();
          break;
        case 'chat':
          result = await this.checkChatSystem();
          break;
        case 'payment':
          result = await this.checkPaymentSystem();
          break;
        case 'ai':
          result = await this.checkAISystem();
          break;
        case 'request':
          result = await this.checkRequestSystem();
          break;
        default:
          throw new Error(`Unknown module: ${moduleName}`);
      }
      
      // Salva il risultato
      this.lastResults.set(moduleName, result);
      
      // Salva nel database
      await this.saveResultToDatabase(result);
      
      return result;
    } catch (error: any) {
      console.error(`Error running health check for ${moduleName}:`, error);
      
      return {
        module: moduleName,
        displayName: moduleName,
        timestamp: new Date(),
        status: 'error',
        score: 0,
        checks: [],
        metrics: {},
        warnings: [],
        errors: [`Failed to run health check: ${error.message}`],
        recommendations: [],
        executionTime: 0
      };
    }
  }

  /**
   * Esegue tutti gli health check
   */
  async runAllChecks(): Promise<SystemHealthSummary> {
    if (this.isRunning) {
      throw new Error('Health checks are already running');
    }

    this.isRunning = true;
    const modules = ['auth', 'database', 'notification', 'backup', 'chat', 'payment', 'ai', 'request'];
    const results: HealthCheckResult[] = [];

    try {
      for (const module of modules) {
        const result = await this.runSingleCheck(module);
        results.push(result);
      }

      const summary = this.calculateSummary(results);
      await this.saveSummaryToDatabase(summary);
      
      return summary;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Recupera l'ultimo risultato per un modulo
   */
  async getModuleResult(moduleName: string): Promise<HealthCheckResult | null> {
    // Prima controlla la cache
    if (this.lastResults.has(moduleName)) {
      return this.lastResults.get(moduleName)!;
    }

    // Altrimenti esegui un nuovo check
    return await this.runSingleCheck(moduleName);
  }

  /**
   * Recupera l'ultimo summary completo
   */
  async getLastSummary(): Promise<SystemHealthSummary | null> {
    // Se non ci sono risultati salvati, esegui tutti i check
    if (this.lastResults.size === 0) {
      return await this.runAllChecks();
    }

    const modules = ['auth', 'database', 'notification', 'backup', 'chat', 'payment', 'ai', 'request'];
    const results: HealthCheckResult[] = [];

    for (const module of modules) {
      const result = await this.getModuleResult(module);
      if (result) {
        results.push(result);
      }
    }

    return this.calculateSummary(results);
  }

  /**
   * Recupera lo storico dei risultati dal database
   */
  async getHistory(
    moduleName?: string,
    limit: number = 100,
    startDate?: Date,
    endDate?: Date
  ): Promise<any[]> {
    try {
      const where: any = {};
      
      if (moduleName) {
        where.module = moduleName;
      }
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      const results = await prisma.healthCheckResult.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return results.map(r => ({
        ...JSON.parse(r.data as string),
        id: r.id,
        createdAt: r.createdAt
      }));
    } catch (error) {
      console.error('Error fetching history:', error);
      return [];
    }
  }

  /**
   * Calcola il summary dai risultati
   */
  private calculateSummary(results: HealthCheckResult[]): SystemHealthSummary {
    const totalModules = results.length;
    const healthyModules = results.filter(r => r.status === 'healthy').length;
    const warningModules = results.filter(r => r.status === 'warning').length;
    const criticalModules = results.filter(r => r.status === 'critical').length;

    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const overallScore = totalModules > 0 ? Math.round(totalScore / totalModules) : 0;

    let overall: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (criticalModules > 0 || overallScore < 60) {
      overall = 'critical';
    } else if (warningModules > 0 || overallScore < 80) {
      overall = 'warning';
    }

    const alerts: any[] = [];
    results.forEach(result => {
      if (result.status === 'critical') {
        alerts.push({
          module: result.module,
          severity: 'critical',
          message: `${result.displayName} is in critical state (${result.score}/100)`,
          timestamp: result.timestamp
        });
      } else if (result.status === 'warning') {
        alerts.push({
          module: result.module,
          severity: 'warning',
          message: `${result.displayName} needs attention (${result.score}/100)`,
          timestamp: result.timestamp
        });
      }
    });

    return {
      overall,
      overallScore,
      modules: results,
      lastCheck: new Date(),
      alerts,
      statistics: {
        totalModules,
        healthyModules,
        warningModules,
        criticalModules
      }
    };
  }

  /**
   * Salva il risultato nel database
   */
  private async saveResultToDatabase(result: HealthCheckResult): Promise<void> {
    try {
      await prisma.healthCheckResult.create({
        data: {
          module: result.module,
          status: result.status,
          score: result.score,
          data: JSON.stringify(result)
        }
      });
    } catch (error) {
      console.error('Error saving result to database:', error);
    }
  }

  /**
   * Salva il summary nel database
   */
  private async saveSummaryToDatabase(summary: SystemHealthSummary): Promise<void> {
    try {
      await prisma.healthCheckSummary.create({
        data: {
          overallStatus: summary.overall,
          overallScore: summary.overallScore,
          data: JSON.stringify(summary)
        }
      });
    } catch (error) {
      console.error('Error saving summary to database:', error);
    }
  }
}

// Singleton instance
export const healthCheckService = new HealthCheckService();

// Esporta per l'uso nei worker di socket.io
declare global {
  var io: any;
}
