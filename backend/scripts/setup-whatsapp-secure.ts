/**
 * Script SICURO per configurare WhatsApp
 * NON inserire mai chiavi direttamente qui!
 */

import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';
import { v4 as uuidv4 } from 'uuid';

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

async function setupWhatsApp() {
  try {
    console.log('===========================================');
    console.log('   CONFIGURAZIONE SICURA WHATSAPP');
    console.log('===========================================\n');
    
    console.log('⚠️  IMPORTANTE: Non condividere mai queste informazioni!\n');
    
    // Richiedi access token
    const accessToken = await question('Inserisci il tuo Access Token SendApp: ');
    
    if (!accessToken || accessToken.length < 10) {
      console.error('❌ Access token non valido!');
      return;
    }
    
    // Maschera il token per i log
    const maskedToken = accessToken.substring(0, 4) + '****' + accessToken.substring(accessToken.length - 4);
    console.log(`✅ Access token ricevuto: ${maskedToken}\n`);
    
    // Instance ID opzionale
    const instanceId = await question('Inserisci Instance ID (premi INVIO per generarlo automaticamente): ');
    
    // Webhook URL
    let webhookUrl = await question('Inserisci Webhook URL (premi INVIO per default localhost): ');
    if (!webhookUrl) {
      webhookUrl = 'http://localhost:3200/api/whatsapp/webhook';
    }
    
    console.log('\n📝 Configurazione da salvare:');
    console.log(`   Access Token: ${maskedToken}`);
    console.log(`   Instance ID: ${instanceId || 'Da generare'}`);
    console.log(`   Webhook URL: ${webhookUrl}`);
    
    const confirm = await question('\nConfermi? (s/n): ');
    
    if (confirm.toLowerCase() !== 's') {
      console.log('Operazione annullata.');
      return;
    }
    
    // Trova utente admin
    const adminUser = await prisma.user.findFirst({
      where: {
        role: { in: ['SUPER_ADMIN', 'ADMIN'] }
      }
    });
    
    if (!adminUser) {
      console.error('❌ Nessun utente admin trovato!');
      return;
    }
    
    // Disattiva configurazioni precedenti
    await prisma.apiKey.updateMany({
      where: { service: 'WHATSAPP' },
      data: { isActive: false }
    });
    
    // Crea o aggiorna configurazione
    const existingConfig = await prisma.apiKey.findFirst({
      where: { service: 'WHATSAPP' }
    });
    
    const configData = {
      userId: adminUser.id,
      name: 'WhatsApp Business',
      service: 'WHATSAPP',
      key: accessToken,  // Campo 'key' richiesto dal database
      apiKey: accessToken,  // Duplicato per compatibilità
      instanceId: instanceId || null,
      webhookUrl: webhookUrl,
      isActive: true,
      permissions: ['send_messages', 'receive_messages', 'manage_groups'],
      metadata: {
        provider: 'SendApp Cloud',
        baseURL: 'https://app.sendapp.cloud/api',
        configuredAt: new Date().toISOString(),
        configuredBy: adminUser.email
      },
      updatedAt: new Date()  // Campo richiesto
    };
    
    if (existingConfig) {
      await prisma.apiKey.update({
        where: { id: existingConfig.id },
        data: configData
      });
      console.log('\n✅ Configurazione WhatsApp aggiornata!');
    } else {
      await prisma.apiKey.create({
        data: {
          id: uuidv4(),
          ...configData
        }
      });
      console.log('\n✅ Configurazione WhatsApp creata!');
    }
    
    console.log('\n📋 Prossimi passi:');
    console.log('1. Vai su http://localhost:5193/admin/whatsapp');
    console.log('2. Clicca "Genera QR Code"');
    console.log('3. Scansiona con WhatsApp');
    console.log('4. Verifica lo stato della connessione\n');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Esegui
console.log('🔐 Script di Configurazione Sicura WhatsApp\n');
console.log('Questo script ti aiuterà a configurare WhatsApp in modo sicuro.\n');
console.log('NOTA: Le chiavi verranno salvate nel database, NON nel codice.\n');
console.log('Premi CTRL+C per annullare in qualsiasi momento.\n');

setupWhatsApp();
