import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { ResponseFormatter } from '../utils/responseFormatter';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Schema validazione
const updateSubcategoriesSchema = z.object({
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
        Subcategory: {
          include: {
            Category: true
          }
        }
      }
    });
    
    // ✅ USO CORRETTO del ResponseFormatter nella route
    return res.json(ResponseFormatter.success(
      professionalSubcategories,
      'Sottocategorie professionista recuperate con successo'
    ));
  } catch (error) {
    logger.error('Error fetching professional subcategories:', error);
    // ✅ USO CORRETTO del ResponseFormatter per errori
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
      // ✅ USO CORRETTO del ResponseFormatter
      return res.status(403).json(ResponseFormatter.error(
        'Solo i professionisti possono gestire le sottocategorie',
        'UNAUTHORIZED_ROLE'
      ));
    }
    
    // Valida i dati
    let validatedData;
    try {
      validatedData = updateSubcategoriesSchema.parse(req.body);
    } catch (validationError) {
      logger.error('Subcategories validation error:', validationError);
      // ✅ USO CORRETTO del ResponseFormatter
      return res.status(400).json(ResponseFormatter.error('Dati non validi', 'VALIDATION_ERROR'));
    }
    
    const { subcategoryIds } = validatedData;
    
    // Verifica che tutte le sottocategorie esistano
    const existingSubcategories = await prisma.subcategory.findMany({
      where: {
        id: { in: subcategoryIds },
        isActive: true
      }
    });
    
    if (existingSubcategories.length !== subcategoryIds.length) {
      // ✅ USO CORRETTO del ResponseFormatter
      return res.status(400).json(ResponseFormatter.error(
        'Una o più sottocategorie non sono valide',
        'INVALID_SUBCATEGORIES'
      ));
    }
    
    // Inizia una transazione per aggiornare le sottocategorie
    await prisma.$transaction(async (tx) => {
      // Ottieni le sottocategorie attuali
      const currentSubcategories = await tx.professionalUserSubcategory.findMany({
        where: { userId: userId }
      });
      
      const currentSubcategoryIds = currentSubcategories.map(ps => ps.subcategoryId);
      
      // Determina quali aggiungere e quali rimuovere
      const toAdd = subcategoryIds.filter(id => !currentSubcategoryIds.includes(id));
      const toRemove = currentSubcategoryIds.filter(id => !subcategoryIds.includes(id));
      
      // Rimuovi sottocategorie non più selezionate
      if (toRemove.length > 0) {
        await tx.professionalUserSubcategory.deleteMany({
          where: {
            userId: userId,
            subcategoryId: { in: toRemove }
          }
        });
      }
      
      // Aggiungi nuove sottocategorie
      if (toAdd.length > 0) {
        const newSubcategories = toAdd.map(subcategoryId => ({
          id: `${userId}-${subcategoryId}`, // ID composto
          userId: userId,
          subcategoryId: subcategoryId,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }));
        
        await tx.professionalUserSubcategory.createMany({
          data: newSubcategories
        });
      }
      
      // Aggiorna le sottocategorie esistenti che sono state mantenute
      const toUpdate = subcategoryIds.filter(id => currentSubcategoryIds.includes(id));
      if (toUpdate.length > 0) {
        await tx.professionalUserSubcategory.updateMany({
          where: {
            userId: userId,
            subcategoryId: { in: toUpdate }
          },
          data: {
            isActive: true,
            updatedAt: new Date()
          }
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
        Subcategory: {
          include: {
            Category: true
          }
        }
      }
    });
    
    // ✅ USO CORRETTO del ResponseFormatter
    return res.json(ResponseFormatter.success(
      updatedSubcategories,
      'Sottocategorie aggiornate con successo'
    ));
    
  } catch (error) {
    logger.error('Error updating professional subcategories:', error);
    // ✅ USO CORRETTO del ResponseFormatter
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
      // ✅ USO CORRETTO del ResponseFormatter
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
      // ✅ USO CORRETTO del ResponseFormatter
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
    
    // ✅ USO CORRETTO del ResponseFormatter
    return res.json(ResponseFormatter.success(
      null,
      'Sottocategoria rimossa con successo'
    ));
    
  } catch (error) {
    logger.error('Error removing professional subcategory:', error);
    // ✅ USO CORRETTO del ResponseFormatter
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella rimozione della sottocategoria',
      'SUBCATEGORY_REMOVE_ERROR'
    ));
  }
});

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

// GET /user/subcategories/:userId - Ottieni le sottocategorie di un professionista specifico (ADMIN ONLY)
router.get('/subcategories/:userId', authenticate, requireAdmin, async (req: any, res) => {
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
        Subcategory: {
          include: {
            Category: true
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
    
    // Valida i dati
    let validatedData;
    try {
      validatedData = updateSubcategoriesSchema.parse(req.body);
    } catch (validationError) {
      logger.error('Subcategories validation error:', validationError);
      return res.status(400).json(ResponseFormatter.error('Dati non validi', 'VALIDATION_ERROR'));
    }
    
    const { subcategoryIds } = validatedData;
    
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
      // Ottieni le sottocategorie attuali
      const currentSubcategories = await tx.professionalUserSubcategory.findMany({
        where: { userId: userId }
      });
      
      const currentSubcategoryIds = currentSubcategories.map(ps => ps.subcategoryId);
      
      // Determina quali aggiungere e quali rimuovere
      const toAdd = subcategoryIds.filter(id => !currentSubcategoryIds.includes(id));
      const toRemove = currentSubcategoryIds.filter(id => !subcategoryIds.includes(id));
      
      // Rimuovi sottocategorie non più selezionate
      if (toRemove.length > 0) {
        await tx.professionalUserSubcategory.deleteMany({
          where: {
            userId: userId,
            subcategoryId: { in: toRemove }
          }
        });
      }
      
      // Aggiungi nuove sottocategorie
      if (toAdd.length > 0) {
        const newSubcategories = toAdd.map(subcategoryId => ({
          id: `${userId}-${subcategoryId}`, // ID composto
          userId: userId,
          subcategoryId: subcategoryId,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }));
        
        await tx.professionalUserSubcategory.createMany({
          data: newSubcategories
        });
      }
      
      // Aggiorna le sottocategorie esistenti che sono state mantenute
      const toUpdate = subcategoryIds.filter(id => currentSubcategoryIds.includes(id));
      if (toUpdate.length > 0) {
        await tx.professionalUserSubcategory.updateMany({
          where: {
            userId: userId,
            subcategoryId: { in: toUpdate }
          },
          data: {
            isActive: true,
            updatedAt: new Date()
          }
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
        Subcategory: {
          include: {
            Category: true
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

export default router;
