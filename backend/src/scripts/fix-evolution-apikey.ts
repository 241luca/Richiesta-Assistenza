/**
 * Script per correggere l'API Key di Evolution API
 * Sostituisce la chiave sbagliata con quella corretta
 * 
 * @author Luca Mambelli
 * @date 22 Settembre 2025
 */

import prisma from '../config/database';

async function fixEvolutionApiKey() {
  try {
    console.log('🔧 Correzione API Key Evolution...\n');

    // La nuova API key corretta (token generato da Evolution)
    const CORRECT_API_KEY = '8C47777D-4EC9-4101-9246-5FFEAE763502';
    const EVOLUTION_URL = 'http://37.27.89.35:8080';
    const INSTANCE_NAME = 'assistenza';

    // Cerca la configurazione esistente
    const existingKey = await prisma.apiKey.findUnique({
      where: { service: 'whatsapp' }
    });

    if (existingKey) {
      console.log('📝 Configurazione attuale trovata:');
      console.log(`   - Service: ${existingKey.service}`);
      console.log(`   - Key attuale: ${existingKey.key}`);
      console.log(`   - Permissions:`, existingKey.permissions);
      
      // Aggiorna con i valori corretti
      const updated = await prisma.apiKey.update({
        where: { service: 'whatsapp' },
        data: {
          key: CORRECT_API_KEY,
          name: 'WhatsApp Integration (EvolutionAPI)',
          permissions: {
            evolutionUrl: EVOLUTION_URL,
            instanceName: INSTANCE_NAME,
            webhookUrl: null  // Lo configureremo dopo
          },
          isActive: true,
          updatedAt: new Date()
        }
      });

      console.log('\n✅ API Key aggiornata con successo!');
      console.log(`   - Nuova Key: ${CORRECT_API_KEY}`);
      console.log(`   - URL: ${EVOLUTION_URL}`);
      console.log(`   - Instance: ${INSTANCE_NAME}`);
      
    } else {
      // Se non esiste, creala
      const created = await prisma.apiKey.create({
        data: {
          id: `whatsapp_evolution_${Date.now()}`,
          key: CORRECT_API_KEY,
          name: 'WhatsApp Integration (EvolutionAPI)',
          service: 'whatsapp',
          permissions: {
            evolutionUrl: EVOLUTION_URL,
            instanceName: INSTANCE_NAME,
            webhookUrl: null
          },
          isActive: true,
          rateLimit: 1000
        }
      });

      console.log('\n✅ Nuova configurazione creata!');
      console.log(`   - Key: ${CORRECT_API_KEY}`);
      console.log(`   - URL: ${EVOLUTION_URL}`);
      console.log(`   - Instance: ${INSTANCE_NAME}`);
    }

    console.log('\n🎯 Prossimi passi:');
    console.log('   1. Riavvia il backend per caricare la nuova configurazione');
    console.log('   2. Prova di nuovo a inviare un messaggio WhatsApp');
    console.log('   3. Se funziona, configura il webhook per ricevere messaggi');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
}

// Esegui lo script
fixEvolutionApiKey();