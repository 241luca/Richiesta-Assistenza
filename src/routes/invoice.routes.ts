/**
 * Invoice Routes - API Endpoints Sistema Fatturazione
 * Data: 28/09/2025
 * Versione: 1.0.1
 * 
 * FIXED v1.0.1: Corretti import middleware esistenti
 */

import express from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { Role } from '@prisma/client';
import { validate } from '../middleware/validation';  // CORRETTO: validate invece di validateRequest
import { invoiceService } from '../services/invoice.service';
import { ResponseFormatter } from '../utils/responseFormatter';
import { auditLogger } from '../middleware/auditLogger';
import { emailService } from '../services/email.service';

const router = express.Router();

// ========================================
// VALIDATION SCHEMAS
// ========================================

const createInvoiceSchema = z.object({
  body: z.object({
    documentType: z.enum(['INVOICE', 'RECEIPT', 'PROFORMA', 'CREDIT_NOTE']),
    paymentId: z.string().optional(),
    requestId: z.string().optional(),
    quoteId: z.string().optional(),
    customerId: z.string().optional(),
    customerType: z.enum(['PRIVATE', 'BUSINESS']).default('PRIVATE'),
    customerData: z.object({
      name: z.string(),
      email: z.string().email(),
      fiscalCode: z.string().optional(),
      vatNumber: z.string().optional(),
      address: z.string(),
      city: z.string(),
      zipCode: z.string(),
      country: z.string().default('IT'),
      sdiCode: z.string().optional(),
      pecEmail: z.string().email().optional(),
    }),
    lineItems: z.array(z.object({
      description: z.string(),
      quantity: z.number().positive(),
      unitPrice: z.number(),
      vatRate: z.number().default(22),
      discount: z.number().default(0),
    })),
    notes: z.string().optional(),
    dueDate: z.string().optional(),
  })
});

const updateInvoiceSchema = z.object({
  body: z.object({
    customerData: z.object({
      name: z.string(),
      email: z.string().email(),
      address: z.string(),
      city: z.string(),
      zipCode: z.string(),
    }).optional(),
    lineItems: z.array(z.object({
      description: z.string(),
      quantity: z.number().positive(),
      unitPrice: z.number(),
      vatRate: z.number(),
    })).optional(),
    notes: z.string().optional(),
    dueDate: z.string().optional(),
    paymentStatus: z.enum(['NOT_PAID', 'PARTIAL', 'PAID', 'OVERDUE']).optional(),
  })
});

const paymentSchema = z.object({
  body: z.object({
    amount: z.number().positive(),
    paymentMethod: z.string().optional(),
    paymentDate: z.string(),
    reference: z.string().optional(),
    notes: z.string().optional(),
  })
});

// ========================================
// INVOICE CRUD ROUTES
// ========================================

// Crea fattura
router.post('/',
  authenticate,
  requireRole(Role.PROFESSIONAL, Role.ADMIN, Role.SUPER_ADMIN),
  validate(createInvoiceSchema),
  auditLogger('INVOICE_CREATE'),
  async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role as Role;
      const data = req.body;

      // Determina il professionalId
      let professionalId = userId;
      if (userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN) {
        professionalId = data.professionalId || userId;
      }

      const invoice = await invoiceService.createInvoice({
        ...data,
        professionalId,
        createdBy: userId,
      });

      res.json(ResponseFormatter.success(
        invoice,
        'Fattura creata con successo'
      ));
    } catch (error) {
      next(error);
    }
  }
);

// Recupera fattura
router.get('/:invoiceId',
  authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role as Role;
      const { invoiceId } = req.params;

      const invoice = await invoiceService.getInvoice(invoiceId);

      // Verifica permessi
      if (userRole !== Role.ADMIN && userRole !== Role.SUPER_ADMIN) {
        if (invoice.professionalId !== userId && invoice.customerId !== userId) {
          return res.status(403).json(
            ResponseFormatter.error('Non autorizzato a visualizzare questa fattura')
          );
        }
      }

      res.json(ResponseFormatter.success(invoice));
    } catch (error) {
      next(error);
    }
  }
);

// Lista fatture
router.get('/',
  authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role as Role;
      
      const filters: any = {};

      // Applica filtri base in base al ruolo
      if (userRole === Role.CLIENT) {
        filters.customerId = userId;
      } else if (userRole === Role.PROFESSIONAL) {
        filters.professionalId = userId;
      }

      // Aggiungi filtri dalla query
      const {
        documentType,
        paymentStatus,
        fromDate,
        toDate,
        minAmount,
        maxAmount,
        search,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      if (documentType) filters.documentType = documentType;
      if (paymentStatus) filters.paymentStatus = paymentStatus;
      if (search) filters.search = search;
      if (fromDate || toDate) {
        filters.dateRange = {
          from: fromDate ? new Date(fromDate as string) : undefined,
          to: toDate ? new Date(toDate as string) : undefined,
        };
      }
      if (minAmount || maxAmount) {
        filters.amountRange = {
          min: minAmount ? Number(minAmount) : undefined,
          max: maxAmount ? Number(maxAmount) : undefined,
        };
      }

      const result = await invoiceService.listInvoices(filters, {
        page: Number(page),
        limit: Number(limit),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      res.json(ResponseFormatter.success(result));
    } catch (error) {
      next(error);
    }
  }
);

// Aggiorna fattura
router.put('/:invoiceId',
  authenticate,
  requireRole(Role.PROFESSIONAL, Role.ADMIN, Role.SUPER_ADMIN),
  validate(updateInvoiceSchema),
  auditLogger('INVOICE_UPDATE'),
  async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role as Role;
      const { invoiceId } = req.params;
      const updates = req.body;

      // Verifica permessi
      const invoice = await invoiceService.getInvoice(invoiceId);
      
      if (userRole === Role.PROFESSIONAL && invoice.professionalId !== userId) {
        return res.status(403).json(
          ResponseFormatter.error('Non autorizzato a modificare questa fattura')
        );
      }

      // Non permettere modifiche se già pagata
      if (invoice.paymentStatus === 'PAID') {
        return res.status(400).json(
          ResponseFormatter.error('Non è possibile modificare una fattura già pagata')
        );
      }

      const updated = await invoiceService.updateInvoice(invoiceId, updates);

      res.json(ResponseFormatter.success(
        updated,
        'Fattura aggiornata con successo'
      ));
    } catch (error) {
      next(error);
    }
  }
);

// ========================================
// PAYMENT TRACKING
// ========================================

// Registra pagamento su fattura
router.post('/:invoiceId/payment',
  authenticate,
  requireRole(Role.PROFESSIONAL, Role.ADMIN, Role.SUPER_ADMIN),
  validate(paymentSchema),
  auditLogger('INVOICE_PAYMENT_RECORD'),
  async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role as Role;
      const { invoiceId } = req.params;
      const paymentData = req.body;

      // Verifica permessi
      const invoice = await invoiceService.getInvoice(invoiceId);
      
      if (userRole === Role.PROFESSIONAL && invoice.professionalId !== userId) {
        return res.status(403).json(
          ResponseFormatter.error('Non autorizzato')
        );
      }

      const result = await invoiceService.recordPayment(invoiceId, {
        ...paymentData,
        createdBy: userId,
      });

      res.json(ResponseFormatter.success(
        result,
        'Pagamento registrato con successo'
      ));
    } catch (error) {
      next(error);
    }
  }
);

// ========================================
// DOCUMENT GENERATION
// ========================================

// Scarica PDF fattura
router.get('/:invoiceId/download',
  authenticate,
  async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role as Role;
      const { invoiceId } = req.params;

      // Verifica permessi
      const invoice = await invoiceService.getInvoice(invoiceId);
      
      if (userRole !== Role.ADMIN && userRole !== Role.SUPER_ADMIN) {
        if (invoice.professionalId !== userId && invoice.customerId !== userId) {
          return res.status(403).json(
            ResponseFormatter.error('Non autorizzato')
          );
        }
      }

      const pdfBuffer = await invoiceService.generatePDF(invoiceId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="fattura-${invoice.invoiceNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }
);

// ========================================
// EMAIL SENDING
// ========================================

// Invia fattura via email
router.post('/:invoiceId/send',
  authenticate,
  requireRole(Role.PROFESSIONAL, Role.ADMIN, Role.SUPER_ADMIN),
  auditLogger('INVOICE_SEND_EMAIL'),
  async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role as Role;
      const { invoiceId } = req.params;
      const { to, cc, message } = req.body;

      // Verifica permessi
      const invoice = await invoiceService.getInvoice(invoiceId);
      
      if (userRole === Role.PROFESSIONAL && invoice.professionalId !== userId) {
        return res.status(403).json(
          ResponseFormatter.error('Non autorizzato')
        );
      }

      await invoiceService.sendInvoiceEmail(invoiceId, {
        to: to || invoice.customerData.email,
        cc,
        customMessage: message,
      });

      res.json(ResponseFormatter.success(
        null,
        'Fattura inviata con successo'
      ));
    } catch (error) {
      next(error);
    }
  }
);

// Invia reminder pagamento
router.post('/:invoiceId/reminder',
  authenticate,
  requireRole(Role.PROFESSIONAL, Role.ADMIN, Role.SUPER_ADMIN),
  auditLogger('INVOICE_SEND_REMINDER'),
  async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role as Role;
      const { invoiceId } = req.params;
      const { message } = req.body;

      // Verifica permessi
      const invoice = await invoiceService.getInvoice(invoiceId);
      
      if (userRole === Role.PROFESSIONAL && invoice.professionalId !== userId) {
        return res.status(403).json(
          ResponseFormatter.error('Non autorizzato')
        );
      }

      // Solo per fatture non pagate
      if (invoice.paymentStatus === 'PAID') {
        return res.status(400).json(
          ResponseFormatter.error('La fattura è già stata pagata')
        );
      }

      await invoiceService.sendPaymentReminder(invoiceId, message);

      res.json(ResponseFormatter.success(
        null,
        'Promemoria inviato con successo'
      ));
    } catch (error) {
      next(error);
    }
  }
);

// ========================================
// CREDIT NOTES
// ========================================

// Crea nota di credito
router.post('/credit-note',
  authenticate,
  requireRole(Role.PROFESSIONAL, Role.ADMIN, Role.SUPER_ADMIN),
  auditLogger('CREDIT_NOTE_CREATE'),
  async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role as Role;
      const { originalInvoiceId, reason, lineItems, amount } = req.body;

      // Verifica permessi sulla fattura originale
      const originalInvoice = await invoiceService.getInvoice(originalInvoiceId);
      
      if (userRole === Role.PROFESSIONAL && originalInvoice.professionalId !== userId) {
        return res.status(403).json(
          ResponseFormatter.error('Non autorizzato')
        );
      }

      const creditNote = await invoiceService.createCreditNote({
        originalInvoiceId,
        reason,
        lineItems: lineItems || [],
        amount: amount || 0,
        createdBy: userId,
      });

      res.json(ResponseFormatter.success(
        creditNote,
        'Nota di credito creata con successo'
      ));
    } catch (error) {
      next(error);
    }
  }
);

// ========================================
// ELECTRONIC INVOICING
// ========================================

// Genera fattura elettronica
router.post('/:invoiceId/electronic',
  authenticate,
  requireRole(Role.PROFESSIONAL, Role.ADMIN, Role.SUPER_ADMIN),
  auditLogger('INVOICE_ELECTRONIC_GENERATE'),
  async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role as Role;
      const { invoiceId } = req.params;

      // Verifica permessi
      const invoice = await invoiceService.getInvoice(invoiceId);
      
      if (userRole === Role.PROFESSIONAL && invoice.professionalId !== userId) {
        return res.status(403).json(
          ResponseFormatter.error('Non autorizzato')
        );
      }

      // Solo per fatture business
      if (invoice.customerType !== 'BUSINESS') {
        return res.status(400).json(
          ResponseFormatter.error('La fattura elettronica è richiesta solo per clienti business')
        );
      }

      const result = await invoiceService.generateElectronicInvoice(invoiceId);

      res.json(ResponseFormatter.success(
        result,
        'Fattura elettronica generata con successo'
      ));
    } catch (error) {
      next(error);
    }
  }
);

// ========================================
// STATISTICS
// ========================================

// Statistiche fatturazione
router.get('/stats/summary',
  authenticate,
  requireRole(Role.PROFESSIONAL, Role.ADMIN, Role.SUPER_ADMIN),
  async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role as Role;
      const { startDate, endDate, groupBy = 'month' } = req.query;

      let professionalId = userId;
      if ((userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN) && req.query.professionalId) {
        professionalId = req.query.professionalId as string;
      }

      const stats = await invoiceService.getInvoiceStatistics(professionalId, {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        groupBy: groupBy as string,
      });

      res.json(ResponseFormatter.success(stats));
    } catch (error) {
      next(error);
    }
  }
);

export default router;