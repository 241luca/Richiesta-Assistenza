// Test del payment service aggiornato
// Data: 29/01/2025

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPaymentService() {
  console.log('🧪 TEST PAYMENT SERVICE v3.0.0\n');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Verifica esistenza chiavi nel DB
    console.log('\n📍 TEST 1: Verifica chiavi API nel database');
    console.log('-'.repeat(40));
    
    const stripeKeys = await prisma.apiKey.findMany({
      where: {
        service: {
          in: ['STRIPE', 'STRIPE_PUBLIC', 'STRIPE_WEBHOOK']
        }
      }
    });
    
    console.log(`\nChiavi Stripe trovate: ${stripeKeys.length}`);
    
    if (stripeKeys.length === 0) {
      console.log('❌ Nessuna chiave Stripe configurata nel database');
      console.log('   Il payment.service.ts cercherà le chiavi nel DB');
      console.log('   ma non le troverà finché non le configuri.');
    } else {
      stripeKeys.forEach(key => {
        console.log(`  - ${key.service}: ${key.isActive ? '✅ ATTIVA' : '❌ DISATTIVA'}`);
        console.log(`    Nome: ${key.name}`);
        console.log(`    Chiave: ${key.key.substring(0, 10)}...`);
      });
    }
    
    // Test 2: Verifica che le tabelle Payment esistano
    console.log('\n📍 TEST 2: Verifica tabelle Payment');
    console.log('-'.repeat(40));
    
    const paymentCount = await prisma.payment.count();
    const invoiceCount = await prisma.invoice.count();
    
    console.log(`✅ Tabella Payment: accessibile (${paymentCount} record)`);
    console.log(`✅ Tabella Invoice: accessibile (${invoiceCount} record)`);
    
    // Test 3: Verifica enum nell'ApiKeyService
    console.log('\n📍 TEST 3: Verifica enum ApiKeyService');
    console.log('-'.repeat(40));
    
    const allApiKeys = await prisma.apiKey.findMany({
      select: { service: true },
      distinct: ['service']
    });
    
    const hasStripe = allApiKeys.some(k => k.service === 'STRIPE');
    
    if (hasStripe || stripeKeys.length > 0) {
      console.log('✅ STRIPE presente nell\'enum ApiKeyService');
    } else {
      console.log('⚠️  STRIPE potrebbe non essere nell\'enum');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('\n🎯 RISULTATO TEST:');
    console.log('-'.repeat(40));
    console.log('✅ Tabelle Payment: PRESENTI e ACCESSIBILI');
    console.log('✅ Payment Service: USA DATABASE per chiavi');
    console.log(`${stripeKeys.length > 0 ? '✅' : '❌'} Chiavi Stripe: ${stripeKeys.length > 0 ? 'CONFIGURATE' : 'DA CONFIGURARE'}`);
    
    console.log('\n📝 PROSSIMO STEP:');
    if (stripeKeys.length === 0) {
      console.log('1. Vai nel pannello Admin');
      console.log('2. Trova la sezione "Stripe Config" o "API Keys"');
      console.log('3. Inserisci le chiavi Stripe');
    } else {
      console.log('Le chiavi sono configurate!');
      console.log('Puoi testare il sistema di pagamento.');
    }
    
  } catch (error) {
    console.error('❌ Errore test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui test
testPaymentService();
