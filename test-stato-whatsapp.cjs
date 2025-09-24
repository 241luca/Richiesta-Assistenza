#!/usr/bin/env node

/**
 * Test rapido stato WhatsApp e invio messaggio
 */

const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const API = axios.create({
  baseURL: 'http://localhost:3200/api',
  headers: { 'Content-Type': 'application/json' }
});

async function main() {
  console.log('\n📱 TEST WHATSAPP - STATO E INVIO\n');
  
  // 1. Login
  console.log('Login...');
  try {
    const loginRes = await API.post('/auth/login', {
      email: 'admin@assistenza.it',
      password: 'password123'
    });
    
    const token = loginRes.data.data?.token;
    API.defaults.headers['Authorization'] = `Bearer ${token}`;
    console.log('✅ Login OK\n');
  } catch (error) {
    console.log('❌ Errore login:', error.response?.data?.message);
    process.exit(1);
  }
  
  // 2. Verifica stato REALE
  console.log('=== STATO WHATSAPP ===');
  try {
    const statusRes = await API.get('/whatsapp/status');
    const status = statusRes.data.data;
    
    console.log('Provider:', status.provider);
    console.log('Backend dice connesso?', status.connected ? '✅ SI' : '❌ NO');
    console.log('Messaggio:', status.message);
    
    // Verifica anche dal servizio diretto
    const systemRes = await API.get('/whatsapp/system-status');
    console.log('\nStato sistema:', JSON.stringify(systemRes.data.data, null, 2));
    
    if (!status.connected) {
      console.log('\n❌ WhatsApp NON connesso secondo il backend');
      process.exit(1);
    }
    
    console.log('\n✅ WhatsApp CONNESSO secondo il backend!');
    
  } catch (error) {
    console.log('❌ Errore verifica stato:', error.response?.data?.message);
  }
  
  // 3. Prova a inviare un messaggio di test
  console.log('\n=== TEST INVIO MESSAGGIO ===');
  
  rl.question('Vuoi inviare un messaggio di test? (s/n): ', async (answer) => {
    if (answer.toLowerCase() === 's') {
      rl.question('Numero telefono (es: 393351234567): ', (phone) => {
        rl.question('Messaggio: ', async (msg) => {
          
          try {
            console.log('\n📤 Invio in corso...');
            const sendRes = await API.post('/whatsapp/send', {
              phoneNumber: phone,
              message: msg
            });
            
            console.log('✅ MESSAGGIO INVIATO!');
            console.log('Risposta:', sendRes.data);
            
          } catch (error) {
            console.log('❌ Errore invio:', error.response?.data?.message);
          }
          
          rl.close();
        });
      });
    } else {
      console.log('\n📊 STATISTICHE FINALI:');
      try {
        const statsRes = await API.get('/whatsapp/stats');
        const stats = statsRes.data.data;
        console.log('Messaggi totali:', stats.totalMessages);
        console.log('Messaggi oggi:', stats.todayMessages);
        console.log('Inviati:', stats.sentMessages);
        console.log('Ricevuti:', stats.receivedMessages);
      } catch (error) {
        console.log('Errore stats:', error.response?.data?.message);
      }
      rl.close();
    }
  });
}

main().catch(console.error);
