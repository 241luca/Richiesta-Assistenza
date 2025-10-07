import { Router, Request, Response } from 'express';
import { chatService } from '../services/chat.service';
import { ResponseFormatter } from '../utils/responseFormatter';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Configurazione multer per upload file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads', 'chat'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Tipi di file permessi
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo di file non supportato'));
    }
  }
});

/**
 * GET /api/chat/:requestId/messages
 * Recupera i messaggi di una chat
 */
router.get('/:requestId/messages', authenticate, async (req: any, res: Response) => {
  try {
    const { requestId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const userId = req.user.id;

    const messages = await chatService.getMessages(
      requestId,
      userId,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    return res.json(ResponseFormatter.success(
      messages,
      'Messaggi recuperati con successo'
    ));
  } catch (error: any) {
    logger.error('Error fetching chat messages:', error);
    return res.status(500).json(ResponseFormatter.error(
      error.message || 'Errore nel recupero dei messaggi',
      'FETCH_MESSAGES_ERROR'
    ));
  }
});

/**
 * POST /api/chat/:requestId/messages
 * Invia un messaggio nella chat
 */
router.post('/:requestId/messages', authenticate, upload.array('attachments', 5), async (req: any, res: Response) => {
  try {
    const { requestId } = req.params;
    const { message, messageType = 'TEXT' } = req.body;
    const userId = req.user.id;
    const files = req.files as Express.Multer.File[];

    // Prepara gli allegati se presenti
    let attachments = undefined;
    if (files && files.length > 0) {
      attachments = files.map(file => ({
        fileName: file.originalname,
        filePath: `/uploads/chat/${file.filename}`,
        fileType: file.mimetype,
        fileSize: file.size
      }));
    }

    const newMessage = await chatService.sendMessage({
      requestId,
      userId,
      message,
      messageType: messageType as any,
      attachments
    });

    return res.json(ResponseFormatter.success(
      newMessage,
      'Messaggio inviato con successo'
    ));
  } catch (error: any) {
    logger.error('Error sending chat message:', error);
    return res.status(500).json(ResponseFormatter.error(
      error.message || 'Errore nell\'invio del messaggio',
      'SEND_MESSAGE_ERROR'
    ));
  }
});

/**
 * PUT /api/chat/messages/:messageId
 * Modifica un messaggio
 */
router.put('/messages/:messageId', authenticate, async (req: any, res: Response) => {
  try {
    const { messageId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    const updatedMessage = await chatService.updateMessage(
      messageId,
      userId,
      { message }
    );

    return res.json(ResponseFormatter.success(
      updatedMessage,
      'Messaggio modificato con successo'
    ));
  } catch (error: any) {
    logger.error('Error updating chat message:', error);
    return res.status(500).json(ResponseFormatter.error(
      error.message || 'Errore nella modifica del messaggio',
      'UPDATE_MESSAGE_ERROR'
    ));
  }
});

/**
 * DELETE /api/chat/messages/:messageId
 * Elimina un messaggio (soft delete)
 */
router.delete('/messages/:messageId', authenticate, async (req: any, res: Response) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const deletedMessage = await chatService.deleteMessage(messageId, userId);

    return res.json(ResponseFormatter.success(
      deletedMessage,
      'Messaggio eliminato con successo'
    ));
  } catch (error: any) {
    logger.error('Error deleting chat message:', error);
    return res.status(500).json(ResponseFormatter.error(
      error.message || 'Errore nell\'eliminazione del messaggio',
      'DELETE_MESSAGE_ERROR'
    ));
  }
});

/**
 * GET /api/chat/:requestId/unread-count
 * Conta i messaggi non letti
 */
router.get('/:requestId/unread-count', authenticate, async (req: any, res: Response) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    const unreadCount = await chatService.getUnreadCount(requestId, userId);

    return res.json(ResponseFormatter.success(
      { unreadCount },
      'Conteggio messaggi non letti recuperato'
    ));
  } catch (error: any) {
    logger.error('Error getting unread count:', error);
    return res.status(500).json(ResponseFormatter.error(
      error.message || 'Errore nel conteggio messaggi non letti',
      'UNREAD_COUNT_ERROR'
    ));
  }
});

/**
 * POST /api/chat/:requestId/mark-read
 * Segna tutti i messaggi come letti
 */
router.post('/:requestId/mark-read', authenticate, async (req: any, res: Response) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    await chatService.markMessagesAsRead(requestId, userId);

    return res.json(ResponseFormatter.success(
      null,
      'Messaggi segnati come letti'
    ));
  } catch (error: any) {
    logger.error('Error marking messages as read:', error);
    return res.status(500).json(ResponseFormatter.error(
      error.message || 'Errore nel segnare i messaggi come letti',
      'MARK_READ_ERROR'
    ));
  }
});

/**
 * GET /api/chat/:requestId/access
 * Verifica se l'utente può accedere alla chat
 */
router.get('/:requestId/access', authenticate, async (req: any, res: Response) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    const canAccess = await chatService.canAccessChat(userId, requestId);
    const isActive = await chatService.isChatActive(requestId);

    return res.json(ResponseFormatter.success(
      { canAccess, isActive },
      'Stato accesso chat verificato'
    ));
  } catch (error: any) {
    logger.error('Error checking chat access:', error);
    return res.status(500).json(ResponseFormatter.error(
      error.message || 'Errore nella verifica accesso chat',
      'ACCESS_CHECK_ERROR'
    ));
  }
});

export { router as chatRoutes };
