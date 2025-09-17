// Script per verificare configurazione WhatsApp attuale
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkWhatsAppConfig() {
  try {
    console.log('===========================================');
    console.log('    VERIFICA CONFIGURAZIONE WHATSAPP');
    console.log('===========================================\n');

    // 1. Cerca configurazioni WhatsApp nel database
    const whatsappConfigs = await prisma.apiKey.findMany({
      where: {
        service: 'WHATSAPP'
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (whatsappConfigs.length === 0) {
      console.log('❌ Nessuna configurazione WhatsApp trovata nel database\n');
    } else {
      console.log(`✅ Trovate ${whatsappConfigs.length} configurazioni WhatsApp:\n`);
      
      for (const config of whatsappConfigs) {
        console.log('-------------------------------------------');
        console.log(`ID: ${config.id}`);
        console.log(`Utente: ${config.user?.email || 'N/A'}`);
        console.log(`Service: ${config.service}`);
        console.log(`API Key: ${config.apiKey?.substring(0, 10)}...`);
        console.log(`Instance ID: ${config.instanceId || 'NON CONFIGURATO'}`);
        console.log(`Webhook URL: ${config.webhookUrl || 'NON CONFIGURATO'}`);
        console.log(`Attivo: ${config.isActive ? '✅ SI' : '❌ NO'}`);
        console.log(`Creato: ${config.createdAt.toLocaleString('it-IT')}`);
        console.log(`Ultimo aggiornamento: ${config.updatedAt.toLocaleString('it-IT')}`);
        console.log('-------------------------------------------\n');
      }
    }

    // 2. Verifica se ci sono configurazioni attive
    const activeConfigs = whatsappConfigs.filter(c => c.isActive);
    if (activeConfigs.length > 0) {
      console.log(`⚠️  CI SONO ${activeConfigs.length} CONFIGURAZIONI ATTIVE\n`);
      console.log('Per disconnettere il telefono attuale dovremo:');
      console.log('1. Chiamare API di reset/reboot');
      console.log('2. Disattivare la configurazione nel DB');
      console.log('3. Creare nuova istanza');
      console.log('4. Configurare nuovo webhook\n');
    }

  } catch (error) {
    console.error('❌ Errore durante la verifica:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script
checkWhatsAppConfig();
