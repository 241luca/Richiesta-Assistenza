// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { logger } from './utils/logger';
import { errorHandler } from './api/middleware/errorHandler';
import healthRoutes from './api/routes/health';
import containerRoutes from './api/routes/containers';
import documentsRoutes from './routes/documents.routes';
import chunksAndEmbeddingsRoutes from './routes/chunksAndEmbeddings.routes';
import queryRoutes from './api/routes/query';
import apiKeysRoutes from './api/routes/api-keys';
import containerCategoriesRoutes from './api/routes/container-categories';
import containerCategoryGroupsRoutes from './api/routes/container-category-groups';
import containerInstancesRoutes from './routes/containerInstances.routes';
import syncRoutes from './api/routes/sync';
import knowledgeGraphRoutes from './api/routes/knowledge-graph';
import patternsRoutes from './routes/patterns.routes'; // ✅ NEW: Hybrid Patterns
import advancedOCRRoutes from './routes/advancedOCR.routes'; // ✅ NEW: Advanced OCR (Docling + PaddleOCR)
import markdownRoutes from './routes/markdown.routes'; // ✅ NEW: Markdown Storage

const app: Application = express();
const PORT = process.env.PORT || 3500;

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security
app.use(helmet());

// CORS - Allow all origins for development
app.use(cors({
  origin: true, // Allow all origins
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Compression
app.use(compression());

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// ============================================================================
// ROUTES
// ============================================================================

app.use('/health', healthRoutes);
app.use('/api/containers', containerRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api', chunksAndEmbeddingsRoutes);
app.use('/api', queryRoutes);
app.use('/api/api-keys', apiKeysRoutes);
app.use('/api/container-categories', containerCategoriesRoutes);
app.use('/api/container-category-groups', containerCategoryGroupsRoutes);
app.use('/api/container-instances', containerInstancesRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/knowledge-graph', knowledgeGraphRoutes);
app.use('/api/patterns', patternsRoutes); // ✅ NEW: Hybrid Patterns
app.use('/api/ocr', advancedOCRRoutes); // ✅ NEW: Advanced OCR
app.use('/api/markdown', markdownRoutes); // ✅ NEW: Markdown Storage

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'SmartDocs API',
    version: '1.0.0 - Enterprise Edition',
    status: 'running',
    features: ['Semantic Chunking', 'Knowledge Graph', 'RAG', 'Hybrid Pattern Learning', 'Advanced OCR', 'Markdown-First Pipeline'],
    endpoints: {
      health: '/health',
      containers: '/api/containers',
      documents: '/api/documents',
      chunks: '/api/chunks/container/:containerId',
      embeddings: '/api/embeddings/container/:containerId',
      query: '/api/query',
      knowledgeGraph: '/api/knowledge-graph',
      sync: '/api/sync',
      patterns: '/api/patterns',
      ocr: '/api/ocr',
      markdown: '/api/markdown'
    }
  });
});

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error Handler
app.use(errorHandler);

// ============================================================================
// SERVER START
// ============================================================================

const server = app.listen(PORT, () => {
  logger.info(`🚀 SmartDocs API Server started on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
  logger.info(`📚 API docs: http://localhost:${PORT}/`);
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received. Closing server gracefully...`);
  server.close(() => {
    logger.info('Server closed. Exiting process.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
// reload

