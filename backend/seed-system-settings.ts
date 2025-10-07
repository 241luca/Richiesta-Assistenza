import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSystemSettings() {
  console.log('🌱 Seeding SystemSettings...');
  
  const defaultSettings = [
    // Footer settings
    {
      key: 'FOOTER_TEXT',
      value: '© 2025 Sistema Richiesta Assistenza',
      label: 'Testo Footer',
      description: 'Testo del copyright nel footer',
      category: 'footer',
      type: 'string',
      isPublic: true,
      isEditable: true
    },
    {
      key: 'FOOTER_VERSION', 
      value: 'v2.0',
      label: 'Versione Sistema',
      description: 'Versione corrente del sistema',
      category: 'footer',
      type: 'string',
      isPublic: true,
      isEditable: true
    },
    {
      key: 'FOOTER_EDITION',
      value: 'Enterprise Edition',
      label: 'Edizione Sistema', 
      description: 'Edizione del sistema',
      category: 'footer',
      type: 'string',
      isPublic: true,
      isEditable: true
    },
    
    // Branding settings
    {
      key: 'APP_NAME',
      value: 'Richiesta Assistenza',
      label: 'Nome Applicazione',
      description: 'Nome dell\'applicazione mostrato nell\'interfaccia',
      category: 'branding',
      type: 'string',
      isPublic: true,
      isEditable: true
    },
    {
      key: 'COMPANY_NAME',
      value: 'LM Tecnologie',
      label: 'Nome Azienda',
      description: 'Nome dell\'azienda proprietaria',
      category: 'branding',
      type: 'string',
      isPublic: true,
      isEditable: true
    },
    {
      key: 'PRIMARY_COLOR',
      value: '#3B82F6',
      label: 'Colore Primario',
      description: 'Colore primario dell\'interfaccia',
      category: 'branding',
      type: 'color',
      isPublic: false,
      isEditable: true
    },
    
    // General settings
    {
      key: 'MAX_UPLOAD_SIZE',
      value: '10',
      label: 'Dimensione Massima Upload (MB)',
      description: 'Dimensione massima per i file caricati in MB',
      category: 'general',
      type: 'number',
      isPublic: false,
      isEditable: true,
      validation: { min: 1, max: 100 }
    },
    {
      key: 'ENABLE_NOTIFICATIONS',
      value: 'true',
      label: 'Abilita Notifiche',
      description: 'Abilita il sistema di notifiche',
      category: 'general',
      type: 'boolean',
      isPublic: false,
      isEditable: true
    },
    
    // AI settings
    {
      key: 'AI_ENABLED',
      value: 'true',
      label: 'Abilita AI Assistant',
      description: 'Abilita l\'assistente AI nel sistema',
      category: 'ai',
      type: 'boolean',
      isPublic: false,
      isEditable: true
    },
    {
      key: 'AI_MODEL',
      value: 'gpt-3.5-turbo',
      label: 'Modello AI',
      description: 'Modello AI utilizzato per l\'assistente',
      category: 'ai',
      type: 'string',
      isPublic: false,
      isEditable: true
    }
  ];

  for (const setting of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: setting,
      create: setting
    });
    console.log(`✅ Created/Updated setting: ${setting.key}`);
  }

  console.log('🎉 SystemSettings seeding completed!');
}

seedSystemSettings()
  .catch((e) => {
    console.error('❌ Error seeding SystemSettings:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
