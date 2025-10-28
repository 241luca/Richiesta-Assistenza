import { Router } from 'express';
import { QueryController } from '../controllers/QueryController';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const controller = new QueryController();

// POST /api/ingest - Ingest document into system
router.post('/ingest', asyncHandler(controller.ingest.bind(controller)));

// POST /api/query - Query documents with RAG
router.post('/query', asyncHandler(controller.query.bind(controller)));

// POST /api/classify - Classify document
router.post('/classify', asyncHandler(controller.classify.bind(controller)));

// POST /api/extract - Extract structured data
router.post('/extract', asyncHandler(controller.extract.bind(controller)));

export default router;
