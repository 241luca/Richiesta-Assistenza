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
import { errorHandler } from './middleware/errorHandler';
import { requestIdMiddleware } from './middleware/requestId';

// Create Express app
const app = express();
const httpServer = createServer(app);

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
  origin: function (origin, callback) {
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
app.get('/health', (_, res) => {
  res.json({ 
    status: 'ok', 
    port: process.env.PORT || 3200,
    websocket: 'ready',
    timestamp: new Date().toISOString() 
  });
});

// WebSocket test endpoint
app.get('/ws-test', (_, res) => {
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
import professionalRegistrationRoutes from './routes/professional-registration.routes';
import userRoutes from './routes/user.routes';
import professionalDetailsRoutes from './routes/professional-details.routes';
import professionalAISettingsRoutes from './routes/professional-ai-settings.routes';
import categoryRoutes from './routes/category.routes';
import subcategoryRoutes from './routes/subcategory.routes';
import publicRoutes from './routes/public.routes';
import debugRoutes from './routes/debug.routes';
import testRoutes from './routes/test.routes';
import whatsappMainRoutes from './routes/whatsapp-main.routes';
import whatsappConfigRoutes from './routes/admin/whatsapp-config.routes';
import knowledgebaseRoutes from './routes/knowledgebase.routes';
import knowledgeBaseRoutes from './routes/knowledge-base.routes'; // NUOVO IMPORT

// Dashboard routes - IMPORTANTE!
import userDashboardRoutes from './routes/dashboard/user-dashboard.routes';

// Request Management routes
import requestRoutes from './routes/request.routes';
import { quoteRoutes } from './routes/quote.routes';
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

// Admin routes
import adminRoutes from './routes/admin.routes';
import adminUsersRoutes from './routes/admin-users.routes';
import apiKeysRoutes from './routes/apiKeys.routes';
import emailTemplatesRoutes from './routes/emailTemplates.routes';
import kbDocumentsRoutes from './routes/kb-documents.routes';

// WhatsApp routes 
import professionalWhatsappRoutes from './routes/professional-whatsapp.routes';
import systemEnumRoutes from './routes/systemEnum.routes';

// Admin Scripts routes - IMPORTANTE!
import adminScriptsRoutes from './routes/admin/shell-scripts-simple.routes';
import scriptConfigRoutes from './routes/admin/scriptConfig.routes';

// Admin System Settings routes - IMPORTANTE!
import adminSystemSettingsRoutes from './routes/admin/system-settings.routes';

// Payment routes
import paymentRoutes from './routes/payment.routes';

// Upload routes
import uploadRoutes from './routes/upload.routes';

// Chat routes
import { chatRoutes } from './routes/chat.routes';

// System routes (con try-catch per route problematiche)
let auditRoutes: any;
let healthCheckRoutes: any;
let cleanupConfigRoutes: any;
let scheduledInterventionsRoutes: any;
let simpleBackupRoutes: any;

try {
  auditRoutes = require('./routes/audit.routes').default;
  logger.info('✅ Audit routes loaded');
} catch (error) {
  logger.warn('⚠️ Audit routes not loaded:', error);
}

try {
  healthCheckRoutes = require('./routes/admin/health-check.routes').default;
  logger.info('✅ Health check routes loaded');
} catch (error) {
  logger.warn('⚠️ Health check routes not loaded:', error);
}

try {
  cleanupConfigRoutes = require('./routes/cleanup-config.routes').default;
  logger.info('✅ Cleanup config routes loaded');
} catch (error) {
  logger.warn('⚠️ Cleanup config routes not loaded:', error);
}

try {
  scheduledInterventionsRoutes = require('./routes/scheduledInterventions').default;
  logger.info('✅ Scheduled interventions routes loaded');
} catch (error) {
  logger.warn('⚠️ Scheduled interventions routes not loaded:', error);
}

try {
  simpleBackupRoutes = require('./routes/simple-backup.routes').default;
  logger.info('✅ Simple backup routes loaded');
} catch (error) {
  logger.warn('⚠️ Simple backup routes not loaded:', error);
}

// ===== REGISTER ALL ROUTES =====

// Public routes (no auth)
import publicSystemSettingsRoutes from './routes/public/system-settings.routes';
app.use('/api/public', publicRoutes);
app.use('/api/public/system-settings', publicSystemSettingsRoutes);

// Auth routes with rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/auth', authLimiter, professionalRegistrationRoutes);

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
app.use('/api/payments', authenticate, paymentRoutes);

// Notification routes - ORDINE IMPORTANTE: specific prima di generic
app.use('/api/notification-templates', authenticate, notificationTemplateRoutes);
app.use('/api/notifications', authenticate, notificationAdminRoutes); // Admin routes sono già protette internamente
app.use('/api/notifications', authenticate, notificationRoutes);

// Professional routes
app.use('/api/professionals', authenticate, professionalRoutes);
app.use('/api/professionals', authenticate, professionalsRoutes); // NUOVO - endpoint by-subcategory
app.use('/api/professionals', authenticate, professionalPricingRoutes);
app.use('/api/professionals', authenticate, professionalSkillsCertRoutes);
app.use('/api/professionals', authenticate, professionalAISettingsRoutes);
app.use('/api/professions', professionsRoutes);
app.use('/api/profession-categories', authenticate, professionCategoriesRoutes);

// Travel routes
app.use('/api/travel', authenticate, travelRoutes);
app.use('/api/travel', authenticate, travelCostRoutes);

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
app.use('/api/maps', authenticate, mapsRoutes);
app.use('/api/geocode', authenticate, geocodingRoutes);

// Admin routes
app.use('/api/admin/users', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), adminUsersRoutes);
app.use('/api/admin/api-keys', authenticate, requireRole(['SUPER_ADMIN']), apiKeysRoutes);
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

// System routes (solo se caricate)
if (auditRoutes) {
  app.use('/api/audit', authenticate, auditRoutes);
}
if (healthCheckRoutes) {
  app.use('/api/admin/health-check', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), healthCheckRoutes);
}
if (cleanupConfigRoutes) {
  app.use('/api/cleanup', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), cleanupConfigRoutes);
}
if (scheduledInterventionsRoutes) {
  app.use('/api/scheduled-interventions', authenticate, scheduledInterventionsRoutes);
}
if (simpleBackupRoutes) {
  app.use('/api/backup', authenticate, simpleBackupRoutes);
}

// Professional AI Settings routes
import professionalAiSettingsRoutes from './routes/professional-ai-settings.routes';
import clientAiSettingsRoutes from './routes/client-ai-settings.routes';
app.use('/api/professionals', professionalAiSettingsRoutes);
app.use('/api/client-settings', clientAiSettingsRoutes);

// WhatsApp e Knowledge Base routes
import professionalWhatsappRoutes from './routes/professional-whatsapp.routes';

app.use('/api/professional/whatsapp', authenticate, professionalWhatsappRoutes);
app.use('/api/whatsapp', whatsappMainRoutes);
app.use('/api/admin/whatsapp', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), whatsappConfigRoutes);
app.use('/api/kb', knowledgebaseRoutes);
app.use('/api/knowledge-base', authenticate, knowledgeBaseRoutes); // NUOVA ROUTE AGGIUNTA
logger.info('📱 WhatsApp routes registered at /api/whatsapp');
logger.info('🤖 Professional WhatsApp AI routes registered at /api/professional/whatsapp');
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
app.use((req, res) => {
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
  console.log(`   Notifications: ${PORT}/api/notifications`);
  console.log(`   Professionals: ${PORT}/api/professionals`);
  console.log(`   Admin: ${PORT}/api/admin`);
  console.log(`   Scripts: ${PORT}/api/admin/scripts`);
  console.log(`   Settings: ${PORT}/api/admin/system-settings`);
  console.log(`   Knowledge Base: ${PORT}/api/knowledge-base`);
  console.log('===========================================\n');
  
  logger.info(`🚀 Server fully operational on port ${PORT}`);
  logger.info(`📡 WebSocket server ready`);
  logger.info(`🔗 Accepting connections from frontend at http://localhost:5193`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export { app, httpServer, io };// Adding route manually at line 250
app.use('/api/professional-details', professionalDetailsRoutes);
