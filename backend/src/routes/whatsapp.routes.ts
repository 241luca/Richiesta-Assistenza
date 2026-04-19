/**
 * WhatsApp Routes - Placeholder
 * WPPConnect rimosso - In attesa di nuovo provider
 * @version 6.2.0
 * @date 21 Dicembre 2025
 */

import { Router, Request, Response } from 'express';
import { ResponseFormatter } from '../utils/responseFormatter';
import logger from '../utils/logger';
import { authenticate } from '../middleware/auth';
import { checkRole } from '../middleware/checkRole';
import { requireModule } from '../middleware/module.middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// 🔒 Protegge tutte le routes di WhatsApp
router.use(requireModule('whatsapp'));

// ====================================
// SERVIZIO WHATSAPP DISABILITATO
// Tutte le route ritornano 503 Service Unavailable
// ====================================

const SERVICE_UNAVAILABLE_RESPONSE = {
  error: 'Servizio WhatsApp temporaneamente non disponibile',
  code: 'SERVICE_UNAVAILABLE',
  message: 'Provider WhatsApp non configurato. Il servizio sarà riattivato con nuovo provider.',
  status: 503
};

/**
 * POST /api/whatsapp/send - Invia messaggio (DISABILITATO)
 */
router.post('/send', authenticate, async (req: Request, res: Response) => {
  logger.warn('⚠️ Tentativo invio messaggio WhatsApp - servizio non configurato');
  return res.status(503).json(ResponseFormatter.error(
    SERVICE_UNAVAILABLE_RESPONSE.error,
    SERVICE_UNAVAILABLE_RESPONSE.code,
    { message: SERVICE_UNAVAILABLE_RESPONSE.message }
  ));
});

/**
 * POST /api/whatsapp/send-bulk - Invio multiplo (DISABILITATO)
 */
router.post('/send-bulk', authenticate, checkRole(['ADMIN', 'SUPER_ADMIN']), async (req: Request, res: Response) => {
  logger.warn('⚠️ Tentativo invio bulk WhatsApp - servizio non configurato');
  return res.status(503).json(ResponseFormatter.error(
    SERVICE_UNAVAILABLE_RESPONSE.error,
    SERVICE_UNAVAILABLE_RESPONSE.code
  ));
});

/**
 * GET /api/whatsapp/status - Stato connessione (DISABILITATO)
 */
router.get('/status', authenticate, async (req: Request, res: Response) => {
  return res.json(ResponseFormatter.success({
    connected: false,
    provider: 'none',
    message: 'Provider WhatsApp non configurato',
    qrCode: null
  }, 'Stato WhatsApp'));
});

/**
 * POST /api/whatsapp/connect - Connetti WhatsApp (DISABILITATO)
 */
router.post('/connect', authenticate, checkRole(['ADMIN', 'SUPER_ADMIN']), async (req: Request, res: Response) => {
  logger.warn('⚠️ Tentativo connessione WhatsApp - servizio non configurato');
  return res.status(503).json(ResponseFormatter.error(
    SERVICE_UNAVAILABLE_RESPONSE.error,
    SERVICE_UNAVAILABLE_RESPONSE.code
  ));
});

/**
 * GET /api/whatsapp/qr - Ottieni QR Code (DISABILITATO)
 */
router.get('/qr', authenticate, async (req: Request, res: Response) => {
  return res.status(503).json(ResponseFormatter.error(
    'QR Code non disponibile - provider non configurato',
    'SERVICE_UNAVAILABLE'
  ));
});

/**
 * POST /api/whatsapp/disconnect - Disconnetti WhatsApp (DISABILITATO)
 */
router.post('/disconnect', authenticate, checkRole(['ADMIN', 'SUPER_ADMIN']), async (req: Request, res: Response) => {
  logger.warn('⚠️ Tentativo disconnessione WhatsApp - servizio non configurato');
  return res.json(ResponseFormatter.success({ disconnected: true }, 'Nessuna connessione attiva'));
});

/**
 * POST /api/whatsapp/reconnect - Riconnetti WhatsApp (DISABILITATO)
 */
router.post('/reconnect', authenticate, checkRole(['ADMIN', 'SUPER_ADMIN']), async (req: Request, res: Response) => {
  logger.warn('⚠️ Tentativo riconnessione WhatsApp - servizio non configurato');
  return res.status(503).json(ResponseFormatter.error(
    SERVICE_UNAVAILABLE_RESPONSE.error,
    SERVICE_UNAVAILABLE_RESPONSE.code
  ));
});

/**
 * GET /api/whatsapp/messages - Ottieni messaggi (solo database)
 */
router.get('/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0, direction } = req.query;
    
    const messages = await prisma.whatsAppMessage.findMany({
      where: direction ? { direction: String(direction) } : undefined,
      take: Number(limit),
      skip: Number(offset),
      orderBy: { timestamp: 'desc' }
    });
    
    return res.json(ResponseFormatter.success(messages, 'Messaggi WhatsApp'));
  } catch (error: unknown) {
    logger.error('Errore recupero messaggi:', error instanceof Error ? error.message : String(error));
    return res.status(500).json(ResponseFormatter.error('Errore recupero messaggi', 'DATABASE_ERROR'));
  }
});

/**
 * GET /api/whatsapp/system-info - Info sistema (DISABILITATO)
 */
router.get('/system-info', authenticate, checkRole(['ADMIN', 'SUPER_ADMIN']), async (req: Request, res: Response) => {
  return res.json(ResponseFormatter.success({
    provider: 'none',
    connected: false,
    features: {
      sendText: false,
      sendMedia: false,
      receiveMessages: false,
      groups: false,
      sessionPersistence: false,
      autoReconnect: false
    },
    message: 'Provider WhatsApp non configurato'
  }, 'Info sistema WhatsApp'));
});

/**
 * GET /api/whatsapp/stats - Statistiche (solo database)
 */
router.get('/stats', authenticate, async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [totalMessages, todayMessages, totalContacts] = await Promise.all([
      prisma.whatsAppMessage.count(),
      prisma.whatsAppMessage.count({ where: { createdAt: { gte: today } } }),
      prisma.whatsAppContact.count()
    ]);
    
    return res.json(ResponseFormatter.success({
      totalMessages,
      todayMessages,
      totalContacts,
      provider: 'none',
      connected: false
    }, 'Statistiche WhatsApp'));
  } catch (error: unknown) {
    logger.error('Errore recupero statistiche:', error instanceof Error ? error.message : String(error));
    return res.status(500).json(ResponseFormatter.error('Errore recupero statistiche', 'DATABASE_ERROR'));
  }
});

/**
 * GET /api/whatsapp/contacts - Ottieni contatti (solo database)
 */
router.get('/contacts', authenticate, async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const contacts = await prisma.whatsAppContact.findMany({
      take: Number(limit),
      skip: Number(offset),
      orderBy: { lastMessageAt: 'desc' }
    });
    
    return res.json(ResponseFormatter.success(contacts, 'Contatti WhatsApp'));
  } catch (error: unknown) {
    logger.error('Errore recupero contatti:', error instanceof Error ? error.message : String(error));
    return res.status(500).json(ResponseFormatter.error('Errore recupero contatti', 'DATABASE_ERROR'));
  }
});

export default router;
