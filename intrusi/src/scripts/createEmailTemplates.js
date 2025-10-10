// Script per creare automaticamente tutti i template email nel database
// Esegui questo file con: node backend/src/scripts/createEmailTemplates.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const emailTemplates = [
  {
    code: 'welcome_email',
    name: 'Email di Benvenuto',
    description: 'Inviata quando un nuovo utente si registra',
    category: 'user',
    subject: 'Benvenuto in Richiesta Assistenza - Il tuo account è attivo!',
    htmlContent: `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Benvenuto</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600;">Benvenuto {{userName}}! 🎉</h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Il tuo account è stato creato con successo</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Siamo felici di averti con noi!</h2>
                            
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Grazie per aver scelto <strong>Richiesta Assistenza</strong>, la piattaforma leader per trovare professionisti qualificati per ogni tua esigenza.
                            </p>
                            
                            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
                                <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 18px;">✨ Cosa puoi fare ora:</h3>
                                <ul style="color: #666666; margin: 0; padding-left: 20px; line-height: 1.8;">
                                    <li>Richiedi assistenza per qualsiasi necessità</li>
                                    <li>Ricevi preventivi gratuiti da professionisti verificati</li>
                                    <li>Confronta prezzi e recensioni</li>
                                    <li>Prenota interventi in pochi click</li>
                                    <li>Traccia lo stato delle tue richieste in tempo reale</li>
                                </ul>
                            </div>
                            
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="{{loginLink}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                                    Accedi al tuo Account
                                </a>
                            </div>
                            
                            <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 25px 0; border-radius: 4px;">
                                <p style="color: #2e7d32; margin: 0; font-weight: 600;">
                                    💡 Suggerimento: Completa il tuo profilo per ricevere preventivi più accurati!
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="color: #999999; margin: 0 0 10px 0; font-size: 14px;">
                                Hai bisogno di aiuto? Contattaci:
                            </p>
                            <p style="margin: 0 0 15px 0;">
                                <a href="mailto:support@richiestaassistenza.it" style="color: #667eea; text-decoration: none; font-weight: 600;">support@richiestaassistenza.it</a>
                            </p>
                            <p style="color: #999999; margin: 0; font-size: 12px;">
                                © 2025 Richiesta Assistenza. Tutti i diritti riservati.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
    textContent: 'Benvenuto {{userName}}! Il tuo account è stato creato con successo. Accedi su {{loginLink}}',
    variables: ['userName', 'loginLink'],
    channels: ['email'],
    priority: 'HIGH',
    isActive: true
  },
  {
    code: 'password_reset',
    name: 'Reset Password',
    description: 'Email per il recupero password',
    category: 'auth',
    subject: 'Reimposta la tua password - Richiesta Assistenza',
    htmlContent: `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600;">Reset Password 🔐</h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Reimposta la tua password in modo sicuro</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Ciao {{userName}},</h2>
                            
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Abbiamo ricevuto una richiesta di reset password per il tuo account. Se non hai effettuato tu questa richiesta, puoi ignorare questa email.
                            </p>
                            
                            <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 25px 0;">
                                <p style="color: #856404; margin: 0; font-weight: 600;">
                                    ⚠️ Attenzione: Questo link scadrà tra {{expiryTime}} ore per motivi di sicurezza.
                                </p>
                            </div>
                            
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="{{resetLink}}" style="display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);">
                                    Reimposta Password
                                </a>
                            </div>
                            
                            <p style="color: #999999; font-size: 14px; text-align: center; margin: 20px 0;">
                                Se il pulsante non funziona, copia e incolla questo link nel browser:
                            </p>
                            <p style="color: #667eea; font-size: 14px; text-align: center; word-break: break-all;">
                                {{resetLink}}
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="color: #999999; margin: 0 0 10px 0; font-size: 14px;">
                                Non hai richiesto il reset? Ignora questa email o contattaci se hai dubbi.
                            </p>
                            <p style="margin: 0 0 15px 0;">
                                <a href="mailto:security@richiestaassistenza.it" style="color: #f5576c; text-decoration: none; font-weight: 600;">security@richiestaassistenza.it</a>
                            </p>
                            <p style="color: #999999; margin: 0; font-size: 12px;">
                                © 2025 Richiesta Assistenza. Tutti i diritti riservati.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
    textContent: 'Ciao {{userName}}, clicca qui per reimpostare la password: {{resetLink}}. Il link scadrà tra {{expiryTime}} ore.',
    variables: ['userName', 'resetLink', 'expiryTime'],
    channels: ['email'],
    priority: 'URGENT',
    isActive: true
  },
  {
    code: 'request_created',
    name: 'Richiesta Creata',
    description: 'Conferma creazione richiesta assistenza',
    category: 'request',
    subject: 'Richiesta #{{requestId}} creata con successo',
    htmlContent: `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Richiesta Creata</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600;">Richiesta Ricevuta! ✅</h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">La tua richiesta è stata presa in carico</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Ciao {{userName}},</h2>
                            
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                La tua richiesta di assistenza è stata registrata con successo. I nostri professionisti qualificati la stanno già esaminando.
                            </p>
                            
                            <!-- Dettagli Richiesta -->
                            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
                                <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 18px;">📋 Dettagli della Richiesta:</h3>
                                <table style="width: 100%;">
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666;">
                                            <strong>ID Richiesta:</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #333333; text-align: right;">
                                            #{{requestId}}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666;">
                                            <strong>Titolo:</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #333333; text-align: right;">
                                            {{requestTitle}}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666;">
                                            <strong>Categoria:</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #333333; text-align: right;">
                                            {{category}}
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="{{requestLink}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                                    Visualizza Richiesta
                                </a>
                            </div>
                            
                            <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 25px 0; border-radius: 4px;">
                                <p style="color: #2e7d32; margin: 0; font-weight: 600;">
                                    💡 Riceverai una notifica appena arriveranno i primi preventivi!
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="color: #999999; margin: 0 0 10px 0; font-size: 14px;">
                                Hai domande sulla tua richiesta?
                            </p>
                            <p style="margin: 0 0 15px 0;">
                                <a href="mailto:support@richiestaassistenza.it" style="color: #667eea; text-decoration: none; font-weight: 600;">support@richiestaassistenza.it</a>
                            </p>
                            <p style="color: #999999; margin: 0; font-size: 12px;">
                                © 2025 Richiesta Assistenza. Tutti i diritti riservati.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
    textContent: 'Ciao {{userName}}, la tua richiesta #{{requestId}} è stata creata. Visualizzala su: {{requestLink}}',
    variables: ['userName', 'requestId', 'requestTitle', 'category', 'requestLink'],
    channels: ['email'],
    priority: 'HIGH',
    isActive: true
  },
  {
    code: 'quote_received',
    name: 'Preventivo Ricevuto',
    description: 'Nuovo preventivo da professionista',
    category: 'quote',
    subject: 'Nuovo preventivo per la tua richiesta #{{requestId}}',
    htmlContent: `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preventivo Ricevuto</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600;">Nuovo Preventivo! 💰</h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Un professionista ha inviato un'offerta</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Ciao {{userName}},</h2>
                            
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Ottime notizie! Hai ricevuto un nuovo preventivo per la tua richiesta di assistenza.
                            </p>
                            
                            <!-- Preventivo Card -->
                            <div style="border: 2px solid #4facfe; border-radius: 8px; padding: 20px; margin: 25px 0; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);">
                                <div style="text-align: center; margin-bottom: 20px;">
                                    <div style="font-size: 14px; color: #666666; margin-bottom: 5px;">IMPORTO PREVENTIVO</div>
                                    <div style="font-size: 36px; color: #333333; font-weight: bold;">{{quoteAmount}}</div>
                                </div>
                                
                                <table style="width: 100%; margin-top: 20px;">
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666;">
                                            <strong>Professionista:</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #333333; text-align: right;">
                                            {{professionalName}}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666;">
                                            <strong>Per richiesta:</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #333333; text-align: right;">
                                            {{requestTitle}}
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- CTA Buttons -->
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="{{quoteLink}}" style="display: inline-block; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 50px; font-size: 16px; font-weight: 600; margin: 0 10px 10px 0; box-shadow: 0 4px 15px rgba(79, 172, 254, 0.4);">
                                    Visualizza Dettagli
                                </a>
                            </div>
                            
                            <!-- Info Box -->
                            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 4px;">
                                <p style="color: #856404; margin: 0; font-weight: 600;">
                                    💡 Suggerimento: Confronta almeno 3 preventivi prima di decidere!
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="color: #999999; margin: 0 0 10px 0; font-size: 14px;">
                                Hai domande sul preventivo?
                            </p>
                            <p style="margin: 0 0 15px 0;">
                                <a href="mailto:support@richiestaassistenza.it" style="color: #4facfe; text-decoration: none; font-weight: 600;">support@richiestaassistenza.it</a>
                            </p>
                            <p style="color: #999999; margin: 0; font-size: 12px;">
                                © 2025 Richiesta Assistenza. Tutti i diritti riservati.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
    textContent: 'Ciao {{userName}}, hai ricevuto un preventivo di {{quoteAmount}} da {{professionalName}}. Visualizzalo su: {{quoteLink}}',
    variables: ['userName', 'professionalName', 'quoteAmount', 'requestTitle', 'requestId', 'quoteLink'],
    channels: ['email'],
    priority: 'HIGH',
    isActive: true
  },
  {
    code: 'intervention_scheduled',
    name: 'Intervento Programmato',
    description: 'Conferma appuntamento intervento',
    category: 'intervention',
    subject: 'Appuntamento confermato per {{date}} alle {{time}}',
    htmlContent: `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Intervento Programmato</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600;">Appuntamento Confermato! 📅</h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">L'intervento è stato programmato</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Ciao {{userName}},</h2>
                            
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Il tuo appuntamento con il professionista è stato confermato. Ecco tutti i dettagli:
                            </p>
                            
                            <!-- Appointment Card -->
                            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 25px; margin: 25px 0; color: #ffffff;">
                                <div style="text-align: center;">
                                    <div style="font-size: 48px; margin-bottom: 10px;">📅</div>
                                    <div style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">{{date}}</div>
                                    <div style="font-size: 32px; font-weight: bold;">{{time}}</div>
                                </div>
                            </div>
                            
                            <!-- Details -->
                            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
                                <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 18px;">📍 Dettagli Intervento:</h3>
                                <table style="width: 100%;">
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666; vertical-align: top;">
                                            <strong>Professionista:</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #333333; text-align: right;">
                                            {{professionalName}}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666; vertical-align: top;">
                                            <strong>Servizio:</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #333333; text-align: right;">
                                            {{serviceType}}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666; vertical-align: top;">
                                            <strong>Indirizzo:</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #333333; text-align: right;">
                                            {{address}}
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Action Buttons -->
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="{{appointmentLink}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 50px; font-size: 16px; font-weight: 600; margin: 0 10px 10px 0; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                                    Visualizza Dettagli
                                </a>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="color: #999999; margin: 0 0 10px 0; font-size: 14px;">
                                Devi modificare o cancellare l'appuntamento?
                            </p>
                            <p style="margin: 0 0 15px 0;">
                                <a href="mailto:support@richiestaassistenza.it" style="color: #667eea; text-decoration: none; font-weight: 600;">support@richiestaassistenza.it</a>
                            </p>
                            <p style="color: #999999; margin: 0; font-size: 12px;">
                                © 2025 Richiesta Assistenza. Tutti i diritti riservati.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
    textContent: 'Ciao {{userName}}, appuntamento confermato per {{date}} alle {{time}}. Professionista: {{professionalName}}. Indirizzo: {{address}}',
    variables: ['userName', 'professionalName', 'date', 'time', 'serviceType', 'address', 'appointmentLink'],
    channels: ['email'],
    priority: 'URGENT',
    isActive: true
  },
  {
    code: 'payment_success',
    name: 'Pagamento Confermato',
    description: 'Conferma pagamento ricevuto',
    category: 'payment',
    subject: 'Pagamento confermato - Fattura #{{invoiceNumber}}',
    htmlContent: `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pagamento Confermato</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600;">Pagamento Confermato! ✅</h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">La transazione è andata a buon fine</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Grazie {{userName}}!</h2>
                            
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Il tuo pagamento è stato elaborato con successo. Ecco il riepilogo della transazione:
                            </p>
                            
                            <!-- Invoice Card -->
                            <div style="border: 2px solid #38ef7d; border-radius: 8px; padding: 20px; margin: 25px 0; background-color: #f0fdf4;">
                                <div style="text-align: center; margin-bottom: 20px;">
                                    <div style="font-size: 14px; color: #666666; margin-bottom: 5px;">IMPORTO PAGATO</div>
                                    <div style="font-size: 36px; color: #11998e; font-weight: bold;">{{amount}}</div>
                                    <div style="color: #4caf50; font-size: 14px; margin-top: 5px;">✓ Pagamento Completato</div>
                                </div>
                                
                                <hr style="border: none; border-top: 1px dashed #d0d0d0; margin: 20px 0;">
                                
                                <table style="width: 100%;">
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666;">
                                            <strong>Fattura N°:</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #333333; text-align: right;">
                                            #{{invoiceNumber}}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666;">
                                            <strong>Data:</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #333333; text-align: right;">
                                            {{paymentDate}}
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Download Button -->
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="{{downloadLink}}" style="display: inline-block; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(56, 239, 125, 0.4);">
                                    📥 Scarica Fattura PDF
                                </a>
                            </div>
                            
                            <!-- Thank You Message -->
                            <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 25px 0; border-radius: 4px;">
                                <p style="color: #2e7d32; margin: 0; font-weight: 600;">
                                    🙏 Grazie per aver scelto Richiesta Assistenza!
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="color: #999999; margin: 0 0 10px 0; font-size: 14px;">
                                Hai bisogno di assistenza con la fattura?
                            </p>
                            <p style="margin: 0 0 15px 0;">
                                <a href="mailto:billing@richiestaassistenza.it" style="color: #11998e; text-decoration: none; font-weight: 600;">billing@richiestaassistenza.it</a>
                            </p>
                            <p style="color: #999999; margin: 0; font-size: 12px;">
                                © 2025 Richiesta Assistenza. Tutti i diritti riservati.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
    textContent: 'Grazie {{userName}}! Pagamento di {{amount}} confermato. Fattura #{{invoiceNumber}}. Scarica: {{downloadLink}}',
    variables: ['userName', 'amount', 'invoiceNumber', 'paymentDate', 'downloadLink'],
    channels: ['email'],
    priority: 'HIGH',
    isActive: true
  }
];

async function createEmailTemplates() {
  console.log('🚀 Inizio creazione template email...\n');
  
  for (const template of emailTemplates) {
    try {
      // Verifica se esiste già
      const existing = await prisma.notificationTemplate.findUnique({
        where: { code: template.code }
      });
      
      if (existing) {
        // Aggiorna
        await prisma.notificationTemplate.update({
          where: { id: existing.id },
          data: {
            ...template,
            updatedAt: new Date()
          }
        });
        console.log(`✅ Template "${template.name}" aggiornato`);
      } else {
        // Crea nuovo
        await prisma.notificationTemplate.create({
          data: {
            id: require('crypto').randomBytes(16).toString('hex'),  // Genera ID random
            ...template,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        console.log(`✅ Template "${template.name}" creato`);
      }
    } catch (error) {
      console.error(`❌ Errore per template "${template.name}":`, error.message);
    }
  }
  
  console.log('\n✨ Operazione completata!');
  console.log('📧 Tutti i template email sono stati configurati nel sistema.');
  await prisma.$disconnect();
}

// Esegui
createEmailTemplates().catch(console.error);
