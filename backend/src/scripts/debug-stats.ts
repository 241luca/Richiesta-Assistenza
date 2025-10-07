import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugStats() {
  console.log('🔍 Debug Statistiche Pagamenti\n');
  
  try {
    // Login come admin
    console.log('1️⃣ Login...');
    const loginResponse = await axios.post('http://localhost:3200/api/auth/login', {
      email: 'admin@assistenza.it',
      password: 'Admin@2024!'
    });
    
    const token = loginResponse.data.data.tokens.accessToken;
    
    const api = axios.create({
      baseURL: 'http://localhost:3200/api',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    // Ottieni le stats
    console.log('\n2️⃣ Chiamata /api/payments/stats...');
    const statsResponse = await api.get('/payments/stats', {
      params: {
        startDate: '2025-01-01',
        endDate: '2025-12-31'
      }
    });
    
    console.log('\n✅ DATI RICEVUTI DAL BACKEND:');
    console.log(JSON.stringify(statsResponse.data.data, null, 2));
    
    // Verifica cosa il frontend si aspetta
    console.log('\n3️⃣ CAMPI CHE IL FRONTEND CERCA (AdminPaymentsDashboard):');
    const expectedFields = [
      'totalRevenue',
      'totalTransactions', 
      'averageTransaction',
      'successRate',
      'pendingAmount',
      'refundedAmount',
      'monthlyGrowth',
      'byStatus',
      'byType'
    ];
    
    const receivedData = statsResponse.data.data;
    console.log('\n📊 CONFRONTO:');
    expectedFields.forEach(field => {
      const exists = field in receivedData;
      console.log(`   ${exists ? '✅' : '❌'} ${field}: ${exists ? 'presente' : 'MANCANTE'}`);
    });
    
    // Crea alcuni pagamenti di test se non ci sono
    const paymentCount = await prisma.payment.count();
    if (paymentCount === 0) {
      console.log('\n4️⃣ Creazione pagamenti di test...');
      
      const client = await prisma.user.findFirst({ where: { role: 'CLIENT' } });
      const professional = await prisma.user.findFirst({ where: { role: 'PROFESSIONAL' } });
      
      if (client && professional) {
        // Crea alcuni pagamenti di esempio
        const payments = [
          { amount: 100, status: 'COMPLETED', type: 'FINAL_PAYMENT' },
          { amount: 50, status: 'COMPLETED', type: 'DEPOSIT' },
          { amount: 200, status: 'PENDING', type: 'FINAL_PAYMENT' },
          { amount: 150, status: 'FAILED', type: 'FINAL_PAYMENT' }
        ];
        
        for (const p of payments) {
          await prisma.payment.create({
            data: {
              clientId: client.id,
              professionalId: professional.id,
              amount: p.amount,
              totalAmount: p.amount,
              professionalAmount: p.amount * 0.85,
              platformFee: p.amount * 0.15,
              platformFeePercentage: 15,
              currency: 'EUR',
              type: p.type as any,
              status: p.status as any,
              paymentMethod: 'CARD',
              description: 'Pagamento di test',
              metadata: {}
            }
          });
        }
        console.log('✅ Creati 4 pagamenti di test');
        
        // Richiama stats con i nuovi dati
        console.log('\n5️⃣ Stats con i nuovi pagamenti:');
        const newStatsResponse = await api.get('/payments/stats');
        console.log(JSON.stringify(newStatsResponse.data.data, null, 2));
      }
    }
    
  } catch (error: any) {
    console.error('❌ Errore:', error.response?.data || error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugStats();
