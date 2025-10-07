// Verifica pattern ed esclusioni esistenti
import { prisma } from './src/config/database';

async function verificaEsclusioni() {
  try {
    console.log('📋 VERIFICA PATTERN ED ESCLUSIONI ESISTENTI\n');
    
    // Pattern
    console.log('🎯 PATTERN ATTIVI:');
    const patterns = await prisma.cleanupPattern.findMany({
      where: { isActive: true },
      orderBy: { priority: 'asc' }
    });
    patterns.forEach(p => {
      console.log(`  ${p.pattern} - ${p.description || 'Nessuna descrizione'}`);
    });
    
    // File esclusi
    console.log('\n🚫 FILE ESCLUSI:');
    const excludedFiles = await prisma.cleanupExcludeFile.findMany({
      where: { isActive: true }
    });
    excludedFiles.forEach(f => {
      console.log(`  ${f.fileName} - ${f.reason || 'Nessun motivo'}`);
    });
    
    // Directory escluse
    console.log('\n📁 DIRECTORY ESCLUSE:');
    const excludedDirs = await prisma.cleanupExcludeDirectory.findMany({
      where: { isActive: true }
    });
    excludedDirs.forEach(d => {
      console.log(`  ${d.directory} - ${d.reason || 'Nessun motivo'}`);
    });
    
    console.log('\n✅ Totali:');
    console.log(`- ${patterns.length} pattern attivi`);
    console.log(`- ${excludedFiles.length} file esclusi`);
    console.log(`- ${excludedDirs.length} directory escluse`);
    
    console.log('\n📝 IMPORTANTE:');
    console.log('Questi sono i dati ATTUALI nel database.');
    console.log('Se mancano le tue configurazioni originali, sono state perse.');
    console.log('Puoi modificarle da http://localhost:5193/admin/backup > Impostazioni');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificaEsclusioni();
