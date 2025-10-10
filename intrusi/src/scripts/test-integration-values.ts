/**
 * Test per trovare il valore corretto di integration
 */

import axios from 'axios';

async function testIntegrationValues() {
  const baseUrl = 'http://37.27.89.35:8080';
  const apiKey = 'evolution_key_luca_2025_secure_21806';
  
  console.log('\n🔍 Test valori integration per Evolution API v2.2.3...\n');

  const integrationValues = [
    'whatsapp-baileys',
    'WHATSAPP-BAILEYS', 
    'whatsapp',
    'baileys',
    'BAILEYS',
    'whatsapp_baileys',
    'whatsapp-business',
    'WHATSAPP_BUSINESS',
    'WHATSAPP_BAILEYS'
  ];

  // Prima controlliamo la documentazione
  try {
    console.log('📋 Verifica endpoint root per info...\n');
    const rootResponse = await axios.get(baseUrl);
    console.log('Evolution API Info:', rootResponse.data);
    console.log('\n----------------------------------------\n');
  } catch (error) {
    console.error('Error getting root info');
  }

  // Ora testiamo ogni valore
  for (const integration of integrationValues) {
    try {
      console.log(`\n🧪 Testing integration: "${integration}"`);
      
      const response = await axios.post(
        `${baseUrl}/instance/create`,
        {
          instanceName: `test-${Date.now()}`,
          integration: integration,
          token: apiKey,
          qrcode: true
        },
        {
          headers: {
            'apikey': apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      console.log(`✅ SUCCESS with integration: "${integration}"`);
      console.log('Response:', JSON.stringify(response.data).substring(0, 200));
      
      // Se ha funzionato, elimina l'istanza di test
      try {
        await axios.delete(
          `${baseUrl}/instance/delete/test-${Date.now()}`,
          {
            headers: { 'apikey': apiKey }
          }
        );
      } catch (e) {
        // Ignora errori di eliminazione
      }
      
      console.log('\n🎉 VALORE CORRETTO TROVATO:', integration);
      break;
      
    } catch (error: any) {
      if (error.response) {
        console.log(`❌ FAILED with integration: "${integration}"`);
        console.log(`   Error: ${error.response.data?.message || error.response.data?.response?.message}`);
      } else {
        console.log(`❌ Network error with integration: "${integration}"`);
      }
    }
  }

  console.log('\n\n📋 Se nessun valore ha funzionato, proviamo senza il campo integration...\n');
  
  // Test senza integration
  try {
    const response = await axios.post(
      `${baseUrl}/instance/create`,
      {
        instanceName: `test-no-int-${Date.now()}`,
        token: apiKey,
        qrcode: true
        // NO integration field
      },
      {
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );

    console.log('✅ SUCCESS without integration field!');
    console.log('Response:', JSON.stringify(response.data).substring(0, 200));
    
  } catch (error: any) {
    console.log('❌ Failed without integration field');
    console.log('Error:', error.response?.data);
  }
}

testIntegrationValues();
