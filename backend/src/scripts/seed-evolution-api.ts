/**
 * Script per aggiungere/aggiornare Evolution API nel database
 * Aggiornato per Evolution API v2.3.3 sul VPS
 */

import { prisma } from '../config/database';
import logger from '../utils/logger';

async function seedEvolutionApiKey() {
  try {
    console.log('🔧 Configurando Evolution API key nel database...\n');

    // 1. Trova la prima organizzazione
    const org = await prisma.organization.findFirst();
    if (!org) {
      console.error('❌ Nessuna organizzazione trovata. Crea prima un\'organizzazione.');
      return;
    }
    
    console.log(`✅ Organizzazione: ${org.name} (${org.id})\n`);

    // 2. Trova un utente SUPER_ADMIN per l'update
    const admin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });

    if (!admin) {
      console.error('❌ Nessun utente SUPER_ADMIN trovato.');
      return;
    }

    console.log(`✅ Admin: ${admin.email}\n`);

    // 3. Verifica se esiste già Evolution API
    const existing = await prisma.apiKey.findFirst({
      where: {
        service: 'whatsapp',
        organizationId: org.id
      }
    });

    const evolutionConfig = {
      service: 'whatsapp' as const,
      key: 'evolution_key_luca_2025_secure_21806',
      configuration: {
        provider: 'evolution',
        version: '2.3.3',
        baseURL: 'http://37.27.89.35:8080',
        instanceName: 'main',
        webhookUrl: 'http://37.27.89.35:3201/api/whatsapp/webhook',
        features: {
          sendMessage: true,
          receiveMessage: true,
          sendMedia: true,
          receiveMedia: true,
          groupSupport: true,
          statusSupport: true,
          qrCodeGeneration: true
        },
        settings: {
          autoReconnect: true,
          maxRetries: 3,
          retryDelay: 5000,
          webhookEnabled: true,
          storeMessages: true,
          storeContacts: true
        }
      },
      isActive: true,
      organizationId: org.id,
      updatedById: admin.id
    };

    if (existing) {
      // Aggiorna configurazione esistente
      console.log('📝 Aggiornando Evolution API esistente...');
      
      const updated = await prisma.apiKey.update({
        where: { id: existing.id },
        data: {
          key: evolutionConfig.key,
          configuration: evolutionConfig.configuration,
          isActive: true,
          updatedById: admin.id,
          updatedAt: new Date()
        }
      });

      console.log(`✅ Evolution API aggiornata (ID: ${updated.id})`);
      console.log('\n📋 Configurazione:');
      console.log(`  - URL: http://37.27.89.35:8080`);
      console.log(`  - API Key: ${evolutionConfig.key}`);
      console.log(`  - Instance: main`);
      console.log(`  - Webhook: http://37.27.89.35:3201`);
      console.log(`  - Versione: 2.3.3`);
      
    } else {
      // Crea nuova configurazione
      console.log('➕ Creando nuova configurazione Evolution API...');
      
      const newKey = await prisma.apiKey.create({
        data: evolutionConfig
      });

      console.log(`✅ Evolution API creata (ID: ${newKey.id})`);
      console.log('\n📋 Configurazione:');
      console.log(`  - URL: http://37.27.89.35:8080`);
      console.log(`  - API Key: ${evolutionConfig.key}`);
      console.log(`  - Instance: main`);
      console.log(`  - Webhook: http://37.27.89.35:3201`);
      console.log(`  - Versione: 2.3.3`);
    }

    // 4. Verifica finale
    console.log('\n📊 Verifica configurazione:');
    
    const allKeys = await prisma.apiKey.findMany({
      where: { organizationId: org.id },
      select: {
        service: true,
        isActive: true,
        configuration: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log(`\nTotale API keys per ${org.name}: ${allKeys.length}`);
    
    allKeys.forEach(key => {
      const status = key.isActive ? '✅ Attiva' : '❌ Inattiva';
      console.log(`  - ${key.service}: ${status}`);
      
      if (key.service === 'whatsapp') {
        const config = key.configuration as any;
        console.log(`    Provider: ${config.provider}`);
        console.log(`    Version: ${config.version}`);
        console.log(`    URL: ${config.baseURL}`);
        console.log(`    Instance: ${config.instanceName}`);
      }
    });

    console.log('\n🎉 Configurazione completata!');
    console.log('\n📱 Prossimi passi:');
    console.log('1. Apri: http://localhost:5193/admin/api-keys');
    console.log('2. Verifica che Evolution API sia configurata');
    console.log('3. Vai su: http://localhost:5193/admin/whatsapp');
    console.log('4. Crea istanza e connetti WhatsApp');
    
  } catch (error) {
    console.error('❌ Errore configurazione:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui se chiamato direttamente
if (require.main === module) {
  seedEvolutionApiKey()
    .then(() => {
      console.log('\n✅ Script completato');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Errore:', error);
      process.exit(1);
    });
}

export { seedEvolutionApiKey };
