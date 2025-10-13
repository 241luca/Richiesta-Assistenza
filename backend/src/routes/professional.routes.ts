import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient, AuditAction, LogCategory, LogSeverity } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { checkRole } from '../middleware/checkRole';
import { ResponseFormatter } from '../utils/responseFormatter';
import { formatAssistanceRequestList } from '../utils/responseFormatter';
import { logger } from '../utils/logger';
import GoogleMapsService from '../services/googleMaps.service';
import { notificationService } from '../services/notification.service';
import { emailService } from '../services/email.service';
import { auditLogService } from '../services/auditLog.service';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/professionals/available-requests
 * Ottiene le richieste disponibili per auto-assegnazione
 */
router.get(
  '/available-requests',
  authenticate,
  requireRole(['PROFESSIONAL']),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      
      // Verifica se il professionista può auto-assegnarsi
      const professional = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true,
          canSelfAssign: true,
          address: true,
          city: true,
          province: true,
          postalCode: true,
          workAddress: true,
          workCity: true,
          workProvince: true,
          workPostalCode: true,
          useResidenceAsWorkAddress: true
        }
      });

      if (!professional?.canSelfAssign) {
        return res.status(403).json(
          ResponseFormatter.error(
            'Non sei autorizzato ad auto-assegnarti richieste',
            'SELF_ASSIGN_DISABLED'
          )
        );
      }

      // Ottieni le sottocategorie del professionista
      const professionalSubcategories = await prisma.professionalUserSubcategory.findMany({
        where: {
          userId,
          isActive: true
        },
        select: {
          subcategoryId: true
        }
      });

      const subcategoryIds = professionalSubcategories.map(ps => ps.subcategoryId);

      if (subcategoryIds.length === 0) {
        return res.json(
          ResponseFormatter.success(
            { requests: [], total: 0 },
            'Nessuna sottocategoria abilitata'
          )
        );
      }

      // Trova richieste disponibili
      const availableRequests = await prisma.assistanceRequest.findMany({
        where: {
          status: 'PENDING',
          professionalId: null,
          subcategoryId: {
            in: subcategoryIds
          }
        },
        include: {
          client: {
            select: {
              id: true,
              fullName: true,
              city: true,
              province: true
            }
          },
          category: true,
          subcategory: true
        },
        orderBy: [
          { priority: 'desc' }, // Prima le urgenti
          { createdAt: 'asc' }  // Poi le più vecchie
        ]
      });

      // Calcola distanze se richiesto
      let requestsWithDistance: any[] = availableRequests as any[];
      if (req.query.calculateDistance?.toString() === 'true') {
        // Determina l'indirizzo del professionista
        let professionalAddress = '';
        if (professional?.useResidenceAsWorkAddress) {
          professionalAddress = `${professional.address}, ${professional.city} ${professional.province} ${professional.postalCode}`;
        } else if (professional?.workAddress) {
          professionalAddress = `${professional.workAddress}, ${professional.workCity} ${professional.workProvince} ${professional.workPostalCode}`;
        }

        if (professionalAddress) {
          requestsWithDistance = await Promise.all(
            availableRequests.map(async (request) => {
              try {
                const requestAddress = `${request.address}, ${request.city} ${request.province} ${request.postalCode}`;
                const distance = await GoogleMapsService.calculateDistance(
                  professionalAddress,
                  requestAddress
                );
                
                return {
                  ...request,
                  distance: distance || null
                };
              } catch (error) {
                logger.warn(`Errore calcolo distanza per richiesta ${request.id}:`, error);
                return {
                  ...request,
                  distance: null
                };
              }
            })
          );
          
          // Ordina per distanza se calcolata
          requestsWithDistance.sort((a, b) => {
            if (!a.distance || !b.distance) return 0;
            return a.distance.distanceValue - b.distance.distanceValue;
          });
        }
      }

      const formatted = formatAssistanceRequestList(requestsWithDistance);

      return res.json(
        ResponseFormatter.success(
          {
            requests: formatted,
            total: formatted.length
          },
          'Richieste disponibili recuperate con successo'
        )
      );

    } catch (error) {
      logger.error('Errore nel recupero delle richieste disponibili:', error);
      next(error);
    }
  }
);

/**
 * GET /api/professionals/my-requests
 * Ottiene le richieste assegnate al professionista corrente
 */
router.get(
  '/my-requests',
  authenticate,
  requireRole(['PROFESSIONAL']),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { withoutReport, status, priority } = req.query;
      
      // Build where clause
      let whereClause: any = {
        professionalId: userId
      };
      
      // Filtra per stato se richiesto
      if (status) {
        whereClause.status = status;
      }
      
      // Filtra per priorità se richiesto  
      if (priority) {
        whereClause.priority = priority;
      }
      
      // Trova richieste assegnate al professionista
      const myRequests = await prisma.assistanceRequest.findMany({
        where: whereClause,
        include: {
          client: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              email: true,
              city: true,
              province: true
            }
          },
          category: true,
          subcategory: true,
          quotes: {
            select: {
              id: true,
              status: true
            }
          }
        },
        orderBy: [
          { status: 'asc' },
          { priority: 'desc' },
          { createdAt: 'desc' }
        ]
      });
      
      let filteredRequests = myRequests;
      
      // Se richiesto, filtra solo le richieste senza rapporto
      if (withoutReport?.toString() === 'true') {
        // TODO: quando avremo la tabella dei rapporti, filtreremo qui
        // Per ora simuliamo che le richieste completate abbiano un rapporto
        filteredRequests = myRequests.filter(r => 
          r.status === 'IN_PROGRESS' || r.status === 'ASSIGNED'
        );
      }

      const formatted = formatAssistanceRequestList(filteredRequests);

      return res.json(
        ResponseFormatter.success(
          formatted,
          withoutReport?.toString() === 'true' 
            ? 'Richieste senza rapporto recuperate con successo'
            : 'Le tue richieste recuperate con successo'
        )
      );

    } catch (error) {
      logger.error('Errore nel recupero delle richieste del professionista:', error);
      next(error);
    }
  }
);

/**
 * POST /api/professionals/self-assign/:requestId
 * Auto-assegna una richiesta al professionista
 */
router.post(
  '/self-assign/:requestId',
  authenticate,
  requireRole(['PROFESSIONAL']),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { requestId } = req.params;

      // Verifica se il professionista può auto-assegnarsi
      const professional = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true,
          canSelfAssign: true,
          fullName: true
        }
      });

      if (!professional?.canSelfAssign) {
        return res.status(403).json(
          ResponseFormatter.error(
            'Non sei autorizzato ad auto-assegnarti richieste',
            'SELF_ASSIGN_DISABLED'
          )
        );
      }

      // Verifica se la richiesta esiste ed è disponibile
      const request = await prisma.assistanceRequest.findUnique({
        where: { id: requestId },
        include: {
          category: true,
          subcategory: true
        }
      });

      if (!request) {
        return res.status(404).json(
          ResponseFormatter.error(
            'Richiesta non trovata',
            'REQUEST_NOT_FOUND'
          )
        );
      }

      if (request.professionalId) {
        return res.status(400).json(
          ResponseFormatter.error(
            'La richiesta è già assegnata',
            'REQUEST_ALREADY_ASSIGNED'
          )
        );
      }

      if (request.status !== 'PENDING') {
        return res.status(400).json(
          ResponseFormatter.error(
            'La richiesta non è disponibile per l\'assegnazione',
            'REQUEST_NOT_AVAILABLE'
          )
        );
      }

      // Verifica che il professionista abbia la sottocategoria abilitata
      const hasSubcategory = await prisma.professionalUserSubcategory.findFirst({
        where: {
          userId,
          subcategoryId: request.subcategoryId!,
          isActive: true
        }
      });

      if (!hasSubcategory) {
        return res.status(403).json(
          ResponseFormatter.error(
            'Non sei abilitato per questa sottocategoria',
            'SUBCATEGORY_NOT_ENABLED'
          )
        );
      }

      // Assegna la richiesta
      const updatedRequest = await prisma.assistanceRequest.update({
        where: { id: requestId },
        data: {
          professionalId: userId,
          status: 'ASSIGNED',
          assignedAt: new Date()
        },
        include: {
          client: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true
            }
          },
          category: true,
          subcategory: true
        }
      });

      // Crea una notifica per il cliente
      await prisma.notification.create({
        data: {
          recipientId: request.clientId!,
          title: 'Richiesta assegnata',
          message: `La tua richiesta "${request.title}" è stata presa in carico da ${professional.fullName}`,
          type: 'REQUEST_ASSIGNED',
          relatedId: requestId,
          isRead: false
        }
      });

      // Log dell'attività
      logger.info(`Professionista ${userId} si è auto-assegnato la richiesta ${requestId}`);

      return res.json(
        ResponseFormatter.success(
          updatedRequest,
          'Richiesta assegnata con successo'
        )
      );

    } catch (error) {
      logger.error('Errore nell\'auto-assegnazione della richiesta:', error);
      next(error);
    }
  }
);

/**
 * PUT /api/professionals/:id/approve
 * Approva un professionista (solo admin)
 */
router.put('/:id/approve', authenticate, checkRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        approvalStatus: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: req.user.id
      }
    });

    // Invia notifica al professionista
    await notificationService.sendToUser({
      userId: id,
      title: 'Account Approvato',
      message: 'Il tuo account professionista è stato approvato! Ora puoi iniziare a ricevere richieste.',
      type: 'APPROVAL',
      priority: 'high'
    });

    return res.json(ResponseFormatter.success(user, 'Professionista approvato'));
  } catch (error) {
    logger.error('Errore approvazione:', error);
    return res.status(500).json(ResponseFormatter.error('Errore approvazione', 'APPROVAL_ERROR'));
  }
});

/**
 * PUT /api/professionals/:id/reject
 * Rifiuta un professionista (solo admin)
 */
router.put('/:id/reject', authenticate, checkRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        approvalStatus: 'REJECTED',
        rejectionReason: reason
      }
    });

    // Invia notifica al professionista
    await notificationService.sendToUser({
      userId: id,
      title: 'Registrazione Non Approvata',
      message: `La tua registrazione come professionista non è stata approvata. Motivo: ${reason}`,
      type: 'REJECTION',
      priority: 'high'
    });

    return res.json(ResponseFormatter.success(user, 'Professionista rifiutato'));
  } catch (error) {
    logger.error('Errore rifiuto:', error);
    return res.status(500).json(ResponseFormatter.error('Errore rifiuto', 'REJECTION_ERROR'));
  }
});

/**
 * POST /api/professionals/:id/request-documents
 * Richiedi documenti mancanti (solo admin)
 */
router.post('/:id/request-documents', authenticate, checkRole(['ADMIN', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const { id } = req.params;
    const { missingDocuments, customMessage } = req.body;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        email: true,
        firstName: true,
        lastName: true
      }
    });

    if (!user) {
      return res.status(404).json(ResponseFormatter.error('Utente non trovato', 'USER_NOT_FOUND'));
    }

    // Prepara l'email
    const documentList = missingDocuments.map((doc: any) => `- ${doc.label}`).join('\n');
    
    const emailBody = `
      Gentile ${user.firstName} ${user.lastName},
      
      Per completare la sua registrazione come professionista sulla piattaforma Richiesta Assistenza,
      la preghiamo di fornire i seguenti documenti:
      
      ${documentList}
      
      ${customMessage ? `\n${customMessage}\n` : ''}
      
      Può caricare i documenti accedendo al suo profilo o inviandoli in risposta a questa email.
      
      Cordiali saluti,
      Il Team di Richiesta Assistenza
    `;

    // Invia email
    await emailService.sendEmail({
      to: user.email,
      subject: 'Richiesta Documenti - Completamento Registrazione',
      text: emailBody,
      html: emailBody.replace(/\n/g, '<br>')
    });

    // Registra l'azione (Audit)
    await auditLogService.log({
      action: AuditAction.UPDATE,
      entityType: 'User',
      entityId: id,
      userId: req.user.id,
      success: true,
      severity: LogSeverity.INFO,
      category: LogCategory.BUSINESS,
      ipAddress: (req as Request).ip || 'unknown',
      userAgent: (req as Request).get('user-agent') || 'unknown',
      metadata: {
        missingDocuments,
        customMessage
      }
    });

    // Invia notifica in-app
    await notificationService.sendToUser({
      userId: id,
      title: 'Documenti Richiesti',
      message: 'Ti abbiamo inviato un\'email con la lista dei documenti necessari per completare la registrazione.',
      type: 'DOCUMENT_REQUEST',
      priority: 'high'
    });

    return res.json(ResponseFormatter.success(null, 'Email inviata con successo'));
  } catch (error) {
    logger.error('Errore invio richiesta documenti:', error);
    return res.status(500).json(ResponseFormatter.error('Errore invio email', 'EMAIL_ERROR'));
  }
});

export default router;
