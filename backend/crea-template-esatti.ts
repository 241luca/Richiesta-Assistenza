import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function creaTemplateEsatti() {
  console.log('\n📋 CREAZIONE TEMPLATE ESATTI COME DA LISTA\n')
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
    
    // TEMPLATE ESATTI COME RICHIESTI
    const templates = [
      // ==================== AUTH ====================
      {
        type: 'welcome_user',
        name: 'Benvenuto nuovo utente',
        category: 'AUTH',
        channels: [{
          channelId: emailChannel.id,
          subject: '🎉 Benvenuto in Richiesta Assistenza, {{fullName}}!',
          bodyHtml: `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #3B82F6;">Benvenuto {{fullName}}!</h1>
    <p>Il tuo account è stato creato con successo.</p>
    <p>Email registrata: <strong>{{email}}</strong></p>
    <p>Per attivare il tuo account, verifica la tua email:</p>
    <p style="text-align: center;">
      <a href="{{verificationUrl}}" style="background:#3B82F6;color:white;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;">Verifica Email</a>
    </p>
    <p>Grazie per aver scelto Richiesta Assistenza!</p>
  </div>
</body>
</html>`,
          bodyText: 'Benvenuto {{fullName}}! Verifica la tua email: {{verificationUrl}}'
        }]
      },
      
      {
        type: 'user_deleted',
        name: 'Cancellazione utente',
        category: 'AUTH',
        channels: [{
          channelId: emailChannel.id,
          subject: 'Account cancellato - Richiesta Assistenza',
          bodyHtml: `<div style="max-width:600px;margin:0 auto;">
<h2>Account Cancellato</h2>
<p>Ciao {{fullName}},</p>
<p>Il tuo account è stato cancellato con successo.</p>
<p>Tutti i tuoi dati sono stati rimossi dal nostro sistema.</p>
<p>Ci dispiace vederti andare via. Se cambi idea, potrai sempre registrarti di nuovo.</p>
</div>`,
          bodyText: 'Il tuo account è stato cancellato. Arrivederci {{fullName}}.'
        }]
      },
      
      {
        type: 'password_reset',
        name: 'Reset password',
        category: 'AUTH',
        channels: [{
          channelId: emailChannel.id,
          subject: '🔐 Reset Password Richiesto',
          bodyHtml: `<div style="max-width:600px;margin:0 auto;">
<h2>Reset Password</h2>
<p>Ciao {{fullName}},</p>
<p>Hai richiesto di reimpostare la tua password.</p>
<p>Clicca sul pulsante qui sotto per creare una nuova password:</p>
<p style="text-align:center;">
  <a href="{{resetUrl}}" style="background:#EF4444;color:white;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;">Reset Password</a>
</p>
<p>Questo link scadrà tra 24 ore.</p>
<p>Se non hai richiesto tu il reset, ignora questa email.</p>
</div>`,
          bodyText: 'Reset password richiesto. Link: {{resetUrl}} (scade tra 24h)'
        }]
      },
      
      {
        type: 'email_verification',
        name: 'Verifica email',
        category: 'AUTH',
        channels: [{
          channelId: emailChannel.id,
          subject: '📧 Verifica il tuo indirizzo email',
          bodyHtml: `<div style="max-width:600px;margin:0 auto;">
<h2>Verifica Email</h2>
<p>Ciao {{fullName}},</p>
<p>Per completare la registrazione, verifica il tuo indirizzo email.</p>
<p style="text-align:center;">
  <a href="{{verificationUrl}}" style="background:#10B981;color:white;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;">Verifica Email</a>
</p>
<p>Il link scadrà tra 48 ore.</p>
</div>`,
          bodyText: 'Verifica la tua email: {{verificationUrl}}'
        }]
      },
      
      // ==================== REQUEST ====================
      {
        type: 'request_created_client',
        name: 'Nuova richiesta (cliente)',
        category: 'REQUEST',
        channels: [{
          channelId: emailChannel.id,
          subject: '✅ Richiesta #{{requestId}} creata con successo',
          bodyHtml: `<div style="max-width:600px;margin:0 auto;">
<h2 style="color:#10B981;">Richiesta Creata!</h2>
<p>Ciao {{clientName}},</p>
<p>La tua richiesta "<strong>{{requestTitle}}</strong>" è stata creata con successo.</p>
<div style="background:#F3F4F6;padding:15px;border-radius:8px;margin:20px 0;">
  <h3>Dettagli:</h3>
  <ul>
    <li>ID Richiesta: #{{requestId}}</li>
    <li>Categoria: {{categoryName}}</li>
    <li>Priorità: {{priority}}</li>
    <li>Indirizzo: {{address}}, {{city}}</li>
    <li>Data prevista: {{scheduledDate}}</li>
  </ul>
</div>
<p>Ti assegneremo un professionista qualificato al più presto.</p>
</div>`,
          bodyText: 'Richiesta {{requestTitle}} creata. ID: #{{requestId}}'
        },
        {
          channelId: wsChannel?.id,
          subject: '',
          bodyHtml: '',
          bodyText: 'Richiesta creata: {{requestTitle}}'
        }]
      },
      
      {
        type: 'request_modified_client',
        name: 'Modifica richiesta (cliente)',
        category: 'REQUEST',
        channels: [{
          channelId: emailChannel.id,
          subject: '📝 Richiesta #{{requestId}} modificata',
          bodyHtml: `<div style="max-width:600px;margin:0 auto;">
<h2>Richiesta Modificata</h2>
<p>Ciao {{clientName}},</p>
<p>La tua richiesta "<strong>{{requestTitle}}</strong>" è stata modificata.</p>
<p>Modifiche apportate: {{modificationDetails}}</p>
<p><a href="{{requestUrl}}">Visualizza richiesta aggiornata</a></p>
</div>`,
          bodyText: 'Richiesta {{requestTitle}} modificata. Dettagli: {{modificationDetails}}'
        }]
      },
      
      {
        type: 'request_modified_professional',
        name: 'Modifica richiesta (professionista)',
        category: 'REQUEST',
        channels: [{
          channelId: emailChannel.id,
          subject: '📝 Richiesta #{{requestId}} modificata dal cliente',
          bodyHtml: `<div style="max-width:600px;margin:0 auto;">
<h2>Modifica Richiesta</h2>
<p>Ciao {{professionalName}},</p>
<p>Il cliente ha modificato la richiesta "<strong>{{requestTitle}}</strong>".</p>
<p>Modifiche: {{modificationDetails}}</p>
<p>Verifica se devi aggiornare il tuo preventivo.</p>
<p><a href="{{requestUrl}}">Visualizza modifiche</a></p>
</div>`,
          bodyText: 'Cliente ha modificato: {{requestTitle}}. Verifica il preventivo.'
        }]
      },
      
      {
        type: 'request_closed_client',
        name: 'Chiusura richiesta (cliente)',
        category: 'REQUEST',
        channels: [{
          channelId: emailChannel.id,
          subject: '✅ Richiesta #{{requestId}} completata',
          bodyHtml: `<div style="max-width:600px;margin:0 auto;">
<h2 style="color:#10B981;">Servizio Completato!</h2>
<p>Ciao {{clientName}},</p>
<p>Il servizio per "<strong>{{requestTitle}}</strong>" è stato completato.</p>
<p>Professionista: {{professionalName}}</p>
<p>Durata: {{actualHours}} ore</p>
<p>Importo totale: €{{totalAmount}}</p>
<p style="text-align:center;">
  <a href="{{reviewUrl}}" style="background:#F59E0B;color:white;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;">Lascia una Recensione</a>
</p>
</div>`,
          bodyText: 'Servizio {{requestTitle}} completato. Lascia una recensione!'
        }]
      },
      
      {
        type: 'request_closed_professional',
        name: 'Chiusura richiesta (professionista)',
        category: 'REQUEST',
        channels: [{
          channelId: emailChannel.id,
          subject: '✅ Richiesta #{{requestId}} chiusa',
          bodyHtml: `<div style="max-width:600px;margin:0 auto;">
<h2>Richiesta Chiusa</h2>
<p>Ciao {{professionalName}},</p>
<p>La richiesta "<strong>{{requestTitle}}</strong>" è stata chiusa.</p>
<p>Cliente: {{clientName}}</p>
<p>Ore lavorate: {{actualHours}}</p>
<p>Importo fatturato: €{{totalAmount}}</p>
<p>Il pagamento sarà processato entro 2-3 giorni lavorativi.</p>
</div>`,
          bodyText: 'Richiesta {{requestTitle}} chiusa. Importo: €{{totalAmount}}'
        }]
      },
      
      {
        type: 'request_assigned_client',
        name: 'Assegnazione professionista',
        category: 'REQUEST',
        channels: [{
          channelId: emailChannel.id,
          subject: '👷 Professionista assegnato alla tua richiesta',
          bodyHtml: `<div style="max-width:600px;margin:0 auto;">
<h2 style="color:#3B82F6;">Professionista Assegnato!</h2>
<p>Ciao {{clientName}},</p>
<p><strong>{{professionalName}}</strong> gestirà la tua richiesta.</p>
<div style="background:#E0E7FF;padding:15px;border-radius:8px;">
  <h3>Contatti Professionista:</h3>
  <ul>
    <li>Nome: {{professionalName}}</li>
    <li>Telefono: {{professionalPhone}}</li>
    <li>Email: {{professionalEmail}}</li>
    <li>Valutazione: ⭐ {{professionalRating}}/5</li>
  </ul>
</div>
<p>Il professionista ti contatterà presto per concordare i dettagli.</p>
</div>`,
          bodyText: '{{professionalName}} assegnato. Tel: {{professionalPhone}}'
        },
        {
          channelId: smsChannel?.id,
          subject: '',
          bodyHtml: '',
          bodyText: 'Professionista {{professionalName}} assegnato. Tel: {{professionalPhone}}'
        }]
      },
      
      {
        type: 'request_assigned_professional',
        name: 'Nuova richiesta assegnata',
        category: 'REQUEST',
        channels: [{
          channelId: emailChannel.id,
          subject: '🔔 Nuova richiesta assegnata: {{requestTitle}}',
          bodyHtml: `<div style="max-width:600px;margin:0 auto;">
<h2 style="color:#F59E0B;">Nuova Richiesta!</h2>
<p>Ciao {{professionalName}},</p>
<p>Ti è stata assegnata una nuova richiesta.</p>
<div style="background:#FEF3C7;padding:15px;border-radius:8px;">
  <h3>Dettagli:</h3>
  <ul>
    <li>Titolo: {{requestTitle}}</li>
    <li>Cliente: {{clientName}}</li>
    <li>Telefono: {{clientPhone}}</li>
    <li>Indirizzo: {{address}}, {{city}}</li>
    <li>Descrizione: {{requestDescription}}</li>
  </ul>
</div>
<p><strong>Azione richiesta:</strong> Contatta il cliente entro 2 ore e invia un preventivo.</p>
</div>`,
          bodyText: 'Nuova richiesta: {{requestTitle}} da {{clientName}} - {{clientPhone}}'
        },
        {
          channelId: smsChannel?.id,
          subject: '',
          bodyHtml: '',
          bodyText: 'Nuova richiesta: {{requestTitle}}. Cliente: {{clientPhone}}'
        }]
      },
      
      {
        type: 'request_status_changed',
        name: 'Cambio stato richiesta',
        category: 'REQUEST',
        channels: [{
          channelId: wsChannel?.id,
          subject: '',
          bodyHtml: '',
          bodyText: 'Richiesta {{requestTitle}} ora in stato: {{newStatus}}'
        },
        {
          channelId: emailChannel.id,
          subject: '🔄 Stato richiesta aggiornato',
          bodyHtml: `<div style="max-width:600px;margin:0 auto;">
<h2>Aggiornamento Stato</h2>
<p>La richiesta "<strong>{{requestTitle}}</strong>" è ora:</p>
<p style="font-size:20px;text-align:center;color:#3B82F6;"><strong>{{newStatus}}</strong></p>
<p>{{statusDescription}}</p>
</div>`,
          bodyText: 'Richiesta {{requestTitle}} ora in stato: {{newStatus}}'
        }]
      },
      
      // ==================== QUOTE ====================
      {
        type: 'quote_received',
        name: 'Nuovo preventivo ricevuto',
        category: 'QUOTE',
        channels: [{
          channelId: emailChannel.id,
          subject: '💰 Nuovo preventivo per: {{requestTitle}}',
          bodyHtml: `<div style="max-width:600px;margin:0 auto;">
<h2 style="color:#3B82F6;">Nuovo Preventivo!</h2>
<p>Ciao {{clientName}},</p>
<p>Hai ricevuto un preventivo da <strong>{{professionalName}}</strong>.</p>
<div style="background:#E0E7FF;padding:15px;border-radius:8px;">
  <h3>Riepilogo:</h3>
  <ul>
    <li>Importo: <strong style="color:#059669;font-size:20px;">€{{quoteAmount}}</strong></li>
    <li>Validità: fino al {{validUntil}}</li>
    <li>Tempo stimato: {{estimatedHours}} ore</li>
  </ul>
</div>
<p style="text-align:center;">
  <a href="{{quoteUrl}}" style="background:#10B981;color:white;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;">Visualizza Preventivo</a>
</p>
</div>`,
          bodyText: 'Nuovo preventivo da {{professionalName}}: €{{quoteAmount}}'
        },
        {
          channelId: wsChannel?.id,
          subject: '',
          bodyHtml: '',
          bodyText: 'Nuovo preventivo ricevuto: €{{quoteAmount}}'
        }]
      },
      
      {
        type: 'quote_modified',
        name: 'Preventivo modificato',
        category: 'QUOTE',
        channels: [{
          channelId: emailChannel.id,
          subject: '📝 Preventivo modificato per: {{requestTitle}}',
          bodyHtml: `<div style="max-width:600px;margin:0 auto;">
<h2>Preventivo Modificato</h2>
<p>{{professionalName}} ha modificato il preventivo.</p>
<p>Nuovo importo: <strong>€{{newAmount}}</strong> (precedente: €{{oldAmount}})</p>
<p>Motivo: {{modificationReason}}</p>
<p><a href="{{quoteUrl}}">Visualizza preventivo aggiornato</a></p>
</div>`,
          bodyText: 'Preventivo modificato. Nuovo importo: €{{newAmount}}'
        }]
      },
      
      {
        type: 'quote_accepted_professional',
        name: 'Preventivo accettato',
        category: 'QUOTE',
        channels: [{
          channelId: emailChannel.id,
          subject: '✅ Preventivo accettato da {{clientName}}!',
          bodyHtml: `<div style="max-width:600px;margin:0 auto;">
<h2 style="color:#10B981;">Preventivo Accettato!</h2>
<p>Ottima notizia {{professionalName}}!</p>
<p><strong>{{clientName}}</strong> ha accettato il tuo preventivo di <strong>€{{quoteAmount}}</strong>.</p>
<div style="background:#D1FAE5;padding:15px;border-radius:8px;">
  <h3>Prossimi passi:</h3>
  <ol>
    <li>Contatta il cliente: {{clientPhone}}</li>
    <li>Conferma data e ora intervento</li>
    <li>Prepara materiali necessari</li>
  </ol>
</div>
</div>`,
          bodyText: 'Preventivo accettato! Contatta {{clientName}}: {{clientPhone}}'
        },
        {
          channelId: smsChannel?.id,
          subject: '',
          bodyHtml: '',
          bodyText: '✅ Preventivo accettato! Contatta {{clientName}}: {{clientPhone}}'
        }]
      },
      
      {
        type: 'quote_rejected_professional',
        name: 'Preventivo rifiutato',
        category: 'QUOTE',
        channels: [{
          channelId: emailChannel.id,
          subject: '❌ Preventivo rifiutato per: {{requestTitle}}',
          bodyHtml: `<div style="max-width:600px;margin:0 auto;">
<h2>Preventivo Rifiutato</h2>
<p>Ciao {{professionalName}},</p>
<p>Il cliente ha rifiutato il preventivo per "<strong>{{requestTitle}}</strong>".</p>
<p>Motivo: {{rejectionReason}}</p>
<p>Puoi inviare un nuovo preventivo modificato se lo desideri.</p>
</div>`,
          bodyText: 'Preventivo rifiutato. Motivo: {{rejectionReason}}'
        }]
      },
      
      // ==================== CHAT ====================
      {
        type: 'chat_message_client',
        name: 'Nuovo messaggio (cliente)',
        category: 'CHAT',
        channels: [{
          channelId: wsChannel?.id,
          subject: '',
          bodyHtml: '',
          bodyText: '{{professionalName}}: {{messagePreview}}'
        },
        {
          channelId: emailChannel.id,
          subject: '💬 Nuovo messaggio da {{professionalName}}',
          bodyHtml: `<div style="max-width:600px;margin:0 auto;">
<p><strong>{{professionalName}}</strong> ti ha inviato un messaggio:</p>
<blockquote style="background:#F3F4F6;padding:15px;border-left:4px solid #3B82F6;">{{messageContent}}</blockquote>
<p><a href="{{chatUrl}}">Rispondi</a></p>
</div>`,
          bodyText: 'Messaggio da {{professionalName}}: {{messagePreview}}'
        }]
      },
      
      {
        type: 'chat_message_professional',
        name: 'Nuovo messaggio (professionista)',
        category: 'CHAT',
        channels: [{
          channelId: wsChannel?.id,
          subject: '',
          bodyHtml: '',
          bodyText: '{{clientName}}: {{messagePreview}}'
        },
        {
          channelId: emailChannel.id,
          subject: '💬 Nuovo messaggio da {{clientName}}',
          bodyHtml: `<div style="max-width:600px;margin:0 auto;">
<p><strong>{{clientName}}</strong> ti ha inviato un messaggio:</p>
<blockquote style="background:#F3F4F6;padding:15px;border-left:4px solid #3B82F6;">{{messageContent}}</blockquote>
<p><a href="{{chatUrl}}">Rispondi</a></p>
</div>`,
          bodyText: 'Messaggio da {{clientName}}: {{messagePreview}}'
        }]
      },
      
      // ==================== PROFESSIONAL ====================
      {
        type: 'skill_added',
        name: 'Nuova competenza aggiunta',
        category: 'PROFESSIONAL',
        channels: [{
          channelId: emailChannel.id,
          subject: '✅ Nuova competenza aggiunta: {{skillName}}',
          bodyHtml: `<div style="max-width:600px;margin:0 auto;">
<h2>Competenza Aggiunta</h2>
<p>Ciao {{professionalName}},</p>
<p>La competenza "<strong>{{skillName}}</strong>" è stata aggiunta al tuo profilo.</p>
<p>Categoria: {{categoryName}}</p>
<p>Ora puoi ricevere richieste per questa specializzazione.</p>
</div>`,
          bodyText: 'Competenza {{skillName}} aggiunta al tuo profilo.'
        }]
      },
      
      {
        type: 'skill_revoked',
        name: 'Competenza revocata',
        category: 'PROFESSIONAL',
        channels: [{
          channelId: emailChannel.id,
          subject: '❌ Competenza rimossa: {{skillName}}',
          bodyHtml: `<div style="max-width:600px;margin:0 auto;">
<h2>Competenza Rimossa</h2>
<p>La competenza "<strong>{{skillName}}</strong>" è stata rimossa dal tuo profilo.</p>
<p>Motivo: {{revocationReason}}</p>
<p>Non riceverai più richieste per questa specializzazione.</p>
</div>`,
          bodyText: 'Competenza {{skillName}} rimossa. Motivo: {{revocationReason}}'
        }]
      },
      
      // ==================== PAYMENT ====================
      {
        type: 'payment_success',
        name: 'Pagamento completato',
        category: 'PAYMENT',
        channels: [{
          channelId: emailChannel.id,
          subject: '✅ Pagamento di €{{amount}} ricevuto',
          bodyHtml: `<div style="max-width:600px;margin:0 auto;">
<h2 style="color:#10B981;">Pagamento Ricevuto!</h2>
<p>Conferma pagamento:</p>
<div style="background:#D1FAE5;padding:15px;border-radius:8px;">
  <ul>
    <li>Importo: <strong>€{{amount}}</strong></li>
    <li>Servizio: {{requestTitle}}</li>
    <li>Data: {{paymentDate}}</li>
    <li>ID Transazione: {{transactionId}}</li>
  </ul>
</div>
<p>Ricevuta disponibile nel tuo account.</p>
</div>`,
          bodyText: 'Pagamento €{{amount}} ricevuto per {{requestTitle}}'
        }]
      },
      
      {
        type: 'payment_failed',
        name: 'Pagamento fallito',
        category: 'PAYMENT',
        channels: [{
          channelId: emailChannel.id,
          subject: '❌ Pagamento non riuscito',
          bodyHtml: `<div style="max-width:600px;margin:0 auto;">
<h2 style="color:#EF4444;">Pagamento Non Riuscito</h2>
<p>Il pagamento di <strong>€{{amount}}</strong> non è andato a buon fine.</p>
<p>Motivo: {{failureReason}}</p>
<p>Per favore, riprova o usa un altro metodo di pagamento.</p>
<p><a href="{{paymentUrl}}">Riprova pagamento</a></p>
</div>`,
          bodyText: 'Pagamento €{{amount}} fallito. Motivo: {{failureReason}}'
        }]
      },
      
      {
        type: 'deposit_required',
        name: 'Richiesta deposito',
        category: 'PAYMENT',
        channels: [{
          channelId: emailChannel.id,
          subject: '💳 Deposito richiesto: €{{depositAmount}}',
          bodyHtml: `<div style="max-width:600px;margin:0 auto;">
<h2>Deposito Richiesto</h2>
<p>Ciao {{clientName}},</p>
<p>Per confermare il servizio è richiesto un deposito di <strong>€{{depositAmount}}</strong>.</p>
<p>Il deposito sarà detratto dal totale finale.</p>
<p style="text-align:center;">
  <a href="{{paymentUrl}}" style="background:#3B82F6;color:white;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;">Paga Deposito</a>
</p>
<p>Scadenza: {{depositDeadline}}</p>
</div>`,
          bodyText: 'Deposito €{{depositAmount}} richiesto. Scadenza: {{depositDeadline}}'
        }]
      }
    ]
    
    // CREA I TEMPLATE
    console.log('📝 Creazione template esatti...\n')
    let created = 0
    let skipped = 0
    
    for (const tmpl of templates) {
      for (const channel of tmpl.channels) {
        if (!channel.channelId) continue
        
        try {
          await prisma.notificationTemplate.create({
            data: {
              id: uuidv4(),
              type: tmpl.type,
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
          console.log(`✅ ${tmpl.type} (${channelName})`)
          created++
          
        } catch (error: any) {
          if (error.code === 'P2002') {
            skipped++
          } else {
            console.log(`❌ Errore ${tmpl.type}:`, error.message)
          }
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
    
    // Lista tutti i tipi
    const allTypes = await prisma.notificationTemplate.findMany({
      select: { type: true },
      distinct: ['type']
    })
    
    console.log(`
✅ Template creati in questa sessione: ${created}
⚠️  Template già esistenti saltati: ${skipped}
📊 Template totali nel database: ${totalTemplates}
✅ Template attivi: ${activeTemplates}

📋 LISTA TEMPLATE DISPONIBILI:
`)
    
    // Raggruppa per categoria
    const byCategory: Record<string, string[]> = {}
    templates.forEach(t => {
      if (!byCategory[t.category]) byCategory[t.category] = []
      byCategory[t.category].push(t.type)
    })
    
    Object.entries(byCategory).forEach(([cat, types]) => {
      console.log(`\n**${cat}**`)
      types.forEach(type => {
        const exists = allTypes.some(t => t.type === type)
        const icon = exists ? '✅' : '❌'
        console.log(`${icon} \`${type}\` - ${templates.find(t => t.type === type)?.name}`)
      })
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
creaTemplateEsatti()
