/**
 * Debug script per verificare JWT_SECRET e token
 */

import dotenv from 'dotenv';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';

// Carica .env
dotenv.config();

const BASE_URL = 'http://localhost:3200';

async function debugJWT() {
  console.log('🔍 Debug JWT Configuration');
  console.log('='.repeat(50));

  // 1. Verifica JWT_SECRET
  console.log('1. Verifica JWT_SECRET:');
  const jwtSecret = process.env.JWT_SECRET;
  console.log(`   JWT_SECRET definito: ${!!jwtSecret}`);
  console.log(`   JWT_SECRET lunghezza: ${jwtSecret?.length || 0} caratteri`);
  console.log(`   JWT_SECRET (primi 10 char): ${jwtSecret?.substring(0, 10)}...`);

  if (!jwtSecret) {
    console.log('❌ JWT_SECRET non trovato!');
    return;
  }

  // 2. Test login e analisi token
  console.log('\n2. Test login e analisi token:');
  
  try {
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'staff@assistenza.it',
      password: 'password123'
    });

    console.log('   Risposta login completa:', JSON.stringify(loginResponse.data, null, 2));
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data?.accessToken || loginResponse.data.data?.token || loginResponse.data.token;
      console.log('   ✅ Login riuscito');
      
      if (token) {
        console.log(`   Token (primi 50 char): ${token.substring(0, 50)}...`);

        // 3. Verifica manuale del token
        console.log('\n3. Verifica manuale del token:');
        
        try {
          const decoded = jwt.verify(token, jwtSecret) as any;
          console.log('   ✅ Token valido!');
          console.log('   Payload:', JSON.stringify(decoded, null, 2));

          // 4. Test endpoint con token
          console.log('\n4. Test endpoint /api/users/image-status:');
          
          const imageStatusResponse = await axios.get(`${BASE_URL}/api/users/image-status`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          console.log('   ✅ Endpoint funziona!');
          console.log('   Risposta:', JSON.stringify(imageStatusResponse.data, null, 2));

        } catch (verifyError: any) {
          console.log('   ❌ Errore nella verifica manuale del token:');
          console.log(`   Tipo errore: ${verifyError.name}`);
          console.log(`   Messaggio: ${verifyError.message}`);
        }
      } else {
        console.log('   ❌ Token non trovato nella risposta');
      }

    } else {
      console.log('   ❌ Login fallito:', loginResponse.data);
    }

  } catch (error: any) {
    console.log('   ❌ Errore durante il login:');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data:`, error.response.data);
    } else {
      console.log(`   Messaggio: ${error.message}`);
    }
  }
}

debugJWT().catch(console.error);