import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { ResponseFormatter, formatUser } from '../utils/responseFormatter';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { z } from 'zod';

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
    const userId = req.user.id;
    
    // Recupera l'utente completo dal database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json(ResponseFormatter.error('Utente non trovato', 'USER_NOT_FOUND'));
    }
    
    // Usa ResponseFormatter per output consistente
    const formattedUser = formatUser(user);
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
    const userId = req.user.id;
    
    // Valida i dati
    let validatedData;
    try {
      validatedData = profileUpdateSchema.parse(req.body);
    } catch (validationError) {
      logger.error('Profile validation error:', validationError);
      return res.status(400).json(ResponseFormatter.error('Dati profilo non validi', 'VALIDATION_ERROR'));
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
    
    // Formatta e restituisci l'utente aggiornato
    const formattedUser = formatUser(updatedUser);
    return res.json(ResponseFormatter.success(
      formattedUser,
      'Profilo aggiornato con successo'
    ));
    
  } catch (error) {
    logger.error('Error updating user profile:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento del profilo',
      'PROFILE_UPDATE_ERROR'
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
        city: true,
        province: true,
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
      where: { id: requestedUserId }
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

export default router;
