// METODO MANCANTE - getPaymentById
// Service per ottenere dettagli pagamento per ID

import { prisma } from '../config/database';
import { logger } from '../utils/logger';

class PaymentByIdService {
  /**
   * Ottiene dettaglio pagamento per ID
   */
  async getPaymentById(id: string) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
          client: true,
          professional: true,
          quote: {
            include: {
              request: {
                include: {
                  subcategory: true
                }
              }
            }
          },
          refunds: true,
          invoice: true
        }
      });

      return payment;
    } catch (error) {
      logger.error('Error getting payment by id:', error);
      throw error;
    }
  }
}

export const paymentByIdService = new PaymentByIdService();
