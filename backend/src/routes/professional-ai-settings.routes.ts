/**
 * Professional AI Settings Routes
 * Gestione delle impostazioni AI personalizzate per professionista e sottocategoria
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { ResponseFormatter } from '../utils/responseFormatter';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Schema validazione impostazioni AI
const aiSettingsSchema = z.object({
  modelName: z.enum(['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo']).optional(),
  temperature: z.number().min(0).max(1).optional(),
  maxTokens: z.number().min(500).max(4000).optional(),
  responseStyle: z.enum(['formal', 'informal', 'technical', 'educational', 'friendly']).optional(),
  detailLevel: z.enum(['basic', 'intermediate', 'advanced']).optional(),
  systemPrompt: z.string().optional(),
  clientSystemPrompt: z.string().optional(),
  useKnowledgeBase: z.boolean().optional()
});

// Schema per l'aggiornamento delle impostazioni (uguale a aiSettingsSchema per ora)
const updateSettingsSchema = aiSettingsSchema;

/**
 * GET /api/professionals/:professionalId/ai-settings/:subcategoryId
 * Ottieni le impostazioni AI per un professionista e sottocategoria
 */
router.get('/:professionalId/ai-settings/:subcategoryId', authenticate, async (req: any, res) => {
  try {
    const { professionalId, subcategoryId } = req.params;
    
    logger.info(`Fetching AI settings for professional ${professionalId}, subcategory ${subcategoryId}`);
    
    // Verifica che il professionista esista
    const professional = await prisma.user.findUnique({
      where: { id: professionalId },
      select: { id: true, role: true }
    });
    
    if (!professional) {
      return res.status(404).json(ResponseFormatter.error(
        'Professionista non trovato',
        'PROFESSIONAL_NOT_FOUND'
      ));
    }
    
    if (professional.role !== 'PROFESSIONAL') {
      return res.status(400).json(ResponseFormatter.error(
        'L\'utente non è un professionista',
        'NOT_A_PROFESSIONAL'
      ));
    }
    
    // Verifica che la sottocategoria esista
    const subcategory = await prisma.subcategory.findUnique({
      where: { id: subcategoryId }
    });
    
    if (!subcategory) {
      return res.status(404).json(ResponseFormatter.error(
        'Sottocategoria non trovata',
        'SUBCATEGORY_NOT_FOUND'
      ));
    }
    
    // Cerca le impostazioni esistenti
    let settings = await prisma.professionalAiSettings.findFirst({
      where: {
        professionalId,
        subcategoryId
      }
    });
    
    // Se non esistono, crea le impostazioni di default
    if (!settings) {
      settings = await prisma.professionalAiSettings.create({
        data: {
          id: require('crypto').randomUUID(),
          professionalId,
          subcategoryId,
          modelName: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 2000,
          responseStyle: 'formal',
          detailLevel: 'intermediate',
          useKnowledgeBase: true,
          systemPrompt: null,
          updatedAt: new Date()
        }
      });
      
      logger.info(`Created default AI settings for professional ${professionalId}, subcategory ${subcategoryId}`);
    }
    
    return res.json(ResponseFormatter.success(
      settings,
      'Impostazioni AI recuperate con successo'
    ));
    
  } catch (error) {
    logger.error('Error fetching AI settings:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero delle impostazioni AI',
      'FETCH_ERROR'
    ));
  }
});

/**
 * PUT /api/professionals/:professionalId/ai-settings/:subcategoryId
 * Aggiorna le impostazioni AI per un professionista e sottocategoria
 */
router.put('/:professionalId/ai-settings/:subcategoryId', authenticate, async (req: any, res) => {
  try {
    const { professionalId, subcategoryId } = req.params;
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;
    
    // Verifica permessi: admin o stesso professionista
    if (currentUserRole !== 'ADMIN' && 
        currentUserRole !== 'SUPER_ADMIN' && 
        currentUserId !== professionalId) {
      return res.status(403).json(ResponseFormatter.error(
        'Non autorizzato a modificare queste impostazioni',
        'UNAUTHORIZED'
      ));
    }
    
    logger.info(`Updating AI settings for professional ${professionalId}, subcategory ${subcategoryId}`);
    logger.info('Request body:', JSON.stringify(req.body));
    
    // Valida i dati
    const validatedData = aiSettingsSchema.parse(req.body);
    
    // Verifica che il professionista esista
    const professional = await prisma.user.findUnique({
      where: { id: professionalId },
      select: { id: true, role: true }
    });
    
    if (!professional) {
      return res.status(404).json(ResponseFormatter.error(
        'Professionista non trovato',
        'PROFESSIONAL_NOT_FOUND'
      ));
    }
    
    if (professional.role !== 'PROFESSIONAL') {
      return res.status(400).json(ResponseFormatter.error(
        'L\'utente non è un professionista',
        'NOT_A_PROFESSIONAL'
      ));
    }
    
    // Verifica che la sottocategoria esista
    const subcategory = await prisma.subcategory.findUnique({
      where: { id: subcategoryId }
    });
    
    if (!subcategory) {
      return res.status(404).json(ResponseFormatter.error(
        'Sottocategoria non trovata',
        'SUBCATEGORY_NOT_FOUND'
      ));
    }
    
    // Prima verifica se esistono le impostazioni
    const existingSettings = await prisma.professionalAiSettings.findFirst({
      where: {
        professionalId,
        subcategoryId
      }
    });
    
    let settings;
    if (existingSettings) {
      // Aggiorna le impostazioni esistenti - salva systemPrompt per il professionista
      settings = await prisma.professionalAiSettings.update({
        where: { id: existingSettings.id },
        data: {
          ...validatedData,
          systemPrompt: validatedData.systemPrompt,  // Assicura che il prompt sia salvato
          updatedAt: new Date()
        }
      });
    } else {
      // Crea nuove impostazioni
      settings = await prisma.professionalAiSettings.create({
        data: {
          id: require('crypto').randomUUID(),
          professionalId,
          subcategoryId,
          modelName: validatedData.modelName || 'gpt-3.5-turbo',
          temperature: validatedData.temperature || 0.7,
          maxTokens: validatedData.maxTokens || 2000,
          responseStyle: validatedData.responseStyle || 'formal',
          detailLevel: validatedData.detailLevel || 'intermediate',
          useKnowledgeBase: validatedData.useKnowledgeBase !== false,
          systemPrompt: validatedData.systemPrompt || null,
          updatedAt: new Date()
        }
      });
    }
    
    logger.info(`AI settings updated successfully for professional ${professionalId}`);
    
    return res.json(ResponseFormatter.success(
      settings,
      'Impostazioni AI aggiornate con successo'
    ));
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      logger.error('Validation error:', error.errors);
      return res.status(400).json(ResponseFormatter.error(
        'Dati non validi',
        'VALIDATION_ERROR',
        error.errors
      ));
    }
    
    logger.error('Error updating AI settings:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento delle impostazioni AI',
      'UPDATE_ERROR'
    ));
  }
});

/**
 * DELETE /api/professionals/:professionalId/ai-settings/:subcategoryId
 * Ripristina le impostazioni AI di default per un professionista e sottocategoria
 */
router.delete('/:professionalId/ai-settings/:subcategoryId', authenticate, async (req: any, res) => {
  try {
    const { professionalId, subcategoryId } = req.params;
    const currentUserRole = req.user.role;
    
    // Solo admin può resettare le impostazioni
    if (currentUserRole !== 'ADMIN' && currentUserRole !== 'SUPER_ADMIN') {
      return res.status(403).json(ResponseFormatter.error(
        'Solo gli amministratori possono resettare le impostazioni AI',
        'UNAUTHORIZED'
      ));
    }
    
    logger.info(`Resetting AI settings for professional ${professionalId}, subcategory ${subcategoryId}`);
    
    // Elimina le impostazioni esistenti (verranno ricreate con i default al prossimo accesso)
    await prisma.professionalAiSettings.deleteMany({
      where: {
        professionalId,
        subcategoryId
      }
    });
    
    // Crea nuove impostazioni di default
    const defaultSettings = await prisma.professionalAiSettings.create({
      data: {
        id: require('crypto').randomUUID(),
        professionalId,
        subcategoryId,
        modelName: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 2000,
        responseStyle: 'formal',
        detailLevel: 'intermediate',
        useKnowledgeBase: true,
        systemPrompt: null,
        updatedAt: new Date()
      }
    });
    
    logger.info(`AI settings reset to defaults for professional ${professionalId}`);
    
    return res.json(ResponseFormatter.success(
      defaultSettings,
      'Impostazioni AI ripristinate ai valori di default'
    ));
    
  } catch (error) {
    logger.error('Error resetting AI settings:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel reset delle impostazioni AI',
      'RESET_ERROR'
    ));
  }
});

/**
 * GET /api/professionals/:professionalId/ai-settings
 * Ottieni tutte le impostazioni AI di un professionista
 */
router.get('/:professionalId/ai-settings', authenticate, async (req: any, res) => {
  try {
    const { professionalId } = req.params;
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;
    
    // Verifica permessi: admin o stesso professionista
    if (currentUserRole !== 'ADMIN' && 
        currentUserRole !== 'SUPER_ADMIN' && 
        currentUserId !== professionalId) {
      return res.status(403).json(ResponseFormatter.error(
        'Non autorizzato a vedere queste impostazioni',
        'UNAUTHORIZED'
      ));
    }
    
    // Ottieni tutte le impostazioni del professionista
    const allSettings = await prisma.professionalAiSettings.findMany({
      where: { professionalId },
      include: {
        subcategory: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    return res.json(ResponseFormatter.success(
      allSettings,
      'Tutte le impostazioni AI recuperate con successo'
    ));
    
  } catch (error) {
    logger.error('Error fetching all AI settings:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero delle impostazioni AI',
      'FETCH_ERROR'
    ));
  }
});

// Get AI settings for client
router.get('/:professionalId/ai-settings-client/:subcategoryId', authenticate, async (req: any, res) => {
  try {
    const { professionalId, subcategoryId } = req.params;
    
    // Verifica autorizzazioni
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN' && req.user.id !== professionalId) {
      return res.status(403).json(
        ResponseFormatter.error('Non autorizzato', 'FORBIDDEN')
      );
    }

    // Cerca impostazioni esistenti (usa lo stesso record)
    let settings = await prisma.professionalAiSettings.findFirst({
      where: {
        professionalId,
        subcategoryId
      }
    });

    // Se non esistono, crea con valori default per entrambi
    if (!settings) {
      settings = await prisma.professionalAiSettings.create({
        data: {
          id: require('crypto').randomUUID(),
          professionalId,
          subcategoryId,
          // Impostazioni professionista (default)
          modelName: 'gpt-4',
          temperature: 0.3,
          maxTokens: 3000,
          responseStyle: 'technical',
          detailLevel: 'advanced',
          systemPrompt: 'Sei un assistente AI tecnico che supporta professionisti esperti.',
          // Impostazioni cliente (default)
          clientSystemPrompt: 'Sei un assistente cordiale e professionale. Spiega in modo semplice e chiaro.',
          clientTemperature: 0.7,
          clientMaxTokens: 1500,
          clientModelName: 'gpt-3.5-turbo',
          useKnowledgeBase: true,
          updatedAt: new Date()
        }
      });
    }

    // Ritorna le impostazioni con i valori del cliente
    const clientSettings = {
      ...settings,
      modelName: settings.clientModelName || 'gpt-3.5-turbo',
      temperature: settings.clientTemperature || 0.7,
      maxTokens: settings.clientMaxTokens || 1500,
      systemPrompt: settings.clientSystemPrompt || 'Sei un assistente cordiale e professionale.',
      targetAudience: 'client'
    };

    return res.json(
      ResponseFormatter.success(clientSettings, 'Impostazioni AI cliente recuperate con successo')
    );
  } catch (error) {
    logger.error('Error fetching client AI settings:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore nel recupero delle impostazioni AI cliente', 'FETCH_ERROR')
    );
  }
});

// Update AI settings for client
router.put('/:professionalId/ai-settings-client/:subcategoryId', authenticate, validateRequest(updateSettingsSchema), async (req: any, res) => {
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
      // Aggiorna esistente con TUTTE le impostazioni del cliente
      settings = await prisma.professionalAiSettings.update({
        where: { id: existing.id },
        data: {
          clientSystemPrompt: data.systemPrompt,  // Prompt del cliente
          clientTemperature: data.temperature,     // Temperatura del cliente
          clientMaxTokens: data.maxTokens,         // Max tokens del cliente
          clientModelName: data.modelName,         // Modello del cliente
          targetAudience: 'client',
          updatedAt: new Date()
        }
      });
    } else {
      // Crea nuova con valori default per professionista e valori specifici per cliente
      settings = await prisma.professionalAiSettings.create({
        data: {
          id: require('crypto').randomUUID(),
          professionalId,
          subcategoryId,
          // Impostazioni professionista (default)
          modelName: 'gpt-4',
          temperature: 0.3,
          maxTokens: 3000,
          responseStyle: 'technical',
          detailLevel: 'advanced',
          systemPrompt: null,
          // Impostazioni cliente (dai dati ricevuti)
          clientSystemPrompt: data.systemPrompt,
          clientTemperature: data.temperature || 0.7,
          clientMaxTokens: data.maxTokens || 1500,
          clientModelName: data.modelName || 'gpt-3.5-turbo',
          targetAudience: 'client',
          useKnowledgeBase: data.useKnowledgeBase !== false,
          updatedAt: new Date()
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
