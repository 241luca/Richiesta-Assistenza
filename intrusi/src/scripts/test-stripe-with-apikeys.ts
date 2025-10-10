import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();

async function testStripeKeys() {
  console.log('🧪 Test Chiavi Stripe\n');
  console.log('=' .repeat(50));
  
  try {
    // Query SQL diretta per trovare le chiavi Stripe
    const stripeKeys: any[] = await prisma.$queryRaw`
      SELECT * FROM "ApiKey" 
      WHERE "key" = 'STRIPE' 
      OR "key" = 'STRIPE_PUBLIC'
      OR "key" = 'STRIPE_WEBHOOK'
      OR "service" = 'STRIPE'
      OR "service" = 'stripe'
    `;
    
    console.log(`\n📊 Trovate ${stripeKeys.length} chiavi Stripe:\n`);
    
    // Trova la secret key
    let secretKey = stripeKeys.find(k => 
      k.key === 'STRIPE' || 
      (k.apikeys && k.apikeys.startsWith('sk_'))
    );
    
    if (!secretKey) {
      console.error('❌ Secret Key non trovata!');
      console.log('   Le chiavi trovate sono:');
      stripeKeys.forEach(k => {
        console.log(`   - ${k.key}: ${k.apikeys?.substring(0, 25)}...`);
      });
      return;
    }
    
    const secretKeyValue = secretKey.apikeys;
    console.log(`✅ Secret Key trovata: ${secretKeyValue.substring(0, 25)}...`);
    console.log(`   Modalità: ${secretKeyValue.startsWith('sk_test') ? 'TEST' : 'LIVE'}`);
    
    // Test connessione Stripe
    console.log('\n📡 Test connessione Stripe...\n');
    
    const stripe = new Stripe(secretKeyValue, {
      apiVersion: '2024-06-20',
      typescript: true
    });
    
    try {
      // Test semplice: recupera balance
      const balance = await stripe.balance.retrieve();
      
      console.log('✅ CONNESSIONE STRIPE FUNZIONANTE!');
      console.log('\n💰 Saldo account:');
      balance.available.forEach(b => {
        console.log(`   ${b.currency.toUpperCase()}: €${b.amount / 100}`);
      });
      
      console.log('\n🎉 LE CHIAVI STRIPE SONO VALIDE E FUNZIONANTI!');
      
      // Mostra anche la public key se presente
      const publicKey = stripeKeys.find(k => 
        k.key === 'STRIPE_PUBLIC' || 
        (k.apikeys && k.apikeys.startsWith('pk_'))
      );
      
      if (publicKey) {
        console.log(`\n🔑 Public Key: ${publicKey.apikeys.substring(0, 25)}...`);
      }
      
      // Info webhook
      const webhookKey = stripeKeys.find(k => k.key === 'STRIPE_WEBHOOK');
      if (webhookKey && webhookKey.apikeys && webhookKey.apikeys.startsWith('whsec_')) {
        console.log(`🔗 Webhook Secret configurato`);
      } else {
        console.log('\n⚠️  Webhook Secret non configurato o non valido');
      }
      
    } catch (stripeError: any) {
      console.error('\n❌ ERRORE CONNESSIONE STRIPE:');
      console.error(`   Tipo: ${stripeError.type}`);
      console.error(`   Messaggio: ${stripeError.message}`);
      
      if (stripeError.type === 'StripeAuthenticationError') {
        console.log('\n💡 Possibili soluzioni:');
        console.log('1. Verifica che la chiave sia ancora valida su https://dashboard.stripe.com/apikeys');
        console.log('2. Controlla di aver copiato la chiave corretta');
        console.log('3. Se sei in modalità LIVE, assicurati che l\'account sia attivato');
      }
    }
    
  } catch (error: any) {
    console.error('❌ Errore generale:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testStripeKeys()
  .then(() => {
    console.log('\n✅ Test completato');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test fallito:', error);
    process.exit(1);
  });
