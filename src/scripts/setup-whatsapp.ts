// Script per configurare WhatsApp nel database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupWhatsAppConfig() {
  try {
    // Configurazione WhatsApp Evolution API
    const whatsappConfig = {
      provider: 'WHATSAPP',
      keyName: 'Evolution API',
      keyValue: 'evolution_key_luca_2025_secure_21806',
      configuration: {
        url: 'http://37.27.89.35:8080',
        apiKey: 'evolution_key_luca_2025_secure_21806', 
        instance: 'assistenza',
        webhookUrl: 'http://localhost:3200/api/whatsapp/webhook',
        enabled: true
      },
      isActive: true,
      description: 'WhatsApp Business via Evolution API'
    };

    // Cerca se esiste già
    const existing = await prisma.apiKey.findFirst({
      where: { provider: 'WHATSAPP' }
    });

    if (existing) {
      // Aggiorna
      const updated = await prisma.apiKey.update({
        where: { id: existing.id },
        data: whatsappConfig
      });
      console.log('✅ WhatsApp config updated:', updated.id);
    } else {
      // Crea
      const created = await prisma.apiKey.create({
        data: whatsappConfig
      });
      console.log('✅ WhatsApp config created:', created.id);
    }

    console.log('Configuration saved with instance: assistenza');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupWhatsAppConfig();
