/**
 * Professional Notification Template Routes
 * Gestisce template, eventi e statistiche notifiche
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { checkRole } from '../middleware/checkRole';
import { notificationTemplateService } from '../services/notificationTemplate.service';
import { ResponseFormatter } from '../utils/responseFormatter';
import { logger } from '../utils/logger';
import { body, param, query, validationResult } from 'express-validator';

const router = Router();

// Middleware per validazione
const handleValidationErrors = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(ResponseFormatter.error(
      'Validation failed',
      'VALIDATION_ERROR',
      errors.array()
    ));
  }
  next();
};

// ==================== PREVIEW ROUTES ====================

// POST /preview - Genera anteprima template
router.post('/preview',
  authenticate,
  [
    body('htmlContent').optional(),
    body('textContent').optional(),
    body('smsContent').optional(),
    body('whatsappContent').optional(),
    body('variables').optional(),
    body('subject').optional()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { htmlContent, textContent, smsContent, whatsappContent, variables = {}, subject } = req.body;
      
      // Log per debug
      logger.info('Preview request received:', {
        hasHtml: !!htmlContent,
        hasText: !!textContent,
        hasSms: !!smsContent,
        hasWhatsapp: !!whatsappContent,
        hasSubject: !!subject,
        variableCount: Object.keys(variables || {}).length
      });
      
      // Funzione per sostituire le variabili nel template
      const replaceVariables = (content: string, vars: any) => {
        if (!content) return '';
        let result = content;
        const varsObj = vars || {};
        Object.keys(varsObj).forEach(key => {
          const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
          result = result.replace(regex, varsObj[key] || '');
        });
        return result;
      };

      const preview = {
        html: replaceVariables(htmlContent || '', variables),
        text: replaceVariables(textContent || '', variables),
        sms: replaceVariables(smsContent || '', variables),
        whatsapp: replaceVariables(whatsappContent || '', variables),
        subject: replaceVariables(subject || '', variables)
      };

      return res.json(ResponseFormatter.success(
        preview,
        'Preview generated successfully'
      ));
    } catch (error: any) {
      logger.error('Error generating preview:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to generate preview',
        'PREVIEW_ERROR',
        error.message
      ));
    }
  }
);

// ==================== TEMPLATE ROUTES ====================

// GET /templates - Lista tutti i template
router.get('/templates', 
  authenticate,
  checkRole(['ADMIN', 'SUPER_ADMIN']),
  [
    query('category').optional().isString(),
    query('isActive').optional().isBoolean(),
    query('search').optional().isString()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const filters = {
        Category: req.query.category as string,
        isActive: req.query.isActive ? req.query.isActive === "true" : undefined,
        search: req.query.search as string
      };

      const templates = await notificationTemplateService.getAllTemplates(filters);

      return res.json(ResponseFormatter.success(
        templates,
        'Templates retrieved successfully',
        { count: templates.length }
      ));
    } catch (error) {
      logger.error('Error fetching templates:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to fetch templates',
        'FETCH_ERROR',
        error.message
      ));
    }
  }
);

// GET /templates/:code - Recupera template per codice
router.get('/templates/:code',
  authenticate,
  checkRole(['ADMIN', 'SUPER_ADMIN']),
  [
    param('code').notEmpty().isString()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const template = await notificationTemplateService.getTemplateByCode(req.params.code);

      return res.json(ResponseFormatter.success(
        template,
        'Template retrieved successfully'
      ));
    } catch (error) {
      logger.error('Error fetching template:', error);
      return res.status(404).json(ResponseFormatter.error(
        'Template not found',
        'NOT_FOUND',
        error.message
      ));
    }
  }
);

// POST /templates - Crea nuovo template
router.post('/templates',
  authenticate,
  checkRole(['ADMIN', 'SUPER_ADMIN']),
  [
    body('code').notEmpty().isString(),
    body('name').notEmpty().isString(),
    body('category').notEmpty().isString(),
    body('htmlContent').notEmpty().isString(),
    body('variables').isArray(),
    body('channels').isArray().notEmpty()
  ],
  handleValidationErrors,
  async (req: any, res: Response) => {
    try {
      const template = await notificationTemplateService.createTemplate(
        req.body,
        req.user.id
      );

      return res.status(201).json(ResponseFormatter.success(
        template,
        'Template created successfully'
      ));
    } catch (error) {
      logger.error('Error creating template:', error);
      return res.status(400).json(ResponseFormatter.error(
        'Failed to create template',
        'CREATE_ERROR',
        error.message
      ));
    }
  }
);

// PUT /templates/:id - Aggiorna template
router.put('/templates/:id',
  authenticate,
  checkRole(['ADMIN', 'SUPER_ADMIN']),
  [
    param('id').notEmpty().isString()
  ],
  handleValidationErrors,
  async (req: any, res: Response) => {
    try {
      const template = await notificationTemplateService.updateTemplate(
        req.params.id,
        req.body,
        req.user.id
      );

      return res.json(ResponseFormatter.success(
        template,
        'Template updated successfully'
      ));
    } catch (error) {
      logger.error('Error updating template:', error);
      return res.status(400).json(ResponseFormatter.error(
        'Failed to update template',
        'UPDATE_ERROR',
        error.message
      ));
    }
  }
);

// POST /templates/:code/preview - Preview di un template con variabili
router.post('/templates/:code/preview',
  authenticate,
  checkRole(['ADMIN', 'SUPER_ADMIN']),
  [
    param('code').notEmpty().isString(),
    body('variables').isObject(),
    body('channel').optional().isString()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const template = await notificationTemplateService.getTemplateByCode(req.params.code);
      const compiled = await notificationTemplateService.compileTemplate(
        template.id,
        req.body.variables,
        req.body.channel || 'email'
      );

      return res.json(ResponseFormatter.success(
        compiled,
        'Template preview generated successfully'
      ));
    } catch (error) {
      logger.error('Error previewing template:', error);
      return res.status(400).json(ResponseFormatter.error(
        'Failed to preview template',
        'PREVIEW_ERROR',
        error.message
      ));
    }
  }
);

// ==================== EVENT ROUTES ====================

// GET /events - Lista tutti gli eventi
router.get('/events',
  authenticate,
  checkRole(['ADMIN', 'SUPER_ADMIN']),
  [
    query('eventType').optional().isString(),
    query('isActive').optional().isBoolean()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const filters = {
        eventType: req.query.eventType as string,
        isActive: req.query.isActive === 'true'
      };

      const events = await notificationTemplateService.getAllEvents(filters);

      return res.json(ResponseFormatter.success(
        events,
        'Events retrieved successfully',
        { count: events.length }
      ));
    } catch (error) {
      logger.error('Error fetching events:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to fetch events',
        'FETCH_ERROR',
        error.message
      ));
    }
  }
);

// POST /events - Crea nuovo evento
router.post('/events',
  authenticate,
  checkRole(['ADMIN', 'SUPER_ADMIN']),
  [
    body('code').notEmpty().isString(),
    body('name').notEmpty().isString(),
    body('eventType').notEmpty().isString(),
    body('templateId').notEmpty().isString(),
    body('delay').optional().isInt({ min: 0 })
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const event = await notificationTemplateService.createEvent(req.body);

      return res.status(201).json(ResponseFormatter.success(
        event,
        'Event created successfully'
      ));
    } catch (error) {
      logger.error('Error creating event:', error);
      return res.status(400).json(ResponseFormatter.error(
        'Failed to create event',
        'CREATE_ERROR',
        error.message
      ));
    }
  }
);

// POST /events/:code/trigger - Trigger manuale di un evento
router.post('/events/:code/trigger',
  authenticate,
  checkRole(['ADMIN', 'SUPER_ADMIN']),
  [
    param('code').notEmpty().isString(),
    body('recipientId').notEmpty().isString(),
    body('variables').isObject()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      await notificationTemplateService.triggerEvent(req.params.code, {
        recipientId: req.body.recipientId,
        entityId: req.body.entityId,
        variables: req.body.variables
      });

      return res.json(ResponseFormatter.success(
        null,
        'Event triggered successfully'
      ));
    } catch (error) {
      logger.error('Error triggering event:', error);
      return res.status(400).json(ResponseFormatter.error(
        'Failed to trigger event',
        'TRIGGER_ERROR',
        error.message
      ));
    }
  }
);

// ==================== SEND ROUTES ====================

// POST /send - Invia notifica diretta con template
router.post('/send',
  authenticate,
  [
    body('templateCode').notEmpty().isString(),
    body('recipientId').notEmpty().isString(),
    body('variables').isObject(),
    body('channels').optional().isArray(),
    body('priority').optional().isString()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      await notificationTemplateService.sendNotification(req.body);

      return res.json(ResponseFormatter.success(
        null,
        'Notification queued successfully'
      ));
    } catch (error) {
      logger.error('Error sending notification:', error);
      return res.status(400).json(ResponseFormatter.error(
        'Failed to send notification',
        'SEND_ERROR',
        error.message
      ));
    }
  }
);

// POST /send-bulk - Invia notifiche a multiple persone
router.post('/send-bulk',
  authenticate,
  checkRole(['ADMIN', 'SUPER_ADMIN']),
  [
    body('templateCode').notEmpty().isString(),
    body('recipients').isArray().notEmpty(),
    body('variables').isObject()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const results = await Promise.allSettled(
        req.body.recipients.map(recipientId => 
          notificationTemplateService.sendNotification({
            templateCode: req.body.templateCode,
            recipientId,
            variables: req.body.variables,
            channels: req.body.channels,
            priority: req.body.priority
          })
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return res.json(ResponseFormatter.success(
        { successful, failed, total: results.length },
        'Bulk notifications queued'
      ));
    } catch (error) {
      logger.error('Error sending bulk notifications:', error);
      return res.status(400).json(ResponseFormatter.error(
        'Failed to send bulk notifications',
        'BULK_SEND_ERROR',
        error.message
      ));
    }
  }
);

// ==================== QUEUE ROUTES ====================

// POST /queue/process - Processa manualmente la coda
router.post('/queue/process',
  authenticate,
  checkRole(['ADMIN', 'SUPER_ADMIN']),
  [
    body('limit').optional().isInt({ min: 1, max: 1000 })
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const processed = await notificationTemplateService.processQueue(
        req.body.limit || 100
      );

      return res.json(ResponseFormatter.success(
        { processed },
        'Queue processed successfully'
      ));
    } catch (error) {
      logger.error('Error processing queue:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to process queue',
        'QUEUE_ERROR',
        error.message
      ));
    }
  }
);

// ==================== STATISTICS ROUTES ====================

// GET /statistics - Recupera statistiche notifiche
router.get('/statistics',
  authenticate,
  checkRole(['ADMIN', 'SUPER_ADMIN']),
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('channel').optional().isString(),
    query('templateId').optional().isString()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const filters = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        channel: req.query.channel as string,
        templateId: req.query.templateId as string
      };

      const stats = await notificationTemplateService.getStatistics(filters);

      return res.json(ResponseFormatter.success(
        stats,
        'Statistics retrieved successfully'
      ));
    } catch (error) {
      logger.error('Error fetching statistics:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to fetch statistics',
        'STATS_ERROR',
        error.message
      ));
    }
  }
);

// ==================== TEMPLATE CATEGORIES ====================

// GET /categories - Lista categorie disponibili per i template
router.get('/categories',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const categories = [
        { code: 'auth', name: 'Autenticazione', description: 'Login, registrazione, reset password' },
        { code: 'request', name: 'Richieste', description: 'Creazione, aggiornamento, completamento richieste' },
        { code: 'quote', name: 'Preventivi', description: 'Nuovi preventivi, accettazioni, rifiuti' },
        { code: 'payment', name: 'Pagamenti', description: 'Conferme pagamento, ricevute, promemoria' },
        { code: 'system', name: 'Sistema', description: 'Notifiche di sistema, manutenzione, aggiornamenti' },
        { code: 'marketing', name: 'Marketing', description: 'Newsletter, promozioni, offerte speciali' },
        { code: 'reminder', name: 'Promemoria', description: 'Appuntamenti, scadenze, follow-up' }
      ];

      return res.json(ResponseFormatter.success(
        categories,
        'Categories retrieved successfully'
      ));
    } catch (error) {
      logger.error('Error fetching categories:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to fetch categories',
        'CATEGORIES_ERROR',
        error.message
      ));
    }
  }
);

// ==================== EVENT TYPES ====================

// GET /event-types - Lista tipi di eventi disponibili
router.get('/event-types',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const eventTypes = [
        // Richieste
        { code: 'request_created', name: 'Richiesta Creata', entity: 'request' },
        { code: 'request_assigned', name: 'Richiesta Assegnata', entity: 'request' },
        { code: 'request_updated', name: 'Richiesta Aggiornata', entity: 'request' },
        { code: 'request_completed', name: 'Richiesta Completata', entity: 'request' },
        { code: 'request_cancelled', name: 'Richiesta Annullata', entity: 'request' },
        
        // Preventivi
        { code: 'quote_received', name: 'Preventivo Ricevuto', entity: 'quote' },
        { code: 'quote_accepted', name: 'Preventivo Accettato', entity: 'quote' },
        { code: 'quote_rejected', name: 'Preventivo Rifiutato', entity: 'quote' },
        { code: 'quote_expiring', name: 'Preventivo in Scadenza', entity: 'quote' },
        
        // Pagamenti
        { code: 'payment_completed', name: 'Pagamento Completato', entity: 'payment' },
        { code: 'payment_failed', name: 'Pagamento Fallito', entity: 'payment' },
        { code: 'deposit_received', name: 'Deposito Ricevuto', entity: 'payment' },
        
        // Chat
        { code: 'message_received', name: 'Messaggio Ricevuto', entity: 'message' },
        
        // Sistema
        { code: 'user_registered', name: 'Utente Registrato', entity: 'user' },
        { code: 'password_reset', name: 'Reset Password', entity: 'user' },
        { code: 'account_verified', name: 'Account Verificato', entity: 'user' }
      ];

      return res.json(ResponseFormatter.success(
        eventTypes,
        'Event types retrieved successfully'
      ));
    } catch (error) {
      logger.error('Error fetching event types:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to fetch event types',
        'EVENT_TYPES_ERROR',
        error.message
      ));
    }
  }
);

// ==================== EVENT ROUTES ====================

// GET /events - Lista tutti gli eventi
router.get('/events',
  authenticate,
  checkRole(['ADMIN', 'SUPER_ADMIN']),
  [
    query('eventType').optional().isString(),
    query('isActive').optional().isBoolean()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const filters = {
        eventType: req.query.eventType as string,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined
      };

      const events = await notificationTemplateService.getAllEvents(filters);

      return res.json(ResponseFormatter.success(
        events || [],
        'Events retrieved successfully',
        { count: events?.length || 0 }
      ));
    } catch (error) {
      logger.error('Error fetching events:', error);
      // Return empty array instead of error for now
      return res.json(ResponseFormatter.success(
        [],
        'No events found',
        { count: 0 }
      ));
    }
  }
);

export default router;
