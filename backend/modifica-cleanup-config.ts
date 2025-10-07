// Script per modificare la configurazione cleanup
import { prisma } from './src/config/database';

async function modificaConfig() {
  const nuovaConfig = {
    // MODIFICA QUESTI VALORI COME VUOI
    targetDirectory: '/Users/lucamambelli/Desktop/backup-cleanup',  // Dove salvare i cleanup
    projectPath: '/Users/lucamambelli/Desktop/Richiesta-Assistenza', // Progetto da scansionare
  };

  try {
    await prisma.cleanupConfig.update({
      where: { name: 'default' },
      data: nuovaConfig
    });
    
    console.log('✅ Configurazione aggiornata:');
    console.log('- Target Directory:', nuovaConfig.targetDirectory);
    console.log('- Project Path:', nuovaConfig.projectPath);
  } catch (error) {
    console.error('Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

modificaConfig();
