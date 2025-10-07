import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();

async function testStripeUnified() {
  console.log('🧪 Test Stripe con Formato Unificato\n');
  console.log('=' .repeat(50));
  
  try {
    // 1. Recupera le chiavi Stripe dal formato unificato
    console.log('1️⃣ Recupero chiavi dal database...');
    
    const apiKey = await prisma.$queryRaw<any[]>`
      SELECT * FROM "ApiKey" WHERE "key" = 'stripe_keys'
    `;
    
    if (!apiKey || apiKey.length === 0) {
      console.error('❌ Chiavi Stripe non trovate!');
      return;
    }
    
    const stripeConfig = apiKey[0];
    const permissions = stripeConfig.permissions;
    
    console.log('✅ Configurazione Stripe trovata:');
    console.log(`   Service: ${stripeConfig.service}`);
    console.log(`   Mode: ${permissions.mode}`);
    console.log(`   Secret Key: ${permissions.secretKey?.substring(0, 25)}...`);
    console.log(`   Public Key: ${permissions.publicKey?.substring(0, 25)}...`);
    console.log(`   Webhook: ${permissions.webhookSecret ? 'Configurato' : 'Non configurato'}`);
    
    // 2. Test connessione con Stripe
    console.log('\n2️⃣ Test connessione Stripe API...');
    
    const stripe = new Stripe(permissions.secretKey, {
      apiVersion: '2024-06-20',
      typescript: true
    });
    
    try {
      // Test: recupera il balance
      const balance = await stripe.balance.retrieve();
      
      console.log('✅ Connessione RIUSCITA!');
      console.log('\n💰 Saldo account:');
      balance.available.forEach(b => {
        console.log(`   ${b.currency.toUpperCase()}: €${b.amount / 100}`);
      });
      
      // Test: crea un cliente di prova
      console.log('\n3️⃣ Test creazione cliente...');
      const customer = await stripe.customers.create({
        email: 'test@richiesta-assistenza.it',
        description: 'Test Cliente - Sistema v5.1',
        metadata: {
          test: 'true',
          version: '5.1.0'
        }
      });
      
      console.log(`✅ Cliente creato: ${customer.id}`);
      
      // Elimina il cliente di test
      await stripe.customers.del(customer.id);
      console.log('✅ Cliente test eliminato');
      
      // 3. Test Payment Intent
      console.log('\n4️⃣ Test Payment Intent...');
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 1000, // €10.00
        currency: 'eur',
        metadata: {
          test: 'true',
          system: 'richiesta-assistenza-v5.1'
        }
      });
      
      console.log(`✅ Payment Intent creato: ${paymentIntent.id}`);
      console.log(`   Amount: €${paymentIntent.amount / 100}`);
      console.log(`   Status: ${paymentIntent.status}`);
      
      // Cancella il payment intent
      await stripe.paymentIntents.cancel(paymentIntent.id);
      console.log('✅ Payment Intent cancellato');
      
    } catch (stripeError: any) {
      console.error('\n❌ Errore Stripe:', stripeError.message);
      return;
    }
    
    // 4. Riepilogo
    console.log('\n' + '=' .repeat(50));
    console.log('🎉 SISTEMA PAGAMENTI FUNZIONANTE!\n');
    console.log('✅ Formato unificato funziona correttamente');
    console.log('✅ Connessione Stripe OK');
    console.log('✅ Creazione pagamenti OK');
    console.log(`✅ Modalità: ${permissions.mode === 'live' ? '🔴 LIVE' : '🧪 TEST'}`);
    
    if (permissions.mode === 'live') {
      console.log('\n⚠️  ATTENZIONE: Sei in modalità LIVE!');
      console.log('   I pagamenti saranno REALI!');
    }
    
  } catch (error: any) {
    console.error('❌ Errore:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testStripeUnified()
  .then(() => {
    console.log('\n✅ Test completato');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test fallito:', error);
    process.exit(1);
  });
