// Test script per verificare il calcolo distanza Google Maps
// Esegui con: node test-google-maps.js

const axios = require('axios');

async function testGoogleMaps() {
  console.log('🧪 Test Google Maps Distance Calculation\n');
  
  // Prima fai login per ottenere il token
  try {
    console.log('1. Login come professionista (Mario Rossi - Idraulico)...');
    const loginResponse = await axios.post('http://localhost:3200/api/auth/login', {
      email: 'mario.rossi@assistenza.it',
      password: 'password123'
    });
    
    const token = loginResponse.data.data.token;
    const user = loginResponse.data.data.user;
    console.log('✅ Login riuscito come:', user.firstName, user.lastName, '- Ruolo:', user.role);
    console.log('\n');
    
    // Test 1: Calcolo distanza generico
    console.log('2. Test calcolo distanza generico...');
    try {
      const distanceResponse = await axios.get('http://localhost:3200/api/travel/calculate', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          from: 'Via Roma 1, Milano, Italia',
          to: 'Via Duomo 10, Milano, Italia'
        }
      });
      
      console.log('✅ Risposta calcolo distanza:', JSON.stringify(distanceResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Errore calcolo distanza:', error.response?.data || error.message);
      if (error.response?.status === 500) {
        console.log('   Dettagli errore server:', error.response.data.error);
      }
    }
    
    // Test 2: Calcolo distanza per una richiesta specifica (usa un ID reale dal DB)
    console.log('\n3. Test calcolo distanza per richiesta specifica...');
    try {
      const requestId = '7899d427-a569-4ace-9fdf-6c635fbabf3e'; // Potatura urgente
      const travelInfoResponse = await axios.get(`http://localhost:3200/api/travel/request/${requestId}/travel-info`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Info viaggio per richiesta:', JSON.stringify(travelInfoResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Errore info viaggio:', error.response?.data || error.message);
      if (error.response?.status === 500) {
        console.log('   Dettagli errore server:', error.response.data.error);
      }
    }
    
    // Test 3: Verifica indirizzo di lavoro
    console.log('\n4. Test recupero indirizzo di lavoro...');
    try {
      const workAddressResponse = await axios.get('http://localhost:3200/api/travel/work-address', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Indirizzo di lavoro:', JSON.stringify(workAddressResponse.data.data, null, 2));
    } catch (error) {
      console.log('❌ Errore indirizzo lavoro:', error.response?.data || error.message);
    }
    
    // Test 4: Prova anche con Francesco Russo (Elettricista)
    console.log('\n5. Test con secondo professionista (Francesco Russo - Elettricista)...');
    try {
      const login2 = await axios.post('http://localhost:3200/api/auth/login', {
        email: 'francesco.russo@assistenza.it',
        password: 'password123'
      });
      
      const token2 = login2.data.data.token;
      const user2 = login2.data.data.user;
      console.log('✅ Login come:', user2.firstName, user2.lastName);
      
      const distanceTest = await axios.get('http://localhost:3200/api/travel/calculate', {
        headers: {
          'Authorization': `Bearer ${token2}`
        },
        params: {
          from: 'Piazza Duomo, Milano, Italia',
          to: 'Stazione Centrale, Milano, Italia'
        }
      });
      
      console.log('✅ Distanza calcolata:', distanceTest.data.data);
    } catch (error) {
      console.log('❌ Errore secondo test:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.log('❌ Errore login:', error.response?.data || error.message);
  }
}

// Esegui il test
testGoogleMaps().then(() => {
  console.log('\n✅ Test completato');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Test fallito:', error);
  process.exit(1);
});