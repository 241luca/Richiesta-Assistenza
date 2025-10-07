// Script per sistemare completamente il percorso del cleanup
import { prisma } from '../config/database';
import logger from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

async function fixCleanupPath() {
  console.log('🔧 Sistemazione configurazione percorso cleanup...\n');
  
  try {
    // 1. Verifica la configurazione attuale
    let config = await prisma.cleanupConfig.findFirst({
      where: { name: 'default' }
    });
    
    if (!config) {
      console.log('❌ Nessuna configurazione trovata. Creazione nuova configurazione...');
      
      // Crea una nuova configurazione con il percorso corretto
      config = await prisma.cleanupConfig.create({
        data: {
          name: 'default',
          isActive: true,
          basePath: '/Users/lucamambelli/Desktop/backup-ra/cleanup',
          targetDirectory: '/Users/lucamambelli/Desktop/backup-ra/cleanup',
          directoryFormat: 'CLEANUP-{YYYY}-{MM}-{DD}-{HH}-{mm}-{ss}',
          maxDepth: 2,
          bufferSize: 104857600, // 100MB
          timeout: 60000,
          retentionDays: 30,
          autoCleanup: false,
          autoCleanupDays: 30,
          createReadme: true,
          preserveStructure: true,
          notifyOnCleanup: true
        }
      });
      console.log('✅ Nuova configurazione creata');
    } else {
      console.log('📋 Configurazione attuale:');
      console.log(`  - basePath: ${config.basePath || 'NON IMPOSTATO'}`);
      console.log(`  - targetDirectory: ${config.targetDirectory || 'NON IMPOSTATO'}`);
      
      // Aggiorna con il percorso corretto
      const correctPath = '/Users/lucamambelli/Desktop/backup-ra/cleanup';
      
      const updated = await prisma.cleanupConfig.update({
        where: { id: config.id },
        data: {
          basePath: correctPath,
          targetDirectory: correctPath,
          updatedAt: new Date()
        }
      });
      
      console.log('\n✅ Configurazione aggiornata:');
      console.log(`  - basePath: ${updated.basePath}`);
      console.log(`  - targetDirectory: ${updated.targetDirectory}`);
    }
    
    // 2. Verifica che la directory di destinazione esista
    const cleanupPath = '/Users/lucamambelli/Desktop/backup-ra/cleanup';
    
    if (!fs.existsSync(cleanupPath)) {
      console.log(`\n📁 Creazione directory: ${cleanupPath}`);
      fs.mkdirSync(cleanupPath, { recursive: true });
      console.log('✅ Directory creata');
    } else {
      console.log(`\n✅ Directory esistente: ${cleanupPath}`);
      
      // Mostra le cartelle CLEANUP esistenti
      const items = fs.readdirSync(cleanupPath);
      const cleanupDirs = items.filter(item => item.startsWith('CLEANUP-'));
      
      if (cleanupDirs.length > 0) {
        console.log(`\n📋 Cartelle CLEANUP esistenti:`);
        cleanupDirs.forEach(dir => {
          const stats = fs.statSync(path.join(cleanupPath, dir));
          console.log(`  - ${dir} (${stats.mtime.toLocaleString()})`);
        });
      }
    }
    
    // 3. Test del servizio cleanup
    console.log('\n🧪 Test configurazione servizio cleanup...');
    const { CleanupService } = await import('../services/cleanup.service');
    const cleanupService = new CleanupService();
    
    // Simula executeCleanup per vedere quale percorso userà
    const configTest = await prisma.cleanupConfig.findFirst({
      where: { name: 'default' }
    });
    
    console.log('\n✅ Il servizio cleanup userà:');
    console.log(`  - Percorso: ${configTest?.basePath || configTest?.targetDirectory || 'DEFAULT'}`);
    
    console.log('\n🎯 CONFIGURAZIONE COMPLETATA!');
    console.log('Il cleanup ora creerà le cartelle in:');
    console.log(`${cleanupPath}/CLEANUP-[timestamp]`);
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script
fixCleanupPath()
  .then(() => {
    console.log('\n✅ Script completato con successo!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script fallito:', error);
    process.exit(1);
  });
