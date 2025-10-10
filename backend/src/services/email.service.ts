/**
 * Email Service
 * Sistema completo per invio email con Nodemailer/Brevo e template HTML
 * 
 * Responsabilità:
 * - Invio email tramite SMTP (Nodemailer/Brevo)
 * - Gestione configurazione email da database
 * - Template email predefiniti (benvenuto, reset password, preventivi)
 * - Quick Actions Email Templates (NUOVO v2.0)
 * - Log completo email inviate/fallite
 * - Test configurazione email
 * - Cache configurazione per performance
 * - Modalità development con logging (no invio reale)
 * 
 * @module services/email
 * @version 5.3.0 - Quick Actions Integration
 * @updated 2025-10-04
 * @author Sistema Richiesta Assistenza
 */

import * as nodemailer from 'nodemailer';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';

// ========================================
// INTERFACES
// ========================================

/**
 * Opzioni per invio email
 */
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
 * Interfaccia per Quick Action Button nelle email
 */
export interface QuickActionButton {
  label: string;
  url: string;
  color: 'green' | 'blue' | 'red' | 'yellow' | 'gray';
  icon?: string;
}

// ========================================
// CLASSE PRINCIPALE EMAIL SERVICE
// ========================================

/**
 * Email Service Class
 * 
 * Gestisce l'invio di email tramite SMTP con template HTML
 */
export class EmailService {
  private emailConfig: any = null;
  private transporter: nodemailer.Transporter | null = null;

  /**
   * Recupera la configurazione email dal database
   * Usa cache per evitare query ripetute
   * 
   * @private
   * @returns {Promise<Object|null>} Configurazione email o null
   */
  private async getEmailConfiguration() {
    try {
      // Ritorna cache se disponibile
      if (this.emailConfig) {
        return this.emailConfig;
      }

      logger.info('[EmailService] Loading email configuration from database');

      // Cerca la configurazione nel database
      const config = await prisma.systemSetting.findFirst({
        where: { key: 'email_configuration' }
      });

      if (config && config.value) {
        this.emailConfig = JSON.parse(config.value as string);
        logger.info('[EmailService] Email configuration loaded from database');
        return this.emailConfig;
      }

      // Configurazione di default per development
      logger.warn('[EmailService] No email configuration found, using default');
      this.emailConfig = {
        provider: 'brevo',
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: {
          user: '',
          pass: ''
        },
        from: 'noreply@richiesta-assistenza.it',
        enabled: false
      };
      
      return this.emailConfig;
      
    } catch (error) {
      logger.error('[EmailService] Error loading email configuration:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return null;
    }
  }

  /**
   * Inizializza o aggiorna il transporter Nodemailer
   * Verifica connessione SMTP
   * 
   * @private
   * @returns {Promise<Transporter|null>} Transporter o null se disabilitato
   */
  private async initializeTransporter() {
    try {
      const config = await this.getEmailConfiguration();
      
      if (!config || !config.enabled) {
        logger.info('[EmailService] Email service disabled or not configured');
        return null;
      }

      logger.info('[EmailService] Initializing email transporter');

      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.auth.user,
          pass: config.auth.pass
        }
      });

      // Verifica la configurazione
      await this.transporter.verify();
      logger.info('[EmailService] Email transporter initialized and verified successfully');
      
      return this.transporter;
      
    } catch (error) {
      logger.error('[EmailService] Failed to initialize email transporter:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      this.transporter = null;
      return null;
    }
  }

  /**
   * Invia una email con gestione errori e logging completo
   * In development mode logga senza inviare realmente
   * 
   * @param {EmailOptions} options - Opzioni email (to, subject, html, etc)
   * @returns {Promise<void>}
   * @throws {Error} Se invio fallisce
   * 
   * @example
   * await emailService.sendEmail({
   *   to: 'user@example.com',
   *   subject: 'Benvenuto',
   *   html: '<h1>Ciao!</h1>'
   * });
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      logger.info('[EmailService] Sending email', {
        to: options.to,
        subject: options.subject
      });

      // Inizializza il transporter se non esiste
      if (!this.transporter) {
        await this.initializeTransporter();
      }

      // Se ancora non c'è il transporter, logga solo
      if (!this.transporter) {
        logger.info('[EmailService] Email not sent (service disabled)', {
          to: options.to,
          subject: options.subject,
          preview: options.text?.substring(0, 100)
        });
        return;
      }

      const config = await this.getEmailConfiguration();
      
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
        logger.info('[EmailService] Email (Development Mode - Not Sent)', {
          to: mailOptions.to,
          subject: mailOptions.subject,
          preview: options.text?.substring(0, 100)
        });
        return;
      }

      // Invia l'email realmente
      const info = await this.transporter.sendMail(mailOptions);
      
      // Salva nel log delle email inviate
      await prisma.emailLog.create({
        data: {
          id: `email_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          to: mailOptions.to,
          from: mailOptions.from,
          subject: mailOptions.subject,
          body: options.html || options.text || '',
          status: 'sent',
          messageId: info.messageId,
          sentAt: new Date()
        }
      });

      logger.info('[EmailService] Email sent successfully', {
        messageId: info.messageId,
        to: mailOptions.to,
        subject: mailOptions.subject
      });
      
    } catch (error) {
      // Log errore nel database
      try {
        const config = await this.getEmailConfiguration();
        await prisma.emailLog.create({
          data: {
            id: `email_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
            from: options.from || config?.from || 'noreply@richiesta-assistenza.it',
            subject: options.subject,
            body: options.html || options.text || '',
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            sentAt: new Date()
          }
        });
      } catch (logError) {
        logger.error('[EmailService] Failed to log email error:', {
          error: logError instanceof Error ? logError.message : 'Unknown error'
        });
      }

      logger.error('[EmailService] Error sending email:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        to: options.to,
        subject: options.subject,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Aggiorna la configurazione email (solo admin)
   * Reinizializza transporter con nuova configurazione
   * 
   * @param {Object} config - Nuova configurazione email
   * @returns {Promise<void>}
   * @throws {Error} Se aggiornamento fallisce
   * 
   * @example
   * await emailService.updateEmailConfiguration({
   *   provider: 'brevo',
   *   host: 'smtp-relay.brevo.com',
   *   port: 587,
   *   auth: { user: 'xxx', pass: 'yyy' },
   *   enabled: true
   * });
   */
  async updateEmailConfiguration(config: any): Promise<void> {
    try {
      logger.info('[EmailService] Updating email configuration');

      // ✅ FIX: Aggiunti campi obbligatori per SystemSetting
      await prisma.systemSetting.upsert({
        where: { key: 'email_configuration' },
        update: { 
          value: JSON.stringify(config),
          updatedAt: new Date()
        },
        create: {
          id: `email_config_${Date.now()}`,
          key: 'email_configuration',
          value: JSON.stringify(config),
          type: 'json',
          label: 'Configurazione Email',
          description: 'Email service configuration (Brevo/SMTP)',
          category: 'email',
          isEditable: true,
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Reinizializza il transporter con la nuova configurazione
      this.emailConfig = config;
      await this.initializeTransporter();
      
      logger.info('[EmailService] Email configuration updated successfully');
      
    } catch (error) {
      logger.error('[EmailService] Error updating email configuration:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Test della configurazione email
   * Invia email di test per verificare funzionamento
   * 
   * @param {string} testEmail - Email destinatario test
   * @returns {Promise<boolean>} true se test riuscito
   * 
   * @example
   * const success = await emailService.testEmailConfiguration('test@example.com');
   * if (success) {
   *   console.log('Email configuration is working!');
   * }
   */
  async testEmailConfiguration(testEmail: string): Promise<boolean> {
    try {
      logger.info('[EmailService] Testing email configuration', { testEmail });

      await this.sendEmail({
        to: testEmail,
        subject: 'Test Email - Richiesta Assistenza',
        html: `
          <h2>Test Email</h2>
          <p>Questa è una email di test dal sistema Richiesta Assistenza.</p>
          <p>Se ricevi questa email, la configurazione è corretta!</p>
          <p>Data invio: ${new Date().toLocaleString('it-IT')}</p>
        `
      });

      logger.info('[EmailService] Test email sent successfully', { testEmail });
      return true;
      
    } catch (error) {
      logger.error('[EmailService] Test email failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        testEmail,
        stack: error instanceof Error ? error.stack : undefined
      });
      return false;
    }
  }

  /**
   * Recupera i log delle email inviate/fallite
   * Ordinati per data decrescente (più recenti primi)
   * 
   * @param {number} [limit=100] - Numero massimo di log da recuperare
   * @returns {Promise<Array>} Lista log email
   * 
   * @example
   * const logs = await emailService.getEmailLogs(50);
   * logs.forEach(log => {
   *   console.log(`${log.sentAt}: ${log.status} - ${log.subject}`);
   * });
   */
  async getEmailLogs(limit: number = 100) {
    try {
      logger.info('[EmailService] Getting email logs', { limit });

      const logs = await prisma.emailLog.findMany({
        take: limit,
        orderBy: { sentAt: 'desc' }
      });

      logger.info('[EmailService] Email logs retrieved', { count: logs.length });
      return logs;
      
    } catch (error) {
      logger.error('[EmailService] Error getting email logs:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        limit,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Template HTML per email di benvenuto
   * Include design responsive e call-to-action
   * 
   * @param {string} userName - Nome utente
   * @param {string} [verificationLink] - Link verifica email (opzionale)
   * @returns {string} HTML template
   * 
   * @example
   * const html = emailService.getWelcomeEmailTemplate(
   *   'Mario Rossi',
   *   'https://example.com/verify?token=xxx'
   * );
   */
  getWelcomeEmailTemplate(userName: string, verificationLink?: string): string {
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
            <p>Questa email è stata inviata a ${userName}.</p>
            <p>© 2025 Richiesta Assistenza. Tutti i diritti riservati.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Template HTML per email di reset password
   * Include avviso sicurezza e scadenza link
   * 
   * @param {string} userName - Nome utente
   * @param {string} resetLink - Link per reset password
   * @returns {string} HTML template
   * 
   * @example
   * const html = emailService.getResetPasswordEmailTemplate(
   *   'Mario Rossi',
   *   'https://example.com/reset?token=xxx'
   * );
   */
  getResetPasswordEmailTemplate(userName: string, resetLink: string): string {
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
   * Template HTML per notifica nuovo preventivo
   * Include dettagli preventivo e call-to-action
   * 
   * @param {string} clientName - Nome cliente
   * @param {string} professionalName - Nome professionista
   * @param {string} requestTitle - Titolo richiesta
   * @param {number} quoteAmount - Importo preventivo (in centesimi)
   * @param {string} quoteLink - Link per visualizzare preventivo
   * @returns {string} HTML template
   * 
   * @example
   * const html = emailService.getNewQuoteEmailTemplate(
   *   'Mario Rossi',
   *   'Idraulico Luigi',
   *   'Riparazione perdita',
   *   15000, // 150.00 EUR
   *   'https://example.com/quotes/123'
   * );
   */
  getNewQuoteEmailTemplate(
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

  /**
   * 🆕 NUOVO v2.0 - Template avanzato con Quick Actions
   * Email con call-to-action buttons per azioni immediate
   * 
   * @param {string} userName - Nome destinatario
   * @param {string} title - Titolo email
   * @param {string} message - Messaggio principale
   * @param {string} itemDescription - Descrizione elemento (preventivo, richiesta, ecc)
   * @param {QuickActionButton[]} actions - Array di bottoni azione
   * @param {string} [footerNote] - Nota aggiuntiva nel footer
   * @returns {string} HTML template
   * 
   * @example
   * const html = emailService.getQuickActionsEmailTemplate(
   *   'Mario Rossi',
   *   'Nuovo Preventivo Ricevuto!',
   *   'Hai ricevuto un preventivo da un professionista qualificato.',
   *   'Riparazione impianto idraulico - €150.00',
   *   [
   *     { label: '✓ Accetta', url: 'https://...', color: 'green' },
   *     { label: '💬 Negozia', url: 'https://...', color: 'blue' },
   *     { label: '👁️ Visualizza', url: 'https://...', color: 'gray' }
   *   ]
   * );
   */
  getQuickActionsEmailTemplate(
    userName: string,
    title: string,
    message: string,
    itemDescription: string,
    actions: QuickActionButton[],
    footerNote?: string
  ): string {
    // Genera bottoni HTML
    const actionButtons = actions.map(action => {
      const colors = {
        green: { bg: '#10B981', hover: '#059669' },
        blue: { bg: '#3B82F6', hover: '#2563EB' },
        red: { bg: '#EF4444', hover: '#DC2626' },
        yellow: { bg: '#F59E0B', hover: '#D97706' },
        gray: { bg: '#6B7280', hover: '#4B5563' }
      };

      const color = colors[action.color] || colors.gray;

      return `
        <a href="${action.url}" 
           style="display: inline-block; 
                  padding: 12px 20px; 
                  margin: 8px 4px; 
                  background-color: ${color.bg}; 
                  color: white; 
                  text-decoration: none; 
                  border-radius: 6px; 
                  font-weight: bold;
                  font-size: 14px;
                  transition: background-color 0.2s;"
           onmouseover="this.style.backgroundColor='${color.hover}'"
           onmouseout="this.style.backgroundColor='${color.bg}'">
          ${action.icon || ''} ${action.label}
        </a>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f5f5f5;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content { 
            padding: 30px; 
          }
          .item-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
          }
          .item-description {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
            margin: 0;
          }
          .actions-container {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background-color: #fafafa;
            border-radius: 8px;
          }
          .actions-title {
            font-size: 16px;
            color: #4a5568;
            margin-bottom: 15px;
            font-weight: 600;
          }
          .footer { 
            background-color: #f7fafc;
            padding: 20px; 
            text-align: center; 
            border-top: 1px solid #e2e8f0;
          }
          .footer-text {
            color: #64748b; 
            font-size: 12px;
            margin: 5px 0;
          }
          .highlight {
            background-color: #fef3c7;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 600;
          }
          @media only screen and (max-width: 600px) {
            .container {
              margin: 10px;
              border-radius: 4px;
            }
            .content {
              padding: 20px;
            }
            .actions-container {
              padding: 15px;
            }
            .actions-container a {
              display: block !important;
              margin: 8px 0 !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚡ ${title}</h1>
          </div>
          
          <div class="content">
            <h2>Ciao <span class="highlight">${userName}</span>!</h2>
            <p style="font-size: 16px; color: #4a5568;">${message}</p>
            
            <div class="item-box">
              <p class="item-description">${itemDescription}</p>
            </div>
            
            <div class="actions-container">
              <p class="actions-title">🚀 Azioni Rapide Disponibili:</p>
              ${actionButtons}
            </div>
            
            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af; font-weight: 600;">💡 Suggerimento</p>
              <p style="margin: 5px 0 0 0; color: #1e3a8a; font-size: 14px;">
                Usa i bottoni sopra per azioni immediate, oppure accedi al tuo account per maggiori opzioni.
              </p>
            </div>
            
            <p>Se hai domande o necessiti di assistenza, il nostro team è sempre a disposizione.</p>
            <p style="margin-top: 25px;">
              Cordiali saluti,<br>
              <strong>Il Team di Richiesta Assistenza</strong>
            </p>
          </div>
          
          <div class="footer">
            <p class="footer-text">
              Email inviata a ${userName} • ${new Date().toLocaleDateString('it-IT')}
            </p>
            ${footerNote ? `<p class="footer-text">${footerNote}</p>` : ''}
            <p class="footer-text">
              © 2025 Richiesta Assistenza. Tutti i diritti riservati.
            </p>
            <p style="font-size: 10px; color: #9ca3af; margin-top: 10px;">
              Questa è una notifica automatica del sistema. I link scadono dopo 7 giorni per sicurezza.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

/**
 * Export Singleton Instance
 * Usa questa istanza in tutto il sistema
 */
export const emailService = new EmailService();

/**
 * Export default per retrocompatibilità
 */
export default {
  sendEmail: (options: EmailOptions) => emailService.sendEmail(options),
  updateEmailConfiguration: (config: any) => emailService.updateEmailConfiguration(config),
  testEmailConfiguration: (email: string) => emailService.testEmailConfiguration(email),
  getEmailLogs: (limit?: number) => emailService.getEmailLogs(limit),
  getWelcomeEmailTemplate: (name: string, link?: string) => emailService.getWelcomeEmailTemplate(name, link),
  getResetPasswordEmailTemplate: (name: string, link: string) => emailService.getResetPasswordEmailTemplate(name, link),
  getNewQuoteEmailTemplate: (client: string, pro: string, title: string, amount: number, link: string) => 
    emailService.getNewQuoteEmailTemplate(client, pro, title, amount, link),
  // 🆕 NUOVO - Quick Actions Email Template
  getQuickActionsEmailTemplate: (
    userName: string,
    title: string,
    message: string,
    itemDescription: string,
    actions: QuickActionButton[],
    footerNote?: string
  ) => emailService.getQuickActionsEmailTemplate(userName, title, message, itemDescription, actions, footerNote)
};