import { prisma } from '../config/database';
import logger from '../utils/logger';

interface CreatePortfolioData {
  title: string;
  description?: string;
  beforeImage: string;
  afterImage: string;
  professionalId: string;
  categoryId: string;
  requestId?: string;
  technicalDetails?: string;
  materialsUsed?: string;
  duration?: string;
  cost?: number;
  tags?: string[];
  location?: string;
  workCompletedAt?: Date;
}

interface UpdatePortfolioData {
  title?: string;
  description?: string;
  beforeImage?: string;
  afterImage?: string;
  categoryId?: string;
  technicalDetails?: string;
  materialsUsed?: string;
  duration?: string;
  cost?: number;
  tags?: string[];
  location?: string;
  isPublic?: boolean;
}

class PortfolioService {
  /**
   * Crea un nuovo portfolio
   */
  async createPortfolio(data: CreatePortfolioData) {
    try {
      const portfolio = await prisma.portfolio.create({
        data: {
          ...data,
          isPublic: true,
          viewCount: 0
        },
        include: {
          category: true,
          professional: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              avatar: true
            }
          },
          request: true
        }
      });

      logger.info('Portfolio created', { portfolioId: portfolio.id });
      return portfolio;
    } catch (error) {
      logger.error('Error creating portfolio:', error);
      throw error;
    }
  }

  /**
   * Ottieni tutti i portfolio di un professionista
   */
  async getProfessionalPortfolio(professionalId: string, includePrivate = false) {
    try {
      const where: any = {
        professionalId
      };

      // Se non includiamo i privati, filtra solo pubblici
      if (!includePrivate) {
        where.isPublic = true;
      }

      const portfolios = await prisma.portfolio.findMany({
        where,
        include: {
          category: true,
          professional: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return portfolios;
    } catch (error) {
      logger.error('Error fetching professional portfolio:', error);
      throw error;
    }
  }

  /**
   * Ottieni un singolo portfolio per ID
   */
  async getPortfolioById(id: string) {
    try {
      const portfolio = await prisma.portfolio.findUnique({
        where: { id },
        include: {
          category: true,
          professional: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              avatar: true,
              bio: true,
              phone: true,
              email: true
            }
          },
          request: {
            include: {
              category: true,
              subcategory: true
            }
          }
        }
      });

      if (!portfolio) {
        throw new Error('Portfolio not found');
      }

      return portfolio;
    } catch (error) {
      logger.error('Error fetching portfolio:', error);
      throw error;
    }
  }

  /**
   * Incrementa il contatore visualizzazioni
   */
  async incrementViewCount(portfolioId: string) {
    try {
      await prisma.portfolio.update({
        where: { id: portfolioId },
        data: { viewCount: { increment: 1 } }
      });
    } catch (error) {
      logger.error('Error incrementing view count:', error);
      // Non lanciamo l'errore, è un'operazione non critica
    }
  }

  /**
   * Aggiorna un portfolio
   */
  async updatePortfolio(id: string, professionalId: string, data: UpdatePortfolioData) {
    try {
      // Verifica che il portfolio appartenga al professionista
      const existing = await prisma.portfolio.findFirst({
        where: { 
          id,
          professionalId 
        }
      });

      if (!existing) {
        throw new Error('Portfolio not found or unauthorized');
      }

      const updated = await prisma.portfolio.update({
        where: { id },
        data,
        include: {
          category: true,
          professional: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              avatar: true
            }
          }
        }
      });

      logger.info('Portfolio updated', { portfolioId: id });
      return updated;
    } catch (error) {
      logger.error('Error updating portfolio:', error);
      throw error;
    }
  }

  /**
   * Elimina un portfolio
   */
  async deletePortfolio(id: string, professionalId: string) {
    try {
      // Verifica che il portfolio appartenga al professionista
      const existing = await prisma.portfolio.findFirst({
        where: { 
          id,
          professionalId 
        }
      });

      if (!existing) {
        throw new Error('Portfolio not found or unauthorized');
      }

      await prisma.portfolio.delete({
        where: { id }
      });

      logger.info('Portfolio deleted', { portfolioId: id });
      return true;
    } catch (error) {
      logger.error('Error deleting portfolio:', error);
      throw error;
    }
  }

  /**
   * Ottieni portfolio per categoria
   */
  async getPortfolioByCategory(categoryId: string, limit = 20) {
    try {
      const portfolios = await prisma.portfolio.findMany({
        where: {
          categoryId,
          isPublic: true
        },
        include: {
          category: true,
          professional: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              avatar: true
            }
          }
        },
        orderBy: { viewCount: 'desc' },
        take: limit
      });

      return portfolios;
    } catch (error) {
      logger.error('Error fetching portfolio by category:', error);
      throw error;
    }
  }

  /**
   * Ricerca portfolio
   */
  async searchPortfolio(query: string, filters?: {
    categoryId?: string;
    professionalId?: string;
    tags?: string[];
    location?: string;
  }) {
    try {
      const where: any = {
        isPublic: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { technicalDetails: { contains: query, mode: 'insensitive' } },
          { materialsUsed: { contains: query, mode: 'insensitive' } },
          { location: { contains: query, mode: 'insensitive' } }
        ]
      };

      if (filters?.categoryId) {
        where.categoryId = filters.categoryId;
      }

      if (filters?.professionalId) {
        where.professionalId = filters.professionalId;
      }

      if (filters?.location) {
        where.location = { contains: filters.location, mode: 'insensitive' };
      }

      if (filters?.tags && filters.tags.length > 0) {
        where.tags = { hasSome: filters.tags };
      }

      const portfolios = await prisma.portfolio.findMany({
        where,
        include: {
          category: true,
          professional: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              avatar: true
            }
          }
        },
        orderBy: { viewCount: 'desc' },
        take: 50
      });

      return portfolios;
    } catch (error) {
      logger.error('Error searching portfolio:', error);
      throw error;
    }
  }

  /**
   * Ottieni i portfolio più visualizzati
   */
  async getPopularPortfolios(limit = 10) {
    try {
      const portfolios = await prisma.portfolio.findMany({
        where: {
          isPublic: true
        },
        include: {
          category: true,
          professional: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              avatar: true
            }
          }
        },
        orderBy: { viewCount: 'desc' },
        take: limit
      });

      return portfolios;
    } catch (error) {
      logger.error('Error fetching popular portfolios:', error);
      throw error;
    }
  }

  /**
   * Ottieni i portfolio recenti
   */
  async getRecentPortfolios(limit = 10) {
    try {
      const portfolios = await prisma.portfolio.findMany({
        where: {
          isPublic: true
        },
        include: {
          category: true,
          professional: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return portfolios;
    } catch (error) {
      logger.error('Error fetching recent portfolios:', error);
      throw error;
    }
  }
}

export const portfolioService = new PortfolioService();
