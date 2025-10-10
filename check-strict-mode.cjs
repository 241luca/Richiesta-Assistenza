const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 Controllo errori TypeScript in modalità strict...\n');

try {
  // Esegui il check TypeScript con strict mode
  const output = execSync(
    'cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend && npx tsc --noEmit --strict',
    { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
  );
  
  console.log('✅ Nessun errore trovato!');
  console.log(output);
  
  // Salva risultati
  fs.writeFileSync(
    '/Users/lucamambelli/Desktop/Richiesta-Assistenza/strict-results.txt',
    '✅ NESSUN ERRORE TROVATO CON STRICT MODE!\n\n' + output
  );
  
} catch (error) {
  // Gli errori TypeScript vengono catturati qui
  const errorOutput = error.stdout || error.stderr || error.message;
  
  // Conta gli errori
  const errorLines = errorOutput.split('\n').filter(line => line.includes('error TS'));
  const totalErrors = errorLines.length;
  
  console.log(`❌ Trovati ${totalErrors} errori TypeScript\n`);
  console.log('Primi 50 errori:');
  console.log(errorLines.slice(0, 50).join('\n'));
  
  // Salva risultati completi
  const summary = `
📊 RISULTATI CHECK STRICT MODE
================================

Totale errori trovati: ${totalErrors}

PRIMI 50 ERRORI:
${errorLines.slice(0, 50).join('\n')}

OUTPUT COMPLETO:
${errorOutput}
  `;
  
  fs.writeFileSync(
    '/Users/lucamambelli/Desktop/Richiesta-Assistenza/strict-results.txt',
    summary
  );
  
  console.log('\n✅ Risultati salvati in strict-results.txt');
}
