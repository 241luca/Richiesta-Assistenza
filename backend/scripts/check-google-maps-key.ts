/**
 * 🔍 CHECK GOOGLE MAPS API KEY
 * 
 * Script per verificare lo stato della chiave Google Maps nel database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkGoogleMapsKey() {
  try {
    console.log('🔍 Controllo Google Maps API Key nel database...\n');

    // Recupera il record dal database
    const apiKey = await prisma.apiKey.findUnique({
      where: { service: 'GOOGLE_MAPS' }
    });

    if (!apiKey) {
      console.error('❌ ERRORE: Record GOOGLE_MAPS non trovato nel database!');
      console.log('\n📝 Esegui il seed del database:');
      console.log('   npx prisma db seed');
      process.exit(1);
    }

    console.log('✅ Record trovato nel database:');
    console.log('━'.repeat(80));
    console.log(`   ID: ${apiKey.id}`);
    console.log(`   Service: ${apiKey.service}`);
    console.log(`   Name: ${apiKey.name || 'N/A'}`);
    console.log(`   Active: ${apiKey.isActive ? '✅' : '❌'}`);
    console.log(`   Created: ${apiKey.createdAt}`);
    console.log(`   Updated: ${apiKey.updatedAt}`);
    console.log('━'.repeat(80));

    // Controlla il campo 'key'
    const key = apiKey.key;
    const value = (apiKey as any).value;

    console.log('\n🔑 Analisi chiave API:');
    console.log('━'.repeat(80));
    
    console.log(`\n1️⃣  Campo 'key':`);
    console.log(`   Lunghezza: ${key?.length || 0} caratteri`);
    console.log(`   Prefisso: ${key?.substring(0, 20) || 'VUOTO'}...`);
    console.log(`   Contiene ':': ${key?.includes(':') ? '⚠️  SÌ (probabilmente hashata/criptata)' : '✅ NO'}`);
    
    if (value) {
      console.log(`\n2️⃣  Campo 'value' (se presente):`);
      console.log(`   Lunghezza: ${value?.length || 0} caratteri`);
      console.log(`   Prefisso: ${value?.substring(0, 20) || 'VUOTO'}...`);
      console.log(`   Contiene ':': ${value?.includes(':') ? '⚠️  SÌ (probabilmente hashata/criptata)' : '✅ NO'}`);
    }

    console.log('\n━'.repeat(80));

    // Validazione formato
    const rawKey = value || key;
    
    console.log('\n🎯 DIAGNOSI:');
    console.log('━'.repeat(80));

    if (!rawKey) {
      console.log('❌ PROBLEMA: La chiave è VUOTA!');
      console.log('\n💡 SOLUZIONE: Aggiorna con una vera Google Maps API key');
    } else if (rawKey.includes(':')) {
      console.log('❌ PROBLEMA: La chiave è HASHATA/CRIPTATA!');
      console.log(`   Valore attuale: ${rawKey.substring(0, 40)}...`);
      console.log('\n💡 SOLUZIONE: La chiave deve essere in PLAIN TEXT');
      console.log('   Una vera Google Maps API key inizia con: AIzaSy...');
    } else if (rawKey.startsWith('AIzaSy')) {
      console.log('✅ FORMATO CORRETTO! La chiave sembra valida');
      console.log(`   Prefisso: ${rawKey.substring(0, 15)}...`);
    } else if (rawKey.includes('PLACEHOLDER') || rawKey.includes('DEV_')) {
      console.log('⚠️  PROBLEMA: La chiave è un PLACEHOLDER di sviluppo');
      console.log(`   Valore: ${rawKey}`);
      console.log('\n💡 SOLUZIONE: Sostituisci con una vera Google Maps API key');
    } else {
      console.log('⚠️  ATTENZIONE: Formato chiave non riconosciuto');
      console.log(`   Prefisso: ${rawKey.substring(0, 20)}...`);
      console.log('   Le chiavi Google Maps solitamente iniziano con "AIzaSy"');
    }

    console.log('━'.repeat(80));

    console.log('\n📋 PROSSIMI PASSI:\n');
    console.log('Se la chiave NON è corretta, aggiornala con:');
    console.log('');
    console.log('  export GOOGLE_MAPS_API_KEY="AIzaSy_TUA_CHIAVE_VERA_QUI"');
    console.log('  npx ts-node backend/scripts/update-google-maps-key-direct.ts');
    console.log('');

  } catch (error) {
    console.error('❌ ERRORE:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui
checkGoogleMapsKey();
