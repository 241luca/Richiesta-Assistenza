import { prisma } from '../config/database';

interface CreateReviewData {
  requestId: string;
  rating: number;
  comment?: string;
  clientId: string;
}

class ReviewService {
  /**
   * Crea una nuova recensione
   */
  async createReview(data: CreateReviewData) {
    // 1. Verifica che la richiesta esista e sia completata
    const request = await prisma.assistanceRequest.findUnique({
      where: { id: data.requestId },
      include: { professional: true }
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

    // 2. Verifica che non esista già una recensione
    const existingReview = await prisma.review.findUnique({
      where: { requestId: data.requestId }
    });

    if (existingReview) {
      throw new Error('Hai già recensito questo intervento');
    }

    // 3. Crea la recensione
    const review = await prisma.review.create({
      data: {
        requestId: data.requestId,
        rating: data.rating,
        comment: data.comment,
        clientId: data.clientId,
        professionalId: request.professionalId,
        isVerified: true // Verifichiamo automaticamente perché l'utente ha completato l'intervento
      },
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
            createdAt: true
          }
        }
      }
    });

    // 4. Aggiorna il rating medio del professionista (opzionale, se hai un campo per questo)
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
      include: { review: true }
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

    if (request.review) {
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
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        professional: {
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
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        professional: {
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
}

export const reviewService = new ReviewService();
