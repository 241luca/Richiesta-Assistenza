/**
 * Script per creare template di notifiche di default
 * Da eseguire una volta per inizializzare il sistema
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const DEFAULT_TEMPLATES = [
  // ==================== AUTENTICAZIONE ====================
  {
    code: 'welcome_user',
    name: 'Benvenuto Nuovo Utente',
    description: 'Email di benvenuto per nuovi utenti registrati',
    category: 'auth',
    subject: 'Benvenuto in {{appName}}!',
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Benvenuto {{firstName}}! 🎉</h1>
    </div>
    <div class="content">
      <p>Ciao {{firstName}},</p>
      <p>Siamo felici di averti con noi! Il tuo account è stato creato con successo.</p>
      <p><strong>I tuoi dati di accesso:</strong></p>
      <ul>
        <li>Email: {{email}}</li>
        <li>Username: {{username}}</li>
      </ul>
      <center>
        <a href="{{loginUrl}}" class="button">Accedi al tuo Account</a>
      </center>
    </div>
  </div>
</body>
</html>
    `,
    textContent: `Benvenuto {{firstName}}! Il tuo account è stato creato con successo.`,
    variables: [
      { name: 'firstName', description: 'Nome utente', required: true },
      { name: 'email', description: 'Email utente', required: true },
      { name: 'username', description: 'Username utente', required: true },
      { name: 'loginUrl', description: 'URL di login', required: true },
      { name: 'appName', description: 'Nome applicazione', required: true }
    ],
    channels: ['email'],
    priority: 'NORMAL',
    isActive: true,
    isSystem: true
  },

  // ==================== PREVENTIVI ====================
  {
    code: 'quote_received',
    name: 'Preventivo Ricevuto - Cliente',
    description: 'Notifica nuovo preventivo ricevuto',
    category: 'quote',
    subject: '💰 Nuovo preventivo per la tua richiesta #{{requestId}}',
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #F59E0B; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .quote-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .price { font-size: 32px; color: #10B981; font-weight: bold; }
    .button { display: inline-block; padding: 12px 24px; background: #F59E0B; color: white; text-decoration: none; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Hai ricevuto un nuovo preventivo! 💰</h2>
    </div>
    <div class="content">
      <p>Ciao {{clientName}},</p>
      <p>Il professionista <strong>{{professionalName}}</strong> ha inviato un preventivo per la tua richiesta.</p>
      
      <div class="quote-box">
        <h3>Dettagli Preventivo:</h3>
        <p><strong>Richiesta:</strong> {{requestTitle}}</p>
        <p><strong>Professionista:</strong> {{professionalName}}</p>
        <div class="price">€ {{amount}}</div>
        <p><strong>Validità:</strong> fino al {{validUntil}}</p>
        <p><strong>Note:</strong> {{notes}}</p>
      </div>
      
      <p>Hai ora <strong>{{totalQuotes}} preventivi</strong> per questa richiesta.</p>
      
      <center>
        <a href="{{quoteUrl}}" class="button">Visualizza e Confronta</a>
      </center>
    </div>
  </div>
</body>
</html>
    `,
    textContent: `Nuovo preventivo da {{professionalName}}: €{{amount}} per {{requestTitle}}`,
    smsContent: `Nuovo preventivo ricevuto: €{{amount}} da {{professionalName}}. Visualizza su {{shortUrl}}`,
    variables: [
      { name: 'clientName', description: 'Nome cliente', required: true },
      { name: 'professionalName', description: 'Nome professionista', required: true },
      { name: 'requestId', description: 'ID richiesta', required: true },
      { name: 'requestTitle', description: 'Titolo richiesta', required: true },
      { name: 'amount', description: 'Importo preventivo', required: true },
      { name: 'validUntil', description: 'Validità preventivo', required: true },
      { name: 'notes', description: 'Note preventivo', required: false },
      { name: 'totalQuotes', description: 'Totale preventivi ricevuti', required: true },
      { name: 'quoteUrl', description: 'URL preventivo', required: true }
    ],
    channels: ['email', 'websocket', 'sms'],
    priority: 'HIGH',
    isActive: true,
    isSystem: true
  },

  // ==================== PAGAMENTI ====================
  {
    code: 'payment_success',
    name: 'Pagamento Completato',
    description: 'Conferma pagamento completato con successo',
    category: 'payment',
    subject: '✅ Pagamento confermato - Ricevuta #{{paymentId}}',
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10B981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .receipt { background: white; padding: 20px; margin: 20px 0; border: 2px dashed #10B981; border-radius: 8px; }
    .amount { font-size: 28px; color: #10B981; font-weight: bold; }
    .button { display: inline-block; padding: 12px 24px; background: #10B981; color: white; text-decoration: none; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Pagamento Completato ✅</h2>
    </div>
    <div class="content">
      <p>Gentile {{userName}},</p>
      <p>Il tuo pagamento è stato elaborato con successo.</p>
      
      <div class="receipt">
        <h3>RICEVUTA DI PAGAMENTO</h3>
        <p><strong>ID Transazione:</strong> {{paymentId}}</p>
        <p><strong>Data:</strong> {{paymentDate}}</p>
        <p><strong>Metodo:</strong> {{paymentMethod}}</p>
        <hr>
        <p><strong>Descrizione:</strong> {{description}}</p>
        <div class="amount">€ {{amount}}</div>
      </div>
      
      <p>Una copia della ricevuta è stata salvata nel tuo account.</p>
      
      <center>
        <a href="{{receiptUrl}}" class="button">Scarica Ricevuta PDF</a>
      </center>
    </div>
  </div>
</body>
</html>
    `,
    textContent: `Pagamento di €{{amount}} completato con successo. ID: {{paymentId}}`,
    variables: [
      { name: 'userName', description: 'Nome utente', required: true },
      { name: 'paymentId', description: 'ID pagamento', required: true },
      { name: 'paymentDate', description: 'Data pagamento', required: true },
      { name: 'paymentMethod', description: 'Metodo pagamento', required: true },
      { name: 'description', description: 'Descrizione pagamento', required: true },
      { name: 'amount', description: 'Importo', required: true },
      { name: 'receiptUrl', description: 'URL ricevuta', required: true }
    ],
    channels: ['email', 'websocket'],
    priority: 'HIGH',
    isActive: true,
    isSystem: true
  }
];

const DEFAULT_EVENTS = [
  {
    code: 'on_user_register',
    name: 'Alla Registrazione Utente',
    description: 'Invia email di benvenuto quando un nuovo utente si registra',
    eventType: 'user_registered',
    entityType: 'user',
    templateCode: 'welcome_user',
    delay: 0,
    isActive: true
  },
  {
    code: 'on_request_created',
    name: 'Alla Creazione Richiesta',
    description: 'Notifica il cliente quando crea una richiesta',
    eventType: 'request_created',
    entityType: 'request',
    templateCode: 'request_created_client',
    delay: 0,
    isActive: true
  },
  {
    code: 'on_quote_received',
    name: 'Alla Ricezione Preventivo',
    description: 'Notifica il cliente quando riceve un preventivo',
    eventType: 'quote_received',
    entityType: 'quote',
    templateCode: 'quote_received',
    delay: 0,
    isActive: true
  },
  {
    code: 'on_payment_success',
    name: 'Al Pagamento Completato',
    description: 'Invia ricevuta quando un pagamento è completato',
    eventType: 'payment_completed',
    entityType: 'payment',
    templateCode: 'payment_success',
    delay: 0,
    isActive: true
  }
];

async function seedTemplates() {
  console.log('🌱 Seeding notification templates...');

  try {
    // Crea i template
    for (const template of DEFAULT_TEMPLATES) {
      const existing = await prisma.notificationTemplate.findUnique({
        where: { code: template.code }
      });

      if (!existing) {
        await prisma.notificationTemplate.create({
          data: {
            id: uuidv4(),
            ...template
          }
        });
        console.log(`✅ Created template: ${template.code}`);
      } else {
        console.log(`⏭️  Template already exists: ${template.code}`);
      }
    }

    // Crea gli eventi
    for (const event of DEFAULT_EVENTS) {
      const existing = await prisma.notificationEvent.findUnique({
        where: { code: event.code }
      });

      if (!existing) {
        const template = await prisma.notificationTemplate.findUnique({
          where: { code: event.templateCode }
        });

        if (template) {
          await prisma.notificationEvent.create({
            data: {
              id: uuidv4(),
              code: event.code,
              name: event.name,
              description: event.description,
              eventType: event.eventType,
              entityType: event.entityType,
              templateId: template.id,
              delay: event.delay,
              isActive: event.isActive,
              retryPolicy: { maxRetries: 3, retryDelay: 300 }
            }
          });
          console.log(`✅ Created event: ${event.code}`);
        }
      } else {
        console.log(`⏭️  Event already exists: ${event.code}`);
      }
    }

    console.log('✨ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding templates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui il seed
seedTemplates();
