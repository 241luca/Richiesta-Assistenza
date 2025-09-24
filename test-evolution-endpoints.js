/**
 * Script per testare gli endpoint corretti di Evolution API
 * Basato sulla documentazione ufficiale
 */

const axios = require('axios');

async function testEvolutionEndpoints() {
  const BASE_URL = 'http://37.27.89.35:8080';
  const API_KEY = 'evolution_key_luca_2025_secure_21806';
  const INSTANCE = 'assistenza';
  
  console.log('🔍 TEST ENDPOINT EVOLUTION API\n');
  
  // 1. Test root endpoint per versione
  try {
    console.log('1. Verifica versione API:');
    const info = await axios.get(BASE_URL);
    console.log('   Version:', info.data.version);
    console.log('   Status:', info.data.status);
    console.log('   Message:', info.data.message);
    console.log('');
  } catch (error) {
    console.log('   ❌ Errore:', error.message);
  }
  
  // 2. Test creazione istanza (usa gli endpoint corretti dalla documentazione)
  // Prima proviamo a vedere la struttura degli endpoint
  try {
    console.log('2. Test endpoint istanza:');
    
    // Prova diversi possibili endpoint basati sulla documentazione
    const endpoints = [
      '/instance/create',
      '/instance/connect',
      '/instance/connectionState',
      '/instance/fetchInstances'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios({
          method: 'GET',
          url: BASE_URL + endpoint,
          headers: { 'apikey': API_KEY },
          timeout: 2000
        });
        console.log(`   ✅ ${endpoint} - Status: ${response.status}`);
      } catch (error) {
        console.log(`   ❌ ${endpoint} - Error: ${error.response?.status || error.message}`);
      }
    }
    
  } catch (error) {
    console.log('Errore generale:', error.message);
  }
}

testEvolutionEndpoints().catch(console.error);
