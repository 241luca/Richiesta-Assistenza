const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 Test SOLO noImplicitAny...\n');

try {
  const output = execSync(
    'cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend && npx tsc --noEmit --noImplicitAny',
    { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
  );
  
  console.log('✅ Nessun errore trovato!');
  
  fs.writeFileSync(
    '/Users/lucamambelli/Desktop/Richiesta-Assistenza/strict-only-any-results.txt',
    '✅ ZERO ERRORI con solo noImplicitAny!\n'
  );
  
} catch (error) {
  const errorOutput = error.stdout || error.stderr || error.message;
  const errorLines = errorOutput.split('\n').filter(line => line.includes('error TS'));
  const totalErrors = errorLines.length;
  
  console.log(`❌ Trovati ${totalErrors} errori\n`);
  
  const summary = `
📊 TEST SOLO noImplicitAny
==========================

Totale errori: ${totalErrors}

PRIMI 30 ERRORI:
${errorLines.slice(0, 30).join('\n')}

ANALISI RAPIDA:
${totalErrors < 200 ? '✅ MOLTO FATTIBILE - Inizia da qui!' : 
  totalErrors < 400 ? '⚠️ FATTIBILE - Ma richiede impegno' :
  '❌ ANCORA TROPPI'}

STIMA: ${Math.ceil(totalErrors / 50)} giorni di correzione + 2 giorni test
  `;
  
  fs.writeFileSync(
    '/Users/lucamambelli/Desktop/Richiesta-Assistenza/strict-only-any-results.txt',
    summary
  );
  
  console.log('✅ Salvato in strict-only-any-results.txt');
}
