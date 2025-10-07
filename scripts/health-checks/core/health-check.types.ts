/**
 * Health Check System - Type Definitions
 * Sistema di monitoraggio salute per tutti i moduli
 */

export interface HealthCheckResult {
  module: string;
  displayName: string;
  timestamp: Date;
  status: HealthStatus;
  score: number; // 0-100
  checks: CheckDetail[];
  metrics: Record<string, any>;
  warnings: string[];
  errors: string[];
  recommendations: string[];
  executionTime: number; // milliseconds
}

export interface CheckDetail {
  name: string;
  description: string;
  status: CheckStatus;
  message?: string;
  value?: any;
  expected?: any;
  actual?: any;
  threshold?: any;
  severity: CheckSeverity;
  category?: CheckCategory;
}

export enum HealthStatus {
  HEALTHY = 'healthy',      // Score >= 80
  WARNING = 'warning',      // Score 60-79
  CRITICAL = 'critical',    // Score < 60
  UNKNOWN = 'unknown',      // Non verificabile
  ERROR = 'error'          // Errore durante il check
}

export enum CheckStatus {
  PASS = 'pass',
  WARN = 'warn',
  FAIL = 'fail',
  SKIP = 'skip',
  ERROR = 'error'
}

export enum CheckSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum CheckCategory {
  CONNECTIVITY = 'connectivity',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  DATA_INTEGRITY = 'data_integrity',
  CONFIGURATION = 'configuration',
  AVAILABILITY = 'availability'
}

export interface HealthCheckConfig {
  enabled: boolean;
  timeout?: number; // milliseconds
  retries?: number;
  alertThreshold?: number;
  schedule?: string; // cron expression
}

export interface ModuleThresholds {
  minScore: number;
  checks: Record<string, any>;
}

// Aggregated health for dashboard
export interface SystemHealth {
  overall: HealthStatus;
  overallScore: number;
  modules: HealthCheckResult[];
  lastCheck: Date;
  nextCheck?: Date;
  alerts: HealthAlert[];
}

export interface HealthAlert {
  id: string;
  module: string;
  severity: CheckSeverity;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
}
