/**
 * Routes principali WhatsApp
 * Unifica tutte le funzionalità WhatsApp
 */

import { Router } from 'express';
import whatsappBaseRoutes from './whatsapp.routes';
import whatsappWebhookRoutes from './whatsapp-webhook.routes';
import whatsappPollingRoutes from './whatsapp-polling.routes';
import logger from '../utils/logger';

const router = Router();

// Log per debug
logger.info('🔧 Registering WhatsApp routes...');

// Monta tutte le sub-routes
router.use('/', whatsappBaseRoutes);        // Routes base (/api/whatsapp/*)
router.use('/', whatsappWebhookRoutes);     // Routes webhook (/api/whatsapp/webhook/*)
router.use('/', whatsappPollingRoutes);     // Routes polling (/api/whatsapp/polling/*)

logger.info('✅ WhatsApp routes registered successfully');

export default router;
