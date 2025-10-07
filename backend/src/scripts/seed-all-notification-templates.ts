/**
 * Script COMPLETO per creare TUTTI i template di notifiche
 * Include tutti i template richiesti per il sistema
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const ALL_TEMPLATES = [
  // ==================== AUTENTICAZIONE E UTENTI ====================
  {
    code: 'welcome_user',
    name: 'Benvenuto Nuovo Utente',
    description: 'Email di benvenuto per nuovi utenti registrati',
    category: 'auth',
    subject: 'Benvenuto in {{appName}}! 🎉',
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

  {
    code: 'user_deleted',
    name: 'Cancellazione Utente',
    description: 'Conferma cancellazione account utente',
    category: 'auth',
    subject: 'Account cancellato - {{appName}}',
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #DC2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Account Cancellato</h2>
    </div>
    <div class="content">
      <p>Ciao {{firstName}},</p>
      <p>Il tuo account è stato cancellato con successo dal sistema.</p>
      <p>Tutti i tuoi dati personali sono stati rimossi in conformità con il GDPR.</p>
      <p>Se hai bisogno di assistenza, contattaci a: {{supportEmail}}</p>
      <p>Ci dispiace vederti andare via. 😢</p>
    </div>
  </div>
</body>
</html>
    `,
    textContent: `Il tuo account è stato cancellato. Tutti i dati sono stati rimossi.`,
    variables: [
      { name: 'firstName', description: 'Nome utente', required: true },
      { name: 'supportEmail', description: 'Email supporto', required: true },
      { name: 'appName', description: 'Nome applicazione', required: true }
    ],
    channels: ['email'],
    priority: 'HIGH',
    isActive: true,
    isSystem: true
  },

  // ==================== RICHIESTE ====================
  {
    code: 'request_created_client',
    name: 'Nuova Richiesta - Cliente',
    description: 'Conferma creazione richiesta per il cliente',
    category: 'request',
    subject: '✅ Richiesta #{{requestId}} creata con successo',
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10B981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .request-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Richiesta Creata con Successo! ✅</h2>
    </div>
    <div class="content">
      <p>Ciao {{clientName}},</p>
      <p>La tua richiesta di assistenza è stata registrata con successo.</p>
      
      <div class="request-box">
        <h3>Dettagli Richiesta:</h3>
        <p><strong>ID:</strong> #{{requestId}}</p>
        <p><strong>Titolo:</strong> {{requestTitle}}</p>
        <p><strong>Categoria:</strong> {{category}}</p>
        <p><strong>Priorità:</strong> {{priority}}</p>
        <p><strong>Data richiesta:</strong> {{requestDate}}</p>
      </div>
      
      <p>Riceverai presto i preventivi dai nostri professionisti qualificati.</p>
      <center>
        <a href="{{requestUrl}}" class="button" style="display: inline-block; padding: 12px 24px; background: #10B981; color: white; text-decoration: none; border-radius: 5px;">
          Visualizza Richiesta
        </a>
      </center>
    </div>
  </div>
</body>
</html>
    `,
    textContent: `La tua richiesta #{{requestId}} è stata creata. Titolo: {{requestTitle}}`,
    smsContent: `Richiesta #{{requestId}} creata con successo. Presto riceverai i preventivi.`,
    variables: [
      { name: 'clientName', description: 'Nome cliente', required: true },
      { name: 'requestId', description: 'ID richiesta', required: true },
      { name: 'requestTitle', description: 'Titolo richiesta', required: true },
      { name: 'category', description: 'Categoria', required: true },
      { name: 'priority', description: 'Priorità', required: true },
      { name: 'requestDate', description: 'Data richiesta', required: true },
      { name: 'requestUrl', description: 'URL richiesta', required: true }
    ],
    channels: ['email', 'websocket', 'sms'],
    priority: 'HIGH',
    isActive: true,
    isSystem: true
  },

  {
    code: 'request_modified_client',
    name: 'Modifica Richiesta - Cliente',
    description: 'Notifica modifica richiesta per il cliente',
    category: 'request',
    subject: '📝 Richiesta #{{requestId}} modificata',
    htmlContent: `
<!DOCTYPE html>
<html>
<body>
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>Richiesta Modificata</h2>
    <p>Ciao {{clientName}},</p>
    <p>La tua richiesta #{{requestId}} è stata modificata con successo.</p>
    <p><strong>Modifiche apportate:</strong></p>
    <p>{{changes}}</p>
    <p><a href="{{requestUrl}}">Visualizza richiesta aggiornata</a></p>
  </div>
</body>
</html>
    `,
    textContent: `Richiesta #{{requestId}} modificata. {{changes}}`,
    variables: [
      { name: 'clientName', description: 'Nome cliente', required: true },
      { name: 'requestId', description: 'ID richiesta', required: true },
      { name: 'changes', description: 'Descrizione modifiche', required: true },
      { name: 'requestUrl', description: 'URL richiesta', required: true }
    ],
    channels: ['email', 'websocket'],
    priority: 'NORMAL',
    isActive: true,
    isSystem: true
  },

  {
    code: 'request_modified_professional',
    name: 'Modifica Richiesta - Professionista',
    description: 'Notifica modifica richiesta per il professionista',
    category: 'request',
    subject: '📝 Richiesta #{{requestId}} modificata dal cliente',
    htmlContent: `
<!DOCTYPE html>
<html>
<body>
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>Richiesta Modificata dal Cliente</h2>
    <p>Ciao {{professionalName}},</p>
    <p>Il cliente ha modificato la richiesta #{{requestId}} a cui sei assegnato.</p>
    <p><strong>Modifiche:</strong> {{changes}}</p>
    <p>Potrebbe essere necessario aggiornare il tuo preventivo.</p>
    <p><a href="{{requestUrl}}">Visualizza richiesta</a></p>
  </div>
</body>
</html>
    `,
    textContent: `Il cliente ha modificato la richiesta #{{requestId}}. {{changes}}`,
    variables: [
      { name: 'professionalName', description: 'Nome professionista', required: true },
      { name: 'requestId', description: 'ID richiesta', required: true },
      { name: 'changes', description: 'Modifiche', required: true },
      { name: 'requestUrl', description: 'URL richiesta', required: true }
    ],
    channels: ['email', 'websocket'],
    priority: 'HIGH',
    isActive: true,
    isSystem: true
  },

  {
    code: 'request_closed_client',
    name: 'Chiusura Richiesta - Cliente',
    description: 'Conferma chiusura richiesta per il cliente',
    category: 'request',
    subject: '✅ Richiesta #{{requestId}} completata',
    htmlContent: `
<!DOCTYPE html>
<html>
<body>
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #10B981;">Richiesta Completata! ✅</h2>
    <p>Ciao {{clientName}},</p>
    <p>La tua richiesta #{{requestId}} è stata completata con successo.</p>
    <p><strong>Professionista:</strong> {{professionalName}}</p>
    <p><strong>Data completamento:</strong> {{completionDate}}</p>
    <p>Ti invitiamo a lasciare una recensione per aiutare altri clienti.</p>
    <p><a href="{{reviewUrl}}" style="display: inline-block; padding: 12px 24px; background: #F59E0B; color: white; text-decoration: none; border-radius: 5px;">Lascia una Recensione</a></p>
  </div>
</body>
</html>
    `,
    textContent: `Richiesta #{{requestId}} completata. Lascia una recensione!`,
    variables: [
      { name: 'clientName', description: 'Nome cliente', required: true },
      { name: 'requestId', description: 'ID richiesta', required: true },
      { name: 'professionalName', description: 'Nome professionista', required: true },
      { name: 'completionDate', description: 'Data completamento', required: true },
      { name: 'reviewUrl', description: 'URL recensione', required: true }
    ],
    channels: ['email', 'websocket'],
    priority: 'NORMAL',
    isActive: true,
    isSystem: true
  },

  {
    code: 'request_closed_professional',
    name: 'Chiusura Richiesta - Professionista',
    description: 'Conferma chiusura richiesta per il professionista',
    category: 'request',
    subject: '✅ Hai completato la richiesta #{{requestId}}',
    htmlContent: `
<!DOCTYPE html>
<html>
<body>
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #10B981;">Ottimo Lavoro! 💪</h2>
    <p>Ciao {{professionalName}},</p>
    <p>Hai completato con successo la richiesta #{{requestId}}.</p>
    <p><strong>Cliente:</strong> {{clientName}}</p>
    <p><strong>Importo totale:</strong> €{{amount}}</p>
    <p>Il pagamento sarà elaborato secondo i termini concordati.</p>
  </div>
</body>
</html>
    `,
    textContent: `Richiesta #{{requestId}} completata. Importo: €{{amount}}`,
    variables: [
      { name: 'professionalName', description: 'Nome professionista', required: true },
      { name: 'requestId', description: 'ID richiesta', required: true },
      { name: 'clientName', description: 'Nome cliente', required: true },
      { name: 'amount', description: 'Importo totale', required: true }
    ],
    channels: ['email', 'websocket'],
    priority: 'NORMAL',
    isActive: true,
    isSystem: true
  },

  {
    code: 'request_assigned_client',
    name: 'Assegnazione Professionista - Cliente',
    description: 'Notifica assegnazione professionista al cliente',
    category: 'request',
    subject: '👷 Professionista assegnato alla tua richiesta #{{requestId}}',
    htmlContent: `
<!DOCTYPE html>
<html>
<body>
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>Professionista Assegnato! 👷</h2>
    <p>Ciao {{clientName}},</p>
    <p>Abbiamo assegnato un professionista qualificato alla tua richiesta.</p>
    <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Professionista:</strong> {{professionalName}}</p>
      <p><strong>Specializzazione:</strong> {{specialization}}</p>
      <p><strong>Valutazione:</strong> ⭐ {{rating}}/5</p>
      <p><strong>Esperienza:</strong> {{experience}} anni</p>
    </div>
    <p>Il professionista ti contatterà presto per concordare i dettagli.</p>
  </div>
</body>
</html>
    `,
    textContent: `{{professionalName}} è stato assegnato alla tua richiesta #{{requestId}}`,
    variables: [
      { name: 'clientName', description: 'Nome cliente', required: true },
      { name: 'requestId', description: 'ID richiesta', required: true },
      { name: 'professionalName', description: 'Nome professionista', required: true },
      { name: 'specialization', description: 'Specializzazione', required: true },
      { name: 'rating', description: 'Valutazione', required: true },
      { name: 'experience', description: 'Anni esperienza', required: true }
    ],
    channels: ['email', 'websocket', 'sms'],
    priority: 'HIGH',
    isActive: true,
    isSystem: true
  },

  {
    code: 'request_assigned_professional',
    name: 'Nuova Richiesta Assegnata - Professionista',
    description: 'Notifica nuova richiesta assegnata al professionista',
    category: 'request',
    subject: '🆕 Nuova richiesta assegnata #{{requestId}}',
    htmlContent: `
<!DOCTYPE html>
<html>
<body>
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #3B82F6;">Nuova Richiesta Assegnata! 🆕</h2>
    <p>Ciao {{professionalName}},</p>
    <p>Ti è stata assegnata una nuova richiesta di assistenza.</p>
    <div style="background: #EBF8FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3>Dettagli Richiesta:</h3>
      <p><strong>ID:</strong> #{{requestId}}</p>
      <p><strong>Cliente:</strong> {{clientName}}</p>
      <p><strong>Titolo:</strong> {{requestTitle}}</p>
      <p><strong>Categoria:</strong> {{category}}</p>
      <p><strong>Priorità:</strong> {{priority}}</p>
      <p><strong>Indirizzo:</strong> {{address}}</p>
    </div>
    <p><a href="{{requestUrl}}" style="display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 5px;">Visualizza Richiesta</a></p>
  </div>
</body>
</html>
    `,
    textContent: `Nuova richiesta #{{requestId}} assegnata. Cliente: {{clientName}}`,
    smsContent: `Nuova richiesta #{{requestId}} da {{clientName}}. Controlla i dettagli.`,
    variables: [
      { name: 'professionalName', description: 'Nome professionista', required: true },
      { name: 'requestId', description: 'ID richiesta', required: true },
      { name: 'clientName', description: 'Nome cliente', required: true },
      { name: 'requestTitle', description: 'Titolo richiesta', required: true },
      { name: 'category', description: 'Categoria', required: true },
      { name: 'priority', description: 'Priorità', required: true },
      { name: 'address', description: 'Indirizzo', required: true },
      { name: 'requestUrl', description: 'URL richiesta', required: true }
    ],
    channels: ['email', 'websocket', 'sms'],
    priority: 'URGENT',
    isActive: true,
    isSystem: true
  },

  {
    code: 'request_status_changed',
    name: 'Cambio Stato Richiesta',
    description: 'Notifica cambio stato richiesta',
    category: 'request',
    subject: '🔄 Stato richiesta #{{requestId}} aggiornato',
    htmlContent: `
<!DOCTYPE html>
<html>
<body>
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>Aggiornamento Stato Richiesta</h2>
    <p>Ciao {{recipientName}},</p>
    <p>Lo stato della richiesta #{{requestId}} è cambiato.</p>
    <p><strong>Stato precedente:</strong> {{oldStatus}}</p>
    <p><strong>Nuovo stato:</strong> <span style="color: #10B981; font-weight: bold;">{{newStatus}}</span></p>
    <p><strong>Note:</strong> {{notes}}</p>
    <p><a href="{{requestUrl}}">Visualizza dettagli</a></p>
  </div>
</body>
</html>
    `,
    textContent: `Richiesta #{{requestId}}: stato cambiato da {{oldStatus}} a {{newStatus}}`,
    variables: [
      { name: 'recipientName', description: 'Nome destinatario', required: true },
      { name: 'requestId', description: 'ID richiesta', required: true },
      { name: 'oldStatus', description: 'Stato precedente', required: true },
      { name: 'newStatus', description: 'Nuovo stato', required: true },
      { name: 'notes', description: 'Note', required: false },
      { name: 'requestUrl', description: 'URL richiesta', required: true }
    ],
    channels: ['email', 'websocket'],
    priority: 'NORMAL',
    isActive: true,
    isSystem: true
  },

  // ==================== CHAT ====================
  {
    code: 'chat_message_client',
    name: 'Nuovo Messaggio Chat - Cliente',
    description: 'Notifica nuovo messaggio chat per il cliente',
    category: 'chat',
    subject: '💬 Nuovo messaggio dal professionista',
    htmlContent: `
<!DOCTYPE html>
<html>
<body>
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>Nuovo Messaggio 💬</h2>
    <p>Ciao {{clientName}},</p>
    <p>Hai ricevuto un nuovo messaggio da {{professionalName}} per la richiesta #{{requestId}}.</p>
    <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Messaggio:</strong></p>
      <p style="font-style: italic;">{{messagePreview}}</p>
    </div>
    <p><a href="{{chatUrl}}" style="display: inline-block; padding: 10px 20px; background: #3B82F6; color: white; text-decoration: none; border-radius: 5px;">Leggi e Rispondi</a></p>
  </div>
</body>
</html>
    `,
    textContent: `Nuovo messaggio da {{professionalName}}: {{messagePreview}}`,
    variables: [
      { name: 'clientName', description: 'Nome cliente', required: true },
      { name: 'professionalName', description: 'Nome professionista', required: true },
      { name: 'requestId', description: 'ID richiesta', required: true },
      { name: 'messagePreview', description: 'Anteprima messaggio', required: true },
      { name: 'chatUrl', description: 'URL chat', required: true }
    ],
    channels: ['email', 'websocket'],
    priority: 'HIGH',
    isActive: true,
    isSystem: true
  },

  {
    code: 'chat_message_professional',
    name: 'Nuovo Messaggio Chat - Professionista',
    description: 'Notifica nuovo messaggio chat per il professionista',
    category: 'chat',
    subject: '💬 Nuovo messaggio dal cliente',
    htmlContent: `
<!DOCTYPE html>
<html>
<body>
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>Nuovo Messaggio dal Cliente 💬</h2>
    <p>Ciao {{professionalName}},</p>
    <p>{{clientName}} ha inviato un messaggio per la richiesta #{{requestId}}.</p>
    <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p><strong>Messaggio:</strong></p>
      <p style="font-style: italic;">{{messagePreview}}</p>
    </div>
    <p><a href="{{chatUrl}}" style="display: inline-block; padding: 10px 20px; background: #3B82F6; color: white; text-decoration: none; border-radius: 5px;">Rispondi</a></p>
  </div>
</body>
</html>
    `,
    textContent: `Nuovo messaggio da {{clientName}}: {{messagePreview}}`,
    variables: [
      { name: 'professionalName', description: 'Nome professionista', required: true },
      { name: 'clientName', description: 'Nome cliente', required: true },
      { name: 'requestId', description: 'ID richiesta', required: true },
      { name: 'messagePreview', description: 'Anteprima messaggio', required: true },
      { name: 'chatUrl', description: 'URL chat', required: true }
    ],
    channels: ['email', 'websocket'],
    priority: 'HIGH',
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
    .quote-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .price { font-size: 32px; color: #10B981; font-weight: bold; }
  </style>
</head>
<body>
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #F59E0B;">Nuovo Preventivo Ricevuto! 💰</h2>
    <p>Ciao {{clientName}},</p>
    <p>Il professionista <strong>{{professionalName}}</strong> ha inviato un preventivo.</p>
    
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
      <a href="{{quoteUrl}}" style="display: inline-block; padding: 12px 24px; background: #F59E0B; color: white; text-decoration: none; border-radius: 5px;">
        Visualizza e Confronta
      </a>
    </center>
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

  {
    code: 'quote_modified',
    name: 'Preventivo Modificato',
    description: 'Notifica modifica preventivo',
    category: 'quote',
    subject: '📝 Preventivo modificato per richiesta #{{requestId}}',
    htmlContent: `
<!DOCTYPE html>
<html>
<body>
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>Preventivo Aggiornato 📝</h2>
    <p>Ciao {{clientName}},</p>
    <p>Il professionista {{professionalName}} ha modificato il preventivo.</p>
    <p><strong>Nuovo importo:</strong> <span style="font-size: 24px; color: #10B981;">€{{newAmount}}</span></p>
    <p><strong>Importo precedente:</strong> <del>€{{oldAmount}}</del></p>
    <p><strong>Modifiche:</strong> {{changes}}</p>
    <p><a href="{{quoteUrl}}">Visualizza preventivo aggiornato</a></p>
  </div>
</body>
</html>
    `,
    textContent: `Preventivo modificato: nuovo importo €{{newAmount}} (era €{{oldAmount}})`,
    variables: [
      { name: 'clientName', description: 'Nome cliente', required: true },
      { name: 'professionalName', description: 'Nome professionista', required: true },
      { name: 'requestId', description: 'ID richiesta', required: true },
      { name: 'newAmount', description: 'Nuovo importo', required: true },
      { name: 'oldAmount', description: 'Vecchio importo', required: true },
      { name: 'changes', description: 'Descrizione modifiche', required: false },
      { name: 'quoteUrl', description: 'URL preventivo', required: true }
    ],
    channels: ['email', 'websocket'],
    priority: 'HIGH',
    isActive: true,
    isSystem: true
  },

  {
    code: 'quote_accepted_professional',
    name: 'Preventivo Accettato - Professionista',
    description: 'Notifica accettazione preventivo per il professionista',
    category: 'quote',
    subject: '✅ Il tuo preventivo è stato accettato!',
    htmlContent: `
<!DOCTYPE html>
<html>
<body>
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #10B981;">Ottima Notizia! Il tuo preventivo è stato accettato! ✅</h2>
    <p>Ciao {{professionalName}},</p>
    <p>Il cliente {{clientName}} ha accettato il tuo preventivo!</p>
    <div style="background: #D1FAE5; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3>Dettagli:</h3>
      <p><strong>Richiesta:</strong> #{{requestId}} - {{requestTitle}}</p>
      <p><strong>Importo:</strong> €{{amount}}</p>
      <p><strong>Cliente:</strong> {{clientName}}</p>
      <p><strong>Telefono:</strong> {{clientPhone}}</p>
      <p><strong>Indirizzo:</strong> {{address}}</p>
    </div>
    <p>Contatta il cliente per concordare data e ora dell'intervento.</p>
  </div>
</body>
</html>
    `,
    textContent: `Preventivo accettato! Cliente: {{clientName}}, Importo: €{{amount}}`,
    smsContent: `✅ Preventivo accettato da {{clientName}}! Importo: €{{amount}}. Contattalo al {{clientPhone}}`,
    variables: [
      { name: 'professionalName', description: 'Nome professionista', required: true },
      { name: 'clientName', description: 'Nome cliente', required: true },
      { name: 'requestId', description: 'ID richiesta', required: true },
      { name: 'requestTitle', description: 'Titolo richiesta', required: true },
      { name: 'amount', description: 'Importo', required: true },
      { name: 'clientPhone', description: 'Telefono cliente', required: true },
      { name: 'address', description: 'Indirizzo intervento', required: true }
    ],
    channels: ['email', 'websocket', 'sms'],
    priority: 'URGENT',
    isActive: true,
    isSystem: true
  },

  {
    code: 'quote_rejected_professional',
    name: 'Preventivo Rifiutato - Professionista',
    description: 'Notifica rifiuto preventivo per il professionista',
    category: 'quote',
    subject: '❌ Il tuo preventivo non è stato accettato',
    htmlContent: `
<!DOCTYPE html>
<html>
<body>
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2>Preventivo Non Accettato ❌</h2>
    <p>Ciao {{professionalName}},</p>
    <p>Il cliente {{clientName}} ha scelto un altro professionista per la richiesta #{{requestId}}.</p>
    <p><strong>Motivo (se fornito):</strong> {{reason}}</p>
    <p>Non scoraggiarti! Continueremo ad assegnarti nuove richieste compatibili con le tue competenze.</p>
  </div>
</body>
</html>
    `,
    textContent: `Il tuo preventivo per la richiesta #{{requestId}} non è stato accettato.`,
    variables: [
      { name: 'professionalName', description: 'Nome professionista', required: true },
      { name: 'clientName', description: 'Nome cliente', required: true },
      { name: 'requestId', description: 'ID richiesta', required: true },
      { name: 'reason', description: 'Motivo rifiuto', required: false }
    ],
    channels: ['email', 'websocket'],
    priority: 'NORMAL',
    isActive: true,
    isSystem: true
  },

  // ==================== COMPETENZE PROFESSIONISTI ====================
  {
    code: 'skill_added',
    name: 'Nuova Competenza Aggiunta',
    description: 'Conferma aggiunta nuova competenza professionista',
    category: 'professional',
    subject: '🎯 Nuova competenza aggiunta al tuo profilo',
    htmlContent: `
<!DOCTYPE html>
<html>
<body>
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #6366F1;">Competenza Aggiunta! 🎯</h2>
    <p>Ciao {{professionalName}},</p>
    <p>Una nuova competenza è stata aggiunta al tuo profilo professionale.</p>
    <div style="background: #EEF2FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3>Dettagli Competenza:</h3>
      <p><strong>Categoria:</strong> {{category}}</p>
      <p><strong>Sottocategoria:</strong> {{subcategory}}</p>
      <p><strong>Livello esperienza:</strong> {{experienceLevel}}</p>
    </div>
    <p>Ora riceverai richieste per questa categoria di servizi.</p>
  </div>
</body>
</html>
    `,
    textContent: `Nuova competenza aggiunta: {{category}} - {{subcategory}}`,
    variables: [
      { name: 'professionalName', description: 'Nome professionista', required: true },
      { name: 'category', description: 'Categoria', required: true },
      { name: 'subcategory', description: 'Sottocategoria', required: true },
      { name: 'experienceLevel', description: 'Livello esperienza', required: true }
    ],
    channels: ['email', 'websocket'],
    priority: 'NORMAL',
    isActive: true,
    isSystem: true
  },

  {
    code: 'skill_revoked',
    name: 'Competenza Revocata',
    description: 'Notifica revoca competenza professionista',
    category: 'professional',
    subject: '⚠️ Competenza rimossa dal tuo profilo',
    htmlContent: `
<!DOCTYPE html>
<html>
<body>
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #DC2626;">Competenza Rimossa ⚠️</h2>
    <p>Ciao {{professionalName}},</p>
    <p>Una competenza è stata rimossa dal tuo profilo professionale.</p>
    <div style="background: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3>Competenza Rimossa:</h3>
      <p><strong>Categoria:</strong> {{category}}</p>
      <p><strong>Sottocategoria:</strong> {{subcategory}}</p>
      <p><strong>Motivo:</strong> {{reason}}</p>
    </div>
    <p>Non riceverai più richieste per questa categoria.</p>
    <p>Se ritieni ci sia un errore, contatta il supporto.</p>
  </div>
</body>
</html>
    `,
    textContent: `Competenza rimossa: {{category}} - {{subcategory}}. Motivo: {{reason}}`,
    variables: [
      { name: 'professionalName', description: 'Nome professionista', required: true },
      { name: 'category', description: 'Categoria', required: true },
      { name: 'subcategory', description: 'Sottocategoria', required: true },
      { name: 'reason', description: 'Motivo revoca', required: true }
    ],
    channels: ['email', 'websocket'],
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
        <a href="{{receiptUrl}}" style="display: inline-block; padding: 12px 24px; background: #10B981; color: white; text-decoration: none; border-radius: 5px;">Scarica Ricevuta PDF</a>
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
    code: 'on_user_deleted',
    name: 'Alla Cancellazione Utente',
    description: 'Conferma cancellazione account',
    eventType: 'user_deleted',
    entityType: 'user',
    templateCode: 'user_deleted',
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
    code: 'on_request_assigned_client',
    name: 'Assegnazione Professionista (Cliente)',
    description: 'Notifica il cliente quando viene assegnato un professionista',
    eventType: 'request_assigned',
    entityType: 'request',
    templateCode: 'request_assigned_client',
    delay: 0,
    isActive: true
  },
  {
    code: 'on_request_assigned_professional',
    name: 'Assegnazione Richiesta (Professionista)',
    description: 'Notifica il professionista di una nuova richiesta assegnata',
    eventType: 'request_assigned',
    entityType: 'request',
    templateCode: 'request_assigned_professional',
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
    code: 'on_quote_accepted',
    name: 'Accettazione Preventivo',
    description: 'Notifica il professionista quando il suo preventivo viene accettato',
    eventType: 'quote_accepted',
    entityType: 'quote',
    templateCode: 'quote_accepted_professional',
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

async function seedAllTemplates() {
  console.log('🌱 Caricamento di TUTTI i template di notifiche...\n');

  try {
    let createdCount = 0;
    let skippedCount = 0;

    // Crea i template
    console.log('📧 CREAZIONE TEMPLATE...\n');
    for (const template of ALL_TEMPLATES) {
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
        console.log(`✅ Creato: ${template.code} - ${template.name}`);
        createdCount++;
      } else {
        console.log(`⏭️  Esiste già: ${template.code}`);
        skippedCount++;
      }
    }

    // Crea gli eventi
    console.log('\n⚡ CREAZIONE EVENTI...\n');
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
          console.log(`✅ Creato evento: ${event.code}`);
        }
      } else {
        console.log(`⏭️  Evento già esistente: ${event.code}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✨ CARICAMENTO COMPLETATO!');
    console.log('='.repeat(60));
    console.log(`📊 RIEPILOGO:`);
    console.log(`   Template totali: ${ALL_TEMPLATES.length}`);
    console.log(`   ✅ Creati: ${createdCount}`);
    console.log(`   ⏭️  Già esistenti: ${skippedCount}`);
    console.log(`   Eventi configurati: ${DEFAULT_EVENTS.length}`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('❌ Errore durante il caricamento:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui il seed
seedAllTemplates();
