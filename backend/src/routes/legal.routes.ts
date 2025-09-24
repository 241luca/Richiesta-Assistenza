import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateRequest, validateBody } from '../middleware/validation';
import { legalDocumentService } from '../services/legal-document.service';
import { ResponseFormatter } from '../utils/responseFormatter';
import logger from '../utils/logger';
import { z } from 'zod';
import { PrismaClient, AcceptanceMethod } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// ============================================
// SCHEMA DI VALIDAZIONE
// ============================================

const acceptDocumentSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),
  versionId: z.string().min(1, 'Version ID is required'),
  method: z.enum(['EXPLICIT_CLICK', 'IMPLICIT_SCROLL', 'API', 'IMPORT', 'REGISTRATION', 'LOGIN', 'PURCHASE', 'EMAIL_CONFIRMATION', 'SMS_CONFIRMATION', 'SIGNATURE']).default('EXPLICIT_CLICK')
});

// ============================================
// ROUTES PUBBLICHE - VISUALIZZAZIONE DOCUMENTI
// ============================================

/**
 * GET /api/legal/documents/:type
 * Ottiene un documento legale pubblico per tipo con eventuale stato accettazione
 */
router.get('/documents/:type', async (req: any, res) => {
  try {
    const { type } = req.params;
    const userId = req.user?.id; // Potrebbe essere null se non autenticato

    // Trova il documento attivo del tipo richiesto
    const document = await prisma.legalDocument.findFirst({
      where: {
        type: type,
        isActive: true
      },
      include: {
        // Include solo la versione pubblicata più recente
        versions: {
          where: {
            status: 'PUBLISHED',
            effectiveDate: {
              lte: new Date()
            },
            OR: [
              { expiryDate: null },
              { expiryDate: { gte: new Date() } }
            ]
          },
          orderBy: {
            publishedAt: 'desc'
          },
          take: 1,
          select: {
            id: true,
            version: true,
            title: true,
            content: true,
            contentPlain: true,
            summary: true,
            effectiveDate: true,
            expiryDate: true,
            language: true
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

    // Formatta il documento con la versione corrente
    const currentVersion = document.versions[0] || null;
    
    // Se l'utente è autenticato, verifica se ha accettato il documento
    let userAcceptance = null;
    if (userId && currentVersion) {
      userAcceptance = await prisma.userLegalAcceptance.findFirst({
        where: {
          userId: userId,
          documentId: document.id
        },
        orderBy: {
          acceptedAt: 'desc'
        },
        include: {
          version: {
            select: {
              id: true,
              version: true
            }
          }
        }
      });
    }

    const response = {
      id: document.id,
      type: document.type,
      displayName: document.displayName,
      description: document.description,
      icon: document.icon,
      isRequired: document.isRequired,
      currentVersion: currentVersion,
      userAcceptance: userAcceptance
    };

    return res.json(ResponseFormatter.success(
      response,
      'Document retrieved successfully'
    ));
  } catch (error) {
    logger.error('Error fetching public legal document:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Failed to fetch document',
      'FETCH_ERROR'
    ));
  }
});

/**
 * GET /api/legal/documents
 * Ottiene tutti i documenti legali pubblici attivi
 */
router.get('/documents', async (req: any, res) => {
  try {
    const userId = req.user?.id;

    const documents = await prisma.legalDocument.findMany({
      where: {
        isActive: true
      },
      include: {
        versions: {
          where: {
            status: 'PUBLISHED',
            effectiveDate: {
              lte: new Date()
            },
            OR: [
              { expiryDate: null },
              { expiryDate: { gte: new Date() } }
            ]
          },
          orderBy: {
            publishedAt: 'desc'
          },
          take: 1,
          select: {
            id: true,
            version: true,
            title: true,
            effectiveDate: true,
            language: true,
            summary: true
          }
        }
      },
      orderBy: {
        sortOrder: 'asc'
      }
    });

    // Se l'utente è autenticato, aggiungi info accettazione
    const documentsWithAcceptance = await Promise.all(
      documents.map(async (doc) => {
        let userAcceptance = null;
        
        if (userId && doc.versions.length > 0) {
          userAcceptance = await prisma.userLegalAcceptance.findFirst({
            where: {
              userId: userId,
              documentId: doc.id
            },
            orderBy: {
              acceptedAt: 'desc'
            },
            select: {
              id: true,
              acceptedAt: true,
              versionId: true,
              version: {
                select: {
                  version: true
                }
              }
            }
          });
        }

        return {
          id: doc.id,
          type: doc.type,
          displayName: doc.displayName,
          description: doc.description,
          icon: doc.icon,
          isRequired: doc.isRequired,
          currentVersion: doc.versions[0] || null,
          hasAccepted: !!userAcceptance,
          needsNewAcceptance: userAcceptance && 
            doc.versions[0] && 
            userAcceptance.versionId !== doc.versions[0].id,
          userAcceptance
        };
      })
    );

    return res.json(ResponseFormatter.success(
      documentsWithAcceptance,
      'Documents retrieved successfully'
    ));
  } catch (error) {
    logger.error('Error fetching public legal documents:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Failed to fetch documents',
      'FETCH_ERROR'
    ));
  }
});

// ============================================
// ROUTES AUTENTICATE - ACCETTAZIONE DOCUMENTI
// ============================================

/**
 * POST /api/legal/accept
 * Accetta un documento legale
 */
router.post('/accept',
  authenticate,
  validateBody(acceptDocumentSchema),  // Cambiato da validateRequest a validateBody
  async (req: any, res) => {
    try {
      logger.info('Accept request received:', {
        body: req.body,
        userId: req.user?.id,
        headers: req.headers
      });
      
      const { documentId, versionId, method } = req.body;
      const userId = req.user.id;
      
      logger.info('Parsed data:', { documentId, versionId, method, userId });

      // Verifica che la versione esista e sia pubblicata
      const version = await prisma.legalDocumentVersion.findFirst({
        where: {
          id: versionId,
          documentId: documentId,
          status: 'PUBLISHED'
        },
        include: {
          document: true
        }
      });

      if (!version) {
        return res.status(404).json(ResponseFormatter.error(
          'Version not found or not published',
          'VERSION_NOT_FOUND'
        ));
      }

      // Verifica se l'utente ha già accettato questa versione
      const existingAcceptance = await prisma.userLegalAcceptance.findFirst({
        where: {
          userId: userId,
          documentId: documentId,
          versionId: versionId
        }
      });

      if (existingAcceptance) {
        return res.status(400).json(ResponseFormatter.error(
          'Document version already accepted',
          'ALREADY_ACCEPTED'
        ));
      }

      // Crea il record di accettazione
      const acceptance = await prisma.userLegalAcceptance.create({
        data: {
          userId: userId,
          documentId: documentId,
          versionId: versionId,
          acceptedAt: new Date(),
          method: method as AcceptanceMethod,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          source: 'WEB_APP',
          metadata: {
            timestamp: new Date().toISOString(),
            platform: 'web',
            documentTitle: version.document.displayName,
            documentVersion: version.version
          }
        }
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          id: require('crypto').randomUUID(),  // Aggiungi ID univoco
          action: 'UPDATE',  // Usa un'azione generica supportata
          entityType: 'UserLegalAcceptance',
          entityId: acceptance.id,
          userId: userId,
          ipAddress: req.ip || '',
          userAgent: req.headers['user-agent'] || '',
          newValues: acceptance,
          success: true,
          severity: 'INFO',
          category: 'COMPLIANCE'
        }
      });

      logger.info(`User ${userId} accepted document ${documentId} version ${versionId}`);

      return res.json(ResponseFormatter.success(
        acceptance,
        'Document accepted successfully'
      ));
    } catch (error) {
      logger.error('Error accepting document:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to accept document',
        'ACCEPT_ERROR'
      ));
    }
  }
);

/**
 * GET /api/legal/acceptances
 * Ottiene tutte le accettazioni dell'utente corrente
 */
router.get('/acceptances',
  authenticate,
  async (req: any, res) => {
    try {
      const userId = req.user.id;

      const acceptances = await prisma.userLegalAcceptance.findMany({
        where: {
          userId: userId
        },
        include: {
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
              title: true,
              effectiveDate: true
            }
          }
        },
        orderBy: {
          acceptedAt: 'desc'
        }
      });

      return res.json(ResponseFormatter.success(
        acceptances,
        'Acceptances retrieved successfully'
      ));
    } catch (error) {
      logger.error('Error fetching user acceptances:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to fetch acceptances',
        'FETCH_ERROR'
      ));
    }
  }
);

/**
 * GET /api/legal/pending
 * Ottiene i documenti che l'utente deve ancora accettare
 */
router.get('/pending',
  authenticate,
  async (req: any, res) => {
    try {
      const userId = req.user.id;

      const pendingDocuments = await legalDocumentService.getPendingDocumentsForUser(userId);

      return res.json(ResponseFormatter.success(
        pendingDocuments,
        'Pending documents retrieved successfully'
      ));
    } catch (error) {
      logger.error('Error fetching pending documents:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to fetch pending documents',
        'FETCH_ERROR'
      ));
    }
  }
);

export default router;
