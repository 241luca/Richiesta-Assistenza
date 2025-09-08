#!/usr/bin/env ts-node
/**
 * Notification System Health Check
 * Verifica completa del sistema di notifiche (email, websocket, queue)
 */

import { BaseHealthCheck } from '../../../scripts/health-checks/core/base-health-check';
import { CheckDetail, CheckStatus, CheckSeverity } from '../../../scripts/health-checks/core/health-check.types';
import { prisma } from '../../src/config/database';
import * as fs from 'fs';
import * as path from 'path';
import Redis from 'ioredis';
import Bull from 'bull';

class NotificationSystemHealthCheck extends BaseHealthCheck {
  private redis: Redis;
  private notificationQueue: Bull.Queue;
  
  constructor() {
    super('notification-system', '📨 Notification System');
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      lazyConnect: true
    });
    this.notificationQueue = new Bull('notifications', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    });
  }
  
  async execute() {
    this.log('Starting Notification System Health Check...', 'info');
    
    try {
      // 1. Check Database Tables
      await this.checkDatabaseTables();
      
      // 2. Check Email Service Configuration
      await this.checkEmailService();
      
      // 3. Check Redis Queue System
      await this.checkQueueSystem();
      
      // 4. Check WebSocket System
      await this.checkWebSocketSystem();
      
      // 5. Check Notification Templates
      await this.checkNotificationTemplates();
      
      // 6. Check Notification Statistics
      await this.checkNotificationStatistics();
      
      // 7. Check Failed Notifications
      await this.checkFailedNotifications();
      
      // 8. Check Notification Performance
      await this.checkNotificationPerformance();
      
      // 9. Check Service Files
      await this.checkServiceFiles();
      
      // 10. Check Queue Health
      await this.checkQueueHealth();
      
    } catch (error: any) {
      this.log(`Critical error during health check: ${error.message}`, 'error');
      this.result.status = 'error';
      this.result.errors.push(`Health check failed: ${error.message}`);
    } finally {
      // Cleanup
      await this.redis.quit();
      await this.notificationQueue.close();
      await prisma.$disconnect();
    }
    
    return this.finalizeResult();
  }
  
  private async checkDatabaseTables(): Promise<void> {
    this.log('Checking notification database tables...', 'info');
    
    try {
      // Check Notification table
      const notificationCount = await prisma.notification.count();
      this.addCheck({
        name: 'notification_table',
        description: 'Notification table accessibility',
        status: CheckStatus.PASS,
        message: `Notification table accessible with ${notificationCount} records`,
        value: notificationCount,
        severity: CheckSeverity.CRITICAL
      });
      
      // Check NotificationTemplate table
      const templateCount = await prisma.notificationTemplate.count();
      this.addCheck({
        name: 'template_table',
        description: 'Notification template table',
        status: templateCount > 0 ? CheckStatus.PASS : CheckStatus.WARN,
        message: `${templateCount} notification templates configured`,
        value: templateCount,
        expected: '>0',
        severity: CheckSeverity.HIGH
      });
      
      if (templateCount === 0) {
        this.addRecommendation('Create notification templates for system events');
      }
      
      this.addMetric('total_notifications', notificationCount);
      this.addMetric('total_templates', templateCount);
      
    } catch (error: any) {
      this.addCheck({
        name: 'database_tables',
        description: 'Notification database tables',
        status: CheckStatus.FAIL,
        message: `Database error: ${error.message}`,
        severity: CheckSeverity.CRITICAL
      });
    }
  }
  
  private async checkEmailService(): Promise<void> {
    this.log('Checking email service configuration...', 'info');
    
    // Check Brevo/SendinBlue configuration
    const brevoApiKey = !!process.env.BREVO_API_KEY;
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    
    if (brevoApiKey) {
      this.addCheck({
        name: 'email_service',
        description: 'Email service configuration (Brevo)',
        status: CheckStatus.PASS,
        message: 'Brevo API key configured',
        severity: CheckSeverity.HIGH
      });
      
      // Test Brevo connection
      try {
        const SibApiV3Sdk = require('@sendinblue/client');
        const apiInstance = new SibApiV3Sdk.AccountApi();
        apiInstance.setApiKey(
          SibApiV3Sdk.AccountApiApiKeys.apiKey,
          process.env.BREVO_API_KEY
        );
        
        const data = await apiInstance.getAccount();
        
        this.addCheck({
          name: 'email_service_connection',
          description: 'Brevo API connection',
          status: CheckStatus.PASS,
          message: `Connected to Brevo (${data.email})`,
          severity: CheckSeverity.HIGH
        });
        
        this.addMetric('email_credits', data.plan?.[0]?.credits || 0);
        
      } catch (error: any) {
        this.addCheck({
          name: 'email_service_connection',
          description: 'Brevo API connection',
          status: CheckStatus.FAIL,
          message: `Brevo connection failed: ${error.message}`,
          severity: CheckSeverity.HIGH
        });
      }
    } else if (smtpHost && smtpPort && smtpUser) {
      this.addCheck({
        name: 'email_service',
        description: 'Email service configuration (SMTP)',
        status: CheckStatus.PASS,
        message: `SMTP configured (${smtpHost}:${smtpPort})`,
        severity: CheckSeverity.HIGH
      });
    } else {
      this.addCheck({
        name: 'email_service',
        description: 'Email service configuration',
        status: CheckStatus.FAIL,
        message: 'No email service configured',
        severity: CheckSeverity.HIGH
      });
      
      this.addRecommendation('Configure BREVO_API_KEY or SMTP settings for email notifications');
    }
  }
  
  private async checkQueueSystem(): Promise<void> {
    this.log('Checking queue system...', 'info');
    
    try {
      // Connect to Redis
      await this.redis.connect();
      await this.redis.ping();
      
      this.addCheck({
        name: 'redis_queue',
        description: 'Redis queue connection',
        status: CheckStatus.PASS,
        message: 'Redis queue system connected',
        severity: CheckSeverity.HIGH
      });
      
      // Check Bull queue stats
      const waiting = await this.notificationQueue.getWaitingCount();
      const active = await this.notificationQueue.getActiveCount();
      const completed = await this.notificationQueue.getCompletedCount();
      const failed = await this.notificationQueue.getFailedCount();
      const delayed = await this.notificationQueue.getDelayedCount();
      
      const totalPending = waiting + active + delayed;
      
      this.addCheck({
        name: 'queue_status',
        description: 'Notification queue status',
        status: failed < 10 && totalPending < 100 ? CheckStatus.PASS : 
                failed < 50 && totalPending < 500 ? CheckStatus.WARN : CheckStatus.FAIL,
        message: `Queue: ${waiting} waiting, ${active} active, ${failed} failed`,
        severity: CheckSeverity.MEDIUM
      });
      
      this.addMetric('queue_waiting', waiting);
      this.addMetric('queue_active', active);
      this.addMetric('queue_completed', completed);
      this.addMetric('queue_failed', failed);
      this.addMetric('queue_delayed', delayed);
      
      if (failed > 10) {
        this.addRecommendation(`Investigate ${failed} failed notifications in the queue`);
      }
      
      if (totalPending > 100) {
        this.addRecommendation('High queue backlog - check worker processes');
      }
      
    } catch (error: any) {
      this.addCheck({
        name: 'redis_queue',
        description: 'Redis queue connection',
        status: CheckStatus.FAIL,
        message: `Queue system error: ${error.message}`,
        severity: CheckSeverity.HIGH
      });
      
      this.addRecommendation('Ensure Redis server is running for queue functionality');
    }
  }
  
  private async checkWebSocketSystem(): Promise<void> {
    this.log('Checking WebSocket system...', 'info');
    
    // Check Socket.io configuration
    const socketPort = process.env.SOCKET_PORT || '3200';
    const socketEnabled = process.env.ENABLE_WEBSOCKET !== 'false';
    
    this.addCheck({
      name: 'websocket_config',
      description: 'WebSocket configuration',
      status: socketEnabled ? CheckStatus.PASS : CheckStatus.WARN,
      message: socketEnabled 
        ? `WebSocket enabled on port ${socketPort}`
        : 'WebSocket disabled',
      severity: CheckSeverity.MEDIUM
    });
    
    // Check Socket.io files
    const socketFile = path.join(process.cwd(), 'src/websocket/server.ts');
    const socketHandlers = path.join(process.cwd(), 'src/websocket/handlers.ts');
    
    const filesExist = fs.existsSync(socketFile) && fs.existsSync(socketHandlers);
    
    this.addCheck({
      name: 'websocket_files',
      description: 'WebSocket implementation files',
      status: filesExist ? CheckStatus.PASS : CheckStatus.WARN,
      message: filesExist 
        ? 'WebSocket files present'
        : 'WebSocket files missing',
      severity: CheckSeverity.LOW
    });
    
    this.addMetric('websocket_enabled', socketEnabled);
    this.addMetric('websocket_port', socketPort);
  }
  
  private async checkNotificationTemplates(): Promise<void> {
    this.log('Checking notification templates...', 'info');
    
    try {
      const templates = await prisma.notificationTemplate.findMany();
      
      // Check for essential templates
      const essentialTemplates = [
        'WELCOME',
        'REQUEST_CREATED',
        'REQUEST_ASSIGNED',
        'QUOTE_RECEIVED',
        'PAYMENT_CONFIRMED'
      ];
      
      const existingTypes = templates.map(t => t.type);
      const missingTemplates = essentialTemplates.filter(
        t => !existingTypes.includes(t)
      );
      
      this.addCheck({
        name: 'essential_templates',
        description: 'Essential notification templates',
        status: missingTemplates.length === 0 ? CheckStatus.PASS : CheckStatus.WARN,
        message: missingTemplates.length === 0
          ? 'All essential templates configured'
          : `Missing templates: ${missingTemplates.join(', ')}`,
        severity: CheckSeverity.MEDIUM
      });
      
      // Check template validity
      let invalidTemplates = 0;
      templates.forEach(template => {
        if (!template.subject || !template.bodyHtml) {
          invalidTemplates++;
        }
      });
      
      this.addCheck({
        name: 'template_validity',
        description: 'Template content validity',
        status: invalidTemplates === 0 ? CheckStatus.PASS : CheckStatus.WARN,
        message: invalidTemplates === 0
          ? 'All templates have valid content'
          : `${invalidTemplates} templates missing content`,
        severity: CheckSeverity.LOW
      });
      
      this.addMetric('template_types', templates.length);
      this.addMetric('missing_templates', missingTemplates.length);
      
      if (missingTemplates.length > 0) {
        this.addRecommendation('Create missing notification templates for complete coverage');
      }
      
    } catch (error: any) {
      this.log(`Template check error: ${error.message}`, 'warning');
    }
  }
  
  private async checkNotificationStatistics(): Promise<void> {
    this.log('Checking notification statistics...', 'info');
    
    try {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // Notifications last 24h
      const notifications24h = await prisma.notification.count({
        where: { createdAt: { gte: last24h } }
      });
      
      // Notifications last 7 days
      const notifications7d = await prisma.notification.count({
        where: { createdAt: { gte: last7days } }
      });
      
      // Read rate
      const totalRecent = await prisma.notification.count({
        where: { createdAt: { gte: last7days } }
      });
      
      const readRecent = await prisma.notification.count({
        where: {
          createdAt: { gte: last7days },
          isRead: true
        }
      });
      
      const readRate = totalRecent > 0 
        ? Math.round((readRecent / totalRecent) * 100)
        : 0;
      
      this.addCheck({
        name: 'notification_activity',
        description: 'Notification system activity',
        status: notifications24h > 0 ? CheckStatus.PASS : CheckStatus.WARN,
        message: `${notifications24h} notifications in last 24h`,
        value: notifications24h,
        severity: CheckSeverity.LOW
      });
      
      this.addMetric('notifications_24h', notifications24h);
      this.addMetric('notifications_7d', notifications7d);
      this.addMetric('read_rate_percent', readRate);
      
      if (notifications24h === 0) {
        this.addRecommendation('No notifications sent in last 24h - verify system is working');
      }
      
      if (readRate < 50) {
        this.addRecommendation('Low read rate - consider improving notification relevance');
      }
      
    } catch (error: any) {
      this.log(`Statistics error: ${error.message}`, 'warning');
    }
  }
  
  private async checkFailedNotifications(): Promise<void> {
    this.log('Checking failed notifications...', 'info');
    
    try {
      // Get failed jobs from queue
      const failedJobs = await this.notificationQueue.getFailed(0, 100);
      const failedCount = failedJobs.length;
      
      if (failedCount > 0) {
        // Analyze failure reasons
        const failureReasons: Record<string, number> = {};
        
        failedJobs.forEach(job => {
          const reason = job.failedReason || 'Unknown';
          failureReasons[reason] = (failureReasons[reason] || 0) + 1;
        });
        
        this.addCheck({
          name: 'failed_notifications',
          description: 'Failed notification handling',
          status: failedCount < 10 ? CheckStatus.WARN : CheckStatus.FAIL,
          message: `${failedCount} failed notifications found`,
          value: failedCount,
          expected: 0,
          severity: CheckSeverity.MEDIUM
        });
        
        // Add top failure reasons to metrics
        Object.entries(failureReasons)
          .slice(0, 3)
          .forEach(([reason, count]) => {
            this.addMetric(`failure_${reason.substring(0, 20)}`, count);
          });
        
        this.addRecommendation('Review and retry failed notifications');
        
        // Check if we should implement retry logic
        if (failedCount > 20) {
          this.addRecommendation('Implement automatic retry logic for failed notifications');
        }
      } else {
        this.addCheck({
          name: 'failed_notifications',
          description: 'Failed notification handling',
          status: CheckStatus.PASS,
          message: 'No failed notifications',
          severity: CheckSeverity.MEDIUM
        });
      }
      
    } catch (error: any) {
      this.log(`Failed notification check error: ${error.message}`, 'warning');
    }
  }
  
  private async checkNotificationPerformance(): Promise<void> {
    this.log('Checking notification performance...', 'info');
    
    try {
      // Estimate average processing time
      const completedJobs = await this.notificationQueue.getCompleted(0, 100);
      
      if (completedJobs.length > 0) {
        const processingTimes = completedJobs
          .filter(job => job.processedOn && job.timestamp)
          .map(job => job.processedOn! - job.timestamp);
        
        const avgProcessingTime = processingTimes.length > 0
          ? Math.round(processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length)
          : 0;
        
        this.addCheck({
          name: 'notification_performance',
          description: 'Notification processing performance',
          status: avgProcessingTime < 1000 ? CheckStatus.PASS :
                  avgProcessingTime < 5000 ? CheckStatus.WARN : CheckStatus.FAIL,
          message: `Average processing time: ${avgProcessingTime}ms`,
          value: avgProcessingTime,
          expected: '<1000ms',
          severity: CheckSeverity.MEDIUM
        });
        
        this.addMetric('avg_processing_time_ms', avgProcessingTime);
        
        if (avgProcessingTime > 5000) {
          this.addRecommendation('Optimize notification processing for better performance');
        }
      }
      
    } catch (error: any) {
      this.log(`Performance check error: ${error.message}`, 'warning');
    }
  }
  
  private async checkServiceFiles(): Promise<void> {
    this.log('Checking service files...', 'info');
    
    const filesToCheck = [
      {
        path: path.join(process.cwd(), 'src/services/notification.service.ts'),
        description: 'Notification service'
      },
      {
        path: path.join(process.cwd(), 'src/services/email.service.ts'),
        description: 'Email service'
      },
      {
        path: path.join(process.cwd(), 'src/routes/notification.routes.ts'),
        description: 'Notification routes'
      },
      {
        path: path.join(process.cwd(), 'src/queues/notification.queue.ts'),
        description: 'Notification queue processor'
      }
    ];
    
    let allFilesExist = true;
    const missingFiles: string[] = [];
    
    for (const file of filesToCheck) {
      const exists = fs.existsSync(file.path);
      if (!exists) {
        allFilesExist = false;
        missingFiles.push(file.description);
      }
    }
    
    this.addCheck({
      name: 'service_files',
      description: 'Notification service files',
      status: allFilesExist ? CheckStatus.PASS : CheckStatus.WARN,
      message: allFilesExist 
        ? 'All service files present'
        : `Missing: ${missingFiles.join(', ')}`,
      severity: CheckSeverity.MEDIUM
    });
  }
  
  private async checkQueueHealth(): Promise<void> {
    this.log('Checking queue health...', 'info');
    
    try {
      // Check if queue is paused
      const isPaused = await this.notificationQueue.isPaused();
      
      this.addCheck({
        name: 'queue_paused',
        description: 'Queue processing status',
        status: !isPaused ? CheckStatus.PASS : CheckStatus.FAIL,
        message: isPaused ? 'Queue is PAUSED' : 'Queue is running',
        severity: CheckSeverity.HIGH
      });
      
      if (isPaused) {
        this.addRecommendation('Resume notification queue processing immediately');
      }
      
      // Check queue memory usage
      const queueInfo = await this.redis.info('memory');
      const memoryMatch = queueInfo.match(/used_memory_human:([^\r\n]+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1] : 'unknown';
      
      this.addMetric('redis_memory', memoryUsage);
      
    } catch (error: any) {
      this.log(`Queue health check error: ${error.message}`, 'warning');
    }
  }
}

// Esecuzione
async function main() {
  const healthCheck = new NotificationSystemHealthCheck();
  const result = await healthCheck.execute();
  
  // Output formattato
  console.log('\n' + '='.repeat(60));
  console.log(`HEALTH CHECK RESULT: ${result.displayName}`);
  console.log('='.repeat(60));
  console.log(`Status: ${result.status.toUpperCase()} (Score: ${result.score}/100)`);
  console.log(`Execution Time: ${result.executionTime}ms`);
  
  if (result.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    result.warnings.forEach(w => console.log(`  - ${w}`));
  }
  
  if (result.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    result.errors.forEach(e => console.log(`  - ${e}`));
  }
  
  if (result.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    result.recommendations.forEach(r => console.log(`  - ${r}`));
  }
  
  console.log('\n📊 METRICS:');
  Object.entries(result.metrics).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  
  console.log('\n' + '='.repeat(60));
  
  // Exit con codice appropriato
  process.exit(result.status === 'healthy' ? 0 : 1);
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default NotificationSystemHealthCheck;
