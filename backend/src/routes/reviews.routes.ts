import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { reviewService } from '../services/review.service';
import { ResponseFormatter } from '../utils/responseFormatter';
import { z } from 'zod';
import { auditLogger } from '../middleware/auditLogger';
import { requireModule } from '../middleware/module.middleware';
import { ReviewExclusionService } from '../services/review-exclusion.service';

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

// Schema per configurazione sistema recensioni
const reviewSystemConfigSchema = z.object({
  isEnabled: z.boolean().optional(),
  anonymousReviews: z.boolean().optional(),
  showLastNameInitial: z.boolean().optional(),
  requireComment: z.boolean().optional(),
  minCommentLength: z.number().int().min(1).max(1000).optional(),
  maxCommentLength: z.number().int().min(1).max(2000).optional(),
  maxDaysToReview: z.number().int().min(1).max(365).optional(),
  autoModeration: z.boolean().optional(),
  publicReviews: z.boolean().optional(),
  bannedWords: z.array(z.string()).optional(),
  contentFilter: z.boolean().optional(),
  requireManualApproval: z.boolean().optional(),
  autoApproveThreshold: z.number().int().min(1).max(5).optional(),
  notifyAdminForLowRatings: z.boolean().optional(),
  lowRatingThreshold: z.number().int().min(1).max(5).optional(),
  showStarsInName: z.boolean().optional(),
  minReviewsToShowAverage: z.number().int().min(0).max(100).optional(),
  defaultSortOrder: z.enum(['recent', 'rating_high', 'rating_low', 'helpful']).optional(),
  reviewsPerPage: z.number().int().min(5).max(100).optional(),
  enableBadges: z.boolean().optional(),
  topRatedThreshold: z.number().min(0).max(5).optional(),
  enableLoyaltyPoints: z.boolean().optional(),
  pointsPerReview: z.number().int().min(0).max(1000).optional(),
  notifyProfessionalOnReview: z.boolean().optional(),
  remindClientAfterDays: z.number().int().min(1).max(30).optional(),
  notifyAdminOnProblematic: z.boolean().optional()
});

// Schema per filtri recensioni
const reviewFiltersSchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).optional(),
  limit: z.string().transform(val => parseInt(val, 10)).optional(),
  sortBy: z.enum(['recent', 'rating_high', 'rating_low', 'helpful']).optional(),
  minRating: z.string().transform(val => parseInt(val, 10)).optional(),
  maxRating: z.string().transform(val => parseInt(val, 10)).optional(),
  hasComment: z.string().transform(val => val === 'true').optional()
});

/**
 * POST /api/reviews
 * Crea una nuova recensione
 */
router.post(
  '/',
  authenticate,
  validateRequest(createReviewSchema),
  auditLogger({ action: 'CREATE', entityType: 'Review' }),
  async (req, res) => {
    try {
      const clientId = req.user!.id;
      
      // Verifica se il cliente è escluso dal sistema recensioni
      const canClientReview = await ReviewExclusionService.canClientReview(clientId);
      if (!canClientReview) {
        return res.status(403).json(ResponseFormatter.error(
          'Non sei autorizzato a lasciare recensioni',
          'CLIENT_EXCLUDED_FROM_REVIEWS'
        ));
      }

      const review = await reviewService.createReview({
        ...req.body,
        clientId
      });

      return res.json(ResponseFormatter.success(
        review,
        'Recensione creata con successo'
      ));
    } catch (error: any) {
      return res.status(400).json(ResponseFormatter.error(
        error instanceof Error ? error.message : String(error) || 'Errore nella creazione della recensione'
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
        error instanceof Error ? error.message : String(error) || 'Errore nel recupero delle recensioni'
      ));
    }
  }
);

/**
 * GET /api/reviews/professional/:professionalId/filtered
 * Ottieni recensioni filtrate e ordinate secondo configurazione
 */
router.get(
  '/professional/:professionalId/filtered',
  validateRequest(reviewFiltersSchema),
  async (req, res) => {
    try {
      const result = await reviewService.getFilteredReviews(
        req.params.professionalId,
        req.query
      );

      return res.json(ResponseFormatter.success(result));
    } catch (error: any) {
      return res.status(400).json(ResponseFormatter.error(
        error instanceof Error ? error.message : String(error) || 'Errore nel recupero delle recensioni filtrate'
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
      const stats = await reviewService.getProfessionalStats(req.params.professionalId);

      return res.json(ResponseFormatter.success(stats));
    } catch (error: any) {
      return res.status(400).json(ResponseFormatter.error(
        error instanceof Error ? error.message : String(error) || 'Errore nel recupero delle statistiche'
      ));
    }
  }
);

/**
 * GET /api/reviews/professional/:professionalId/stats-with-config
 * Ottieni statistiche con configurazione sistema
 */
router.get(
  '/professional/:professionalId/stats-with-config',
  async (req, res) => {
    try {
      const stats = await reviewService.getProfessionalStatsWithConfig(req.params.professionalId);

      return res.json(ResponseFormatter.success(stats));
    } catch (error: any) {
      return res.status(400).json(ResponseFormatter.error(
        error instanceof Error ? error.message : String(error) || 'Errore nel recupero delle statistiche avanzate'
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
        req.user!.id,
        req.params.requestId
      );

      return res.json(ResponseFormatter.success(result));
    } catch (error: any) {
      return res.status(400).json(ResponseFormatter.error(
        error instanceof Error ? error.message : String(error) || 'Errore nella verifica'
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
        error instanceof Error ? error.message : String(error) || 'Errore nel recupero della recensione'
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
        error instanceof Error ? error.message : String(error) || 'Errore nell\'aggiornamento'
      ));
    }
  }
);

/**
 * GET /api/reviews/latest
 * Ottieni le ultime recensioni del sistema (admin)
 */
router.get(
  '/latest',
  authenticate,
  async (req, res) => {
    try {
      // Verifica che l'utente sia admin
      if (req.user!.role !== 'ADMIN' && req.user!.role !== 'SUPER_ADMIN') {
        return res.status(403).json(ResponseFormatter.error('Non autorizzato'));
      }

      const reviews = await reviewService.getLatestReviews(10);

      return res.json(ResponseFormatter.success(reviews));
    } catch (error: any) {
      return res.status(400).json(ResponseFormatter.error(
        error instanceof Error ? error.message : String(error) || 'Errore nel recupero delle recensioni'
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
  auditLogger({ action: 'DELETE', entityType: 'Review' }),
  async (req, res) => {
    try {
      // Verifica che l'utente sia admin
      if (req.user!.role !== 'ADMIN' && req.user!.role !== 'SUPER_ADMIN') {
        return res.status(403).json(ResponseFormatter.error('Non autorizzato'));
      }

      await reviewService.deleteReview(req.params.reviewId);

      return res.json(ResponseFormatter.success(
        null,
        'Recensione eliminata con successo'
      ));
    } catch (error: any) {
      return res.status(400).json(ResponseFormatter.error(
        error instanceof Error ? error.message : String(error) || 'Errore nell\'eliminazione della recensione'
      ));
    }
  }
);

// ============================================
// ENDPOINT CONFIGURAZIONE SISTEMA RECENSIONI
// ============================================

/**
 * GET /api/reviews/config
 * Ottieni configurazione sistema recensioni
 */
router.get(
  '/config',
  authenticate,
  async (req, res) => {
    try {
      // Solo admin possono vedere la configurazione
      if (req.user!.role !== 'ADMIN' && req.user!.role !== 'SUPER_ADMIN') {
        return res.status(403).json(ResponseFormatter.error('Non autorizzato'));
      }

      const config = await reviewService.getReviewSystemConfig();

      return res.json(ResponseFormatter.success(config));
    } catch (error: any) {
      return res.status(400).json(ResponseFormatter.error(
        error instanceof Error ? error.message : String(error) || 'Errore nel recupero della configurazione'
      ));
    }
  }
);

/**
 * PUT /api/reviews/config
 * Aggiorna configurazione sistema recensioni
 */
router.put(
  '/config',
  authenticate,
  validateRequest(reviewSystemConfigSchema),
  auditLogger({ action: 'UPDATE', entityType: 'ReviewSystemConfig' }),
  async (req, res) => {
    try {
      // Solo admin possono modificare la configurazione
      if (req.user!.role !== 'ADMIN' && req.user!.role !== 'SUPER_ADMIN') {
        return res.status(403).json(ResponseFormatter.error('Non autorizzato'));
      }

      const config = await reviewService.updateReviewSystemConfig(req.body);

      return res.json(ResponseFormatter.success(
        config,
        'Configurazione aggiornata con successo'
      ));
    } catch (error: any) {
      return res.status(400).json(ResponseFormatter.error(
        error instanceof Error ? error.message : String(error) || 'Errore nell\'aggiornamento della configurazione'
      ));
    }
  }
);

/**
 * POST /api/reviews/check-moderation
 * Verifica se un commento richiede moderazione
 */
router.post(
  '/check-moderation',
  authenticate,
  async (req, res) => {
    try {
      const { comment, rating } = req.body;

      if (!comment || typeof comment !== 'string') {
        return res.status(400).json(ResponseFormatter.error('Commento obbligatorio'));
      }

      const moderationResult = await reviewService.checkContentModeration(comment);
      const requiresApproval = await reviewService.requiresManualApproval(rating || 5);
      const notifyAdmin = await reviewService.shouldNotifyAdminForLowRating(rating || 5);

      return res.json(ResponseFormatter.success({
        moderation: moderationResult,
        requiresApproval,
        notifyAdmin,
        canPublish: moderationResult.isApproved && !requiresApproval
      }));
    } catch (error: any) {
      return res.status(400).json(ResponseFormatter.error(
        error instanceof Error ? error.message : String(error) || 'Errore nella verifica di moderazione'
      ));
    }
  }
);

export default router;
