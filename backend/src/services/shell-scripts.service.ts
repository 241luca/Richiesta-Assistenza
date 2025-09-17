/**
 * Shell Scripts Service
 * Servizio per eseguire gli script shell dalla cartella /scripts
 */

import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
// Import logger - con gestione errore se non esiste
const logger = {
  info: (...args: any[]) => console.log('[ShellScripts]', ...args),
  warn: (...args: any[]) => console.warn('[ShellScripts]', ...args),
  error: (...args: any[]) => console.error('[ShellScripts]', ...args),
  debug: (...args: any[]) => console.debug('[ShellScripts]', ...args)
};

interface ShellScript {
  name: string;
  displayName: string;
  description: string;
  available: boolean;
}

interface ScriptOutput {
  output: string;
  errors: string;
  exitCode: number;
  timestamp: string;
}

class ShellScriptsService {
  private scriptsPath: string;
  private availableScripts: Map<string, ShellScript> = new Map();

  constructor() {
    // Gli script sono nella cartella principale /scripts
    // Da backend/src/services a scripts (3 livelli sopra)
    this.scriptsPath = path.join(__dirname, '..', '..', '..', 'scripts');
    logger.info(`Scripts path configured: ${this.scriptsPath}`);
    this.initializeScripts();
  }

  private initializeScripts() {
    // Definizione degli script disponibili che il frontend si aspetta
    const scriptDefinitions: ShellScript[] = [
      {
        name: 'check-system',
        displayName: 'System Check',
        description: 'Verifica completa dello stato del sistema',
        available: false
      },
      {
        name: 'pre-commit-check',
        displayName: 'Pre-Commit Check',
        description: 'Controlli prima del commit',
        available: true
      },
      {
        name: 'validate-work',
        displayName: 'Validate Work',
        description: 'Valida le modifiche fatte',
        available: true
      },
      {
        name: 'claude-help',
        displayName: 'Claude Help',
        description: 'Guida rapida per sviluppatori',
        available: true
      },
      {
        name: 'audit-system-check',
        displayName: 'Analisi Completa Sistema Audit',
        description: 'Verifica dettagliata del sistema di Audit Log con 17 sezioni di controlli',
        available: true
      },
      {
        name: 'request-system-check-complete',
        displayName: 'Analisi Completa Modulo Richieste',
        description: 'Analisi dettagliata del modulo richieste con 17 sezioni di controlli',
        available: true
      },
      {
        name: 'quote-system-check-complete',
        displayName: 'Analisi Completa Modulo Preventivi',
        description: 'Verifica dettagliata del modulo Quote (Preventivi) con 17 sezioni di controlli',
        available: true
      },
      {
        name: 'intervention-report-check-complete',
        displayName: 'Analisi Completa Modulo Rapporti',
        description: 'Verifica dettagliata del modulo Rapporti Intervento con 17 sezioni di controlli',
        available: true
      },
      {
        name: 'backup-all',
        displayName: 'Backup All',
        description: 'Backup completo del sistema',
        available: true
      },
      {
        name: 'start-session',
        displayName: 'Start Session',
        description: 'Avvia sessione di sviluppo',
        available: true
      },
      {
        name: 'end-session',
        displayName: 'End Session', 
        description: 'Termina sessione di sviluppo',
        available: true
      },
      {
        name: 'test-sistema-completo',
        displayName: 'Test Sistema Completo',
        description: 'Test completo del sistema: TypeScript, API, Database e Health Checks',
        available: true
      },
      {
        name: 'test-api',
        displayName: 'Test API',
        description: 'Test di tutti gli endpoint API del sistema',
        available: true
      },
      {
        name: 'typescript-errors-check',
        displayName: 'TypeScript Errors Check',
        description: 'Controlla errori TypeScript in backend e frontend, ordinati per numero di errori',
        available: true
      },
      {
        name: 'check-response-formatter',
        displayName: 'Check ResponseFormatter Usage',
        description: 'Verifica che tutte le routes usino ResponseFormatter e che i services NON lo usino',
        available: true
      },
      {
        name: 'check-prisma-relations',
        displayName: 'Check Prisma Relations',
        description: 'Analizza schema.prisma per trovare relazioni con e senza @relation',
        available: true
      }
    ];

    // Aggiungi gli script di health check
    const healthCheckScripts = [
      'auth-system-check',
      'database-health-check',
      'notification-system-check',
      'backup-system-check',
      'chat-system-check',
      'payment-system-check',
      'ai-system-check',
      'request-system-check',
      'run-all-checks'
    ];

    healthCheckScripts.forEach(scriptName => {
      const displayName = scriptName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      scriptDefinitions.push({
        name: scriptName,
        displayName,
        description: `Health check per ${displayName.toLowerCase()}`,
        available: true
      });
    });

    // Verifica quali script esistono effettivamente
    scriptDefinitions.forEach(script => {
      const scriptPath = this.getScriptPath(script.name);
      try {
        if (fs.existsSync(scriptPath)) {
          script.available = true;
          fs.chmodSync(scriptPath, '755'); // Assicura che sia eseguibile
          logger.debug(`✅ Script found: ${script.name} at ${scriptPath}`);
        } else {
          script.available = false;
          logger.warn(`⚠️ Script not found: ${script.name} at ${scriptPath}`);
        }
      } catch (error) {
        script.available = false;
        logger.warn(`❌ Error checking script ${script.name}:`, error);
      }
      this.availableScripts.set(script.name, script);
    });

    logger.info(`✅ Shell scripts initialized: ${this.availableScripts.size} scripts registered`);
  }

  private getScriptPath(scriptName: string): string {
    // Prima controlla nella cartella principale scripts
    let scriptPath = path.join(this.scriptsPath, `${scriptName}.sh`);
    
    // Se non esiste, controlla nelle sottocartelle
    if (!fs.existsSync(scriptPath)) {
      // Controlla in health-checks/shell
      scriptPath = path.join(this.scriptsPath, 'health-checks', 'shell', `${scriptName}.sh`);
    }
    
    // Se ancora non esiste, prova senza estensione .sh (alcuni script non ce l'hanno)
    if (!fs.existsSync(scriptPath)) {
      scriptPath = path.join(this.scriptsPath, scriptName);
    }
    
    return scriptPath;
  }

  public getScripts(): ShellScript[] {
    return Array.from(this.availableScripts.values());
  }

  public async executeScript(scriptNameWithArgs: string): Promise<ScriptOutput> {
    // Separa il nome dello script dagli argomenti
    const parts = scriptNameWithArgs.split(' ');
    const scriptName = parts[0];
    const args = parts.slice(1);
    
    const script = this.availableScripts.get(scriptName);
    
    if (!script) {
      throw new Error(`Script ${scriptName} not found`);
    }

    if (!script.available) {
      throw new Error(`Script ${scriptName} is not available`);
    }

    const scriptPath = this.getScriptPath(scriptName);
    
    // Verifica ancora una volta che lo script esista
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Script file not found at ${scriptPath}`);
    }
    
    logger.info(`🚀 Executing shell script: ${scriptName} at ${scriptPath} with args: ${args.join(' ')}`);

    return new Promise((resolve, reject) => {
      let output = '';
      let errors = '';

      // Esegui lo script con gli argomenti
      const projectRoot = path.join(__dirname, '..', '..', '..'); // Root del progetto
      const child = spawn('bash', [scriptPath, ...args], {
        cwd: projectRoot, // Esegui dalla root del progetto
        env: { ...process.env },
        shell: true
      });

      // Cattura l'output
      child.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        logger.debug(`[${scriptName}] stdout: ${text}`);
      });

      // Cattura gli errori
      child.stderr.on('data', (data) => {
        const text = data.toString();
        errors += text;
        logger.debug(`[${scriptName}] stderr: ${text}`);
      });

      // Gestisci la fine dell'esecuzione
      child.on('close', (code) => {
        logger.info(`✅ Script ${scriptName} completed with exit code ${code}`);
        
        resolve({
          output,
          errors,
          exitCode: code || 0,
          timestamp: new Date().toISOString()
        });
      });

      // Gestisci errori di spawn
      child.on('error', (error) => {
        logger.error(`❌ Script ${scriptName} failed:`, error);
        reject(error);
      });

      // Timeout dopo 5 minuti (aumentato per script complessi)
      setTimeout(() => {
        child.kill();
        reject(new Error(`Script ${scriptName} timed out after 5 minutes`));
      }, 5 * 60 * 1000);
    });
  }
}

// Export singleton
export const shellScriptsService = new ShellScriptsService();
