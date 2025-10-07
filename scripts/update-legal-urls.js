#!/usr/bin/env node

/**
 * Script per aggiornare gli URL dei documenti legali nel System Settings
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateLegalUrls() {
  try {
    console.log('🔄 Aggiornamento URL documenti legali...\n');

    // Configurazioni da aggiornare
    const settings = [
      {
        key: 'PRIVACY_POLICY_URL',
        value: '/legal/privacy-policy',
        label: 'URL Privacy Policy',
        description: 'Link alla pagina pubblica della Privacy Policy'
      },
      {
        key: 'TERMS_SERVICE_URL', 
        value: '/legal/terms-service',
        label: 'URL Termini di Servizio',
        description: 'Link alla pagina pubblica dei Termini di Servizio'
      },
      {
        key: 'COOKIE_POLICY_URL',
        value: '/legal/cookie-policy', 
        label: 'URL Cookie Policy',
        description: 'Link alla pagina pubblica della Cookie Policy'
      }
    ];

    // Aggiorna ogni impostazione
    for (const setting of settings) {
      const existing = await prisma.systemSetting.findUnique({
        where: { key: setting.key }
      });

      if (existing) {
        // Aggiorna se esiste
        await prisma.systemSetting.update({
          where: { key: setting.key },
          data: {
            value: setting.value,
            description: setting.description,
            updatedAt: new Date()
          }
        });
        console.log(`✅ Aggiornato: ${setting.label} → ${setting.value}`);
      } else {
        // Crea se non esiste
        await prisma.systemSetting.create({
          data: {
            key: setting.key,
            value: setting.value,
            type: 'string',
            label: setting.label,
            description: setting.description,
            category: 'Legal',
            isEditable: true,
            isPublic: false,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        console.log(`✨ Creato: ${setting.label} → ${setting.value}`);
      }
    }

    console.log('\n🎯 Configurazione completata!');
    console.log('\n📌 Gli URL configurati sono:');
    console.log('   • Privacy Policy: /legal/privacy-policy');
    console.log('   • Termini di Servizio: /legal/terms-service');
    console.log('   • Cookie Policy: /legal/cookie-policy');
    console.log('\n✅ Ora questi link saranno usati automaticamente in tutto il sistema!');

  } catch (error) {
    console.error('❌ Errore durante l\'aggiornamento:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script
updateLegalUrls();
