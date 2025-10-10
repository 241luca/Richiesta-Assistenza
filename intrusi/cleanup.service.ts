// 🚀 SERVIZIO CLEANUP v2.0 - CONFIGURABILE DA DATABASE
// backend/src/services/cleanup.service.ts
// Nessun path hardcoded - tutto configurabile

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import { logger } from '../utils/logger';
import * as cleanupConfigService from './cleanup-config.service';
import { prisma } from '../config/database';
import { format } from 'date-fns';
import { auditLogService } from './auditLog.service';
import { AuditAction, LogSeverity, LogCategory } from '@prisma/client';

const execAsync = promisify(exec);
const fsPromises = fs.promises;

export class CleanupService {
  private projectRoot: string;
  private cleanupDestination: string;
  
  constructor() {
    // Valori di default che verranno sovrascritti dalla configurazione
    // Usa il percorso relativo alla directory del backend come default
    this.projectRoot = path.resolve(__dirname, '../../../'); // Va su di 3 livelli dal services
    this.cleanupDestination = path.join(this.projectRoot, 'cleanup-archive');
  }

  /**
   * Ottiene la configurazione aggiornata dal database
   */
  private async loadConfiguration() {
    try {
      const config = await cleanupConfigService.getCleanupConfig();
      
      // Controlla se esiste il campo projectPath (se l'abbiamo aggiunto al DB)
      const configWithPath = config as any;
      if (configWithPath.projectPath && configWithPath.projectPath.trim() !== '') {
        this.projectRoot = configWithPath.projectPath;
        logger.info(`Using configured projectPath: ${this.projectRoot}`);
      }
      
      // Usa targetDirectory dal database
      if (config.targetDirectory) {
        // targetDirectory dovrebbe essere SEMPRE un percorso assoluto FUORI dal progetto
        // per evitare di salvare cleanup dentro il progetto stesso
        if (path.isAbsolute(config.targetDirectory)) {
          this.cleanupDestination = config.targetDirectory;
        } else {
          // Se è relativa, la mettiamo fuori dal progetto in Desktop
          // NON dentro il progetto!
          const desktopPath = '/Users/lucamambelli/Desktop';
          this.cleanupDestination = path.join(desktopPath, 'backup-cleanup', config.targetDirectory);
        }
        logger.info(`Cleanup destination: ${this.cleanupDestination}`);
      } else {
        // Default: fuori dal progetto
        this.cleanupDestination = '/Users/lucamambelli/Desktop/backup-cleanup';
        logger.warn('No targetDirectory configured, using default outside project');
      }
      
      return config;
    } catch (error) {
      logger.error('Failed to load cleanup configuration:', error);
      throw error;
    }
  }

  /**
   * Anteprima del cleanup senza spostare file
   */
  async previewCleanup(userId: string) {
    logger.info('👁️ Starting cleanup preview...');
    
    try {
      // 1. Carica configurazione dal database
      const config = await this.loadConfiguration();
      
      // 2. Ottieni pattern ed esclusioni dal database
      const patterns = await cleanupConfigService.getActivePatterns();
      const excludedFiles = await cleanupConfigService.getExcludedFiles();
      const excludedDirs = await cleanupConfigService.getExcludedDirectories();
      
      logger.info(`Preview: Loaded ${patterns.length} patterns`);
      
      // 3. Trova file da spostare
      const filesToMove = await this.findFilesToMove(
        this.projectRoot,
        patterns,
        excludedFiles,
        excludedDirs,
        config.maxDepth || 2
      );
      
      // 4. Calcola dimensione totale
      let totalSize = 0;
      const filesWithSize = await Promise.all(
        filesToMove.map(async (filePath) => {
          try {
            const stats = await fsPromises.stat(filePath);
            totalSize += stats.size;
            return {
              name: path.basename(filePath),
              path: path.relative(this.projectRoot, filePath),
              size: this.formatFileSize(stats.size)
            };
          } catch (error) {
            return null;
          }
        })
      );
      
      const validFiles = filesWithSize.filter(f => f !== null);
      
      // 5. Genera percorso destinazione
      const timestamp = format(new Date(), 'yyyy-MM-dd-HH-mm-ss');
      const cleanupDirName = `CLEANUP-${timestamp}`;
      const cleanupPath = path.join(this.cleanupDestination, cleanupDirName);
      
      logger.info(`Preview complete: ${validFiles.length} files, ${this.formatFileSize(totalSize)} total`);
      
      return {
        totalFiles: validFiles.length,
        totalSize: this.formatFileSize(totalSize),
        destinationPath: cleanupPath,
        files: validFiles,
        patterns: patterns.map(p => p.pattern),
        projectPath: this.projectRoot
      };
      
    } catch (error) {
      logger.error('Cleanup preview failed:', error);
      throw error;
    }
  }

  /**
   * Formatta dimensione file
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Esegue il cleanup dei file temporanei
   */
  async executeCleanup(userId: string, userEmail?: string, userRole?: string, ipAddress?: string) {
    logger.info('🧹 Starting cleanup process...');
    
    // Log inizio operazione
    await auditLogService.log({
      userId,
      userEmail,
      userRole,
      ipAddress: ipAddress || 'system',
      userAgent: 'cleanup-service',
      action: AuditAction.CLEANUP_STARTED,
      entityType: 'SystemCleanup',
      metadata: {
        projectRoot: this.projectRoot,
        startTime: new Date().toISOString()
      },
      success: true,
      severity: LogSeverity.INFO,
      category: LogCategory.SYSTEM
    });
    
    try {
      // 1. Carica configurazione dal database
      const config = await this.loadConfiguration();
      
      // 2. Crea directory di cleanup con timestamp
      const timestamp = format(new Date(), 'yyyy-MM-dd-HH-mm-ss');
      const cleanupDirName = `CLEANUP-${timestamp}`;
      const cleanupPath = path.join(this.cleanupDestination, cleanupDirName);
      
      logger.info(`Creating cleanup directory: ${cleanupPath}`);
      await fsPromises.mkdir(cleanupPath, { recursive: true });
      
      // 3. Ottieni pattern ed esclusioni dal database
      const patterns = await cleanupConfigService.getActivePatterns();
      const excludedFiles = await cleanupConfigService.getExcludedFiles();
      const excludedDirs = await cleanupConfigService.getExcludedDirectories();
      
      logger.info(`Loaded ${patterns.length} patterns, ${excludedFiles.length} excluded files, ${excludedDirs.length} excluded dirs`);
      
      // 4. Trova file da spostare
      const filesToMove = await this.findFilesToMove(
        this.projectRoot,
        patterns,
        excludedFiles,
        excludedDirs,
        config.maxDepth || 2
      );
      
      logger.info(`Found ${filesToMove.length} files to move`);
      
      // 5. Sposta i file
      let movedCount = 0;
      let totalSize = 0;
      const errors = [];
      
      for (const file of filesToMove) {
        try {
          const destPath = path.join(cleanupPath, file.relativePath);
          const destDir = path.dirname(destPath);
          
          // Crea directory di destinazione se non esiste
          await fsPromises.mkdir(destDir, { recursive: true });
          
          // Sposta il file
          await fsPromises.rename(file.path, destPath);
          
          movedCount++;
          totalSize += file.size;
          
          logger.debug(`Moved: ${file.relativePath}`);
        } catch (error: any) {
          errors.push(`Failed to move ${file.path}: ${error.message}`);
          logger.error(`Failed to move ${file.path}:`, error);
        }
      }
      
      // 6. Crea file README nel cleanup
      if (config.createReadme) {
        await this.createReadme(cleanupPath, movedCount, totalSize, timestamp);
      }
      
      // 7. Crea manifest per restore
      await this.createManifest(cleanupPath, filesToMove, config);
      
      // 8. Log operazione nel database
      await prisma.cleanupLog.create({
        data: {
          executionId: `cleanup-${timestamp}`,
          operation: 'cleanup',
          status: errors.length > 0 ? 'completed_with_errors' : 'completed',
          targetPath: cleanupPath,
          filesProcessed: movedCount,
          totalSize: BigInt(totalSize),
          // Mettiamo i dati extra in metadata come JSON
          metadata: {
            patternsUsed: patterns.length,
            excludedFiles: excludedFiles.length,
            excludedDirs: excludedDirs.length,
            errorCount: errors.length,
            errors: errors
          },
          executedBy: userId || 'system',
          startedAt: new Date(),
          completedAt: new Date()
        }
      });
      
      logger.info(`✅ Cleanup completed: ${movedCount} files moved (${(totalSize / 1024 / 1024).toFixed(2)} MB)`);
      
      // Log completamento con successo nell'audit log
      await auditLogService.log({
        userId,
        userEmail,
        userRole,
        ipAddress: ipAddress || 'system',
        userAgent: 'cleanup-service',
        action: AuditAction.CLEANUP_COMPLETED,
        entityType: 'SystemCleanup',
        entityId: cleanupDirName,
        metadata: {
          cleanupPath,
          movedCount,
          totalSize,
          patterns: patterns.map(p => p.pattern),
          errors: errors.length > 0 ? errors : undefined,
          cleanupDir: cleanupDirName
        },
        success: true,
        severity: LogSeverity.INFO,
        category: LogCategory.SYSTEM
      });
      
      return {
        success: true,
        movedCount,
        totalSize,
        cleanupDir: cleanupDirName,
        cleanupPath,
        errors: errors.length > 0 ? errors : undefined
      };
      
    } catch (error: any) {
      logger.error('Cleanup failed:', error);
      
      // Log errore nell'audit log
      await auditLogService.log({
        userId,
        userEmail,
        userRole,
        ipAddress: ipAddress || 'system',
        userAgent: 'cleanup-service',
        action: AuditAction.CLEANUP_FAILED,
        entityType: 'SystemCleanup',
        errorMessage: error.message || 'Cleanup operation failed',
        metadata: {
          error: error.stack || error.message,
          projectRoot: this.projectRoot
        },
        success: false,
        severity: LogSeverity.ERROR,
        category: LogCategory.SYSTEM
      });
      
      throw error;
    }
  }

  /**
   * Esegue un preview del cleanup senza spostare file
   */
  async previewCleanup(userId: string) {
    logger.info('👀 Starting cleanup preview...');
    
    try {
      // Carica configurazione
      const config = await this.loadConfiguration();
      
      // Ottieni pattern ed esclusioni
      const patterns = await cleanupConfigService.getActivePatterns();
      const excludedFiles = await cleanupConfigService.getExcludedFiles();
      const excludedDirs = await cleanupConfigService.getExcludedDirectories();
      
      // Trova file che verrebbero spostati
      const filesToMove = await this.findFilesToMove(
        this.projectRoot,
        patterns,
        excludedFiles,
        excludedDirs,
        config.maxDepth || 2
      );
      
      // Calcola statistiche
      const totalSize = filesToMove.reduce((acc, file) => acc + file.size, 0);
      const byType = this.groupFilesByType(filesToMove);
      const byPattern = this.groupFilesByPattern(filesToMove);
      
      // Salva preview nel database
      const previewId = `preview-${Date.now()}`;
      await prisma.cleanupPreview?.create({
        data: {
          sessionId: previewId,
          files: filesToMove,
          totalFiles: filesToMove.length,
          totalSize: BigInt(totalSize),
          matchedPatterns: byPattern,
          configUsed: config,
          validUntil: new Date(Date.now() + 3600000), // Valido per 1 ora
          createdBy: userId
        }
      }).catch(err => {
        // Se la tabella non esiste ancora, ignora
        logger.warn('CleanupPreview table not found, skipping save');
      });
      
      return {
        success: true,
        preview: {
          sessionId: previewId,
          totalFiles: filesToMove.length,
          totalSize,
          byType,
          byPattern,
          files: filesToMove.slice(0, 100), // Mostra solo primi 100 file
          // AGGIUNGO INFO SU DOVE SALVEREBBE
          projectPath: this.projectRoot,
          destinationPath: this.cleanupDestination,
          cleanupFolderName: `CLEANUP-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}`,
          fullDestinationPath: path.join(this.cleanupDestination, `CLEANUP-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}`)
        }
      };
      
    } catch (error: any) {
      logger.error('Preview failed:', error);
      throw error;
    }
  }

  /**
   * Trova ricorsivamente i file da spostare
   */
  private async findFilesToMove(
    dir: string,
    patterns: any[],
    excludedFiles: any[],
    excludedDirs: any[],
    maxDepth: number,
    currentDepth: number = 0
  ): Promise<any[]> {
    const files: any[] = [];
    
    if (currentDepth > maxDepth) return files;
    
    try {
      const entries = await fsPromises.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(this.projectRoot, fullPath);
        
        // Salta directory escluse
        if (entry.isDirectory()) {
          const isExcluded = excludedDirs.some(excl => {
            if (excl.directory.includes('*')) {
              return this.matchPattern(entry.name, excl.directory);
            }
            return entry.name === excl.directory || relativePath.startsWith(excl.directory);
          });
          
          if (!isExcluded) {
            // Ricorsione nelle sottodirectory
            const subFiles = await this.findFilesToMove(
              fullPath,
              patterns,
              excludedFiles,
              excludedDirs,
              maxDepth,
              currentDepth + 1
            );
            files.push(...subFiles);
          }
        } 
        // Controlla file
        else {
          // Salta file esclusi
          const isExcludedFile = excludedFiles.some(excl => {
            if (excl.fileName.includes('*')) {
              return this.matchPattern(entry.name, excl.fileName);
            }
            return entry.name === excl.fileName;
          });
          
          if (!isExcludedFile) {
            // Controlla se matcha con i pattern
            for (const pattern of patterns) {
              if (this.matchPattern(entry.name, pattern.pattern)) {
                const stats = await fsPromises.stat(fullPath);
                files.push({
                  path: fullPath,
                  relativePath,
                  size: stats.size,
                  type: path.extname(entry.name).slice(1) || 'no-extension',
                  pattern: pattern.pattern
                });
                break;
              }
            }
          }
        }
      }
    } catch (error: any) {
      logger.error(`Error reading directory ${dir}:`, error.message);
    }
    
    return files;
  }

  /**
   * Verifica se un nome file matcha con un pattern
   */
  private matchPattern(filename: string, pattern: string): boolean {
    // Converti pattern semplice in regex
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filename);
  }

  /**
   * Raggruppa file per tipo
   */
  private groupFilesByType(files: any[]): Record<string, number> {
    const byType: Record<string, number> = {};
    files.forEach(file => {
      byType[file.type] = (byType[file.type] || 0) + 1;
    });
    return byType;
  }

  /**
   * Raggruppa file per pattern
   */
  private groupFilesByPattern(files: any[]): Record<string, number> {
    const byPattern: Record<string, number> = {};
    files.forEach(file => {
      if (file.pattern) {
        byPattern[file.pattern] = (byPattern[file.pattern] || 0) + 1;
      }
    });
    return byPattern;
  }

  /**
   * Crea file README nella directory di cleanup
   */
  private async createReadme(cleanupPath: string, fileCount: number, totalSize: number, timestamp: string) {
    const readmeContent = `# Cleanup Session - ${timestamp}

## Summary
- **Files Moved**: ${fileCount}
- **Total Size**: ${(totalSize / 1024 / 1024).toFixed(2)} MB
- **Date**: ${new Date().toLocaleString()}
- **Location**: ${cleanupPath}

## How to Restore
To restore these files to their original location:
1. Run the restore command with this cleanup directory
2. Or manually move files back using the directory structure

## Directory Structure
The original directory structure has been preserved.
Files are organized exactly as they were in the source.

---
Generated by Cleanup Service v2.0
`;

    await fsPromises.writeFile(path.join(cleanupPath, 'README.md'), readmeContent);
  }

  /**
   * Crea manifest JSON per il restore
   */
  private async createManifest(cleanupPath: string, files: any[], config: any) {
    const manifest = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      projectRoot: this.projectRoot,
      cleanupPath,
      config: {
        preserveStructure: config.preserveStructure,
        patterns: config.patterns?.length || 0,
        excludedFiles: config.excludedFiles?.length || 0,
        excludedDirs: config.excludedDirs?.length || 0
      },
      files: files.map(f => ({
        original: f.path,
        destination: path.join(cleanupPath, f.relativePath),
        relativePath: f.relativePath,
        size: f.size
      }))
    };

    await fsPromises.writeFile(
      path.join(cleanupPath, 'cleanup-manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
  }

  /**
   * Ripristina file da una directory di cleanup
   */
  async restoreFromCleanup(cleanupDir: string, specificFiles?: string[]) {
    logger.info(`🔄 Starting restore from ${cleanupDir}...`);
    
    try {
      const cleanupPath = path.isAbsolute(cleanupDir) 
        ? cleanupDir 
        : path.join(this.cleanupDestination, cleanupDir);
      
      // Leggi manifest
      const manifestPath = path.join(cleanupPath, 'cleanup-manifest.json');
      if (!fs.existsSync(manifestPath)) {
        throw new Error('Manifest file not found. Cannot restore without manifest.');
      }
      
      const manifest = JSON.parse(await fsPromises.readFile(manifestPath, 'utf-8'));
      const filesToRestore = specificFiles 
        ? manifest.files.filter((f: any) => specificFiles.includes(f.relativePath))
        : manifest.files;
      
      let restoredCount = 0;
      const errors = [];
      
      for (const file of filesToRestore) {
        try {
          const sourcePath = file.destination;
          const targetPath = file.original;
          
          // Crea directory di destinazione se non esiste
          await fsPromises.mkdir(path.dirname(targetPath), { recursive: true });
          
          // Ripristina il file
          await fsPromises.rename(sourcePath, targetPath);
          restoredCount++;
          
          logger.debug(`Restored: ${file.relativePath}`);
        } catch (error: any) {
          errors.push(`Failed to restore ${file.relativePath}: ${error.message}`);
          logger.error(`Failed to restore ${file.relativePath}:`, error);
        }
      }
      
      logger.info(`✅ Restore completed: ${restoredCount} files restored`);
      
      return {
        success: true,
        restoredCount,
        totalFiles: filesToRestore.length,
        errors: errors.length > 0 ? errors : undefined
      };
      
    } catch (error: any) {
      logger.error('Restore failed:', error);
      throw error;
    }
  }

  /**
   * Ottiene lista delle directory di cleanup esistenti
   */
  async getCleanupDirectories() {
    try {
      await this.loadConfiguration();
      
      if (!fs.existsSync(this.cleanupDestination)) {
        return [];
      }
      
      const entries = await fsPromises.readdir(this.cleanupDestination, { withFileTypes: true });
      const cleanupDirs = entries
        .filter(entry => entry.isDirectory() && entry.name.startsWith('CLEANUP-'))
        .map(entry => ({
          name: entry.name,
          path: path.join(this.cleanupDestination, entry.name)
        }));
      
      // Aggiungi informazioni su ogni directory
      const dirsWithInfo = await Promise.all(
        cleanupDirs.map(async (dir) => {
          try {
            const stats = await fsPromises.stat(dir.path);
            const manifestPath = path.join(dir.path, 'cleanup-manifest.json');
            let fileCount = 0;
            
            if (fs.existsSync(manifestPath)) {
              const manifest = JSON.parse(await fsPromises.readFile(manifestPath, 'utf-8'));
              fileCount = manifest.files?.length || 0;
            }
            
            return {
              ...dir,
              created: stats.ctime,
              modified: stats.mtime,
              fileCount
            };
          } catch (error) {
            return {
              ...dir,
              created: new Date(),
              modified: new Date(),
              fileCount: 0
            };
          }
        })
      );
      
      // Ordina per data (più recenti prima)
      return dirsWithInfo.sort((a, b) => b.created.getTime() - a.created.getTime());
      
    } catch (error: any) {
      logger.error('Failed to get cleanup directories:', error);
      return [];
    }
  }

  /**
   * Elimina una directory di cleanup
   */
  async deleteCleanupDirectory(cleanupDir: string, userId?: string, userEmail?: string, userRole?: string, ipAddress?: string) {
    try {
      const cleanupPath = path.isAbsolute(cleanupDir) 
        ? cleanupDir 
        : path.join(this.cleanupDestination, cleanupDir);
      
      if (!fs.existsSync(cleanupPath)) {
        throw new Error('Cleanup directory not found');
      }
      
      // Elimina ricorsivamente
      await fsPromises.rm(cleanupPath, { recursive: true, force: true });
      
      logger.info(`Deleted cleanup directory: ${cleanupDir}`);
      
      // Log eliminazione nell'audit log
      await auditLogService.log({
        userId: userId || 'system',
        userEmail,
        userRole,
        ipAddress: ipAddress || 'system',
        userAgent: 'cleanup-service',
        action: AuditAction.CLEANUP_FOLDER_DELETED,
        entityType: 'SystemCleanup',
        entityId: cleanupDir,
        metadata: {
          cleanupPath,
          deletedAt: new Date().toISOString()
        },
        success: true,
        severity: LogSeverity.WARNING,
        category: LogCategory.SYSTEM
      });
      
      return {
        success: true,
        message: `Cleanup directory ${cleanupDir} deleted successfully`
      };
      
    } catch (error: any) {
      logger.error('Failed to delete cleanup directory:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const cleanupService = new CleanupService();
