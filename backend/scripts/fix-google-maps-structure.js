const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function fixGoogleMapsKeyStructure() {
  try {
    console.log('🔧 Sistemo la struttura della chiave Google Maps...\n');
    
    // La chiave che è nel campo sbagliato
    const apiKeyValue = 'AIzaSyCsBYVJ4IcfcK92UehJ2iqTH2tmJv6Z4Bg';
    
    // Prima troviamo il record con struttura sbagliata
    const wrongRecord = await prisma.apiKey.findUnique({
      where: { key: apiKeyValue }
    });
    
    if (wrongRecord) {
      console.log('❌ Trovato record con struttura SBAGLIATA:');
      console.log('   La chiave API è nel campo "key" invece che in "value"\n');
      
      // Eliminiamo il record sbagliato
      await prisma.apiKey.delete({
        where: { key: apiKeyValue }
      });
      console.log('🗑️ Record vecchio eliminato\n');
    }
    
    // Verifichiamo se esiste già un record con la struttura corretta
    const existingCorrect = await prisma.apiKey.findUnique({
      where: { key: 'google_maps_key' }
    });
    
    if (existingCorrect) {
      console.log('✅ Esiste già un record con struttura corretta');
      console.log('   Aggiorno il valore della chiave...\n');
      
      await prisma.apiKey.update({
        where: { key: 'google_maps_key' },
        data: { 
          value: apiKeyValue,
          service: 'GOOGLE_MAPS',
          name: 'Google Maps API Key',
          isActive: true
        }
      });
    } else {
      // Creiamo il record con struttura CORRETTA
      await prisma.apiKey.create({
        data: {
          id: require('crypto').randomUUID(),
          key: 'google_maps_key',  // IDENTIFICATIVO corretto secondo la documentazione
          name: 'Google Maps API Key',
          service: 'GOOGLE_MAPS',
          value: apiKeyValue,  // La CHIAVE API va qui!
          permissions: JSON.stringify({
            services: ['maps', 'places', 'geocoding', 'directions'],
            restrictions: '*.localhost'
          }),
          isActive: true,
          rateLimit: 1000
        }
      });
      console.log('✅ Creato nuovo record con struttura corretta\n');
    }
    
    console.log('✅ CHIAVE GOOGLE MAPS SISTEMATA!');
    console.log('\n📊 Configurazione finale:');
    console.log('   key (identificativo): google_maps_key');
    console.log('   service: GOOGLE_MAPS');
    console.log('   value (chiave API): ***' + apiKeyValue.slice(-4));
    console.log('   isActive: true');
    console.log('\n⚠️ NOTA: Il frontend potrebbe dover essere aggiornato');
    console.log('   per cercare "google_maps_key" invece di "GOOGLE_MAPS"');
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
    if (error.code === 'P2002') {
      console.log('\n⚠️ Sembra che ci sia un conflitto con il campo "service"');
      console.log('   Potrebbe esserci già un altro record con service="GOOGLE_MAPS"');
    }
  } finally {
    await prisma.$disconnect();
  }
}

fixGoogleMapsKeyStructure();
