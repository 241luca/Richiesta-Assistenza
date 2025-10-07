/**
 * Script per testare direttamente l'API SendApp e vedere la risposta
 */

import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSendAppAPI() {
  try {
    console.log('🔍 TEST DIRETTO API SENDAPP\n');
    console.log('=========================================\n');
    
    // Recupera la configurazione dal database
    const whatsappConfig = await prisma.apiKey.findFirst({
      where: { service: 'whatsapp' }
    });
    
    if (!whatsappConfig) {
      console.error('❌ Configurazione WhatsApp non trovata!');
      return;
    }
    
    const permissions = whatsappConfig.permissions as any;
    const accessToken = whatsappConfig.key;
    const instanceId = permissions?.instanceId;
    
    console.log('📝 Configurazione attuale:');
    console.log(`   Access Token: ${accessToken}`);
    console.log(`   Instance ID: ${instanceId}\n`);
    
    // Test 1: Verifica stato istanza
    console.log('1️⃣ TEST: Verifica stato istanza\n');
    
    try {
      const statusUrl = `https://app.sendapp.cloud/api/get_status?instance_id=${instanceId}&access_token=${accessToken}`;
      console.log(`   URL: ${statusUrl}\n`);
      
      const statusResponse = await axios.get(statusUrl);
      console.log('   Risposta Status:');
      console.log(JSON.stringify(statusResponse.data, null, 2));
    } catch (error: any) {
      console.error('   ❌ Errore status:', error.response?.data || error.message);
    }
    
    console.log('\n---\n');
    
    // Test 2: Prova a ottenere QR Code
    console.log('2️⃣ TEST: Ottieni QR Code\n');
    
    try {
      const qrUrl = `https://app.sendapp.cloud/api/get_qrcode?instance_id=${instanceId}&access_token=${accessToken}`;
      console.log(`   URL: ${qrUrl}\n`);
      
      const qrResponse = await axios.get(qrUrl);
      
      console.log('   Tipo risposta:', typeof qrResponse.data);
      
      if (typeof qrResponse.data === 'string') {
        console.log('   Risposta (primi 200 caratteri):');
        console.log('   ' + qrResponse.data.substring(0, 200) + '...');
        
        // Verifica se è base64
        if (qrResponse.data.includes('data:image')) {
          console.log('\n   ✅ QR Code in formato data:image trovato!');
        } else if (qrResponse.data.match(/^[A-Za-z0-9+/=]+$/)) {
          console.log('\n   ✅ QR Code sembra essere base64 puro');
          console.log('   Dovrebbe essere prefixato con: data:image/png;base64,');
        } else {
          console.log('\n   ⚠️ Formato QR Code non riconosciuto');
        }
      } else if (typeof qrResponse.data === 'object') {
        console.log('   Risposta (oggetto):');
        console.log(JSON.stringify(qrResponse.data, null, 2));
        
        // Cerca il QR in vari campi possibili
        const possibleFields = ['qrcode', 'qr_code', 'qr', 'image', 'base64', 'data', 'url'];
        for (const field of possibleFields) {
          if (qrResponse.data[field]) {
            console.log(`\n   ✅ QR Code trovato nel campo: ${field}`);
            const value = qrResponse.data[field];
            if (typeof value === 'string') {
              console.log(`   Primi 100 caratteri: ${value.substring(0, 100)}...`);
            }
            break;
          }
        }
      }
    } catch (error: any) {
      console.error('   ❌ Errore QR Code:', error.response?.data || error.message);
      
      if (error.response?.status === 400) {
        console.log('\n   💡 Potrebbe essere necessario:');
        console.log('      1. Creare prima una nuova istanza');
        console.log('      2. O disconnettere l\'istanza esistente');
      }
    }
    
    console.log('\n---\n');
    
    // Test 3: Prova a creare nuova istanza
    console.log('3️⃣ TEST: Crea nuova istanza (se necessario)\n');
    console.log('   Vuoi creare una nuova istanza? (solo se il QR Code non funziona)\n');
    
    const createUrl = `https://app.sendapp.cloud/api/create_instance?access_token=${accessToken}`;
    console.log(`   URL per creare istanza: ${createUrl}\n`);
    console.log('   ⚠️ NON eseguito automaticamente. Usa solo se necessario.');
    
  } catch (error) {
    console.error('❌ Errore generale:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui
testSendAppAPI();
