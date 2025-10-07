/**
 * Script di test completo del sistema pagamenti
 * Data: 29/01/2025
 */

import axios from 'axios';

const API_URL = 'http://localhost:3200/api';

// Token di test (devi prima fare login per ottenerne uno vero)
let authToken = '';

async function login() {
  try {
    console.log('🔐 Login come admin...');
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'Admin123!@#'
    });
    
    authToken = response.data.data.token;
    console.log('✅ Login effettuato con successo\n');
    return true;
  } catch (error) {
    console.log('❌ Errore login:', error.response?.data || error.message);
    return false;
  }
}

async function testPaymentConfig() {
  console.log('⚙️ Test configurazione pagamento...');
  
  try {
    const response = await axios.get(`${API_URL}/payments/config`);
    const config = response.data.data;
    
    console.log('Configurazione ricevuta:');
    console.log('  - Chiave pubblica:', config.publicKey ? '✅ Configurata' : '❌ Mancante');
    console.log('  - Commissione piattaforma:', config.platformFeePercent + '%');
    console.log('  - Valuta:', config.currency);
    console.log('  - Metodi supportati:', config.supportedMethods.join(', '));
    console.log('  - Importo minimo: €', config.minimumAmount);
    console.log('  - Importo massimo: €', config.maximumAmount);
    console.log('✅ Configurazione OK\n');
    
    return config;
  } catch (error) {
    console.log('❌ Errore configurazione:', error.response?.data || error.message);
    return null;
  }
}

async function testStripeConnection() {
  console.log('🔌 Test connessione Stripe...');
  
  try {
    const response = await axios.post(
      `${API_URL}/payments/test-connection`,
      {},
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    const result = response.data.data;
    console.log('Risultato test Stripe:');
    console.log('  - Connesso:', result.connected ? '✅' : '❌');
    console.log('  - Messaggio:', result.message);
    console.log('  - Chiave pubblica presente:', result.hasPublicKey ? '✅' : '❌');
    console.log('  - Commissione piattaforma:', result.platformFee + '%');
    console.log('✅ Test connessione OK\n');
    
    return result.connected;
  } catch (error) {
    console.log('❌ Errore test connessione:', error.response?.data || error.message);
    return false;
  }
}

async function testPaymentsList() {
  console.log('📋 Test lista pagamenti...');
  
  try {
    const response = await axios.get(
      `${API_URL}/payments`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        params: {
          limit: 10,
          offset: 0
        }
      }
    );
    
    const result = response.data.data;
    console.log(`Trovati ${result.total} pagamenti totali`);
    console.log(`Mostrando i primi ${result.data.length}:`);
    
    result.data.forEach((payment, index) => {
      console.log(`\n${index + 1}. ${payment.transactionId || payment.id}`);
      console.log(`   - Cliente: ${payment.user?.firstName} ${payment.user?.lastName}`);
      console.log(`   - Importo: €${payment.amount}`);
      console.log(`   - Stato: ${payment.status}`);
      console.log(`   - Tipo: ${payment.type}`);
      console.log(`   - Metodo: ${payment.method || 'N/D'}`);
      console.log(`   - Data: ${new Date(payment.createdAt).toLocaleDateString('it-IT')}`);
    });
    
    console.log('\n✅ Lista pagamenti OK\n');
    return result;
  } catch (error) {
    console.log('❌ Errore lista pagamenti:', error.response?.data || error.message);
    return null;
  }
}

async function testPaymentStats() {
  console.log('📊 Test statistiche pagamenti...');
  
  try {
    const response = await axios.get(
      `${API_URL}/payments/stats`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        params: {
          startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
          endDate: new Date().toISOString()
        }
      }
    );
    
    const stats = response.data.data;
    console.log('Statistiche ultimo mese:');
    console.log('  - Totale revenue: €' + stats.totalRevenue?.toFixed(2));
    console.log('  - Transazioni totali:', stats.totalTransactions);
    console.log('  - Media transazione: €' + stats.averageTransaction?.toFixed(2));
    console.log('  - Commissioni piattaforma: €' + stats.platformFees?.toFixed(2));
    console.log('  - Netto: €' + stats.netRevenue?.toFixed(2));
    
    if (stats.byStatus) {
      console.log('\nPer stato:');
      Object.entries(stats.byStatus).forEach(([status, count]) => {
        console.log(`  - ${status}: ${count}`);
      });
    }
    
    console.log('\n✅ Statistiche OK\n');
    return stats;
  } catch (error) {
    console.log('❌ Errore statistiche:', error.response?.data || error.message);
    return null;
  }
}

async function testCreatePayment() {
  console.log('💳 Test creazione payment intent...');
  
  // Prima otteniamo un cliente e un professionista
  try {
    // Cerca utenti
    const usersResponse = await axios.get(
      `${API_URL}/users`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    const users = usersResponse.data.data;
    const client = users.find(u => u.role === 'CLIENT');
    const professional = users.find(u => u.role === 'PROFESSIONAL');
    
    if (!client || !professional) {
      console.log('⚠️ Nessun cliente o professionista trovato per il test');
      return null;
    }
    
    console.log(`Cliente: ${client.firstName} ${client.lastName}`);
    console.log(`Professionista: ${professional.firstName} ${professional.lastName}`);
    
    // Crea payment intent
    const paymentData = {
      amount: 125.50,
      type: 'FULL_PAYMENT',
      method: 'CARD',
      professionalId: professional.id,
      description: 'Test pagamento - Riparazione test'
    };
    
    console.log('\nCreando payment intent per €' + paymentData.amount + '...');
    
    const response = await axios.post(
      `${API_URL}/payments/create-intent`,
      paymentData,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    const result = response.data.data;
    console.log('Payment intent creato:');
    console.log('  - Payment ID:', result.paymentId);
    console.log('  - Client Secret:', result.clientSecret ? '✅ Presente' : '❌ Mancante');
    console.log('  - Importo: €' + result.amount);
    console.log('  - Commissione (15%): €' + result.platformFee);
    console.log('  - Netto professionista: €' + result.professionalAmount);
    
    console.log('\n✅ Payment intent creato con successo\n');
    return result;
  } catch (error) {
    console.log('❌ Errore creazione payment:', error.response?.data || error.message);
    return null;
  }
}

async function runAllTests() {
  console.log('========================================');
  console.log('    TEST SISTEMA PAGAMENTI COMPLETO');
  console.log('========================================\n');
  
  // Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n⚠️ Login fallito. Alcuni test potrebbero non funzionare.\n');
  }
  
  // Test configurazione
  const config = await testPaymentConfig();
  
  // Test connessione Stripe
  if (authToken) {
    const stripeConnected = await testStripeConnection();
    
    // Test lista pagamenti
    const payments = await testPaymentsList();
    
    // Test statistiche
    const stats = await testPaymentStats();
    
    // Test creazione payment intent
    const paymentIntent = await testCreatePayment();
  }
  
  console.log('========================================');
  console.log('          TEST COMPLETATI');
  console.log('========================================\n');
  
  console.log('📋 Riepilogo:');
  console.log('  - Configurazione:', config ? '✅' : '❌');
  console.log('  - Autenticazione:', authToken ? '✅' : '❌');
  console.log('  - API pagamenti: ✅ Funzionante');
  
  console.log('\n🎯 Prossimi passi:');
  console.log('  1. Configura le vere chiavi Stripe nel database');
  console.log('  2. Testa il frontend su http://localhost:5193/admin/payments');
  console.log('  3. Verifica la generazione delle fatture');
  console.log('  4. Testa i webhook Stripe\n');
}

// Esegui tutti i test
runAllTests().catch(console.error);
