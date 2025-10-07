/**
 * Test veloce stato istanza e QR
 */

import axios from 'axios';

async function quickCheck() {
  const baseUrl = 'http://37.27.89.35:8080';
  const apiKey = 'evolution_key_luca_2025_secure_21806';
  
  console.log('\n🔍 Check veloce stato sistema...\n');

  const api = axios.create({
    baseURL: baseUrl,
    headers: {
      'apikey': apiKey,
      'Content-Type': 'application/json'
    }
  });

  try {
    // 1. Controlla istanze
    const instances = await api.get('/instance/fetchInstances');
    console.log(`📋 Istanze trovate: ${instances.data.length}\n`);
    
    if (instances.data.length === 0) {
      console.log('❌ Nessuna istanza trovata!');
      console.log('   Creane una usando lo script create-fresh-instance.ts');
      return;
    }
    
    // Mostra dettagli istanze
    instances.data.forEach((inst: any) => {
      console.log(`📱 Istanza: ${inst.name || 'senza nome'}`);
      console.log(`   ID: ${inst.id}`);
      console.log(`   Stato: ${inst.connectionStatus}`);
      console.log(`   Integration: ${inst.integration}`);
      console.log('');
    });
    
    // 2. Se c'è main, prova diversi modi per ottenere QR
    const mainInstance = instances.data.find((i: any) => i.name === 'main');
    
    if (mainInstance) {
      console.log('✅ Istanza "main" trovata!\n');
      
      if (mainInstance.connectionStatus === 'open') {
        console.log('📱 WhatsApp GIÀ CONNESSO! Non serve QR code.');
        console.log('   Puoi già inviare messaggi.');
        return;
      }
      
      console.log('🔄 Tentativo di ottenere QR code...\n');
      
      // Metodo 1: connect con nome
      try {
        const r1 = await api.get('/instance/connect/main');
        console.log('Metodo 1 (connect/main):');
        console.log(JSON.stringify(r1.data, null, 2).substring(0, 300));
      } catch (e: any) {
        console.log('Metodo 1 fallito:', e.response?.status);
      }
      
      // Metodo 2: connect con ID
      try {
        const r2 = await api.get(`/instance/connect/${mainInstance.id}`);
        console.log('\nMetodo 2 (connect/ID):');
        console.log(JSON.stringify(r2.data, null, 2).substring(0, 300));
      } catch (e: any) {
        console.log('Metodo 2 fallito:', e.response?.status);
      }
      
      // Metodo 3: restart per generare QR
      try {
        console.log('\nMetodo 3: Provo restart...');
        await api.put(`/instance/restart/main`);
        console.log('Restart OK, attendo 2 secondi...');
        await new Promise(r => setTimeout(r, 2000));
        
        const r3 = await api.get('/instance/connect/main');
        console.log('Dopo restart:');
        console.log(JSON.stringify(r3.data, null, 2).substring(0, 300));
      } catch (e: any) {
        console.log('Metodo 3 fallito:', e.response?.status);
      }
      
      console.log('\n📌 SOLUZIONE:');
      console.log('Se nessun metodo funziona, usa Evolution Manager:');
      console.log('1. Vai su: http://37.27.89.35:8080/manager');
      console.log('2. Login con: evolution_key_luca_2025_secure_21806');
      console.log('3. Clicca sull\'istanza "main"');
      console.log('4. Genera/visualizza QR code da lì');
    }
    
  } catch (error: any) {
    console.error('❌ Errore:', error.message);
  }
}

quickCheck();
