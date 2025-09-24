/**
 * Test FINALE con la CHIAVE CORRETTA trovata nel Docker
 */

const axios = require('axios');

async function testWithCorrectKey() {
  console.log('\n🚀 TEST CON LA CHIAVE API CORRETTA DAL DOCKER');
  console.log('==============================================\n');

  // CONFIGURAZIONE CORRETTA TROVATA NEL DOCKER
  const API_KEY = 'evolution_key_luca_2025_secure_21806';  // QUESTA È LA CHIAVE GIUSTA!
  const BASE_URL = 'http://37.27.89.35:8080';
  const INSTANCE = 'assistenza';
  const TEST_NUMBER = '393403803728';
  const TEST_MESSAGE = `Test con chiave corretta - ${new Date().toLocaleTimeString()}`;

  console.log('✅ Configurazione CORRETTA dal Docker:');
  console.log(`   🔑 Global API Key: ${API_KEY}`);
  console.log(`   🌐 URL: ${BASE_URL}`);
  console.log(`   📱 Instance: ${INSTANCE}`);
  console.log(`   📞 Numero: ${TEST_NUMBER}`);
  console.log(`   💬 Messaggio: ${TEST_MESSAGE}`);
  console.log('');

  try {
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
          'apikey': API_KEY,  // USA LA GLOBAL API KEY!
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅✅✅ SUCCESSO! MESSAGGIO INVIATO! ✅✅✅');
    console.log('\n📱 Controlla il tuo WhatsApp, dovresti aver ricevuto il messaggio!');
    console.log('\nRisposta Evolution:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('\n🎉 LA CHIAVE API È CORRETTA!');
    console.log('   Ora il sistema dovrebbe funzionare.');
    console.log('   Riavvia il backend per caricare la nuova configurazione.');
    
  } catch (error) {
    console.log('❌ ERRORE:');
    console.log('   Status:', error.response?.status);
    console.log('   Messaggio:', error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('\n⚠️  Ancora errore 401... Possibili cause:');
      console.log('   1. L\'istanza "assistenza" non esiste');
      console.log('   2. Evolution API ha un problema');
      console.log('   3. Serve riavviare Evolution sul VPS');
    }
  }
}

// Esegui il test
testWithCorrectKey().catch(console.error);