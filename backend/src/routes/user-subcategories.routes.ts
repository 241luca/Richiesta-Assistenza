import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { ResponseFormatter } from '../utils/responseFormatter';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Schema validazione aggiornato per includere experienceLevel
const updateSubcategoriesSchema = z.object({
  subcategories: z.array(z.object({
    subcategoryId: z.string().uuid(),
    experienceLevel: z.enum(['BASIC', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional().default('INTERMEDIATE')
  }))
});

// Schema per compatibilità con vecchio formato
const updateSubcategoriesLegacySchema = z.object({
  subcategoryIds: z.array(z.string().uuid())
});

// GET /user/subcategories - Ottieni le sottocategorie del professionista autenticato
router.get('/subcategories', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Solo i professionisti possono avere sottocategorie
    if (userRole !== 'PROFESSIONAL') {
      return res.json(ResponseFormatter.success([], 'Nessuna sottocategoria per questo ruolo'));
    }
    
    // Recupera le sottocategorie associate al professionista
    const professionalSubcategories = await prisma.professionalUserSubcategory.findMany({
      where: { 
        userId: userId,
        isActive: true 
      },
      include: {
        subcategory: {
          include: {
            category: true
          }
        }
      }
    });
    
    return res.json(ResponseFormatter.success(
      professionalSubcategories,
      'Sottocategorie professionista recuperate con successo'
    ));
  } catch (error) {
    logger.error('Error fetching professional subcategories:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero delle sottocategorie',
      'SUBCATEGORIES_FETCH_ERROR'
    ));
  }
});

// PUT /user/subcategories - Aggiorna le sottocategorie del professionista
router.put('/subcategories', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Solo i professionisti possono aggiornare le loro sottocategorie
    if (userRole !== 'PROFESSIONAL') {
      return res.status(403).json(ResponseFormatter.error(
        'Solo i professionisti possono gestire le sottocategorie',
        'UNAUTHORIZED_ROLE'
      ));
    }
    
    // Determina quale formato è stato inviato
    let subcategoriesToUpdate: Array<{subcategoryId: string, experienceLevel: string}> = [];
    
    // Prova il nuovo formato con experienceLevel
    if (req.body.subcategories && Array.isArray(req.body.subcategories)) {
      const validatedData = updateSubcategoriesSchema.parse(req.body);
      subcategoriesToUpdate = validatedData.subcategories;
    } 
    // Fallback al vecchio formato per compatibilità
    else if (req.body.subcategoryIds && Array.isArray(req.body.subcategoryIds)) {
      const validatedData = updateSubcategoriesLegacySchema.parse(req.body);
      subcategoriesToUpdate = validatedData.subcategoryIds.map(id => ({
        subcategoryId: id,
        experienceLevel: 'INTERMEDIATE'
      }));
    } else {
      return res.status(400).json(ResponseFormatter.error('Formato dati non valido', 'INVALID_FORMAT'));
    }
    
    const subcategoryIds = subcategoriesToUpdate.map(s => s.subcategoryId);
    
    // Verifica che tutte le sottocategorie esistano
    const existingSubcategories = await prisma.subcategory.findMany({
      where: {
        id: { in: subcategoryIds },
        isActive: true
      }
    });
    
    if (existingSubcategories.length !== subcategoryIds.length) {
      return res.status(400).json(ResponseFormatter.error(
        'Una o più sottocategorie non sono valide',
        'INVALID_SUBCATEGORIES'
      ));
    }
    
    // Inizia una transazione per aggiornare le sottocategorie
    await prisma.$transaction(async (tx) => {
      // Rimuovi tutte le sottocategorie esistenti
      await tx.professionalUserSubcategory.deleteMany({
        where: { userId: userId }
      });
      
      // Aggiungi le nuove sottocategorie con experienceLevel
      if (subcategoriesToUpdate.length > 0) {
        const newSubcategories = subcategoriesToUpdate.map(item => ({
          id: `${userId}-${item.subcategoryId}`,
          userId: userId,
          subcategoryId: item.subcategoryId,
          experienceLevel: item.experienceLevel,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }));
        
        await tx.professionalUserSubcategory.createMany({
          data: newSubcategories
        });
      }
    });
    
    // Recupera le sottocategorie aggiornate
    const updatedSubcategories = await prisma.professionalUserSubcategory.findMany({
      where: { 
        userId: userId,
        isActive: true 
      },
      include: {
        subcategory: {
          include: {
            category: true
          }
        }
      }
    });
    
    return res.json(ResponseFormatter.success(
      updatedSubcategories,
      'Sottocategorie aggiornate con successo'
    ));
    
  } catch (error) {
    logger.error('Error updating professional subcategories:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento delle sottocategorie',
      'SUBCATEGORIES_UPDATE_ERROR'
    ));
  }
});

// DELETE /user/subcategories/:subcategoryId - Rimuovi una singola sottocategoria
router.delete('/subcategories/:subcategoryId', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { subcategoryId } = req.params;
    
    // Solo i professionisti possono rimuovere le loro sottocategorie
    if (userRole !== 'PROFESSIONAL') {
      return res.status(403).json(ResponseFormatter.error(
        'Solo i professionisti possono gestire le sottocategorie',
        'UNAUTHORIZED_ROLE'
      ));
    }
    
    // Verifica che la relazione esista
    const existingRelation = await prisma.professionalUserSubcategory.findUnique({
      where: {
        userId_subcategoryId: {
          userId: userId,
          subcategoryId: subcategoryId
        }
      }
    });
    
    if (!existingRelation) {
      return res.status(404).json(ResponseFormatter.error(
        'Sottocategoria non trovata per questo professionista',
        'SUBCATEGORY_NOT_FOUND'
      ));
    }
    
    // Rimuovi la relazione
    await prisma.professionalUserSubcategory.delete({
      where: {
        userId_subcategoryId: {
          userId: userId,
          subcategoryId: subcategoryId
        }
      }
    });
    
    return res.json(ResponseFormatter.success(
      null,
      'Sottocategoria rimossa con successo'
    ));
    
  } catch (error) {
    logger.error('Error removing professional Subcategory:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella rimozione della sottocategoria',
      'SUBCATEGORY_REMOVE_ERROR'
    ));
  }
});

// Middleware per verificare se l'utente è admin o il professionista stesso
const canAccessUserData = (req: any, res: any, next: any) => {
  const { userId } = req.params;
  const requesterId = req.user.id;
  const requesterRole = req.user.role;
  
  // Admin può accedere a tutto
  if (requesterRole === 'ADMIN' || requesterRole === 'SUPER_ADMIN') {
    return next();
  }
  
  // Il professionista può accedere solo ai propri dati
  if (requesterRole === 'PROFESSIONAL' && requesterId === userId) {
    return next();
  }
  
  return res.status(403).json(ResponseFormatter.error(
    'Accesso negato. Non autorizzato ad accedere a questi dati.',
    'FORBIDDEN'
  ));
};

// Middleware per verificare se l'utente è admin (solo admin)
const requireAdmin = (req: any, res: any, next: any) => {
  console.log(`User role check: ${req.user?.role}`);
  if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
    console.log(`Access denied for role: ${req.user?.role}`);
    return res.status(403).json(ResponseFormatter.error(
      'Accesso negato. Solo gli amministratori possono accedere a questa risorsa.',
      'FORBIDDEN'
    ));
  }
  next();
};

// GET /user/subcategories/:userId - Ottieni le sottocategorie di un professionista specifico
router.get('/subcategories/:userId', authenticate, canAccessUserData, async (req: any, res) => {
  try {
    const { userId } = req.params;
    
    // Verifica che l'utente sia un professionista
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    if (!user || user.role !== 'PROFESSIONAL') {
      return res.status(404).json(ResponseFormatter.error(
        'Professionista non trovato',
        'PROFESSIONAL_NOT_FOUND'
      ));
    }
    
    // Recupera le sottocategorie associate al professionista
    const professionalSubcategories = await prisma.professionalUserSubcategory.findMany({
      where: { 
        userId: userId,
        isActive: true 
      },
      include: {
        subcategory: {
          include: {
            category: true
          }
        }
      }
    });
    
    return res.json(ResponseFormatter.success(
      professionalSubcategories,
      'Sottocategorie professionista recuperate con successo'
    ));
  } catch (error) {
    logger.error('Error fetching professional subcategories for admin:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero delle sottocategorie',
      'SUBCATEGORIES_FETCH_ERROR'
    ));
  }
});

// PUT /user/subcategories/:userId - Aggiorna le sottocategorie di un professionista specifico (ADMIN ONLY)
router.put('/subcategories/:userId', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const { userId } = req.params;
    
    // Verifica che l'utente sia un professionista
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    if (!user || user.role !== 'PROFESSIONAL') {
      return res.status(404).json(ResponseFormatter.error(
        'Professionista non trovato',
        'PROFESSIONAL_NOT_FOUND'
      ));
    }
    
    // Determina quale formato è stato inviato
    let subcategoriesToUpdate: Array<{subcategoryId: string, experienceLevel: string}> = [];
    
    // Prova il nuovo formato con experienceLevel
    if (req.body.subcategories && Array.isArray(req.body.subcategories)) {
      const validatedData = updateSubcategoriesSchema.parse(req.body);
      subcategoriesToUpdate = validatedData.subcategories;
    } 
    // Fallback al vecchio formato per compatibilità
    else if (req.body.subcategoryIds && Array.isArray(req.body.subcategoryIds)) {
      const validatedData = updateSubcategoriesLegacySchema.parse(req.body);
      subcategoriesToUpdate = validatedData.subcategoryIds.map(id => ({
        subcategoryId: id,
        experienceLevel: 'INTERMEDIATE'
      }));
    } else {
      return res.status(400).json(ResponseFormatter.error('Formato dati non valido', 'INVALID_FORMAT'));
    }
    
    const subcategoryIds = subcategoriesToUpdate.map(s => s.subcategoryId);
    
    // Verifica che tutte le sottocategorie esistano
    const existingSubcategories = await prisma.subcategory.findMany({
      where: {
        id: { in: subcategoryIds },
        isActive: true
      }
    });
    
    if (existingSubcategories.length !== subcategoryIds.length) {
      return res.status(400).json(ResponseFormatter.error(
        'Una o più sottocategorie non sono valide',
        'INVALID_SUBCATEGORIES'
      ));
    }
    
    // Inizia una transazione per aggiornare le sottocategorie
    await prisma.$transaction(async (tx) => {
      // Rimuovi tutte le sottocategorie esistenti
      await tx.professionalUserSubcategory.deleteMany({
        where: { userId: userId }
      });
      
      // Aggiungi le nuove sottocategorie con experienceLevel
      if (subcategoriesToUpdate.length > 0) {
        const newSubcategories = subcategoriesToUpdate.map(item => ({
          id: `${userId}-${item.subcategoryId}`,
          userId: userId,
          subcategoryId: item.subcategoryId,
          experienceLevel: item.experienceLevel,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }));
        
        await tx.professionalUserSubcategory.createMany({
          data: newSubcategories
        });
      }
    });
    
    // Recupera le sottocategorie aggiornate
    const updatedSubcategories = await prisma.professionalUserSubcategory.findMany({
      where: { 
        userId: userId,
        isActive: true 
      },
      include: {
        subcategory: {
          include: {
            category: true
          }
        }
      }
    });
    
    logger.info(`Admin ${req.user.id} updated subcategories for professional ${userId}`);
    
    return res.json(ResponseFormatter.success(
      updatedSubcategories,
      'Sottocategorie professionista aggiornate con successo dall\'amministratore'
    ));
    
  } catch (error) {
    logger.error('Error updating professional subcategories by admin:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento delle sottocategorie',
      'SUBCATEGORIES_UPDATE_ERROR'
    ));
  }
});

// POST /user/subcategories/:userId/add - Aggiungi una singola sottocategoria (ADMIN ONLY)
router.post('/subcategories/:userId/add', authenticate, requireAdmin, async (req: any, res) => {
  try {
    logger.info(`POST /user/subcategories/:userId/add called by user ${req.user.id} with role ${req.user.role}`);
    
    const { userId } = req.params;
    const { subcategoryId, experienceLevel = 'INTERMEDIATE' } = req.body;
    
    logger.info(`Request params: userId=${userId}, subcategoryId=${subcategoryId}, experienceLevel=${experienceLevel}`);
    
    // Verifica che l'utente sia un professionista
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    if (!user || user.role !== 'PROFESSIONAL') {
      return res.status(404).json(ResponseFormatter.error(
        'Professionista non trovato',
        'PROFESSIONAL_NOT_FOUND'
      ));
    }
    
    // Verifica che la sottocategoria esista
    const subcategory = await prisma.subcategory.findUnique({
      where: { id: subcategoryId }
    });
    
    if (!subcategory) {
      return res.status(404).json(ResponseFormatter.error(
        'Sottocategoria non trovata',
        'SUBCATEGORY_NOT_FOUND'
      ));
    }
    
    // Verifica che non esista già
    const existing = await prisma.professionalUserSubcategory.findUnique({
      where: {
        userId_subcategoryId: {
          userId: userId,
          subcategoryId: subcategoryId
        }
      }
    });
    
    if (existing) {
      return res.status(400).json(ResponseFormatter.error(
        'Sottocategoria già assegnata a questo professionista',
        'SUBCATEGORY_ALREADY_EXISTS'
      ));
    }
    
    // Crea la nuova relazione
    const newRelation = await prisma.professionalUserSubcategory.create({
      data: {
        id: `${userId}-${subcategoryId}`,
        userId: userId,
        subcategoryId: subcategoryId,
        experienceLevel: experienceLevel,
        isActive: true,
        updatedAt: new Date()
      },
      include: {
        subcategory: {
          include: {
            category: true
          }
        }
      }
    });
    
    return res.json(ResponseFormatter.success(
      newRelation,
      'Sottocategoria aggiunta con successo'
    ));
    
  } catch (error) {
    logger.error('Error adding Subcategory:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiunta della sottocategoria',
      'SUBCATEGORY_ADD_ERROR'
    ));
  }
});

// DELETE /user/subcategories/:userId/:subcategoryId - Rimuovi una sottocategoria (ADMIN ONLY)
router.delete('/subcategories/:userId/:subcategoryId', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const { userId, subcategoryId } = req.params;
    
    // Verifica che la relazione esista
    const existingRelation = await prisma.professionalUserSubcategory.findUnique({
      where: {
        userId_subcategoryId: {
          userId: userId,
          subcategoryId: subcategoryId
        }
      }
    });
    
    if (!existingRelation) {
      return res.status(404).json(ResponseFormatter.error(
        'Sottocategoria non trovata per questo professionista',
        'SUBCATEGORY_NOT_FOUND'
      ));
    }
    
    // Rimuovi la relazione
    await prisma.professionalUserSubcategory.delete({
      where: {
        userId_subcategoryId: {
          userId: userId,
          subcategoryId: subcategoryId
        }
      }
    });
    
    logger.info(`Admin ${req.user.id} removed subcategory ${subcategoryId} from professional ${userId}`);
    
    return res.json(ResponseFormatter.success(
      null,
      'Sottocategoria rimossa con successo'
    ));
    
  } catch (error) {
    logger.error('Error removing professional Subcategory:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella rimozione della sottocategoria',
      'SUBCATEGORY_REMOVE_ERROR'
    ));
  }
});

export default router;
