#!/usr/bin/env node

/**
 * Test invio messaggio WhatsApp
 */

const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MjUzMDRiMC04OGI3LTRjNTctOGZlZS0wOTAyMjA5NTNiMTAiLCJpYXQiOjE3NTg3MTM2MTEsImV4cCI6MTc1OTMxODQxMX0.gBkeCJs665ve0JRbT8z9X0cD1vLmQ0MMtj5qWnjPOqs';

const api = axios.create({
  baseURL: 'http://localhost:3200/api',
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function testInvio() {
  console.log('\n🎉 WHATSAPP È CONNESSO E FUNZIONANTE!\n');
  console.log('========================================');
  console.log('   TEST INVIO MESSAGGIO');
  console.log('========================================\n');
  
  // Verifica statistiche prima dell'invio
  try {
    const statsRes = await api.get('/whatsapp/stats');
    const stats = statsRes.data.data;
    console.log('📊 STATISTICHE ATTUALI:');
    console.log(`   Messaggi totali: ${stats.totalMessages}`);
    console.log(`   Messaggi oggi: ${stats.todayMessages}`);
    console.log(`   Inviati: ${stats.sentMessages}`);
    console.log(`   Ricevuti: ${stats.receivedMessages}\n`);
  } catch (error) {
    console.log('Errore recupero statistiche');
  }
  
  rl.question('📱 Inserisci numero telefono (es: 393351234567): ', (phoneNumber) => {
    if (!phoneNumber) {
      console.log('❌ Numero non valido');
      rl.close();
      return;
    }
    
    rl.question('💬 Inserisci messaggio da inviare: ', async (message) => {
      if (!message) {
        console.log('❌ Messaggio vuoto');
        rl.close();
        return;
      }
      
      console.log('\n📤 Invio messaggio in corso...');
      
      try {
        const response = await api.post('/whatsapp/send', {
          phoneNumber: phoneNumber.trim(),
          message: message.trim()
        });
        
        if (response.data.success) {
          console.log('\n✅ MESSAGGIO INVIATO CON SUCCESSO!');
          console.log('Dettagli:', response.data.data);
          
          // Verifica statistiche dopo l'invio
          const statsAfter = await api.get('/whatsapp/stats');
          const newStats = statsAfter.data.data;
          console.log('\n📊 STATISTICHE AGGIORNATE:');
          console.log(`   Messaggi totali: ${newStats.totalMessages}`);
          console.log(`   Messaggi oggi: ${newStats.todayMessages}`);
          console.log(`   Inviati: ${newStats.sentMessages}`);
        } else {
          console.log('❌ Errore invio:', response.data.message);
        }
      } catch (error) {
        console.log('❌ ERRORE:', error.response?.data?.message || error.message);
        if (error.response?.data?.details) {
          console.log('Dettagli:', error.response.data.details);
        }
      }
      
      rl.close();
    });
  });
}

// Verifica prima lo stato
async function main() {
  console.log('🔍 Verifica stato WhatsApp...\n');
  
  try {
    const statusRes = await api.get('/whatsapp/status');
    const status = statusRes.data.data;
    
    if (status.connected) {
      console.log('✅ WhatsApp CONNESSO');
      console.log('Provider:', status.provider);
      await testInvio();
    } else {
      console.log('❌ WhatsApp NON connesso');
      console.log('Vai su http://localhost:5193/admin/whatsapp');
      console.log('e clicca su "Genera QR Code"');
      rl.close();
    }
  } catch (error) {
    console.log('❌ Errore verifica stato:', error.message);
    rl.close();
  }
}

main();
