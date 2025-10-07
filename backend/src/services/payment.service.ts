/**
 * Payment Service
 * Sistema completo per gestione pagamenti, commissioni e rimborsi con integrazione Stripe
 * 
 * Responsabilità:
 * - Gestione configurazione Stripe (API keys, webhook)
 * - Creazione e tracciamento pagamenti con calcolo commissioni
 * - Integrazione Stripe Payment Intents
 * - Conferma e validazione pagamenti
 * - Sistema rimborsi completo (totale/parziale)
 * - Statistiche e analytics pagamenti
 * - Gestione webhook Stripe per aggiornamenti real-time
 * - Generazione automatica fatture post-pagamento
 * 
 * @module services/payment
 * @version 5.2.1
 * @updated 2025-10-01
 * @author Sistema Richiesta Assistenza
 */

import { PaymentStatus, PaymentMethod, PaymentType, RefundStatus, RefundReason, Prisma } from '@prisma/client';
import Stripe from 'stripe';
import { z } from 'zod';
import { format, addDays, subMonths } from 'date-fns';
import { auditLogService } from './auditLog.service';
import { notificationService } from './notification.service';
import { invoiceService } from './invoice.service';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import crypto from 'crypto';

// ========================================
// SCHEMA VALIDAZIONE
// ========================================

/**
 * Schema validazione creazione pagamento
 */
const CreatePaymentSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(['DEPOSIT', 'FINAL_PAYMENT', 'BOOKING', 'ACCESSORY', 'SUBSCRIPTION', 'HOLD', 'COMMISSION']),
  method: z.enum(['CARD', 'BANK_TRANSFER', 'PAYPAL', 'CASH', 'OTHER']),
  requestId: z.string().optional(),
  quoteId: z.string().optional(),
  professionalId: z.string(),
  clientId: z.string(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// ========================================
// CLASSE PRINCIPALE PAYMENT SERVICE
// ========================================

/**
 * Payment Service Class
 * 
 * Gestisce l'intero ciclo di vita dei pagamenti nel sistema
 */
export class PaymentService {
  private stripeClient: Stripe | null = null;
  private stripeConfig: any = null;
  private readonly PLATFORM_FEE_PERCENT = 15;

  /**
   * Carica la configurazione Stripe dal database
   * Utilizza il formato unificato stripe_keys
   * 
   * @private
   * @returns {Promise<Object>} Configurazione Stripe caricata
   * @throws {Error} Se configurazione non valida
   * 
   * @example
   * const config = await this.loadStripeConfig();
   * console.log(config.mode); // 'test' or 'live'
   */
  private async loadStripeConfig() {
    try {
      if (this.stripeConfig) {
        return this.stripeConfig;
      }

      logger.info('[PaymentService] Loading Stripe configuration');

      // Usa il formato unificato stripe_keys
      const apiKey = await prisma.apiKey.findUnique({
        where: { key: 'stripe_keys' }
      });

      if (!apiKey || !apiKey.permissions) {
        logger.warn('[PaymentService] Stripe unified format not found, using mock config');
        this.stripeConfig = {
          secretKey: 'sk_test_mock',
          publicKey: 'pk_test_mock',
          webhookSecret: null,
          mode: 'test'
        };
        return this.stripeConfig;
      }

      const config = apiKey.permissions as any;
      
      if (!config.secretKey || !config.publicKey) {
        throw new Error('Invalid Stripe configuration: missing keys');
      }

      this.stripeConfig = {
        secretKey: config.secretKey,
        publicKey: config.publicKey,
        webhookSecret: config.webhookSecret || null,
        mode: config.mode || 'test'
      };

      logger.info(`[PaymentService] Stripe loaded in ${this.stripeConfig.mode} mode`);
      return this.stripeConfig;
      
    } catch (error) {
      logger.error('[PaymentService] Failed to load Stripe config:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Ritorna configurazione mock per non bloccare il sistema
      this.stripeConfig = {
        secretKey: 'sk_test_mock',
        publicKey: 'pk_test_mock',
        webhookSecret: null,
        mode: 'test'
      };
      return this.stripeConfig;
    }
  }

  /**
   * Ottiene la chiave pubblica Stripe per il frontend
   * 
   * @returns {Promise<string>} Chiave pubblica Stripe
   * 
   * @example
   * const publicKey = await paymentService.getStripePublicKey();
   * // Usa nel frontend per inizializzare Stripe
   */
  async getStripePublicKey(): Promise<string> {
    try {
      logger.info('[PaymentService] Getting Stripe public key');
      const config = await this.loadStripeConfig();
      return config.publicKey;
    } catch (error) {
      logger.error('[PaymentService] Error getting public key:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Ottiene il webhook secret Stripe
   * 
   * @returns {Promise<string>} Webhook secret per validazione eventi
   * 
   * @example
   * const secret = await paymentService.getWebhookSecret();
   */
  async getWebhookSecret(): Promise<string> {
    try {
      const config = await this.loadStripeConfig();
      
      if (!config.webhookSecret) {
        logger.warn('[PaymentService] Stripe webhook secret not configured');
        return 'whsec_temporary_secret';
      }
      
      return config.webhookSecret;
    } catch (error) {
      logger.error('[PaymentService] Error getting webhook secret:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Ottiene il client Stripe inizializzato
   * 
   * @private
   * @returns {Promise<Stripe|null>} Client Stripe o null se in modalità mock
   * 
   * @example
   * const stripe = await this.getStripeClient();
   * if (stripe) {
   *   const balance = await stripe.balance.retrieve();
   * }
   */
  private async getStripeClient(): Promise<Stripe | null> {
    try {
      if (this.stripeClient) {
        return this.stripeClient;
      }

      const config = await this.loadStripeConfig();
      
      // Se è una chiave mock, non inizializzare Stripe reale
      if (config.secretKey === 'sk_test_mock') {
        logger.warn('[PaymentService] Using mock Stripe configuration');
        return null;
      }
      
      this.stripeClient = new Stripe(config.secretKey, {
        apiVersion: '2024-06-20',
        typescript: true,
      });

      logger.info('[PaymentService] Stripe client initialized successfully');
      return this.stripeClient;
      
    } catch (error) {
      logger.error('[PaymentService] Failed to initialize Stripe client:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return null;
    }
  }

  /**
   * Ottiene la configurazione pubblica per il frontend
   * 
   * @returns {Promise<Object>} Configurazione pubblica (publicKey, mode, platformFee)
   * 
   * @example
   * const config = await paymentService.getPublicConfig();
   * console.log(config.platformFee); // 15
   */
  async getPublicConfig() {
    try {
      logger.info('[PaymentService] Getting public config');
      const config = await this.loadStripeConfig();
      
      return {
        publicKey: config.publicKey,
        mode: config.mode,
        platformFee: this.PLATFORM_FEE_PERCENT
      };
    } catch (error) {
      logger.error('[PaymentService] Error getting public config:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Testa la connessione con Stripe
   * 
   * @returns {Promise<boolean>} true se connessione riuscita
   * 
   * @example
   * const isConnected = await paymentService.testConnection();
   * if (!isConnected) {
   *   console.log('Stripe not available');
   * }
   */
  async testConnection(): Promise<boolean> {
    try {
      logger.info('[PaymentService] Testing Stripe connection');
      
      const stripe = await this.getStripeClient();
      if (!stripe) {
        logger.warn('[PaymentService] Stripe client not available (mock mode)');
        return false;
      }
      
      await stripe.balance.retrieve();
      logger.info('[PaymentService] Stripe connection test successful');
      return true;
      
    } catch (error) {
      logger.error('[PaymentService] Stripe connection test failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return false;
    }
  }

  /**
   * Crea un nuovo pagamento nel sistema
   * Calcola automaticamente commissioni piattaforma
   * 
   * @param {Object} data - Dati pagamento da creare
   * @returns {Promise<Payment>} Pagamento creato con relazioni
   * @throws {Error} Se validazione fallisce o creazione fallisce
   * 
   * @example
   * const payment = await paymentService.createPayment({
   *   amount: 100,
   *   type: 'DEPOSIT',
   *   method: 'CARD',
   *   clientId: 'client-123',
   *   professionalId: 'pro-456',
   *   requestId: 'req-789'
   * });
   */
  async createPayment(data: z.infer<typeof CreatePaymentSchema>) {
    try {
      logger.info('[PaymentService] Creating payment', {
        amount: data.amount,
        type: data.type,
        method: data.method,
        clientId: data.clientId
      });

      // Valida i dati
      const validData = CreatePaymentSchema.parse(data);

      // Calcola commissioni piattaforma (15%)
      const platformFee = Math.round(validData.amount * this.PLATFORM_FEE_PERCENT / 100);
      const professionalAmount = validData.amount - platformFee;

      // Crea il pagamento nel database
      const payment = await prisma.payment.create({
        data: {
          clientId: validData.clientId,
          professionalId: validData.professionalId,
          requestId: validData.requestId,
          quoteId: validData.quoteId,
          amount: validData.amount,
          currency: 'EUR',
          type: validData.type,
          paymentMethod: validData.method,
          status: PaymentStatus.PENDING,
          description: validData.description,
          platformFee,
          platformFeePercentage: this.PLATFORM_FEE_PERCENT,
          professionalAmount,
          metadata: validData.metadata || {},
        },
        include: {
          client: true,
          professional: true,
          request: true,
          quote: true,
        }
      });

      // Log dell'azione per audit
      await auditLogService.log({
        action: 'PAYMENT_CREATED',
        category: 'BUSINESS',
        userId: validData.clientId,
        details: {
          paymentId: payment.id,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          platformFee,
          professionalAmount
        }
      });

      logger.info('[PaymentService] Payment created successfully', {
        paymentId: payment.id,
        amount: payment.amount
      });

      return payment;
      
    } catch (error) {
      logger.error('[PaymentService] Create payment error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        data,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Crea un Payment Intent con Stripe
   * Genera client secret per pagamento frontend
   * 
   * @param {string} paymentId - ID pagamento database
   * @returns {Promise<Object>} Payment Intent con clientSecret
   * @throws {AppError} Se pagamento non trovato
   * 
   * @example
   * const intent = await paymentService.createPaymentIntent('payment-123');
   * // Usa intent.clientSecret nel frontend per completare pagamento
   */
  async createPaymentIntent(paymentId: string) {
    try {
      logger.info('[PaymentService] Creating payment intent', { paymentId });

      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          client: true,
          professional: true,
        }
      });

      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      const stripe = await this.getStripeClient();
      
      if (!stripe) {
        // Modalità mock - ritorna dati fittizi per sviluppo
        logger.warn('[PaymentService] Stripe in mock mode, returning mock payment intent');
        const mockData = {
          clientSecret: 'pi_mock_secret_' + crypto.randomBytes(16).toString('hex'),
          paymentIntentId: 'pi_mock_' + crypto.randomBytes(8).toString('hex'),
          amount: payment.amount,
          currency: payment.currency,
        };
        return mockData;
      }

      // Crea il payment intent reale con Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(payment.amount * 100), // Converti in centesimi
        currency: payment.currency.toLowerCase(),
        metadata: {
          paymentId: payment.id,
          clientId: payment.clientId,
          professionalId: payment.professionalId,
          requestId: payment.requestId || '',
          platformFee: payment.platformFee.toString(),
        },
        description: payment.description || `Payment for request ${payment.requestId}`,
      });

      // Aggiorna il pagamento con l'ID Stripe
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          stripePaymentId: paymentIntent.id,
          metadata: {
            ...payment.metadata as object,
            stripeClientSecret: paymentIntent.client_secret,
          }
        }
      });

      logger.info('[PaymentService] Payment intent created successfully', {
        paymentId,
        stripePaymentIntentId: paymentIntent.id
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: payment.amount,
        currency: payment.currency,
      };
      
    } catch (error) {
      logger.error('[PaymentService] Create payment intent error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        paymentId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Conferma un pagamento dopo successo su Stripe
   * Genera fattura automaticamente e notifica il professionista
   * 
   * @param {string} paymentId - ID pagamento database
   * @param {string} stripePaymentIntentId - ID Payment Intent Stripe
   * @returns {Promise<Payment>} Pagamento confermato
   * @throws {AppError} Se payment intent non succeeded
   * 
   * @example
   * const payment = await paymentService.confirmPayment(
   *   'payment-123',
   *   'pi_1234567890'
   * );
   */
  async confirmPayment(paymentId: string, stripePaymentIntentId: string) {
    try {
      logger.info('[PaymentService] Confirming payment', {
        paymentId,
        stripePaymentIntentId
      });

      const stripe = await this.getStripeClient();
      
      if (!stripe) {
        logger.warn('[PaymentService] Stripe in mock mode, simulating payment confirmation');
        // In modalità mock, conferma direttamente
        const payment = await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: PaymentStatus.COMPLETED,
            paidAt: new Date(),
          },
          include: {
            client: true,
            professional: true,
            request: true,
          }
        });
        
        logger.info('[PaymentService] Payment confirmed (mock mode)', { paymentId });
        return payment;
      }

      // Verifica stato payment intent su Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        // Aggiorna il pagamento nel database
        const payment = await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: PaymentStatus.COMPLETED,
            paidAt: new Date(),
            metadata: {
              stripePaymentIntentId,
              stripeChargeId: paymentIntent.latest_charge as string,
            }
          },
          include: {
            client: true,
            professional: true,
            request: true,
          }
        });

        // Genera fattura automaticamente
        try {
          await invoiceService.generateInvoice(paymentId);
          logger.info('[PaymentService] Invoice generated for payment', { paymentId });
        } catch (error) {
          logger.error('[PaymentService] Failed to generate invoice:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            paymentId
          });
        }

        // Notifica al professionista
        await notificationService.createNotification({
          recipientId: payment.professionalId,
          type: 'PAYMENT_RECEIVED',
          title: 'Pagamento Ricevuto',
          message: `Hai ricevuto un pagamento di €${payment.professionalAmount} da ${payment.client.firstName} ${payment.client.lastName}`,
          data: { paymentId },
        });

        // Log dell'azione per audit
        await auditLogService.log({
          action: 'PAYMENT_COMPLETED',
          category: 'BUSINESS',
          userId: payment.clientId,
          details: {
            paymentId: payment.id,
            amount: payment.amount,
            stripePaymentIntentId,
          }
        });

        logger.info('[PaymentService] Payment confirmed successfully', {
          paymentId,
          amount: payment.amount
        });

        return payment;
      } else {
        throw new AppError(`Payment not completed: ${paymentIntent.status}`, 400);
      }
      
    } catch (error) {
      logger.error('[PaymentService] Confirm payment error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        paymentId,
        stripePaymentIntentId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Processa un rimborso totale o parziale
   * Gestisce rimborso su Stripe e aggiorna database
   * 
   * @param {string} paymentId - ID pagamento da rimborsare
   * @param {number} [amount] - Importo da rimborsare (opzionale, default: totale)
   * @param {RefundReason} [reason] - Motivo del rimborso
   * @returns {Promise<Refund>} Rimborso creato
   * @throws {AppError} Se pagamento non trovato
   * 
   * @example
   * // Rimborso totale
   * const refund = await paymentService.refundPayment('payment-123');
   * 
   * // Rimborso parziale
   * const partialRefund = await paymentService.refundPayment(
   *   'payment-123',
   *   50,
   *   RefundReason.REQUESTED_BY_CUSTOMER
   * );
   */
  async refundPayment(paymentId: string, amount?: number, reason?: RefundReason) {
    try {
      logger.info('[PaymentService] Processing refund', {
        paymentId,
        amount,
        reason
      });

      const payment = await prisma.payment.findUnique({
        where: { id: paymentId }
      });

      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      const stripe = await this.getStripeClient();
      const refundAmount = amount || payment.amount;

      let stripeRefundId = 'refund_mock_' + crypto.randomBytes(8).toString('hex');

      if (stripe && payment.stripePaymentId && !payment.stripePaymentId.startsWith('pi_mock')) {
        // Crea il rimborso su Stripe reale
        const stripeRefund = await stripe.refunds.create({
          payment_intent: payment.stripePaymentId,
          amount: Math.round(refundAmount * 100),
          reason: reason === RefundReason.REQUESTED_BY_CUSTOMER ? 'requested_by_customer' : 'other',
        });
        stripeRefundId = stripeRefund.id;
        
        logger.info('[PaymentService] Stripe refund created', {
          stripeRefundId: stripeRefund.id,
          amount: refundAmount
        });
      }

      // Salva il rimborso nel database
      const refund = await prisma.refund.create({
        data: {
          paymentId,
          amount: refundAmount,
          reason: reason || RefundReason.OTHER,
          status: RefundStatus.PENDING,
          stripeRefundId,
          metadata: {},
        }
      });

      // Aggiorna lo stato del pagamento
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: refundAmount === payment.amount ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
          refundedAmount: { increment: refundAmount },
        }
      });

      logger.info('[PaymentService] Refund created successfully', {
        refundId: refund.id,
        paymentId,
        amount: refundAmount
      });

      return refund;
      
    } catch (error) {
      logger.error('[PaymentService] Refund payment error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        paymentId,
        amount,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Ottiene statistiche dettagliate sui pagamenti
   * Supporta filtri per professionista e intervallo date
   * 
   * @param {string} [professionalId] - ID professionista per filtrare
   * @param {Object} [dateRange] - Intervallo date {start, end}
   * @returns {Promise<Object>} Statistiche complete con metriche e breakdown
   * 
   * @example
   * // Statistiche generali
   * const stats = await paymentService.getStats();
   * 
   * // Statistiche per professionista
   * const proStats = await paymentService.getStats('pro-123');
   * 
   * // Statistiche per periodo
   * const monthStats = await paymentService.getStats(
   *   'pro-123',
   *   { start: new Date('2025-10-01'), end: new Date('2025-10-31') }
   * );
   */
  async getStats(professionalId?: string, dateRange?: { start: Date; end: Date }) {
    try {
      logger.info('[PaymentService] Getting payment stats', {
        professionalId,
        dateRange
      });

      const where: Prisma.PaymentWhereInput = {
        status: PaymentStatus.COMPLETED,
      };

      const whereAll: Prisma.PaymentWhereInput = {};

      if (professionalId) {
        where.professionalId = professionalId;
        whereAll.professionalId = professionalId;
      }

      if (dateRange) {
        where.createdAt = {
          gte: dateRange.start,
          lte: dateRange.end,
        };
        whereAll.createdAt = {
          gte: dateRange.start,
          lte: dateRange.end,
        };
      }

      // Query aggregate per metriche principali
      const [totalRevenue, totalTransactions, allTransactions, pendingPayments, refundedPayments] = await Promise.all([
        prisma.payment.aggregate({
          where,
          _sum: { amount: true },
        }),
        prisma.payment.count({ where }),
        prisma.payment.count({ where: whereAll }),
        prisma.payment.aggregate({
          where: { ...whereAll, status: PaymentStatus.PENDING },
          _sum: { amount: true },
        }),
        prisma.payment.aggregate({
          where: { ...whereAll, status: { in: [PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED] } },
          _sum: { amount: true },
        }),
      ]);

      // GroupBy per analisi dettagliate
      const [statusGroups, typeGroups, methodGroups] = await Promise.all([
        prisma.payment.groupBy({
          by: ['status'],
          where: whereAll,
          _count: { _all: true },
          _sum: { amount: true }
        }),
        prisma.payment.groupBy({
          by: ['type'],
          where: whereAll,
          _count: { _all: true },
          _sum: { amount: true }
        }),
        prisma.payment.groupBy({
          by: ['paymentMethod'],
          where: whereAll,
          _count: { _all: true },
          _sum: { amount: true }
        })
      ]);

      // Calcola metriche derivate
      const revenue = totalRevenue._sum.amount || 0;
      const transactions = totalTransactions || 0;
      const averageTransaction = transactions > 0 ? revenue / transactions : 0;
      const successRate = allTransactions > 0 ? (transactions / allTransactions) * 100 : 0;

      // Trasforma risultati nel formato atteso dal frontend
      const byStatus: { [key: string]: { count: number; amount: number } } = {};
      statusGroups.forEach(group => {
        byStatus[group.status] = {
          count: group._count._all,
          amount: group._sum.amount || 0
        };
      });

      const byType: { [key: string]: { count: number; amount: number } } = {};
      typeGroups.forEach(group => {
        byType[group.type] = {
          count: group._count._all,
          amount: group._sum.amount || 0
        };
      });

      // Trova il metodo di pagamento più usato
      let topPaymentMethod = 'CARD';
      let maxMethodCount = 0;
      methodGroups.forEach(group => {
        if (group._count._all > maxMethodCount) {
          maxMethodCount = group._count._all;
          topPaymentMethod = group.paymentMethod || 'CARD';
        }
      });

      // TODO: Calcolare monthlyGrowth confrontando con il mese precedente
      const monthlyGrowth = 0;

      const stats = {
        // Campi per dashboard frontend
        totalRevenue: revenue,
        totalTransactions: transactions,
        averageTransaction,
        successRate,
        pendingAmount: pendingPayments._sum.amount || 0,
        refundedAmount: refundedPayments._sum.amount || 0,
        monthlyGrowth,
        topPaymentMethod,
        byStatus,
        byType,
        recentPayments: [],
        
        // Campi per retrocompatibilità
        totalAmount: revenue,
        totalCount: transactions,
        byMethod: methodGroups
      };

      logger.info('[PaymentService] Payment stats retrieved successfully', {
        totalRevenue: revenue,
        totalTransactions: transactions
      });

      return stats;
      
    } catch (error) {
      logger.error('[PaymentService] Get payment stats error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        professionalId,
        dateRange,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Ritorna dati vuoti con struttura corretta per evitare crash frontend
      return {
        totalRevenue: 0,
        totalTransactions: 0,
        averageTransaction: 0,
        successRate: 0,
        pendingAmount: 0,
        refundedAmount: 0,
        monthlyGrowth: 0,
        topPaymentMethod: 'CARD',
        byStatus: {},
        byType: {},
        recentPayments: [],
        totalAmount: 0,
        totalCount: 0,
        byMethod: []
      };
    }
  }

  /**
   * Gestisce webhook da Stripe per aggiornamenti eventi
   * Valida firma webhook e processa eventi automaticamente
   * 
   * @param {string} signature - Firma Stripe per validazione
   * @param {string} payload - Payload evento webhook
   * @returns {Promise<Object>} Conferma ricezione evento
   * @throws {Error} Se validazione firma fallisce
   * 
   * @example
   * // Nella route webhook
   * const result = await paymentService.handleStripeWebhook(
   *   req.headers['stripe-signature'],
   *   req.body
   * );
   */
  async handleStripeWebhook(signature: string, payload: string) {
    try {
      logger.info('[PaymentService] Stripe webhook received');

      const stripe = await this.getStripeClient();
      
      if (!stripe) {
        logger.warn('[PaymentService] Stripe webhook received but client not available');
        return { received: true };
      }

      const webhookSecret = await this.getWebhookSecret();
      
      // Valida firma e costruisci evento
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );

      logger.info(`[PaymentService] Stripe webhook validated: ${event.type}`, {
        eventId: event.id,
        eventType: event.type
      });

      // Processa eventi in base al tipo
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const paymentId = paymentIntent.metadata.paymentId;
          if (paymentId) {
            await this.confirmPayment(paymentId, paymentIntent.id);
            logger.info('[PaymentService] Payment confirmed via webhook', {
              paymentId,
              paymentIntentId: paymentIntent.id
            });
          }
          break;

        case 'payment_intent.payment_failed':
          const failedIntent = event.data.object as Stripe.PaymentIntent;
          const failedPaymentId = failedIntent.metadata.paymentId;
          if (failedPaymentId) {
            await prisma.payment.update({
              where: { id: failedPaymentId },
              data: { 
                status: PaymentStatus.FAILED,
                metadata: { failureReason: failedIntent.last_payment_error?.message }
              }
            });
            logger.info('[PaymentService] Payment marked as failed via webhook', {
              paymentId: failedPaymentId
            });
          }
          break;

        case 'refund.created':
          const refund = event.data.object as Stripe.Refund;
          await prisma.refund.updateMany({
            where: { stripeRefundId: refund.id },
            data: { status: RefundStatus.COMPLETED }
          });
          logger.info('[PaymentService] Refund completed via webhook', {
            refundId: refund.id
          });
          break;

        default:
          logger.info(`[PaymentService] Unhandled webhook event: ${event.type}`);
      }

      return { received: true };
      
    } catch (error) {
      logger.error('[PaymentService] Stripe webhook error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        signature,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
}

/**
 * Export Singleton Instance
 * Usa questa istanza in tutto il sistema
 */
export const paymentService = new PaymentService();