// Script per aggiungere le impostazioni dei promemoria immagini
// Da eseguire con: cd backend && npx tsx src/scripts/add-image-reminder-settings.ts

import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Aggiunta impostazioni promemoria immagini...');

  const imageReminderSettings = [
    // AVATAR - CLIENTI
    {
      key: 'avatar_required_for_clients',
      value: 'false',
      type: 'boolean',
      category: 'Promemoria Immagini',
      description: 'Avatar obbligatorio per i clienti',
      isActive: true,
      isEditable: true
    },
    {
      key: 'avatar_reminder_enabled_for_clients',
      value: 'true',
      type: 'boolean',
      category: 'Promemoria Immagini',
      description: 'Mostra promemoria avatar per clienti',
      isActive: true,
      isEditable: true
    },

    // AVATAR - PROFESSIONISTI
    {
      key: 'avatar_required_for_professionals',
      value: 'true',
      type: 'boolean',
      category: 'Promemoria Immagini',
      description: 'Avatar obbligatorio per i professionisti',
      isActive: true,
      isEditable: true
    },
    {
      key: 'avatar_reminder_enabled_for_professionals',
      value: 'true',
      type: 'boolean',
      category: 'Promemoria Immagini',
      description: 'Mostra promemoria avatar per professionisti',
      isActive: true,
      isEditable: true
    },

    // IMMAGINE DI RICONOSCIMENTO - CLIENTI
    {
      key: 'recognition_image_required_for_clients',
      value: 'false',
      type: 'boolean',
      category: 'Promemoria Immagini',
      description: 'Immagine di riconoscimento obbligatoria per i clienti',
      isActive: true,
      isEditable: true
    },
    {
      key: 'recognition_image_reminder_enabled_for_clients',
      value: 'true',
      type: 'boolean',
      category: 'Promemoria Immagini',
      description: 'Mostra promemoria immagine di riconoscimento per clienti',
      isActive: true,
      isEditable: true
    },

    // IMMAGINE DI RICONOSCIMENTO - PROFESSIONISTI
    {
      key: 'recognition_image_required_for_professionals',
      value: 'true',
      type: 'boolean',
      category: 'Promemoria Immagini',
      description: 'Immagine di riconoscimento obbligatoria per i professionisti',
      isActive: true,
      isEditable: true
    },
    {
      key: 'recognition_image_reminder_enabled_for_professionals',
      value: 'true',
      type: 'boolean',
      category: 'Promemoria Immagini',
      description: 'Mostra promemoria immagine di riconoscimento per professionisti',
      isActive: true,
      isEditable: true
    },

    // CONFIGURAZIONI GENERALI
    {
      key: 'image_reminders_enabled',
      value: 'true',
      type: 'boolean',
      category: 'Promemoria Immagini',
      description: 'Abilita sistema promemoria immagini',
      isActive: true,
      isEditable: true
    },
    {
      key: 'image_reminders_position',
      value: 'dashboard',
      type: 'string',
      category: 'Promemoria Immagini',
      description: 'Posizione promemoria (dashboard, profile, both)',
      isActive: true,
      isEditable: true
    },
    {
      key: 'image_reminders_style',
      value: 'card',
      type: 'string',
      category: 'Promemoria Immagini',
      description: 'Stile promemoria (card, banner, notification)',
      isActive: true,
      isEditable: true
    },

    // ESCLUSIONI
    {
      key: 'image_reminders_excluded_users',
      value: '[]',
      type: 'json',
      category: 'Promemoria Immagini',
      description: 'Lista ID utenti esclusi dai promemoria (JSON array)',
      isActive: true,
      isEditable: true
    },
    {
      key: 'image_reminders_excluded_roles',
      value: '[]',
      type: 'json',
      category: 'Promemoria Immagini',
      description: 'Lista ruoli esclusi dai promemoria (JSON array)',
      isActive: true,
      isEditable: true
    }
  ];

  let addedCount = 0;
  let updatedCount = 0;

  for (const setting of imageReminderSettings) {
    try {
      // Verifica se l'impostazione esiste già
      const existingSetting = await prisma.systemSettings.findUnique({
        where: { key: setting.key }
      });

      if (existingSetting) {
        // Aggiorna solo se la categoria è diversa
        if (existingSetting.category !== setting.category) {
          await prisma.systemSettings.update({
            where: { key: setting.key },
            data: {
              category: setting.category,
              description: setting.description,
              type: setting.type
            }
          });
          console.log(`✅ Aggiornata impostazione: ${setting.key}`);
          updatedCount++;
        } else {
          console.log(`⏭️  Impostazione già esistente: ${setting.key}`);
        }
      } else {
        // Crea nuova impostazione
        await prisma.systemSettings.create({
          data: {
            id: nanoid(),
            ...setting,
            updatedAt: new Date()
          }
        });
        console.log(`✅ Aggiunta impostazione: ${setting.key}`);
        addedCount++;
      }
    } catch (error: unknown) {
      console.error(`❌ Errore con impostazione ${setting.key}:`, error);
    }
  }

  console.log(`\n🎉 Completato!`);
  console.log(`📊 Statistiche:`);
  console.log(`   - Impostazioni aggiunte: ${addedCount}`);
  console.log(`   - Impostazioni aggiornate: ${updatedCount}`);
  console.log(`   - Totale processate: ${imageReminderSettings.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Errore durante l\'esecuzione:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });