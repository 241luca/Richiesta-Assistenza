/**
 * Test diretto dello stato di Evolution API
 */

import axios from 'axios';

async function testEvolutionStatus() {
  const baseUrl = 'http://37.27.89.35:8080';
  const apiKey = 'evolution_key_luca_2025_secure_21806';
  
  console.log('\n🔍 Verifica stato Evolution API e istanza "main"...\n');

  const api = axios.create({
    baseURL: baseUrl,
    headers: {
      'apikey': apiKey,
      'Content-Type': 'application/json'
    }
  });

  try {
    // 1. Verifica istanze esistenti
    console.log('📋 Istanze esistenti:\n');
    const instances = await api.get('/instance/fetchInstances');
    
    if (instances.data.length === 0) {
      console.log('   Nessuna istanza trovata\n');
    } else {
      instances.data.forEach((inst: any) => {
        console.log(`   Nome: ${inst.instanceName || inst.instance?.instanceName}`);
        console.log(`   Stato: ${inst.connectionStatus || inst.state || 'unknown'}`);
        console.log(`   Connesso: ${inst.connectionStatus === 'open' ? 'SI' : 'NO'}`);
        if (inst.profileName) {
          console.log(`   Profilo: ${inst.profileName}`);
        }
        console.log('');
      });
    }

    // 2. Se c'è l'istanza main, prova a ottenere il QR
    const mainInstance = instances.data.find((i: any) => 
      i.instanceName === 'main' || i.instance?.instanceName === 'main'
    );

    if (mainInstance) {
      console.log('✅ Istanza "main" trovata!\n');
      
      if (mainInstance.connectionStatus === 'open') {
        console.log('📱 WhatsApp è GIÀ CONNESSO!');
        console.log('   Per generare un nuovo QR code, devi prima disconnettere.');
        console.log('   Vai su http://localhost:5193/admin/whatsapp');
        console.log('   e clicca "Disconnetti" prima di generare un nuovo QR.\n');
      } else {
        console.log('📲 WhatsApp NON è connesso. Proviamo a ottenere il QR...\n');
        
        // Prova connect
        try {
          const connectResponse = await api.get('/instance/connect/main');
          console.log('Connect response:', JSON.stringify(connectResponse.data).substring(0, 200));
          
          if (connectResponse.data.qrcode || connectResponse.data.base64) {
            console.log('\n🎉 QR CODE DISPONIBILE!');
            console.log('   Il QR dovrebbe essere visualizzabile nell\'interfaccia.');
          }
        } catch (error: any) {
          console.log('❌ Connect fallito:', error.response?.data?.message || error.message);
        }
      }
    } else {
      console.log('❌ Istanza "main" non trovata\n');
      console.log('   Creala tramite l\'interfaccia.');
    }

    // 3. Test disconnect/delete per pulizia (opzionale)
    if (mainInstance && mainInstance.connectionStatus === 'open') {
      console.log('\n🔧 Vuoi disconnettere l\'istanza per generare un nuovo QR?');
      console.log('   Esegui: curl -X DELETE', `${baseUrl}/instance/logout/main`, '-H "apikey:', apiKey, '"');
    }

  } catch (error: any) {
    console.error('❌ Errore:', error.response?.data || error.message);
  }
}

testEvolutionStatus();
