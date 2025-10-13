const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

// Load env from ../.env if present
dotenv.config({ path: '../.env' });

const prisma = new PrismaClient();

async function main() {
  try {
    const argKey = process.argv[2];
    const envKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const keyToSet = argKey || envKey;

    if (!keyToSet || typeof keyToSet !== 'string' || keyToSet.trim().length < 20) {
      console.error('❌ Nessuna API key valida fornita.');
      console.error('   Usa: node scripts/update-google-maps-key.js "<LA_TUA_API_KEY_GOOGLE_MAPS>"');
      console.error('   Oppure imposta una variabile env: GOOGLE_MAPS_API_KEY o VITE_GOOGLE_MAPS_API_KEY');
      process.exit(1);
    }

    console.log('🔑 Aggiorno Google Maps API Key nel database...');
    const updated = await prisma.apiKey.upsert({
      where: { service: 'GOOGLE_MAPS' },
      update: {
        key: keyToSet.trim(),
        isActive: true,
        updatedAt: new Date(),
        name: 'Google Maps API Key'
      },
      create: {
        id: require('uuid').v4(),
        service: 'GOOGLE_MAPS',
        key: keyToSet.trim(),
        name: 'Google Maps API Key',
        isActive: true,
        updatedAt: new Date()
      }
    });

    console.log('✅ Aggiornata con successo.');
    console.log('   Service:', updated.service);
    console.log('   Key:', updated.key.substring(0, 20) + '...');
    console.log('   Active:', updated.isActive ? '✅' : '❌');

    // Verifica endpoint
    const fetch = require('node-fetch');
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3200';
    const resp = await fetch(`${backendUrl}/api/maps/config`);
    const json = await resp.json();
    console.log('\n🔎 Verifica /api/maps/config:');
    console.log('   Status:', resp.status);
    console.log('   Success:', json.success);
    console.log('   isConfigured:', json.data?.isConfigured);
    console.log('   key:', json.data?.apiKey ? json.data.apiKey.substring(0, 20) + '...' : 'N/D');
  } catch (err) {
    console.error('❌ Errore:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();