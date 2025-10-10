/**
 * Script per aggiungere WhatsApp alla lista delle API Keys
 * Se non esiste già
 */

import { prisma } from '../config/database';
import logger from '../utils/logger';

async function seedWhatsAppApiKey() {
  try {
    // Verifica se esiste già
    const existing = await prisma.apiKey.findUnique({
      where: { service: 'whatsapp' }
    });

    if (existing) {
      logger.info('WhatsApp API key already exists');
      return;
    }

    // Crea il record WhatsApp
    const whatsappKey = await prisma.apiKey.create({
      data: {
        id: `whatsapp_${Date.now()}`,
        service: 'whatsapp',
        key: '',  // Vuoto inizialmente
        name: 'WhatsApp Integration (SendApp)',
        permissions: {
          baseURL: 'https://app.sendapp.cloud/api',
          instanceId: '',
          webhookUrl: ''
        },
        isActive: false,  // Non attivo finché non configurato
        rateLimit: 1000,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    logger.info('WhatsApp API key created successfully:', whatsappKey.id);
  } catch (error) {
    logger.error('Error seeding WhatsApp API key:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui se chiamato direttamente
if (require.main === module) {
  seedWhatsAppApiKey()
    .then(() => {
      console.log('✅ WhatsApp API key seed completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

export { seedWhatsAppApiKey };
