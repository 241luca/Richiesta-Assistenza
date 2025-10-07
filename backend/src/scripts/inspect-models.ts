import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspectModels() {
  console.log('🔍 Ispezione modelli database...\n');
  
  try {
    // Test Payment model con i campi CORRETTI che Prisma ci ha detto
    console.log('📊 PAYMENT MODEL - Campi disponibili:');
    const samplePayment = await prisma.payment.findFirst({
      include: {
        client: true,
        professional: true,
        request: true,
        quote: true,          // SINGOLARE, non plurale
        invoice: true,        // SINGOLARE, non plurale
        createdByUser: true,
        payoutItems: true,
        paymentSplits: true
      }
    });
    
    if (samplePayment) {
      console.log('✅ Payment trovato! Campi:', Object.keys(samplePayment));
    } else {
      console.log('⚠️ Nessun payment trovato, creiamone uno di test');
    }
    
    // Test groupBy 
    console.log('\n📊 TEST GROUPBY:');
    const testGroupStatus = await prisma.payment.groupBy({
      by: ['status'],
      _count: { _all: true }
    });
    console.log('✅ GroupBy per status funziona:', testGroupStatus);
    
    const testGroupMethod = await prisma.payment.groupBy({
      by: ['method'],
      _count: { _all: true },
      _sum: { amount: true }
    });
    console.log('✅ GroupBy per method funziona:', testGroupMethod);
    
    // Vediamo quali sono TUTTI i campi disponibili
    console.log('\n📊 SCHEMA PAYMENT - Lista campi:');
    const rawQuery = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Payment'
      ORDER BY ordinal_position
    `;
    console.log('Campi nel database:', rawQuery);
    
  } catch (error) {
    console.error('Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

inspectModels();
