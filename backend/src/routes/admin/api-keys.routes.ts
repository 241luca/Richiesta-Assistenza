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
    const apiKey = await apiKeyService.getApiKey(key);
    
    if (!apiKey) {
      return res.status(404).json(ResponseFormatter.error(`API key ${key} not found`));
    }
    
    res.json(ResponseFormatter.success(apiKey, 'API key retrieved successfully'));
  } catch (error) {
    logger.error(`Error fetching API key ${req.params.key}:`, error);
    res.status(500).json(ResponseFormatter.error('Failed to fetch API key'));
  }
});

// Update API key
router.put('/:key', authenticate, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;
    
    const updatedKey = await apiKeyService.updateApiKey(key, value, description);
    
    if (!updatedKey) {
      return res.status(404).json(ResponseFormatter.error(`API key ${key} not found`));
    }
    
    res.json(ResponseFormatter.success(updatedKey, 'API key updated successfully'));
  } catch (error) {
    logger.error(`Error updating API key ${req.params.key}:`, error);
    res.status(500).json(ResponseFormatter.error('Failed to update API key'));
  }
});

// Create new API key
router.post('/', authenticate, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), async (req, res) => {
  try {
    const { key, value, description } = req.body;
    
    if (!key || !value) {
      return res.status(400).json(ResponseFormatter.error('Key and value are required'));
    }
    
    const newApiKey = await apiKeyService.createApiKey(key, value, description);
    res.status(201).json(ResponseFormatter.success(newApiKey, 'API key created successfully'));
  } catch (error) {
    logger.error('Error creating API key:', error);
    res.status(500).json(ResponseFormatter.error('Failed to create API key'));
  }
});

// Delete API key
router.delete('/:key', authenticate, requireRole([Role.SUPER_ADMIN]), async (req, res) => {
  try {
    const { key } = req.params;
    const deleted = await apiKeyService.deleteApiKey(key);
    
    if (!deleted) {
      return res.status(404).json(ResponseFormatter.error(`API key ${key} not found`));
    }
    
    res.json(ResponseFormatter.success(null, 'API key deleted successfully'));
  } catch (error) {
    logger.error(`Error deleting API key ${req.params.key}:`, error);
    res.status(500).json(ResponseFormatter.error('Failed to delete API key'));
  }
});

export default router;
