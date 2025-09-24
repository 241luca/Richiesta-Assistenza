#!/usr/bin/env node

/**
 * Test diretto per WhatsApp - Verifica completa del sistema
 */

const axios = require('axios');

const API = axios.create({
  baseURL: 'http://localhost:3200/api',
  headers: { 'Content-Type': 'application/json' }
});

async function test() {
  console.log('========================================');
  console.log('   TEST WHATSAPP - VERIFICA COMPLETA');
  console.log('========================================\n');
  
  try {
    // 1. Login
    console.log('1. Login come admin...');
    const loginRes = await API.post('/auth/login', {
      email: 'superadmin@example.com',
      password: 'SecurePassword123!'
    });
    
    const token = loginRes.data.data?.token;
    if (token) {
      API.defaults.headers['Authorization'] = `Bearer ${token}`;
      console.log('✅ Login riuscito\n');
    } else {
      console.log('❌ Token non ricevuto\n');
    }
    
    // 2. Verifica status
    console.log('2. Verifica stato WhatsApp...');
    const statusRes = await API.get('/whatsapp/status');
    const status = statusRes.data.data;
    console.log('Provider:', status.provider);
    console.log('Connesso:', status.connected ? '✅ SI' : '❌ NO');
    console.log('Messaggio:', status.message);
    console.log('QR disponibile:', status.qrCode ? 'SI' : 'NO');
    console.log('');
    
    // 3. Se non connesso, inizializza
    if (!status.connected) {
      console.log('3. WhatsApp non connesso. Inizializzazione...');
      try {
        const initRes = await API.post('/whatsapp/initialize');
        const initData = initRes.data.data;
        
        if (initData.qrCode) {
          console.log('✅ QR Code generato!');
          console.log('📱 VAI SU http://localhost:5193/admin/whatsapp');
          console.log('   per scansionare il QR code\n');
        } else {
          console.log('⚠️  Inizializzazione avviata ma QR non ancora pronto\n');
        }
      } catch (error) {
        console.log('❌ Errore inizializzazione:', error.response?.data?.message || error.message);
      }
    } else {
      console.log('3. WhatsApp già connesso ✅\n');
    }
    
    // 4. Verifica statistiche
    console.log('4. Statistiche WhatsApp...');
    try {
      const statsRes = await API.get('/whatsapp/stats');
      const stats = statsRes.data.data;
      console.log('Messaggi totali:', stats.totalMessages);
      console.log('Messaggi oggi:', stats.todayMessages);
      console.log('');
    } catch (error) {
      console.log('❌ Errore stats:', error.response?.data?.message);
    }
    
    console.log('========================================');
    console.log('TEST COMPLETATO');
    console.log('');
    console.log('📱 Ora vai su http://localhost:5193/admin/whatsapp');
    console.log('   e verifica che tutto funzioni!');
    console.log('========================================');
    
  } catch (error) {
    console.error('❌ ERRORE:', error.response?.data || error.message);
  }
}

// Esegui test
test();
