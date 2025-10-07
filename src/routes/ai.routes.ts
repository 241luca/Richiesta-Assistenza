import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import { Router } from 'express';
import { aiService } from '../services/ai.service';
import { authenticate } from '../middleware/auth';
import { ResponseFormatter } from '../utils/responseFormatter';
import { logger } from '../utils/logger';

const router = Router();

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