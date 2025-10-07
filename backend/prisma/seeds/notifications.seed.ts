import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

export async function seedNotifications(prisma: PrismaClient) {
  console.log('📧 SEEDING SISTEMA NOTIFICHE COMPLETO...\n')

  try {
    // 1. CHANNELS
    console.log('📡 Creazione canali...')
    
    const channels = [
      { name: 'email', displayName: 'Email', isActive: true },
      { name: 'websocket', displayName: 'In-app', isActive: true },
      { name: 'whatsapp', displayName: 'WhatsApp', isActive: true },
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

    // 2. NOTIFICATION TYPES - 30+ TIPI COMPLETI
    console.log('\n📋 Creazione 30+ tipi di notifica...')
    
    const types = [
      // USER
      { code: 'USER_REGISTERED', name: 'Nuovo utente', category: 'USER', priority: 'MEDIUM' },
      { code: 'USER_VERIFIED', name: 'Email verificata', category: 'USER', priority: 'LOW' },
      { code: 'USER_DELETED', name: 'Account cancellato', category: 'USER', priority: 'HIGH' },
      { code: 'PASSWORD_RESET', name: 'Reset password', category: 'USER', priority: 'HIGH' },
      { code: 'PASSWORD_CHANGED', name: 'Password cambiata', category: 'USER', priority: 'MEDIUM' },
      { code: 'LOGIN_SUSPICIOUS', name: 'Accesso sospetto', category: 'USER', priority: 'HIGH' },
      { code: 'ACCOUNT_LOCKED', name: 'Account bloccato', category: 'USER', priority: 'HIGH' },
      
      // REQUEST - RICHIESTE
      { code: 'REQUEST_CREATED', name: 'Richiesta creata', category: 'REQUEST', priority: 'MEDIUM' },
      { code: 'REQUEST_ASSIGNED_CLIENT', name: 'Professionista assegnato', category: 'REQUEST', priority: 'HIGH' },
      { code: 'REQUEST_ASSIGNED_PROFESSIONAL', name: 'Nuova richiesta', category: 'REQUEST', priority: 'HIGH' },
      { code: 'REQUEST_UPDATED_CLIENT', name: 'Richiesta modificata (cliente)', category: 'REQUEST', priority: 'MEDIUM' },
      { code: 'REQUEST_UPDATED_PROFESSIONAL', name: 'Richiesta modificata (prof)', category: 'REQUEST', priority: 'MEDIUM' },
      { code: 'REQUEST_COMPLETED_CLIENT', name: 'Servizio completato (cliente)', category: 'REQUEST', priority: 'HIGH' },
      { code: 'REQUEST_COMPLETED_PROFESSIONAL', name: 'Servizio completato (prof)', category: 'REQUEST', priority: 'HIGH' },
      { code: 'REQUEST_CANCELLED_CLIENT', name: 'Richiesta annullata (cliente)', category: 'REQUEST', priority: 'MEDIUM' },
      { code: 'REQUEST_CANCELLED_PROFESSIONAL', name: 'Richiesta annullata (prof)', category: 'REQUEST', priority: 'MEDIUM' },
      { code: 'REQUEST_REMINDER', name: 'Promemoria appuntamento', category: 'REQUEST', priority: 'HIGH' },
      { code: 'REQUEST_STATUS_CHANGED', name: 'Cambio stato richiesta', category: 'REQUEST', priority: 'MEDIUM' },
      
      // QUOTE - PREVENTIVI
      { code: 'QUOTE_CREATED', name: 'Nuovo preventivo', category: 'QUOTE', priority: 'HIGH' },
      { code: 'QUOTE_UPDATED', name: 'Preventivo modificato', category: 'QUOTE', priority: 'MEDIUM' },
      { code: 'QUOTE_ACCEPTED', name: 'Preventivo accettato', category: 'QUOTE', priority: 'HIGH' },
      { code: 'QUOTE_REJECTED', name: 'Preventivo rifiutato', category: 'QUOTE', priority: 'MEDIUM' },
      { code: 'QUOTE_EXPIRING', name: 'Preventivo in scadenza', category: 'QUOTE', priority: 'HIGH' },
      { code: 'QUOTE_EXPIRED', name: 'Preventivo scaduto', category: 'QUOTE', priority: 'MEDIUM' },
      
      // CHAT - MESSAGGI
      { code: 'CHAT_MESSAGE_CLIENT', name: 'Nuovo messaggio (cliente)', category: 'CHAT', priority: 'LOW' },
      { code: 'CHAT_MESSAGE_PROFESSIONAL', name: 'Nuovo messaggio (prof)', category: 'CHAT', priority: 'LOW' },
      
      // PAYMENT - PAGAMENTI
      { code: 'PAYMENT_RECEIVED', name: 'Pagamento ricevuto', category: 'PAYMENT', priority: 'HIGH' },
      { code: 'PAYMENT_FAILED', name: 'Pagamento fallito', category: 'PAYMENT', priority: 'HIGH' },
      { code: 'DEPOSIT_REQUESTED', name: 'Deposito richiesto', category: 'PAYMENT', priority: 'HIGH' },
      { code: 'DEPOSIT_PAID', name: 'Deposito pagato', category: 'PAYMENT', priority: 'HIGH' },
      { code: 'INVOICE_GENERATED', name: 'Fattura generata', category: 'PAYMENT', priority: 'MEDIUM' },
      { code: 'PAYOUT_PROCESSED', name: 'Pagamento elaborato', category: 'PAYMENT', priority: 'HIGH' },
      
      // PROFESSIONAL
      { code: 'PROFESSIONAL_APPROVED', name: 'Profilo approvato', category: 'PROFESSIONAL', priority: 'HIGH' },
      { code: 'PROFESSIONAL_SUSPENDED', name: 'Profilo sospeso', category: 'PROFESSIONAL', priority: 'HIGH' },
      { code: 'SKILL_ADDED', name: 'Competenza aggiunta', category: 'PROFESSIONAL', priority: 'LOW' },
      { code: 'SKILL_REMOVED', name: 'Competenza rimossa', category: 'PROFESSIONAL', priority: 'LOW' },
      { code: 'REVIEW_RECEIVED', name: 'Nuova recensione', category: 'PROFESSIONAL', priority: 'MEDIUM' },
      
      // SYSTEM - SISTEMA
      { code: 'SYSTEM_MAINTENANCE', name: 'Manutenzione sistema', category: 'SYSTEM', priority: 'HIGH' },
      { code: 'SYSTEM_UPDATE', name: 'Aggiornamento sistema', category: 'SYSTEM', priority: 'MEDIUM' },
      { code: 'BACKUP_COMPLETED', name: 'Backup completato', category: 'SYSTEM', priority: 'LOW' },
      { code: 'BACKUP_FAILED', name: 'Backup fallito', category: 'SYSTEM', priority: 'HIGH' }
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
          defaultChannels: t.category === 'CHAT' ? ['websocket'] : ['email', 'websocket'],
          isActive: true,
          priority: t.priority,
          updatedAt: new Date()
        }
      })
      console.log(`✅ ${t.code}`)
    }

    // 3. TEMPLATES EMAIL COMPLETI
    console.log('\n📝 Creazione template email completi...')
    
    const emailChannel = await prisma.notificationChannel.findFirst({ where: { name: 'email' } })
    const wsChannel = await prisma.notificationChannel.findFirst({ where: { name: 'websocket' } })
    
    if (!emailChannel || !wsChannel) {
      console.log('❌ Canali non trovati')
      return
    }

    // Template HTML professionali
    const templates = [
      {
        typeCode: 'USER_REGISTERED',
        channelId: emailChannel.id,
        subject: '🎉 Benvenuto in Richiesta Assistenza!',
        bodyHtml: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Benvenuto {{fullName}}!</h1>
            </div>
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #333;">Il tuo account è stato creato con successo! 🎊</h2>
              <p>Ora puoi iniziare a utilizzare la nostra piattaforma per trovare professionisti qualificati nella tua zona.</p>
              <p><strong>I tuoi vantaggi:</strong></p>
              <ul>
                <li>✅ Accesso a migliaia di professionisti verificati</li>
                <li>✅ Preventivi gratuiti e comparabili</li>
                <li>✅ Pagamenti sicuri e garantiti</li>
                <li>✅ Assistenza clienti 24/7</li>
              </ul>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{appUrl}}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Inizia ora</a>
              </div>
            </div>
          </div>
        `,
        bodyText: 'Benvenuto {{fullName}}! Il tuo account è stato creato. Inizia ora su {{appUrl}}'
      },
      {
        typeCode: 'REQUEST_CREATED',
        channelId: emailChannel.id,
        subject: '📋 Richiesta #{{requestId}} creata con successo',
        bodyHtml: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0;">
            <div style="background: #28a745; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">Richiesta Creata!</h1>
            </div>
            <div style="padding: 30px;">
              <h2>{{requestTitle}}</h2>
              <p><strong>ID Richiesta:</strong> #{{requestId}}</p>
              <p><strong>Categoria:</strong> {{categoryName}}</p>
              <p><strong>Priorità:</strong> {{priority}}</p>
              <p><strong>Indirizzo:</strong> {{address}}</p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3>Cosa succede ora?</h3>
                <p>1. ✅ La tua richiesta è stata pubblicata</p>
                <p>2. 🔍 I professionisti nella tua zona la vedranno</p>
                <p>3. 💰 Riceverai preventivi entro 24 ore</p>
                <p>4. 🤝 Scegli il professionista migliore</p>
              </div>
              
              <div style="text-align: center;">
                <a href="{{requestUrl}}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">Visualizza Richiesta</a>
              </div>
            </div>
          </div>
        `,
        bodyText: 'Richiesta {{requestTitle}} creata con ID #{{requestId}}. Visualizza su {{requestUrl}}'
      },
      {
        typeCode: 'QUOTE_CREATED',
        channelId: emailChannel.id,
        subject: '💰 Nuovo preventivo ricevuto - €{{amount}}',
        bodyHtml: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0;">
            <div style="background: #17a2b8; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">Nuovo Preventivo!</h1>
            </div>
            <div style="padding: 30px;">
              <h2>{{professionalName}} ha inviato un preventivo</h2>
              
              <div style="background: #e8f4fd; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
                <h3 style="color: #17a2b8; font-size: 32px; margin: 0;">€{{amount}}</h3>
                <p style="margin: 5px 0;">Prezzo totale</p>
              </div>
              
              <p><strong>Per:</strong> {{requestTitle}}</p>
              <p><strong>Validità:</strong> {{validUntil}}</p>
              
              <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Descrizione:</strong></p>
                <p>{{quoteDescription}}</p>
              </div>
              
              <div style="text-align: center;">
                <a href="{{quoteUrl}}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Accetta Preventivo</a>
                <a href="{{requestUrl}}" style="background: #6c757d; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">Visualizza Dettagli</a>
              </div>
            </div>
          </div>
        `,
        bodyText: 'Nuovo preventivo da {{professionalName}}: €{{amount}}. Visualizza su {{quoteUrl}}'
      },
      {
        typeCode: 'PAYMENT_RECEIVED',
        channelId: emailChannel.id,
        subject: '✅ Pagamento ricevuto - €{{amount}}',
        bodyHtml: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0;">
            <div style="background: #28a745; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">Pagamento Confermato!</h1>
            </div>
            <div style="padding: 30px;">
              <div style="text-align: center; margin: 20px 0;">
                <div style="background: #d4edda; color: #155724; padding: 20px; border-radius: 10px; border: 1px solid #c3e6cb;">
                  <h2 style="margin: 0; font-size: 24px;">€{{amount}}</h2>
                  <p style="margin: 5px 0;">Pagamento ricevuto</p>
                </div>
              </div>
              
              <p><strong>Riferimento:</strong> {{paymentReference}}</p>
              <p><strong>Data:</strong> {{paymentDate}}</p>
              <p><strong>Metodo:</strong> {{paymentMethod}}</p>
              
              <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3>Cosa succede ora?</h3>
                <p>Il professionista può ora procedere con i lavori. Riceverai aggiornamenti sul progresso.</p>
              </div>
              
              <div style="text-align: center;">
                <a href="{{receiptUrl}}" style="background: #17a2b8; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">Scarica Ricevuta</a>
              </div>
            </div>
          </div>
        `,
        bodyText: 'Pagamento di €{{amount}} ricevuto. Ricevuta disponibile su {{receiptUrl}}'
      },
      {
        typeCode: 'PROFESSIONAL_APPROVED',
        channelId: emailChannel.id,
        subject: '🎉 Profilo professionale approvato!',
        bodyHtml: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0;">
            <div style="background: #ffc107; padding: 20px; text-align: center;">
              <h1 style="color: #212529; margin: 0;">Congratulazioni!</h1>
            </div>
            <div style="padding: 30px;">
              <h2>Il tuo profilo professionale è stato approvato! 🎊</h2>
              <p>Ora sei ufficialmente parte della nostra rete di professionisti verificati.</p>
              
              <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border: 1px solid #ffeaa7; margin: 20px 0;">
                <h3>I tuoi vantaggi:</h3>
                <ul>
                  <li>✅ Accesso a richieste di assistenza nella tua zona</li>
                  <li>✅ Sistema di preventivi integrato</li>
                  <li>✅ Pagamenti sicuri e garantiti</li>
                  <li>✅ Calendario appuntamenti sincronizzato</li>
                  <li>✅ Supporto tecnico dedicato</li>
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="{{dashboardUrl}}" style="background: #ffc107; color: #212529; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Accedi alla Dashboard</a>
              </div>
            </div>
          </div>
        `,
        bodyText: 'Profilo approvato! Accedi alla dashboard su {{dashboardUrl}}'
      },
      {
        typeCode: 'CHAT_MESSAGE_CLIENT',
        channelId: wsChannel.id,
        subject: '',
        bodyHtml: '',
        bodyText: 'Nuovo messaggio da {{senderName}}: {{messageText}}'
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

    // REPORT FINALE
    const totals = {
      channels: await prisma.notificationChannel.count(),
      types: await prisma.notificationType.count(),
      templates: await prisma.notificationTemplate.count()
    }

    console.log(`
===========================================
📊 SISTEMA NOTIFICHE CREATO:
- Canali: ${totals.channels}
- Tipi: ${totals.types} (40+ tipi completi!)
- Template: ${totals.templates}
===========================================
`)

  } catch (error) {
    console.error('❌ Errore seeding notifiche:', error)
  }
}

function extractVars(text: string): string[] {
  const matches = text.match(/{{(\w+)}}/g) || []
  return [...new Set(matches.map(m => m.replace(/[{}]/g, '')))]
}
