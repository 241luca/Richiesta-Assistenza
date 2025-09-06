import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { prisma } from './config/database';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Basic middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5193',
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (_, res) => {
  res.json({ 
    status: 'ok', 
    port: process.env.PORT || 3200,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString() 
  });
});

// API Health endpoint
app.get('/api/health', (_, res) => {
  res.json({ 
    status: 'ok',
    api: 'Sistema Richiesta Assistenza',
    version: '1.0.0',
    timestamp: new Date().toISOString() 
  });
});

// Test database connection
app.get('/api/test-db', async (_, res) => {
  try {
    const count = await prisma.user.count();
    res.json({ 
      status: 'ok',
      database: 'connected',
      users: count
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Import auth routes only for now
import authRoutes from './routes/auth.routes';
app.use('/api/auth', authRoutes);

// Error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  logger.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    timestamp: new Date().toISOString()
  });
});

// Start server on port 3200
const PORT = process.env.PORT || 3200;

app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`🔗 Accepting connections from frontend at http://localhost:5193`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/health`);
  logger.info(`🗄️ Database: SQLite (dev.db)`);
  
  console.log(`
  ========================================
  🚀 SISTEMA RICHIESTA ASSISTENZA - BACKEND
  ========================================
  
  Server attivo su: http://localhost:${PORT}
  Frontend atteso: http://localhost:5193
  
  Endpoints disponibili:
  - GET  /health           - Health check
  - GET  /api/health       - API status
  - GET  /api/test-db      - Test database
  - POST /api/auth/login   - Login
  - POST /api/auth/register - Registrazione
  
  ========================================
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});
