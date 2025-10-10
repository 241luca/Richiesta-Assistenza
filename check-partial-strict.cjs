const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 Test Strict Mode Parziale (noImplicitAny + strictFunctionTypes)...\n');

try {
  // Esegui il check TypeScript con solo questi 2 flag
  const output = execSync(
    'cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend && npx tsc --noEmit --noImplicitAny --strictFunctionTypes',
    { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
  );
  
  console.log('✅ Nessun errore trovato con questi 2 controlli!');
  
  fs.writeFileSync(
    '/Users/lucamambelli/Desktop/Richiesta-Assistenza/strict-partial-results.txt',
    '✅ NESSUN ERRORE con noImplicitAny + strictFunctionTypes!\n\n' + output
  );
  
} catch (error) {
  const errorOutput = error.stdout || error.stderr || error.message;
  
  // Conta gli errori
  const errorLines = errorOutput.split('\n').filter(line => line.includes('error TS'));
  const totalErrors = errorLines.length;
  
  console.log(`❌ Trovati ${totalErrors} errori TypeScript\n`);
  console.log('Primi 50 errori:');
  console.log(errorLines.slice(0, 50).join('\n'));
  
  // Analizza tipi di errori
  const errorTypes = {};
  errorLines.forEach(line => {
    const match = line.match(/error (TS\d+):/);
    if (match) {
      const code = match[1];
      errorTypes[code] = (errorTypes[code] || 0) + 1;
    }
  });
  
  console.log('\n📊 Distribuzione errori per tipo:');
  Object.entries(errorTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([code, count]) => {
      console.log(`  ${code}: ${count} errori`);
    });
  
  // Salva risultati
  const summary = `
📊 RISULTATI TEST STRICT MODE PARZIALE
========================================

Configurazione:
- noImplicitAny: true
- strictFunctionTypes: true  
- Tutti gli altri: false

Totale errori trovati: ${totalErrors}

DISTRIBUZIONE ERRORI:
${Object.entries(errorTypes)
  .sort((a, b) => b[1] - a[1])
  .map(([code, count]) => `${code}: ${count} errori`)
  .join('\n')}

PRIMI 50 ERRORI:
${errorLines.slice(0, 50).join('\n')}

ANALISI:
${totalErrors < 100 ? '✅ MOLTO FATTIBILE - Pochi errori da correggere' : 
  totalErrors < 300 ? '⚠️ FATTIBILE - Impegno moderato richiesto' :
  '❌ DIFFICILE - Molti errori da correggere'}

STIMA TEMPO:
- Correzione errori: ${Math.ceil(totalErrors / 50)} giorni
- Testing: 1-2 giorni
- Totale: ${Math.ceil(totalErrors / 50) + 2} giorni lavorativi
  `;
  
  fs.writeFileSync(
    '/Users/lucamambelli/Desktop/Richiesta-Assistenza/strict-partial-results.txt',
    summary
  );
  
  console.log('\n✅ Risultati completi salvati in strict-partial-results.txt');
}
