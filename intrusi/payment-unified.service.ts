/**
 * Payment Service - Sistema Pagamenti v5.1 UNIFIED
 * Data: 29/09/2025
 * Versione: 5.1.0
 * 
 * VERSIONE CON FORMATO API KEYS UNIFICATO
 * - Usa il formato standard stripe_keys
 * - Compatibile con il nuovo sistema uniformato
 * - Stripe funzionante in modalità LIVE
 */

import { PaymentStatus, PaymentMethod, PaymentType, RefundStatus, RefundReason, Prisma } from '@prisma/client';
import Stripe from 'stripe';
import { z } from 'zod';
import { auditLogService } from './auditLog.service';
import { notificationService } from './notification.service';
import { invoiceService } from './invoice.service';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';

// Schema validazione
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
      const apiKey = await prisma.apiKey.findUnique({
        where: { key: 'stripe_keys' }
      });

      if (!apiKey || !apiKey.permissions) {
        throw new Error('Stripe configuration not found');
      }

      const config = apiKey.permissions as any;
      
      if (!config.secretKey || !config.publicKey) {
        throw new Error('Invalid Stripe configuration');
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
      throw error;
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
   * Ottiene il client Stripe inizializzato
   */
  private async getStripeClient(): Promise<Stripe> {
    if (this.stripeClient) {
      return this.stripeClient;
    }

    const config = await this.loadStripeConfig();
    
    this.stripeClient = new Stripe(config.secretKey, {
      apiVersion: '2024-06-20',
      typescript: true,
    });

    return this.stripeClient;
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
      await stripe.balance.retrieve();
      return true;
    } catch (error) {
      logger.error('Stripe connection test failed:', error);
      return false;
    }
  }

  /**
   * Crea un Payment Intent con Stripe
   */
  async createPaymentIntent(amount: number, metadata?: any) {
    try {
      const stripe = await this.getStripeClient();

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: 'eur',
        metadata: metadata || {},
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amount,
        currency: 'EUR',
      };
    } catch (error) {
      logger.error('Create payment intent error:', error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();