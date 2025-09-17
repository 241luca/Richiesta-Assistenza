// FIX IMMEDIATO - Inserisce la configurazione WhatsApp nel database

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixWhatsApp() {
  console.log('INSERIMENTO CONFIGURAZIONE WHATSAPP\n');
  
  try {
    // Elimina vecchie configurazioni
    await prisma.apiKey.deleteMany({
      where: { service: 'whatsapp' }
    });
    
    // Inserisci configurazione corretta
    const config = await prisma.apiKey.create({
      data: {
        id: 'whatsapp_config',
        service: 'whatsapp',
        key: '68c575f3c2ff1',
        permissions: {
          baseURL: 'https://app.sendapp.cloud/api',
          instanceId: '68C67956807C8',
          webhookUrl: 'http://localhost:3200/api/whatsapp/webhook'
        },
        isActive: true
      }
    });
    
    console.log('✅ Configurazione inserita:', config);
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixWhatsApp();
