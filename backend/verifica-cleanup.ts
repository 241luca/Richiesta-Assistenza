import { prisma } from './src/config/database';

async function verificaCleanup() {
  try {
    // Verifica configurazioni
    const config = await prisma.cleanupConfig.findFirst();
    console.log('✅ Configurazioni:', config ? 'PRESENTE' : '❌ MANCANTE');
    
    // Verifica pattern
    const patterns = await prisma.cleanupPattern.count();
    console.log('✅ Pattern:', patterns > 0 ? `${patterns} PRESENTI` : '❌ NESSUNO');
    
    // Verifica esclusioni file
    const excludedFiles = await prisma.cleanupExcludeFile.count();
    console.log('✅ File esclusi:', excludedFiles > 0 ? `${excludedFiles} PRESENTI` : '❌ NESSUNO');
    
    // Verifica esclusioni directory
    const excludedDirs = await prisma.cleanupExcludeDirectory.count();
    console.log('✅ Directory escluse:', excludedDirs > 0 ? `${excludedDirs} PRESENTI` : '❌ NESSUNO');
    
    if (config && patterns > 0 && excludedFiles > 0 && excludedDirs > 0) {
      console.log('\n✅ SISTEMA CLEANUP: DATI PRESENTI');
    } else {
      console.log('\n❌ SISTEMA CLEANUP: DATI MANCANTI');
    }
    
  } catch (error) {
    console.error('❌ ERRORE:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificaCleanup();
