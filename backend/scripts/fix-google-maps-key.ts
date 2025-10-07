import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const prisma = new PrismaClient();

async function setupGoogleMapsKey() {
  try {
    console.log('🔑 Verifico/Creo API Key per Google Maps...');
    
    // Controlla se esiste già
    const existing = await prisma.apiKey.findUnique({
      where: { key: 'GOOGLE_MAPS' }
    });
    
    if (existing) {
      console.log('✅ Google Maps API Key già presente nel database');
      console.log('   Key:', 'GOOGLE_MAPS');
      console.log('   Value:', existing.value ? '***' + existing.value.slice(-4) : 'NON IMPOSTATA');
    } else {
      // Crea la chiave con il valore dall'environment o placeholder
      const googleMapsKey = process.env.GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY_HERE';
      
      const created = await prisma.apiKey.create({
        data: {
          key: 'GOOGLE_MAPS',
          value: googleMapsKey,
          description: 'Google Maps API Key for geocoding, places and directions',
          isActive: true
        }
      });
      
      console.log('✅ Google Maps API Key creata con successo!');
      console.log('   Key:', created.key);
      console.log('   Value:', googleMapsKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE' 
        ? '⚠️ PLACEHOLDER - Aggiorna dal pannello admin!' 
        : '***' + googleMapsKey.slice(-4));
    }
    
    // Mostra tutte le API Keys presenti
    console.log('\n📋 Tutte le API Keys nel sistema:');
    const allKeys = await prisma.apiKey.findMany({
      select: {
        key: true,
        description: true,
        isActive: true,
        updatedAt: true
      }
    });
    
    allKeys.forEach(k => {
      console.log(`   - ${k.key}: ${k.isActive ? '✅ Attiva' : '❌ Disattiva'} (${k.description || 'Nessuna descrizione'})`);
    });
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupGoogleMapsKey();
