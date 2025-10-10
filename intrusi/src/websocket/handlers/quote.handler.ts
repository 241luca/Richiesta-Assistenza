/**
 * Quote Event Handlers
 * Gestisce tutti gli eventi relativi ai preventivi
 */

import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';
import { sendNotificationToUser } from './notification.handler';

const prisma = new PrismaClient();

interface AuthenticatedSocket {
  id: string;
  userId?: string;
  userRole?: string;
  emit: (event: string, data: any) => void;
  join: (room: string) => void;
  to: (room: string) => any;
  on: (event: string, callback: (...args: any[]) => void) => void;
}

export function handleQuoteEvents(socket: AuthenticatedSocket, io: Server) {
  /**
   * Sottoscrivi a un preventivo specifico
   */
  socket.on('quote:subscribe', async (quoteId: string) => {
    try {
      // Verifica che l'utente abbia accesso al preventivo
      const quote = await prisma.quote.findFirst({
        where: {
          id: quoteId,
          OR: [
            { professionalId: socket.userId },
            { request: { clientId: socket.userId } }
          ]
        }
      });

      if (!quote) {
        throw new Error('Quote not found or access denied');
      }

      socket.join(`quote:${quoteId}`);
      socket.emit('quote:subscribed', { quoteId });
      logger.debug(`Socket ${socket.id} subscribed to quote ${quoteId}`);
    } catch (error) {
      logger.error('Error subscribing to quote:', error);
      socket.emit('error', { message: 'Failed to subscribe to quote' });
    }
  });

  /**
   * Aggiorna lo stato di un preventivo
   */
  socket.on('quote:updateStatus', async (data: { 
    quoteId: string; 
    status: 'draft' | 'pending' | 'accepted' | 'rejected' | 'expired' 
  }) => {
    try {
      // Verifica autorizzazioni
      const quote = await prisma.quote.findFirst({
        where: {
          id: data.quoteId,
        },
        include: {
          request: {
            include: {
              client: { select: { id: true, firstName: true, lastName: true } }
            }
          },
          professional: { select: { id: true, firstName: true, lastName: true } }
        }
      });

      if (!quote) {
        throw new Error('Quote not found');
      }

      // Verifica autorizzazioni per cambio stato
      const isClient = socket.userId === quote.request.clientId;
      const isProfessional = socket.userId === quote.professionalId;
      const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(socket.userRole!);

      // Logica autorizzazioni per stato
      if (data.status === 'accepted' || data.status === 'rejected') {
        if (!isClient && !isAdmin) {
          throw new Error('Only client can accept or reject quotes');
        }
      } else if (data.status === 'pending' || data.status === 'draft') {
        if (!isProfessional && !isAdmin) {
          throw new Error('Only professional can update quote to draft or pending');
        }
      }

      // Aggiorna nel database
      const updated = await prisma.quote.update({
        where: { id: data.quoteId },
        data: { 
          status: data.status,
          updatedAt: new Date()
        }
      });

      // Notifica tutti gli iscritti
      io.to(`quote:${data.quoteId}`).emit('quote:statusUpdated', {
        quoteId: data.quoteId,
        status: data.status,
        updatedBy: socket.userId,
        timestamp: new Date()
      });

      // Se il preventivo è stato accettato, notifica il professionista
      if (data.status === 'accepted' && quote.professionalId) {
        await sendNotificationToUser(io, quote.professionalId, {
          type: 'quote_accepted',
          title: 'Preventivo Accettato! 🎉',
          message: `Il tuo preventivo per "${quote.request.title}" è stato accettato dal cliente`,
          data: { quoteId: data.quoteId, requestId: quote.requestId },
          priority: 'high'
        });

        // Aggiorna anche lo stato della richiesta
        await prisma.assistanceRequest.update({
          where: { id: quote.requestId },
          data: { 
            status: 'assigned',
            professionalId: quote.professionalId,
            assignedAt: new Date()
          }
        });
      }

      // Se il preventivo è stato rifiutato, notifica il professionista
      if (data.status === 'rejected' && quote.professionalId) {
        await sendNotificationToUser(io, quote.professionalId, {
          type: 'quote_rejected',
          title: 'Preventivo Rifiutato',
          message: `Il tuo preventivo per "${quote.request.title}" è stato rifiutato`,
          data: { quoteId: data.quoteId, requestId: quote.requestId },
          priority: 'normal'
        });
      }

      logger.info(`Quote ${data.quoteId} status updated to ${data.status} by user ${socket.userId}`);
    } catch (error) {
      logger.error('Error updating quote status:', error);
      socket.emit('error', { message: error instanceof Error ? error.message : 'Failed to update quote status' });
    }
  });

  /**
   * Richiedi una modifica al preventivo
   */
  socket.on('quote:requestRevision', async (data: { 
    quoteId: string; 
    message: string 
  }) => {
    try {
      const quote = await prisma.quote.findFirst({
        where: {
          id: data.quoteId,
          request: { clientId: socket.userId }
        },
        include: {
          request: true
        }
      });

      if (!quote) {
        throw new Error('Quote not found or access denied');
      }

      // Salva la richiesta di revisione
      const revision = await prisma.quoteRevision.create({
        data: {
          quoteId: data.quoteId,
          requestedBy: socket.userId!,
          message: data.message
        }
      });

      // Notifica il professionista
      if (quote.professionalId) {
        await sendNotificationToUser(io, quote.professionalId, {
          type: 'quote_revision_requested',
          title: 'Richiesta di Modifica Preventivo',
          message: `Il cliente ha richiesto una modifica al preventivo per "${quote.request.title}"`,
          data: { quoteId: data.quoteId, revisionId: revision.id },
          priority: 'high'
        });
      }

      // Notifica real-time
      io.to(`quote:${data.quoteId}`).emit('quote:revisionRequested', {
        quoteId: data.quoteId,
        revisionId: revision.id,
        message: data.message,
        timestamp: new Date()
      });

      logger.info(`Revision requested for quote ${data.quoteId} by user ${socket.userId}`);
    } catch (error) {
      logger.error('Error requesting quote revision:', error);
      socket.emit('error', { message: error instanceof Error ? error.message : 'Failed to request revision' });
    }
  });
}

/**
 * Notifica la creazione di un nuovo preventivo
 */
export async function notifyNewQuote(
  io: Server,
  quoteId: string,
  requestId: string,
  clientId: string,
  professionalName: string,
  requestTitle: string
) {
  try {
    // Notifica il cliente
    await sendNotificationToUser(io, clientId, {
      type: 'quote_received',
      title: 'Nuovo Preventivo Ricevuto! 💰',
      message: `${professionalName} ha inviato un preventivo per "${requestTitle}"`,
      data: { quoteId, requestId },
      priority: 'high'
    });

    // Notifica real-time
    io.to(`User:${clientId}`).emit('quote:new', {
      quoteId,
      requestId,
      professionalName,
      timestamp: new Date()
    });

    // Notifica anche nella room della richiesta
    io.to(`request:${requestId}`).emit('quote:addedToRequest', {
      quoteId,
      requestId,
      timestamp: new Date()
    });

    logger.info(`New quote ${quoteId} notified to client ${clientId}`);
  } catch (error) {
    logger.error('Error notifying new quote:', error);
  }
}

/**
 * Notifica il pagamento di un deposito
 */
export async function notifyDepositPayment(
  io: Server,
  quoteId: string,
  professionalId: string,
  amount: number,
  clientName: string
) {
  try {
    // Notifica il professionista
    await sendNotificationToUser(io, professionalId, {
      type: 'payment_completed',
      title: 'Pagamento Ricevuto! 💳',
      message: `${clientName} ha pagato il deposito di €${(amount / 100).toFixed(2)}`,
      data: { quoteId, amount },
      priority: 'high'
    });

    // Notifica real-time
    io.to(`quote:${quoteId}`).emit('quote:depositPaid', {
      quoteId,
      amount,
      timestamp: new Date()
    });

    logger.info(`Deposit payment for quote ${quoteId} notified to professional ${professionalId}`);
  } catch (error) {
    logger.error('Error notifying deposit payment:', error);
  }
}
