#!/usr/bin/env ts-node

/**
 * Test FINALE dopo correzioni webhook
 */

import { prisma } from '../src/config/database';

async function testFinale() {
  console.log('\n🎯 TEST FINALE DOPO CORREZIONI');
  console.log('=================================\n');
  
  // 1. Conta messaggi
  const total = await prisma.whatsAppMessage.count();
  const inbound = await prisma.whatsAppMessage.count({ where: { direction: 'inbound' }});
  const incoming = await prisma.whatsAppMessage.count({ where: { direction: 'incoming' }});
  
  console.log('📊 STATO DATABASE:');
  console.log(`   Totale messaggi: ${total}`);
  console.log(`   - Inbound: ${inbound}`);
  console.log(`   - Incoming: ${incoming}`);
  
  if (total === 0) {
    console.log('\n⚠️  Database ancora vuoto.');
    console.log('\n📌 COSA FARE:');
    console.log('1. Riavvia il backend (Ctrl+C e npm run dev)');
    console.log('2. Invia un messaggio WhatsApp');
    console.log('3. Controlla i log del backend');
    console.log('4. Riesegui questo test');
  } else {
    console.log('\n✅ CI SONO MESSAGGI!');
    
    // Mostra ultimi 3
    const messages = await prisma.whatsAppMessage.findMany({
      take: 3,
      orderBy: { timestamp: 'desc' }
    });
    
    console.log('\n📱 Ultimi messaggi:');
    for (const msg of messages) {
      console.log(`\n[${new Date(msg.timestamp).toLocaleTimeString()}]`);
      console.log(`   📱 Numero: ${msg.phoneNumber}`);
      console.log(`   💬 Testo: ${msg.message?.substring(0, 60)}`);
      console.log(`   🔄 Direzione: ${msg.direction}`);
    }
    
    console.log('\n🎉 IL SISTEMA FUNZIONA!');
    console.log('\n📌 Vai su: http://localhost:5193/admin/whatsapp/dashboard');
    console.log('   Dovresti vedere i messaggi nella dashboard!');
  }
  
  process.exit(0);
}

testFinale().catch(console.error);
