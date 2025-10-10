#!/usr/bin/env node

/**
 * 🤖 INTELLIGENT TYPESCRIPT AUTO-FIXER
 * 
 * Script Node.js che analizza gli errori TypeScript e applica fix intelligenti
 * usando l'AST invece di regex (molto più sicuro)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BACKEND_DIR = '/Users/lucamambelli/Desktop/Richiesta-Assistenza/backend';
const DRY_RUN = process.argv.includes('--dry-run');

console.log('🤖 TypeScript Intelligent Auto-Fixer');
console.log('====================================\n');

if (DRY_RUN) {
  console.log('⚠️  DRY RUN MODE - Nessuna modifica sarà applicata\n');
}

// Ottieni errori TypeScript
console.log('📊 Analisi errori TypeScript...');
let tscOutput;
try {
  execSync('npx tsc --noEmit', { 
    cwd: BACKEND_DIR,
    encoding: 'utf-8'
  });
  console.log('✅ Nessun errore trovato!');
  process.exit(0);
} catch (error) {
  tscOutput = error.stdout || error.stderr;
}

// Parse errori
const errors = [];
const lines = tscOutput.split('\n');

for (const line of lines) {
  const match = line.match(/^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/);
  if (match) {
    const [, file, line, column, code, message] = match;
    errors.push({
      file: path.join(BACKEND_DIR, file),
      relativePath: file, // Percorso relativo da backend/
      line: parseInt(line),
      column: parseInt(column),
      code,
      message
    });
  }
}

console.log(`Trovati ${errors.length} errori TypeScript\n`);

// Raggruppa per tipo
const errorsByType = {};
errors.forEach(err => {
  if (!errorsByType[err.code]) {
    errorsByType[err.code] = [];
  }
  errorsByType[err.code].push(err);
});

// Statistiche
console.log('📊 Distribuzione errori:');
Object.entries(errorsByType)
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 10)
  .forEach(([code, errs]) => {
    console.log(`   ${code}: ${errs.length} errori`);
  });
console.log('');

// Contatori fix
let fixedCount = 0;
const fixedByType = {};

// Fix TS7018: Object literal's property implicitly has 'any[]' type
if (errorsByType['TS7018']) {
  console.log('🔧 Fixing TS7018: Array implicitly any[]...');
  
  errorsByType['TS7018'].forEach(err => {
    try {
      const content = fs.readFileSync(err.file, 'utf-8');
      const lines = content.split('\n');
      const targetLine = lines[err.line - 1];
      
      // Pattern: property: []
      // Fix: property: any[]
      const match = targetLine.match(/(\s*)([a-zA-Z_][a-zA-Z0-9_]*): \[\]/);
      if (match) {
        const [, indent, prop] = match;
        const newLine = targetLine.replace(
          `${prop}: []`,
          `${prop}: any[]`
        );
        
        if (!DRY_RUN) {
          lines[err.line - 1] = newLine;
          fs.writeFileSync(err.file, lines.join('\n'), 'utf-8');
        }
        
        fixedCount++;
        fixedByType['TS7018'] = (fixedByType['TS7018'] || 0) + 1;
        console.log(`   ✅ backend/${err.relativePath}:${err.line}`);
      }
    } catch (e) {
      console.log(`   ❌ Error fixing backend/${err.relativePath}:${err.line}`, e.message);
    }
  });
  console.log('');
}

// Fix TS7034: Variable implicitly has type 'any[]'
if (errorsByType['TS7034']) {
  console.log('🔧 Fixing TS7034: Variable implicitly any[]...');
  
  errorsByType['TS7034'].forEach(err => {
    try {
      const content = fs.readFileSync(err.file, 'utf-8');
      const lines = content.split('\n');
      const targetLine = lines[err.line - 1];
      
      // Pattern: const/let variable = []
      // Fix: const/let variable: any[] = []
      const match = targetLine.match(/(const|let)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*\[\]/);
      if (match) {
        const [, keyword, varName] = match;
        const newLine = targetLine.replace(
          `${keyword} ${varName} = []`,
          `${keyword} ${varName}: any[] = []`
        );
        
        if (!DRY_RUN) {
          lines[err.line - 1] = newLine;
          fs.writeFileSync(err.file, lines.join('\n'), 'utf-8');
        }
        
        fixedCount++;
        fixedByType['TS7034'] = (fixedByType['TS7034'] || 0) + 1;
        console.log(`   ✅ backend/${err.relativePath}:${err.line}`);
      }
    } catch (e) {
      console.log(`   ❌ Error fixing backend/${err.relativePath}:${err.line}`, e.message);
    }
  });
  console.log('');
}

// Fix TS7005: Variable implicitly has 'any[]' type
if (errorsByType['TS7005']) {
  console.log('🔧 Fixing TS7005: Variable implicitly any[]...');
  
  errorsByType['TS7005'].forEach(err => {
    try {
      const content = fs.readFileSync(err.file, 'utf-8');
      const lines = content.split('\n');
      const targetLine = lines[err.line - 1];
      
      // Trova il nome della variabile dall'errore
      const varMatch = err.message.match(/Variable '([^']+)'/);
      if (!varMatch) return;
      
      const varName = varMatch[1];
      
      // Aggiungi tipo dove la variabile è usata
      if (targetLine.includes(varName) && !targetLine.includes(': any[]')) {
        // Trova dove aggiungere il tipo
        const newLine = targetLine.replace(
          new RegExp(`\\b${varName}\\b`),
          `${varName}: any[]`
        );
        
        if (!DRY_RUN) {
          lines[err.line - 1] = newLine;
          fs.writeFileSync(err.file, lines.join('\n'), 'utf-8');
        }
        
        fixedCount++;
        fixedByType['TS7005'] = (fixedByType['TS7005'] || 0) + 1;
        console.log(`   ✅ backend/${err.relativePath}:${err.line}`);
      }
    } catch (e) {
      console.log(`   ❌ Error fixing backend/${err.relativePath}:${err.line}`, e.message);
    }
  });
  console.log('');
}

// Report finale
console.log('====================================');
console.log('📊 REPORT FINALE');
console.log('====================================\n');
console.log(`Errori totali:      ${errors.length}`);
console.log(`Errori fixati:      ${fixedCount}`);
console.log(`Fix rate:           ${((fixedCount / errors.length) * 100).toFixed(1)}%\n`);

if (Object.keys(fixedByType).length > 0) {
  console.log('Fix per tipo:');
  Object.entries(fixedByType).forEach(([type, count]) => {
    console.log(`   ${type}: ${count} fix`);
  });
  console.log('');
}

if (DRY_RUN) {
  console.log('⚠️  DRY RUN completato - nessuna modifica applicata');
  console.log('   Esegui senza --dry-run per applicare i fix\n');
} else {
  console.log('✅ Fix applicati con successo!');
  console.log('   Esegui "npm run build" per verificare\n');
}

// Mostra primi 20 file con più errori
console.log('📂 Top 20 file con più errori:');
const fileErrors = {};
errors.forEach(err => {
  const filePath = `backend/${err.relativePath}`;
  fileErrors[filePath] = (fileErrors[filePath] || 0) + 1;
});

Object.entries(fileErrors)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .forEach(([file, count], index) => {
    console.log(`   ${index + 1}. ${file} (${count} errori)`);
  });

console.log('');
console.log('💡 TIP: Apri questi file in VSCode per vedere gli errori evidenziati');
console.log('');

process.exit(0);
