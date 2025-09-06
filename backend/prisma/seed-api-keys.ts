import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

async function seedApiKeys() {
  try {
    // Get first organization
    const organization = await prisma.organization.findFirst();
    
    if (!organization) {
      logger.error('No organization found. Please seed organizations first.');
      return;
    }

    // Seed API Keys with placeholder values
    const apiKeys = [
      {
        service: 'GOOGLE_MAPS',
        key: 'AIza_placeholder_google_maps_key',
        isActive: false,
        configuration: {
          enabled: false,
          apis: ['maps', 'geocoding', 'places'],
          restrictions: {
            allowedReferrers: ['http://localhost:5193']
          }
        },
        organizationId: organization.id
      },
      {
        service: 'BREVO',
        key: 'xkeysib_placeholder_brevo_key',
        isActive: false,
        configuration: {
          enabled: false,
          senderEmail: '',
          senderName: 'Sistema Assistenza',
          replyToEmail: '',
          templates: {
            welcome: '',
            passwordReset: '',
            requestCreated: '',
            quoteReceived: '',
            paymentConfirmed: ''
          },
          dailyLimit: 300,
          testMode: true
        },
        organizationId: organization.id
      },
      {
        service: 'OPENAI',
        key: 'sk_placeholder_openai_key',
        isActive: false,
        configuration: {
          enabled: false,
          model: 'gpt-3.5-turbo',
          maxTokens: 2048,
          temperature: 0.7,
          topP: 1,
          frequencyPenalty: 0,
          presencePenalty: 0,
          defaultSystemPrompt: 'Sei un assistente professionale per un sistema di richiesta assistenza tecnica. Rispondi in italiano in modo chiaro e professionale.',
          features: {
            chatAssistant: false,
            autoSuggestions: false,
            smartRouting: false,
            documentAnalysis: false
          },
          usageLimit: {
            daily: 1000,
            monthly: 30000
          }
        },
        organizationId: organization.id
      }
    ];

    for (const apiKey of apiKeys) {
      await prisma.apiKey.upsert({
        where: { service: apiKey.service },
        update: {
          ...apiKey,
          updatedAt: new Date()
        },
        create: apiKey
      });
      
      logger.info(`✅ API Key seeded: ${apiKey.service}`);
    }

    logger.info('✅ All API Keys seeded successfully');
  } catch (error) {
    logger.error('Error seeding API keys:', error);
    throw error;
  }
}

seedApiKeys()
  .catch((e) => {
    logger.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
