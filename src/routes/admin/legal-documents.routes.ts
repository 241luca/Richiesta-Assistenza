import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { validateRequest } from '../../middleware/validation';
import { auditLogger } from '../../middleware/auditLogger';
import { legalDocumentService } from '../../services/legal-document.service';
import { ResponseFormatter } from '../../utils/responseFormatter';
import logger from '../../utils/logger';
import { z } from 'zod';
import { Role, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const router = Router();

// ============================================
// SCHEMA DI VALIDAZIONE
// ============================================

const createDocumentSchema = z.object({
  type: z.enum(['PRIVACY_POLICY', 'TERMS_SERVICE', 'COOKIE_POLICY', 'DPA', 'SLA', 'NDA', 'EULA', 'DISCLAIMER', 'COPYRIGHT', 'ACCEPTABLE_USE', 'CUSTOM']),
  typeConfigId: z.string().optional(),
  internalName: z.string().min(1).max(100),
  displayName: z.string().min(1).max(200),
  description: z.string().optional(),
  icon: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  isRequired: z.boolean().optional().default(true),
  sortOrder: z.number().optional().default(0)
});

const createVersionSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in format X.Y.Z'),
  title: z.string().min(1),
  content: z.string().min(1),
  contentPlain: z.string().optional(),
  summary: z.string().optional(),
  versionNotes: z.string().optional(),
  effectiveDate: z.string(),  // Accetta anche solo date YYYY-MM-DD
  expiryDate: z.string().optional(),
  language: z.string().default('it'),
  notifyUsers: z.boolean().default(true)
});

const recordAcceptanceSchema = z.object({
  documentId: z.string(),
  versionId: z.string(),
  method: z.enum(['EXPLICIT_CLICK', 'IMPLICIT_SCROLL', 'API', 'IMPORT', 'REGISTRATION', 'LOGIN', 'PURCHASE', 'EMAIL_CONFIRMATION', 'SMS_CONFIRMATION', 'SIGNATURE']),
  source: z.string().optional(),
  metadata: z.any().optional()
});

// ============================================
// ROUTES ADMIN - GESTIONE DOCUMENTI
// ============================================

/**
 * GET /api/admin/legal-documents
 * Lista tutti i documenti legali
 */
router.get('/', 
  authenticate, 
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  auditLogger('LIST_LEGAL_DOCUMENTS'),
  async (req: any, res) => {
    try {
      const { type, isActive, includeVersions } = req.query;
      
      const where: any = {};
      if (type) where.type = type;
      if (isActive !== undefined) where.isActive = isActive === 'true';

      const documents = await prisma.legalDocument.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          },
          versions: includeVersions === 'true' ? {
            orderBy: {
              createdAt: 'desc'
            },
            select: {
              id: true,
              version: true,
              status: true,
              effectiveDate: true,
              publishedAt: true,
              language: true
            }
          } : false,
          _count: {
            select: {
              versions: true,
              acceptances: true
            }
          }
        },
        orderBy: {
          sortOrder: 'asc'
        }
      });

      return res.json(ResponseFormatter.success(
        documents,
        'Legal documents retrieved successfully'
      ));
    } catch (error) {
      logger.error('Error fetching legal documents:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to fetch legal documents',
        'FETCH_ERROR'
      ));
    }
  }
);

/**
 * GET /api/admin/legal-documents/acceptances
 * Ottieni tutte le accettazioni dei documenti legali
 */
router.get('/acceptances',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  async (req: any, res) => {
    try {
      const { includeVersions } = req.query;
      
      const acceptances = await prisma.userLegalAcceptance.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              firstName: true,
              lastName: true,
              role: true
            }
          },
          document: {
            select: {
              id: true,
              type: true,
              displayName: true,
              description: true
            }
          },
          version: includeVersions === 'true' ? {
            select: {
              id: true,
              version: true,
              title: true,
              effectiveDate: true,
              publishedAt: true
            }
          } : false
        },
        orderBy: {
          acceptedAt: 'desc'
        },
        take: 200 // Limita a 200 per performance
      });

      // Calcola statistiche
      const totalAcceptances = await prisma.userLegalAcceptance.count();
      
      const acceptancesByDocument = await prisma.userLegalAcceptance.groupBy({
        by: ['documentId'],
        _count: {
          id: true
        }
      });

      const acceptancesByVersion = await prisma.userLegalAcceptance.groupBy({
        by: ['versionId'],
        _count: {
          id: true
        }
      });

      return res.json(ResponseFormatter.success(
        {
          acceptances,
          stats: {
            total: totalAcceptances,
            byDocument: acceptancesByDocument,
            byVersion: acceptancesByVersion,
            recentCount: acceptances.length
          }
        },
        'Acceptances retrieved successfully'
      ));
    } catch (error) {
      logger.error('Error fetching acceptances:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to fetch acceptances',
        'FETCH_ERROR'
      ));
    }
  }
);

/**
 * GET /api/admin/legal-documents/analytics
 * Ottieni analytics dei documenti legali
 */
router.get('/analytics',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  async (req: any, res) => {
    try {
      // Statistiche documenti
      const totalDocuments = await prisma.legalDocument.count();
      const activeDocuments = await prisma.legalDocument.count({
        where: { isActive: true }
      });
      
      // Statistiche versioni
      const totalVersions = await prisma.legalDocumentVersion.count();
      const publishedVersions = await prisma.legalDocumentVersion.count({
        where: { status: 'PUBLISHED' }
      });
      const draftVersions = await prisma.legalDocumentVersion.count({
        where: { status: 'DRAFT' }
      });
      const approvedVersions = await prisma.legalDocumentVersion.count({
        where: { status: 'APPROVED' }
      });
      
      // Statistiche accettazioni
      const totalAcceptances = await prisma.userLegalAcceptance.count();
      const totalUsers = await prisma.user.count();
      
      // Accettazioni per documento
      const acceptancesByDocument = await prisma.userLegalAcceptance.groupBy({
        by: ['documentId'],
        _count: {
          id: true
        }
      });
      
      // Ottieni i nomi dei documenti
      const documents = await prisma.legalDocument.findMany({
        select: {
          id: true,
          displayName: true,
          type: true,
          isRequired: true
        }
      });
      
      // Mappa le accettazioni con i nomi dei documenti
      const acceptancesByDocumentWithNames = acceptancesByDocument.map(item => {
        const doc = documents.find(d => d.id === item.documentId);
        return {
          documentId: item.documentId,
          documentName: doc?.displayName || 'Unknown',
          documentType: doc?.type,
          isRequired: doc?.isRequired,
          acceptances: item._count.id
        };
      });
      
      // Accettazioni negli ultimi 30 giorni
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentAcceptances = await prisma.userLegalAcceptance.count({
        where: {
          acceptedAt: {
            gte: thirtyDaysAgo
          }
        }
      });
      
      // Utenti con documenti pendenti
      const allActiveDocuments = await prisma.legalDocument.findMany({
        where: { isActive: true },
        include: {
          versions: {
            where: {
              status: 'PUBLISHED',
              effectiveDate: { lte: new Date() }
            },
            orderBy: { publishedAt: 'desc' },
            take: 1
          }
        }
      });
      
      const documentsWithVersions = allActiveDocuments.filter(d => d.versions.length > 0);
      let usersWithPending = 0;
      
      // Calcola utenti con documenti pendenti (campione)
      const sampleUsers = await prisma.user.findMany({
        take: 100,
        where: { emailVerified: true }
      });
      
      for (const user of sampleUsers) {
        let hasPending = false;
        for (const doc of documentsWithVersions) {
          const acceptance = await prisma.userLegalAcceptance.findFirst({
            where: {
              userId: user.id,
              documentId: doc.id,
              versionId: doc.versions[0].id
            }
          });
          if (!acceptance) {
            hasPending = true;
            break;
          }
        }
        if (hasPending) usersWithPending++;
      }
      
      // Percentuale stimata
      const estimatedPendingPercentage = (usersWithPending / sampleUsers.length) * 100;
      
      return res.json(ResponseFormatter.success({
        documents: {
          total: totalDocuments,
          active: activeDocuments,
          inactive: totalDocuments - activeDocuments
        },
        versions: {
          total: totalVersions,
          published: publishedVersions,
          draft: draftVersions,
          approved: approvedVersions,
          archived: totalVersions - publishedVersions - draftVersions - approvedVersions
        },
        acceptances: {
          total: totalAcceptances,
          recent30Days: recentAcceptances,
          averagePerUser: totalUsers > 0 ? (totalAcceptances / totalUsers).toFixed(2) : 0,
          byDocument: acceptancesByDocumentWithNames
        },
        users: {
          total: totalUsers,
          estimatedWithPending: Math.round(estimatedPendingPercentage),
          sampleSize: sampleUsers.length
        },
        compliance: {
          estimatedCompliance: 100 - Math.round(estimatedPendingPercentage),
          documentsRequiringAcceptance: documentsWithVersions.length
        }
      }, 'Analytics retrieved successfully'));
      
    } catch (error) {
      logger.error('Error fetching analytics:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to fetch analytics',
        'ANALYTICS_ERROR'
      ));
    }
  }
);

/**
 * POST /api/admin/legal-documents
 * Crea un nuovo documento legale
 */
router.post('/',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  async (req: any, res, next) => {
    // Debug: log del body ricevuto
    logger.info('POST /api/admin/legal-documents - Body received:', JSON.stringify(req.body));
    
    // Validazione manuale con Zod
    try {
      const validatedData = await createDocumentSchema.parseAsync(req.body);
      req.body = validatedData;
      next();
    } catch (error: any) {
      logger.error('Validation error:', error);
      if (error.errors) {
        return res.status(400).json(ResponseFormatter.error(
          'Validation failed',
          'VALIDATION_ERROR',
          error.errors
        ));
      }
      return res.status(400).json(ResponseFormatter.error(
        'Invalid request data',
        'VALIDATION_ERROR'
      ));
    }
  },
  auditLogger('CREATE_LEGAL_DOCUMENT'),
  async (req: any, res) => {
    try {
      const document = await legalDocumentService.createDocument({
        ...req.body,
        createdBy: req.user.id
      });

      return res.status(201).json(ResponseFormatter.success(
        document,
        'Legal document created successfully'
      ));
    } catch (error: any) {
      logger.error('Error creating legal document:', error);
      
      if (error.message?.includes('already exists')) {
        return res.status(400).json(ResponseFormatter.error(
          error.message,
          'DUPLICATE_ERROR'
        ));
      }
      
      return res.status(500).json(ResponseFormatter.error(
        'Failed to create legal document',
        'CREATE_ERROR'
      ));
    }
  }
);

/**
 * PUT /api/admin/legal-documents/:id
 * Aggiorna un documento legale esistente
 */
router.put('/:id',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  validateRequest(createDocumentSchema.partial()),
  auditLogger('UPDATE_LEGAL_DOCUMENT'),
  async (req: any, res) => {
    try {
      const document = await prisma.legalDocument.update({
        where: { id: req.params.id },
        data: {
          ...req.body,
          updatedAt: new Date()
        },
        include: {
          creator: true,
          _count: {
            select: {
              versions: true,
              acceptances: true
            }
          }
        }
      });

      return res.json(ResponseFormatter.success(
        document,
        'Legal document updated successfully'
      ));
    } catch (error: any) {
      logger.error('Error updating legal document:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json(ResponseFormatter.error(
          'Document not found',
          'NOT_FOUND'
        ));
      }
      
      return res.status(500).json(ResponseFormatter.error(
        'Failed to update legal document',
        'UPDATE_ERROR'
      ));
    }
  }
);

/**
 * GET /api/admin/legal-documents/:id
 * Ottiene dettagli completi di un documento
 */
router.get('/:id',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  async (req: any, res) => {
    try {
      const document = await prisma.legalDocument.findUnique({
        where: { id: req.params.id },
        include: {
          creator: true,
          versions: {
            orderBy: {
              createdAt: 'desc'
            },
            include: {
              creator: {
                select: {
                  id: true,
                  fullName: true,
                  email: true
                }
              },
              approver: {
                select: {
                  id: true,
                  fullName: true,
                  email: true
                }
              },
              publisher: {
                select: {
                  id: true,
                  fullName: true,
                  email: true
                }
              },
              _count: {
                select: {
                  acceptances: true
                }
              }
            }
          },
          acceptances: {
            take: 10,
            orderBy: {
              acceptedAt: 'desc'
            },
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true
                }
              }
            }
          }
        }
      });

      if (!document) {
        return res.status(404).json(ResponseFormatter.error(
          'Document not found',
          'NOT_FOUND'
        ));
      }

      return res.json(ResponseFormatter.success(
        document,
        'Document retrieved successfully'
      ));
    } catch (error) {
      logger.error('Error fetching document:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to fetch document',
        'FETCH_ERROR'
      ));
    }
  }
);

// ============================================
// ROUTES ADMIN - GESTIONE VERSIONI
// ============================================

/**
 * GET /api/admin/legal-documents/:id/versions/:versionId
 * Ottiene i dettagli di una specifica versione
 */
router.get('/:id/versions/:versionId',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  async (req: any, res) => {
    try {
      const { id, versionId } = req.params;
      
      // Verifica che la versione appartenga al documento
      const version = await prisma.legalDocumentVersion.findFirst({
        where: {
          id: versionId,
          documentId: id
        },
        include: {
          document: true,
          creator: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          },
          approver: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          },
          publisher: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          },
          _count: {
            select: {
              acceptances: true
            }
          }
        }
      });

      if (!version) {
        return res.status(404).json(ResponseFormatter.error(
          'Version not found',
          'NOT_FOUND'
        ));
      }

      return res.json(ResponseFormatter.success(
        version,
        'Version retrieved successfully'
      ));
    } catch (error) {
      logger.error('Error fetching version:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to fetch version',
        'FETCH_ERROR'
      ));
    }
  }
);

/**
 * POST /api/admin/legal-documents/:id/versions
 * Crea una nuova versione di un documento
 */
router.post('/:id/versions',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  async (req: any, res, next) => {
    // Validazione manuale con Zod
    try {
      const validatedData = await createVersionSchema.parseAsync(req.body);
      req.body = validatedData;
      next();
    } catch (error: any) {
      logger.error('Validation error:', error);
      if (error.errors) {
        return res.status(400).json(ResponseFormatter.error(
          'Validation failed',
          'VALIDATION_ERROR',
          error.errors
        ));
      }
      return res.status(400).json(ResponseFormatter.error(
        'Invalid request data',
        'VALIDATION_ERROR'
      ));
    }
  },
  auditLogger('CREATE_LEGAL_VERSION'),
  async (req: any, res) => {
    try {
      const version = await legalDocumentService.createVersion(
        req.params.id,
        {
          ...req.body,
          effectiveDate: new Date(req.body.effectiveDate),
          expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined,
          createdBy: req.user.id
        }
      );

      return res.status(201).json(ResponseFormatter.success(
        version,
        'Document version created successfully'
      ));
    } catch (error: any) {
      logger.error('Error creating document version:', error);
      
      if (error.message?.includes('not found')) {
        return res.status(404).json(ResponseFormatter.error(
          error.message,
          'NOT_FOUND'
        ));
      }
      
      if (error.message?.includes('already exists')) {
        return res.status(400).json(ResponseFormatter.error(
          error.message,
          'DUPLICATE_ERROR'
        ));
      }
      
      return res.status(500).json(ResponseFormatter.error(
        'Failed to create document version',
        'CREATE_ERROR'
      ));
    }
  }
);

/**
 * PUT /api/admin/legal-documents/:id/versions/:versionId
 * Aggiorna il contenuto di una versione esistente (solo DRAFT)
 */
router.put('/:id/versions/:versionId',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  async (req: any, res) => {
    try {
      const { content, contentPlain } = req.body;
      
      // Verifica che la versione esista e sia in DRAFT
      const existingVersion = await prisma.legalDocumentVersion.findFirst({
        where: {
          id: req.params.versionId,
          documentId: req.params.id,
          status: 'DRAFT'
        }
      });

      if (!existingVersion) {
        return res.status(404).json(ResponseFormatter.error(
          'Version not found or not editable',
          'NOT_FOUND'
        ));
      }

      // Aggiorna la versione
      const updatedVersion = await prisma.legalDocumentVersion.update({
        where: { id: req.params.versionId },
        data: {
          content,
          contentPlain: contentPlain || content.replace(/<[^>]*>/g, ''),
          updatedAt: new Date()
        },
        include: {
          document: true
        }
      });

      return res.json(ResponseFormatter.success(
        updatedVersion,
        'Version updated successfully'
      ));
    } catch (error: any) {
      logger.error('Error updating version:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to update version',
        'UPDATE_ERROR'
      ));
    }
  }
);

/**
 * PUT /api/admin/legal-documents/versions/:versionId/approve
 * Approva una versione
 */
router.put('/versions/:versionId/approve',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  auditLogger('APPROVE_LEGAL_VERSION'),
  async (req: any, res) => {
    try {
      const version = await prisma.legalDocumentVersion.update({
        where: { id: req.params.versionId },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: req.user.id
        },
        include: {
          document: true,
          approver: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        }
      });

      return res.json(ResponseFormatter.success(
        version,
        'Version approved successfully'
      ));
    } catch (error) {
      logger.error('Error approving version:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to approve version',
        'UPDATE_ERROR'
      ));
    }
  }
);

/**
 * PUT /api/admin/legal-documents/versions/:versionId/reject
 * Rifiuta/Archivia una versione
 */
router.put('/versions/:versionId/reject',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  auditLogger('REJECT_LEGAL_VERSION'),
  async (req: any, res) => {
    try {
      const version = await prisma.legalDocumentVersion.update({
        where: { id: req.params.versionId },
        data: {
          status: 'ARCHIVED',
          archivedAt: new Date(),
          archivedBy: req.user.id
        },
        include: {
          document: true
        }
      });

      return res.json(ResponseFormatter.success(
        version,
        'Version archived successfully'
      ));
    } catch (error) {
      logger.error('Error archiving version:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to archive version',
        'UPDATE_ERROR'
      ));
    }
  }
);

/**
 * PUT /api/admin/legal-documents/versions/:versionId/unpublish
 * Revoca la pubblicazione di una versione
 */
router.put('/versions/:versionId/unpublish',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  auditLogger('UNPUBLISH_LEGAL_VERSION'),
  async (req: any, res) => {
    try {
      // Prima verifica che la versione esista
      const existingVersion = await prisma.legalDocumentVersion.findUnique({
        where: { id: req.params.versionId }
      });

      if (!existingVersion) {
        return res.status(404).json(ResponseFormatter.error(
          'Version not found',
          'NOT_FOUND'
        ));
      }

      // Aggiorna lo stato della versione a DRAFT (non pubblicata)
      const version = await prisma.legalDocumentVersion.update({
        where: { id: req.params.versionId },
        data: {
          status: 'DRAFT',
          // Rimuovi publishedAt se esiste nel tuo schema
          // publishedAt: null,
          // publishedBy: null,
          updatedAt: new Date()
        },
        include: {
          document: true
        }
      });

      // Verifica se ci sono altre versioni pubblicate per questo documento
      const otherPublishedVersions = await prisma.legalDocumentVersion.count({
        where: {
          documentId: version.documentId,
          status: 'PUBLISHED',
          id: { not: req.params.versionId }
        }
      });

      // Se non ci sono altre versioni pubblicate, disattiva il documento
      if (otherPublishedVersions === 0) {
        await prisma.legalDocument.update({
          where: { id: version.documentId },
          data: { isActive: false }
        });
      }

      // Crea un log di audit per tracciare l'operazione
      await prisma.auditLog.create({
        data: {
          id: `audit-${Date.now()}-${Math.random()}`,
          userId: req.user.id,
          userEmail: req.user.email,
          userRole: req.user.role,
          ipAddress: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
          action: 'UPDATE',
          entityType: 'LegalDocumentVersion',
          entityId: req.params.versionId,
          oldValues: { status: existingVersion.status },
          newValues: { status: 'DRAFT' },
          success: true,
          severity: 'INFO',
          category: 'BUSINESS',
          metadata: {
            operation: 'unpublish',
            documentId: version.documentId
          }
        }
      });

      return res.json(ResponseFormatter.success(
        version,
        'Version unpublished successfully'
      ));
    } catch (error: any) {
      logger.error('Error unpublishing version:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json(ResponseFormatter.error(
          'Version not found',
          'NOT_FOUND'
        ));
      }
      
      return res.status(500).json(ResponseFormatter.error(
        'Failed to unpublish version',
        'UPDATE_ERROR'
      ));
    }
  }
);

/**
 * POST /api/admin/legal-documents/versions/:versionId/publish
 * Pubblica una versione approvata
 */
router.post('/versions/:versionId/publish',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  auditLogger('PUBLISH_LEGAL_VERSION'),
  async (req: any, res) => {
    try {
      const { notifyUsers = true, publishDate } = req.body;
      
      const version = await legalDocumentService.publishVersion(
        req.params.versionId,
        req.user.id,
        { notifyUsers, publishDate }
      );

      return res.json(ResponseFormatter.success(
        version,
        'Version published successfully'
      ));
    } catch (error: any) {
      logger.error('Error publishing version:', error);
      
      if (error.message?.includes('not found')) {
        return res.status(404).json(ResponseFormatter.error(
          error.message,
          'NOT_FOUND'
        ));
      }
      
      if (error.message?.includes('must be approved')) {
        return res.status(400).json(ResponseFormatter.error(
          error.message,
          'INVALID_STATUS'
        ));
      }
      
      return res.status(500).json(ResponseFormatter.error(
        'Failed to publish version',
        'PUBLISH_ERROR'
      ));
    }
  }
);

// ============================================
// ROUTES ADMIN - REPORT E ANALYTICS
// ============================================

/**
 * GET /api/admin/legal-documents/acceptances
 * Report delle accettazioni
 */
router.get('/acceptances/report',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  async (req: any, res) => {
    try {
      const { startDate, endDate, documentId, userId } = req.query;
      
      const where: any = {};
      if (documentId) where.documentId = documentId;
      if (userId) where.userId = userId;
      if (startDate || endDate) {
        where.acceptedAt = {};
        if (startDate) where.acceptedAt.gte = new Date(startDate);
        if (endDate) where.acceptedAt.lte = new Date(endDate);
      }

      const acceptances = await prisma.userLegalAcceptance.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true
            }
          },
          document: {
            select: {
              id: true,
              type: true,
              displayName: true
            }
          },
          version: {
            select: {
              id: true,
              version: true,
              title: true
            }
          }
        },
        orderBy: {
          acceptedAt: 'desc'
        },
        take: 100
      });

      // Statistiche aggregate
      const stats = await prisma.userLegalAcceptance.groupBy({
        by: ['documentId', 'versionId'],
        _count: {
          id: true
        },
        where
      });

      return res.json(ResponseFormatter.success(
        {
          acceptances,
          stats,
          total: acceptances.length
        },
        'Acceptance report generated successfully'
      ));
    } catch (error) {
      logger.error('Error generating acceptance report:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to generate report',
        'REPORT_ERROR'
      ));
    }
  }
);

/**
 * GET /api/admin/legal-documents/pending-users
 * Utenti con documenti da accettare
 */
router.get('/pending-users',
  authenticate,
  requireRole([Role.ADMIN, Role.SUPER_ADMIN]),
  async (req: any, res) => {
    try {
      // Ottieni tutti gli utenti
      const users = await prisma.user.findMany({
        where: {
          emailVerified: true
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true
        }
      });

      const pendingUsers = [];

      for (const user of users) {
        const pendingDocs = await legalDocumentService.getPendingDocumentsForUser(user.id);
        
        if (pendingDocs.length > 0) {
          pendingUsers.push({
            user,
            pendingDocuments: pendingDocs
          });
        }
      }

      return res.json(ResponseFormatter.success(
        {
          users: pendingUsers,
          totalUsers: pendingUsers.length,
          totalPendingDocuments: pendingUsers.reduce((acc, u) => acc + u.pendingDocuments.length, 0)
        },
        'Pending users report generated successfully'
      ));
    } catch (error) {
      logger.error('Error generating pending users report:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to generate report',
        'REPORT_ERROR'
      ));
    }
  }
);

export default router;
