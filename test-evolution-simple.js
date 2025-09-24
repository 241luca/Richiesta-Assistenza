/**
 * Test DIRETTO Evolution API - Bypassa tutto il sistema
 * Usa direttamente axios con la configurazione corretta
 */

const axios = require('axios');

async function testDirect() {
  console.log('\n🚀 TEST DIRETTO EVOLUTION API');
  console.log('================================\n');

  // CONFIGURAZIONE CORRETTA
  const API_KEY = '8C47777D-4EC9-4101-9246-5FFEAE763502';
  const BASE_URL = 'http://37.27.89.35:8080';
  const INSTANCE = 'assistenza';
  const TEST_NUMBER = '393403803728';
  const TEST_MESSAGE = `Test diretto Evolution - ${new Date().toLocaleTimeString()}`;

  console.log('📋 Configurazione:');
  console.log(`   URL: ${BASE_URL}`);
  console.log(`   Instance: ${INSTANCE}`);
  console.log(`   API Key: ${API_KEY}`);
  console.log(`   Numero: ${TEST_NUMBER}`);
  console.log(`   Messaggio: ${TEST_MESSAGE}`);
  console.log('');

  try {
    // Chiamata DIRETTA all'API Evolution
    console.log('📤 Invio messaggio...\n');
    
    const response = await axios.post(
      `${BASE_URL}/message/sendText/${INSTANCE}`,
      {
        number: TEST_NUMBER,
        text: TEST_MESSAGE,
        delay: 1000
      },
      {
        headers: {
          'apikey': API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ SUCCESSO! Messaggio inviato!');
    console.log('\nRisposta Evolution:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ ERRORE:');
    console.log('   Status:', error.response?.status);
    console.log('   Messaggio:', error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('\n⚠️  La chiave API non è valida!');
      console.log('   Possibili cause:');
      console.log('   1. Il token Evolution è cambiato');
      console.log('   2. L\'istanza "assistenza" non esiste più');
      console.log('   3. Evolution API non è attivo sul VPS');
      console.log('\n📝 SOLUZIONE:');
      console.log('   Vai sul VPS e controlla:');
      console.log('   - docker ps (vedi se evolution è attivo)');
      console.log('   - docker logs evolution_api');
      console.log('   - Verifica il token nell\'istanza');
    }
  }
}

// Esegui il test
testDirect().catch(console.error);