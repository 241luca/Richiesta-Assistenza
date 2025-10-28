import axios from 'axios';

const BASE_URL = 'http://localhost:3200';

async function testImageStatus() {
  try {
    console.log('🔐 Effettuando login...');
    
    // Login per ottenere un token valido
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@assistenza.it',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      console.error('❌ Login fallito:', loginResponse.data.message);
      return;
    }

    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login riuscito, token ottenuto');

    // Test dell'endpoint image-status
    console.log('🧪 Testando endpoint /api/users/image-status...');
    
    const imageStatusResponse = await axios.get(`${BASE_URL}/api/users/image-status`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Risposta endpoint image-status:');
    console.log(JSON.stringify(imageStatusResponse.data, null, 2));

  } catch (error: any) {
    console.error('❌ Errore durante il test:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testImageStatus();