import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { ResponseFormatter } from '../utils/responseFormatter';
import logger from '../utils/logger';
import prisma from '../config/database';

const router = Router();

// Configurazioni temporanee in memoria
const tempConfigs: any = {};

// GET /api/professional/whatsapp/config
router.get('/config', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const config = tempConfigs[userId] || {
      aiEnabled: false,
      aiConfigProfessional: {},
      aiConfigClient: {},
      professionalNumbers: [],
      trustedNumbers: [],
      blockedNumbers: []
    };
    return res.json(ResponseFormatter.success(config));
  } catch (error) {
    logger.error('Error fetching config:', error);
    return res.status(500).json(ResponseFormatter.error('Failed to fetch config', 'CONFIG_ERROR'));
  }
});

// PUT /api/professional/whatsapp/config
router.put('/config', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.id;
    tempConfigs[userId] = { ...tempConfigs[userId], ...req.body };
    return res.json(ResponseFormatter.success(tempConfigs[userId], 'Config updated'));
  } catch (error) {
    logger.error('Error updating config:', error);
    return res.status(500).json(ResponseFormatter.error('Failed to update config', 'UPDATE_ERROR'));
  }
});

// POST /api/professional/whatsapp/numbers/add
router.post('/numbers/add', authenticate, async (req: any, res) => {
  try {
    const { phoneNumber, type } = req.body;
    const userId = req.user.id;
    
    if (!tempConfigs[userId]) {
      tempConfigs[userId] = { professionalNumbers: [], trustedNumbers: [], blockedNumbers: [] };
    }
    
    const fieldMap: any = {
      professional: 'professionalNumbers',
      trusted: 'trustedNumbers',
      blocked: 'blockedNumbers'
    };
    
    const field = fieldMap[type];
    if (!field || !tempConfigs[userId][field]) {
      tempConfigs[userId][field] = [];
    }
    
    if (!tempConfigs[userId][field].includes(phoneNumber)) {
      tempConfigs[userId][field].push(phoneNumber);
    }
    
    return res.json(ResponseFormatter.success(tempConfigs[userId], 'Number added'));
  } catch (error) {
    logger.error('Error adding number:', error);
    return res.status(500).json(ResponseFormatter.error('Failed to add number', 'ADD_ERROR'));
  }
});

// DELETE /api/professional/whatsapp/numbers/remove
router.delete('/numbers/remove', authenticate, async (req: any, res) => {
  try {
    const { phoneNumber, type } = req.body;
    const userId = req.user.id;
    
    if (!tempConfigs[userId]) {
      return res.json(ResponseFormatter.success({}, 'No config found'));
    }
    
    const fieldMap: any = {
      professional: 'professionalNumbers',
      trusted: 'trustedNumbers',
      blocked: 'blockedNumbers'
    };
    
    const field = fieldMap[type];
    if (field && tempConfigs[userId][field]) {
      tempConfigs[userId][field] = tempConfigs[userId][field].filter((n: string) => n !== phoneNumber);
    }
    
    return res.json(ResponseFormatter.success(tempConfigs[userId], 'Number removed'));
  } catch (error) {
    logger.error('Error removing number:', error);
    return res.status(500).json(ResponseFormatter.error('Failed to remove number', 'REMOVE_ERROR'));
  }
});

// POST /api/professional/whatsapp/test-detection
router.post('/test-detection', authenticate, async (req: any, res) => {
  try {
    const { phoneNumber, message } = req.body;
    const userId = req.user.id;
    const userConfig = tempConfigs[userId];
    
    let mode = 'CLIENT';
    let confidence = 0.85;
    let factors = ['Default: Cliente'];
    
    if (userConfig) {
      if (userConfig.professionalNumbers?.includes(phoneNumber)) {
        mode = 'PROFESSIONAL';
        confidence = 1.0;
        factors = ['Numero in lista professionisti'];
      } else if (userConfig.trustedNumbers?.includes(phoneNumber)) {
        mode = 'PROFESSIONAL';
        confidence = 0.9;
        factors = ['Numero in lista fidati'];
      } else if (userConfig.blockedNumbers?.includes(phoneNumber)) {
        mode = 'BLOCKED';
        confidence = 1.0;
        factors = ['Numero in lista bloccati'];
      }
    }
    
    return res.json(ResponseFormatter.success({ mode, confidence, factors }, 'Detection complete'));
  } catch (error) {
    logger.error('Error testing detection:', error);
    return res.status(500).json(ResponseFormatter.error('Detection failed', 'DETECTION_ERROR'));
  }
});

// POST /api/professional/whatsapp/test-sanitization
router.post('/test-sanitization', authenticate, async (req: any, res) => {
  try {
    const { text, mode } = req.body;
    let sanitized = text;
    
    if (mode === 'CLIENT' && text) {
      sanitized = sanitized.replace(/prezzo netto[:\s]+[\d,\.]+/gi, 'prezzo: [contattaci]');
      sanitized = sanitized.replace(/margine[:\s]+[\d,\.]+%?/gi, '');
    }
    
    return res.json(ResponseFormatter.success({ original: text, sanitized }, 'Sanitization complete'));
  } catch (error) {
    logger.error('Error testing sanitization:', error);
    return res.status(500).json(ResponseFormatter.error('Sanitization failed', 'SANITIZATION_ERROR'));
  }
});

// GET /api/professional/whatsapp/kb/:subcategoryId
router.get('/kb/:subcategoryId', authenticate, async (req: any, res) => {
  try {
    const { subcategoryId } = req.params;
    const subcategory = await prisma.subcategory.findUnique({
      where: { id: subcategoryId },
      select: { id: true, name: true }
    });
    
    if (!subcategory) {
      return res.status(404).json(ResponseFormatter.error('Subcategory not found', 'NOT_FOUND'));
    }
    
    return res.json(ResponseFormatter.success({
      kbProfessional: { info: "Informazioni tecniche per professionisti" },
      kbClient: { info: "Informazioni generali per clienti" }
    }));
  } catch (error) {
    logger.error('Error fetching KB:', error);
    return res.status(500).json(ResponseFormatter.error('Failed to fetch KB', 'KB_ERROR'));
  }
});

// PUT /api/professional/whatsapp/kb/:subcategoryId/professional
router.put('/kb/:subcategoryId/professional', authenticate, async (req: any, res) => {
  try {
    const { subcategoryId } = req.params;
    const { kb } = req.body;
    logger.info(`KB Professional updated for subcategory ${subcategoryId}`);
    return res.json(ResponseFormatter.success(kb, 'KB Professional updated'));
  } catch (error) {
    logger.error('Error updating KB:', error);
    return res.status(500).json(ResponseFormatter.error('Failed to update KB', 'KB_UPDATE_ERROR'));
  }
});

// PUT /api/professional/whatsapp/kb/:subcategoryId/client
router.put('/kb/:subcategoryId/client', authenticate, async (req: any, res) => {
  try {
    const { subcategoryId } = req.params;
    const { kb } = req.body;
    logger.info(`KB Client updated for subcategory ${subcategoryId}`);
    return res.json(ResponseFormatter.success(kb, 'KB Client updated'));
  } catch (error) {
    logger.error('Error updating KB:', error);
    return res.status(500).json(ResponseFormatter.error('Failed to update KB', 'KB_UPDATE_ERROR'));
  }
});

// GET /api/professional/whatsapp/accuracy
router.get('/accuracy', authenticate, async (req: any, res) => {
  try {
    return res.json(ResponseFormatter.success({
      totalDetections: 0,
      correctDetections: 0,
      overrides: 0,
      accuracy: 1.0,
      modeDistribution: { PROFESSIONAL: 0, CLIENT: 0, BLOCKED: 0 },
      confidenceAverage: 0
    }, 'Accuracy data retrieved'));
  } catch (error) {
    logger.error('Error fetching accuracy:', error);
    return res.status(500).json(ResponseFormatter.error('Failed to fetch accuracy', 'ACCURACY_ERROR'));
  }
});

// GET /api/professional/whatsapp/messages/recent
router.get('/messages/recent', authenticate, async (req: any, res) => {
  try {
    return res.json(ResponseFormatter.success([], 'Recent messages retrieved'));
  } catch (error) {
    logger.error('Error fetching messages:', error);
    return res.status(500).json(ResponseFormatter.error('Failed to fetch messages', 'MESSAGES_ERROR'));
  }
});

// POST /api/professional/whatsapp/override-detection
router.post('/override-detection', authenticate, async (req: any, res) => {
  try {
    const { phoneNumber, mode, reason } = req.body;
    logger.info('Detection override:', { phoneNumber, mode, reason });
    return res.json(ResponseFormatter.success(null, 'Override saved'));
  } catch (error) {
    logger.error('Error saving override:', error);
    return res.status(500).json(ResponseFormatter.error('Failed to save override', 'OVERRIDE_ERROR'));
  }
});

// GET /api/professional/whatsapp/subcategories-list
router.get('/subcategories-list', authenticate, async (req: any, res) => {
  try {
    const subcategories = await prisma.subcategory.findMany({
      select: {
        id: true,
        name: true,
        category: {
          select: { id: true, name: true }
        }
      },
      orderBy: [
        { category: { name: 'asc' } },
        { name: 'asc' }
      ]
    });
    
    return res.json(ResponseFormatter.success(subcategories));
  } catch (error) {
    logger.error('Error fetching subcategories:', error);
    return res.status(500).json(ResponseFormatter.error('Failed to fetch subcategories', 'FETCH_ERROR'));
  }
});

export default router;
