// Test per vedere tutte le chiavi API OPENAI nel database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllOpenAIKeys() {
  try {
    // Trova TUTTE le chiavi OPENAI (anche non attive)
    const allKeys = await prisma.apiKey.findMany({
      where: {
        service: 'OPENAI'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`\nTrovate ${allKeys.length} chiavi OPENAI nel database:\n`);
    
    allKeys.forEach((key, index) => {
      console.log(`--- Chiave #${index + 1} ---`);
      console.log('ID:', key.id);
      console.log('Nome:', key.name);
      console.log('Attiva:', key.isActive ? '✅ SI' : '❌ NO');
      console.log('Inizio chiave:', key.key?.substring(0, 15) + '...');
      console.log('Lunghezza:', key.key?.length);
      console.log('Formato corretto (sk-):', key.key?.startsWith('sk-') ? '✅ SI' : '❌ NO');
      console.log('Creata:', key.createdAt);
      console.log('Aggiornata:', key.updatedAt);
      console.log('');
    });

    // Mostra quale dovrebbe essere usata
    const activeKey = allKeys.find(k => k.isActive);
    if (activeKey) {
      console.log('⚠️  La chiave ATTIVA è:', activeKey.name);
      console.log('   Ma ha formato:', activeKey.key?.startsWith('sk-') ? 'CORRETTO ✅' : 'ERRATO ❌');
    }

  } catch (error) {
    console.error('Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllOpenAIKeys();
