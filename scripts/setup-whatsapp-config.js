/**
 * Script per configurare WhatsApp nel database
 * Esegui con: node scripts/setup-whatsapp-config.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupWhatsAppConfig() {
  try {
    console.log('🔧 Configurazione WhatsApp nel database...\n');
    
    // Controlla se esiste già
    const existing = await prisma.apiKey.findUnique({
      where: { service: 'whatsapp' }
    });
    
    if (existing) {
      console.log('✅ Configurazione WhatsApp già presente:');
      console.log('   Token:', existing.key.substring(0, 10) + '...');
      console.log('   Attiva:', existing.isActive);
      console.log('   Configurazione:', existing.permissions);
      
      // Chiedi se aggiornare
      console.log('\n📝 Per aggiornare il token, modifica direttamente nel database o usa l\'interfaccia admin.');
    } else {
      // Crea nuova configurazione
      console.log('📝 Creazione nuova configurazione WhatsApp...\n');
      
      const config = await prisma.apiKey.create({
        data: {
          id: `whatsapp_${Date.now()}`,
          key: '68c575f3c2ff1', // Il tuo token SendApp
          name: 'WhatsApp Integration (SendApp)',
          service: 'whatsapp',
          permissions: {
            baseURL: 'https://app.sendapp.cloud/api',
            instanceId: '',
            webhookUrl: ''
          },
          isActive: true,
          rateLimit: 1000,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log('✅ Configurazione WhatsApp creata con successo!');
      console.log('   Token salvato nel database');
      console.log('   Service: whatsapp');
      console.log('   Attiva: true');
    }
    
    console.log('\n🎯 Il sistema ora usa il token dal database, non da file .env!');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupWhatsAppConfig();
