// Script per verificare e correggere configurazione WhatsApp
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixWhatsAppConfig() {
  try {
    console.log('🔧 Verifica configurazione WhatsApp...\n');
    
    // Recupera configurazione
    const config = await prisma.apiKey.findUnique({
      where: { service: 'whatsapp' }
    });
    
    if (!config) {
      console.log('❌ Configurazione WhatsApp non trovata!');
      return;
    }
    
    console.log('✅ Configurazione trovata:');
    console.log('- Service:', config.service);
    console.log('- Token:', config.key);
    console.log('- Is Active:', config.isActive);
    console.log('- Permissions:', JSON.stringify(config.permissions, null, 2));
    
    // Verifica se manca l'instance ID nelle permissions
    const permissions = config.permissions || {};
    if (!permissions.instanceId) {
      console.log('\n⚠️ Instance ID non trovato nelle permissions!');
      
      // Se c'è un instance ID da aggiungere (preso dall'interfaccia)
      const instanceId = process.env.WHATSAPP_INSTANCE_ID || ''; // Da configurare
      console.log(`📝 Aggiungo Instance ID: ${instanceId}`);
      
      await prisma.apiKey.update({
        where: { service: 'whatsapp' },
        data: {
          permissions: {
            ...permissions,
            baseURL: permissions.baseURL || 'https://app.sendapp.cloud/api',
            instanceId: instanceId,
            webhookUrl: permissions.webhookUrl || 'http://localhost:3200/api/whatsapp/webhook'
          }
        }
      });
      
      console.log('✅ Instance ID aggiunto con successo!');
    } else {
      console.log('\n✅ Instance ID già presente:', permissions.instanceId);
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixWhatsAppConfig();
