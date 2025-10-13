/**
 * Auto-Remediation System
 * Sistema configurabile per la risoluzione automatica dei problemi comuni
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../../../backend/src/services/notification.service';
import { logger } from '../../../backend/src/utils/logger';

const execAsync = promisify(exec);
const prisma = new PrismaClient();
const notificationService = new NotificationService();

interface RemediationRule {
  id: string;
  module: string;
  condition: {
    scoreBelow?: number;
    errorContains?: string;
    warningContains?: string;
    checkFailed?: string;
  };
  actions: RemediationAction[];
  enabled: boolean;
  maxAttempts: number;
  cooldownMinutes: number;
  notifyOnSuccess: boolean;
  notifyOnFailure: boolean;
}

interface RemediationAction {
  type: 'restart_service' | 'clear_cache' | 'run_script' | 'database_cleanup' | 'notify_only';
  target?: string;
  script?: string;
  params?: any;
  description: string;
}

interface RemediationResult {
  ruleId: string;
  module: string;
  timestamp: Date;
  success: boolean;
  actionsExecuted: string[];
  error?: string;
  healthScoreBefore: number;
  healthScoreAfter?: number;
}

export class AutoRemediationSystem {
  private rules: RemediationRule[] = [];
  private configPath: string;
  private attemptHistory: Map<string, Date[]> = new Map();

  constructor() {
    this.configPath = path.join(__dirname, '../config/remediation.config.json');
    this.loadConfiguration();
  }

  /**
   * Carica le regole di remediation
   */
  private async loadConfiguration(): Promise<void> {
    try {
      const configFile = await fs.readFile(this.configPath, 'utf-8');
      this.rules = JSON.parse(configFile);
      logger.info(`✅ Loaded ${this.rules.length} remediation rules`);
    } catch (error) {
      logger.warn('⚠️ No remediation config found, using defaults');
      this.rules = this.getDefaultRules();
      await this.saveConfiguration();
    }
  }

  /**
   * Salva la configurazione
   */
  private async saveConfiguration(): Promise<void> {
    try {
      await fs.writeFile(
        this.configPath,
        JSON.stringify(this.rules, null, 2),
        'utf-8'
      );
      logger.info('✅ Remediation configuration saved');
    } catch (error) {
      logger.error('Error saving remediation config:', error);
    }
  }

  /**
   * Regole di default
   */
  private getDefaultRules(): RemediationRule[] {
    return [
      {
        id: 'auth-jwt-fix',
        module: 'auth-system',
        condition: {
          errorContains: 'JWT verification failed'
        },
        actions: [
          {
            type: 'clear_cache',
            target: 'jwt_keys',
            description: 'Clear JWT key cache'
          },
          {
            type: 'restart_service',
            target: 'auth',
            description: 'Restart authentication service'
          }
        ],
        enabled: true,
        maxAttempts: 3,
        cooldownMinutes: 15,
        notifyOnSuccess: true,
        notifyOnFailure: true
      },
      {
        id: 'database-connection-fix',
        module: 'database-health',
        condition: {
          checkFailed: 'connection_test',
          scoreBelow: 50
        },
        actions: [
          {
            type: 'run_script',
            script: 'scripts/health-checks/remediation/restart-database-pool.sh',
            description: 'Restart database connection pool'
          }
        ],
        enabled: true,
        maxAttempts: 2,
        cooldownMinutes: 30,
        notifyOnSuccess: true,
        notifyOnFailure: true
      },
      {
        id: 'notification-queue-fix',
        module: 'notification-system',
        condition: {
          warningContains: 'queue backlog'
        },
        actions: [
          {
            type: 'run_script',
            script: 'scripts/health-checks/remediation/flush-notification-queue.sh',
            description: 'Flush stale notification queue items'
          }
        ],
        enabled: true,
        maxAttempts: 5,
        cooldownMinutes: 10,
        notifyOnSuccess: false,
        notifyOnFailure: true
      },
      {
        id: 'chat-websocket-fix',
        module: 'chat-system',
        condition: {
          errorContains: 'WebSocket connection lost'
        },
        actions: [
          {
            type: 'restart_service',
            target: 'websocket',
            description: 'Restart WebSocket server'
          }
        ],
        enabled: true,
        maxAttempts: 3,
        cooldownMinutes: 20,
        notifyOnSuccess: true,
        notifyOnFailure: true
      },
      {
        id: 'cache-cleanup',
        module: 'database-health',
        condition: {
          warningContains: 'cache size exceeded'
        },
        actions: [
          {
            type: 'clear_cache',
            target: 'redis',
            description: 'Clear Redis cache'
          },
          {
            type: 'database_cleanup',
            target: 'old_sessions',
            description: 'Clean old session data'
          }
        ],
        enabled: true,
        maxAttempts: 2,
        cooldownMinutes: 60,
        notifyOnSuccess: false,
        notifyOnFailure: true
      },
      {
        id: 'ai-token-limit',
        module: 'ai-system',
        condition: {
          warningContains: 'token limit approaching'
        },
        actions: [
          {
            type: 'notify_only',
            description: 'Alert administrators about token usage'
          },
          {
            type: 'run_script',
            script: 'scripts/health-checks/remediation/reset-ai-limits.sh',
            description: 'Reset daily AI token limits'
          }
        ],
        enabled: true,
        maxAttempts: 1,
        cooldownMinutes: 1440, // 24 ore
        notifyOnSuccess: true,
        notifyOnFailure: false
      }
    ];
  }

  /**
   * Valuta e applica le regole di remediation
   */
  public async evaluateAndRemediate(healthCheckResult: any): Promise<RemediationResult | null> {
    const applicableRules = this.findApplicableRules(healthCheckResult);
    
    if (applicableRules.length === 0) {
      return null;
    }

    for (const rule of applicableRules) {
      if (!this.canAttemptRemediation(rule)) {
        logger.info(`⏳ Skipping rule ${rule.id} - in cooldown period`);
        continue;
      }

      logger.info(`🔧 Applying remediation rule: ${rule.id}`);
      const result = await this.executeRemediation(rule, healthCheckResult);
      
      if (result.success) {
        logger.info(`✅ Remediation successful: ${rule.id}`);
        return result;
      } else {
        logger.error(`❌ Remediation failed: ${rule.id}`, result.error);
      }
    }

    return null;
  }

  /**
   * Trova le regole applicabili basate sul risultato del health check
   */
  private findApplicableRules(result: any): RemediationRule[] {
    return this.rules.filter(rule => {
      if (!rule.enabled || rule.module !== result.module) {
        return false;
      }

      const { condition } = rule;

      // Controlla score
      if (condition.scoreBelow && result.score >= condition.scoreBelow) {
        return false;
      }

      // Controlla errori
      if (condition.errorContains) {
        const hasError = result.errors.some((e: string) => 
          e.toLowerCase().includes(condition.errorContains!.toLowerCase())
        );
        if (!hasError) return false;
      }

      // Controlla warning
      if (condition.warningContains) {
        const hasWarning = result.warnings.some((w: string) => 
          w.toLowerCase().includes(condition.warningContains!.toLowerCase())
        );
        if (!hasWarning) return false;
      }

      // Controlla check falliti
      if (condition.checkFailed) {
        const failedCheck = result.checks.find((c: any) => 
          c.name === condition.checkFailed && c.status === 'fail'
        );
        if (!failedCheck) return false;
      }

      return true;
    });
  }

  /**
   * Verifica se è possibile tentare la remediation
   */
  private canAttemptRemediation(rule: RemediationRule): boolean {
    const history = this.attemptHistory.get(rule.id) || [];
    const now = new Date();
    
    // Rimuovi tentativi vecchi
    const recentAttempts = history.filter(attempt => {
      const minutesAgo = (now.getTime() - attempt.getTime()) / (1000 * 60);
      return minutesAgo < rule.cooldownMinutes;
    });

    this.attemptHistory.set(rule.id, recentAttempts);

    return recentAttempts.length < rule.maxAttempts;
  }

  /**
   * Esegue le azioni di remediation
   */
  private async executeRemediation(
    rule: RemediationRule,
    healthCheckResult: any
  ): Promise<RemediationResult> {
    const result: RemediationResult = {
      ruleId: rule.id,
      module: rule.module,
      timestamp: new Date(),
      success: false,
      actionsExecuted: [],
      healthScoreBefore: healthCheckResult.score
    };

    // Registra il tentativo
    const history = this.attemptHistory.get(rule.id) || [];
    history.push(new Date());
    this.attemptHistory.set(rule.id, history);

    try {
      // Esegui ogni azione
      for (const action of rule.actions) {
        logger.info(`Executing action: ${action.description}`);
        
        const actionSuccess = await this.executeAction(action);
        result.actionsExecuted.push(action.description);

        if (!actionSuccess) {
          throw new Error(`Action failed: ${action.description}`);
        }
      }

      // Attendi un po' prima di verificare il risultato
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Ri-esegui il health check per verificare il miglioramento
      const newCheck = await this.rerunHealthCheck(rule.module);
      if (newCheck) {
        result.healthScoreAfter = newCheck.score;
        result.success = newCheck.score > healthCheckResult.score;
      } else {
        result.success = true; // Assumiamo successo se non possiamo verificare
      }

      // Notifica se richiesto
      if (rule.notifyOnSuccess && result.success) {
        await this.sendRemediationNotification(rule, result, 'success');
      }

    } catch (error) {
      result.error = error.message;
      result.success = false;

      if (rule.notifyOnFailure) {
        await this.sendRemediationNotification(rule, result, 'failure');
      }
    }

    // Salva il risultato nel database
    await this.saveRemediationResult(result);

    return result;
  }

  /**
   * Esegue una singola azione di remediation
   */
  private async executeAction(action: RemediationAction): Promise<boolean> {
    try {
      switch (action.type) {
        case 'restart_service':
          return await this.restartService(action.target!);
        
        case 'clear_cache':
          return await this.clearCache(action.target!);
        
        case 'run_script':
          return await this.runScript(action.script!);
        
        case 'database_cleanup':
          return await this.databaseCleanup(action.target!);
        
        case 'notify_only':
          logger.info('Notification-only action');
          return true;
        
        default:
          logger.warn(`Unknown action type: ${action.type}`);
          return false;
      }
    } catch (error) {
      logger.error(`Action execution failed: ${action.description}`, error);
      return false;
    }
  }

  /**
   * Riavvia un servizio
   */
  private async restartService(service: string): Promise<boolean> {
    try {
      const commands: Record<string, string> = {
        'auth': 'pm2 restart auth-service',
        'websocket': 'pm2 restart websocket-server',
        'queue': 'pm2 restart queue-worker',
        'all': 'pm2 restart all'
      };

      const command = commands[service];
      if (!command) {
        logger.error(`Unknown service: ${service}`);
        return false;
      }

      await execAsync(command);
      logger.info(`✅ Service restarted: ${service}`);
      return true;
    } catch (error) {
      logger.error(`Failed to restart service ${service}:`, error);
      return false;
    }
  }

  /**
   * Pulisce la cache
   */
  private async clearCache(target: string): Promise<boolean> {
    try {
      switch (target) {
        case 'redis':
          await execAsync('redis-cli FLUSHDB');
          break;
        case 'jwt_keys':
          await execAsync('redis-cli DEL "jwt:*"');
          break;
        default:
          logger.warn(`Unknown cache target: ${target}`);
          return false;
      }
      
      logger.info(`✅ Cache cleared: ${target}`);
      return true;
    } catch (error) {
      logger.error(`Failed to clear cache ${target}:`, error);
      return false;
    }
  }

  /**
   * Esegue uno script di remediation
   */
  private async runScript(scriptPath: string): Promise<boolean> {
    try {
      const fullPath = path.join(__dirname, '../../../', scriptPath);
      const { stdout, stderr } = await execAsync(`bash ${fullPath}`);
      
      if (stderr) {
        logger.warn(`Script stderr: ${stderr}`);
      }
      
      logger.info(`✅ Script executed: ${scriptPath}`);
      return true;
    } catch (error) {
      logger.error(`Failed to run script ${scriptPath}:`, error);
      return false;
    }
  }

  /**
   * Pulizia database
   */
  private async databaseCleanup(target: string): Promise<boolean> {
    try {
      switch (target) {
        case 'old_sessions':
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - 30);
          
          await prisma.session.deleteMany({
            where: { updatedAt: { lt: cutoff } }
          });
          break;
          
        case 'old_notifications':
          const notifCutoff = new Date();
          notifCutoff.setDate(notifCutoff.getDate() - 60);
          
          await prisma.notification.deleteMany({
            where: {
              createdAt: { lt: notifCutoff },
              isRead: true
            }
          });
          break;
          
        default:
          logger.warn(`Unknown cleanup target: ${target}`);
          return false;
      }
      
      logger.info(`✅ Database cleanup completed: ${target}`);
      return true;
    } catch (error) {
      logger.error(`Database cleanup failed for ${target}:`, error);
      return false;
    }
  }

  /**
   * Ri-esegue un health check
   */
  private async rerunHealthCheck(module: string): Promise<any> {
    try {
      const scriptPath = path.join(__dirname, '../modules', `${module}-check.ts`);
      const { stdout } = await execAsync(`npx ts-node ${scriptPath}`);
      return JSON.parse(stdout);
    } catch (error) {
      logger.error(`Failed to rerun health check for ${module}:`, error);
      return null;
    }
  }

  /**
   * Invia notifica sulla remediation
   */
  private async sendRemediationNotification(
    rule: RemediationRule,
    result: RemediationResult,
    type: 'success' | 'failure'
  ): Promise<void> {
    try {
      const admins = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'SUPER_ADMIN'] },
          isActive: true
        }
      });

      const title = type === 'success' 
        ? `✅ Auto-Remediation Riuscita: ${rule.module}`
        : `❌ Auto-Remediation Fallita: ${rule.module}`;

      const message = type === 'success'
        ? `Il problema nel modulo ${rule.module} è stato risolto automaticamente. Score: ${result.healthScoreBefore} → ${result.healthScoreAfter}`
        : `Tentativo di auto-remediation fallito per ${rule.module}. Intervento manuale richiesto. Errore: ${result.error}`;

      for (const admin of admins) {
        await notificationService.sendToUser({
          userId: admin.id,
          type: 'auto_remediation',
          title,
          message,
          data: result,
          priority: type === 'failure' ? 'high' : 'normal',
          channels: ['websocket', 'email']
        });
      }
    } catch (error) {
      logger.error('Error sending remediation notification:', error);
    }
  }

  /**
   * Salva il risultato della remediation nel database
   */
  private async saveRemediationResult(result: RemediationResult): Promise<void> {
    try {
      await prisma.autoRemediationLog.create({
        data: {
          ruleId: result.ruleId,
          module: result.module,
          success: result.success,
          actionsExecuted: result.actionsExecuted,
          error: result.error,
          healthScoreBefore: result.healthScoreBefore,
          healthScoreAfter: result.healthScoreAfter,
          timestamp: result.timestamp
        }
      });
    } catch (error) {
      logger.error('Error saving remediation result:', error);
    }
  }

  /**
   * Aggiunge o aggiorna una regola
   */
  public async addOrUpdateRule(rule: RemediationRule): Promise<void> {
    const existingIndex = this.rules.findIndex(r => r.id === rule.id);
    
    if (existingIndex >= 0) {
      this.rules[existingIndex] = rule;
    } else {
      this.rules.push(rule);
    }

    await this.saveConfiguration();
    logger.info(`✅ Rule ${rule.id} saved`);
  }

  /**
   * Rimuove una regola
   */
  public async removeRule(ruleId: string): Promise<void> {
    this.rules = this.rules.filter(r => r.id !== ruleId);
    await this.saveConfiguration();
    logger.info(`✅ Rule ${ruleId} removed`);
  }

  /**
   * Ottiene tutte le regole
   */
  public getRules(): RemediationRule[] {
    return this.rules;
  }

  /**
   * Abilita/disabilita una regola
   */
  public async toggleRule(ruleId: string, enabled: boolean): Promise<void> {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
      await this.saveConfiguration();
      logger.info(`✅ Rule ${ruleId} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }
}

// Export singleton
export const autoRemediation = new AutoRemediationSystem();