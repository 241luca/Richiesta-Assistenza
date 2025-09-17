/**
 * Script SEMPLIFICATO per ottenere nuovo QR Code
 */

import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getNewQRCode() {
  try {
    console.log('📱 OTTIENI NUOVO QR CODE WHATSAPP\n');
    console.log('=========================================\n');
    
    // Recupera configurazione
    const config = await prisma.apiKey.findFirst({
      where: { service: 'whatsapp' }
    });
    
    if (!config) {
      console.error('❌ Configurazione non trovata!');
      return;
    }
    
    const permissions = config.permissions as any;
    const accessToken = '68c575f3c2ff1';  // Il tuo token
    
    console.log('Token usato:', accessToken);
    console.log('Instance ID attuale:', permissions?.instanceId || 'Non configurato');
    
    // Opzione 1: Prova con l'istanza esistente
    if (permissions?.instanceId) {
      console.log('\n1️⃣ Provo con istanza esistente:', permissions.instanceId);
      
      try {
        // Prima disconnetti
        const logoutUrl = `https://app.sendapp.cloud/api/logout?instance_id=${permissions.instanceId}&access_token=${accessToken}`;
        await axios.get(logoutUrl);
        console.log('   ✅ Disconnesso');
      } catch (e) {
        console.log('   ⚠️ Disconnessione fallita (normale se già disconnesso)');
      }
      
      // Poi richiedi QR
      const qrUrl = `https://app.sendapp.cloud/api/get_qrcode?instance_id=${permissions.instanceId}&access_token=${accessToken}`;
      
      try {
        const response = await axios.get(qrUrl);
        
        if (response.data?.status === 'error') {
          console.log('   ❌ Errore:', response.data.message);
        } else if (typeof response.data === 'string' && response.data.length > 100) {
          console.log('   ✅ QR Code ricevuto!');
          console.log('   Tipo: stringa base64');
          console.log('   Lunghezza:', response.data.length);
          
          // Salva per debug
          const fs = require('fs');
          fs.writeFileSync('qrcode-response.txt', response.data);
          console.log('   📝 Salvato in qrcode-response.txt per analisi');
          
          // Aggiorna database se necessario
          if (!response.data.startsWith('data:image')) {
            console.log('\n   ⚠️ Il QR potrebbe necessitare del prefisso data:image');
          }
          
          return response.data;
        } else {
          console.log('   Risposta:', JSON.stringify(response.data));
        }
      } catch (error: any) {
        console.error('   Errore:', error.response?.data || error.message);
      }
    }
    
    // Opzione 2: Crea nuova istanza
    console.log('\n2️⃣ Creo NUOVA istanza...');
    
    try {
      // Lista istanze esistenti
      const listUrl = `https://app.sendapp.cloud/api/list_instances?access_token=${accessToken}`;
      const listResponse = await axios.get(listUrl);
      console.log('   Istanze esistenti:', listResponse.data);
    } catch (e) {
      console.log('   Non riesco a listare istanze');
    }
    
    // Crea nuova
    const createUrl = `https://app.sendapp.cloud/api/create_instance?access_token=${accessToken}`;
    
    try {
      const createResponse = await axios.get(createUrl);
      console.log('\n   Risposta creazione:');
      console.log(JSON.stringify(createResponse.data, null, 2));
      
      // Estrai nuovo ID
      const newId = createResponse.data?.instance_id || 
                    createResponse.data?.data?.instance_id ||
                    createResponse.data?.instance?.id;
                    
      if (newId) {
        console.log('\n   ✅ Nuova istanza:', newId);
        
        // Salva nel database
        await prisma.apiKey.update({
          where: { id: config.id },
          data: {
            permissions: {
              ...permissions,
              instanceId: newId
            }
          }
        });
        
        // Ottieni QR per nuova istanza
        const newQrUrl = `https://app.sendapp.cloud/api/get_qrcode?instance_id=${newId}&access_token=${accessToken}`;
        const qrResponse = await axios.get(newQrUrl);
        
        console.log('   QR per nuova istanza ricevuto');
        return qrResponse.data;
      }
    } catch (error: any) {
      console.error('   Errore creazione:', error.response?.data || error.message);
    }
    
    console.log('\n📋 SOLUZIONE MANUALE:');
    console.log('1. Vai su https://app.sendapp.cloud');
    console.log('2. Fai login con le tue credenziali');
    console.log('3. Gestisci le istanze WhatsApp');
    console.log('4. Crea nuova istanza o resetta esistente');
    console.log('5. Copia il nuovo instance ID');
    console.log('6. Aggiorna nel database');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getNewQRCode();
