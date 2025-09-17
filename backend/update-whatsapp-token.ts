// Script per aggiornare il token WhatsApp nel database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateWhatsAppToken() {
  try {
    console.log('🔧 Aggiornamento token WhatsApp...');
    
    // Prima verifica se esiste
    const existing = await prisma.apiKey.findUnique({
      where: { service: 'whatsapp' }
    });
    
    if (existing) {
      // Aggiorna il token esistente
      const updated = await prisma.apiKey.update({
        where: { service: 'whatsapp' },
        data: {
          key: '68c575f3c2ff1',
          permissions: {
            baseURL: 'https://app.sendapp.cloud/api',
            instanceId: '68C67956807C8',
            webhookUrl: ''
          },
          isActive: true
        }
      });
      console.log('✅ Token aggiornato:', updated);
    } else {
      // Crea nuovo record
      const created = await prisma.apiKey.create({
        data: {
          id: `whatsapp_${Date.now()}`,
          service: 'whatsapp',
          key: '68c575f3c2ff1',
          permissions: {
            baseURL: 'https://app.sendapp.cloud/api',
            instanceId: '68C67956807C8',
            webhookUrl: ''
          },
          isActive: true
        }
      });
      console.log('✅ Token creato:', created);
    }
    
    // Verifica il token salvato
    const final = await prisma.apiKey.findUnique({
      where: { service: 'whatsapp' }
    });
    
    console.log('\n📊 Configurazione finale:');
    console.log('- Service:', final?.service);
    console.log('- Token:', final?.key);
    console.log('- Instance ID:', (final?.permissions as any)?.instanceId);
    console.log('- Active:', final?.isActive);
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateWhatsAppToken();
