// Script per FORZARE l'aggiornamento di TUTTI i template con HTML professionale
// Esegui con: node backend/src/scripts/forceUpdateTemplates.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function forceUpdateAllTemplates() {
  console.log('🔄 AGGIORNAMENTO FORZATO DI TUTTI I TEMPLATE...\n');
  
  // Prima eliminiamo i vecchi template minimal
  const oldTemplates = ['welcome_email', 'password_reset', 'request_created', 'quote_received', 'intervention_scheduled', 'payment_success'];
  
  for (const code of oldTemplates) {
    try {
      await prisma.notificationTemplate.deleteMany({
        where: { code }
      });
      console.log(`🗑️ Eliminato vecchio template: ${code}`);
    } catch (error) {
      console.log(`⚠️ Template ${code} non trovato o già eliminato`);
    }
  }
  
  console.log('\n📝 Creazione nuovi template professionali...\n');
  
  // Ora creiamo i nuovi template con HTML professionale
  const templates = [
    {
      id: 'tpl_welcome_' + Date.now(),
      code: 'welcome_email',
      name: 'Email di Benvenuto - Professionale',
      description: 'Email HTML professionale per nuovi utenti',
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
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600;">Benvenuto {{userName}}! 🎉</h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Il tuo account è stato creato con successo</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Siamo felici di averti con noi!</h2>
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Grazie per aver scelto <strong>Richiesta Assistenza</strong>, la piattaforma leader per trovare professionisti qualificati.
                            </p>
                            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
                                <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 18px;">✨ Cosa puoi fare ora:</h3>
                                <ul style="color: #666666; margin: 0; padding-left: 20px; line-height: 1.8;">
                                    <li>Richiedi assistenza per qualsiasi necessità</li>
                                    <li>Ricevi preventivi gratuiti da professionisti verificati</li>
                                    <li>Confronta prezzi e recensioni</li>
                                    <li>Prenota interventi in pochi click</li>
                                </ul>
                            </div>
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="{{loginLink}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                                    Accedi al tuo Account
                                </a>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="color: #999999; margin: 0 0 10px 0; font-size: 14px;">Hai bisogno di aiuto? Contattaci:</p>
                            <p style="margin: 0 0 15px 0;">
                                <a href="mailto:support@richiestaassistenza.it" style="color: #667eea; text-decoration: none; font-weight: 600;">support@richiestaassistenza.it</a>
                            </p>
                            <p style="color: #999999; margin: 0; font-size: 12px;">© 2025 Richiesta Assistenza. Tutti i diritti riservati.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
      textContent: 'Benvenuto {{userName}}! Il tuo account è stato creato con successo.',
      variables: JSON.stringify(['userName', 'loginLink']),
      channels: JSON.stringify(['email']),
      priority: 'HIGH',
      isActive: true
    },
    {
      id: 'tpl_reset_' + Date.now() + 1,
      code: 'password_reset',
      name: 'Reset Password - Professionale',
      description: 'Email HTML professionale per reset password',
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
                    <tr>
                        <td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600;">Reset Password 🔐</h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Reimposta la tua password in modo sicuro</p>
                        </td>
                    </tr>
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
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="color: #999999; margin: 0; font-size: 12px;">© 2025 Richiesta Assistenza. Tutti i diritti riservati.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
      textContent: 'Ciao {{userName}}, clicca qui per reimpostare la password: {{resetLink}}',
      variables: JSON.stringify(['userName', 'resetLink', 'expiryTime']),
      channels: JSON.stringify(['email']),
      priority: 'URGENT',
      isActive: true
    },
    {
      id: 'tpl_request_' + Date.now() + 2,
      code: 'request_created',
      name: 'Richiesta Creata - Professionale',
      description: 'Email HTML professionale per conferma richiesta',
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
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600;">Richiesta Ricevuta! ✅</h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">La tua richiesta è stata presa in carico</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Ciao {{userName}},</h2>
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                La tua richiesta di assistenza è stata registrata con successo. I nostri professionisti qualificati la stanno già esaminando.
                            </p>
                            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
                                <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 18px;">📋 Dettagli della Richiesta:</h3>
                                <table style="width: 100%;">
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666;"><strong>ID Richiesta:</strong></td>
                                        <td style="padding: 8px 0; color: #333333; text-align: right;">#{{requestId}}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666;"><strong>Titolo:</strong></td>
                                        <td style="padding: 8px 0; color: #333333; text-align: right;">{{requestTitle}}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666;"><strong>Categoria:</strong></td>
                                        <td style="padding: 8px 0; color: #333333; text-align: right;">{{category}}</td>
                                    </tr>
                                </table>
                            </div>
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="{{requestLink}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 50px; font-size: 16px; font-weight: 600;">
                                    Visualizza Richiesta
                                </a>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="color: #999999; margin: 0; font-size: 12px;">© 2025 Richiesta Assistenza. Tutti i diritti riservati.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
      textContent: 'Ciao {{userName}}, la tua richiesta #{{requestId}} è stata creata.',
      variables: JSON.stringify(['userName', 'requestId', 'requestTitle', 'category', 'requestLink']),
      channels: JSON.stringify(['email']),
      priority: 'HIGH',
      isActive: true
    },
    {
      id: 'tpl_quote_' + Date.now() + 3,
      code: 'quote_received',
      name: 'Preventivo Ricevuto - Professionale',
      description: 'Email HTML professionale per nuovo preventivo',
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
                    <tr>
                        <td style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600;">Nuovo Preventivo! 💰</h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Un professionista ha inviato un'offerta</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Ciao {{userName}},</h2>
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Ottime notizie! Hai ricevuto un nuovo preventivo per la tua richiesta di assistenza.
                            </p>
                            <div style="border: 2px solid #4facfe; border-radius: 8px; padding: 20px; margin: 25px 0; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);">
                                <div style="text-align: center; margin-bottom: 20px;">
                                    <div style="font-size: 14px; color: #666666; margin-bottom: 5px;">IMPORTO PREVENTIVO</div>
                                    <div style="font-size: 36px; color: #333333; font-weight: bold;">{{quoteAmount}}</div>
                                </div>
                                <table style="width: 100%;">
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666;"><strong>Professionista:</strong></td>
                                        <td style="padding: 8px 0; color: #333333; text-align: right;">{{professionalName}}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666;"><strong>Per richiesta:</strong></td>
                                        <td style="padding: 8px 0; color: #333333; text-align: right;">{{requestTitle}}</td>
                                    </tr>
                                </table>
                            </div>
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="{{quoteLink}}" style="display: inline-block; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 50px; font-size: 16px; font-weight: 600;">
                                    Visualizza Dettagli
                                </a>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="color: #999999; margin: 0; font-size: 12px;">© 2025 Richiesta Assistenza. Tutti i diritti riservati.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
      textContent: 'Ciao {{userName}}, hai ricevuto un preventivo di {{quoteAmount}} da {{professionalName}}',
      variables: JSON.stringify(['userName', 'professionalName', 'quoteAmount', 'requestTitle', 'requestId', 'quoteLink']),
      channels: JSON.stringify(['email']),
      priority: 'HIGH',
      isActive: true
    },
    {
      id: 'tpl_interv_' + Date.now() + 4,
      code: 'intervention_scheduled',
      name: 'Intervento Programmato - Professionale',
      description: 'Email HTML professionale per appuntamento',
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
                    <tr>
                        <td style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600;">Appuntamento Confermato! 📅</h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">L'intervento è stato programmato</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Ciao {{userName}},</h2>
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Il tuo appuntamento con il professionista è stato confermato.
                            </p>
                            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 25px; margin: 25px 0; color: #ffffff;">
                                <div style="text-align: center;">
                                    <div style="font-size: 48px; margin-bottom: 10px;">📅</div>
                                    <div style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">{{date}}</div>
                                    <div style="font-size: 32px; font-weight: bold;">{{time}}</div>
                                </div>
                            </div>
                            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
                                <p><strong>Professionista:</strong> {{professionalName}}</p>
                                <p><strong>Servizio:</strong> {{serviceType}}</p>
                                <p><strong>Indirizzo:</strong> {{address}}</p>
                            </div>
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="{{appointmentLink}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 50px; font-size: 16px; font-weight: 600;">
                                    Visualizza Dettagli
                                </a>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="color: #999999; margin: 0; font-size: 12px;">© 2025 Richiesta Assistenza. Tutti i diritti riservati.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
      textContent: 'Ciao {{userName}}, appuntamento confermato per {{date}} alle {{time}}',
      variables: JSON.stringify(['userName', 'professionalName', 'date', 'time', 'serviceType', 'address', 'appointmentLink']),
      channels: JSON.stringify(['email']),
      priority: 'URGENT',
      isActive: true
    },
    {
      id: 'tpl_payment_' + Date.now() + 5,
      code: 'payment_success',
      name: 'Pagamento Confermato - Professionale',
      description: 'Email HTML professionale per conferma pagamento',
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
                    <tr>
                        <td style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600;">Pagamento Confermato! ✅</h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">La transazione è andata a buon fine</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Grazie {{userName}}!</h2>
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Il tuo pagamento è stato elaborato con successo.
                            </p>
                            <div style="border: 2px solid #38ef7d; border-radius: 8px; padding: 20px; margin: 25px 0; background-color: #f0fdf4;">
                                <div style="text-align: center; margin-bottom: 20px;">
                                    <div style="font-size: 14px; color: #666666; margin-bottom: 5px;">IMPORTO PAGATO</div>
                                    <div style="font-size: 36px; color: #11998e; font-weight: bold;">{{amount}}</div>
                                    <div style="color: #4caf50; font-size: 14px; margin-top: 5px;">✓ Pagamento Completato</div>
                                </div>
                                <table style="width: 100%;">
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666;"><strong>Fattura N°:</strong></td>
                                        <td style="padding: 8px 0; color: #333333; text-align: right;">#{{invoiceNumber}}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666;"><strong>Data:</strong></td>
                                        <td style="padding: 8px 0; color: #333333; text-align: right;">{{paymentDate}}</td>
                                    </tr>
                                </table>
                            </div>
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="{{downloadLink}}" style="display: inline-block; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 50px; font-size: 16px; font-weight: 600;">
                                    📥 Scarica Fattura PDF
                                </a>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="color: #999999; margin: 0; font-size: 12px;">© 2025 Richiesta Assistenza. Tutti i diritti riservati.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
      textContent: 'Grazie {{userName}}! Pagamento di {{amount}} confermato.',
      variables: JSON.stringify(['userName', 'amount', 'invoiceNumber', 'paymentDate', 'downloadLink']),
      channels: JSON.stringify(['email']),
      priority: 'HIGH',
      isActive: true
    }
  ];
  
  for (const template of templates) {
    try {
      await prisma.notificationTemplate.create({
        data: {
          ...template,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log(`✅ Creato template professionale: ${template.name}`);
    } catch (error) {
      console.error(`❌ Errore creando ${template.name}:`, error.message);
    }
  }
  
  console.log('\n🎉 COMPLETATO! Tutti i template sono stati aggiornati con HTML professionale!');
  console.log('📧 Ricarica la pagina del Centro Notifiche per vedere i nuovi template.');
  
  await prisma.$disconnect();
}

// Esegui
forceUpdateAllTemplates().catch(console.error);
