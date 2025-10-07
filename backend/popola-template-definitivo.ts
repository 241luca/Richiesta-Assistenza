import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function popolaTemplateDefinitivo() {
  console.log('\n🚀 POPOLAMENTO TEMPLATE NOTIFICHE DEFINITIVO\n')
  console.log('='.repeat(60))
  
  try {
    // RECUPERA CANALI
    const emailChannel = await prisma.notificationChannel.findFirst({ where: { code: 'email' } })
    const wsChannel = await prisma.notificationChannel.findFirst({ where: { code: 'websocket' } })
    const smsChannel = await prisma.notificationChannel.findFirst({ where: { code: 'sms' } })
    
    if (!emailChannel) {
      console.log('❌ Canale email non trovato!')
      return
    }
    
    console.log('✅ Canali trovati\n')
    
    // TEMPLATE DA CREARE
    const templates = [
      // REGISTRAZIONE
      {
        code: 'USER_REGISTERED',
        name: 'Benvenuto nuovo utente',
        channels: [
          {
            channelId: emailChannel.id,
            subject: '🎉 Benvenuto in Richiesta Assistenza!',
            bodyHtml: `<h2>Benvenuto {{fullName}}!</h2>
<p>Il tuo account è stato creato con successo.</p>
<p>Email: <strong>{{email}}</strong></p>
<p><a href="{{verificationUrl}}">Verifica la tua email</a></p>`,
            bodyText: 'Benvenuto {{fullName}}! Verifica: {{verificationUrl}}'
          }
        ]
      },
      
      // RICHIESTA CREATA
      {
        code: 'REQUEST_CREATED',
        name: 'Richiesta creata',
        channels: [
          {
            channelId: emailChannel.id,
            subject: '✅ Richiesta #{{requestId}} creata',
            bodyHtml: `<h2>Richiesta Creata!</h2>
<p>Ciao {{clientName}},</p>
<p>La tua richiesta "<strong>{{requestTitle}}</strong>" è stata registrata.</p>
<ul>
  <li>ID: #{{requestId}}</li>
  <li>Categoria: {{categoryName}}</li>
  <li>Indirizzo: {{address}}</li>
</ul>`,
            bodyText: 'Richiesta {{requestTitle}} creata con ID #{{requestId}}'
          },
          {
            channelId: wsChannel?.id,
            subject: '',
            bodyHtml: '',
            bodyText: 'Richiesta creata: {{requestTitle}}'
          }
        ]
      },
      
      // PROFESSIONISTA ASSEGNATO
      {
        code: 'REQUEST_ASSIGNED',
        name: 'Professionista assegnato',
        channels: [
          {
            channelId: emailChannel.id,
            subject: '👷 Professionista assegnato',
            bodyHtml: `<h2>Professionista Assegnato!</h2>
<p>{{professionalName}} gestirà la tua richiesta.</p>
<p>Tel: {{professionalPhone}}</p>`,
            bodyText: '{{professionalName}} assegnato. Tel: {{professionalPhone}}'
          },
          {
            channelId: smsChannel?.id,
            subject: '',
            bodyHtml: '',
            bodyText: 'Professionista {{professionalName}} assegnato. Tel: {{professionalPhone}}'
          }
        ]
      },
      
      // NUOVO PREVENTIVO
      {
        code: 'QUOTE_RECEIVED',
        name: 'Preventivo ricevuto',
        channels: [
          {
            channelId: emailChannel.id,
            subject: '💰 Nuovo preventivo: €{{amount}}',
            bodyHtml: `<h2>Nuovo Preventivo!</h2>
<p>Hai ricevuto un preventivo di <strong>€{{amount}}</strong> da {{professionalName}}</p>
<p>Valido fino al: {{validUntil}}</p>
<p><a href="{{quoteUrl}}">Visualizza preventivo</a></p>`,
            bodyText: 'Nuovo preventivo €{{amount}} da {{professionalName}}'
          }
        ]
      },
      
      // PREVENTIVO ACCETTATO
      {
        code: 'QUOTE_ACCEPTED',
        name: 'Preventivo accettato',
        channels: [
          {
            channelId: emailChannel.id,
            subject: '✅ Preventivo accettato!',
            bodyHtml: `<h2>Preventivo Accettato!</h2>
<p>{{clientName}} ha accettato il tuo preventivo di €{{amount}}</p>
<p>Contatta il cliente: {{clientPhone}}</p>`,
            bodyText: 'Preventivo accettato da {{clientName}}. Tel: {{clientPhone}}'
          },
          {
            channelId: smsChannel?.id,
            subject: '',
            bodyHtml: '',
            bodyText: 'Preventivo accettato! Contatta {{clientName}}: {{clientPhone}}'
          }
        ]
      },
      
      // PAGAMENTO RICEVUTO
      {
        code: 'PAYMENT_RECEIVED',
        name: 'Pagamento ricevuto',
        channels: [
          {
            channelId: emailChannel.id,
            subject: '✅ Pagamento €{{amount}} ricevuto',
            bodyHtml: `<h2>Pagamento Ricevuto!</h2>
<p>Importo: <strong>€{{amount}}</strong></p>
<p>Cliente: {{clientName}}</p>
<p>ID Transazione: {{transactionId}}</p>`,
            bodyText: 'Pagamento €{{amount}} ricevuto da {{clientName}}'
          }
        ]
      },
      
      // SERVIZIO COMPLETATO
      {
        code: 'REQUEST_COMPLETED',
        name: 'Servizio completato',
        channels: [
          {
            channelId: emailChannel.id,
            subject: '✅ Servizio completato',
            bodyHtml: `<h2>Servizio Completato!</h2>
<p>Il servizio "{{requestTitle}}" è stato completato.</p>
<p>Professionista: {{professionalName}}</p>
<p><a href="{{reviewUrl}}">Lascia una recensione</a></p>`,
            bodyText: 'Servizio {{requestTitle}} completato. Lascia una recensione!'
          }
        ]
      },
      
      // PROMEMORIA
      {
        code: 'APPOINTMENT_REMINDER',
        name: 'Promemoria appuntamento',
        channels: [
          {
            channelId: smsChannel?.id,
            subject: '',
            bodyHtml: '',
            bodyText: 'Promemoria: {{requestTitle}} domani ore {{time}} in {{address}}'
          },
          {
            channelId: emailChannel.id,
            subject: '⏰ Promemoria appuntamento domani',
            bodyHtml: `<h2>Promemoria</h2>
<p>Appuntamento domani:</p>
<ul>
  <li>Servizio: {{requestTitle}}</li>
  <li>Ora: {{time}}</li>
  <li>Indirizzo: {{address}}</li>
</ul>`,
            bodyText: 'Promemoria: {{requestTitle}} domani ore {{time}}'
          }
        ]
      },
      
      // RESET PASSWORD
      {
        code: 'PASSWORD_RESET',
        name: 'Reset password',
        channels: [
          {
            channelId: emailChannel.id,
            subject: '🔐 Reset password richiesto',
            bodyHtml: `<h2>Reset Password</h2>
<p>Hai richiesto di reimpostare la password.</p>
<p><a href="{{resetUrl}}">Clicca qui per reimpostarla</a></p>
<p>Il link scade tra 24 ore.</p>`,
            bodyText: 'Reset password: {{resetUrl}}'
          }
        ]
      },
      
      // NUOVO MESSAGGIO
      {
        code: 'NEW_MESSAGE',
        name: 'Nuovo messaggio',
        channels: [
          {
            channelId: wsChannel?.id,
            subject: '',
            bodyHtml: '',
            bodyText: '{{senderName}}: {{messagePreview}}'
          },
          {
            channelId: emailChannel.id,
            subject: '💬 Nuovo messaggio da {{senderName}}',
            bodyHtml: `<p><strong>{{senderName}}</strong> ti ha scritto:</p>
<blockquote>{{messageContent}}</blockquote>
<p><a href="{{chatUrl}}">Rispondi</a></p>`,
            bodyText: 'Messaggio da {{senderName}}: {{messagePreview}}'
          }
        ]
      }
    ]
    
    // CREA I TEMPLATE
    console.log('📝 Creazione template...\n')
    
    for (const tmpl of templates) {
      // Per ogni template, crea le versioni per ogni canale
      for (const channel of tmpl.channels) {
        if (!channel.channelId) continue
        
        try {
          await prisma.notificationTemplate.create({
            data: {
              id: uuidv4(),
              type: tmpl.code,
              name: tmpl.name,
              channelId: channel.channelId,
              subject: channel.subject || '',
              bodyHtml: channel.bodyHtml || '',
              bodyText: channel.bodyText || '',
              variables: extractVars(
                (channel.subject || '') + 
                (channel.bodyHtml || '') + 
                (channel.bodyText || '')
              ),
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          })
          
          const channelName = channel.channelId === emailChannel.id ? 'email' : 
                             channel.channelId === wsChannel?.id ? 'websocket' : 'sms'
          console.log(`✅ ${tmpl.code} (${channelName})`)
          
        } catch (error: any) {
          if (error.code === 'P2002') {
            console.log(`⚠️  ${tmpl.code} già esistente`)
          } else {
            console.log(`❌ Errore ${tmpl.code}:`, error.message)
          }
        }
      }
    }
    
    // VERIFICA FINALE
    console.log('\n' + '='.repeat(60))
    console.log('📊 VERIFICA FINALE')
    console.log('='.repeat(60))
    
    const totalTemplates = await prisma.notificationTemplate.count()
    const activeTemplates = await prisma.notificationTemplate.count({
      where: { isActive: true }
    })
    
    // Conta per tipo
    const templatesByType = await prisma.notificationTemplate.groupBy({
      by: ['type'],
      _count: true
    })
    
    console.log(`
✅ Template totali: ${totalTemplates}
✅ Template attivi: ${activeTemplates}

📧 TEMPLATE PER TIPO:`)
    
    templatesByType.forEach(t => {
      console.log(`   - ${t.type}: ${t._count} versioni`)
    })
    
    console.log(`
🎉 SISTEMA NOTIFICHE COMPLETAMENTE CONFIGURATO!
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
popolaTemplateDefinitivo()
