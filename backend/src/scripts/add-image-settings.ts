// Script per aggiungere le impostazioni di sistema per la configurazione delle immagini
// Da eseguire con: cd backend && npx tsx src/scripts/add-image-settings.ts

import { PrismaClient } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Aggiunta impostazioni di sistema per configurazione immagini...');

  const now = new Date();
  
  const imageSettings = [
    // CONFIGURAZIONE PERCORSI IMMAGINI
    {
      id: createId(),
      key: 'image_storage_path_avatar',
      value: '/uploads/avatars',
      type: 'string',
      category: 'Immagini',
      description: 'Percorso di memorizzazione per gli avatar degli utenti',
      isActive: true,
      isEditable: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: createId(),
      key: 'image_storage_path_recognition',
      value: '/uploads/recognition',
      type: 'string',
      category: 'Immagini',
      description: 'Percorso di memorizzazione per le immagini di riconoscimento',
      isActive: true,
      isEditable: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: createId(),
      key: 'image_max_size_mb',
      value: '5',
      type: 'number',
      category: 'Immagini',
      description: 'Dimensione massima delle immagini in MB',
      isActive: true,
      isEditable: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: createId(),
      key: 'image_allowed_formats',
      value: 'jpg,jpeg,png,webp',
      type: 'string',
      category: 'Immagini',
      description: 'Formati di immagine consentiti (separati da virgola)',
      isActive: true,
      isEditable: true,
      createdAt: now,
      updatedAt: now
    },
    
    // CONFIGURAZIONE OBBLIGATORIETÀ CLIENTI
    {
      id: createId(),
      key: 'client_avatar_required',
      value: 'false',
      type: 'boolean',
      category: 'Obbligatorietà Clienti',
      description: 'Avatar obbligatorio per i clienti',
      isActive: true,
      isEditable: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: createId(),
      key: 'client_recognition_image_required',
      value: 'false',
      type: 'boolean',
      category: 'Obbligatorietà Clienti',
      description: 'Immagine di riconoscimento obbligatoria per i clienti',
      isActive: true,
      isEditable: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: createId(),
      key: 'client_profile_completion_required',
      value: 'true',
      type: 'boolean',
      category: 'Obbligatorietà Clienti',
      description: 'Completamento profilo obbligatorio per i clienti',
      isActive: true,
      isEditable: true,
      createdAt: now,
      updatedAt: now
    },
    
    // CONFIGURAZIONE OBBLIGATORIETÀ PROFESSIONISTI
    {
      id: createId(),
      key: 'professional_avatar_required',
      value: 'true',
      type: 'boolean',
      category: 'Obbligatorietà Professionisti',
      description: 'Avatar obbligatorio per i professionisti',
      isActive: true,
      isEditable: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: createId(),
      key: 'professional_recognition_image_required',
      value: 'true',
      type: 'boolean',
      category: 'Obbligatorietà Professionisti',
      description: 'Immagine di riconoscimento obbligatoria per i professionisti',
      isActive: true,
      isEditable: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: createId(),
      key: 'professional_profile_completion_required',
      value: 'true',
      type: 'boolean',
      category: 'Obbligatorietà Professionisti',
      description: 'Completamento profilo obbligatorio per i professionisti',
      isActive: true,
      isEditable: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: createId(),
      key: 'professional_certifications_required',
      value: 'false',
      type: 'boolean',
      category: 'Obbligatorietà Professionisti',
      description: 'Certificazioni obbligatorie per i professionisti',
      isActive: true,
      isEditable: true,
      createdAt: now,
      updatedAt: now
    },
    
    // CONFIGURAZIONE ESCLUSIONI
    {
      id: createId(),
      key: 'excluded_client_emails',
      value: '',
      type: 'text',
      category: 'Esclusioni',
      description: 'Email dei clienti esclusi dalle obbligatorietà (una per riga)',
      isActive: true,
      isEditable: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: createId(),
      key: 'excluded_professional_emails',
      value: '',
      type: 'text',
      category: 'Esclusioni',
      description: 'Email dei professionisti esclusi dalle obbligatorietà (una per riga)',
      isActive: true,
      isEditable: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: createId(),
      key: 'excluded_user_roles',
      value: 'ADMIN,SUPER_ADMIN',
      type: 'string',
      category: 'Esclusioni',
      description: 'Ruoli utente esclusi dalle obbligatorietà (separati da virgola)',
      isActive: true,
      isEditable: true,
      createdAt: now,
      updatedAt: now
    }
  ];

  try {
    // Verifica se le impostazioni esistono già
    for (const setting of imageSettings) {
      const existing = await prisma.systemSettings.findUnique({
        where: { key: setting.key }
      });

      if (existing) {
        console.log(`⚠️  Impostazione '${setting.key}' già esistente, salto...`);
        continue;
      }

      await prisma.systemSettings.create({
        data: setting
      });

      console.log(`✅ Aggiunta impostazione: ${setting.key}`);
    }

    console.log('\n🎉 Impostazioni di sistema per le immagini aggiunte con successo!');
    console.log('\nImpostazioni aggiunte:');
    console.log('📁 Percorsi di memorizzazione immagini');
    console.log('👥 Obbligatorietà per clienti');
    console.log('🔧 Obbligatorietà per professionisti');
    console.log('🚫 Configurazione esclusioni');

  } catch (error) {
    console.error('❌ Errore durante l\'aggiunta delle impostazioni:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });