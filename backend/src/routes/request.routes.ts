import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { param, body } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { validateRequest } from '../middleware/validation';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { 
  formatAssistanceRequest, 
  formatAssistanceRequestList,
  formatQuoteList,
  ResponseFormatter 
} from '../utils/responseFormatter';
import GoogleMapsService from '../services/googleMaps.service';
import travelCalculationService from '../services/travelCalculation.service';
import bcrypt from 'bcryptjs';
import { auditLogService } from '../services/auditLog.service';
import { notificationService } from '../services/notification.service';
import { AuditAction, LogSeverity, LogCategory } from '@prisma/client';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// GET /api/requests - Get all requests (with filters and distances for professionals)
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { status, priority, category, clientId, professionalId } = req.query;
    const user = req.user!;
    
    // Build filter based on user role and query parameters
    let whereClause: any = {};
    
    // Role-based filtering
    if (user.role === 'CLIENT') {
      whereClause.clientId = user.id;
    } else if (user.role === 'PROFESSIONAL') {
      // Se viene passato un professionalId specifico, usalo (per admin)
      // Altrimenti il professionista vede solo le sue richieste
      if (!professionalId) {
        whereClause.professionalId = user.id;
      }
    }
    // ADMIN and SUPER_ADMIN can see all requests (no filter)
    
    // Apply additional filters from query params
    if (status) {
      const statusArray = status.toString().split(',').map(s => s.trim().toUpperCase());
      if (statusArray.length === 1) {
        whereClause.status = statusArray[0];
      } else {
        whereClause.status = { in: statusArray };
      }
    }
    if (priority) {
      whereClause.priority = priority.toString().toUpperCase();
    }
    if (category) {
      whereClause.categoryId = category.toString();
    }
    if (clientId && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
      whereClause.clientId = clientId.toString();
    }
    if (professionalId && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
      whereClause.professionalId = professionalId.toString();
    }
    
    // Fetch requests from database
    const requests = await prisma.assistanceRequest.findMany({
      where: whereClause,
      include: {
        client: true,
        professional: {
          include: {
            Profession: true
          }
        },
        category: true,
        subcategory: true,
        quotes: {
          include: {
            professional: true
          }
        },
        RequestAttachment: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Use response formatter
    let formattedRequests = formatAssistanceRequestList(requests);
    
    // CALCOLA DISTANZE per i professionisti (solo per le loro richieste)
    if (user.role === 'PROFESSIONAL') {
      try {
        // Ottieni l'indirizzo del professionista
        const professional = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            workAddress: true,
            workCity: true,
            workProvince: true,
            workPostalCode: true,
            useResidenceAsWorkAddress: true,
            address: true,
            city: true,
            province: true,
            postalCode: true
          }
        });
        
        if (professional) {
          // Determina l'indirizzo da usare
          let professionalAddress = '';
          
          // Prima prova con work address se esiste e non usa residenza come work
          if (!professional.useResidenceAsWorkAddress && professional.workAddress) {
            // Se workAddress è già un indirizzo formattato completo (contiene virgole),
            // usalo direttamente senza concatenare città/provincia
            const isFullyFormatted = professional.workAddress.includes(',');
            
            if (isFullyFormatted) {
              professionalAddress = professional.workAddress;
              logger.info(`Using fully formatted work address for professional ${user.id}: ${professionalAddress}`);
            } else if (professional.workCity) {
              // Indirizzo parziale - concatena con città e provincia
              professionalAddress = `${professional.workAddress}, ${professional.workCity} ${professional.workProvince}`;
              logger.info(`Using work address components for professional ${user.id}: ${professionalAddress}`);
            }
          } 
          // Altrimenti usa residenza
          else if (professional.address && professional.city) {
            professionalAddress = `${professional.address}, ${professional.city} ${professional.province}`;
            logger.info(`Using residence address for professional ${user.id}: ${professionalAddress}`);
          }
          
          // Se c'è un indirizzo valido, calcola le distanze
          if (professionalAddress) {
            logger.info(`Calculating distances for ${formattedRequests.length} requests from: ${professionalAddress}`);
            
            // Calcola le distanze per TUTTE le richieste del professionista (con limite per performance)
            const maxRequestsToCalculate = 20;
            const requestsToCalculate = formattedRequests.slice(0, maxRequestsToCalculate);
            
            const requestsWithDistance = await Promise.all(
              requestsToCalculate.map(async (request: any) => {
                try {
                  // Costruisci indirizzo completo della richiesta
                  const requestAddress = `${request.address}, ${request.city} ${request.province}`;
                  
                  logger.debug(`Calculating distance from "${professionalAddress}" to "${requestAddress}"`);
                  
                  // Usa il servizio Google Maps
                  const distanceData = await GoogleMapsService.calculateDistance(
                    professionalAddress,
                    requestAddress
                  );
                  
                  if (distanceData) {
                    // Il servizio ritorna già i campi corretti: distance, duration, distanceText, durationText
                    logger.info(`Distance calculated for request ${request.id}: ${distanceData.distanceText} (${distanceData.distance}km)`);
                    
                    return {
                      ...request,
                      distance: distanceData.distance, // già in km
                      distanceText: distanceData.distanceText, // es: "12.5 km"
                      duration: distanceData.duration, // già in minuti
                      durationText: distanceData.durationText // es: "15 min"
                    };
                  } else {
                    logger.warn(`No distance data returned for request ${request.id}`);
                  }
                } catch (error) {
                  logger.error(`Error calculating distance for request ${request.id}:`, error);
                }
                return request;
              })
            );
            
            // Unisci le richieste con distanza calcolata e quelle senza
            const remainingRequests = formattedRequests.slice(maxRequestsToCalculate);
            
            // Ordina per distanza (più vicine prima), mettendo quelle senza distanza alla fine
            const sortedRequests = [...requestsWithDistance].sort((a, b) => {
              if (a.distance === null || a.distance === undefined) return 1;
              if (b.distance === null || b.distance === undefined) return -1;
              return a.distance - b.distance;
            });
            
            formattedRequests = [...sortedRequests, ...remainingRequests];
            
            const calculatedCount = requestsWithDistance.filter(r => r.distance !== null && r.distance !== undefined).length;
            logger.info(`Distances calculated successfully for ${calculatedCount}/${requestsToCalculate.length} requests`);
          } else {
            logger.warn('Professional has no address configured (neither work nor residence)');
          }
        } else {
          logger.error(`Professional with id ${user.id} not found`);
        }
      } catch (error) {
        logger.error('Error calculating distances:', error);
        // Continue without distances if there's an error
      }
    }
    
    res.json(ResponseFormatter.success({
      requests: formattedRequests,
      total: formattedRequests.length
    }));
    
  } catch (error) {
    logger.error('Error fetching requests:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero delle richieste',
      'FETCH_ERROR'
    ));
  }
});

// POST /api/requests - Create new request
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const user = req.user!;
    
    // Solo i clienti possono creare richieste
    if (user.role !== 'CLIENT') {
      return res.status(403).json(ResponseFormatter.error('Solo i clienti possono creare richieste', 'FORBIDDEN'));
    }
    
    const {
      title,
      description,
      categoryId,
      subcategoryId,
      priority = 'MEDIUM',
      address,
      city,
      province,
      postalCode,
      requestedDate,
      notes,
      latitude,
      longitude
    } = req.body;
    
    // Validazione dei campi obbligatori
    if (!title || !description || !categoryId || !address || !city || !province || !postalCode) {
      return res.status(400).json(ResponseFormatter.error('Campi obbligatori mancanti', 'VALIDATION_ERROR'));
    }
    
    // Verifica che la categoria esista
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });
    
    if (!category) {
      return res.status(400).json(ResponseFormatter.error('Categoria non valida', 'INVALID_CATEGORY'));
    }
    
    // Verifica che la sottocategoria esista se fornita
    if (subcategoryId) {
      const subcategory = await prisma.subcategory.findUnique({
        where: { id: subcategoryId }
      });
      
      if (!subcategory || subcategory.categoryId !== categoryId) {
        return res.status(400).json(ResponseFormatter.error('Sottocategoria non valida', 'INVALID_SUBCATEGORY'));
      }
    }
    
    // Crea la richiesta
    const newRequest = await prisma.assistanceRequest.create({
      data: {
        id: uuidv4(), // Genera un UUID per l'id
        title,
        description,
        categoryId,
        subcategoryId: subcategoryId || null,
        priority: priority.toUpperCase(),
        status: 'PENDING',
        address,
        city,
        province,
        postalCode,
        requestedDate: requestedDate ? new Date(requestedDate) : null,
        publicNotes: notes || null,
        latitude: latitude || null,
        longitude: longitude || null,
        clientId: user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        client: true,
        category: true,
        subcategory: true
      }
    });
    
    logger.info(`New request created: ${newRequest.id} by client ${user.id}`);
    
    // TODO: Invia notifica ai professionisti della categoria
    // TODO: Invia email di conferma al cliente
    
    res.status(201).json(ResponseFormatter.success({
      request: formatAssistanceRequest(newRequest),
      message: 'Richiesta creata con successo'
    }));
    
  } catch (error) {
    logger.error('Error creating request:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella creazione della richiesta',
      'CREATE_ERROR'
    ));
  }
});

// POST /api/requests/for-client - Create request for a client (STAFF/ADMIN only)
router.post('/for-client', requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: AuthRequest, res) => {
  try {
    const staffUser = req.user!;
    
    const {
      // Dati cliente (esistente o nuovo)
      clientId,
      newClient,
      
      // Dati richiesta
      title,
      description,
      categoryId,
      subcategoryId,
      priority = 'MEDIUM',
      address,
      city,
      province,
      postalCode,
      requestedDate,
      notes,
      latitude,
      longitude,
      
      // Assegnazione opzionale
      professionalId,
      assignmentNotes
    } = req.body;
    
    // Validazione: deve avere clientId O newClient
    if (!clientId && !newClient) {
      return res.status(400).json(ResponseFormatter.error(
        'Deve essere specificato un cliente esistente o i dati per crearne uno nuovo',
        'VALIDATION_ERROR'
      ));
    }
    
    // Validazione dei campi obbligatori della richiesta
    if (!title || !description || !categoryId || !address || !city || !province || !postalCode) {
      return res.status(400).json(ResponseFormatter.error('Campi obbligatori mancanti', 'VALIDATION_ERROR'));
    }
    
    let finalClientId = clientId;
    
    // Se dobbiamo creare un nuovo cliente
    if (!clientId && newClient) {
      const { email, firstName, lastName, phone, codiceFiscale } = newClient;
      
      // Validazione dati nuovo cliente
      if (!email || !firstName || !lastName) {
        return res.status(400).json(ResponseFormatter.error(
          'Email, nome e cognome sono obbligatori per creare un nuovo cliente',
          'VALIDATION_ERROR'
        ));
      }
      
      // Verifica che l'email non esista già
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        return res.status(400).json(ResponseFormatter.error(
          `Un utente con email ${email} esiste già nel sistema`,
          'EMAIL_EXISTS'
        ));
      }
      
      // Genera username univoco
      const baseUsername = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/[^a-z0-9.]/g, '');
      let username = baseUsername;
      let counter = 1;
      
      while (await prisma.user.findUnique({ where: { username } })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }
      
      // Crea il nuovo cliente
      const newClientUser = await prisma.user.create({
        data: {
          id: uuidv4(),
          email,
          username,
          password: await bcrypt.hash('TempPassword123!', 10), // Password temporanea
          firstName,
          lastName,
          fullName: `${firstName} ${lastName}`,
          phone: phone || null,
          role: 'CLIENT',
          codiceFiscale: codiceFiscale || null,
          address,
          city,
          province,
          postalCode,
          country: 'IT',
          emailVerified: false, // Richiederà verifica email
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      finalClientId = newClientUser.id;
      
      logger.info(`New client created by staff: ${finalClientId} (${email}) by ${staffUser.id}`);
      
      // TODO: Invia email al nuovo cliente con credenziali temporanee
    }
    
    // Verifica che il cliente esista (se specificato clientId esistente)
    if (clientId) {
      const client = await prisma.user.findUnique({
        where: { 
          id: clientId,
          role: 'CLIENT'
        }
      });
      
      if (!client) {
        return res.status(404).json(ResponseFormatter.error('Cliente non trovato', 'NOT_FOUND'));
      }
    }
    
    // Verifica che la categoria esista
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });
    
    if (!category) {
      return res.status(400).json(ResponseFormatter.error('Categoria non valida', 'INVALID_CATEGORY'));
    }
    
    // Verifica che la sottocategoria esista se fornita
    if (subcategoryId) {
      const subcategory = await prisma.subcategory.findUnique({
        where: { id: subcategoryId }
      });
      
      if (!subcategory || subcategory.categoryId !== categoryId) {
        return res.status(400).json(ResponseFormatter.error('Sottocategoria non valida', 'INVALID_SUBCATEGORY'));
      }
    }
    
    // Crea la richiesta per il cliente
    const newRequest = await prisma.assistanceRequest.create({
      data: {
        id: uuidv4(),
        title,
        description,
        categoryId,
        subcategoryId: subcategoryId || null,
        priority: priority.toUpperCase(),
        status: professionalId ? 'ASSIGNED' : 'PENDING', // Se assegnata subito, status ASSIGNED
        address,
        city,
        province,
        postalCode,
        requestedDate: requestedDate ? new Date(requestedDate) : null,
        publicNotes: notes || null,
        latitude: latitude || null,
        longitude: longitude || null,
        clientId: finalClientId,
        
        // Se viene assegnata subito
        professionalId: professionalId || null,
        assignmentType: professionalId ? 'STAFF' : null,
        assignedBy: professionalId ? staffUser.id : null,
        assignedAt: professionalId ? new Date() : null,
        
        // Note interne per tracciare che è stata creata dallo staff
        internalNotes: `Richiesta creata da ${staffUser.fullName} (${staffUser.role}) per conto del cliente${assignmentNotes ? `\nNote assegnazione: ${assignmentNotes}` : ''}`,
        
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        client: true,
        professional: {
          include: {
            Profession: true
          }
        },
        category: true,
        subcategory: true
      }
    });
    
    logger.info(`Request ${newRequest.id} created for client ${finalClientId} by staff ${staffUser.id}`);
    
    // Se è stata assegnata, log anche l'assegnazione
    if (professionalId) {
      logger.info(`Request ${newRequest.id} also assigned to professional ${professionalId}`);
    }
    
    // TODO: Invia notifica al cliente della nuova richiesta
    // TODO: Se assegnata, invia notifica anche al professionista
    
    res.status(201).json(ResponseFormatter.success({
      request: formatAssistanceRequest(newRequest),
      newClientCreated: !clientId && newClient ? true : false,
      message: professionalId 
        ? 'Richiesta creata e assegnata con successo' 
        : 'Richiesta creata con successo per il cliente'
    }));
    
  } catch (error) {
    logger.error('Error creating request for Client:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella creazione della richiesta per il cliente',
      'CREATE_ERROR'
    ));
  }
});

// GET /api/requests/:id - Get single request
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const user = req.user!;
    
    const request = await prisma.assistanceRequest.findUnique({
      where: {
        id: req.params.id
      },
      include: {
        client: true,
        professional: {
          include: {
            Profession: true
          }
        },
        category: true,
        subcategory: true,
        quotes: {
          include: {
            professional: true  // Quote->User relation (professional)
          }
        },
        RequestAttachment: true
        // Rimosso 'updates' che non esiste nello schema
      }
    });
    
    if (!request) {
      return res.status(404).json(ResponseFormatter.error('Request not found', 'NOT_FOUND'));
    }
    
    // Check access permissions
    if (user.role === 'CLIENT') {
      // I clienti possono vedere solo le loro richieste
      if (request.clientId !== user.id) {
        return res.status(403).json(ResponseFormatter.error('Access denied', 'FORBIDDEN'));
      }
    } else if (user.role === 'PROFESSIONAL') {
      // I professionisti possono vedere SOLO le richieste assegnate a loro
      if (request.professionalId !== user.id) {
        return res.status(403).json(ResponseFormatter.error('Access denied - this request is not assigned to you', 'FORBIDDEN'));
      }
    }
    // ADMIN e SUPER_ADMIN possono vedere tutto, quindi nessun controllo per loro
    
    // Use response formatter
    const formattedRequest = formatAssistanceRequest(request);
    
    // Remove internal notes for non-admin users
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      delete formattedRequest.internalNotes;
    }
    
    res.json(ResponseFormatter.success({ 
      request: formattedRequest 
    }));
    
  } catch (error) {
    logger.error('Error fetching request:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero della richiesta',
      'FETCH_ERROR'
    ));
  }
});

/**
 * POST /api/requests/:id/cancel
 * 🆕 QUICK ACTION: Cancella richiesta (CLIENT only)
 */
router.post(
  '/:id/cancel',
  [
    param('id').isUUID().withMessage('ID richiesta non valido'),
    body('reason').optional().isString().withMessage('Il motivo deve essere una stringa')
  ],
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const user = req.user!;

      // Solo i clienti possono cancellare le loro richieste
      if (user.role !== 'CLIENT') {
        return res.status(403).json(
          ResponseFormatter.error('Solo i clienti possono cancellare richieste', 'FORBIDDEN')
        );
      }

      // Verifica che la richiesta esista
      const request = await prisma.assistanceRequest.findUnique({
        where: { id },
        include: {
          client: true,
          professional: true
        }
      });

      if (!request) {
        return res.status(404).json(
          ResponseFormatter.error('Richiesta non trovata', 'NOT_FOUND')
        );
      }

      // Verifica che sia il proprietario
      if (request.clientId !== user.id) {
        return res.status(403).json(
          ResponseFormatter.error('Non autorizzato a cancellare questa richiesta', 'FORBIDDEN')
        );
      }

      // Verifica che non sia già completata o cancellata
      if (request.status === 'COMPLETED') {
        return res.status(400).json(
          ResponseFormatter.error('Non puoi cancellare una richiesta completata', 'INVALID_STATUS')
        );
      }

      if (request.status === 'CANCELLED') {
        return res.status(400).json(
          ResponseFormatter.error('La richiesta è già stata cancellata', 'ALREADY_CANCELLED')
        );
      }

      // Prepara note di cancellazione
      const timestamp = new Date().toLocaleString('it-IT');
      const cancelNote = `\n\n[${timestamp}] CANCELLAZIONE - Motivo: ${reason || 'Nessun motivo specificato'} (da ${user.firstName} ${user.lastName})`;
      
      // Aggiorna la richiesta
      const updatedRequest = await prisma.assistanceRequest.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          internalNotes: (request.internalNotes || '') + cancelNote,
          updatedAt: new Date()
        },
        include: {
          client: true,
          professional: {
            include: {
              Profession: true
            }
          },
          category: true,
          subcategory: true
        }
      });

      logger.info(`Request ${id} cancelled by client ${user.id}${reason ? ` with reason: ${reason}` : ''}`);

      // Notifica al professionista se assegnata
      if (request.professionalId) {
        try {
          const message = reason 
            ? `Il cliente ha cancellato la richiesta. Motivo: ${reason}`
            : 'Il cliente ha cancellato la richiesta';
            
          await notificationService.sendToUser(request.professionalId, {
            title: '❌ Richiesta Cancellata',
            message,
            type: 'request_cancelled',
            relatedId: id,
            relatedType: 'request'
          });
        } catch (notifError) {
          logger.warn('Could not send cancellation notification to professional:', notifError);
        }
      }

      return res.json(
        ResponseFormatter.success(
          formatAssistanceRequest(updatedRequest),
          'Richiesta cancellata con successo'
        )
      );
    } catch (error) {
      logger.error('Error cancelling request:', error);
      return res.status(500).json(
        ResponseFormatter.error('Errore nella cancellazione della richiesta', 'CANCEL_ERROR')
      );
    }
  }
);

// PATCH /api/requests/:id/coordinates - Update request coordinates
router.patch('/:id/coordinates', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;
    const user = req.user!;
    
    // Validate coordinates
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json(ResponseFormatter.error('Coordinate non valide', 'VALIDATION_ERROR'));
    }
    
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json(ResponseFormatter.error('Coordinate fuori range valido', 'VALIDATION_ERROR'));
    }
    
    // Check if request exists
    const request = await prisma.assistanceRequest.findUnique({
      where: { id }
    });
    
    if (!request) {
      return res.status(404).json(ResponseFormatter.error('Richiesta non trovata', 'NOT_FOUND'));
    }
    
    // Check permissions - only admin or request owner can update coordinates
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && request.clientId !== user.id) {
      return res.status(403).json(ResponseFormatter.error('Non autorizzato', 'FORBIDDEN'));
    }
    
    // Update coordinates
    const updatedRequest = await prisma.assistanceRequest.update({
      where: { id },
      data: {
        latitude,
        longitude,
        updatedAt: new Date()
      }
    });
    
    logger.info(`Coordinates updated for request ${id} by user ${user.id}`);
    
    res.json(ResponseFormatter.success({
      message: 'Coordinate aggiornate con successo',
      coordinates: {
        latitude: updatedRequest.latitude,
        longitude: updatedRequest.longitude
      }
    }));
    
  } catch (error) {
    logger.error('Error updating request coordinates:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento delle coordinate',
      'UPDATE_ERROR'
    ));
  }
});

// POST /api/requests/:id/assign - Assegna richiesta a professionista (STAFF only)
router.post('/:id/assign', requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { professionalId, notes } = req.body;
    const assignedByUser = req.user!;

    // Verifica che la richiesta esista
    const request = await prisma.assistanceRequest.findUnique({
      where: { id },
      include: {
        client: true,
        subcategory: true
      }
    });

    if (!request) {
      return res.status(404).json(
        ResponseFormatter.error('Richiesta non trovata', 'NOT_FOUND')
      );
    }

    // Verifica che non sia già assegnata
    if (request.professionalId) {
      return res.status(400).json(
        ResponseFormatter.error('La richiesta è già assegnata', 'ALREADY_ASSIGNED')
      );
    }

    // Verifica che il professionista esista e sia abilitato
    const professional = await prisma.user.findUnique({
      where: { 
        id: professionalId,
        role: 'PROFESSIONAL'
      }
    });

    if (!professional) {
      return res.status(404).json(
        ResponseFormatter.error('Professionista non trovato', 'NOT_FOUND')
      );
    }

    // Assegna la richiesta
    const updatedRequest = await prisma.assistanceRequest.update({
      where: { id },
      data: {
        professionalId,
        status: 'ASSIGNED',
        assignmentType: 'STAFF',
        assignedBy: assignedByUser.id,
        assignedAt: new Date(),
        internalNotes: notes ? 
          `${request.internalNotes || ''}\n[${new Date().toISOString()}] Assegnato da ${assignedByUser.fullName}: ${notes}`.trim() : 
          request.internalNotes,
        updatedAt: new Date()
      },
      include: {
        client: true,
        professional: {
          include: {
            Profession: true
          }
        },
        category: true,
        subcategory: true
      }
    });

    logger.info(`Richiesta ${id} assegnata a ${professionalId} da ${assignedByUser.id}`);

    // 🆕 CALCOLA E SALVA INFORMAZIONI VIAGGIO
    try {
      await travelCalculationService.calculateAndSave(id, professionalId);
      logger.info(`✅ Informazioni viaggio calcolate per richiesta ${id}`);
    } catch (travelError) {
      logger.warn(`⚠️ Impossibile calcolare info viaggio per richiesta ${id}:`, travelError);
      // Non bloccare l'assegnamento se il calcolo viaggio fallisce
    }

    res.json(ResponseFormatter.success(
      formatAssistanceRequest(updatedRequest),
      'Richiesta assegnata con successo'
    ));

  } catch (error) {
    logger.error('Errore assegnazione richiesta:', error);
    res.status(500).json(
      ResponseFormatter.error('Errore durante l\'assegnazione', 'ASSIGN_ERROR')
    );
  }
});

// PATCH /api/requests/:id/schedule - Imposta data intervento (PROFESSIONAL only)
router.patch('/:id/schedule', requireRole(['PROFESSIONAL']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { scheduledDate, notes } = req.body;
    const professional = req.user!;

    // Verifica che la richiesta esista e sia assegnata al professionista
    const request = await prisma.assistanceRequest.findUnique({
      where: { 
        id,
        professionalId: professional.id,
        status: 'ASSIGNED'
      },
      include: {
        client: true
      }
    });

    if (!request) {
      return res.status(404).json(
        ResponseFormatter.error(
          'Richiesta non trovata o non assegnata a te',
          'NOT_FOUND'
        )
      );
    }

    // Aggiorna con data intervento e cambia stato a IN_PROGRESS
    const updatedRequest = await prisma.assistanceRequest.update({
      where: { id },
      data: {
        scheduledDate: new Date(scheduledDate),
        status: 'IN_PROGRESS', // Automaticamente in lavorazione con la data
        publicNotes: notes ? 
          `${request.publicNotes || ''}\n[${new Date().toISOString()}] Intervento programmato: ${notes}`.trim() : 
          request.publicNotes,
        updatedAt: new Date()
      },
      include: {
        client: true,
        professional: {
          include: {
            Profession: true
          }
        },
        category: true,
        subcategory: true
      }
    });

    logger.info(`Data intervento impostata per richiesta ${id}: ${scheduledDate}`);

    res.json(ResponseFormatter.success(
      formatAssistanceRequest(updatedRequest),
      'Data intervento impostata con successo'
    ));

  } catch (error) {
    logger.error('Errore impostazione data:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore durante l\'impostazione della data', 'SCHEDULE_ERROR')
    );
  }
});

// GET /api/requests/:id/pdf - Download PDF of request
router.get('/:id/pdf', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    
    // Check if request exists and user has access
    const request = await prisma.assistanceRequest.findUnique({
      where: { id },
      include: {
        client: true,
        professional: true
      }
    });
    
    if (!request) {
      return res.status(404).json(ResponseFormatter.error('Request not found', 'NOT_FOUND'));
    }
    
    // Check permissions
    if (user.role === 'CLIENT') {
      if (request.clientId !== user.id) {
        return res.status(403).json(ResponseFormatter.error('Access denied', 'FORBIDDEN'));
      }
    } else if (user.role === 'PROFESSIONAL') {
      // I professionisti possono scaricare il PDF solo delle richieste assegnate a loro
      if (request.professionalId !== user.id) {
        return res.status(403).json(ResponseFormatter.error('Access denied', 'FORBIDDEN'));
      }
    }
    // ADMIN e SUPER_ADMIN possono scaricare tutto
    
    // Import PDF service
    const { pdfService } = await import('../services/pdf.service');
    
    // Generate PDF
    const pdfPath = await pdfService.generateRequestPDF(id);
    
    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="richiesta-${id.slice(0, 8)}.pdf"`);
    
    // Send file
    res.sendFile(pdfPath, (err) => {
      if (err) {
        logger.error('Error sending PDF:', err);
        if (!res.headersSent) {
          return res.status(500).json(ResponseFormatter.error('Error downloading PDF', 'PDF_ERROR'));
        }
      }
      
      // Clean up file after sending (optional)
      setTimeout(() => {
        try {
          pdfService.deletePDF(`richiesta-${id.slice(0, 8)}.pdf`);
        } catch (cleanupErr) {
          logger.warn('Could not clean up PDF file:', cleanupErr);
        }
      }, 5000); // Delete after 5 seconds
    });
    
  } catch (error) {
    logger.error('Error generating request PDF:', error);
    return res.status(500).json(ResponseFormatter.error('Error generating PDF', 'PDF_ERROR'));
  }
});

// PUT /api/requests/:id/status - Aggiorna stato richiesta (Admin only)
router.put('/:id/status', requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status, cancelReason } = req.body;
    
    // Valida lo stato
    const validStatuses = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json(ResponseFormatter.error('Stato non valido', 'INVALID_STATUS'));
    }
    
    // Se si sta annullando, richiedi il motivo
    if (status === 'CANCELLED' && !cancelReason) {
      return res.status(400).json(ResponseFormatter.error('Il motivo dell\'annullamento è obbligatorio', 'CANCEL_REASON_REQUIRED'));
    }
    
    // Prepara i dati per l'aggiornamento
    const updateData: any = {
      status,
      updatedAt: new Date()
    };
    
    // Se c'è un motivo di cancellazione, salvalo nelle note
    if (cancelReason) {
      const existingRequest = await prisma.assistanceRequest.findUnique({
        where: { id },
        select: { internalNotes: true }
      });
      
      const timestamp = new Date().toLocaleString('it-IT');
      const cancelNote = `\n\n[${timestamp}] ANNULLAMENTO - Motivo: ${cancelReason} (da ${req.user?.email})`;
      updateData.internalNotes = (existingRequest?.internalNotes || '') + cancelNote;
    }
    
    // Aggiorna la richiesta
    const updatedRequest = await prisma.assistanceRequest.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        professional: true
      }
    });
    
    // Crea notifica per il cliente (solo se esiste clientId)
    if (updatedRequest.clientId) {
      try {
        // Messaggio diverso per annullamento
        const title = status === 'CANCELLED' ? 'Richiesta annullata' : 'Stato richiesta aggiornato';
        const message = status === 'CANCELLED' 
          ? `La tua richiesta è stata annullata. Motivo: ${cancelReason}`
          : `La tua richiesta è ora in stato: ${status}`;
        
        await notificationService.sendToUser(updatedRequest.clientId, {
          title,
          message,
          type: 'request_status_updated',
          relatedId: id,
          relatedType: 'request'
        });
      } catch (notificationError) {
        logger.warn('Could not send notification to client:', notificationError);
        // Non bloccare l'operazione se la notifica fallisce
      }
    }
    
    // Se assegnata, notifica anche il professionista
    if (updatedRequest.professionalId && status === 'IN_PROGRESS') {
      try {
        await notificationService.sendToUser(updatedRequest.professionalId, {
          title: 'Richiesta in corso',
          message: 'La richiesta è stata impostata come "In corso"',
          type: 'request_status_updated',
          relatedId: id,
          relatedType: 'request'
        });
      } catch (notificationError) {
        logger.warn('Could not send notification to professional:', notificationError);
        // Non bloccare l'operazione se la notifica fallisce
      }
    }
    
    logger.info(`Request ${id} status updated to ${status} by ${req.user?.id}`);
    
    return res.json(ResponseFormatter.success(
      updatedRequest,
      'Stato aggiornato con successo'
    ));
    
  } catch (error) {
    logger.error('Error updating request status:', error);
    return res.status(500).json(ResponseFormatter.error('Errore aggiornamento stato', 'UPDATE_ERROR'));
  }
});

// PUT /api/requests/:id/priority - Aggiorna priorità richiesta (Admin only)
router.put('/:id/priority', requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;
    
    // Valida la priorità
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json(ResponseFormatter.error('Priorità non valida', 'INVALID_PRIORITY'));
    }
    
    // Aggiorna la richiesta
    const updatedRequest = await prisma.assistanceRequest.update({
      where: { id },
      data: { 
        priority,
        updatedAt: new Date()
      },
      include: {
        client: true,
        professional: true
      }
    });
    
    // Se urgente, notifica il professionista assegnato (solo se esiste)
    if (priority === 'URGENT' && updatedRequest.professionalId) {
      try {
        await notificationService.sendToUser(updatedRequest.professionalId, {
          title: '⚠️ Richiesta URGENTE',
          message: 'Una richiesta assegnata a te è stata marcata come URGENTE',
          type: 'request_priority_updated',
          relatedId: id,
          relatedType: 'request'
        });
      } catch (notificationError) {
        logger.warn('Could not send notification to professional:', notificationError);
        // Non bloccare l'operazione se la notifica fallisce
      }
    }
    
    logger.info(`Request ${id} priority updated to ${priority} by ${req.user?.id}`);
    
    return res.json(ResponseFormatter.success(
      updatedRequest,
      'Priorità aggiornata con successo'
    ));
    
  } catch (error) {
    logger.error('Error updating request priority:', error);
    return res.status(500).json(ResponseFormatter.error('Errore aggiornamento priorità', 'UPDATE_ERROR'));
  }
});

// GET /api/requests/:id/chat - Ottieni messaggi chat della richiesta
router.get('/:id/chat', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    
    // Verifica che la richiesta esista
    const request = await prisma.assistanceRequest.findUnique({
      where: { id },
      include: {
        client: true,
        professional: true
      }
    });
    
    if (!request) {
      return res.status(404).json(ResponseFormatter.error('Richiesta non trovata', 'NOT_FOUND'));
    }
    
    // Verifica autorizzazioni
    const canViewChat = 
      user.role === 'ADMIN' || 
      user.role === 'SUPER_ADMIN' ||
      request.clientId === user.id ||
      request.professionalId === user.id;
    
    if (!canViewChat) {
      return res.status(403).json(ResponseFormatter.error('Non autorizzato a vedere questa chat', 'FORBIDDEN'));
    }
    
    // Recupera i messaggi con i dati utente inclusi
    const messages = await prisma.requestChatMessage.findMany({
      where: {
        requestId: id,
        isDeleted: false
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    // Ottieni tutti gli userIds unici
    const userIds = [...new Set(messages.map(msg => msg.userId))];
    
    // Carica i dati degli utenti
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });
    
    // Crea una mappa per accesso rapido
    const userMap = new Map(users.map(u => [u.id, u]));
    
    // Debug: log del primo messaggio per vedere la struttura
    if (messages.length > 0) {
      const firstUser = userMap.get(messages[0].userId);
      logger.info('Chat message user data:', {
        messageId: messages[0].id,
        userId: messages[0].userId,
        userFound: !!firstUser,
        firstName: firstUser?.firstName,
        lastName: firstUser?.lastName
      });
    }
    
    // Formatta i messaggi per il frontend
    const formattedMessages = messages.map((msg: any) => {
      const msgUser = userMap.get(msg.userId);
      return {
        id: msg.id,
        message: msg.message,
        senderId: msg.userId,
        senderName: msgUser ? `${msgUser.firstName || ''} ${msgUser.lastName || ''}`.trim() : 'Utente sconosciuto',
        senderRole: msgUser?.role || 'UNKNOWN',
        createdAt: msg.createdAt,
        isEdited: msg.isEdited,
        attachments: msg.attachments
      };
    });
    
    // Segna come letti i messaggi non letti dall'utente corrente
    await prisma.requestChatMessage.updateMany({
      where: {
        requestId: id,
        userId: {
          not: user.id
        },
        isRead: false
      },
      data: {
        isRead: true,
        readBy: {
          push: {
            userId: user.id,
            readAt: new Date()
          }
        }
      }
    });
    
    return res.json(ResponseFormatter.success(formattedMessages, 'Messaggi recuperati'));
    
  } catch (error) {
    logger.error('Error fetching chat messages:', error);
    return res.status(500).json(ResponseFormatter.error('Errore recupero messaggi', 'FETCH_ERROR'));
  }
});

// POST /api/requests/:id/chat - Invia un messaggio nella chat
router.post('/:id/chat', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { message, attachments } = req.body;
    let user = req.user!;
    
    // Se l'utente non ha firstName/lastName, ricaricalo dal DB
    if (!user.firstName || !user.lastName) {
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true
        }
      });
      if (fullUser) {
        user = { ...user, ...fullUser };
      }
    }
    
    if (!message || !message.trim()) {
      // Se non c'è messaggio ma ci sono allegati, permetti l'invio
      if (!attachments || attachments.length === 0) {
        return res.status(400).json(ResponseFormatter.error('Il messaggio non può essere vuoto senza allegati', 'INVALID_MESSAGE'));
      }
    }
    
    // Verifica che la richiesta esista
    const request = await prisma.assistanceRequest.findUnique({
      where: { id },
      include: {
        client: true,
        professional: true
      }
    });
    
    if (!request) {
      return res.status(404).json(ResponseFormatter.error('Richiesta non trovata', 'NOT_FOUND'));
    }
    
    // Verifica autorizzazioni
    const canSendMessage = 
      user.role === 'ADMIN' || 
      user.role === 'SUPER_ADMIN' ||
      request.clientId === user.id ||
      request.professionalId === user.id;
    
    if (!canSendMessage) {
      return res.status(403).json(ResponseFormatter.error('Non autorizzato a inviare messaggi', 'FORBIDDEN'));
    }
    
    // Crea il messaggio
    const newMessage = await prisma.requestChatMessage.create({
      data: {
        id: uuidv4(),
        requestId: id,
        userId: user.id,
        message: message?.trim() || '',  // Permetti messaggio vuoto se ci sono allegati
        attachments: attachments || null,
        updatedAt: new Date()
      }
    });
    
    // Formatta il messaggio per il frontend
    const formattedMessage = {
      id: newMessage.id,
      message: newMessage.message,
      senderId: newMessage.userId,
      senderName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Utente sconosciuto',
      senderRole: user.role,
      createdAt: newMessage.createdAt,
      attachments: newMessage.attachments
    };
    
    // Debug log
    logger.info('New message created:', {
      userId: user.id,
      userName: formattedMessage.senderName,
      userFirstName: user.firstName,
      userLastName: user.lastName
    });
    
    // Invia notifica agli altri partecipanti
    const recipients = [];
    if (request.clientId && request.clientId !== user.id) {
      recipients.push(request.clientId);
    }
    if (request.professionalId && request.professionalId !== user.id) {
      recipients.push(request.professionalId);
    }
    
    for (const recipientId of recipients) {
      try {
        await notificationService.sendToUser(recipientId, {
          title: 'Nuovo messaggio nella chat',
          message: `Hai ricevuto un nuovo messaggio per la richiesta: ${request.title}`,
          type: 'chat_message',
          relatedId: id,
          relatedType: 'request'
        });
      } catch (notifError) {
        logger.warn('Could not send chat notification:', notifError);
      }
    }
    
    return res.status(201).json(ResponseFormatter.success(formattedMessage, 'Messaggio inviato'));
    
  } catch (error) {
    logger.error('Error sending chat message:', error);
    return res.status(500).json(ResponseFormatter.error('Errore invio messaggio', 'SEND_ERROR'));
  }
});

// PATCH /api/requests/:id/coordinates - Update request coordinates
router.patch('/:id/coordinates', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;
    const user = req.user!;

    // Validate coordinates
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json(ResponseFormatter.error(
        'Latitudine e longitudine sono richieste',
        'INVALID_COORDINATES'
      ));
    }

    // Find the request
    const request = await prisma.assistanceRequest.findUnique({
      where: { id },
      include: {
        client: true
      }
    });

    if (!request) {
      return res.status(404).json(ResponseFormatter.error(
        'Richiesta non trovata',
        'NOT_FOUND'
      ));
    }

    // Check permissions - only owner or admin can update coordinates
    const isOwner = request.clientId === user.id;
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json(ResponseFormatter.error(
        'Non autorizzato a modificare le coordinate',
        'FORBIDDEN'
      ));
    }

    // Update the coordinates
    const updatedRequest = await prisma.assistanceRequest.update({
      where: { id },
      data: {
        latitude: parseFloat(latitude.toString()),
        longitude: parseFloat(longitude.toString()),
        updatedAt: new Date()
      },
      include: {
        client: true,
        professional: true,
        category: true,
        subcategory: true,
        quotes: true,
        RequestAttachment: true
      }
    });

    // Log the update
    logger.info(`Coordinates updated for request ${id} by user ${user.id}`);

    // 🆕 RICALCOLA INFORMAZIONI VIAGGIO se è assegnata
    if (updatedRequest.professionalId) {
      try {
        await travelCalculationService.recalculateForRequest(id);
        logger.info(`✅ Informazioni viaggio ricalcolate dopo cambio coordinate per richiesta ${id}`);
      } catch (travelError) {
        logger.warn(`⚠️ Impossibile ricalcolare info viaggio:`, travelError);
        // Non bloccare l'operazione
      }
    }

    // Send success response
    res.json(ResponseFormatter.success(
      formatAssistanceRequest(updatedRequest),
      'Coordinate aggiornate con successo'
    ));
  } catch (error) {
    logger.error('Error updating request coordinates:', error);
    next(error);
  }
});

export default router;