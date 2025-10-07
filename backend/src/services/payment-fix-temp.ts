// Fix temporaneo per far funzionare il dashboard senza Stripe
// Classe temporanea per metodi di pagamento

import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { subMonths } from 'date-fns';

class PaymentTempService {
  private readonly PLATFORM_FEE_PERCENT = 15;

  async getPaymentConfig() {
    try {
      // Ritorna config di default se Stripe non è configurato
      return {
        publicKey: 'pk_test_placeholder',
        currency: 'EUR',
        platformFeePercent: this.PLATFORM_FEE_PERCENT,
        paymentMethods: ['card'],
        features: {
          saveCard: false,
          subscriptions: false,
          splitPayments: true
        }
      };
    } catch (error) {
      logger.error('Error getting payment config:', error);
      // Ritorna config minima
      return {
        publicKey: null,
        currency: 'EUR',
        platformFeePercent: 15,
        paymentMethods: [],
        features: {}
      };
    }
  }

  async getAdminStats(filters: { startDate?: Date; endDate?: Date }) {
    try {
      const { startDate = subMonths(new Date(), 1), endDate = new Date() } = filters;

      // Se non ci sono pagamenti, ritorna stats vuote
      const paymentCount = await prisma.payment.count();
      if (paymentCount === 0) {
        return {
          totalRevenue: 0,
          totalTransactions: 0,
          averageTransaction: 0,
          successRate: 0,
          pendingAmount: 0,
          refundedAmount: 0,
          monthlyGrowth: 0,
          topPaymentMethod: 'N/A',
          byStatus: {},
          byType: {},
          recentPayments: []
        };
      }
      
      // Calcola le statistiche base
      const totalRevenue = await prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startDate, lte: endDate }
        },
        _sum: { amount: true }
      });

      const totalTransactions = await prisma.payment.count({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      });

      return {
        totalRevenue: Number(totalRevenue._sum.amount || 0),
        totalTransactions,
        averageTransaction: totalTransactions > 0 
          ? Number(totalRevenue._sum.amount || 0) / totalTransactions 
          : 0,
        successRate: 85, // Mock
        pendingAmount: 0,
        refundedAmount: 0,
        monthlyGrowth: 0,
        topPaymentMethod: 'CARD',
        byStatus: {},
        byType: {},
        recentPayments: []
      };
    } catch (error) {
      logger.error('Error getting admin stats:', error);
      return {
        totalRevenue: 0,
        totalTransactions: 0,
        averageTransaction: 0,
        successRate: 0,
        pendingAmount: 0,
        refundedAmount: 0,
        monthlyGrowth: 0,
        topPaymentMethod: 'N/A',
        byStatus: {},
        byType: {},
        recentPayments: []
      };
    }
  }
}

export const paymentTempService = new PaymentTempService();
