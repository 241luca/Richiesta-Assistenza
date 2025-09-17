import { Router } from 'express';
import { z } from 'zod';
import { apiKeyService } from '../services/apiKey.service';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validateRequest } from '../middleware/validation';
import { ResponseFormatter } from '../utils/responseFormatter';
import { logger } from '../utils/logger';

const router = Router();

// Schema di validazione
const apiKeySchema = z.object({
  body: z.object({
    service: z.enum(['GOOGLE_MAPS', 'BREVO', 'OPENAI', 'whatsapp']),
    key: z.string().min(10),
    configuration: z.record(z.any()).optional(),
    isActive: z.boolean().optional()
  })
});

const testApiKeySchema = z.object({
  params: z.object({
    service: z.enum(['GOOGLE_MAPS', 'BREVO', 'OPENAI', 'whatsapp'])
  })
});

/**
 * GET /api/admin/api-keys
 * Ottieni tutte le API keys (SUPER_ADMIN only)
 */
router.get(
  '/',
  authenticate,
  requireRole(['SUPER_ADMIN']),
  async (req, res, next) => {
    try {
      const apiKeys = await apiKeyService.getAllApiKeys();
      
      res.json(ResponseFormatter.success(
        apiKeys, 
        'API keys retrieved successfully',
        { count: apiKeys.length }
      ));
    } catch (error) {
      logger.error('Error fetching API keys:', error);
      res.status(500).json(ResponseFormatter.error(
        'Failed to fetch API keys'
      ));
    }
  }
);

/**
 * GET /api/admin/api-keys/:service
 * Ottieni una specifica API key (SUPER_ADMIN only)
 */
router.get(
  '/:service',
  authenticate,
  requireRole(['SUPER_ADMIN']),
  async (req, res, next) => {
    try {
      // Gestisce sia maiuscolo che minuscolo
      const serviceParam = req.params.service;
      const service = serviceParam === 'whatsapp' ? 'whatsapp' : serviceParam.toUpperCase();
      
      if (!['GOOGLE_MAPS', 'BREVO', 'OPENAI', 'whatsapp'].includes(service)) {
        return res.status(400).json(ResponseFormatter.error(
          'Invalid service', 
          400,
          { service: req.params.service }
        ));
      }

      const apiKey = await apiKeyService.getApiKey(service);
      
      if (!apiKey) {
        return res.status(404).json(ResponseFormatter.error(
          `API key for service '${service}' not found`,
          404
        ));
      }

      // Maschera la chiave per sicurezza
      const maskedKey = apiKey.key.substring(0, 10) + '...' + apiKey.key.slice(-4);
      
      res.json(ResponseFormatter.success({
        ...apiKey,
        key: maskedKey
      }, `API key for ${service} retrieved successfully`));
    } catch (error) {
      logger.error('Error fetching API key:', error);
      res.status(500).json(ResponseFormatter.error(
        'Failed to fetch API key'
      ));
    }
  }
);

/**
 * POST /api/admin/api-keys
 * Crea o aggiorna una API key (SUPER_ADMIN only)
 */
router.post(
  '/',
  authenticate,
  requireRole(['SUPER_ADMIN']),
  validateRequest(apiKeySchema),
  async (req, res, next) => {
    try {
      const { service, key, configuration, isActive } = req.body;

      // Valida il formato della chiave
      if (service === 'GOOGLE_MAPS' && !key.startsWith('AIza')) {
        return res.status(400).json(ResponseFormatter.error(
          'Invalid Google Maps API key format. Must start with "AIza"',
          400
        ));
      }

      if (service === 'OPENAI' && !key.startsWith('sk-')) {
        return res.status(400).json(ResponseFormatter.error(
          'Invalid OpenAI API key format. Must start with "sk-"',
          400
        ));
      }

      if (service === 'BREVO' && !key.includes('xkeysib-')) {
        return res.status(400).json(ResponseFormatter.error(
          'Invalid Brevo API key format. Must contain "xkeysib-"',
          400
        ));
      }

      const apiKey = await apiKeyService.upsertApiKey(
        {
          service,
          key,
          configuration,
          isActive
        },
        req.user!.id
      );

      logger.info(`API key ${service} updated by user ${req.user!.id}`);

      res.json(ResponseFormatter.success(
        apiKey,
        `API key for ${service} saved successfully`,
        { updatedBy: req.user!.id }
      ));
    } catch (error) {
      logger.error('Error saving API key:', error);
      res.status(500).json(ResponseFormatter.error(
        'Failed to save API key'
      ));
    }
  }
);

/**
 * PUT /api/admin/api-keys/:service
 * Aggiorna una specifica API key (SUPER_ADMIN only)
 */
router.put(
  '/:service',
  authenticate,
  requireRole(['SUPER_ADMIN']),
  async (req, res, next) => {
    try {
      const service = req.params.service.toUpperCase() as 'GOOGLE_MAPS' | 'BREVO' | 'OPENAI';
      const { key, configuration, isActive } = req.body;

      if (!['GOOGLE_MAPS', 'BREVO', 'OPENAI'].includes(service)) {
        return res.status(400).json(ResponseFormatter.error(
          'Invalid service',
          400,
          { service: req.params.service }
        ));
      }

      const apiKey = await apiKeyService.upsertApiKey(
        {
          service,
          key,
          configuration,
          isActive
        },
        'default',
        req.user!.id
      );

      // Maschera la chiave prima di restituirla
      const maskedKey = apiKey.key.substring(0, 10) + '...' + apiKey.key.slice(-4);
      
      res.json(ResponseFormatter.success({
        ...apiKey,
        key: maskedKey
      }, `API key for ${service} updated successfully`, {
        updatedBy: req.user!.id
      }));
    } catch (error) {
      logger.error('Error updating API key:', error);
      res.status(500).json(ResponseFormatter.error(
        'Failed to update API key'
      ));
    }
  }
);

/**
 * POST /api/admin/api-keys/:service/test
 * Testa una API key (SUPER_ADMIN only)
 */
router.post(
  '/:service/test',
  authenticate,
  requireRole(['SUPER_ADMIN']),
  async (req, res, next) => {
    try {
      // Gestisce sia maiuscolo che minuscolo
      const serviceParam = req.params.service;
      const service = serviceParam === 'whatsapp' ? 'whatsapp' : serviceParam.toUpperCase();

      if (!['GOOGLE_MAPS', 'BREVO', 'OPENAI', 'whatsapp'].includes(service)) {
        return res.status(400).json(ResponseFormatter.error(
          'Invalid service',
          400,
          { service: req.params.service }
        ));
      }

      const result = await apiKeyService.testApiKey(
        service as any,
        'default'
      );

      if (result.success) {
        res.json(ResponseFormatter.success(
          result.details,
          result.message
        ));
      } else {
        res.status(400).json(ResponseFormatter.error(
          result.message,
          400,
          result.details
        ));
      }
    } catch (error) {
      logger.error('Error testing API key:', error);
      res.status(500).json(ResponseFormatter.error(
        'Failed to test API key'
      ));
    }
  }
);

/**
 * DELETE /api/admin/api-keys/:service
 * Elimina una API key (SUPER_ADMIN only)
 */
router.delete(
  '/:service',
  authenticate,
  requireRole(['SUPER_ADMIN']),
  async (req, res, next) => {
    try {
      const service = req.params.service.toUpperCase() as 'GOOGLE_MAPS' | 'BREVO' | 'OPENAI';

      if (!['GOOGLE_MAPS', 'BREVO', 'OPENAI'].includes(service)) {
        return res.status(400).json(ResponseFormatter.error(
          'Invalid service',
          400,
          { service: req.params.service }
        ));
      }

      const success = await apiKeyService.deleteApiKey(
        service,
        'default'
      );

      if (success) {
        res.json(ResponseFormatter.success(
          null,
          `API key for ${service} deleted successfully`,
          { deletedBy: req.user!.id }
        ));
      } else {
        res.status(500).json(ResponseFormatter.error(
          'Failed to delete API key'
        ));
      }
    } catch (error) {
      logger.error('Error deleting API key:', error);
      res.status(500).json(ResponseFormatter.error(
        'Failed to delete API key'
      ));
    }
  }
);

export default router;
