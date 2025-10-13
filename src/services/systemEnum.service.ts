import { apiClient } from './api';

export type SystemEnums = {
  userRoles: string[];
  requestStatus: string[];
  requestPriority: string[];
  paymentStatus: string[];
  notificationTypes: string[];
  aiConversationTypes: string[];
  aiModels: string[];
  responseStyles: string[];
  detailLevels: string[];
};

export type SystemStatus = {
  status: 'operational' | string;
  version: string;
  timestamp: string;
};

function toLabel(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export const systemEnumService = {
  /**
   * Ottieni tutti gli enum di sistema dal backend.
   */
  async getAll(): Promise<SystemEnums> {
    const res = await apiClient.get('/system/enums');
    return res.data?.data || res.data;
  },

  /**
   * Ottieni lo stato generale del sistema.
   */
  async getStatus(): Promise<SystemStatus> {
    const res = await apiClient.get('/system/status');
    return res.data?.data || res.data;
  },

  /**
   * Ottieni gli enum con etichette leggibili per Select.
   */
  async getOptions(enumName: keyof SystemEnums): Promise<{ value: string; label: string }[]> {
    const enums = await this.getAll();
    const values = enums[enumName] || [];
    return values.map((v) => ({ value: v, label: toLabel(v) }));
  },

  /**
   * Endpoint admin per ottenere mapping/etichette lato backend (protetto).
   */
  async getAdminEnums(): Promise<Record<string, any>> {
    const res = await apiClient.get('/admin/system-enums');
    return res.data?.data || res.data;
  },
};

export default systemEnumService;