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
import userSubcategoriesRoutes from './routes/user-subcategories.routes'; // NUOVO
import requestRoutes from './routes/request.routes';
import { quoteRoutes } from './routes/quote.routes';
import paymentRoutes from './routes/payment.routes';
import notificationRoutes from './routes/notification.routes';
import notificationTemplateRoutes from './routes/notificationTemplate.routes'; // NUOVO SISTEMA NOTIFICHE
import adminRoutes from './routes/admin.routes';
import categoryRoutes from './routes/category.routes';
import subcategoryRoutes from './routes/subcategory.routes';
import testRoutes from './routes/test.routes';
import attachmentRoutes from './routes/attachment.routes';
import geocodingRoutes from './routes/geocoding.routes';
import apiKeysRoutes from './routes/apiKeys.routes';
import mapsRoutes from './routes/maps.routes';
import adminTestRoutes from './routes/admin/tests';
import adminDashboardRoutes from './routes/admin/dashboard.routes';
import userDashboardRoutes from './routes/dashboard/user-dashboard.routes';
import aiRoutes from './routes/ai-professional.routes';
import adminSystemEnumsRoutes from './routes/systemEnum.routes';
import adminSystemSettingsRoutes from './routes/systemSettings.routes';
import kbDocumentsRoutes from './routes/kb-documents.routes';
import professionalsRoutes from './routes/professionals.routes';

// NEW: Import new admin routes for system configuration
import publicRoutes from './routes/public.routes';

// NUOVA FUNZIONALITÀ: Import travel routes
import travelRoutes from './routes/travel.routes';

// NUOVA FUNZIONALITÀ: Import chat routes
import { chatRoutes } from './routes/chat.routes';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/auth';
import { requireRole } from './middleware/rbac';

// Import services
import { initializeWebSocket } from './services/websocket.service';
import { notificationService } from './services/notification.service';
import { setIO } from './utils/socket';
import { logger } from './utils/logger';

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

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "http://localhost:5193", "ws://localhost:3200", "wss://localhost:3200"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    }
  }
}));

// CORS configuration for frontend port 5193
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5193',
      'http://127.0.0.1:5193'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

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

// Apply rate limiting to API routes (disabilitato temporaneamente per test)
// app.use('/api', limiter);

// Strict rate limiting for auth endpoints (temporaneamente aumentato per test)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // Aumentato temporaneamente da 5 a 50 per test
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
            token: 'test-token' // Replace with actual JWT token
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

// Public API routes (no authentication required)
app.use('/api/public', publicRoutes);

// API Routes
// TEMPORANEAMENTE DISABILITATO IL RATE LIMITING PER TEST
// app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/auth', authRoutes);  // Rate limiting disabilitato temporaneamente
app.use('/api/users', authenticate, userRoutes);
app.use('/api/user', authenticate, userSubcategoriesRoutes); // NUOVO - Gestione sottocategorie professionista
app.use('/api/requests', authenticate, requestRoutes);
app.use('/api/quotes', authenticate, quoteRoutes);
app.use('/api/payments', authenticate, paymentRoutes);
app.use('/api/notifications', authenticate, notificationRoutes);
app.use('/api/notification-templates', authenticate, notificationTemplateRoutes); // NUOVO SISTEMA NOTIFICHE PROFESSIONALE
app.use('/api/categories', authenticate, categoryRoutes);
app.use('/api/subcategories', authenticate, subcategoryRoutes);

// NUOVA FUNZIONALITÀ: Travel routes per professionisti
app.use('/api/travel', authenticate, travelRoutes);

// NUOVA FUNZIONALITÀ: Chat routes per le richieste
app.use('/api/chat', authenticate, chatRoutes);

// Admin test routes - CON AUTENTICAZIONE
app.use('/api/admin/tests', adminTestRoutes); 

// Admin dashboard routes
app.use('/api/admin/dashboard', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), adminDashboardRoutes);

// User dashboard routes (for clients and professionals)
app.use('/api/dashboard', authenticate, userDashboardRoutes);

// NEW: System configuration routes (SUPER_ADMIN only)
app.use('/api/admin/system-enums', authenticate, requireRole(['SUPER_ADMIN']), adminSystemEnumsRoutes);
app.use('/api/admin/system-settings', authenticate, requireRole(['SUPER_ADMIN']), adminSystemSettingsRoutes);

// Existing admin routes
app.use('/api/admin/api-keys', authenticate, requireRole(['SUPER_ADMIN']), apiKeysRoutes);
app.use('/api/admin', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), adminRoutes);
app.use('/api/maps', authenticate, mapsRoutes);
app.use('/api/geocode', authenticate, geocodingRoutes);
app.use('/api', attachmentRoutes);
app.use('/api/test', testRoutes);

// Knowledge Base Documents routes
app.use('/api/kb-documents', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), kbDocumentsRoutes);

// Professionals AI Settings routes
app.use('/api/professionals', authenticate, professionalsRoutes);

// AI Routes
app.use('/api/ai', authenticate, aiRoutes);

// WebSocket initialization
initializeWebSocket(io);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    timestamp: new Date().toISOString()
  });
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
  // Application specific logging, throwing an error, or other logic here
  });
}

export { io };

// Forced reload - Response Formatter fix applied - Travel functionality added - User Subcategories added - Notification Templates added
