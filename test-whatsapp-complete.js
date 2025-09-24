#!/usr/bin/env node

/**
 * Test Completo WhatsApp - Invio e Ricezione Messaggi
 * Questo script testa tutte le funzionalità di WhatsApp
 */

const axios = require('axios');
const readline = require('readline');
const colors = require('colors/safe');

// Configurazione
const API_BASE = 'http://localhost:3200/api';
const FRONTEND_URL = 'http://localhost:5193';

// Per leggere input dall'utente
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper per fare domande
const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

// Helper per fare richieste API
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Funzione per login (necessario per alcune API)
async function login() {
  try {
    console.log('\n📱 Login al sistema...');
    const response = await api.post('/auth/login', {
      email: 'admin@test.com',  // Usa le credenziali admin di test
      password: 'Admin123!@#'
    });
    
    if (response.data.success) {
      const token = response.data.data.token;
      api.defaults.headers['Authorization'] = `Bearer ${token}`;
      console.log('✅ Login riuscito!');
      return token;
    }
  } catch (error) {
    console.log('❌ Errore login:', error.response?.data?.message || error.message);
    console.log('Prova con credenziali diverse...');
    
    const email = await question('Email: ');
    const password = await question('Password: ');
    
    const response = await api.post('/auth/login', {
      email,
      password
    });
    
    if (response.data.success) {
      const token = response.data.data.token;
      api.defaults.headers['Authorization'] = `Bearer ${token}`;
      console.log('✅ Login riuscito!');
      return token;
    }
  }
}

// 1. Test Stato Connessione
async function testStatus() {
  console.log('\n=== TEST STATO CONNESSIONE ===');
  try {
    const response = await api.get('/whatsapp/status');
    const data = response.data.data;
    
    console.log('Provider:', data.provider);
    console.log('Connesso:', data.connected ? '✅ SI' : '❌ NO');
    console.log('Messaggio:', data.message);
    
    if (data.qrCode) {
      console.log('\n📱 QR CODE DISPONIBILE!');
      console.log('Vai su', FRONTEND_URL + '/admin/whatsapp', 'per scansionarlo');
    }
    
    return data.connected;
  } catch (error) {
    console.log('❌ Errore:', error.response?.data?.message || error.message);
    return false;
  }
}

// 2. Inizializza WhatsApp (se non connesso)
async function initializeWhatsApp() {
  console.log('\n=== INIZIALIZZAZIONE WHATSAPP ===');
  try {
    const response = await api.post('/whatsapp/initialize');
    const data = response.data.data;
    
    console.log('Inizializzazione:', data.success ? '✅ OK' : '❌ Fallita');
    
    if (data.qrCode) {
      console.log('\n📱 NUOVO QR CODE GENERATO!');
      console.log('1. Apri WhatsApp sul telefono');
      console.log('2. Vai su Impostazioni > Dispositivi collegati');
      console.log('3. Clicca su "Collega un dispositivo"');
      console.log('4. Scansiona il QR code su', FRONTEND_URL + '/admin/whatsapp');
      
      console.log('\nPremi ENTER quando hai scansionato il QR...');
      await question('');
      
      // Ricontrolla lo stato
      return await testStatus();
    }
    
    return data.connected;
  } catch (error) {
    console.log('❌ Errore:', error.response?.data?.message || error.message);
    return false;
  }
}

// 3. Test Invio Messaggio
async function testSendMessage() {
  console.log('\n=== TEST INVIO MESSAGGIO ===');
  
  const phoneNumber = await question('Inserisci numero telefono (senza +, es: 393351234567): ');
  const message = await question('Inserisci messaggio da inviare: ');
  
  try {
    console.log('\n📤 Invio messaggio...');
    const response = await api.post('/whatsapp/send', {
      phoneNumber: phoneNumber,
      message: message
    });
    
    const data = response.data.data;
    console.log('✅ Messaggio inviato con successo!');
    console.log('ID Messaggio:', data.messageId);
    console.log('Destinatario:', data.to);
    console.log('Status:', data.status);
    
    return true;
  } catch (error) {
    console.log('❌ Errore invio:', error.response?.data?.message || error.message);
    return false;
  }
}

// 4. Test Recupero Messaggi
async function testGetMessages() {
  console.log('\n=== TEST RECUPERO MESSAGGI ===');
  
  try {
    const response = await api.get('/whatsapp/messages?limit=10');
    const messages = response.data.data;
    
    console.log(`\n📬 Trovati ${messages.length} messaggi recenti:\n`);
    
    messages.forEach((msg, index) => {
      const direction = msg.direction === 'incoming' ? '📥 Ricevuto' : '📤 Inviato';
      const status = msg.status === 'READ' ? '✓✓' : '✓';
      
      console.log(`${index + 1}. ${direction} ${status}`);
      console.log(`   Da/A: ${msg.phoneNumber}`);
      console.log(`   Testo: ${msg.message?.substring(0, 50)}...`);
      console.log(`   Data: ${new Date(msg.timestamp).toLocaleString()}`);
      console.log('   ---');
    });
    
    return messages;
  } catch (error) {
    console.log('❌ Errore recupero messaggi:', error.response?.data?.message || error.message);
    return [];
  }
}

// 5. Test Statistiche
async function testStats() {
  console.log('\n=== TEST STATISTICHE ===');
  
  try {
    const response = await api.get('/whatsapp/stats');
    const stats = response.data.data;
    
    console.log('\n📊 STATISTICHE WHATSAPP:');
    console.log('Messaggi totali:', stats.totalMessages);
    console.log('Messaggi oggi:', stats.todayMessages);
    console.log('Messaggi inviati:', stats.sentMessages);
    console.log('Messaggi ricevuti:', stats.receivedMessages);
    console.log('Provider:', stats.provider);
    console.log('Connesso:', stats.isConnected ? '✅ SI' : '❌ NO');
    
    if (stats.connectedSince) {
      console.log('Connesso dal:', new Date(stats.connectedSince).toLocaleString());
    }
    
    return stats;
  } catch (error) {
    console.log('❌ Errore statistiche:', error.response?.data?.message || error.message);
    return null;
  }
}

// 6. Test Invio Multiplo (stress test)
async function testMultipleSend() {
  console.log('\n=== TEST INVIO MULTIPLO ===');
  
  const confirm = await question('Vuoi inviare 3 messaggi di test? (s/n): ');
  if (confirm.toLowerCase() !== 's') return;
  
  const phoneNumber = await question('Inserisci numero telefono: ');
  
  const messages = [
    '🧪 Test 1: Messaggio di prova dal sistema',
    '🔧 Test 2: Verifica funzionamento WhatsApp',
    '✅ Test 3: Sistema operativo e funzionante!'
  ];
  
  for (let i = 0; i < messages.length; i++) {
    try {
      console.log(`\n📤 Invio messaggio ${i + 1}/${messages.length}...`);
      
      await api.post('/whatsapp/send', {
        phoneNumber: phoneNumber,
        message: messages[i]
      });
      
      console.log(`✅ Messaggio ${i + 1} inviato!`);
      
      // Attendi 2 secondi tra un messaggio e l'altro
      if (i < messages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.log(`❌ Errore messaggio ${i + 1}:`, error.response?.data?.message);
    }
  }
}

// Menu principale
async function showMenu() {
  console.log('\n========================================');
  console.log('     📱 TEST WHATSAPP - MENU PRINCIPALE');
  console.log('========================================');
  console.log('1. Verifica stato connessione');
  console.log('2. Inizializza/Connetti WhatsApp');
  console.log('3. Invia messaggio singolo');
  console.log('4. Visualizza messaggi ricevuti');
  console.log('5. Mostra statistiche');
  console.log('6. Test invio multiplo');
  console.log('7. Test completo (tutti i test)');
  console.log('0. Esci');
  console.log('========================================');
  
  const choice = await question('\nScegli opzione: ');
  
  switch (choice) {
    case '1':
      await testStatus();
      break;
    case '2':
      await initializeWhatsApp();
      break;
    case '3':
      await testSendMessage();
      break;
    case '4':
      await testGetMessages();
      break;
    case '5':
      await testStats();
      break;
    case '6':
      await testMultipleSend();
      break;
    case '7':
      console.log('\n🚀 ESECUZIONE TEST COMPLETO...\n');
      const isConnected = await testStatus();
      if (!isConnected) {
        await initializeWhatsApp();
      }
      await testStats();
      await testGetMessages();
      const continueTest = await question('\nVuoi testare l\'invio? (s/n): ');
      if (continueTest.toLowerCase() === 's') {
        await testSendMessage();
      }
      break;
    case '0':
      console.log('\n👋 Arrivederci!\n');
      process.exit(0);
      break;
    default:
      console.log('❌ Opzione non valida');
  }
  
  // Mostra di nuovo il menu
  await showMenu();
}

// Main
async function main() {
  console.log('========================================');
  console.log('   📱 SISTEMA TEST WHATSAPP v1.0');
  console.log('   Richiesta Assistenza Platform');
  console.log('========================================');
  
  // Verifica che il backend sia attivo
  try {
    await axios.get('http://localhost:3200/api/health');
    console.log('✅ Backend attivo su porta 3200');
  } catch (error) {
    console.log('❌ ERRORE: Backend non raggiungibile su http://localhost:3200');
    console.log('Assicurati che il backend sia avviato con: cd backend && npm run dev');
    process.exit(1);
  }
  
  // Login
  await login();
  
  // Mostra menu
  await showMenu();
}

// Gestione errori
process.on('unhandledRejection', (error) => {
  console.error('❌ Errore non gestito:', error);
  process.exit(1);
});

// Avvia il programma
main().catch(console.error);
