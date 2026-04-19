/**
 * Script per avviare l'istanza e ottenere il QR code
 */

import axios from 'axios';

async function startInstanceAndGetQR() {
  const baseUrl = 'http://37.27.89.35:8080';
  const apiKey = 'evolution_key_luca_2025_secure_21806';
  
  console.log('\n🚀 Avvio istanza "main" e generazione QR code...\n');

  const api = axios.create({
    baseURL: baseUrl,
    headers: {
      'apikey': apiKey,
      'Content-Type': 'application/json'
    }
  });

  try {
    // 1. Verifica stato attuale
    console.log('1️⃣ Verifica stato istanza...');
    const instances = await api.get('/instance/fetchInstances');
    const mainInstance = instances.data.find((i: any) => i.name === 'main');
    
    if (mainInstance) {
      console.log(`   Trovata! ID: ${mainInstance.id}`);
      console.log(`   Stato: ${mainInstance.connectionStatus}`);
      
      // 2. Se è disconnessa, prova a riavviarla
      if (mainInstance.connectionStatus === 'close') {
        console.log('\n2️⃣ Istanza disconnessa. Provo a riavviarla...');
        
        try {
          // Prova restart
          await api.put(`/instance/restart/${mainInstance.name || mainInstance.id}`);
          console.log('   ✅ Restart inviato');
        } catch (e: any) {
          console.log('   ⚠️ Restart fallito:', e.response?.data?.message || e.message);
        }
        
        // Aspetta un po'
        console.log('   ⏳ Attendo 3 secondi...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      // 3. Ora prova a connetterti e ottenere il QR
      console.log('\n3️⃣ Tentativo di connessione per QR code...');
      
      // Prova con l'ID dell'istanza
      try {
        const connectById = await api.get(`/instance/connect/${mainInstance.id}`);
        console.log('   Connect by ID response:', JSON.stringify(connectById.data, null, 2));
        
        if (connectById.data && connectById.data.count !== 0) {
          console.log('\n🎉 Dati ricevuti da connect by ID!');
          return connectById.data;
        }
      } catch (e: any) {
        console.log('   Connect by ID error:', e.response?.status);
      }
      
      // Prova con il nome
      try {
        const connectByName = await api.get('/instance/connect/main');
        console.log('   Connect by name response:', JSON.stringify(connectByName.data, null, 2));
        
        if (connectByName.data && connectByName.data.count !== 0) {
          console.log('\n🎉 Dati ricevuti da connect by name!');
          return connectByName.data;
        }
      } catch (e: any) {
        console.log('   Connect by name error:', e.response?.status);
      }
      
      // 4. Se ancora niente, proviamo a eliminare e ricreare l'istanza
      console.log('\n4️⃣ Nessun QR ricevuto. Provo a ricreare l\'istanza...');
      
      try {
        // Elimina vecchia istanza
        console.log('   Eliminando vecchia istanza...');
        await api.delete(`/instance/delete/${mainInstance.id}`);
        console.log('   ✅ Eliminata');
        
        // Aspetta
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Crea nuova istanza
        console.log('   Creando nuova istanza...');
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
        
        console.log('   ✅ Nuova istanza creata!');
        console.log('   Response:', JSON.stringify(createResponse.data, null, 2));
        
        // Aspetta e prova connect
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const finalConnect = await api.get('/instance/connect/main');
        console.log('\n5️⃣ Connect finale:');
        console.log(JSON.stringify(finalConnect.data, null, 2));
        
      } catch (e: any) {
        console.log('   ❌ Errore:', e.response?.data?.message || e.message);
      }
    } else {
      console.log('   ❌ Istanza "main" non trovata!');
    }
    
  } catch (error: any) {
    console.error('\n❌ Errore generale:', error.response?.data || error instanceof Error ? error.message : String(error));
  }
}

startInstanceAndGetQR();
