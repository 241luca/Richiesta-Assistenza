#!/usr/bin/env node

/**
 * Monitor Real-Time WhatsApp Messages
 * Monitora in tempo reale i messaggi WhatsApp in arrivo
 */

const axios = require('axios');
const io = require('socket.io-client');

// Configurazione
const API_BASE = 'http://localhost:3200/api';
const SOCKET_URL = 'http://localhost:3200';

// API client
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Colori per output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Login automatico con credenziali admin
async function login() {
  try {
    console.log(`${colors.cyan}🔐 Login al sistema...${colors.reset}`);
    const response = await api.post('/auth/login', {
      email: 'admin@test.com',
      password: 'Admin123!@#'
    });
    
    if (response.data.success) {
      const token = response.data.data.token;
      api.defaults.headers['Authorization'] = `Bearer ${token}`;
      console.log(`${colors.green}✅ Login riuscito!${colors.reset}`);
      return token;
    }
  } catch (error) {
    console.log(`${colors.red}❌ Errore login: ${error.response?.data?.message || error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Controlla lo stato di WhatsApp
async function checkStatus() {
  try {
    const response = await api.get('/whatsapp/status');
    const data = response.data.data;
    
    console.log('\n' + '='.repeat(50));
    console.log(`${colors.bright}📱 STATO WHATSAPP${colors.reset}`);
    console.log('='.repeat(50));
    console.log(`Provider: ${data.provider}`);
    console.log(`Connesso: ${data.connected ? colors.green + '✅ SI' : colors.red + '❌ NO'}${colors.reset}`);
    console.log(`Messaggio: ${data.message}`);
    
    if (!data.connected) {
      console.log(`\n${colors.yellow}⚠️  WhatsApp non connesso!${colors.reset}`);
      console.log(`Vai su http://localhost:5193/admin/whatsapp per scansionare il QR code`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.log(`${colors.red}❌ Errore verifica stato: ${error.message}${colors.reset}`);
    return false;
  }
}

// Recupera e mostra gli ultimi messaggi
async function showRecentMessages() {
  try {
    const response = await api.get('/whatsapp/messages?limit=5');
    const messages = response.data.data;
    
    if (messages.length > 0) {
      console.log('\n' + '='.repeat(50));
      console.log(`${colors.bright}📬 ULTIMI 5 MESSAGGI${colors.reset}`);
      console.log('='.repeat(50));
      
      messages.forEach((msg, index) => {
        const direction = msg.direction === 'incoming' 
          ? `${colors.green}📥 RICEVUTO${colors.reset}` 
          : `${colors.blue}📤 INVIATO${colors.reset}`;
        const status = msg.status === 'READ' ? '✓✓' : '✓';
        
        console.log(`\n${index + 1}. ${direction} ${status}`);
        console.log(`   📱 Numero: ${msg.phoneNumber}`);
        console.log(`   💬 Messaggio: ${msg.message?.substring(0, 100)}`);
        console.log(`   🕒 Data: ${new Date(msg.timestamp).toLocaleString('it-IT')}`);
      });
    }
  } catch (error) {
    console.log(`${colors.red}❌ Errore recupero messaggi: ${error.message}${colors.reset}`);
  }
}

// Mostra statistiche
async function showStats() {
  try {
    const response = await api.get('/whatsapp/stats');
    const stats = response.data.data;
    
    console.log('\n' + '='.repeat(50));
    console.log(`${colors.bright}📊 STATISTICHE${colors.reset}`);
    console.log('='.repeat(50));
    console.log(`Messaggi totali: ${colors.bright}${stats.totalMessages}${colors.reset}`);
    console.log(`Messaggi oggi: ${colors.bright}${stats.todayMessages}${colors.reset}`);
    console.log(`Inviati: ${colors.blue}${stats.sentMessages}${colors.reset}`);
    console.log(`Ricevuti: ${colors.green}${stats.receivedMessages}${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}❌ Errore statistiche: ${error.message}${colors.reset}`);
  }
}

// Connessione WebSocket per notifiche real-time
function connectWebSocket(token) {
  console.log('\n' + '='.repeat(50));
  console.log(`${colors.bright}🔌 CONNESSIONE WEBSOCKET${colors.reset}`);
  console.log('='.repeat(50));
  
  const socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling']
  });
  
  socket.on('connect', () => {
    console.log(`${colors.green}✅ WebSocket connesso! ID: ${socket.id}${colors.reset}`);
    console.log(`\n${colors.cyan}👂 In ascolto per nuovi messaggi...${colors.reset}\n`);
  });
  
  socket.on('disconnect', () => {
    console.log(`${colors.red}❌ WebSocket disconnesso${colors.reset}`);
  });
  
  // Ascolta per nuovi messaggi WhatsApp
  socket.on('whatsapp:message', (data) => {
    console.log('\n' + '🔔'.repeat(20));
    console.log(`${colors.bright}${colors.green}📨 NUOVO MESSAGGIO WHATSAPP!${colors.reset}`);
    console.log('🔔'.repeat(20));
    console.log(`📱 Da: ${colors.bright}${data.from}${colors.reset}`);
    console.log(`💬 Testo: ${colors.yellow}${data.message}${colors.reset}`);
    console.log(`🕒 Ora: ${new Date().toLocaleTimeString('it-IT')}`);
    console.log('='.repeat(50) + '\n');
    
    // Opzionale: rispondi automaticamente
    if (data.message.toLowerCase().includes('ciao')) {
      console.log(`${colors.blue}🤖 Invio risposta automatica...${colors.reset}`);
      api.post('/whatsapp/send', {
        phoneNumber: data.from.replace('@c.us', ''),
        message: '👋 Ciao! Questo è un messaggio automatico dal sistema di assistenza. Come posso aiutarti?'
      }).then(() => {
        console.log(`${colors.green}✅ Risposta inviata!${colors.reset}\n`);
      }).catch(err => {
        console.log(`${colors.red}❌ Errore invio risposta: ${err.message}${colors.reset}\n`);
      });
    }
  });
  
  // Altri eventi
  socket.on('notification', (data) => {
    if (data.type && data.type.includes('whatsapp')) {
      console.log(`\n${colors.yellow}🔔 Notifica: ${data.title}${colors.reset}`);
      console.log(`   ${data.message}`);
    }
  });
  
  socket.on('error', (error) => {
    console.log(`${colors.red}❌ Errore WebSocket: ${error}${colors.reset}`);
  });
}

// Polling periodico per verificare nuovi messaggi (backup se WebSocket non funziona)
async function startPolling() {
  let lastMessageId = null;
  
  setInterval(async () => {
    try {
      const response = await api.get('/whatsapp/messages?limit=1');
      const messages = response.data.data;
      
      if (messages.length > 0 && messages[0].id !== lastMessageId) {
        const newMessage = messages[0];
        
        if (newMessage.direction === 'incoming' && lastMessageId !== null) {
          console.log('\n' + '📨'.repeat(15));
          console.log(`${colors.bright}${colors.green}NUOVO MESSAGGIO (via polling)${colors.reset}`);
          console.log(`📱 Da: ${newMessage.phoneNumber}`);
          console.log(`💬 Testo: ${newMessage.message}`);
          console.log(`🕒 Ora: ${new Date(newMessage.timestamp).toLocaleTimeString('it-IT')}`);
          console.log('='.repeat(50) + '\n');
        }
        
        lastMessageId = newMessage.id;
      }
    } catch (error) {
      // Silenzioso per non sporcare l'output
    }
  }, 5000); // Controlla ogni 5 secondi
}

// Menu comandi durante il monitoraggio
function setupCommands() {
  const stdin = process.openStdin();
  
  console.log('\n' + '='.repeat(50));
  console.log(`${colors.bright}⌨️  COMANDI DISPONIBILI${colors.reset}`);
  console.log('='.repeat(50));
  console.log('s - Invia un messaggio');
  console.log('r - Mostra messaggi recenti');
  console.log('t - Mostra statistiche');
  console.log('c - Controlla stato connessione');
  console.log('q - Esci');
  console.log('='.repeat(50) + '\n');
  
  stdin.addListener('data', async (d) => {
    const command = d.toString().trim();
    
    switch(command) {
      case 's':
        console.log('\n📤 INVIO MESSAGGIO');
        console.log('Formato: numero messaggio (es: 393351234567 Ciao!)');
        console.log('Inserisci: ');
        // Qui servirebbe readline per input interattivo
        break;
        
      case 'r':
        await showRecentMessages();
        break;
        
      case 't':
        await showStats();
        break;
        
      case 'c':
        await checkStatus();
        break;
        
      case 'q':
        console.log(`\n${colors.yellow}👋 Chiusura monitor...${colors.reset}`);
        process.exit(0);
        break;
        
      default:
        // Se non è un comando, prova a interpretarlo come invio messaggio
        if (command.includes(' ')) {
          const parts = command.split(' ');
          const phoneNumber = parts[0];
          const message = parts.slice(1).join(' ');
          
          if (phoneNumber && message) {
            try {
              console.log(`${colors.blue}📤 Invio a ${phoneNumber}...${colors.reset}`);
              await api.post('/whatsapp/send', {
                phoneNumber,
                message
              });
              console.log(`${colors.green}✅ Messaggio inviato!${colors.reset}\n`);
            } catch (error) {
              console.log(`${colors.red}❌ Errore: ${error.response?.data?.message}${colors.reset}\n`);
            }
          }
        }
    }
  });
}

// Main
async function main() {
  console.clear();
  console.log('='.repeat(50));
  console.log(`${colors.bright}${colors.cyan}   📱 MONITOR WHATSAPP REAL-TIME v1.0${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}      Sistema Richiesta Assistenza${colors.reset}`);
  console.log('='.repeat(50));
  
  // Login
  const token = await login();
  
  // Controlla stato
  const isConnected = await checkStatus();
  if (!isConnected) {
    console.log(`\n${colors.yellow}Connetti WhatsApp dalla dashboard e riavvia il monitor${colors.reset}`);
    process.exit(1);
  }
  
  // Mostra statistiche e messaggi recenti
  await showStats();
  await showRecentMessages();
  
  // Connetti WebSocket
  connectWebSocket(token);
  
  // Avvia polling di backup
  startPolling();
  
  // Setup comandi
  setupCommands();
}

// Gestione errori
process.on('unhandledRejection', (error) => {
  console.error(`${colors.red}❌ Errore non gestito: ${error}${colors.reset}`);
});

// Gestione chiusura
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}👋 Chiusura monitor...${colors.reset}`);
  process.exit(0);
});

// Avvia
main().catch(console.error);
