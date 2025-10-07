// Aggiorna la configurazione con path FUORI dal progetto
import { prisma } from './src/config/database';

async function updateCleanupPath() {
  try {
    console.log('Aggiornando configurazione cleanup...');
    
    // Aggiorna per salvare FUORI dal progetto
    await prisma.cleanupConfig.updateMany({
      where: { name: 'default' },
      data: {
        targetDirectory: '/Users/lucamambelli/Desktop/backup-cleanup'
      }
    });
    
    // Se abbiamo aggiunto il campo projectPath, impostiamolo
    await prisma.$executeRaw`
      UPDATE "CleanupConfig" 
      SET "projectPath" = '/Users/lucamambelli/Desktop/Richiesta-Assistenza'
      WHERE name = 'default';
    `.catch(() => {
      console.log('Campo projectPath non esiste ancora');
    });
    
    console.log('✅ Configurazione aggiornata:');
    console.log('- Project path: /Users/lucamambelli/Desktop/Richiesta-Assistenza');
    console.log('- Cleanup salverà in: /Users/lucamambelli/Desktop/backup-cleanup');
    console.log('  (FUORI dal progetto, come deve essere)');
    
  } catch (error) {
    console.error('Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCleanupPath();
