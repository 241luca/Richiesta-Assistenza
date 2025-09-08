import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { prisma } from '../config/database';
import { ResponseFormatter } from '../utils/responseFormatter';
import { notificationService } from '../services/notification.service';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// ===== ADMIN ENDPOINTS =====

// GET /api/notifications/stats - Statistiche notifiche (ADMIN)
router.get('/stats', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    // Calcola statistiche generali
    const [total, sent, delivered, read, failed] = await Promise.all([
      prisma.notification.count(),
      prisma.notification.count({ where: { metadata: { path: ['status'], equals: 'sent' } } }),
      prisma.notification.count({ where: { metadata: { path: ['delivered'], equals: true } } }),
      prisma.notification.count({ where: { isRead: true } }),
      prisma.notification.count({ where: { metadata: { path: ['status'], equals: 'failed' } } })
    ]);

    // Statistiche per tipo
    const byType = await prisma.notification.groupBy({
      by: ['type'],
      _count: true,
      orderBy: { _count: { type: 'desc' } }
    });

    // Statistiche per priorità
    const byPriority = await prisma.notification.groupBy({
      by: ['priority'],
      _count: true
    });

    // Statistiche per canale (da metadata)
    const notifications = await prisma.notification.findMany({
      select: { metadata: true }
    });

    const channelCounts = {};
    notifications.forEach(n => {
      const channels = n.metadata?.channels || ['websocket'];
      channels.forEach(channel => {
        channelCounts[channel] = (channelCounts[channel] || 0) + 1;
      });
    });

    const byChannel = Object.entries(channelCounts).map(([channel, count]) => ({
      channel,
      count
    }));

    // Ultimi 7 giorni
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      const count = await prisma.notification.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate
          }
        }
      });

      last7Days.push({
        date: date.toISOString().split('T')[0],
        count
      });
    }

    const stats = {
      total,
      sent,
      delivered,
      read,
      failed,
      deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
      readRate: delivered > 0 ? (read / delivered) * 100 : 0,
      failureRate: total > 0 ? (failed / total) * 100 : 0,
      byType: byType.map(t => ({ type: t.type, count: t._count })),
      byPriority: byPriority.map(p => ({ priority: p.priority, count: p._count })),
      byChannel,
      last7Days
    };

    res.json(ResponseFormatter.success(stats, 'Statistics retrieved'));
  } catch (error) {
    logger.error('Error fetching notification stats:', error);
    res.status(500).json(ResponseFormatter.error('Failed to fetch statistics', 'STATS_ERROR'));
  }
});

// GET /api/notifications/logs - Log notifiche con filtri (ADMIN)
router.get('/logs', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const {
      type,
      priority,
      status,
      search,
      dateFrom,
      dateTo,
      page = 1,
      limit = 50
    } = req.query;

    const where = {};

    if (type) where.type = type;
    if (priority) where.priority = priority;
    if (status) {
      if (status === 'read') where.isRead = true;
      else if (status === 'unread') where.isRead = false;
      else where.metadata = { path: ['status'], equals: status };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          recipient: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              fullName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.notification.count({ where })
    ]);

    // Formatta le notifiche aggiungendo info sui canali
    const formattedNotifications = notifications.map(n => ({
      ...n,
      channels: n.metadata?.channels || ['websocket'],
      status: n.isRead ? 'read' : (n.metadata?.status || 'sent')
    }));

    res.json(ResponseFormatter.success(
      formattedNotifications,
      'Logs retrieved',
      {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    ));
  } catch (error) {
    logger.error('Error fetching notification logs:', error);
    res.status(500).json(ResponseFormatter.error('Failed to fetch logs', 'LOGS_ERROR'));
  }
});

// GET /api/notifications/templates - Lista template (ADMIN)
router.get('/templates', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const templates = await prisma.notificationTemplate.findMany({
      orderBy: [
        { category: 'asc' },
        { code: 'asc' }
      ]
    });

    res.json(ResponseFormatter.success(templates, 'Templates retrieved'));
  } catch (error) {
    logger.error('Error fetching templates:', error);
    res.status(500).json(ResponseFormatter.error('Failed to fetch templates', 'TEMPLATES_ERROR'));
  }
});

// POST /api/notifications/templates - Crea/aggiorna template (ADMIN)
router.post('/templates', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { id, ...data } = req.body;

    let template;
    if (id) {
      // Aggiorna template esistente
      template = await prisma.notificationTemplate.update({
        where: { id },
        data: {
          ...data,
          updatedBy: req.user.id,
          version: { increment: 1 }
        }
      });
    } else {
      // Crea nuovo template
      template = await prisma.notificationTemplate.create({
        data: {
          ...data,
          createdBy: req.user.id,
          updatedBy: req.user.id
        }
      });
    }

    res.json(ResponseFormatter.success(template, 'Template saved'));
  } catch (error) {
    logger.error('Error saving template:', error);
    res.status(500).json(ResponseFormatter.error('Failed to save template', 'TEMPLATE_SAVE_ERROR'));
  }
});

// DELETE /api/notifications/templates/:id - Elimina template (ADMIN)
router.delete('/templates/:id', authenticate, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const template = await prisma.notificationTemplate.findUnique({
      where: { id: req.params.id }
    });

    if (!template) {
      return res.status(404).json(ResponseFormatter.error('Template not found', 'NOT_FOUND'));
    }

    if (template.isSystem) {
      return res.status(403).json(ResponseFormatter.error('Cannot delete system template', 'FORBIDDEN'));
    }

    await prisma.notificationTemplate.delete({
      where: { id: req.params.id }
    });

    res.json(ResponseFormatter.success(null, 'Template deleted'));
  } catch (error) {
    logger.error('Error deleting template:', error);
    res.status(500).json(ResponseFormatter.error('Failed to delete template', 'DELETE_ERROR'));
  }
});

// POST /api/notifications/test - Invia notifica di test (ADMIN)
router.post('/test', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { userId, type, title, message, priority, channels } = req.body;

    await notificationService.sendToUser({
      userId: userId || req.user.id,
      type: type || 'TEST',
      title: title || 'Notifica di Test',
      message: message || 'Questa è una notifica di test inviata dall\'amministratore',
      priority: priority || 'normal',
      data: {
        testId: Date.now(),
        sentBy: req.user.email
      },
      channels: channels || ['websocket']
    });

    res.json(ResponseFormatter.success(null, 'Test notification sent'));
  } catch (error) {
    logger.error('Error sending test notification:', error);
    res.status(500).json(ResponseFormatter.error('Failed to send test', 'TEST_ERROR'));
  }
});

// POST /api/notifications/:id/resend - Reinvia notifica fallita (ADMIN)
router.post('/:id/resend', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id }
    });

    if (!notification) {
      return res.status(404).json(ResponseFormatter.error('Notification not found', 'NOT_FOUND'));
    }

    // Reinvia la notifica
    await notificationService.sendToUser({
      userId: notification.recipientId,
      type: notification.type,
      title: notification.title,
      message: notification.content,
      priority: notification.priority.toLowerCase(),
      data: notification.metadata,
      channels: notification.metadata?.channels || ['websocket', 'email']
    });

    // Aggiorna metadata per indicare reinvio
    await prisma.notification.update({
      where: { id: req.params.id },
      data: {
        metadata: {
          ...notification.metadata,
          resent: true,
          resentAt: new Date(),
          resentBy: req.user.id
        }
      }
    });

    res.json(ResponseFormatter.success(null, 'Notification resent'));
  } catch (error) {
    logger.error('Error resending notification:', error);
    res.status(500).json(ResponseFormatter.error('Failed to resend', 'RESEND_ERROR'));
  }
});

// GET /api/notifications/events - Lista eventi configurati (ADMIN)
router.get('/events', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const events = await prisma.notificationEvent.findMany({
      include: {
        NotificationTemplate: true
      },
      orderBy: [
        { eventType: 'asc' },
        { code: 'asc' }
      ]
    });

    res.json(ResponseFormatter.success(events, 'Events retrieved'));
  } catch (error) {
    logger.error('Error fetching events:', error);
    res.status(500).json(ResponseFormatter.error('Failed to fetch events', 'EVENTS_ERROR'));
  }
});

// POST /api/notifications/events - Crea/aggiorna evento (ADMIN)
router.post('/events', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { id, ...data } = req.body;

    let event;
    if (id) {
      event = await prisma.notificationEvent.update({
        where: { id },
        data
      });
    } else {
      event = await prisma.notificationEvent.create({
        data
      });
    }

    res.json(ResponseFormatter.success(event, 'Event saved'));
  } catch (error) {
    logger.error('Error saving event:', error);
    res.status(500).json(ResponseFormatter.error('Failed to save event', 'EVENT_SAVE_ERROR'));
  }
});

// ===== USER ENDPOINTS (già esistenti) =====

// GET /unread - Ottieni notifiche non lette
router.get('/unread', authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const notifications = await notificationService.getUnread(req.user!.id, limit);
    
    res.json(ResponseFormatter.success(
      notifications,
      'Unread notifications retrieved successfully',
      { count: notifications.length }
    ));
  } catch (error) {
    res.json(ResponseFormatter.error(
      'Error fetching notifications',
      'NOTIFICATIONS_FETCH_ERROR',
      error.message
    ));
  }
});

// POST /:id/read - Marca una notifica come letta
router.post('/:id/read', authenticate, async (req, res) => {
  try {
    await notificationService.markAsRead(req.params.id, req.user!.id);
    
    res.json(ResponseFormatter.success(
      null,
      'Notification marked as read'
    ));
  } catch (error) {
    res.json(ResponseFormatter.error(
      'Error marking notification as read',
      'NOTIFICATION_MARK_READ_ERROR',
      error.message
    ));
  }
});

// POST /read-all - Marca tutte le notifiche come lette
router.post('/read-all', authenticate, async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.user!.id);
    
    res.json(ResponseFormatter.success(
      null,
      'All notifications marked as read'
    ));
  } catch (error) {
    res.json(ResponseFormatter.error(
      'Error marking all notifications as read',
      'NOTIFICATIONS_MARK_ALL_READ_ERROR',
      error.message
    ));
  }
});

// GET /count - Conta notifiche non lette
router.get('/count', authenticate, async (req, res) => {
  try {
    const count = await notificationService.countUnread(req.user!.id);
    
    res.json(ResponseFormatter.success(
      { count },
      'Unread notifications count retrieved successfully'
    ));
  } catch (error) {
    res.json(ResponseFormatter.error(
      'Error counting notifications',
      'NOTIFICATIONS_COUNT_ERROR',
      error.message
    ));
  }
});

// ===== NUOVI ENDPOINT ADMIN =====

// GET /api/notifications/logs - Log completo notifiche (ADMIN)
router.get('/logs', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { 
      type, 
      priority, 
      status, 
      search, 
      dateFrom, 
      dateTo, 
      limit = 100, 
      offset = 0 
    } = req.query;

    const where: any = {};

    // Filtri
    if (type) where.type = type;
    if (priority) where.priority = priority.toString().toUpperCase();
    if (status) {
      where.metadata = {
        path: ['status'],
        equals: status
      };
    }
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { content: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom as string);
      if (dateTo) where.createdAt.lte = new Date(dateTo as string);
    }

    // Query con relazioni
    const [logs, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          recipient: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: Number(offset)
      }),
      prisma.notification.count({ where })
    ]);

    // Formatta i log con informazioni aggiuntive
    const formattedLogs = logs.map(log => ({
      ...log,
      channels: log.metadata?.channels || ['websocket'],
      status: log.metadata?.status || (log.isRead ? 'read' : 'delivered'),
      failureReason: log.metadata?.error
    }));

    res.json(ResponseFormatter.success({
      logs: formattedLogs,
      total,
      limit: Number(limit),
      offset: Number(offset)
    }, 'Logs retrieved'));
  } catch (error) {
    logger.error('Error fetching notification logs:', error);
    res.status(500).json(ResponseFormatter.error('Failed to fetch logs', 'LOGS_ERROR'));
  }
});

// POST /api/notifications/test - Invia notifica di test (ADMIN)
router.post('/test', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const testSchema = z.object({
      userId: z.string().optional(),
      email: z.string().email().optional(),
      type: z.string(),
      title: z.string(),
      message: z.string(),
      priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
      channels: z.array(z.enum(['websocket', 'email', 'sms', 'push'])).default(['websocket'])
    });

    const data = testSchema.parse(req.body);

    // Se non c'è userId, cerca l'utente per email o usa l'utente corrente
    let targetUserId = data.userId;
    if (!targetUserId && data.email) {
      const user = await prisma.user.findUnique({ 
        where: { email: data.email } 
      });
      targetUserId = user?.id;
    }
    if (!targetUserId) {
      targetUserId = req.user!.id; // Usa l'utente corrente come fallback
    }

    // Invia notifica di test
    await notificationService.sendToUser({
      userId: targetUserId,
      type: data.type,
      title: data.title,
      message: data.message,
      priority: data.priority,
      channels: data.channels,
      data: {
        isTest: true,
        sentBy: req.user!.id,
        sentAt: new Date()
      }
    });

    res.json(ResponseFormatter.success({
      sentTo: targetUserId,
      channels: data.channels
    }, 'Test notification sent'));
  } catch (error) {
    logger.error('Error sending test notification:', error);
    res.status(500).json(ResponseFormatter.error('Failed to send test', 'TEST_ERROR'));
  }
});

// POST /api/notifications/:id/resend - Reinvia notifica fallita (ADMIN)
router.post('/:id/resend', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;

    // Recupera notifica originale
    const notification = await prisma.notification.findUnique({
      where: { id },
      include: { recipient: true }
    });

    if (!notification) {
      return res.status(404).json(ResponseFormatter.error('Notification not found', 'NOT_FOUND'));
    }

    // Reinvia notifica
    await notificationService.sendToUser({
      userId: notification.recipientId,
      type: notification.type,
      title: notification.title,
      message: notification.content,
      priority: notification.priority.toLowerCase() as any,
      channels: notification.metadata?.channels || ['websocket', 'email'],
      data: {
        ...notification.metadata,
        isResend: true,
        originalId: notification.id,
        resentBy: req.user!.id,
        resentAt: new Date()
      }
    });

    res.json(ResponseFormatter.success(null, 'Notification resent'));
  } catch (error) {
    logger.error('Error resending notification:', error);
    res.status(500).json(ResponseFormatter.error('Failed to resend', 'RESEND_ERROR'));
  }
});

// DELETE /api/notifications/:id - Elimina notifica (ADMIN)
router.delete('/:id', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.notification.delete({
      where: { id }
    });

    res.json(ResponseFormatter.success(null, 'Notification deleted'));
  } catch (error) {
    logger.error('Error deleting notification:', error);
    res.status(500).json(ResponseFormatter.error('Failed to delete', 'DELETE_ERROR'));
  }
});

// POST /api/notifications/broadcast - Invia notifica broadcast (SUPER_ADMIN)
router.post('/broadcast', authenticate, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const broadcastSchema = z.object({
      role: z.enum(['ALL', 'CLIENT', 'PROFESSIONAL', 'ADMIN']).optional(),
      type: z.string(),
      title: z.string(),
      message: z.string(),
      priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
      channels: z.array(z.enum(['websocket', 'email'])).default(['websocket'])
    });

    const data = broadcastSchema.parse(req.body);

    // Trova utenti target
    const where: any = { emailVerified: true };
    if (data.role && data.role !== 'ALL') {
      where.role = data.role;
    }

    const users = await prisma.user.findMany({
      where,
      select: { id: true }
    });

    // Invia a tutti
    const results = await Promise.allSettled(
      users.map(user => 
        notificationService.sendToUser({
          userId: user.id,
          type: data.type,
          title: data.title,
          message: data.message,
          priority: data.priority,
          channels: data.channels,
          data: {
            isBroadcast: true,
            sentBy: req.user!.id
          }
        })
      )
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    res.json(ResponseFormatter.success({
      totalUsers: users.length,
      succeeded,
      failed
    }, 'Broadcast sent'));
  } catch (error) {
    logger.error('Error broadcasting:', error);
    res.status(500).json(ResponseFormatter.error('Failed to broadcast', 'BROADCAST_ERROR'));
  }
});

export default router;
