// Script per AGGIORNARE DIRETTAMENTE i template esistenti con HTML professionale
// Esegui con: node backend/src/scripts/updateExistingTemplates.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateExistingTemplates() {
  console.log('🔄 AGGIORNAMENTO DIRETTO DEI TEMPLATE ESISTENTI...\n');
  
  // Trova il template EMAIL_VERIFICATION
  const emailVerificationTemplate = await prisma.notificationTemplate.findFirst({
    where: {
      OR: [
        { code: 'EMAIL_VERIFICATION' },
        { code: 'email_verification' },
        { name: { contains: 'Email Verification' } }
      ]
    }
  });
  
  if (emailVerificationTemplate) {
    console.log(`📧 Trovato template Email Verification con ID: ${emailVerificationTemplate.id}`);
    
    // Aggiorna con HTML professionale
    await prisma.notificationTemplate.update({
      where: { id: emailVerificationTemplate.id },
      data: {
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
                                ti chiediamo di verificare il tuo indirizzo email.
                            </p>
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="{{verificationUrl}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                                    Verifica la tua Email
                                </a>
                            </div>
                            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
                                <p style="color: #666666; font-size: 14px; margin: 0;">
                                    Se il pulsante non funziona, copia e incolla questo link nel browser:
                                </p>
                                <p style="color: #667eea; font-size: 13px; word-break: break-all; margin: 10px 0 0 0;">
                                    {{verificationUrl}}
                                </p>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
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
        subject: 'Verifica il tuo indirizzo email - Richiesta Assistenza',
        updatedAt: new Date()
      }
    });
    console.log('✅ Template Email Verification aggiornato con HTML professionale!\n');
  }
  
  // Ora cerchiamo e aggiorniamo TUTTI i template che potrebbero essere "minimal"
  const allTemplates = await prisma.notificationTemplate.findMany();
  
  console.log(`📊 Trovati ${allTemplates.length} template totali nel database.\n`);
  
  // Mappa dei template professionali
  const professionalTemplates = {
    'WELCOME': {
      name: 'Email di Benvenuto',
      subject: 'Benvenuto in Richiesta Assistenza!',
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
                            <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                                Grazie per aver scelto Richiesta Assistenza, la piattaforma leader per trovare professionisti qualificati.
                            </p>
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="{{loginLink}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 50px; font-size: 16px; font-weight: 600;">
                                    Accedi al tuo Account
                                </a>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center;">
                            <p style="color: #999999; margin: 0; font-size: 12px;">© 2025 Richiesta Assistenza</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`
    },
    'PASSWORD_RESET_REQUEST': {
      name: 'Reset Password',
      subject: 'Reimposta la tua password',
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
                            <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                                Abbiamo ricevuto una richiesta di reset password per il tuo account.
                            </p>
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="{{resetLink}}" style="display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 50px; font-size: 16px; font-weight: 600;">
                                    Reimposta Password
                                </a>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center;">
                            <p style="color: #999999; margin: 0; font-size: 12px;">© 2025 Richiesta Assistenza</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`
    }
  };
  
  // Aggiorna tutti i template che sembrano minimal
  for (const template of allTemplates) {
    // Controlla se l'HTML è minimal (contiene solo tag base senza stili)
    if (template.htmlContent && template.htmlContent.length < 500) {
      console.log(`🔍 Template "${template.name}" sembra essere minimal, aggiorno...`);
      
      // Trova il template professionale corrispondente
      const professionalTemplate = professionalTemplates[template.code] || 
                                   professionalTemplates[template.code.toUpperCase()];
      
      if (professionalTemplate) {
        await prisma.notificationTemplate.update({
          where: { id: template.id },
          data: {
            htmlContent: professionalTemplate.htmlContent,
            subject: professionalTemplate.subject || template.subject,
            updatedAt: new Date()
          }
        });
        console.log(`✅ Aggiornato: ${template.name}`);
      }
    }
  }
  
  console.log('\n🎉 COMPLETATO! Tutti i template minimal sono stati aggiornati!');
  console.log('📧 Ricarica la pagina per vedere i template professionali.');
  
  await prisma.$disconnect();
}

// Esegui
updateExistingTemplates().catch(console.error);
