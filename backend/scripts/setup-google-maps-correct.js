const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function setupGoogleMapsKey() {
  try {
    console.log('🔑 Setup Google Maps API Key...\n');
    
    // Prima controlliamo se esiste già
    const existing = await prisma.apiKey.findUnique({
      where: { key: 'google_maps_key' }
    });
    
    if (existing) {
      console.log('✅ Google Maps key già presente:');
      console.log('   Key: google_maps_key');
      console.log('   Service: ' + existing.service);
      console.log('   Value: ' + (existing.value ? '***' + existing.value.slice(-4) : 'NON IMPOSTATA'));
      console.log('\nPer aggiornarla, usa il pannello admin o modifica direttamente nel database.');
    } else {
      // Creiamo la struttura corretta per Google Maps
      const created = await prisma.apiKey.create({
        data: {
          id: require('crypto').randomUUID(),
          key: 'google_maps_key',  // NOME CORRETTO secondo documentazione
          name: 'Google Maps API Key',
          service: 'GOOGLE_MAPS',
          value: null,  // Da impostare manualmente
          permissions: JSON.stringify({
            services: ['maps', 'places', 'geocoding', 'directions'],
            restrictions: '*.localhost'
          }),
          isActive: true,
          rateLimit: 1000
        }
      });
      
      console.log('✅ Struttura Google Maps API Key creata!');
      console.log('\n⚠️ ORA DEVI:');
      console.log('1. Aprire Prisma Studio: npx prisma studio');
      console.log('2. Cercare la tabella ApiKey');
      console.log('3. Trovare la riga con key = "google_maps_key"');
      console.log('4. Inserire la tua chiave API nel campo "value"');
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setupGoogleMapsKey();
