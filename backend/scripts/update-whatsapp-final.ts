/**
 * Script per aggiornare la configurazione WhatsApp esistente
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateWhatsApp() {
  try {
    console.log('📱 AGGIORNAMENTO CONFIGURAZIONE WHATSAPP\n');
    console.log('=========================================\n');
    
    // Trova la configurazione WhatsApp (service minuscolo)
    const whatsappConfig = await prisma.apiKey.findFirst({
      where: { service: 'whatsapp' }  // minuscolo!
    });
    
    if (!whatsappConfig) {
      console.error('❌ Configurazione WhatsApp non trovata!');
      return;
    }
    
    console.log('✅ Configurazione WhatsApp trovata\n');
    console.log('📝 Aggiornamento con i nuovi dati...\n');
    
    // I tuoi dati corretti
    const newAccessToken = '68c575f3c2ff1';
    const instanceId = '68C67956807C8';
    const webhookUrl = 'https://057cb876802e.ngrok-free.app/api/whatsapp/webhook';
    
    // Aggiorna la configurazione
    await prisma.apiKey.update({
      where: { id: whatsappConfig.id },
      data: {
        key: newAccessToken,  // Il tuo vero access token
        permissions: {
          instanceId: instanceId,
          webhookUrl: webhookUrl,
          baseURL: 'https://app.sendapp.cloud/api',
          enabled: true,
          accessToken: newAccessToken
        }
      }
    });
    
    console.log('✅ CONFIGURAZIONE AGGIORNATA CON SUCCESSO!\n');
    console.log('📋 Nuova configurazione:');
    console.log(`   Access Token: ${newAccessToken.substring(0,8)}****`);
    console.log(`   Instance ID: ${instanceId}`);
    console.log(`   Webhook URL: ${webhookUrl}\n`);
    
    console.log('🚀 PROSSIMI PASSI:\n');
    console.log('1. Vai su: http://localhost:5193/admin/whatsapp');
    console.log('2. Clicca "Aggiorna Stato" per verificare la connessione');
    console.log('3. Se disconnesso, clicca "Genera QR Code"');
    console.log('4. Scansiona il QR code con WhatsApp sul nuovo telefono');
    console.log('5. Una volta connesso, testa inviando un messaggio\n');
    
    console.log('📌 IMPORTANTE:');
    console.log('   - ngrok deve rimanere attivo per ricevere messaggi');
    console.log('   - URL ngrok: https://057cb876802e.ngrok-free.app');
    console.log('   - Backend deve essere attivo su porta 3200\n');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui
updateWhatsApp();
