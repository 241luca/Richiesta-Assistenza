import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { checkRole } from '../middleware/checkRole';
import { quoteService } from '../services/quote.service';
import { pdfService } from '../services/pdf.service';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { ResponseFormatter } from '../utils/responseFormatter';

interface AuthRequest extends Request {
  user?: any;
}

const prisma = new PrismaClient();
const router = Router();

// Tutti gli endpoint richiedono autenticazione
router.use(authenticate);

/**
 * GET /api/quotes
 * Ottieni preventivi (filtrati per ruolo)
 */
router.get(
  '/',
  [
    query('requestId').optional().isUUID(),
    query('status').optional().isIn(['DRAFT', 'PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED']),
    query('professionalId').optional().isUUID(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validate,
  async (req: AuthRequest, res, next) => {
    try {
      const { requestId, status, professionalId, page = 1, limit = 20 } = req.query;
      const user = req.user!;

      // Build where clause based on role
      const where: any = {};

      if (requestId) {
        where.requestId = requestId;
      }

      if (status) {
        where.status = status;
      }

      // Filter by role
      if (user.role === 'CLIENT') {
        where.request = {  // Corretto
          clientId: user.id
        };
        where.status = where.status || { not: 'DRAFT' };
        
        if (status && status !== 'DRAFT') {
          where.status = status;
        } else if (!status) {
          where.status = { not: 'DRAFT' };
        } else if (status === 'DRAFT') {
          return res.json(ResponseFormatter.success({
            data: [], 
            pagination: { page: 1, limit: Number(limit), total: 0, pages: 0 }
          }));
        }
      } else if (user.role === 'PROFESSIONAL') {
        where.professionalId = user.id;
      }

      if (professionalId && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
        where.professionalId = professionalId;
      }
      
      const quotes = await prisma.quote.findMany({
        where,
        include: {
          items: {
            orderBy: { order: 'asc' }
          },
          request: {
            include: {
              client: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  fullName: true,
                  email: true
                }
              },
              category: true,
              subcategory: true
            }
          },
          professional: {  // Nome corretto della relazione
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              email: true,
              professionData: true
            }
          }
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      });
      
      const transformedQuotes = quotes.map(quote => {
        let totalAmount = 0;
        if (quote.items && quote.items.length > 0) {
          totalAmount = quote.items.reduce((sum, item) => {
            return sum + (Number(item.totalPrice) * 100);
          }, 0);
        } else {
          totalAmount = Number(quote.amount) * 100;
        }
        
        return {
          ...quote,
          totalAmount,
          // Alias per backward compatibility
          request: quote.request,  // Già corretto
          professional: quote.professional,  // Già corretto
          items: quote.items.map(item => ({
            ...item,
            unitPrice: Number(item.unitPrice) * 100,
            totalPrice: Number(item.totalPrice) * 100,
            taxAmount: Number(item.taxAmount) * 100,
            discount: Number(item.discount) * 100
          }))
        };
      });

      const total = await prisma.quote.count({ where });

      // ✅ USO CORRETTO ResponseFormatter (come da istruzioni)
      res.json(ResponseFormatter.success({
        data: transformedQuotes,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }));
      
    } catch (error: any) {
      logger.error('Error in GET /api/quotes:', error);
      res.status(500).json(ResponseFormatter.error(
        'Errore nel recupero dei preventivi',
        'FETCH_ERROR'
      ));
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
    body('items.*.description').notEmpty().withMessage('Descrizione voce richiesta'),
    body('items.*.quantity').isFloat({ min: 0.01 }).withMessage('Quantità deve essere maggiore di 0'),
    body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Prezzo unitario non valido'),
    body('items.*.taxRate').isFloat({ min: 0, max: 1 }).withMessage('Aliquota IVA non valida')
  ],
  validate,
  async (req: AuthRequest, res, next) => {
    try {
      const user = req.user!;
      const { requestId, title, description, validUntil, notes, termsConditions, items } = req.body;

      // Verifica che l'utente sia un professionista
      if (user.role !== 'PROFESSIONAL' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        return res.status(403).json(
          ResponseFormatter.error('Solo i professionisti possono creare preventivi', 'FORBIDDEN')
        );
      }

      // Verifica che la richiesta esista
      const request = await prisma.assistanceRequest.findUnique({
        where: { id: requestId },
        include: { client: true }
      });

      if (!request) {
        return res.status(404).json(
          ResponseFormatter.error('Richiesta non trovata', 'NOT_FOUND')
        );
      }

      // Se è un professionista, verifica che la richiesta sia assegnata a lui
      if (user.role === 'PROFESSIONAL' && request.professionalId !== user.id) {
        return res.status(403).json(
          ResponseFormatter.error('Non puoi creare preventivi per richieste non assegnate a te', 'FORBIDDEN')
        );
      }

      // Crea il preventivo
      const quoteData = {
        requestId,
        professionalId: user.id,
        title,
        description,
        validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 giorni
        notes,
        termsConditions,
        items: items.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice, // GIÀ in euro dal frontend
          taxRate: item.taxRate || 0.22,
          totalPrice: item.quantity * item.unitPrice
        }))
      };

      const quote = await quoteService.createQuote(quoteData);

      return res.status(201).json(
        ResponseFormatter.success(quote, 'Preventivo creato con successo')
      );
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
  async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const user = req.user!;

      const quote = await prisma.quote.findUnique({
        where: { id },
        include: {
          items: { orderBy: { order: 'asc' } },
          request: {
            include: {
              client: true,
              category: true,
              subcategory: true
            }
          },
          professional: {  // Nome corretto della relazione
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              email: true,
              professionData: true
            }
          }
        }
      });

      if (!quote) {
        return res.status(404).json(ResponseFormatter.error('Quote not found', 'NOT_FOUND'));
      }

      // Check authorization
      if (user.role === 'CLIENT') {
        if (quote.status === 'DRAFT') {
          return res.status(403).json(ResponseFormatter.error('Quote not available', 'FORBIDDEN'));
        }
        if (quote.request.clientId !== user.id) {
          return res.status(403).json(ResponseFormatter.error('Unauthorized', 'FORBIDDEN'));
        }
      } else if (user.role === 'PROFESSIONAL' && quote.professionalId !== user.id) {
        return res.status(403).json(ResponseFormatter.error('Unauthorized', 'FORBIDDEN'));
      }

      let totalAmount = 0;
      if (quote.items && quote.items.length > 0) {
        totalAmount = quote.items.reduce((sum, item) => {
          return sum + (Number(item.totalPrice) * 100);
        }, 0);
      } else {
        totalAmount = Number(quote.amount) * 100;
      }

      const transformedQuote = {
        ...quote,
        totalAmount,
        amount: Number(quote.amount) * 100,
        depositAmount: quote.depositAmount ? Number(quote.depositAmount) * 100 : null,
        // Alias per backward compatibility
        request: quote.request,  // Già corretto
        professional: quote.professional,  // Già corretto
        items: quote.items.map(item => ({
          ...item,
          unitPrice: Number(item.unitPrice) * 100,
          totalPrice: Number(item.totalPrice) * 100,
          taxAmount: Number(item.taxAmount) * 100,
          discount: Number(item.discount) * 100
        }))
      };

      // ✅ USO CORRETTO ResponseFormatter (come da istruzioni)
      res.json(ResponseFormatter.success(transformedQuote));
      
    } catch (error: any) {
      logger.error('Error in GET /api/quotes/:id:', error);
      res.status(500).json(ResponseFormatter.error(
        'Errore nel recupero del preventivo',
        'FETCH_ERROR'
      ));
    }
  }
);

/**
 * PUT /api/quotes/:id
 * Modifica un preventivo esistente (crea nuova revisione)
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
    body('items').optional().isArray({ min: 1 }).withMessage('Almeno una voce richiesta'),
    body('items.*.description').optional().notEmpty().withMessage('Descrizione voce richiesta'),
    body('items.*.quantity').optional().isFloat({ min: 0.01 }).withMessage('Quantità deve essere maggiore di 0'),
    body('items.*.unitPrice').optional().isFloat({ min: 0 }).withMessage('Prezzo unitario non valido'),
    body('items.*.taxRate').optional().isFloat({ min: 0, max: 1 }).withMessage('Aliquota IVA non valida'),
    body('updateReason').optional().isString().withMessage('Motivo modifica deve essere una stringa')
  ],
  validate,
  async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const user = req.user!;
      const updateData = req.body;

      // Verifica che il preventivo esista
      const quote = await prisma.quote.findUnique({
        where: { id },
        include: { request: true }  // Nome corretto della relazione
      });

      if (!quote) {
        return res.status(404).json(
          ResponseFormatter.error('Preventivo non trovato', 'QUOTE_NOT_FOUND')
        );
      }

      // Verifica autorizzazioni
      if (user.role === 'PROFESSIONAL' && quote.professionalId !== user.id) {
        return res.status(403).json(
          ResponseFormatter.error('Non autorizzato a modificare questo preventivo', 'UNAUTHORIZED')
        );
      }

      // Verifica che il preventivo sia modificabile (solo DRAFT o PENDING)
      if (quote.status !== 'DRAFT' && quote.status !== 'PENDING') {
        return res.status(400).json(
          ResponseFormatter.error(
            `Non puoi modificare un preventivo con stato ${quote.status}`,
            'INVALID_STATUS'
          )
        );
      }

      // Prepara i dati per l'aggiornamento
      const updateInput = {
        title: updateData.title,
        description: updateData.description,
        validUntil: updateData.validUntil ? new Date(updateData.validUntil) : undefined,
        notes: updateData.notes,
        termsConditions: updateData.termsConditions,
        items: updateData.items?.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate || 0.22,
          discount: item.discount || 0,
          notes: item.notes
        })),
        updateReason: updateData.updateReason || 'Modifica preventivo'
      };

      // Chiama il service per aggiornare il preventivo
      const updatedQuote = await quoteService.updateQuote(id, updateInput, user.id);

      return res.json(
        ResponseFormatter.success(updatedQuote, 'Preventivo aggiornato con successo')
      );
    } catch (error) {
      logger.error('Error updating quote:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json(
          ResponseFormatter.error(error.message, error.code || 'UPDATE_ERROR')
        );
      }
      return res.status(500).json(
        ResponseFormatter.error('Errore nell\'aggiornamento del preventivo', 'SERVER_ERROR')
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
  async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const user = req.user!;

      // Verifica che il preventivo esista
      const quote = await prisma.quote.findUnique({
        where: { id },
        include: { request: true }  // Nome corretto della relazione
      });

      if (!quote) {
        return res.status(404).json(
          ResponseFormatter.error('Preventivo non trovato', 'QUOTE_NOT_FOUND')
        );
      }

      // Verifica autorizzazioni
      if (user.role === 'PROFESSIONAL' && quote.professionalId !== user.id) {
        return res.status(403).json(
          ResponseFormatter.error('Non autorizzato a cancellare questo preventivo', 'UNAUTHORIZED')
        );
      }

      if (user.role === 'CLIENT') {
        return res.status(403).json(
          ResponseFormatter.error('I clienti non possono cancellare preventivi', 'FORBIDDEN')
        );
      }

      // Non permettere cancellazione di preventivi accettati
      if (quote.status === 'ACCEPTED') {
        return res.status(400).json(
          ResponseFormatter.error(
            'Non puoi cancellare un preventivo accettato',
            'INVALID_STATUS'
          )
        );
      }

      // Salva i dettagli del preventivo prima di cancellarlo per il log
      const quoteDetails = await prisma.quote.findUnique({
        where: { id },
        include: {
          items: true,
          request: {  // Nome corretto della relazione
            select: {
              id: true,
              title: true,
              clientId: true
            }
          }
        }
      });

      // Log dettagliato della cancellazione
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
          requestTitle: quoteDetails?.request?.title,  // Riferimento corretto
          itemCount: quoteDetails?.items?.length || 0,
          totalValue: quoteDetails?.items?.reduce((sum, item) => 
            sum + (Number(item.totalPrice) || 0), 0
          ) || 0
        },
        reason: req.body?.reason || 'Cancellazione manuale',
        timestamp: new Date().toISOString(),
        ipAddress: req.ip || 'unknown'
      });

      // Usa una transazione per cancellare preventivo e items insieme
      await prisma.$transaction(async (tx) => {
        // Prima cancella tutti gli item
        await tx.quoteItem.deleteMany({
          where: { quoteId: id }
        });
        
        // Poi cancella eventuali revisioni
        await tx.quoteRevision.deleteMany({
          where: { quoteId: id }
        });
        
        // Infine cancella il preventivo
        await tx.quote.delete({
          where: { id }
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
      res.status(500).json(
        ResponseFormatter.error('Errore nella cancellazione del preventivo', 'SERVER_ERROR')
      );
    }
  }
);

/**
 * GET /api/quotes/:id/revisions
 * Ottieni la cronologia delle revisioni di un preventivo
 */
router.get(
  '/:id/revisions',
  [param('id').isUUID().withMessage('ID preventivo non valido')],
  validate,
  async (req: AuthRequest, res, next) => {
    try {
      const { id } = req.params;
      const user = req.user!;

      // Verifica che il preventivo esista
      const quote = await prisma.quote.findUnique({
        where: { id },
        include: { request: true }  // Nome corretto della relazione
      });

      if (!quote) {
        return res.status(404).json(
          ResponseFormatter.error('Preventivo non trovato', 'QUOTE_NOT_FOUND')
        );
      }

      // Verifica autorizzazioni
      if (user.role === 'CLIENT' && quote.request.clientId !== user.id) {
        return res.status(403).json(
          ResponseFormatter.error('Non autorizzato', 'UNAUTHORIZED')
        );
      }

      if (user.role === 'PROFESSIONAL' && quote.professionalId !== user.id) {
        return res.status(403).json(
          ResponseFormatter.error('Non autorizzato', 'UNAUTHORIZED')
        );
      }

      // Ottieni le revisioni
      const revisions = await prisma.quoteRevision.findMany({
        where: { quoteId: id },
        include: {
          professional: {  // Corretto da User
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true
            }
          }
        },
        orderBy: { version: 'desc' }
      });

      res.json(
        ResponseFormatter.success(
          revisions,
          'Cronologia revisioni recuperata con successo'
        )
      );
    } catch (error) {
      logger.error('Error fetching quote revisions:', error);
      res.status(500).json(
        ResponseFormatter.error('Errore nel recupero delle revisioni', 'SERVER_ERROR')
      );
    }
  }
);

// GET /api/quotes/:id/pdf - Download PDF of quote
router.get('/:id/pdf', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id: quoteId } = req.params;
    const user = req.user!;
    
    // Check if quote exists and user has access
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        request: {  // Nome corretto della relazione!
          include: {
            client: true
          }
        },
        professional: true // Nome corretto per il professionista
      }
    });
    
    if (!quote) {
      return res.status(404).json(ResponseFormatter.error('Quote not found', 'NOT_FOUND'));
    }
    
    // Check permissions
    const canAccess = (
      user.role === 'ADMIN' || 
      user.role === 'SUPER_ADMIN' ||
      quote.professionalId === user.id || 
      quote.request?.clientId === user.id
    );
    
    if (!canAccess) {
      return res.status(403).json(ResponseFormatter.error('Access denied', 'FORBIDDEN'));
    }
    
    // Import PDF service
    const { pdfService } = await import('../services/pdf.service');
    
    // Generate PDF
    const pdfPath = await pdfService.generateQuotePDF(quoteId);
    
    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="preventivo-${quoteId.slice(0, 8)}.pdf"`);
    
    // Send file
    res.sendFile(pdfPath, (err) => {
      if (err) {
        logger.error('Error sending quote PDF:', err);
        if (!res.headersSent) {
          res.status(500).json(ResponseFormatter.error('Error downloading PDF', 'PDF_ERROR'));
        }
      }
      
      // Clean up file after sending
      setTimeout(() => {
        try {
          pdfService.deletePDF(`preventivo-${quoteId.slice(0, 8)}-v${quote.version}.pdf`);
        } catch (cleanupErr) {
          logger.warn('Could not clean up quote PDF file:', cleanupErr);
        }
      }, 5000);
    });
    
  } catch (error) {
    logger.error('Error generating quote PDF:', error);
    res.status(500).json(ResponseFormatter.error('Error generating PDF', 'PDF_ERROR'));
  }
});

export const quoteRoutes = router;