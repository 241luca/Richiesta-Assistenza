import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function testPaymentsEndpoints() {
  console.log('🔍 Test endpoints pagamenti...\n');
  
  try {
    // Prima ottieni un token di autenticazione
    console.log('1️⃣ Login come admin...');
    const loginResponse = await axios.post('http://localhost:3200/api/auth/login', {
      email: 'admin@assistenza.it',
      password: 'Admin@2024!'
    });
    
    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login effettuato\n');
    
    // Configura axios con il token
    const api = axios.create({
      baseURL: 'http://localhost:3200/api',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Test endpoint stats
    console.log('2️⃣ Test /api/payments/stats...');
    try {
      const statsResponse = await api.get('/payments/stats', {
        params: {
          startDate: '2025-01-01',
          endDate: '2025-12-31'
        }
      });
      console.log('✅ Stats response:', statsResponse.data.success ? 'OK' : 'FAIL');
      console.log('   Data:', statsResponse.data.data);
    } catch (error: any) {
      console.log('❌ Stats error:', error.response?.status, error.response?.data);
    }
    
    // Test endpoint payments
    console.log('\n3️⃣ Test /api/payments...');
    try {
      const paymentsResponse = await api.get('/payments', {
        params: {
          from: '2025-01-01',
          to: '2025-12-31'
        }
      });
      console.log('✅ Payments response:', paymentsResponse.data.success ? 'OK' : 'FAIL');
      console.log('   Structure:', {
        hasPayments: !!paymentsResponse.data.data?.payments,
        hasPagination: !!paymentsResponse.data.data?.pagination,
        paymentsCount: paymentsResponse.data.data?.payments?.length || 0
      });
    } catch (error: any) {
      console.log('❌ Payments error:', error.response?.status, error.response?.data);
    }
    
    // Test endpoint professional (che NON dovrebbe esistere)
    console.log('\n4️⃣ Test /api/payments/professional/stats (NON dovrebbe esistere)...');
    try {
      await api.get('/payments/professional/stats');
      console.log('⚠️  Esiste ma non dovrebbe!');
    } catch (error: any) {
      console.log('✅ Correttamente 404:', error.response?.status === 404);
    }
    
  } catch (error) {
    console.error('Errore generale:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPaymentsEndpoints();
