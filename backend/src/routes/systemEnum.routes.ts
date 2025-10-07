import { Router } from 'express';
import { ResponseFormatter } from '../utils/responseFormatter';

const router = Router();

/**
 * GET /api/system/enums
 * Ottieni tutti gli enum del sistema
 */
router.get('/enums', (req, res) => {
  const enums = {
    userRoles: ['CLIENT', 'PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN'],
    requestStatus: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'],
    requestPriority: ['low', 'medium', 'high', 'urgent'],
    paymentStatus: ['pending', 'paid', 'failed', 'refunded'],
    notificationTypes: ['email', 'sms', 'push', 'in_app'],
    aiConversationTypes: ['client_help', 'professional_help', 'system_help'],
    aiModels: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
    responseStyles: ['formal', 'informal', 'technical', 'educational'],
    detailLevels: ['basic', 'intermediate', 'advanced']
  };

  return res.json(ResponseFormatter.success(
    enums,
    'System enums retrieved successfully'
  ));
});

/**
 * GET /api/system/status
 * Stato generale del sistema
 */
router.get('/status', (req, res) => {
  return res.json(ResponseFormatter.success(
    {
      status: 'operational',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    },
    'System status'
  ));
});

export default router;
