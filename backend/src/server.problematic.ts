import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import debugRoutes from './routes/debug.routes';
import userSubcategoriesRoutes from './routes/user-subcategories.routes';
import requestRoutes from './routes/request.routes';
import { quoteRoutes } from './routes/quote.routes';
import paymentRoutes from './routes/payment.routes';
import notificationRoutes from './routes/notification.routes';
import notificationAdminRoutes from './routes/notificationAdmin.routes';
import notificationTemplateRoutes from './routes/notificationTemplate.routes';
import adminRoutes from './routes/admin.routes';
import categoryRoutes from './routes/category.routes';
import subcategoryRoutes from './routes/subcategory.routes';
import testRoutes from './routes/test.routes';
import attachmentRoutes from './routes/attachment.routes';
import geocodingRoutes from './routes/geocoding.routes';
import apiKeysRoutes from './routes/apiKeys.routes';
import mapsRoutes from './routes/maps.routes';
import aiRoutes from './routes/ai-professional.routes';
import adminSystemEnumsRoutes from './routes/systemEnum.routes';
import adminSystemSettingsRoutes from './routes/systemSettings.routes';
import kbDocumentsRoutes from './routes/kb-documents.routes';
import adminUsersRoutes from './routes/admin-users.routes';
import professionalRoutes from './routes/professional.routes';
import professionalPricingRoutes from './routes/professionalPricing.routes';
import professionsRoutes from './routes/professions.routes';
import professionalSkillsCertRoutes from './routes/professionalSkillsCertifications.routes';

// NUOVO SISTEMA RAPPORTI INTERVENTO
import interventionReportConfigRoutes from './routes/intervention-report-config.routes';
import interventionReportTemplateRoutes from './routes/intervention-report-template.routes';
import interventionReportRoutes from './routes/intervention-report.routes';
import interventionReportMaterialRoutes from './routes/intervention-report-material.routes';
import interventionReportProfessionalRoutes from './routes/intervention-report-professional.routes';

// NEW: Import new admin routes for system configuration
import publicRoutes from './routes/public.routes';

// Travel routes
import travelRoutes from './routes/travel.routes';
import travelCostRoutes from './routes/travelCostRoutes';

// Chat routes
import { chatRoutes } from './routes/chat.routes';

// Script Manager routes
import shellScriptsRoutes from './routes/admin/shell-scripts-simple.routes';

// SISTEMA AUDIT LOG
import auditRoutes from './routes/audit.routes';
import { auditLogger, auditAuth } from './middleware/auditLogger';

// SISTEMA HEALTH CHECK
import adminHealthCheckRoutes from './routes/admin/health-check.routes';

// SISTEMA SETTINGS
import systemSettingsRoutes from './routes/admin/system-settings.routes';

// SISTEMA CLEANUP CONFIG
import cleanupConfigRoutes from './routes/cleanup-config.routes';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/auth';
import { requireRole } from './middleware/rbac';
import { requestIdMiddleware } from './middleware/requestId';

// Import ResponseFormatter for 404 handler
import { ResponseFormatter } from './utils/responseFormatter';

// Import services
import { initializeWebSocket } from './services/websocket.service';
import { notificationService } from './services/notification.service';
import { setIO } from './utils/socket';
import { logger } from './utils/logger';

// Import delle route che esistono
import simpleBackupRoutes from './routes/simple-backup.routes';
import testRequestIdRoutes from './routes/test-request-id.routes';
import testPrismaRoutes from './routes/test-prisma.routes';
import healthRoutes from './routes/health.routes';
import scheduledInterventionsRoutes from './routes/scheduledInterventions';

// Create Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.io with CORS for frontend port 5193
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

// CORS configuration for frontend port 5193
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5193',
      'http://127.0.0.1:5193',
      'http://localhost:5173', // Vite default
      'http://127.0.0.1:5173'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
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

// Handle OPTIONS preflight requests explicitly
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:5193');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(204);
});

// Security middleware DOPO CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));

// Request ID middleware
app.use(requestIdMiddleware);

// AUDIT LOG MIDDLEWARE - Registra TUTTE le operazioni API
app.use('/api', (req, res, next) => {
  // Skip per endpoint che non necessitano logging dettagliato
  if (req.path.startsWith('/health') || 
      req.path.startsWith('/public') ||
      req.path.includes('/ws-test')) {
    return next();
  }
  
  // Applica audit logging globale
  return auditLogger({
    captureBody: req.method !== 'GET',
    category: 'API' as any
  })(req, res, next);
});

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});

// Static files (for uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (_, res) => {
  res.json({ 
    status: 'ok', 
    port: process.env.PORT || 3200,
    environment: process.env.NODE_ENV,
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
      <div id="messages"></div>
      <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
      <script>
        const socket = io('http://localhost:3200', {
          transports: ['websocket', 'polling'],
          auth: {
            token: 'test-token'
          }
        });
        
        socket.on('connect', () => {
          document.getElementById('status').innerHTML = 'Connected: ' + socket.id;
          console.log('Connected:', socket.id);
        });
        
        socket.on('disconnect', () => {
          document.getElementById('status').innerHTML = 'Disconnected';
          console.log('Disconnected');
        });
        
        socket.on('error', (error) => {
          console.error('Socket error:', error);
          document.getElementById('messages').innerHTML += '<p>Error: ' + error.message + '</p>';
        });
        
        socket.on('connected', (data) => {
          console.log('Authenticated:', data);
          document.getElementById('messages').innerHTML += '<p>Authenticated as user: ' + data.userId + '</p>';
        });
      </script>
    </body>
    </html>
  `);
});

// API ROUTES

// Public API routes (no authentication required)
app.use('/api/public', publicRoutes);

// Health check routes (public, no auth needed)
app.use('/api/health', healthRoutes);
logger.info('Health check routes enabled at /api/health');

// Authentication routes with rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', authenticate, userRoutes);
app.use('/api/user', authenticate, userSubcategoriesRoutes);
app.use('/api/requests', authenticate, requestRoutes);
app.use('/api/quotes', authenticate, quoteRoutes);
app.use('/api/payments', authenticate, paymentRoutes);
app.use('/api/notifications', authenticate, notificationRoutes);
app.use('/api/notifications', authenticate, notificationAdminRoutes);
app.use('/api/notification-templates', authenticate, notificationTemplateRoutes);
app.use('/api/categories', authenticate, categoryRoutes);
app.use('/api/subcategories', authenticate, subcategoryRoutes);

// NUOVO SISTEMA RAPPORTI INTERVENTO
app.use('/api/intervention-reports', authenticate, interventionReportConfigRoutes);
app.use('/api/intervention-reports/templates', authenticate, interventionReportTemplateRoutes);
app.use('/api/intervention-reports/materials', authenticate, interventionReportMaterialRoutes);
app.use('/api/intervention-reports/professional', authenticate, interventionReportProfessionalRoutes);
app.use('/api/intervention-reports', authenticate, interventionReportRoutes);

// Travel routes per professionisti
app.use('/api/travel', authenticate, travelRoutes);
app.use('/api/travel', authenticate, travelCostRoutes);

// Scheduled Interventions
app.use('/api/scheduled-interventions', authenticate, scheduledInterventionsRoutes);
logger.info('Scheduled interventions routes registered at /api/scheduled-interventions');

// Backup routes
app.use('/api/backup', authenticate, simpleBackupRoutes);

// Chat routes
app.use('/api/chat', authenticate, chatRoutes);

// System configuration routes (SUPER_ADMIN only)
app.use('/api/admin/system-enums', authenticate, requireRole(['SUPER_ADMIN']), adminSystemEnumsRoutes);
app.use('/api/admin/system-settings', systemSettingsRoutes);

// Admin users management routes
app.use('/api/admin/users', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), adminUsersRoutes);

// SISTEMA AUDIT LOG
app.use('/api/audit', authenticate, auditRoutes);
logger.info('Audit log system enabled at /api/audit');

// SISTEMA HEALTH CHECK
app.use('/api/admin/health-check', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), adminHealthCheckRoutes);
logger.info('Health check system enabled at /api/admin/health-check');

// SISTEMA CLEANUP CONFIG
app.use('/api/cleanup', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), cleanupConfigRoutes);
logger.info('Cleanup configuration system enabled at /api/cleanup');

// Existing admin routes
app.use('/api/admin/api-keys', authenticate, requireRole(['SUPER_ADMIN']), apiKeysRoutes);
app.use('/api/admin/scripts', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), shellScriptsRoutes);
app.use('/api/admin', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), adminRoutes);
app.use('/api/maps', authenticate, mapsRoutes);
app.use('/api/geocode', authenticate, geocodingRoutes);
app.use('/api', attachmentRoutes);
app.use('/api/test', testRoutes);

// Debug routes (only in development - NO AUTHENTICATION)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/debug', debugRoutes);
  
  // Test Request ID tracking
  app.use('/api/test', testRequestIdRoutes);
  logger.info('Test Request ID routes enabled at /api/test/request-id/*');
  
  // Test Prisma models
  app.use('/api/test-prisma', testPrismaRoutes);
  logger.info('Test Prisma routes enabled at /api/test-prisma/*');
}

// Knowledge Base Documents routes
app.use('/api/kb-documents', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), kbDocumentsRoutes);

// Professionals AI Settings routes
app.use('/api/professionals', authenticate, professionalRoutes);
app.use('/api/professionals', authenticate, professionalPricingRoutes);
app.use('/api/professions', professionsRoutes);
app.use('/api/professionals', authenticate, professionalSkillsCertRoutes);

// AI Routes
app.use('/api/ai', authenticate, aiRoutes);

// Error handling middleware (must be last)
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

// Export for testing
export { app, httpServer };

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  // Start server on port 3200
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
    console.log(`⚙️  System Config: http://localhost:${PORT}/api/admin/system-enums`);
    console.log(`🔧 Public Settings: http://localhost:${PORT}/api/public/settings`);
    console.log(`🚛 Travel API: http://localhost:${PORT}/api/travel/*`);
    console.log(`📋 User Subcategories: http://localhost:${PORT}/api/user/subcategories`);
    console.log(`🔔 Notification Templates: http://localhost:${PORT}/api/notification-templates/*`);
    console.log(`📝 Rapporti Intervento: http://localhost:${PORT}/api/intervention-reports/*`);
    console.log('===========================================\n');
    
    // Also log to file
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📡 WebSocket server ready on port ${PORT}`);
    logger.info(`🔗 Accepting connections from frontend at http://localhost:5193`);
    logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
    logger.info(`🚛 Travel API endpoints registered`);
    logger.info(`📋 User subcategories endpoints registered`);
    logger.info(`🔔 Notification template system registered`);
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
}

export { io };