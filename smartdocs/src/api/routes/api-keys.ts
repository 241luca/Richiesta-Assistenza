import { Router, Request, Response } from 'express';
import { ApiKeyService } from '../../services/ApiKeyService';
import { logger } from '../../utils/logger';

const router = Router();
const apiKeyService = new ApiKeyService();

/**
 * GET /api/api-keys
 * Lista tutte le API keys
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { includeInactive } = req.query;
    const apiKeys = await apiKeyService.listAll(includeInactive === 'true');

    res.json({
      success: true,
      data: apiKeys
    });
  } catch (error: any) {
    logger.error('Error listing API keys:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/api-keys/:service
 * Ottieni una specifica API key
 */
router.get('/:service', async (req: Request, res: Response) => {
  try {
    const { service } = req.params;
    const apiKey = await apiKeyService.getByService(service, false);

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        error: 'API key not found'
      });
    }

    res.json({
      success: true,
      data: apiKey
    });
  } catch (error: any) {
    logger.error('Error getting API key:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/api-keys
 * Crea o aggiorna una API key
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { service, name, key_value, description, is_active, metadata } = req.body;

    if (!service || !name || !key_value) {
      return res.status(400).json({
        success: false,
        error: 'Service, name and key_value are required'
      });
    }

    const apiKey = await apiKeyService.upsert({
      service,
      name,
      key_value,
      description,
      is_active,
      metadata
    });

    res.json({
      success: true,
      data: apiKey,
      message: 'API key saved successfully'
    });
  } catch (error: any) {
    logger.error('Error saving API key:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/api-keys/:service
 * Aggiorna una API key esistente
 */
router.put('/:service', async (req: Request, res: Response) => {
  try {
    const { service } = req.params;
    const { name, key_value, description, is_active, metadata } = req.body;

    const apiKey = await apiKeyService.upsert({
      service,
      name,
      key_value,
      description,
      is_active,
      metadata
    });

    res.json({
      success: true,
      data: apiKey,
      message: 'API key updated successfully'
    });
  } catch (error: any) {
    logger.error('Error updating API key:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/api-keys/:service
 * Elimina una API key
 */
router.delete('/:service', async (req: Request, res: Response) => {
  try {
    const { service } = req.params;
    const success = await apiKeyService.delete(service);

    if (success) {
      res.json({
        success: true,
        message: 'API key deleted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to delete API key'
      });
    }
  } catch (error: any) {
    logger.error('Error deleting API key:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/api-keys/:service/test
 * Testa una API key
 */
router.post('/:service/test', async (req: Request, res: Response) => {
  try {
    const { service } = req.params;
    const result = await apiKeyService.test(service);

    res.json({
      success: result.success,
      message: result.message
    });
  } catch (error: any) {
    logger.error('Error testing API key:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/api-keys/:service/toggle
 * Attiva/disattiva una API key
 */
router.post('/:service/toggle', async (req: Request, res: Response) => {
  try {
    const { service } = req.params;
    const apiKey = await apiKeyService.getByService(service, true);

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        error: 'API key not found'
      });
    }

    const updated = await apiKeyService.upsert({
      ...apiKey,
      is_active: !apiKey.is_active
    });

    res.json({
      success: true,
      data: updated,
      message: `API key ${updated.is_active ? 'activated' : 'deactivated'}`
    });
  } catch (error: any) {
    logger.error('Error toggling API key:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
