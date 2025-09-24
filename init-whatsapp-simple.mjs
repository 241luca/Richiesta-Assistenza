/**
 * Script semplificato per inizializzare WhatsApp
 */

import axios from 'axios';

async function initWhatsApp() {
  try {
    console.log('🔄 INIZIALIZZAZIONE WHATSAPP\n');
    console.log('=' .repeat(40));
    
    // 1. Login
    console.log('1. Login admin...');
    const loginResponse = await axios.post('http://localhost:3200/api/auth/login', {
      email: 'admin@assistenza.it',
      password: 'password123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('   ✅ Login effettuato\n');
    
    // 2. Verifica stato
    console.log('2. Verifica stato WhatsApp...');
    try {
      const statusResponse = await axios.get('http://localhost:3200/api/whatsapp/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (statusResponse.data.data?.connected) {
        console.log('   ✅ WhatsApp già connesso!');
        console.log('   Puoi inviare messaggi!\n');
        return;
      } else {
        console.log('   ⚠️ WhatsApp non connesso\n');
      }
    } catch (e) {
      console.log('   ⚠️ Errore verifica stato\n');
    }
    
    // 3. Inizializza
    console.log('3. Tentativo inizializzazione...');
    try {
      const initResponse = await axios.post(
        'http://localhost:3200/api/whatsapp/initialize',
        {},
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      console.log('   ✅ Inizializzazione avviata!\n');
      
      // 4. Attendi QR
      console.log('4. Attendo QR Code...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 5. Ottieni QR
      try {
        const qrResponse = await axios.get('http://localhost:3200/api/whatsapp/qrcode', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (qrResponse.data.data?.qrCode) {
          console.log('   ✅ QR Code disponibile!\n');
          console.log('📱 ISTRUZIONI:');
          console.log('1. Vai su: http://localhost:5193/admin/whatsapp');
          console.log('2. Vedrai il QR Code');
          console.log('3. Apri WhatsApp sul telefono');
          console.log('4. Vai in Impostazioni > Dispositivi collegati');
          console.log('5. Scansiona il QR\n');
        } else if (qrResponse.data.data?.connected) {
          console.log('   ✅ WhatsApp connesso!\n');
        }
      } catch (e) {
        console.log('   ℹ️ QR non ancora pronto\n');
        console.log('Vai su http://localhost:5193/admin/whatsapp');
        console.log('per vedere quando appare il QR\n');
      }
      
    } catch (initError) {
      console.log('   ⚠️ Errore:', initError.response?.data?.message || initError.message);
      
      // Se l'errore dice che è già inizializzato
      if (initError.response?.data?.message?.includes('già') || 
          initError.response?.data?.message?.includes('already')) {
        console.log('\n✅ WhatsApp sembra già inizializzato!');
        console.log('Vai su: http://localhost:5193/admin/whatsapp');
        console.log('per vedere lo stato o il QR Code\n');
      }
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.response?.data || error.message);
  }
  
  console.log('=' .repeat(40));
  console.log('\n💡 CONSIGLIO:');
  console.log('Vai direttamente su http://localhost:5193/admin/whatsapp');
  console.log('È più semplice gestire tutto dall\'interfaccia web!\n');
}

// Esegui
initWhatsApp();
