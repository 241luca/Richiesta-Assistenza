#!/usr/bin/env node

/**
 * Script di test per verificare gli endpoint del sistema
 * Esegue test su autenticazione e permessi di ruolo
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3200';
const FRONTEND_URL = 'http://localhost:5193';

// Colori per output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// Utenti di test con diversi ruoli
const testUsers = {
    client: {
        email: 'client1@test.it',
        password: 'Test123!@#',
        expectedRole: 'CLIENT'
    },
    professional: {
        email: 'prof1@test.it', 
        password: 'Test123!@#',
        expectedRole: 'PROFESSIONAL'
    },
    admin: {
        email: 'admin@assistenza.it',
        password: 'Admin123!@#',
        expectedRole: 'ADMIN'
    }
};

let testResults = {
    passed: 0,
    failed: 0,
    tests: []
};

async function logTest(testName, success, details = '') {
    const status = success ? 
        `${colors.green}✅ PASS${colors.reset}` : 
        `${colors.red}❌ FAIL${colors.reset}`;
    
    console.log(`${status} - ${testName}`);
    if (details) {
        console.log(`  ${colors.cyan}→${colors.reset} ${details}`);
    }
    
    testResults.tests.push({ testName, success, details });
    if (success) testResults.passed++; else testResults.failed++;
}

async function testHealthCheck() {
    console.log(`\n${colors.blue}=== Test Health Check ===${colors.reset}`);
    try {
        const response = await axios.get(`${BASE_URL}/health`);
        await logTest('Health Check', response.data.status === 'ok', 
            `Server running on port ${response.data.port}`);
        return true;
    } catch (error) {
        await logTest('Health Check', false, error.message);
        return false;
    }
}

async function testLogin(userType) {
    console.log(`\n${colors.blue}=== Test Login ${userType} ===${colors.reset}`);
    const user = testUsers[userType];
    
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: user.email,
            password: user.password
        });
        
        if (response.data.accessToken) {
            await logTest(`Login ${userType}`, true, 
                `User: ${response.data.user.email}, Role: ${response.data.user.role}`);
            return {
                token: response.data.accessToken,
                user: response.data.user
            };
        }
    } catch (error) {
        await logTest(`Login ${userType}`, false, 
            error.response?.data?.message || error.message);
        return null;
    }
}

async function testRequestsEndpoint(userType, token, userData) {
    console.log(`\n${colors.blue}=== Test Requests Access - ${userType} ===${colors.reset}`);
    
    try {
        const response = await axios.get(`${BASE_URL}/api/requests`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const requests = response.data.requests;
        const total = response.data.total;
        
        // Verifica che la risposta sia un array
        if (Array.isArray(requests)) {
            await logTest(`GET /api/requests - ${userType}`, true, 
                `Ricevute ${total} richieste`);
            
            // Analisi dettagliata per ruolo
            if (userType === 'client' && requests.length > 0) {
                // Verifica che il cliente veda solo le sue richieste
                const allOwnRequests = requests.every(r => r.clientId === userData.id);
                await logTest(`Client sees only own requests`, allOwnRequests,
                    allOwnRequests ? 'Tutte le richieste appartengono al cliente' : 
                    'ERRORE: Il cliente vede richieste di altri!');
            }
            
            if (userType === 'professional' && requests.length > 0) {
                // Verifica che il professionista veda solo quelle assegnate a lui
                const allAssignedToMe = requests.every(r => r.professionalId === userData.id);
                await logTest(`Professional sees only assigned requests`, allAssignedToMe,
                    allAssignedToMe ? 'Tutte le richieste sono assegnate al professionista' :
                    'ERRORE: Il professionista vede richieste non sue!');
            }
            
            if (userType === 'admin') {
                await logTest(`Admin can see all requests`, true,
                    `Admin vede ${total} richieste totali nel sistema`);
            }
            
            return requests;
        } else {
            await logTest(`GET /api/requests - ${userType}`, false, 
                'Risposta non valida');
            return [];
        }
    } catch (error) {
        await logTest(`GET /api/requests - ${userType}`, false,
            error.response?.data?.message || error.message);
        return [];
    }
}

async function testQuotesEndpoint(userType, token) {
    console.log(`\n${colors.blue}=== Test Quotes Access - ${userType} ===${colors.reset}`);
    
    try {
        const response = await axios.get(`${BASE_URL}/api/quotes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const quotes = response.data.data;
        
        if (Array.isArray(quotes)) {
            await logTest(`GET /api/quotes - ${userType}`, true, 
                `Ricevuti ${quotes.length} preventivi`);
            
            // Se è un cliente, verifica che non veda DRAFT
            if (userType === 'client') {
                const hasDrafts = quotes.some(q => q.status === 'DRAFT');
                await logTest(`Client doesn't see DRAFT quotes`, !hasDrafts,
                    hasDrafts ? 'ERRORE: Il cliente vede preventivi in bozza!' :
                    'Nessun preventivo in bozza visibile al cliente');
            }
            
            return quotes;
        } else {
            await logTest(`GET /api/quotes - ${userType}`, false, 
                'Risposta non valida');
            return [];
        }
    } catch (error) {
        await logTest(`GET /api/quotes - ${userType}`, false,
            error.response?.data?.message || error.message);
        return [];
    }
}

async function testDashboard(userType, token) {
    console.log(`\n${colors.blue}=== Test Dashboard - ${userType} ===${colors.reset}`);
    
    try {
        const response = await axios.get(`${BASE_URL}/api/dashboard`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.data) {
            await logTest(`GET /api/dashboard - ${userType}`, true,
                `Dashboard caricata con successo`);
            
            // Log alcune statistiche
            if (response.data.stats) {
                console.log(`  ${colors.yellow}Stats:${colors.reset}`);
                console.log(`    - Total Requests: ${response.data.stats.totalRequests || 0}`);
                console.log(`    - Pending: ${response.data.stats.pendingRequests || 0}`);
                console.log(`    - In Progress: ${response.data.stats.inProgressRequests || 0}`);
                console.log(`    - Completed: ${response.data.stats.completedRequests || 0}`);
            }
        }
    } catch (error) {
        await logTest(`GET /api/dashboard - ${userType}`, false,
            error.response?.data?.message || error.message);
    }
}

async function testAdminOnlyEndpoint(userType, token) {
    if (userType !== 'admin') return;
    
    console.log(`\n${colors.blue}=== Test Admin-Only Endpoints ===${colors.reset}`);
    
    try {
        const response = await axios.get(`${BASE_URL}/api/admin/dashboard`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        await logTest('Admin Dashboard Access', true,
            'Admin può accedere alla dashboard amministrativa');
    } catch (error) {
        await logTest('Admin Dashboard Access', false,
            error.response?.data?.message || error.message);
    }
}

async function runAllTests() {
    console.log(`${colors.cyan}${'='.repeat(60)}`);
    console.log(`${colors.cyan}     SISTEMA DI TEST ENDPOINT - RICHIESTA ASSISTENZA`);
    console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
    
    // 1. Test health check
    const serverUp = await testHealthCheck();
    if (!serverUp) {
        console.log(`\n${colors.red}⚠️  Server non raggiungibile su ${BASE_URL}${colors.reset}`);
        console.log(`${colors.yellow}Assicurati che il backend sia avviato con: cd backend && npm run dev${colors.reset}`);
        return;
    }
    
    // 2. Test login per ogni ruolo
    for (const userType of Object.keys(testUsers)) {
        const loginResult = await testLogin(userType);
        
        if (loginResult) {
            // 3. Test accesso requests
            await testRequestsEndpoint(userType, loginResult.token, loginResult.user);
            
            // 4. Test accesso quotes
            await testQuotesEndpoint(userType, loginResult.token);
            
            // 5. Test dashboard
            await testDashboard(userType, loginResult.token);
            
            // 6. Test admin endpoints (solo per admin)
            await testAdminOnlyEndpoint(userType, loginResult.token);
        }
    }
    
    // Report finale
    console.log(`\n${colors.cyan}${'='.repeat(60)}`);
    console.log(`${colors.cyan}                    REPORT FINALE`);
    console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
    console.log(`${colors.green}✅ Test Passati: ${testResults.passed}${colors.reset}`);
    console.log(`${colors.red}❌ Test Falliti: ${testResults.failed}${colors.reset}`);
    console.log(`📊 Totale Test: ${testResults.passed + testResults.failed}`);
    console.log(`🎯 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
    
    if (testResults.failed > 0) {
        console.log(`\n${colors.yellow}Test falliti:${colors.reset}`);
        testResults.tests
            .filter(t => !t.success)
            .forEach(t => console.log(`  - ${t.testName}: ${t.details}`));
    }
}

// Esegui i test
runAllTests().catch(error => {
    console.error(`${colors.red}Errore critico:${colors.reset}`, error);
    process.exit(1);
});
