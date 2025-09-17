/**
 * Script per eseguire un audit di sicurezza completo del sistema
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

interface SecurityAuditParams {
  checkType?: 'full' | 'permissions' | 'passwords' | 'sessions' | 'api-keys';
}

export async function execute(params: SecurityAuditParams = { checkType: 'full' }) {
  try {
    logger.info('🔒 Starting security audit...', params);
    
    const results: any = {
      timestamp: new Date().toISOString(),
      checkType: params.checkType,
      issues: [],
      recommendations: []
    };
    
    // Check utenti senza 2FA (se full o permissions)
    if (params.checkType === 'full' || params.checkType === 'permissions') {
      const usersWithout2FA = await prisma.user.count({
        where: {
          role: { in: ['ADMIN', 'SUPER_ADMIN'] },
          twoFactorEnabled: false
        }
      });
      
      if (usersWithout2FA > 0) {
        results.issues.push({
          severity: 'HIGH',
          type: 'MISSING_2FA',
          message: `${usersWithout2FA} admin users without 2FA enabled`,
          count: usersWithout2FA
        });
        results.recommendations.push('Enable 2FA for all admin users');
      }
    }
    
    // Check sessioni attive (se full o sessions)
    if (params.checkType === 'full' || params.checkType === 'sessions') {
      const activeSessions = await prisma.session.count({
        where: {
          expiresAt: {
            gt: new Date()
          }
        }
      });
      
      const oldSessions = await prisma.session.count({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });
      
      results.sessions = {
        active: activeSessions,
        expired: oldSessions
      };
      
      if (oldSessions > 100) {
        results.issues.push({
          severity: 'LOW',
          type: 'OLD_SESSIONS',
          message: `${oldSessions} expired sessions should be cleaned`,
          count: oldSessions
        });
        results.recommendations.push('Clean expired sessions regularly');
      }
    }
    
    // Check API keys (se full o api-keys)
    if (params.checkType === 'full' || params.checkType === 'api-keys') {
      const apiKeys = await prisma.apiKey.findMany({
        where: {
          isActive: true
        }
      });
      
      const oldKeys = apiKeys.filter(key => {
        const createdDate = new Date(key.createdAt);
        const monthsOld = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        return monthsOld > 6;
      });
      
      if (oldKeys.length > 0) {
        results.issues.push({
          severity: 'MEDIUM',
          type: 'OLD_API_KEYS',
          message: `${oldKeys.length} API keys older than 6 months`,
          count: oldKeys.length
        });
        results.recommendations.push('Rotate API keys older than 6 months');
      }
    }
    
    // Check login failures (se full o passwords)
    if (params.checkType === 'full' || params.checkType === 'passwords') {
      const recentFailures = await prisma.loginHistory.count({
        where: {
          success: false,
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // ultime 24 ore
          }
        }
      });
      
      if (recentFailures > 50) {
        results.issues.push({
          severity: 'HIGH',
          type: 'HIGH_LOGIN_FAILURES',
          message: `${recentFailures} failed login attempts in last 24 hours`,
          count: recentFailures
        });
        results.recommendations.push('Review failed login attempts for potential attacks');
      }
    }
    
    // Calcola punteggio di sicurezza
    const totalIssues = results.issues.length;
    const highSeverity = results.issues.filter((i: any) => i.severity === 'HIGH').length;
    const score = Math.max(0, 100 - (totalIssues * 10) - (highSeverity * 15));
    
    results.securityScore = score;
    results.rating = score >= 90 ? 'EXCELLENT' : score >= 70 ? 'GOOD' : score >= 50 ? 'FAIR' : 'POOR';
    
    logger.info(`✅ Security audit completed. Score: ${score}/100`);
    
    return {
      success: true,
      results,
      message: `Security audit completed with score ${score}/100`
    };
    
  } catch (error: any) {
    logger.error('❌ Security audit failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
