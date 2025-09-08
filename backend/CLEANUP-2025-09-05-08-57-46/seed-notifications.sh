import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function seedNotifications() {
  console.log('📧 RIPRISTINO SISTEMA NOTIFICHE COMPLETO...\n')

  try {
    // NOTIFICATION TYPES
    const notificationTypes = [
      'USER_REGISTERED', 'USER_VERIFIED', 'USER_DELETED', 'PASSWORD_RESET', 'PASSWORD_CHANGED',
      'REQUEST_CREATED', 'REQUEST_ASSIGNED_CLIENT', 'REQUEST_ASSIGNED_PROFESSIONAL', 
      'REQUEST_COMPLETED_CLIENT', 'REQUEST_CANCELLED_CLIENT', 'REQUEST_REMINDER',
      'QUOTE_CREATED', 'QUOTE_ACCEPTED', 'QUOTE_REJECTED', 'QUOTE_EXPIRING',
      'CHAT_MESSAGE', 'PAYMENT_RECEIVED', 'PAYMENT_FAILED', 'INVOICE_GENERATED',
      'PROFESSIONAL_APPROVED', 'SKILL_ADDED', 'SKILL_REMOVED', 'REVIEW_RECEIVED',
      'DEPOSIT_REQUESTED', 'DEPOSIT_PAID', 'SERVICE_FEEDBACK', 'SYSTEM_MAINTENANCE',
      'ACCOUNT_SUSPENDED', 'ACCOUNT_REACTIVATED', 'SUBSCRIPTION_EXPIRING'
    ]

    for (const typeCode of notificationTypes) {
      const type = await prisma.notificationType.upsert({
        where: { code: typeCode },
        update: {},
        create: {
          id: uuidv4(),
          code: typeCode,
          name: typeCode.replace(/_/g, ' ').toLowerCase(),
          description: `Notifica per ${typeCode.replace(/_/g, ' ').toLowerCase()}`,
          category: typeCode.split('_')[0],
          defaultChannels: ['email', 'websocket'],
          isActive: true,
          priority: typeCode.includes('URGENT') || typeCode.includes('PAYMENT') ? 'HIGH' : 'MEDIUM',
          updatedAt: new Date()
        }
      })
      console.log(`✅ Type: ${typeCode}`)
    }

    // NOTIFICATION TEMPLATES
    console.log('\n📝 Creazione template notifiche...')

    const templates = [
      {
        typeCode: 'USER_REGISTERED',
        channel: 'email',
        subject: 'Benvenuto in Richiesta Assistenza!',
        bodyHtml: `
<h2>Benvenuto {{fullName}}!</h2>
<p>Grazie per esserti registrato su Richiesta Assistenza.</p>
<p>Il tuo account è stato creato con successo con l'email: <strong>{{email}}</strong></p>
<p>Per completare la registrazione, verifica il tuo indirizzo email cliccando sul link qui sotto:</p>
<a href="{{verificationUrl}}" style="background:#3B82F6;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block">Verifica Email</a>
<p>Se hai bisogno di assistenza, contattaci!</p>`,
        bodyText: 'Benvenuto {{fullName}}! Verifica la tua email: {{verificationUrl}}'
      },
      {
        typeCode: 'REQUEST_CREATED',
        channel: 'email',
        subject: 'Richiesta #{{requestId}} creata con successo',
        bodyHtml: `
<h2>Richiesta creata con successo!</h2>
<p>Ciao {{clientName}},</p>
<p>La tua richiesta "<strong>{{requestTitle}}</strong>" è stata creata con successo.</p>
<div style="background:#F3F4F6;padding:16px;border-radius:8px;margin:16px 0">
  <p><strong>Dettagli richiesta:</strong></p>
  <ul>
    <li>ID: #{{requestId}}</li>
    <li>Categoria: {{categoryName}}</li>
    <li>Priorità: {{priority}}</li>
    <li>Indirizzo: {{address}}</li>
    <li>Data richiesta: {{scheduledDate}}</li>
  </ul>
</div>
<p>Ti assegneremo un professionista qualificato al più presto.</p>
<a href="{{requestUrl}}" style="background:#3B82F6;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block">Visualizza Richiesta</a>`,
        bodyText: 'Richiesta {{requestTitle}} creata. ID: #{{requestId}}'
      },
      {
        typeCode: 'REQUEST_ASSIGNED_PROFESSIONAL',
        channel: 'email',
        subject: '🔔 Nuova richiesta assegnata: {{requestTitle}}',
        bodyHtml: `
<h2>Nuova richiesta assegnata!</h2>
<p>Ciao {{professionalName}},</p>
<p>Ti è stata assegnata una nuova richiesta di assistenza.</p>
<div style="background:#FEF3C7;padding:16px;border-radius:8px;margin:16px 0">
  <p><strong>Dettagli richiesta:</strong></p>
  <ul>
    <li>Titolo: {{requestTitle}}</li>
    <li>Cliente: {{clientName}}</li>
    <li>Telefono: {{clientPhone}}</li>
    <li>Indirizzo: {{address}}, {{city}}</li>
    <li>Descrizione: {{description}}</li>
    <li>Data richiesta: {{scheduledDate}}</li>
  </ul>
</div>
<p><strong>Azione richiesta:</strong> Contatta il cliente e invia un preventivo entro 24 ore.</p>
<a href="{{requestUrl}}" style="background:#10B981;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block">Gestisci Richiesta</a>`,
        bodyText: 'Nuova richiesta: {{requestTitle}} da {{clientName}}'
      },
      {
        typeCode: 'QUOTE_CREATED',
        channel: 'email',
        subject: '💰 Nuovo preventivo per: {{requestTitle}}',
        bodyHtml: `
<h2>Hai ricevuto un nuovo preventivo!</h2>
<p>Ciao {{clientName}},</p>
<p>{{professionalName}} ha inviato un preventivo per la tua richiesta.</p>
<div style="background:#E0E7FF;padding:16px;border-radius:8px;margin:16px 0">
  <p><strong>Riepilogo preventivo:</strong></p>
  <ul>
    <li>Professionista: {{professionalName}}</li>
    <li>Importo: <strong style="color:#059669;font-size:20px">€{{amount}}</strong></li>
    <li>Validità: fino al {{validUntil}}</li>
  </ul>
  <p><strong>Descrizione:</strong><br>{{quoteDescription}}</p>
</div>
<p>Puoi accettare o rifiutare il preventivo dalla tua area riservata.</p>
<div style="margin:24px 0">
  <a href="{{acceptUrl}}" style="background:#10B981;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin-right:12px">Accetta Preventivo</a>
  <a href="{{viewUrl}}" style="background:#6B7280;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block">Visualizza Dettagli</a>
</div>`,
        bodyText: 'Nuovo preventivo da {{professionalName}}: €{{amount}}'
      },
      {
        typeCode: 'QUOTE_ACCEPTED',
        channel: 'email',
        subject: '✅ Preventivo accettato per: {{requestTitle}}',
        bodyHtml: `
<h2>Il tuo preventivo è stato accettato!</h2>
<p>Ottima notizia {{professionalName}}!</p>
<p>{{clientName}} ha accettato il tuo preventivo di <strong>€{{amount}}</strong>.</p>
<div style="background:#D1FAE5;padding:16px;border-radius:8px;margin:16px 0">
  <p><strong>Prossimi passi:</strong></p>
  <ol>
    <li>Contatta il cliente per confermare data e ora dell'intervento</li>
    <li>Prepara materiali e attrezzature necessarie</li>
    <li>Conferma l'appuntamento 24 ore prima</li>
  </ol>
  <p><strong>Contatti cliente:</strong></p>
  <ul>
    <li>Nome: {{clientName}}</li>
    <li>Telefono: {{clientPhone}}</li>
    <li>Email: {{clientEmail}}</li>
    <li>Indirizzo: {{address}}</li>
  </ul>
</div>
<a href="{{requestUrl}}" style="background:#3B82F6;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block">Visualizza Dettagli</a>`,
        bodyText: 'Preventivo accettato da {{clientName}} - €{{amount}}'
      },
      {
        typeCode: 'PAYMENT_RECEIVED',
        channel: 'email',
        subject: '✅ Pagamento ricevuto - €{{amount}}',
        bodyHtml: `
<h2>Pagamento ricevuto con successo!</h2>
<p>Conferma di pagamento per {{professionalName}}.</p>
<div style="background:#D1FAE5;padding:16px;border-radius:8px;margin:16px 0">
  <p><strong>Dettagli pagamento:</strong></p>
  <ul>
    <li>Importo: <strong>€{{amount}}</strong></li>
    <li>Cliente: {{clientName}}</li>
    <li>Richiesta: {{requestTitle}}</li>
    <li>Data: {{paymentDate}}</li>
    <li>Metodo: {{paymentMethod}}</li>
    <li>ID Transazione: {{transactionId}}</li>
  </ul>
</div>
<p>L'importo sarà accreditato sul tuo conto entro 2-3 giorni lavorativi.</p>`,
        bodyText: 'Pagamento ricevuto: €{{amount}} da {{clientName}}'
      },
      {
        typeCode: 'REQUEST_REMINDER',
        channel: 'sms',
        subject: '',
        bodyHtml: '',
        bodyText: 'Promemoria: Appuntamento {{requestTitle}} domani alle {{time}}. Indirizzo: {{address}}'
      },
      {
        typeCode: 'CHAT_MESSAGE',
        channel: 'websocket',
        subject: '',
        bodyHtml: '',
        bodyText: '{{senderName}}: {{messagePreview}}'
      },
      {
        typeCode: 'REQUEST_COMPLETED_CLIENT',
        channel: 'email',
        subject: '✅ Servizio completato - {{requestTitle}}',
        bodyHtml: `
<h2>Servizio completato con successo!</h2>
<p>Ciao {{clientName}},</p>
<p>Il servizio richiesto è stato completato da {{professionalName}}.</p>
<div style="background:#F3F4F6;padding:16px;border-radius:8px;margin:16px 0">
  <p><strong>Riepilogo servizio:</strong></p>
  <ul>
    <li>Richiesta: {{requestTitle}}</li>
    <li>Professionista: {{professionalName}}</li>
    <li>Data completamento: {{completionDate}}</li>
    <li>Importo pagato: €{{amount}}</li>
  </ul>
</div>
<p><strong>La tua opinione è importante!</strong></p>
<p>Aiutaci a migliorare il servizio lasciando una recensione.</p>
<a href="{{reviewUrl}}" style="background:#F59E0B;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block">Lascia una Recensione</a>`,
        bodyText: 'Servizio {{requestTitle}} completato. Lascia una recensione!'
      }
    ]

    for (const template of templates) {
      const type = await prisma.notificationType.findFirst({
        where: { code: template.typeCode }
      })

      if (type) {
        const channel = await prisma.notificationChannel.findFirst({
          where: { name: template.channel }
        })

        if (channel) {
          await prisma.notificationTemplate.upsert({
            where: {
              typeId_channelId_language: {
                typeId: type.id,
                channelId: channel.id,
                language: 'it'
              }
            },
            update: {},
            create: {
              id: uuidv4(),
              typeId: type.id,
              channelId: channel.id,
              language: 'it',
              subject: template.subject,
              bodyHtml: template.bodyHtml,
              bodyText: template.bodyText,
              variables: extractVariables(template.bodyHtml + template.bodyText + template.subject),
              isActive: true,
              updatedAt: new Date()
            }
          })
          console.log(`✅ Template: ${template.typeCode} (${template.channel})`)
        }
      }
    }

    // USER NOTIFICATION PREFERENCES (default per tutti gli utenti)
    console.log('\n⚙️ Configurazione preferenze notifiche utenti...')
    
    const users = await prisma.user.findMany()
    const types = await prisma.notificationType.findMany()
    const emailChannel = await prisma.notificationChannel.findFirst({ where: { name: 'email' } })
    const wsChannel = await prisma.notificationChannel.findFirst({ where: { name: 'websocket' } })

    for (const user of users) {
      for (const type of types) {
        // Email sempre attive per notifiche importanti
        if (emailChannel && ['USER_REGISTERED', 'PASSWORD_RESET', 'REQUEST_CREATED', 'QUOTE_CREATED', 'PAYMENT_RECEIVED'].includes(type.code)) {
          await prisma.userNotificationPreference.upsert({
            where: {
              userId_typeId_channelId: {
                userId: user.id,
                typeId: type.id,
                channelId: emailChannel.id
              }
            },
            update: {},
            create: {
              id: uuidv4(),
              userId: user.id,
              typeId: type.id,
              channelId: emailChannel.id,
              enabled: true,
              frequency: 'IMMEDIATE',
              updatedAt: new Date()
            }
          })
        }

        // WebSocket sempre attive per notifiche real-time
        if (wsChannel) {
          await prisma.userNotificationPreference.upsert({
            where: {
              userId_typeId_channelId: {
                userId: user.id,
                typeId: type.id,
                channelId: wsChannel.id
              }
            },
            update: {},
            create: {
              id: uuidv4(),
              userId: user.id,
              typeId: type.id,
              channelId: wsChannel.id,
              enabled: true,
              frequency: 'IMMEDIATE',
              updatedAt: new Date()
            }
          })
        }
      }
    }

    console.log('✅ Preferenze notifiche configurate per tutti gli utenti')

    // REPORT FINALE
    console.log('\n' + '='.repeat(60))
    console.log('📊 REPORT SISTEMA NOTIFICHE')
    console.log('='.repeat(60))
    
    const totals = {
      channels: await prisma.notificationChannel.count(),
      types: await prisma.notificationType.count(),
      templates: await prisma.notificationTemplate.count(),
      preferences: await prisma.userNotificationPreference.count()
    }

    console.log(`
✅ Canali: ${totals.channels}
✅ Tipologie: ${totals.types}
✅ Template: ${totals.templates}
✅ Preferenze utente: ${totals.preferences}

🎉 SISTEMA NOTIFICHE COMPLETAMENTE RIPRISTINATO!
`)

  } catch (error) {
    console.error('❌ Errore:', error)
  } finally {
    await prisma.$disconnect()
  }
}

function extractVariables(text: string): string[] {
  const matches = text.match(/{{(\w+)}}/g) || []
  return [...new Set(matches.map(m => m.replace(/[{}]/g, '')))]
}

seedNotifications()
