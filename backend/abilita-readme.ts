// Abilita createReadme
import { prisma } from './src/config/database';

async function abilitaReadme() {
  try {
    await prisma.cleanupConfig.updateMany({
      where: { name: 'default' },
      data: { createReadme: true }
    });
    
    console.log('✅ createReadme ABILITATO!');
    console.log('Ora il cleanup creerà anche il file README.md');
    
  } catch (error) {
    console.error('Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

abilitaReadme();
