const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function fixGoogleMapsKey() {
  try {
    console.log('🔧 Controllo e sistemo la chiave Google Maps...\n');
    
    // La chiave Google Maps
    const googleMapsApiKey = 'AIzaSyCsBYVJ4IcfcK92UehJ2iqTH2tmJv6Z4Bg';
    
    // Prima vediamo cosa c'è nel database per Google Maps
    const existingRecords = await prisma.apiKey.findMany({
      where: {
        OR: [
          { service: 'GOOGLE_MAPS' },
          { key: googleMapsApiKey },
          { service: 'google_calendar' }  // escludiamo questo
        ]
      }
    });
    
    console.log(`Trovati ${existingRecords.length} record correlati:\n`);
    
    // Mostriamo cosa c'è
    existingRecords.forEach(record => {
      if (record.service !== 'google_calendar') {
        console.log(`📌 Record trovato:`);
        console.log(`   ID: ${record.id}`);
        console.log(`   Key: ${record.key}`);
        console.log(`   Service: ${record.service}`);
        console.log(`   Name: ${record.name}`);
        console.log('');
      }
    });
    
    // Se c'è il record con la chiave nel campo key ma service sbagliato
    const wrongRecord = existingRecords.find(r => r.key === googleMapsApiKey);
    
    if (wrongRecord) {
      console.log('✅ La chiave Google Maps è già presente nel database');
      console.log('   È salvata nel campo "key"');
      console.log('   Service:', wrongRecord.service);
      
      // Se il service non è GOOGLE_MAPS, aggiorniamolo
      if (wrongRecord.service !== 'GOOGLE_MAPS') {
        console.log('\n⚠️ Il service non è corretto, lo aggiorno...');
        await prisma.apiKey.update({
          where: { id: wrongRecord.id },
          data: {
            service: 'GOOGLE_MAPS',
            name: 'Google Maps API Key',
            isActive: true
          }
        });
        console.log('✅ Service aggiornato a GOOGLE_MAPS');
      }
      
      console.log('\n✅ CONFIGURAZIONE GOOGLE MAPS CORRETTA!');
      console.log('   La chiave è pronta per essere usata.');
    } else {
      console.log('❌ Non trovo la chiave Google Maps nel database');
      console.log('   Potrebbe essere necessario aggiungerla manualmente.');
    }
    
    // Verifichiamo lo stato finale
    console.log('\n📊 STATO FINALE:');
    const finalRecord = await prisma.apiKey.findFirst({
      where: { 
        OR: [
          { service: 'GOOGLE_MAPS' },
          { key: googleMapsApiKey }
        ]
      }
    });
    
    if (finalRecord) {
      console.log('✅ Google Maps configurato:');
      console.log(`   Key (chiave API): ${finalRecord.key.substring(0, 10)}...`);
      console.log(`   Service: ${finalRecord.service}`);
      console.log(`   Active: ${finalRecord.isActive}`);
    } else {
      console.log('⚠️ Nessuna configurazione Google Maps trovata');
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixGoogleMapsKey();
