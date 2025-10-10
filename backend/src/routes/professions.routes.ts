// backend/src/routes/professions.routes.ts
import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { ResponseFormatter } from '../utils/responseFormatter';
import { logger } from '../utils/logger';

const router = Router();

// Helper function per verificare se è admin
function isAdmin(req: any): boolean {
  return req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';
}

/**
 * GET /api/professions
 * Ottiene la lista delle professioni (pubblico)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { isActive } = req.query;
    
    const where = isActive !== undefined 
      ? { isActive: isActive === 'true' }
      : {};

    const professions = await prisma.profession.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    return res.json(ResponseFormatter.success(
      professions,
      'Professions retrieved successfully'
    ));
  } catch (error: any) {
    logger.error('Error fetching professions:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Failed to fetch professions',
      'FETCH_ERROR',
      error.message
    ));
  }
});

/**
 * GET /api/professions/:id
 * Ottiene una singola professione
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const profession = await prisma.profession.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            city: true
          }
        }
      }
    });

    if (!profession) {
      return res.status(404).json(ResponseFormatter.error(
        'Profession not found',
        'NOT_FOUND'
      ));
    }

    return res.json(ResponseFormatter.success(
      profession,
      'Profession retrieved successfully'
    ));
  } catch (error: any) {
    logger.error('Error fetching profession:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Failed to fetch profession',
      'FETCH_ERROR',
      error.message
    ));
  }
});

/**
 * POST /api/professions
 * Crea una nuova professione (solo admin)
 */
router.post('/', authenticate, async (req: any, res: Response) => {
  try {
    // Verifica permessi admin
    if (!isAdmin(req)) {
      return res.status(403).json(ResponseFormatter.error(
        'Accesso negato. Solo gli amministratori possono creare professioni.',
        'FORBIDDEN'
      ));
    }

    const { name, slug, description, isActive, displayOrder } = req.body;

    // Validazione
    if (!name || !slug) {
      return res.status(400).json(ResponseFormatter.error(
        'Name and slug are required',
        'VALIDATION_ERROR'
      ));
    }

    // Verifica unicità
    const existing = await prisma.profession.findFirst({
      where: {
        OR: [
          { name },
          { slug }
        ]
      }
    });

    if (existing) {
      return res.status(409).json(ResponseFormatter.error(
        'Profession with this name or slug already exists',
        'ALREADY_EXISTS'
      ));
    }

    const profession = await prisma.profession.create({
      data: {
        name,
        slug,
        description,
        isActive: isActive ?? true,
        displayOrder: displayOrder ?? 0
      }
    });

    return res.status(201).json(ResponseFormatter.success(
      profession,
      'Profession created successfully'
    ));
  } catch (error: any) {
    logger.error('Error creating profession:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Failed to create profession',
      'CREATE_ERROR',
      error.message
    ));
  }
});

/**
 * PUT /api/professions/:id
 * Aggiorna una professione (solo admin)
 */
router.put('/:id', authenticate, async (req: any, res: Response) => {
  try {
    // Verifica permessi admin
    if (!isAdmin(req)) {
      return res.status(403).json(ResponseFormatter.error(
        'Accesso negato. Solo gli amministratori possono modificare professioni.',
        'FORBIDDEN'
      ));
    }

    const { id } = req.params;
    const { name, slug, description, isActive, displayOrder } = req.body;

    // Verifica esistenza
    const existing = await prisma.profession.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json(ResponseFormatter.error(
        'Profession not found',
        'NOT_FOUND'
      ));
    }

    // Verifica unicità se cambia nome o slug
    if (name !== existing.name || slug !== existing.slug) {
      const duplicate = await prisma.profession.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                { name: name || existing.name },
                { slug: slug || existing.slug }
              ]
            }
          ]
        }
      });

      if (duplicate) {
        return res.status(409).json(ResponseFormatter.error(
          'Another profession with this name or slug already exists',
          'DUPLICATE'
        ));
      }
    }

    const profession = await prisma.profession.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        slug: slug ?? existing.slug,
        description: description !== undefined ? description : existing.description,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        displayOrder: displayOrder !== undefined ? displayOrder : existing.displayOrder,
        updatedAt: new Date()
      }
    });

    return res.json(ResponseFormatter.success(
      profession,
      'Profession updated successfully'
    ));
  } catch (error: any) {
    logger.error('Error updating profession:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Failed to update profession',
      'UPDATE_ERROR',
      error.message
    ));
  }
});

/**
 * DELETE /api/professions/:id
 * Elimina una professione (solo admin)
 */
router.delete('/:id', authenticate, async (req: any, res: Response) => {
  try {
    // Verifica permessi admin
    if (!isAdmin(req)) {
      return res.status(403).json(ResponseFormatter.error(
        'Accesso negato. Solo gli amministratori possono eliminare professioni.',
        'FORBIDDEN'
      ));
    }

    const { id } = req.params;

    // Verifica che non ci siano utenti con questa professione
    const usersCount = await prisma.user.count({
      where: { professionId: id }
    });

    if (usersCount > 0) {
      return res.status(409).json(ResponseFormatter.error(
        `Cannot delete profession with ${usersCount} associated users`,
        'HAS_USERS'
      ));
    }

    await prisma.profession.delete({
      where: { id }
    });

    return res.json(ResponseFormatter.success(
      null,
      'Profession deleted successfully'
    ));
  } catch (error: any) {
    logger.error('Error deleting profession:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Failed to delete profession',
      'DELETE_ERROR',
      error.message
    ));
  }
});

/**
 * PUT /api/professions/user/:userId
 * Aggiorna la professione di un utente E associa automaticamente le categorie (solo admin)
 */
router.put('/user/:userId', authenticate, async (req: any, res: Response) => {
  try {
    // Verifica permessi admin
    if (!isAdmin(req)) {
      return res.status(403).json(ResponseFormatter.error(
        'Accesso negato. Solo gli amministratori possono modificare la professione degli utenti.',
        'FORBIDDEN'
      ));
    }

    const { userId } = req.params;
    const { professionId } = req.body;
    
    logger.info(`📝 Updating profession for user ${userId}`);
    logger.info(`   New professionId: ${professionId}`);

    // Verifica che l'utente esista
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json(ResponseFormatter.error(
        'User not found',
        'USER_NOT_FOUND'
      ));
    }

    // Verifica che la professione esista (se specificata)
    if (professionId) {
      const profession = await prisma.profession.findUnique({
        where: { id: professionId }
      });

      if (!profession) {
        return res.status(404).json(ResponseFormatter.error(
          'Profession not found',
          'PROFESSION_NOT_FOUND'
        ));
      }
    }

    // Aggiorna l'utente
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        professionId,
        updatedAt: new Date()
      },
      include: {
        Profession: true
      }
    });
    
    logger.info(`✅ User updated successfully:`);
    logger.info(`   ProfessionId: ${updatedUser.professionId}`);
    logger.info(`   Profession: ${updatedUser.Profession?.name || 'none'}`);

    // NOTA: Le categorie associate alla professione sono già definite nella tabella ProfessionCategory
    // Non associamo automaticamente le sottocategorie - saranno selezionate manualmente
    // dall'admin o dal professionista stesso
    if (professionId && user.role === 'PROFESSIONAL') {
      logger.info(`✅ Profession set for professional ${userId}`);
      logger.info(`   The categories for this profession are defined in ProfessionCategory table`);
      logger.info(`   Subcategories must be manually selected by admin or professional`);
      
      // Opzionale: possiamo restituire le categorie associate per informazione
      const professionCategories = await prisma.professionCategory.findMany({
        where: {
          professionId: professionId,
          isActive: true
        },
        include: {
          category: true
        }
      });
      
      logger.info(`   This profession has ${professionCategories.length} associated categories:`);
      professionCategories.forEach(pc => {
        logger.info(`     - ${pc.category.name}`);
      });
    }

    return res.json(ResponseFormatter.success(
      updatedUser,
      'User profession updated successfully'
    ));
  } catch (error: any) {
    logger.error('Error updating user profession:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Failed to update user profession',
      'UPDATE_ERROR',
      error.message
    ));
  }
});

export default router;
