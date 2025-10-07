// Script per disconnettere WhatsApp e preparare nuova connessione
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// Configurazione SendApp API
const SENDAPP_BASE_URL = 'https://app.sendapp.cloud/api';

async function disconnectAndReset() {
  try {
    console.log('===========================================');
    console.log('   DISCONNESSIONE E RESET WHATSAPP');
    console.log('===========================================\n');

    // 1. Trova configurazione attiva
    const activeConfig = await prisma.apiKey.findFirst({
      where: {
        service: 'WHATSAPP',
        isActive: true
      }
    });

    if (!activeConfig) {
      console.log('ℹ️  Nessuna configurazione WhatsApp attiva trovata.\n');
      console.log('Possiamo procedere direttamente con la nuova configurazione.\n');
      return;
    }

    console.log('📱 Configurazione attiva trovata:');
    console.log(`   Instance ID: ${activeConfig.instanceId}`);
    console.log(`   API Key: ${activeConfig.apiKey?.substring(0, 10)}...`);
    console.log('\n');

    // 2. Disconnetti da SendApp (se instance ID esiste)
    if (activeConfig.instanceId && activeConfig.apiKey) {
      console.log('🔄 Tentativo di disconnessione da SendApp...');
      
      try {
        // Prima prova a fare reset (disconnette e cancella dati)
        const resetUrl = `${SENDAPP_BASE_URL}/reset_instance`;
        const resetParams = {
          instance_id: activeConfig.instanceId,
          access_token: activeConfig.apiKey
        };
        
        console.log('   Chiamata API reset_instance...');
        const resetResponse = await axios.get(resetUrl, { params: resetParams });
        console.log('   ✅ Reset completato:', resetResponse.data);
        
      } catch (error: any) {
        console.log('   ⚠️  Reset fallito, provo con reboot...');
        
        try {
          // Se reset fallisce, prova reboot (solo disconnette)
          const rebootUrl = `${SENDAPP_BASE_URL}/reboot`;
          const rebootParams = {
            instance_id: activeConfig.instanceId,
            access_token: activeConfig.apiKey
          };
          
          const rebootResponse = await axios.get(rebootUrl, { params: rebootParams });
          console.log('   ✅ Reboot completato:', rebootResponse.data);
          
        } catch (rebootError: any) {
          console.log('   ❌ Anche reboot fallito:', rebootError.response?.data || rebootError.message);
          console.log('   Procedo comunque con disattivazione nel DB...');
        }
      }
    }

    // 3. Disattiva configurazione nel database
    console.log('\n📝 Disattivazione configurazione nel database...');
    
    await prisma.apiKey.update({
      where: { id: activeConfig.id },
      data: {
        isActive: false,
        metadata: {
          ...(typeof activeConfig.metadata === 'object' ? activeConfig.metadata : {}),
          disconnectedAt: new Date().toISOString(),
          disconnectedReason: 'Manual reset for new phone connection'
        }
      }
    });
    
    console.log('   ✅ Configurazione disattivata nel database\n');

    // 4. Prepara per nuova connessione
    console.log('===========================================');
    console.log('   PRONTO PER NUOVA CONNESSIONE');
    console.log('===========================================\n');
    console.log('📋 Prossimi passi:');
    console.log('1. Crea nuova istanza con create_instance');
    console.log('2. Genera QR code per nuovo telefono');
    console.log('3. Configura webhook con ngrok');
    console.log('4. Aggiorna database con nuovi dati\n');

  } catch (error) {
    console.error('❌ Errore durante disconnessione:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chiedi conferma prima di procedere
console.log('⚠️  ATTENZIONE: Questo script disconnetterà il WhatsApp attuale!\n');
console.log('Premere CTRL+C per annullare o INVIO per continuare...');

// Attendi input utente
process.stdin.once('data', () => {
  disconnectAndReset();
});
