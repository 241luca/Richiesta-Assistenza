#!/usr/bin/env ts-node
/**
 * Authentication System Health Check
 * Verifica completa del sistema di autenticazione
 */

import { BaseHealthCheck } from '../core/base-health-check';
import { CheckDetail, CheckStatus, CheckSeverity } from '../core/health-check.types';
import { prisma } from '../../../backend/src/config/database';
import * as fs from 'fs';
import * as path from 'path';
import Redis from 'ioredis';

class AuthenticationHealthCheck extends BaseHealthCheck {
  private redis: Redis;
  
  constructor() {
    super('authentication', '🔐 Authentication System');
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      lazyConnect: true
    });
  }
  
  async execute() {
    this.log('Starting Authentication System Health Check...', 'info');
    
    try {
      // 1. Check JWT Configuration
      await this.checkJWTConfiguration();
      
      // 2. Check Database Tables
      await this.checkDatabaseTables();
      
      // 3. Check Redis Session Store
      await this.checkRedisConnection();
      
      // 4. Check 2FA Configuration
      await this.check2FASystem();
      
      // 5. Check Login Statistics
      await this.checkLoginStatistics();
      
      // 6. Check Password Policies
      await this.checkPasswordPolicies();
      
      // 7. Check Session Management
      await this.checkSessionManagement();
      
      // 8. Check Security Files
      await this.checkSecurityFiles();
      
      // 9. Check Account Lockout System
      await this.checkAccountLockoutSystem();
      
      // 10. Performance Metrics
      await this.checkPerformanceMetrics();
      
    } catch (error: any) {
      this.log(`Critical error during health check: ${error.message}`, 'error');
      this.result.status = 'error';
      this.result.errors.push(`Health check failed: ${error.message}`);
    } finally {
      // Cleanup
      await this.redis.quit();
      await prisma.$disconnect();
    }
    
    return this.finalizeResult();
  }
  
  private async checkJWTConfiguration(): Promise<void> {
    this.log('Checking JWT configuration...', 'info');
    
    // Check JWT_SECRET exists
    const jwtSecretExists = !!process.env.JWT_SECRET;
    const jwtSecretLength = process.env.JWT_SECRET?.length || 0;
    
    this.addCheck({
      name: 'jwt_secret',
      description: 'JWT Secret Configuration',
      status: jwtSecretExists && jwtSecretLength >= 32 ? CheckStatus.PASS : CheckStatus.FAIL,
      message: jwtSecretExists 
        ? `JWT Secret configured (${jwtSecretLength} chars)`
        : 'JWT Secret not configured or too short',
      severity: CheckSeverity.CRITICAL,
      actual: jwtSecretLength,
      expected: '>=32 characters'
    });
    
    // Check JWT expiration settings
    const accessTokenExpiry = process.env.JWT_ACCESS_TOKEN_EXPIRY || '1h';
    const refreshTokenExpiry = process.env.JWT_REFRESH_TOKEN_EXPIRY || '30d';
    
    this.addMetric('jwt_access_token_expiry', accessTokenExpiry);
    this.addMetric('jwt_refresh_token_expiry', refreshTokenExpiry);
  }
  
  private async checkDatabaseTables(): Promise<void> {
    this.log('Checking database tables...', 'info');
    
    try {
      // Check User table
      const userCount = await prisma.user.count();
      this.addCheck({
        name: 'user_table',
        description: 'User table accessibility',
        status: CheckStatus.PASS,
        message: `User table accessible with ${userCount} users`,
        value: userCount,
        severity: CheckSeverity.CRITICAL
      });
      
      // Check LoginHistory table
      const loginHistoryCount = await prisma.loginHistory.count();
      this.addCheck({
        name: 'login_history_table',
        description: 'Login history tracking',
        status: CheckStatus.PASS,
        message: `Login history table has ${loginHistoryCount} records`,
        value: loginHistoryCount,
        severity: CheckSeverity.MEDIUM
      });
      
      // Check AccountLockout table
      const lockoutCount = await prisma.accountLockout.count();
      this.addMetric('account_lockouts', lockoutCount);
      
    } catch (error: any) {
      this.addCheck({
        name: 'database_tables',
        description: 'Database table accessibility',
        status: CheckStatus.FAIL,
        message: `Database error: ${error.message}`,
        severity: CheckSeverity.CRITICAL
      });
    }
  }
  
  private async checkRedisConnection(): Promise<void> {
    this.log('Checking Redis session store...', 'info');
    
    try {
      await this.redis.connect();
      await this.redis.ping();
      
      // Count active sessions
      const sessionKeys = await this.redis.keys('sess:*');
      const sessionCount = sessionKeys.length;
      
      this.addCheck({
        name: 'redis_connection',
        description: 'Redis session store',
        status: CheckStatus.PASS,
        message: `Redis connected with ${sessionCount} active sessions`,
        value: sessionCount,
        severity: CheckSeverity.HIGH
      });
      
      this.addMetric('active_sessions', sessionCount);
      
    } catch (error: any) {
      this.addCheck({
        name: 'redis_connection',
        description: 'Redis session store',
        status: CheckStatus.FAIL,
        message: `Redis connection failed: ${error.message}`,
        severity: CheckSeverity.HIGH
      });
      
      this.addRecommendation('Check Redis server is running: redis-server');
    }
  }
  
  private async check2FASystem(): Promise<void> {
    this.log('Checking 2FA system...', 'info');
    
    try {
      // Count users with 2FA enabled
      const totalUsers = await prisma.user.count();
      const users2FA = await prisma.user.count({
        where: { twoFactorEnabled: true }
      });
      
      const percentage = totalUsers > 0 ? Math.round((users2FA / totalUsers) * 100) : 0;
      
      this.addCheck({
        name: '2fa_adoption',
        description: 'Two-factor authentication adoption',
        status: percentage >= 50 ? CheckStatus.PASS : CheckStatus.WARN,
        message: `${percentage}% of users have 2FA enabled (${users2FA}/${totalUsers})`,
        value: percentage,
        expected: '>=50%',
        severity: CheckSeverity.MEDIUM
      });
      
      this.addMetric('2fa_enabled_users', users2FA);
      this.addMetric('2fa_adoption_rate', percentage);
      
      if (percentage < 50) {
        this.addRecommendation('Consider implementing 2FA enforcement policy for admin users');
      }
      
    } catch (error: any) {
      this.log(`2FA check error: ${error.message}`, 'warning');
    }
  }
  
  private async checkLoginStatistics(): Promise<void> {
    this.log('Checking login statistics...', 'info');
    
    try {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      // Successful logins in last 24h
      const successfulLogins = await prisma.loginHistory.count({
        where: {
          loginAt: { gte: last24h },
          success: true
        }
      });
      
      // Failed logins in last 24h
      const failedLogins = await prisma.loginHistory.count({
        where: {
          loginAt: { gte: last24h },
          success: false
        }
      });
      
      const failureRate = successfulLogins + failedLogins > 0 
        ? Math.round((failedLogins / (successfulLogins + failedLogins)) * 100)
        : 0;
      
      this.addCheck({
        name: 'login_failure_rate',
        description: 'Login failure rate (24h)',
        status: failureRate <= 10 ? CheckStatus.PASS : 
                failureRate <= 20 ? CheckStatus.WARN : CheckStatus.FAIL,
        message: `${failureRate}% login failure rate`,
        value: failureRate,
        expected: '<=10%',
        severity: CheckSeverity.MEDIUM
      });
      
      this.addMetric('successful_logins_24h', successfulLogins);
      this.addMetric('failed_logins_24h', failedLogins);
      this.addMetric('login_failure_rate', failureRate);
      
      if (failureRate > 20) {
        this.addRecommendation('High login failure rate detected - investigate potential security issues');
      }
      
    } catch (error: any) {
      this.log(`Login statistics error: ${error.message}`, 'warning');
    }
  }
  
  private async checkPasswordPolicies(): Promise<void> {
    this.log('Checking password policies...', 'info');
    
    const minLength = parseInt(process.env.PASSWORD_MIN_LENGTH || '8');
    const requireUppercase = process.env.PASSWORD_REQUIRE_UPPERCASE === 'true';
    const requireNumbers = process.env.PASSWORD_REQUIRE_NUMBERS === 'true';
    const requireSpecial = process.env.PASSWORD_REQUIRE_SPECIAL === 'true';
    
    const policyScore = 
      (minLength >= 8 ? 25 : 0) +
      (requireUppercase ? 25 : 0) +
      (requireNumbers ? 25 : 0) +
      (requireSpecial ? 25 : 0);
    
    this.addCheck({
      name: 'password_policy',
      description: 'Password policy strength',
      status: policyScore >= 75 ? CheckStatus.PASS : 
              policyScore >= 50 ? CheckStatus.WARN : CheckStatus.FAIL,
      message: `Password policy score: ${policyScore}/100`,
      value: policyScore,
      expected: '>=75',
      severity: CheckSeverity.HIGH
    });
    
    this.addMetric('password_min_length', minLength);
    this.addMetric('password_policy_score', policyScore);
    
    if (policyScore < 75) {
      this.addRecommendation('Strengthen password policy by enabling all complexity requirements');
    }
  }
  
  private async checkSessionManagement(): Promise<void> {
    this.log('Checking session management...', 'info');
    
    const sessionTimeout = parseInt(process.env.SESSION_TIMEOUT || '3600');
    const sessionSecret = !!process.env.SESSION_SECRET;
    
    this.addCheck({
      name: 'session_configuration',
      description: 'Session management configuration',
      status: sessionSecret && sessionTimeout <= 7200 ? CheckStatus.PASS : CheckStatus.WARN,
      message: `Session timeout: ${sessionTimeout}s, Secret: ${sessionSecret ? 'configured' : 'missing'}`,
      severity: CheckSeverity.HIGH
    });
    
    this.addMetric('session_timeout_seconds', sessionTimeout);
    
    if (sessionTimeout > 7200) {
      this.addRecommendation('Consider reducing session timeout for better security');
    }
  }
  
  private async checkSecurityFiles(): Promise<void> {
    this.log('Checking security files...', 'info');
    
    const filesToCheck = [
      {
        path: path.join(process.cwd(), 'backend/src/middleware/auth.ts'),
        description: 'Authentication middleware'
      },
      {
        path: path.join(process.cwd(), 'backend/src/middleware/rbac.ts'),
        description: 'Role-based access control'
      },
      {
        path: path.join(process.cwd(), 'backend/src/middleware/rateLimiter.ts'),
        description: 'Rate limiting middleware'
      },
      {
        path: path.join(process.cwd(), 'backend/src/middleware/security.ts'),
        description: 'Security headers middleware'
      }
    ];
    
    let allFilesExist = true;
    
    for (const file of filesToCheck) {
      const exists = fs.existsSync(file.path);
      if (!exists) {
        allFilesExist = false;
        this.log(`Missing file: ${file.description}`, 'warning');
      }
    }
    
    this.addCheck({
      name: 'security_files',
      description: 'Security middleware files',
      status: allFilesExist ? CheckStatus.PASS : CheckStatus.FAIL,
      message: allFilesExist ? 'All security files present' : 'Some security files missing',
      severity: CheckSeverity.HIGH
    });
  }
  
  private async checkAccountLockoutSystem(): Promise<void> {
    this.log('Checking account lockout system...', 'info');
    
    try {
      const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');
      const lockoutDuration = parseInt(process.env.LOCKOUT_DURATION || '900');
      
      // Check active lockouts
      const activeLockouts = await prisma.accountLockout.count({
        where: {
          lockedUntil: { gte: new Date() }
        }
      });
      
      this.addCheck({
        name: 'account_lockout',
        description: 'Account lockout system',
        status: CheckStatus.PASS,
        message: `Lockout after ${maxAttempts} attempts, ${activeLockouts} active lockouts`,
        value: activeLockouts,
        severity: CheckSeverity.MEDIUM
      });
      
      this.addMetric('max_login_attempts', maxAttempts);
      this.addMetric('lockout_duration_seconds', lockoutDuration);
      this.addMetric('active_lockouts', activeLockouts);
      
    } catch (error: any) {
      this.log(`Account lockout check error: ${error.message}`, 'warning');
    }
  }
  
  private async checkPerformanceMetrics(): Promise<void> {
    this.log('Checking authentication performance...', 'info');
    
    try {
      // Simulate login performance test
      const startTime = Date.now();
      const testUser = await prisma.user.findFirst();
      const queryTime = Date.now() - startTime;
      
      this.addCheck({
        name: 'auth_performance',
        description: 'Authentication query performance',
        status: queryTime < 100 ? CheckStatus.PASS : 
                queryTime < 500 ? CheckStatus.WARN : CheckStatus.FAIL,
        message: `Database query time: ${queryTime}ms`,
        value: queryTime,
        expected: '<100ms',
        severity: CheckSeverity.MEDIUM
      });
      
      this.addMetric('auth_query_time_ms', queryTime);
      
    } catch (error: any) {
      this.log(`Performance check error: ${error.message}`, 'warning');
    }
  }
}

// Esecuzione
async function main() {
  const healthCheck = new AuthenticationHealthCheck();
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

export default AuthenticationHealthCheck;
