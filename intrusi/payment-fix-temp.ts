// Fix temporaneo per far funzionare il dashboard senza Stripe
// Da aggiungere all'inizio di getAdminStats e getPaymentConfig

// In getPaymentConfig:
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

// In getAdminStats - aggiungere all'inizio:
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
    
    // ... resto del codice esistente ...
  }
}
