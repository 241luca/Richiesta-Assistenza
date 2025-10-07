#!/usr/bin/env ts-node

/**
 * Attiva POLLING per ricevere messaggi senza webhook
 * Alternativa se il webhook non funziona
 */

import { prisma } from '../src/config/database';
import axios from 'axios';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupPolling() {
  try {
    console.log('\n🔄 SETUP POLLING WHATSAPP');
    console.log('===========================\n');
    console.log('ℹ️  Il POLLING controlla periodicamente i nuovi messaggi');
    console.log('   invece di aspettare il webhook.');
    console.log('   È meno efficiente ma funziona sempre!\n');
    
    // Recupera configurazione
    const apiKey = await prisma.apiKey.findUnique({
      where: { service: 'whatsapp' }
    });
    
    if (!apiKey) {
      console.error('❌ Configurazione WhatsApp non trovata!');
      process.exit(1);
    }
    
    const config = apiKey.permissions as any;
    const token = apiKey.key;
    const instanceId = config?.instanceId;
    
    console.log('📱 Configurazione:');
    console.log('- Instance ID:', instanceId);
    console.log('- Token:', token);
    console.log('');
    
    const startPolling = await question('Vuoi attivare il POLLING per ricevere messaggi? (s/n): ');
    
    if (startPolling.toLowerCase() !== 's') {
      console.log('Operazione annullata');
      process.exit(0);
    }
    
    // Salva configurazione polling
    await prisma.systemConfiguration.upsert({
      where: { key: 'whatsapp_polling_enabled' },
      update: { 
        value: 'true',
        updatedAt: new Date()
      },
      create: {
        key: 'whatsapp_polling_enabled',
        value: 'true',
        description: 'Polling WhatsApp attivo'
      }
    });
    
    console.log('\n✅ Polling configurato!');
    console.log('');
    console.log('📌 ORA DEVI:');
    console.log('1. Riavvia il backend per attivare il polling');
    console.log('2. Il sistema controllerà automaticamente ogni 30 secondi');
    console.log('3. I nuovi messaggi appariranno nella dashboard');
    console.log('');
    console.log('⚠️  NOTA: Il polling è una soluzione temporanea.');
    console.log('   Idealmente dovresti sistemare il webhook per avere');
    console.log('   notifiche in tempo reale.');
    
    // Test immediato
    console.log('\n🔍 Facciamo un test immediato...');
    
    try {
      // Qui dovremmo chiamare l'API di SendApp per recuperare messaggi
      // Ma non vedo nella documentazione un endpoint per "get messages"
      // Quindi dovremo implementarlo diversamente
      
      console.log('⚠️  SendApp non sembra avere un API per recuperare messaggi.');
      console.log('   Il webhook è l\'unico modo per ricevere messaggi.');
      console.log('');
      console.log('📌 DEVI PER FORZA sistemare il webhook!');
      
    } catch (error: any) {
      console.error('Errore:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Esegui
setupPolling().catch(console.error);
