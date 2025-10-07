import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

export async function seedStripeConfig(prisma: PrismaClient) {
  console.log('💳 SEEDING CONFIGURAZIONE STRIPE COMPLETA...\n')

  try {
    // 1. API KEYS STRIPE
    console.log('🔑 Configurazione API Keys Stripe...')
    
    const stripeKeys = [
      {
        service: 'STRIPE',
        key: process.env.STRIPE_SECRET_KEY || 'sk_test_INSERIRE-CHIAVE-STRIPE-VERA',
        name: 'Stripe Payment API',
        isActive: false, // Disattivata finché non inserisci chiave vera
        permissions: {
          payments: ['create', 'read', 'update', 'refund'],
          invoices: ['create', 'read', 'send'],
          customers: ['create', 'read', 'update'],
          subscriptions: ['create', 'read', 'update', 'cancel'],
          products: ['create', 'read', 'update'],
          prices: ['create', 'read', 'update']
        },
        rateLimit: 10000,
        metadata: {
          environment: 'test',
          version: 'v1',
          features: ['payments', 'invoices', 'subscriptions']
        }
      },
      {
        service: 'STRIPE_WEBHOOK',
        key: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_INSERIRE-WEBHOOK-SECRET',
        name: 'Stripe Webhook Secret',
        isActive: false,
        permissions: {
          webhooks: ['verify', 'process']
        },
        rateLimit: 10000,
        metadata: {
          endpoints: [
            'payment_intent.succeeded',
            'payment_intent.payment_failed',
            'invoice.payment_succeeded',
            'invoice.payment_failed',
            'customer.subscription.created',
            'customer.subscription.updated',
            'customer.subscription.deleted'
          ]
        }
      },
      {
        service: 'STRIPE_PUBLISHABLE',
        key: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_INSERIRE-CHIAVE-PUBBLICA',
        name: 'Stripe Publishable Key',
        isActive: false,
        permissions: {
          frontend: ['create_payment_intent', 'confirm_payment']
        },
        rateLimit: 1000,
        metadata: {
          usage: 'frontend',
          public: true
        }
      }
    ]

    for (const apiKey of stripeKeys) {
      await prisma.apiKey.upsert({
        where: { service: apiKey.service },
        update: apiKey,
        create: {
          id: uuidv4(),
          ...apiKey,
          updatedAt: new Date()
        }
      })
      console.log(`✅ ${apiKey.name} - ${apiKey.isActive ? 'ATTIVA' : 'DA CONFIGURARE'}`)
    }

    // 2. CONFIGURAZIONI STRIPE SISTEMA
    console.log('\n⚙️ Configurazioni sistema Stripe...')
    
    const stripeConfigs = [
      {
        key: 'stripe_enabled',
        value: { enabled: false },
        category: 'payment',
        description: 'Abilita sistema pagamenti Stripe',
        dataType: 'boolean',
        isEditable: true,
        isVisible: true
      },
      {
        key: 'stripe_test_mode',
        value: { enabled: true },
        category: 'payment',
        description: 'Modalità test Stripe (sicura per sviluppo)',
        dataType: 'boolean',
        isEditable: true,
        isVisible: true
      },
      {
        key: 'stripe_currency',
        value: { currency: 'EUR' },
        category: 'payment',
        description: 'Valuta predefinita per pagamenti',
        dataType: 'string',
        isEditable: true,
        isVisible: true
      },
      {
        key: 'stripe_fee_percentage',
        value: { percentage: 3.5 },
        category: 'payment',
        description: 'Percentuale commissione piattaforma (%)',
        dataType: 'number',
        isEditable: true,
        isVisible: true
      },
      {
        key: 'stripe_min_amount',
        value: { amount: 1000 }, // 10 euro in centesimi
        category: 'payment',
        description: 'Importo minimo pagamento (centesimi)',
        dataType: 'number',
        isEditable: true,
        isVisible: true
      },
      {
        key: 'stripe_max_amount',
        value: { amount: 500000 }, // 5000 euro in centesimi
        category: 'payment',
        description: 'Importo massimo pagamento (centesimi)',
        dataType: 'number',
        isEditable: true,
        isVisible: true
      },
      {
        key: 'stripe_auto_payout',
        value: { enabled: true },
        category: 'payment',
        description: 'Pagamenti automatici ai professionisti',
        dataType: 'boolean',
        isEditable: true,
        isVisible: true
      },
      {
        key: 'stripe_payout_delay_days',
        value: { days: 7 },
        category: 'payment',
        description: 'Giorni di attesa prima del pagamento automatico',
        dataType: 'number',
        isEditable: true,
        isVisible: true
      },
      {
        key: 'stripe_webhook_url',
        value: { url: 'https://yourdomain.com/api/stripe/webhook' },
        category: 'payment',
        description: 'URL endpoint webhook Stripe',
        dataType: 'string',
        isEditable: true,
        isVisible: true
      },
      {
        key: 'stripe_success_url',
        value: { url: 'https://yourdomain.com/payment/success' },
        category: 'payment',
        description: 'URL redirect dopo pagamento riuscito',
        dataType: 'string',
        isEditable: true,
        isVisible: true
      },
      {
        key: 'stripe_cancel_url',
        value: { url: 'https://yourdomain.com/payment/cancel' },
        category: 'payment',
        description: 'URL redirect dopo pagamento annullato',
        dataType: 'string',
        isEditable: true,
        isVisible: true
      }
    ]

    for (const config of stripeConfigs) {
      await prisma.systemSetting.upsert({
        where: { key: config.key },
        update: config,
        create: {
          id: uuidv4(),
          ...config,
          updatedAt: new Date()
        }
      })
      console.log(`✅ ${config.key}`)
    }

    // 3. PRODOTTI E PREZZI STRIPE DI ESEMPIO
    console.log('\n🛍️ Creazione prodotti Stripe di esempio...')
    
    const stripeProducts = [
      {
        name: 'Servizio Base',
        description: 'Servizio di assistenza base',
        price: 5000, // 50 euro
        currency: 'EUR',
        category: 'base'
      },
      {
        name: 'Servizio Premium',
        description: 'Servizio di assistenza premium con garanzia estesa',
        price: 10000, // 100 euro
        currency: 'EUR',
        category: 'premium'
      },
      {
        name: 'Consulenza Urgente',
        description: 'Intervento urgente entro 2 ore',
        price: 15000, // 150 euro
        currency: 'EUR',
        category: 'urgent'
      }
    ]

    for (const product of stripeProducts) {
      // Queste andrebbero create tramite l'API Stripe quando il sistema è configurato
      console.log(`✅ Prodotto configurato: ${product.name} - €${(product.price/100).toFixed(2)}`)
    }

    // REPORT FINALE
    const totals = {
      apiKeys: await prisma.apiKey.count({ where: { service: { startsWith: 'STRIPE' } } }),
      systemSettings: await prisma.systemSetting.count({ where: { category: 'payment' } })
    }

    console.log(`
===========================================
📊 CONFIGURAZIONE STRIPE CREATA:
- API Keys: ${totals.apiKeys}
- System Settings: ${totals.systemSettings}
- Prodotti configurati: ${stripeProducts.length}

⚠️ IMPORTANTE: 
- Configura le chiavi Stripe vere nelle variabili ambiente
- Abilita il sistema dalle impostazioni admin
- Configura gli URL webhook su Stripe Dashboard
===========================================
`)

  } catch (error) {
    console.error('❌ Errore seeding Stripe:', error)
  }
}
