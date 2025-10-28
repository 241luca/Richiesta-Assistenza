import { Router } from 'express';
import { DocumentController } from '../controllers/DocumentController';
import { asyncHandler } from '../middleware/errorHandler';
import multer from 'multer';

const router = Router();
const controller = new DocumentController();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// GET /api/documents - List documents
router.get('/', asyncHandler(controller.list.bind(controller)));

// POST /api/documents - Upload document
router.post(
  '/',
  upload.single('file'),
  asyncHandler(controller.upload.bind(controller))
);

// GET /api/documents/:id - Get document
router.get('/:id', asyncHandler(controller.getById.bind(controller)));

// DELETE /api/documents/:id - Delete document
router.delete('/:id', asyncHandler(controller.delete.bind(controller)));

// GET /api/documents/:id/download - Download document
router.get('/:id/download', asyncHandler(controller.download.bind(controller)));

// ✅ NEW: Advanced debugging routes
// GET /api/documents/:id/chunks - Get document chunks with metadata
router.get('/:id/chunks', asyncHandler(controller.getChunks.bind(controller)));

// GET /api/documents/:id/analysis - Get complete document analysis
router.get('/:id/analysis', asyncHandler(controller.getAnalysis.bind(controller)));

export default router;
