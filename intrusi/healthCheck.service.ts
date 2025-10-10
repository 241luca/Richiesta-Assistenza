/**
 * Health Check Service - VERSIONE CORRETTA
 * Garantisce che TUTTI i check vengano sempre registrati
 * UPDATED v5.1: Usa API keys dal database
 */

import { PrismaClient } from '@prisma/client';
import { redis } from '../config/redis';
import * as fs from 'fs';
import * as path from 'path';
import { 
  checkRedisSystem, 
  checkWebSocketSystem, 
  checkEmailService, 
  checkAISystem as checkAISystemExtended 
} from './healthCheckSeparateModules.service';
import { apiKeyService } from './apiKey.service';

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
      // 1. Controlla JWT Secret - SEMPRE AGGIUNTO
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

      // 2. Conta sessioni attive (Redis) - SEMPRE AGGIUNTO
      try {
        const keys = await redis.keys('sess:*');
        metrics.active_sessions = keys.length;
        
        checks.push({
          description: 'Session Store (Redis)',
          status: 'pass',
          message: `${keys.length} active sessions in Redis`
        });
      } catch (error) {
        checks.push({
          description: 'Session Store (Redis)',
          status: 'fail',
          message: 'Cannot connect to Redis',
          severity: 'high'
        });
        errors.push('Redis session store not accessible');
        score -= 20;
      }

      // 3. Controlla login falliti nelle ultime 24h - SEMPRE AGGIUNTO
      try {
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
            description: 'Failed Login Attempts (24h)',
            status: 'warn',
            message: `${failedLogins} failed logins in 24h`,
            severity: 'medium'
          });
          warnings.push('High number of failed login attempts');
          score -= 10;
        } else {
          checks.push({
            description: 'Failed Login Attempts (24h)',
            status: 'pass',
            message: `${failedLogins} failed logins in 24h (normal)`
          });
        }
      } catch (error) {
        checks.push({
          description: 'Failed Login Attempts (24h)',
          status: 'error',
          message: 'Could not check failed logins',
          severity: 'low'
        });
      }

      // 4. Controlla utenti con 2FA attivo - SEMPRE AGGIUNTO
      try {
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
            description: '2FA Adoption Rate',
            status: 'warn',
            message: `Only ${twoFAPercentage}% of users have 2FA enabled`,
            severity: 'medium'
          });
          warnings.push('Low 2FA adoption rate');
          recommendations.push('Encourage users to enable 2FA');
          score -= 15;
        } else {
          checks.push({
            description: '2FA Adoption Rate',
            status: 'pass',
            message: `${twoFAPercentage}% of users have 2FA enabled`
          });
        }
      } catch (error) {
        checks.push({
          description: '2FA Adoption Rate',
          status: 'error',
          message: 'Could not check 2FA status',
          severity: 'low'
        });
      }

    } catch (error: any) {
      errors.push(`Health check failed: ${error.message}`);
      score = 0;
    }

    return {
      module: 'auth',
      displayName: 'Sistema Autenticazione',
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
      // 1. Test connessione database - SEMPRE AGGIUNTO
      try {
        const testStart = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        const connectionTime = Date.now() - testStart;
        
        metrics.connection_time_ms = connectionTime;
        
        if (connectionTime > 1000) {
          checks.push({
            description: 'Database Connection Speed',
            status: 'warn',
            message: `Connection slow: ${connectionTime}ms`,
            severity: 'medium'
          });
          warnings.push('Database connection is slow');
          score -= 10;
        } else {
          checks.push({
            description: 'Database Connection Speed',
            status: 'pass',
            message: `Connected in ${connectionTime}ms`
          });
        }
      } catch (error) {
        checks.push({
          description: 'Database Connection Speed',
          status: 'fail',
          message: 'Cannot connect to database',
          severity: 'critical'
        });
        errors.push('Database connection failed');
        score -= 50;
      }

      // 2. Conta connessioni attive - SEMPRE AGGIUNTO
      try {
        const connections = await prisma.$queryRaw<any[]>`
          SELECT count(*) as count 
          FROM pg_stat_activity 
          WHERE datname = current_database()
        `;
        
        metrics.active_connections = parseInt(connections[0].count);
        
        checks.push({
          description: 'Active Database Connections',
          status: 'pass',
          message: `${metrics.active_connections} active connections`
        });
      } catch (error) {
        checks.push({
          description: 'Active Database Connections',
          status: 'error',
          message: 'Could not check connections',
          severity: 'low'
        });
      }
      
      // 3. Controlla dimensione database - SEMPRE AGGIUNTO
      try {
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
      } catch (error) {
        checks.push({
          description: 'Database Size',
          status: 'error',
          message: 'Could not check database size',
          severity: 'low'
        });
      }

      // 4. Conta tabelle e record - SEMPRE AGGIUNTO
      try {
        metrics.total_users = await prisma.user.count();
        metrics.total_requests = await prisma.assistanceRequest.count();
        metrics.total_quotes = await prisma.quote.count();
        
        checks.push({
          description: 'Database Statistics',
          status: 'pass',
          message: `${metrics.total_users} users, ${metrics.total_requests} requests, ${metrics.total_quotes} quotes`
        });
      } catch (error) {
        checks.push({
          description: 'Database Statistics',
          status: 'error',
          message: 'Could not retrieve statistics',
          severity: 'low'
        });
      }

      // 5. Controlla query lente - SEMPRE AGGIUNTO
      try {
        const slowQueries = await prisma.$queryRaw<any[]>`
          SELECT count(*) as count
          FROM pg_stat_statements
          WHERE mean_exec_time > 1000
        `;
        
        if (slowQueries[0]?.count > 10) {
          checks.push({
            description: 'Slow Query Detection',
            status: 'warn',
            message: `${slowQueries[0].count} slow queries detected`,
            severity: 'medium'
          });
          warnings.push('Multiple slow queries detected');
          recommendations.push('Optimize slow queries');
          score -= 10;
        } else {
          checks.push({
            description: 'Slow Query Detection',
            status: 'pass',
            message: 'No slow queries detected'
          });
        }
      } catch {
        // pg_stat_statements potrebbe non essere abilitato
        checks.push({
          description: 'Slow Query Detection',
          status: 'error',
          message: 'pg_stat_statements not enabled',
          severity: 'info'
        });
      }

    } catch (error: any) {
      errors.push(`Database check failed: ${error.message}`);
      score = 0;
    }

    return {
      module: 'database',
      displayName: 'Sistema Database',
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
      // 1. Controlla configurazione email (Brevo) - AGGIORNATO DB
      const brevoKey = await apiKeyService.getApiKey('BREVO', true);
      if (!brevoKey || !brevoKey.key) {
        checks.push({
          description: 'Email Service Configuration (Brevo)',
          status: 'fail',
          message: 'Brevo API key not configured',
          severity: 'high'
        });
        errors.push('Email service not configured');
        score -= 25;
      } else {
        checks.push({
          description: 'Email Service Configuration (Brevo)',
          status: 'pass',
          message: 'Brevo API configured'
        });
      }

      // 2. Conta notifiche inviate nelle ultime 24h - SEMPRE AGGIUNTO
      try {
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
        
        if (metrics.success_rate < 90 && recentNotifications > 0) {
          checks.push({
            description: 'Notification Delivery Rate (24h)',
            status: 'warn',
            message: `Success rate: ${metrics.success_rate}%`,
            severity: 'medium'
          });
          warnings.push('Low notification delivery rate');
          recommendations.push('Check failed notifications');
          score -= 15;
        } else {
          checks.push({
            description: 'Notification Delivery Rate (24h)',
            status: 'pass',
            message: `Success rate: ${metrics.success_rate}% (${successfulNotifications}/${recentNotifications})`
          });
        }
      } catch (error) {
        checks.push({
          description: 'Notification Delivery Rate (24h)',
          status: 'error',
          message: 'Could not check delivery rate',
          severity: 'low'
        });
      }

      // 3. Controlla notifiche non lette - SEMPRE AGGIUNTO
      try {
        const unreadNotifications = await prisma.notification.count({
          where: { isRead: false }
        });
        
        metrics.unread_notifications = unreadNotifications;
        
        if (unreadNotifications > 1000) {
          checks.push({
            description: 'Unread Notifications Count',
            status: 'warn',
            message: `${unreadNotifications} unread notifications`,
            severity: 'low'
          });
          warnings.push('Many unread notifications');
          recommendations.push('Consider cleanup of old unread notifications');
          score -= 5;
        } else {
          checks.push({
            description: 'Unread Notifications Count',
            status: 'pass',
            message: `${unreadNotifications} unread notifications`
          });
        }
      } catch (error) {
        checks.push({
          description: 'Unread Notifications Count',
          status: 'error',
          message: 'Could not count unread notifications',
          severity: 'low'
        });
      }

      // 4. Controlla WebSocket - SEMPRE AGGIUNTO
      const io = global.io;
      if (io) {
        try {
          const socketCount = io.sockets.sockets.size || 0;
          metrics.websocket_connections = socketCount;
          
          checks.push({
            description: 'WebSocket Server Status',
            status: 'pass',
            message: `${socketCount} active WebSocket connections`
          });
        } catch (error) {
          checks.push({
            description: 'WebSocket Server Status',
            status: 'error',
            message: 'WebSocket error',
            severity: 'medium'
          });
        }
      } else {
        checks.push({
          description: 'WebSocket Server Status',
          status: 'warn',
          message: 'WebSocket server not initialized',
          severity: 'low'
        });
        warnings.push('WebSocket not configured');
      }

    } catch (error: any) {
      errors.push(`Notification check failed: ${error.message}`);
      score -= 20;
    }

    return {
      module: 'notification',
      displayName: 'Sistema Notifiche',
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
      // 1. Controlla ultimo backup - SEMPRE AGGIUNTO
      try {
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
              description: 'Last Backup Time',
              status: 'warn',
              message: `Last backup ${hoursSinceBackup} hours ago`,
              severity: 'high'
            });
            warnings.push('No recent backup');
            recommendations.push('Run backup immediately');
            score -= 25;
          } else if (hoursSinceBackup > 24) {
            checks.push({
              description: 'Last Backup Time',
              status: 'warn',
              message: `Last backup ${hoursSinceBackup} hours ago`,
              severity: 'medium'
            });
            warnings.push('Backup older than 24 hours');
            score -= 10;
          } else {
            checks.push({
              description: 'Last Backup Time',
              status: 'pass',
              message: `Last backup ${hoursSinceBackup} hours ago`
            });
          }
        } else {
          checks.push({
            description: 'Last Backup Time',
            status: 'fail',
            message: 'No backups found',
            severity: 'critical'
          });
          errors.push('No backups exist');
          score -= 50;
        }
      } catch (error) {
        checks.push({
          description: 'Last Backup Time',
          status: 'error',
          message: 'Could not check backup status',
          severity: 'high'
        });
      }

      // 2. Conta backup totali e falliti - SEMPRE AGGIUNTO
      try {
        const totalBackups = await prisma.systemBackup.count();
        const failedBackups = await prisma.systemBackup.count({
          where: { status: 'FAILED' }
        });
        
        metrics.total_backups = totalBackups;
        metrics.failed_backups = failedBackups;
        
        if (failedBackups > 5) {
          checks.push({
            description: 'Failed Backups Count',
            status: 'warn',
            message: `${failedBackups} failed backups detected`,
            severity: 'medium'
          });
          warnings.push('Multiple failed backups detected');
          recommendations.push('Check backup logs');
          score -= 10;
        } else {
          checks.push({
            description: 'Failed Backups Count',
            status: 'pass',
            message: `${failedBackups} failed backups out of ${totalBackups}`
          });
        }
      } catch (error) {
        checks.push({
          description: 'Failed Backups Count',
          status: 'error',
          message: 'Could not check backup statistics',
          severity: 'low'
        });
      }

      // 3. Controlla spazio su disco per backup - SEMPRE AGGIUNTO
      try {
        const backupPath = path.join('/Users/lucamambelli/Desktop', 'backup-ra', 'database');
        if (fs.existsSync(backupPath)) {
          const files = fs.readdirSync(backupPath);
          metrics.backup_files_count = files.length;
          
          checks.push({
            description: 'Backup Storage Files',
            status: 'pass',
            message: `${files.length} backup files stored`
          });
        } else {
          checks.push({
            description: 'Backup Storage Files',
            status: 'warn',
            message: 'Backup directory not found',
            severity: 'medium'
          });
          warnings.push('Backup directory missing');
        }
      } catch (error) {
        checks.push({
          description: 'Backup Storage Files',
          status: 'error',
          message: 'Could not check backup storage',
          severity: 'low'
        });
      }

      // 4. Controlla backup schedulati - SEMPRE AGGIUNTO
      try {
        const activeSchedules = await prisma.backupSchedule.count({
          where: { isActive: true }
        });
        
        metrics.active_schedules = activeSchedules;
        
        if (activeSchedules === 0) {
          checks.push({
            description: 'Backup Schedule Configuration',
            status: 'warn',
            message: 'No active backup schedules',
            severity: 'medium'
          });
          warnings.push('No automatic backups configured');
          recommendations.push('Configure automatic daily backups');
          score -= 15;
        } else {
          checks.push({
            description: 'Backup Schedule Configuration',
            status: 'pass',
            message: `${activeSchedules} active schedules configured`
          });
        }
      } catch (error) {
        checks.push({
          description: 'Backup Schedule Configuration',
          status: 'error',
          message: 'Could not check backup schedules',
          severity: 'low'
        });
      }

    } catch (error: any) {
      errors.push(`Backup check failed: ${error.message}`);
      score -= 20;
    }

    return {
      module: 'backup',
      displayName: 'Sistema Backup',
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
      // 1. Conta messaggi nelle ultime 24h - SEMPRE AGGIUNTO
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const recentMessages = await prisma.requestChatMessage.count({
          where: {
            createdAt: { gte: yesterday },
            isDeleted: false
          }
        });
        
        metrics.messages_24h = recentMessages;
        
        checks.push({
          description: 'Chat Messages Volume (24h)',
          status: 'pass',
          message: `${recentMessages} messages in last 24h`
        });
      } catch (error) {
        checks.push({
          description: 'Chat Messages Volume (24h)',
          status: 'error',
          message: 'Could not count messages',
          severity: 'low'
        });
      }
      
      // 2. Conta chat attive - SEMPRE AGGIUNTO
      try {
        const activeChats = await prisma.assistanceRequest.count({
          where: {
            status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] }
          }
        });
        
        metrics.active_chats = activeChats;
        
        checks.push({
          description: 'Active Chats Count',
          status: 'pass',
          message: `${activeChats} active chats`
        });
      } catch (error) {
        checks.push({
          description: 'Active Chats Count',
          status: 'error',
          message: 'Could not count active chats',
          severity: 'low'
        });
      }
      
      // 3. Tempo medio risposta - SEMPRE AGGIUNTO
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
            description: 'Average Response Time',
            status: 'warn',
            message: `Average: ${Math.round(metrics.avg_response_time_seconds / 60)} minutes`,
            severity: 'medium'
          });
          warnings.push('Slow chat response times');
          score -= 10;
        } else {
          checks.push({
            description: 'Average Response Time',
            status: 'pass',
            message: `Average: ${Math.round(metrics.avg_response_time_seconds)} seconds`
          });
        }
      } catch (error) {
        checks.push({
          description: 'Average Response Time',
          status: 'error',
          message: 'Could not calculate response time',
          severity: 'low'
        });
      }

      // 4. Messaggi non letti - SEMPRE AGGIUNTO
      try {
        const unreadMessages = await prisma.requestChatMessage.count({
          where: { isRead: false }
        });
        
        metrics.unread_messages = unreadMessages;
        
        if (unreadMessages > 100) {
          checks.push({
            description: 'Unread Messages Count',
            status: 'warn',
            message: `${unreadMessages} unread messages`,
            severity: 'low'
          });
          warnings.push('Many unread messages');
          score -= 5;
        } else {
          checks.push({
            description: 'Unread Messages Count',
            status: 'pass',
            message: `${unreadMessages} unread messages`
          });
        }
      } catch (error) {
        checks.push({
          description: 'Unread Messages Count',
          status: 'error',
          message: 'Could not count unread messages',
          severity: 'low'
        });
      }

    } catch (error: any) {
      errors.push(`Chat check failed: ${error.message}`);
      score -= 20;
    }

    return {
      module: 'chat',
      displayName: 'Sistema Chat',
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
      // 1. Controlla configurazione Stripe - AGGIORNATO DB
      const stripeKey = await apiKeyService.getApiKey('STRIPE', true);
      if (!stripeKey || !stripeKey.key) {
        checks.push({
          description: 'Stripe API Configuration',
          status: 'fail',
          message: 'Stripe API key not configured',
          severity: 'critical'
        });
        errors.push('Payment system not configured');
        score -= 40;
      } else {
        checks.push({
          description: 'Stripe API Configuration',
          status: 'pass',
          message: 'Stripe API configured'
        });
      }

      // 2. Transazioni ultime 24h - SEMPRE AGGIUNTO
      try {
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
            description: 'Payment Success Rate (24h)',
            status: 'warn',
            message: `Success rate: ${metrics.success_rate}%`,
            severity: 'high'
          });
          warnings.push('Payment failures detected');
          recommendations.push('Review failed payments');
          score -= 20;
        } else {
          checks.push({
            description: 'Payment Success Rate (24h)',
            status: 'pass',
            message: `Success rate: ${metrics.success_rate}% (${successfulPayments}/${metrics.transactions_24h})`
          });
        }
      } catch (error) {
        checks.push({
          description: 'Payment Success Rate (24h)',
          status: 'error',
          message: 'Could not check payment statistics',
          severity: 'medium'
        });
      }

      // 3. Pagamenti in sospeso - SEMPRE AGGIUNTO
      try {
        const pendingPayments = await prisma.payment.count({
          where: { status: 'PENDING' }
        });
        
        metrics.pending_payments = pendingPayments;
        
        if (pendingPayments > 10) {
          checks.push({
            description: 'Pending Payments',
            status: 'warn',
            message: `${pendingPayments} pending payments`,
            severity: 'medium'
          });
          warnings.push('Many pending payments');
          recommendations.push('Process pending payments');
          score -= 10;
        } else {
          checks.push({
            description: 'Pending Payments',
            status: 'pass',
            message: `${pendingPayments} pending payments`
          });
        }
      } catch (error) {
        checks.push({
          description: 'Pending Payments',
          status: 'error',
          message: 'Could not check pending payments',
          severity: 'low'
        });
      }

    } catch (error: any) {
      errors.push(`Payment check failed: ${error.message}`);
      score -= 20;
    }

    return {
      module: 'payment',
      displayName: 'Sistema Pagamenti',
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
      // 1. Controlla configurazione OpenAI - AGGIORNATO DB
      const openAIKey = await apiKeyService.getApiKey('OPENAI', true);
      if (!openAIKey || !openAIKey.key) {
        checks.push({
          description: 'OpenAI API Configuration',
          status: 'fail',
          message: 'OpenAI API key not configured',
          severity: 'critical'
        });
        errors.push('AI system not configured');
        score -= 40;
      } else {
        checks.push({
          description: 'OpenAI API Configuration',
          status: 'pass',
          message: 'OpenAI API configured'
        });
      }

      // 2. Conversazioni AI ultime 24h - SEMPRE AGGIUNTO
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const recentConversations = await prisma.aiConversation.count({
          where: {
            createdAt: { gte: yesterday }
          }
        });
        
        metrics.conversations_24h = recentConversations;
        
        checks.push({
          description: 'AI Conversations (24h)',
          status: 'pass',
          message: `${recentConversations} conversations in 24h`
        });
      } catch (error) {
        checks.push({
          description: 'AI Conversations (24h)',
          status: 'error',
          message: 'Could not count conversations',
          severity: 'low'
        });
      }
      
      // 3. Token utilizzati - SEMPRE AGGIUNTO
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
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
            description: 'Token Usage (24h)',
            status: 'warn',
            message: `${metrics.tokens_used_24h} tokens used ($${metrics.estimated_cost_24h.toFixed(2)})`,
            severity: 'medium'
          });
          warnings.push('High token usage');
          recommendations.push('Monitor API costs');
          score -= 10;
        } else {
          checks.push({
            description: 'Token Usage (24h)',
            status: 'pass',
            message: `${metrics.tokens_used_24h} tokens used ($${metrics.estimated_cost_24h.toFixed(2)})`
          });
        }
      } catch (error) {
        checks.push({
          description: 'Token Usage (24h)',
          status: 'error',
          message: 'Could not check token usage',
          severity: 'low'
        });
      }

      // 4. Tempo risposta medio - SEMPRE AGGIUNTO
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
          checks.push({
            description: 'AI Response Time',
            status: 'warn',
            message: `Average: ${Math.round(metrics.avg_response_time / 1000)}s`,
            severity: 'medium'
          });
          warnings.push('Slow AI response times');
          score -= 10;
        } else {
          checks.push({
            description: 'AI Response Time',
            status: 'pass',
            message: `Average: ${metrics.avg_response_time}ms`
          });
        }
      } catch (error) {
        checks.push({
          description: 'AI Response Time',
          status: 'error',
          message: 'Could not calculate response time',
          severity: 'low'
        });
      }

    } catch (error: any) {
      errors.push(`AI check failed: ${error.message}`);
      score -= 20;
    }

    return {
      module: 'ai',
      displayName: 'Sistema AI',
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
      // 1. Richieste attive - SEMPRE AGGIUNTO
      try {
        const activeRequests = await prisma.assistanceRequest.count({
          where: {
            status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] }
          }
        });
        
        metrics.active_requests = activeRequests;
        
        checks.push({
          description: 'Active Requests Count',
          status: 'pass',
          message: `${activeRequests} active requests`
        });
      } catch (error) {
        checks.push({
          description: 'Active Requests Count',
          status: 'error',
          message: 'Could not count active requests',
          severity: 'medium'
        });
      }
      
      // 2. Richieste completate ultime 24h - SEMPRE AGGIUNTO
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const completedRequests = await prisma.assistanceRequest.count({
          where: {
            status: 'COMPLETED',
            completedDate: { gte: yesterday }
          }
        });
        
        metrics.completed_24h = completedRequests;
        
        checks.push({
          description: 'Completed Requests (24h)',
          status: 'pass',
          message: `${completedRequests} requests completed in 24h`
        });
      } catch (error) {
        checks.push({
          description: 'Completed Requests (24h)',
          status: 'error',
          message: 'Could not count completed requests',
          severity: 'low'
        });
      }
      
      // 3. Richieste in attesa di assegnazione - SEMPRE AGGIUNTO
      try {
        const pendingRequests = await prisma.assistanceRequest.count({
          where: { status: 'PENDING' }
        });
        
        metrics.pending_assignment = pendingRequests;
        
        if (pendingRequests > 20) {
          checks.push({
            description: 'Pending Assignment Queue',
            status: 'warn',
            message: `${pendingRequests} requests awaiting assignment`,
            severity: 'high'
          });
          warnings.push('Many requests pending assignment');
          recommendations.push('Assign professionals to pending requests');
          score -= 15;
        } else {
          checks.push({
            description: 'Pending Assignment Queue',
            status: 'pass',
            message: `${pendingRequests} requests pending assignment`
          });
        }
      } catch (error) {
        checks.push({
          description: 'Pending Assignment Queue',
          status: 'error',
          message: 'Could not check pending requests',
          severity: 'medium'
        });
      }

      // 4. Tempo medio completamento - SEMPRE AGGIUNTO
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
        
        checks.push({
          description: 'Average Completion Time',
          status: 'pass',
          message: `Average: ${metrics.avg_completion_hours} hours`
        });
      } catch (error) {
        checks.push({
          description: 'Average Completion Time',
          status: 'error',
          message: 'Could not calculate completion time',
          severity: 'low'
        });
      }
      
      // 5. Preventivi accettati - SEMPRE AGGIUNTO
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
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
          : 100;
        
        checks.push({
          description: 'Quote Acceptance Rate (24h)',
          status: 'pass',
          message: `${metrics.quote_acceptance_rate}% acceptance rate (${acceptedQuotes}/${totalQuotes})`
        });
      } catch (error) {
        checks.push({
          description: 'Quote Acceptance Rate (24h)',
          status: 'error',
          message: 'Could not calculate acceptance rate',
          severity: 'low'
        });
      }

    } catch (error: any) {
      errors.push(`Request check failed: ${error.message}`);
      score -= 20;
    }

    return {
      module: 'request',
      displayName: 'Sistema Richieste',
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
   * Esegue un singolo health check e aggiorna SOLO quel modulo nel summary
   */
  async runSingleCheck(moduleName: string): Promise<SystemHealthSummary> {
    console.log(`[HealthCheck] Running single check for module: ${moduleName}`);
    try {
      let result: HealthCheckResult;
      
      switch (moduleName) {
        case 'auth':
          result = await this.checkAuthSystem();
          break;
        case 'database':
          result = await this.checkDatabase();
          break;
        case 'redis':  // NUOVO MODULO SEPARATO
          result = await checkRedisSystem();
          break;
        case 'websocket':  // NUOVO MODULO SEPARATO
          result = await checkWebSocketSystem();
          break;
        case 'emailservice':  // NUOVO MODULO SEPARATO
          result = await checkEmailService();
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
          result = await checkAISystemExtended();  // USA IL MODULO ESTESO
          break;
        case 'request':
          result = await this.checkRequestSystem();
          break;
        default:
          throw new Error(`Unknown module: ${moduleName}`);
      }
      
      // FIX: Assicurati che checks sia sempre un array
      if (!result.checks) {
        result.checks = [];
      }
      
      console.log(`[HealthCheck] Module ${moduleName} - Checks: ${result.checks.length}`);
      
      // Salva il risultato nella cache
      this.lastResults.set(moduleName, result);
      
      // Salva nel database
      await this.saveResultToDatabase(result);
      
      // IMPORTANTE: Recupera il summary esistente e aggiorna SOLO questo modulo
      const existingSummary = await this.getLastSummary();
      
      if (existingSummary) {
        // Trova e sostituisci solo il modulo aggiornato
        const moduleIndex = existingSummary.modules.findIndex(m => m.module === moduleName);
        
        if (moduleIndex >= 0) {
          // Sostituisci il modulo esistente con quello nuovo
          existingSummary.modules[moduleIndex] = result;
        } else {
          // Se il modulo non esisteva, aggiungilo
          existingSummary.modules.push(result);
        }
        
        // Ricalcola SOLO le statistiche generali mantenendo gli altri moduli invariati
        const recalculatedSummary = this.calculateSummary(existingSummary.modules);
        
        console.log(`[HealthCheck] Summary updated with single module: ${moduleName}`);
        return recalculatedSummary;
      } else {
        // Se non c'è un summary esistente, crea uno con solo questo modulo
        return this.calculateSummary([result]);
      }
      
    } catch (error: any) {
      console.error(`[HealthCheck] Error running check for ${moduleName}:`, error);
      
      const errorResult: HealthCheckResult = {
        module: moduleName,
        displayName: moduleName,
        timestamp: new Date(),
        status: 'error',
        score: 0,
        checks: [{
          description: 'Module Check',
          status: 'error',
          message: `Failed: ${error.message}`,
          severity: 'critical'
        }],
        metrics: {},
        warnings: [],
        errors: [`Failed to run health check: ${error.message}`],
        recommendations: [],
        executionTime: 0
      };
      
      // Anche in caso di errore, aggiorna il summary
      const existingSummary = await this.getLastSummary();
      if (existingSummary) {
        const moduleIndex = existingSummary.modules.findIndex(m => m.module === moduleName);
        if (moduleIndex >= 0) {
          existingSummary.modules[moduleIndex] = errorResult;
        } else {
          existingSummary.modules.push(errorResult);
        }
        return this.calculateSummary(existingSummary.modules);
      }
      
      return this.calculateSummary([errorResult]);
    }
  }

  /**
   * Ottiene il summary parziale con solo i moduli specificati
   */
  async getPartialSummary(moduleNames: string[]): Promise<SystemHealthSummary> {
    console.log(`[HealthCheck] Getting partial summary for modules: ${moduleNames.join(', ')}`);
    
    const results: HealthCheckResult[] = [];
    
    for (const moduleName of moduleNames) {
      if (this.lastResults.has(moduleName)) {
        results.push(this.lastResults.get(moduleName)!);
      }
    }
    
    if (results.length === 0) {
      // Se non ci sono risultati, esegui i check richiesti
      for (const moduleName of moduleNames) {
        const result = await this.runSingleCheck(moduleName);
        results.push(result);
      }
    }
    
    return this.calculateSummary(results);
  }

  /**
   * Esegue tutti gli health check
   */
  async runAllChecks(): Promise<SystemHealthSummary> {
    if (this.isRunning) {
      throw new Error('Health checks are already running');
    }

    console.log('[HealthCheck] Starting all checks...');
    this.isRunning = true;
    const modules = ['auth', 'database', 'redis', 'websocket', 'emailservice', 'notification', 'backup', 'chat', 'payment', 'ai', 'request'];
    const results: HealthCheckResult[] = [];

    try {
      for (const module of modules) {
        const result = await this.runSingleCheck(module);
        results.push(result);
      }

      const summary = this.calculateSummary(results);
      
      // Log totale check - FIX: controlla che checks esista
      const totalChecks = results.reduce((sum, r) => sum + (r.checks ? r.checks.length : 0), 0);
      console.log(`[HealthCheck] Total modules: ${results.length}, Total checks: ${totalChecks}`);
      
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
    console.log('[HealthCheck] Getting last summary...');
    
    // Se non ci sono risultati salvati, esegui tutti i check
    if (this.lastResults.size === 0) {
      console.log('[HealthCheck] No cached results, running all checks...');
      return await this.runAllChecks();
    }

    const modules = ['auth', 'database', 'redis', 'websocket', 'emailservice', 'notification', 'backup', 'chat', 'payment', 'ai', 'request'];
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
    // FIX: Assicurati che tutti i risultati abbiano checks array
    const safeResults = results.map(r => ({
      ...r,
      checks: r.checks || []
    }));
    
    const totalModules = safeResults.length;
    const healthyModules = safeResults.filter(r => r.status === 'healthy').length;
    const warningModules = safeResults.filter(r => r.status === 'warning').length;
    const criticalModules = safeResults.filter(r => r.status === 'critical').length;

    const totalScore = safeResults.reduce((sum, r) => sum + (r.score || 0), 0);
    const overallScore = totalModules > 0 ? Math.round(totalScore / totalModules) : 0;

    let overall: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (criticalModules > 0 || overallScore < 60) {
      overall = 'critical';
    } else if (warningModules > 0 || overallScore < 80) {
      overall = 'warning';
    }

    const alerts: any[] = [];
    safeResults.forEach(result => {
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
      modules: safeResults,
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
      // FIX: Usa i campi corretti del database invece di 'data'
      await prisma.healthCheckResult.create({
        data: {
          module: result.module,
          status: result.status,
          score: result.score,
          checks: result.checks || [],  // JSON field
          warnings: result.warnings || [],  // String array
          errors: result.errors || [],  // String array  
          metrics: result.metrics || {},  // JSON field
          executionTime: result.executionTime || 0,
          timestamp: result.timestamp || new Date()
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
