import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { ReviewExclusionType } from '@prisma/client';

export interface CreateExclusionData {
  userId: string;
  type: ReviewExclusionType;
  reason: string;
  excludedBy: string;
  isTemporary?: boolean;
  expiresAt?: Date;
}

export interface ExclusionFilters {
  userId?: string;
  type?: ReviewExclusionType;
  isActive?: boolean;
  isTemporary?: boolean;
}

export class ReviewExclusionService {
  /**
   * Verifica se un utente è escluso dal sistema recensioni
   */
  static async isUserExcluded(userId: string, type?: 'CLIENT' | 'PROFESSIONAL'): Promise<boolean> {
    try {
      const exclusion = await prisma.reviewExclusion.findFirst({
        where: {
          userId,
          isActive: true,
          OR: [
            { type: 'BOTH' },
            ...(type ? [{ type }] : [{ type: 'CLIENT' }, { type: 'PROFESSIONAL' }])
          ],
          OR: [
            { isTemporary: false },
            { 
              isTemporary: true,
              expiresAt: {
                gt: new Date()
              }
            }
          ]
        }
      });

      return !!exclusion;
    } catch (error) {
      logger.error('Error checking user exclusion:', error);
      return false;
    }
  }

  /**
   * Verifica se un cliente può lasciare recensioni
   */
  static async canClientReview(clientId: string): Promise<boolean> {
    return !(await this.isUserExcluded(clientId, 'CLIENT'));
  }

  /**
   * Verifica se un professionista può ricevere recensioni
   */
  static async canProfessionalReceiveReviews(professionalId: string): Promise<boolean> {
    return !(await this.isUserExcluded(professionalId, 'PROFESSIONAL'));
  }

  /**
   * Ottiene tutte le esclusioni con filtri opzionali
   */
  static async getExclusions(filters: ExclusionFilters = {}) {
    try {
      const where: any = {};

      if (filters.userId) where.userId = filters.userId;
      if (filters.type) where.type = filters.type;
      if (filters.isActive !== undefined) where.isActive = filters.isActive;
      if (filters.isTemporary !== undefined) where.isTemporary = filters.isTemporary;

      const exclusions = await prisma.reviewExclusion.findMany({
        where,
        include: {
          User_ReviewExclusion_userIdToUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          User_ReviewExclusion_excludedByToUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return exclusions;
    } catch (error) {
      logger.error('Error fetching exclusions:', error);
      throw new Error('Errore nel caricamento delle esclusioni');
    }
  }

  /**
   * Crea una nuova esclusione
   */
  static async createExclusion(data: CreateExclusionData) {
    try {
      // Verifica che l'utente esista
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
      });

      if (!user) {
        throw new Error('Utente non trovato');
      }

      // Verifica che non ci sia già un'esclusione attiva
      const existingExclusion = await prisma.reviewExclusion.findFirst({
        where: {
          userId: data.userId,
          isActive: true,
        },
      });

      if (existingExclusion) {
        throw new Error('Esclusione già esistente per questo utente');
      }

      const exclusion = await prisma.reviewExclusion.create({
        data: {
          id: crypto.randomUUID(),
          userId: data.userId,
          type: data.type,
          reason: data.reason,
          excludedBy: data.excludedBy,
          isTemporary: data.isTemporary ?? false,
          expiresAt: data.expiresAt,
          updatedAt: new Date(),
        },
        include: {
          User_ReviewExclusion_userIdToUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          },
          User_ReviewExclusion_excludedByToUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
      });

      logger.info('Created review exclusion', { 
        exclusionId: exclusion.id, 
        userId: data.userId,
        type: data.type,
        excludedBy: data.excludedBy 
      });

      return exclusion;
    } catch (error) {
      logger.error('Error creating exclusion:', error);
      throw error;
    }
  }

  /**
   * Rimuove un'esclusione (la disattiva)
   */
  static async removeExclusion(exclusionId: string, removedBy: string) {
    try {
      const exclusion = await prisma.reviewExclusion.findUnique({
        where: { id: exclusionId },
      });

      if (!exclusion) {
        throw new Error('Esclusione non trovata');
      }

      if (!exclusion.isActive) {
        throw new Error('Esclusione già disattivata');
      }

      const updatedExclusion = await prisma.reviewExclusion.update({
        where: { id: exclusionId },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
        include: {
          User_ReviewExclusion_userIdToUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      logger.info('Removed review exclusion', { 
        exclusionId, 
        userId: exclusion.userId,
        removedBy 
      });

      return updatedExclusion;
    } catch (error) {
      logger.error('Error removing exclusion:', error);
      throw error;
    }
  }

  /**
   * Aggiorna un'esclusione esistente
   */
  static async updateExclusion(exclusionId: string, updates: Partial<CreateExclusionData>) {
    try {
      const exclusion = await prisma.reviewExclusion.findUnique({
        where: { id: exclusionId },
      });

      if (!exclusion) {
        throw new Error('Esclusione non trovata');
      }

      const updatedExclusion = await prisma.reviewExclusion.update({
        where: { id: exclusionId },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          excludedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      logger.info('Updated review exclusion', { 
        exclusionId, 
        userId: exclusion.userId,
        updates 
      });

      return updatedExclusion;
    } catch (error) {
      logger.error('Error updating exclusion:', error);
      throw error;
    }
  }

  /**
   * Pulisce le esclusioni temporanee scadute
   */
  static async cleanupExpiredExclusions() {
    try {
      const result = await prisma.reviewExclusion.updateMany({
        where: {
          isTemporary: true,
          isActive: true,
          expiresAt: {
            lt: new Date()
          }
        },
        data: {
          isActive: false,
          updatedAt: new Date(),
        }
      });

      if (result.count > 0) {
        logger.info(`Cleaned up ${result.count} expired review exclusions`);
      }

      return result.count;
    } catch (error) {
      logger.error('Error cleaning up expired exclusions:', error);
      throw error;
    }
  }

  /**
   * Ottiene le statistiche delle esclusioni
   */
  static async getExclusionStats() {
    try {
      const [total, active, temporary, byType] = await Promise.all([
        prisma.reviewExclusion.count(),
        prisma.reviewExclusion.count({ where: { isActive: true } }),
        prisma.reviewExclusion.count({ where: { isTemporary: true, isActive: true } }),
        prisma.reviewExclusion.groupBy({
          by: ['type'],
          where: { isActive: true },
          _count: true,
        })
      ]);

      const typeStats = byType.reduce((acc, item) => {
        acc[item.type] = item._count;
        return acc;
      }, {} as Record<string, number>);

      return {
        total,
        active,
        temporary,
        permanent: active - temporary,
        byType: typeStats,
      };
    } catch (error) {
      logger.error('Error fetching exclusion stats:', error);
      throw error;
    }
  }
}