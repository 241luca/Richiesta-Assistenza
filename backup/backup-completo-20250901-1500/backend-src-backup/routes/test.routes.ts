import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import testController from '../controllers/TestController';

const router = Router();

/**
 * @route GET /api/tests/health
 * @desc Get system health status (public)
 * @access Public
 */
router.get('/health', testController.getSystemHealth);

/**
 * @route POST /api/tests/run
 * @desc Run all system tests
 * @access Admin only
 */
router.post(
  '/run',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  testController.runAllTests
);

/**
 * @route POST /api/tests/run/:category
 * @desc Run tests for a specific category
 * @access Admin only
 */
router.post(
  '/run/:category',
  authenticate,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  testController.runCategoryTests
);

export default router;
