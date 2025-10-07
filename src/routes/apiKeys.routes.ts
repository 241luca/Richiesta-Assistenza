import express from 'express';
import { prisma } from '../config/database';
import { ResponseFormatter } from '../utils/responseFormatter';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * GET /api/apikeys
 * Ottiene le API keys con compatibilità per il frontend
 * Traduce il formato unificato in quello che l'interfaccia si aspetta
 */
router.get('/', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    // Recupera tutte le chiavi dal database
    const apiKeys = await prisma.apiKey.findMany({
      where: { isActive: true }
    });

    // Trasforma le chiavi per compatibilità con il frontend
    const transformedKeys = [];

    // Aggiungi chiavi normali (non Stripe)
    for (const key of apiKeys) {
      if (key.key !== 'stripe_keys') {
        transformedKeys.push({
          id: key.id,
          service: key.service,
          key: key.key,
          name: key.name,
          isActive: key.isActive,
          createdAt: key.createdAt,
          updatedAt: key.updatedAt
        });
      } else {
        // Trasforma stripe_keys nel formato che il frontend si aspetta
        const permissions = key.permissions as any;
        
        if (permissions?.secretKey) {
          transformedKeys.push({
            id: key.id + '_secret',
            service: 'STRIPE',
            key: permissions.secretKey,
            name: 'Stripe Secret Key',
            isActive: true,
            createdAt: key.createdAt,
            updatedAt: key.updatedAt
          });
        }
        
        if (permissions?.publicKey) {
          transformedKeys.push({
            id: key.id + '_public',
            service: 'STRIPE_PUBLIC',
            key: permissions.publicKey,
            name: 'Stripe Public Key',
            isActive: true,
            createdAt: key.createdAt,
            updatedAt: key.updatedAt
          });
        }
        
        if (permissions?.webhookSecret) {
          transformedKeys.push({
            id: key.id + '_webhook',
            service: 'STRIPE_WEBHOOK',
            key: permissions.webhookSecret,
            name: 'Stripe Webhook Secret',
            isActive: true,
            createdAt: key.createdAt,
            updatedAt: key.updatedAt
          });
        }
      }
    }

    return res.json(ResponseFormatter.success(transformedKeys, 'API Keys retrieved successfully'));
  } catch (error) {
    logger.error('Get API keys error:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to retrieve API keys')
    );
  }
});

/**
 * POST /api/apikeys
 * Crea o aggiorna una API key
 * Gestisce la compatibilità Stripe
 */
router.post('/', authenticate, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const { service, key: keyValue, name } = req.body;

    // Se è una chiave Stripe, aggiorna il formato unificato
    if (service === 'STRIPE' || service === 'STRIPE_PUBLIC' || service === 'STRIPE_WEBHOOK') {
      // Recupera la configurazione esistente
      let stripeConfig = await prisma.apiKey.findUnique({
        where: { key: 'stripe_keys' }
      });

      let permissions: any = stripeConfig?.permissions || {
        secretKey: null,
        publicKey: null,
        webhookSecret: null,
        mode: 'test'
      };

      // Aggiorna il campo appropriato
      if (service === 'STRIPE') {
        permissions.secretKey = keyValue;
        permissions.mode = keyValue.includes('_live_') ? 'live' : 'test';
      } else if (service === 'STRIPE_PUBLIC') {
        permissions.publicKey = keyValue;
      } else if (service === 'STRIPE_WEBHOOK') {
        permissions.webhookSecret = keyValue;
      }

      // Salva nel formato unificato
      if (stripeConfig) {
        await prisma.apiKey.update({
          where: { key: 'stripe_keys' },
          data: { permissions }
        });
      } else {
        await prisma.apiKey.create({
          data: {
            key: 'stripe_keys',
            name: 'Stripe API Keys',
            service: 'STRIPE',
            permissions,
            rateLimit: 100,
            isActive: true
          }
        });
      }

      return res.json(ResponseFormatter.success(
        { service, key: keyValue, name, isActive: true },
        'Stripe key saved successfully'
      ));
    }

    // Per altre chiavi, salva normalmente
    const apiKey = await prisma.apiKey.create({
      data: {
        key: keyValue,
        name,
        service,
        rateLimit: 100,
        isActive: true
      }
    });

    return res.json(ResponseFormatter.success(apiKey, 'API Key created successfully'));
  } catch (error) {
    logger.error('Create API key error:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to create API key')
    );
  }
});

/**
 * PUT /api/apikeys/:id
 * Aggiorna una API key
 */
router.put('/:id', authenticate, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { key: keyValue, isActive } = req.body;

    // Controlla se è una chiave Stripe fittizia
    if (id.includes('_secret') || id.includes('_public') || id.includes('_webhook')) {
      const baseId = id.split('_')[0];
      const type = id.includes('_secret') ? 'secret' : 
                   id.includes('_public') ? 'public' : 'webhook';

      const stripeConfig = await prisma.apiKey.findUnique({
        where: { id: baseId }
      });

      if (stripeConfig) {
        const permissions = stripeConfig.permissions as any;
        
        if (type === 'secret') permissions.secretKey = keyValue;
        if (type === 'public') permissions.publicKey = keyValue;
        if (type === 'webhook') permissions.webhookSecret = keyValue;

        await prisma.apiKey.update({
          where: { id: baseId },
          data: { permissions }
        });

        return res.json(ResponseFormatter.success(
          { id, key: keyValue, isActive },
          'Key updated successfully'
        ));
      }
    }

    // Aggiorna chiave normale
    const apiKey = await prisma.apiKey.update({
      where: { id },
      data: { 
        key: keyValue,
        isActive,
        updatedAt: new Date()
      }
    });

    return res.json(ResponseFormatter.success(apiKey, 'API Key updated successfully'));
  } catch (error) {
    logger.error('Update API key error:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to update API key')
    );
  }
});

/**
 * POST /api/payments/test-connection
 * Testa la connessione Stripe
 */
router.post('/test-connection', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { paymentService } = require('../services/payment.service');
    const result = await paymentService.testConnection();
    
    if (result) {
      return res.json(ResponseFormatter.success(
        { success: true },
        'Stripe connection successful'
      ));
    } else {
      return res.status(400).json(
        ResponseFormatter.error('Stripe connection failed')
      );
    }
  } catch (error) {
    logger.error('Test connection error:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to test connection')
    );
  }
});

export default router;