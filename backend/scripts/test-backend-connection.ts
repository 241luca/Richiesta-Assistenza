#!/usr/bin/env ts-node

/**
 * Test semplice connessione backend
 */

import axios from 'axios';

async function testBackend() {
  console.log('\n🔍 TEST CONNESSIONE BACKEND');
  console.log('============================\n');
  
  // Test diversi endpoint
  const tests = [
    { url: 'http://localhost:3200', name: 'Root' },
    { url: 'http://localhost:3200/api', name: 'API Base' },
    { url: 'http://localhost:3200/api/health', name: 'Health' },
    { url: 'http://127.0.0.1:3200/api/health', name: 'Health (127.0.0.1)' }
  ];
  
  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name} - ${test.url}`);
      const response = await axios.get(test.url, {
        timeout: 5000,
        validateStatus: () => true // Accetta qualsiasi status
      });
      console.log(`✅ ${test.name}: Status ${response.status}`);
      if (response.data) {
        console.log(`   Response:`, JSON.stringify(response.data).substring(0, 100));
      }
    } catch (error: any) {
      console.log(`❌ ${test.name}: ${error.message}`);
    }
    console.log('');
  }
  
  // Test con curl dal sistema
  console.log('📡 Test con CURL di sistema:');
  const { exec } = require('child_process');
  
  await new Promise<void>((resolve) => {
    exec('curl -s http://localhost:3200/api/health', (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Curl fallito:', error.message);
      } else {
        console.log('✅ Curl response:', stdout || '(vuoto)');
      }
      resolve();
    });
  });
  
  console.log('\n📡 Processi in ascolto sulla porta 3200:');
  await new Promise<void>((resolve) => {
    exec('lsof -i :3200', (error, stdout, stderr) => {
      if (stdout) {
        console.log(stdout);
      } else {
        console.log('Nessun processo trovato sulla porta 3200');
      }
      resolve();
    });
  });
  
  process.exit(0);
}

testBackend().catch(console.error);
