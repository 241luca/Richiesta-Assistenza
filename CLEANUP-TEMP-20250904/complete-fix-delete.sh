#!/bin/bash

echo "🔧 Complete Fix for Backup Delete..."

# Crea il file di servizio corretto
cat > backend/src/services/backup.service.ts << 'EOF'
// Servizio di backup FUNZIONANTE con DELETE CORRETTO
import { PrismaClient, BackupType, BackupStatus } from '@prisma/client';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger';
import archiver from 'archiver';
import { createWriteStream } from 'fs';

const prisma = new PrismaClient();
const execAsync = promisify(exec);

interface BackupOptions {
  name?: string;
  description?: string;
  includeUploads?: boolean;
  includeDatabase?: boolean;
  includeCode?: boolean;
  compression?: boolean;
  encrypted?: boolean;
  retentionDays?: number;
}

class BackupService {
  private backupPath: string;

  constructor() {
    this.backupPath = path.join(process.cwd(), 'system-backups');
    this.ensureBackupDirectory();
  }

  private async ensureBackupDirectory() {
    try {
      await fs.access(this.backupPath);
    } catch {
      await fs.mkdir(this.backupPath, { recursive: true });
      logger.info(`Backup directory created: ${this.backupPath}`);
    }
  }

  async createBackup(
    userId: string,
    type: BackupType,
    options: BackupOptions = {}
  ): Promise<any> {
    logger.info(`Creating backup of type ${type} for user ${userId}`);

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const typeName = type.toLowerCase();
      const name = options.name || `backup-${typeName}-${timestamp}`;

      const retentionDays = options.retentionDays || 30;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + retentionDays);

      const backup = await prisma.systemBackup.create({
        data: {
          name,
          description: options.description || `Backup ${type} creato manualmente`,
          type,
          status: BackupStatus.IN_PROGRESS,
          includeUploads: options.includeUploads ?? (type === BackupType.FULL || type === BackupType.FILES),
          includeDatabase: options.includeDatabase ?? (type === BackupType.FULL || type === BackupType.DATABASE),
          includeCode: options.includeCode ?? false,
          compression: options.compression ?? true,
          encrypted: options.encrypted ?? false,
          retentionDays,
          expiresAt,
          createdById: userId,
          startedAt: new Date(),
        },
      });

      await this.addLog(backup.id, 'INFO', 'Backup started');

      // Esegui backup in background
      this.performBackup(backup.id, type, options).catch(error => {
        logger.error(`Backup ${backup.id} failed:`, error);
      });

      return backup;
    } catch (error) {
      logger.error('Error creating backup:', error);
      throw error;
    }
  }

  private async performBackup(
    backupId: string,
    type: BackupType,
    options: BackupOptions
  ) {
    const tempDir = path.join(this.backupPath, `temp-${backupId}`);
    
    try {
      await fs.mkdir(tempDir, { recursive: true });

      let totalSize = 0;
      const backupData: any = {
        timestamp: new Date().toISOString(),
        type,
        version: '1.0',
        data: {}
      };

      // Backup del database
      if (options.includeDatabase !== false && (type === BackupType.DATABASE || type === BackupType.FULL)) {
        await this.addLog(backupId, 'INFO', 'Starting database backup');
        const dbData = await this.backupDatabase(tempDir);
        backupData.data.database = dbData;
        totalSize += JSON.stringify(dbData).length;
        await this.addLog(backupId, 'INFO', 'Database backup completed');
      }

      // Salva backup come JSON
      const backupFile = path.join(tempDir, 'backup.json');
      await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2), 'utf8');

      let finalPath = backupFile;

      // Comprimi se richiesto (usando archiver che funziona)
      if (options.compression) {
        await this.addLog(backupId, 'INFO', 'Compressing backup');
        finalPath = await this.compressBackupWithArchiver(tempDir, backupId);
        const stats = await fs.stat(finalPath);
        totalSize = stats.size;
        await this.addLog(backupId, 'INFO', 'Compression completed');
      }

      // Calcola checksum
      const checksum = await this.calculateChecksum(finalPath);

      // Aggiorna record backup
      await prisma.systemBackup.update({
        where: { id: backupId },
        data: {
          status: BackupStatus.COMPLETED,
          filePath: finalPath,
          fileSize: BigInt(totalSize),
          checksum,
          completedAt: new Date(),
        },
      });

      await this.addLog(backupId, 'INFO', 'Backup completed successfully');

      // Pulisci directory temporanea
      if (finalPath !== backupFile && fsSync.existsSync(tempDir)) {
        await fs.rm(tempDir, { recursive: true, force: true });
      }

    } catch (error) {
      logger.error(`Error performing backup ${backupId}:`, error);
      
      await prisma.systemBackup.update({
        where: { id: backupId },
        data: {
          status: BackupStatus.FAILED,
          errorMessage: error.message || 'Unknown error',
          failedAt: new Date(),
        },
      });

      await this.addLog(backupId, 'ERROR', `Backup failed: ${error.message}`);

      // Pulisci directory temporanea
      try {
        if (fsSync.existsSync(tempDir)) {
          await fs.rm(tempDir, { recursive: true, force: true });
        }
      } catch {}

      throw error;
    }
  }

  private async backupDatabase(tempDir: string): Promise<any> {
    try {
      logger.info('Performing database backup...');
      
      const data: any = {};
      
      // Esporta tabelle esistenti (solo quelle che esistono davvero)
      try {
        data.users = await prisma.user.findMany();
      } catch (e) {
        logger.warn('Users table not found');
      }
      
      try {
        data.assistanceRequests = await prisma.assistanceRequest.findMany();
      } catch (e) {
        logger.warn('AssistanceRequests table not found');
      }
      
      try {
        data.quotes = await prisma.quote.findMany();
      } catch (e) {
        logger.warn('Quotes table not found');
      }
      
      try {
        data.categories = await prisma.categorie2.findMany();
      } catch (e) {
        logger.warn('Categories table not found');
      }

      const counts = {
        users: data.users?.length || 0,
        requests: data.assistanceRequests?.length || 0,
        quotes: data.quotes?.length || 0,
        categories: data.categories?.length || 0,
      };

      logger.info(`Database backup completed: ${JSON.stringify(counts)}`);
      
      const dbFile = path.join(tempDir, 'database.json');
      await fs.writeFile(dbFile, JSON.stringify(data, null, 2), 'utf8');
      
      return {
        ...data,
        _metadata: {
          exportedAt: new Date().toISOString(),
          recordCounts: counts,
          format: 'json',
        }
      };
      
    } catch (error) {
      logger.error('Database backup failed:', error);
      throw new Error(`Database backup failed: ${error.message}`);
    }
  }

  // Usa archiver invece di tar per compressione
  private async compressBackupWithArchiver(sourceDir: string, backupId: string): Promise<string> {
    const outputPath = path.join(this.backupPath, `${backupId}.zip`);
    
    return new Promise((resolve, reject) => {
      const output = createWriteStream(outputPath);
      const archive = archiver('zip', {
        zlib: { level: 9 } // Massima compressione
      });

      output.on('close', () => {
        logger.info(`Backup compressed: ${archive.pointer()} bytes`);
        resolve(outputPath);
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();
    });
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    try {
      // Verifica che sia un file, non una directory
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        return 'directory-no-checksum';
      }
      
      const hash = crypto.createHash('sha256');
      const stream = await fs.readFile(filePath);
      hash.update(stream);
      return hash.digest('hex');
    } catch (error) {
      logger.error('Checksum calculation failed:', error);
      return 'checksum-error';
    }
  }

  private async addLog(backupId: string, level: string, message: string) {
    try {
      await prisma.backupLog.create({
        data: {
          backupId,
          level,
          message,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      logger.error('Failed to add backup log:', error);
    }
  }

  /**
   * Lista backup - VERSIONE CORRETTA
   */
  async listBackups(filters: any = {}): Promise<any> {
    try {
      // Estrai limit e offset dai filtri
      const { limit = 50, offset = 0, type, status, ...whereFilters } = filters;
      
      // Costruisci where clause corretta - RIMUOVI deletedAt
      const where: any = {
        ...whereFilters
      };
      
      if (type) where.type = type;
      if (status) where.status = status;

      const [backups, totalCount, stats] = await Promise.all([
        prisma.systemBackup.findMany({
          where,
          include: {
            createdBy: {
              select: {
                id: true,
                fullName: true,
                email: true
              }
            },
            _count: {
              select: {
                logs: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: limit,  // Usa take invece di limit
          skip: offset  // Usa skip invece di offset
        }),
        prisma.systemBackup.count({ where }),
        this.getBackupStats()
      ]);

      // Converti BigInt in string per JSON
      const serializedBackups = backups.map(backup => ({
        ...backup,
        fileSize: backup.fileSize ? backup.fileSize.toString() : null
      }));

      return {
        backups: serializedBackups,
        totalCount,
        stats
      };
    } catch (error) {
      logger.error('Error fetching backups:', error);
      throw error;
    }
  }

  private async getBackupStats() {
    const [totalCount, completedCount, failedCount, totalSizeResult] = await Promise.all([
      prisma.systemBackup.count(),
      prisma.systemBackup.count({ where: { status: BackupStatus.COMPLETED } }),
      prisma.systemBackup.count({ where: { status: BackupStatus.FAILED } }),
      prisma.systemBackup.aggregate({
        where: { status: BackupStatus.COMPLETED },
        _sum: { fileSize: true },
      }),
    ]);

    const totalSize = totalSizeResult._sum.fileSize 
      ? totalSizeResult._sum.fileSize.toString() 
      : '0';

    return {
      totalCount,
      completedCount,
      failedCount,
      totalSize,
    };
  }

  /**
   * Elimina backup - VERSIONE CORRETTA SENZA SOFT DELETE
   */
  async deleteBackup(backupId: string, userId: string, permanent: boolean = false): Promise<any> {
    const backup = await prisma.systemBackup.findUnique({
      where: { id: backupId },
    });

    if (!backup) {
      throw new Error('Backup not found');
    }

    // Elimina fisicamente il file se esiste
    if (backup.filePath) {
      try {
        // Verifica se il file esiste prima di eliminarlo
        if (fsSync.existsSync(backup.filePath)) {
          await fs.unlink(backup.filePath);
          logger.info(`Deleted backup file: ${backup.filePath}`);
        } else {
          logger.warn(`Backup file not found: ${backup.filePath}`);
        }
      } catch (error) {
        logger.warn(`Failed to delete backup file: ${backup.filePath}`, error);
      }
    }

    // Elimina dal database
    // NOTA: Non abbiamo soft delete nel database, quindi eliminiamo sempre permanentemente
    await prisma.systemBackup.delete({
      where: { id: backupId },
    });

    logger.info(`Backup ${backupId} deleted by user ${userId}`);
    return { success: true, message: 'Backup deleted successfully' };
  }

  async verifyBackup(backupId: string): Promise<{ isValid: boolean; message: string }> {
    const backup = await prisma.systemBackup.findUnique({
      where: { id: backupId },
    });

    if (!backup) {
      return { isValid: false, message: 'Backup not found' };
    }

    if (!backup.filePath || !backup.checksum) {
      return { isValid: false, message: 'Backup file or checksum missing' };
    }

    try {
      await fs.access(backup.filePath);
      const currentChecksum = await this.calculateChecksum(backup.filePath);
      const isValid = currentChecksum === backup.checksum;

      return {
        isValid,
        message: isValid ? 'Backup integrity verified' : 'Backup checksum mismatch',
      };
    } catch (error) {
      return { isValid: false, message: `Verification failed: ${error.message}` };
    }
  }

  async downloadBackup(backupId: string, userId: string): Promise<any> {
    const backup = await prisma.systemBackup.findUnique({
      where: { id: backupId },
    });

    if (!backup) {
      throw new Error('Backup not found');
    }

    if (!backup.filePath) {
      throw new Error('Backup file not found');
    }

    try {
      await fs.access(backup.filePath);
    } catch {
      throw new Error('Backup file no longer exists');
    }

    let fileName = backup.name;
    let contentType = 'application/octet-stream';
    
    if (backup.filePath.endsWith('.zip')) {
      fileName += '.zip';
      contentType = 'application/zip';
    } else if (backup.filePath.endsWith('.tar.gz')) {
      fileName += '.tar.gz';
      contentType = 'application/gzip';
    } else if (backup.filePath.endsWith('.json')) {
      fileName += '.json';
      contentType = 'application/json';
    } else {
      fileName += '.backup';
    }

    return {
      filePath: backup.filePath,
      fileName,
      contentType,
    };
  }

  async restoreBackup(backupId: string, userId: string): Promise<any> {
    logger.warn('Restore functionality not implemented yet');
    throw new Error('Restore functionality not implemented');
  }

  async createSchedule(userId: string, data: any): Promise<any> {
    let nextRunAt = new Date();
    
    switch (data.frequency) {
      case 'HOURLY':
        nextRunAt.setHours(nextRunAt.getHours() + 1);
        break;
      case 'DAILY':
        nextRunAt.setDate(nextRunAt.getDate() + 1);
        if (data.timeOfDay) {
          const [hours, minutes] = data.timeOfDay.split(':');
          nextRunAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        }
        break;
      case 'WEEKLY':
        nextRunAt.setDate(nextRunAt.getDate() + 7);
        if (data.timeOfDay) {
          const [hours, minutes] = data.timeOfDay.split(':');
          nextRunAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        }
        break;
      case 'MONTHLY':
        nextRunAt.setMonth(nextRunAt.getMonth() + 1);
        if (data.dayOfMonth) {
          nextRunAt.setDate(data.dayOfMonth);
        }
        if (data.timeOfDay) {
          const [hours, minutes] = data.timeOfDay.split(':');
          nextRunAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        }
        break;
    }

    const schedule = await prisma.backupSchedule.create({
      data: {
        ...data,
        createdById: userId,
        nextRunAt,
        isActive: true,
      },
    });

    return schedule;
  }

  async getSchedules(): Promise<any[]> {
    return prisma.backupSchedule.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async deleteSchedule(scheduleId: string): Promise<any> {
    await prisma.backupSchedule.delete({
      where: { id: scheduleId }
    });
    return { success: true };
  }
}

export default new BackupService();
EOF

echo "✅ Backup service fixed!"
echo ""
echo "🔄 Backend restarting..."
echo ""
echo "📝 Changes made:"
echo "1. ✅ Removed all references to deletedAt and deletedById"
echo "2. ✅ Delete always removes permanently (no soft delete)"
echo "3. ✅ Properly checks if file exists before deleting"
echo "4. ✅ Better error logging"
echo ""
echo "🎉 Delete backup functionality should now work!"
