import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validateRequest } from '../middleware/validation';
import { auditLogger } from '../middleware/auditLogger';
import { portfolioService } from '../services/portfolio.service';
import { ResponseFormatter } from '../utils/responseFormatter';
import logger from '../utils/logger';
import { z } from 'zod';
import { requireModule } from '../middleware/module.middleware';

const router = Router();

// 🔒 Protegge tutte le routes del portfolio
// Se il modulo 'portfolio' è disabilitato, blocca l'accesso con 403
router.use(requireModule('portfolio'));

// Schema di validazione per creazione portfolio
const createPortfolioSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  beforeImage: z.string().url(),
  afterImage: z.string().url(),
  categoryId: z.string(),
  requestId: z.string().optional(),
  technicalDetails: z.string().optional(),
  materialsUsed: z.string().optional(),
  duration: z.string().optional(),
  cost: z.number().positive().optional(),
  tags: z.array(z.string()).optional(),
  location: z.string().optional(),
  workCompletedAt: z.string().datetime().optional()
});

// Schema di validazione per aggiornamento portfolio
const updatePortfolioSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().optional(),
  beforeImage: z.string().url().optional(),
  afterImage: z.string().url().optional(),
  categoryId: z.string().optional(),
  technicalDetails: z.string().optional(),
  materialsUsed: z.string().optional(),
  duration: z.string().optional(),
  cost: z.number().positive().optional(),
  tags: z.array(z.string()).optional(),
  location: z.string().optional(),
  isPublic: z.boolean().optional()
});

/**
 * GET /api/portfolio/professional/:professionalId
 * Ottieni tutti i portfolio di un professionista (pubblici)
 */
router.get('/professional/:professionalId', async (req, res) => {
  try {
    const { professionalId } = req.params;
    
    // Se è il professionista stesso che richiede, mostra anche i privati
    const includePrivate = req.user?.id === professionalId;
    
    const portfolios = await portfolioService.getProfessionalPortfolio(
      professionalId, 
      includePrivate
    );
    
    return res.json(ResponseFormatter.success(
      portfolios,
      'Portfolio recuperati con successo'
    ));
  } catch (error) {
    logger.error('Error fetching professional portfolio:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero del portfolio',
      'FETCH_ERROR'
    ));
  }
});

/**
 * GET /api/portfolio/:id
 * Ottieni un singolo portfolio per ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const portfolio = await portfolioService.getPortfolioById(id);
    
    // Incrementa visualizzazioni se non è il proprietario
    if (req.user?.id !== portfolio.professionalId) {
      await portfolioService.incrementViewCount(id);
    }
    
    return res.json(ResponseFormatter.success(
      portfolio,
      'Portfolio recuperato con successo'
    ));
  } catch (error) {
    logger.error('Error fetching portfolio:', error);
    return res.status(404).json(ResponseFormatter.error(
      'Portfolio non trovato',
      'NOT_FOUND'
    ));
  }
});

/**
 * POST /api/portfolio
 * Crea un nuovo portfolio (solo professionisti)
 */
router.post(
  '/',
  authenticate,
  authorize('PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN'),
  validateRequest(createPortfolioSchema),
  auditLogger({ 
    action: 'CREATE' as any,
    entityType: 'Portfolio',
    captureBody: true 
  }),
  async (req, res) => {
    try {
      const portfolioData = {
        ...req.body,
        professionalId: req.user.id
      };

      const portfolio = await portfolioService.createPortfolio(portfolioData);
      
      return res.status(201).json(ResponseFormatter.success(
        portfolio,
        'Portfolio creato con successo'
      ));
    } catch (error) {
      logger.error('Error creating portfolio:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Errore nella creazione del portfolio',
        'CREATE_ERROR'
      ));
    }
  }
);

/**
 * PUT /api/portfolio/:id
 * Aggiorna un portfolio (solo il proprietario)
 */
router.put(
  '/:id',
  authenticate,
  authorize('PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN'),
  validateRequest(updatePortfolioSchema),
  auditLogger({ 
    action: 'UPDATE' as any,
    entityType: 'Portfolio',
    captureBody: true 
  }),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const portfolio = await portfolioService.updatePortfolio(
        id,
        req.user.id,
        req.body
      );
      
      return res.json(ResponseFormatter.success(
        portfolio,
        'Portfolio aggiornato con successo'
      ));
    } catch (error) {
      logger.error('Error updating portfolio:', error);
      
      if (error.message === 'Portfolio not found or unauthorized') {
        return res.status(403).json(ResponseFormatter.error(
          'Non autorizzato a modificare questo portfolio',
          'UNAUTHORIZED'
        ));
      }
      
      return res.status(500).json(ResponseFormatter.error(
        'Errore nell\'aggiornamento del portfolio',
        'UPDATE_ERROR'
      ));
    }
  }
);

/**
 * DELETE /api/portfolio/:id
 * Elimina un portfolio (solo il proprietario)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN'),
  auditLogger({ 
    action: 'DELETE' as any,
    entityType: 'Portfolio'
  }),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      await portfolioService.deletePortfolio(id, req.user.id);
      
      return res.json(ResponseFormatter.success(
        null,
        'Portfolio eliminato con successo'
      ));
    } catch (error) {
      logger.error('Error deleting portfolio:', error);
      
      if (error.message === 'Portfolio not found or unauthorized') {
        return res.status(403).json(ResponseFormatter.error(
          'Non autorizzato a eliminare questo portfolio',
          'UNAUTHORIZED'
        ));
      }
      
      return res.status(500).json(ResponseFormatter.error(
        'Errore nell\'eliminazione del portfolio',
        'DELETE_ERROR'
      ));
    }
  }
);

/**
 * GET /api/portfolio/category/:categoryId
 * Ottieni portfolio per categoria
 */
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const portfolios = await portfolioService.getPortfolioByCategory(categoryId, limit);
    
    return res.json(ResponseFormatter.success(
      portfolios,
      'Portfolio per categoria recuperati con successo'
    ));
  } catch (error) {
    logger.error('Error fetching portfolio by category:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero portfolio per categoria',
      'FETCH_ERROR'
    ));
  }
});

/**
 * GET /api/portfolio/search
 * Ricerca portfolio
 */
router.get('/search', async (req, res) => {
  try {
    const { q, categoryId, professionalId, location, tags } = req.query;
    
    if (!q) {
      return res.status(400).json(ResponseFormatter.error(
        'Query di ricerca richiesta',
        'MISSING_QUERY'
      ));
    }
    
    const filters = {
      categoryId: categoryId as string,
      professionalId: professionalId as string,
      location: location as string,
      tags: tags ? (tags as string).split(',') : undefined
    };
    
    const portfolios = await portfolioService.searchPortfolio(q as string, filters);
    
    return res.json(ResponseFormatter.success(
      portfolios,
      'Ricerca portfolio completata'
    ));
  } catch (error) {
    logger.error('Error searching portfolio:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nella ricerca portfolio',
      'SEARCH_ERROR'
    ));
  }
});

/**
 * GET /api/portfolio/popular
 * Ottieni i portfolio più visualizzati
 */
router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const portfolios = await portfolioService.getPopularPortfolios(limit);
    
    return res.json(ResponseFormatter.success(
      portfolios,
      'Portfolio popolari recuperati con successo'
    ));
  } catch (error) {
    logger.error('Error fetching popular portfolios:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero portfolio popolari',
      'FETCH_ERROR'
    ));
  }
});

/**
 * GET /api/portfolio/recent
 * Ottieni i portfolio recenti
 */
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const portfolios = await portfolioService.getRecentPortfolios(limit);
    
    return res.json(ResponseFormatter.success(
      portfolios,
      'Portfolio recenti recuperati con successo'
    ));
  } catch (error) {
    logger.error('Error fetching recent portfolios:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero portfolio recenti',
      'FETCH_ERROR'
    ));
  }
});

export default router;