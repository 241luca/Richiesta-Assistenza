// Mock API endpoints per il sistema rapporti professionali
import { apiClient as api } from '../api';

// ✅ AGGIORNATO PER USARE GLI ENDPOINT DEL BACKEND PRINCIPALE
const USE_REAL_API = true; // ATTIVATO!

// Base URL per i rapporti intervento (senza /api perché apiClient lo aggiunge già)
const BASE_URL = '/intervention-reports/professional';

// FRASI RICORRENTI
export const phrasesApi = {
  // Get all phrases
  getAll: () => {
    return api.get(`${BASE_URL}/phrases`);
  },
  
  // Get single phrase (se serve)
  getById: (id: string) => {
    return api.get(`${BASE_URL}/phrases/${id}`);
  },
  
  // Create new phrase
  create: (data: {
    category: string;
    title: string;
    content: string;
    isFavorite?: boolean;
  }) => {
    return api.post(`${BASE_URL}/phrases`, data);
  },
  
  // Update phrase
  update: (id: string, data: any) => {
    return api.put(`${BASE_URL}/phrases/${id}`, data);
  },
  
  // Delete phrase
  delete: (id: string) => {
    return api.delete(`${BASE_URL}/phrases/${id}`);
  },
  
  // Toggle favorite
  toggleFavorite: (id: string, isFavorite: boolean) => {
    return api.post(`${BASE_URL}/phrases/${id}/favorite`, { isFavorite });
  }
};

// MATERIALI
export const materialsApi = {
  // Get all materials
  getAll: () => {
    return api.get(`${BASE_URL}/materials`);
  },
  
  // Get categories
  getCategories: () => {
    return api.get(`${BASE_URL}/material-categories`);
  },
  
  // Get single material
  getById: (id: string) => {
    return api.get(`${BASE_URL}/materials/${id}`);
  },
  
  // Create new material
  create: (data: {
    code: string;
    name: string;
    description?: string;
    unit: string;
    price: number;
    vatRate: number;
    category: string;
  }) => {
    return api.post(`${BASE_URL}/materials`, data);
  },
  
  // Update material
  update: (id: string, data: any) => {
    return api.put(`${BASE_URL}/materials/${id}`, data);
  },
  
  // Toggle active status
  toggleActive: (id: string, isActive: boolean) => {
    return api.patch(`${BASE_URL}/materials/${id}`, { isActive });
  },
  
  // Delete material
  delete: (id: string) => {
    return api.delete(`${BASE_URL}/materials/${id}`);
  },
  
  // Import from CSV (se implementato)
  importCSV: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`${BASE_URL}/materials/import`, formData);
  }
};

// TEMPLATE
export const templatesApi = {
  // Get all templates
  getAll: () => {
    return api.get(`${BASE_URL}/templates`);
  },
  
  // Get single template
  getById: (id: string) => {
    return api.get(`${BASE_URL}/templates/${id}`);
  },
  
  // Create new template
  create: (data: {
    name: string;
    description?: string;
    category: string;
    sections: string[];
  }) => {
    return api.post(`${BASE_URL}/templates`, data);
  },
  
  // Update template
  update: (id: string, data: any) => {
    return api.put(`${BASE_URL}/templates/${id}`, data);
  },
  
  // Delete template
  delete: (id: string) => {
    return api.delete(`${BASE_URL}/templates/${id}`);
  },
  
  // Set as default (se implementato)
  setDefault: (id: string) => {
    return api.post(`${BASE_URL}/templates/${id}/default`);
  },
  
  // Clone template (se implementato)
  clone: (id: string) => {
    return api.post(`${BASE_URL}/templates/${id}/clone`);
  }
};

// IMPOSTAZIONI
export const settingsApi = {
  // Get all settings
  get: () => {
    return api.get(`${BASE_URL}/settings`);
  },
  
  // Update settings
  update: (data: any) => {
    return api.put(`${BASE_URL}/settings`, data);
  },
  
  // Upload logo (se implementato)
  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    return api.post(`${BASE_URL}/settings/logo`, formData);
  },
  
  // Test email (se implementato)
  testEmail: () => {
    return api.post(`${BASE_URL}/settings/test-email`);
  }
};

// STATISTICHE
export const statsApi = {
  // Get statistics
  getStats: (range?: string) => {
    return api.get(`${BASE_URL}/stats`, { params: { range } });
  },
  
  // Get recent reports
  getRecent: (limit?: number) => {
    return api.get(`${BASE_URL}/recent`, { params: { limit } });
  }
};
