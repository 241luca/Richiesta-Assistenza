#!/usr/bin/env ts-node

/**
 * RESET COMPLETO ISTANZA WHATSAPP
 * Risolve il problema del numero vecchio che continua a inviare
 * Data: 16 Settembre 2025
 */

import { prisma } from '../src/config/database';
import axios from 'axios';
import readline from 'readline';
import logger from '../src/utils/logger';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function resetWhatsAppInstance() {
  try {
    console.log('\n🔴 RESET COMPLETO ISTANZA WHATSAPP');
    console.log('=====================================\n');
    console.log('⚠️  PROBLEMA RILEVATO: Il sistema sta usando il numero VECCHIO!');
    console.log('   Questo succede quando l\'istanza mantiene la sessione precedente.\n');
    
    // Recupera configurazione
    const apiKey = await prisma.apiKey.findUnique({
      where: { service: 'whatsapp' }
    });
    
    if (!apiKey) {
      console.error('❌ Configurazione WhatsApp non trovata!');
      process.exit(1);
    }
    
    const config = apiKey.permissions as any;
    const token = apiKey.key;
    const instanceId = config?.instanceId;
    
    console.log('📱 Instance attuale:', instanceId);
    console.log('🔑 Token:', token);
    console.log('');
    
    console.log('📋 OPZIONI DISPONIBILI:');
    console.log('1. LOGOUT - Disconnetti la sessione attuale (consigliato)');
    console.log('2. RESET - Reset completo dell\'istanza');
    console.log('3. DELETE - Elimina l\'istanza e creane una nuova');
    console.log('4. ESCI - Non fare nulla');
    console.log('');
    
    const scelta = await question('Scegli un\'opzione (1-4): ');
    
    const baseURL = config?.baseURL || 'https://app.sendapp.cloud/api';
    
    switch(scelta) {
      case '1':
        // LOGOUT - Disconnetti sessione
        console.log('\n🔄 LOGOUT in corso...');
        try {
          const logoutUrl = `${baseURL}/logout`;
          const response = await axios.post(logoutUrl, {
            instance_id: instanceId,
            access_token: token
          });
          
          console.log('✅ Logout eseguito!');
          console.log('Risposta:', JSON.stringify(response.data, null, 2));
          
          // Pulisci database
          await prisma.whatsAppMessage.deleteMany({});
          console.log('✅ Messaggi vecchi eliminati');
          
          // Aggiorna stato
          await prisma.systemConfiguration.upsert({
            where: { key: 'whatsapp_connected_manual' },
            update: { value: 'false' },
            create: {
              key: 'whatsapp_connected_manual',
              value: 'false',
              description: 'Stato connessione WhatsApp'
            }
          });
          
          console.log('\n📱 ORA DEVI:');
          console.log('1. Vai su http://localhost:5193/admin/whatsapp');
          console.log('2. Clicca "Genera QR Code"');
          console.log('3. Scansiona con il NUOVO telefono');
          console.log('4. Verifica che sia il numero corretto');
          
        } catch (error: any) {
          console.error('❌ Errore logout:', error.response?.data || error.message);
        }
        break;
        
      case '2':
        // RESET - Reset istanza
        console.log('\n🔄 RESET ISTANZA in corso...');
        try {
          const resetUrl = `${baseURL}/reset_instance`;
          const response = await axios.post(resetUrl, {
            instance_id: instanceId,
            access_token: token
          });
          
          console.log('✅ Reset eseguito!');
          console.log('Risposta:', JSON.stringify(response.data, null, 2));
          
          // Pulisci database
          await prisma.whatsAppMessage.deleteMany({});
          console.log('✅ Database pulito');
          
          console.log('\n📱 ORA DEVI:');
          console.log('1. Riavvia il backend');
          console.log('2. Vai su http://localhost:5193/admin/whatsapp');
          console.log('3. Scansiona il QR con il NUOVO telefono');
          
        } catch (error: any) {
          console.error('❌ Errore reset:', error.response?.data || error.message);
        }
        break;
        
      case '3':
        // DELETE - Elimina e ricrea istanza
        console.log('\n🗑️ ELIMINAZIONE ISTANZA...');
        console.log('⚠️  Questa opzione richiederà di creare una NUOVA istanza');
        
        const conferma = await question('Sei sicuro? (s/n): ');
        
        if (conferma.toLowerCase() === 's') {
          try {
            // Prima prova a fare logout
            try {
              await axios.post(`${baseURL}/logout`, {
                instance_id: instanceId,
                access_token: token
              });
              console.log('✅ Logout eseguito');
            } catch (e) {
              console.log('⚠️  Logout fallito, procedo comunque');
            }
            
            // Poi elimina l'istanza (se l'API lo supporta)
            try {
              await axios.post(`${baseURL}/delete_instance`, {
                instance_id: instanceId,
                access_token: token
              });
              console.log('✅ Istanza eliminata');
            } catch (e) {
              console.log('⚠️  Delete non supportato o fallito');
            }
            
            // Pulisci configurazione locale
            const cleanConfig = {
              ...config,
              instanceId: '' // Rimuovi instance ID
            };
            
            await prisma.apiKey.update({
              where: { service: 'whatsapp' },
              data: {
                permissions: cleanConfig,
                updatedAt: new Date()
              }
            });
            
            // Pulisci tutto
            await prisma.whatsAppMessage.deleteMany({});
            await prisma.systemConfiguration.deleteMany({
              where: {
                key: {
                  in: ['whatsapp_connected_manual', 'whatsapp_instance_id']
                }
              }
            });
            
            console.log('✅ Configurazione locale pulita');
            
            console.log('\n🆕 ORA DEVI CREARE UNA NUOVA ISTANZA:');
            console.log('1. Vai su http://localhost:5193/admin/whatsapp');
            console.log('2. Clicca "Crea Nuova Istanza"');
            console.log('3. Segui la procedura guidata');
            console.log('4. Scansiona il QR con il NUOVO telefono');
            
          } catch (error: any) {
            console.error('❌ Errore eliminazione:', error.message);
          }
        }
        break;
        
      case '4':
        console.log('👋 Uscita senza modifiche');
        break;
        
      default:
        console.log('❌ Opzione non valida');
    }
    
    console.log('\n✅ Procedura completata');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Esegui
resetWhatsAppInstance().catch(console.error);
