/**
 * Script per testare la chiave Google Maps API
 * Esegue test su tutti i servizi Google Maps utilizzati dal sistema
 */

import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import colors from 'colors';

const prisma = new PrismaClient();

async function testGoogleMapsAPI() {
  console.log(colors.cyan('\n🔍 Test Google Maps API Key\n'));
  console.log('='.repeat(50));

  try {
    // 1. Recupera la chiave dal database
    console.log(colors.yellow('\n📦 Recupero chiave dal database...'));
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { service: 'GOOGLE_MAPS' }
    });

    if (!apiKeyRecord || !apiKeyRecord.key) {
      console.log(colors.red('❌ Chiave API non trovata nel database!'));
      process.exit(1);
    }

    const apiKey = apiKeyRecord.key;
    console.log(colors.green(`✅ Chiave trovata: ${apiKey.substring(0, 10)}...`));
    console.log(colors.gray(`   Attiva: ${apiKeyRecord.isActive ? 'Sì' : 'No'}`));

    // Array per tracciare i risultati
    const results = [];

    // 2. Test Geocoding API
    console.log(colors.yellow('\n🗺️ Test Geocoding API...'));
    try {
      const geocodeResponse = await axios.get(
        'https://maps.googleapis.com/maps/api/geocode/json',
        {
          params: {
            address: 'Colosseo, Roma, Italia',
            key: apiKey,
            language: 'it'
          }
        }
      );

      if (geocodeResponse.data.status === 'OK') {
        console.log(colors.green('✅ Geocoding API funzionante'));
        const location = geocodeResponse.data.results[0].geometry.location;
        console.log(colors.gray(`   Coordinate Colosseo: ${location.lat}, ${location.lng}`));
        results.push({ api: 'Geocoding', status: 'OK' });
      } else {
        console.log(colors.red(`❌ Geocoding API: ${geocodeResponse.data.status}`));
        if (geocodeResponse.data.error_message) {
          console.log(colors.red(`   Errore: ${geocodeResponse.data.error_message}`));
        }
        results.push({ api: 'Geocoding', status: geocodeResponse.data.status });
      }
    } catch (error: any) {
      console.log(colors.red(`❌ Geocoding API fallito: ${error.message}`));
      results.push({ api: 'Geocoding', status: 'ERROR' });
    }

    // 3. Test Distance Matrix API
    console.log(colors.yellow('\n📏 Test Distance Matrix API...'));
    try {
      const distanceResponse = await axios.get(
        'https://maps.googleapis.com/maps/api/distancematrix/json',
        {
          params: {
            origins: 'Milano, Italia',
            destinations: 'Roma, Italia',
            mode: 'driving',
            units: 'metric',
            language: 'it',
            key: apiKey
          }
        }
      );

      if (distanceResponse.data.status === 'OK') {
        console.log(colors.green('✅ Distance Matrix API funzionante'));
        const element = distanceResponse.data.rows[0].elements[0];
        if (element.status === 'OK') {
          console.log(colors.gray(`   Milano-Roma: ${element.distance.text}, ${element.duration.text}`));
        }
        results.push({ api: 'Distance Matrix', status: 'OK' });
      } else {
        console.log(colors.red(`❌ Distance Matrix API: ${distanceResponse.data.status}`));
        if (distanceResponse.data.error_message) {
          console.log(colors.red(`   Errore: ${distanceResponse.data.error_message}`));
        }
        results.push({ api: 'Distance Matrix', status: distanceResponse.data.status });
      }
    } catch (error: any) {
      console.log(colors.red(`❌ Distance Matrix API fallito: ${error.message}`));
      results.push({ api: 'Distance Matrix', status: 'ERROR' });
    }

    // 4. Test Places API (Autocomplete)
    console.log(colors.yellow('\n📍 Test Places Autocomplete API...'));
    try {
      const placesResponse = await axios.get(
        'https://maps.googleapis.com/maps/api/place/autocomplete/json',
        {
          params: {
            input: 'Piazza San Marco',
            types: 'geocode',
            language: 'it',
            components: 'country:it',
            key: apiKey
          }
        }
      );

      if (placesResponse.data.status === 'OK' || placesResponse.data.status === 'ZERO_RESULTS') {
        console.log(colors.green('✅ Places Autocomplete API funzionante'));
        if (placesResponse.data.predictions && placesResponse.data.predictions.length > 0) {
          console.log(colors.gray(`   Trovati ${placesResponse.data.predictions.length} risultati`));
          console.log(colors.gray(`   Primo: ${placesResponse.data.predictions[0].description}`));
        }
        results.push({ api: 'Places Autocomplete', status: 'OK' });
      } else {
        console.log(colors.red(`❌ Places Autocomplete API: ${placesResponse.data.status}`));
        if (placesResponse.data.error_message) {
          console.log(colors.red(`   Errore: ${placesResponse.data.error_message}`));
        }
        results.push({ api: 'Places Autocomplete', status: placesResponse.data.status });
      }
    } catch (error: any) {
      console.log(colors.red(`❌ Places Autocomplete API fallito: ${error.message}`));
      results.push({ api: 'Places Autocomplete', status: 'ERROR' });
    }

    // 5. Test Directions API
    console.log(colors.yellow('\n🚗 Test Directions API...'));
    try {
      const directionsResponse = await axios.get(
        'https://maps.googleapis.com/maps/api/directions/json',
        {
          params: {
            origin: 'Torino, Italia',
            destination: 'Milano, Italia',
            mode: 'driving',
            language: 'it',
            key: apiKey
          }
        }
      );

      if (directionsResponse.data.status === 'OK') {
        console.log(colors.green('✅ Directions API funzionante'));
        const route = directionsResponse.data.routes[0];
        const leg = route.legs[0];
        console.log(colors.gray(`   Torino-Milano: ${leg.distance.text}, ${leg.duration.text}`));
        results.push({ api: 'Directions', status: 'OK' });
      } else {
        console.log(colors.red(`❌ Directions API: ${directionsResponse.data.status}`));
        if (directionsResponse.data.error_message) {
          console.log(colors.red(`   Errore: ${directionsResponse.data.error_message}`));
        }
        results.push({ api: 'Directions', status: directionsResponse.data.status });
      }
    } catch (error: any) {
      console.log(colors.red(`❌ Directions API fallito: ${error.message}`));
      results.push({ api: 'Directions', status: 'ERROR' });
    }

    // Riepilogo finale
    console.log(colors.cyan('\n📊 RIEPILOGO TEST'));
    console.log('='.repeat(50));
    
    const successCount = results.filter(r => r.status === 'OK' || r.status === 'FORMAT_OK').length;
    const totalCount = results.length;
    
    results.forEach(result => {
      const icon = (result.status === 'OK' || result.status === 'FORMAT_OK') ? '✅' : '❌';
      const color = (result.status === 'OK' || result.status === 'FORMAT_OK') ? colors.green : colors.red;
      console.log(color(`${icon} ${result.api}: ${result.status}`));
    });

    console.log('\n' + '='.repeat(50));
    
    if (successCount === totalCount) {
      console.log(colors.green.bold('\n🎉 TUTTI I TEST PASSATI! La chiave API è valida e funzionante.'));
    } else if (successCount > 0) {
      console.log(colors.yellow.bold(`\n⚠️ ATTENZIONE: ${successCount}/${totalCount} test passati.`));
      console.log(colors.yellow('Alcune API potrebbero non essere abilitate nel progetto Google Cloud.'));
    } else {
      console.log(colors.red.bold('\n❌ ERRORE: Nessun test passato!'));
      console.log(colors.red('La chiave API non è valida o non ha le autorizzazioni necessarie.'));
      console.log(colors.cyan('\n📝 COSA FARE:'));
      console.log(colors.gray('   1. Vai su https://console.cloud.google.com'));
      console.log(colors.gray('   2. Seleziona/crea un progetto'));
      console.log(colors.gray('   3. Vai su "API e servizi" > "Libreria"'));
      console.log(colors.gray('   4. Abilita queste API:'));
      console.log(colors.gray('      - Maps JavaScript API'));
      console.log(colors.gray('      - Geocoding API'));
      console.log(colors.gray('      - Distance Matrix API'));
      console.log(colors.gray('      - Places API'));
      console.log(colors.gray('      - Directions API'));
      console.log(colors.gray('   5. Vai su "API e servizi" > "Credenziali"'));
      console.log(colors.gray('   6. Crea una nuova chiave API'));
      console.log(colors.gray('   7. Aggiorna la chiave nel database'));
    }

    // Suggerimenti per errori comuni
    if (results.some(r => r.status === 'REQUEST_DENIED')) {
      console.log(colors.yellow('\n💡 SUGGERIMENTO: "REQUEST_DENIED" indica che:'));
      console.log(colors.gray('   - La chiave API non è valida'));
      console.log(colors.gray('   - Oppure l\'API specifica non è abilitata nel progetto Google Cloud'));
    }

    if (results.some(r => r.status === 'OVER_QUERY_LIMIT')) {
      console.log(colors.yellow('\n💡 SUGGERIMENTO: "OVER_QUERY_LIMIT" indica che:'));
      console.log(colors.gray('   - Hai superato il limite di richieste'));
      console.log(colors.gray('   - Potrebbe essere necessario abilitare la fatturazione'));
    }

  } catch (error) {
    console.error(colors.red('\n❌ Errore generale nello script:'), error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

// Esegui il test
console.log(colors.cyan.bold('🚀 Avvio test Google Maps API...'));
testGoogleMapsAPI();
