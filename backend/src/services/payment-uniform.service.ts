import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();

class PaymentService {
  private stripe: Stripe | null = null;

  /**
   * Ottiene le chiavi Stripe dal database (formato uniforme)
   */
  private async getStripeKeys() {
    const apiKey = await prisma.apiKey.findUnique({
      where: { key: 'stripe_keys' }
    });

    if (!apiKey || !apiKey.permissions) {
      throw new Error('Stripe keys not configured in database');
    }

    const keys = apiKey.permissions as any;
    
    if (!keys.secretKey || !keys.publicKey) {
      throw new Error('Invalid Stripe configuration');
    }

    return {
      secretKey: keys.secretKey,
      publicKey: keys.publicKey,
      webhookSecret: keys.webhookSecret,
      mode: keys.mode || 'test'
    };
  }

  /**
   * Inizializza Stripe con le chiavi dal database
   */
  async initStripe(): Promise<Stripe> {
    if (this.stripe) {
      return this.stripe;
    }

    const keys = await this.getStripeKeys();
    
    this.stripe = new Stripe(keys.secretKey, {
      apiVersion: '2024-06-20',
      typescript: true
    });

    return this.stripe;
  }

  /**
   * Ottiene la configurazione pubblica per il frontend
   */
  async getPublicConfig() {
    const keys = await this.getStripeKeys();
    
    return {
      publicKey: keys.publicKey,
      mode: keys.mode
    };
  }

  /**
   * Crea un Payment Intent
   */
  async createPaymentIntent(amount: number, metadata?: any) {
    const stripe = await this.initStripe();
    
    return await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Converti in centesimi
      currency: 'eur',
      metadata: metadata || {}
    });
  }

  /**
   * Verifica la connessione con Stripe
   */
  async testConnection(): Promise<boolean> {
    try {
      const stripe = await this.initStripe();
      const balance = await stripe.balance.retrieve();
      return true;
    } catch (error) {
      console.error('Stripe connection test failed:', error);
      return false;
    }
  }
}

export const paymentService = new PaymentService();
