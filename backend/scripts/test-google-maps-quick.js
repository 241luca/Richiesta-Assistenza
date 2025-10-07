/**
 * Test rapido della chiave Google Maps API
 * Esegui con: node test-google-maps-quick.js
 */

const axios = require('axios');

// IMPORTANTE: Sostituisci questa con la tua chiave API
const API_KEY = 'AIzaSyCsBYVJ4IcfcK92UehJ2iqTH2tmJv6Z4Bg';

async function testGoogleMapsKey() {
  console.log('\n🔍 Test Rapido Google Maps API Key\n');
  console.log('='.repeat(50));
  console.log(`Chiave testata: ${API_KEY.substring(0, 10)}...`);
  console.log('='.repeat(50));

  let testsPassati = 0;
  let testsTotali = 0;

  // Test 1: Geocoding API
  console.log('\n1️⃣ Test Geocoding API...');
  testsTotali++;
  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          address: 'Colosseo, Roma, Italia',
          key: API_KEY
        }
      }
    );

    if (response.data.status === 'OK') {
      console.log('✅ Geocoding API: FUNZIONA');
      const location = response.data.results[0].geometry.location;
      console.log(`   Coordinate: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
      testsPassati++;
    } else {
      console.log(`❌ Geocoding API: ${response.data.status}`);
      if (response.data.error_message) {
        console.log(`   Errore: ${response.data.error_message}`);
      }
    }
  } catch (error) {
    console.log(`❌ Geocoding API: Errore - ${error.message}`);
  }

  // Test 2: Distance Matrix API
  console.log('\n2️⃣ Test Distance Matrix API...');
  testsTotali++;
  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/distancematrix/json',
      {
        params: {
          origins: 'Milano, Italia',
          destinations: 'Roma, Italia',
          key: API_KEY
        }
      }
    );

    if (response.data.status === 'OK') {
      console.log('✅ Distance Matrix API: FUNZIONA');
      const element = response.data.rows[0].elements[0];
      if (element.status === 'OK') {
        console.log(`   Milano-Roma: ${element.distance.text}, ${element.duration.text}`);
        testsPassati++;
      }
    } else {
      console.log(`❌ Distance Matrix API: ${response.data.status}`);
      if (response.data.error_message) {
        console.log(`   Errore: ${response.data.error_message}`);
      }
    }
  } catch (error) {
    console.log(`❌ Distance Matrix API: Errore - ${error.message}`);
  }

  // Test 3: Places Autocomplete API
  console.log('\n3️⃣ Test Places Autocomplete API...');
  testsTotali++;
  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/autocomplete/json',
      {
        params: {
          input: 'Piazza San Marco',
          key: API_KEY
        }
      }
    );

    if (response.data.status === 'OK' || response.data.status === 'ZERO_RESULTS') {
      console.log('✅ Places API: FUNZIONA');
      if (response.data.predictions && response.data.predictions.length > 0) {
        console.log(`   Trovati ${response.data.predictions.length} risultati`);
      }
      testsPassati++;
    } else {
      console.log(`❌ Places API: ${response.data.status}`);
      if (response.data.error_message) {
        console.log(`   Errore: ${response.data.error_message}`);
      }
    }
  } catch (error) {
    console.log(`❌ Places API: Errore - ${error.message}`);
  }

  // Test 4: Directions API
  console.log('\n4️⃣ Test Directions API...');
  testsTotali++;
  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/directions/json',
      {
        params: {
          origin: 'Torino, Italia',
          destination: 'Milano, Italia',
          key: API_KEY
        }
      }
    );

    if (response.data.status === 'OK') {
      console.log('✅ Directions API: FUNZIONA');
      const route = response.data.routes[0];
      const leg = route.legs[0];
      console.log(`   Torino-Milano: ${leg.distance.text}, ${leg.duration.text}`);
      testsPassati++;
    } else {
      console.log(`❌ Directions API: ${response.data.status}`);
      if (response.data.error_message) {
        console.log(`   Errore: ${response.data.error_message}`);
      }
    }
  } catch (error) {
    console.log(`❌ Directions API: Errore - ${error.message}`);
  }

  // Riepilogo
  console.log('\n' + '='.repeat(50));
  console.log('📊 RIEPILOGO:');
  console.log(`   Test passati: ${testsPassati}/${testsTotali}`);
  
  if (testsPassati === testsTotali) {
    console.log('\n🎉 SUCCESSO! La chiave API è valida e tutte le API sono abilitate.');
  } else if (testsPassati > 0) {
    console.log('\n⚠️ ATTENZIONE: Solo alcune API funzionano.');
    console.log('   Verifica che tutte le API necessarie siano abilitate su Google Cloud Console.');
  } else {
    console.log('\n❌ ERRORE: La chiave API non è valida o non funziona.');
    console.log('\n📝 COSA FARE:');
    console.log('   1. Vai su https://console.cloud.google.com');
    console.log('   2. Seleziona il tuo progetto');
    console.log('   3. Vai su "API e servizi" > "Credenziali"');
    console.log('   4. Crea una nuova chiave API o verifica quella esistente');
    console.log('   5. Abilita queste API:');
    console.log('      - Maps JavaScript API');
    console.log('      - Geocoding API');
    console.log('      - Distance Matrix API');
    console.log('      - Places API');
    console.log('      - Directions API');
  }
  
  console.log('='.repeat(50));
}

// Esegui il test
console.log('🚀 Avvio test Google Maps API...');
console.log(`   Chiave: ${API_KEY}`);
testGoogleMapsKey().catch(console.error);
