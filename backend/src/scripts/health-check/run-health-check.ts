/**
 * Script: Run Health Check
 * Esegue un health check manuale del sistema
 */

import { orchestrator } from '../../services/health-check-automation';
import { logger } from '../../utils/logger';

interface HealthCheckParams {
  module?: string;
  verbose?: boolean;
}

export async function execute(params: HealthCheckParams = {}) {
  const { module = 'all', verbose = false } = params;
  
  try {
    logger.info('🏥 Starting health check...');
    logger.info(`📋 Module: ${module}`);
    logger.info(`📝 Verbose: ${verbose}`);
    
    let result;
    
    if (module === 'all') {
      // Run check for all modules
      result = await orchestrator.runManualCheckWithRemediation();
    } else {
      // Run check for specific module
      result = await orchestrator.runManualCheckWithRemediation(module);
    }
    
    // Process results
    const modules = result.modules || [];
    const overallScore = result.overallScore || 0;
    const overall = result.overall || 'unknown';
    
    logger.info('📊 Health Check Results:');
    logger.info(`Overall Score: ${overallScore}/100`);
    logger.info(`Overall Status: ${overall.toUpperCase()}`);
    
    if (verbose && modules.length > 0) {
      logger.info('\n📋 Module Details:');
      modules.forEach((mod: any) => {
        logger.info(`\n${mod.module}:`);
        logger.info(`  Status: ${mod.status}`);
        logger.info(`  Score: ${mod.score}/100`);
        
        if (mod.checks && mod.checks.length > 0) {
          logger.info('  Checks:');
          mod.checks.forEach((check: any) => {
            const icon = check.passed ? '✅' : '❌';
            logger.info(`    ${icon} ${check.name}: ${check.message}`);
          });
        }
        
        if (mod.warnings && mod.warnings.length > 0) {
          logger.info('  ⚠️ Warnings:');
          mod.warnings.forEach((warning: string) => {
            logger.info(`    - ${warning}`);
          });
        }
        
        if (mod.errors && mod.errors.length > 0) {
          logger.info('  ❌ Errors:');
          mod.errors.forEach((error: string) => {
            logger.info(`    - ${error}`);
          });
        }
      });
    }
    
    // Determine if remediation was triggered
    if (result.remediationTriggered) {
      logger.info('\n🔧 Auto-Remediation:');
      logger.info('  Status: TRIGGERED');
      
      if (result.remediationResults) {
        result.remediationResults.forEach((rem: any) => {
          const icon = rem.success ? '✅' : '❌';
          logger.info(`  ${icon} ${rem.rule}: ${rem.message}`);
        });
      }
    }
    
    logger.info('\n✅ Health check completed');
    
    return {
      success: true,
      overallScore,
      overall,
      modules: modules.length,
      remediationTriggered: result.remediationTriggered || false,
      timestamp: new Date()
    };
    
  } catch (error) {
    logger.error('❌ Health check failed:', error);
    throw error;
  }
}

// Metadata for Script Manager
export const metadata = {
  id: 'run-health-check',
  name: 'Health Check Manuale',
  description: 'Esegue un health check completo del sistema',
  category: 'health-check',
  risk: 'low',
  parameters: [
    {
      name: 'module',
      type: 'select',
      options: ['all', 'auth-system', 'database-health', 'notification-system', 'backup-system', 'chat-system', 'payment-system', 'ai-system', 'request-system'],
      default: 'all',
      description: 'Modulo da controllare'
    },
    {
      name: 'verbose',
      type: 'boolean',
      default: false,
      description: 'Output dettagliato'
    }
  ],
  requireConfirmation: false,
  minRole: 'ADMIN'
};