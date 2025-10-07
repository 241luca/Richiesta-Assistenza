/**
 * Health Check Automation System - Main Export
 * Fase 4: Automation & Alerts
 */

export { scheduler, HealthCheckScheduler } from './scheduler';
export { reportGenerator, HealthCheckReportGenerator } from './report-generator';
export { autoRemediation, AutoRemediationSystem } from './auto-remediation';
export { performanceMonitor, PerformanceMonitor } from './performance-monitor';
export { orchestrator, HealthCheckOrchestrator } from './orchestrator';

// Types
export interface HealthCheckAutomationConfig {
  scheduler?: {
    enabled: boolean;
    intervals: Record<string, string>;
  };
  reports?: {
    weekly: boolean;
    format: 'pdf' | 'html';
    recipients: string[];
  };
  remediation?: {
    enabled: boolean;
    rules: any[];
  };
  performance?: {
    enabled: boolean;
    intervalSeconds: number;
  };
}

/**
 * Inizializza e avvia tutto il sistema di automazione
 */
export async function startHealthCheckAutomation(): Promise<void> {
  const { orchestrator } = await import('./orchestrator');
  await orchestrator.start();
}

/**
 * Ferma il sistema di automazione
 */
export function stopHealthCheckAutomation(): void {
  const { orchestrator } = require('./orchestrator');
  orchestrator.stop();
}

/**
 * Esegue un check manuale
 */
export async function runManualHealthCheck(module?: string): Promise<any> {
  const { orchestrator } = await import('./orchestrator');
  return await orchestrator.runManualCheckWithRemediation(module);
}

/**
 * Genera un report on-demand
 */
export async function generateHealthReport(startDate?: Date, endDate?: Date): Promise<string> {
  const { orchestrator } = await import('./orchestrator');
  return await orchestrator.generateReport(startDate, endDate);
}

/**
 * Ottiene lo stato del sistema
 */
export async function getHealthSystemStatus(): Promise<any> {
  const { orchestrator } = await import('./orchestrator');
  return await orchestrator.getSystemStatus();
}