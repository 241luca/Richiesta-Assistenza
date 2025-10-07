const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

async function testGoogleMapsAPI() {
  try {
    console.log('🔍 Testing Google Maps API Key...');
    
    // Recupera API key dal database
    const apiKey = await prisma.apiKey.findUnique({
      where: { service: 'GOOGLE_MAPS' }
    });
    
    if (!apiKey || !apiKey.key) {
      console.log('❌ API key not found');
      return;
    }
    
    console.log(`✅ Found API key: ${apiKey.key.substring(0, 15)}...`);
    console.log(`🔹 Active: ${apiKey.isActive}`);
    
    // Test 1: Geocoding API
    console.log('\n🧪 TEST 1: Geocoding API');
    try {
      const geocodeResponse = await axios.get(
        'https://maps.googleapis.com/maps/api/geocode/json',
        {
          params: {
            address: 'Roma, Italia',
            key: apiKey.key,
            region: 'IT',
            language: 'it'
          },
          timeout: 10000
        }
      );
      
      console.log(`📍 Geocoding Status: ${geocodeResponse.data.status}`);
      if (geocodeResponse.data.status === 'OK') {
        console.log('✅ Geocoding API works correctly');
        const location = geocodeResponse.data.results[0].geometry.location;
        console.log(`📍 Roma coordinates: ${location.lat}, ${location.lng}`);
      } else {
        console.log(`❌ Geocoding failed: ${geocodeResponse.data.status}`);
        console.log(`💡 Error message: ${geocodeResponse.data.error_message || 'No error message'}`);
      }
    } catch (error) {
      console.log('❌ Geocoding request failed:', error.message);
    }
    
    // Test 2: Places API (autocomplete)
    console.log('\n🧪 TEST 2: Places API (Autocomplete)');
    try {
      const placesResponse = await axios.get(
        'https://maps.googleapis.com/maps/api/place/autocomplete/json',
        {
          params: {
            input: 'Roma',
            key: apiKey.key,
            language: 'it',
            components: 'country:it'
          },
          timeout: 10000
        }
      );
      
      console.log(`🏛️ Places Status: ${placesResponse.data.status}`);
      if (placesResponse.data.status === 'OK') {
        console.log('✅ Places API works correctly');
        console.log(`📍 Found ${placesResponse.data.predictions.length} suggestions`);
      } else {
        console.log(`❌ Places failed: ${placesResponse.data.status}`);
        console.log(`💡 Error message: ${placesResponse.data.error_message || 'No error message'}`);
      }
    } catch (error) {
      console.log('❌ Places request failed:', error.message);
    }
    
    // Test 3: Distance Matrix API  
    console.log('\n🧪 TEST 3: Distance Matrix API');
    try {
      const distanceResponse = await axios.get(
        'https://maps.googleapis.com/maps/api/distancematrix/json',
        {
          params: {
            origins: 'Roma, Italia',
            destinations: 'Milano, Italia',
            key: apiKey.key,
            units: 'metric',
            mode: 'driving',
            language: 'it'
          },
          timeout: 10000
        }
      );
      
      console.log(`🛣️ Distance Status: ${distanceResponse.data.status}`);
      if (distanceResponse.data.status === 'OK') {
        console.log('✅ Distance Matrix API works correctly');
        const element = distanceResponse.data.rows[0].elements[0];
        if (element.status === 'OK') {
          console.log(`📍 Roma -> Milano: ${element.distance.text}, ${element.duration.text}`);
        }
      } else {
        console.log(`❌ Distance failed: ${distanceResponse.data.status}`);
        console.log(`💡 Error message: ${distanceResponse.data.error_message || 'No error message'}`);
      }
    } catch (error) {
      console.log('❌ Distance request failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testGoogleMapsAPI();
