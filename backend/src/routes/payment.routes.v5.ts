/**
 * Payment Routes - API Endpoints Sistema Pagamenti v5.1
 * Data: 29/09/2025  
 * Versione: 5.1.0
 * 
 * Compatibile con formato unificato API keys
 */

import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { Role, PaymentStatus } from '@prisma/client';
import { paymentService } from '../services/payment.service';
import { ResponseFormatter } from '../utils/responseFormatter';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

const router = express.Router();

// ========================================
// PUBLIC ENDPOINTS
// ========================================

// GET /api/payments/config - Configurazione pubblica per frontend
router.get('/config', async (req, res) => {
  try {
    const config = await paymentService.getPublicConfig();
    res.json(ResponseFormatter.success(config));
  } catch (error: any) {
    logger.error('Get payment config error:', error);
    res.status(500).json(ResponseFormatter.error('Failed to get payment config'));
  }
});

// ========================================
// AUTHENTICATED ENDPOINTS
// ========================================

// GET /api/payments/stats - Statistiche pagamenti
router.get('/stats', authenticate, async (req: any, res) => {
  try {
    const { startDate, endDate } = req.query;
    const user = req.user;
    
    let professionalId: string | undefined;
    if (user.role === 'PROFESSIONAL') {
      professionalId = user.id;
    }
    
    const dateRange = startDate && endDate ? {
      start: new Date(startDate as string),
      end: new Date(endDate as string)
    } : undefined;
    
    const stats = await paymentService.getStats(professionalId, dateRange);
    
    res.json(ResponseFormatter.success(stats));
  } catch (error: any) {
    logger.error('Get payment stats error:', error);
    res.status(500).json(ResponseFormatter.error('Failed to get payment stats'));
  }
});

// GET /api/payments - Lista pagamenti con filtri
router.get('/', authenticate, async (req: any, res) => {
  try {
    const { 
      status, 
      type, 
      method, 
      searchTerm, 
      from, 
      to,
      page = 1,
      limit = 10
    } = req.query;
    
    const user = req.user;
    
    // Costruisci filtri
    const where: any = {};
    
    // Se è un professional, mostra solo i suoi pagamenti
    if (user.role === 'PROFESSIONAL') {
      where.professionalId = user.id;
    } else if (user.role === 'CLIENT') {
      where.clientId = user.id;
    }
    
    // Filtri opzionali
    if (status) where.status = status;
    if (type) where.type = type;
    if (method) where.method = method;
    
    // Filtro date
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from as string);
      if (to) where.createdAt.lte = new Date(to as string);
    }
    
    // Ricerca testuale
    if (searchTerm) {
      where.OR = [
        { description: { contains: searchTerm as string, mode: 'insensitive' } },
        { stripePaymentId: { contains: searchTerm as string, mode: 'insensitive' } },
      ];
    }
    
    // Paginazione
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    
    // Query database
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          professional: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          request: {
            select: {
              id: true,
              title: true
            }
          },
          quote: {
            select: {
              id: true,
              quoteNumber: true
            }
          },
          invoices: {
            select: {
              id: true,
              invoiceNumber: true
            }
          },
          refunds: {
            select: {
              id: true,
              amount: true,
              status: true
            }
          }
        }
      }),
      prisma.payment.count({ where })
    ]);
    
    res.json(ResponseFormatter.success({
      payments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    }));
  } catch (error: any) {
    logger.error('Get payments error:', error);
    res.status(500).json(ResponseFormatter.error('Failed to get payments'));
  }
});

// GET /api/payments/:id - Dettaglio singolo pagamento
router.get('/:id', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        client: true,
        professional: true,
        request: true,
        quote: true,
        invoices: true,
        refunds: true,
        paymentSplits: true
      }
    });
    
    if (!payment) {
      return res.status(404).json(ResponseFormatter.error('Payment not found'));
    }
    
    // Verifica autorizzazione
    if (user.role === 'PROFESSIONAL' && payment.professionalId !== user.id) {
      return res.status(403).json(ResponseFormatter.error('Unauthorized'));
    }
    if (user.role === 'CLIENT' && payment.clientId !== user.id) {
      return res.status(403).json(ResponseFormatter.error('Unauthorized'));
    }
    
    res.json(ResponseFormatter.success(payment));
  } catch (error: any) {
    logger.error('Get payment error:', error);
    res.status(500).json(ResponseFormatter.error('Failed to get payment'));
  }
});

// POST /api/payments/create-intent - Crea Payment Intent
router.post('/create-intent', authenticate, async (req: any, res) => {
  try {
    const { amount, metadata } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json(ResponseFormatter.error('Invalid amount'));
    }
    
    // Crea prima il pagamento nel DB
    const payment = await paymentService.createPayment({
      amount,
      type: metadata?.type || 'FULL_PAYMENT',
      method: 'CARD',
      requestId: metadata?.requestId,
      quoteId: metadata?.quoteId,
      professionalId: metadata?.professionalId || req.user.id,
      clientId: metadata?.clientId || req.user.id,
      description: metadata?.description,
      metadata
    });
    
    // Poi crea il payment intent Stripe
    const paymentIntent = await paymentService.createPaymentIntent(payment.id);
    
    res.json(ResponseFormatter.success({
      ...paymentIntent,
      paymentId: payment.id
    }));
  } catch (error: any) {
    logger.error('Create payment intent error:', error);
    res.status(500).json(ResponseFormatter.error('Failed to create payment intent'));
  }
});

// POST /api/payments/:id/confirm - Conferma pagamento
router.post('/:id/confirm', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { stripePaymentIntentId } = req.body;
    
    const payment = await paymentService.confirmPayment(id, stripePaymentIntentId);
    
    res.json(ResponseFormatter.success(payment));
  } catch (error: any) {
    logger.error('Confirm payment error:', error);
    res.status(500).json(ResponseFormatter.error('Failed to confirm payment'));
  }
});

// POST /api/payments/:id/refund - Rimborso pagamento
router.post('/:id/refund', authenticate, requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (req: any, res) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;
    
    const refund = await paymentService.refundPayment(id, amount, reason);
    
    res.json(ResponseFormatter.success(refund));
  } catch (error: any) {
    logger.error('Refund payment error:', error);
    res.status(500).json(ResponseFormatter.error('Failed to refund payment'));
  }
});

// ========================================
// ADMIN ENDPOINTS
// ========================================

// POST /api/payments/test-connection - Test connessione Stripe
router.post('/test-connection', authenticate, requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (req, res) => {
  try {
    const result = await paymentService.testConnection();
    
    if (result) {
      const config = await paymentService.getPublicConfig();
      res.json(ResponseFormatter.success({
        connected: true,
        message: 'Connessione a Stripe verificata',
        mode: config.mode,
        platformFee: config.platformFee
      }));
    } else {
      res.json(ResponseFormatter.error('Connessione Stripe fallita', 503));
    }
  } catch (error: any) {
    logger.error('Test connection error:', error);
    res.json(ResponseFormatter.error(error.message || 'Test connessione fallito', 503));
  }
});

// ========================================
// WEBHOOK ENDPOINT (NO AUTH)
// ========================================

// POST /api/payments/stripe-webhook - Webhook Stripe
router.post('/stripe-webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const sig = req.headers['stripe-signature'] as string;
      
      if (!sig) {
        return res.status(400).send('Missing stripe-signature header');
      }

      await paymentService.handleStripeWebhook(sig, req.body.toString());
      
      res.json({ received: true });
    } catch (error: any) {
      logger.error('Stripe webhook error:', error);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  }
);

export default router;