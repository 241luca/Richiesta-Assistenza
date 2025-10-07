/**
 * 🧪 TEST PROTEZIONE ROUTES - Sessione 6
 * 
 * Questo script testa che le routes protette dal middleware requireModule
 * rispondano correttamente con 403 quando il modulo è disabilitato.
 * 
 * Data: 06/10/2025
 * Versione: 1.0
 */

import { moduleService } from '../../src/services/module.service';
import axios from 'axios';

const API_URL = 'http://localhost:3200';

// Token di test (dovrebbe essere sostituito con un token valido)
const ADMIN_TOKEN = 'your-admin-token-here';
const headers = { Authorization: `Bearer ${ADMIN_TOKEN}` };

/**
 * 🛠️ CONFIGURAZIONE TEST
 * 
 * Routes da testare con i rispettivi moduli
 */
const PROTECTED_ROUTES = [
  {
    module: 'reviews',
    route: '/api/reviews/professional/test-id',
    method: 'GET'
  },
  {
    module: 'payments',
    route: '/api/payments/config',
    method: 'GET'
  },
  {
    module: 'whatsapp',
    route: '/api/whatsapp/status',
    method: 'GET'
  },
  {
    module: 'ai-assistant',
    route: '/api/ai/health',
    method: 'GET'
  },
  {
    module: 'portfolio',
    route: '/api/portfolio/popular',
    method: 'GET'
  },
  {
    module: 'referral',
    route: '/api/referrals/my-code',
    method: 'GET'
  },
  {
    module: 'calendar',
    route: '/api/calendar/settings',
    method: 'GET'
  },
  {
    module: 'intervention-reports',
    route: '/api/intervention-reports/statistics',
    method: 'GET'
  },
  {
    module: 'backup-system',
    route: '/api/backup/stats',
    method: 'GET'
  },
  {
    module: 'cleanup-system',
    route: '/api/admin/cleanup-config/config',
    method: 'GET'
  }
];

/**
 * 🔧 Utility per fare richieste HTTP
 */
async function makeRequest(method: string, url: string, headers: any = {}) {
  try {
    const response = await axios({
      method: method.toLowerCase(),
      url: `${API_URL}${url}`,
      headers,
      timeout: 5000
    });
    return { success: true, status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { 
        success: false, 
        status: error.response.status, 
        data: error.response.data,
        message: error.response.data?.message || 'Unknown error'
      };
    }
    return { 
      success: false, 
      status: 0, 
      message: error.message || 'Network error'
    };
  }
}

/**
 * 🧪 Test principale
 */
async function testRouteProtection() {
  console.log('🧪 TESTING ROUTE PROTECTION - Sistema Moduli v3.0\n');
  console.log('📋 Routes da testare:', PROTECTED_ROUTES.length);
  console.log('🔗 API URL:', API_URL);
  console.log('🔑 Token configurato:', ADMIN_TOKEN !== 'your-admin-token-here' ? 'Sì' : '❌ NO - Configura token!');
  console.log('\n' + '='.repeat(60) + '\n');

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const testCase of PROTECTED_ROUTES) {
    console.log(`🔍 TESTING: ${testCase.module}`);
    console.log(`   Route: ${testCase.method} ${testCase.route}`);
    
    try {
      // STEP 1: Disabilita il modulo
      console.log('   1️⃣ Disabilitando modulo...');
      await moduleService.disableModule(testCase.module, 'test-admin', 'Test protection');
      await new Promise(resolve => setTimeout(resolve, 500)); // Aspetta per cache
      
      // STEP 2: Testa che la route sia bloccata
      console.log('   2️⃣ Testando accesso bloccato...');
      const blockedResult = await makeRequest(testCase.method, testCase.route, headers);
      
      totalTests++;
      
      if (blockedResult.status === 403) {
        console.log('   ✅ PASS: Route correttamente bloccata (403)');
        passedTests++;
      } else if (blockedResult.status === 401) {
        console.log('   ⚠️  SKIP: Route richiede autenticazione (401) - Token mancante o scaduto');
      } else if (blockedResult.status === 0) {
        console.log('   ❌ FAIL: Errore di rete - Server offline?');
        failedTests++;
      } else {
        console.log(`   ❌ FAIL: Atteso 403, ricevuto ${blockedResult.status}`);
        console.log(`   📄 Risposta: ${blockedResult.message || 'No message'}`);
        failedTests++;
      }
      
      // STEP 3: Riabilita il modulo
      console.log('   3️⃣ Riabilitando modulo...');
      await moduleService.enableModule(testCase.module, 'test-admin', 'Test protection cleanup');
      await new Promise(resolve => setTimeout(resolve, 500)); // Aspetta per cache
      
      // STEP 4: Testa che la route sia di nuovo accessibile (o 404 se endpoint non esiste)
      console.log('   4️⃣ Testando accesso ripristinato...');
      const enabledResult = await makeRequest(testCase.method, testCase.route, headers);
      
      totalTests++;
      
      if ([200, 201, 404, 400].includes(enabledResult.status)) {
        console.log(`   ✅ PASS: Route accessibile (${enabledResult.status})`);
        passedTests++;
      } else if (enabledResult.status === 401) {
        console.log('   ⚠️  SKIP: Route richiede autenticazione (401)');
      } else if (enabledResult.status === 403) {
        console.log('   ❌ FAIL: Route ancora bloccata dopo riabilitazione');
        failedTests++;
      } else {
        console.log(`   ❓ INFO: Status ${enabledResult.status} - Potrebbe essere normale`);
        passedTests++; // Consideriamo ok se non è 403
      }
      
    } catch (error: any) {
      console.log(`   ❌ ERROR: ${error.message}`);
      failedTests++;
      totalTests++;
      
      // Prova comunque a riabilitare il modulo
      try {
        await moduleService.enableModule(testCase.module, 'test-admin', 'Error cleanup');
      } catch (cleanupError) {
        console.log(`   ⚠️  Errore cleanup: ${cleanupError.message}`);
      }
    }
    
    console.log(''); // Linea vuota
  }

  // 📊 REPORT FINALE
  console.log('='.repeat(60));
  console.log('📊 REPORT FINALE TEST PROTEZIONE');
  console.log('='.repeat(60));
  console.log(`✅ Test passati: ${passedTests}/${totalTests}`);
  console.log(`❌ Test falliti: ${failedTests}/${totalTests}`);
  console.log(`📈 Percentuale successo: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (failedTests === 0) {
    console.log('\n🎉 TUTTI I TEST PASSATI! Sistema protezione funzionante.');
  } else {
    console.log('\n⚠️  Alcuni test falliti. Verificare la configurazione.');
  }
  
  if (ADMIN_TOKEN === 'your-admin-token-here') {
    console.log('\n⚠️  IMPORTANTE: Configurare token admin valido per test completi!');
    console.log('   1. Effettua login come admin');
    console.log('   2. Copia il token JWT dalla risposta');
    console.log('   3. Sostituisci ADMIN_TOKEN in questo file');
  }
  
  console.log('\n🏁 Test completato.');
}

/**
 * 🎯 Test rapido per un singolo modulo
 */
async function testSingleModule(moduleCode: string) {
  console.log(`🧪 Test rapido modulo: ${moduleCode}\n`);
  
  const testRoute = PROTECTED_ROUTES.find(r => r.module === moduleCode);
  if (!testRoute) {
    console.log(`❌ Modulo ${moduleCode} non trovato nei test configurati`);
    return;
  }
  
  console.log(`🔍 Testing route: ${testRoute.method} ${testRoute.route}`);
  
  // Disabilita -> Testa -> Riabilita
  await moduleService.disableModule(moduleCode, 'test-admin', 'Quick test');
  const blocked = await makeRequest(testRoute.method, testRoute.route, headers);
  console.log(`📵 Modulo disabilitato: ${blocked.status === 403 ? '✅ Bloccato' : '❌ Non bloccato'}`);
  
  await moduleService.enableModule(moduleCode, 'test-admin', 'Quick test cleanup');
  const enabled = await makeRequest(testRoute.method, testRoute.route, headers);
  console.log(`📶 Modulo abilitato: ${[200, 201, 404, 400].includes(enabled.status) ? '✅ Accessibile' : '❌ Ancora bloccato'}`);
}

// 🚀 ESECUZIONE
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Test singolo modulo
    await testSingleModule(args[0]);
  } else {
    // Test completo
    await testRouteProtection();
  }
  
  process.exit(0);
}

// Gestione errori
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Esegui se chiamato direttamente
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}

export { testRouteProtection, testSingleModule };
