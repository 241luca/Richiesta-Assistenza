/**
 * Script SEMPLICE per aggiornare configurazione WhatsApp esistente
 */

import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function updateWhatsApp() {
  try {
    console.log('===========================================');
    console.log('   AGGIORNAMENTO CONFIGURAZIONE WHATSAPP');
    console.log('===========================================\n');
    
    // Trova la configurazione esistente
    const existingConfig = await prisma.apiKey.findFirst({
      where: { service: 'WHATSAPP' }
    });
    
    if (!existingConfig) {
      console.error('❌ Nessuna configurazione WhatsApp trovata!');
      console.log('Prima crea una configurazione base dal pannello admin.');
      return;
    }
    
    console.log('✅ Configurazione esistente trovata\n');
    
    // Richiedi i nuovi dati
    const accessToken = await question('Access Token SendApp (68c575f3c2ff1): ');
    const instanceId = await question('Instance ID (68C67956807C8): ');
    const webhookUrl = await question('Webhook URL (https://057cb876802e.ngrok-free.app/api/whatsapp/webhook): ');
    
    // Usa i valori inseriti o i default
    const finalToken = accessToken || '68c575f3c2ff1';
    const finalInstance = instanceId || '68C67956807C8';
    const finalWebhook = webhookUrl || 'https://057cb876802e.ngrok-free.app/api/whatsapp/webhook';
    
    console.log('\n📝 Aggiornamento configurazione...');
    
    // Aggiorna la configurazione
    await prisma.apiKey.update({
      where: { id: existingConfig.id },
      data: {
        key: finalToken,
        apiKey: finalToken,
        instanceId: finalInstance,
        webhookUrl: finalWebhook,
        isActive: true,
        metadata: {
          provider: 'SendApp Cloud',
          baseURL: 'https://app.sendapp.cloud/api',
          configuredAt: new Date().toISOString(),
          instanceId: finalInstance,
          webhookUrl: finalWebhook
        }
      }
    });
    
    console.log('\n✅ Configurazione aggiornata con successo!\n');
    console.log('📋 Configurazione salvata:');
    console.log(`   Access Token: ${finalToken.substring(0,4)}****`);
    console.log(`   Instance ID: ${finalInstance}`);
    console.log(`   Webhook URL: ${finalWebhook}\n`);
    
    console.log('📋 Prossimi passi:');
    console.log('1. Vai su http://localhost:5193/admin/whatsapp');
    console.log('2. Clicca "Aggiorna Stato" per verificare');
    console.log('3. Se disconnesso, clicca "Genera QR Code"');
    console.log('4. Scansiona con WhatsApp sul nuovo telefono\n');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Esegui
console.log('🔐 Aggiornamento Configurazione WhatsApp\n');
updateWhatsApp();
