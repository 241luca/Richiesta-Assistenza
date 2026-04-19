import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { 
  CleanupConfig, 
  CleanupPattern, 
  CleanupExcludeFile, 
  CleanupExcludeDirectory,
  CleanupSchedule,
  CleanupLog,
  CleanupStats,
  Prisma
} from '@prisma/client';

// ==========================================
// TYPES & INTERFACES
// ==========================================

interface UpdateConfigData {
  targetDirectory?: string;
  directoryFormat?: string;
  maxDepth?: number;
  bufferSize?: number;
  timeout?: number;
  retentionDays?: number;
  autoCleanup?: boolean;
  autoCleanupDays?: number;
  createReadme?: boolean;
  preserveStructure?: boolean;
  notifyOnCleanup?: boolean;
  notifyEmails?: string[];
  backupBaseDir?: string;
  isActive?: boolean;
}

interface CreatePatternData {
  pattern: string;
  description?: string;
  priority?: number;
  isActive?: boolean;
}

interface UpdatePatternData {
  pattern?: string;
  description?: string;
  priority?: number;
  isActive?: boolean;
}

interface CreateExcludedFileData {
  fileName: string;
  description?: string;
  criticality?: string;
  reason?: string;
  isActive?: boolean;
}

interface UpdateExcludedFileData {
  fileName?: string;
  description?: string;
  criticality?: string;
  reason?: string;
  isActive?: boolean;
}

interface CreateExcludedDirectoryData {
  directory: string;
  description?: string;
  reason?: string;
  isActive?: boolean;
}

interface UpdateExcludedDirectoryData {
  directory?: string;
  description?: string;
  reason?: string;
  isActive?: boolean;
}

interface CreateScheduleData {
  name: string;
  description?: string;
  cronExpression: string;
  isActive?: boolean;
}

interface UpdateScheduleData {
  name?: string;
  description?: string;
  cronExpression?: string;
  isActive?: boolean;
}

interface LogExecutionData {
  executionId: string;
  operation: string;
  status: string;
  targetPath?: string;
  filesProcessed?: number;
  totalSize?: bigint;
  executedBy?: string;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
}

interface CleanupLogFilters {
  executionId?: string;
  operation?: string;
  status?: string;
  executedBy?: string;
  from?: string;
  to?: string;
  limit?: number;
}

// ==========================================
// CONFIGURAZIONE PRINCIPALE
// ==========================================

export async function getCleanupConfig(): Promise<CleanupConfig> {
  try {
    let config = await prisma.cleanupConfig.findFirst({
      where: { name: 'default', isActive: true }
    });

    // Se non esiste, creiamo la configurazione di default
    if (!config) {
      config = await prisma.cleanupConfig.create({
        data: {
          name: 'default',
          isActive: true,
          targetDirectory: 'CLEANUP',
          directoryFormat: 'CLEANUP-{YYYY}-{MM}-{DD}-{HH}-{mm}-{ss}',
          maxDepth: 2,
          bufferSize: 104857600, // 100MB
          timeout: 60000, // 60 secondi
          retentionDays: 30,
          autoCleanup: false,
          autoCleanupDays: 30,
          createReadme: true,
          preserveStructure: true,
          notifyOnCleanup: true,
          createdAt: new Date(),
          updatedAt: new Date()
        } as any
      });

      // Inizializza anche le configurazioni di sistema
      await initializeSystemDefaults();
    }

    return config;
  } catch (error: unknown) {
    logger.error('Errore nel recupero configurazione cleanup:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function updateCleanupConfig(data: UpdateConfigData): Promise<CleanupConfig> {
  try {
    const config = await prisma.cleanupConfig.upsert({
      where: { name: 'default' },
      update: {
        ...data,
        updatedAt: new Date()
      } as any,
      create: {
        name: 'default',
        isActive: true,
        targetDirectory: 'CLEANUP',
        directoryFormat: 'CLEANUP-{YYYY}-{MM}-{DD}-{HH}-{mm}-{ss}',
        maxDepth: 2,
        bufferSize: 104857600,
        timeout: 60000,
        retentionDays: 30,
        autoCleanup: false,
        autoCleanupDays: 30,
        createReadme: true,
        preserveStructure: true,
        notifyOnCleanup: true,
        backupBaseDir: '/Users/lucamambelli/Desktop/backup-ra',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data
      } as any
    });

    logger.info('Configurazione cleanup aggiornata');
    return config;
  } catch (error: unknown) {
    logger.error('Errore nell\'aggiornamento configurazione:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// ==========================================
// PATTERN
// ==========================================

export async function getCleanupPatterns(includeInactive = false): Promise<CleanupPattern[]> {
  try {
    const where: Prisma.CleanupPatternWhereInput = includeInactive ? {} : { isActive: true };
    
    const patterns = await prisma.cleanupPattern.findMany({
      where,
      orderBy: [
        { priority: 'asc' },
        { pattern: 'asc' }
      ]
    });

    return patterns;
  } catch (error: unknown) {
    logger.error('Errore nel recupero pattern:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function createCleanupPattern(data: CreatePatternData): Promise<CleanupPattern> {
  try {
    const pattern = await prisma.cleanupPattern.create({
      data: {
        ...data,
        priority: data.priority ?? 0,
        isActive: data.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    logger.info('Pattern cleanup creato:', pattern.pattern);
    return pattern;
  } catch (error: unknown) {
    logger.error('Errore nella creazione pattern:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function updateCleanupPattern(id: string, data: UpdatePatternData): Promise<CleanupPattern> {
  try {
    const pattern = await prisma.cleanupPattern.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });

    logger.info('Pattern cleanup aggiornato:', pattern.pattern);
    return pattern;
  } catch (error: unknown) {
    logger.error('Errore nell\'aggiornamento pattern:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function deleteCleanupPattern(id: string): Promise<{ success: boolean }> {
  try {
    await prisma.cleanupPattern.delete({
      where: { id }
    });

    logger.info('Pattern cleanup eliminato:', id);
    return { success: true };
  } catch (error: unknown) {
    logger.error('Errore nell\'eliminazione pattern:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// ==========================================
// FILE ESCLUSI
// ==========================================

export async function getExcludedFiles(includeInactive = false): Promise<CleanupExcludeFile[]> {
  try {
    const where: Prisma.CleanupExcludeFileWhereInput = includeInactive ? {} : { isActive: true };
    
    const files = await prisma.cleanupExcludeFile.findMany({
      where,
      orderBy: [
        { criticality: 'desc' },
        { fileName: 'asc' }
      ]
    });

    return files;
  } catch (error: unknown) {
    logger.error('Errore nel recupero file esclusi:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function createExcludedFile(data: CreateExcludedFileData): Promise<CleanupExcludeFile> {
  try {
    const file = await prisma.cleanupExcludeFile.create({
      data: {
        ...data,
        isActive: data.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    logger.info('File escluso aggiunto:', file.fileName);
    return file;
  } catch (error: unknown) {
    logger.error('Errore nell\'aggiunta file escluso:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function updateExcludedFile(id: string, data: UpdateExcludedFileData): Promise<CleanupExcludeFile> {
  try {
    const file = await prisma.cleanupExcludeFile.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });

    logger.info('File escluso aggiornato:', file.fileName);
    return file;
  } catch (error: unknown) {
    logger.error('Errore nell\'aggiornamento file escluso:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function deleteExcludedFile(id: string): Promise<{ success: boolean }> {
  try {
    await prisma.cleanupExcludeFile.delete({
      where: { id }
    });

    logger.info('File escluso rimosso:', id);
    return { success: true };
  } catch (error: unknown) {
    logger.error('Errore nella rimozione file escluso:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// ==========================================
// DIRECTORY ESCLUSE
// ==========================================

export async function getExcludedDirectories(includeInactive = false): Promise<CleanupExcludeDirectory[]> {
  try {
    const where: Prisma.CleanupExcludeDirectoryWhereInput = includeInactive ? {} : { isActive: true };
    
    const dirs = await prisma.cleanupExcludeDirectory.findMany({
      where,
      orderBy: { directory: 'asc' }
    });

    return dirs;
  } catch (error: unknown) {
    logger.error('Errore nel recupero directory escluse:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function createExcludedDirectory(data: CreateExcludedDirectoryData): Promise<CleanupExcludeDirectory> {
  try {
    const dir = await prisma.cleanupExcludeDirectory.create({
      data: {
        ...data,
        isActive: data.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    logger.info('Directory esclusa aggiunta:', dir.directory);
    return dir;
  } catch (error: unknown) {
    logger.error('Errore nell\'aggiunta directory esclusa:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function updateExcludedDirectory(id: string, data: UpdateExcludedDirectoryData): Promise<CleanupExcludeDirectory> {
  try {
    const dir = await prisma.cleanupExcludeDirectory.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });

    logger.info('Directory esclusa aggiornata:', dir.directory);
    return dir;
  } catch (error: unknown) {
    logger.error('Errore nell\'aggiornamento directory esclusa:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function deleteExcludedDirectory(id: string): Promise<{ success: boolean }> {
  try {
    await prisma.cleanupExcludeDirectory.delete({
      where: { id }
    });

    logger.info('Directory esclusa eliminata:', id);
    return { success: true };
  } catch (error: unknown) {
    logger.error('Errore nell\'eliminazione directory esclusa:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// ==========================================
// PROGRAMMAZIONE
// ==========================================

export async function getCleanupSchedules(includeInactive = false): Promise<CleanupSchedule[]> {
  try {
    const where: Prisma.CleanupScheduleWhereInput = includeInactive ? {} : { isActive: true };
    
    const schedules = await prisma.cleanupSchedule.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    return schedules;
  } catch (error: unknown) {
    logger.error('Errore nel recupero programmazioni:', error instanceof Error ? error.message : String(error));
    // Ritorna array vuoto se la tabella non esiste ancora
    return [];
  }
}

export async function createCleanupSchedule(data: CreateScheduleData): Promise<CleanupSchedule> {
  try {
    const schedule = await prisma.cleanupSchedule.create({
      data: {
        ...data,
        isActive: data.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any // Type assertion needed for complex Prisma input
    });

    logger.info('Programmazione cleanup creata:', schedule.name);
    return schedule;
  } catch (error: unknown) {
    logger.error('Errore nella creazione programmazione:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function updateCleanupSchedule(id: string, data: UpdateScheduleData): Promise<CleanupSchedule> {
  try {
    const schedule = await prisma.cleanupSchedule.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });

    logger.info('Programmazione cleanup aggiornata:', schedule.name);
    return schedule;
  } catch (error: unknown) {
    logger.error('Errore nell\'aggiornamento programmazione:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function deleteCleanupSchedule(id: string): Promise<{ success: boolean }> {
  try {
    await prisma.cleanupSchedule.delete({
      where: { id }
    });

    logger.info('Programmazione cleanup eliminata:', id);
    return { success: true };
  } catch (error: unknown) {
    logger.error('Errore nell\'eliminazione programmazione:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// ==========================================
// LOG E STATISTICHE
// ==========================================

export async function logCleanupExecution(data: LogExecutionData): Promise<CleanupLog> {
  try {
    const log = await prisma.cleanupLog.create({
      data: {
        ...data,
        createdAt: new Date()
      } as any // Type assertion needed for complex Prisma input
    });

    // Aggiorna anche le statistiche
    await updateCleanupStats(data);

    return log;
  } catch (error: unknown) {
    logger.error('Errore nel log esecuzione cleanup:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

async function updateCleanupStats(executionData: LogExecutionData): Promise<CleanupStats | undefined> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await prisma.cleanupStats.upsert({
      where: { date: today },
      update: {
        totalExecutions: { increment: 1 },
        successfulRuns: executionData.status === 'completed' ? { increment: 1 } : undefined,
        failedRuns: executionData.status === 'failed' ? { increment: 1 } : undefined,
        totalFilesCleanup: { increment: executionData.filesProcessed || 0 },
        totalSizeCleanup: { increment: executionData.totalSize || BigInt(0) },
        lastExecutionId: executionData.executionId,
        updatedAt: new Date()
      },
      create: {
        date: today,
        totalExecutions: 1,
        successfulRuns: executionData.status === 'completed' ? 1 : 0,
        failedRuns: executionData.status === 'failed' ? 1 : 0,
        totalFilesCleanup: executionData.filesProcessed || 0,
        totalSizeCleanup: executionData.totalSize || BigInt(0),
        lastExecutionId: executionData.executionId
      }
    });

    return stats;
  } catch (error: unknown) {
    logger.error('Errore nell\'aggiornamento statistiche:', error instanceof Error ? error.message : String(error));
    // Non rilancio l'errore per non bloccare il log principale
    return undefined;
  }
}

export async function getCleanupStats(days = 30): Promise<CleanupStats[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await prisma.cleanupStats.findMany({
      where: {
        date: { gte: startDate }
      },
      orderBy: { date: 'desc' }
    });

    return stats;
  } catch (error: unknown) {
    logger.error('Errore nel recupero statistiche:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function getCleanupLogs(filters: CleanupLogFilters = {}): Promise<CleanupLog[]> {
  try {
    const where: Prisma.CleanupLogWhereInput = {};
    
    if (filters.executionId) {
      where.executionId = filters.executionId;
    }
    
    if (filters.operation) {
      where.operation = filters.operation;
    }
    
    if (filters.status) {
      where.status = filters.status;
    }
    
    if (filters.executedBy) {
      where.executedBy = filters.executedBy;
    }
    
    if (filters.from || filters.to) {
      where.startedAt = {};
      if (filters.from) {
        where.startedAt.gte = new Date(filters.from);
      }
      if (filters.to) {
        where.startedAt.lte = new Date(filters.to);
      }
    }

    const logs = await prisma.cleanupLog.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: filters.limit || 100
    });

    return logs;
  } catch (error: unknown) {
    logger.error('Errore nel recupero log cleanup:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// ==========================================
// INIZIALIZZAZIONE DEFAULT DI SISTEMA
// ==========================================

async function initializeSystemDefaults(): Promise<void> {
  try {
    logger.info('Inizializzazione configurazioni di sistema per cleanup...');

    // Pattern di sistema
    const systemPatterns = [
      { pattern: '*.backup-*', description: 'File di backup temporanei', priority: 10 },
      { pattern: 'fix-*.sh', description: 'Script di fix temporanei', priority: 20 },
      { pattern: 'test-*.sh', description: 'Script di test', priority: 30 },
      { pattern: 'check-*.sh', description: 'Script di controllo', priority: 40 },
      { pattern: 'debug-*.sh', description: 'Script di debug', priority: 50 },
      { pattern: '*.fixed.ts', description: 'File TypeScript corretti', priority: 60 },
      { pattern: '*.fixed.tsx', description: 'File React corretti', priority: 70 },
      { pattern: 'backup-*.sql', description: 'Backup SQL temporanei', priority: 80 },
      { pattern: '*.mjs', description: 'File JavaScript ES modules', priority: 90 },
      { pattern: 'BACKUP-*', description: 'Cartelle di backup', priority: 100 }
    ];

    for (const patternData of systemPatterns) {
      const existing = await prisma.cleanupPattern.findFirst({
        where: { pattern: patternData.pattern }
      });
      if (!existing) {
        await prisma.cleanupPattern.create({
          data: {
            ...patternData,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }
    }

    // File esclusi di sistema
    const systemExcludedFiles = [
      { fileName: '.env', description: 'File di ambiente', criticality: 'critical', reason: 'Contiene chiavi sensibili' },
      { fileName: '.env.local', description: 'File di ambiente locale', criticality: 'critical', reason: 'Contiene chiavi sensibili' },
      { fileName: '.env.production', description: 'File di ambiente produzione', criticality: 'critical', reason: 'Contiene chiavi sensibili' },
      { fileName: '*.log', description: 'File di log', criticality: 'high', reason: 'Contengono informazioni di debug' },
      { fileName: '*.pid', description: 'File PID processi', criticality: 'normal', reason: 'File di sistema' },
      { fileName: 'package-lock.json', description: 'Lock file npm', criticality: 'high', reason: 'File di dipendenze importante' },
      { fileName: 'yarn.lock', description: 'Lock file yarn', criticality: 'high', reason: 'File di dipendenze importante' },
      { fileName: '*.key', description: 'File di chiavi', criticality: 'critical', reason: 'Contengono chiavi crittografiche' },
      { fileName: '*.pem', description: 'Certificati PEM', criticality: 'critical', reason: 'Certificati di sicurezza' },
      { fileName: '*.crt', description: 'Certificati CRT', criticality: 'critical', reason: 'Certificati di sicurezza' }
    ];

    for (const fileData of systemExcludedFiles) {
      const existing = await prisma.cleanupExcludeFile.findFirst({
        where: { fileName: fileData.fileName }
      });
      if (!existing) {
        await prisma.cleanupExcludeFile.create({
          data: {
            ...fileData,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }
    }

    // Directory escluse di sistema
    const systemExcludedDirs = [
      { directory: 'node_modules', description: 'Dipendenze Node.js', reason: 'Directory molto grande e ricostruibile' },
      { directory: '.git', description: 'Repository Git', reason: 'Contiene storia del progetto' },
      { directory: 'dist', description: 'Build output', reason: 'Ricostruibile dal codice sorgente' },
      { directory: 'build', description: 'Build output', reason: 'Ricostruibile dal codice sorgente' },
      { directory: '.next', description: 'Next.js build', reason: 'Ricostruibile dal codice sorgente' },
      { directory: 'CLEANUP-*', description: 'Cartelle di cleanup', reason: 'Contengono file già puliti' },
      { directory: 'backend/backups', description: 'Backup backend', reason: 'File di backup importanti' },
      { directory: 'uploads', description: 'File caricati', reason: 'Contengono dati utente importanti' }
    ];

    for (const dirData of systemExcludedDirs) {
      const existing = await prisma.cleanupExcludeDirectory.findFirst({
        where: { directory: dirData.directory }
      });
      if (!existing) {
        await prisma.cleanupExcludeDirectory.create({
          data: {
            ...dirData,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }
    }

    logger.info('Configurazioni di sistema inizializzate con successo');
  } catch (error: unknown) {
    logger.error('Errore nell\'inizializzazione delle configurazioni di sistema:', error instanceof Error ? error.message : String(error));
    // Non rilancio l'errore per non bloccare l'avvio
  }
}

// ==========================================
// VALIDAZIONE CONFIGURAZIONE
// ==========================================

export function validateCleanupConfig(config: Partial<CleanupConfig>): string[] {
  const errors: string[] = [];

  if (config.maxDepth !== undefined && (config.maxDepth < 1 || config.maxDepth > 10)) {
    errors.push('maxDepth deve essere compreso tra 1 e 10');
  }

  if (config.bufferSize !== undefined && config.bufferSize < 1024) {
    errors.push('bufferSize deve essere almeno 1024 byte (1KB)');
  }

  if (config.timeout !== undefined && config.timeout < 1000) {
    errors.push('timeout deve essere almeno 1000ms (1 secondo)');
  }

  if (config.retentionDays !== undefined && config.retentionDays < 1) {
    errors.push('retentionDays deve essere almeno 1 giorno');
  }

  if ((config as any).backupBaseDir !== undefined && !(config as any).backupBaseDir.trim()) {
    errors.push('backupBaseDir non può essere vuoto');
  }

  return errors;
}

// ==========================================
// FUNZIONI DI UTILITÀ PER IL CLEANUP
// ==========================================

export async function getActivePatterns(): Promise<string[]> {
  try {
    const patterns = await prisma.cleanupPattern.findMany({
      where: { isActive: true },
      orderBy: { priority: 'asc' }
    });

    return patterns.map(p => p.pattern);
  } catch (error: unknown) {
    logger.error('Errore nel recupero pattern attivi:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function getActiveExcludedFiles(): Promise<string[]> {
  try {
    const files = await prisma.cleanupExcludeFile.findMany({
      where: { isActive: true }
    });

    return files.map(f => f.fileName);
  } catch (error: unknown) {
    logger.error('Errore nel recupero file esclusi attivi:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function getActiveExcludedDirectories(): Promise<string[]> {
  try {
    const dirs = await prisma.cleanupExcludeDirectory.findMany({
      where: { isActive: true }
    });

    return dirs.map(d => d.directory);
  } catch (error: unknown) {
    logger.error('Errore nel recupero directory escluse attive:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}
