#!/usr/bin/env node

/**
 * Script di test per verificare la configurazione Brevo
 * Uso: node test-brevo-email.js tua-email@test.com
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carica le variabili d'ambiente dal backend
dotenv.config({ path: join(__dirname, 'backend', '.env') });

async function testBrevoEmail() {
  const testEmail = process.argv[2];
  
  if (!testEmail) {
    console.log('❌ Errore: Devi specificare un\'email di test');
    console.log('Uso: node test-brevo-email.js tua-email@test.com');
    process.exit(1);
  }

  console.log('🔧 Configurazione in uso:');
  console.log('- Host:', process.env.SMTP_HOST);
  console.log('- Porta:', process.env.SMTP_PORT);
  console.log('- User:', process.env.SMTP_USER);
  console.log('- From:', process.env.EMAIL_FROM);
  console.log('- Test Email:', testEmail);
  console.log('');

  // Verifica che le credenziali siano configurate
  if (!process.env.SMTP_USER || process.env.SMTP_USER.includes('LA_TUA_EMAIL')) {
    console.log('⚠️  ATTENZIONE: Devi prima configurare le credenziali Brevo nel file backend/.env');
    console.log('');
    console.log('1. Vai su www.brevo.com e registrati');
    console.log('2. Ottieni le credenziali SMTP dalla sezione "SMTP & API"');
    console.log('3. Sostituisci i valori nel file backend/.env:');
    console.log('   - SMTP_USER con la tua email Brevo');
    console.log('   - SMTP_PASS con la password SMTP di Brevo');
    console.log('   - EMAIL_FROM con l\'email mittente che vuoi usare');
    process.exit(1);
  }

  try {
    // Crea il transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    console.log('📧 Verifico la connessione SMTP...');
    await transporter.verify();
    console.log('✅ Connessione SMTP verificata con successo!');

    console.log('');
    console.log('📨 Invio email di test...');
    
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'test@assistenza.it',
      to: testEmail,
      subject: '🎉 Test Email Brevo - Sistema Richiesta Assistenza',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px;">
            <h1>✅ Test Email Riuscito!</h1>
          </div>
          <div style="background-color: #f9f9f9; padding: 30px; margin-top: 20px; border-radius: 8px;">
            <h2>Congratulazioni! 🎉</h2>
            <p>Se stai leggendo questa email, significa che la configurazione di Brevo è corretta!</p>
            <p><strong>Dettagli tecnici:</strong></p>
            <ul>
              <li>Server SMTP: ${process.env.SMTP_HOST}</li>
              <li>Porta: ${process.env.SMTP_PORT}</li>
              <li>Mittente: ${process.env.EMAIL_FROM}</li>
              <li>Data invio: ${new Date().toLocaleString('it-IT')}</li>
            </ul>
            <p style="margin-top: 30px; padding: 15px; background-color: #D1FAE5; border-radius: 5px;">
              <strong>✅ Il sistema è pronto per inviare email!</strong><br>
              Ora puoi utilizzare tutte le funzionalità di invio email del sistema.
            </p>
          </div>
          <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
            <p>Sistema Richiesta Assistenza - Email di Test</p>
          </div>
        </div>
      `
    });

    console.log('✅ Email inviata con successo!');
    console.log('📧 Message ID:', info.messageId);
    console.log('');
    console.log('🎉 PERFETTO! La configurazione Brevo funziona correttamente!');
    console.log('📬 Controlla la casella email:', testEmail);
    
  } catch (error) {
    console.log('');
    console.log('❌ ERRORE durante l\'invio:', error.message);
    console.log('');
    console.log('🔍 Possibili cause:');
    console.log('1. Credenziali SMTP errate - Verifica user e password');
    console.log('2. API Key non valida - Controlla su Brevo');
    console.log('3. Account Brevo non verificato - Conferma la tua email su Brevo');
    console.log('4. Limite giornaliero raggiunto (300 email/giorno nel piano gratuito)');
    console.log('');
    console.log('💡 Suggerimento: Vai su Brevo > SMTP & API e verifica le credenziali');
  }
}

// Esegui il test
testBrevoEmail();
