import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function creaTemplateCorretto() {
  console.log('\n📋 CREAZIONE TEMPLATE NOTIFICHE CON CAMPO CODE\n')
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
    
    // TEMPLATE CON CAMPO CODE OBBLIGATORIO
    const templates = [
      // AUTH
      { code: 'welcome_user', name: 'Benvenuto nuovo utente', channelId: emailChannel.id, 
        subject: '🎉 Benvenuto in Richiesta Assistenza!', 
        bodyText: 'Benvenuto {{fullName}}! Verifica email: {{verificationUrl}}' },
      
      { code: 'user_deleted', name: 'Cancellazione utente', channelId: emailChannel.id,
        subject: 'Account cancellato', 
        bodyText: 'Il tuo account è stato cancellato. Arrivederci {{fullName}}.' },
      
      { code: 'password_reset', name: 'Reset password', channelId: emailChannel.id,
        subject: '🔐 Reset Password Richiesto', 
        bodyText: 'Reset password: {{resetUrl}}' },
      
      { code: 'email_verification', name: 'Verifica email', channelId: emailChannel.id,
        subject: '📧 Verifica il tuo indirizzo email', 
        bodyText: 'Verifica email: {{verificationUrl}}' },
      
      // REQUEST  
      { code: 'request_created_client', name: 'Nuova richiesta (cliente)', channelId: emailChannel.id,
        subject: '✅ Richiesta #{{requestId}} creata', 
        bodyText: 'Richiesta {{requestTitle}} creata. ID: #{{requestId}}' },
      
      { code: 'request_created_client_ws', name: 'Nuova richiesta (cliente)', channelId: wsChannel?.id,
        subject: '', bodyText: 'Richiesta creata: {{requestTitle}}' },
      
      { code: 'request_modified_client', name: 'Modifica richiesta (cliente)', channelId: emailChannel.id,
        subject: '📝 Richiesta modificata', 
        bodyText: 'Richiesta {{requestTitle}} modificata' },
      
      { code: 'request_modified_professional', name: 'Modifica richiesta (prof)', channelId: emailChannel.id,
        subject: '📝 Cliente ha modificato richiesta', 
        bodyText: 'Cliente ha modificato: {{requestTitle}}' },
      
      { code: 'request_closed_client', name: 'Chiusura richiesta (cliente)', channelId: emailChannel.id,
        subject: '✅ Servizio completato', 
        bodyText: 'Servizio {{requestTitle}} completato!' },
      
      { code: 'request_closed_professional', name: 'Chiusura richiesta (prof)', channelId: emailChannel.id,
        subject: '✅ Richiesta chiusa', 
        bodyText: 'Richiesta {{requestTitle}} chiusa. €{{totalAmount}}' },
      
      { code: 'request_assigned_client', name: 'Assegnazione professionista', channelId: emailChannel.id,
        subject: '👷 Professionista assegnato', 
        bodyText: '{{professionalName}} assegnato. Tel: {{professionalPhone}}' },
      
      { code: 'request_assigned_client_sms', name: 'Assegnazione professionista', channelId: smsChannel?.id,
        subject: '', 
        bodyText: 'Professionista {{professionalName}} assegnato. Tel: {{professionalPhone}}' },
      
      { code: 'request_assigned_professional', name: 'Nuova richiesta assegnata', channelId: emailChannel.id,
        subject: '🔔 Nuova richiesta: {{requestTitle}}', 
        bodyText: 'Nuova richiesta da {{clientName}} - {{clientPhone}}' },
      
      { code: 'request_assigned_professional_sms', name: 'Nuova richiesta', channelId: smsChannel?.id,
        subject: '', 
        bodyText: 'Nuova richiesta: {{requestTitle}}. Cliente: {{clientPhone}}' },
      
      { code: 'request_status_changed', name: 'Cambio stato richiesta', channelId: wsChannel?.id,
        subject: '', 
        bodyText: 'Richiesta {{requestTitle}} ora: {{newStatus}}' },
      
      // QUOTE
      { code: 'quote_received', name: 'Nuovo preventivo ricevuto', channelId: emailChannel.id,
        subject: '💰 Nuovo preventivo: €{{quoteAmount}}', 
        bodyText: 'Preventivo da {{professionalName}}: €{{quoteAmount}}' },
      
      { code: 'quote_received_ws', name: 'Nuovo preventivo', channelId: wsChannel?.id,
        subject: '', 
        bodyText: 'Nuovo preventivo: €{{quoteAmount}}' },
      
      { code: 'quote_modified', name: 'Preventivo modificato', channelId: emailChannel.id,
        subject: '📝 Preventivo modificato', 
        bodyText: 'Preventivo modificato. Nuovo: €{{newAmount}}' },
      
      { code: 'quote_accepted_professional', name: 'Preventivo accettato', channelId: emailChannel.id,
        subject: '✅ Preventivo accettato!', 
        bodyText: 'Preventivo accettato! Contatta {{clientName}}: {{clientPhone}}' },
      
      { code: 'quote_accepted_professional_sms', name: 'Preventivo accettato', channelId: smsChannel?.id,
        subject: '', 
        bodyText: '✅ Preventivo accettato! Tel: {{clientPhone}}' },
      
      { code: 'quote_rejected_professional', name: 'Preventivo rifiutato', channelId: emailChannel.id,
        subject: '❌ Preventivo rifiutato', 
        bodyText: 'Preventivo rifiutato. Motivo: {{rejectionReason}}' },
      
      // CHAT
      { code: 'chat_message_client', name: 'Nuovo messaggio (cliente)', channelId: wsChannel?.id,
        subject: '', 
        bodyText: '{{professionalName}}: {{messagePreview}}' },
      
      { code: 'chat_message_client_email', name: 'Nuovo messaggio', channelId: emailChannel.id,
        subject: '💬 Messaggio da {{professionalName}}', 
        bodyText: 'Messaggio: {{messagePreview}}' },
      
      { code: 'chat_message_professional', name: 'Nuovo messaggio (prof)', channelId: wsChannel?.id,
        subject: '', 
        bodyText: '{{clientName}}: {{messagePreview}}' },
      
      { code: 'chat_message_professional_email', name: 'Nuovo messaggio', channelId: emailChannel.id,
        subject: '💬 Messaggio da {{clientName}}', 
        bodyText: 'Messaggio: {{messagePreview}}' },
      
      // PROFESSIONAL
      { code: 'skill_added', name: 'Nuova competenza aggiunta', channelId: emailChannel.id,
        subject: '✅ Competenza aggiunta: {{skillName}}', 
        bodyText: 'Competenza {{skillName}} aggiunta al profilo' },
      
      { code: 'skill_revoked', name: 'Competenza revocata', channelId: emailChannel.id,
        subject: '❌ Competenza rimossa: {{skillName}}', 
        bodyText: 'Competenza {{skillName}} rimossa' },
      
      // PAYMENT
      { code: 'payment_success', name: 'Pagamento completato', channelId: emailChannel.id,
        subject: '✅ Pagamento €{{amount}} ricevuto', 
        bodyText: 'Pagamento €{{amount}} ricevuto per {{requestTitle}}' },
      
      { code: 'payment_failed', name: 'Pagamento fallito', channelId: emailChannel.id,
        subject: '❌ Pagamento non riuscito', 
        bodyText: 'Pagamento €{{amount}} fallito. Motivo: {{failureReason}}' },
      
      { code: 'deposit_required', name: 'Richiesta deposito', channelId: emailChannel.id,
        subject: '💳 Deposito richiesto: €{{depositAmount}}', 
        bodyText: 'Deposito €{{depositAmount}} richiesto. Scadenza: {{depositDeadline}}' }
    ]
    
    // CREA I TEMPLATE
    console.log('📝 Creazione template...\n')
    let created = 0
    let skipped = 0
    
    for (const tmpl of templates) {
      if (!tmpl.channelId) continue
      
      try {
        await prisma.notificationTemplate.create({
          data: {
            id: uuidv4(),
            code: tmpl.code, // CAMPO CODE OBBLIGATORIO!
            type: tmpl.code.replace(/_/g, '-'), 
            name: tmpl.name,
            channelId: tmpl.channelId,
            subject: tmpl.subject || '',
            bodyHtml: '', // Aggiungi HTML completo se vuoi
            bodyText: tmpl.bodyText || '',
            variables: extractVars(tmpl.subject + ' ' + tmpl.bodyText),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
        
        console.log(`✅ ${tmpl.code}`)
        created++
        
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`⚠️  ${tmpl.code} già esistente`)
          skipped++
        } else {
          console.log(`❌ Errore ${tmpl.code}:`, error.message)
        }
      }
    }
    
    // VERIFICA FINALE
    console.log('\n' + '='.repeat(60))
    console.log('📊 REPORT FINALE')
    console.log('='.repeat(60))
    
    const totalTemplates = await prisma.notificationTemplate.count()
    
    console.log(`
✅ Template creati: ${created}
⚠️  Template saltati: ${skipped}  
📊 Template totali nel database: ${totalTemplates}

📋 LISTA TEMPLATE DISPONIBILI:

**AUTH**
• welcome_user - Benvenuto nuovo utente
• user_deleted - Cancellazione utente  
• password_reset - Reset password
• email_verification - Verifica email

**REQUEST**
• request_created_client - Nuova richiesta (cliente)
• request_modified_client - Modifica richiesta (cliente)
• request_modified_professional - Modifica richiesta (professionista)
• request_closed_client - Chiusura richiesta (cliente)
• request_closed_professional - Chiusura richiesta (professionista)
• request_assigned_client - Assegnazione professionista
• request_assigned_professional - Nuova richiesta assegnata
• request_status_changed - Cambio stato richiesta

**QUOTE**
• quote_received - Nuovo preventivo ricevuto
• quote_modified - Preventivo modificato
• quote_accepted_professional - Preventivo accettato
• quote_rejected_professional - Preventivo rifiutato

**CHAT**
• chat_message_client - Nuovo messaggio (cliente)
• chat_message_professional - Nuovo messaggio (professionista)

**PROFESSIONAL**
• skill_added - Nuova competenza aggiunta
• skill_revoked - Competenza revocata

**PAYMENT**
• payment_success - Pagamento completato
• payment_failed - Pagamento fallito
• deposit_required - Richiesta deposito

🎉 SISTEMA NOTIFICHE CONFIGURATO!
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
creaTemplateCorretto()
