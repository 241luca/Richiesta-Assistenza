/**
 * Profession Categories Routes
 * Gestione associazioni tra professioni e categorie (SUPER_ADMIN only)
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { checkRole } from '../middleware/checkRole';
import { auditLogger } from '../middleware/auditLogger';
import { AuditAction, LogCategory } from '@prisma/client';
import { prisma } from '../config/database';
import { ResponseFormatter } from '../utils/responseFormatter';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/profession-categories
 * Ottieni tutte le associazioni professioni-categorie
 */
router.get('/', 
  authenticate,
  checkRole(['SUPER_ADMIN', 'ADMIN']),
  auditLogger({ action: AuditAction.READ, category: LogCategory.BUSINESS, entityType: 'ProfessionCategory' }),
  async (req, res) => {
    try {
      // Ottieni tutte le professioni con le loro categorie
      const professions = await prisma.profession.findMany({
        orderBy: { displayOrder: 'asc' },
        include: {
          ProfessionCategory: {
            include: {
              Category: true
            },
            orderBy: {
              Category: {
                displayOrder: 'asc'
              }
            }
          },
          _count: {
            select: {
              User: true
            }
          }
        } as any
      });

      // Trasforma nel formato atteso dal frontend
      const transformed = professions.map((p: any) => ({
        ...p,
        categories: Array.isArray(p.ProfessionCategory)
          ? p.ProfessionCategory.map((pc: any) => ({
              id: pc.id,
              professionId: pc.professionId,
              categoryId: pc.categoryId,
              isDefault: pc.isDefault,
              isActive: pc.isActive,
              // Normalizza chiave categoria a camelCase
              category: pc.Category || pc.category || null
            }))
          : [],
        _count: {
          users: (p._count && (p._count.User ?? p._count.users)) || 0
        }
      }));

      // Ottieni anche tutte le categorie per il frontend
      const allCategories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' }
      });

      return res.json(ResponseFormatter.success(
        { professions: transformed, allCategories },
        'Associazioni professioni-categorie recuperate'
      ));
    } catch (error) {
      logger.error('Errore recupero associazioni:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Errore recupero associazioni',
        'FETCH_ERROR'
      ));
    }
  }
);

/**
 * GET /api/profession-categories/profession/:professionId
 * Ottieni categorie di una specifica professione
 */
router.get('/profession/:professionId',
  authenticate,
  auditLogger({ action: AuditAction.READ, category: LogCategory.BUSINESS, entityType: 'ProfessionCategory' }),
  async (req, res) => {
    try {
      const { professionId } = req.params;

      const professionRaw = await prisma.profession.findUnique({
        where: { id: professionId },
        include: {
          ProfessionCategory: {
            include: {
              Category: true
            },
            orderBy: {
              isDefault: 'desc'
            }
          }
        } as any
      });

      const profession = professionRaw
        ? {
            ...professionRaw,
            categories: Array.isArray((professionRaw as any).ProfessionCategory)
              ? (professionRaw as any).ProfessionCategory.map((pc: any) => ({
                  id: pc.id,
                  professionId: pc.professionId,
                  categoryId: pc.categoryId,
                  isDefault: pc.isDefault,
                  isActive: pc.isActive,
                  category: pc.Category || pc.category || null
                }))
              : []
          }
        : null;

      if (!profession) {
        return res.status(404).json(ResponseFormatter.error(
          'Professione non trovata',
          'NOT_FOUND'
        ));
      }

      return res.json(ResponseFormatter.success(
        profession,
        'Categorie della professione recuperate'
      ));
    } catch (error) {
      logger.error('Errore recupero categorie professione:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Errore recupero categorie',
        'FETCH_ERROR'
      ));
    }
  }
);

/**
 * POST /api/profession-categories
 * Crea una nuova associazione professione-categoria (SUPER_ADMIN only)
 */
router.post('/',
  authenticate,
  checkRole(['SUPER_ADMIN']),
  auditLogger({ action: AuditAction.CREATE, category: LogCategory.BUSINESS, entityType: 'ProfessionCategory' }),
  async (req, res) => {
    try {
      const { professionId, categoryId, isDefault } = req.body;

      // Verifica che professione e categoria esistano
      const [profession, category] = await Promise.all([
        prisma.profession.findUnique({ where: { id: professionId } }),
        prisma.category.findUnique({ where: { id: categoryId } })
      ]);

      if (!profession) {
        return res.status(404).json(ResponseFormatter.error(
          'Professione non trovata',
          'PROFESSION_NOT_FOUND'
        ));
      }

      if (!category) {
        return res.status(404).json(ResponseFormatter.error(
          'Categoria non trovata',
          'CATEGORY_NOT_FOUND'
        ));
      }

      // Verifica che l'associazione non esista già
      const existing = await prisma.professionCategory.findUnique({
        where: {
          professionId_categoryId: {
            professionId,
            categoryId
          }
        }
      });

      if (existing) {
        return res.status(409).json(ResponseFormatter.error(
          'Associazione già esistente',
          'ALREADY_EXISTS'
        ));
      }

      // Se è marcata come default, rimuovi il default dalle altre
      if (isDefault) {
        await prisma.professionCategory.updateMany({
          where: { professionId },
          data: { isDefault: false }
        });
      }

      // Crea l'associazione
      const association = await prisma.professionCategory.create({
        data: {
          // Genera id deterministico per rispettare lo schema che richiede id
          id: `pc_${professionId}_${categoryId}`,
          profession: { connect: { id: professionId } },
          category: { connect: { id: categoryId } },
          isDefault: isDefault || false,
          isActive: true
        },
        include: {
          profession: true,
          category: true
        }
      });

      logger.info(`Associazione creata: ${profession.name} -> ${category.name}`);

      return res.status(201).json(ResponseFormatter.success(
        association,
        'Associazione creata con successo'
      ));
    } catch (error) {
      logger.error('Errore creazione associazione:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Errore creazione associazione',
        'CREATE_ERROR'
      ));
    }
  }
);

/**
 * PUT /api/profession-categories/:id
 * Aggiorna un'associazione (SUPER_ADMIN only)
 */
router.put('/:id',
  authenticate,
  checkRole(['SUPER_ADMIN']),
  auditLogger({ action: AuditAction.UPDATE, category: LogCategory.BUSINESS, entityType: 'ProfessionCategory' }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { isDefault, isActive } = req.body;

      const existing = await prisma.professionCategory.findUnique({
        where: { id }
      });

      if (!existing) {
        return res.status(404).json(ResponseFormatter.error(
          'Associazione non trovata',
          'NOT_FOUND'
        ));
      }

      // Se è marcata come default, rimuovi il default dalle altre
      if (isDefault && !existing.isDefault) {
        await prisma.professionCategory.updateMany({
          where: { 
            professionId: existing.professionId,
            id: { not: id }
          },
          data: { isDefault: false }
        });
      }

      const updated = await prisma.professionCategory.update({
        where: { id },
        data: {
          isDefault,
          isActive
        },
        include: {
          profession: true,
          category: true
        }
      });

      return res.json(ResponseFormatter.success(
        updated,
        'Associazione aggiornata con successo'
      ));
    } catch (error) {
      logger.error('Errore aggiornamento associazione:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Errore aggiornamento associazione',
        'UPDATE_ERROR'
      ));
    }
  }
);

/**
 * DELETE /api/profession-categories/:id
 * Elimina un'associazione (SUPER_ADMIN only)
 */
router.delete('/:id',
  authenticate,
  checkRole(['SUPER_ADMIN']),
  auditLogger({ action: AuditAction.DELETE, category: LogCategory.BUSINESS, entityType: 'ProfessionCategory' }),
  async (req, res) => {
    try {
      const { id } = req.params;

      const existing = await prisma.professionCategory.findUnique({
        where: { id },
        include: {
          profession: true,
          category: true
        }
      });

      if (!existing) {
        return res.status(404).json(ResponseFormatter.error(
          'Associazione non trovata',
          'NOT_FOUND'
        ));
      }

      await prisma.professionCategory.delete({
        where: { id }
      });

      logger.info(`Associazione eliminata: ${existing.profession.name} -> ${existing.category.name}`);

      return res.json(ResponseFormatter.success(
        null,
        'Associazione eliminata con successo'
      ));
    } catch (error) {
      logger.error('Errore eliminazione associazione:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Errore eliminazione associazione',
        'DELETE_ERROR'
      ));
    }
  }
);

/**
 * POST /api/profession-categories/bulk
 * Aggiorna in massa le associazioni per una professione (SUPER_ADMIN only)
 */
router.post('/bulk',
  authenticate,
  checkRole(['SUPER_ADMIN']),
  auditLogger({ action: AuditAction.UPDATE, category: LogCategory.BUSINESS, entityType: 'ProfessionCategory' }),
  async (req, res) => {
    try {
      const { professionId, categoryIds } = req.body;

      if (!professionId || !Array.isArray(categoryIds)) {
        return res.status(400).json(ResponseFormatter.error(
          'ProfessionId e categoryIds sono richiesti',
          'VALIDATION_ERROR'
        ));
      }

      // Verifica che la professione esista
      const profession = await prisma.profession.findUnique({
        where: { id: professionId }
      });

      if (!profession) {
        return res.status(404).json(ResponseFormatter.error(
          'Professione non trovata',
          'PROFESSION_NOT_FOUND'
        ));
      }

      // Inizia transazione
      const result = await prisma.$transaction(async (tx) => {
        // 1. Ottieni associazioni esistenti
        const existing = await tx.professionCategory.findMany({
          where: { professionId },
          select: { categoryId: true }
        });

        const existingIds = existing.map(e => e.categoryId);
        
        // 2. Determina cosa aggiungere e cosa rimuovere
        const toAdd = categoryIds.filter(id => !existingIds.includes(id));
        const toRemove = existingIds.filter(id => !categoryIds.includes(id));

        // 3. Rimuovi associazioni non più necessarie
        if (toRemove.length > 0) {
          await tx.professionCategory.deleteMany({
            where: {
              professionId,
              categoryId: { in: toRemove }
            }
          });
        }

        // 4. Aggiungi nuove associazioni (upsert per garantire ID richiesto)
        for (const categoryId of toAdd) {
          const genId = `pc_${professionId}_${categoryId}`;
          await tx.professionCategory.upsert({
            where: { id: genId },
            create: {
              id: genId,
              // Usa le chiavi di relazione esatte generate da Prisma (PascalCase)
              Profession: { connect: { id: professionId } },
              Category: { connect: { id: categoryId } },
              isActive: true
            },
            update: {
              isActive: true
            }
          });
        }

        // 5. Ritorna il risultato aggiornato
        const prof = await tx.profession.findUnique({
          where: { id: professionId },
          include: {
            ProfessionCategory: {
              include: {
                Category: true
              }
            }
          } as any
        });

        // Normalizza formato
        return prof
          ? {
              ...prof,
              categories: Array.isArray((prof as any).ProfessionCategory)
                ? (prof as any).ProfessionCategory.map((pc: any) => ({
                    id: pc.id,
                    professionId: pc.professionId,
                    categoryId: pc.categoryId,
                    isDefault: pc.isDefault,
                    isActive: pc.isActive,
                    category: pc.Category || pc.category || null
                  }))
                : []
            }
          : null;
      });

      logger.info(`Associazioni aggiornate per professione: ${profession.name}`);

      return res.json(ResponseFormatter.success(
        result,
        'Associazioni aggiornate con successo'
      ));
    } catch (error) {
      logger.error('Errore aggiornamento bulk:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Errore aggiornamento associazioni',
        'BULK_UPDATE_ERROR'
      ));
    }
  }
);

export default router;
