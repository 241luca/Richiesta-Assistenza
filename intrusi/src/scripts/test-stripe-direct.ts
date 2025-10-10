import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();

async function testStripeDirectly() {
  console.log('🧪 Test diretto delle chiavi Stripe\n');
  console.log('=' .repeat(50));
  
  try {
    // Recupera le chiavi dal database
    // Prova prima con key STRIPE, poi con service stripe
    let stripeKey = await prisma.apiKey.findUnique({
      where: { key: 'STRIPE' }
    });
    
    if (!stripeKey) {
      // Prova a cercare per service
      stripeKey = await prisma.apiKey.findFirst({
        where: { 
          service: 'stripe',
          key: {
            contains: 'stripe',
            mode: 'insensitive'
          }
        }
      });
    }
    
    if (!stripeKey) {
      // Ultima prova: cerca qualsiasi chiave che contiene stripe e sk_
      stripeKey = await prisma.apiKey.findFirst({
        where: {
          OR: [
            { service: { equals: 'stripe', mode: 'insensitive' } },
            { key: { contains: 'stripe', mode: 'insensitive' } }
          ],
          value: { startsWith: 'sk_' }
        }
      });
    }
    
    if (!stripeKey) {
      console.error('❌ Chiave STRIPE non trovata!');
      return;
    }
    
    console.log('🔑 Chiave trovata nel database');
    console.log(`   Tipo: ${stripeKey.value.startsWith('sk_test') ? 'TEST' : 'LIVE'}`);
    console.log(`   Primi caratteri: ${stripeKey.value.substring(0, 25)}...`);
    
    // Test connessione Stripe
    console.log('\n📡 Test connessione Stripe...\n');
    
    const stripe = new Stripe(stripeKey.value, {
      apiVersion: '2024-06-20',
      typescript: true
    });
    
    try {
      // Prova a recuperare il saldo dell'account
      const balance = await stripe.balance.retrieve();
      
      console.log('✅ CONNESSIONE RIUSCITA!');
      console.log('\n💰 Saldo account:');
      balance.available.forEach(b => {
        console.log(`   ${b.currency.toUpperCase()}: ${b.amount / 100}`);
      });
      
      // Prova a creare un customer di test
      console.log('\n👤 Test creazione cliente...');
      const customer = await stripe.customers.create({
        email: 'test@example.com',
        description: 'Test customer - Richiesta Assistenza v5.1'
      });
      
      console.log('✅ Cliente test creato:', customer.id);
      
      // Elimina il cliente di test
      await stripe.customers.del(customer.id);
      console.log('✅ Cliente test eliminato');
      
      console.log('\n🎉 LE CHIAVI STRIPE FUNZIONANO CORRETTAMENTE!');
      
    } catch (stripeError: any) {
      console.error('\n❌ ERRORE STRIPE:');
      console.error(`Tipo: ${stripeError.type}`);
      console.error(`Codice: ${stripeError.code}`);
      console.error(`Messaggio: ${stripeError.message}`);
      
      if (stripeError.type === 'StripeAuthenticationError') {
        console.log('\n🔍 POSSIBILI CAUSE:');
        console.log('1. La chiave non è valida');
        console.log('2. La chiave è stata revocata');
        console.log('3. La chiave non ha i permessi necessari');
        console.log('\n💡 SOLUZIONE:');
        console.log('1. Vai su https://dashboard.stripe.com/apikeys');
        console.log('2. Verifica che la chiave sia attiva');
        console.log('3. Se necessario, crea una nuova chiave');
        console.log('4. Aggiorna la chiave in /admin/api-keys/stripe');
      }
    }
    
  } catch (error: any) {
    console.error('❌ Errore generale:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testStripeDirectly()
  .then(() => {
    console.log('\n✅ Test completato');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test fallito:', error);
    process.exit(1);
  });
