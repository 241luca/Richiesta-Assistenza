// Verifica se createReadme è abilitato
import { prisma } from './src/config/database';

async function verificaReadme() {
  try {
    const config = await prisma.cleanupConfig.findFirst({
      where: { name: 'default' }
    });
    
    console.log('📋 CONFIGURAZIONE CLEANUP:');
    console.log('- createReadme:', config?.createReadme);
    console.log('- targetDirectory:', config?.targetDirectory);
    
    if (!config?.createReadme) {
      console.log('\n⚠️ createReadme è DISABILITATO!');
      console.log('Per abilitarlo, aggiorna la configurazione.');
    } else {
      console.log('\n✅ createReadme è ABILITATO');
      console.log('Il README dovrebbe essere creato nella cartella cleanup.');
    }
    
  } catch (error) {
    console.error('Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificaReadme();
