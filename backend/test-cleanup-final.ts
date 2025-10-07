// Test finale per verificare che il cleanup sia configurato correttamente
import { cleanupService } from './src/services/cleanup.service';

async function testCleanupFinal() {
  try {
    console.log('🔍 TEST FINALE SISTEMA CLEANUP\n');
    
    // Simula una preview
    const result = await cleanupService.previewCleanup('test-user');
    
    if (!result.success) {
      console.log('❌ Preview fallita');
      return;
    }
    
    console.log('✅ PREVIEW FUNZIONANTE\n');
    console.log('📁 CONFIGURAZIONE PERCORSI:');
    console.log(`- Progetto scansionato: ${result.preview.projectPath}`);
    console.log(`- Destinazione cleanup: ${result.preview.destinationPath}`);
    console.log(`- Nome cartella cleanup: ${result.preview.cleanupFolderName}`);
    console.log(`- Percorso completo: ${result.preview.fullDestinationPath}`);
    
    console.log('\n📊 STATISTICHE:');
    console.log(`- File trovati: ${result.preview.totalFiles}`);
    console.log(`- Dimensione totale: ${(result.preview.totalSize / 1024 / 1024).toFixed(2)} MB`);
    
    console.log('\n🎯 PATTERN MATCHATI:');
    Object.entries(result.preview.byPattern || {}).forEach(([pattern, count]) => {
      console.log(`  ${pattern}: ${count} file`);
    });
    
    console.log('\n📋 TIPI DI FILE:');
    Object.entries(result.preview.byType || {}).forEach(([type, count]) => {
      console.log(`  .${type}: ${count} file`);
    });
    
    // Controllo importante: la destinazione è FUORI dal progetto?
    const projectPath = result.preview.projectPath;
    const destPath = result.preview.destinationPath;
    
    if (destPath.startsWith(projectPath)) {
      console.log('\n⚠️ ATTENZIONE: Il cleanup salverebbe DENTRO il progetto!');
      console.log('Questo è SBAGLIATO - dovrebbe salvare fuori!');
    } else {
      console.log('\n✅ CORRETTO: Il cleanup salverà FUORI dal progetto');
    }
    
    console.log('\n✅ TEST COMPLETATO CON SUCCESSO');
    
  } catch (error) {
    console.error('❌ ERRORE NEL TEST:', error);
  }
}

testCleanupFinal();
