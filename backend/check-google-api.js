const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkGoogleMapsAPI() {
  try {
    console.log('🔍 Controllando API key Google Maps nel database...');
    
    const apiKey = await prisma.apiKey.findUnique({
      where: { service: 'GOOGLE_MAPS' }
    });
    
    if (apiKey) {
      console.log('✅ API key trovata:');
      console.log('- Service:', apiKey.service);
      console.log('- Key:', apiKey.key ? `${apiKey.key.substring(0, 10)}...` : 'NULL');
      console.log('- Active:', apiKey.isActive);
      console.log('- Created:', apiKey.createdAt);
    } else {
      console.log('❌ API key Google Maps NON trovata nel database');
      
      // Controlla se ci sono altre API keys
      const allKeys = await prisma.apiKey.findMany();
      console.log('\n📋 Tutte le API keys presenti:');
      allKeys.forEach(key => {
        console.log(`- ${key.service}: ${key.key ? key.key.substring(0, 10) + '...' : 'NULL'} (${key.isActive ? 'ATTIVA' : 'INATTIVA'})`);
      });
    }
  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkGoogleMapsAPI();
