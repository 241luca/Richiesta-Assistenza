import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { notificationService } from '../services/notification.service';
import { ResponseFormatter } from '../utils/responseFormatter';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();

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

// GET /notifications - Lista completa con filtri
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { unread, archived, after, category, limit = '20', offset = '0' } = req.query;
    
    const where: any = { recipientId: userId };  // Cambiato da userId a recipientId
    
    // Applica filtri
    if (unread === 'true') where.isRead = false;  // Cambiato da read a isRead
    // NOTA: archived non esiste nel database, quindi lo rimuoviamo
    // if (archived === 'true') where.archived = true;
    // else where.archived = false; 
    if (after) where.createdAt = { gte: new Date(after as string) };
    if (category) where.type = category;
    
    // Recupera notifiche
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      include: {
        recipient: {  // Cambiato da user a recipient
          select: { firstName: true, lastName: true }
        }
      }
    });
    
    // Formatta notifiche con severity dal metadata
    const formattedNotifications = notifications.map(n => ({
      ...n,
      severity: (n.metadata as any)?.severity || 'info',
      actionUrl: (n.metadata as any)?.actionUrl,
      category: n.type,
      read: n.isRead,  // Mappiamo isRead a read per il frontend
      archived: false   // Non esiste nel DB, sempre false
    }));
    
    // Ottieni categorie uniche per il filtro
    const categories = await prisma.notification.findMany({
      where: { recipientId: userId },  // Cambiato da userId a recipientId
      select: { type: true },
      distinct: ['type']
    });
    
    res.json(ResponseFormatter.success({
      notifications: formattedNotifications,
      categories: categories.map(c => c.type),
      total: notifications.length
    }));
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    res.status(500).json(
      ResponseFormatter.error('Failed to fetch notifications')
    );
  }
});

// GET /stats - Statistiche notifiche
router.get('/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    // Log per debug
    logger.info('Getting notification stats for user:', { userId, userRole: req.user?.role });
    
    if (!userId) {
      // Invece di errore, ritorna stats vuote
      return res.json(ResponseFormatter.success({
        total: 0,
        unread: 0,
        today: 0,
        thisWeek: 0,
        byCategory: {},
        bySeverity: {
          info: 0,
          success: 0,
          warning: 0,
          error: 0
        }
      }));
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Query per le statistiche - CORRETTE con i campi giusti
    const [total, unread, todayCount, weekCount] = await Promise.all([
      prisma.notification.count({
        where: { recipientId: userId }  // recipientId invece di userId
      }),
      prisma.notification.count({
        where: { recipientId: userId, isRead: false }  // isRead invece di read
      }),
      prisma.notification.count({
        where: {
          recipientId: userId,
          createdAt: { gte: today }
        }
      }),
      prisma.notification.count({
        where: {
          recipientId: userId,
          createdAt: { gte: weekAgo }
        }
      })
    ]);

    // Statistiche per categoria
    const byCategory = await prisma.notification.groupBy({
      by: ['type'],
      where: { recipientId: userId },
      _count: true
    });

    // Statistiche per severity
    const notifications = await prisma.notification.findMany({
      where: { recipientId: userId },
      select: { metadata: true }
    });

    const bySeverity = {
      info: 0,
      success: 0,
      warning: 0,
      error: 0
    };

    notifications.forEach(n => {
      const severity = (n.metadata as any)?.severity || 'info';
      if (severity in bySeverity) {
        bySeverity[severity as keyof typeof bySeverity]++;
      }
    });

    res.json(ResponseFormatter.success({
      total,
      unread,
      today: todayCount,
      thisWeek: weekCount,
      byCategory: byCategory.reduce((acc, curr) => {
        acc[curr.type] = curr._count;
        return acc;
      }, {} as Record<string, number>),
      bySeverity
    }));
  } catch (error) {
    logger.error('Error fetching notification stats:', error);
    res.status(500).json(
      ResponseFormatter.error('Failed to fetch notification stats')
    );
  }
});

// PUT /:id/read - Marca notifica come letta
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const notification = await prisma.notification.update({
      where: {
        id,
        recipientId: userId  // recipientId invece di userId
      },
      data: {
        isRead: true,  // isRead invece di read
        readAt: new Date()
      }
    });

    res.json(ResponseFormatter.success(notification, 'Notification marked as read'));
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json(
      ResponseFormatter.error('Failed to mark as read')
    );
  }
});

// PUT /:id/archive - Archivia notifica (NOTA: archived non esiste nel DB)
router.put('/:id/archive', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Siccome archived non esiste, marchiamo solo come letta
    const notification = await prisma.notification.update({
      where: {
        id,
        recipientId: userId  // recipientId invece di userId
      },
      data: {
        isRead: true,  // isRead invece di read
        readAt: new Date()
        // archived non esiste nel modello Notification
      }
    });

    res.json(ResponseFormatter.success(notification, 'Notification marked as read'));
  } catch (error) {
    logger.error('Error marking notification:', error);
    res.status(500).json(
      ResponseFormatter.error('Failed to update notification')
    );
  }
});

// DELETE /:id - Elimina notifica
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    await prisma.notification.delete({
      where: {
        id,
        recipientId: userId  // recipientId invece di userId
      }
    });

    res.json(ResponseFormatter.success(null, 'Notification deleted'));
  } catch (error) {
    logger.error('Error deleting notification:', error);
    res.status(500).json(
      ResponseFormatter.error('Failed to delete notification')
    );
  }
});

// PUT /read-all - Marca tutte come lette (versione PUT)
router.put('/read-all', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;

    await prisma.notification.updateMany({
      where: {
        recipientId: userId,  // recipientId invece di userId
        isRead: false  // isRead invece di read
      },
      data: {
        isRead: true,  // isRead invece di read
        readAt: new Date()
      }
    });

    res.json(ResponseFormatter.success(null, 'All notifications marked as read'));
  } catch (error) {
    logger.error('Error marking all as read:', error);
    res.status(500).json(
      ResponseFormatter.error('Failed to mark all as read')
    );
  }
});

export default router;
