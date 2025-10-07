// Verifica configurazione cleanup attuale
import { prisma } from './src/config/database';

async function verificaConfigCleanup() {
  try {
    console.log('🔍 VERIFICA CONFIGURAZIONE CLEANUP\n');
    
    // Pattern attivi
    console.log('📋 PATTERN ATTIVI:');
    const patterns = await prisma.cleanupPattern.findMany({
      where: { isActive: true }
    });
    
    if (patterns.length === 0) {
      console.log('  ❌ Nessun pattern configurato!');
    } else {
      patterns.forEach(p => {
        console.log(`  ✅ ${p.pattern} - ${p.description || 'Nessuna descrizione'}`);
      });
    }
    
    // File che ci sono nel progetto e che dovrebbero essere puliti
    console.log('\n📁 FILE CHE DOVREBBERO ESSERE PULITI:');
    const fs = require('fs');
    const path = require('path');
    const projectRoot = '/Users/lucamambelli/Desktop/Richiesta-Assistenza';
    
    const filesToClean = [];
    
    // Cerca file .backup-*
    function searchFiles(dir, depth = 0) {
      if (depth > 2) return;
      
      try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            searchFiles(fullPath, depth + 1);
          } else if (stat.isFile()) {
            // Controlla se il file dovrebbe essere pulito
            if (file.includes('.backup-') || 
                file.includes('.fixed.') ||
                file.startsWith('test-') ||
                file.startsWith('fix-') ||
                file.startsWith('check-') ||
                file.startsWith('debug-')) {
              filesToClean.push(fullPath.replace(projectRoot, ''));
            }
          }
        }
      } catch (err) {
        // Ignora errori di permessi
      }
    }
    
    searchFiles(projectRoot);
    
    if (filesToClean.length === 0) {
      console.log('  ✅ Nessun file temporaneo trovato - il progetto è pulito!');
    } else {
      console.log(`  ⚠️ Trovati ${filesToClean.length} file che potrebbero essere puliti:`);
      filesToClean.slice(0, 10).forEach(f => console.log(`    - ${f}`));
      if (filesToClean.length > 10) {
        console.log(`    ... e altri ${filesToClean.length - 10} file`);
      }
    }
    
    console.log('\n📊 RIEPILOGO:');
    console.log(`- Pattern configurati: ${patterns.length}`);
    console.log(`- File da pulire trovati: ${filesToClean.length}`);
    
    if (patterns.length === 0 && filesToClean.length > 0) {
      console.log('\n⚠️ PROBLEMA: Ci sono file da pulire ma nessun pattern configurato!');
      console.log('Vai su http://localhost:5193/admin/backup > Tab Configurazione');
      console.log('e aggiungi i pattern necessari.');
    }
    
  } catch (error) {
    console.error('Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificaConfigCleanup();
