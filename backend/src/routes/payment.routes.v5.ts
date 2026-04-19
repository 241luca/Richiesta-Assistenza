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
    logger.error('Get payment config error:', error instanceof Error ? error.message : String(error));
    res.status(500).json(ResponseFormatter.error('Failed to get payment config'));
  }
});

// ========================================
// AUTHENTICATED ENDPOINTS
// ========================================

// GET /api/payments/my-payments - Lista TUTTI pagamenti (SUPER_ADMIN + statistiche globali)
router.get('/my-payments', authenticate, async (req: any, res) => {
  try {
    const { 
      status, 
      type, 
      method, 
      search, 
      from, 
      to,
      page = 1,
      limit = 10
    } = req.query;
    
    // Costruisci filtri per TUTTI i pagamenti (no ruolo check)
    const where: any = {};
    
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
    
    // Ricerca testuale - cerca in professionista, cliente, descrizione
    if (search) {
      where.OR = [
        { description: { contains: search as string, mode: 'insensitive' } },
        { User_Payment_professionalIdToUser: { OR: [
          { firstName: { contains: search as string, mode: 'insensitive' } },
          { lastName: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } }
        ] } },
        { User_Payment_clientIdToUser: { OR: [
          { firstName: { contains: search as string, mode: 'insensitive' } },
          { lastName: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } }
        ] } },
        { AssistanceRequest: { title: { contains: search as string, mode: 'insensitive' } } }
      ];
    }
    
    // Paginazione
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    
    // Query database con tutte le relazioni necessarie
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          User_Payment_clientIdToUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          User_Payment_professionalIdToUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              ragioneSociale: true  // Campo ragioneSociale per professionisti
            }
          },
          AssistanceRequest: {
            select: {
              id: true,
              title: true,
              description: true,
              Subcategory: {
                select: {
                  name: true
                }
              }
            }
          },
          Quote: {
            select: {
              id: true,
              amount: true,
              description: true
            }
          },
          Invoice: true
        }
      } as any),
      prisma.payment.count({ where })
    ]);
    
    // Calcola statistiche globali
    const statsWhere = from || to ? {
      createdAt: where.createdAt
    } : {};
    
    const [completedPayments, pendingPayments, failedPayments, totalRevenue] = await Promise.all([
      prisma.payment.count({ where: { ...statsWhere, status: PaymentStatus.COMPLETED } }),
      prisma.payment.count({ where: { ...statsWhere, status: PaymentStatus.PENDING } }),
      prisma.payment.count({ where: { ...statsWhere, status: PaymentStatus.FAILED } }),
      prisma.payment.aggregate({ 
        where: { ...statsWhere, status: PaymentStatus.COMPLETED },
        _sum: { amount: true }
      })
    ]);
    
    // Trasforma i dati per il frontend (rinomina i campi per la compatibilità)
    const formattedPayments = payments.map((payment: any) => {
      // Prendi la prima fattura dall'array Invoice
      const invoice = Array.isArray(payment.Invoice) && payment.Invoice.length > 0 
        ? payment.Invoice[0] 
        : null;
      
      return {
        ...payment,
        professional: payment.User_Payment_professionalIdToUser,
        client: payment.User_Payment_clientIdToUser,
        request: payment.AssistanceRequest,
        quote: payment.Quote,
        invoice: invoice,
        paymentMethod: payment.method    // Compatibilità frontend
      };
    });
    
    res.json(ResponseFormatter.success({
      payments: formattedPayments,
      stats: {
        total: totalRevenue._sum.amount || 0,
        completed: completedPayments,
        pending: pendingPayments,
        failed: failedPayments
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    }));
  } catch (error: any) {
    logger.error('Get my-payments error:', error instanceof Error ? error.message : String(error));
    res.status(500).json(ResponseFormatter.error('Failed to get payments'));
  }
});

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
    logger.error('Get payment stats error:', error instanceof Error ? error.message : String(error));
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
          User_Payment_clientIdToUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          User_Payment_professionalIdToUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          AssistanceRequest: {
            select: {
              id: true,
              title: true
            }
          },
          Quote: {
            select: {
              id: true,
              quoteNumber: true
            }
          },
          Invoice: {
            select: {
              id: true,
              invoiceNumber: true
            }
          },
          Refund: {
            select: {
              id: true,
              amount: true,
              status: true
            }
          }
        }
      } as any),
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
    logger.error('Get payments error:', error instanceof Error ? error.message : String(error));
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
        User_Payment_clientIdToUser: true,
        User_Payment_professionalIdToUser: true,
        AssistanceRequest: true,
        Quote: true,
        Invoice: true,
        Refund: true,
        PaymentSplit: true
      }
    } as any);
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
    logger.error('Get payment error:', error instanceof Error ? error.message : String(error));
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
    
    if (!payment) {
      return res.status(500).json(ResponseFormatter.error('Failed to create payment record'));
    }
    
    // Poi crea il payment intent Stripe
    const paymentIntent = await paymentService.createPaymentIntent(payment.id);
    
    res.json(ResponseFormatter.success({
      ...paymentIntent,
      paymentId: payment.id
    }));
  } catch (error: any) {
    logger.error('Create payment intent error:', error instanceof Error ? error.message : String(error));
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
    logger.error('Confirm payment error:', error instanceof Error ? error.message : String(error));
    res.status(500).json(ResponseFormatter.error('Failed to confirm payment'));
  }
});

// POST /api/payments/:id/refund - Rimborso pagamento
router.post('/:id/refund', authenticate, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), async (req: any, res) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;
    
    const refund = await paymentService.refundPayment(id, amount, reason);
    
    res.json(ResponseFormatter.success(refund));
  } catch (error: any) {
    logger.error('Refund payment error:', error instanceof Error ? error.message : String(error));
    res.status(500).json(ResponseFormatter.error('Failed to refund payment'));
  }
});

// ========================================
// ADMIN ENDPOINTS
// ========================================

// POST /api/payments/test-connection - Test connessione Stripe
router.post('/test-connection', authenticate, requireRole([Role.ADMIN, Role.SUPER_ADMIN]), async (req, res) => {
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
      res.json(ResponseFormatter.error('Connessione Stripe fallita', '503'));
    }
  } catch (error: any) {
    logger.error('Test connection error:', error instanceof Error ? error.message : String(error));
    res.json(ResponseFormatter.error(error instanceof Error ? error.message : String(error) || 'Test connessione fallito', '503'));
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
      logger.error('Stripe webhook error:', error instanceof Error ? error.message : String(error));
      res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);

export default router;