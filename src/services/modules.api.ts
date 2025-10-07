import api from './api';

export const modulesApi = {
  getAll: () => api.get('/admin/modules'),
  
  getByCategory: (category: string) => 
    api.get(`/admin/modules/category/${category}`),
  
  getByCode: (code: string) => 
    api.get(`/admin/modules/${code}`),
  
  enable: (code: string, reason?: string) =>
    api.post(`/admin/modules/${code}/enable`, { reason }),
  
  disable: (code: string, reason?: string) =>
    api.post(`/admin/modules/${code}/disable`, { reason }),
  
  updateConfig: (code: string, config: any) =>
    api.put(`/admin/modules/${code}/config`, { config }),
  
  getSettings: (code: string) =>
    api.get(`/admin/modules/${code}/settings`),
  
  updateSetting: (code: string, key: string, value: string) =>
    api.put(`/admin/modules/${code}/settings/${key}`, { value }),
  
  getHistory: (code: string, limit?: number) =>
    api.get(`/admin/modules/${code}/history`, { params: { limit } })
};