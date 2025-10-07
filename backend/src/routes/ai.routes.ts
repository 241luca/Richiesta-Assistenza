import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import { Router } from 'express';
import { z } from 'zod';
import { aiService } from '../services/ai.service';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { ResponseFormatter } from '../utils/responseFormatter';
import { logger } from '../utils/logger';
import { requireModule } from '../middleware/module.middleware';

const router = Router();

// 🔒 Protegge tutte le routes dell'AI Assistant
// Se il modulo 'ai-assistant' è disabilitato, blocca l'accesso con 403
router.use(requireModule('ai-assistant'));

/**
 * POST /api/ai/chat
 * Invia un messaggio all'AI
 */
router.post('/chat', authenticate, async (req: any, res) => {
  try {
    const { message, requestId, subcategoryId, conversationType = 'client_help' } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json(ResponseFormatter.error(
        'Message is required',
        'MISSING_MESSAGE'
      ));
    }

    const response = await aiService.sendMessage({
      userId,
      message,
      requestId,
      subcategoryId,
      conversationType
    });

    return res.json(ResponseFormatter.success(
      response,
      'AI response generated successfully'
    ));
  } catch (error) {
    logger.error('Error in AI chat:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Failed to generate AI response',
      'AI_ERROR'
    ));
  }
});

/**
 * POST /api/ai/categorize-request  
 * Categorizza automaticamente una richiesta usando l'AI
 */
const categorizeSchema = z.object({
  description: z.string().min(20, 'Descrizione troppo breve').max(500, 'Descrizione troppo lunga')
});

router.post('/categorize-request', authenticate, validateRequest(categorizeSchema), async (req: any, res) => {
  try {
    const { description } = req.body;
    const userId = req.user.id;
    
    // Verifica che sia configurata l'API key OpenAI
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        service: 'OPENAI',
        isActive: true
      }
    });
    
    if (!apiKey) {
      return res.status(503).json(ResponseFormatter.error(
        'Servizio AI non configurato. Contatta l\'amministratore.',
        'AI_NOT_CONFIGURED'
      ));
    }
    
    // Recupera le categorie disponibili dal database
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        subcategories: {
          where: { isActive: true }
        }
      }
    });
    
    const categoryList = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      subcategories: cat.subcategories.map(sub => ({ id: sub.id, name: sub.name }))
    }));
    
    // Chiama il servizio AI per la categorizzazione
    const aiResponse = await aiService.sendMessage({
      userId,
      message: `Categorizza questa richiesta di assistenza domestica: "${description}"
      
Categorie disponibili: ${JSON.stringify(categoryList, null, 2)}
      
Rispondi SOLO con un oggetto JSON valido:
      {
        "categoryId": "id della categoria suggerita",
        "categoryName": "nome categoria",
        "subcategoryId": "id sottocategoria suggerita", 
        "subcategoryName": "nome sottocategoria",
        "priority": "LOW|MEDIUM|HIGH|URGENT",
        "estimatedDuration": "durata stimata in minuti (numero)",
        "confidence": "0.XX (numero tra 0 e 1)",
        "reason": "spiegazione breve della scelta"
      }`,
      conversationType: 'categorization'
    });
    
    // Cerca di parsare la risposta JSON
    let result;
    try {
      // Pulisci la risposta da eventuali markdown
      const cleanResponse = aiResponse.replace(/```json\n?|```\n?/g, '').trim();
      result = JSON.parse(cleanResponse);
      
      // Valida che i campi richiesti siano presenti
      if (!result.categoryId || !result.subcategoryId || !result.priority) {
        throw new Error('Risposta AI incompleta');
      }
      
      // Verifica che categoria e sottocategoria esistano nel database
      const category = categories.find(c => c.id === result.categoryId);
      const subcategory = category?.subcategories.find(s => s.id === result.subcategoryId);
      
      if (!category || !subcategory) {
        throw new Error('Categoria o sottocategoria non valida');
      }
      
      // Aggiungi informazioni complete
      result.categoryName = category.name;
      result.subcategoryName = subcategory.name;
      
    } catch (parseError) {
      logger.warn('AI response parsing failed:', { aiResponse, error: parseError });
      
      // Fallback: categoria generica
      const genericCategory = categories.find(c => c.name.toLowerCase().includes('altro'));
      const genericSubcategory = genericCategory?.subcategories[0];
      
      result = {
        categoryId: genericCategory?.id || categories[0]?.id,
        categoryName: genericCategory?.name || categories[0]?.name,
        subcategoryId: genericSubcategory?.id || categories[0]?.subcategories[0]?.id,
        subcategoryName: genericSubcategory?.name || categories[0]?.subcategories[0]?.name,
        priority: 'MEDIUM',
        estimatedDuration: 60,
        confidence: 0.5,
        reason: 'Categorizzazione automatica non riuscita, usata categoria generica'
      };
    }
    
    logger.info(`AI categorization for user ${userId}: ${result.categoryName} > ${result.subcategoryName} (confidence: ${result.confidence})`);
    
    return res.json(ResponseFormatter.success(
      result,
      'Richiesta categorizzata con successo'
    ));
    
  } catch (error) {
    logger.error('Error in AI categorization:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella categorizzazione automatica',
      'AI_CATEGORIZATION_ERROR'
    ));
  }
});

/**
 * GET /api/ai/health
 * Check AI service health
 */
router.get('/health', async (req, res) => {
  try {
    // Check if OpenAI is configured
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        service: 'OPENAI',
        isActive: true
      }
    });

    const status = {
      service: 'AI Service',
      status: apiKey ? 'operational' : 'not_configured',
      hasApiKey: !!apiKey,
      message: apiKey ? 'Servizio AI operativo' : 'Configura la chiave OpenAI in Admin > API Keys'
    };

    return res.json(ResponseFormatter.success(
      status,
      'AI service health check'
    ));
  } catch (error) {
    logger.error('Error checking AI health:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Failed to check AI service health',
      'HEALTH_CHECK_ERROR'
    ));
  }
});

export default router;