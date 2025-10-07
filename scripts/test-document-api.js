/**
 * Test API document types
 */

const axios = require('axios');

async function testAPI() {
  console.log('\n🔍 TEST API DOCUMENT TYPES');
  console.log('===========================\n');
  
  try {
    // Prima ottieni il token di login
    console.log('1. Login come admin...');
    const loginResponse = await axios.post('http://localhost:3200/api/auth/login', {
      email: 'admin@richiesta-assistenza.it',
      password: 'Admin123!'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login riuscito\n');
    
    // Configura axios con il token
    const api = axios.create({
      baseURL: 'http://localhost:3200/api',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Test 1: Get document types
    console.log('2. Recupero tipi documento...');
    const typesResponse = await api.get('/admin/document-types');
    console.log(`✅ Trovati ${typesResponse.data.data.length} tipi documento`);
    
    if (typesResponse.data.data.length > 0) {
      console.log('\nTipi disponibili:');
      typesResponse.data.data.forEach(type => {
        console.log(`  - ${type.displayName} (${type.code})`);
      });
    }
    
    // Test 2: Get statistics
    console.log('\n3. Recupero statistiche...');
    const statsResponse = await api.get('/admin/document-types/stats');
    console.log('✅ Statistiche:');
    console.log(`  - Totale: ${statsResponse.data.data.total}`);
    console.log(`  - Attivi: ${statsResponse.data.data.active}`);
    console.log(`  - Obbligatori: ${statsResponse.data.data.required}`);
    console.log(`  - Di sistema: ${statsResponse.data.data.system}`);
    
    console.log('\n✅ TUTTI I TEST API PASSATI!');
    
  } catch (error) {
    console.error('❌ Errore:', error.response?.data || error.message);
  }
}

testAPI();
