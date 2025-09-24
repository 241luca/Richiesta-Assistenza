#!/usr/bin/env node

/**
 * Test invio con diversi formati numero
 */

const axios = require('axios');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MjUzMDRiMC04OGI3LTRjNTctOGZlZS0wOTAyMjA5NTNiMTAiLCJpYXQiOjE3NTg3MTM2MTEsImV4cCI6MTc1OTMxODQxMX0.gBkeCJs665ve0JRbT8z9X0cD1vLmQ0MMtj5qWnjPOqs';

const api = axios.create({
  baseURL: 'http://localhost:3200/api',
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function testFormati() {
  const numero = '3403803728';  // Tuo numero senza prefisso
  const messaggio = 'Test invio messaggio WhatsApp';
  
  const formati = [
    numero,                    // 3403803728
    '39' + numero,            // 393403803728  
    '+39' + numero,           // +393403803728
    '0039' + numero,          // 00393403803728
    numero + '@c.us'          // 3403803728@c.us
  ];
  
  console.log('🧪 TEST INVIO CON DIVERSI FORMATI\n');
  
  for (const formato of formati) {
    console.log(`\n📱 Provo con formato: ${formato}`);
    
    try {
      const response = await api.post('/whatsapp/send', {
        phoneNumber: formato,
        message: messaggio + ` (formato: ${formato})`
      });
      
      if (response.data.success) {
        console.log(`✅ SUCCESSO con formato: ${formato}`);
        console.log('Response:', response.data.data);
        break; // Se funziona, fermati
      }
    } catch (error) {
      console.log(`❌ Errore con ${formato}:`, error.response?.data?.message || error.message);
    }
    
    // Attendi 2 secondi tra un tentativo e l'altro
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

testFormati().catch(console.error);
