/**
 * Script per inizializzare WhatsApp
 * Esegui questo script per connettere WhatsApp
 */

const axios = require('axios');

async function initializeWhatsApp() {
  try {
    console.log('🔄 Inizializzazione WhatsApp...\n');
    
    // 1. Login per ottenere token
    console.log('1. Login...');
    const loginResponse = await axios.post('http://localhost:3200/api/auth/login', {
      email: 'admin@example.com',  // Sostituisci con le tue credenziali
      password: 'Admin123!@#'       // Sostituisci con la tua password
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login effettuato\n');
    
    // 2. Verifica stato attuale
    console.log('2. Verifica stato WhatsApp...');
    try {
      const statusResponse = await axios.get('http://localhost:3200/api/whatsapp/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Stato:', statusResponse.data);
      
      if (statusResponse.data.data?.connected) {
        console.log('✅ WhatsApp è già connesso!');
        return;
      }
    } catch (e) {
      console.log('⚠️ WhatsApp non connesso, procedo con inizializzazione...\n');
    }
    
    // 3. Inizializza WhatsApp
    console.log('3. Inizializzazione WhatsApp...');
    const initResponse = await axios.post('http://localhost:3200/api/whatsapp/initialize', 
      {},
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    console.log('✅ Inizializzazione avviata!\n');
    
    // 4. Attendi e ottieni QR Code
    console.log('4. Attendo generazione QR Code...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const qrResponse = await axios.get('http://localhost:3200/api/whatsapp/qrcode', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (qrResponse.data.data?.qrCode) {
      console.log('✅ QR Code disponibile!\n');
      console.log('📱 ISTRUZIONI:');
      console.log('1. Apri WhatsApp sul telefono');
      console.log('2. Vai in Impostazioni > Dispositivi collegati');
      console.log('3. Tocca "Collega un dispositivo"');
      console.log('4. Scansiona il QR code nella pagina admin');
      console.log('\n🔗 Vai su: http://localhost:5193/admin/whatsapp');
      console.log('   per vedere il QR Code');
    } else if (qrResponse.data.data?.connected) {
      console.log('✅ WhatsApp già connesso!');
    } else {
      console.log('⚠️ QR Code non ancora pronto, riprova tra qualche secondo');
      console.log('Vai su http://localhost:5193/admin/whatsapp per vedere quando appare');
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.response?.data || error.message);
    console.log('\n💡 Suggerimenti:');
    console.log('1. Assicurati che il backend sia attivo (porta 3200)');
    console.log('2. Verifica le credenziali di login');
    console.log('3. Prova ad aprire http://localhost:5193/admin/whatsapp nel browser');
  }
}

// Esegui
console.log('=================================');
console.log(' INIZIALIZZAZIONE WHATSAPP');
console.log('=================================\n');

initializeWhatsApp();
