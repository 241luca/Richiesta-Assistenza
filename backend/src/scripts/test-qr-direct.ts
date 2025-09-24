/**
 * Test diretto per ottenere il QR code
 */

import axios from 'axios';

async function getQRDirectly() {
  const baseUrl = 'http://37.27.89.35:8080';
  const apiKey = 'evolution_key_luca_2025_secure_21806';
  
  console.log('\n📱 Tentativo di ottenere il QR code per istanza "main"...\n');

  const api = axios.create({
    baseURL: baseUrl,
    headers: {
      'apikey': apiKey,
      'Content-Type': 'application/json'
    }
  });

  try {
    // Prova endpoint connect
    console.log('Chiamando /instance/connect/main...\n');
    
    const response = await api.get('/instance/connect/main');
    
    console.log('✅ Risposta ricevuta!');
    console.log('\n📋 Dati completi della risposta:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Analizza la risposta
    if (response.data) {
      console.log('\n🔍 Analisi risposta:');
      console.log('- Tipo di dato:', typeof response.data);
      console.log('- Chiavi disponibili:', Object.keys(response.data));
      
      if (response.data.qrcode) {
        console.log('\n🎉 Campo qrcode trovato!');
        console.log('- Tipo:', typeof response.data.qrcode);
        if (typeof response.data.qrcode === 'object') {
          console.log('- Chiavi qrcode:', Object.keys(response.data.qrcode));
        }
        if (response.data.qrcode.base64) {
          console.log('- base64 presente, lunghezza:', response.data.qrcode.base64.length);
          console.log('- Inizio base64:', response.data.qrcode.base64.substring(0, 50));
        }
      }
      
      if (response.data.base64) {
        console.log('\n🎉 Campo base64 diretto trovato!');
        console.log('- Lunghezza:', response.data.base64.length);
        console.log('- Inizio:', response.data.base64.substring(0, 50));
      }
      
      if (response.data.code) {
        console.log('\n📝 QR Code testuale:');
        console.log(response.data.code);
      }
    }
    
  } catch (error: any) {
    console.log('❌ Errore:', error.response?.status);
    if (error.response?.data) {
      console.log('Dettagli errore:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

getQRDirectly();
