/**
 * Test per endpoint /api/users/image-status
 * Verifica il funzionamento dell'endpoint per lo stato delle immagini utente
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3200';

async function testImageStatus() {
  try {
    console.log('🔐 Effettuando login...');
    
    // Login per ottenere il token
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'admin@assistenza.it',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login riuscito, token ottenuto');
    
    // Test endpoint image-status
    console.log('🖼️ Testando endpoint /api/users/image-status...');
    
    const imageStatusResponse = await axios.get(`${API_BASE_URL}/api/users/image-status`, {
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