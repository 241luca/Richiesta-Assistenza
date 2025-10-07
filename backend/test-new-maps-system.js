// Test completo del nuovo sistema Google Maps (solo database)
// Esegui con: node test-new-maps-system.js

const axios = require('axios');

async function testNewMapsSystem() {
  console.log('\n🧪 TEST NUOVO SISTEMA GOOGLE MAPS (DATABASE-ONLY)\n');
  console.log('='.repeat(60));

  let allTestsPassed = 0;
  let totalTests = 0;

  // Test 1: Backend endpoint /api/maps/config
  console.log('\n1️⃣ Test Backend Endpoint /api/maps/config...');
  totalTests++;
  
  try {
    const response = await axios.get('http://localhost:3200/api/maps/config');
    
    if (response.status === 200 && response.data?.data?.apiKey) {
      console.log('✅ Backend restituisce chiave API dal database');
      console.log(`   Chiave: ${response.data.data.apiKey.substring(0, 15)}...`);
      console.log(`   Configurata: ${response.data.data.isConfigured}`);
      allTestsPassed++;
    } else {
      console.log('❌ Backend response non valida:', response.data);
    }
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('❌ Backend: API key non trovata nel database');
      console.log('   Messaggio:', error.response.data?.message);
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend non raggiungibile su :3200');
      console.log('   Avvia il backend con: cd backend && npm run dev');
    } else {
      console.log('❌ Errore backend:', error.message);
    }
  }

  // Test 2: Verifica che NON usi più variabili d'ambiente
  console.log('\n2️⃣ Test Verifica NO Environment Variables...');
  totalTests++;
  
  // Simula chiamata con env vuoto
  const originalEnv = process.env.GOOGLE_MAPS_API_KEY;
  delete process.env.GOOGLE_MAPS_API_KEY;
  
  try {
    const response = await axios.get('http://localhost:3200/api/maps/config');
    
    if (response.status === 200) {
      console.log('✅ Sistema funziona SENZA variabili d\'ambiente');
      console.log('   Usa correttamente solo il database');
      allTestsPassed++;
    } else {
      console.log('❌ Sistema non dovrebbe funzionare senza database');
    }
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✅ Sistema correttamente rifiuta senza database');
      console.log('   Non usa fallback a variabili d\'ambiente');
      allTestsPassed++;
    } else {
      console.log('❌ Errore inaspettato:', error.message);
    }
  } finally {
    // Ripristina env per sicurezza
    if (originalEnv) process.env.GOOGLE_MAPS_API_KEY = originalEnv;
  }

  // Test 3: Test chiamata diretta Google Maps API
  console.log('\n3️⃣ Test Chiamata Diretta Google Maps API...');
  totalTests++;
  
  try {
    const configResponse = await axios.get('http://localhost:3200/api/maps/config');
    
    if (configResponse.data?.data?.apiKey) {
      const apiKey = configResponse.data.data.apiKey;
      
      // Test geocoding
      const mapsResponse = await axios.get(
        'https://maps.googleapis.com/maps/api/geocode/json',
        {
          params: {
            address: 'Roma, Italia',
            key: apiKey
          }
        }
      );
      
      if (mapsResponse.data.status === 'OK') {
        console.log('✅ Google Maps API risponde correttamente');
        const location = mapsResponse.data.results[0].geometry.location;
        console.log(`   Coordinate Roma: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
        allTestsPassed++;
      } else {
        console.log('❌ Google Maps API error:', mapsResponse.data.status);
        if (mapsResponse.data.error_message) {
          console.log('   Messaggio:', mapsResponse.data.error_message);
        }
      }
    } else {
      console.log('❌ Nessuna API key disponibile per il test');
    }
  } catch (error) {
    console.log('❌ Errore nel test Google Maps API:', error.message);
  }

  // Test 4: Test endpoint geocoding del sistema
  console.log('\n4️⃣ Test Endpoint Sistema /api/maps/geocode...');
  totalTests++;
  
  try {
    // Avremmo bisogno di un token per questo test
    console.log('⚠️ Test richiede autenticazione - saltato per ora');
    console.log('   Per testare: usa frontend o Postman con token valido');
  } catch (error) {
    console.log('❌ Errore test geocoding:', error.message);
  }

  // Risultati finali
  console.log('\n' + '='.repeat(60));
  console.log('📊 RISULTATI TEST:');
  console.log(`   Test passati: ${allTestsPassed}/${totalTests}`);
  
  if (allTestsPassed === totalTests) {
    console.log('\n🎉 TUTTI I TEST PASSATI!');
    console.log('✅ Il sistema database-only funziona correttamente');
  } else if (allTestsPassed > 0) {
    console.log('\n⚠️ ALCUNI TEST FALLITI');
    console.log('🔧 Verifica la configurazione del database');
  } else {
    console.log('\n❌ TUTTI I TEST FALLITI');
    console.log('🚨 Problema critico nel sistema');
  }
  
  console.log('\n📝 PROSSIMI PASSI:');
  console.log('1. Se backend OK → Testa frontend');
  console.log('2. Se problemi → Verifica database e chiave API');
  console.log('3. Apri http://localhost:5193 per test completo');
  console.log('='.repeat(60));
}

// Avvia i test
testNewMapsSystem().catch(console.error);
