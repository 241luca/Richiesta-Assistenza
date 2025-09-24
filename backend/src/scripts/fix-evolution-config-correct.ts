/**
 * Script per salvare la configurazione Evolution nel formato corretto
 * che si aspetta whatsapp.routes.ts
 * 
 * @author Luca Mambelli
 * @date 22 Settembre 2025
 */

import prisma from '../config/database';

async function saveEvolutionConfigCorrectFormat() {
  try {
    console.log('🔧 Salvataggio configurazione Evolution nel formato corretto...\n');

    // La configurazione corretta
    const CORRECT_API_KEY = '8C47777D-4EC9-4101-9246-5FFEAE763502';
    const EVOLUTION_URL = 'http://37.27.89.35:8080';
    const INSTANCE_NAME = 'assistenza';

    // Prima elimina eventuali configurazioni vecchie con provider WHATSAPP
    console.log('🗑️  Pulizia configurazioni vecchie...');
    await prisma.apiKey.deleteMany({
      where: { provider: 'WHATSAPP' }
    });
    console.log('✅ Vecchie configurazioni eliminate');

    // Crea la nuova configurazione nel formato corretto
    const newConfig = await prisma.apiKey.create({
      data: {
        id: `whatsapp_evolution_${Date.now()}`,
        key: CORRECT_API_KEY,  // Questo campo non viene usato dal codice
        name: 'WhatsApp Integration (EvolutionAPI)',
        provider: 'WHATSAPP',  // IMPORTANTE: deve essere WHATSAPP maiuscolo
        service: 'evolution',
        configuration: {  // IMPORTANTE: il codice cerca in configuration, non in permissions
          url: EVOLUTION_URL,
          apiKey: CORRECT_API_KEY,
          instance: INSTANCE_NAME
        },
        permissions: {},
        isActive: true,
        rateLimit: 1000
      }
    });

    console.log('\n✅ Configurazione salvata nel formato corretto!');
    console.log('   📍 Provider: WHATSAPP');
    console.log('   🔑 API Key:', CORRECT_API_KEY);
    console.log('   🌐 URL:', EVOLUTION_URL);
    console.log('   📱 Instance:', INSTANCE_NAME);
    console.log('\n⚠️  IMPORTANTE: La configurazione è salvata in:');
    console.log('   - Campo "provider": WHATSAPP (maiuscolo)');
    console.log('   - Campo "configuration": contiene url, apiKey e instance');
    
    console.log('\n🎯 Ora:');
    console.log('   1. Riavvia il backend (CTRL+C e npm run dev)');
    console.log('   2. Prova di nuovo a inviare un messaggio');
    console.log('   3. Dovrebbe funzionare! 🚀');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
}

// Esegui lo script
saveEvolutionConfigCorrectFormat();