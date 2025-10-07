const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');
const prisma = new PrismaClient();

async function createGoogleMapsKey() {
  console.log('\n🗺️  CREAZIONE CHIAVE GOOGLE MAPS\n');
  console.log('='.repeat(60));
  
  try {
    // Verifica che non esista già
    const existing = await prisma.apiKey.findUnique({
      where: { service: 'GOOGLE_MAPS' }
    });
    
    if (existing) {
      console.log('⚠️  Una chiave GOOGLE_MAPS esiste già!');
      console.log('   ID:', existing.id);
      console.log('   Name:', existing.name);
      console.log('   isActive:', existing.isActive);
      console.log('\n   Se vuoi aggiornarla, eliminala prima da Prisma Studio.');
      await prisma.$disconnect();
      return;
    }
    
    console.log('📝 Inserisci la tua chiave API Google Maps:');
    console.log('   (formato: AIza... oppure premi INVIO per usare quella di esempio)\n');
    
    // Leggi da stdin
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('Chiave Google Maps API: ', async (apiKeyInput) => {
      readline.close();
      
      const apiKey = apiKeyInput.trim();
      
      if (!apiKey) {
        console.log('\n❌ Nessuna chiave inserita. Operazione annullata.');
        await prisma.$disconnect();
        return;
      }
      
      // Verifica formato base
      if (!apiKey.startsWith('AIza')) {
        console.log('\n⚠️  ATTENZIONE: La chiave non inizia con "AIza"');
        console.log('   Le chiavi Google Maps solitamente hanno questo formato.');
        console.log('   Procedo comunque...\n');
      }
      
      // Crea la chiave
      const newKey = await prisma.apiKey.create({
        data: {
          id: `google_maps_key_${Date.now()}`,
          key: apiKey,
          name: 'Google Maps API Key',
          service: 'GOOGLE_MAPS',
          isActive: true,
          rateLimit: 1000,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log('\n✅ CHIAVE GOOGLE MAPS CREATA CON SUCCESSO!');
      console.log('='.repeat(60));
      console.log('ID:', newKey.id);
      console.log('Service:', newKey.service);
      console.log('Name:', newKey.name);
      console.log('isActive:', newKey.isActive);
      console.log('Key (primi 20 char):', newKey.key.substring(0, 20) + '...');
      console.log('='.repeat(60));
      console.log('\n🎉 TUTTO PRONTO!');
      console.log('   1. Riavvia il backend: npm run dev');
      console.log('   2. Ricarica il frontend (F5)');
      console.log('   3. Le mappe dovrebbero funzionare!\n');
      
      await prisma.$disconnect();
    });
    
  } catch (error) {
    console.error('\n❌ ERRORE:', error.message);
    
    if (error.code === 'P2002') {
      console.log('\n   Violazione UNIQUE constraint.');
      console.log('   Probabilmente esiste già una chiave con service="GOOGLE_MAPS"');
      console.log('   Controlla in Prisma Studio.');
    }
    
    await prisma.$disconnect();
  }
}

createGoogleMapsKey();
