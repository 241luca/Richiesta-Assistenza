/**
 * Test per vedere i dettagli completi delle istanze
 */

import axios from 'axios';

async function testEvolutionDetails() {
  const baseUrl = 'http://37.27.89.35:8080';
  const apiKey = 'evolution_key_luca_2025_secure_21806';
  
  console.log('\n🔍 Dettagli completi istanze Evolution API...\n');

  const api = axios.create({
    baseURL: baseUrl,
    headers: {
      'apikey': apiKey,
      'Content-Type': 'application/json'
    }
  });

  try {
    // Recupera tutte le istanze
    const instances = await api.get('/instance/fetchInstances');
    
    console.log(`📋 Trovate ${instances.data.length} istanze:\n`);
    
    // Mostra TUTTI i dettagli di ogni istanza
    instances.data.forEach((inst: any, index: number) => {
      console.log(`========== ISTANZA ${index + 1} ==========`);
      console.log(JSON.stringify(inst, null, 2));
      console.log('');
    });

    // Prova a eliminare le istanze non valide e crearne una nuova
    console.log('\n🔧 Pulizia e creazione nuova istanza...\n');
    
    // Elimina istanze senza nome
    for (const inst of instances.data) {
      if (!inst.instanceName && inst.instanceId) {
        try {
          console.log(`Eliminando istanza con ID: ${inst.instanceId}`);
          await api.delete(`/instance/delete/${inst.instanceId}`);
          console.log('✅ Eliminata');
        } catch (e) {
          console.log('❌ Non riuscito');
        }
      }
    }

    // Ora crea una nuova istanza "main"
    console.log('\n📱 Creazione istanza "main"...\n');
    
    try {
      const createResponse = await api.post('/instance/create', {
        instanceName: 'main',
        token: apiKey,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
        rejectCall: false,
        msgCall: '',
        groupsIgnore: false,
        alwaysOnline: false,
        readMessages: false,
        readStatus: false,
        syncFullHistory: false
      });
      
      console.log('✅ Istanza "main" creata!');
      console.log('Response:', JSON.stringify(createResponse.data, null, 2).substring(0, 500));
      
      // Prova a ottenere il QR
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        const connectResponse = await api.get('/instance/connect/main');
        console.log('\n📲 QR Code response:');
        console.log(JSON.stringify(connectResponse.data, null, 2).substring(0, 500));
      } catch (e: any) {
        console.log('Connect error:', e.response?.data);
      }
      
    } catch (error: any) {
      console.log('❌ Errore creazione:', error.response?.data);
    }

  } catch (error: any) {
    console.error('❌ Errore generale:', error.response?.data || error.message);
  }
}

testEvolutionDetails();
