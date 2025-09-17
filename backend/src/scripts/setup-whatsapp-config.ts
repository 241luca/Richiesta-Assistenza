/**
 * Script per configurare WhatsApp nel database
 * Usa il token e le configurazioni fornite dall'utente
 */

import { prisma } from '../config/database';

async function setupWhatsAppConfig() {
  try {
    console.log('🔧 Configurazione WhatsApp SendApp...');
    
    // Configurazione fornita dall'utente
    const config = {
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',  // Da configurare in .env
      baseURL: 'https://app.sendapp.cloud/api',
      instanceId: '',  // Verrà generato dopo
      webhookUrl: `http://localhost:3200/api/whatsapp/webhook`,  // Webhook locale per test
      isActive: true
    };
    
    // Verifica se esiste già una configurazione
    const existing = await prisma.apiKey.findUnique({
      where: { service: 'whatsapp' }
    });
    
    if (existing) {
      console.log('📝 Aggiornamento configurazione esistente...');
      
      await prisma.apiKey.update({
        where: { service: 'whatsapp' },
        data: {
          key: config.accessToken,
          permissions: {
            baseURL: config.baseURL,
            instanceId: config.instanceId,
            webhookUrl: config.webhookUrl
          },
          isActive: config.isActive,
          updatedAt: new Date()
        }
      });
      
      console.log('✅ Configurazione WhatsApp aggiornata!');
    } else {
      console.log('➕ Creazione nuova configurazione...');
      
      await prisma.apiKey.create({
        data: {
          id: `whatsapp_${Date.now()}`,
          key: config.accessToken,
          name: 'WhatsApp Integration (SendApp)',
          service: 'whatsapp',
          permissions: {
            baseURL: config.baseURL,
            instanceId: config.instanceId,
            webhookUrl: config.webhookUrl
          },
          isActive: config.isActive,
          rateLimit: 1000,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log('✅ Configurazione WhatsApp creata!');
    }
    
    // Verifica la configurazione
    const saved = await prisma.apiKey.findUnique({
      where: { service: 'whatsapp' }
    });
    
    if (saved) {
      console.log('\n📌 Configurazione salvata:');
      console.log('- Service:', saved.service);
      console.log('- Access Token:', saved.key.substring(0, 10) + '...');
      console.log('- Is Active:', saved.isActive);
      console.log('- Permissions:', JSON.stringify(saved.permissions, null, 2));
      console.log('\n✨ Configurazione completata con successo!');
      console.log('\n⚠️ PROSSIMI PASSI:');
      console.log('1. Vai su http://localhost:5193/admin/whatsapp');
      console.log('2. Clicca su "Crea Istanza" per generare un nuovo Instance ID');
      console.log('3. Clicca su "Genera QR Code" per collegare WhatsApp');
      console.log('4. Scansiona il QR code con WhatsApp sul telefono');
    }
    
  } catch (error) {
    console.error('❌ Errore configurazione WhatsApp:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script
setupWhatsAppConfig();
