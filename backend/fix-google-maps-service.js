const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixGoogleMapsService() {
  console.log('\n🔧 FIX GOOGLE MAPS SERVICE FIELD\n');
  
  try {
    // Trova la chiave Google Maps (qualsiasi variante)
    console.log('1️⃣ Cercando chiave Google Maps...');
    const googleMapsKey = await prisma.apiKey.findFirst({
      where: {
        OR: [
          { name: { contains: 'Google Maps', mode: 'insensitive' } },
          { name: { contains: 'GOOGLE_MAPS', mode: 'insensitive' } },
          { service: { contains: 'google', mode: 'insensitive' } },
          { service: { contains: 'maps', mode: 'insensitive' } }
        ]
      }
    });
    
    if (!googleMapsKey) {
      console.log('❌ Nessuna chiave Google Maps trovata!');
      console.log('   Devi prima crearla in Prisma Studio.');
      return;
    }
    
    console.log('\n✅ Chiave trovata:');
    console.log('   ID:', googleMapsKey.id);
    console.log('   Name:', googleMapsKey.name);
    console.log('   Service ATTUALE:', `"${googleMapsKey.service}"`);
    console.log('   isActive:', googleMapsKey.isActive);
    console.log('   Key (primi 20):', googleMapsKey.key?.substring(0, 20));
    
    // Verifica se il service è già corretto
    if (googleMapsKey.service === 'GOOGLE_MAPS') {
      console.log('\n✅ Il campo service è già corretto: "GOOGLE_MAPS"');
      console.log('   Non serve fare nulla!');
      return;
    }
    
    // Fix: Aggiorna il service
    console.log('\n2️⃣ Aggiornando service a "GOOGLE_MAPS"...');
    const updated = await prisma.apiKey.update({
      where: { id: googleMapsKey.id },
      data: { service: 'GOOGLE_MAPS' }
    });
    
    console.log('\n✅ AGGIORNAMENTO COMPLETATO!');
    console.log('   Service NUOVO:', `"${updated.service}"`);
    console.log('\n🎉 Ora il sistema dovrebbe trovare la chiave!');
    console.log('   Ricarica il frontend per testare.');
    
  } catch (error) {
    console.error('\n❌ ERRORE:', error.message);
    
    if (error.code === 'P2002') {
      console.log('\n⚠️  C\'è già un\'altra chiave con service="GOOGLE_MAPS"!');
      console.log('   Devi eliminare i duplicati prima.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

fixGoogleMapsService();
