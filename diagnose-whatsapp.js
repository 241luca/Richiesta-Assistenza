/**
 * Diagnostica problemi WhatsApp
 */

const axios = require('axios');

async function diagnoseWhatsApp() {
  console.log('🔍 DIAGNOSTICA WHATSAPP\n');
  console.log('=' .repeat(40));
  
  // Test 1: Backend raggiungibile
  console.log('\n✅ Test 1: Backend attivo?');
  try {
    const health = await axios.get('http://localhost:3200/api/health');
    console.log('   Backend OK - Porta 3200 attiva');
  } catch (e) {
    console.log('   ❌ Backend NON raggiungibile!');
    console.log('   Esegui: cd backend && npm run dev');
    return;
  }
  
  // Test 2: Login
  console.log('\n✅ Test 2: Login admin');
  let token;
  try {
    const login = await axios.post('http://localhost:3200/api/auth/login', {
      email: 'admin@example.com',
      password: 'Admin123!@#'
    });
    token = login.data.data.token;
    console.log('   Login OK');
  } catch (e) {
    console.log('   ❌ Login fallito!');
    console.log('   Verifica credenziali in .env o database');
    return;
  }
  
  // Test 3: Stato WhatsApp
  console.log('\n✅ Test 3: Stato WhatsApp');
  try {
    const status = await axios.get('http://localhost:3200/api/whatsapp/status', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = status.data.data;
    console.log('   Provider:', data.provider || 'Non configurato');
    console.log('   Connesso:', data.connected ? '✅ SI' : '❌ NO');
    console.log('   Stato:', data.status || 'disconnected');
    
    if (data.qrCode) {
      console.log('   QR Code: Disponibile (vai su admin per vederlo)');
    }
    
    if (!data.connected) {
      console.log('\n📱 COME CONNETTERE:');
      console.log('1. Vai su http://localhost:5193/admin/whatsapp');
      console.log('2. Clicca "Inizializza" o "Genera QR"');
      console.log('3. Scansiona con WhatsApp dal telefono');
    }
    
  } catch (e) {
    console.log('   ❌ Errore verifica stato:', e.response?.data?.message || e.message);
    console.log('\n   Possibili soluzioni:');
    console.log('   1. Inizializza WhatsApp dalla pagina admin');
    console.log('   2. Verifica che wppconnect.service sia configurato');
    console.log('   3. Controlla i log del backend per errori');
  }
  
  // Test 4: Verifica servizio WPPConnect
  console.log('\n✅ Test 4: File di servizio');
  const fs = require('fs');
  const servicePath = './backend/src/services/wppconnect.service.ts';
  if (fs.existsSync(servicePath)) {
    console.log('   File servizio presente ✓');
  } else {
    console.log('   ❌ File servizio mancante!');
  }
  
  console.log('\n' + '=' .repeat(40));
  console.log('DIAGNOSTICA COMPLETATA\n');
}

diagnoseWhatsApp().catch(console.error);
