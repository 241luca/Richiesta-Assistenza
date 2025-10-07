// Script per verificare API keys nel database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkApiKeys() {
  console.log('\n🔍 Controllo API Keys nel database...\n');
  
  const apiKeys = await prisma.apiKey.findMany({
    select: {
      id: true,
      service: true,
      key: true,
      isActive: true,
      createdAt: true
    }
  });
  
  console.log(`📊 Trovate ${apiKeys.length} API keys:\n`);
  
  apiKeys.forEach((key, idx) => {
    console.log(`${idx + 1}. Service: ${key.service}`);
    console.log(`   Key: ${key.key.substring(0, 20)}...`);
    console.log(`   Active: ${key.isActive ? '✅' : '❌'}`);
    console.log(`   Created: ${key.createdAt}\n`);
  });
  
  // Cerca specificamente GOOGLE_MAPS
  const googleMaps = await prisma.apiKey.findUnique({
    where: { service: 'GOOGLE_MAPS' }
  });
  
  if (googleMaps) {
    console.log('✅ API Key GOOGLE_MAPS trovata!');
    console.log(`   Full Key: ${googleMaps.key}`);
    console.log(`   Active: ${googleMaps.isActive}`);
  } else {
    console.log('❌ API Key GOOGLE_MAPS NON trovata!');
    console.log('\n💡 Inserisco la chiave valida...');
    
    await prisma.apiKey.upsert({
      where: { service: 'GOOGLE_MAPS' },
      update: {
        key: 'AIzaSyCsBYVJ4IcfcK92UehJ2iqTH2tmJv6Z4Bg',
        isActive: true
      },
      create: {
        service: 'GOOGLE_MAPS',
        key: 'AIzaSyCsBYVJ4IcfcK92UehJ2iqTH2tmJv6Z4Bg',
        isActive: true,
        description: 'Google Maps API per geocoding e mappe'
      }
    });
    
    console.log('✅ Chiave GOOGLE_MAPS inserita nel database!');
  }
  
  await prisma.$disconnect();
}

checkApiKeys().catch(console.error);
