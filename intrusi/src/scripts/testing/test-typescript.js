#!/usr/bin/env node

/**
 * Test Completo Sistema TypeScript
 * Verifica tutti gli errori TypeScript nel progetto
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colori per output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

async function runTypeScriptCheck() {
  console.log(`${colors.blue}🔍 TEST TYPESCRIPT - VERIFICA ERRORI${colors.reset}`);
  console.log('=' .repeat(50));
  
  const backendDir = path.join(__dirname, '../../..');
  
  return new Promise((resolve, reject) => {
    exec('npx tsc --noEmit', { cwd: backendDir }, (error, stdout, stderr) => {
      const output = stdout + stderr;
      const errorLines = output.split('\n').filter(line => line.includes('error TS'));
      const errorCount = errorLines.length;
      
      console.log(`\n📊 Risultati:`);
      
      if (errorCount === 0) {
        console.log(`${colors.green}✅ SUCCESSO! Nessun errore TypeScript trovato!${colors.reset}`);
        
        // Conta i file verificati
        exec('find src -name "*.ts" | wc -l', { cwd: backendDir }, (err, stdout) => {
          const fileCount = parseInt(stdout.trim());
          console.log(`${colors.green}📁 ${fileCount} file TypeScript verificati${colors.reset}`);
        });
        
        resolve({
          success: true,
          errors: 0,
          message: 'Nessun errore TypeScript'
        });
      } else {
        console.log(`${colors.red}❌ Trovati ${errorCount} errori TypeScript${colors.reset}\n`);
        
        // Mostra i primi 10 errori
        console.log('Primi errori trovati:');
        errorLines.slice(0, 10).forEach((line, i) => {
          console.log(`  ${i + 1}. ${line.trim()}`);
        });
        
        if (errorCount > 10) {
          console.log(`  ... e altri ${errorCount - 10} errori`);
        }
        
        // Analizza errori per file
        const errorsByFile = {};
        output.split('\n').forEach(line => {
          const match = line.match(/(.+\.ts)\((\d+),(\d+)\): error/);
          if (match) {
            const file = match[1];
            errorsByFile[file] = (errorsByFile[file] || 0) + 1;
          }
        });
        
        console.log('\n📁 File con errori:');
        Object.entries(errorsByFile)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .forEach(([file, count]) => {
            const fileName = path.basename(file);
            console.log(`  ${colors.yellow}${fileName}${colors.reset}: ${count} errori`);
          });
        
        resolve({
          success: false,
          errors: errorCount,
          message: `${errorCount} errori TypeScript trovati`,
          files: errorsByFile
        });
      }
    });
  });
}

// Esegui il test
if (require.main === module) {
  runTypeScriptCheck()
    .then(result => {
      console.log('\n' + '=' .repeat(50));
      console.log('Test completato');
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error(`${colors.red}Errore durante il test:${colors.reset}`, error);
      process.exit(1);
    });
}

module.exports = { runTypeScriptCheck };
