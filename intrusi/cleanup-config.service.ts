import { prisma } from '../config/database';
import logger from '../utils/logger';

// ==========================================
// CONFIGURAZIONE PRINCIPALE
// ==========================================

export async function getCleanupConfig() {
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
          notifyOnCleanup: true
        }
      });
    }

    return config;
  } catch (error) {
    logger.error('Errore nel recupero configurazione cleanup:', error);
    throw error;
  }
}

export async function updateCleanupConfig(data: any) {
  try {
    const config = await prisma.cleanupConfig.upsert({
      where: { name: 'default' },
      update: {
        ...data,
        updatedAt: new Date()
      },
      create: {
        name: 'default',
        ...data
      }
    });

    logger.info('Configurazione cleanup aggiornata');
    return config;
  } catch (error) {
    logger.error('Errore nell\'aggiornamento configurazione:', error);
    throw error;
  }
}

// ==========================================
// PATTERN
// ==========================================

export async function getCleanupPatterns(includeInactive = false) {
  try {
    const where = includeInactive ? {} : { isActive: true };
    
    const patterns = await prisma.cleanupPattern.findMany({
      where,
      orderBy: [
        { priority: 'asc' },
        { pattern: 'asc' }
      ]
    });

    return patterns;
  } catch (error) {
    logger.error('Errore nel recupero pattern:', error);
    throw error;
  }
}

export async function createCleanupPattern(data: any) {
  try {
    const pattern = await prisma.cleanupPattern.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    logger.info('Pattern cleanup creato:', pattern.pattern);
    return pattern;
  } catch (error) {
    logger.error('Errore nella creazione pattern:', error);
    throw error;
  }
}

export async function updateCleanupPattern(id: string, data: any) {
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
  } catch (error) {
    logger.error('Errore nell\'aggiornamento pattern:', error);
    throw error;
  }
}

export async function deleteCleanupPattern(id: string) {
  try {
    await prisma.cleanupPattern.delete({
      where: { id }
    });

    logger.info('Pattern cleanup eliminato:', id);
    return { success: true };
  } catch (error) {
    logger.error('Errore nell\'eliminazione pattern:', error);
    throw error;
  }
}

// ==========================================
// FILE ESCLUSI
// ==========================================

export async function getExcludedFiles(includeInactive = false) {
  try {
    const where = includeInactive ? {} : { isActive: true };
    
    const files = await prisma.cleanupExcludeFile.findMany({
      where,
      orderBy: [
        { criticality: 'desc' },
        { fileName: 'asc' }
      ]
    });

    return files;
  } catch (error) {
    logger.error('Errore nel recupero file esclusi:', error);
    throw error;
  }
}

export async function createExcludedFile(data: any) {
  try {
    const file = await prisma.cleanupExcludeFile.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    logger.info('File escluso aggiunto:', file.fileName);
    return file;
  } catch (error) {
    logger.error('Errore nell\'aggiunta file escluso:', error);
    throw error;
  }
}

export async function updateExcludedFile(id: string, data: any) {
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
  } catch (error) {
    logger.error('Errore nell\'aggiornamento file escluso:', error);
    throw error;
  }
}

export async function deleteExcludedFile(id: string) {
  try {
    await prisma.cleanupExcludeFile.delete({
      where: { id }
    });

    logger.info('File escluso rimosso:', id);
    return { success: true };
  } catch (error) {
    logger.error('Errore nella rimozione file escluso:', error);
    throw error;
  }
}

// ==========================================
// DIRECTORY ESCLUSE
// ==========================================

export async function getExcludedDirectories(includeInactive = false) {
  try {
    const where = includeInactive ? {} : { isActive: true };
    
    const dirs = await prisma.cleanupExcludeDirectory.findMany({
      where,
      orderBy: { directory: 'asc' }
    });

    return dirs;
  } catch (error) {
    logger.error('Errore nel recupero directory escluse:', error);
    throw error;
  }
}

export async function createExcludedDirectory(data: any) {
  try {
    const dir = await prisma.cleanupExcludeDirectory.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    logger.info('Directory esclusa aggiunta:', dir.directory);
    return dir;
  } catch (error) {
    logger.error('Errore nell\'aggiunta directory esclusa:', error);
    throw error;
  }
}

export async function deleteExcludedDirectory(id: string) {
  try {
    await prisma.cleanupExcludeDirectory.delete({
      where: { id }
    });

    logger.info('Directory esclusa rimossa:', id);
    return { success: true };
  } catch (error) {
    logger.error('Errore nella rimozione directory esclusa:', error);
    throw error;
  }
}

// ==========================================
// PROGRAMMAZIONE
// ==========================================

export async function getCleanupSchedules(includeInactive = false) {
  try {
    const where = includeInactive ? {} : { isActive: true };
    
    const schedules = await prisma.cleanupSchedule.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    return schedules;
  } catch (error) {
    logger.error('Errore nel recupero programmazioni:', error);
    throw error;
  }
}

export async function createCleanupSchedule(data: any) {
  try {
    const schedule = await prisma.cleanupSchedule.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    logger.info('Programmazione cleanup creata:', schedule.name);
    return schedule;
  } catch (error) {
    logger.error('Errore nella creazione programmazione:', error);
    throw error;
  }
}

export async function updateCleanupSchedule(id: string, data: any) {
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
  } catch (error) {
    logger.error('Errore nell\'aggiornamento programmazione:', error);
    throw error;
  }
}

export async function deleteCleanupSchedule(id: string) {
  try {
    await prisma.cleanupSchedule.delete({
      where: { id }
    });

    logger.info('Programmazione cleanup eliminata:', id);
    return { success: true };
  } catch (error) {
    logger.error('Errore nell\'eliminazione programmazione:', error);
    throw error;
  }
}

// ==========================================
// LOG E STATISTICHE
// ==========================================

export async function logCleanupExecution(data: any) {
  try {
    const log = await prisma.cleanupLog.create({
      data: {
        ...data,
        createdAt: new Date()
      }
    });

    // Aggiorna anche le statistiche
    await updateCleanupStats(data);

    return log;
  } catch (error) {
    logger.error('Errore nel log esecuzione cleanup:', error);
    throw error;
  }
}

async function updateCleanupStats(executionData: any) {
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
        totalSizeCleanup: { increment: executionData.totalSize || 0 },
        lastExecutionId: executionData.executionId,
        updatedAt: new Date()
      },
      create: {
        date: today,
        totalExecutions: 1,
        successfulRuns: executionData.status === 'completed' ? 1 : 0,
        failedRuns: executionData.status === 'failed' ? 1 : 0,
        totalFilesCleanup: executionData.filesProcessed || 0,
        totalSizeCleanup: executionData.totalSize || 0,
        lastExecutionId: executionData.executionId
      }
    });

    return stats;
  } catch (error) {
    logger.error('Errore nell\'aggiornamento statistiche:', error);
    // Non rilancio l'errore per non bloccare il log principale
  }
}

export async function getCleanupStats(days = 30) {
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
  } catch (error) {
    logger.error('Errore nel recupero statistiche:', error);
    throw error;
  }
}

export async function getCleanupLogs(filters: any = {}) {
  try {
    const where: any = {};
    
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
  } catch (error) {
    logger.error('Errore nel recupero log cleanup:', error);
    throw error;
  }
}

// ==========================================
// FUNZIONI DI UTILITÀ PER IL CLEANUP
// ==========================================

export async function getActivePatterns() {
  try {
    const patterns = await prisma.cleanupPattern.findMany({
      where: { isActive: true },
      orderBy: { priority: 'asc' }
    });

    // Aggiungi i pattern predefiniti che non sono nel database
    const defaultPatterns = [
      '*.backup-*',
      'fix-*.sh',
      'test-*.sh',
      'check-*.sh',
      'debug-*.sh',
      '*.fixed.ts',
      '*.fixed.tsx',
      'backup-*.sql',
      '*.mjs',
      'BACKUP-*'
    ];

    // Verifica quali pattern predefiniti mancano
    const existingPatterns = patterns.map(p => p.pattern);
    const missingDefaults = defaultPatterns.filter(p => !existingPatterns.includes(p));

    // Combina pattern dal database con quelli predefiniti mancanti
    const allPatterns = [
      ...patterns.map(p => p.pattern),
      ...missingDefaults
    ];

    return allPatterns;
  } catch (error) {
    logger.error('Errore nel recupero pattern attivi:', error);
    throw error;
  }
}

export async function getActiveExcludedFiles() {
  try {
    const files = await prisma.cleanupExcludeFile.findMany({
      where: { isActive: true }
    });

    // File sempre esclusi di sistema
    const systemFiles = [
      '.env',
      '.env.local',
      '.env.production',
      '*.log',
      '*.pid',
      'package-lock.json',
      'yarn.lock',
      '*.key',
      '*.pem',
      '*.crt'
    ];

    // Combina file dal database con quelli di sistema
    const allFiles = [
      ...files.map(f => f.fileName),
      ...systemFiles
    ];

    // Rimuovi duplicati
    return [...new Set(allFiles)];
  } catch (error) {
    logger.error('Errore nel recupero file esclusi attivi:', error);
    throw error;
  }
}

// ==========================================
// DIRECTORY ESCLUSE
// ==========================================

export async function getExcludedDirectories(includeInactive = false) {
  try {
    const where = includeInactive ? {} : { isActive: true };
    
    const dirs = await prisma.cleanupExcludeDirectory.findMany({
      where,
      orderBy: [
        { directory: 'asc' }
      ]
    });

    return dirs;
  } catch (error) {
    logger.error('Errore nel recupero directory escluse:', error);
    throw error;
  }
}

export async function createExcludedDirectory(data: any) {
  try {
    const dir = await prisma.cleanupExcludeDirectory.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    logger.info('Directory esclusa aggiunta:', dir.directory);
    return dir;
  } catch (error) {
    logger.error('Errore nell\'aggiunta directory esclusa:', error);
    throw error;
  }
}

export async function updateExcludedDirectory(id: string, data: any) {
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
  } catch (error) {
    logger.error('Errore nell\'aggiornamento directory esclusa:', error);
    throw error;
  }
}

export async function deleteExcludedDirectory(id: string) {
  try {
    await prisma.cleanupExcludeDirectory.delete({
      where: { id }
    });

    logger.info('Directory esclusa eliminata:', id);
    return { success: true };
  } catch (error) {
    logger.error('Errore nell\'eliminazione directory esclusa:', error);
    throw error;
  }
}

// ==========================================
// PROGRAMMAZIONI / SCHEDULES
// ==========================================

export async function getCleanupSchedules(includeInactive = false) {
  try {
    const where = includeInactive ? {} : { isActive: true };
    
    const schedules = await prisma.cleanupSchedule.findMany({
      where,
      orderBy: [
        { name: 'asc' }
      ]
    });

    return schedules;
  } catch (error) {
    logger.error('Errore nel recupero programmazioni:', error);
    // Ritorna array vuoto se la tabella non esiste ancora
    return [];
  }
}

export async function createCleanupSchedule(data: any) {
  try {
    const schedule = await prisma.cleanupSchedule.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    logger.info('Programmazione cleanup creata:', schedule.name);
    return schedule;
  } catch (error) {
    logger.error('Errore nella creazione programmazione:', error);
    throw error;
  }
}

export async function updateCleanupSchedule(id: string, data: any) {
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
  } catch (error) {
    logger.error('Errore nell\'aggiornamento programmazione:', error);
    throw error;
  }
}

export async function deleteCleanupSchedule(id: string) {
  try {
    await prisma.cleanupSchedule.delete({
      where: { id }
    });

    logger.info('Programmazione cleanup eliminata:', id);
    return { success: true };
  } catch (error) {
    logger.error('Errore nell\'eliminazione programmazione:', error);
    throw error;
  }
}

export async function getActiveExcludedDirectories() {
  try {
    const dirs = await prisma.cleanupExcludeDirectory.findMany({
      where: { isActive: true }
    });

    // Directory sempre escluse di sistema
    const systemDirs = [
      'node_modules',
      '.git',
      'dist',
      'build',
      '.next',
      'CLEANUP-*',
      'backend/backups',
      'uploads'
    ];

    // Combina directory dal database con quelle di sistema
    const allDirs = [
      ...dirs.map(d => d.directory),
      ...systemDirs
    ];

    // Rimuovi duplicati
    return [...new Set(allDirs)];
  } catch (error) {
    logger.error('Errore nel recupero directory escluse attive:', error);
    throw error;
  }
}