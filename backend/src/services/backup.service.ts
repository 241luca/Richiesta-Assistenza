/**
 * Backup Service
 * Sistema completo di backup e cleanup per database, codice e file
 * 
 * Responsabilità:
 * - Backup database PostgreSQL (pg_dump)
 * - Backup codice sorgente (tar.gz)
 * - Backup file uploads utenti
 * - Gestione cartelle cleanup temporanee
 * - Pulizia automatica file sviluppo
 * - Statistiche e monitoring backup
 * - Retention policy configurabile
 * - Notifiche audit log integrate
 * 
 * @module services/backup
 * @version 5.2.1
 * @updated 2025-10-01
 * @author Sistema Richiesta Assistenza
 */

import { prisma } from '../config/database';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { format } from 'date-fns';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import * as cleanupConfigService from './cleanup-config.service';
import { auditLogService } from './auditLog.service';
import { notificationService } from './notification.service';
import { SystemBackup } from '@prisma/client';

// ========================================
// INTERFACCE TYPESCRIPT
// ========================================

/**
 * Configurazione di cleanup
 */
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

/**
 * Statistiche backup
 */
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

/**
 * Directory di cleanup
 */
interface CleanupDirectory {
  name: string;
  path: string;
  size: string;
  createdAt: Date;
  fileCount: number;
}

/**
 * Risultato del cleanup
 */
interface CleanupResult {
  movedCount: number;
  cleanupDir: string;
}

const execAsync = promisify(exec);

export type BackupType = 'DATABASE' | 'CODE' | 'FILES';

interface BackupResult {
  id: string;
  type: BackupType | 'UPLOADS';  // UPLOADS è per il frontend
  filename: string;
  filePath: string;
  fileSize: string;  // Sempre string per evitare problemi di serializzazione
  createdAt: Date;
}

/**
 * Notifica per sistema backup
 */
interface BackupNotification {
  title: string;
  message: string;
  type: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  data: Record<string, any>;
}

class SimpleBackupService {
  private backupBaseDir: string;
  
  constructor() {
    // Directory base per i backup - cartella backup-ra sul Desktop
    this.backupBaseDir = path.join('/Users/lucamambelli/Desktop/backup-ra');
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
    const filePath = path.join(this.backupBaseDir, 'database', filename);
    
    try {
      // Ottieni URL database dalle variabili ambiente
      const databaseUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/richiesta_assistenza';

      // Esegui pg_dump con compressione diretta
      logger.info(`Executing pg_dump to ${filePath}`);
      await execAsync(`pg_dump "${databaseUrl}" | gzip > "${filePath}"`);
      
      // Verifica che il file sia stato creato
      if (!fs.existsSync(filePath)) {
        throw new Error('Backup file was not created');
      }

      // Ottieni dimensione file
      const stats = fs.statSync(filePath);
      
      // Salva record nel database usando Prisma con nomi corretti
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
          downloadUrl: `/api/backup/download/${backupId}`  // URL con stesso ID
        }
      });

      logger.info(`Database backup completed: ${filename} (${this.formatFileSize(stats.size)})`);
      
      // Registra in AuditLog
      try {
        await auditLogService.log({
          action: 'BACKUP_CREATED' as any,
          entityType: 'SystemBackup',
          entityId: backup.id,
          userId: userId,
          ipAddress: '127.0.0.1',  // Default per operazioni interne
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
        } as any);
        logger.info('Audit log created for backup');
      } catch (auditError) {
        logger.error('Failed to create audit log:', auditError);
      }
      
      // Invia notifica se abilitata
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
      } catch (err) {
        logger.warn('Failed to send backup notification:', err);
      }
      
      // Ritorna con mappatura corretta e BigInt convertito in stringa
      return {
        id: backup.id,
        type: backup.type === 'FILES' ? 'UPLOADS' : backup.type,  // Mappa FILES a UPLOADS per frontend
        filename: backup.name,  // Usa name invece di filename
        filePath: backup.filePath,
        fileSize: backup.fileSize.toString(),
        createdAt: backup.createdAt
      };

    } catch (error: any) {
      logger.error('Database backup failed:', error);
      
      // Registra errore in AuditLog
      await auditLogService.log({
        action: 'BACKUP_FAILED' as any,
        entityType: 'SystemBackup',
        entityId: 'N/A',
        userId: userId,
        metadata: {
          type: 'DATABASE',
          error: error.message
        },
        success: false,
        severity: 'ERROR' as any,
        category: 'SYSTEM' as any
      });
      
      // Invia notifica errore
      try {
        await notificationService.sendToUser(userId, {
          title: 'Errore Backup Database',
          message: `Backup database fallito: ${error.message}`,
          type: 'backup_failed',
          priority: 'HIGH',
          data: {
            error: error.message,
            type: 'DATABASE'
          }
        });
      } catch (err) {
        logger.warn('Failed to send error notification:', err);
      }
      
      // Pulisci file parziale se esiste
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
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
    const filePath = path.join(this.backupBaseDir, 'code', filename);
    
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

      logger.info(`Creating code archive to ${filePath}`);
      await execAsync(
        `tar -czf "${filePath}" ${excludes} -C "${projectRoot}" .`,
        { maxBuffer: 1024 * 1024 * 100 } // 100MB buffer
      );
      
      // Verifica che il file sia stato creato
      if (!fs.existsSync(filePath)) {
        throw new Error('Code archive was not created');
      }

      // Ottieni dimensione file
      const stats = fs.statSync(filePath);
      
      // Salva record nel database usando Prisma
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
        filename: backup.name,  // Usa name invece di filename
        filePath: backup.filePath,
        fileSize: backup.fileSize.toString(),
        createdAt: backup.createdAt
      };

    } catch (error: any) {
      logger.error('Code backup failed:', error);
      // Pulisci file parziale se esiste
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw new Error(`Code backup failed: ${error.message}`);
    }
  }

  /**
   * 3. BACKUP FILES - Archivia tutti i file caricati
   */
  async backupFiles(userId: string): Promise<BackupResult> {
    logger.info('Starting uploads backup...');
    
    const timestamp = format(new Date(), 'yyyy-MM-dd-HH-mm-ss');
    const filename = `uploads-${timestamp}.tar.gz`;
    const filePath = path.join(this.backupBaseDir, 'uploads', filename);
    
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      
      // Verifica che la directory uploads esista
      if (!fs.existsSync(uploadsDir)) {
        // Crea directory se non esiste
        fs.mkdirSync(uploadsDir, { recursive: true });
        // Crea un file placeholder
        fs.writeFileSync(path.join(uploadsDir, '.placeholder'), 'This directory contains uploaded files');
      }

      logger.info(`Creating uploads archive to ${filePath}`);
      await execAsync(
        `tar -czf "${filePath}" -C "${path.dirname(uploadsDir)}" uploads`,
        { maxBuffer: 1024 * 1024 * 500 } // 500MB buffer per file grandi
      );
      
      // Verifica che il file sia stato creato
      if (!fs.existsSync(filePath)) {
        throw new Error('Uploads archive was not created');
      }

      // Ottieni dimensione file
      const stats = fs.statSync(filePath);
      
      // Salva record nel database usando Prisma
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
        type: backup.type === 'FILES' ? 'UPLOADS' : backup.type,  // Mappa FILES a UPLOADS
        filename: backup.name,  // Usa name invece di filename
        filePath: backup.filePath,
        fileSize: backup.fileSize.toString(),
        createdAt: backup.createdAt
      };

    } catch (error: any) {
      logger.error('Uploads backup failed:', error);
      // Pulisci file parziale se esiste
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw new Error(`Uploads backup failed: ${error.message}`);
    }
  }

  /**
   * 4. LISTA BACKUP - Solo quelli che esistono fisicamente!
   */
  async listBackups(type?: BackupType): Promise<SystemBackup[]> {
    try {
      const where = type ? { type } : {};
      
      const backups = await prisma.systemBackup.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      // IMPORTANTE: Filtra solo backup con file esistenti
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

      // Converti per il frontend - ritorna oggetto diretto
      return existingBackups.map(backup => ({
        ...backup,
        type: backup.type === 'FILES' ? 'UPLOADS' as BackupType : backup.type,  // Mappa FILES a UPLOADS
        filename: backup.name || backup.filePath?.split('/').pop() || 'unknown',  // Usa name o estrai dal path
        file_size: backup.fileSize?.toString() || '0', // Converti BigInt in stringa
        created_at: backup.createdAt,
        createdBy: backup.createdById  // Usa createdById
      })) as SystemBackup[];

    } catch (error) {
      logger.error('Error listing backups:', error);
      // Se la tabella non esiste, ritorna array vuoto
      return [];
    }
  }

  /**
   * 5. GET SINGOLO BACKUP
   */
  async getBackup(backupId: string): Promise<SystemBackup | null> {
    try {
      const backup = await prisma.systemBackup.findUnique({
        where: { id: backupId }
      });

      if (!backup) {
        return null;
      }

      // Verifica che il file esista
      if (!backup.filePath || !fs.existsSync(backup.filePath)) {
        logger.warn(`Backup file not found: ${backup.filePath}`);
        return null;
      }

      // Converti BigInt in stringa per evitare errori di serializzazione
      return {
        ...backup,
        fileSize: backup.fileSize?.toString() || '0'
      } as SystemBackup;

    } catch (error) {
      logger.error('Error getting backup:', error);
      return null;
    }
  }

  /**
   * 6. ELIMINA BACKUP - Rimuove file e record database
   */
  async deleteBackup(backupId: string, userId?: string): Promise<void> {
    try {
      logger.info(`Deleting backup ${backupId} by user ${userId || 'system'}`);
      
      // Trova il backup
      const backup = await prisma.systemBackup.findUnique({
        where: { id: backupId }
      });

      if (!backup) {
        throw new Error('Backup not found');
      }

      // Salva info del backup prima di eliminarlo per l'audit log
      const backupInfo = {
        name: backup.name || 'Unknown',
        type: backup.type,
        size: backup.fileSize?.toString() || '0',
        path: backup.filePath || 'Unknown'
      };

      // Elimina file fisico se esiste
      if (backup.filePath && fs.existsSync(backup.filePath)) {
        fs.unlinkSync(backup.filePath);
        logger.info(`Deleted backup file: ${backup.filePath}`);
      } else {
        logger.warn(`Backup file already missing: ${backup.filePath || 'No path'}`);
      }

      // Elimina record dal database
      await prisma.systemBackup.delete({
        where: { id: backupId }
      });

      // Registra in AuditLog la cancellazione
      try {
        const auditData = {
          action: 'DELETE' as any,  // Usa DELETE invece di BACKUP_DELETED che non esiste
          entityType: 'SystemBackup',
          entityId: backupId,
          userId: userId || 'system',
          ipAddress: '127.0.0.1',
          userAgent: 'BackupService/1.0',
          metadata: {
            ...backupInfo,
            operation: 'BACKUP_DELETED'  // Aggiungiamo nei metadata che tipo di DELETE è
          },
          success: true,
          severity: 'WARNING',
          category: 'SYSTEM'
        };
        
        logger.info('Creating audit log for deletion with data:', auditData);
        await auditLogService.log(auditData as any);
        logger.info('Audit log created successfully for backup deletion');
      } catch (auditError) {
        logger.error('Failed to create audit log for deletion:', auditError);
      }

      logger.info(`Backup ${backupId} deleted successfully`);

    } catch (error) {
      logger.error('Error deleting backup:', error);
      throw error;
    }
  }

  /**
   * 7. STATISTICHE BACKUP
   */
  async getBackupStats(): Promise<BackupStats> {
    try {
      // Conta per tipo
      const [totalCount, dbCount, codeCount, uploadsCount] = await Promise.all([
        prisma.systemBackup.count(),
        prisma.systemBackup.count({ where: { type: 'DATABASE' } }),
        prisma.systemBackup.count({ where: { type: 'CODE' } }),
        prisma.systemBackup.count({ where: { type: 'FILES' } })
      ]);

      // Calcola spazio totale - usa nome campo corretto
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
   * Usa la configurazione dal database per determinare cosa spostare
   */
  async cleanupDevelopmentFiles(): Promise<CleanupResult> {
    let executionId: string | undefined;  // Dichiarazione fuori dal try
    
    try {
      // Recupera configurazione dal database
      const config = await cleanupConfigService.getCleanupConfig() as CleanupConfig;
      const patterns = await cleanupConfigService.getActivePatterns() as string[];
      const excludedFiles = await cleanupConfigService.getActiveExcludedFiles() as string[];
      const excludedDirs = await cleanupConfigService.getActiveExcludedDirectories() as string[];
      
      // Genera nome directory con formato configurato
      const now = new Date();
      const formatMap = {
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
      
      // IMPORTANTE: Crea la cartella CLEANUP nella root del progetto, non in backend!
      const projectRoot = path.resolve(process.cwd(), '..');
      const cleanupPath = path.join(projectRoot, cleanupDirName);
      
      // Crea la directory di pulizia
      if (!fs.existsSync(cleanupPath)) {
        fs.mkdirSync(cleanupPath, { recursive: true });
        logger.info(`Created cleanup directory: ${cleanupPath}`);
      }
      
      // Log esecuzione nel database
      executionId = uuidv4();  // Assegnazione senza const
      const startTime = new Date();
      
      await cleanupConfigService.logCleanupExecution({
        executionId,
        operation: 'cleanup',
        status: 'started',
        targetPath: cleanupPath,
        executedBy: 'system',
        startedAt: startTime
      });
      
      // Log nell'Audit Log centralizzato
      await auditLogService.log({
        action: 'CLEANUP_STARTED' as any,
        entityType: 'CleanupSystem',
        entityId: executionId,
        userId: undefined,  // undefined per operazioni di sistema
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
        severity: 'INFO' as any,
        category: 'SYSTEM' as any
      });
      
      let movedCount = 0;
      let totalSize = 0;
      // projectRoot già definito sopra
      
      logger.info(`Starting cleanup scan from root: ${projectRoot}`);
      logger.info(`Current working directory: ${process.cwd()}`);
      logger.info(`Excluded files patterns: ${excludedFiles.join(', ')}`);
      logger.info(`Excluded directories: ${excludedDirs.join(', ')}`);
      logger.info(`Include patterns: ${patterns.join(', ')}`);
      
      // Funzione ricorsiva per trovare e spostare file
      const findAndMoveFiles = (dir: string, level: number = 0): void => {
        // Rispetta la profondità massima configurata
        if (level > (config.maxDepth || 2)) return;
        
        // Directory da escludere
        const skipDirs = excludedDirs;
        
        try {
          const items = fs.readdirSync(dir);
          
          for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            // Salta directory da ignorare
            if (stat.isDirectory()) {
              const shouldSkip = skipDirs.some(skip => {
                // Supporta pattern con wildcard
                if (skip.includes('*')) {
                  const regex = new RegExp(skip.replace('*', '.*'));
                  return regex.test(item);
                }
                return item === skip || item.startsWith(skip);
              });
              
              if (!shouldSkip) {
                findAndMoveFiles(fullPath, level + 1);
              }
              continue;
            }
            
            // Calcola il percorso relativo del file
            const relativePath = path.relative(projectRoot, fullPath);
            
            // Log per debug (solo per file che matchano i pattern)
            const matchesPattern = patterns.some(pattern => {
              if (pattern.includes('*')) {
                const regex = new RegExp(pattern.replace('*', '.*'));
                return regex.test(item);
              }
              return item === pattern;
            });
            
            if (matchesPattern) {
              logger.debug(`Checking file: ${relativePath} (from root: ${projectRoot})`);
            }
            
            // Verifica se il file è escluso (confronto esatto del percorso relativo)
            const isExcluded = excludedFiles.some(excludePattern => {
              // Se il pattern contiene '/', è un percorso
              if (excludePattern.includes('/')) {
                // Confronto esatto del percorso relativo
                return relativePath === excludePattern || 
                       relativePath === excludePattern.replace(/^\.\//, ''); // Gestisce anche ./path
              }
              
              // Se il pattern contiene '*', è un pattern wildcard
              if (excludePattern.includes('*')) {
                const regex = new RegExp(excludePattern.replace('*', '.*'));
                return regex.test(item); // Testa solo il nome del file
              }
              
              // Altrimenti è solo un nome file (esclude TUTTI i file con quel nome)
              return item === excludePattern;
            });
            
            if (isExcluded) {
              logger.info(`Skipping excluded file: ${relativePath}`);
              continue;
            }
            
            // Controlla se il file matcha uno dei pattern da includere
            const shouldMove = patterns.some(pattern => {
              if (pattern.includes('*')) {
                const regex = new RegExp(pattern.replace('*', '.*'));
                return regex.test(item);
              }
              return item === pattern;
            });
            
            if (shouldMove) {
              try {
                // Crea struttura directory nel cleanup se configurato
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
                  // Sposta tutto nella root della cartella cleanup
                  const targetPath = path.join(cleanupPath, item);
                  
                  // Se esiste già un file con lo stesso nome, aggiungi un suffisso
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
      
      // Crea un file README nella cartella di cleanup se configurato
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
      
      // Aggiorna log esecuzione
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
      
      // Log nell'Audit Log centralizzato
      await auditLogService.log({
        action: 'CLEANUP_COMPLETED' as any,
        entityType: 'CleanupSystem',
        entityId: executionId,
        userId: undefined,  // undefined per operazioni di sistema
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
        severity: 'INFO' as any,
        category: 'SYSTEM' as any
      });
      
      // Invia notifica se configurato
      if (config.notifyOnCleanup) {
        // Notifica agli admin
        const adminUsers = await prisma.user.findMany({
          where: {
            role: { in: ['ADMIN', 'SUPER_ADMIN'] }
          },
          select: { id: true, email: true, fullName: true }
        });
        
        for (const admin of adminUsers) {
          // Skippa se l'admin non ha un ID valido
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
          } catch (err: any) {
            logger.warn(`Impossibile inviare notifica ad admin ${admin.id}:`, err.message);
          }
        }
        
        // Se ci sono email configurate, invia anche email
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
            }).catch(err => {
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
      
    } catch (error: any) {
      logger.error('Error during development cleanup:', error);
      
      // Log errore nell'Audit Log (solo se executionId esiste)
      if (typeof executionId !== 'undefined') {
        await auditLogService.log({
          action: 'CLEANUP_FAILED' as any,
          entityType: 'CleanupSystem',
          entityId: executionId,
          userId: undefined,  // undefined per operazioni di sistema
          ipAddress: '127.0.0.1',
          userAgent: 'System',
          metadata: {
            error: error.message,
            stack: error.stack
          },
          success: false,
          severity: 'ERROR' as any,
          category: 'SYSTEM' as any,
          errorMessage: error.message
        });
      }
      
      // Notifica errore agli admin
      const config = await cleanupConfigService.getCleanupConfig();
      if (config.notifyOnCleanup) {
        const adminUsers = await prisma.user.findMany({
          where: {
            role: { in: ['ADMIN', 'SUPER_ADMIN'] }
          },
          select: { id: true }
        });
        
        for (const admin of adminUsers) {
          // Skippa se l'admin non ha un ID valido
          if (!admin.id) {
            logger.warn('Admin senza ID valido, skip notifica errore');
            continue;
          }
          
          try {
            await notificationService.sendToUser(admin.id, {
              title: 'Errore Cleanup Sistema',
              message: `Il cleanup automatico è fallito: ${error.message}`,
              type: 'system_error',
              priority: 'HIGH',
              data: {
                error: error.message
              }
            });
          } catch (err: any) {
            logger.warn(`Impossibile inviare notifica errore ad admin ${admin.id}:`, err.message);
          }
        }
      }
      
      throw new Error(`Development cleanup failed: ${error.message}`);
    }
  }
  
  /**
   * 10. LISTA CARTELLE DI CLEANUP
   * Elenca tutte le cartelle CLEANUP-* create
   */
  async listCleanupDirs(): Promise<Array<{ name: string; path: string; size: string; createdAt: Date; fileCount: number }>> {
    try {
      const cleanupDirs = [];
      
      // Cerca cartelle CLEANUP sia in backend che nella root del progetto
      const searchPaths = [
        process.cwd(), // backend/
        path.resolve(process.cwd(), '..') // richiesta-assistenza/
      ];
      
      for (const searchPath of searchPaths) {
        try {
          const items = fs.readdirSync(searchPath);
          
          for (const item of items) {
            if (item.startsWith('CLEANUP-')) {
              const fullPath = path.join(searchPath, item);
              const stat = fs.statSync(fullPath);
              
              if (stat.isDirectory()) {
                // Conta i file nella directory
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
                  } catch (err) {
                    // Ignora errori di permessi
                  }
                };
                
                countFiles(fullPath);
                
                // Aggiungi solo se non è già presente (evita duplicati)
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
        } catch (error) {
          logger.warn(`Could not read directory ${searchPath}:`, error);
        }
      }
      
      // Ordina per data di creazione (più recente prima)
      cleanupDirs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      logger.info(`Found ${cleanupDirs.length} cleanup directories`);
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
  async deleteCleanupDir(dirName: string, userId?: string): Promise<boolean> {
    try {
      // Sicurezza: accetta solo cartelle che iniziano con CLEANUP-
      if (!dirName.startsWith('CLEANUP-')) {
        throw new Error('Invalid cleanup directory name');
      }
      
      // Cerca la cartella sia in backend che nella root del progetto
      let fullPath = '';
      const searchPaths = [
        process.cwd(), // backend/
        path.resolve(process.cwd(), '..') // richiesta-assistenza/
      ];
      
      for (const searchPath of searchPaths) {
        const testPath = path.join(searchPath, dirName);
        if (fs.existsSync(testPath)) {
          fullPath = testPath;
          break;
        }
      }
      
      // Verifica che esista
      if (!fullPath || !fs.existsSync(fullPath)) {
        throw new Error('Cleanup directory not found');
      }
      
      // Conta file prima di eliminare per il log
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
      
      // Elimina ricorsivamente
      fs.rmSync(fullPath, { recursive: true, force: true });
      logger.info(`Deleted cleanup directory: ${dirName}`);
      
      // Log nell'Audit Log
      await auditLogService.log({
        action: 'CLEANUP_FOLDER_DELETED' as any,
        entityType: 'CleanupFolder',
        entityId: dirName,
        userId: userId || undefined,  // undefined se non c'è userId
        ipAddress: '127.0.0.1',
        userAgent: 'System',
        metadata: {
          folderName: dirName,
          filesDeleted: fileCount,
          totalSize: this.formatFileSize(totalSize)
        },
        success: true,
        severity: 'WARNING' as any,
        category: 'SYSTEM' as any
      });
      
      // Notifica admin dell'eliminazione
      if (userId) {
        const adminUsers = await prisma.user.findMany({
          where: {
            role: { in: ['ADMIN', 'SUPER_ADMIN'] },
            id: { not: userId }
          },
          select: { id: true }
        });
        
        for (const admin of adminUsers) {
          // Skippa se l'admin non ha un ID valido
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
          } catch (err: any) {
            logger.warn(`Impossibile inviare notifica eliminazione ad admin ${admin.id}:`, err.message);
          }
        }
      }
      
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
   * CLEANUP DEV FILES - Sposta i file temporanei in una cartella di cleanup
   */
  async cleanupDevelopmentFiles(): Promise<any> {
    logger.info('Starting development files cleanup...');
    
    try {
      const timestamp = format(new Date(), 'yyyy-MM-dd-HH-mm-ss');
      const cleanupDirName = `CLEANUP-${timestamp}`;
      const projectRoot = path.resolve(process.cwd(), '..');
      const cleanupPath = path.join(projectRoot, cleanupDirName);
      
      // Crea la directory di cleanup
      fs.mkdirSync(cleanupPath, { recursive: true });
      
      // Pattern dei file da spostare
      const patterns = [
        '*.backup-*',
        'test-*.sh',
        'fix-*.sh',
        'check-*.sh',
        'debug-*.sh',
        '*.fixed.ts',
        '*.fixed.tsx',
        'backup-*.sql',
        '*.mjs',
        'BACKUP-*'
      ];
      
      // Directory da escludere SEMPRE
      const excludeDirs = [
        'node_modules',
        '.git',
        'dist',
        'build',
        '.next',
        'backend/tokens',
        'backend/.wwebjs_auth',
        'backend/.wppconnect',
        'backend/ChromeProfile',
        'backend/userDataDir',
        'uploads',
        'database-backups'
      ];
      
      let movedCount = 0;
      
      // Funzione per verificare se un file matcha un pattern
      const matchesPattern = (filename: string): boolean => {
        return patterns.some(pattern => {
          const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\./g, '\\.'));
          return regex.test(filename);
        });
      };
      
      // Funzione ricorsiva per scansionare le directory
      const scanAndMove = (dir: string, depth = 0): void => {
        if (depth > 3) return; // Max 3 livelli di profondità
        
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const relativePath = path.relative(projectRoot, fullPath);
          
          // Salta le directory escluse
          if (excludeDirs.some(excludeDir => relativePath.startsWith(excludeDir))) {
            continue;
          }
          
          // Salta le cartelle CLEANUP-*
          if (item.startsWith('CLEANUP-')) {
            continue;
          }
          
          // Gestisci link simbolici rotti e file non accessibili
          let stat;
          try {
            // Usa lstatSync per gestire link simbolici
            stat = fs.lstatSync(fullPath);
            
            // Se è un link simbolico, verifica se il target esiste
            if (stat.isSymbolicLink()) {
              try {
                fs.statSync(fullPath);
              } catch (linkError) {
                logger.debug(`Skipping broken symlink: ${fullPath}`);
                continue;
              }
            }
          } catch (statError: any) {
            if (statError.code === 'ENOENT') {
              logger.debug(`File not found: ${fullPath}`);
            } else if (statError.code === 'EACCES') {
              logger.debug(`Permission denied: ${fullPath}`);
            } else {
              logger.debug(`Error accessing: ${fullPath} - ${statError.message}`);
            }
            continue;
          }
          
          if (stat.isDirectory()) {
            // Ricorsione nelle sottodirectory
            scanAndMove(fullPath, depth + 1);
          } else if (stat.isFile() && matchesPattern(item)) {
            // Sposta il file
            try {
              const destPath = path.join(cleanupPath, relativePath);
              const destDir = path.dirname(destPath);
              
              // Crea directory di destinazione se non esiste
              fs.mkdirSync(destDir, { recursive: true });
              
              // Sposta il file
              fs.renameSync(fullPath, destPath);
              movedCount++;
              logger.debug(`Moved: ${relativePath}`);
            } catch (error) {
              logger.error(`Failed to move ${item}:`, error);
            }
          }
        }
      };
      
      // Scansiona dalla root del progetto
      scanAndMove(projectRoot);
      
      // Crea README nella cartella di cleanup
      const readmeContent = `# Cleanup Directory - ${timestamp}\n\nQuesto directory contiene ${movedCount} file temporanei spostati dal sistema di cleanup.\n\nPuoi eliminare questa cartella in sicurezza se non hai bisogno di questi file.`;
      fs.writeFileSync(path.join(cleanupPath, 'README.md'), readmeContent);
      
      logger.info(`Cleanup completed: ${movedCount} files moved to ${cleanupDirName}`);
      
      // Registra in AuditLog
      await auditLogService.log({
        action: 'CLEANUP_EXECUTED' as any,
        entityType: 'Cleanup',
        entityId: cleanupDirName,
        userId: 'system',
        metadata: {
          filesProcessed: movedCount,
          targetDirectory: cleanupPath,
          patterns: patterns.length
        },
        success: true,
        severity: 'INFO' as any,
        category: 'SYSTEM' as any
      });
      
      // Invia notifica cleanup completato
      try {
        const adminUsers = await prisma.user.findMany({
          where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
          select: { id: true }
        });
        
        for (const admin of adminUsers) {
          await notificationService.sendToUser(admin.id, {
            title: 'Cleanup Completato',
            message: `Cleanup completato: ${movedCount} file spostati in ${cleanupDirName}`,
            type: 'cleanup_completed',
            priority: 'LOW',
            data: {
              movedCount,
              cleanupDir: cleanupDirName
            }
          }).catch(err => logger.warn('Failed to send cleanup notification:', err));
        }
      } catch (err) {
        logger.warn('Failed to get admin users for notification:', err);
      }
      
      return {
        movedCount,
        cleanupDir: cleanupDirName
      };
      
    } catch (error: any) {
      logger.error('Cleanup development files failed:', error);
      throw error;
    }
  }

  /**
   * 9. Lista tutte le cartelle di cleanup create
   */
  async listCleanupDirs(): Promise<any[]> {
    try {
      // Ottieni configurazione per sapere dove cercare
      const config = await cleanupConfigService.getCleanupConfig();
      const targetDirectory = config?.targetDirectory || '/Users/lucamambelli/Desktop/backup-cleanup';
      
      // Verifica che la directory esista
      if (!fs.existsSync(targetDirectory)) {
        logger.info(`Cleanup target directory does not exist: ${targetDirectory}`);
        return [];
      }
      
      // Leggi tutte le directory che iniziano con CLEANUP
      const entries = fs.readdirSync(targetDirectory, { withFileTypes: true });
      const cleanupDirs = [];
      
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.startsWith('CLEANUP')) {
          const dirPath = path.join(targetDirectory, entry.name);
          const stats = fs.statSync(dirPath);
          
          // Conta i file nella directory
          let fileCount = 0;
          let totalSize = 0;
          
          try {
            const countFiles = (dir: string) => {
              const items = fs.readdirSync(dir, { withFileTypes: true });
              for (const item of items) {
                const itemPath = path.join(dir, item.name);
                if (item.isDirectory()) {
                  countFiles(itemPath);
                } else {
                  fileCount++;
                  const fileStats = fs.statSync(itemPath);
                  totalSize += fileStats.size;
                }
              }
            };
            countFiles(dirPath);
          } catch (err) {
            logger.warn(`Error counting files in ${entry.name}:`, err);
          }
          
          cleanupDirs.push({
            name: entry.name,
            path: dirPath,
            size: this.formatFileSize(totalSize),
            createdAt: stats.birthtime,
            fileCount
          });
        }
      }
      
      // Ordina per data creazione (più recenti prima)
      cleanupDirs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      logger.info(`Found ${cleanupDirs.length} cleanup directories`);
      return cleanupDirs;
      
    } catch (error) {
      logger.error('Error listing cleanup directories:', error);
      return [];
    }
  }

  /**
   * 10. Elimina una cartella di cleanup
   */
  async deleteCleanupDir(name: string, userId: string): Promise<void> {
    try {
      // Ottieni configurazione
      const config = await cleanupConfigService.getCleanupConfig();
      const targetDirectory = config?.targetDirectory || '/Users/lucamambelli/Desktop/backup-cleanup';
      const dirPath = path.join(targetDirectory, name);
      
      // Verifica che la directory esista
      if (!fs.existsSync(dirPath)) {
        throw new Error(`Directory ${name} not found`);
      }
      
      // Verifica che sia effettivamente una cartella CLEANUP
      if (!name.startsWith('CLEANUP')) {
        throw new Error('Invalid cleanup directory name');
      }
      
      // Elimina ricorsivamente la directory
      fs.rmSync(dirPath, { recursive: true, force: true });
      
      logger.info(`Deleted cleanup directory: ${name}`);
      
      // Registra in AuditLog
      await auditLogService.log({
        action: 'CLEANUP_DIR_DELETED' as any,
        entityType: 'Cleanup',
        entityId: name,
        userId,
        metadata: {
          directoryName: name,
          path: dirPath
        },
        success: true,
        severity: 'INFO' as any,
        category: 'SYSTEM' as any
      });
      
    } catch (error) {
      logger.error(`Error deleting cleanup directory ${name}:`, error);
      throw error;
    }
  }

  /**
   * 8. PULIZIA BACKUP VECCHI (opzionale)
   */
  async cleanOldBackups(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Trova backup più vecchi del limite
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
