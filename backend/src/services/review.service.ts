import { prisma } from '../config/database';
import { ReviewExclusionService } from './review-exclusion.service';

interface CreateReviewData {
  requestId: string;
  rating: number;
  comment?: string;
  clientId: string;
}

interface ReviewSystemConfigData {
  isEnabled?: boolean;
  anonymousReviews?: boolean;
  showLastNameInitial?: boolean;
  requireComment?: boolean;
  minCommentLength?: number;
  maxCommentLength?: number;
  maxDaysToReview?: number;
  autoModeration?: boolean;
  publicReviews?: boolean;
  bannedWords?: string[];
  contentFilter?: boolean;
  requireManualApproval?: boolean;
  autoApproveThreshold?: number;
  notifyAdminForLowRatings?: boolean;
  lowRatingThreshold?: number;
  showStarsInName?: boolean;
  minReviewsToShowAverage?: number;
  defaultSortOrder?: string;
  reviewsPerPage?: number;
  enableBadges?: boolean;
  topRatedThreshold?: number;
  enableLoyaltyPoints?: boolean;
  pointsPerReview?: number;
  notifyProfessionalOnReview?: boolean;
  remindClientAfterDays?: number;
  notifyAdminOnProblematic?: boolean;
}

class ReviewService {
  /**
   * Crea una nuova recensione
   */
  async createReview(data: CreateReviewData) {
    // 1. Verifica che la richiesta esista e sia completata
    const request = await prisma.assistanceRequest.findUnique({
      where: { id: data.requestId },
      include: { User_AssistanceRequest_professionalIdToUser: true }
    });

    if (!request) {
      throw new Error('Richiesta non trovata');
    }

    if (request.status !== 'COMPLETED') {
      throw new Error('Puoi recensire solo interventi completati');
    }

    if (request.clientId !== data.clientId) {
      throw new Error('Non puoi recensire questa richiesta');
    }

    if (!request.professionalId) {
      throw new Error('Nessun professionista assegnato a questa richiesta');
    }

    // 2. Verifica esclusioni dal sistema recensioni
    const canProfessionalReceiveReviews = await ReviewExclusionService.canProfessionalReceiveReviews(request.professionalId);
    if (!canProfessionalReceiveReviews) {
      throw new Error('Il professionista non può ricevere recensioni');
    }

    // 3. Verifica che non esista già una recensione
    const existingReview = await prisma.review.findUnique({
      where: { requestId: data.requestId }
    });

    if (existingReview) {
      throw new Error('Hai già recensito questo intervento');
    }

    // 4. Crea la recensione
    const review = await prisma.review.create({
      data: {
        requestId: data.requestId,
        rating: data.rating,
        comment: data.comment,
        clientId: data.clientId,
        professionalId: request.professionalId,
        isVerified: true
      },
      include: {
        User_Review_clientIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        AssistanceRequest: {
          select: {
            id: true,
            categoryId: true,
            createdAt: true,
            Category: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    // 5. Aggiorna il rating medio del professionista (opzionale, se hai un campo per questo)
    await this.updateProfessionalRating(request.professionalId);

    return review;
  }

  /**
   * Ottieni tutte le recensioni di un professionista
   */
  async getProfessionalReviews(professionalId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { professionalId },
        include: {
          User_Review_clientIdToUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          AssistanceRequest: {
            select: {
              id: true,
              categoryId: true,
              createdAt: true,
              Category: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.review.count({
        where: { professionalId }
      })
    ]);

    return {
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Ottieni le statistiche delle recensioni di un professionista
   */
  async getProfessionalStats(professionalId: string) {
    const reviews = await prisma.review.findMany({
      where: { professionalId },
      select: { rating: true }
    });

    if (reviews.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        distribution: { 
          1: 0, 
          2: 0, 
          3: 0, 
          4: 0, 
          5: 0 
        }
      };
    }

    // Calcola il rating medio
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / reviews.length;

    // Calcola la distribuzione delle stelle
    const distribution = reviews.reduce((acc, r) => {
      acc[r.rating] = (acc[r.rating] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Assicura che tutte le stelle siano presenti
    for (let i = 1; i <= 5; i++) {
      if (!distribution[i]) {
        distribution[i] = 0;
      }
    }

    return {
      totalReviews: reviews.length,
      averageRating: Math.round(averageRating * 10) / 10, // Arrotonda a una cifra decimale
      distribution
    };
  }

  /**
   * Verifica se un cliente può recensire una richiesta
   */
  async canReview(clientId: string, requestId: string) {
    const request = await prisma.assistanceRequest.findUnique({
      where: { id: requestId },
      include: { Review: true }
    });

    if (!request) {
      return { canReview: false, reason: 'Richiesta non trovata' };
    }

    if (request.clientId !== clientId) {
      return { canReview: false, reason: 'Non sei autorizzato' };
    }

    if (request.status !== 'COMPLETED') {
      return { canReview: false, reason: 'Intervento non ancora completato' };
    }

    if (request.Review) {
      return { canReview: false, reason: 'Hai già recensito questo intervento' };
    }

    return { canReview: true, reason: null };
  }

  /**
   * Aggiorna una recensione (utile o non utile)
   */
  async updateHelpfulCount(reviewId: string, isHelpful: boolean) {
    return await prisma.review.update({
      where: { id: reviewId },
      data: {
        helpfulCount: {
          increment: isHelpful ? 1 : 0
        },
        reportedCount: {
          increment: !isHelpful ? 1 : 0
        }
      }
    });
  }

  /**
   * Ottieni una recensione specifica
   */
  async getReview(reviewId: string) {
    return await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        User_Review_clientIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        User_Review_professionalIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        AssistanceRequest: {
          select: {
            id: true,
            title: true,
            categoryId: true
          }
        }
      }
    });
  }

  /**
   * Aggiorna il rating medio del professionista (metodo privato)
   */
  private async updateProfessionalRating(professionalId: string) {
    const stats = await this.getProfessionalStats(professionalId);
    
    // Se il modello User ha un campo per il rating medio, aggiornalo qui
    // await prisma.user.update({
    //   where: { id: professionalId },
    //   data: { 
    //     averageRating: stats.averageRating,
    //     totalReviews: stats.totalReviews
    //   }
    // });
    
    // Per ora, solo log
    console.log(`Aggiornato rating per professionista ${professionalId}: ${stats.averageRating} (${stats.totalReviews} recensioni)`);
  }

  /**
   * Ottieni le ultime recensioni del sistema (per admin)
   */
  async getLatestReviews(limit = 10) {
    return await prisma.review.findMany({
      include: {
        User_Review_clientIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        User_Review_professionalIdToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  /**
   * Elimina una recensione (solo admin)
   */
  async deleteReview(reviewId: string) {
    return await prisma.review.delete({
      where: { id: reviewId }
    });
  }

  // ============================================
  // SISTEMA CONFIGURAZIONE RECENSIONI AVANZATE
  // ============================================

  /**
   * Ottieni la configurazione del sistema recensioni
   */
  async getReviewSystemConfig() {
    let config = await prisma.reviewSystemConfig.findFirst();

    // Se non esiste, crea configurazione di default
    if (!config) {
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
          defaultSortOrder: "recent",
          reviewsPerPage: 10,
          enableBadges: true,
          topRatedThreshold: 4.5,
          enableLoyaltyPoints: false,
          pointsPerReview: 10,
          notifyProfessionalOnReview: true,
          remindClientAfterDays: 3,
          notifyAdminOnProblematic: true
        }
      });
    }

    return config;
  }

  /**
   * Aggiorna la configurazione del sistema recensioni
   */
  async updateReviewSystemConfig(data: ReviewSystemConfigData) {
    // Ottieni configurazione esistente o creane una nuova
    let existingConfig = await prisma.reviewSystemConfig.findFirst();

    if (existingConfig) {
      return await prisma.reviewSystemConfig.update({
        where: { id: existingConfig.id },
        data
      });
    } else {
      return await prisma.reviewSystemConfig.create({
        data: {
          ...data
        }
      });
    }
  }

  /**
   * Verifica se una recensione contiene parole proibite
   */
  async checkContentModeration(comment: string): Promise<{ isApproved: boolean; reason?: string }> {
    const config = await this.getReviewSystemConfig();

    if (!config.autoModeration || !config.contentFilter) {
      return { isApproved: true };
    }

    const bannedWords = config.bannedWords || [];
    const lowerComment = comment.toLowerCase();

    for (const word of bannedWords) {
      if (lowerComment.includes(word.toLowerCase())) {
        return {
          isApproved: false,
          reason: `Contiene parola proibita: ${word}`
        };
      }
    }

    return { isApproved: true };
  }

  /**
   * Verifica se una recensione richiede approvazione manuale
   */
  async requiresManualApproval(rating: number): Promise<boolean> {
    const config = await this.getReviewSystemConfig();

    if (!config.requireManualApproval) {
      return false;
    }

    // Richiede approvazione se il rating è sotto la soglia
    return rating <= (config.autoApproveThreshold || 3);
  }

  /**
   * Verifica se notificare admin per rating basso
   */
  async shouldNotifyAdminForLowRating(rating: number): Promise<boolean> {
    const config = await this.getReviewSystemConfig();

    if (!config.notifyAdminForLowRatings) {
      return false;
    }

    return rating <= (config.lowRatingThreshold || 2);
  }

  /**
   * Ottieni recensioni filtrate e ordinate secondo configurazione
   */
  async getFilteredReviews(professionalId: string, options: {
    page?: number;
    limit?: number;
    sortBy?: string;
    minRating?: number;
    maxRating?: number;
    hasComment?: boolean;
  } = {}) {
    const config = await this.getReviewSystemConfig();

    const {
      page = 1,
      limit = config.reviewsPerPage || 10,
      sortBy = config.defaultSortOrder || 'recent',
      minRating,
      maxRating,
      hasComment
    } = options;

    const skip = (page - 1) * limit;

    // Costruisci where clause
    const where: any = { professionalId };

    if (minRating !== undefined) {
      where.rating = { ...where.rating, gte: minRating };
    }
    if (maxRating !== undefined) {
      where.rating = { ...where.rating, lte: maxRating };
    }
    if (hasComment !== undefined) {
      if (hasComment) {
        where.comment = { not: null };
      } else {
        where.comment = null;
      }
    }

    // Determina ordinamento
    let orderBy: any;
    switch (sortBy) {
      case 'rating_high':
        orderBy = { rating: 'desc' };
        break;
      case 'rating_low':
        orderBy = { rating: 'asc' };
        break;
      case 'helpful':
        orderBy = { helpfulCount: 'desc' };
        break;
      case 'recent':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          request: {
            select: {
              id: true,
              categoryId: true,
              createdAt: true,
              category: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.review.count({ where })
    ]);

    return {
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      config: {
        reviewsPerPage: limit,
        sortBy
      }
    };
  }

  /**
   * Ottieni statistiche recensioni con configurazione
   */
  async getProfessionalStatsWithConfig(professionalId: string) {
    const [reviews, config] = await Promise.all([
      prisma.review.findMany({
        where: { professionalId },
        select: { rating: true, createdAt: true }
      }),
      this.getReviewSystemConfig()
    ]);

    if (reviews.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        distribution: {
          1: 0, 2: 0, 3: 0, 4: 0, 5: 0
        },
        showAverage: false,
        config
      };
    }

    // Calcola statistiche
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / reviews.length;

    const distribution = reviews.reduce((acc, r) => {
      acc[r.rating] = (acc[r.rating] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Assicura che tutte le stelle siano presenti
    for (let i = 1; i <= 5; i++) {
      if (!distribution[i]) {
        distribution[i] = 0;
      }
    }

    return {
      totalReviews: reviews.length,
      averageRating: Math.round(averageRating * 10) / 10,
      distribution,
      showAverage: reviews.length >= (config.minReviewsToShowAverage || 3),
      config
    };
  }
}

export const reviewService = new ReviewService();
