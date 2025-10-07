/**
 * Client AI Settings Routes
 * Gestione delle impostazioni AI per i clienti
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
  useKnowledgeBase: z.boolean().optional()
});

/**
 * GET /api/client-settings/:professionalId/:subcategoryId
 * Ottieni le impostazioni AI per clienti
 */
router.get('/:professionalId/:subcategoryId', authenticate, async (req: any, res) => {
  try {
    const { professionalId, subcategoryId } = req.params;
    
    // Cerca impostazioni esistenti
    // @ts-ignore - Prisma potrebbe non riconoscere ancora il modello
    let settings = await prisma.clientAiSettings?.findFirst?.({
      where: {
        professionalId,
        subcategoryId
      }
    });

    // Se il modello non esiste ancora, usa una query raw
    if (!settings && !prisma.clientAiSettings) {
      const result = await prisma.$queryRaw`
        SELECT * FROM "ClientAiSettings" 
        WHERE "professionalId" = ${professionalId} 
        AND "subcategoryId" = ${subcategoryId}
        LIMIT 1
      `;
      settings = result[0] || null;
    }

    // Se non esistono, crea default
    if (!settings) {
      settings = await prisma.clientAiSettings.create({
        data: {
          professionalId,
          subcategoryId,
          modelName: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 1500,
          responseStyle: 'friendly',
          detailLevel: 'basic',
          systemPrompt: 'Sei un assistente cordiale e professionale. Spiega in modo semplice e chiaro, evitando tecnicismi non necessari.',
          useKnowledgeBase: true,
          updatedAt: new Date()  // Aggiungi questo campo
        }
      });
    }

    return res.json(
      ResponseFormatter.success(settings, 'Impostazioni AI cliente recuperate con successo')
    );
  } catch (error) {
    logger.error('Error fetching client AI settings:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore nel recupero delle impostazioni AI cliente', 'FETCH_ERROR')
    );
  }
});

/**
 * PUT /api/client-settings/:professionalId/:subcategoryId
 * Aggiorna le impostazioni AI per clienti
 */
router.put('/:professionalId/:subcategoryId', authenticate, validateRequest(aiSettingsSchema), async (req: any, res) => {
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
    const existing = await prisma.clientAiSettings.findFirst({
      where: {
        professionalId,
        subcategoryId
      }
    });

    let settings;
    if (existing) {
      // Aggiorna esistente
      settings = await prisma.clientAiSettings.update({
        where: { id: existing.id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      });
    } else {
      // Crea nuova
      settings = await prisma.clientAiSettings.create({
        data: {
          professionalId,
          subcategoryId,
          ...data
        }
      });
    }

    return res.json(
      ResponseFormatter.success(settings, 'Impostazioni AI cliente aggiornate con successo')
    );
  } catch (error) {
    logger.error('Error updating client AI settings:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore nell\'aggiornamento delle impostazioni AI cliente', 'UPDATE_ERROR')
    );
  }
});

export default router;
