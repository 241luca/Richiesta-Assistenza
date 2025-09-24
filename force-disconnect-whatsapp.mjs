/**
 * FORZA DISCONNESSIONE E RESET TOTALE WHATSAPP
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';

async function forceDisconnectWhatsApp() {
  console.log('🔴 FORCE DISCONNECT WHATSAPP\n');
  console.log('=' .repeat(50));
  
  try {
    // 1. Login
    console.log('1. Login admin...');
    const loginResponse = await axios.post('http://localhost:3200/api/auth/login', {
      email: 'admin@assistenza.it',
      password: 'password123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('   ✅ Login effettuato\n');
    
    // 2. Prova tutti i metodi di disconnessione
    console.log('2. Tentativo disconnessione...');
    
    // Metodo 1: Disconnect normale
    try {
      await axios.post(
        'http://localhost:3200/api/whatsapp/disconnect',
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      console.log('   ✅ Disconnect eseguito');
    } catch (e) {
      console.log('   ⚠️ Disconnect fallito:', e.response?.data?.message || e.message);
    }
    
    // Metodo 2: Logout
    try {
      await axios.post(
        'http://localhost:3200/api/whatsapp/logout',
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      console.log('   ✅ Logout eseguito');
    } catch (e) {
      console.log('   ⚠️ Logout fallito:', e.response?.data?.message || e.message);
    }
    
    // Metodo 3: Delete session
    try {
      await axios.delete(
        'http://localhost:3200/api/whatsapp/session',
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      console.log('   ✅ Session delete eseguito');
    } catch (e) {
      console.log('   ⚠️ Session delete fallito:', e.response?.data?.message || e.message);
    }
    
    console.log('\n3. Pulizia file locali...');
    
    // Elimina fisicamente i file di sessione
    const sessionPaths = [
      './backend/tokens/assistenza-wpp',
      './backend/tokens/assistenza',
      './backend/.wppconnect',
      './.wppconnect',
      './backend/session.data.json',
      './backend/whatsapp-session.json'
    ];
    
    for (const sessionPath of sessionPaths) {
      if (fs.existsSync(sessionPath)) {
        try {
          if (fs.lstatSync(sessionPath).isDirectory()) {
            fs.rmSync(sessionPath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(sessionPath);
          }
          console.log(`   ✅ Eliminato: ${sessionPath}`);
        } catch (e) {
          console.log(`   ⚠️ Errore eliminando ${sessionPath}:`, e.message);
        }
      }
    }
    
    console.log('\n4. Attesa per cleanup...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n5. Tentativo reinizializzazione pulita...');
    try {
      const initResponse = await axios.post(
        'http://localhost:3200/api/whatsapp/initialize',
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      console.log('   ✅ Inizializzazione avviata!\n');
      
      // Attendi QR
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Verifica QR
      try {
        const qrResponse = await axios.get(
          'http://localhost:3200/api/whatsapp/qrcode',
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        if (qrResponse.data.data?.qrCode) {
          console.log('🎉 QR CODE DISPONIBILE!');
          console.log('\n📱 VAI SU: http://localhost:5193/admin/whatsapp');
          console.log('   per scansionare il QR code!\n');
        }
      } catch (e) {
        console.log('   ℹ️ QR in generazione...');
      }
      
    } catch (e) {
      console.log('   ⚠️ Errore init:', e.response?.data?.message || e.message);
    }
    
  } catch (error) {
    console.error('❌ Errore generale:', error.message);
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('\n💡 IMPORTANTE:');
  console.log('1. Se ancora non funziona, RIAVVIA il backend:');
  console.log('   - Premi CTRL+C nel terminale del backend');
  console.log('   - Esegui: cd backend && npm run dev');
  console.log('\n2. Poi vai su: http://localhost:5193/admin/whatsapp');
  console.log('   Dovrebbe mostrarti il QR da scansionare\n');
}

// Esegui
forceDisconnectWhatsApp();
