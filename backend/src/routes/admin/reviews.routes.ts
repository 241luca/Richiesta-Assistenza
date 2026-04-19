import { Router, Request, Response } from 'express';
import { prisma } from '../../config/database';
import { ResponseFormatter } from '../../utils/responseFormatter';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { logger } from '../../utils/logger';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { ReviewExclusionService } from '../../services/review-exclusion.service';

const router = Router();

// Schema validazione configurazione
const reviewConfigSchema = z.object({
  isEnabled: z.boolean().optional(),
  anonymousReviews: z.boolean().optional(),
  showLastNameInitial: z.boolean().optional(),
  requireComment: z.boolean().optional(),
  minCommentLength: z.number().int().positive().optional(),
  maxCommentLength: z.number().int().positive().optional(),
  maxDaysToReview: z.number().int().positive().optional(),
  autoModeration: z.boolean().optional(),
  publicReviews: z.boolean().optional(),
  bannedWords: z.string().array().optional(),
  contentFilter: z.boolean().optional(),
  requireManualApproval: z.boolean().optional(),
  autoApproveThreshold: z.number().int().optional(),
  notifyAdminForLowRatings: z.boolean().optional(),
  lowRatingThreshold: z.number().int().min(1).max(5).optional(),
  showStarsInName: z.boolean().optional(),
  minReviewsToShowAverage: z.number().int().positive().optional(),
  defaultSortOrder: z.enum(['recent', 'helpful', 'rating_high', 'rating_low']).optional(),
  reviewsPerPage: z.number().int().positive().optional(),
  enableBadges: z.boolean().optional(),
  topRatedThreshold: z.number().min(1).max(5).optional(),
  enableLoyaltyPoints: z.boolean().optional(),
  pointsPerReview: z.number().int().nonnegative().optional(),
  notifyProfessionalOnReview: z.boolean().optional(),
  remindClientAfterDays: z.number().int().positive().optional(),
  notifyAdminOnProblematic: z.boolean().optional(),
});

// GET /api/admin/reviews/config - Ottiene configurazione
router.get(
  '/config',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  async (req: any, res: Response): Promise<void> => {
    try {
      console.log('=== GET /admin/reviews/config ===' );
      
      // ✅ LEGGI dal database, non hardcodato
      let config = await prisma.reviewSystemConfig.findFirst();

      // Se non esiste, crea la configurazione di default
      if (!config) {
        console.log('Creando configurazione di default nel database...');
        config = await prisma.reviewSystemConfig.create({
          data: {
            isEnabled: true,
            anonymousReviews: false,
            showLastNameInitial: true,
            requireComment: false,
            minCommentLength: 10,
            maxCommentLength: 1000,
            maxDaysToReview: 30,
            autoModeration: true,
            publicReviews: true,
            bannedWords: [],
            contentFilter: true,
            requireManualApproval: false,
            autoApproveThreshold: 3,
            notifyAdminForLowRatings: true,
            lowRatingThreshold: 2,
            showStarsInName: true,
            minReviewsToShowAverage: 3,
            defaultSortOrder: 'recent',
            reviewsPerPage: 10,
            enableBadges: true,
            topRatedThreshold: 4.5,
            enableLoyaltyPoints: false,
            pointsPerReview: 10,
            notifyProfessionalOnReview: true,
            remindClientAfterDays: 3,
            notifyAdminOnProblematic: true,
          } as any, // Type assertion for Prisma
        });
      }

      console.log('Ritornando configurazione dal database:', { anonymousReviews: config.anonymousReviews });
      res.json(ResponseFormatter.success(config, 'Configurazione caricata'));
    } catch (error: any) {
      console.error('ERROR in /admin/reviews/config:', error);
      logger.error('Error fetching review config:', error instanceof Error ? error.message : String(error));
      res.status(500).json(
        ResponseFormatter.error('Errore nel caricamento configurazione', 'FETCH_CONFIG_ERROR')
      );
    }
  }
);

// POST /api/admin/reviews/config - Aggiorna configurazione
router.post(
  '/config',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  async (req: any, res: Response): Promise<void> => {
    try {
      // Validazione
      const validated = reviewConfigSchema.parse(req.body);

      // Trova la configurazione
      let config = await prisma.reviewSystemConfig.findFirst();

      if (!config) {
        // Crea se non esiste
        config = await prisma.reviewSystemConfig.create({
          data: {
            ...validated,
            isEnabled: validated.isEnabled ?? true,
            anonymousReviews: validated.anonymousReviews ?? false,
          } as any, // Type assertion
        });
      } else {
        // Aggiorna quella esistente
        config = await prisma.reviewSystemConfig.update({
          where: { id: config.id },
          data: validated,
        });
      }

      // Log azione
      await prisma.auditLog.create({
        data: {
          id: uuidv4(),
          userId: req.user.id,
          userEmail: req.user.email,
          userRole: req.user.role,
          ipAddress: req.ip || '',
          userAgent: req.get('user-agent') || '',
          action: 'UPDATE',
          entityType: 'ReviewSystemConfig',
          entityId: config.id,
          newValues: config,
          success: true,
          severity: 'INFO',
          category: 'BUSINESS',
        },
      });

      logger.info('Updated review config', { configId: config.id, userId: req.user.id });

      res.json(ResponseFormatter.success(config, 'Configurazione salvata con successo'));
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        res.status(400).json(
          ResponseFormatter.error('Dati non validi', 'VALIDATION_ERROR', error.errors)
        );
      } else {
        logger.error('Error updating review config:', error instanceof Error ? error.message : String(error));
        res.status(500).json(
          ResponseFormatter.error('Errore nel salvataggio configurazione', 'UPDATE_CONFIG_ERROR')
        );
      }
    }
  }
);

// GET /api/admin/reviews/analytics - Statistiche sistema recensioni
router.get(
  '/analytics',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  async (req: any, res: Response): Promise<void> => {
    try {
      const stats = {
        totalReviews: await prisma.review.count(),
        averageRating: await prisma.review.aggregate({
          _avg: { rating: true },
        }),
        ratingsDistribution: {
          oneStars: await prisma.review.count({ where: { rating: 1 } }),
          twoStars: await prisma.review.count({ where: { rating: 2 } }),
          threeStars: await prisma.review.count({ where: { rating: 3 } }),
          fourStars: await prisma.review.count({ where: { rating: 4 } }),
          fiveStars: await prisma.review.count({ where: { rating: 5 } }),
        },
      };

      res.json(ResponseFormatter.success(stats, 'Statistiche caricate'));
    } catch (error: unknown) {
      logger.error('Error fetching review analytics:', error instanceof Error ? error.message : String(error));
      res.status(500).json(
        ResponseFormatter.error('Errore nel caricamento statistiche', 'ANALYTICS_ERROR')
      );
    }
  }
);

// Schema per esclusioni
const exclusionSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(['CLIENT', 'PROFESSIONAL', 'BOTH']),
  reason: z.string().min(5, 'La ragione deve essere di almeno 5 caratteri'),
  isTemporary: z.boolean().optional(),
  expiresAt: z.string().optional(),
});

// GET /api/admin/reviews/exclusions - Lista esclusioni
router.get(
  '/exclusions',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  async (req: any, res: Response): Promise<void> => {
    try {
      const { userId, type, isActive, isTemporary } = req.query;
      
      const filters = {
        ...(userId && { userId: userId as string }),
        ...(type && { type: type as any }),
        ...(isActive !== undefined && { isActive: isActive === 'true' }),
        ...(isTemporary !== undefined && { isTemporary: isTemporary === 'true' }),
      };

      const exclusions = await ReviewExclusionService.getExclusions(filters);
      res.json(ResponseFormatter.success(exclusions, 'Esclusioni caricate'));
    } catch (error: unknown) {
      logger.error('Error fetching exclusions:', error instanceof Error ? error.message : String(error));
      res.status(500).json(
        ResponseFormatter.error('Errore nel caricamento esclusioni', 'FETCH_EXCLUSIONS_ERROR')
      );
    }
  }
);

// POST /api/admin/reviews/exclusions - Crea esclusione
router.post(
  '/exclusions',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  async (req: any, res: Response): Promise<void> => {
    try {
      const validated = exclusionSchema.parse(req.body);

      const exclusionData = {
        userId: validated.userId,
        type: validated.type,
        reason: validated.reason,
        excludedBy: req.user.id,
        isTemporary: validated.isTemporary ?? false,
        expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : undefined,
      };

      const exclusion = await ReviewExclusionService.createExclusion(exclusionData);
      res.json(ResponseFormatter.success(exclusion, 'Esclusione creata con successo'));
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        res.status(400).json(
          ResponseFormatter.error('Dati non validi', 'VALIDATION_ERROR', error.errors)
        );
      } else {
        const message = error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Errore nella creazione esclusione';
        const code = message.includes('non trovato') ? 'USER_NOT_FOUND' : 
                     message.includes('già esistente') ? 'EXCLUSION_EXISTS' : 'CREATE_EXCLUSION_ERROR';
        const status = message.includes('non trovato') ? 404 : 
                       message.includes('già esistente') ? 400 : 500;
        
        res.status(status).json(
          ResponseFormatter.error(message, code)
        );
      }
    }
  }
);

// DELETE /api/admin/reviews/exclusions/:id - Rimuovi esclusione
router.delete(
  '/exclusions/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  async (req: any, res: Response): Promise<void> => {
    try {
      const exclusionId = req.params.id;
      
      await ReviewExclusionService.removeExclusion(exclusionId, req.user.id);
      res.json(ResponseFormatter.success(null, 'Esclusione rimossa con successo'));
    } catch (error: unknown) {
      const message = error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Errore nella rimozione esclusione';
      const status = message.includes('non trovata') ? 404 : 
                     message.includes('già disattivata') ? 400 : 500;
      const code = message.includes('non trovata') ? 'EXCLUSION_NOT_FOUND' : 
                   message.includes('già disattivata') ? 'EXCLUSION_ALREADY_INACTIVE' : 'REMOVE_EXCLUSION_ERROR';
      
      res.status(status).json(
        ResponseFormatter.error(message, code)
      );
    }
  }
);

// GET /api/admin/reviews/exclusions/stats - Statistiche esclusioni
router.get(
  '/exclusions/stats',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  async (req: any, res: Response): Promise<void> => {
    try {
      const stats = await ReviewExclusionService.getExclusionStats();
      res.json(ResponseFormatter.success(stats, 'Statistiche esclusioni caricate'));
    } catch (error: unknown) {
      logger.error('Error fetching exclusion stats:', error instanceof Error ? error.message : String(error));
      res.status(500).json(
        ResponseFormatter.error('Errore nel caricamento statistiche', 'FETCH_STATS_ERROR')
      );
    }
  }
);

export default router;