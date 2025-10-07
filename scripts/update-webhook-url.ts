#!/usr/bin/env ts-node

/**
 * Aggiorna Webhook URL dopo cambio ngrok
 */

import { prisma } from '../src/config/database';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function updateWebhook() {
  try {
    console.log('\n🔄 AGGIORNAMENTO WEBHOOK URL');
    console.log('================================\n');
    
    const apiKey = await prisma.apiKey.findUnique({
      where: { service: 'whatsapp' }
    });
    
    if (!apiKey) {
      console.error('❌ Configurazione non trovata!');
      process.exit(1);
    }
    
    const config = apiKey.permissions as any;
    
    console.log('📡 Webhook attuale:', config?.webhookUrl || 'NON CONFIGURATO');
    console.log('\n📌 Per trovare il nuovo URL ngrok:');
    console.log('   1. Vai su http://localhost:4040');
    console.log('   2. Copia l\'URL https (es: https://abc123.ngrok-free.app)');
    console.log('');
    
    const ngrokUrl = await question('Inserisci il nuovo URL ngrok (senza /api/whatsapp/webhook): ');
    
    if (!ngrokUrl || ngrokUrl.trim() === '') {
      console.log('❌ URL non può essere vuoto!');
      process.exit(1);
    }
    
    const webhookUrl = `${ngrokUrl.trim()}/api/whatsapp/webhook`;
    
    // Aggiorna nel database
    const updatedConfig = {
      ...config,
      webhookUrl: webhookUrl
    };
    
    await prisma.apiKey.update({
      where: { service: 'whatsapp' },
      data: {
        permissions: updatedConfig,
        updatedAt: new Date()
      }
    });
    
    console.log('\n✅ Webhook aggiornato nel database!');
    console.log('📡 Nuovo URL:', webhookUrl);
    
    console.log('\n⚠️  IMPORTANTE - ORA DEVI:');
    console.log('=====================================');
    console.log('1. Vai su https://app.sendapp.cloud');
    console.log('2. Trova la tua istanza');
    console.log('3. Aggiorna il Webhook URL con:');
    console.log(`   ${webhookUrl}`);
    console.log('4. Assicurati che TUTTI gli eventi siano abilitati:');
    console.log('   ✅ Messages');
    console.log('   ✅ Message Status');
    console.log('   ✅ Connection Status');
    console.log('5. Salva le modifiche');
    console.log('');
    console.log('📱 POI FAI UN TEST:');
    console.log('   - Invia un messaggio al tuo numero WhatsApp');
    console.log('   - Dovrebbe apparire nella dashboard come RICEVUTO!');
    
    rl.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Errore:', error);
    rl.close();
    process.exit(1);
  }
}

updateWebhook().catch(console.error);
