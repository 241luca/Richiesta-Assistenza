// Script per controllare TypeScript strict mode
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const files = [
  'src/services/healthCheck.service.ts',
  'src/services/health-check-automation/orchestrator.ts', 
  'src/services/health-check-automation/auto-remediation.ts',
  'src/services/health-check-automation/report-generator.ts'
];

console.log('🔍 Controllo TypeScript Strict Mode Health Check Files\n');
console.log('=' .repeat(50));

let hasErrors = false;

for (const file of files) {
  console.log(`\n📂 Controllo: ${file}`);
  
  try {
    // Prova a compilare con strict mode
    execSync(`npx tsc --noEmit --strict --skipLibCheck ${file}`, {
      cwd: '/Users/lucamambelli/Desktop/Richiesta-Assistenza/backend',
      stdio: 'pipe'
    });
    
    console.log('✅ OK - Nessun errore strict mode!');
  } catch (error: any) {
    hasErrors = true;
    console.log('❌ ERRORI TROVATI:');
    
    // Mostra solo i primi 5 errori per file
    const errors = error.stdout?.toString() || error.stderr?.toString() || '';
    const errorLines = errors.split('\n').slice(0, 10);
    errorLines.forEach((line: string) => {
      if (line.includes('error TS')) {
        console.log(`   ${line}`);
      }
    });
  }
}

console.log('\n' + '=' .repeat(50));
console.log(hasErrors ? 
  '❌ Alcuni file hanno errori strict mode' : 
  '✅ Tutti i file sono compatibili con strict mode!'
);
