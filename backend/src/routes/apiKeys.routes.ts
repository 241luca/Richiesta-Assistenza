import { Router } from 'express';
import { ResponseFormatter } from '../utils/responseFormatter';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { checkRole } from '../middleware/checkRole';
import crypto from 'crypto';

const router = Router();

// Helper per mascherare le chiavi API
function maskKey(key: string): string {
  if (!key || key.length < 8) return '***';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

/**
 * GET /api/apikeys
 * Ottieni tutte le API keys (solo SUPER_ADMIN)
 */
router.get('/', authenticate, checkRole(['SUPER_ADMIN']), async (req: any, res) => {
  try {
    const apiKeys = await prisma.apiKey.findMany({
      orderBy: { service: 'asc' }
    });

    // Maschera le chiavi per sicurezza
    const maskedKeys = apiKeys.map(key => ({
      ...key,
      key: maskKey(key.key)
    }));

    return res.json(ResponseFormatter.success(maskedKeys, 'API keys retrieved'));
  } catch (error) {
    logger.error('Error fetching API keys:', error);
    return res.status(500).json(ResponseFormatter.error('Failed to fetch API keys', 'FETCH_ERROR'));
  }
});

/**
 * GET /api/apikeys/whatsapp
 * Ottieni configurazione WhatsApp specifica
 */
router.get('/whatsapp', authenticate, checkRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const apiKey = await prisma.apiKey.findFirst({
      where: { 
        service: 'whatsapp',
        isActive: true
      }
    });

    if (!apiKey) {
      return res.status(404).json(
        ResponseFormatter.error('WhatsApp configuration not found', 'NOT_FOUND')
      );
    }

    // Parse la configurazione se è JSON
    let configuration = apiKey.configuration;
    if (typeof configuration === 'string') {
      try {
        configuration = JSON.parse(configuration);
      } catch (e) {
        // Se non è JSON valido, usa come oggetto
        configuration = { data: configuration };
      }
    }

    // Restituisci i dati necessari per il frontend
    const responseData = {
      id: apiKey.id,
      service: apiKey.service,
      key: apiKey.key, // La chiave API reale per Evolution
      configuration: apiKey.permissions || {},  // Usa permissions come configuration
      isActive: apiKey.isActive !== false
    };

    return res.json(ResponseFormatter.success(responseData, 'WhatsApp configuration retrieved'));
  } catch (error) {
    logger.error('Error fetching WhatsApp config:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to fetch WhatsApp configuration', 'FETCH_ERROR')
    );
  }
});

/**
 * POST /api/apikeys
 * Crea o aggiorna API key
 */
router.post('/', authenticate, checkRole(['SUPER_ADMIN']), async (req: any, res) => {
  try {
    const { service, key, configuration, isActive = true } = req.body;

    // Validazione
    if (!service || !key) {
      return res.status(400).json(
        ResponseFormatter.error('Service and key are required', 'VALIDATION_ERROR')
      );
    }

    // Controlla se esiste già
    const existing = await prisma.apiKey.findFirst({
      where: { service }
    });

    let apiKey;

    if (existing) {
      // Aggiorna esistente
      apiKey = await prisma.apiKey.update({
        where: { id: existing.id },
        data: {
          key: key,  // Salva la chiave così com'è, senza trasformazioni!
          permissions: configuration,  // Usa permissions invece di configuration
          updatedAt: new Date()
        }
      });
      logger.info(`API key updated for service: ${service}`);
    } else {
      // Crea nuovo  
      apiKey = await prisma.apiKey.create({
        data: {
          service,
          key: key,  // Salva la chiave così com'è!
          permissions: configuration,  // Usa permissions invece di configuration
          name: service === 'whatsapp' ? 'WhatsApp Evolution API' : service
        }
      });
      logger.info(`API key created for service: ${service}`);
    }

    return res.json(ResponseFormatter.success(apiKey, 'API key saved successfully'));
  } catch (error) {
    logger.error('Error saving API key:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to save API key', 'SAVE_ERROR')
    );
  }
});

/**
 * PUT /api/apikeys/:id
 * Aggiorna API key specifica
 */
router.put('/:id', authenticate, checkRole(['SUPER_ADMIN']), async (req: any, res) => {
  try {
    const { id } = req.params;
    const { key, configuration, isActive } = req.body;

    const apiKey = await prisma.apiKey.update({
      where: { id },
      data: {
        ...(key !== undefined && { key }),
        ...(configuration !== undefined && { permissions: configuration }),  // Usa permissions
        updatedAt: new Date()
      }
    });

    logger.info(`API key ${id} updated`);
    return res.json(ResponseFormatter.success(apiKey, 'API key updated successfully'));
  } catch (error) {
    logger.error('Error updating API key:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to update API key', 'UPDATE_ERROR')
    );
  }
});

/**
 * DELETE /api/apikeys/:id
 * Elimina API key
 */
router.delete('/:id', authenticate, checkRole(['SUPER_ADMIN']), async (req: any, res) => {
  try {
    const { id } = req.params;

    await prisma.apiKey.delete({
      where: { id }
    });

    logger.info(`API key ${id} deleted`);
    return res.json(ResponseFormatter.success(null, 'API key deleted successfully'));
  } catch (error) {
    logger.error('Error deleting API key:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to delete API key', 'DELETE_ERROR')
    );
  }
});

/**
 * POST /api/apikeys/whatsapp/test
 * Test connessione WhatsApp
 */
router.post('/whatsapp/test', authenticate, checkRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const apiKey = await prisma.apiKey.findFirst({
      where: { 
        service: 'whatsapp',
        isActive: true
      }
    });

    if (!apiKey) {
      return res.status(400).json(
        ResponseFormatter.error('WhatsApp not configured', 'NOT_CONFIGURED')
      );
    }

    // Parse configurazione da permissions
    let config = apiKey.permissions;
    if (typeof config === 'string') {
      config = JSON.parse(config);
    }

    // Test connessione a Evolution API
    if (config?.baseURL) {
      try {
        const response = await fetch(config.baseURL);
        const data = await response.json();
        
        if (data.status === 200 || data.message?.includes('Evolution')) {
          return res.json(ResponseFormatter.success({ 
            success: true, 
            provider: 'evolution',
            version: data.version,
            message: 'Evolution API is working!' 
          }, 'Connection test successful'));
        }
      } catch (error) {
        logger.error('Evolution API test failed:', error);
        return res.status(500).json(
          ResponseFormatter.error('Evolution API not reachable', 'CONNECTION_ERROR')
        );
      }
    }

    return res.json(ResponseFormatter.success({ 
      success: false, 
      message: 'Unable to test connection' 
    }, 'Test completed'));
  } catch (error) {
    logger.error('Error testing WhatsApp connection:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to test connection', 'TEST_ERROR')
    );
  }
});

export default router;
