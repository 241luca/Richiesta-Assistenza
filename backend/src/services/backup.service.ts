/**
 * Backup Service
 * Sistema completo di backup e cleanup per database, codice e file
 * 
 * @module services/backup
 * @version 5.2.2
 * @updated 2025-10-04 - TypeScript Strict Mode
 * @author Sistema Richiesta Assistenza
 */

import { prisma } from '../config/database';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { format } from 'date-fns';
import logger from '../utils/logger'; // ✅ Corretto: senza graffe
import { v4 as uuidv4 } from 'uuid';
import * as cleanupConfigService from './cleanup-config.service';
import { auditLogService } from './auditLog.service';
import { notificationService } from './notification.service';
import { SystemBackup, Prisma } from '@prisma/client';

// ========================================
// INTERFACCE TYPESCRIPT
// ========================================

interface CleanupConfig {
  directoryFormat?: string;
  maxDepth?: number;
  preserveStructure?: boolean;
  createReadme?: boolean;
  retentionDays?: number;
  notifyOnCleanup?: boolean;
  notifyEmails?: string[];
  targetDirectory?: string;
}

interface BackupStats {
  total: number;
  valid: number;
  byType: {
    database: number;
    code: number;
    uploads: number;
  };
  totalSize: string;
  totalSizeBytes: string;
}

interface CleanupDirectory {
  name: string;
  path: string;
  size: string;
  createdAt: Date;
  fileCount: number;
}

interface CleanupResult {
  movedCount: number;
  cleanupDir: string;
}

interface BackupNotification {
  title: string;
  message: string;
  type: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  data: Record<string, unknown>;
}

interface AuditLogData {
  action: string;
  entityType: string;
  entityId: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  success: boolean;
  severity: string;
  category: string;
  errorMessage?: string;
}

const execAsync = promisify(exec);

export type BackupType = 'DATABASE' | 'CODE' | 'FILES';

interface BackupResult {
  id: string;
  type: BackupType | 'UPLOADS';
  filename: string;
  filePath: string;
  fileSize: string;
  createdAt: Date;
}

interface SystemBackupExtended extends SystemBackup {
  filename?: string;
  file_size?: string;
  created_at?: Date;
  createdBy?: string;
}

class SimpleBackupService {
  private backupBaseDir: string;
  
  constructor() {
    this.backupBaseDir = path.join('/Users/lucamambelli/Desktop/backup-ra');
    this.ensureDirectories();
  }

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

  async backupDatabase(userId: string): Promise<BackupResult> {
    logger.info('Starting database backup...');
    
    const timestamp = format(new Date(), 'yyyy-MM-dd-HH-mm-ss');
    const filename = `db-${timestamp}.sql.gz`;
    const filePath = path.join(this.backupBaseDir, 'database', filename);
    
    try {
      const databaseUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/richiesta_assistenza';

      logger.info(`Executing pg_dump to ${filePath}`);
      await execAsync(`pg_dump "${databaseUrl}" | gzip > "${filePath}"`);
      
      if (!fs.existsSync(filePath)) {
        throw new Error('Backup file was not created');
      }

      const stats = fs.statSync(filePath);
      
      const backupId = uuidv4();
      const backup = await prisma.systemBackup.create({
        data: {
          id: backupId,
          name: `Database Backup - ${timestamp}`,
          description: 'Backup completo del database PostgreSQL',
          type: 'DATABASE',
          filePath,
          fileSize: BigInt(stats.size),
          createdById: userId,
          status: 'COMPLETED',
          compression: true,
          encrypted: false,
          retentionDays: 30,
          includeDatabase: true,
          includeUploads: false,
          includeCode: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          completedAt: new Date(),
          startedAt: new Date(),
          downloadUrl: `/api/backup/download/${backupId}`
        }
      });

      logger.info(`Database backup completed: ${filename} (${this.formatFileSize(stats.size)})`);
      
      try {
        await auditLogService.log({
          action: 'BACKUP_CREATED',
          entityType: 'SystemBackup',
          entityId: backup.id,
          userId: userId,
          ipAddress: '127.0.0.1',
          userAgent: 'BackupService/1.0',
          metadata: {
            type: 'DATABASE',
            filename,
            size: stats.size,
            path: filePath
          },
          success: true,
          severity: 'INFO',
          category: 'SYSTEM'
        } as AuditLogData);
        logger.info('Audit log created for backup');
      } catch (auditError: unknown) {
        logger.error('Failed to create audit log:', auditError);
      }
      
      try {
        await notificationService.sendToUser(userId, {
          title: 'Backup Database Completato',
          message: `Il backup ${filename} è stato completato con successo (${this.formatFileSize(stats.size)})`,
          type: 'backup_success',
          priority: 'NORMAL',
          data: {
            backupId: backup.id,
            type: 'DATABASE',
            size: stats.size
          }
        });
      } catch (err: unknown) {
        logger.warn('Failed to send backup notification:', err);
      }
      
      return {
        id: backup.id,
        type: backup.type === 'FILES' ? 'UPLOADS' : backup.type,
        filename: backup.name,
        filePath: backup.filePath,
        fileSize: backup.fileSize.toString(),
        createdAt: backup.createdAt
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Database backup failed:', error);
      
      await auditLogService.log({
        action: 'BACKUP_FAILED',
        entityType: 'SystemBackup',
        entityId: 'N/A',
        userId: userId,
        metadata: {
          type: 'DATABASE',
          error: errorMessage
        },
        success: false,
        severity: 'ERROR',
        category: 'SYSTEM'
      } as AuditLogData);
      
      try {
        await notificationService.sendToUser(userId, {
          title: 'Errore Backup Database',
          message: `Backup database fallito: ${errorMessage}`,
          type: 'backup_failed',
          priority: 'HIGH',
          data: {
            error: errorMessage,
            type: 'DATABASE'
          }
        });
      } catch (err: unknown) {
        logger.warn('Failed to send error notification:', err);
      }
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw new Error(`Database backup failed: ${errorMessage}`);
    }
  }

  async backupCode(userId: string): Promise<BackupResult> {
    logger.info('Starting code backup...');
    
    const timestamp = format(new Date(), 'yyyy-MM-dd-HH-mm-ss');
    const filename = `code-${timestamp}.tar.gz`;
    const filePath = path.join(this.backupBaseDir, 'code', filename);
    
    try {
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

      logger.info(`Creating code archive to ${filePath}`);
      await execAsync(
        `tar -czf "${filePath}" ${excludes} -C "${projectRoot}" .`,
        { maxBuffer: 1024 * 1024 * 100 }
      );
      
      if (!fs.existsSync(filePath)) {
        throw new Error('Code archive was not created');
      }

      const stats = fs.statSync(filePath);
      
      const backupId = uuidv4();
      const backup = await prisma.systemBackup.create({
        data: {
          id: backupId,
          name: `Code Backup - ${timestamp}`,
          description: 'Backup del codice sorgente del progetto',
          type: 'CODE',
          filePath,
          fileSize: BigInt(stats.size),
          createdById: userId,
          status: 'COMPLETED',
          compression: true,
          encrypted: false,
          retentionDays: 30,
          includeDatabase: false,
          includeUploads: false,
          includeCode: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          completedAt: new Date(),
          startedAt: new Date(),
          downloadUrl: `/api/backup/download/${backupId}`
        }
      });

      logger.info(`Code backup completed: ${filename} (${this.formatFileSize(stats.size)})`);
      
      return {
        id: backup.id,
        type: backup.type === 'FILES' ? 'UPLOADS' : backup.type,
        filename: backup.name,
        filePath: backup.filePath,
        fileSize: backup.fileSize.toString(),
        createdAt: backup.createdAt
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Code backup failed:', error);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw new Error(`Code backup failed: ${errorMessage}`);
    }
  }

  async backupFiles(userId: string): Promise<BackupResult> {
    logger.info('Starting uploads backup...');
    
    const timestamp = format(new Date(), 'yyyy-MM-dd-HH-mm-ss');
    const filename = `uploads-${timestamp}.tar.gz`;
    const filePath = path.join(this.backupBaseDir, 'uploads', filename);
    
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        fs.writeFileSync(path.join(uploadsDir, '.placeholder'), 'This directory contains uploaded files');
      }

      logger.info(`Creating uploads archive to ${filePath}`);
      await execAsync(
        `tar -czf "${filePath}" -C "${path.dirname(uploadsDir)}" uploads`,
        { maxBuffer: 1024 * 1024 * 500 }
      );
      
      if (!fs.existsSync(filePath)) {
        throw new Error('Uploads archive was not created');
      }

      const stats = fs.statSync(filePath);
      
      const backupId = uuidv4();
      const backup = await prisma.systemBackup.create({
        data: {
          id: backupId,
          name: `Uploads Backup - ${timestamp}`,
          description: 'Backup dei file allegati caricati dagli utenti',
          type: 'FILES',
          filePath,
          fileSize: BigInt(stats.size),
          createdById: userId,
          status: 'COMPLETED',
          compression: true,
          encrypted: false,
          retentionDays: 30,
          includeDatabase: false,
          includeUploads: true,
          includeCode: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          completedAt: new Date(),
          startedAt: new Date(),
          downloadUrl: `/api/backup/download/${backupId}`
        }
      });

      logger.info(`Uploads backup completed: ${filename} (${this.formatFileSize(stats.size)})`);
      
      return {
        id: backup.id,
        type: backup.type === 'FILES' ? 'UPLOADS' : backup.type,
        filename: backup.name,
        filePath: backup.filePath,
        fileSize: backup.fileSize.toString(),
        createdAt: backup.createdAt
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Uploads backup failed:', error);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw new Error(`Uploads backup failed: ${errorMessage}`);
    }
  }

  async listBackups(type?: BackupType): Promise<SystemBackup[]> {
    try {
      const where: Prisma.SystemBackupWhereInput = type ? { type } : {};
      
      const backups = await prisma.systemBackup.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      const existingBackups = backups.filter(backup => {
        if (!backup.filePath) {
          logger.warn(`Backup has no filePath: ${backup.id}`);
          return false;
        }
        const exists = fs.existsSync(backup.filePath);
        if (!exists) {
          logger.warn(`Backup file missing: ${backup.filePath}`);
        }
        return exists;
      });

      return existingBackups.map(backup => ({
        ...backup,
        type: backup.type === 'FILES' ? ('UPLOADS' as BackupType) : backup.type,
        filename: backup.name || backup.filePath?.split('/').pop() || 'unknown',
        file_size: backup.fileSize?.toString() || '0',
        created_at: backup.createdAt,
        createdBy: backup.createdById
      } as SystemBackupExtended)) as SystemBackup[];

    } catch (error: unknown) {
      logger.error('Error listing backups:', error);
      return [];
    }
  }

  async getBackup(backupId: string): Promise<SystemBackup | null> {
    try {
      const backup = await prisma.systemBackup.findUnique({
        where: { id: backupId }
      });

      if (!backup) {
        return null;
      }

      if (!backup.filePath || !fs.existsSync(backup.filePath)) {
        logger.warn(`Backup file not found: ${backup.filePath || 'no path'}`);
        return null;
      }

      return {
        ...backup,
        fileSize: backup.fileSize?.toString() || '0'
      } as unknown as SystemBackup;

    } catch (error: unknown) {
      logger.error('Error getting backup:', error);
      return null;
    }
  }

  async deleteBackup(backupId: string, userId?: string): Promise<void> {
    try {
      logger.info(`Deleting backup ${backupId} by user ${userId || 'system'}`);
      
      const backup = await prisma.systemBackup.findUnique({
        where: { id: backupId }
      });

      if (!backup) {
        throw new Error('Backup not found');
      }

      const backupInfo = {
        name: backup.name || 'Unknown',
        type: backup.type,
        size: backup.fileSize?.toString() || '0',
        path: backup.filePath || 'Unknown'
      };

      if (backup.filePath && fs.existsSync(backup.filePath)) {
        fs.unlinkSync(backup.filePath);
        logger.info(`Deleted backup file: ${backup.filePath}`);
      } else {
        logger.warn(`Backup file already missing: ${backup.filePath || 'No path'}`);
      }

      await prisma.systemBackup.delete({
        where: { id: backupId }
      });

      try {
        const auditData: AuditLogData = {
          action: 'DELETE',
          entityType: 'SystemBackup',
          entityId: backupId,
          userId: userId || 'system',
          ipAddress: '127.0.0.1',
          userAgent: 'BackupService/1.0',
          metadata: {
            ...backupInfo,
            operation: 'BACKUP_DELETED'
          },
          success: true,
          severity: 'WARNING',
          category: 'SYSTEM'
        };
        
        logger.info('Creating audit log for deletion with data:', auditData);
        await auditLogService.log(auditData);
        logger.info('Audit log created successfully for backup deletion');
      } catch (auditError: unknown) {
        logger.error('Failed to create audit log for deletion:', auditError);
      }

      logger.info(`Backup ${backupId} deleted successfully`);

    } catch (error: unknown) {
      logger.error('Error deleting backup:', error);
      throw error;
    }
  }

  async getBackupStats(): Promise<BackupStats> {
    try {
      const [totalCount, dbCount, codeCount, uploadsCount] = await Promise.all([
        prisma.systemBackup.count(),
        prisma.systemBackup.count({ where: { type: 'DATABASE' } }),
        prisma.systemBackup.count({ where: { type: 'CODE' } }),
        prisma.systemBackup.count({ where: { type: 'FILES' } })
      ]);

      const backups = await prisma.systemBackup.findMany({
        select: { 
          filePath: true, 
          fileSize: true 
        }
      });

      let totalSize = BigInt(0);
      let validCount = 0;

      for (const backup of backups) {
        if (backup.filePath && fs.existsSync(backup.filePath)) {
          totalSize += backup.fileSize || BigInt(0);
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

    } catch (error: unknown) {
      logger.error('Error getting backup stats:', error);
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

  async cleanupDevelopmentFiles(): Promise<CleanupResult> {
    let executionId: string | undefined;
    
    try {
      const config = await cleanupConfigService.getCleanupConfig() as CleanupConfig;
      const patterns = await cleanupConfigService.getActivePatterns() as string[];
      const excludedFiles = await cleanupConfigService.getActiveExcludedFiles() as string[];
      const excludedDirs = await cleanupConfigService.getActiveExcludedDirectories() as string[];
      
      const now = new Date();
      const formatMap: Record<string, string> = {
        '{YYYY}': format(now, 'yyyy'),
        '{MM}': format(now, 'MM'),
        '{DD}': format(now, 'dd'),
        '{HH}': format(now, 'HH'),
        '{mm}': format(now, 'mm'),
        '{ss}': format(now, 'ss')
      };
      
      let cleanupDirName = config.directoryFormat || 'CLEANUP-{YYYY}-{MM}-{DD}-{HH}-{mm}-{ss}';
      Object.entries(formatMap).forEach(([key, value]) => {
        cleanupDirName = cleanupDirName.replace(key, value);
      });
      
      const projectRoot = path.resolve(process.cwd(), '..');
      const cleanupPath = path.join(projectRoot, cleanupDirName);
      
      if (!fs.existsSync(cleanupPath)) {
        fs.mkdirSync(cleanupPath, { recursive: true });
        logger.info(`Created cleanup directory: ${cleanupPath}`);
      }
      
      executionId = uuidv4();
      const startTime = new Date();
      
      await cleanupConfigService.logCleanupExecution({
        executionId,
        operation: 'cleanup',
        status: 'started',
        targetPath: cleanupPath,
        executedBy: 'system',
        startedAt: startTime
      });
      
      await auditLogService.log({
        action: 'CLEANUP_STARTED',
        entityType: 'CleanupSystem',
        entityId: executionId,
        userId: undefined,
        ipAddress: '127.0.0.1',
        userAgent: 'System',
        metadata: {
          targetPath: cleanupPath,
          configUsed: {
            patterns: patterns.length,
            excludedFiles: excludedFiles.length,
            excludedDirs: excludedDirs.length
          }
        },
        success: true,
        severity: 'INFO',
        category: 'SYSTEM'
      } as AuditLogData);
      
      let movedCount = 0;
      let totalSize = 0;
      
      logger.info(`Starting cleanup scan from root: ${projectRoot}`);
      
      const findAndMoveFiles = (dir: string, level: number = 0): void => {
        if (level > (config.maxDepth || 2)) return;
        
        const skipDirs = excludedDirs;
        
        try {
          const items = fs.readdirSync(dir);
          
          for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
              const shouldSkip = skipDirs.some(skip => {
                if (skip.includes('*')) {
                  const regex = new RegExp(skip.replace(/\*/g, '.*'));
                  return regex.test(item);
                }
                return item === skip || item.startsWith(skip);
              });
              
              if (!shouldSkip) {
                findAndMoveFiles(fullPath, level + 1);
              }
              continue;
            }
            
            const relativePath = path.relative(projectRoot, fullPath);
            
            const isExcluded = excludedFiles.some(excludePattern => {
              if (excludePattern.includes('/')) {
                return relativePath === excludePattern || 
                       relativePath === excludePattern.replace(/^\.\//, '');
              }
              
              if (excludePattern.includes('*')) {
                const regex = new RegExp(excludePattern.replace(/\*/g, '.*'));
                return regex.test(item);
              }
              
              return item === excludePattern;
            });
            
            if (isExcluded) {
              logger.info(`Skipping excluded file: ${relativePath}`);
              continue;
            }
            
            const shouldMove = patterns.some(pattern => {
              if (pattern.includes('*')) {
                const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                return regex.test(item);
              }
              return item === pattern;
            });
            
            if (shouldMove) {
              try {
                if (config.preserveStructure) {
                  const relativePath = path.relative(projectRoot, dir);
                  const targetDir = path.join(cleanupPath, relativePath);
                  
                  if (!fs.existsSync(targetDir)) {
                    fs.mkdirSync(targetDir, { recursive: true });
                  }
                  
                  const targetPath = path.join(targetDir, item);
                  fs.renameSync(fullPath, targetPath);
                  logger.info(`Moved: ${fullPath} -> ${targetPath}`);
                } else {
                  const targetPath = path.join(cleanupPath, item);
                  
                  let finalPath = targetPath;
                  let counter = 1;
                  while (fs.existsSync(finalPath)) {
                    const ext = path.extname(item);
                    const base = path.basename(item, ext);
                    finalPath = path.join(cleanupPath, `${base}_${counter}${ext}`);
                    counter++;
                  }
                  
                  fs.renameSync(fullPath, finalPath);
                  logger.info(`Moved: ${fullPath} -> ${finalPath}`);
                }
                
                movedCount++;
                totalSize += stat.size;
              } catch (error: unknown) {
                logger.warn(`Could not move file ${fullPath}:`, error);
              }
            }
          }
        } catch (error: unknown) {
          logger.warn(`Could not read directory ${dir}:`, error);
        }
      };
      
      findAndMoveFiles(projectRoot);
      
      if (config.createReadme) {
        const readmePath = path.join(cleanupPath, 'README.md');
        const readmeContent = `# Cleanup Directory - ${format(now, 'dd/MM/yyyy HH:mm:ss')}

Questi file sono stati spostati automaticamente dalla pulizia del ${format(now, 'dd/MM/yyyy HH:mm:ss')}.

## Informazioni:
- File spostati: ${movedCount}
- Dimensione totale: ${this.formatFileSize(totalSize)}
- Pattern utilizzati: ${patterns.length}
- Directory escluse: ${excludedDirs.length}
- File esclusi: ${excludedFiles.length}

## Pattern utilizzati:
${patterns.map(p => `- ${p}`).join('\n')}

## Nota:
È sicuro eliminare questa cartella se non hai bisogno di recuperare nessuno di questi file.
I file verranno eliminati automaticamente dopo ${config.retentionDays || 30} giorni se la pulizia automatica è abilitata.
`;
        
        fs.writeFileSync(readmePath, readmeContent);
      }
      
      const endTime = new Date();
      await cleanupConfigService.logCleanupExecution({
        executionId,
        operation: 'cleanup',
        status: 'completed',
        targetPath: cleanupPath,
        filesProcessed: movedCount,
        totalSize: BigInt(totalSize),
        executedBy: 'system',
        completedAt: endTime
      });
      
      await auditLogService.log({
        action: 'CLEANUP_COMPLETED',
        entityType: 'CleanupSystem',
        entityId: executionId,
        userId: undefined,
        ipAddress: '127.0.0.1',
        userAgent: 'System',
        metadata: {
          targetPath: cleanupPath,
          filesProcessed: movedCount,
          totalSize: this.formatFileSize(totalSize),
          duration: endTime.getTime() - now.getTime(),
          cleanupDir: cleanupDirName
        },
        success: true,
        severity: 'INFO',
        category: 'SYSTEM'
      } as AuditLogData);
      
      if (config.notifyOnCleanup) {
        const adminUsers = await prisma.user.findMany({
          where: {
            role: { in: ['ADMIN', 'SUPER_ADMIN'] }
          },
          select: { id: true, email: true, fullName: true }
        });
        
        for (const admin of adminUsers) {
          if (!admin.id) {
            logger.warn('Admin senza ID valido, skip notifica');
            continue;
          }
          
          try {
            await notificationService.sendToUser(admin.id, {
              title: 'Cleanup Sistema Completato',
              message: `Il cleanup automatico ha spostato ${movedCount} file (${this.formatFileSize(totalSize)}) nella cartella ${cleanupDirName}`,
              type: 'system_cleanup',
              priority: 'NORMAL',
              data: {
                executionId,
                filesProcessed: movedCount,
                totalSize: totalSize.toString(),
                cleanupDir: cleanupDirName
              }
            });
          } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : 'Unknown error';
            logger.warn(`Impossibile inviare notifica ad admin ${admin.id}:`, errMsg);
          }
        }
        
        if (config.notifyEmails && Array.isArray(config.notifyEmails)) {
          for (const email of config.notifyEmails) {
            await notificationService.sendEmail({
              to: email,
              subject: 'Cleanup Sistema Completato',
              template: 'cleanup-completed',
              data: {
                filesProcessed: movedCount,
                totalSize: this.formatFileSize(totalSize),
                cleanupDir: cleanupDirName,
                timestamp: format(now, 'dd/MM/yyyy HH:mm:ss')
              }
            }).catch((err: unknown) => {
              logger.error('Errore invio email cleanup:', err);
            });
          }
        }
      }
      
      logger.info(`Development cleanup completed: ${movedCount} files moved to ${cleanupDirName}`);
      
      return {
        movedCount,
        cleanupDir: cleanupDirName
      };
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error('Error during development cleanup:', error);
      
      if (typeof executionId !== 'undefined') {
        await auditLogService.log({
          action: 'CLEANUP_FAILED',
          entityType: 'CleanupSystem',
          entityId: executionId,
          userId: undefined,
          ipAddress: '127.0.0.1',
          userAgent: 'System',
          metadata: {
            error: errorMessage,
            stack: errorStack
          },
          success: false,
          severity: 'ERROR',
          category: 'SYSTEM',
          errorMessage: errorMessage
        } as AuditLogData);
      }
      
      const config = await cleanupConfigService.getCleanupConfig();
      if (config.notifyOnCleanup) {
        const adminUsers = await prisma.user.findMany({
          where: {
            role: { in: ['ADMIN', 'SUPER_ADMIN'] }
          },
          select: { id: true }
        });
        
        for (const admin of adminUsers) {
          if (!admin.id) {
            logger.warn('Admin senza ID valido, skip notifica errore');
            continue;
          }
          
          try {
            await notificationService.sendToUser(admin.id, {
              title: 'Errore Cleanup Sistema',
              message: `Il cleanup automatico è fallito: ${errorMessage}`,
              type: 'system_error',
              priority: 'HIGH',
              data: {
                error: errorMessage
              }
            });
          } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : 'Unknown error';
            logger.warn(`Impossibile inviare notifica errore ad admin ${admin.id}:`, errMsg);
          }
        }
      }
      
      throw new Error(`Development cleanup failed: ${errorMessage}`);
    }
  }
  
  async listCleanupDirs(): Promise<CleanupDirectory[]> {
    try {
      const cleanupDirs: CleanupDirectory[] = [];
      
      const searchPaths = [
        process.cwd(),
        path.resolve(process.cwd(), '..')
      ];
      
      for (const searchPath of searchPaths) {
        try {
          const items = fs.readdirSync(searchPath);
          
          for (const item of items) {
            if (item.startsWith('CLEANUP-')) {
              const fullPath = path.join(searchPath, item);
              const stat = fs.statSync(fullPath);
              
              if (stat.isDirectory()) {
                let fileCount = 0;
                let totalSize = 0;
                
                const countFiles = (dir: string): void => {
                  try {
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
                  } catch (err: unknown) {
                    // Ignora errori di permessi
                  }
                };
                
                countFiles(fullPath);
                
                const existing = cleanupDirs.find(d => d.name === item);
                if (!existing) {
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
          }
        } catch (error: unknown) {
          logger.warn(`Could not read directory ${searchPath}:`, error);
        }
      }
      
      cleanupDirs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      logger.info(`Found ${cleanupDirs.length} cleanup directories`);
      return cleanupDirs;
      
    } catch (error: unknown) {
      logger.error('Error listing cleanup directories:', error);
      return [];
    }
  }
  
  async deleteCleanupDir(dirName: string, userId?: string): Promise<boolean> {
    try {
      if (!dirName.startsWith('CLEANUP-')) {
        throw new Error('Invalid cleanup directory name');
      }
      
      let fullPath = '';
      const searchPaths = [
        process.cwd(),
        path.resolve(process.cwd(), '..')
      ];
      
      for (const searchPath of searchPaths) {
        const testPath = path.join(searchPath, dirName);
        if (fs.existsSync(testPath)) {
          fullPath = testPath;
          break;
        }
      }
      
      if (!fullPath || !fs.existsSync(fullPath)) {
        throw new Error('Cleanup directory not found');
      }
      
      let fileCount = 0;
      let totalSize = 0;
      const countFiles = (dir: string): void => {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const itemPath = path.join(dir, item);
          const stat = fs.statSync(itemPath);
          if (stat.isDirectory()) {
            countFiles(itemPath);
          } else {
            fileCount++;
            totalSize += stat.size;
          }
        }
      };
      countFiles(fullPath);
      
      fs.rmSync(fullPath, { recursive: true, force: true });
      logger.info(`Deleted cleanup directory: ${dirName}`);
      
      await auditLogService.log({
        action: 'CLEANUP_FOLDER_DELETED',
        entityType: 'CleanupFolder',
        entityId: dirName,
        userId: userId || undefined,
        ipAddress: '127.0.0.1',
        userAgent: 'System',
        metadata: {
          folderName: dirName,
          filesDeleted: fileCount,
          totalSize: this.formatFileSize(totalSize)
        },
        success: true,
        severity: 'WARNING',
        category: 'SYSTEM'
      } as AuditLogData);
      
      if (userId) {
        const adminUsers = await prisma.user.findMany({
          where: {
            role: { in: ['ADMIN', 'SUPER_ADMIN'] },
            id: { not: userId }
          },
          select: { id: true }
        });
        
        for (const admin of adminUsers) {
          if (!admin.id) {
            logger.warn('Admin senza ID valido, skip notifica eliminazione cartella');
            continue;
          }
          
          try {
            await notificationService.sendToUser(admin.id, {
              title: 'Cartella Cleanup Eliminata',
              message: `La cartella ${dirName} è stata eliminata (${fileCount} file, ${this.formatFileSize(totalSize)})`,
              type: 'cleanup_folder_deleted',
              priority: 'NORMAL',
              data: {
                folderName: dirName,
                filesDeleted: fileCount,
                deletedBy: userId
              }
            });
          } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : 'Unknown error';
            logger.warn(`Impossibile inviare notifica eliminazione ad admin ${admin.id}:`, errMsg);
          }
        }
      }
      
      return true;
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error deleting cleanup directory:', error);
      throw new Error(`Failed to delete cleanup directory: ${errorMessage}`);
    }
  }

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

  async cleanOldBackups(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const oldBackups = await prisma.systemBackup.findMany({
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
        } catch (error: unknown) {
          logger.error(`Failed to delete old backup ${backup.id}:`, error);
        }
      }

      logger.info(`Cleaned ${deletedCount} old backups`);
      return deletedCount;

    } catch (error: unknown) {
      logger.error('Error cleaning old backups:', error);
      return 0;
    }
  }
}

export default new SimpleBackupService();
