// Test per verificare l'endpoint WhatsApp messages
const axios = require('axios');

async function testMessagesEndpoint() {
  try {
    console.log('🔍 Test Endpoint GET /api/whatsapp/messages\n');
    
    // Prima fai login per ottenere il token
    console.log('1. Login per ottenere token...');
    const loginResponse = await axios.post('http://localhost:3200/api/auth/login', {
      email: 'admin@example.com', // Sostituisci con le tue credenziali
      password: 'Admin123!@#'      // Sostituisci con la tua password
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login effettuato, token ottenuto\n');
    
    // Ora chiama l'endpoint messages
    console.log('2. Chiamata GET /api/whatsapp/messages...');
    const messagesResponse = await axios.get('http://localhost:3200/api/whatsapp/messages', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Risposta ricevuta:\n');
    console.log('Struttura risposta:', JSON.stringify(messagesResponse.data, null, 2));
    
    // Verifica la struttura
    const responseData = messagesResponse.data;
    console.log('\n📊 Analisi struttura:');
    console.log('- success:', responseData.success);
    console.log('- message:', responseData.message);
    console.log('- data presente?', responseData.data ? 'Sì' : 'No');
    
    if (responseData.data) {
      console.log('- data è un array?', Array.isArray(responseData.data.data) ? 'Sì (data.data)' : Array.isArray(responseData.data) ? 'Sì (data)' : 'No');
      
      if (responseData.data.data) {
        console.log('- numero messaggi in data.data:', responseData.data.data.length);
      } else if (Array.isArray(responseData.data)) {
        console.log('- numero messaggi in data:', responseData.data.length);
      }
      
      if (responseData.data.pagination) {
        console.log('- paginazione presente:', responseData.data.pagination);
      }
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.response?.data || error.message);
  }
}

// Esegui il test
testMessagesEndpoint();
