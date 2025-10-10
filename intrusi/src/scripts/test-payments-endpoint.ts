import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPaymentsEndpoint() {
  console.log('🔍 Test endpoint pagamenti...\n');
  
  try {
    // Test creando un pagamento di esempio se non esistono
    const count = await prisma.payment.count();
    console.log(`📊 Pagamenti nel database: ${count}`);
    
    if (count === 0) {
      console.log('⚠️ Nessun pagamento trovato, ne creo uno di test...');
      
      // Trova un client e un professional
      const client = await prisma.user.findFirst({ where: { role: 'CLIENT' } });
      const professional = await prisma.user.findFirst({ where: { role: 'PROFESSIONAL' } });
      
      if (client && professional) {
        const payment = await prisma.payment.create({
          data: {
            clientId: client.id,
            professionalId: professional.id,
            amount: 100,
            totalAmount: 100,
            professionalAmount: 85,
            platformFee: 15,
            platformFeePercentage: 15,
            currency: 'EUR',
            type: 'FINAL_PAYMENT',
            status: 'COMPLETED',
            paymentMethod: 'CARD',
            description: 'Pagamento di test',
            metadata: {}
          }
        });
        console.log('✅ Pagamento di test creato:', payment.id);
      }
    }
    
    // Simula quello che fa l'API
    const payments = await prisma.payment.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        client: true,
        professional: true,
        request: true,
        quote: true,
        invoice: true,
        paymentSplits: true
      }
    });
    
    const total = await prisma.payment.count();
    
    console.log('\n📦 Struttura risposta API (come dovrebbe essere):');
    console.log({
      payments: `[${payments.length} pagamenti]`,
      pagination: {
        page: 1,
        limit: 10,
        total,
        pages: Math.ceil(total / 10)
      }
    });
    
  } catch (error) {
    console.error('Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPaymentsEndpoint();
