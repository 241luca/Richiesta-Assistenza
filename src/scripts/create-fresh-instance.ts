/**
 * Creazione pulita istanza main
 */

import axios from 'axios';

async function createFreshInstance() {
  const baseUrl = 'http://37.27.89.35:8080';
  const apiKey = 'evolution_key_luca_2025_secure_21806';
  
  console.log('\n✨ Creazione nuova istanza "main" da zero...\n');

  const api = axios.create({
    baseURL: baseUrl,
    headers: {
      'apikey': apiKey,
      'Content-Type': 'application/json'
    }
  });

  try {
    // 1. Verifica che non ci siano istanze
    console.log('1️⃣ Verifica istanze esistenti...');
    const instances = await api.get('/instance/fetchInstances');
    console.log(`   Trovate ${instances.data.length} istanze\n`);
    
    if (instances.data.length > 0) {
      console.log('   ⚠️ Ci sono ancora istanze. Le elenco:');
      instances.data.forEach((inst: any) => {
        console.log(`   - ${inst.name || inst.id}`);
      });
      return;
    }
    
    // 2. Crea nuova istanza
    console.log('2️⃣ Creazione istanza "main"...');
    
    const createPayload = {
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
    };
    
    console.log('   Payload:', JSON.stringify(createPayload, null, 2));
    
    const createResponse = await api.post('/instance/create', createPayload);
    
    console.log('\n✅ ISTANZA CREATA CON SUCCESSO!');
    console.log('Response:', JSON.stringify(createResponse.data, null, 2));
    
    // 3. Aspetta un po' e prova a ottenere il QR
    console.log('\n3️⃣ Attendo 3 secondi...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 4. Prova connect
    console.log('4️⃣ Tentativo di ottenere QR code...');
    
    try {
      const connectResponse = await api.get('/instance/connect/main');
      console.log('Connect response:', JSON.stringify(connectResponse.data, null, 2));
      
      if (connectResponse.data && typeof connectResponse.data === 'object') {
        console.log('\n📱 Se c\'è un QR, dovrebbe essere nei dati sopra.');
        console.log('   Altrimenti vai su: http://37.27.89.35:8080/manager');
        console.log('   Login con: evolution_key_luca_2025_secure_21806');
      }
    } catch (e: any) {
      console.log('Connect error:', e.response?.status);
    }
    
    // 5. Verifica stato finale
    console.log('\n5️⃣ Stato finale istanza:');
    const finalCheck = await api.get('/instance/fetchInstances');
    const mainInstance = finalCheck.data.find((i: any) => i.name === 'main');
    if (mainInstance) {
      console.log('   Nome:', mainInstance.name);
      console.log('   ID:', mainInstance.id);
      console.log('   Stato:', mainInstance.connectionStatus);
      console.log('   Integration:', mainInstance.integration);
    }
    
    console.log('\n🎯 PROSSIMI PASSI:');
    console.log('1. Vai su http://localhost:5193/admin/whatsapp');
    console.log('2. Clicca "Genera QR Code"');
    console.log('3. Se non funziona, usa il manager: http://37.27.89.35:8080/manager');
    
  } catch (error: any) {
    console.error('\n❌ Errore:', error.response?.data || error.message);
  }
}

createFreshInstance();
