import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

// API Base URL - Port 3200 for backend
// Usa l'hostname corrente quando non siamo in localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:3200'
    : `http://${window.location.hostname}:3200`);
const WS_URL = import.meta.env.VITE_WS_URL || 
  (window.location.hostname === 'localhost'
    ? 'ws://localhost:3200'
    : `ws://${window.location.hostname}:3200`);

// Create axios instance
export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,  // Aumentato a 60 secondi per WhatsApp/Evolution API su VPS
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          // No refresh token, redirect to login
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Try to refresh the token
        const { data } = await apiClient.post('/auth/refresh', {
          refreshToken,
        });

        // AGGIORNATO: Gestisce il nuovo formato ResponseFormatter
        const responseData = data.data || data; // Compatibilità con vecchio e nuovo formato

        // Save new tokens
        localStorage.setItem('accessToken', responseData.accessToken);
        localStorage.setItem('refreshToken', responseData.refreshToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${responseData.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // AGGIORNATO: Gestisce messaggi di errore dal ResponseFormatter
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error?.message;

    // Lista di endpoint che NON devono mostrare toast per 404
    // AGGIORNATO: Aggiunto knowledge-base alla lista
    const silentEndpoints = [
      '/ai/templates',
      '/ai-actions',
      '/professionals/.*/ai-actions',
      '/knowledge-base/.*'  // Aggiunto per Knowledge Base
    ];
    
    // Verifica se l'URL corrisponde a uno degli endpoint silenziosi
    const isSilentEndpoint = silentEndpoints.some(pattern => {
      const regex = new RegExp(pattern);
      return regex.test(originalRequest.url);
    });

    // Handle other errors with better error messages
    if (error.response?.status === 403) {
      toast.error(errorMessage || 'Non hai i permessi per questa azione');
    } else if (error.response?.status === 404) {
      // NON mostrare toast per endpoint AI non implementati
      if (!isSilentEndpoint) {
        toast.error(errorMessage || 'Risorsa non trovata');
      }
    } else if (error.response?.status === 500) {
      toast.error(errorMessage || 'Errore del server. Riprova più tardi');
    }

    return Promise.reject(error);
  }
);

// WebSocket management
let socket: Socket | null = null;

export const initializeSocket = (token: string): Socket => {
  if (socket) return socket;

  socket = io(API_BASE_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('WebSocket connected to port 3200');
  });

  socket.on('disconnect', () => {
    console.log('WebSocket disconnected');
  });

  socket.on('error', (error) => {
    console.error('WebSocket error:', error);
    toast.error('Errore di connessione WebSocket');
  });

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// AGGIUNGI EXPORT DIRETTO PER I METODI HTTP (per compatibilità con NotificationDashboard)
export const api = {
  // Metodi HTTP diretti per retrocompatibilità
  get: (url: string, config?: any) => apiClient.get(url, config),
  post: (url: string, data?: any, config?: any) => apiClient.post(url, data, config),
  put: (url: string, data?: any, config?: any) => apiClient.put(url, data, config),
  patch: (url: string, data?: any, config?: any) => apiClient.patch(url, data, config),
  delete: (url: string, config?: any) => apiClient.delete(url, config),
  
  // Auth
  auth: {
    login: (data: any) => apiClient.post('/auth/login', data),
    register: (data: any) => apiClient.post('/auth/register', data),
    logout: () => apiClient.post('/auth/logout'),
    refresh: (refreshToken: string) => apiClient.post('/auth/refresh', { refreshToken }),
    forgotPassword: (email: string) => apiClient.post('/auth/forgot-password', { email }),
    resetPassword: (token: string, password: string) => 
      apiClient.post('/auth/reset-password', { token, password }),
    setup2FA: () => apiClient.post('/auth/2fa/setup'),
    verify2FA: (code: string) => apiClient.post('/auth/2fa/verify', { code }),
    disable2FA: (password: string) => apiClient.post('/auth/2fa/disable', { password }),
  },

  // Users
  users: {
    getProfile: () => apiClient.get('/users/profile'),  
    updateProfile: (data: any) => apiClient.put('/users/profile', data),  
    changePassword: (data: any) => apiClient.post('/users/change-password', data),
    uploadAvatar: (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      return apiClient.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    deleteAvatar: () => apiClient.delete('/users/avatar'),
  },

  // Requests
  requests: {
    getAll: (params?: any) => apiClient.get('/requests', { params }),
    getById: (id: string) => apiClient.get(`/requests/${id}`),
    create: (data: any) => apiClient.post('/requests', data),
    update: (id: string, data: any) => apiClient.put(`/requests/${id}`, data),
    delete: (id: string) => apiClient.delete(`/requests/${id}`),
    uploadAttachment: (requestId: string, file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiClient.post(`/requests/${requestId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
  },

  // Quotes
  quotes: {
    getAll: (params?: any) => apiClient.get('/quotes', { params }),
    getById: (id: string) => apiClient.get(`/quotes/${id}`),
    create: (data: any) => apiClient.post('/quotes', data),
    update: (id: string, data: any) => apiClient.put(`/quotes/${id}`, data),
    delete: (id: string) => apiClient.delete(`/quotes/${id}`),
    accept: (id: string) => apiClient.post(`/quotes/${id}/accept`),
    reject: (id: string, reason: string) => apiClient.post(`/quotes/${id}/reject`, { reason }),
    getRevisions: (id: string) => apiClient.get(`/quotes/${id}/revisions`),
  },

  // Maps
  maps: {
    getConfig: () => apiClient.get('/maps/config'),
    geocode: (address: string) => apiClient.post('/maps/geocode', { address }),
    calculateDistance: (data: { origin: string; destination: string }) => 
      apiClient.post('/maps/calculate-distance', data),
    calculateDistances: (data: { 
      origin: string; 
      requestIds: string[]; 
      mode?: string 
    }) => apiClient.post('/maps/calculate-distances', data),
    getDirections: (data: { 
      origin: string; 
      destination: string; 
      waypoints?: string[] 
    }) => apiClient.post('/maps/directions', data),
    autocomplete: (input: string, options?: any) => 
      apiClient.post('/maps/autocomplete', { 
        input, 
        ...options 
      }),
    getPlaceDetails: (placeId: string) => 
      apiClient.post('/maps/place-details', { placeId }),
    validateAddress: (address: string) => 
      apiClient.post('/maps/validate-address', { address }),
  },

  // Payments
  payments: {
    createIntent: (quoteId: string, amount: number) => 
      apiClient.post('/payments/create-intent', { quoteId, amount }),
    confirmPayment: (paymentIntentId: string) => 
      apiClient.post('/payments/confirm', { paymentIntentId }),
    getHistory: () => apiClient.get('/payments/history'),
    getInvoice: (paymentId: string) => apiClient.get(`/payments/${paymentId}/invoice`),
  },

  // Notifications
  notifications: {
    getAll: (params?: any) => apiClient.get('/notifications', { params }),
    markAsRead: (id: string) => apiClient.put(`/notifications/${id}/read`),
    markAllAsRead: () => apiClient.put('/notifications/read-all'),
    delete: (id: string) => apiClient.delete(`/notifications/${id}`),
    getPreferences: () => apiClient.get('/notifications/preferences'),
    updatePreferences: (data: any) => apiClient.put('/notifications/preferences', data),
  },

  // Categories
  categories: {
    getAll: () => apiClient.get('/categories'),
    getById: (id: string) => apiClient.get(`/categories/${id}`),
    getSubcategories: (categoryId: string) => apiClient.get(`/categories/${categoryId}/subcategories`),
  },

  // Professionals
  professionals: {
    search: (params: any) => apiClient.get('/professionals/search', { params }),
    getById: (id: string) => apiClient.get(`/professionals/${id}`),
    getReviews: (id: string) => apiClient.get(`/professionals/${id}/reviews`),
    getAvailability: (id: string, date: string) => 
      apiClient.get(`/professionals/${id}/availability`, { params: { date } }),
  },

  // Admin
  admin: {
    getDashboard: () => apiClient.get('/admin/dashboard'),
    getUsers: (params?: any) => apiClient.get('/admin/users', { params }),
    updateUser: (id: string, data: any) => apiClient.put(`/admin/users/${id}`, data),
    deleteUser: (id: string) => apiClient.delete(`/admin/users/${id}`),
    getSystemStats: () => apiClient.get('/admin/stats'),
    getAuditLogs: (params?: any) => apiClient.get('/admin/audit-logs', { params }),
  },

  // Dashboard 
  dashboard: {
    get: () => apiClient.get('/dashboard'),
    getMetrics: () => apiClient.get('/dashboard'), 
  },

  // Health Check System
  health: {
    getSummary: () => apiClient.get('/admin/health-check/status'),
    getModules: () => apiClient.get('/admin/health-check/modules'), 
    runAllChecks: () => apiClient.post('/admin/health-check/run', {}),
    runSingleCheck: (module: string) => apiClient.post('/admin/health-check/run', { module }),
    getHistory: (module?: string, params?: any) => 
      module 
        ? apiClient.get(`/admin/health-check/history/${module}`, { params })
        : apiClient.get('/admin/health-check/history', { params }),
    getStatus: () => apiClient.get('/admin/health-check/status'),
    startAutomation: () => apiClient.post('/admin/health-check/start'),
    stopAutomation: () => apiClient.post('/admin/health-check/stop'),
  },

  // Pricing System
  pricing: {
    getEstimate: (categoryId: string, subcategoryId?: string) => 
      apiClient.get('/pricing/range/estimate', { 
        params: { categoryId, subcategoryId } 
      }),
    getCategoryPricing: (categoryId: string) => 
      apiClient.get(`/pricing/range/category/${categoryId}`),
    getStats: () => apiClient.get('/pricing/stats'),
    checkHealth: () => apiClient.get('/pricing/health'),
  },

  // Invoices System - ✅ NUOVO: Client API per fatture (NO Prisma nel frontend!)
  invoices: {
    // Lista fatture con filtri e paginazione
    getAll: (params?: any) => apiClient.get('/invoices', { params }),
    
    // Singola fattura per ID
    getById: (id: string) => apiClient.get(`/invoices/${id}`),
    
    // Crea nuova fattura
    create: (data: any) => apiClient.post('/invoices', data),
    
    // Aggiorna fattura esistente
    update: (id: string, data: any) => apiClient.put(`/invoices/${id}`, data),
    
    // Elimina fattura
    delete: (id: string) => apiClient.delete(`/invoices/${id}`),
    
    // Scarica PDF fattura
    downloadPDF: (id: string) => 
      apiClient.get(`/invoices/${id}/pdf`, { 
        responseType: 'blob' 
      }),
    
    // Invia fattura via email
    sendEmail: (id: string, options: { to: string; cc?: string[]; customMessage?: string }) => 
      apiClient.post(`/invoices/${id}/send`, options),
    
    // Invia promemoria pagamento
    sendReminder: (id: string, customMessage?: string) => 
      apiClient.post(`/invoices/${id}/reminder`, { customMessage }),
    
    // Registra pagamento su fattura
    recordPayment: (id: string, paymentData: any) => 
      apiClient.post(`/invoices/${id}/payments`, paymentData),
    
    // Aggiorna stato pagamento
    updatePaymentStatus: (id: string, data: any) => 
      apiClient.put(`/invoices/${id}/payment-status`, data),
    
    // Registra pagamento parziale
    registerPartialPayment: (id: string, data: { 
      amount: number; 
      paymentMethod: string; 
      reference: string 
    }) => apiClient.post(`/invoices/${id}/partial-payment`, data),
    
    // Genera fattura elettronica (XML SDI)
    generateElectronic: (id: string) => 
      apiClient.post(`/invoices/${id}/electronic`),
    
    // Statistiche fatturazione
    getStatistics: (professionalId: string, params?: any) => 
      apiClient.get(`/invoices/statistics/${professionalId}`, { params }),
    
    // Crea nota di credito
    createCreditNote: (data: { 
      originalInvoiceId: string; 
      reason: string; 
      lineItems: any[]; 
      amount: number 
    }) => apiClient.post('/invoices/credit-notes', data),
    
    // Lista note di credito
    getCreditNotes: (params?: any) => 
      apiClient.get('/invoices/credit-notes', { params }),
    
    // Singola nota di credito
    getCreditNoteById: (id: string) => 
      apiClient.get(`/invoices/credit-notes/${id}`),
  },
};

export default api;
