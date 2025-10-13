/**
 * Base Health Check Class
 * Classe base riutilizzabile per tutti gli health check
 */

import { 
  HealthCheckResult, 
  CheckDetail, 
  HealthStatus, 
  CheckStatus,
  CheckSeverity 
} from './health-check.types';

export abstract class BaseHealthCheck {
  protected result: HealthCheckResult;
  protected startTime: number;
  
  constructor(
    protected moduleName: string,
    protected displayName: string
  ) {
    this.result = this.initializeResult();
    this.startTime = Date.now();
  }
  
  /**
   * Metodo principale da implementare in ogni modulo
   */
  abstract execute(): Promise<HealthCheckResult>;
  
  /**
   * Inizializza il risultato con valori di default
   */
  protected initializeResult(): HealthCheckResult {
    return {
      module: this.moduleName,
      displayName: this.displayName,
      timestamp: new Date(),
      status: HealthStatus.UNKNOWN,
      score: 100,
      checks: [],
      metrics: {},
      warnings: [],
      errors: [],
      recommendations: [],
      executionTime: 0
    };
  }
  
  /**
   * Aggiunge un check al risultato e aggiorna lo score
   */
  protected addCheck(check: CheckDetail): void {
    this.result.checks.push(check);
    
    // Calcola deduzione punti basata su status e severity
    if (check.status === CheckStatus.FAIL) {
      const deduction = this.getScoreDeduction(check.severity);
      this.result.score -= deduction;
      
      // Aggiungi agli errori
      this.result.errors.push(
        `${check.description}: ${check.message || 'Check failed'}`
      );
    } else if (check.status === CheckStatus.WARN) {
      const deduction = Math.floor(this.getScoreDeduction(check.severity) / 2);
      this.result.score -= deduction;
      
      // Aggiungi ai warning
      this.result.warnings.push(
        `${check.description}: ${check.message || 'Warning detected'}`
      );
    }
    
    // Assicurati che lo score non vada sotto 0
    this.result.score = Math.max(0, this.result.score);
  }
  
  /**
   * Calcola la deduzione di punti basata sulla severity
   */
  protected getScoreDeduction(severity: CheckSeverity): number {
    switch(severity) {
      case CheckSeverity.CRITICAL: return 40;
      case CheckSeverity.HIGH: return 20;
      case CheckSeverity.MEDIUM: return 10;
      case CheckSeverity.LOW: return 5;
      default: return 0;
    }
  }
  
  /**
   * Aggiunge una metrica al risultato
   */
  protected addMetric(key: string, value: any): void {
    this.result.metrics[key] = value;
  }
  
  /**
   * Aggiunge una raccomandazione
   */
  protected addRecommendation(recommendation: string): void {
    if (!this.result.recommendations.includes(recommendation)) {
      this.result.recommendations.push(recommendation);
    }
  }
  
  /**
   * Calcola lo status finale basato sullo score
   */
  protected calculateFinalStatus(): void {
    if (this.result.score >= 80) {
      this.result.status = HealthStatus.HEALTHY;
    } else if (this.result.score >= 60) {
      this.result.status = HealthStatus.WARNING;
    } else {
      this.result.status = HealthStatus.CRITICAL;
    }
  }
  
  /**
   * Finalizza il risultato calcolando status e tempo di esecuzione
   */
  protected finalizeResult(): HealthCheckResult {
    this.result.executionTime = Date.now() - this.startTime;
    this.calculateFinalStatus();
    return this.result;
  }
  
  /**
   * Helper per verificare connessione database
   */
  protected async checkDatabaseConnection(
    prisma: any,
    modelName: string
  ): Promise<CheckDetail> {
    try {
      const count = await prisma[modelName].count();
      return {
        name: `${modelName}_connection`,
        description: `Database connection for ${modelName}`,
        status: CheckStatus.PASS,
        message: `Connected successfully, ${count} records found`,
        value: count,
        severity: CheckSeverity.CRITICAL,
        category: 'connectivity'
      };
    } catch (error: any) {
      return {
        name: `${modelName}_connection`,
        description: `Database connection for ${modelName}`,
        status: CheckStatus.FAIL,
        message: `Connection failed: ${error.message}`,
        severity: CheckSeverity.CRITICAL,
        category: 'connectivity'
      };
    }
  }
  
  /**
   * Helper per verificare file esistenza
   */
  protected checkFileExists(
    filePath: string,
    description: string,
    severity: CheckSeverity = CheckSeverity.MEDIUM
  ): CheckDetail {
    const fs = require('fs');
    const exists = fs.existsSync(filePath);
    
    return {
      name: `file_check_${filePath.replace(/[^a-z0-9]/gi, '_')}`,
      description,
      status: exists ? CheckStatus.PASS : CheckStatus.FAIL,
      message: exists ? 'File exists' : 'File not found',
      value: filePath,
      severity,
      category: 'configuration'
    };
  }
  
  /**
   * Helper per verificare servizio esterno
   */
  protected async checkExternalService(
    name: string,
    checkFunction: () => Promise<boolean>,
    description: string,
    severity: CheckSeverity = CheckSeverity.HIGH
  ): Promise<CheckDetail> {
    try {
      const isHealthy = await checkFunction();
      return {
        name: `service_${name}`,
        description,
        status: isHealthy ? CheckStatus.PASS : CheckStatus.FAIL,
        message: isHealthy ? 'Service is healthy' : 'Service is not responding',
        severity,
        category: 'connectivity'
      };
    } catch (error: any) {
      return {
        name: `service_${name}`,
        description,
        status: CheckStatus.FAIL,
        message: `Service check failed: ${error.message}`,
        severity,
        category: 'connectivity'
      };
    }
  }
  
  /**
   * Helper per logging colorato in console
   */
  protected log(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    const colors = {
      reset: '\x1b[0m',
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      warning: '\x1b[33m', // Yellow
      error: '\x1b[31m'    // Red
    };
    
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    
    console.log(`${colors[type]}${icons[type]} ${message}${colors.reset}`);
  }
}
