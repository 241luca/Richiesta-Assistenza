import { Router } from 'express';
import { createId } from '@paralleldrive/cuid2';
import { prisma } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { ResponseFormatter } from '../../utils/responseFormatter';
import { logger } from '../../utils/logger';
import { z } from 'zod';
import { AuditAction, LogCategory, LogSeverity } from '@prisma/client';

const router = Router();

// Schema di validazione per system settings
const systemSettingSchema = z.object({
  key: z.string().min(1).regex(/^[a-z_]+$/, 'La chiave deve contenere solo lettere minuscole e underscore'),
  value: z.string().min(1),
  type: z.enum(['string', 'number', 'boolean', 'json', 'text', 'url', 'email']),
  category: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  isEditable: z.boolean().default(true)
});

const updateSystemSettingSchema = z.object({
  value: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  category: z.string().optional()
});

// GET /api/admin/system-settings
router.get('/', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const settings = await prisma.systemSettings.findMany({
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ]
    });

    return res.json(ResponseFormatter.success(
      settings,
      'Impostazioni di sistema recuperate con successo'
    ));
  } catch (error) {
    logger.error('Errore nel recupero delle impostazioni:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero delle impostazioni',
      'FETCH_ERROR'
    ));
  }
});

// GET /api/admin/system-settings/:key
router.get('/:key', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { key } = req.params;
    
    const setting = await prisma.systemSettings.findUnique({
      where: { key }
    });

    if (!setting) {
      return res.status(404).json(ResponseFormatter.error(
        'Impostazione non trovata',
        'NOT_FOUND'
      ));
    }

    return res.json(ResponseFormatter.success(
      setting,
      'Impostazione recuperata con successo'
    ));
  } catch (error) {
    logger.error('Errore nel recupero dell\'impostazione:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero dell\'impostazione',
      'FETCH_ERROR'
    ));
  }
});

// POST /api/admin/system-settings
router.post('/', authenticate, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    // Valida i dati
    const validatedData: z.infer<typeof systemSettingSchema> = systemSettingSchema.parse(req.body);
    
    // Verifica che la chiave non esista già
    const existingSetting = await prisma.systemSettings.findUnique({
      where: { key: validatedData.key }
    });

    if (existingSetting) {
      return res.status(400).json(ResponseFormatter.error(
        'Una impostazione con questa chiave esiste già',
        'DUPLICATE_KEY'
      ));
    }

    // Crea la nuova impostazione (fornisci esplicitamente i campi richiesti)
    const { key, value, type, category, description, isActive, isEditable } = validatedData;
    const setting = await prisma.systemSettings.create({
      data: {
        id: createId(),
        updatedAt: new Date(),
        key,
        value,
        type,
        category,
        description: description ?? null,
        isActive,
        isEditable
      }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        id: createId(),
        action: AuditAction.CREATE,
        entityType: 'SystemSettings',
        entityId: setting.id,
        user: (req as any).user?.id ? { connect: { id: (req as any).user.id } } : undefined,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || '',
        newValues: setting,
        success: true,
        severity: LogSeverity.INFO,
        category: LogCategory.SYSTEM
      }
    });

    return res.status(201).json(ResponseFormatter.success(
      setting,
      'Impostazione creata con successo'
    ));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(ResponseFormatter.error(
        'Dati non validi',
        'VALIDATION_ERROR',
        error.errors
      ));
    }
    
    logger.error('Errore nella creazione dell\'impostazione:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella creazione dell\'impostazione',
      'CREATE_ERROR'
    ));
  }
});

// PUT /api/admin/system-settings/:id
router.put('/:id', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verifica che l'impostazione esista
    const existingSetting = await prisma.systemSettings.findUnique({
      where: { id }
    });

    if (!existingSetting) {
      return res.status(404).json(ResponseFormatter.error(
        'Impostazione non trovata',
        'NOT_FOUND'
      ));
    }

    // Verifica che sia modificabile
    if (!existingSetting.isEditable && (req as any).user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json(ResponseFormatter.error(
        'Questa impostazione non è modificabile',
        'NOT_EDITABLE'
      ));
    }

    // Valida i dati
    const validatedData = updateSystemSettingSchema.parse(req.body);
    
    // Aggiorna l'impostazione
    const updatedSetting = await prisma.systemSettings.update({
      where: { id },
      data: validatedData
    });

    // Log audit - TODO: fix req.user issue
    try {
      await prisma.auditLog.create({
        data: {
          id: createId(),
          action: AuditAction.UPDATE,
          entityType: 'SystemSettings',
          entityId: id,
          user: (req as any).user?.id ? { connect: { id: (req as any).user.id } } : undefined,
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('user-agent') || '',
          oldValues: existingSetting,
          newValues: updatedSetting,
          changes: validatedData,
          success: true,
          severity: LogSeverity.INFO,
          category: LogCategory.SYSTEM
        }
      });
    } catch (auditError) {
      logger.warn('Failed to create audit log:', auditError);
    }

    return res.json(ResponseFormatter.success(
      updatedSetting,
      'Impostazione aggiornata con successo'
    ));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(ResponseFormatter.error(
        'Dati non validi',
        'VALIDATION_ERROR',
        error.errors
      ));
    }
    
    logger.error('Errore nell\'aggiornamento dell\'impostazione:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento dell\'impostazione',
      'UPDATE_ERROR'
    ));
  }
});

// DELETE /api/admin/system-settings/:id
router.delete('/:id', authenticate, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verifica che l'impostazione esista
    const existingSetting = await prisma.systemSettings.findUnique({
      where: { id }
    });

    if (!existingSetting) {
      return res.status(404).json(ResponseFormatter.error(
        'Impostazione non trovata',
        'NOT_FOUND'
      ));
    }

    // Verifica che sia eliminabile
    if (!existingSetting.isEditable) {
      return res.status(403).json(ResponseFormatter.error(
        'Questa impostazione non può essere eliminata',
        'NOT_DELETABLE'
      ));
    }

    // Elimina l'impostazione
    await prisma.systemSettings.delete({
      where: { id }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        id: createId(),
        action: AuditAction.DELETE,
        entityType: 'SystemSettings',
        entityId: id,
        user: (req as any).user?.id ? { connect: { id: (req as any).user.id } } : undefined,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('user-agent') || '',
        oldValues: existingSetting,
        success: true,
        severity: LogSeverity.WARNING,
        category: LogCategory.SYSTEM
      }
    });

    return res.json(ResponseFormatter.success(
      null,
      'Impostazione eliminata con successo'
    ));
  } catch (error) {
    logger.error('Errore nell\'eliminazione dell\'impostazione:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'eliminazione dell\'impostazione',
      'DELETE_ERROR'
    ));
  }
});

// GET /api/admin/system-settings/category/:category
router.get('/category/:category', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { category } = req.params;
    
    const settings = await prisma.systemSettings.findMany({
      where: { category },
      orderBy: { key: 'asc' }
    });

    return res.json(ResponseFormatter.success(
      settings,
      `Impostazioni della categoria ${category} recuperate con successo`
    ));
  } catch (error) {
    logger.error('Errore nel recupero delle impostazioni per categoria:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero delle impostazioni',
      'FETCH_ERROR'
    ));
  }
});

// POST /api/admin/system-settings/bulk-update
router.post('/bulk-update', authenticate, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!Array.isArray(settings)) {
      return res.status(400).json(ResponseFormatter.error(
        'Il campo settings deve essere un array',
        'INVALID_DATA'
      ));
    }

    const results = [];
    
    for (const setting of settings) {
      try {
        const updated = await prisma.systemSettings.update({
          where: { key: setting.key },
          data: { value: setting.value }
        });
        results.push({ key: setting.key, success: true, data: updated });
      } catch (error) {
        results.push({ key: setting.key, success: false, error: 'Update failed' });
      }
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        id: createId(),
        action: AuditAction.BULK_UPDATE,
        entityType: 'SystemSettings',
        user: (req as any).user?.id ? { connect: { id: (req as any).user.id } } : undefined,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('user-agent') || '',
        newValues: results,
        success: true,
        severity: LogSeverity.INFO,
        category: LogCategory.SYSTEM
      }
    });

    return res.json(ResponseFormatter.success(
      results,
      'Aggiornamento bulk completato'
    ));
  } catch (error) {
    logger.error('Errore nell\'aggiornamento bulk:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento bulk',
      'BULK_UPDATE_ERROR'
    ));
  }
});

export default router;
