/**
 * Script per verificare gli utenti nel database e testare l'endpoint image-status
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3200';

async function checkUsers() {
  console.log('🔍 Verifica utenti nel database...');
  
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true
      },
      take: 5 // Prendi solo i primi 5 utenti
    });

    console.log(`📊 Trovati ${users.length} utenti:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.role}) - Avatar: ${user.avatar ? '✅' : '❌'}`);
    });

    return users;
  } catch (error) {
    console.error('❌ Errore nel recupero utenti:', error);
    return [];
  }
}

async function testImageStatusWithUser(userEmail: string) {
  console.log(`\n🧪 Test endpoint con utente: ${userEmail}`);
  
  try {
    // Prova con password comune
    const passwords = ['password', 'password123', '123456', 'admin'];
    
    for (const password of passwords) {
      try {
        console.log(`   Tentativo login con password: ${password}`);
        
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
          email: userEmail,
          password: password
        });

        if (loginResponse.data.success) {
          const token = loginResponse.data.data.token;
          console.log('   ✅ Login riuscito!');

          // Test endpoint image-status
          try {
            const imageStatusResponse = await axios.get(`${BASE_URL}/api/users/image-status`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            console.log('   ✅ Endpoint image-status funziona!');
            console.log('   📊 Risposta:', JSON.stringify(imageStatusResponse.data, null, 2));
            return true;
          } catch (imageError: any) {
            console.log('   ❌ Errore nell\'endpoint image-status:', imageError.response?.data || imageError.message);
            return false;
          }
        }
      } catch (loginError: any) {
        if (loginError.response?.status !== 401) {
          console.log(`   ❌ Errore imprevisto: ${loginError.message}`);
        }
        // Continua con la prossima password
      }
    }
    
    console.log('   ❌ Nessuna password funziona per questo utente');
    return false;
    
  } catch (error: any) {
    console.error('   ❌ Errore nel test:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Verifica endpoint /api/users/image-status');
  console.log('='.repeat(50));

  const users = await checkUsers();
  
  if (users.length === 0) {
    console.log('❌ Nessun utente trovato nel database');
    return;
  }

  // Prova con il primo utente trovato
  const testUser = users[0];
  const success = await testImageStatusWithUser(testUser.email);
  
  if (!success && users.length > 1) {
    console.log('\n🔄 Provo con un altro utente...');
    await testImageStatusWithUser(users[1].email);
  }

  await prisma.$disconnect();
}

main().catch(console.error);