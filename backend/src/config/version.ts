// Sistema Richiesta Assistenza - Configurazione Versione Backend
// Aggiornato: 29 Settembre 2025

export const SYSTEM_VERSION = '5.1.0';
export const RELEASE_DATE = '2025-09-29';
export const API_VERSION = 'v1';

export const VERSION_CONFIG = {
  system: {
    name: 'Sistema Richiesta Assistenza',
    version: SYSTEM_VERSION,
    releaseDate: RELEASE_DATE,
    apiVersion: API_VERSION,
    environment: process.env.NODE_ENV || 'development',
    status: 'production-ready',
    completion: 85
  },
  features: {
    authentication: {
      jwt: true,
      twoFactorAuth: true,
      sessionManagement: true,
      accountLockout: true
    },
    payments: {
      enabled: true,
      provider: 'stripe',
      version: '2024-06-20',
      commission: 15,
      taxRate: 22,
      methods: ['card', 'bank_transfer', 'paypal', 'cash']
    },
    notifications: {
      channels: ['email', 'websocket', 'in-app', 'whatsapp'],
      queueEnabled: true,
      retryLogic: true
    },
    integrations: {
      stripe: true,
      googleMaps: true,
      openai: true,
      whatsapp: true,
      brevo: true
    }
  },
  database: {
    tables: 97,
    paymentTables: 11,
    provider: 'postgresql',
    orm: 'prisma'
  },
  api: {
    totalEndpoints: 225,
    publicEndpoints: 9,
    paymentEndpoints: 15,
    rateLimiting: {
      enabled: true,
      maxRequests: 100,
      windowMs: 60000
    }
  },
  changelog: {
    '5.1.0': {
      date: '2025-09-29',
      type: 'feature',
      changes: [
        'Complete payment system with Stripe',
        'Admin and professional payment dashboards',
        'Automatic invoice generation',
        'Professional payout system',
        'Fix notification routing 403 error',
        'Complete payment documentation'
      ]
    },
    '5.0.0': {
      date: '2025-09-27',
      type: 'major',
      changes: [
        'Complete system verification',
        'Customization system',
        'WhatsApp WppConnect integration',
        'Cleanup system',
        'Centralized Socket.io'
      ]
    }
  }
};

// Health check info
export const getSystemInfo = () => ({
  version: SYSTEM_VERSION,
  apiVersion: API_VERSION,
  releaseDate: RELEASE_DATE,
  uptime: process.uptime(),
  environment: process.env.NODE_ENV || 'development',
  nodeVersion: process.version,
  platform: process.platform,
  memory: {
    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
  },
  features: VERSION_CONFIG.features
});

export default VERSION_CONFIG;
