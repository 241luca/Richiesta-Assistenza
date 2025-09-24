/**
 * Script per ripristinare la sessione WhatsApp esistente
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';

async function restoreWhatsAppSession() {
  console.log('🔄 RIPRISTINO SESSIONE WHATSAPP\n');
  console.log('=' .repeat(40));
  
  // Verifica se esiste la sessione salvata
  const sessionPath = './backend/tokens/assistenza-wpp';
  
  console.log('\n✅ Controllo sessione salvata...');
  if (fs.existsSync(sessionPath)) {
    const files = fs.readdirSync(sessionPath);
    console.log(`   Trovati ${files.length} file nella sessione`);
    console.log('   La sessione esiste! Possiamo ripristinarla.\n');
  } else {
    console.log('   ❌ Nessuna sessione salvata trovata');
    console.log('   Dovrai fare una nuova scansione QR\n');
    return;
  }
  
  try {
    // 1. Login
    console.log('1. Login admin...');
    const loginResponse = await axios.post('http://localhost:3200/api/auth/login', {
      email: 'admin@assistenza.it',
      password: 'password123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('   ✅ Login effettuato\n');
    
    // 2. Prova a ripristinare la sessione
    console.log('2. Ripristino sessione...');
    try {
      const restoreResponse = await axios.post(
        'http://localhost:3200/api/whatsapp/session/restore',
        {},
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      console.log('   ✅ Sessione ripristinata!\n');
      
      // 3. Attendi un po' per la connessione
      console.log('3. Attendo connessione...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 4. Verifica stato
      console.log('4. Verifica stato connessione...');
      const statusResponse = await axios.get('http://localhost:3200/api/whatsapp/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (statusResponse.data.data?.connected) {
        console.log('   ✅ WHATSAPP CONNESSO!\n');
        console.log('🎉 Puoi ora inviare messaggi!');
        console.log('   Vai su: http://localhost:5193/admin/whatsapp');
      } else {
        console.log('   ⚠️ Non ancora connesso...');
        console.log('   Potrebbe essere necessaria una nuova scansione QR');
        console.log('   Vai su: http://localhost:5193/admin/whatsapp');
      }
      
    } catch (error) {
      console.log('   ⚠️ Errore nel ripristino:', error.response?.data?.message || error.message);
      console.log('\n   Proviamo con inizializzazione normale...');
      
      // Prova inizializzazione normale
      try {
        const initResponse = await axios.post(
          'http://localhost:3200/api/whatsapp/initialize',
          {},
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        
        console.log('   ✅ Inizializzazione avviata');
        console.log('   Vai su http://localhost:5193/admin/whatsapp');
        console.log('   per vedere il QR code o lo stato');
        
      } catch (initError) {
        console.log('   ❌ Errore inizializzazione:', initError.response?.data?.message || initError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.response?.data || error.message);
  }
  
  console.log('\n' + '=' .repeat(40));
  console.log('FINE RIPRISTINO\n');
}

// Esegui
restoreWhatsAppSession();
