/**
 * Email Service
 * Servizio per l'invio di email tramite Nodemailer/Brevo
 * Le configurazioni sono gestite dall'admin nel database
 */

import * as nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Cache per la configurazione email
let emailConfig: any = null;
let transporter: nodemailer.Transporter | null = null;

/**
 * Recupera la configurazione email dal database
 */
async function getEmailConfiguration() {
  try {
    // Cerca la configurazione nel database
    const config = await prisma.systemSetting.findFirst({
      where: { key: 'email_configuration' }
    });

    if (config && config.value) {
      emailConfig = JSON.parse(config.value as string);
      return emailConfig;
    }

    // Configurazione di default per development
    return {
      provider: 'brevo',
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        User: '',
        pass: ''
      },
      from: 'noreply@richiesta-assistenza.it',
      enabled: false // Disabilitato di default
    };
  } catch (error) {
    logger.error('Error loading email configuration:', error);
    return null;
  }
}

/**
 * Inizializza o aggiorna il transporter
 */
async function initializeTransporter() {
  const config = await getEmailConfiguration();
  
  if (!config || !config.enabled) {
    logger.info('📧 Email service disabled or not configured');
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        User: config.auth.user,
        pass: config.auth.pass
      }
    });

    // Verifica la configurazione
    await transporter.verify();
    logger.info('✅ Email transporter initialized successfully');
    return transporter;
  } catch (error) {
    logger.error('❌ Failed to initialize email transporter:', error);
    transporter = null;
    return null;
  }
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
  }>;
}

/**
 * Invia una email
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    // Inizializza il transporter se non esiste
    if (!transporter) {
      await initializeTransporter();
    }

    // Se ancora non c'è il transporter, logga solo
    if (!transporter) {
      logger.info('📧 Email (Service Disabled):', {
        to: options.to,
        subject: options.subject,
        preview: options.text?.substring(0, 100)
      });
      return;
    }

    const config = await getEmailConfiguration();
    
    const mailOptions = {
      from: options.from || config.from || 'noreply@richiesta-assistenza.it',
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text,
      replyTo: options.replyTo,
      attachments: options.attachments
    };

    // In development, logga solo l'email invece di inviarla
    if (process.env.NODE_ENV === 'development' && !config.enabled) {
      logger.info('📧 Email (Development Mode - Not Sent):', {
        to: mailOptions.to,
        subject: mailOptions.subject,
        preview: options.text?.substring(0, 100)
      });
      return;
    }

    // Invia l'email
    const info = await transporter.sendMail(mailOptions);
    
    // Salva nel log delle email inviate
    await prisma.emailLog.create({
      data: {
        to: mailOptions.to,
        subject: mailOptions.subject,
        status: 'sent',
        messageId: info.messageId,
        sentAt: new Date()
      }
    });

    logger.info(`📧 Email sent successfully: ${info.messageId}`, {
      to: mailOptions.to,
      subject: mailOptions.subject
    });
  } catch (error) {
    // Log errore nel database
    await prisma.emailLog.create({
      data: {
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        sentAt: new Date()
      }
    });

    logger.error('❌ Error sending email:', error);
    throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Aggiorna la configurazione email (solo admin)
 */
export async function updateEmailConfiguration(config: any): Promise<void> {
  try {
    await prisma.systemSetting.upsert({
      where: { key: 'email_configuration' },
      update: { 
        value: JSON.stringify(config),
        updatedAt: new Date()
      },
      create: {
        key: 'email_configuration',
        value: JSON.stringify(config),
        description: 'Email service configuration (Brevo/SMTP)'
      }
    });

    // Reinizializza il transporter con la nuova configurazione
    emailConfig = config;
    await initializeTransporter();
    
    logger.info('✅ Email configuration updated successfully');
  } catch (error) {
    logger.error('❌ Error updating email configuration:', error);
    throw error;
  }
}

/**
 * Test della configurazione email
 */
export async function testEmailConfiguration(testEmail: string): Promise<boolean> {
  try {
    await sendEmail({
      to: testEmail,
      subject: 'Test Email - Richiesta Assistenza',
      html: `
        <h2>Test Email</h2>
        <p>Questa è una email di test dal sistema Richiesta Assistenza.</p>
        <p>Se ricevi questa email, la configurazione è corretta!</p>
        <p>Data invio: ${new Date().toLocaleString('it-IT')}</p>
      `
    });
    return true;
  } catch (error) {
    logger.error('Test email failed:', error);
    return false;
  }
}

/**
 * Recupera i log delle email
 */
export async function getEmailLogs(limit: number = 100) {
  return await prisma.emailLog.findMany({
    take: limit,
    orderBy: { sentAt: 'desc' }
  });
}

/**
 * Template per email di benvenuto
 */
export function getWelcomeEmailTemplate(userName: string, verificationLink?: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Benvenuto in Richiesta Assistenza!</h1>
        </div>
        <div class="content">
          <h2>Ciao ${userName}!</h2>
          <p>Grazie per esserti registrato sulla nostra piattaforma di richiesta assistenza.</p>
          <p>Con il tuo account potrai:</p>
          <ul>
            <li>Richiedere assistenza da professionisti qualificati</li>
            <li>Ricevere preventivi personalizzati</li>
            <li>Gestire le tue richieste in tempo reale</li>
            <li>Comunicare direttamente con i professionisti</li>
          </ul>
          ${verificationLink ? `
            <p>Per completare la registrazione, verifica il tuo indirizzo email:</p>
            <center>
              <a href="${verificationLink}" class="button">Verifica Email</a>
            </center>
            <p style="font-size: 12px; color: #666;">
              Se il pulsante non funziona, copia e incolla questo link nel browser:<br>
              ${verificationLink}
            </p>
          ` : ''}
          <p>Se hai domande o necessiti di assistenza, non esitare a contattarci.</p>
          <p>Cordiali saluti,<br>Il Team di Richiesta Assistenza</p>
        </div>
        <div class="footer">
          <p>Questa email è stata inviata a ${userName}. Se non hai richiesto questa registrazione, ignora questa email.</p>
          <p>© 2025 Richiesta Assistenza. Tutti i diritti riservati.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Template per email di reset password
 */
export function getResetPasswordEmailTemplate(userName: string, resetLink: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #EF4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #EF4444; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
        .warning { background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 10px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reset Password</h1>
        </div>
        <div class="content">
          <h2>Ciao ${userName},</h2>
          <p>Abbiamo ricevuto una richiesta di reset password per il tuo account.</p>
          <p>Se hai richiesto tu il reset, clicca sul pulsante sottostante per impostare una nuova password:</p>
          <center>
            <a href="${resetLink}" class="button">Reset Password</a>
          </center>
          <p style="font-size: 12px; color: #666;">
            Se il pulsante non funziona, copia e incolla questo link nel browser:<br>
            ${resetLink}
          </p>
          <div class="warning">
            <strong>⚠️ Attenzione:</strong> Questo link scadrà tra 1 ora per motivi di sicurezza.
          </div>
          <p>Se non hai richiesto il reset della password, ignora questa email. Il tuo account rimarrà sicuro.</p>
          <p>Cordiali saluti,<br>Il Team di Richiesta Assistenza</p>
        </div>
        <div class="footer">
          <p>Per motivi di sicurezza, questo link è valido solo per 1 ora.</p>
          <p>© 2025 Richiesta Assistenza. Tutti i diritti riservati.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Template per notifica nuovo preventivo
 */
export function getNewQuoteEmailTemplate(
  clientName: string,
  professionalName: string,
  requestTitle: string,
  quoteAmount: number,
  quoteLink: string
): string {
  const formattedAmount = new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(quoteAmount / 100);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .quote-box { background-color: white; border: 2px solid #10B981; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .amount { font-size: 24px; font-weight: bold; color: #10B981; }
        .button { display: inline-block; padding: 12px 24px; background-color: #10B981; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 Nuovo Preventivo Ricevuto!</h1>
        </div>
        <div class="content">
          <h2>Ciao ${clientName},</h2>
          <p>Hai ricevuto un nuovo preventivo per la tua richiesta:</p>
          <div class="quote-box">
            <h3>${requestTitle}</h3>
            <p><strong>Professionista:</strong> ${professionalName}</p>
            <p><strong>Importo:</strong> <span class="amount">${formattedAmount}</span></p>
          </div>
          <p>Visualizza i dettagli completi del preventivo e confrontalo con altri ricevuti:</p>
          <center>
            <a href="${quoteLink}" class="button">Visualizza Preventivo</a>
          </center>
          <p>Ricorda che puoi:</p>
          <ul>
            <li>Confrontare tutti i preventivi ricevuti</li>
            <li>Chattare con il professionista per chiarimenti</li>
            <li>Richiedere modifiche se necessario</li>
            <li>Accettare il preventivo quando sei pronto</li>
          </ul>
          <p>Cordiali saluti,<br>Il Team di Richiesta Assistenza</p>
        </div>
        <div class="footer">
          <p>Questa è una notifica automatica. Non rispondere a questa email.</p>
          <p>© 2025 Richiesta Assistenza. Tutti i diritti riservati.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export default {
  sendEmail,
  updateEmailConfiguration,
  testEmailConfiguration,
  getEmailLogs,
  getWelcomeEmailTemplate,
  getResetPasswordEmailTemplate,
  getNewQuoteEmailTemplate
};
