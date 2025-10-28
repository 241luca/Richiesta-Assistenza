import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { ResponseFormatter, formatUser } from '../utils/responseFormatter';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { z } from 'zod';
import travelCalculationService from '../services/travelCalculation.service';
import { userService } from '../services/user.service';
import { systemSettingsService } from '../services/systemSettings.service';

const router = Router();

// Middleware per verificare se l'utente è admin
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json(ResponseFormatter.error(
      'Accesso negato. Solo gli amministratori possono accedere a questa risorsa.',
      'FORBIDDEN'
    ));
  }
  next();
};

// Schema validazione profilo
const profileUpdateSchema = z.object({
  // Dati personali
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  
  // Indirizzi
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().max(2).optional(),
  postalCode: z.string().max(5).optional(),
  
  // Indirizzo lavoro
  workAddress: z.string().optional(),
  workCity: z.string().optional(),
  workProvince: z.string().max(2).optional(),
  workPostalCode: z.string().max(5).optional(),
  useResidenceAsWorkAddress: z.boolean().optional(),
  
  // Tariffe professionali
  hourlyRate: z.number().min(0).optional(),
  travelRatePerKm: z.number().min(0).optional(),
  
  // Altri dati professionali
  profession: z.string().optional(),
  specializations: z.array(z.string()).optional(),
  bio: z.string().optional()
});

// GET /profile - Ottieni il profilo dell'utente autenticato
router.get('/profile', authenticate, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json(ResponseFormatter.error('User not authenticated', 'NOT_AUTHENTICATED'));
    }
    
    // Recupera l'utente completo dal database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json(ResponseFormatter.error('Utente non trovato', 'USER_NOT_FOUND'));
    }
    
    // Usa ResponseFormatter per output consistente
    const formattedUser = formatUser(user as any);
    return res.json(ResponseFormatter.success(
      formattedUser,
      'User profile retrieved successfully'
    ));
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Error fetching user profile',
      'USER_PROFILE_ERROR'
    ));
  }
});

// PUT /profile - Aggiorna il profilo dell'utente autenticato
router.put('/profile', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    // Valida i dati
    let validatedData;
    try {
      validatedData = profileUpdateSchema.parse(req.body);
    } catch (validationError) {
      logger.error('Profile validation error:', validationError);
      return res.status(400).json(ResponseFormatter.error('Dati profilo non validi', 'VALIDATION_ERROR'));
    }
    
    // 🆕 VERIFICA SE STA CAMBIANDO L'INDIRIZZO DI LAVORO (solo per professionisti)
    let workAddressChanged = false;
    if (userRole === 'PROFESSIONAL') {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          workAddress: true,
          workCity: true,
          workProvince: true,
          workPostalCode: true,
          address: true,
          city: true,
          province: true,
          postalCode: true,
          useResidenceAsWorkAddress: true
        }
      });
      
      // Controlla se uno qualsiasi dei campi indirizzo è cambiato
      if (currentUser) {
        workAddressChanged = (
          (validatedData.workAddress && validatedData.workAddress !== currentUser.workAddress) ||
          (validatedData.workCity && validatedData.workCity !== currentUser.workCity) ||
          (validatedData.workProvince && validatedData.workProvince !== currentUser.workProvince) ||
          (validatedData.workPostalCode && validatedData.workPostalCode !== currentUser.workPostalCode) ||
          // Anche se cambia la residenza e usa quella come lavoro
          (currentUser.useResidenceAsWorkAddress && (
            (validatedData.address && validatedData.address !== currentUser.address) ||
            (validatedData.city && validatedData.city !== currentUser.city) ||
            (validatedData.province && validatedData.province !== currentUser.province) ||
            (validatedData.postalCode && validatedData.postalCode !== currentUser.postalCode)
          )) ||
          // O se cambia il flag useResidenceAsWorkAddress
          (validatedData.useResidenceAsWorkAddress !== undefined && 
           validatedData.useResidenceAsWorkAddress !== currentUser.useResidenceAsWorkAddress)
        );
      }
    }
    
    // Prepara i dati per l'aggiornamento
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date()
    };
    
    // Se sta aggiornando il nome, aggiorna anche fullName
    if (validatedData.firstName || validatedData.lastName) {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true }
      });
      
      updateData.fullName = `${validatedData.firstName || currentUser?.firstName} ${validatedData.lastName || currentUser?.lastName}`;
    }
    
    // Converti province in maiuscolo
    if (updateData.province) {
      updateData.province = updateData.province.toUpperCase();
    }
    if (updateData.workProvince) {
      updateData.workProvince = updateData.workProvince.toUpperCase();
    }
    
    // Aggiorna l'utente
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });
    
    logger.info(`Profile updated for user ${userId}`);
    
    // 🆕 RICALCOLA INFORMAZIONI VIAGGIO SE INDIRIZZO CAMBIATO
    if (workAddressChanged && userRole === 'PROFESSIONAL') {
      logger.info(`🚗 Work address changed for professional ${userId}, recalculating travel info...`);
      
      try {
        const updatedCount = await travelCalculationService.recalculateForProfessional(userId);
        logger.info(`✅ Travel info recalculated for ${updatedCount} requests`);
      } catch (travelError) {
        logger.warn(`⚠️ Failed to recalculate travel info for professional ${userId}:`, travelError);
        // Non bloccare l'aggiornamento profilo se il ricalcolo fallisce
      }
    }
    
    // Formatta e restituisci l'utente aggiornato
    const formattedUser = formatUser(updatedUser);
    return res.json(ResponseFormatter.success(
      formattedUser,
      workAddressChanged ? 'Profilo aggiornato con successo. Le distanze delle tue richieste sono state ricalcolate.' : 'Profilo aggiornato con successo'
    ));
    
  } catch (error) {
    logger.error('Error updating user profile:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento del profilo',
      'PROFILE_UPDATE_ERROR'
    ));
  }
});

// GET /users/search - Cerca utenti per email, nome, cognome o telefono (solo per admin)
router.get('/search', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const { query, role } = req.query;
    
    if (!query) {
      return res.status(400).json(ResponseFormatter.error(
        'Query di ricerca richiesta',
        'QUERY_REQUIRED'
      ));
    }
    
    const searchQuery = query.toString().trim();
    const roleFilter = role ? role.toString().toUpperCase() : 'CLIENT'; // Default a CLIENT
    
    logger.info(`[USER SEARCH] Query: "${searchQuery}", Role: "${roleFilter}"`);
    
    // Prima facciamo una query semplice per vedere se ci sono utenti CLIENT nel database
    const clientCount = await prisma.user.count({
      where: { role: roleFilter }
    });
    
    logger.info(`[USER SEARCH] Total ${roleFilter} users in database: ${clientCount}`);
    
    // Se non ci sono utenti CLIENT, restituisci un messaggio appropriato
    if (clientCount === 0) {
      return res.json(ResponseFormatter.success(
        [],
        `Nessun utente con ruolo ${roleFilter} nel database`
      ));
    }
    
    // Prova prima una ricerca esatta per email
    const exactEmailUser = await prisma.user.findFirst({
      where: {
        email: searchQuery.toLowerCase(),
        role: roleFilter
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        address: true,
        city: true,
        province: true,
        postalCode: true,
        codiceFiscale: true,
        partitaIva: true,
        createdAt: true
      }
    });
    
    if (exactEmailUser) {
      logger.info(`[USER SEARCH] Found exact email match: ${exactEmailUser.email}`);
      return res.json(ResponseFormatter.success(
        exactEmailUser,
        'Utente trovato per email'
      ));
    }
    
    // Costruisci condizioni di ricerca più flessibili
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { role: roleFilter },
          {
            OR: [
              // Email contiene la query (partial match)
              {
                email: {
                  contains: searchQuery.toLowerCase(),
                  mode: 'insensitive'
                }
              },
              // Nome contiene la query
              {
                firstName: {
                  contains: searchQuery,
                  mode: 'insensitive'
                }
              },
              // Cognome contiene la query
              {
                lastName: {
                  contains: searchQuery,
                  mode: 'insensitive'
                }
              },
              // Nome completo contiene la query
              {
                fullName: {
                  contains: searchQuery,
                  mode: 'insensitive'
                }
              },
              // Telefono contiene la query (rimuovi caratteri non numerici)
              ...(searchQuery.match(/\d/) ? [{
                phone: {
                  contains: searchQuery.replace(/[^0-9]/g, ''),
                  mode: 'insensitive' as any
                }
              }] : [])
            ]
          }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        address: true,
        city: true,
        province: true,
        postalCode: true,
        codiceFiscale: true,
        partitaIva: true,
        createdAt: true
      },
      take: 10
    });
    
    logger.info(`[USER SEARCH] Found ${users.length} users matching query`);
    
    if (users.length === 0) {
      // Proviamo a cercare senza il filtro role per vedere se l'utente esiste ma con ruolo diverso
      const usersAnyRole = await prisma.user.findMany({
        where: {
          OR: [
            {
              email: {
                contains: searchQuery.toLowerCase(),
                mode: 'insensitive'
              }
            },
            {
              firstName: {
                contains: searchQuery,
                mode: 'insensitive'
              }
            },
            {
              lastName: {
                contains: searchQuery,
                mode: 'insensitive'
              }
            }
          ]
        },
        select: {
          role: true
        },
        take: 5
      });
      
      if (usersAnyRole.length > 0) {
        const roles = [...new Set(usersAnyRole.map(u => u.role))];
        logger.info(`[USER SEARCH] Found users with roles: ${roles.join(', ')}`);
        return res.json(ResponseFormatter.success(
          [],
          `Nessun ${roleFilter} trovato, ma esistono utenti con ruolo: ${roles.join(', ')}`
        ));
      }
      
      return res.json(ResponseFormatter.success(
        [],
        'Nessun utente trovato con i criteri specificati'
      ));
    }
    
    // Se c'è un solo risultato, restituiscilo direttamente
    if (users.length === 1) {
      logger.info(`[USER SEARCH] Single result: ${users[0].email}`);
      return res.json(ResponseFormatter.success(
        users[0],
        'Utente trovato'
      ));
    }
    
    // Se ci sono più risultati, restituisci la lista
    logger.info(`[USER SEARCH] Multiple results: ${users.map(u => u.email).join(', ')}`);
    return res.json(ResponseFormatter.success(
      users,
      `Trovati ${users.length} utenti`
    ));
    
  } catch (error) {
    logger.error('[USER SEARCH] Error:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella ricerca utente',
      'SEARCH_ERROR'
    ));
  }
});

// GET /users - Ottieni tutti gli utenti (solo per admin)
router.get('/', authenticate, requireAdmin, async (req: any, res) => {
  try {
    logger.info('Fetching all users for admin:', req.user.id);
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        profession: true,
        city: true,
        province: true,
        canSelfAssign: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: [
        { role: 'asc' },
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });
    
    logger.info(`Found ${users.length} users`);
    
    return res.json(ResponseFormatter.success(
      users,
      'Lista utenti recuperata con successo'
    ));
    
  } catch (error) {
    logger.error('Error fetching users list:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero della lista utenti',
      'FETCH_USERS_ERROR'
    ));
  }
});

// GET /users/my-clients - Get all clients for the current professional
// IMPORTANTE: Questo endpoint DEVE essere PRIMA di /:id altrimenti verrà interpretato come un ID
router.get('/my-clients', authenticate, async (req: any, res) => {
  try {
    // Solo i professionisti possono accedere a questa route
    if (req.user.role !== 'PROFESSIONAL') {
      return res.status(403).json(ResponseFormatter.error(
        'Solo i professionisti possono accedere a questa risorsa',
        'FORBIDDEN'
      ));
    }

    // Trova tutti i clienti unici dalle richieste assegnate al professionista
    const requests = await prisma.assistanceRequest.findMany({
      where: {
        professionalId: req.user.id
      },
      select: {
        client: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            province: true,
            postalCode: true
          }
        }
      },
      distinct: ['clientId']
    });

    // Rimuovi duplicati e null
    const uniqueClients = requests
      .map(r => r.client)
      .filter(Boolean)
      .reduce((acc: any[], client: any) => {
        if (!acc.find(c => c.id === client.id)) {
          acc.push(client);
        }
        return acc;
      }, []);

    return res.json(ResponseFormatter.success(
      uniqueClients,
      'Clienti recuperati con successo'
    ));
  } catch (error) {
    logger.error('Error fetching professional clients:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recuperare i clienti',
      'FETCH_ERROR'
    ));
  }
});

// GET /users/professionals - Ottieni lista professionisti (solo per admin)
// IMPORTANTE: Questo endpoint DEVE essere PRIMA di /:id altrimenti verrà interpretato come un ID
router.get('/professionals', authenticate, requireAdmin, async (req: any, res) => {
  try {
    logger.info('Fetching professionals list for admin:', req.user.id);
    
    const professionals = await prisma.user.findMany({
      where: {
        role: 'PROFESSIONAL'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        email: true,
        phone: true,
        profession: true,
        professionId: true,
        Profession: true,  // Relazione con tabella Profession
        city: true,
        province: true,
        canSelfAssign: true,  // AGGIUNTO!
        approvalStatus: true,  // Stato di approvazione
        approvedAt: true,      // Data approvazione
        approvedBy: true,      // Chi ha approvato
        rejectionReason: true, // Motivo rifiuto se presente
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });
    
    logger.info(`Found ${professionals.length} professionals`);
    
    return res.json(ResponseFormatter.success(
      professionals,
      'Lista professionisti recuperata con successo'
    ));
    
  } catch (error) {
    logger.error('Error fetching professionals list:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero della lista professionisti',
      'FETCH_PROFESSIONALS_ERROR'
    ));
  }
});

// Route per verificare lo stato delle immagini dell'utente
router.get('/image-status', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log('DEBUG - userId:', userId, 'userRole:', userRole);

    // Recupera i dati dell'utente
    const user = await userService.getUserById(userId);
    if (!user) {
      return res.status(404).json(ResponseFormatter.error(
        'Utente non trovato',
        'USER_NOT_FOUND'
      ));
    }

    // Recupera le impostazioni di sistema per l'obbligatorietà delle immagini
    const settings = await systemSettingsService.getSettingsByCategory('images');
    
    // Determina i requisiti delle immagini basati sul ruolo
    let avatarRequired = false;
    let recognitionImageRequired = false;
    
    settings.forEach((setting: any) => {
      if (setting.key === 'avatar_required_for_clients' && userRole === 'CLIENT') {
        avatarRequired = setting.value === 'true';
      } else if (setting.key === 'avatar_required_for_professionals' && userRole === 'PROFESSIONAL') {
        avatarRequired = setting.value === 'true';
      } else if (setting.key === 'recognition_image_required_for_clients' && userRole === 'CLIENT') {
        recognitionImageRequired = setting.value === 'true';
      } else if (setting.key === 'recognition_image_required_for_professionals' && userRole === 'PROFESSIONAL') {
        recognitionImageRequired = setting.value === 'true';
      }
    });

    // Verifica lo stato delle immagini
    const imageStatus = {
      avatar: {
        present: !!user.avatar,
        required: avatarRequired,
        missing: avatarRequired && !user.avatar
      },
      recognitionImage: {
        present: !!user.recognitionImage,
        required: recognitionImageRequired,
        missing: recognitionImageRequired && !user.recognitionImage
      }
    };

    // Determina se ci sono immagini mancanti
    const hasMissingImages = imageStatus.avatar.missing || imageStatus.recognitionImage.missing;

    return res.status(200).json(ResponseFormatter.success({
      imageStatus,
      hasMissingImages,
      userRole
    }));

  } catch (error) {
    logger.error('Errore nel recupero dello stato delle immagini:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore interno del server',
      'INTERNAL_SERVER_ERROR'
    ));
  }
});

// GET /users/:id - Ottieni informazioni pubbliche di un utente (per admin o stesso utente)
// IMPORTANTE: Questo endpoint con parametro DEVE essere DOPO tutti gli endpoint statici
router.get('/:id', authenticate, async (req: any, res) => {
  try {
    const requestedUserId = req.params.id;
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;
    
    // Verifica permessi: solo admin o stesso utente
    if (currentUserRole !== 'ADMIN' && currentUserRole !== 'SUPER_ADMIN' && currentUserId !== requestedUserId) {
      return res.status(403).json(ResponseFormatter.error('Non autorizzato', 'FORBIDDEN'));
    }
    
    const user = await prisma.user.findUnique({
      where: { id: requestedUserId },
      include: {
        Profession: true  // Include la professione tabellata
      }
    });
    
    if (!user) {
      return res.status(404).json(ResponseFormatter.error('Utente non trovato', 'USER_NOT_FOUND'));
    }
    
    // Rimuovi informazioni sensibili se non è admin o stesso utente
    const isOwnProfile = currentUserId === requestedUserId;
    const isAdmin = currentUserRole === 'ADMIN' || currentUserRole === 'SUPER_ADMIN';
    
    if (!isOwnProfile && !isAdmin) {
      // Informazioni pubbliche limitate
      const publicUser = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        profession: user.profession,
        city: user.city,
        province: user.province
      };
      return res.json(ResponseFormatter.success(publicUser));
    }
    
    // Informazioni complete per admin o proprietario
    const formattedUser = formatUser(user);
    return res.json(ResponseFormatter.success(formattedUser));
    
  } catch (error) {
    logger.error('Error fetching user by id:', error);
    return res.status(500).json(ResponseFormatter.error('Errore nel recupero utente', 'FETCH_USER_ERROR'));
  }
});



// PUT /users/:id/approve - Approva un professionista (solo admin)
router.put('/:id/approve', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    
    logger.info(`[PROFESSIONAL APPROVAL] Admin ${adminId} approving professional ${id}`);
    
    // Verifica che l'utente esista e sia un professionista
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        approvalStatus: true
      }
    });
    
    if (!user) {
      return res.status(404).json(ResponseFormatter.error(
        'Professionista non trovato',
        'USER_NOT_FOUND'
      ));
    }
    
    if (user.role !== 'PROFESSIONAL') {
      return res.status(400).json(ResponseFormatter.error(
        'Questo utente non è un professionista',
        'NOT_A_PROFESSIONAL'
      ));
    }
    
    // Aggiorna lo stato di approvazione
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        approvalStatus: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: adminId,
        updatedAt: new Date()
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        approvalStatus: true,
        approvedAt: true,
        approvedBy: true
      }
    });
    
    // Crea un audit log
    await prisma.auditLog.create({
      data: {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: adminId,
        userEmail: req.user.email,
        userRole: req.user.role,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        action: 'PROFESSIONAL_APPROVED',
        entityType: 'User',
        entityId: id,
        endpoint: req.originalUrl,
        method: req.method,
        newValues: {
          approvalStatus: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: adminId
        },
        success: true,
        severity: 'INFO',
        category: 'ADMIN_ACTION'
      }
    });
    
    logger.info(`✅ Professional ${user.email} approved by admin ${adminId}`);
    
    return res.json(ResponseFormatter.success(
      updatedUser,
      `Professionista ${user.firstName} ${user.lastName} approvato con successo`
    ));
    
  } catch (error) {
    logger.error('Error approving professional:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'approvazione del professionista',
      'APPROVAL_ERROR'
    ));
  }
});

// PUT /users/:id/reject - Rifiuta un professionista (solo admin)
router.put('/:id/reject', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const adminId = req.user.id;
    
    logger.info(`[PROFESSIONAL REJECTION] Admin ${adminId} rejecting professional ${id}`);
    
    // Valida che il motivo sia fornito
    if (!rejectionReason || typeof rejectionReason !== 'string' || rejectionReason.trim().length === 0) {
      return res.status(400).json(ResponseFormatter.error(
        'Motivo del rifiuto obbligatorio',
        'REASON_REQUIRED'
      ));
    }
    
    // Verifica che l'utente esista e sia un professionista
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        approvalStatus: true
      }
    });
    
    if (!user) {
      return res.status(404).json(ResponseFormatter.error(
        'Professionista non trovato',
        'USER_NOT_FOUND'
      ));
    }
    
    if (user.role !== 'PROFESSIONAL') {
      return res.status(400).json(ResponseFormatter.error(
        'Questo utente non è un professionista',
        'NOT_A_PROFESSIONAL'
      ));
    }
    
    // Aggiorna lo stato di rifiuto
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        approvalStatus: 'REJECTED',
        rejectionReason: rejectionReason.trim(),
        approvedBy: adminId,
        updatedAt: new Date()
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        approvalStatus: true,
        rejectionReason: true,
        approvedBy: true
      }
    });
    
    // Crea un audit log
    await prisma.auditLog.create({
      data: {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: adminId,
        userEmail: req.user.email,
        userRole: req.user.role,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        action: 'PROFESSIONAL_REJECTED',
        entityType: 'User',
        entityId: id,
        endpoint: req.originalUrl,
        method: req.method,
        newValues: {
          approvalStatus: 'REJECTED',
          rejectionReason: rejectionReason.trim(),
          approvedBy: adminId
        },
        success: true,
        severity: 'INFO',
        category: 'ADMIN_ACTION'
      }
    });
    
    logger.info(`❌ Professional ${user.email} rejected by admin ${adminId}. Reason: ${rejectionReason}`);
    
    return res.json(ResponseFormatter.success(
      updatedUser,
      `Professionista ${user.firstName} ${user.lastName} rifiutato`
    ));
    
  } catch (error) {
    logger.error('Error rejecting professional:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel rifiuto del professionista',
      'REJECTION_ERROR'
    ));
  }
});

export default router;
