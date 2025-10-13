import { Router } from 'express';
import { ResponseFormatter } from '../../utils/responseFormatter';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { Role } from '@prisma/client';
import { apiKeyService } from '../../services/apiKey.service';
import { logger } from '../../utils/logger';

const router = Router();

// Get all API keys (Admin only)
router.get('/', authenticate, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), async (req, res) => {
  try {
    const apiKeys = await apiKeyService.getAllApiKeys();
    res.json(ResponseFormatter.success(apiKeys, 'API keys retrieved successfully'));
  } catch (error) {
    logger.error('Error fetching API keys:', error);
    res.status(500).json(ResponseFormatter.error('Failed to fetch API keys'));
  }
});

// Get specific API key by key name (e.g., GOOGLE_MAPS)
router.get('/:key', authenticate, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), async (req, res) => {
  try {
    const { key } = req.params;
    const apiKey = await apiKeyService.getApiKey(key as any);

    if (!apiKey) {
      return res.status(404).json(ResponseFormatter.error(`API key ${key} not found`));
    }

    res.json(ResponseFormatter.success(apiKey, 'API key retrieved successfully'));
  } catch (error) {
    logger.error(`Error fetching API key ${req.params.key}:`, error);
    res.status(500).json(ResponseFormatter.error('Failed to fetch API key'));
  }
});

// Get raw (decrypted) API key for client-side usage (e.g., TinyMCE)
router.get('/:key/raw', authenticate, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), async (req, res) => {
  try {
    const { key } = req.params;
    const apiKey = await apiKeyService.getApiKey(key as any, true);

    if (!apiKey) {
      return res.status(404).json(ResponseFormatter.error(`API key ${key} not found`));
    }

    // Return only the raw key string for safer client consumption
    res.json(ResponseFormatter.success({ key: apiKey.key }, 'Raw API key retrieved successfully'));
  } catch (error) {
    logger.error(`Error fetching raw API key ${req.params.key}:`, error);
    res.status(500).json(ResponseFormatter.error('Failed to fetch raw API key'));
  }
});

// Update API key
router.put('/:key', authenticate, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), async (req: any, res) => {
  try {
    const { key } = req.params;
    const { value, configuration, isActive } = req.body;

    if (!value) {
      return res.status(400).json(ResponseFormatter.error('Value is required'));
    }

    const updatedKey = await apiKeyService.upsertApiKey({
      service: key as any,
      key: value,
      configuration,
      isActive
    }, req.user?.id || 'system');

    res.json(ResponseFormatter.success(updatedKey, 'API key updated successfully'));
  } catch (error) {
    logger.error(`Error updating API key ${req.params.key}:`, error);
    res.status(500).json(ResponseFormatter.error('Failed to update API key'));
  }
});

// Create new API key
router.post('/', authenticate, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), async (req: any, res) => {
  try {
    // Supporta payload flessibile dal frontend
    // Formato A: { key: 'TINYMCE', value: '<api key>', configuration }
    // Formato B: { service: 'TINYMCE', key: '<api key>', configuration }
    const { key, value, description, service, configuration, isActive } = req.body;

    const serviceName = (service || key) as any;
    const apiKeyValue = value ?? (service ? req.body.key : undefined);

    if (!serviceName || !apiKeyValue) {
      return res.status(400).json(ResponseFormatter.error('Service and key value are required'));
    }

    const savedApiKey = await apiKeyService.upsertApiKey({
      service: serviceName,
      key: apiKeyValue,
      configuration,
      isActive
    }, req.user?.id || 'system');

    res.status(201).json(ResponseFormatter.success(savedApiKey, 'API key created successfully'));
  } catch (error) {
    logger.error('Error creating API key:', error);
    res.status(500).json(ResponseFormatter.error('Failed to create API key'));
  }
});

// Delete API key
router.delete('/:key', authenticate, requireRole([Role.SUPER_ADMIN]), async (req, res) => {
  try {
    const { key } = req.params;
    const deleted = await apiKeyService.deleteApiKey(key as any);
    
    if (!deleted) {
      return res.status(404).json(ResponseFormatter.error(`API key ${key} not found`));
    }
    
    res.json(ResponseFormatter.success(null, 'API key deleted successfully'));
  } catch (error) {
    logger.error(`Error deleting API key ${req.params.key}:`, error);
    res.status(500).json(ResponseFormatter.error('Failed to delete API key'));
  }
});

// Test API key (es. /api/admin/api-keys/TINYMCE/test)
router.post('/:key/test', authenticate, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), async (req, res) => {
  try {
    const { key } = req.params;
    const result = await apiKeyService.testApiKey(key as any);
    res.json(ResponseFormatter.success(result, result.message));
  } catch (error) {
    logger.error(`Error testing API key ${req.params.key}:`, error);
    res.status(500).json(ResponseFormatter.error('Failed to test API key'));
  }
});

export default router;
