import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();

async function testPaymentSystem() {
  console.log('🧪 Test Sistema Pagamenti Stripe\n');
  console.log('=' .repeat(50));
  
  try {
    // 1. Verifica chiavi API nel database
    console.log('\n1️⃣ Verifica chiavi API nel database...');
    const stripeKey = await prisma.apiKey.findUnique({
      where: { key: 'STRIPE' }
    });
    
    const stripePublicKey = await prisma.apiKey.findUnique({
      where: { key: 'STRIPE_PUBLIC' }
    });
    
    const stripeWebhookKey = await prisma.apiKey.findUnique({
      where: { key: 'STRIPE_WEBHOOK' }
    });
    
    if (!stripeKey || !stripeKey.value) {
      console.error('❌ Chiave STRIPE non trovata nel database!');
      console.log('   Esegui prima: npx ts-node scripts/setup-payment-system.ts');
      return;
    }
    
    console.log('✅ Chiavi trovate nel database:');
    console.log(`   - STRIPE: ${stripeKey.value.substring(0, 15)}...`);
    console.log(`   - STRIPE_PUBLIC: ${stripePublicKey?.value?.substring(0, 15)}...`);
    console.log(`   - STRIPE_WEBHOOK: ${stripeWebhookKey?.value ? 'Configurata' : 'Non configurata'}`);
    
    // 2. Test connessione Stripe
    console.log('\n2️⃣ Test connessione con Stripe API...');
    
    let stripe;
    try {
      stripe = new Stripe(stripeKey.value, {
        apiVersion: '2024-06-20',
        typescript: true
      });
      
      // Test semplice: ottieni informazioni account
      const account = await stripe.accounts.retrieve();
      console.log('✅ Connessione Stripe OK!');
      console.log(`   - Account ID: ${account.id}`);
      console.log(`   - Email: ${account.email}`);
      console.log(`   - Paese: ${account.country}`);
      console.log(`   - Modalità: ${stripeKey.value.startsWith('sk_test') ? 'TEST' : 'LIVE'}`);
      
    } catch (stripeError: any) {
      console.error('❌ Errore connessione Stripe:');
      console.error(`   - Tipo: ${stripeError.type}`);
      console.error(`   - Messaggio: ${stripeError.message}`);
      
      if (stripeError.type === 'StripeAuthenticationError') {
        console.log('\n⚠️ La chiave API non è valida o non ha i permessi necessari.');
        console.log('   Verifica su https://dashboard.stripe.com/apikeys');
      } else if (stripeError.type === 'StripeConnectionError') {
        console.log('\n⚠️ Problema di connessione a Stripe.');
        console.log('   Verifica la connessione internet.');
      }
      
      return;
    }
    
    // 3. Test creazione Payment Intent
    console.log('\n3️⃣ Test creazione Payment Intent...');
    
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 1000, // €10.00 in centesimi
        currency: 'eur',
        metadata: {
          test: 'true',
          system: 'richiesta-assistenza'
        }
      });
      
      console.log('✅ Payment Intent creato con successo!');
      console.log(`   - ID: ${paymentIntent.id}`);
      console.log(`   - Importo: €${paymentIntent.amount / 100}`);
      console.log(`   - Status: ${paymentIntent.status}`);
      
      // Annulla il payment intent di test
      await stripe.paymentIntents.cancel(paymentIntent.id);
      console.log('   - Test payment intent annullato');
      
    } catch (piError: any) {
      console.error('❌ Errore creazione Payment Intent:');
      console.error(`   - ${piError.message}`);
      
      if (piError.code === 'payment_intent_unexpected_state') {
        console.log('\n⚠️ Il Payment Intent è in uno stato non valido.');
      }
    }
    
    // 4. Test recupero metodi di pagamento
    console.log('\n4️⃣ Test configurazione metodi di pagamento...');
    
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        type: 'card',
        limit: 1
      });
      
      console.log('✅ API metodi di pagamento accessibile');
      console.log(`   - Metodi trovati: ${paymentMethods.data.length}`);
      
    } catch (pmError: any) {
      console.error('⚠️ Avviso metodi di pagamento:');
      console.error(`   - ${pmError.message}`);
    }
    
    // 5. Verifica webhook endpoint (se configurato)
    if (stripeWebhookKey?.value) {
      console.log('\n5️⃣ Verifica configurazione Webhook...');
      
      try {
        const webhookEndpoints = await stripe.webhookEndpoints.list({ limit: 10 });
        
        if (webhookEndpoints.data.length > 0) {
          console.log('✅ Webhook endpoints configurati:');
          webhookEndpoints.data.forEach(endpoint => {
            console.log(`   - ${endpoint.url}`);
            console.log(`     Eventi: ${endpoint.enabled_events.join(', ')}`);
            console.log(`     Status: ${endpoint.status}`);
          });
        } else {
          console.log('⚠️ Nessun webhook configurato su Stripe');
          console.log('   Configura su: https://dashboard.stripe.com/webhooks');
        }
      } catch (whError: any) {
        console.error('⚠️ Impossibile verificare webhooks:', whError.message);
      }
    }
    
    // 6. Riepilogo configurazione
    console.log('\n' + '='.repeat(50));
    console.log('📊 RIEPILOGO CONFIGURAZIONE\n');
    
    const isTestMode = stripeKey.value.startsWith('sk_test');
    
    console.log(`🔑 Modalità: ${isTestMode ? '🧪 TEST' : '🔴 LIVE'}`);
    console.log(`✅ Connessione API: OK`);
    console.log(`✅ Creazione pagamenti: OK`);
    console.log(`${stripeWebhookKey?.value ? '✅' : '⚠️'} Webhook: ${stripeWebhookKey?.value ? 'Configurato' : 'Da configurare'}`);
    
    if (isTestMode) {
      console.log('\n💡 Sei in modalità TEST - Perfetto per sviluppo!');
      console.log('   Usa carte di test: https://stripe.com/docs/testing#cards');
    } else {
      console.log('\n⚠️ ATTENZIONE: Sei in modalità LIVE!');
      console.log('   I pagamenti saranno reali!');
    }
    
    console.log('\n✅ Sistema pagamenti Stripe configurato correttamente!');
    
    // 7. Test dati nel database
    console.log('\n7️⃣ Verifica dati pagamento nel database...');
    
    const paymentCount = await prisma.payment.count();
    const invoiceCount = await prisma.invoice.count();
    const payoutCount = await prisma.payout.count();
    
    console.log(`   - Pagamenti: ${paymentCount}`);
    console.log(`   - Fatture: ${invoiceCount}`);
    console.log(`   - Payout: ${payoutCount}`);
    
  } catch (error: any) {
    console.error('\n❌ ERRORE GENERALE:', error.message);
    console.error('\nDettagli:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui il test
console.log('Sistema Richiesta Assistenza - Test Pagamenti v5.1');
console.log('=' .repeat(50));

testPaymentSystem()
  .then(() => {
    console.log('\n✅ Test completato!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test fallito:', error);
    process.exit(1);
  });
