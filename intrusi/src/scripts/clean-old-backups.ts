// Script per rimuovere tutti i backup con percorsi vecchi/non esistenti
import { prisma } from '../config/database';
import * as fs from 'fs';
import { logger } from '../utils/logger';

async function cleanOldBackups() {
  console.log('🧹 Starting cleanup of old backup records...');
  
  try {
    // 1. Trova tutti i backup nel database
    const allBackups = await prisma.systemBackup.findMany();
    console.log(`Found ${allBackups.length} total backup records in database`);
    
    let deletedCount = 0;
    let keptCount = 0;
    const toDelete = [];
    
    // 2. Verifica quali file esistono ancora
    for (const backup of allBackups) {
      if (!backup.filePath) {
        console.log(`❌ Backup ${backup.id} has no file path - will delete`);
        toDelete.push(backup.id);
        continue;
      }
      
      // Controlla se il file esiste fisicamente
      if (!fs.existsSync(backup.filePath)) {
        console.log(`❌ File not found: ${backup.filePath}`);
        toDelete.push(backup.id);
      } else {
        console.log(`✅ File exists: ${backup.filePath}`);
        keptCount++;
      }
    }
    
    // 3. Elimina tutti i record con file mancanti
    if (toDelete.length > 0) {
      console.log(`\n🗑️  Deleting ${toDelete.length} backup records with missing files...`);
      
      for (const backupId of toDelete) {
        try {
          await prisma.systemBackup.delete({
            where: { id: backupId }
          });
          deletedCount++;
          console.log(`Deleted backup record: ${backupId}`);
        } catch (error) {
          console.error(`Failed to delete backup ${backupId}:`, error);
        }
      }
    }
    
    // 4. Mostra il riepilogo
    console.log('\n📊 CLEANUP SUMMARY:');
    console.log(`Total records checked: ${allBackups.length}`);
    console.log(`Records deleted: ${deletedCount}`);
    console.log(`Records kept (files exist): ${keptCount}`);
    
    // 5. Registra nell'audit log
    try {
      await prisma.auditLog.create({
        data: {
          action: 'BULK_DELETE' as any,
          entityType: 'SystemBackup',
          entityId: 'CLEANUP_OLD_BACKUPS',
          userId: 'system',
          ipAddress: '127.0.0.1',
          userAgent: 'CleanupScript/1.0',
          metadata: {
            operation: 'CLEANUP_OLD_BACKUP_RECORDS',
            totalChecked: allBackups.length,
            deleted: deletedCount,
            kept: keptCount,
            deletedIds: toDelete
          },
          success: true,
          severity: 'INFO',
          category: 'SYSTEM'
        }
      });
      console.log('✅ Audit log created for cleanup operation');
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script
cleanOldBackups()
  .then(() => {
    console.log('\n✅ Cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
