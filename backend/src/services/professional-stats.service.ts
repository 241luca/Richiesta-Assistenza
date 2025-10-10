import { prisma } from '../config/database';
import { logger } from '../utils/logger';

interface ProfessionalStats {
  completedJobs: number;
  averageRating: number;
  totalReviews: number;
  yearsActive: number;
  responseRate: number;
  totalEarnings: number;
  currentMonthJobs: number;
}

class ProfessionalStatsService {
  /**
   * Calcola tutte le statistiche per un professionista
   */
  async getStats(professionalId: string): Promise<ProfessionalStats> {
    try {
      logger.info(`Calculating stats for professional: ${professionalId}`);

      // 1. Lavori completati
      const completedRequests = await prisma.assistanceRequest.count({
        where: {
          professionalId,
          status: 'COMPLETED'
        }
      });

      // 2. Rating medio e numero di recensioni
      const reviews = await prisma.review.findMany({
        where: { professionalId },
        select: { rating: true }
      });
      
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      // 3. Anni di attività (dalla data di registrazione)
      const professional = await prisma.user.findUnique({
        where: { id: professionalId },
        select: { createdAt: true }
      });
      
      if (!professional) {
        throw new Error('Professionista non trovato');
      }
      
      const yearsActive = Math.floor(
        (new Date().getTime() - professional.createdAt.getTime()) / (365 * 24 * 60 * 60 * 1000)
      );

      // 4. Tasso di risposta (richieste completate vs assegnate)
      const assignedRequests = await prisma.assistanceRequest.count({
        where: { professionalId }
      });
      
      const responseRate = assignedRequests > 0
        ? Math.round((completedRequests / assignedRequests) * 100)
        : 100; // Se non ha richieste assegnate, mostra 100%

      // 5. Guadagni totali (dai pagamenti completati)
      const paymentsResult = await prisma.payment.aggregate({
        where: {
          professionalId,
          status: 'COMPLETED'
        },
        _sum: {
          amount: true
        }
      });
      
      const totalEarnings = paymentsResult._sum.amount || 0;

      // 6. Lavori del mese corrente
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const currentMonthJobs = await prisma.assistanceRequest.count({
        where: {
          professionalId,
          status: 'COMPLETED',
          completedDate: {
            gte: startOfMonth
          }
        }
      });

      const stats: ProfessionalStats = {
        completedJobs: completedRequests,
        averageRating: Math.round(avgRating * 10) / 10, // Arrotonda a 1 decimale
        totalReviews: reviews.length,
        yearsActive: Math.max(0, yearsActive), // Non può essere negativo
        responseRate,
        totalEarnings: Number(totalEarnings),
        currentMonthJobs
      };

      logger.info(`Stats calculated for professional ${professionalId}:`, stats);
      
      return stats;
    } catch (error) {
      logger.error('Error calculating professional stats:', error);
      throw error;
    }
  }

  /**
   * Ottiene statistiche rapide (versione cache-friendly)
   */
  async getQuickStats(professionalId: string) {
    try {
      // Query più veloce con solo i dati essenziali
      const [completedJobs, totalReviews] = await Promise.all([
        prisma.assistanceRequest.count({
          where: {
            professionalId,
            status: 'COMPLETED'
          }
        }),
        prisma.review.count({
          where: { professionalId }
        })
      ]);

      return {
        completedJobs,
        totalReviews,
        isActive: completedJobs > 0
      };
    } catch (error) {
      logger.error('Error calculating quick stats:', error);
      throw error;
    }
  }

  /**
   * Aggiorna le statistiche dopo un'azione specifica
   */
  async updateStatsCache(professionalId: string, action: 'JOB_COMPLETED' | 'REVIEW_ADDED' | 'PAYMENT_RECEIVED') {
    try {
      logger.info(`Updating stats cache for professional ${professionalId} after ${action}`);
      
      // Qui potremmo implementare un sistema di cache Redis
      // Per ora ricolcoliamo tutto
      const stats = await this.getStats(professionalId);
      
      logger.info(`Stats cache updated for professional ${professionalId}`);
      
      return stats;
    } catch (error) {
      logger.error('Error updating stats cache:', error);
      throw error;
    }
  }
}

export const professionalStatsService = new ProfessionalStatsService();
