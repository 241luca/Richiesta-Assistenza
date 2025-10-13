/**
 * METODI MANCANTI DA AGGIUNGERE A payment.service.ts
 * Service per ottenere lista pagamenti con filtri
 */

import { prisma } from '../config/database';
import { logger } from '../utils/logger';

class PaymentListService {
  /**
   * Lista pagamenti con filtri (per admin)
   */
  async getPayments(filters: {
    status?: string;
    type?: string;
    method?: string;
    searchTerm?: string;
    from?: string | Date;
    to?: string | Date;
    limit?: number;
    offset?: number;
  }) {
    try {
      const where: any = {};

      // Filtro per stato
      if (filters.status && filters.status !== '') {
        where.status = filters.status;
      }

      // Filtro per tipo
      if (filters.type && filters.type !== '') {
        where.type = filters.type;
      }

      // Filtro per metodo
      if (filters.method && filters.method !== '') {
        where.paymentMethod = filters.method;
      }

      // Filtro per data
      if (filters.from || filters.to) {
        where.createdAt = {};
        if (filters.from) {
          where.createdAt.gte = new Date(filters.from);
        }
        if (filters.to) {
          where.createdAt.lte = new Date(filters.to);
        }
      }

      // Ricerca testuale
      if (filters.searchTerm && filters.searchTerm !== '') {
        where.OR = [
          { stripePaymentId: { contains: filters.searchTerm } },
          { description: { contains: filters.searchTerm } },
          { client: { email: { contains: filters.searchTerm } } },
          { client: { firstName: { contains: filters.searchTerm } } },
          { client: { lastName: { contains: filters.searchTerm } } },
        ];
      }

      // Query con paginazione
      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            },
            professional: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            },
            quote: {
              include: {
                request: {
                  select: {
                    id: true,
                    title: true,
                    Subcategory: {
                      select: {
                        name: true
                      }
                    }
                  }
                }
              }
            },
            refunds: true,
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: filters.limit || 50,
          skip: filters.offset || 0,
        }),
        prisma.payment.count({ where })
      ]);

      return {
        data: payments,
        total,
        limit: filters.limit || 50,
        offset: filters.offset || 0
      };
    } catch (error) {
      logger.error('Error getting payments:', error);
      throw error;
    }
  }
}

export const paymentListService = new PaymentListService();
