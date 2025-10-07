// Script per verificare lo stato completo del sistema WhatsApp
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function checkWhatsAppSystem() {
  console.log('==============================================');
  console.log('   CONTROLLO COMPLETO SISTEMA WHATSAPP');
  console.log('==============================================\n');

  try {
    // 1. Controlla configurazione nel database
    console.log('📊 1. CONFIGURAZIONE DATABASE\n');
    
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
      console.log('❌ Nessuna configurazione WhatsApp trovata nel database');
      console.log('   Esegui: npx ts-node scripts/setup-whatsapp-secure.ts\n');
    } else {
      console.log(`✅ Trovate ${whatsappConfigs.length} configurazioni WhatsApp:\n`);
      
      for (const config of whatsappConfigs) {
        const hasToken = config.apiKey && config.apiKey.length > 0;
        const hasInstance = config.instanceId && config.instanceId.length > 0;
        
        console.log(`📱 Configurazione ${config.id}:`);
        console.log(`   Utente: ${config.user?.email || 'N/A'}`);
        console.log(`   Nome: ${config.name || 'WhatsApp'}`);
        console.log(`   Access Token: ${hasToken ? '✅ Configurato' : '❌ Mancante'}`);
        console.log(`   Instance ID: ${hasInstance ? '✅ ' + config.instanceId : '⚠️ Da generare'}`);
        console.log(`   Webhook: ${config.webhookUrl || 'Non configurato'}`);
        console.log(`   Attivo: ${config.isActive ? '✅' : '❌'}`);
        console.log(`   Ultimo aggiornamento: ${config.updatedAt.toLocaleString('it-IT')}\n`);
      }
    }

    // 2. Test connessione API (se configurato)
    if (whatsappConfigs.length > 0 && whatsappConfigs[0].isActive) {
      console.log('🔌 2. TEST CONNESSIONE API\n');
      
      const activeConfig = whatsappConfigs.find(c => c.isActive);
      if (activeConfig && activeConfig.apiKey) {
        try {
          console.log('   Tentativo verifica stato...');
          
          // Test chiamata all'API locale
          const localResponse = await axios.get('http://localhost:3200/api/whatsapp/status', {
            headers: {
              'Authorization': `Bearer ${await getAuthToken()}`
            },
            timeout: 5000
          });
          
          console.log('   ✅ Backend risponde:', localResponse.data);
        } catch (apiError: any) {
          console.log('   ⚠️ Backend non risponde:', apiError.message);
          console.log('   Assicurati che il backend sia attivo su porta 3200');
        }
      }
    }

    // 3. Verifica sicurezza
    console.log('\n🔒 3. VERIFICA SICUREZZA\n');
    
    // Cerca chiavi hardcoded nei file principali
    const fs = require('fs');
    const filesToCheck = [
      '/backend/src/services/whatsapp.service.ts',
      '/src/components/admin/whatsapp/WhatsAppConnection.tsx',
      '/backend/.env'
    ];
    
    let hardcodedFound = false;
    for (const file of filesToCheck) {
      const fullPath = `/Users/lucamambelli/Desktop/Richiesta-Assistenza${file}`;
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('68c575f3c2ff1') || 
            content.includes('68C67956807C8') || 
            content.includes('64833dfa')) {
          console.log(`   ❌ Chiavi hardcoded trovate in: ${file}`);
          hardcodedFound = true;
        }
      }
    }
    
    if (!hardcodedFound) {
      console.log('   ✅ Nessuna chiave hardcoded nei file principali');
    }
    
    // 4. Raccomandazioni
    console.log('\n📋 4. RACCOMANDAZIONI\n');
    
    if (whatsappConfigs.length === 0) {
      console.log('   1. Configura WhatsApp eseguendo:');
      console.log('      npx ts-node scripts/setup-whatsapp-secure.ts\n');
      console.log('   2. Oppure vai su: http://localhost:5193/admin/api-keys\n');
    } else {
      const activeConfig = whatsappConfigs.find(c => c.isActive);
      if (activeConfig) {
        if (!activeConfig.instanceId) {
          console.log('   1. Genera Instance ID da: http://localhost:5193/admin/whatsapp');
          console.log('   2. Clicca "Genera QR Code"');
          console.log('   3. Scansiona con WhatsApp\n');
        } else {
          console.log('   ✅ Sistema configurato e pronto!');
          console.log('   Vai su: http://localhost:5193/admin/whatsapp');
          console.log('   Per gestire la connessione WhatsApp\n');
        }
      } else {
        console.log('   ⚠️ Nessuna configurazione attiva');
        console.log('   Attiva una configurazione dal database\n');
      }
    }

  } catch (error) {
    console.error('❌ Errore durante il controllo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function getAuthToken(): Promise<string> {
  // Simuliamo un token per test
  // In produzione questo dovrebbe essere un token valido
  return 'test-token';
}

// Esegui il controllo
checkWhatsAppSystem();
