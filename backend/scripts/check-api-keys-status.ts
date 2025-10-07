import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const prisma = new PrismaClient();

async function checkApiKeys() {
  try {
    console.log('🔍 Controllo API Keys nel database...\n');
    
    const keys = await prisma.apiKey.findMany();
    
    if (keys.length === 0) {
      console.log('❌ Nessuna API Key trovata nel database\n');
    } else {
      console.log(`✅ Trovate ${keys.length} API Keys:\n`);
      keys.forEach(k => {
        console.log(`📌 ${k.key || k.service}`);
        console.log(`   - Service: ${k.service}`);
        console.log(`   - Name: ${k.name}`);
        console.log(`   - Active: ${k.isActive ? '✅' : '❌'}`);
        console.log(`   - Value: ${k.value ? '***' + k.value.slice(-4) : 'NON IMPOSTATA'}`);
        console.log('');
      });
    }
    
    // Controlla specificamente GOOGLE_MAPS
    const googleKey = await prisma.apiKey.findFirst({
      where: {
        OR: [
          { key: 'GOOGLE_MAPS' },
          { service: 'GOOGLE_MAPS' }
        ]
      }
    });
    
    if (googleKey) {
      console.log('⚠️ ATTENZIONE: Esiste già una chiave per Google Maps!');
      console.log('   Dovrai AGGIORNARE invece di CREARE una nuova.\n');
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkApiKeys();
