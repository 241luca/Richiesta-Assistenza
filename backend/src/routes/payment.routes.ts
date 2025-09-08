import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { ResponseFormatter } from '../utils/responseFormatter';
import { notificationService } from '../services/notification.service'; // ✅ AGGIUNTO
import { prisma } from '../config/database'; // ✅ AGGIUNTO
import { v4 as uuidv4 } from 'uuid'; // ✅ AGGIUNTO
import { logger } from '../utils/logger'; // ✅ AGGIUNTO

const router = Router();

// ✅ NUOVO: Helper per inviare notifiche di pagamento
async function sendPaymentNotification(params: {
  payment: any;
  type: 'PAYMENT_RECEIVED' | 'PAYMENT_CONFIRMED' | 'PAYMENT_FAILED' | 'PAYMENT_REFUNDED';
  recipientId: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}) {
  try {
    const { payment, type, recipientId, priority = 'high' } = params;
    
    // Formatta l'importo
    const formattedAmount = new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: payment.currency || 'EUR'
    }).format(payment.amount);
    
    // Determina titolo e messaggio in base al tipo
    let title = '';
    let message = '';
    
    switch (type) {
      case 'PAYMENT_RECEIVED':
        title = '💰 Pagamento ricevuto';
        message = `Abbiamo ricevuto il tuo pagamento di ${formattedAmount}. Stiamo processando la transazione.`;
        break;
      
      case 'PAYMENT_CONFIRMED':
        title = '✅ Pagamento confermato';
        message = `Il tuo pagamento di ${formattedAmount} è stato confermato con successo. Grazie!`;
        break;
      
      case 'PAYMENT_FAILED':
        title = '❌ Pagamento fallito';
        message = `Il pagamento di ${formattedAmount} non è andato a buon fine. Ti preghiamo di riprovare.`;
        break;
      
      case 'PAYMENT_REFUNDED':
        title = '💳 Rimborso elaborato';
        message = `È stato elaborato un rimborso di ${formattedAmount} per il tuo pagamento.`;
        break;
    }
    
    // Invia notifica
    await notificationService.sendToUser({
      userId: recipientId,
      type: type,
      title: title,
      message: message,
      priority: priority,
      data: {
        paymentId: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        transactionId: payment.transactionId,
        status: payment.status,
        actionUrl: `${process.env.FRONTEND_URL}/payments/${payment.id}`
      },
      channels: ['websocket', 'email']
    });
    
    logger.info(`Payment notification sent: ${type} for payment ${payment.id}`);
  } catch (error) {
    logger.error('Error sending payment notification:', error);
  }
}

// GET /api/payments - Lista pagamenti
router.get('/', authenticate, async (req: any, res: any) => {
  try {
    const { status, quoteId, limit = 50, offset = 0 } = req.query;
    
    const where: any = {
      userId: req.user.id
    };
    
    if (status) where.status = status;
    if (quoteId) where.quoteId = quoteId;
    
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          Quote: {
            select: {
              id: true,
              title: true,
              amount: true
            }
          },
          User: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string)
      }),
      prisma.payment.count({ where })
    ]);
    
    res.json(ResponseFormatter.success(
      { data: payments, total, limit, offset },
      'Payments retrieved successfully'
    ));
  } catch (error) {
    logger.error('Error fetching payments:', error);
    res.status(500).json(ResponseFormatter.error(
      'Failed to fetch payments',
      'PAYMENTS_FETCH_ERROR'
    ));
  }
});

// GET /api/payments/:id - Dettaglio pagamento
router.get('/:id', authenticate, async (req: any, res: any) => {
  try {
    const payment = await prisma.payment.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: {
        Quote: true,
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            email: true
          }
        }
      }
    });
    
    if (!payment) {
      return res.status(404).json(ResponseFormatter.error(
        'Payment not found',
        'PAYMENT_NOT_FOUND'
      ));
    }
    
    res.json(ResponseFormatter.success(
      payment,
      'Payment retrieved successfully'
    ));
  } catch (error) {
    logger.error('Error fetching payment:', error);
    res.status(500).json(ResponseFormatter.error(
      'Failed to fetch payment',
      'PAYMENT_FETCH_ERROR'
    ));
  }
});

// POST /api/payments - Crea nuovo pagamento
router.post('/', authenticate, async (req: any, res: any) => {
  try {
    const { quoteId, amount, type, method, description } = req.body;
    
    // Verifica che il preventivo esista e appartenga all'utente
    const quote = await prisma.quote.findFirst({
      where: {
        id: quoteId,
        OR: [
          { professionalId: req.user.id },
          { AssistanceRequest: { clientId: req.user.id } }
        ]
      },
      include: {
        AssistanceRequest: {
          include: {
            client: true,
            professional: true
          }
        }
      }
    });
    
    if (!quote) {
      return res.status(404).json(ResponseFormatter.error(
        'Quote not found or unauthorized',
        'QUOTE_NOT_FOUND'
      ));
    }
    
    // Crea il pagamento
    const payment = await prisma.payment.create({
      data: {
        id: uuidv4(),
        quoteId,
        userId: req.user.id,
        amount: amount,
        currency: 'EUR',
        status: 'PENDING',
        type: type || 'FULL_PAYMENT',
        method: method,
        description: description,
        metadata: {
          requestId: quote.requestId,
          quoteTitle: quote.title
        },
        updatedAt: new Date()
      }
    });
    
    // ✅ NUOVO: Invia notifica al cliente del pagamento iniziato
    await sendPaymentNotification({
      payment,
      type: 'PAYMENT_RECEIVED',
      recipientId: req.user.id,
      priority: 'normal'
    });
    
    // ✅ NUOVO: Notifica al professionista che è stato iniziato un pagamento
    if (quote.professionalId && quote.professionalId !== req.user.id) {
      await notificationService.sendToUser({
        userId: quote.professionalId,
        type: 'PAYMENT_INITIATED',
        title: '💳 Pagamento in corso',
        message: `Il cliente ha iniziato un pagamento di €${amount} per il preventivo "${quote.title}"`,
        priority: 'normal',
        data: {
          paymentId: payment.id,
          quoteId: quote.id,
          amount: amount,
          clientName: quote.AssistanceRequest?.client?.fullName
        },
        channels: ['websocket']
      });
    }
    
    res.status(201).json(ResponseFormatter.success(
      payment,
      'Payment created successfully'
    ));
  } catch (error) {
    logger.error('Error creating payment:', error);
    res.status(500).json(ResponseFormatter.error(
      'Failed to create payment',
      'PAYMENT_CREATE_ERROR'
    ));
  }
});

// PUT /api/payments/:id/confirm - Conferma pagamento (webhook Stripe)
router.put('/:id/confirm', authenticate, async (req: any, res: any) => {
  try {
    const { transactionId, stripePaymentId, receiptUrl } = req.body;
    
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: {
        Quote: {
          include: {
            AssistanceRequest: {
              include: {
                client: true,
                professional: true
              }
            }
          }
        }
      }
    });
    
    if (!payment) {
      return res.status(404).json(ResponseFormatter.error(
        'Payment not found',
        'PAYMENT_NOT_FOUND'
      ));
    }
    
    if (payment.status !== 'PENDING' && payment.status !== 'PROCESSING') {
      return res.status(400).json(ResponseFormatter.error(
        'Payment cannot be confirmed in current status',
        'INVALID_STATUS'
      ));
    }
    
    // Aggiorna il pagamento
    const updatedPayment = await prisma.payment.update({
      where: { id: req.params.id },
      data: {
        status: 'COMPLETED',
        transactionId,
        stripePaymentId,
        receiptUrl,
        processedAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    // ✅ NUOVO: Invia notifiche di conferma
    // Notifica al cliente
    await sendPaymentNotification({
      payment: updatedPayment,
      type: 'PAYMENT_CONFIRMED',
      recipientId: payment.userId,
      priority: 'high'
    });
    
    // Notifica al professionista
    if (payment.Quote?.professionalId) {
      await notificationService.sendToUser({
        userId: payment.Quote.professionalId,
        type: 'PAYMENT_RECEIVED_PROFESSIONAL',
        title: '💰 Pagamento ricevuto',
        message: `Hai ricevuto un pagamento di €${payment.amount} per il preventivo "${payment.Quote.title}"`,
        priority: 'high',
        data: {
          paymentId: payment.id,
          amount: payment.amount,
          quoteId: payment.Quote.id,
          clientName: payment.Quote.AssistanceRequest?.client?.fullName,
          receiptUrl: receiptUrl
        },
        channels: ['websocket', 'email']
      });
    }
    
    // Aggiorna lo stato del preventivo se il pagamento è completo
    if (payment.Quote && payment.type === 'FULL_PAYMENT') {
      await prisma.quote.update({
        where: { id: payment.Quote.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date()
        }
      });
    }
    
    res.json(ResponseFormatter.success(
      updatedPayment,
      'Payment confirmed successfully'
    ));
  } catch (error) {
    logger.error('Error confirming payment:', error);
    res.status(500).json(ResponseFormatter.error(
      'Failed to confirm payment',
      'PAYMENT_CONFIRM_ERROR'
    ));
  }
});

// PUT /api/payments/:id/fail - Marca pagamento come fallito
router.put('/:id/fail', authenticate, async (req: any, res: any) => {
  try {
    const { reason } = req.body;
    
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id }
    });
    
    if (!payment) {
      return res.status(404).json(ResponseFormatter.error(
        'Payment not found',
        'PAYMENT_NOT_FOUND'
      ));
    }
    
    if (payment.status === 'COMPLETED' || payment.status === 'REFUNDED') {
      return res.status(400).json(ResponseFormatter.error(
        'Cannot fail a completed or refunded payment',
        'INVALID_STATUS'
      ));
    }
    
    // Aggiorna il pagamento
    const updatedPayment = await prisma.payment.update({
      where: { id: req.params.id },
      data: {
        status: 'FAILED',
        failureReason: reason,
        failedAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    // ✅ NUOVO: Invia notifica di fallimento
    await sendPaymentNotification({
      payment: updatedPayment,
      type: 'PAYMENT_FAILED',
      recipientId: payment.userId,
      priority: 'urgent'
    });
    
    res.json(ResponseFormatter.success(
      updatedPayment,
      'Payment marked as failed'
    ));
  } catch (error) {
    logger.error('Error marking payment as failed:', error);
    res.status(500).json(ResponseFormatter.error(
      'Failed to update payment status',
      'PAYMENT_UPDATE_ERROR'
    ));
  }
});

// POST /api/payments/:id/refund - Rimborsa pagamento
router.post('/:id/refund', authenticate, async (req: any, res: any) => {
  try {
    const { amount, reason } = req.body;
    
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: {
        Quote: {
          include: {
            AssistanceRequest: {
              include: {
                client: true,
                professional: true
              }
            }
          }
        }
      }
    });
    
    if (!payment) {
      return res.status(404).json(ResponseFormatter.error(
        'Payment not found',
        'PAYMENT_NOT_FOUND'
      ));
    }
    
    if (payment.status !== 'COMPLETED') {
      return res.status(400).json(ResponseFormatter.error(
        'Can only refund completed payments',
        'INVALID_STATUS'
      ));
    }
    
    const refundAmount = amount || payment.amount;
    
    // Aggiorna il pagamento
    const updatedPayment = await prisma.payment.update({
      where: { id: req.params.id },
      data: {
        status: 'REFUNDED',
        refundAmount: refundAmount,
        refundedAt: new Date(),
        notes: reason,
        updatedAt: new Date()
      }
    });
    
    // ✅ NUOVO: Invia notifiche di rimborso
    // Notifica al cliente
    await sendPaymentNotification({
      payment: { ...updatedPayment, amount: refundAmount },
      type: 'PAYMENT_REFUNDED',
      recipientId: payment.userId,
      priority: 'high'
    });
    
    // Notifica al professionista
    if (payment.Quote?.professionalId) {
      await notificationService.sendToUser({
        userId: payment.Quote.professionalId,
        type: 'PAYMENT_REFUNDED_PROFESSIONAL',
        title: '💳 Rimborso elaborato',
        message: `È stato elaborato un rimborso di €${refundAmount} per il pagamento del preventivo "${payment.Quote.title}"`,
        priority: 'high',
        data: {
          paymentId: payment.id,
          refundAmount: refundAmount,
          originalAmount: payment.amount,
          reason: reason,
          clientName: payment.Quote.AssistanceRequest?.client?.fullName
        },
        channels: ['websocket', 'email']
      });
    }
    
    res.json(ResponseFormatter.success(
      updatedPayment,
      'Payment refunded successfully'
    ));
  } catch (error) {
    logger.error('Error refunding payment:', error);
    res.status(500).json(ResponseFormatter.error(
      'Failed to refund payment',
      'PAYMENT_REFUND_ERROR'
    ));
  }
});

// GET /api/payments/stats/summary - Statistiche pagamenti
router.get('/stats/summary', authenticate, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Query base per statistiche
    const where: any = {};
    
    if (userRole === 'CLIENT') {
      where.userId = userId;
    } else if (userRole === 'PROFESSIONAL') {
      where.Quote = {
        professionalId: userId
      };
    }
    
    // Calcola statistiche
    const [
      totalPayments,
      completedPayments,
      pendingPayments,
      failedPayments,
      totalAmount,
      completedAmount
    ] = await Promise.all([
      // Totale pagamenti
      prisma.payment.count({ where }),
      
      // Pagamenti completati
      prisma.payment.count({
        where: { ...where, status: 'COMPLETED' }
      }),
      
      // Pagamenti in attesa
      prisma.payment.count({
        where: { ...where, status: { in: ['PENDING', 'PROCESSING'] } }
      }),
      
      // Pagamenti falliti
      prisma.payment.count({
        where: { ...where, status: 'FAILED' }
      }),
      
      // Importo totale
      prisma.payment.aggregate({
        where,
        _sum: { amount: true }
      }),
      
      // Importo completato
      prisma.payment.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { amount: true }
      })
    ]);
    
    // Calcola statistiche mensili
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const monthlyStats = await prisma.payment.aggregate({
      where: {
        ...where,
        status: 'COMPLETED',
        processedAt: { gte: currentMonth }
      },
      _sum: { amount: true },
      _count: { id: true }
    });
    
    const stats = {
      total: totalPayments,
      completed: completedPayments,
      pending: pendingPayments,
      failed: failedPayments,
      totalAmount: totalAmount._sum.amount || 0,
      completedAmount: completedAmount._sum.amount || 0,
      pendingAmount: 0, // Calcolato se necessario
      monthlyAmount: monthlyStats._sum.amount || 0,
      monthlyCount: monthlyStats._count.id || 0,
      successRate: totalPayments > 0 
        ? Math.round((completedPayments / totalPayments) * 100)
        : 0
    };
    
    res.json(ResponseFormatter.success(
      stats,
      'Payment statistics retrieved successfully'
    ));
  } catch (error) {
    logger.error('Error fetching payment stats:', error);
    res.status(500).json(ResponseFormatter.error(
      'Failed to fetch payment statistics',
      'STATS_FETCH_ERROR'
    ));
  }
});

// ✅ NUOVO: POST /api/payments/send-reminders - Invia promemoria pagamenti
router.post('/send-reminders', authenticate, async (req: any, res: any) => {
  try {
    // Solo admin può inviare promemoria
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json(ResponseFormatter.error(
        'Unauthorized',
        'UNAUTHORIZED'
      ));
    }
    
    // Trova pagamenti in attesa da più di 3 giorni
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const pendingPayments = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lte: threeDaysAgo }
      },
      include: {
        User: true,
        Quote: {
          include: {
            AssistanceRequest: {
              include: {
                professional: true
              }
            }
          }
        }
      }
    });
    
    let remindersCount = 0;
    
    for (const payment of pendingPayments) {
      await notificationService.sendToUser({
        userId: payment.userId,
        type: 'PAYMENT_REMINDER',
        title: '⏰ Promemoria pagamento',
        message: `Hai un pagamento in sospeso di €${payment.amount} per il preventivo "${payment.Quote?.title}". Completa il pagamento per confermare il servizio.`,
        priority: 'normal',
        data: {
          paymentId: payment.id,
          amount: payment.amount,
          quoteId: payment.quoteId,
          actionUrl: `${process.env.FRONTEND_URL}/payments/${payment.id}/complete`
        },
        channels: ['websocket', 'email']
      });
      
      remindersCount++;
    }
    
    res.json(ResponseFormatter.success(
      { count: remindersCount },
      `${remindersCount} payment reminders sent successfully`
    ));
  } catch (error) {
    logger.error('Error sending payment reminders:', error);
    res.status(500).json(ResponseFormatter.error(
      'Failed to send payment reminders',
      'REMINDER_SEND_ERROR'
    ));
  }
});

export default router;
