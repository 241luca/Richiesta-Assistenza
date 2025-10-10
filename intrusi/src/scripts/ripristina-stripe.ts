import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function ripristinaStripeOriginale() {
  console.log('🔄 Ripristino chiavi Stripe nel formato originale...\n');
  
  try {
    // Recupera la configurazione unificata
    const unifiedKey = await prisma.apiKey.findUnique({
      where: { key: 'stripe_keys' }
    });
    
    if (!unifiedKey || !unifiedKey.permissions) {
      console.error('❌ Configurazione unificata non trovata');
      return;
    }
    
    const config = unifiedKey.permissions as any;
    
    // Crea le 3 chiavi separate come il sistema le vuole
    console.log('📝 Creazione chiavi separate...');
    
    // 1. STRIPE (secret key)
    await prisma.apiKey.upsert({
      where: { key: 'STRIPE' },
      update: { 
        key: config.secretKey,
        name: 'Stripe Secret Key',
        service: 'STRIPE',
        isActive: true
      },
      create: {
        key: config.secretKey,
        name: 'Stripe Secret Key', 
        service: 'STRIPE',
        rateLimit: 100,
        isActive: true
      }
    });
    console.log('✅ STRIPE (secret key) creata');
    
    // 2. STRIPE_PUBLIC
    await prisma.apiKey.upsert({
      where: { key: 'STRIPE_PUBLIC' },
      update: {
        key: config.publicKey,
        name: 'Stripe Public Key',
        service: 'STRIPE_PUBLIC',
        isActive: true
      },
      create: {
        key: config.publicKey,
        name: 'Stripe Public Key',
        service: 'STRIPE_PUBLIC',
        rateLimit: 100,
        isActive: true
      }
    });
    console.log('✅ STRIPE_PUBLIC creata');
    
    // 3. STRIPE_WEBHOOK
    if (config.webhookSecret) {
      await prisma.apiKey.upsert({
        where: { key: 'STRIPE_WEBHOOK' },
        update: {
          key: config.webhookSecret,
          name: 'Stripe Webhook Secret',
          service: 'STRIPE_WEBHOOK',
          isActive: true
        },
        create: {
          key: config.webhookSecret,
          name: 'Stripe Webhook Secret',
          service: 'STRIPE_WEBHOOK',
          rateLimit: 100,
          isActive: true
        }
      });
      console.log('✅ STRIPE_WEBHOOK creata');
    }
    
    console.log('\n✅ Chiavi Stripe ripristinate nel formato originale!');
    console.log('   Il sistema dovrebbe ora funzionare come prima.');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

ripristinaStripeOriginale();
