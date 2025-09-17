// 🚀 NUOVE ROUTE BACKUP SEMPLIFICATE - VERSIONE CORRETTA CON RESPONSEFORMATTER
// backend/src/routes/simple-backup.routes.ts

import express, { Router, Request, Response } from 'express';
import simpleBackupService from '../services/simple-backup.service';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';
import { ResponseFormatter } from '../utils/responseFormatter';
import * as fs from 'fs';

const router: Router = express.Router();

/**
 * Middleware per verificare che l'utente sia autenticato
 * Per ora rimuoviamo il controllo del ruolo per semplificare
 */
router.use(authenticate);

// Middleware personalizzato per verificare se è admin
router.use((req: any, res: Response, next: any) => {
  if (req.user && (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN')) {
    next();
  } else {
    // ✅ USO RESPONSEFORMATTER
    return res.status(403).json(ResponseFormatter.error(
      'Access denied. Admin only.',
      'ACCESS_DENIED'
    ));
  }
});

/**
 * POST /api/backup/cleanup-dev
 * Sposta i file temporanei di sviluppo in una cartella datata
 */
router.post('/cleanup-dev', async (req: Request, res: Response) => {
  try {
    // Chiama la nuova funzione che sposta i file invece di eliminarli
    const result = await simpleBackupService.cleanupDevelopmentFiles();
    
    // ✅ USO RESPONSEFORMATTER
    return res.json(ResponseFormatter.success(
      {
        movedCount: result.movedCount,
        cleanupDir: result.cleanupDir,
        message: `Spostati ${result.movedCount} file temporanei nella cartella ${result.cleanupDir}`
      },
      'Pulizia completata con successo'
    ));
  } catch (error: any) {
    logger.error('Error during cleanup:', error);
    // ✅ USO RESPONSEFORMATTER
    return res.status(500).json(ResponseFormatter.error(
      'Pulizia fallita',
      'CLEANUP_ERROR',
      error.message
    ));
  }
});

/**
 * GET /api/backup/cleanup-dirs
 * Lista tutte le cartelle di cleanup create
 */
router.get('/cleanup-dirs', async (req: Request, res: Response) => {
  try {
    const dirs = await simpleBackupService.listCleanupDirs();
    
    // ✅ USO RESPONSEFORMATTER
    return res.json(ResponseFormatter.success(
      dirs,
      'Cleanup directories retrieved successfully'
    ));
  } catch (error: any) {
    logger.error('Error listing cleanup dirs:', error);
    // ✅ USO RESPONSEFORMATTER
    return res.status(500).json(ResponseFormatter.error(
      'Failed to list cleanup directories',
      'LIST_ERROR',
      error.message
    ));
  }
});

/**
 * DELETE /api/backup/cleanup-dirs/:name
 * Elimina definitivamente una cartella di cleanup
 */
router.delete('/cleanup-dirs/:name', async (req: any, res: Response) => {
  try {
    const { name } = req.params;
    const userId = req.user?.id;
    
    // Richiede conferma esplicita
    if (!req.body.confirm) {
      // ✅ USO RESPONSEFORMATTER
      return res.status(400).json(ResponseFormatter.error(
        'Conferma richiesta per eliminare la cartella',
        'CONFIRMATION_REQUIRED'
      ));
    }
    
    await simpleBackupService.deleteCleanupDir(name, userId);
    
    // ✅ USO RESPONSEFORMATTER
    return res.json(ResponseFormatter.success(
      null,
      `Cartella ${name} eliminata definitivamente`
    ));
  } catch (error: any) {
    logger.error('Error deleting cleanup dir:', error);
    // ✅ USO RESPONSEFORMATTER
    return res.status(500).json(ResponseFormatter.error(
      'Failed to delete cleanup directory',
      'DELETE_ERROR',
      error.message
    ));
  }
});

/**
 * GET /api/backup
 * Lista tutti i backup o filtra per tipo
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    
    const backups = await simpleBackupService.listBackups(type as any);
    
    // Converti BigInt in string per JSON
    const serializedBackups = backups.map(backup => ({
      ...backup,
      fileSize: backup.file_size ? backup.file_size.toString() : '0'
    }));
    
    // ✅ USO RESPONSEFORMATTER
    return res.json(ResponseFormatter.success(
      serializedBackups,
      'Backups retrieved successfully'
    ));
  } catch (error: any) {
    logger.error('Error fetching backups:', error);
    // ✅ USO RESPONSEFORMATTER
    return res.status(500).json(ResponseFormatter.error(
      'Failed to fetch backups',
      'FETCH_ERROR',
      error.message
    ));
  }
});

/**
 * GET /api/backup/stats
 * Ottieni statistiche sui backup
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await simpleBackupService.getBackupStats();
    
    // ✅ USO RESPONSEFORMATTER
    return res.json(ResponseFormatter.success(
      stats,
      'Backup statistics retrieved successfully'
    ));
  } catch (error: any) {
    logger.error('Error getting backup stats:', error);
    // ✅ USO RESPONSEFORMATTER
    return res.status(500).json(ResponseFormatter.error(
      'Failed to get backup statistics',
      'STATS_ERROR',
      error.message
    ));
  }
});

/**
 * POST /api/backup/database
 * Crea un backup del database
 */
router.post('/database', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const backup = await simpleBackupService.backupDatabase(userId);
    
    // Serializza BigInt
    const serializedBackup = {
      ...backup,
      fileSize: backup.fileSize ? backup.fileSize.toString() : '0'
    };
    
    // ✅ USO RESPONSEFORMATTER
    return res.json(ResponseFormatter.success(
      serializedBackup,
      'Database backup created successfully'
    ));
  } catch (error: any) {
    logger.error('Error creating database backup:', error);
    // ✅ USO RESPONSEFORMATTER
    return res.status(500).json(ResponseFormatter.error(
      'Failed to create database backup',
      'BACKUP_ERROR',
      error.message
    ));
  }
});

/**
 * POST /api/backup/code
 * Crea un backup del codice sorgente
 */
router.post('/code', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const backup = await simpleBackupService.backupCode(userId);
    
    // Serializza BigInt
    const serializedBackup = {
      ...backup,
      fileSize: backup.fileSize ? backup.fileSize.toString() : '0'
    };
    
    // ✅ USO RESPONSEFORMATTER
    return res.json(ResponseFormatter.success(
      serializedBackup,
      'Code backup created successfully'
    ));
  } catch (error: any) {
    logger.error('Error creating code backup:', error);
    // ✅ USO RESPONSEFORMATTER
    return res.status(500).json(ResponseFormatter.error(
      'Failed to create code backup',
      'BACKUP_ERROR',
      error.message
    ));
  }
});

/**
 * POST /api/backup/uploads
 * Crea un backup dei file uploads (alias di files per compatibilità)
 */
router.post('/uploads', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const backup = await simpleBackupService.backupFiles(userId);
    
    // Serializza BigInt
    const serializedBackup = {
      ...backup,
      fileSize: backup.fileSize ? backup.fileSize.toString() : '0'
    };
    
    // ✅ USO RESPONSEFORMATTER
    return res.json(ResponseFormatter.success(
      serializedBackup,
      'Uploads backup created successfully'
    ));
  } catch (error: any) {
    logger.error('Error creating uploads backup:', error);
    // ✅ USO RESPONSEFORMATTER
    return res.status(500).json(ResponseFormatter.error(
      'Failed to create uploads backup',
      'BACKUP_ERROR',
      error.message
    ));
  }
});

/**
 * POST /api/backup/files
 * Crea un backup dei file (mantenuto per retrocompatibilità)
 */
router.post('/files', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const backup = await simpleBackupService.backupFiles(userId);
    
    // Serializza BigInt
    const serializedBackup = {
      ...backup,
      fileSize: backup.fileSize ? backup.fileSize.toString() : '0'
    };
    
    // ✅ USO RESPONSEFORMATTER
    return res.json(ResponseFormatter.success(
      serializedBackup,
      'Files backup created successfully'
    ));
  } catch (error: any) {
    logger.error('Error creating files backup:', error);
    // ✅ USO RESPONSEFORMATTER
    return res.status(500).json(ResponseFormatter.error(
      'Failed to create files backup',
      'BACKUP_ERROR',
      error.message
    ));
  }
});

/**
 * POST /api/backup/all
 * Crea un backup completo (database + code + uploads)
 */
router.post('/all', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const results = [];
    const errors = [];
    
    // Backup database
    try {
      const dbBackup = await simpleBackupService.backupDatabase(userId);
      results.push({
        type: 'DATABASE',
        ...dbBackup,
        fileSize: dbBackup.fileSize ? dbBackup.fileSize.toString() : '0'
      });
    } catch (error: any) {
      logger.error('Database backup failed in complete backup:', error);
      errors.push({ type: 'DATABASE', error: error.message });
    }
    
    // Backup code
    try {
      const codeBackup = await simpleBackupService.backupCode(userId);
      results.push({
        type: 'CODE',
        ...codeBackup,
        fileSize: codeBackup.fileSize ? codeBackup.fileSize.toString() : '0'
      });
    } catch (error: any) {
      logger.error('Code backup failed in complete backup:', error);
      errors.push({ type: 'CODE', error: error.message });
    }
    
    // Backup uploads
    try {
      const uploadsBackup = await simpleBackupService.backupFiles(userId);
      results.push({
        type: 'UPLOADS',
        ...uploadsBackup,
        fileSize: uploadsBackup.fileSize ? uploadsBackup.fileSize.toString() : '0'
      });
    } catch (error: any) {
      logger.error('Uploads backup failed in complete backup:', error);
      errors.push({ type: 'UPLOADS', error: error.message });
    }
    
    if (results.length === 0) {
      // Tutti i backup sono falliti
      // ✅ USO RESPONSEFORMATTER
      return res.status(500).json(ResponseFormatter.error(
        'All backups failed',
        'ALL_BACKUPS_FAILED',
        errors
      ));
    }
    
    // ✅ USO RESPONSEFORMATTER
    return res.json(ResponseFormatter.success(
      {
        successful: results,
        failed: errors
      },
      `Complete backup created: ${results.length} successful, ${errors.length} failed`
    ));
  } catch (error: any) {
    logger.error('Error creating complete backup:', error);
    // ✅ USO RESPONSEFORMATTER
    return res.status(500).json(ResponseFormatter.error(
      'Failed to create complete backup',
      'BACKUP_ERROR',
      error.message
    ));
  }
});

/**
 * DELETE /api/backup/:id
 * Elimina un backup specifico
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await simpleBackupService.deleteBackup(id);
    
    // ✅ USO RESPONSEFORMATTER
    return res.json(ResponseFormatter.success(
      null,
      'Backup deleted successfully'
    ));
  } catch (error: any) {
    logger.error('Error deleting backup:', error);
    // ✅ USO RESPONSEFORMATTER
    return res.status(500).json(ResponseFormatter.error(
      'Failed to delete backup',
      'DELETE_ERROR',
      error.message
    ));
  }
});

/**
 * GET /api/backup/:id/download
 * Scarica un backup - Richiede autenticazione standard
 */
router.get('/:id/download', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const backup = await simpleBackupService.getBackup(id);
    
    if (!backup) {
      return res.status(404).json(ResponseFormatter.error(
        'Backup not found',
        'NOT_FOUND'
      ));
    }

    // Verifica che il file esista
    if (!fs.existsSync(backup.filePath)) {
      return res.status(404).json(ResponseFormatter.error(
        'Backup file not found on disk',
        'FILE_NOT_FOUND'
      ));
    }

    // Invia il file
    res.download(backup.filePath, backup.name || backup.filePath.split('/').pop());
  } catch (error: any) {
    logger.error('Error downloading backup:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Failed to download backup',
      'DOWNLOAD_ERROR',
      error.message
    ));
  }
});

export default router;
