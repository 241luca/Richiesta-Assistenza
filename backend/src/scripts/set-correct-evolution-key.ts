/**
 * Script per impostare la CHIAVE API CORRETTA di Evolution
 * Usa la Global API Key trovata nel container Docker
 * 
 * @author Luca Mambelli
 * @date 22 Settembre 2025
 */

import prisma from '../config/database';

async function setCorrectEvolutionKey() {
  try {
    console.log('🔧 Impostazione chiave API corretta Evolution...\n');

    // LA CHIAVE CORRETTA TROVATA NEL DOCKER!
    const CORRECT_API_KEY = 'evolution_key_luca_2025_secure_21806';  // QUESTA È LA CHIAVE GIUSTA!
    const EVOLUTION_URL = 'http://37.27.89.35:8080';
    const INSTANCE_NAME = 'assistenza';

    console.log('📋 Configurazione da salvare:');
    console.log('   🔑 Global API Key:', CORRECT_API_KEY);
    console.log('   🌐 URL:', EVOLUTION_URL);
    console.log('   📱 Instance:', INSTANCE_NAME);
    console.log('');

    // Aggiorna TUTTE le possibili configurazioni
    
    // 1. Aggiorna con service = 'whatsapp'
    const config1 = await prisma.apiKey.upsert({
      where: { service: 'whatsapp' },
      update: {
        key: CORRECT_API_KEY,
        permissions: {
          evolutionUrl: EVOLUTION_URL,
          instanceName: INSTANCE_NAME,
          apiKey: CORRECT_API_KEY,
          baseURL: EVOLUTION_URL,
          enabled: true,
          version: '2.3.3',
          provider: 'evolution'
        },
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        id: `whatsapp_evolution_${Date.now()}`,
        key: CORRECT_API_KEY,
        name: 'WhatsApp Integration (EvolutionAPI)',
        service: 'whatsapp',
        permissions: {
          evolutionUrl: EVOLUTION_URL,
          instanceName: INSTANCE_NAME,
          apiKey: CORRECT_API_KEY,
          baseURL: EVOLUTION_URL,
          enabled: true,
          version: '2.3.3',
          provider: 'evolution'
        },
        isActive: true,
        rateLimit: 1000
      }
    });
    console.log('✅ Aggiornata configurazione con service="whatsapp"');

    // 2. Elimina vecchie con provider = 'WHATSAPP'
    await prisma.apiKey.deleteMany({
      where: { provider: 'WHATSAPP' }
    });

    // 3. Crea nuova con provider = 'WHATSAPP' (per compatibilità con whatsapp.routes.ts)
    const config2 = await prisma.apiKey.create({
      data: {
        id: `whatsapp_provider_${Date.now()}`,
        key: CORRECT_API_KEY,
        name: 'WhatsApp Evolution Provider',
        provider: 'WHATSAPP',
        service: 'evolution',
        configuration: {
          url: EVOLUTION_URL,
          apiKey: CORRECT_API_KEY,
          instance: INSTANCE_NAME
        },
        permissions: {},
        isActive: true,
        rateLimit: 1000
      }
    });
    console.log('✅ Creata configurazione con provider="WHATSAPP"');

    console.log('\n🎉 CONFIGURAZIONE SALVATA CON SUCCESSO!');
    console.log('\n⚠️  IMPORTANTE:');
    console.log('   1. RIAVVIA IL BACKEND (CTRL+C e npm run dev)');
    console.log('   2. La chiave corretta è:', CORRECT_API_KEY);
    console.log('   3. Questa è la Global API Key di Evolution dal Docker');
    console.log('\n🚀 Ora dovrebbe funzionare!');
    
    process.exit(0);
    
  } catch (error: unknown) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
}

// Esegui
setCorrectEvolutionKey();