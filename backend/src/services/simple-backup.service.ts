// 🚀 NUOVO SISTEMA BACKUP - VERSIONE PRISMA CORRETTA
// backend/src/services/simple-backup.service.ts

import { prisma } from '../config/database';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { format } from 'date-fns';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

export type BackupType = 'DATABASE' | 'CODE' | 'UPLOADS';

interface BackupResult {
  id: string;
  type: BackupType;
  filename: string;
  filepath: string;
  fileSize: bigint | string;  // Può essere bigint internamente o string per JSON
  createdAt: Date;
}

class SimpleBackupService {
  private backupBaseDir: string;
  
  constructor() {
    // Directory base per i backup - CORREZIONE: rimuovi 'backend' duplicato
    this.backupBaseDir = path.join(process.cwd(), 'backups');
    this.ensureDirectories();
  }

  /**
   * Assicura che le directory di backup esistano
   */
  private async ensureDirectories(): Promise<void> {
    const dirs = [
      path.join(this.backupBaseDir, 'database'),
      path.join(this.backupBaseDir, 'code'),
      path.join(this.backupBaseDir, 'uploads')
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`Created backup directory: ${dir}`);
      }
    }
  }

  /**
   * 1. BACKUP DATABASE - Usa pg_dump nativo
   */
  async backupDatabase(recipientId: string): Promise<BackupResult> {
    logger.info('Starting database backup...');
    
    const timestamp = format(new Date(), 'yyyy-MM-dd-HH-mm-ss');
    const filename = `db-${timestamp}.sql.gz`;
    const filepath = path.join(this.backupBaseDir, 'database', filename);
    
    try {
      // Ottieni URL database dalle variabili ambiente
      const databaseUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/richiesta_assistenza';

      // Esegui pg_dump con compressione diretta
      logger.info(`Executing pg_dump to ${filepath}`);
      await execAsync(`pg_dump "${databaseUrl}" | gzip > "${filepath}"`);
      
      // Verifica che il file sia stato creato
      if (!fs.existsSync(filepath)) {
        throw new Error('Backup file was not created');
      }

      // Ottieni dimensione file
      const stats = fs.statSync(filepath);
      
      // Salva record nel database usando Prisma con nomi corretti
      const backup = await prisma.backup.create({
        data: {
          type: 'DATABASE',
          filename,
          filepath,
          fileSize: BigInt(stats.size),
          createdBy: userId
        }
      });

      logger.info(`Database backup completed: ${filename} (${this.formatFileSize(stats.size)})`);
      
      // Ritorna con mappatura corretta e BigInt convertito in stringa
      return {
        id: backup.id,
        type: backup.type as BackupType,
        filename: backup.filename,
        filepath: backup.filepath,
        fileSize: backup.fileSize.toString(),
        createdAt: backup.createdAt
      };

    } catch (error: any) {
      logger.error('Database backup failed:', error);
      // Pulisci file parziale se esiste
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      throw new Error(`Database backup failed: ${error.message}`);
    }
  }

  /**
   * 2. BACKUP CODE - Archivia il codice sorgente
   */
  async backupCode(recipientId: string): Promise<BackupResult> {
    logger.info('Starting code backup...');
    
    const timestamp = format(new Date(), 'yyyy-MM-dd-HH-mm-ss');
    const filename = `code-${timestamp}.tar.gz`;
    const filepath = path.join(this.backupBaseDir, 'code', filename);
    
    try {
      // Crea archivio tar.gz escludendo file non necessari
      const projectRoot = process.cwd();
      const excludes = [
        '--exclude=node_modules',
        '--exclude=.git',
        '--exclude=.next',
        '--exclude=dist',
        '--exclude=build',
        '--exclude=uploads',
        '--exclude=backend/backups',
        '--exclude=backend/system-backups',
        '--exclude=*.backup*',
        '--exclude=*.log',
        '--exclude=.env'
      ].join(' ');

      logger.info(`Creating code archive to ${filepath}`);
      await execAsync(
        `tar -czf "${filepath}" ${excludes} -C "${projectRoot}" .`,
        { maxBuffer: 1024 * 1024 * 100 } // 100MB buffer
      );
      
      // Verifica che il file sia stato creato
      if (!fs.existsSync(filepath)) {
        throw new Error('Code archive was not created');
      }

      // Ottieni dimensione file
      const stats = fs.statSync(filepath);
      
      // Salva record nel database usando Prisma
      const backup = await prisma.backup.create({
        data: {
          type: 'CODE',
          filename,
          filepath,
          fileSize: BigInt(stats.size),
          createdBy: userId
        }
      });

      logger.info(`Code backup completed: ${filename} (${this.formatFileSize(stats.size)})`);
      
      return {
        id: backup.id,
        type: backup.type as BackupType,
        filename: backup.filename,
        filepath: backup.filepath,
        fileSize: backup.fileSize.toString(),
        createdAt: backup.createdAt
      };

    } catch (error: any) {
      logger.error('Code backup failed:', error);
      // Pulisci file parziale se esiste
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      throw new Error(`Code backup failed: ${error.message}`);
    }
  }

  /**
   * 3. BACKUP FILES - Archivia tutti i file caricati
   */
  async backupFiles(recipientId: string): Promise<BackupResult> {
    logger.info('Starting uploads backup...');
    
    const timestamp = format(new Date(), 'yyyy-MM-dd-HH-mm-ss');
    const filename = `uploads-${timestamp}.tar.gz`;
    const filepath = path.join(this.backupBaseDir, 'uploads', filename);
    
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      
      // Verifica che la directory uploads esista
      if (!fs.existsSync(uploadsDir)) {
        // Crea directory se non esiste
        fs.mkdirSync(uploadsDir, { recursive: true });
        // Crea un file placeholder
        fs.writeFileSync(path.join(uploadsDir, '.placeholder'), 'This directory contains uploaded files');
      }

      logger.info(`Creating uploads archive to ${filepath}`);
      await execAsync(
        `tar -czf "${filepath}" -C "${path.dirname(uploadsDir)}" uploads`,
        { maxBuffer: 1024 * 1024 * 500 } // 500MB buffer per file grandi
      );
      
      // Verifica che il file sia stato creato
      if (!fs.existsSync(filepath)) {
        throw new Error('Uploads archive was not created');
      }

      // Ottieni dimensione file
      const stats = fs.statSync(filepath);
      
      // Salva record nel database usando Prisma
      const backup = await prisma.backup.create({
        data: {
          type: 'UPLOADS',
          filename,
          filepath,
          fileSize: BigInt(stats.size),
          createdBy: userId
        }
      });

      logger.info(`Uploads backup completed: ${filename} (${this.formatFileSize(stats.size)})`);
      
      return {
        id: backup.id,
        type: backup.type as BackupType,
        filename: backup.filename,
        filepath: backup.filepath,
        fileSize: backup.fileSize.toString(),
        createdAt: backup.createdAt
      };

    } catch (error: any) {
      logger.error('Uploads backup failed:', error);
      // Pulisci file parziale se esiste
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      throw new Error(`Uploads backup failed: ${error.message}`);
    }
  }

  /**
   * 4. LISTA BACKUP - Solo quelli che esistono fisicamente!
   */
  async listBackups(type?: BackupType): Promise<any[]> {
    try {
      const where = type ? { type } : {};
      
      const backups = await prisma.backup.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      // IMPORTANTE: Filtra solo backup con file esistenti
      const existingBackups = backups.filter(backup => {
        const exists = fs.existsSync(backup.filepath);
        if (!exists) {
          logger.warn(`Backup file missing: ${backup.filepath}`);
        }
        return exists;
      });

      // Converti per il frontend - ritorna oggetto diretto
      return existingBackups.map(backup => ({
        id: backup.id,
        type: backup.type,
        filename: backup.filename,
        filepath: backup.filepath,
        file_size: backup.fileSize.toString(), // Converti BigInt in stringa
        created_at: backup.createdAt,
        createdBy: backup.createdBy
      }));

    } catch (error) {
      logger.error('Error listing backups:', error);
      // Se la tabella non esiste, ritorna array vuoto
      return [];
    }
  }

  /**
   * 5. GET SINGOLO BACKUP
   */
  async getBackup(backupId: string): Promise<any> {
    try {
      const backup = await prisma.backup.findUnique({
        where: { id: backupId }
      });

      if (!backup) {
        return null;
      }

      // Verifica che il file esista
      if (!fs.existsSync(backup.filepath)) {
        logger.warn(`Backup file not found: ${backup.filepath}`);
        return null;
      }

      // Converti BigInt in stringa per evitare errori di serializzazione
      return {
        ...backup,
        fileSize: backup.fileSize.toString()
      };

    } catch (error) {
      logger.error('Error getting backup:', error);
      return null;
    }
  }

  /**
   * 6. ELIMINA BACKUP - Rimuove file e record database
   */
  async deleteBackup(backupId: string): Promise<void> {
    try {
      // Trova il backup
      const backup = await prisma.backup.findUnique({
        where: { id: backupId }
      });

      if (!backup) {
        throw new Error('Backup not found');
      }

      // Elimina file fisico se esiste
      if (fs.existsSync(backup.filepath)) {
        fs.unlinkSync(backup.filepath);
        logger.info(`Deleted backup file: ${backup.filepath}`);
      } else {
        logger.warn(`Backup file already missing: ${backup.filepath}`);
      }

      // Elimina record dal database
      await prisma.backup.delete({
        where: { id: backupId }
      });

      logger.info(`Backup ${backupId} deleted successfully`);

    } catch (error) {
      logger.error('Error deleting backup:', error);
      throw error;
    }
  }

  /**
   * 7. STATISTICHE BACKUP
   */
  async getBackupStats(): Promise<any> {
    try {
      // Conta per tipo
      const [totalCount, dbCount, codeCount, uploadsCount] = await Promise.all([
        prisma.backup.count(),
        prisma.backup.count({ where: { type: 'DATABASE' } }),
        prisma.backup.count({ where: { type: 'CODE' } }),
        prisma.backup.count({ where: { type: 'UPLOADS' } })
      ]);

      // Calcola spazio totale - usa nome campo corretto
      const backups = await prisma.backup.findMany({
        select: { 
          filepath: true, 
          fileSize: true 
        }
      });

      let totalSize = BigInt(0);
      let validCount = 0;

      for (const backup of backups) {
        if (fs.existsSync(backup.filepath)) {
          totalSize += backup.fileSize;
          validCount++;
        }
      }

      return {
        total: totalCount,
        valid: validCount,
        byType: {
          database: dbCount,
          code: codeCount,
          uploads: uploadsCount
        },
        totalSize: this.formatFileSize(Number(totalSize)),
        totalSizeBytes: totalSize.toString()
      };

    } catch (error) {
      logger.error('Error getting backup stats:', error);
      // Se errore, ritorna stats vuote
      return {
        total: 0,
        valid: 0,
        byType: {
          database: 0,
          code: 0,
          uploads: 0
        },
        totalSize: '0 B',
        totalSizeBytes: '0'
      };
    }
  }

  /**
   * 9. PULIZIA FILE TEMPORANEI DI SVILUPPO
   * Sposta i file temporanei in una cartella datata invece di eliminarli
   */
  async cleanupDevelopmentFiles(): Promise<{ movedCount: number; cleanupDir: string }> {
    try {
      const timestamp = format(new Date(), 'yyyy-MM-dd-HH-mm-ss');
      const cleanupDirName = `CLEANUP-${timestamp}`;
      const cleanupPath = path.join(process.cwd(), cleanupDirName);
      
      // Crea la directory di pulizia
      if (!fs.existsSync(cleanupPath)) {
        fs.mkdirSync(cleanupPath, { recursive: true });
        logger.info(`Created cleanup directory: ${cleanupPath}`);
      }
      
      let movedCount = 0;
      const projectRoot = process.cwd();
      
      // Pattern di file da spostare
      const patterns = [
        '*.backup-*',    // Solo file con .backup- nel nome
        'fix-*.sh',      // Solo script shell che iniziano con fix-
        'test-*.sh',     // Solo script shell che iniziano con test-
        'check-*.sh',    // Solo script shell che iniziano con check-
        'debug-*.sh',    // Solo script shell che iniziano con debug-
        '*.fixed.ts',    // Solo file TypeScript con .fixed
        '*.fixed.tsx',   // Solo file TypeScript React con .fixed
        'backup-*.sql',  // Solo file SQL di backup
        '*.mjs',         // File JavaScript module (temporanei)
        'BACKUP-*'       // Directory o file che iniziano con BACKUP-
        // RIMOSSO: '*.sh' generico, '*.sql' generico, '*.ts' normali
      ];
      
      // Funzione ricorsiva per trovare e spostare file
      const findAndMoveFiles = (dir: string, level: number = 0): void => {
        // Non andare troppo in profondità e salta alcune directory
        if (level > 2) return;
        
        const skipDirs = ['node_modules', '.git', 'dist', 'build', '.next', cleanupDirName, 'CLEANUP-'];
        
        try {
          const items = fs.readdirSync(dir);
          
          for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            // Salta directory da ignorare
            if (stat.isDirectory()) {
              if (!skipDirs.some(skip => item.startsWith(skip))) {
                findAndMoveFiles(fullPath, level + 1);
              }
              continue;
            }
            
            // Controlla se il file matcha uno dei pattern
            const shouldMove = patterns.some(pattern => {
              const regex = new RegExp(pattern.replace('*', '.*'));
              return regex.test(item);
            });
            
            if (shouldMove) {
              try {
                // Crea struttura directory nel cleanup
                const relativePath = path.relative(projectRoot, dir);
                const targetDir = path.join(cleanupPath, relativePath);
                
                if (!fs.existsSync(targetDir)) {
                  fs.mkdirSync(targetDir, { recursive: true });
                }
                
                const targetPath = path.join(targetDir, item);
                
                // Sposta il file
                fs.renameSync(fullPath, targetPath);
                logger.info(`Moved: ${fullPath} -> ${targetPath}`);
                movedCount++;
              } catch (error) {
                logger.warn(`Could not move file ${fullPath}:`, error);
              }
            }
          }
        } catch (error) {
          logger.warn(`Could not read directory ${dir}:`, error);
        }
      };
      
      // Avvia la pulizia dalla root del progetto
      findAndMoveFiles(projectRoot);
      
      // Crea un file README nella cartella di cleanup
      const readmePath = path.join(cleanupPath, 'README.md');
      const readmeContent = `# Cleanup Directory - ${timestamp}

Questi file sono stati spostati automaticamente dalla pulizia del ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}.

## Contenuto:
- File .backup-* (backup automatici prima delle modifiche)
- Script .sh (script di test e fix)
- File .fixed.ts/.tsx (file corretti temporaneamente)
- Altri file temporanei di sviluppo

## Nota:
È sicuro eliminare questa cartella se non hai bisogno di recuperare nessuno di questi file.

File spostati: ${movedCount}
`;
      
      fs.writeFileSync(readmePath, readmeContent);
      
      logger.info(`Development cleanup completed: ${movedCount} files moved to ${cleanupDirName}`);
      
      return {
        movedCount,
        cleanupDir: cleanupDirName
      };
      
    } catch (error: any) {
      logger.error('Error during development cleanup:', error);
      throw new Error(`Development cleanup failed: ${error.message}`);
    }
  }
  
  /**
   * 10. LISTA CARTELLE DI CLEANUP
   * Elenca tutte le cartelle CLEANUP-* create
   */
  async listCleanupDirs(): Promise<Array<{ name: string; path: string; size: string; createdAt: Date; fileCount: number }>> {
    try {
      const projectRoot = process.cwd();
      const items = fs.readdirSync(projectRoot);
      const cleanupDirs = [];
      
      for (const item of items) {
        if (item.startsWith('CLEANUP-')) {
          const fullPath = path.join(projectRoot, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            // Conta i file nella directory
            let fileCount = 0;
            let totalSize = 0;
            
            const countFiles = (dir: string): void => {
              const dirItems = fs.readdirSync(dir);
              for (const dirItem of dirItems) {
                const itemPath = path.join(dir, dirItem);
                const itemStat = fs.statSync(itemPath);
                if (itemStat.isDirectory()) {
                  countFiles(itemPath);
                } else {
                  fileCount++;
                  totalSize += itemStat.size;
                }
              }
            };
            
            countFiles(fullPath);
            
            cleanupDirs.push({
              name: item,
              path: fullPath,
              size: this.formatFileSize(totalSize),
              createdAt: stat.birthtime,
              fileCount
            });
          }
        }
      }
      
      // Ordina per data di creazione (più recente prima)
      cleanupDirs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      return cleanupDirs;
      
    } catch (error: any) {
      logger.error('Error listing cleanup directories:', error);
      return [];
    }
  }
  
  /**
   * 11. ELIMINA CARTELLA DI CLEANUP SPECIFICA
   * Elimina definitivamente una cartella CLEANUP-*
   */
  async deleteCleanupDir(dirName: string): Promise<boolean> {
    try {
      // Sicurezza: accetta solo cartelle che iniziano con CLEANUP-
      if (!dirName.startsWith('CLEANUP-')) {
        throw new Error('Invalid cleanup directory name');
      }
      
      const fullPath = path.join(process.cwd(), dirName);
      
      // Verifica che esista
      if (!fs.existsSync(fullPath)) {
        throw new Error('Cleanup directory not found');
      }
      
      // Elimina ricorsivamente
      fs.rmSync(fullPath, { recursive: true, force: true });
      logger.info(`Deleted cleanup directory: ${dirName}`);
      
      return true;
      
    } catch (error: any) {
      logger.error('Error deleting cleanup directory:', error);
      throw new Error(`Failed to delete cleanup directory: ${error.message}`);
    }
  }

  /**
   * Utility: Formatta dimensione file
   */
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * 8. PULIZIA BACKUP VECCHI (opzionale)
   */
  async cleanOldBackups(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Trova backup più vecchi del limite
      const oldBackups = await prisma.backup.findMany({
        where: {
          createdAt: {
            lt: cutoffDate
          }
        }
      });

      let deletedCount = 0;

      for (const backup of oldBackups) {
        try {
          await this.deleteBackup(backup.id);
          deletedCount++;
        } catch (error) {
          logger.error(`Failed to delete old backup ${backup.id}:`, error);
        }
      }

      logger.info(`Cleaned ${deletedCount} old backups`);
      return deletedCount;

    } catch (error) {
      logger.error('Error cleaning old backups:', error);
      return 0;
    }
  }
}

// Esporta singleton
export default new SimpleBackupService();
