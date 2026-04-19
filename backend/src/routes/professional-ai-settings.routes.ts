/**
 * Professional AI Settings Routes
 * Gestione delle impostazioni AI per i professionisti
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { ResponseFormatter } from '../utils/responseFormatter';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Schema validazione
const aiSettingsSchema = z.object({
  modelName: z.enum(['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo']).optional(),
  temperature: z.number().min(0).max(1).optional(),
  maxTokens: z.number().min(500).max(4000).optional(),
  responseStyle: z.enum(['formal', 'informal', 'technical', 'educational', 'friendly']).optional(),
  detailLevel: z.enum(['basic', 'intermediate', 'advanced']).optional(),
  systemPrompt: z.string().optional(),
  useKnowledgeBase: z.boolean().optional(),
  autoReply: z.boolean().optional(),
  replyDelay: z.number().min(0).max(3600).optional()
});

/**
 * GET /api/professionals/:professionalId/ai-settings/:subcategoryId
 * Ottieni le impostazioni AI per un professionista
 */
router.get('/:professionalId/ai-settings/:subcategoryId', authenticate, async (req: any, res) => {
  try {
    const { professionalId, subcategoryId } = req.params;
    
    // Verifica autorizzazioni
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN' && req.user.id !== professionalId) {
      return res.status(403).json(
        ResponseFormatter.error('Non autorizzato', 'FORBIDDEN')
      );
    }
    
    // Cerca impostazioni esistenti
    // @ts-ignore - Prisma potrebbe non riconoscere ancora il modello
    let settings = await prisma.professionalAiSettings?.findFirst?.({
      where: {
        professionalId,
        subcategoryId
      }
    });

    // Se il modello non esiste ancora, usa una query raw
    if (!settings && !prisma.professionalAiSettings) {
      const result = await prisma.$queryRaw`
        SELECT * FROM "ProfessionalAiSettings" 
        WHERE "professionalId" = ${professionalId} 
        AND "subcategoryId" = ${subcategoryId}
        LIMIT 1
      `;
      settings = (result as any)[0] || null;
    }

    // Se non esistono, crea default
    if (!settings) {
      settings = await prisma.professionalAiSettings.create({
        data: {
          professionalId,
          subcategoryId,
          modelName: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000,
          responseStyle: 'professional',
          detailLevel: 'advanced',
          systemPrompt: 'Sei un assistente AI professionale che aiuta i professionisti a gestire le richieste dei clienti. Fornisci risposte tecniche e precise.',
          useKnowledgeBase: true,
          // autoReply: false,  // REMOVED - Field does not exist in Prisma schema
          // replyDelay: 300,   // REMOVED - Field does not exist in Prisma schema
          updatedAt: new Date()
        }
      });
    }

    return res.json(
      ResponseFormatter.success(settings, 'Impostazioni AI professionista recuperate con successo')
    );
  } catch (error: unknown) {
    logger.error('Error fetching professional AI settings:', error instanceof Error ? error.message : String(error));
    return res.status(500).json(
      ResponseFormatter.error('Errore nel recupero delle impostazioni AI professionista', 'FETCH_ERROR')
    );
  }
});

/**
 * PUT /api/professionals/:professionalId/ai-settings/:subcategoryId
 * Aggiorna le impostazioni AI per un professionista
 */
router.put('/:professionalId/ai-settings/:subcategoryId', authenticate, validateRequest(aiSettingsSchema), async (req: any, res) => {
  try {
    const { professionalId, subcategoryId } = req.params;
    const data = req.body;
    
    // Verifica autorizzazioni
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN' && req.user.id !== professionalId) {
      return res.status(403).json(
        ResponseFormatter.error('Non autorizzato', 'FORBIDDEN')
      );
    }

    // Cerca impostazione esistente
    const existing = await prisma.professionalAiSettings.findFirst({
      where: {
        professionalId,
        subcategoryId
      }
    });

    let settings;
    if (existing) {
      // Aggiorna esistente
      settings = await prisma.professionalAiSettings.update({
        where: { id: existing.id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      });
    } else {
      // Crea nuova
      settings = await prisma.professionalAiSettings.create({
        data: {
          professionalId,
          subcategoryId,
          ...data,
          updatedAt: new Date()
        }
      });
    }

    return res.json(
      ResponseFormatter.success(settings, 'Impostazioni AI professionista aggiornate con successo')
    );
  } catch (error: unknown) {
    logger.error('Error updating professional AI settings:', error instanceof Error ? error.message : String(error));
    return res.status(500).json(
      ResponseFormatter.error('Errore nell\'aggiornamento delle impostazioni AI professionista', 'UPDATE_ERROR')
    );
  }
});

/**
 * GET /api/professionals/:professionalId/ai-settings
 * Ottieni tutte le impostazioni AI di un professionista
 */
router.get('/:professionalId/ai-settings', authenticate, async (req: any, res) => {
  try {
    const { professionalId } = req.params;
    
    // Verifica autorizzazioni
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN' && req.user.id !== professionalId) {
      return res.status(403).json(
        ResponseFormatter.error('Non autorizzato', 'FORBIDDEN')
      );
    }
    
    const settings = await prisma.professionalAiSettings.findMany({
      where: {
        professionalId
      },
      include: {
        Subcategory: {
          select: {
            id: true,
            name: true,
            Category: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    return res.json(
      ResponseFormatter.success(settings, 'Impostazioni AI professionista recuperate con successo')
    );
  } catch (error: unknown) {
    logger.error('Error fetching all professional AI settings:', error instanceof Error ? error.message : String(error));
    return res.status(500).json(
      ResponseFormatter.error('Errore nel recupero delle impostazioni AI', 'FETCH_ERROR')
    );
  }
});

export default router;
