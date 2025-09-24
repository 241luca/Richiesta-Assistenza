/**
 * Script per verificare e testare la configurazione Evolution API
 * Fa un test diretto di invio messaggio
 * 
 * @author Luca Mambelli  
 * @date 22 Settembre 2025
 */

import prisma from '../config/database';
import axios from 'axios';

async function testEvolutionDirect() {
  try {
    console.log('🔍 Verifica configurazione Evolution API...\n');

    // 1. Verifica cosa c'è nel database
    console.log('📊 Configurazioni nel database:');
    console.log('================================\n');
    
    // Cerca con service = 'whatsapp'
    const config1 = await prisma.apiKey.findFirst({
      where: { service: 'whatsapp' }
    });
    
    if (config1) {
      console.log('✅ Trovata con service="whatsapp":');
      console.log('   ID:', config1.id);
      console.log('   Key:', config1.key);
      console.log('   Permissions:', JSON.stringify(config1.permissions, null, 2));
      console.log('');
    }
    
    // Cerca con provider = 'WHATSAPP'
    const config2 = await prisma.apiKey.findFirst({
      where: { provider: 'WHATSAPP' }
    });
    
    if (config2) {
      console.log('✅ Trovata con provider="WHATSAPP":');
      console.log('   ID:', config2.id);
      console.log('   Key:', config2.key);
      console.log('   Configuration:', JSON.stringify(config2.configuration, null, 2));
      console.log('');
    }

    // 2. Test DIRETTO con la chiave corretta
    console.log('\n🚀 Test DIRETTO invio messaggio:');
    console.log('================================\n');
    
    const CORRECT_API_KEY = '8C47777D-4EC9-4101-9246-5FFEAE763502';
    const EVOLUTION_URL = 'http://37.27.89.35:8080';
    const INSTANCE_NAME = 'assistenza';
    
    console.log('Configurazione usata:');
    console.log('   🔑 API Key:', CORRECT_API_KEY);
    console.log('   🌐 URL:', EVOLUTION_URL);
    console.log('   📱 Instance:', INSTANCE_NAME);
    console.log('');
    
    // Crea client axios con la configurazione corretta
    const evolutionApi = axios.create({
      baseURL: EVOLUTION_URL,
      headers: {
        'apikey': CORRECT_API_KEY,  // Header apikey con il token corretto
        'Content-Type': 'application/json'
      }
    });
    
    // Prova a inviare un messaggio di test
    const testNumber = '393403803728';  // Il tuo numero
    const testMessage = `Test Evolution API - ${new Date().toLocaleTimeString()}`;
    
    console.log(`📤 Invio messaggio di test a ${testNumber}...`);
    console.log(`   Messaggio: "${testMessage}"`);
    console.log('');
    
    try {
      const response = await evolutionApi.post(`/message/sendText/${INSTANCE_NAME}`, {
        number: testNumber,
        text: testMessage,
        delay: 1000
      });
      
      console.log('✅ MESSAGGIO INVIATO CON SUCCESSO!');
      console.log('Risposta:', JSON.stringify(response.data, null, 2));
      console.log('\n🎉 LA CHIAVE API È CORRETTA E FUNZIONA!');
      
    } catch (error: any) {
      console.log('❌ ERRORE INVIO MESSAGGIO:');
      console.log('   Status:', error.response?.status);
      console.log('   Error:', error.response?.data);
      
      if (error.response?.status === 401) {
        console.log('\n⚠️  ERRORE 401: La chiave API non è corretta!');
        console.log('   Potrebbe essere che:');
        console.log('   1. Il token è cambiato su Evolution');
        console.log('   2. L\'istanza "assistenza" non esiste');
        console.log('   3. Evolution API non è attivo sul VPS');
      }
    }
    
    console.log('\n📝 SOLUZIONE:');
    console.log('============');
    console.log('Il problema è che il backend sta cachando la vecchia configurazione.');
    console.log('');
    console.log('Per risolvere:');
    console.log('1. FERMA il backend (CTRL+C)');
    console.log('2. Riavvia con: npm run dev');
    console.log('3. Oppure chiama: POST /api/whatsapp/config/refresh per forzare il reload');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Errore grave:', error);
    process.exit(1);
  }
}

// Esegui il test
testEvolutionDirect();