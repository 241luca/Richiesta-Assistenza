import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { ResponseFormatter } from '../utils/responseFormatter';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/professional-details/:id
 * Ottieni TUTTI i dettagli di un professionista inclusa professione e competenze
 */
router.get('/:id', authenticate, async (req: any, res) => {
  try {
    const professionalId = req.params.id;
    
    logger.info(`📋 Fetching professional details for ID: ${professionalId}`);
    
    // Recupera TUTTO in una query
    const professional = await prisma.user.findUnique({
      where: { id: professionalId },
      include: {
        // Professione dalla tabella Profession
        Profession: true,
        
        // Competenze/sottocategorie assegnate
        ProfessionalUserSubcategory: {
          include: {
            subcategory: {
              include: {
                category: true
              }
            }
          },
          where: {
            isActive: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });
    
    if (!professional) {
      logger.warn(`Professional not found: ${professionalId}`);
      return res.status(404).json(ResponseFormatter.error(
        'Professionista non trovato',
        'NOT_FOUND'
      ));
    }
    
    // Log per debug
    logger.info(`✅ Professional found:`);
    logger.info(`   - Name: ${professional.firstName} ${professional.lastName}`);
    logger.info(`   - professionId: ${professional.professionId}`);
    logger.info(`   - Profession: ${professional.Profession?.name || 'null'}`);
    logger.info(`   - profession (string): ${professional.profession}`);
    logger.info(`   - Competenze: ${professional.ProfessionalUserSubcategory?.length || 0}`);
    
    // Se ha una professionId, recupera anche le categorie associate
    let professionCategories = [];
    if (professional.professionId) {
      const profCats = await prisma.professionCategory.findMany({
        where: {
          professionId: professional.professionId,
          isActive: true
        },
        include: {
          category: true
        }
      });
      
      professionCategories = profCats.map(pc => pc.category);
      logger.info(`   - Categorie professione: ${professionCategories.map(c => c.name).join(', ')}`);
    }
    
    // Costruisci la risposta completa
    const response = {
      ...professional,
      professionCategories // Aggiungi le categorie direttamente nella risposta
    };
    
    return res.json(ResponseFormatter.success(
      response,
      'Dettagli professionista recuperati con successo'
    ));
    
  } catch (error) {
    logger.error('Error fetching professional details:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero dei dettagli',
      'FETCH_ERROR'
    ));
  }
});

/**
 * PUT /api/professional-details/:id/profession
 * Aggiorna la professione di un professionista
 */
router.put('/:id/profession', authenticate, async (req: any, res) => {
  try {
    const professionalId = req.params.id;
    const { professionId } = req.body;
    
    logger.info(`📝 Updating profession for professional ${professionalId}`);
    logger.info(`   New professionId: ${professionId}`);
    
    // Verifica che il professionista esista
    const professional = await prisma.user.findUnique({
      where: { id: professionalId }
    });
    
    if (!professional) {
      return res.status(404).json(ResponseFormatter.error(
        'Professionista non trovato',
        'NOT_FOUND'
      ));
    }
    
    // Se c'è una professionId, verifica che esista
    if (professionId) {
      const profession = await prisma.profession.findUnique({
        where: { id: professionId }
      });
      
      if (!profession) {
        return res.status(404).json(ResponseFormatter.error(
          'Professione non trovata',
          'PROFESSION_NOT_FOUND'
        ));
      }
      
      logger.info(`   Profession found: ${profession.name}`);
    }
    
    // Aggiorna il professionista
    const updated = await prisma.user.update({
      where: { id: professionalId },
      data: {
        professionId: professionId || null,
        updatedAt: new Date()
      },
      include: {
        Profession: true,
        ProfessionalUserSubcategory: {
          include: {
            subcategory: {
              include: {
                category: true
              }
            }
          }
        }
      }
    });
    
    logger.info(`✅ Professional updated successfully`);
    logger.info(`   New profession: ${updated.Profession?.name || 'none'}`);
    
    // Recupera anche le categorie se c'è una professione
    let professionCategories = [];
    if (updated.professionId) {
      const profCats = await prisma.professionCategory.findMany({
        where: {
          professionId: updated.professionId,
          isActive: true
        },
        include: {
          category: true
        }
      });
      professionCategories = profCats.map(pc => pc.category);
    }
    
    const response = {
      ...updated,
      professionCategories
    };
    
    return res.json(ResponseFormatter.success(
      response,
      'Professione aggiornata con successo'
    ));
    
  } catch (error) {
    logger.error('Error updating profession:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nell\'aggiornamento della professione',
      'UPDATE_ERROR'
    ));
  }
});

export default router;
