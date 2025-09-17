// Test rapido per verificare la chiave API dal database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testApiKey() {
  try {
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        service: 'OPENAI',
        isActive: true
      }
    });

    if (apiKey) {
      console.log('API Key trovata nel database:');
      console.log('- Service:', apiKey.service);
      console.log('- Name:', apiKey.name);
      console.log('- Is Active:', apiKey.isActive);
      console.log('- Key starts with:', apiKey.key?.substring(0, 10) + '...');
      console.log('- Key length:', apiKey.key?.length);
      
      // Verifica formato
      if (apiKey.key?.startsWith('sk-')) {
        console.log('✅ La chiave ha il formato corretto (inizia con sk-)');
      } else {
        console.log('⚠️ La chiave NON ha il formato corretto (dovrebbe iniziare con sk-)');
      }
    } else {
      console.log('❌ Nessuna API key OPENAI attiva trovata nel database');
    }
  } catch (error) {
    console.error('Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiKey();
