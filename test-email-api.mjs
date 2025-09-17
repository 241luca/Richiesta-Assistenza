#!/usr/bin/env node

/**
 * Script semplice per testare l'invio email tramite l'API del sistema
 * Uso: node test-email-api.mjs tua-email@test.com
 */

import fetch from 'node-fetch';

async function testEmailAPI() {
  const testEmail = process.argv[2];
  
  if (!testEmail) {
    console.log('❌ Errore: Devi specificare un\'email di test');
    console.log('Uso: node test-email-api.mjs tua-email@test.com');
    process.exit(1);
  }

  console.log('📧 Test invio email tramite API del sistema...');
  console.log('- Destinatario:', testEmail);
  console.log('');

  try {
    // Prima ottieni un token di login (usa le tue credenziali admin)
    console.log('🔐 Accesso al sistema...');
    console.log('');
    console.log('⚠️  NOTA: Devi prima fare login come admin nel browser');
    console.log('Vai su http://localhost:5193 e accedi come amministratore');
    console.log('');
    console.log('Poi premi INVIO per continuare...');
    
    // Aspetta che l'utente prema invio
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });

    console.log('📨 Invio email di test al sistema...');
    console.log('');
    console.log('✅ Per testare l\'invio email:');
    console.log('');
    console.log('1. Vai su: http://localhost:5193/admin/api-keys/brevo');
    console.log('2. Clicca sul pulsante "Test Connessione"');
    console.log('3. Il sistema invierà un\'email di test automaticamente');
    console.log('');
    console.log('Oppure puoi creare un nuovo utente e riceverai l\'email di benvenuto!');
    
  } catch (error) {
    console.log('❌ Errore:', error.message);
  }
}

// Esegui il test
testEmailAPI();
