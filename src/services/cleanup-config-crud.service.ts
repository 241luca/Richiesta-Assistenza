// 🚀 SERVIZIO CLEANUP CONFIG CON CRUD COMPLETO
// backend/src/services/cleanup-config-crud.service.ts

import { prisma } from '../config/database';
import logger from '../utils/logger';

// ==========================================
// CONFIGURAZIONE PRINCIPALE - CRUD COMPLETO
// ==========================================

// READ
export async function getCleanupConfig(id?: string) {
  try {
    if (id) {
      return await prisma.cleanupConfig.findUnique({
        where: { id }
      });
    }
    
    // Se non specificato ID, ritorna la configurazione attiva
    let config = await prisma.cleanupConfig.findFirst({
      where: { isActive: true }
    });

    // Se non esiste, creiamo la configurazione di default
    if (!config) {
      config = await createDefaultConfig();
    }

    return config;
  } catch (error) {
    logger.error('Errore nel recupero configurazione cleanup:', error);
    throw error;
  }
}

// READ ALL
export async function getAllCleanupConfigs() {
  try {
    return await prisma.cleanupConfig.findMany({
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  } catch (error) {
    logger.error('Errore nel recupero configurazioni:', error);
    throw error;
  }
}

// CREATE
export async function createCleanupConfig(data: any) {
  try {
    // Se questa deve essere attiva, disattiva le altre
    if (data.isActive) {
      await prisma.cleanupConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });
    }

    const config = await prisma.cleanupConfig.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    logger.info('Configurazione cleanup creata:', config.name);
    return config;
  } catch (error) {
    logger.error('Errore nella creazione configurazione:', error);
    throw error;
  }
}

// UPDATE
export async function updateCleanupConfig(id: string, data: any) {
  try {
    // Se questa diventa attiva, disattiva le altre
    if (data.isActive) {
      await prisma.cleanupConfig.updateMany({
        where: { 
          isActive: true,
          NOT: { id }
        },
        data: { isActive: false }
      });
    }

    const config = await prisma.cleanupConfig.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });

    logger.info('Configurazione cleanup aggiornata:', config.name);
    return config;
  } catch (error) {
    logger.error('Errore nell\'aggiornamento configurazione:', error);
    throw error;
  }
}

// DELETE
export async function deleteCleanupConfig(id: string) {
  try {
    // Non permettere eliminazione se è l'unica configurazione
    const count = await prisma.cleanupConfig.count();
    if (count <= 1) {
      throw new Error('Non puoi eliminare l\'ultima configurazione');
    }

    // Non permettere eliminazione se è attiva
    const config = await prisma.cleanupConfig.findUnique({
      where: { id }
    });
    
    if (config?.isActive) {
      throw new Error('Non puoi eliminare la configurazione attiva');
    }

    await prisma.cleanupConfig.delete({
      where: { id }
    });

    logger.info('Configurazione cleanup eliminata:', id);
    return { success: true };
  } catch (error) {
    logger.error('Errore nell\'eliminazione configurazione:', error);
    throw error;
  }
}

// HELPER - Crea configurazione di default
async function createDefaultConfig() {
  return await prisma.cleanupConfig.create({
    data: {
      name: 'default',
      isActive: true,
      targetDirectory: '/Users/lucamambelli/Desktop/backup-ra/cleanup',  // Path configurabile
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

// ==========================================
// PATTERN - CRUD COMPLETO
// ==========================================

// READ ALL
export async function getCleanupPatterns(includeInactive = false) {
  try {
    const where = includeInactive ? {} : { isActive: true };
    
    return await prisma.cleanupPattern.findMany({
      where,
      orderBy: [
        { priority: 'asc' },
        { pattern: 'asc' }
      ]
    });
  } catch (error) {
    logger.error('Errore nel recupero pattern:', error);
    throw error;
  }
}

// READ ONE
export async function getCleanupPattern(id: string) {
  try {
    return await prisma.cleanupPattern.findUnique({
      where: { id }
    });
  } catch (error) {
    logger.error('Errore nel recupero pattern:', error);
    throw error;
  }
}

// CREATE
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

// UPDATE
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

// DELETE
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
// FILE ESCLUSI - CRUD COMPLETO
// ==========================================

// READ ALL
export async function getCleanupExcludedFiles(includeInactive = false) {
  try {
    const where = includeInactive ? {} : { isActive: true };
    
    return await prisma.cleanupExcludeFile.findMany({
      where,
      orderBy: { fileName: 'asc' }
    });
  } catch (error) {
    logger.error('Errore nel recupero file esclusi:', error);
    throw error;
  }
}

// READ ONE
export async function getCleanupExcludedFile(id: string) {
  try {
    return await prisma.cleanupExcludeFile.findUnique({
      where: { id }
    });
  } catch (error) {
    logger.error('Errore nel recupero file escluso:', error);
    throw error;
  }
}

// CREATE
export async function createCleanupExcludedFile(data: any) {
  try {
    const file = await prisma.cleanupExcludeFile.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    logger.info('File escluso creato:', file.fileName);
    return file;
  } catch (error) {
    logger.error('Errore nella creazione file escluso:', error);
    throw error;
  }
}

// UPDATE
export async function updateCleanupExcludedFile(id: string, data: any) {
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

// DELETE
export async function deleteCleanupExcludedFile(id: string) {
  try {
    await prisma.cleanupExcludeFile.delete({
      where: { id }
    });

    logger.info('File escluso eliminato:', id);
    return { success: true };
  } catch (error) {
    logger.error('Errore nell\'eliminazione file escluso:', error);
    throw error;
  }
}

// ==========================================
// DIRECTORY ESCLUSE - CRUD COMPLETO
// ==========================================

// READ ALL
export async function getCleanupExcludedDirectories(includeInactive = false) {
  try {
    const where = includeInactive ? {} : { isActive: true };
    
    return await prisma.cleanupExcludeDirectory.findMany({
      where,
      orderBy: { directory: 'asc' }
    });
  } catch (error) {
    logger.error('Errore nel recupero directory escluse:', error);
    throw error;
  }
}

// READ ONE
export async function getCleanupExcludedDirectory(id: string) {
  try {
    return await prisma.cleanupExcludeDirectory.findUnique({
      where: { id }
    });
  } catch (error) {
    logger.error('Errore nel recupero directory esclusa:', error);
    throw error;
  }
}

// CREATE
export async function createCleanupExcludedDirectory(data: any) {
  try {
    const dir = await prisma.cleanupExcludeDirectory.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    logger.info('Directory esclusa creata:', dir.directory);
    return dir;
  } catch (error) {
    logger.error('Errore nella creazione directory esclusa:', error);
    throw error;
  }
}

// UPDATE
export async function updateCleanupExcludedDirectory(id: string, data: any) {
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

// DELETE
export async function deleteCleanupExcludedDirectory(id: string) {
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
// EXPORT TUTTE LE FUNZIONI ESISTENTI
// ==========================================

// Esporta anche le funzioni esistenti dal file originale
export * from './cleanup-config.service';
