import { prisma } from '../config/database';

/**
 * Servizio per calcolare range di prezzi indicativi
 * basato sui preventivi accettati degli ultimi 6 mesi
 */
class PricingService {
  
  /**
   * Calcola il range di prezzi per una categoria/sottocategoria
   * @param categoryId ID della categoria
   * @param subcategoryId ID della sottocategoria (opzionale)
   * @returns Range di prezzi o null se non ci sono abbastanza dati
   */
  async getPriceRange(categoryId: string, subcategoryId?: string) {
    try {
      console.log(`[PricingService] Calcolando range prezzi per categoria: ${categoryId}, sottocategoria: ${subcategoryId || 'nessuna'}`);
      
      // Trova preventivi accettati ultimi 6 mesi
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const whereCondition = {
        request: {
          categoryId,
          ...(subcategoryId && { subcategoryId })
        },
        status: 'ACCEPTED' as const,
        createdAt: { gte: sixMonthsAgo }
      };

      console.log(`[PricingService] Cercando preventivi dal: ${sixMonthsAgo.toISOString()}`);

      const quotes = await prisma.quote.findMany({
        where: whereCondition,
        select: {
          amount: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      console.log(`[PricingService] Trovati ${quotes.length} preventivi accettati`);

      // Serve un minimo di 5 preventivi per calcolo affidabile
      if (quotes.length < 5) {
        console.log(`[PricingService] Non abbastanza dati (minimo 5, trovati ${quotes.length})`);
        return null;
      }

      // Converte Decimal in number e ordina
      const amounts = quotes
        .map(q => Number(q.amount))
        .sort((a, b) => a - b);
      
      // Calcola percentili 25° e 75° per un range realistico
      const p25Index = Math.floor(amounts.length * 0.25);
      const p75Index = Math.floor(amounts.length * 0.75);
      const medianIndex = Math.floor(amounts.length / 2);
      
      const priceRange = {
        min: Math.floor(amounts[p25Index]),
        max: Math.ceil(amounts[p75Index]),
        median: amounts[medianIndex],
        sampleSize: amounts.length,
        average: Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length),
        lastUpdated: new Date()
      };

      console.log(`[PricingService] Range calcolato:`, priceRange);
      return priceRange;

    } catch (error) {
      console.error('[PricingService] Errore nel calcolo range prezzi:', error);
      throw new Error('Errore nel calcolo del range prezzi');
    }
  }

  /**
   * Calcola pricing completo per una categoria con tutte le sottocategorie
   * @param categoryId ID della categoria
   * @returns Pricing completo della categoria
   */
  async getCategoryPricing(categoryId: string) {
    try {
      console.log(`[PricingService] Calcolando pricing completo per categoria: ${categoryId}`);

      // Carica categoria con sottocategorie
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        include: { 
          subcategories: {
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' }
          }
        }
      });

      if (!category) {
        throw new Error('Categoria non trovata');
      }

      // Range generale della categoria
      const categoryRange = await this.getPriceRange(categoryId);
      
      // Range per ogni sottocategoria
      const subcategoriesRanges = await Promise.all(
        category.subcategories.map(async (sub) => ({
          subcategory: sub,
          range: await this.getPriceRange(categoryId, sub.id)
        }))
      );

      // Filtra solo sottocategorie con dati sufficienti
      const validSubcategoriesRanges = subcategoriesRanges.filter(s => s.range !== null);

      console.log(`[PricingService] Pricing categoria completato. Sottocategorie con dati: ${validSubcategoriesRanges.length}/${category.subcategories.length}`);

      return {
        category,
        overallRange: categoryRange,
        subcategoriesRanges: validSubcategoriesRanges,
        stats: {
          totalSubcategories: category.subcategories.length,
          subcategoriesWithData: validSubcategoriesRanges.length,
          hasOverallData: categoryRange !== null
        }
      };

    } catch (error) {
      console.error('[PricingService] Errore nel calcolo pricing categoria:', error);
      throw error;
    }
  }

  /**
   * Recupera statistiche generali sui prezzi
   * @returns Statistiche generali
   */
  async getPricingStats() {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const stats = await prisma.quote.aggregate({
        where: {
          status: 'ACCEPTED',
          createdAt: { gte: sixMonthsAgo }
        },
        _count: true,
        _avg: { amount: true },
        _min: { amount: true },
        _max: { amount: true }
      });

      return {
        totalQuotes: stats._count,
        averageAmount: stats._avg.amount ? Number(stats._avg.amount) : 0,
        minAmount: stats._min.amount ? Number(stats._min.amount) : 0,
        maxAmount: stats._max.amount ? Number(stats._max.amount) : 0,
        lastSixMonths: true
      };

    } catch (error) {
      console.error('[PricingService] Errore nel calcolo statistiche:', error);
      throw error;
    }
  }
}

export const pricingService = new PricingService();
