import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const prisma = new PrismaClient();

async function removeGoogleMapsPlaceholder() {
  try {
    console.log('🔍 Controllo Google Maps API Key...');
    
    // Controlla se esiste
    const existing = await prisma.apiKey.findUnique({
      where: { key: 'GOOGLE_MAPS' }
    });
    
    if (existing) {
      // Se ha il placeholder, rimuovila completamente
      if (existing.value === 'YOUR_GOOGLE_MAPS_API_KEY_HERE' || 
          existing.value?.includes('YOUR_') || 
          existing.value?.includes('PLACEHOLDER')) {
        
        await prisma.apiKey.delete({
          where: { key: 'GOOGLE_MAPS' }
        });
        
        console.log('✅ Rimosso placeholder pericoloso!');
        console.log('⚠️ La chiave Google Maps va inserita SOLO dal pannello admin!');
      } else if (!existing.value || existing.value === '') {
        // Se è vuota, eliminala
        await prisma.apiKey.delete({
          where: { key: 'GOOGLE_MAPS' }
        });
        console.log('✅ Rimossa entry vuota');
      } else {
        console.log('✅ Google Maps API Key già configurata correttamente');
        console.log('   Value:', '***' + existing.value.slice(-4));
      }
    } else {
      console.log('ℹ️ Nessuna Google Maps API Key presente');
      console.log('👉 Va inserita dal pannello admin quando necessario');
    }
    
    // Mostra lo stato finale
    console.log('\n📋 API Keys presenti nel sistema:');
    const allKeys = await prisma.apiKey.findMany({
      select: {
        key: true,
        description: true,
        isActive: true,
        value: true
      }
    });
    
    allKeys.forEach(k => {
      const hasRealValue = k.value && k.value.length > 0 && 
                          !k.value.includes('YOUR_') && 
                          !k.value.includes('PLACEHOLDER');
      console.log(`   - ${k.key}: ${hasRealValue ? '✅ Configurata' : '⚠️ Da configurare'}`);
    });
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeGoogleMapsPlaceholder();
