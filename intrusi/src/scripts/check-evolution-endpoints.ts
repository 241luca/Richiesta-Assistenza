/**
 * Script per verificare gli endpoint di Evolution API
 */

import axios from 'axios';

async function checkEvolutionEndpoints() {
  const baseUrl = 'http://37.27.89.35:8080';
  const apiKey = 'evolution_key_luca_2025_secure_21806';
  
  console.log('\n🔍 Verifica endpoint Evolution API...\n');
  console.log('Server:', baseUrl);
  console.log('----------------------------------------\n');

  const endpoints = [
    { method: 'GET', path: '/', desc: 'Root endpoint' },
    { method: 'GET', path: '/manager', desc: 'Manager UI' },
    { method: 'GET', path: '/instance/list', desc: 'Lista istanze' },
    { method: 'GET', path: '/instance/fetchInstances', desc: 'Fetch instances (v2)' },
    { method: 'POST', path: '/instance/create', desc: 'Crea istanza' },
    { method: 'GET', path: '/instance/connect/main', desc: 'Connetti istanza' },
    { method: 'GET', path: '/instance/connectionState/main', desc: 'Stato connessione' },
    { method: 'GET', path: '/instance/status/main', desc: 'Status istanza' },
    { method: 'GET', path: '/instance/qr/main', desc: 'QR Code (v1)' },
    { method: 'GET', path: '/instance/qrcode/main', desc: 'QR Code (v2)' },
    { method: 'GET', path: '/qrcode/instance/main', desc: 'QR Code (v3)' }
  ];

  for (const endpoint of endpoints) {
    try {
      const config: any = {
        method: endpoint.method,
        url: baseUrl + endpoint.path,
        timeout: 5000,
        headers: {
          'apikey': apiKey
        }
      };

      if (endpoint.method === 'POST' && endpoint.path === '/instance/create') {
        config.data = {
          instanceName: 'test-check',
          qrcode: true
        };
      }

      const response = await axios(config);
      console.log(`✅ ${endpoint.method} ${endpoint.path}`);
      console.log(`   ${endpoint.desc}`);
      console.log(`   Status: ${response.status}`);
      
      // Mostra parte della risposta per capire la struttura
      if (response.data) {
        const preview = JSON.stringify(response.data).substring(0, 100);
        console.log(`   Response: ${preview}...`);
      }
      console.log('');
      
    } catch (error: any) {
      if (error.response) {
        console.log(`❌ ${endpoint.method} ${endpoint.path}`);
        console.log(`   ${endpoint.desc}`);
        console.log(`   Status: ${error.response.status} - ${error.response.statusText}`);
        if (error.response.data) {
          console.log(`   Error: ${JSON.stringify(error.response.data).substring(0, 100)}`);
        }
      } else if (error.code === 'ECONNABORTED') {
        console.log(`⏱️ ${endpoint.method} ${endpoint.path} - Timeout`);
      } else {
        console.log(`❌ ${endpoint.method} ${endpoint.path} - ${error.message}`);
      }
      console.log('');
    }
  }

  console.log('\n📋 Test completato!\n');
  console.log('Suggerimento: Gli endpoint con ✅ sono quelli funzionanti.');
}

checkEvolutionEndpoints();
