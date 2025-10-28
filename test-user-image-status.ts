/**
 * Test script per verificare l'endpoint /api/users/image-status
 * Questo script testa l'endpoint esistente per capire perché restituisce 404
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3200';

// Configurazione per test con autenticazione
const testConfig = {
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
};

async function testUserImageStatusEndpoint() {
  console.log('🧪 Test endpoint /api/users/image-status');
  console.log('='.repeat(50));

  try {
    // Prima facciamo login per ottenere il token
    console.log('1. Tentativo di login...');
    
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@test.com', // Usa credenziali di test
      password: 'password123'
    }, testConfig);

    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('✅ Login riuscito, token ottenuto');

      // Ora testiamo l'endpoint con autenticazione
      console.log('\n2. Test endpoint /api/users/image-status...');
      
      const imageStatusResponse = await axios.get(`${BASE_URL}/api/users/image-status`, {
        ...testConfig,
        headers: {
          ...testConfig.headers,
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('✅ Endpoint funziona correttamente!');
      console.log('📊 Risposta:', JSON.stringify(imageStatusResponse.data, null, 2));

    } else {
      console.log('❌ Login fallito:', loginResponse.data);
    }

  } catch (error: any) {
    console.log('❌ Errore durante il test:');
    
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.statusText}`);
      console.log(`   Data:`, error.response.data);
      
      if (error.response.status === 404) {
        console.log('\n🔍 Analisi errore 404:');
        console.log('   - L\'endpoint potrebbe non essere registrato correttamente');
        console.log('   - Verificare che le route siano caricate nel server');
        console.log('   - Controllare che il path sia corretto');
      } else if (error.response.status === 401) {
        console.log('\n🔍 Analisi errore 401:');
        console.log('   - Problema di autenticazione');
        console.log('   - Token non valido o scaduto');
      }
    } else {
      console.log('   Errore di rete:', error.message);
    }
  }
}

// Test alternativo senza autenticazione per verificare se l'endpoint esiste
async function testEndpointExistence() {
  console.log('\n🔍 Test esistenza endpoint (senza auth)...');
  
  try {
    await axios.get(`${BASE_URL}/api/users/image-status`, testConfig);
  } catch (error: any) {
    if (error.response) {
      if (error.response.status === 401) {
        console.log('✅ Endpoint esiste ma richiede autenticazione (401)');
      } else if (error.response.status === 404) {
        console.log('❌ Endpoint non trovato (404)');
      } else {
        console.log(`⚠️ Endpoint risponde con status: ${error.response.status}`);
      }
    } else {
      console.log('❌ Errore di rete:', error.message);
    }
  }
}

// Esegui i test
async function runTests() {
  await testEndpointExistence();
  await testUserImageStatusEndpoint();
}

runTests().catch(console.error);