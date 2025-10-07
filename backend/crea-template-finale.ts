import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function creaTemplateFinale() {
  console.log('\n📋 CREAZIONE DEFINITIVA TEMPLATE NOTIFICHE\n')
  console.log('='.repeat(60))
  
  try {
    // TEMPLATE CON TUTTI I CAMPI RICHIESTI DALLO SCHEMA
    const templates = [
      // AUTH
      { 
        code: 'welcome_user', 
        name: 'Benvenuto nuovo utente', 
        category: 'AUTH',
        htmlContent: '<h2>Benvenuto {{fullName}}!</h2><p>Il tuo account è stato creato. <a href="{{verificationUrl}}">Verifica email</a></p>',
        textContent: 'Benvenuto {{fullName}}! Verifica: {{verificationUrl}}',
        subject: '🎉 Benvenuto in Richiesta Assistenza!',
        channels: ['email', 'websocket']
      },
      { 
        code: 'user_deleted', 
        name: 'Account cancellato', 
        category: 'AUTH',
        htmlContent: '<p>Ciao {{fullName}}, il tuo account è stato cancellato.</p>',
        textContent: 'Account cancellato. Arrivederci {{fullName}}.',
        subject: 'Account cancellato',
        channels: ['email']
      },
      { 
        code: 'password_reset', 
        name: 'Reset password', 
        category: 'AUTH',
        htmlContent: '<p>Reset password richiesto. <a href="{{resetUrl}}">Clicca qui</a></p>',
        textContent: 'Reset password: {{resetUrl}}',
        subject: '🔐 Reset Password',
        channels: ['email']
      },
      { 
        code: 'email_verification', 
        name: 'Verifica email', 
        category: 'AUTH',
        htmlContent: '<p>Verifica la tua email: <a href="{{verificationUrl}}">Clicca qui</a></p>',
        textContent: 'Verifica: {{verificationUrl}}',
        subject: '📧 Verifica email',
        channels: ['email']
      },
      
      // REQUEST
      { 
        code: 'request_created_client', 
        name: 'Nuova richiesta (cliente)', 
        category: 'REQUEST',
        htmlContent: '<h3>Richiesta #{{requestId}} creata</h3><p>{{requestTitle}}</p>',
        textContent: 'Richiesta {{requestTitle}} creata. ID: #{{requestId}}',
        subject: '✅ Richiesta creata',
        channels: ['email', 'websocket']
      },
      { 
        code: 'request_modified_client', 
        name: 'Modifica richiesta (cliente)', 
        category: 'REQUEST',
        htmlContent: '<p>La tua richiesta {{requestTitle}} è stata modificata.</p>',
        textContent: 'Richiesta {{requestTitle}} modificata',
        subject: '📝 Richiesta modificata',
        channels: ['email', 'websocket']
      },
      { 
        code: 'request_modified_professional', 
        name: 'Modifica richiesta (professionista)', 
        category: 'REQUEST',
        htmlContent: '<p>Il cliente ha modificato: {{requestTitle}}</p>',
        textContent: 'Cliente ha modificato: {{requestTitle}}',
        subject: '📝 Modifica richiesta',
        channels: ['email', 'websocket']
      },
      { 
        code: 'request_closed_client', 
        name: 'Chiusura richiesta (cliente)', 
        category: 'REQUEST',
        htmlContent: '<h3>Servizio completato!</h3><p>{{requestTitle}}</p>',
        textContent: 'Servizio {{requestTitle}} completato!',
        subject: '✅ Servizio completato',
        channels: ['email', 'websocket']
      },
      { 
        code: 'request_closed_professional', 
        name: 'Chiusura richiesta (professionista)', 
        category: 'REQUEST',
        htmlContent: '<p>Richiesta {{requestTitle}} chiusa. Importo: €{{totalAmount}}</p>',
        textContent: 'Richiesta chiusa. €{{totalAmount}}',
        subject: '✅ Richiesta chiusa',
        channels: ['email']
      },
      { 
        code: 'request_assigned_client', 
        name: 'Assegnazione professionista', 
        category: 'REQUEST',
        htmlContent: '<p>{{professionalName}} assegnato. Tel: {{professionalPhone}}</p>',
        textContent: '{{professionalName}} assegnato. Tel: {{professionalPhone}}',
        smsContent: 'Professionista {{professionalName}} assegnato. Tel: {{professionalPhone}}',
        subject: '👷 Professionista assegnato',
        channels: ['email', 'websocket', 'sms']
      },
      { 
        code: 'request_assigned_professional', 
        name: 'Nuova richiesta assegnata', 
        category: 'REQUEST',
        htmlContent: '<h3>Nuova richiesta!</h3><p>{{requestTitle}} da {{clientName}}</p>',
        textContent: 'Nuova richiesta da {{clientName}} - {{clientPhone}}',
        smsContent: 'Nuova richiesta: {{requestTitle}}. Cliente: {{clientPhone}}',
        subject: '🔔 Nuova richiesta',
        channels: ['email', 'websocket', 'sms']
      },
      { 
        code: 'request_status_changed', 
        name: 'Cambio stato richiesta', 
        category: 'REQUEST',
        htmlContent: '<p>Richiesta {{requestTitle}} ora: {{newStatus}}</p>',
        textContent: 'Richiesta ora: {{newStatus}}',
        subject: '🔄 Cambio stato',
        channels: ['websocket']
      },
      
      // QUOTE
      { 
        code: 'quote_received', 
        name: 'Nuovo preventivo ricevuto', 
        category: 'QUOTE',
        htmlContent: '<h3>Preventivo ricevuto</h3><p>€{{quoteAmount}} da {{professionalName}}</p>',
        textContent: 'Preventivo €{{quoteAmount}} da {{professionalName}}',
        subject: '💰 Nuovo preventivo',
        channels: ['email', 'websocket']
      },
      { 
        code: 'quote_modified', 
        name: 'Preventivo modificato', 
        category: 'QUOTE',
        htmlContent: '<p>Preventivo modificato. Nuovo importo: €{{newAmount}}</p>',
        textContent: 'Preventivo modificato: €{{newAmount}}',
        subject: '📝 Preventivo modificato',
        channels: ['email']
      },
      { 
        code: 'quote_accepted_professional', 
        name: 'Preventivo accettato', 
        category: 'QUOTE',
        htmlContent: '<h3>Preventivo accettato!</h3><p>Contatta {{clientName}}: {{clientPhone}}</p>',
        textContent: 'Preventivo accettato! Tel: {{clientPhone}}',
        smsContent: '✅ Preventivo accettato! Tel: {{clientPhone}}',
        subject: '✅ Preventivo accettato!',
        channels: ['email', 'websocket', 'sms']
      },
      { 
        code: 'quote_rejected_professional', 
        name: 'Preventivo rifiutato', 
        category: 'QUOTE',
        htmlContent: '<p>Preventivo rifiutato. Motivo: {{rejectionReason}}</p>',
        textContent: 'Preventivo rifiutato: {{rejectionReason}}',
        subject: '❌ Preventivo rifiutato',
        channels: ['email']
      },
      
      // CHAT
      { 
        code: 'chat_message_client', 
        name: 'Nuovo messaggio (cliente)', 
        category: 'CHAT',
        htmlContent: '<p>{{professionalName}}: {{messagePreview}}</p>',
        textContent: '{{professionalName}}: {{messagePreview}}',
        subject: '💬 Nuovo messaggio',
        channels: ['websocket', 'email']
      },
      { 
        code: 'chat_message_professional', 
        name: 'Nuovo messaggio (professionista)', 
        category: 'CHAT',
        htmlContent: '<p>{{clientName}}: {{messagePreview}}</p>',
        textContent: '{{clientName}}: {{messagePreview}}',
        subject: '💬 Nuovo messaggio',
        channels: ['websocket', 'email']
      },
      
      // PROFESSIONAL
      { 
        code: 'skill_added', 
        name: 'Nuova competenza aggiunta', 
        category: 'PROFESSIONAL',
        htmlContent: '<p>Competenza {{skillName}} aggiunta al tuo profilo.</p>',
        textContent: 'Competenza {{skillName}} aggiunta',
        subject: '✅ Competenza aggiunta',
        channels: ['email']
      },
      { 
        code: 'skill_revoked', 
        name: 'Competenza revocata', 
        category: 'PROFESSIONAL',
        htmlContent: '<p>Competenza {{skillName}} rimossa.</p>',
        textContent: 'Competenza {{skillName}} rimossa',
        subject: '❌ Competenza rimossa',
        channels: ['email']
      },
      
      // PAYMENT
      { 
        code: 'payment_success', 
        name: 'Pagamento completato', 
        category: 'PAYMENT',
        htmlContent: '<h3>Pagamento ricevuto</h3><p>€{{amount}} per {{requestTitle}}</p>',
        textContent: 'Pagamento €{{amount}} ricevuto',
        subject: '✅ Pagamento ricevuto',
        channels: ['email', 'websocket']
      },
      { 
        code: 'payment_failed', 
        name: 'Pagamento fallito', 
        category: 'PAYMENT',
        htmlContent: '<p>Pagamento €{{amount}} fallito: {{failureReason}}</p>',
        textContent: 'Pagamento fallito: {{failureReason}}',
        subject: '❌ Pagamento fallito',
        channels: ['email']
      },
      { 
        code: 'deposit_required', 
        name: 'Richiesta deposito', 
        category: 'PAYMENT',
        htmlContent: '<p>Deposito €{{depositAmount}} richiesto entro {{depositDeadline}}</p>',
        textContent: 'Deposito €{{depositAmount}} richiesto',
        subject: '💳 Deposito richiesto',
        channels: ['email']
      }
    ]
    
    // CREA I TEMPLATE
    console.log('📝 Creazione template con schema corretto...\n')
    let created = 0
    let skipped = 0
    
    for (const tmpl of templates) {
      try {
        // Estrai variabili dal contenuto
        const allText = (tmpl.htmlContent || '') + (tmpl.textContent || '') + 
                       (tmpl.smsContent || '') + (tmpl.subject || '')
        const matches = allText.match(/{{(\w+)}}/g) || []
        const variables = [...new Set(matches.map(m => m.replace(/[{}]/g, '')))]
          .map(v => ({ name: v, description: v, required: true }))
        
        await prisma.notificationTemplate.create({
          data: {
            id: uuidv4(),
            code: tmpl.code,
            name: tmpl.name,
            description: tmpl.name,
            category: tmpl.category,
            subject: tmpl.subject,
            htmlContent: tmpl.htmlContent,
            textContent: tmpl.textContent,
            smsContent: tmpl.smsContent || null,
            whatsappContent: null,
            variables: variables,
            channels: tmpl.channels,
            priority: tmpl.category === 'PAYMENT' ? 'HIGH' : 'NORMAL',
            isActive: true,
            isSystem: true
          }
        })
        
        console.log(`✅ ${tmpl.code}`)
        created++
        
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`⚠️  ${tmpl.code} già esistente`)
          skipped++
        } else {
          console.log(`❌ Errore ${tmpl.code}:`, error.message?.substring(0, 50))
        }
      }
    }
    
    // VERIFICA FINALE
    console.log('\n' + '='.repeat(60))
    console.log('📊 REPORT FINALE')
    console.log('='.repeat(60))
    
    const totalTemplates = await prisma.notificationTemplate.count()
    const activeTemplates = await prisma.notificationTemplate.count({
      where: { isActive: true }
    })
    
    console.log(`
✅ Template creati: ${created}
⚠️  Template già esistenti: ${skipped}
📊 Template totali nel database: ${totalTemplates}
✅ Template attivi: ${activeTemplates}

🎉 SISTEMA NOTIFICHE COMPLETAMENTE CONFIGURATO!

I template sono ora disponibili per essere visualizzati nel frontend
nella sezione profilo del professionista.
`)
    
  } catch (error) {
    console.error('❌ Errore generale:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Esegui
creaTemplateFinale()
