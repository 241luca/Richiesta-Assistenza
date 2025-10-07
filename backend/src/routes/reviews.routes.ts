import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { reviewService } from '../services/review.service';
import { ResponseFormatter } from '../utils/responseFormatter';
import { z } from 'zod';
import { auditLogger } from '../middleware/auditLogger';
import { requireModule } from '../middleware/module.middleware';

const router = Router();

// 🔒 Protegge tutte le routes delle recensioni
// Se il modulo 'reviews' è disabilitato, blocca l'accesso con 403
router.use(requireModule('reviews'));

// Schema di validazione per creare una recensione
const createReviewSchema = z.object({
  requestId: z.string().cuid(),
  rating: z.number().int().min(1).max(5, 'Il rating deve essere tra 1 e 5'),
  comment: z.string().min(10, 'Il commento deve essere di almeno 10 caratteri').max(1000).optional()
});

// Schema per paginazione
const paginationSchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).optional(),
  limit: z.string().transform(val => parseInt(val, 10)).optional()
});

/**
 * POST /api/reviews
 * Crea una nuova recensione
 */
router.post(
  '/',
  authenticate,
  validateRequest(createReviewSchema),
  auditLogger('CREATE_REVIEW'),
  async (req, res) => {
    try {
      const review = await reviewService.createReview({
        ...req.body,
        clientId: req.user.id
      });
      
      return res.json(ResponseFormatter.success(
        review, 
        'Recensione creata con successo'
      ));
    } catch (error: any) {
      return res.status(400).json(ResponseFormatter.error(
        error.message || 'Errore nella creazione della recensione'
      ));
    }
  }
);

/**
 * GET /api/reviews/professional/:professionalId
 * Ottieni tutte le recensioni di un professionista
 */
router.get(
  '/professional/:professionalId',
  async (req, res) => {
    try {
      const { page = '1', limit = '10' } = req.query;
      
      const reviews = await reviewService.getProfessionalReviews(
        req.params.professionalId,
        parseInt(page as string),
        parseInt(limit as string)
      );
      
      return res.json(ResponseFormatter.success(reviews));
    } catch (error: any) {
      return res.status(400).json(ResponseFormatter.error(
        error.message || 'Errore nel recupero delle recensioni'
      ));
    }
  }
);

/**
 * GET /api/reviews/professional/:professionalId/stats
 * Ottieni le statistiche delle recensioni di un professionista
 */
router.get(
  '/professional/:professionalId/stats',
  async (req, res) => {
    try {
      const stats = await reviewService.getProfessionalStats(
        req.params.professionalId
      );
      
      return res.json(ResponseFormatter.success(stats));
    } catch (error: any) {
      return res.status(400).json(ResponseFormatter.error(
        error.message || 'Errore nel recupero delle statistiche'
      ));
    }
  }
);

/**
 * GET /api/reviews/can-review/:requestId
 * Verifica se l'utente può recensire una richiesta
 */
router.get(
  '/can-review/:requestId',
  authenticate,
  async (req, res) => {
    try {
      const result = await reviewService.canReview(
        req.user.id,
        req.params.requestId
      );
      
      return res.json(ResponseFormatter.success(result));
    } catch (error: any) {
      return res.status(400).json(ResponseFormatter.error(
        error.message || 'Errore nella verifica'
      ));
    }
  }
);

/**
 * GET /api/reviews/:reviewId
 * Ottieni una recensione specifica
 */
router.get(
  '/:reviewId',
  async (req, res) => {
    try {
      const review = await reviewService.getReview(req.params.reviewId);
      
      if (!review) {
        return res.status(404).json(ResponseFormatter.error('Recensione non trovata'));
      }
      
      return res.json(ResponseFormatter.success(review));
    } catch (error: any) {
      return res.status(400).json(ResponseFormatter.error(
        error.message || 'Errore nel recupero della recensione'
      ));
    }
  }
);

/**
 * PATCH /api/reviews/:reviewId/helpful
 * Marca una recensione come utile o non utile
 */
router.patch(
  '/:reviewId/helpful',
  authenticate,
  async (req, res) => {
    try {
      const { isHelpful } = req.body;
      
      const review = await reviewService.updateHelpfulCount(
        req.params.reviewId,
        isHelpful
      );
      
      return res.json(ResponseFormatter.success(
        review, 
        isHelpful ? 'Recensione marcata come utile' : 'Feedback registrato'
      ));
    } catch (error: any) {
      return res.status(400).json(ResponseFormatter.error(
        error.message || 'Errore nell\'aggiornamento'
      ));
    }
  }
);

/**
 * GET /api/reviews/latest
 * Ottieni le ultime recensioni (admin)
 */
router.get(
  '/latest',
  authenticate,
  async (req, res) => {
    try {
      // Verifica che l'utente sia admin
      if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json(ResponseFormatter.error('Non autorizzato'));
      }
      
      const reviews = await reviewService.getLatestReviews(10);
      
      return res.json(ResponseFormatter.success(reviews));
    } catch (error: any) {
      return res.status(400).json(ResponseFormatter.error(
        error.message || 'Errore nel recupero delle recensioni'
      ));
    }
  }
);

/**
 * DELETE /api/reviews/:reviewId
 * Elimina una recensione (solo admin)
 */
router.delete(
  '/:reviewId',
  authenticate,
  auditLogger('DELETE_REVIEW'),
  async (req, res) => {
    try {
      // Verifica che l'utente sia admin
      if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json(ResponseFormatter.error('Non autorizzato'));
      }
      
      await reviewService.deleteReview(req.params.reviewId);
      
      return res.json(ResponseFormatter.success(
        null, 
        'Recensione eliminata con successo'
      ));
    } catch (error: any) {
      return res.status(400).json(ResponseFormatter.error(
        error.message || 'Errore nell\'eliminazione della recensione'
      ));
    }
  }
);

export default router;
