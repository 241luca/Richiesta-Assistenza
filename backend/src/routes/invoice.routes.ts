/**
 * Invoice Routes - API Endpoints Sistema Fatturazione
 * Data: 28/09/2025
 * Versione: 1.0.2
 * 
 * FIXED v1.0.2: TypeScript strict mode compliant
 */

import * as express from 'express';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { Role, Prisma, AuditAction } from '@prisma/client';
import { validate } from '../middleware/validation';
import { invoiceService } from '../services/invoice.service';
import { ResponseFormatter } from '../utils/responseFormatter';
import { auditLogger } from '../middleware/auditLogger';
import { emailService } from '../services/email.service';

const router = express.Router();

// ========================================
// TYPES & INTERFACES
// ========================================

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: Role;
    email: string;
    fullName?: string;
  };
}

interface InvoiceFilters {
  customerId?: string;
  professionalId?: string;
  documentType?: string;
  paymentStatus?: string;
  search?: string;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  amountRange?: {
    min?: number;
    max?: number;
  };
}

interface PaginationOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface EmailOptions {
  to?: string;
  cc?: string;
  customMessage?: string;
}

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
    professionalId: z.string().optional(),
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
  requireRole([Role.PROFESSIONAL, Role.ADMIN, Role.SUPER_ADMIN]),
  validate(createInvoiceSchema),
  auditLogger({ action: AuditAction.CREATE, entityType: 'Invoice' }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json(ResponseFormatter.error('Unauthorized', 'UNAUTHORIZED'));
      }

      const userId = req.user.id;
      const userRole = req.user.role;
      const data = req.body;

      // Determina il professionalId
      let professionalId = userId;
      if (userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN) {
        professionalId = data.professionalId || userId;
      }

      const invoice = await invoiceService.createInvoice({
        ...data,
        customerData: data.customerData,
        lineItems: data.lineItems,
        customerId: data.customerId || userId,
        customerName: data.customerData.name,
        customerAddress: data.customerData.address,
        customerCity: data.customerData.city,
        customerZipCode: data.customerData.zipCode,
        customerEmail: data.customerData.email,
        customerFiscalCode: data.customerData.fiscalCode,
        customerVatNumber: data.customerData.vatNumber,
        customerType: data.customerType,
        documentType: data.documentType,
        notes: data.notes,
      }, professionalId);

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
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json(ResponseFormatter.error('Unauthorized', 'UNAUTHORIZED'));
      }

      const userId = req.user.id;
      const userRole = req.user.role;
      const { invoiceId } = req.params;

      const invoice = await invoiceService.getInvoice(invoiceId);

      // Verifica permessi
      if (userRole !== Role.ADMIN && userRole !== Role.SUPER_ADMIN) {
        if (invoice.professionalId !== userId && invoice.customerId !== userId) {
          return res.status(403).json(
            ResponseFormatter.error('Non autorizzato a visualizzare questa fattura', 'FORBIDDEN')
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
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json(ResponseFormatter.error('Unauthorized', 'UNAUTHORIZED'));
      }

      const userId = req.user.id;
      const userRole = req.user.role;
      
      const filters: InvoiceFilters = {};

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
        page = '1',
        limit = '20',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      if (typeof documentType === 'string') {
        filters.documentType = documentType;
      }
      
      if (typeof paymentStatus === 'string') {
        filters.paymentStatus = paymentStatus;
      }
      
      if (typeof search === 'string') {
        filters.search = search;
      }
      
      if (typeof fromDate === 'string' || typeof toDate === 'string') {
        filters.dateRange = {
          from: typeof fromDate === 'string' ? new Date(fromDate) : undefined,
          to: typeof toDate === 'string' ? new Date(toDate) : undefined,
        };
      }
      
      if (typeof minAmount === 'string' || typeof maxAmount === 'string') {
        filters.amountRange = {
          min: typeof minAmount === 'string' ? Number(minAmount) : undefined,
          max: typeof maxAmount === 'string' ? Number(maxAmount) : undefined,
        };
      }

      const pageNum = parseInt(typeof page === 'string' ? page : '1', 10);
      const limitNum = parseInt(typeof limit === 'string' ? limit : '20', 10);
      const sortByStr = typeof sortBy === 'string' ? sortBy : 'createdAt';
      const sortOrderStr = (typeof sortOrder === 'string' && (sortOrder === 'asc' || sortOrder === 'desc')) 
        ? sortOrder 
        : 'desc';

      const paginationOptions: PaginationOptions = {
        page: pageNum,
        limit: limitNum,
        sortBy: sortByStr,
        sortOrder: sortOrderStr,
      };

      const result = await invoiceService.listInvoices(filters, paginationOptions);

      res.json(ResponseFormatter.success(result));
    } catch (error) {
      next(error);
    }
  }
);

// Aggiorna fattura
router.put('/:invoiceId',
  authenticate,
  requireRole([Role.PROFESSIONAL, Role.ADMIN, Role.SUPER_ADMIN]),
  validate(updateInvoiceSchema),
  auditLogger({ action: AuditAction.UPDATE, entityType: 'Invoice' }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json(ResponseFormatter.error('Unauthorized', 'UNAUTHORIZED'));
      }

      const userId = req.user.id;
      const userRole = req.user.role;
      const { invoiceId } = req.params;
      const updates = req.body;

      // Verifica permessi
      const invoice = await invoiceService.getInvoice(invoiceId);
      
      if (userRole === Role.PROFESSIONAL && invoice.professionalId !== userId) {
        return res.status(403).json(
          ResponseFormatter.error('Non autorizzato a modificare questa fattura', 'FORBIDDEN')
        );
      }

      // Non permettere modifiche se già pagata
      if (invoice.status === 'PAID') {
        return res.status(400).json(
          ResponseFormatter.error('Non è possibile modificare una fattura già pagata', 'INVOICE_PAID')
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
  requireRole([Role.PROFESSIONAL, Role.ADMIN, Role.SUPER_ADMIN]),
  validate(paymentSchema),
  auditLogger({ action: AuditAction.UPDATE, entityType: 'Payment' }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json(ResponseFormatter.error('Unauthorized', 'UNAUTHORIZED'));
      }

      const userId = req.user.id;
      const userRole = req.user.role;
      const { invoiceId } = req.params;
      const paymentData = req.body;

      // Verifica permessi
      const invoice = await invoiceService.getInvoice(invoiceId);
      
      if (userRole === Role.PROFESSIONAL && invoice.professionalId !== userId) {
        return res.status(403).json(
          ResponseFormatter.error('Non autorizzato', 'FORBIDDEN')
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
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json(ResponseFormatter.error('Unauthorized', 'UNAUTHORIZED'));
      }

      const userId = req.user.id;
      const userRole = req.user.role;
      const { invoiceId } = req.params;

      // Verifica permessi
      const invoice = await invoiceService.getInvoice(invoiceId);
      
      if (userRole !== Role.ADMIN && userRole !== Role.SUPER_ADMIN) {
        if (invoice.professionalId !== userId && invoice.customerId !== userId) {
          return res.status(403).json(
            ResponseFormatter.error('Non autorizzato', 'FORBIDDEN')
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
  requireRole([Role.PROFESSIONAL, Role.ADMIN, Role.SUPER_ADMIN]),
  auditLogger({ action: AuditAction.UPDATE, entityType: 'Invoice' }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json(ResponseFormatter.error('Unauthorized', 'UNAUTHORIZED'));
      }

      const userId = req.user.id;
      const userRole = req.user.role;
      const { invoiceId } = req.params;
      const { to, cc, message } = req.body;

      // Verifica permessi
      const invoice = await invoiceService.getInvoice(invoiceId);
      
      if (userRole === Role.PROFESSIONAL && invoice.professionalId !== userId) {
        return res.status(403).json(
          ResponseFormatter.error('Non autorizzato', 'FORBIDDEN')
        );
      }

      // Type guard per customerData
      const customerData = invoice.customerData as { email?: string } | null;
      const customerEmail = customerData?.email;

      const emailOptions: EmailOptions = {
        to: to || customerEmail,
        cc,
        customMessage: message,
      };

      await invoiceService.sendInvoiceEmail(invoiceId, emailOptions);

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
  requireRole([Role.PROFESSIONAL, Role.ADMIN, Role.SUPER_ADMIN]),
  auditLogger({ action: AuditAction.UPDATE, entityType: 'Invoice' }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json(ResponseFormatter.error('Unauthorized', 'UNAUTHORIZED'));
      }

      const userId = req.user.id;
      const userRole = req.user.role;
      const { invoiceId } = req.params;
      const { message } = req.body;

      // Verifica permessi
      const invoice = await invoiceService.getInvoice(invoiceId);
      
      if (userRole === Role.PROFESSIONAL && invoice.professionalId !== userId) {
        return res.status(403).json(
          ResponseFormatter.error('Non autorizzato', 'FORBIDDEN')
        );
      }

      // Solo per fatture non pagate
      if (invoice.status === 'PAID') {
        return res.status(400).json(
          ResponseFormatter.error('La fattura è già stata pagata', 'INVOICE_PAID')
        );
      }

      await invoiceService.sendPaymentReminder(invoiceId);

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
  requireRole([Role.PROFESSIONAL, Role.ADMIN, Role.SUPER_ADMIN]),
  auditLogger({ action: AuditAction.CREATE, entityType: 'CreditNote' }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json(ResponseFormatter.error('Unauthorized', 'UNAUTHORIZED'));
      }

      const userId = req.user.id;
      const userRole = req.user.role;
      const { originalInvoiceId, reason, lineItems, amount } = req.body;

      // Verifica permessi sulla fattura originale
      const originalInvoice = await invoiceService.getInvoice(originalInvoiceId);
      
      if (userRole === Role.PROFESSIONAL && originalInvoice.professionalId !== userId) {
        return res.status(403).json(
          ResponseFormatter.error('Non autorizzato', 'FORBIDDEN')
        );
      }

      const creditNote = await invoiceService.createCreditNote(
        originalInvoiceId,
        lineItems || [],
        reason,
        userId
      );

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
  requireRole([Role.PROFESSIONAL, Role.ADMIN, Role.SUPER_ADMIN]),
  auditLogger({ action: AuditAction.CREATE, entityType: 'ElectronicInvoice' }),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json(ResponseFormatter.error('Unauthorized', 'UNAUTHORIZED'));
      }

      const userId = req.user.id;
      const userRole = req.user.role;
      const { invoiceId } = req.params;

      // Verifica permessi
      const invoice = await invoiceService.getInvoice(invoiceId);
      
      if (userRole === Role.PROFESSIONAL && invoice.professionalId !== userId) {
        return res.status(403).json(
          ResponseFormatter.error('Non autorizzato', 'FORBIDDEN')
        );
      }

      // Solo per fatture business
      // ✅ FIX: customerType è in customerData (JSON), non direttamente in invoice
      const customerData = invoice.customerData as { name?: string; vatNumber?: string } | null;
      const hasVatNumber = customerData && customerData.vatNumber;
      
      if (!hasVatNumber) {
        return res.status(400).json(
          ResponseFormatter.error('La fattura elettronica è richiesta solo per clienti business con Partita IVA', 'INVALID_CUSTOMER_TYPE')
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
  requireRole([Role.PROFESSIONAL, Role.ADMIN, Role.SUPER_ADMIN]),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json(ResponseFormatter.error('Unauthorized', 'UNAUTHORIZED'));
      }

      const userId = req.user.id;
      const userRole = req.user.role;
      const { startDate, endDate, groupBy = 'month', professionalId: queryProfessionalId } = req.query;

      let professionalId = userId;
      if ((userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN) && typeof queryProfessionalId === 'string') {
        professionalId = queryProfessionalId;
      }

      const groupByStr = typeof groupBy === 'string' ? groupBy : 'month';

      const stats = await invoiceService.getInvoiceStatistics(professionalId, {
        startDate: typeof startDate === 'string' ? new Date(startDate) : undefined,
        endDate: typeof endDate === 'string' ? new Date(endDate) : undefined,
        groupBy: groupByStr,
      });

      res.json(ResponseFormatter.success(stats));
    } catch (error) {
      next(error);
    }
  }
);

export default router;
