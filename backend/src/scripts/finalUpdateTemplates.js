// Script FINALE per aggiornare i template email con HTML professionale
// Esegui con: node backend/src/scripts/finalUpdateTemplates.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function finalUpdateTemplates() {
  console.log('🚀 AGGIORNAMENTO FINALE DEI TEMPLATE EMAIL...\n');
  
  // Template HTML professionali
  const professionalTemplates = {
    // Email Verification - Template che hai mostrato nell'immagine
    'EMAIL_VERIFICATION': {
      htmlContent: `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verifica Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600;">Verifica la tua Email ✉️</h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Conferma il tuo indirizzo email per attivare l'account</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Benvenuto {{fullName}}!</h2>
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Il tuo account è stato creato con successo. Per completare la registrazione e attivare tutte le funzionalità, 
                                ti chiediamo di verificare il tuo indirizzo email cliccando sul pulsante sottostante.
                            </p>
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="{{verificationUrl}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                                    ✅ Verifica la tua Email
                                </a>
                            </div>
                            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
                                <p style="color: #999999; font-size: 14px; margin: 0 0 10px 0;">
                                    Se il pulsante non funziona, copia e incolla questo link nel browser:
                                </p>
                                <p style="color: #667eea; font-size: 13px; word-break: break-all; margin: 0;">
                                    {{verificationUrl}}
                                </p>
                            </div>
                            <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 25px 0; border-radius: 4px;">
                                <p style="color: #2e7d32; margin: 0; font-weight: 600;">
                                    💡 Dopo la verifica potrai accedere a tutte le funzionalità della piattaforma!
                                </p>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="color: #999999; margin: 0 0 10px 0; font-size: 14px;">Hai bisogno di aiuto?</p>
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
      textContent: 'Benvenuto {{fullName}}! Verifica la tua email: {{verificationUrl}}'
    },
    
    // Password Reset
    'PASSWORD_RESET_REQUEST': {
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
                                    ⚠️ Attenzione: Questo link scadrà tra 1 ora per motivi di sicurezza.
                                </p>
                            </div>
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="{{resetUrl}}" style="display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);">
                                    Reimposta Password
                                </a>
                            </div>
                            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
                                <p style="color: #999999; font-size: 14px; margin: 0 0 10px 0;">
                                    Se il pulsante non funziona, copia e incolla questo link:
                                </p>
                                <p style="color: #f5576c; font-size: 13px; word-break: break-all; margin: 0;">
                                    {{resetUrl}}
                                </p>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="color: #999999; margin: 0 0 10px 0; font-size: 14px;">Non hai richiesto il reset?</p>
                            <p style="margin: 0 0 15px 0;">
                                <a href="mailto:security@richiestaassistenza.it" style="color: #f5576c; text-decoration: none; font-weight: 600;">security@richiestaassistenza.it</a>
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
      textContent: 'Ciao {{userName}}, clicca qui per reimpostare la password: {{resetUrl}}'
    },
    
    // Welcome Email
    'WELCOME': {
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
                                <a href="{{loginUrl}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                                    Accedi al tuo Account
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
      textContent: 'Benvenuto {{userName}}! Il tuo account è stato creato con successo. Accedi su {{loginUrl}}'
    }
  };
  
  // Aggiorna TUTTI i template trovati con HTML professionale
  const allTemplates = await prisma.notificationTemplate.findMany();
  
  console.log(`📊 Trovati ${allTemplates.length} template nel database.\n`);
  
  for (const template of allTemplates) {
    // Trova il template professionale corrispondente
    const professionalTemplate = professionalTemplates[template.code] || 
                                 professionalTemplates[template.code.toUpperCase()];
    
    if (professionalTemplate) {
      console.log(`🔄 Aggiornamento template: ${template.name} (${template.code})`);
      
      await prisma.notificationTemplate.update({
        where: { id: template.id },
        data: {
          htmlContent: professionalTemplate.htmlContent,
          textContent: professionalTemplate.textContent,
          updatedAt: new Date()
        }
      });
      
      console.log(`✅ Template "${template.name}" aggiornato con HTML professionale!\n`);
    } else {
      console.log(`⚠️ Template "${template.name}" (${template.code}) non ha un template professionale predefinito.\n`);
    }
  }
  
  // Aggiorna anche per ID specifici se necessario
  const specificIds = [
    'ed4f0cf8-301e-4278-8f34-c7f27fd44757',  // Email Verification dalla tua screenshot
    '682138bf-f821-4809-b1a5-91371256fe11'   // L'altro ID che hai mostrato
  ];
  
  for (const id of specificIds) {
    const template = await prisma.notificationTemplate.findUnique({
      where: { id }
    });
    
    if (template) {
      console.log(`🎯 Aggiornamento diretto per ID: ${id}`);
      
      // Determina quale template professionale usare basandosi sul codice
      let htmlToUse = professionalTemplates['EMAIL_VERIFICATION']?.htmlContent;
      let textToUse = professionalTemplates['EMAIL_VERIFICATION']?.textContent;
      
      if (template.code.includes('PASSWORD')) {
        htmlToUse = professionalTemplates['PASSWORD_RESET_REQUEST']?.htmlContent;
        textToUse = professionalTemplates['PASSWORD_RESET_REQUEST']?.textContent;
      } else if (template.code.includes('WELCOME')) {
        htmlToUse = professionalTemplates['WELCOME']?.htmlContent;
        textToUse = professionalTemplates['WELCOME']?.textContent;
      }
      
      if (htmlToUse) {
        await prisma.notificationTemplate.update({
          where: { id },
          data: {
            htmlContent: htmlToUse,
            textContent: textToUse || template.textContent,
            updatedAt: new Date()
          }
        });
        console.log(`✅ Template con ID ${id} aggiornato!\n`);
      }
    }
  }
  
  console.log('🎉 COMPLETATO! Tutti i template sono stati aggiornati con HTML professionale!');
  console.log('📧 Ricarica la pagina e riapri il modal per vedere i template professionali.');
  
  await prisma.$disconnect();
}

// Esegui
finalUpdateTemplates().catch(console.error);
