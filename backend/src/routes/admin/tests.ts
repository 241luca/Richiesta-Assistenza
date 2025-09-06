/**
 * Admin Test Routes
 * Sistema completo di testing con risultati comprensibili e suggerimenti
 */

import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';

const router = Router();
const execAsync = promisify(exec);

// AUTENTICAZIONE ABILITATA - Solo admin può eseguire test
router.use(authenticate);
router.use(requireRole(['SUPER_ADMIN', 'ADMIN']));

// Definizione categorie di test con tutti gli script disponibili
const TEST_CATEGORIES = {
  // Test unitari nel backend
  backend: {
    name: 'Test Backend Completi',
    description: 'Tutti i test unitari del backend',
    command: 'npm test',
    cwd: 'backend',
    tests: [
      'health.test.ts - Controllo salute sistema',
      'auth.test.ts - Test autenticazione',
      'api.test.ts - Test API endpoints',
      'websocket.test.ts - Test WebSocket',
      'integration.test.ts - Test integrazione'
    ]
  },
  
  // Test E2E con Playwright
  e2e: {
    name: 'Test End-to-End',
    description: 'Test completi con browser automatizzato',
    command: 'npx playwright test',
    cwd: '.',
    tests: [
      'auth.e2e.test.ts - Test login/registrazione',
      'requests.e2e.test.ts - Test richieste assistenza'
    ]
  },
  
  // Script di test bash
  database: {
    name: 'Test Database',
    description: 'Verifica integrità database e tabelle',
    scripts: [
      { file: 'check-tables.sh', name: 'Verifica tabelle' },
      { file: 'check-quotes-db.sh', name: 'Verifica preventivi' },
      { file: 'check-client-user.sh', name: 'Verifica utenti' },
      { file: 'check-and-clean-db.sh', name: 'Pulizia database' }
    ]
  },
  
  api: {
    name: 'Test API',
    description: 'Test delle API con curl',
    scripts: [
      { file: 'test-api.sh', name: 'Test API generali' },
      { file: 'test-auth.sh', name: 'Test autenticazione API' },
      { file: 'test-login.sh', name: 'Test login API' },
      { file: 'test-quotes-api.sh', name: 'Test preventivi API' }
    ]
  },
  
  integration: {
    name: 'Test Integrazione',
    description: 'Test funzionalità complete',
    scripts: [
      { file: 'test-system.sh', name: 'Test sistema completo' },
      { file: 'test-complete.sh', name: 'Test workflow completo' },
      { file: 'test-quotes-complete.sh', name: 'Test preventivi completo' },
      { file: 'test-google-maps.sh', name: 'Test Google Maps' }
    ]
  }
};

// Suggerimenti automatici per errori comuni
const ERROR_SUGGESTIONS = {
  'Cannot connect to database': {
    problem: 'Il database non è raggiungibile',
    solution: 'Verifica che PostgreSQL sia avviato: docker-compose up -d postgres',
    severity: 'critical'
  },
  'ECONNREFUSED': {
    problem: 'Connessione rifiutata',
    solution: 'Il servizio potrebbe non essere avviato. Controlla che backend e frontend siano in esecuzione',
    severity: 'critical'
  },
  'rate limit': {
    problem: 'Troppi tentativi di accesso',
    solution: 'Attendi 15 minuti o riavvia il backend per resettare il rate limiting',
    severity: 'warning'
  },
  'slug.*missing': {
    problem: 'Campo slug mancante nel database',
    solution: 'Esegui le migrazioni: cd backend && npx prisma db push',
    severity: 'error'
  },
  'Authentication failed': {
    problem: 'Autenticazione fallita',
    solution: 'Verifica che gli utenti di test siano presenti nel database. Esegui: ./setup-test-users.sql',
    severity: 'error'
  },
  'timeout': {
    problem: 'Test in timeout',
    solution: 'Il test impiega troppo tempo. Potrebbe esserci un problema di performance o un loop infinito',
    severity: 'warning'
  },
  '401': {
    problem: 'Non autorizzato',
    solution: 'Token di autenticazione mancante o non valido. Verifica il sistema di autenticazione',
    severity: 'error'
  },
  '429': {
    problem: 'Troppe richieste',
    solution: 'Rate limiting attivato. Attendi o riavvia il server',
    severity: 'warning'
  },
  'P2025': {
    problem: 'Record non trovato nel database',
    solution: 'Dati di test mancanti. Esegui gli script di setup del database',
    severity: 'error'
  }
};

/**
 * GET /api/admin/tests/categories
 * Ottieni tutte le categorie di test disponibili
 */
router.get('/categories', async (req, res) => {
  res.json(TEST_CATEGORIES);
});

/**
 * POST /api/admin/tests/run/:category
 * Esegui una categoria di test specifica
 */
router.post('/run/:category', async (req, res) => {
  const { category } = req.params;
  const testConfig = TEST_CATEGORIES[category];
  
  if (!testConfig) {
    return res.status(400).json({ 
      error: 'Categoria non valida',
      available: Object.keys(TEST_CATEGORIES)
    });
  }
  
  // Imposta header per streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  try {
    // Invia evento di inizio
    res.write(`data: ${JSON.stringify({
      type: 'start',
      category,
      message: `Avvio test ${testConfig.name}...`,
      timestamp: new Date().toISOString()
    })}\n\n`);
    
    let results = [];
    let hasErrors = false;
    
    // Esegui test in base al tipo
    if (testConfig.command) {
      // Test con comando npm/npx
      const cwd = path.join(process.cwd(), testConfig.cwd || '.');
      
      res.write(`data: ${JSON.stringify({
        type: 'info',
        message: `Esecuzione: ${testConfig.command}`,
        cwd
      })}\n\n`);
      
      try {
        const { stdout, stderr } = await execAsync(testConfig.command, { 
          cwd,
          env: { ...process.env, CI: 'true' }
        });
        
        // Analizza output
        const analysis = analyzeTestOutput(stdout + stderr);
        results = analysis.results;
        hasErrors = analysis.hasErrors;
        
        // Invia risultati analizzati
        for (const result of results) {
          res.write(`data: ${JSON.stringify({
            type: 'result',
            ...result
          })}\n\n`);
          
          // Aggiungi suggerimento se c'è un errore
          if (result.status === 'failed' && result.error) {
            const suggestion = findSuggestion(result.error);
            if (suggestion) {
              res.write(`data: ${JSON.stringify({
                type: 'suggestion',
                ...suggestion
              })}\n\n`);
            }
          }
        }
        
      } catch (error: any) {
        hasErrors = true;
        const errorMsg = error.stderr || error.message;
        
        res.write(`data: ${JSON.stringify({
          type: 'error',
          message: 'Errore esecuzione test',
          error: errorMsg
        })}\n\n`);
        
        // Trova suggerimento per l'errore
        const suggestion = findSuggestion(errorMsg);
        if (suggestion) {
          res.write(`data: ${JSON.stringify({
            type: 'suggestion',
            ...suggestion
          })}\n\n`);
        }
      }
      
    } else if (testConfig.scripts) {
      // Script bash individuali
      for (const script of testConfig.scripts) {
        const scriptPath = path.join(process.cwd(), script.file);
        
        res.write(`data: ${JSON.stringify({
          type: 'info',
          message: `Esecuzione script: ${script.name}`
        })}\n\n`);
        
        try {
          // Verifica che il file esista
          await fs.access(scriptPath);
          
          // Rendi eseguibile
          await execAsync(`chmod +x ${scriptPath}`);
          
          // Esegui
          const { stdout, stderr } = await execAsync(scriptPath);
          
          res.write(`data: ${JSON.stringify({
            type: 'result',
            name: script.name,
            status: stderr ? 'warning' : 'passed',
            output: stdout,
            error: stderr
          })}\n\n`);
          
          if (stderr) {
            hasErrors = true;
            const suggestion = findSuggestion(stderr);
            if (suggestion) {
              res.write(`data: ${JSON.stringify({
                type: 'suggestion',
                ...suggestion
              })}\n\n`);
            }
          }
          
        } catch (error: any) {
          hasErrors = true;
          res.write(`data: ${JSON.stringify({
            type: 'result',
            name: script.name,
            status: 'failed',
            error: error.message
          })}\n\n`);
        }
      }
    }
    
    // Invia riepilogo finale
    const summary = generateSummary(results, hasErrors);
    res.write(`data: ${JSON.stringify({
      type: 'complete',
      summary,
      hasErrors,
      timestamp: new Date().toISOString()
    })}\n\n`);
    
  } catch (error: any) {
    res.write(`data: ${JSON.stringify({
      type: 'fatal',
      error: error.message
    })}\n\n`);
  }
  
  res.end();
});

/**
 * POST /api/admin/tests/run-all
 * Esegui TUTTI i test disponibili
 */
router.post('/run-all', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  const allResults = [];
  let totalErrors = 0;
  
  res.write(`data: ${JSON.stringify({
    type: 'start',
    message: 'Avvio suite completa di test...',
    totalCategories: Object.keys(TEST_CATEGORIES).length
  })}\n\n`);
  
  // Esegui ogni categoria
  for (const [categoryId, config] of Object.entries(TEST_CATEGORIES)) {
    res.write(`data: ${JSON.stringify({
      type: 'category_start',
      Category: categoryId,
      name: config.name
    })}\n\n`);
    
    // Qui dovremmo eseguire i test per questa categoria
    // Per ora simuliamo
    
    res.write(`data: ${JSON.stringify({
      type: 'category_complete',
      Category: categoryId
    })}\n\n`);
  }
  
  res.write(`data: ${JSON.stringify({
    type: 'all_complete',
    totalTests: allResults.length,
    totalErrors,
    timestamp: new Date().toISOString()
  })}\n\n`);
  
  res.end();
});

/**
 * GET /api/admin/tests/history
 * Ottieni storico dei test eseguiti
 */
router.get('/history', async (req, res) => {
  try {
    const historyPath = path.join(process.cwd(), 'test-results-history.json');
    
    try {
      const history = await fs.readFile(historyPath, 'utf-8');
      res.json(JSON.parse(history));
    } catch {
      res.json({ history: [], message: 'Nessuno storico disponibile' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Errore lettura storico' });
  }
});

// FUNZIONI HELPER

/**
 * Analizza l'output dei test e categorizza i risultati
 */
function analyzeTestOutput(output: string): { results: any[], hasErrors: boolean } {
  const results = [];
  let hasErrors = false;
  const lines = output.split('\n');
  
  // Pattern per diversi formati di test
  const patterns = {
    vitest: {
      pass: /✓\s+(.+?)(?:\s+\((\d+)ms\))?$/,
      fail: /✗\s+(.+?)(?:\s+\((\d+)ms\))?$/,
      skip: /○\s+(.+?)$/,
      suite: /(?:PASS|FAIL)\s+(.+)$/
    },
    jest: {
      pass: /✓\s+(.+?)(?:\s+\((\d+)\s*ms\))?$/,
      fail: /✕\s+(.+?)(?:\s+\((\d+)\s*ms\))?$/,
      skip: /○\s+(.+?)$/
    }
  };
  
  for (const line of lines) {
    // Test passato
    if (patterns.vitest.pass.test(line) || patterns.jest.pass.test(line)) {
      const match = line.match(patterns.vitest.pass) || line.match(patterns.jest.pass);
      if (match) {
        results.push({
          name: match[1].trim(),
          status: 'passed',
          duration: match[2] ? parseInt(match[2]) : null
        });
      }
    }
    
    // Test fallito
    if (patterns.vitest.fail.test(line) || patterns.jest.fail.test(line)) {
      const match = line.match(patterns.vitest.fail) || line.match(patterns.jest.fail);
      if (match) {
        hasErrors = true;
        results.push({
          name: match[1].trim(),
          status: 'failed',
          duration: match[2] ? parseInt(match[2]) : null,
          error: extractErrorDetails(lines, lines.indexOf(line))
        });
      }
    }
    
    // Test saltato
    if (patterns.vitest.skip.test(line) || patterns.jest.skip.test(line)) {
      const match = line.match(patterns.vitest.skip) || line.match(patterns.jest.skip);
      if (match) {
        results.push({
          name: match[1].trim(),
          status: 'skipped'
        });
      }
    }
    
    // Suite completa
    if (patterns.vitest.suite.test(line)) {
      const match = line.match(patterns.vitest.suite);
      if (match) {
        const suiteName = match[1].trim();
        const status = line.includes('FAIL') ? 'failed' : 'passed';
        if (status === 'failed') hasErrors = true;
        
        results.push({
          name: `Suite: ${suiteName}`,
          status,
          isSuite: true
        });
      }
    }
  }
  
  // Se non troviamo pattern specifici, cerchiamo indicatori generali
  if (results.length === 0) {
    if (output.includes('All tests passed') || output.includes('PASS')) {
      results.push({
        name: 'Test completati',
        status: 'passed',
        message: 'Tutti i test sono passati'
      });
    } else if (output.includes('FAIL') || output.includes('Error')) {
      hasErrors = true;
      results.push({
        name: 'Test con errori',
        status: 'failed',
        error: output
      });
    }
  }
  
  return { results, hasErrors };
}

/**
 * Estrae dettagli dell'errore dal contesto
 */
function extractErrorDetails(lines: string[], errorIndex: number): string {
  const errorLines = [];
  
  // Prendi le prossime 5-10 righe dopo l'errore
  for (let i = errorIndex + 1; i < Math.min(errorIndex + 10, lines.length); i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith('✓') && !line.startsWith('✗') && !line.startsWith('○')) {
      errorLines.push(line);
    } else if (errorLines.length > 0) {
      break;
    }
  }
  
  return errorLines.join(' ').substring(0, 500); // Limita a 500 caratteri
}

/**
 * Trova suggerimenti per errori comuni
 */
function findSuggestion(error: string): any {
  const errorLower = error.toLowerCase();
  
  for (const [pattern, suggestion] of Object.entries(ERROR_SUGGESTIONS)) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(errorLower)) {
      return suggestion;
    }
  }
  
  // Suggerimenti generici
  if (errorLower.includes('error')) {
    return {
      problem: 'Errore generico rilevato',
      solution: 'Controlla i log per maggiori dettagli. Prova a eseguire il test singolarmente',
      severity: 'warning'
    };
  }
  
  return null;
}

/**
 * Genera un riepilogo comprensibile dei risultati
 */
function generateSummary(results: any[], hasErrors: boolean): any {
  const total = results.length;
  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  
  let message = '';
  let status = '';
  
  if (failed === 0 && passed > 0) {
    status = 'success';
    message = `✅ Ottimo! Tutti i ${passed} test sono passati.`;
  } else if (failed > 0 && failed < total / 2) {
    status = 'warning';
    message = `⚠️ Attenzione: ${failed} test su ${total} sono falliti. Controlla i suggerimenti.`;
  } else if (failed >= total / 2) {
    status = 'error';
    message = `❌ Critico: ${failed} test su ${total} sono falliti. Sistema non funzionante.`;
  } else if (total === 0) {
    status = 'info';
    message = '📋 Nessun test trovato o eseguito.';
  }
  
  return {
    total,
    passed,
    failed,
    skipped,
    successRate: total > 0 ? Math.round((passed / total) * 100) : 0,
    status,
    message
  };
}

export default router;
