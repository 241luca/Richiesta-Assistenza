/**
 * Quote Routes - Sistema Preventivi
 * VERSIONE CORRETTA: TypeScript Strict Mode
 * Data: 08/10/2025
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate, AuthRequest } from '../middleware/auth';
import { checkRole } from '../middleware/checkRole';
import { quoteService } from '../services/quote.service';
import { pdfService } from '../services/pdf.service';
import { Prisma, PrismaClient, QuoteStatus } from '@prisma/client';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { ResponseFormatter } from '../utils/responseFormatter';

// ==================== INTERFACCE ====================

type QuoteWhereClause = Prisma.QuoteWhereInput;

interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  discount?: number;
  notes?: string;
  order?: number;
}

interface CreateQuoteData {
  requestId: string;
  professionalId: string;
  title: string;
  description?: string;
  validUntil: Date;
  notes?: string;
  termsConditions?: string;
  items: QuoteItem[];
}

interface UpdateQuoteData {
  title?: string;
  description?: string;
  validUntil?: Date;
  notes?: string;
  termsConditions?: string;
  items?: QuoteItem[];
  updateReason?: string;
}

// ==================== SETUP ====================

const prisma = new PrismaClient();
const router = Router();

router.use(authenticate);

// ==================== ROUTES ====================

/**
 * GET /api/quotes
 * Ottieni preventivi (filtrati per ruolo)
 */
router.get(
  '/',
  [
    query('requestId').optional().isUUID(),
    query('status')
      .optional()
      .isIn(['DRAFT', 'PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED']),
    query('professionalId').optional().isUUID(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { requestId, status, professionalId, page = 1, limit = 20 } = req.query;
      const user = req.user!;

      const where: QuoteWhereClause = {};

      if (requestId && typeof requestId === 'string') {
        where.requestId = requestId;
      }

      if (status && typeof status === 'string') {
        where.status = status as QuoteStatus;
      }

      if (user.role === 'CLIENT') {
        where.request = {
          is: { clientId: user.id },
        };
        where.status = where.status || { not: QuoteStatus.DRAFT };

        if (status && status !== 'DRAFT') {
          where.status = status as QuoteStatus;
        } else if (!status) {
          where.status = { not: QuoteStatus.DRAFT };
        } else if (status === 'DRAFT') {
          return res.json(
            ResponseFormatter.success({
              data: [],
              pagination: { page: 1, limit: Number(limit), total: 0, pages: 0 },
            })
          );
        }
      } else if (user.role === 'PROFESSIONAL') {
        where.professionalId = user.id;
      }

      if (
        professionalId &&
        typeof professionalId === 'string' &&
        (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')
      ) {
        where.professionalId = professionalId;
      }

      const quotes = await prisma.quote.findMany({
        where,
        include: {
          QuoteItem: {
            orderBy: { order: 'asc' },
          },
          AssistanceRequest: {
            include: {
              User_AssistanceRequest_clientIdToUser: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  fullName: true,
                  email: true,
                },
              },
              Category: true,
              Subcategory: true,
            },
          },
          User: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              email: true,
              Profession: true,
            },
          },
        } as any,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      });

      const transformedQuotes = quotes.map((quote) => {
        const items = (quote as any).QuoteItem || [];
        let totalAmount = 0;
        if (items && items.length > 0) {
          totalAmount = items.reduce((sum: number, item: any) => {
            return sum + Number(item.totalPrice) * 100;
          }, 0);
        } else {
          totalAmount = Number((quote as any).amount) * 100;
        }

        return {
          ...quote,
          totalAmount,
          request: (quote as any).AssistanceRequest,
          professional: (quote as any).User,
          items: items.map((item: any) => ({
            ...item,
            unitPrice: Number(item.unitPrice) * 100,
            totalPrice: Number(item.totalPrice) * 100,
            taxAmount: Number(item.taxAmount) * 100,
            discount: Number(item.discount) * 100,
          })),
        };
      });

      const total = await prisma.quote.count({ where });

      res.json(
        ResponseFormatter.success({
          data: transformedQuotes,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        })
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error in GET /api/quotes:', error);
      res
        .status(500)
        .json(
          ResponseFormatter.error('Errore nel recupero dei preventivi', 'FETCH_ERROR')
        );
    }
  }
);

/**
 * POST /api/quotes
 * Crea un nuovo preventivo
 */
router.post(
  '/',
  [
    body('requestId').isUUID().withMessage('ID richiesta non valido'),
    body('title').notEmpty().withMessage('Titolo richiesto'),
    body('description').optional(),
    body('validUntil').optional().isISO8601(),
    body('notes').optional(),
    body('termsConditions').optional(),
    body('items').isArray({ min: 1 }).withMessage('Almeno una voce richiesta'),
    body('items.*.description')
      .notEmpty()
      .withMessage('Descrizione voce richiesta'),
    body('items.*.quantity')
      .isFloat({ min: 0.01 })
      .withMessage('Quantità deve essere maggiore di 0'),
    body('items.*.unitPrice')
      .isFloat({ min: 0 })
      .withMessage('Prezzo unitario non valido'),
    body('items.*.taxRate')
      .isFloat({ min: 0, max: 1 })
      .withMessage('Aliquota IVA non valida'),
  ],
  validate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const {
        requestId,
        title,
        description,
        validUntil,
        notes,
        termsConditions,
        items,
      } = req.body;

      if (
        user.role !== 'PROFESSIONAL' &&
        user.role !== 'ADMIN' &&
        user.role !== 'SUPER_ADMIN'
      ) {
        return res
          .status(403)
          .json(
            ResponseFormatter.error(
              'Solo i professionisti possono creare preventivi',
              'FORBIDDEN'
            )
          );
      }

      const request = await prisma.assistanceRequest.findUnique({
        where: { id: requestId },
        include: { User_AssistanceRequest_clientIdToUser: true },
      });

      if (!request) {
        return res
          .status(404)
          .json(ResponseFormatter.error('Richiesta non trovata', 'NOT_FOUND'));
      }

      if (user.role === 'PROFESSIONAL' && request.professionalId !== user.id) {
        return res
          .status(403)
          .json(
            ResponseFormatter.error(
              'Non puoi creare preventivi per richieste non assegnate a te',
              'FORBIDDEN'
            )
          );
      }

      const quoteData: CreateQuoteData = {
        requestId,
        professionalId: user.id,
        title,
        description,
        validUntil: validUntil
          ? new Date(validUntil)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes,
        termsConditions,
        items: items.map((item: QuoteItem) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate || 0.22,
          totalPrice: item.quantity * item.unitPrice,
        })),
      };

      const quote = await quoteService.createQuote(quoteData);

      return res
        .status(201)
        .json(ResponseFormatter.success(quote, 'Preventivo creato con successo'));
    } catch (error) {
      logger.error('Error creating quote:', error);
      next(error);
    }
  }
);

/**
 * GET /api/quotes/:id
 * Ottieni dettaglio preventivo
 */
router.get(
  '/:id',
  [param('id').isUUID()],
  validate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const user = req.user!;

      const quote = await prisma.quote.findUnique({
        where: { id },
        include: {
          QuoteItem: { orderBy: { order: 'asc' } },
          AssistanceRequest: {
            include: {
              User_AssistanceRequest_clientIdToUser: true,
              Category: true,
              Subcategory: true,
            },
          },
          User: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              email: true,
              Profession: true,
            },
          },
        } as any,
      });

      if (!quote) {
        return res
          .status(404)
          .json(ResponseFormatter.error('Quote not found', 'NOT_FOUND'));
      }

      if (user.role === 'CLIENT') {
        if (quote.status === 'DRAFT') {
          return res
            .status(403)
            .json(ResponseFormatter.error('Quote not available', 'FORBIDDEN'));
        }
        if ((quote as any).AssistanceRequest.clientId !== user.id) {
          return res
            .status(403)
            .json(ResponseFormatter.error('Unauthorized', 'FORBIDDEN'));
        }
      } else if (user.role === 'PROFESSIONAL' && quote.professionalId !== user.id) {
        return res
          .status(403)
          .json(ResponseFormatter.error('Unauthorized', 'FORBIDDEN'));
      }

      let totalAmount = 0;
      const items = (quote as any).QuoteItem || [];
      if (items && items.length > 0) {
        totalAmount = items.reduce((sum: number, item: any) => {
          return sum + Number(item.totalPrice) * 100;
        }, 0);
      } else {
        totalAmount = Number(quote.amount) * 100;
      }

      const transformedQuote = {
        ...quote,
        totalAmount,
        amount: Number(quote.amount) * 100,
        depositAmount: quote.depositAmount
          ? Number(quote.depositAmount) * 100
          : null,
        request: (quote as any).AssistanceRequest,
        professional: (quote as any).User,
        items: items.map((item: any) => ({
          ...item,
          unitPrice: Number(item.unitPrice) * 100,
          totalPrice: Number(item.totalPrice) * 100,
          taxAmount: Number(item.taxAmount) * 100,
          discount: Number(item.discount) * 100,
        })),
      };

      res.json(ResponseFormatter.success(transformedQuote));
    } catch (error) {
      logger.error('Error in GET /api/quotes/:id:', error);
      res
        .status(500)
        .json(
          ResponseFormatter.error(
            'Errore nel recupero del preventivo',
            'FETCH_ERROR'
          )
        );
    }
  }
);

/**
 * PUT /api/quotes/:id
 * Modifica un preventivo esistente
 */
router.put(
  '/:id',
  [
    param('id').isUUID().withMessage('ID preventivo non valido'),
    body('title').optional().notEmpty().withMessage('Titolo non può essere vuoto'),
    body('description').optional(),
    body('validUntil').optional().isISO8601(),
    body('notes').optional(),
    body('termsConditions').optional(),
    body('items')
      .optional()
      .isArray({ min: 1 })
      .withMessage('Almeno una voce richiesta'),
    body('items.*.description')
      .optional()
      .notEmpty()
      .withMessage('Descrizione voce richiesta'),
    body('items.*.quantity')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Quantità deve essere maggiore di 0'),
    body('items.*.unitPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Prezzo unitario non valido'),
    body('items.*.taxRate')
      .optional()
      .isFloat({ min: 0, max: 1 })
      .withMessage('Aliquota IVA non valida'),
    body('updateReason')
      .optional()
      .isString()
      .withMessage('Motivo modifica deve essere una stringa'),
  ],
  validate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const user = req.user!;
      const updateData: UpdateQuoteData = req.body;

      const quote = await prisma.quote.findUnique({
        where: { id },
        include: { AssistanceRequest: true } as any,
      });

      if (!quote) {
        return res
          .status(404)
          .json(
            ResponseFormatter.error('Preventivo non trovato', 'QUOTE_NOT_FOUND')
          );
      }

      if (user.role === 'PROFESSIONAL' && quote.professionalId !== user.id) {
        return res
          .status(403)
          .json(
            ResponseFormatter.error(
              'Non autorizzato a modificare questo preventivo',
              'UNAUTHORIZED'
            )
          );
      }

      if (quote.status !== 'DRAFT' && quote.status !== 'PENDING') {
        return res
          .status(400)
          .json(
            ResponseFormatter.error(
              `Non puoi modificare un preventivo con stato ${quote.status}`,
              'INVALID_STATUS'
            )
          );
      }

      const updateInput: UpdateQuoteData = {
        title: updateData.title,
        description: updateData.description,
        validUntil: updateData.validUntil
          ? new Date(updateData.validUntil)
          : undefined,
        notes: updateData.notes,
        termsConditions: updateData.termsConditions,
        items: updateData.items?.map((item: QuoteItem) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate || 0.22,
          discount: item.discount || 0,
          notes: item.notes,
        })),
        updateReason: updateData.updateReason || 'Modifica preventivo',
      };

      const updatedQuote = await quoteService.updateQuote(id, updateInput, user.id);

      return res.json(
        ResponseFormatter.success(updatedQuote, 'Preventivo aggiornato con successo')
      );
    } catch (error) {
      logger.error('Error updating quote:', error);
      if (error instanceof AppError) {
        return res
          .status(error.statusCode)
          .json(ResponseFormatter.error(error.message, error.code || 'UPDATE_ERROR'));
      }
      return res
        .status(500)
        .json(
          ResponseFormatter.error(
            'Errore nell\'aggiornamento del preventivo',
            'SERVER_ERROR'
          )
        );
    }
  }
);

/**
 * DELETE /api/quotes/:id
 * Cancella un preventivo
 */
router.delete(
  '/:id',
  [param('id').isUUID().withMessage('ID preventivo non valido')],
  validate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const user = req.user!;

      const quote = await prisma.quote.findUnique({
        where: { id },
        include: { AssistanceRequest: true },
      });

      if (!quote) {
        return res
          .status(404)
          .json(
            ResponseFormatter.error('Preventivo non trovato', 'QUOTE_NOT_FOUND')
          );
      }

      if (user.role === 'PROFESSIONAL' && quote.professionalId !== user.id) {
        return res
          .status(403)
          .json(
            ResponseFormatter.error(
              'Non autorizzato a cancellare questo preventivo',
              'UNAUTHORIZED'
            )
          );
      }

      if (user.role === 'CLIENT') {
        return res
          .status(403)
          .json(
            ResponseFormatter.error(
              'I clienti non possono cancellare preventivi',
              'FORBIDDEN'
            )
          );
      }

      if (quote.status === 'ACCEPTED') {
        return res
          .status(400)
          .json(
            ResponseFormatter.error(
              'Non puoi cancellare un preventivo accettato',
              'INVALID_STATUS'
            )
          );
      }

      const quoteDetails = await prisma.quote.findUnique({
        where: { id },
        include: {
          QuoteItem: true,
          AssistanceRequest: {
            select: {
              id: true,
              title: true,
              clientId: true,
            },
          },
        } as any,
      });

      logger.info('Quote deletion:', {
        action: 'DELETE_QUOTE',
        quoteId: id,
        deletedBy: user.id,
        userRole: user.role,
        quoteDetails: {
          title: quoteDetails?.title,
          amount: quoteDetails?.amount,
          status: quoteDetails?.status,
          version: quoteDetails?.version,
          professionalId: quoteDetails?.professionalId,
          requestId: quoteDetails?.requestId,
          requestTitle: (quoteDetails as any)?.AssistanceRequest?.title,
          itemCount: (quoteDetails as any)?.QuoteItem?.length || 0,
          totalValue:
            (quoteDetails as any)?.QuoteItem?.reduce(
              (sum: number, item: any) => sum + (Number(item.totalPrice) || 0),
              0
            ) || 0,
        },
        reason: req.body?.reason || 'Cancellazione manuale',
        timestamp: new Date().toISOString(),
        ipAddress: req.ip || 'unknown',
      });

      await prisma.$transaction(async (tx) => {
        await tx.quoteItem.deleteMany({
          where: { quoteId: id },
        });

        await tx.quoteRevision.deleteMany({
          where: { quoteId: id },
        });

        await tx.quote.delete({
          where: { id },
        });
      });

      res.json(
        ResponseFormatter.success(
          { id, deleted: true },
          'Preventivo cancellato con successo'
        )
      );
    } catch (error) {
      logger.error('Error deleting quote:', error);
      res
        .status(500)
        .json(
          ResponseFormatter.error(
            'Errore nella cancellazione del preventivo',
            'SERVER_ERROR'
          )
        );
    }
  }
);

/**
 * GET /api/quotes/:id/revisions
 * Ottieni la cronologia delle revisioni
 */
router.get(
  '/:id/revisions',
  [param('id').isUUID().withMessage('ID preventivo non valido')],
  validate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const user = req.user!;

      const quote = await prisma.quote.findUnique({
        where: { id },
        include: { AssistanceRequest: true },
      });

      if (!quote) {
        return res
          .status(404)
          .json(
            ResponseFormatter.error('Preventivo non trovato', 'QUOTE_NOT_FOUND')
          );
      }

      if (user.role === 'CLIENT' && quote.AssistanceRequest.clientId !== user.id) {
        return res
          .status(403)
          .json(ResponseFormatter.error('Non autorizzato', 'UNAUTHORIZED'));
      }

      if (user.role === 'PROFESSIONAL' && quote.professionalId !== user.id) {
        return res
          .status(403)
          .json(ResponseFormatter.error('Non autorizzato', 'UNAUTHORIZED'));
      }

      const revisions = await prisma.quoteRevision.findMany({
        where: { quoteId: id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
            },
          },
        },
        orderBy: { version: 'desc' },
      });

      res.json(
        ResponseFormatter.success(
          revisions,
          'Cronologia revisioni recuperata con successo'
        )
      );
    } catch (error) {
      logger.error('Error fetching quote revisions:', error);
      res
        .status(500)
        .json(
          ResponseFormatter.error('Errore nel recupero delle revisioni', 'SERVER_ERROR')
        );
    }
  }
);

/**
 * POST /api/quotes/:id/accept
 * Accetta preventivo (solo CLIENT)
 */
router.post(
  '/:id/accept',
  [param('id').isUUID().withMessage('ID preventivo non valido')],
  validate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const user = req.user!;

      if (user.role !== 'CLIENT') {
        return res
          .status(403)
          .json(
            ResponseFormatter.error(
              'Solo i clienti possono accettare preventivi',
              'FORBIDDEN'
            )
          );
      }

      const quote = await prisma.quote.findUnique({
        where: { id },
        include: {
          AssistanceRequest: {
            include: {
              User_AssistanceRequest_clientIdToUser: true,
            },
          },
          User: true,
        },
      });

      if (!quote) {
        return res
          .status(404)
          .json(ResponseFormatter.error('Preventivo non trovato', 'NOT_FOUND'));
      }

      if (quote.AssistanceRequest.clientId !== user.id) {
        return res
          .status(403)
          .json(
            ResponseFormatter.error(
              'Non autorizzato ad accettare questo preventivo',
              'FORBIDDEN'
            )
          );
      }

      if (quote.status !== 'PENDING') {
        return res
          .status(400)
          .json(
            ResponseFormatter.error(
              `Impossibile accettare un preventivo con stato ${quote.status}`,
              'INVALID_STATUS'
            )
          );
      }

      const updatedQuote = await prisma.$transaction(async (tx) => {
        const acceptedQuote = await tx.quote.update({
          where: { id },
          data: {
            status: 'ACCEPTED',
            acceptedAt: new Date(),
            updatedAt: new Date(),
          },
          include: {
            AssistanceRequest: {
              include: {
                User_AssistanceRequest_clientIdToUser: true,
              },
            },
            User: true,
          },
        });

        await tx.quote.updateMany({
          where: {
            requestId: quote.requestId,
            id: { not: id },
            status: 'PENDING',
          },
          data: {
            status: 'REJECTED',
            rejectedAt: new Date(),
            updatedAt: new Date(),
          },
        });

        return acceptedQuote;
      });

      logger.info(`Quote ${id} accepted by client ${user.id}`);

      try {
        const { notificationService } = await import(
          '../services/notification.service'
        );
        await notificationService.sendToUser({
          userId: quote.professionalId,
          title: '✅ Preventivo Accettato!',
          message: `Il tuo preventivo di €${quote.amount} è stato accettato da ${quote.AssistanceRequest.User_AssistanceRequest_clientIdToUser.firstName}`,
          type: 'quote_accepted',
          data: { relatedId: id, relatedType: 'quote' },
        });
      } catch (notifError) {
        logger.warn('Could not send notification:', notifError);
      }

      return res.json(
        ResponseFormatter.success(updatedQuote, 'Preventivo accettato con successo!')
      );
    } catch (error) {
      logger.error('Error accepting quote:', error);
      return res
        .status(500)
        .json(
          ResponseFormatter.error(
            'Errore nell\'accettazione del preventivo',
            'ACCEPT_ERROR'
          )
        );
    }
  }
);

/**
 * POST /api/quotes/:id/reject
 * Rifiuta preventivo (solo CLIENT)
 */
router.post(
  '/:id/reject',
  [
    param('id').isUUID().withMessage('ID preventivo non valido'),
    body('reason')
      .optional()
      .isString()
      .withMessage('Il motivo deve essere una stringa'),
  ],
  validate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const user = req.user!;

      if (user.role !== 'CLIENT') {
        return res
          .status(403)
          .json(
            ResponseFormatter.error(
              'Solo i clienti possono rifiutare preventivi',
              'FORBIDDEN'
            )
          );
      }

      const quote = await prisma.quote.findUnique({
        where: { id },
        include: {
          AssistanceRequest: {
            include: {
              User_AssistanceRequest_clientIdToUser: true,
            },
          },
          User: true,
        },
      });

      if (!quote) {
        return res
          .status(404)
          .json(ResponseFormatter.error('Preventivo non trovato', 'NOT_FOUND'));
      }

      if (quote.AssistanceRequest.clientId !== user.id) {
        return res
          .status(403)
          .json(
            ResponseFormatter.error(
              'Non autorizzato a rifiutare questo preventivo',
              'FORBIDDEN'
            )
          );
      }

      if (quote.status !== 'PENDING') {
        return res
          .status(400)
          .json(
            ResponseFormatter.error(
              `Impossibile rifiutare un preventivo con stato ${quote.status}`,
              'INVALID_STATUS'
            )
          );
      }

      const updatedQuote = await prisma.quote.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectionReason: reason || null,
          updatedAt: new Date(),
        },
        include: {
          AssistanceRequest: {
            include: {
              User_AssistanceRequest_clientIdToUser: true,
            },
          },
          User: true,
        },
      });

      logger.info(
        `Quote ${id} rejected by client ${user.id}${
          reason ? ` with reason: ${reason}` : ''
        }`
      );

      try {
        const { notificationService } = await import(
          '../services/notification.service'
        );
        const message = reason
          ? `Il tuo preventivo è stato rifiutato. Motivo: ${reason}`
          : 'Il tuo preventivo è stato rifiutato';

        await notificationService.sendToUser({
          userId: quote.professionalId,
          title: '❌ Preventivo Rifiutato',
          message,
          type: 'quote_rejected',
          data: { relatedId: id, relatedType: 'quote' },
        });
      } catch (notifError) {
        logger.warn('Could not send notification:', notifError);
      }

      return res.json(
        ResponseFormatter.success(updatedQuote, 'Preventivo rifiutato')
      );
    } catch (error) {
      logger.error('Error rejecting quote:', error);
      return res
        .status(500)
        .json(
          ResponseFormatter.error('Errore nel rifiuto del preventivo', 'REJECT_ERROR')
        );
    }
  }
);

/**
 * GET /api/quotes/:id/pdf
 * Download PDF del preventivo
 */
router.get('/:id/pdf', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id: quoteId } = req.params;
    const user = req.user!;

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        AssistanceRequest: {
          include: {
            User_AssistanceRequest_clientIdToUser: true,
          },
        },
        User: true,
      },
    });

    if (!quote) {
      return res
        .status(404)
        .json(ResponseFormatter.error('Quote not found', 'NOT_FOUND'));
    }

    const canAccess =
      user.role === 'ADMIN' ||
      user.role === 'SUPER_ADMIN' ||
      quote.professionalId === user.id ||
      quote.AssistanceRequest?.clientId === user.id;

    if (!canAccess) {
      return res
        .status(403)
        .json(ResponseFormatter.error('Access denied', 'FORBIDDEN'));
    }

    const { pdfService } = await import('../services/pdf.service');

    const pdfPath = await pdfService.generateQuotePDF(quoteId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="preventivo-${quoteId.slice(0, 8)}.pdf"`
    );

    res.sendFile(pdfPath, (err) => {
      if (err) {
        logger.error('Error sending quote PDF:', err);
        if (!res.headersSent) {
          res
            .status(500)
            .json(ResponseFormatter.error('Error downloading PDF', 'PDF_ERROR'));
        }
      }

      setTimeout(() => {
        try {
          pdfService.deletePDF(
            `preventivo-${quoteId.slice(0, 8)}-v${quote.version}.pdf`
          );
        } catch (cleanupErr) {
          logger.warn('Could not clean up quote PDF file:', cleanupErr);
        }
      }, 5000);
    });
  } catch (error) {
    logger.error('Error generating quote PDF:', error);
    res
      .status(500)
      .json(ResponseFormatter.error('Error generating PDF', 'PDF_ERROR'));
  }
});

export const quoteRoutes = router;
