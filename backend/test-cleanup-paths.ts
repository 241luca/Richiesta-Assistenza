// Test che il cleanup usi le directory corrette dal database
import { prisma } from './src/config/database';

async function testCleanupPaths() {
  try {
    console.log('🔍 Verifica configurazione percorsi cleanup...\n');
    
    // Leggi configurazione dal database
    const config = await prisma.cleanupConfig.findFirst({
      where: { name: 'default' }
    });
    
    if (!config) {
      console.log('❌ Nessuna configurazione trovata nel database');
      return;
    }
    
    console.log('📁 CONFIGURAZIONE DATABASE:');
    console.log('- Project Path:', config.projectPath || '(non configurato - userà auto-detect)');
    console.log('- Target Directory:', config.targetDirectory);
    console.log('- Base Path:', config.basePath || '(non configurato)');
    
    // Determina dove salverebbe i file
    const projectPath = config.projectPath || '/Users/lucamambelli/Desktop/Richiesta-Assistenza';
    let savePath;
    
    if (config.basePath) {
      savePath = config.basePath;
    } else if (config.targetDirectory) {
      if (config.targetDirectory.startsWith('/')) {
        savePath = config.targetDirectory;
      } else {
        savePath = `${projectPath}/${config.targetDirectory}`;
      }
    }
    
    console.log('\n📂 DIRECTORY DOVE SALVEREBBE:');
    console.log('- Percorso finale:', savePath);
    
    // Verifica se la directory esiste o può essere creata
    const fs = require('fs');
    const path = require('path');
    
    const parentDir = path.dirname(savePath);
    if (fs.existsSync(parentDir)) {
      console.log('✅ Directory padre esiste, può salvare qui');
    } else {
      console.log('⚠️ Directory padre non esiste, dovrà crearla');
    }
    
    console.log('\n✅ VERIFICA COMPLETATA');
    console.log('\n📝 Per modificare i percorsi:');
    console.log('1. Vai su http://localhost:5193/admin/backup');
    console.log('2. Tab "Impostazioni"');
    console.log('3. Modifica "Project Path" e "Target Directory"');
    console.log('4. Salva la configurazione');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCleanupPaths();
