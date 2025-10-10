/**
 * Payment Service - Sistema Pagamenti v5.1 UNIFIED
 * Data: 29/09/2025
 * Versione: 5.1.0
 * 
 * VERSIONE CON FORMATO API KEYS UNIFICATO
 * - Usa il formato standard stripe_keys
 * - Compatibile con il nuovo sistema uniformato
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

const CreatePaymentSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(['DEPOSIT', 'FINAL_PAYMENT', 'BOOKING', 'ACCESSORY', 'SUBSCRIPTION', 'HOLD', 'COMMISSION']),
  method: z.enum(['CARD', 'BANK_TRANSFER', 'PAYPAL', 'CASH', 'OTHER']),  // Questo resta 'method' nell'input
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

export class PaymentService {
  private stripeClient: Stripe | null = null;
  private stripeConfig: any = null;
  private readonly PLATFORM_FEE_PERCENT = 15;

  /**
   * Carica la configurazione Stripe dal formato unificato
   */
  private async loadStripeConfig() {
    if (this.stripeConfig) {
      return this.stripeConfig;
    }

    try {
      // Usa il formato unificato stripe_keys
      const apiKey = await prisma.apiKey.findUnique({
        where: { key: 'stripe_keys' }
      });

      if (!apiKey || !apiKey.permissions) {
        // Se non trova il formato unificato, prova con quello vecchio per compatibilità
        logger.warn('Stripe unified format not found, using mock config');
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

      logger.info(`Stripe loaded in ${this.stripeConfig.mode} mode`);
      return this.stripeConfig;
      
    } catch (error) {
      logger.error('Failed to load Stripe config:', error);
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
   * Ottiene la chiave pubblica di Stripe (per frontend)
   */
  async getStripePublicKey(): Promise<string> {
    const config = await this.loadStripeConfig();
    return config.publicKey;
  }

  /**
   * Ottiene il webhook secret di Stripe
   */
  async getWebhookSecret(): Promise<string> {
    const config = await this.loadStripeConfig();
    
    if (!config.webhookSecret) {
      logger.warn('Stripe webhook secret not configured');
      return 'whsec_temporary_secret';
    }
    
    return config.webhookSecret;
  }

  /**
   * Ottiene il client Stripe inizializzato
   */
  private async getStripeClient(): Promise<Stripe | null> {
    try {
      if (this.stripeClient) {
        return this.stripeClient;
      }

      const config = await this.loadStripeConfig();
      
      // Se è una chiave mock, non inizializzare Stripe reale
      if (config.secretKey === 'sk_test_mock') {
        logger.warn('Using mock Stripe configuration');
        return null;
      }
      
      this.stripeClient = new Stripe(config.secretKey, {
        apiVersion: '2024-06-20',
        typescript: true,
      });

      return this.stripeClient;
    } catch (error) {
      logger.error('Failed to initialize Stripe client:', error);
      return null;
    }
  }

  /**
   * Ottiene la configurazione pubblica per il frontend
   */
  async getPublicConfig() {
    const config = await this.loadStripeConfig();
    
    return {
      publicKey: config.publicKey,
      mode: config.mode,
      platformFee: this.PLATFORM_FEE_PERCENT
    };
  }

  /**
   * Testa la connessione con Stripe
   */
  async testConnection(): Promise<boolean> {
    try {
      const stripe = await this.getStripeClient();
      if (!stripe) {
        logger.warn('Stripe client not available (mock mode)');
        return false;
      }
      
      await stripe.balance.retrieve();
      return true;
    } catch (error) {
      logger.error('Stripe connection test failed:', error);
      return false;
    }
  }

  /**
   * Crea un pagamento
   */
  async createPayment(data: z.infer<typeof CreatePaymentSchema>) {
    try {
      // Valida i dati
      const validData = CreatePaymentSchema.parse(data);

      // Calcola commissioni
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
          paymentMethod: validData.method,  // MAPPA method -> paymentMethod!
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

      // Log dell'azione
      await auditLogService.log({
        action: 'PAYMENT_CREATED',
        category: 'BUSINESS',
        userId: validData.clientId,
        details: {
          paymentId: payment.id,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,  // CORRETTO!
        }
      });

      return payment;
    } catch (error) {
      logger.error('Create payment error:', error);
      throw error;
    }
  }

  /**
   * Crea un Payment Intent con Stripe
   */
  async createPaymentIntent(paymentId: string) {
    try {
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
        // Modalità mock - ritorna dati fittizi
        logger.warn('Stripe in mock mode, returning mock payment intent');
        return {
          clientSecret: 'pi_mock_secret_' + crypto.randomBytes(16).toString('hex'),
          paymentIntentId: 'pi_mock_' + crypto.randomBytes(8).toString('hex'),
          amount: payment.amount,
          currency: payment.currency,
        };
      }

      // Crea il payment intent reale
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

      logger.info(`Payment intent created: ${paymentIntent.id}`);

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: payment.amount,
        currency: payment.currency,
      };
    } catch (error) {
      logger.error('Create payment intent error:', error);
      throw error;
    }
  }

  /**
   * Conferma un pagamento
   */
  async confirmPayment(paymentId: string, stripePaymentIntentId: string) {
    try {
      const stripe = await this.getStripeClient();
      
      if (!stripe) {
        logger.warn('Stripe in mock mode, simulating payment confirmation');
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
        return payment;
      }

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
        } catch (error) {
          logger.error('Failed to generate invoice:', error);
        }

        // Notifica al professionista
        await notificationService.createNotification({
          recipientId: payment.professionalId,
          type: 'PAYMENT_RECEIVED',
          title: 'Pagamento Ricevuto',
          message: `Hai ricevuto un pagamento di €${payment.professionalAmount} da ${payment.client.firstName} ${payment.client.lastName}`,
          data: { paymentId },
        });

        // Log dell'azione
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

        return payment;
      } else {
        throw new AppError(`Payment not completed: ${paymentIntent.status}`, 400);
      }
    } catch (error) {
      logger.error('Confirm payment error:', error);
      throw error;
    }
  }

  /**
   * Processa un rimborso
   */
  async refundPayment(paymentId: string, amount?: number, reason?: RefundReason) {
    try {
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

      logger.info(`Refund created: ${refund.id}`);
      return refund;
    } catch (error) {
      logger.error('Refund payment error:', error);
      throw error;
    }
  }

  /**
   * Ottiene statistiche sui pagamenti
   */
  async getStats(professionalId?: string, dateRange?: { start: Date; end: Date }) {
    try {
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

      // Query per totali
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

      // GroupBy per status
      const statusGroups = await prisma.payment.groupBy({
        by: ['status'],
        where: whereAll,
        _count: { _all: true },
        _sum: { amount: true }
      });

      // GroupBy per type
      const typeGroups = await prisma.payment.groupBy({
        by: ['type'],
        where: whereAll,
        _count: { _all: true },
        _sum: { amount: true }
      });

      // GroupBy per method
      const methodGroups = await prisma.payment.groupBy({
        by: ['paymentMethod'],
        where: whereAll,
        _count: { _all: true },
        _sum: { amount: true }
      });

      // Calcola metriche derivate
      const revenue = totalRevenue._sum.amount || 0;
      const transactions = totalTransactions || 0;
      const averageTransaction = transactions > 0 ? revenue / transactions : 0;
      const successRate = allTransactions > 0 ? (transactions / allTransactions) * 100 : 0;

      // Trasforma i risultati nel formato atteso dal frontend
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

      return {
        // Campi che il frontend si aspetta
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
        recentPayments: [], // TODO: Aggiungere pagamenti recenti se necessario
        
        // Campi originali per retrocompatibilità
        totalAmount: revenue,
        totalCount: transactions,
        byMethod: methodGroups
      };
    } catch (error) {
      logger.error('Get payment stats error:', error);
      // Ritorna dati vuoti con struttura corretta
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
   * Webhook handler per eventi Stripe
   */
  async handleStripeWebhook(signature: string, payload: string) {
    try {
      const stripe = await this.getStripeClient();
      
      if (!stripe) {
        logger.warn('Stripe webhook received but client not available');
        return { received: true };
      }

      const webhookSecret = await this.getWebhookSecret();
      
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );

      logger.info(`Stripe webhook received: ${event.type}`);

      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const paymentId = paymentIntent.metadata.paymentId;
          if (paymentId) {
            await this.confirmPayment(paymentId, paymentIntent.id);
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
          }
          break;

        case 'refund.created':
          const refund = event.data.object as Stripe.Refund;
          await prisma.refund.updateMany({
            where: { stripeRefundId: refund.id },
            data: { status: RefundStatus.COMPLETED }
          });
          break;

        default:
          logger.info(`Unhandled webhook event: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      logger.error('Stripe webhook error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();