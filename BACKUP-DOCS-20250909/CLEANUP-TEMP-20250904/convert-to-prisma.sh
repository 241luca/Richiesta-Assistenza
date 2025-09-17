#!/bin/bash

echo "🔧 CONVERSIONE COMPLETA A PRISMA"
echo "================================"
echo ""

# Crea un nuovo service completamente basato su Prisma
cat > backend/src/services/simple-backup.service.ts << 'EOF'
// 🚀 NUOVO SISTEMA BACKUP - VERSIONE PRISMA
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
  fileSize: bigint;
  createdAt: Date;
}

class SimpleBackupService {
  private backupBaseDir: string;
  
  constructor() {
    // Directory base per i backup
    this.backupBaseDir = path.join(process.cwd(), 'backend', 'backups');
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
  async backupDatabase(userId: string): Promise<BackupResult> {
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
      
      // Salva record nel database usando Prisma
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
      
      return {
        id: backup.id,
        type: backup.type as BackupType,
        filename: backup.filename,
        filepath: backup.filepath,
        fileSize: backup.fileSize,
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
  async backupCode(userId: string): Promise<BackupResult> {
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
        fileSize: backup.fileSize,
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
   * 3. BACKUP UPLOADS - Archivia tutti i file caricati
   */
  async backupUploads(userId: string): Promise<BackupResult> {
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
        fileSize: backup.fileSize,
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
  async listBackups(type?: BackupType): Promise<BackupResult[]> {
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

      // Converti per il frontend
      return existingBackups.map(backup => ({
        id: backup.id,
        type: backup.type as BackupType,
        filename: backup.filename,
        filepath: backup.filepath,
        fileSize: backup.fileSize,
        createdAt: backup.createdAt
      }));

    } catch (error) {
      logger.error('Error listing backups:', error);
      // Se la tabella non esiste, ritorna array vuoto
      return [];
    }
  }

  /**
   * 5. ELIMINA BACKUP - Rimuove file e record database
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
   * 6. DOWNLOAD BACKUP - Prepara il file per il download
   */
  async getBackupForDownload(backupId: string): Promise<{filepath: string, filename: string, mimetype: string}> {
    try {
      const backup = await prisma.backup.findUnique({
        where: { id: backupId }
      });

      if (!backup) {
        throw new Error('Backup not found');
      }

      if (!fs.existsSync(backup.filepath)) {
        throw new Error('Backup file not found on disk');
      }

      // Determina mimetype basato sul tipo
      let mimetype = 'application/octet-stream';
      if (backup.filename.endsWith('.sql.gz')) {
        mimetype = 'application/gzip';
      } else if (backup.filename.endsWith('.tar.gz')) {
        mimetype = 'application/x-tar';
      }

      return {
        filepath: backup.filepath,
        filename: backup.filename,
        mimetype
      };

    } catch (error) {
      logger.error('Error preparing backup for download:', error);
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

      // Calcola spazio totale
      const backups = await prisma.backup.findMany({
        select: { filepath: true, fileSize: true }
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
EOF

echo "✅ Service convertito a Prisma"
echo ""
echo "Il backend dovrebbe riavviarsi automaticamente."
echo "Ora il sistema dovrebbe funzionare!"
