#!/usr/bin/env ts-node

/**
 * Test Completo WhatsApp - Sistema Enterprise
 * Test suite professionale per integrazione WhatsApp
 */

import axios, { AxiosInstance } from 'axios';
import * as readline from 'readline';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

// Tipi TypeScript
interface WhatsAppStatus {
  connected: boolean;
  provider: string;
  message: string;
  qrCode?: string;
}

interface WhatsAppMessage {
  id: string;
  phoneNumber: string;
  message: string;
  direction: 'incoming' | 'outgoing';
  status: string;
  timestamp: Date;
  senderName?: string;
}

interface WhatsAppStats {
  totalMessages: number;
  todayMessages: number;
  sentMessages: number;
  receivedMessages: number;
  isConnected: boolean;
  connectedSince?: Date;
  provider: string;
}

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Classe principale per test WhatsApp
 */
export class WhatsAppTester {
  private api: AxiosInstance;
  private rl: readline.Interface;
  private token?: string;

  constructor() {
    // Configurazione API
    this.api = axios.create({
      baseURL: process.env.BACKEND_URL || 'http://localhost:3200/api',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Interfaccia readline per input
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Helper per fare domande all'utente
   */
  private question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  /**
   * Login al sistema
   */
  async login(): Promise<boolean> {
    try {
      logger.info('🔐 Login al sistema...');
      
      // Prima prova con credenziali default
      const response = await this.api.post('/auth/login', {
        email: 'admin@test.com',
        password: 'Admin123!@#'
      });

      if (response.data.success) {
        this.token = response.data.data.token;
        this.api.defaults.headers['Authorization'] = `Bearer ${this.token}`;
        logger.info('✅ Login riuscito!');
        return true;
      }
    } catch (error) {
      logger.warn('Credenziali default non valide, richiesta manuale...');
      
      const email = await this.question('Email: ');
      const password = await this.question('Password: ');
      
      try {
        const response = await this.api.post('/auth/login', {
          email,
          password
        });

        if (response.data.success) {
          this.token = response.data.data.token;
          this.api.defaults.headers['Authorization'] = `Bearer ${this.token}`;
          logger.info('✅ Login riuscito!');
          return true;
        }
      } catch (err) {
        logger.error('❌ Login fallito');
        return false;
      }
    }
    return false;
  }

  /**
   * Verifica stato connessione WhatsApp
   */
  async checkStatus(): Promise<WhatsAppStatus | null> {
    try {
      logger.info('📱 Verifica stato WhatsApp...');
      const response = await this.api.get('/whatsapp/status');
      const status = response.data.data as WhatsAppStatus;
      
      console.log('\n========== STATO WHATSAPP ==========');
      console.log(`Provider: ${status.provider}`);
      console.log(`Connesso: ${status.connected ? '✅ SI' : '❌ NO'}`);
      console.log(`Messaggio: ${status.message}`);
      
      if (status.qrCode) {
        console.log('\n📱 QR CODE DISPONIBILE!');
        console.log('Vai su http://localhost:5193/admin/whatsapp per scansionarlo');
      }
      
      return status;
    } catch (error: any) {
      logger.error('Errore verifica stato:', error.message);
      return null;
    }
  }

  /**
   * Inizializza connessione WhatsApp
   */
  async initialize(): Promise<boolean> {
    try {
      logger.info('🚀 Inizializzazione WhatsApp...');
      const response = await this.api.post('/whatsapp/initialize');
      const data = response.data.data;
      
      if (data.qrCode) {
        console.log('\n📱 QR CODE GENERATO!');
        console.log('1. Apri WhatsApp sul telefono');
        console.log('2. Vai su Impostazioni > Dispositivi collegati');
        console.log('3. Clicca su "Collega un dispositivo"');
        console.log('4. Scansiona il QR su http://localhost:5193/admin/whatsapp');
        
        await this.question('\nPremi ENTER quando hai scansionato il QR...');
        
        // Ricontrolla lo stato
        const status = await this.checkStatus();
        return status?.connected || false;
      }
      
      return data.connected;
    } catch (error: any) {
      logger.error('Errore inizializzazione:', error.message);
      return false;
    }
  }

  /**
   * Invia messaggio WhatsApp
   */
  async sendMessage(phoneNumber?: string, message?: string): Promise<TestResult> {
    try {
      const number = phoneNumber || await this.question('Numero telefono (es: 393351234567): ');
      const text = message || await this.question('Messaggio: ');
      
      logger.info(`📤 Invio messaggio a ${number}...`);
      
      const response = await this.api.post('/whatsapp/send', {
        phoneNumber: number,
        message: text
      });
      
      if (response.data.success) {
        logger.info('✅ Messaggio inviato con successo!');
        return {
          success: true,
          message: 'Messaggio inviato',
          data: response.data.data
        };
      }
      
      return {
        success: false,
        message: 'Invio fallito'
      };
    } catch (error: any) {
      logger.error('Errore invio:', error.response?.data?.message || error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Recupera messaggi dal database
   */
  async getMessages(limit: number = 10): Promise<WhatsAppMessage[]> {
    try {
      logger.info(`📬 Recupero ultimi ${limit} messaggi...`);
      
      // Query diretta al database con Prisma
      const messages = await prisma.whatsAppMessage.findMany({
        take: limit,
        orderBy: { timestamp: 'desc' }
      });
      
      console.log(`\n========== ULTIMI ${messages.length} MESSAGGI ==========`);
      
      messages.forEach((msg, index) => {
        const direction = msg.direction === 'incoming' ? '📥 Ricevuto' : '📤 Inviato';
        const status = msg.status === 'READ' ? '✓✓' : '✓';
        
        console.log(`\n${index + 1}. ${direction} ${status}`);
        console.log(`   Numero: ${msg.phoneNumber}`);
        console.log(`   Testo: ${msg.message?.substring(0, 100)}`);
        console.log(`   Data: ${new Date(msg.timestamp).toLocaleString('it-IT')}`);
      });
      
      return messages as WhatsAppMessage[];
    } catch (error: any) {
      logger.error('Errore recupero messaggi:', error.message);
      return [];
    }
  }

  /**
   * Mostra statistiche WhatsApp
   */
  async getStats(): Promise<WhatsAppStats | null> {
    try {
      logger.info('📊 Recupero statistiche...');
      
      const response = await this.api.get('/whatsapp/stats');
      const stats = response.data.data as WhatsAppStats;
      
      console.log('\n========== STATISTICHE ==========');
      console.log(`Messaggi totali: ${stats.totalMessages}`);
      console.log(`Messaggi oggi: ${stats.todayMessages}`);
      console.log(`Inviati: ${stats.sentMessages}`);
      console.log(`Ricevuti: ${stats.receivedMessages}`);
      console.log(`Connesso: ${stats.isConnected ? '✅' : '❌'}`);
      
      if (stats.connectedSince) {
        console.log(`Connesso dal: ${new Date(stats.connectedSince).toLocaleString('it-IT')}`);
      }
      
      return stats;
    } catch (error: any) {
      logger.error('Errore statistiche:', error.message);
      return null;
    }
  }

  /**
   * Test invio multiplo
   */
  async testBulkSend(): Promise<void> {
    const confirm = await this.question('Inviare 3 messaggi di test? (s/n): ');
    if (confirm.toLowerCase() !== 's') return;
    
    const phoneNumber = await this.question('Numero telefono: ');
    
    const messages = [
      '🧪 Test 1: Messaggio di prova dal sistema',
      '🔧 Test 2: Verifica funzionamento WhatsApp',
      '✅ Test 3: Sistema operativo e funzionante!'
    ];
    
    for (let i = 0; i < messages.length; i++) {
      logger.info(`Invio messaggio ${i + 1}/${messages.length}...`);
      await this.sendMessage(phoneNumber, messages[i]);
      
      if (i < messages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  /**
   * Menu principale interattivo
   */
  async showMenu(): Promise<void> {
    console.log('\n========================================');
    console.log('     📱 TEST WHATSAPP - MENU');
    console.log('========================================');
    console.log('1. Verifica stato connessione');
    console.log('2. Inizializza/Connetti WhatsApp');
    console.log('3. Invia messaggio singolo');
    console.log('4. Visualizza messaggi ricevuti');
    console.log('5. Mostra statistiche');
    console.log('6. Test invio multiplo');
    console.log('7. Test completo');
    console.log('0. Esci');
    console.log('========================================');
    
    const choice = await this.question('\nScegli: ');
    
    switch (choice) {
      case '1':
        await this.checkStatus();
        break;
      case '2':
        await this.initialize();
        break;
      case '3':
        await this.sendMessage();
        break;
      case '4':
        await this.getMessages();
        break;
      case '5':
        await this.getStats();
        break;
      case '6':
        await this.testBulkSend();
        break;
      case '7':
        await this.runCompleteTest();
        break;
      case '0':
        this.close();
        return;
      default:
        console.log('Opzione non valida');
    }
    
    await this.showMenu();
  }

  /**
   * Test completo automatico
   */
  async runCompleteTest(): Promise<void> {
    logger.info('🚀 ESECUZIONE TEST COMPLETO...');
    
    const status = await this.checkStatus();
    if (!status?.connected) {
      const initialized = await this.initialize();
      if (!initialized) {
        logger.error('Impossibile connettere WhatsApp');
        return;
      }
    }
    
    await this.getStats();
    await this.getMessages(5);
    
    const testSend = await this.question('Testare invio messaggio? (s/n): ');
    if (testSend.toLowerCase() === 's') {
      await this.sendMessage();
    }
  }

  /**
   * Chiusura e pulizia
   */
  close(): void {
    logger.info('👋 Arrivederci!');
    this.rl.close();
    process.exit(0);
  }
}

// Main execution
async function main() {
  console.log('========================================');
  console.log('   📱 SISTEMA TEST WHATSAPP v2.0');
  console.log('   TypeScript Enterprise Edition');
  console.log('========================================');
  
  const tester = new WhatsAppTester();
  
  // Verifica backend
  try {
    await axios.get('http://localhost:3200/api/health');
    logger.info('✅ Backend attivo');
  } catch (error) {
    logger.error('❌ Backend non raggiungibile');
    logger.error('Avvia con: cd backend && npm run dev');
    process.exit(1);
  }
  
  // Login
  const loggedIn = await tester.login();
  if (!loggedIn) {
    logger.error('Login richiesto per continuare');
    process.exit(1);
  }
  
  // Menu
  await tester.showMenu();
}

// Error handling
process.on('unhandledRejection', (error: Error) => {
  logger.error('Errore non gestito:', error);
  process.exit(1);
});

// Start
if (require.main === module) {
  main().catch(console.error);
}

export default WhatsAppTester;
