import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import path from 'path';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

// Import moduli essenziali
import { ResponseFormatter } from './utils/responseFormatter';
import { logger } from './utils/logger';
import { notificationService } from './services/notification.service';
import { setIO } from './utils/socket';
import { authenticate } from './middleware/auth';
import { requireRole } from './middleware/rbac';
import { Role } from '@prisma/client';
import { errorHandler } from './middleware/errorHandler';
import { requestIdMiddleware } from './middleware/requestId';

// Import WhatsApp service - DISABILITATO TEMPORANEAMENTE PER PROBLEMI PERMESSI
// import { wppConnectService } from './services/wppconnect.service';

// Import Redis
import redis from './config/redis';

// Create Express app
const app = express();
const httpServer = createServer(app);

// Register Redis in Express app per health check
app.set('redis', redis);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5193',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Store io instance globally
app.set('io', io);
setIO(io);
notificationService.setIO(io);

// CORS configuration
app.use(cors({
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    const allowedOrigins = [
      'http://localhost:5193',
      'http://127.0.0.1:5193',
      'http://localhost:5173',
      'http://127.0.0.1:5173'
    ];
    
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['X-Request-Id'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));

// Request ID middleware
app.use(requestIdMiddleware);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/uploads', express.static(path.join(__dirname, '../../public/uploads')));
app.use(express.static(path.join(__dirname, '../../public')));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    port: process.env.PORT || 3200,
    websocket: 'ready',
    timestamp: new Date().toISOString() 
  });
});

// WebSocket test endpoint
app.get('/ws-test', (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>WebSocket Test</title>
    </head>
    <body>
      <h1>WebSocket Connection Test</h1>
      <div id="status">Disconnected</div>
      <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
      <script>
        const socket = io('http://localhost:3200', {
          transports: ['websocket', 'polling']
        });
        socket.on('connect', () => {
          document.getElementById('status').innerHTML = 'Connected: ' + socket.id;
        });
      </script>
    </body>
    </html>
  `);
});

// ===== IMPORT ALL ROUTES =====

// Base routes
import authRoutes from './routes/auth.routes';
// TEMPORANEAMENTE DISABILITATO - File con errori database schema
// import professionalRegistrationRoutes from './routes/professional-registration.routes';
import securityRoutes from './routes/security.routes'; // RIATTIVATO - Security routes
import userRoutes from './routes/user.routes';
import professionalDetailsRoutes from './routes/professional-details.routes';
// DISABILITATO TEMPORANEAMENTE - File ha estensione .disabled
// import professionalAISettingsRoutes from './routes/professional-ai-settings.routes';
import categoryRoutes from './routes/category.routes';
import subcategoryRoutes from './routes/subcategory.routes';
import publicRoutes from './routes/public.routes';
import debugRoutes from './routes/debug.routes';
import testRoutes from './routes/test.routes';
// import whatsappMainRoutes from './routes/whatsapp-main.routes'; // DISABILITATO - usa crittografia
import whatsappRoutes from './routes/whatsapp.routes'; // NUOVO - versione semplice senza crittografia
import whatsappContactsRoutes from './routes/whatsapp-contacts.routes'; // NUOVO - gestione contatti WhatsApp
import whatsappConfigRoutes from './routes/admin/whatsapp-config.routes';
// DISABILITATO - File .disabled - Sistema articoli KB mai completato
// import knowledgebaseRoutes from './routes/knowledgebase.routes';
import knowledgeBaseRoutes from './routes/knowledge-base.routes'; // NUOVO IMPORT

// Dashboard routes - IMPORTANTE!
import userDashboardRoutes from './routes/dashboard/user-dashboard.routes';

// Request Management routes
import requestRoutes from './routes/request.routes';
import { quoteRoutes } from './routes/quote.routes';
import reviewRoutes from './routes/reviews.routes'; // NUOVO - Sistema recensioni
import portfolioRoutes from './routes/portfolio.routes'; // NUOVO - Sistema portfolio
import referralRoutes from './routes/referral.routes'; // NUOVO - Sistema referral
import notificationRoutes from './routes/notification.routes';
import notificationAdminRoutes from './routes/notificationAdmin.routes';
import notificationTemplateRoutes from './routes/notificationTemplate.routes';
import attachmentRoutes from './routes/attachment.routes';

// Professional routes
import professionalRoutes from './routes/professional.routes';
import professionalsRoutes from './routes/professionals.routes'; // NUOVO per endpoint by-subcategory
import professionalPricingRoutes from './routes/professionalPricing.routes';
import professionsRoutes from './routes/professions.routes';
import professionCategoriesRoutes from './routes/profession-categories.routes';
import professionalSkillsCertRoutes from './routes/professionalSkillsCertifications.routes';
import userSubcategoriesRoutes from './routes/user-subcategories.routes';

// Travel routes
import travelRoutes from './routes/travel.routes';
import travelCostRoutes from './routes/travelCostRoutes';
import addressRoutes from './routes/address.routes';

// Intervention Report routes
import interventionReportConfigRoutes from './routes/intervention-report-config.routes';
import interventionReportTemplateRoutes from './routes/intervention-report-template.routes';
import interventionReportRoutes from './routes/intervention-report.routes';
import interventionReportMaterialRoutes from './routes/intervention-report-material.routes';
import interventionReportProfessionalRoutes from './routes/intervention-report-professional.routes';

// AI & Maps routes
import aiRoutes from './routes/ai-professional.routes';
import mapsRoutes from './routes/maps.routes';
import geocodingRoutes from './routes/geocoding.routes';
import locationRoutes from './routes/location.routes'; // NUOVO - Location tracking live

// Admin routes
import adminRoutes from './routes/admin.routes';
import adminUsersRoutes from './routes/admin-users.routes';
import adminModulesRoutes from './routes/admin/modules.routes'; // NUOVO - Sistema moduli admin
import apiKeysRoutes from './routes/apiKeys.routes';
import adminApiKeysRoutes from './routes/admin/api-keys.routes'; // NUOVO - Route corrette per API keys
import emailTemplatesRoutes from './routes/emailTemplates.routes';
import kbDocumentsRoutes from './routes/kb-documents.routes';

// Document Management routes
import documentTypesRoutes from './routes/admin/document-types.routes';
import documentCategoriesRoutes from './routes/admin/document-categories.routes';
import documentFieldsRoutes from './routes/admin/document-fields.routes';
import documentPermissionsRoutes from './routes/admin/document-permissions.routes';
import documentNotificationsRoutes from './routes/admin/document-notifications.routes';
import documentConfigRoutes from './routes/admin/document-config.routes';
import documentUIConfigsRoutes from './routes/admin/document-ui-configs.routes';
import approvalWorkflowsRoutes from './routes/admin/approval-workflows.routes';

// Legal Documents routes
import legalRoutes from './routes/legal.routes';

// WhatsApp routes 
// import professionalWhatsappRoutes from './routes/professional-whatsapp.routes'; // RIMOSSO - Migration a solo WPPConnect
import systemEnumRoutes from './routes/systemEnum.routes';
import whatsappWebhookRoutes from './routes/whatsapp-webhook.routes';

// Admin Scripts routes - IMPORTANTE!
import adminScriptsRoutes from './routes/admin/shell-scripts-simple.routes';
import scriptConfigRoutes from './routes/admin/scriptConfig.routes';

// Admin System Settings routes - IMPORTANTE!
import adminSystemSettingsRoutes from './routes/admin/system-settings.routes';

// Payment routes
import paymentRoutes from './routes/payment.routes';

// Pricing routes
import pricingRoutes from './routes/pricing.routes';

// Upload routes
import uploadRoutes from './routes/upload.routes';

// Chat routes
import { chatRoutes } from './routes/chat.routes';

// System routes - IMPORTATI DIRETTAMENTE (senza try-catch opzionale)
import auditRoutes from './routes/audit.routes';
import healthCheckRoutes from './routes/admin/health-check.routes';
import cleanupConfigRoutes from './routes/cleanup-config.routes';
import scheduledInterventionsRoutes from './routes/scheduledInterventions';
import simpleBackupRoutes from './routes/simple-backup.routes';
import calendarGoogleRoutes from './routes/calendar-google.routes'; // NUOVO - Google Calendar OAuth
import calendarRoutes from './routes/calendar.routes'; // CALENDARIO BASE - Route principali
import calendarSimpleRoutes from './routes/calendar-simple.routes'; // CALENDARIO SEMPLIFICATO - Per test

logger.info('✅ All system routes imported successfully');

// ===== REGISTER ALL ROUTES =====

// Public routes (no auth)
import publicSystemSettingsRoutes from './routes/public/system-settings.routes';
app.use('/api/public', publicRoutes);
app.use('/api/public/system-settings', publicSystemSettingsRoutes);

// Auth routes with rate limiting
app.use('/api/auth', authLimiter, authRoutes);
// TEMPORANEAMENTE DISABILITATO - File con errori database schema
// app.use('/api/auth', authLimiter, professionalRegistrationRoutes);

// User routes
app.use('/api/users', authenticate, userRoutes);
app.use('/api/user', authenticate, userSubcategoriesRoutes);

// DASHBOARD ROUTE - IMPORTANTE! Deve essere dopo l'autenticazione
app.use('/api/dashboard', authenticate, userDashboardRoutes);
logger.info('📊 Dashboard routes registered at /api/dashboard');

// Category routes
app.use('/api/categories', authenticate, categoryRoutes);
app.use('/api/subcategories', authenticate, subcategoryRoutes);

// Request Management routes
app.use('/api/requests', authenticate, requestRoutes);
app.use('/api/quotes', authenticate, quoteRoutes);
app.use('/api/reviews', authenticate, reviewRoutes); // NUOVO - Sistema recensioni
app.use('/api/portfolio', portfolioRoutes); // NUOVO - Sistema portfolio (alcuni endpoint pubblici)
app.use('/api/referrals', referralRoutes); // NUOVO - Sistema referral (alcuni endpoint pubblici)
app.use('/api/payments', authenticate, paymentRoutes);
app.use('/api/pricing', authenticate, pricingRoutes); // NUOVO - Sistema range prezzi indicativi

// Notification routes - SEPARAZIONE CLEAN: admin routes separate
app.use('/api/notification-templates', authenticate, notificationTemplateRoutes);
app.use('/api/admin/notifications', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), notificationAdminRoutes); // Admin routes separate
app.use('/api/notifications', authenticate, notificationRoutes); // User routes normali

// Professional routes
app.use('/api/professionals', authenticate, professionalRoutes);
app.use('/api/professionals', authenticate, professionalsRoutes); // NUOVO - endpoint by-subcategory
app.use('/api/professionals', authenticate, professionalPricingRoutes);
app.use('/api/professionals', authenticate, professionalSkillsCertRoutes);
// DISABILITATO TEMPORANEAMENTE - File ha estensione .disabled
// app.use('/api/professionals', authenticate, professionalAISettingsRoutes);
app.use('/api/professions', professionsRoutes);
app.use('/api/profession-categories', authenticate, professionCategoriesRoutes);

// Travel routes
app.use('/api/travel', authenticate, travelRoutes);
app.use('/api/travel', authenticate, travelCostRoutes);

// Address routes - con ricalcolo automatico distanze
app.use('/api/address', authenticate, addressRoutes);
logger.info('📍 Address routes registered at /api/address (with auto-recalculation)');

// Intervention Report routes
app.use('/api/intervention-reports', authenticate, interventionReportConfigRoutes);
app.use('/api/intervention-reports/templates', authenticate, interventionReportTemplateRoutes);
app.use('/api/intervention-reports/materials', authenticate, interventionReportMaterialRoutes);
app.use('/api/intervention-reports/professional', authenticate, interventionReportProfessionalRoutes);
app.use('/api/intervention-reports', authenticate, interventionReportRoutes);

// Chat routes
app.use('/api/chat', authenticate, chatRoutes);

// AI & Maps routes
app.use('/api/ai', authenticate, aiRoutes);

// Maps routes - Gestione autenticazione interna per endpoint specifici
app.use('/api/maps', mapsRoutes); // Gestisce autenticazione internamente
app.use('/api/geocode', authenticate, geocodingRoutes);

// Location tracking routes - NUOVO - Tracking live professionista
app.use('/api/location', authenticate, locationRoutes);
logger.info('📍 Location tracking routes registered at /api/location');

// API Keys route - accessibile senza percorso admin per il frontend
app.use('/api/apikeys', authenticate, apiKeysRoutes);
logger.info('🔑 API Keys routes registered at /api/apikeys');

// Security routes - RIATTIVATO
app.use('/api/security', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), securityRoutes);
logger.info('🔒 Security routes registered at /api/security');

// Admin routes
app.use('/api/admin/users', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), adminUsersRoutes);
app.use('/api/admin/modules', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), adminModulesRoutes); // NUOVO - Sistema moduli
logger.info('🧩 Admin modules routes registered at /api/admin/modules');
app.use('/api/admin/api-keys', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), adminApiKeysRoutes); // FIX: Usa le route corrette
app.use('/api/admin/email-templates', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), emailTemplatesRoutes);
app.use('/api/admin/system-enums', authenticate, requireRole(['SUPER_ADMIN']), systemEnumRoutes);

// ADMIN SCRIPTS ROUTE - IMPORTANTE!
app.use('/api/admin/scripts', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), adminScriptsRoutes);
logger.info('🛠️ Admin scripts routes registered at /api/admin/scripts');

// SCRIPT CONFIGURATION ROUTE
app.use('/api/admin', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), scriptConfigRoutes);
logger.info('⚙️ Script configuration routes registered at /api/admin/script-configs');

// ADMIN SYSTEM SETTINGS ROUTE - IMPORTANTE!
app.use('/api/admin/system-settings', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), adminSystemSettingsRoutes);
logger.info('⚙️ Admin system settings routes registered at /api/admin/system-settings');

// UPLOAD ROUTES - Per immagini e file
app.use('/api/admin/upload', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), uploadRoutes);
logger.info('📤 Upload routes registered at /api/admin/upload');

app.use('/api/admin', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), adminRoutes);
app.use('/api/kb-documents', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), kbDocumentsRoutes);

// System routes - SEMPRE REGISTRATE
app.use('/api/audit', authenticate, auditRoutes);
app.use('/api/admin/health-check', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), healthCheckRoutes);
app.use('/api/cleanup', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), cleanupConfigRoutes);
app.use('/api/scheduled-interventions', authenticate, scheduledInterventionsRoutes);
app.use('/api/backup', authenticate, simpleBackupRoutes);
logger.info('✅ System routes registered: audit, health-check, cleanup, scheduled-interventions, backup');

// Client AI Settings routes
import clientAiSettingsRoutes from './routes/client-ai-settings.routes';
app.use('/api/client-settings', clientAiSettingsRoutes);

// Calendar routes - IMPORTANTE!
app.use('/api/calendar', authenticate, calendarRoutes); // Route base calendario
app.use('/api/calendar-simple', authenticate, calendarSimpleRoutes); // Route semplificata per test
app.use('/api/interventions', authenticate, calendarRoutes); // Alias per compatibilità frontend
app.use('/api/calendar/google', authenticate, calendarGoogleRoutes); // Route Google Calendar
logger.info('📅 Calendar routes registered at /api/calendar, /api/calendar-simple and /api/interventions');
logger.info('📅 Google Calendar routes registered at /api/calendar/google');

// Legal Documents routes
import legalDocumentRoutes from './routes/admin/legal-documents.routes';
import documentTemplatesRoutes from './routes/admin/document-templates.routes';

app.use('/api/admin/legal-documents', authenticate, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), legalDocumentRoutes);
app.use('/api/admin/document-templates', authenticate, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), documentTemplatesRoutes);
app.use('/api/admin/document-types', authenticate, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), documentTypesRoutes);
app.use('/api/admin/document-config', authenticate, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), documentConfigRoutes);
app.use('/api/admin/document-categories', authenticate, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), documentCategoriesRoutes);
app.use('/api/admin/document-fields', authenticate, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), documentFieldsRoutes);
app.use('/api/admin/approval-workflows', authenticate, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), approvalWorkflowsRoutes);
app.use('/api/admin/document-permissions', authenticate, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), documentPermissionsRoutes);
app.use('/api/admin/document-notifications', authenticate, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), documentNotificationsRoutes);
app.use('/api/admin/document-ui-configs', authenticate, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), documentUIConfigsRoutes);
app.use('/api/legal', legalRoutes);
logger.info('📜 Legal Documents routes registered');
logger.info('⚙️ Document Management routes registered');

// WhatsApp e Knowledge Base routes

// app.use('/api/professional/whatsapp', authenticate, professionalWhatsappRoutes); // RIMOSSO - Migration a solo WPPConnect
app.use('/api/whatsapp/webhook', whatsappWebhookRoutes); // Webhook senza auth
app.use('/api/whatsapp', whatsappRoutes); // Usa la versione senza crittografia
app.use('/api/whatsapp', authenticate, whatsappContactsRoutes); // NUOVO - Gestione contatti WhatsApp
app.use('/api/admin/whatsapp', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), whatsappConfigRoutes);
// DISABILITATO - Sistema articoli KB mai completato (usa /api/knowledge-base invece)
// app.use('/api/kb', knowledgebaseRoutes);
app.use('/api/knowledge-base', authenticate, knowledgeBaseRoutes); // NUOVA ROUTE AGGIUNTA
logger.info('📱 WhatsApp routes registered at /api/whatsapp');
logger.info('👥 WhatsApp Contacts routes registered at /api/whatsapp/contacts');
// logger.info('🤖 Professional WhatsApp AI routes registered at /api/professional/whatsapp'); // RIMOSSO - Migration a solo WPPConnect
logger.info('📚 Knowledge Base routes registered at /api/kb and /api/knowledge-base');

// Attachment routes (senza prefisso /api)
app.use('/api', attachmentRoutes);

// Test routes (solo in development)
app.use('/api/test', testRoutes);
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/debug', debugRoutes);
}

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json(
    ResponseFormatter.error(
      `Cannot ${req.method} ${req.path}`,
      'NOT_FOUND'
    )
  );
});

// Start server
const PORT = process.env.PORT || 3200;

httpServer.listen(PORT, () => {
  console.log('\n===========================================');
  console.log('🚀 RICHIESTA ASSISTENZA BACKEND STARTED');
  console.log('===========================================');
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🔗 Frontend: http://localhost:5193`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 WebSocket test: http://localhost:${PORT}/ws-test`);
  console.log('');
  console.log('📚 Main endpoints:');
  console.log(`   Auth: ${PORT}/api/auth`);
  console.log(`   Users: ${PORT}/api/users`);
  console.log(`   Dashboard: ${PORT}/api/dashboard`);
  console.log(`   Requests: ${PORT}/api/requests`);
  console.log(`   Quotes: ${PORT}/api/quotes`);
  console.log(`   Portfolio: ${PORT}/api/portfolio`);
  console.log(`   Referrals: ${PORT}/api/referrals`);
  console.log(`   Notifications: ${PORT}/api/notifications`);
  console.log(`   Professionals: ${PORT}/api/professionals`);
  console.log(`   Location Tracking: ${PORT}/api/location`);
  console.log(`   Admin: ${PORT}/api/admin`);
  console.log(`   Modules: ${PORT}/api/admin/modules`);
  console.log(`   Scripts: ${PORT}/api/admin/scripts`);
  console.log(`   Settings: ${PORT}/api/admin/system-settings`);
  console.log(`   Knowledge Base: ${PORT}/api/knowledge-base`);
  console.log('===========================================\n');
  
  logger.info(`🚀 Server fully operational on port ${PORT}`);
  logger.info(`📡 WebSocket server ready`);
  logger.info(`🔗 Accepting connections from frontend at http://localhost:5193`);
  
  // Inizializza Google Maps Service con Redis Cache (non blocca se fallisce)
  (async () => {
    try {
      const GoogleMapsService = require('./services/googleMaps.service').default;
      await GoogleMapsService.initialize();
      logger.info('🗺️ Google Maps Service inizializzato con cache Redis');
    } catch (error: any) {
      logger.warn('⚠️ Google Maps Service avviato senza Redis cache:', error);
    }
  })();
  
  // Inizializza WPPConnect direttamente (non blocca il server se fallisce)
  (async () => {
    try {
      const { wppConnectService } = require('./services/wppconnect.service');
      await wppConnectService.initialize();
      logger.info('📱 WPPConnect pronto - vai su /admin/whatsapp per il QR Code');
    } catch (error: any) {
      logger.warn('⚠️ WPPConnect non connesso - scansiona il QR dalla dashboard');
      // Non blocchiamo il server se WhatsApp fallisce
    }
  })();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server and connections');
  
  // Chiudi Google Maps Service
  try {
    const GoogleMapsService = require('./services/googleMaps.service').default;
    await GoogleMapsService.shutdown();
  } catch (error: any) {
    logger.debug('Google Maps shutdown error:', error);
  }
  
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server and connections');
  
  // Chiudi Google Maps Service
  try {
    const GoogleMapsService = require('./services/googleMaps.service').default;
    await GoogleMapsService.shutdown();
  } catch (error) {
    logger.debug('Google Maps shutdown error:', error);
  }
  
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export { app, httpServer, io };
