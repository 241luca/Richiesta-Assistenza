import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { notificationService } from '../services/notification.service';
import { ResponseFormatter } from '../utils/responseFormatter';

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

export default router;
