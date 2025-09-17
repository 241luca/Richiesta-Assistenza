#!/usr/bin/env ts-node

/**
 * Script per correggere Instance ID dopo cambio telefono
 * Data: 16 Settembre 2025
 * Problema: Messaggi inviati appaiono come ricevuti
 */

import { prisma } from '../src/config/database';
import logger from '../src/utils/logger';
import readline from 'readline';

// Crea interfaccia per input utente
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function fixWhatsAppInstanceId() {
  try {
    console.log('\n🔧 FIX WHATSAPP INSTANCE ID');
    console.log('============================\n');
    
    // 1. Recupera configurazione attuale
    console.log('📋 Recupero configurazione attuale...');
    const apiKey = await prisma.apiKey.findUnique({
      where: { service: 'whatsapp' }
    });
    
    if (!apiKey) {
      console.error('❌ Configurazione WhatsApp non trovata nel database!');
      console.log('ℹ️  Prima devi configurare WhatsApp dalla dashboard admin');
      process.exit(1);
    }
    
    const currentConfig = apiKey.permissions as any;
    console.log('\n📱 Configurazione attuale:');
    console.log('- Token:', apiKey.key);
    console.log('- Instance ID attuale:', currentConfig?.instanceId || 'NON CONFIGURATO');
    console.log('- Webhook URL:', currentConfig?.webhookUrl || 'Non configurato');
    console.log('- Base URL:', currentConfig?.baseURL || 'https://app.sendapp.cloud/api');
    
    // 2. Chiedi il nuovo Instance ID
    console.log('\n⚠️  HAI CAMBIATO TELEFONO E DEVI AGGIORNARE L\'INSTANCE ID');
    console.log('📱 Per trovare il nuovo Instance ID:');
    console.log('   1. Vai su https://app.sendapp.cloud');
    console.log('   2. Accedi con le tue credenziali');
    console.log('   3. Trova il numero del nuovo telefono connesso');
    console.log('   4. Copia l\'Instance ID associato\n');
    
    const newInstanceId = await question('🆔 Inserisci il NUOVO Instance ID: ');
    
    if (!newInstanceId || newInstanceId.trim() === '') {
      console.error('❌ Instance ID non può essere vuoto!');
      process.exit(1);
    }
    
    // 3. Chiedi conferma ngrok
    console.log('\n🌐 CONFIGURAZIONE NGROK');
    console.log('Attualmente il webhook è configurato su:', currentConfig?.webhookUrl || 'Non configurato');
    
    const updateNgrok = await question('\n📡 Vuoi aggiornare anche l\'URL di ngrok? (s/n): ');
    
    let webhookUrl = currentConfig?.webhookUrl || '';
    if (updateNgrok.toLowerCase() === 's' || updateNgrok.toLowerCase() === 'si') {
      console.log('\n📌 Per ottenere il nuovo URL ngrok:');
      console.log('   1. Assicurati che ngrok sia in esecuzione');
      console.log('   2. Controlla il terminale dove hai eseguito: ngrok http 3200');
      console.log('   3. Copia l\'URL https (es: https://abc123.ngrok.io)');
      
      const ngrokUrl = await question('\n🔗 Inserisci il nuovo URL ngrok (senza /api/whatsapp/webhook): ');
      
      if (ngrokUrl && ngrokUrl.trim() !== '') {
        webhookUrl = `${ngrokUrl.trim()}/api/whatsapp/webhook`;
        console.log('✅ Webhook URL sarà:', webhookUrl);
      }
    }
    
    // 4. Aggiorna nel database
    console.log('\n💾 Aggiornamento database...');
    
    const updatedConfig = {
      ...currentConfig,
      instanceId: newInstanceId.trim(),
      webhookUrl: webhookUrl,
      baseURL: currentConfig?.baseURL || 'https://app.sendapp.cloud/api'
    };
    
    await prisma.apiKey.update({
      where: { service: 'whatsapp' },
      data: {
        permissions: updatedConfig,
        updatedAt: new Date()  // Cambiato da modifiedAt a updatedAt
      }
    });
    
    console.log('✅ Configurazione aggiornata con successo!');
    
    // 5. Pulisci i messaggi vecchi (opzionale)
    const cleanMessages = await question('\n🗑️  Vuoi pulire i messaggi vecchi dal database? (s/n): ');
    
    if (cleanMessages.toLowerCase() === 's' || cleanMessages.toLowerCase() === 'si') {
      const deleted = await prisma.whatsAppMessage.deleteMany({});
      console.log(`✅ Eliminati ${deleted.count} messaggi vecchi`);
    }
    
    // 6. Mostra riepilogo
    console.log('\n✨ CONFIGURAZIONE AGGIORNATA');
    console.log('================================');
    console.log('🆔 Instance ID:', newInstanceId.trim());
    console.log('📡 Webhook URL:', webhookUrl || 'Non configurato');
    console.log('✅ Token:', apiKey.key);
    
    // 7. Consigli finali
    console.log('\n📌 PROSSIMI PASSI:');
    console.log('1. ✅ Riavvia il backend: npm run dev');
    console.log('2. ✅ Vai su http://localhost:5193/admin/whatsapp');
    console.log('3. ✅ Clicca "Verifica Stato" per confermare la connessione');
    console.log('4. ✅ Se necessario, registra di nuovo il webhook su SendApp');
    
    // 8. Test webhook se configurato
    if (webhookUrl) {
      console.log('\n🔧 PER REGISTRARE IL WEBHOOK SU SENDAPP:');
      console.log('1. Vai su https://app.sendapp.cloud');
      console.log('2. Trova la tua istanza');
      console.log('3. Configura il webhook con:', webhookUrl);
      console.log('4. Salva le modifiche');
    }
    
    console.log('\n✅ Script completato con successo!');
    
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Esegui lo script
fixWhatsAppInstanceId().catch(console.error);
