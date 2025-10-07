import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import aiProfessionalService from '../services/ai-professional.service';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { ResponseFormatter } from '../utils/responseFormatter';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Schema validazione
const chatSchema = z.object({
  message: z.string().min(1).max(4000),
  requestId: z.string().optional(),
  subcategoryId: z.string().optional(),
  professionalId: z.string().optional(),
  mode: z.enum(['professional', 'client']).optional(),
  conversationType: z.enum(['client_help', 'professional_help', 'system_help']).optional(),
  conversationId: z.string().optional()
});

const aiConfigSchema = z.object({
  modelName: z.string().default('gpt-3.5-turbo'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(100).max(4000).default(2048),
  systemPrompt: z.string().min(10).max(2000),
  topP: z.number().min(0).max(1).default(1),
  frequencyPenalty: z.number().min(0).max(2).default(0),
  presencePenalty: z.number().min(0).max(2).default(0)
});

/**
 * POST /api/ai/chat
 * Chat con l'AI - Endpoint principale
 */
router.post('/chat', authenticate, async (req: any, res) => {
  try {
    const validatedData = chatSchema.parse(req.body);
    const userId = req.user.id;

    // Converti mode in conversationType se presente
    let conversationType = validatedData.conversationType;
    if (validatedData.mode) {
      conversationType = validatedData.mode === 'professional' ? 'professional_help' : 'client_help';
    }

    const response = await aiProfessionalService.sendMessage({
      userId,
      ...validatedData,
      conversationType: conversationType || 'client_help'
    });

    return res.json(ResponseFormatter.success(
      response,
      'Risposta AI generata con successo'
    ));
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(ResponseFormatter.error(
        'Dati non validi',
        'VALIDATION_ERROR',
        error.errors
      ));
    }

    logger.error('Errore chat AI:', error);
    return res.status(500).json(ResponseFormatter.error(
      error.message || 'Errore nella generazione della risposta',
      'AI_ERROR'
    ));
  }
});

/**
 * GET /api/ai/health
 * Stato del servizio AI
 */
router.get('/health', async (req, res) => {
  try {
    const [apiKey, testResult] = await Promise.all([
      prisma.apiKey.findFirst({
        where: { service: 'OPENAI', isActive: true }
      }),
      aiProfessionalService.testConnection()
    ]);

    const status = {
      service: 'AI Service Professional',
      status: apiKey && testResult ? 'operational' : 'not_configured',
      hasApiKey: !!apiKey,
      connectionTest: testResult,
      message: apiKey 
        ? (testResult ? '✅ Servizio AI completamente operativo' : '⚠️ Problema connessione OpenAI')
        : '❌ Configura la chiave OpenAI in Admin > API Keys'
    };

    return res.json(ResponseFormatter.success(
      status,
      'Stato servizio AI'
    ));
  } catch (error) {
    logger.error('Errore health check AI:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore controllo servizio',
      'HEALTH_ERROR'
    ));
  }
});

/**
 * GET /api/ai/stats
 * Statistiche utilizzo AI (solo admin)
 */
router.get('/stats', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const stats = await aiProfessionalService.getUsageStats(req.query.userId);
    
    return res.json(ResponseFormatter.success(
      stats,
      'Statistiche AI recuperate'
    ));
  } catch (error) {
    logger.error('Errore recupero statistiche:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore recupero statistiche',
      'STATS_ERROR'
    ));
  }
});

/**
 * DELETE /api/ai/conversation/:id
 * Clear conversazione specifica
 */
router.delete('/conversation/:id', authenticate, async (req: any, res) => {
  try {
    aiProfessionalService.clearConversation(req.params.id);
    
    return res.json(ResponseFormatter.success(
      { cleared: true },
      'Conversazione cancellata'
    ));
  } catch (error) {
    logger.error('Errore cancellazione conversazione:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore cancellazione',
      'DELETE_ERROR'
    ));
  }
});

/**
 * GET /api/ai/config/subcategory/:id
 * Ottieni configurazione AI per sottocategoria
 */
router.get('/config/subcategory/:id', authenticate, async (req, res) => {
  try {
    const config = await prisma.subcategoryAiSettings.findUnique({
      where: { subcategoryId: req.params.id }
    });

    if (!config) {
      return res.status(404).json(ResponseFormatter.error(
        'Configurazione non trovata',
        'NOT_FOUND'
      ));
    }

    return res.json(ResponseFormatter.success(
      config,
      'Configurazione recuperata'
    ));
  } catch (error) {
    logger.error('Errore recupero config:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore recupero configurazione',
      'CONFIG_ERROR'
    ));
  }
});

/**
 * POST /api/ai/config/subcategory/:id
 * Configura AI per sottocategoria (solo admin)
 */
router.post('/config/subcategory/:id', 
  authenticate, 
  requireRole(['ADMIN', 'SUPER_ADMIN']), 
  async (req, res) => {
    try {
      const validatedData = aiConfigSchema.parse(req.body);
      const { id } = req.params;

      const existing = await prisma.subcategoryAiSettings.findUnique({
        where: { subcategoryId: id }
      });

      let config;
      if (existing) {
        config = await prisma.subcategoryAiSettings.update({
          where: { subcategoryId: id },
          data: validatedData
        });
      } else {
        config = await prisma.subcategoryAiSettings.create({
          data: {
            subcategoryId: id,
            ...validatedData
          }
        });
      }

      return res.json(ResponseFormatter.success(
        config,
        existing ? 'Configurazione aggiornata' : 'Configurazione creata'
      ));
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json(ResponseFormatter.error(
          'Dati configurazione non validi',
          'VALIDATION_ERROR',
          error.errors
        ));
      }

      logger.error('Errore configurazione AI:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Errore configurazione',
        'CONFIG_ERROR'
      ));
    }
  }
);

/**
 * GET /api/ai/config/professional
 * Ottieni personalizzazioni AI del professionista
 */
router.get('/config/professional', authenticate, async (req: any, res) => {
  try {
    // Verifica che sia un professionista
    if (req.user.role !== 'PROFESSIONAL') {
      return res.status(403).json(ResponseFormatter.error(
        'Solo i professionisti possono accedere',
        'FORBIDDEN'
      ));
    }

    const customizations = await prisma.professionalAiCustomization.findMany({
      where: {
        professionalId: req.user.id,
        isActive: true
      },
      include: {
        settings: true
      }
    });

    return res.json(ResponseFormatter.success(
      customizations,
      'Personalizzazioni recuperate'
    ));
  } catch (error) {
    logger.error('Errore recupero personalizzazioni:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore recupero personalizzazioni',
      'FETCH_ERROR'
    ));
  }
});

/**
 * POST /api/ai/config/professional/:subcategoryId
 * Personalizza AI per professionista-sottocategoria
 */
router.post('/config/professional/:subcategoryId',
  authenticate,
  async (req: any, res) => {
    try {
      // Verifica che sia un professionista
      if (req.user.role !== 'PROFESSIONAL') {
        return res.status(403).json(ResponseFormatter.error(
          'Solo i professionisti possono personalizzare',
          'FORBIDDEN'
        ));
      }

      const { subcategoryId } = req.params;
      const customization = req.body;

      // Verifica che esista la config base
      const baseSettings = await prisma.subcategoryAiSettings.findUnique({
        where: { subcategoryId }
      });

      if (!baseSettings) {
        return res.status(404).json(ResponseFormatter.error(
          'Configurazione base non trovata',
          'BASE_CONFIG_NOT_FOUND'
        ));
      }

      // Cerca personalizzazione esistente
      const existing = await prisma.professionalAiCustomization.findFirst({
        where: {
          professionalId: req.user.id,
          subcategoryId
        }
      });

      let result;
      if (existing) {
        result = await prisma.professionalAiCustomization.update({
          where: { id: existing.id },
          data: {
            ...customization,
            settingsId: baseSettings.id
          }
        });
      } else {
        result = await prisma.professionalAiCustomization.create({
          data: {
            professionalId: req.user.id,
            subcategoryId,
            settingsId: baseSettings.id,
            ...customization
          }
        });
      }

      return res.json(ResponseFormatter.success(
        result,
        existing ? 'Personalizzazione aggiornata' : 'Personalizzazione creata'
      ));
    } catch (error) {
      logger.error('Errore personalizzazione AI:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Errore personalizzazione',
        'CUSTOMIZATION_ERROR'
      ));
    }
  }
);

export default router;
