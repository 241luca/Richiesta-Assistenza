import { Router, Request, Response } from 'express';
import { smartDocsConfigService } from '../services/smartdocs-config.service';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/smartdocs/config
 * Get global sync configuration
 */
router.get('/config', async (req: Request, res: Response) => {
  try {
    const config = await smartDocsConfigService.getGlobalConfig();
    res.json({
      success: true,
      data: config
    });
  } catch (error: any) {
    logger.error('[SmartDocsConfig] GET /config failed', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * PUT /api/smartdocs/config
 * Update global sync configuration
 */
router.put('/config', async (req: Request, res: Response) => {
  try {
    const config = await smartDocsConfigService.updateGlobalConfig(req.body);
    res.json({
      success: true,
      data: config
    });
  } catch (error: any) {
    logger.error('[SmartDocsConfig] PUT /config failed', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/smartdocs/config/categories
 * Get all category exclusions
 */
router.get('/config/categories', async (req: Request, res: Response) => {
  try {
    const exclusions = await smartDocsConfigService.getCategoryExclusions();
    res.json({
      success: true,
      data: exclusions
    });
  } catch (error: any) {
    logger.error('[SmartDocsConfig] GET /config/categories failed', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/smartdocs/config/categories
 * Add category exclusion
 */
router.post('/config/categories', async (req: Request, res: Response) => {
  try {
    const exclusion = await smartDocsConfigService.addCategoryExclusion(req.body);
    res.json({
      success: true,
      data: exclusion
    });
  } catch (error: any) {
    logger.error('[SmartDocsConfig] POST /config/categories failed', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * DELETE /api/smartdocs/config/categories/:id
 * Remove category exclusion
 */
router.delete('/config/categories/:id', async (req: Request, res: Response) => {
  try {
    await smartDocsConfigService.removeCategoryExclusion(parseInt(req.params.id));
    res.json({
      success: true
    });
  } catch (error: any) {
    logger.error('[SmartDocsConfig] DELETE /config/categories/:id failed', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/smartdocs/config/users
 * Get all user overrides
 */
router.get('/config/users', async (req: Request, res: Response) => {
  try {
    const overrides = await smartDocsConfigService.getUserOverrides();
    res.json({
      success: true,
      data: overrides
    });
  } catch (error: any) {
    logger.error('[SmartDocsConfig] GET /config/users failed', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/smartdocs/config/users/:userId/:userType
 * Get user override
 */
router.get('/config/users/:userId/:userType', async (req: Request, res: Response) => {
  try {
    const override = await smartDocsConfigService.getUserOverride(
      parseInt(req.params.userId),
      req.params.userType as 'client' | 'professional'
    );
    res.json({
      success: true,
      data: override
    });
  } catch (error: any) {
    logger.error('[SmartDocsConfig] GET /config/users/:userId/:userType failed', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * PUT /api/smartdocs/config/users/:userId/:userType
 * Set user override
 */
router.put('/config/users/:userId/:userType', async (req: Request, res: Response) => {
  try {
    const override = await smartDocsConfigService.setUserOverride({
      user_id: parseInt(req.params.userId),
      user_type: req.params.userType as 'client' | 'professional',
      ...req.body
    });
    res.json({
      success: true,
      data: override
    });
  } catch (error: any) {
    logger.error('[SmartDocsConfig] PUT /config/users/:userId/:userType failed', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * DELETE /api/smartdocs/config/users/:userId/:userType
 * Delete user override
 */
router.delete('/config/users/:userId/:userType', async (req: Request, res: Response) => {
  try {
    await smartDocsConfigService.deleteUserOverride(
      parseInt(req.params.userId),
      req.params.userType as 'client' | 'professional'
    );
    res.json({
      success: true
    });
  } catch (error: any) {
    logger.error('[SmartDocsConfig] DELETE /config/users/:userId/:userType failed', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/smartdocs/config/entities
 * Get entity exclusions
 */
router.get('/config/entities', async (req: Request, res: Response) => {
  try {
    const exclusions = await smartDocsConfigService.getEntityExclusions(
      req.query.type as string
    );
    res.json({
      success: true,
      data: exclusions
    });
  } catch (error: any) {
    logger.error('[SmartDocsConfig] GET /config/entities failed', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/smartdocs/config/entities
 * Add entity exclusion
 */
router.post('/config/entities', async (req: Request, res: Response) => {
  try {
    const exclusion = await smartDocsConfigService.addEntityExclusion(req.body);
    res.json({
      success: true,
      data: exclusion
    });
  } catch (error: any) {
    logger.error('[SmartDocsConfig] POST /config/entities failed', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * DELETE /api/smartdocs/config/entities/:id
 * Remove entity exclusion
 */
router.delete('/config/entities/:id', async (req: Request, res: Response) => {
  try {
    await smartDocsConfigService.removeEntityExclusion(parseInt(req.params.id));
    res.json({
      success: true
    });
  } catch (error: any) {
    logger.error('[SmartDocsConfig] DELETE /config/entities/:id failed', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/smartdocs/config/check-sync
 * Check if sync is enabled for a request
 */
router.post('/config/check-sync', async (req: Request, res: Response) => {
  try {
    const enabled = await smartDocsConfigService.isSyncEnabledForRequest(req.body);
    res.json({
      success: true,
      data: { enabled }
    });
  } catch (error: any) {
    logger.error('[SmartDocsConfig] POST /config/check-sync failed', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/smartdocs/config/user-config/:userId/:userType
 * Get effective sync config for user
 */
router.get('/config/user-config/:userId/:userType', async (req: Request, res: Response) => {
  try {
    const config = await smartDocsConfigService.getUserSyncConfig(
      parseInt(req.params.userId),
      req.params.userType as 'client' | 'professional'
    );
    res.json({
      success: true,
      data: config
    });
  } catch (error: any) {
    logger.error('[SmartDocsConfig] GET /config/user-config/:userId/:userType failed', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
