/**
 * Script per riavviare completamente WhatsApp WPPConnect
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function restartWhatsApp() {
  console.log('🔄 RIAVVIO COMPLETO WHATSAPP\n');
  console.log('=' .repeat(50));
  
  try {
    // 1. Ferma eventuali processi Chrome/Chromium zombie
    console.log('1. Pulizia processi browser...');
    const { exec } = require('child_process');
    
    // Killa processi Chrome/Chromium
    exec("pkill -f 'Chrome.*--remote-debugging'", (error: any) => {
      if (error && error.code !== 1) {
        console.log('   ⚠️ Errore kill Chrome:', error.message);
      } else {
        console.log('   ✅ Processi Chrome terminati');
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2. Pulisci sessione vecchia
    console.log('\n2. Pulizia sessione esistente...');
    const sessionPath = path.join(process.cwd(), 'tokens', 'assistenza');
    const sessionPathAlt = path.join(process.cwd(), 'tokens', 'assistenza-wpp');
    
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
      console.log('   ✅ Rimossa sessione: tokens/assistenza');
    }
    
    if (fs.existsSync(sessionPathAlt)) {
      fs.rmSync(sessionPathAlt, { recursive: true, force: true });
      console.log('   ✅ Rimossa sessione: tokens/assistenza-wpp');
    }
    
    // Pulisci anche .wppconnect se esiste
    const wppPath = path.join(process.cwd(), '.wppconnect');
    if (fs.existsSync(wppPath)) {
      fs.rmSync(wppPath, { recursive: true, force: true });
      console.log('   ✅ Rimossa cartella .wppconnect');
    }
    
    // 3. Reset nel database
    console.log('\n3. Reset database WhatsApp...');
    
    // Elimina impostazioni WhatsApp salvate
    const deletedSettings = await prisma.systemSetting.deleteMany({
      where: {
        key: {
          startsWith: 'wpp'
        }
      }
    });
    console.log(`   ✅ Eliminate ${deletedSettings.count} impostazioni`);
    
    // 4. Crea cartella tokens pulita
    console.log('\n4. Preparazione ambiente pulito...');
    const tokensDir = path.join(process.cwd(), 'tokens');
    if (!fs.existsSync(tokensDir)) {
      fs.mkdirSync(tokensDir, { recursive: true });
      console.log('   ✅ Creata cartella tokens');
    }
    
    console.log('\n✅ RIAVVIO COMPLETATO!\n');
    console.log('📋 ISTRUZIONI:');
    console.log('1. Riavvia il backend: CTRL+C e npm run dev');
    console.log('2. Vai su: http://localhost:5193/admin/whatsapp');
    console.log('3. Clicca su "Genera QR Code"');
    console.log('4. Scansiona il nuovo QR con WhatsApp\n');
    
    console.log('⚠️  IMPORTANTE:');
    console.log('Se il problema persiste, prova con WPPCONNECT_HEADLESS=false');
    console.log('nel file .env per vedere cosa succede nel browser\n');
    
  } catch (error: any) {
    console.error('❌ Errore durante il riavvio:', error.message);
  } finally {
    await prisma.$disconnect();
  }
  
  console.log('=' .repeat(50));
  process.exit(0);
}

// Esegui
restartWhatsApp();
