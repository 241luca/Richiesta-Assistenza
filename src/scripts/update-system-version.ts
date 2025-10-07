import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateSystemVersion() {
  console.log('🔄 Aggiornamento versione sistema a v5.1...');

  try {
    // Aggiorna o crea l'impostazione site_version
    const versionSetting = await prisma.systemSetting.upsert({
      where: { key: 'site_version' },
      update: { 
        value: 'v5.1',
        description: 'Versione del sistema - Release 29 Settembre 2025',
        updatedAt: new Date()
      },
      create: {
        key: 'site_version',
        value: 'v5.1',
        type: 'STRING',
        category: 'Sistema',
        label: 'Versione Sistema',
        description: 'Versione del sistema - Release 29 Settembre 2025',
        isPublic: true,
        validationRules: {
          pattern: '^v\\d+\\.\\d+(\\.\\d+)?$',
          example: 'v5.1.0'
        }
      }
    });

    console.log('✅ Versione sistema aggiornata:', versionSetting.value);

    // Aggiorna anche altre impostazioni correlate se necessario
    await prisma.systemSetting.upsert({
      where: { key: 'release_date' },
      update: { 
        value: '2025-09-29',
        updatedAt: new Date()
      },
      create: {
        key: 'release_date',
        value: '2025-09-29',
        type: 'STRING',
        category: 'Sistema',
        label: 'Data Release',
        description: 'Data ultima release sistema',
        isPublic: true
      }
    });

    console.log('✅ Tutte le impostazioni di sistema sono state aggiornate');
    
  } catch (error) {
    console.error('❌ Errore durante l\'aggiornamento:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script
updateSystemVersion()
  .then(() => {
    console.log('\n✅ Script completato con successo!');
    console.log('👉 La versione v5.1 è ora visibile in /admin/system-settings');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script fallito:', error);
    process.exit(1);
  });
