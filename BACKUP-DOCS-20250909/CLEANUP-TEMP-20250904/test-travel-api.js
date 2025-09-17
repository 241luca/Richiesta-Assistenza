/**
 * Test script per verificare l'endpoint travel/cost-settings
 * Esegui con: node test-travel-api.js
 */

const axios = require('axios');

// Configurazione
const API_URL = 'http://localhost:3200';
const TEST_USER = {
  email: 'test@example.com',  // Sostituisci con un utente reale
  password: 'password123'      // Sostituisci con la password reale
};

async function testTravelAPI() {
  try {
    console.log('🔄 Test Travel Cost Settings API\n');
    
    // 1. Login per ottenere il token
    console.log('1. Login...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    const { token, user } = loginResponse.data.data;
    console.log(`✅ Login successful - User: ${user.email} (${user.role})`);
    console.log(`   Token: ${token.substring(0, 20)}...`);
    
    // 2. Verifica se l'utente è un professionista
    if (user.role !== 'PROFESSIONAL') {
      console.log(`⚠️  Warning: User is not a PROFESSIONAL (role: ${user.role})`);
      console.log('   The API might reject the request');
    }
    
    // 3. Test GET /api/travel/cost-settings
    console.log('\n2. Testing GET /api/travel/cost-settings...');
    try {
      const settingsResponse = await axios.get(`${API_URL}/api/travel/cost-settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ GET successful!');
      console.log('   Response:', JSON.stringify(settingsResponse.data, null, 2));
    } catch (error) {
      console.log('❌ GET failed!');
      console.log('   Status:', error.response?.status);
      console.log('   Error:', error.response?.data);
    }
    
    // 4. Test POST /api/travel/cost-settings
    console.log('\n3. Testing POST /api/travel/cost-settings...');
    const testSettings = {
      baseCost: 1000,
      freeDistanceKm: 0,
      isActive: true,
      costRanges: [
        { fromKm: 0, toKm: 10, costPerKm: 100 },
        { fromKm: 10, toKm: 50, costPerKm: 80 },
        { fromKm: 50, toKm: null, costPerKm: 60 }
      ],
      supplements: [
        { type: 'WEEKEND', percentage: 20, fixedAmount: 0, isActive: true },
        { type: 'NIGHT', percentage: 30, fixedAmount: 0, isActive: false },
        { type: 'HOLIDAY', percentage: 50, fixedAmount: 0, isActive: false },
        { type: 'URGENT', percentage: 0, fixedAmount: 2000, isActive: true }
      ]
    };
    
    try {
      const saveResponse = await axios.post(`${API_URL}/api/travel/cost-settings`, testSettings, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ POST successful!');
      console.log('   Response:', JSON.stringify(saveResponse.data, null, 2));
    } catch (error) {
      console.log('❌ POST failed!');
      console.log('   Status:', error.response?.status);
      console.log('   Error:', error.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response data:', error.response.data);
    }
  }
}

// Esegui il test
testTravelAPI();
