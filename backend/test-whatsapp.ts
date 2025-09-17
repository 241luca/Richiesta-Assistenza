// Test diretto invio WhatsApp
import axios from 'axios';

async function testWhatsApp() {
  try {
    console.log('🔧 Test invio WhatsApp...');
    
    const payload = {
      number: "393420035610",
      type: "text",
      message: "Test messaggio dal backend Node.js",
      instance_id: "68C67956807C8",
      access_token: "68c575f3c2ff1"
    };
    
    console.log('📤 Payload:', payload);
    
    const response = await axios.post('https://app.sendapp.cloud/api/send', payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Risposta:', response.data);
  } catch (error: any) {
    console.error('❌ Errore:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('Headers:', error.response?.headers);
  }
}

testWhatsApp();
