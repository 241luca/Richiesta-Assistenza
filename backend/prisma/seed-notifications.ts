import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function seedNotifications() {
  console.log('📧 SEED SISTEMA NOTIFICHE...\n')

  try {
    // 1. CHANNELS
    console.log('📡 Creazione canali...')
    
    const channels = [
      { name: 'email', displayName: 'Email', isActive: true },
      { name: 'websocket', displayName: 'In-app', isActive: true },
      { name: 'sms', displayName: 'SMS', isActive: false },
      { name: 'push', displayName: 'Push', isActive: false }
    ]

    for (const ch of channels) {
      await prisma.notificationChannel.upsert({
        where: { code: ch.name },
        update: {},
        create: {
          id: uuidv4(),
          code: ch.name,
          name: ch.displayName,
          displayName: ch.displayName,
          isActive: ch.isActive,
          configuration: {},
          updatedAt: new Date()
        }
      })
      console.log(`✅ ${ch.displayName}`)
    }

    // 2. NOTIFICATION TYPES
    console.log('\n📋 Creazione 30+ tipi di notifica...')
    
    const types = [
      // USER
      { code: 'USER_REGISTERED', name: 'Nuovo utente', category: 'USER' },
      { code: 'USER_VERIFIED', name: 'Email verificata', category: 'USER' },
      { code: 'USER_DELETED', name: 'Account cancellato', category: 'USER' },
      { code: 'PASSWORD_RESET', name: 'Reset password', category: 'USER' },
      { code: 'PASSWORD_CHANGED', name: 'Password cambiata', category: 'USER' },
      
      // REQUEST
      { code: 'REQUEST_CREATED', name: 'Richiesta creata', category: 'REQUEST' },
      { code: 'REQUEST_ASSIGNED_CLIENT', name: 'Professionista assegnato', category: 'REQUEST' },
      { code: 'REQUEST_ASSIGNED_PROFESSIONAL', name: 'Nuova richiesta', category: 'REQUEST' },
      { code: 'REQUEST_UPDATED_CLIENT', name: 'Richiesta modificata (cliente)', category: 'REQUEST' },
      { code: 'REQUEST_UPDATED_PROFESSIONAL', name: 'Richiesta modificata (prof)', category: 'REQUEST' },
      { code: 'REQUEST_COMPLETED_CLIENT', name: 'Servizio completato (cliente)', category: 'REQUEST' },
      { code: 'REQUEST_COMPLETED_PROFESSIONAL', name: 'Servizio completato (prof)', category: 'REQUEST' },
      { code: 'REQUEST_CANCELLED_CLIENT', name: 'Richiesta annullata (cliente)', category: 'REQUEST' },
      { code: 'REQUEST_CANCELLED_PROFESSIONAL', name: 'Richiesta annullata (prof)', category: 'REQUEST' },
      { code: 'REQUEST_REMINDER', name: 'Promemoria appuntamento', category: 'REQUEST' },
      { code: 'REQUEST_STATUS_CHANGED', name: 'Cambio stato richiesta', category: 'REQUEST' },
      
      // QUOTE
      { code: 'QUOTE_CREATED', name: 'Nuovo preventivo', category: 'QUOTE' },
      { code: 'QUOTE_UPDATED', name: 'Preventivo modificato', category: 'QUOTE' },
      { code: 'QUOTE_ACCEPTED', name: 'Preventivo accettato', category: 'QUOTE' },
      { code: 'QUOTE_REJECTED', name: 'Preventivo rifiutato', category: 'QUOTE' },
      { code: 'QUOTE_EXPIRING', name: 'Preventivo in scadenza', category: 'QUOTE' },
      { code: 'QUOTE_EXPIRED', name: 'Preventivo scaduto', category: 'QUOTE' },
      
      // CHAT
      { code: 'CHAT_MESSAGE_CLIENT', name: 'Nuovo messaggio (cliente)', category: 'CHAT' },
      { code: 'CHAT_MESSAGE_PROFESSIONAL', name: 'Nuovo messaggio (prof)', category: 'CHAT' },
      
      // PAYMENT
      { code: 'PAYMENT_RECEIVED', name: 'Pagamento ricevuto', category: 'PAYMENT' },
      { code: 'PAYMENT_FAILED', name: 'Pagamento fallito', category: 'PAYMENT' },
      { code: 'DEPOSIT_REQUESTED', name: 'Deposito richiesto', category: 'PAYMENT' },
      { code: 'DEPOSIT_PAID', name: 'Deposito pagato', category: 'PAYMENT' },
      
      // PROFESSIONAL
      { code: 'PROFESSIONAL_APPROVED', name: 'Profilo approvato', category: 'PROFESSIONAL' },
      { code: 'PROFESSIONAL_SUSPENDED', name: 'Profilo sospeso', category: 'PROFESSIONAL' },
      { code: 'SKILL_ADDED', name: 'Competenza aggiunta', category: 'PROFESSIONAL' },
      { code: 'SKILL_REMOVED', name: 'Competenza rimossa', category: 'PROFESSIONAL' },
      { code: 'REVIEW_RECEIVED', name: 'Nuova recensione', category: 'PROFESSIONAL' }
    ]

    for (const t of types) {
      await prisma.notificationType.upsert({
        where: { code: t.code },
        update: {},
        create: {
          id: uuidv4(),
          code: t.code,
          name: t.name,
          description: `Notifica per ${t.name.toLowerCase()}`,
          category: t.category,
          defaultChannels: ['email', 'websocket'],
          isActive: true,
          priority: t.code.includes('PAYMENT') ? 'HIGH' : 'MEDIUM',
          updatedAt: new Date()
        }
      })
      console.log(`✅ ${t.code}`)
    }

    // 3. TEMPLATES
    console.log('\n📝 Creazione template email...')
    
    const emailChannel = await prisma.notificationChannel.findFirst({ where: { name: 'email' } })
    const wsChannel = await prisma.notificationChannel.findFirst({ where: { name: 'websocket' } })
    
    if (!emailChannel || !wsChannel) {
      console.log('❌ Canali non trovati')
      return
    }

    // Template principali
    const templates = [
      {
        typeCode: 'USER_REGISTERED',
        channelId: emailChannel.id,
        subject: 'Benvenuto in Richiesta Assistenza!',
        bodyHtml: '<h2>Benvenuto {{fullName}}!</h2><p>Il tuo account è stato creato.</p>',
        bodyText: 'Benvenuto {{fullName}}! Il tuo account è stato creato.'
      },
      {
        typeCode: 'REQUEST_CREATED',
        channelId: emailChannel.id,
        subject: 'Richiesta #{{requestId}} creata',
        bodyHtml: '<h2>Richiesta creata!</h2><p>La tua richiesta "{{requestTitle}}" è stata creata.</p>',
        bodyText: 'Richiesta {{requestTitle}} creata con ID #{{requestId}}'
      },
      {
        typeCode: 'REQUEST_ASSIGNED_PROFESSIONAL',
        channelId: emailChannel.id,
        subject: 'Nuova richiesta assegnata',
        bodyHtml: '<h2>Nuova richiesta!</h2><p>Ti è stata assegnata: {{requestTitle}}</p>',
        bodyText: 'Nuova richiesta assegnata: {{requestTitle}}'
      },
      {
        typeCode: 'QUOTE_CREATED',
        channelId: emailChannel.id,
        subject: 'Nuovo preventivo ricevuto',
        bodyHtml: '<h2>Nuovo preventivo!</h2><p>Hai ricevuto un preventivo di €{{amount}}</p>',
        bodyText: 'Nuovo preventivo ricevuto: €{{amount}}'
      },
      {
        typeCode: 'QUOTE_ACCEPTED',
        channelId: emailChannel.id,
        subject: 'Preventivo accettato!',
        bodyHtml: '<h2>Preventivo accettato!</h2><p>Il tuo preventivo è stato accettato.</p>',
        bodyText: 'Il tuo preventivo è stato accettato!'
      },
      {
        typeCode: 'PAYMENT_RECEIVED',
        channelId: emailChannel.id,
        subject: 'Pagamento ricevuto €{{amount}}',
        bodyHtml: '<h2>Pagamento ricevuto!</h2><p>Abbiamo ricevuto €{{amount}}</p>',
        bodyText: 'Pagamento ricevuto: €{{amount}}'
      },
      {
        typeCode: 'CHAT_MESSAGE_CLIENT',
        channelId: wsChannel.id,
        subject: '',
        bodyHtml: '',
        bodyText: 'Nuovo messaggio da {{senderName}}'
      }
    ]

    for (const tmpl of templates) {
      const type = await prisma.notificationType.findFirst({ where: { code: tmpl.typeCode } })
      
      if (type) {
        await prisma.notificationTemplate.upsert({
          where: {
            typeId_channelId_language: {
              typeId: type.id,
              channelId: tmpl.channelId,
              language: 'it'
            }
          },
          update: {},
          create: {
            id: uuidv4(),
            typeId: type.id,
            channelId: tmpl.channelId,
            language: 'it',
            subject: tmpl.subject,
            bodyHtml: tmpl.bodyHtml,
            bodyText: tmpl.bodyText,
            variables: extractVars(tmpl.subject + tmpl.bodyHtml + tmpl.bodyText),
            isActive: true,
            updatedAt: new Date()
          }
        })
        console.log(`✅ Template: ${tmpl.typeCode}`)
      }
    }

    // REPORT
    const totals = {
      channels: await prisma.notificationChannel.count(),
      types: await prisma.notificationType.count(),
      templates: await prisma.notificationTemplate.count()
    }

    console.log(`
===========================================
📊 SISTEMA NOTIFICHE CREATO:
- Canali: ${totals.channels}
- Tipi: ${totals.types}
- Template: ${totals.templates}
===========================================
`)

  } catch (error) {
    console.error('❌ Errore:', error)
  } finally {
    await prisma.$disconnect()
  }
}

function extractVars(text: string): string[] {
  const matches = text.match(/{{(\w+)}}/g) || []
  return [...new Set(matches.map(m => m.replace(/[{}]/g, '')))]
}

// Esegui
seedNotifications()
