/**
 * Health Check Service
 * Gestisce tutte le chiamate API relative al sistema Health Check
 */

import { apiClient } from './api';

export const healthService = {
  /**
   * Ottiene il summary generale del sistema
   */
  getSummary: () => {
    return apiClient.get('/admin/health-check/summary');  // FIXED: usa il nuovo endpoint
  },

  /**
   * Ottiene la lista dei moduli
   */
  getModules: () => {
    return apiClient.get('/admin/health-check/modules');
  },

  /**
   * Esegue tutti i check
   */
  runAllChecks: () => {
    return apiClient.post('/admin/health-check/run', {});
  },

  /**
   * Esegue un singolo check
   */
  runSingleCheck: (module: string) => {
    return apiClient.post('/admin/health-check/run', { module });
  },

  /**
   * Ottiene lo stato dell'automazione
   */
  getAutomationStatus: () => {
    return apiClient.get('/admin/health-check/status');
  },

  /**
   * Avvia il sistema di automazione
   */
  startAutomation: () => {
    return apiClient.post('/admin/health-check/start');
  },

  /**
   * Ferma il sistema di automazione
   */
  stopAutomation: () => {
    return apiClient.post('/admin/health-check/stop');
  },

  /**
   * Ottiene la configurazione dello scheduler
   */
  getScheduleConfig: () => {
    return apiClient.get('/admin/health-check/schedule');
  },

  /**
   * Aggiorna la configurazione dello scheduler
   */
  updateScheduleConfig: (config: any) => {
    return apiClient.put('/admin/health-check/schedule', config);
  },

  /**
   * Genera un report
   */
  generateReport: (params: { startDate?: string; endDate?: string; format?: string }) => {
    return apiClient.post('/admin/health-check/report', params);
  },

  /**
   * Ottiene lo storico dei report
   */
  getReportHistory: () => {
    return apiClient.get('/admin/health-check/report/history');
  },

  /**
   * Ottiene le regole di remediation
   */
  getRemediationRules: () => {
    return apiClient.get('/admin/health-check/remediation');
  },

  /**
   * Aggiunge una regola di remediation
   */
  addRemediationRule: (rule: any) => {
    return apiClient.post('/admin/health-check/remediation', rule);
  },

  /**
   * Rimuove una regola di remediation
   */
  removeRemediationRule: (id: string) => {
    return apiClient.delete(`/admin/health-check/remediation/${id}`);
  },

  /**
   * Toggle una regola di remediation
   */
  toggleRemediationRule: (id: string, enabled: boolean) => {
    return apiClient.patch(`/admin/health-check/remediation/${id}/toggle`, { enabled });
  },

  /**
   * Ottiene le metriche di performance
   */
  getPerformanceMetrics: () => {
    return apiClient.get('/admin/health-check/performance');
  },

  /**
   * Ottiene lo storico delle performance
   */
  getPerformanceHistory: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiClient.get(`/admin/health-check/performance/history?${params}`);
  },

  /**
   * Esporta i dati
   */
  exportData: (format: string, startDate?: string, endDate?: string) => {
    return apiClient.post('/admin/health-check/export', { format, startDate, endDate });
  },

  /**
   * Ottiene lo storico generale
   */
  getHistory: (limit?: number) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    return apiClient.get(`/admin/health-check/history?${params}`);
  },

  /**
   * Ottiene lo storico di un modulo specifico
   */
  getModuleHistory: (module: string, limit?: number) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    return apiClient.get(`/admin/health-check/history/${module}?${params}`);
  }
};

// Export per compatibilità con import esistenti
export default {
  health: healthService
};
