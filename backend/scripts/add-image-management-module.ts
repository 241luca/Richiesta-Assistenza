import { PrismaClient, ModuleCategory, SettingType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function addImageManagementModule() {
  console.log('🖼️ Aggiungendo modulo Image Management...');

  try {
    // Verifica se il modulo esiste già
    const existingModule = await prisma.systemModule.findUnique({
      where: { code: 'image-management' }
    });

    if (existingModule) {
      console.log('⚠️ Modulo image-management già esistente, aggiorno...');
    }

    // Crea o aggiorna il modulo
    const module = await prisma.systemModule.upsert({
      where: { code: 'image-management' },
      create: {
        id: uuidv4(),
        code: 'image-management',
        name: 'Gestione Immagini',
        description: 'Sistema completo per la gestione delle immagini: avatar, riconoscimento, promemoria e configurazioni',
        category: ModuleCategory.BUSINESS,
        icon: '🖼️',
        color: '#8B5CF6',
        isCore: false,
        isEnabled: true,
        isActive: true,
        order: 18,
        dependsOn: ['profiles'],
        config: {
          maxFileSize: 5242880, // 5MB
          allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
          enableReminders: true,
          enableAvatars: true,
          enableRecognition: true
        },
        version: '1.0.0',
        author: 'Sistema Richiesta Assistenza',
        updatedAt: new Date()
      },
      update: {
        name: 'Gestione Immagini',
        description: 'Sistema completo per la gestione delle immagini: avatar, riconoscimento, promemoria e configurazioni',
        category: ModuleCategory.BUSINESS,
        icon: '🖼️',
        color: '#8B5CF6',
        order: 18,
        dependsOn: ['profiles'],
        config: {
          maxFileSize: 5242880, // 5MB
          allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
          enableReminders: true,
          enableAvatars: true,
          enableRecognition: true
        },
        version: '1.0.0',
        author: 'Sistema Richiesta Assistenza',
        updatedAt: new Date()
      }
    });

    console.log(`✅ Modulo ${existingModule ? 'aggiornato' : 'creato'}: ${module.name}`);

    // Impostazioni del modulo
    const moduleSettings = [
      {
        moduleCode: 'image-management',
        key: 'enable_avatars',
        value: 'true',
        type: SettingType.BOOLEAN,
        label: 'Abilita Avatar',
        description: 'Permette agli utenti di caricare immagini avatar',
        isRequired: false,
        isSecret: false,
        order: 1,
        group: 'Funzionalità'
      },
      {
        moduleCode: 'image-management',
        key: 'enable_recognition',
        value: 'true',
        type: SettingType.BOOLEAN,
        label: 'Abilita Riconoscimento',
        description: 'Permette il caricamento di immagini per il riconoscimento',
        isRequired: false,
        isSecret: false,
        order: 2,
        group: 'Funzionalità'
      },
      {
        moduleCode: 'image-management',
        key: 'enable_reminders',
        value: 'true',
        type: SettingType.BOOLEAN,
        label: 'Abilita Promemoria',
        description: 'Mostra promemoria per immagini mancanti',
        isRequired: false,
        isSecret: false,
        order: 3,
        group: 'Funzionalità'
      },
      {
        moduleCode: 'image-management',
        key: 'max_file_size',
        value: '5242880',
        type: SettingType.NUMBER,
        label: 'Dimensione Massima File (bytes)',
        description: 'Dimensione massima consentita per i file immagine',
        validation: { min: 1048576, max: 10485760 }, // 1MB - 10MB
        isRequired: false,
        isSecret: false,
        order: 4,
        group: 'Limiti'
      },
      {
        moduleCode: 'image-management',
        key: 'allowed_formats',
        value: 'jpg,jpeg,png,webp',
        type: SettingType.STRING,
        label: 'Formati Consentiti',
        description: 'Formati di file immagine consentiti (separati da virgola)',
        placeholder: 'jpg,jpeg,png,webp',
        isRequired: false,
        isSecret: false,
        order: 5,
        group: 'Limiti'
      },
      {
        moduleCode: 'image-management',
        key: 'storage_path',
        value: 'uploads/images',
        type: SettingType.STRING,
        label: 'Percorso di Archiviazione',
        description: 'Percorso dove vengono salvate le immagini',
        isRequired: false,
        isSecret: false,
        order: 6,
        group: 'Configurazione'
      },
      {
        moduleCode: 'image-management',
        key: 'reminder_position',
        value: 'top-right',
        type: SettingType.SELECT,
        label: 'Posizione Promemoria',
        description: 'Posizione dei promemoria nell\'interfaccia',
        validation: { 
          options: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'] 
        },
        isRequired: false,
        isSecret: false,
        order: 7,
        group: 'Promemoria'
      },
      {
        moduleCode: 'image-management',
        key: 'reminder_style',
        value: 'notification',
        type: SettingType.SELECT,
        label: 'Stile Promemoria',
        description: 'Stile di visualizzazione dei promemoria',
        validation: { 
          options: ['notification', 'banner', 'modal', 'inline'] 
        },
        isRequired: false,
        isSecret: false,
        order: 8,
        group: 'Promemoria'
      }
    ];

    let settingsCreated = 0;
    let settingsUpdated = 0;

    for (const setting of moduleSettings) {
      const existingSetting = await prisma.moduleSetting.findUnique({
        where: {
          moduleCode_key: {
            moduleCode: setting.moduleCode,
            key: setting.key
          }
        }
      });

      await prisma.moduleSetting.upsert({
        where: {
          moduleCode_key: {
            moduleCode: setting.moduleCode,
            key: setting.key
          }
        },
        create: {
          id: uuidv4(),
          moduleCode: setting.moduleCode,
          key: setting.key,
          value: setting.value,
          type: setting.type,
          label: setting.label,
          description: setting.description,
          placeholder: setting.placeholder,
          validation: setting.validation,
          isRequired: setting.isRequired ?? false,
          isSecret: setting.isSecret ?? false,
          order: setting.order ?? 0,
          group: setting.group,
          updatedAt: new Date()
        },
        update: {
          label: setting.label,
          description: setting.description,
          type: setting.type,
          validation: setting.validation,
          order: setting.order,
          placeholder: setting.placeholder,
          group: setting.group,
          updatedAt: new Date()
        }
      });

      if (existingSetting) {
        settingsUpdated++;
      } else {
        settingsCreated++;
      }
    }

    console.log(`✅ Impostazioni modulo:`);
    console.log(`   ✨ Nuove: ${settingsCreated}`);
    console.log(`   🔄 Aggiornate: ${settingsUpdated}`);
    console.log(`   📊 Totale: ${moduleSettings.length}`);

    console.log('\n🎯 Modulo Image Management configurato con successo!');
    console.log('📋 Funzionalità incluse:');
    console.log('   🖼️ Gestione avatar utenti');
    console.log('   👁️ Immagini per riconoscimento');
    console.log('   🔔 Sistema promemoria immagini mancanti');
    console.log('   ⚙️ Configurazioni avanzate');
    console.log('   📏 Controllo dimensioni e formati');

  } catch (error) {
    console.error('❌ Errore durante l\'aggiunta del modulo:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script se chiamato direttamente
if (require.main === module) {
  addImageManagementModule()
    .then(() => {
      console.log('✅ Script completato con successo!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script fallito:', error);
      process.exit(1);
    });
}

export { addImageManagementModule };