import { Router } from 'express';
import { ContainerController } from '../controllers/ContainerController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const controller = new ContainerController();

// GET /api/containers - List all containers
router.get('/', asyncHandler(controller.list.bind(controller)));

// POST /api/containers - Create new container
router.post('/', asyncHandler(controller.create.bind(controller)));

// GET /api/containers/:id - Get container by ID
router.get('/:id', asyncHandler(controller.getById.bind(controller)));

// PUT /api/containers/:id - Update container
router.put('/:id', asyncHandler(controller.update.bind(controller)));

// DELETE /api/containers/:id - Delete container
router.delete('/:id', asyncHandler(controller.delete.bind(controller)));

// GET /api/containers/:id/stats - Get container statistics
router.get('/:id/stats', asyncHandler(controller.getStats.bind(controller)));

// DELETE /api/containers/:id/documents - Clear all documents from container
router.delete('/:id/documents', asyncHandler(controller.clearDocuments.bind(controller)));

export default router;
