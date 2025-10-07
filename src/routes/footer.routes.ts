import { Router } from 'express';
import { footerService } from '../services/footer.service';
import { ResponseFormatter } from '../utils/responseFormatter';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @route GET /api/footer/public
 * @desc Get public footer data (no auth required)
 * @access Public
 */
router.get('/public', async (req, res) => {
  try {
    const data = await footerService.getFooterData();
    res.json(ResponseFormatter.success(data, 'Footer data fetched successfully'));
  } catch (error: any) {
    res.status(500).json(ResponseFormatter.error(error.message || 'Failed to fetch footer data'));
  }
});

/**
 * @route GET /api/footer/sections
 * @desc Get all footer sections (admin only)
 * @access Private (Admin)
 */
router.get('/sections', authenticate, async (req, res) => {
  try {
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json(ResponseFormatter.error('Access denied'));
    }

    const data = await footerService.getFooterData();
    res.json(ResponseFormatter.success(data, 'Footer sections fetched successfully'));
  } catch (error: any) {
    res.status(500).json(ResponseFormatter.error(error.message || 'Failed to fetch footer sections'));
  }
});

/**
 * @route POST /api/footer/link
 * @desc Create new footer link (admin only)
 * @access Private (Admin)
 */
router.post('/link', authenticate, async (req, res) => {
  try {
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json(ResponseFormatter.error('Access denied'));
    }

    const link = await footerService.upsertLink(req.body);
    res.json(ResponseFormatter.success(link, 'Footer link created successfully'));
  } catch (error: any) {
    res.status(500).json(ResponseFormatter.error(error.message || 'Failed to create footer link'));
  }
});

/**
 * @route PUT /api/footer/link/:id
 * @desc Update footer link (admin only)
 * @access Private (Admin)
 */
router.put('/link/:id', authenticate, async (req, res) => {
  try {
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json(ResponseFormatter.error('Access denied'));
    }

    const link = await footerService.updateLink(req.params.id, req.body);
    res.json(ResponseFormatter.success(link, 'Footer link updated successfully'));
  } catch (error: any) {
    res.status(500).json(ResponseFormatter.error(error.message || 'Failed to update footer link'));
  }
});

/**
 * @route DELETE /api/footer/link/:id
 * @desc Delete footer link (admin only)
 * @access Private (Admin)
 */
router.delete('/link/:id', authenticate, async (req, res) => {
  try {
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json(ResponseFormatter.error('Access denied'));
    }

    await footerService.deleteLink(req.params.id);
    res.json(ResponseFormatter.success(null, 'Footer link deleted successfully'));
  } catch (error: any) {
    res.status(500).json(ResponseFormatter.error(error.message || 'Failed to delete footer link'));
  }
});

/**
 * @route POST /api/footer/section
 * @desc Create or update footer section (admin only)
 * @access Private (Admin)
 */
router.post('/section', authenticate, async (req, res) => {
  try {
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json(ResponseFormatter.error('Access denied'));
    }

    const section = await footerService.upsertSection(req.body);
    res.json(ResponseFormatter.success(section, 'Footer section saved successfully'));
  } catch (error: any) {
    res.status(500).json(ResponseFormatter.error(error.message || 'Failed to save footer section'));
  }
});

/**
 * @route POST /api/footer/initialize
 * @desc Initialize default footer data (admin only)
 * @access Private (Admin)
 */
router.post('/initialize', authenticate, async (req, res) => {
  try {
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json(ResponseFormatter.error('Access denied'));
    }

    await footerService.initializeDefaults();
    res.json(ResponseFormatter.success(null, 'Footer defaults initialized successfully'));
  } catch (error: any) {
    res.status(500).json(ResponseFormatter.error(error.message || 'Failed to initialize footer defaults'));
  }
});

export default router;
