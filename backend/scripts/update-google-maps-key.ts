/**
 * 🔑 UPDATE GOOGLE MAPS API KEY
 * 
 * Aggiorna la chiave Google Maps nel database con una chiave reale
 * 
 * IMPORTANTE:
 * - La chiave deve essere in formato plain text (inizia con AIzaSy...)
 * - Non deve essere hashata o criptata
 * - Google Maps API richiede la chiave originale
 * 
 * UTILIZZO:
 * 1. Esporta la variabile d'ambiente:
 *    export GOOGLE_MAPS_API_KEY="AIzaSy_TUA_CHIAVE_QUI"
 * 
 * 2. Esegui lo script:
 *    npx ts-node backend/scripts/update-google-maps-key.ts
 * 
 * 3. Verifica che la chiave sia stata aggiornata:
 *    npx ts-node backend/scripts/show-api-keys.ts
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function updateGoogleMapsKey() {
  try {
    console.log('🔑 Aggiornamento Google Maps API Key...\n');

    // Ottieni la chiave dall'ambiente
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.error('❌ ERRORE: Variabile GOOGLE_MAPS_API_KEY non trovata!');
      console.log('\n📝 UTILIZZO:');
      console.log('   export GOOGLE_MAPS_API_KEY="AIzaSy_TUA_CHIAVE_QUI"');
      console.log('   npx ts-node backend/scripts/update-google-maps-key.ts');
      process.exit(1);
    }

    // Valida il formato della chiave
    if (!apiKey.startsWith('AIzaSy')) {
      console.warn('⚠️  ATTENZIONE: La chiave non inizia con "AIzaSy"');
      console.warn('   Le chiavi Google Maps solitamente iniziano con questo prefisso');
      console.warn('   Vuoi continuare comunque? (Ctrl+C per annullare)\n');
      
      // Aspetta 5 secondi
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log(`✅ Chiave trovata: ${apiKey.substring(0, 20)}...`);
    console.log(`   Lunghezza: ${apiKey.length} caratteri\n`);

    // Aggiorna o crea il record nel database
    const result = await prisma.apiKey.upsert({
      where: { 
        service: 'GOOGLE_MAPS' 
      },
      update: {
        key: apiKey,           // Chiave in plain text
        isActive: true,
        name: 'Google Maps API Key',
        updatedAt: new Date()
      },
      create: {
        id: uuidv4(),
        service: 'GOOGLE_MAPS',
        key: apiKey,
        name: 'Google Maps API Key',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('✅ Chiave aggiornata con successo nel database!');
    console.log(`   ID: ${result.id}`);
    console.log(`   Service: ${result.service}`);
    console.log(`   Active: ${result.isActive}`);
    console.log(`   Updated: ${result.updatedAt}\n`);

    console.log('🎉 COMPLETATO!');
    console.log('\n📋 PROSSIMI PASSI:');
    console.log('   1. Riavvia il backend se è in esecuzione');
    console.log('   2. Riavvia il frontend se è in esecuzione');
    console.log('   3. Testa la geocodifica nella pagina');
    console.log('\n🔍 Verifica la chiave:');
    console.log('   npx ts-node backend/scripts/show-api-keys.ts');

  } catch (error) {
    console.error('❌ ERRORE durante l\'aggiornamento:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui
updateGoogleMapsKey();
