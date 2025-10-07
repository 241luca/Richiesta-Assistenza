const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function emergencyRestore() {
  console.log('\n🚨 RIPRISTINO EMERGENZA - GOOGLE CALENDAR\n');
  console.log('='.repeat(60));
  
  try {
    // Trova la chiave che abbiamo rotto
    const brokenKey = await prisma.apiKey.findUnique({
      where: { service: 'GOOGLE_MAPS' }
    });
    
    if (brokenKey && brokenKey.name === 'Google Calendar OAuth Credentials') {
      console.log('✅ Trovata chiave Google Calendar trasformata per errore...');
      console.log('   Ripristino in corso...\n');
      
      // Ripristina a google_calendar
      await prisma.apiKey.update({
        where: { id: brokenKey.id },
        data: { service: 'google_calendar' }
      });
      
      console.log('✅ Chiave Google Calendar RIPRISTINATA!');
      console.log('   service: "google_calendar"');
      console.log('   name: "Google Calendar OAuth Credentials"');
      console.log('\n' + '='.repeat(60));
    } else {
      console.log('⚠️  Situazione diversa dal previsto...');
      console.log('   Nessun ripristino necessario.');
    }
    
    // Verifica finale
    console.log('\n📊 STATO FINALE APIKEY:\n');
    const allKeys = await prisma.apiKey.findMany({
      select: { id: true, service: true, name: true, isActive: true }
    });
    
    allKeys.forEach((k, i) => {
      console.log(`   ${i+1}. ${k.service.padEnd(20)} - ${k.name} (${k.isActive ? 'ATTIVA' : 'inattiva'})`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ RIPRISTINO COMPLETATO!');
    console.log('   Ora puoi inserire manualmente la chiave Google Maps.');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ ERRORE:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

emergencyRestore();
