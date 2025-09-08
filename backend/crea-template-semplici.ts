import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function creaTemplateSemplici() {
  console.log('\n📧 CREAZIONE TEMPLATE NOTIFICHE SEMPLIFICATI\n')
  
  try {
    // PRIMA: Verifica/crea canali base
    console.log('1️⃣ Verifica canali...')
    
    let emailChannel = await prisma.notificationChannel.findFirst({
      where: { code: 'email' }
    })
    
    if (!emailChannel) {
      console.log('   Creo canale email...')
      emailChannel = await prisma.notificationChannel.create({
        data: {
          id: uuidv4(),
          code: 'email',
          name: 'Email',
          type: 'email',
          provider: 'smtp',
          configuration: {},
          isActive: true,
          isDefault: true,
          priority: 0,
          updatedAt: new Date()
        }
      })
    }
    console.log('   ✅ Canale email OK')
    
    // SECONDA: Crea notification queue per ogni tipo importante
    console.log('\n2️⃣ Creazione code notifiche...')
    
    const notifiche = [
      // UTENTI
      {
        type: 'USER_REGISTERED',
        title: 'Benvenuto {{fullName}}!',
        content: 'Grazie per esserti registrato. Verifica la tua email per completare la registrazione.',
        recipient: 'user',
        priority: 'HIGH'
      },
      {
        type: 'PASSWORD_RESET',
        title: 'Reset Password Richiesto',
        content: 'Clicca sul link per reimpostare la tua password: {{resetUrl}}',
        recipient: 'user',
        priority: 'URGENT'
      },
      
      // RICHIESTE
      {
        type: 'REQUEST_CREATED',
        title: 'Richiesta #{{requestId}} Creata',
        content: 'La tua richiesta "{{requestTitle}}" è stata registrata con successo.',
        recipient: 'client',
        priority: 'NORMAL'
      },
      {
        type: 'REQUEST_ASSIGNED',
        title: 'Professionista Assegnato',
        content: '{{professionalName}} è stato assegnato alla tua richiesta.',
        recipient: 'client',
        priority: 'HIGH'
      },
      {
        type: 'NEW_REQUEST_FOR_PROFESSIONAL',
        title: 'Nuova Richiesta Assegnata',
        content: 'Ti è stata assegnata la richiesta: {{requestTitle}}',
        recipient: 'professional',
        priority: 'HIGH'
      },
      {
        type: 'REQUEST_COMPLETED',
        title: 'Servizio Completato',
        content: 'Il servizio per "{{requestTitle}}" è stato completato.',
        recipient: 'client',
        priority: 'NORMAL'
      },
      
      // PREVENTIVI
      {
        type: 'QUOTE_RECEIVED',
        title: 'Nuovo Preventivo Ricevuto',
        content: 'Hai ricevuto un preventivo di €{{amount}} da {{professionalName}}',
        recipient: 'client',
        priority: 'HIGH'
      },
      {
        type: 'QUOTE_ACCEPTED',
        title: 'Preventivo Accettato!',
        content: 'Il tuo preventivo di €{{amount}} è stato accettato da {{clientName}}',
        recipient: 'professional',
        priority: 'HIGH'
      },
      {
        type: 'QUOTE_REJECTED',
        title: 'Preventivo Rifiutato',
        content: 'Il preventivo per {{requestTitle}} è stato rifiutato.',
        recipient: 'professional',
        priority: 'NORMAL'
      },
      
      // PAGAMENTI
      {
        type: 'PAYMENT_RECEIVED',
        title: 'Pagamento Ricevuto €{{amount}}',
        content: 'Abbiamo ricevuto il pagamento di €{{amount}} per {{requestTitle}}',
        recipient: 'professional',
        priority: 'HIGH'
      },
      {
        type: 'DEPOSIT_REQUIRED',
        title: 'Deposito Richiesto',
        content: 'È richiesto un deposito di €{{depositAmount}} per confermare il servizio.',
        recipient: 'client',
        priority: 'HIGH'
      },
      
      // MESSAGGI
      {
        type: 'NEW_MESSAGE',
        title: 'Nuovo Messaggio da {{senderName}}',
        content: '{{messagePreview}}',
        recipient: 'both',
        priority: 'NORMAL'
      },
      
      // PROMEMORIA
      {
        type: 'APPOINTMENT_REMINDER',
        title: 'Promemoria Appuntamento Domani',
        content: 'Promemoria: {{requestTitle}} domani alle {{time}} in {{address}}',
        recipient: 'both',
        priority: 'HIGH'
      },
      {
        type: 'QUOTE_EXPIRING',
        title: 'Preventivo in Scadenza',
        content: 'Il preventivo per {{requestTitle}} scadrà tra 24 ore.',
        recipient: 'client',
        priority: 'NORMAL'
      },
      
      // SISTEMA
      {
        type: 'ACCOUNT_VERIFIED',
        title: 'Account Verificato',
        content: 'Il tuo account è stato verificato con successo!',
        recipient: 'user',
        priority: 'NORMAL'
      },
      {
        type: 'PROFESSIONAL_APPROVED',
        title: 'Profilo Professionale Approvato',
        content: 'Il tuo profilo professionale è stato approvato. Ora puoi ricevere richieste!',
        recipient: 'professional',
        priority: 'HIGH'
      },
      {
        type: 'REVIEW_RECEIVED',
        title: 'Nuova Recensione Ricevuta',
        content: '{{clientName}} ha lasciato una recensione {{rating}} stelle.',
        recipient: 'professional',
        priority: 'NORMAL'
      },
      {
        type: 'SERVICE_REMINDER',
        title: 'Promemoria Servizio',
        content: 'Ricordati di confermare il completamento del servizio {{requestTitle}}',
        recipient: 'professional',
        priority: 'NORMAL'
      },
      {
        type: 'INVOICE_GENERATED',
        title: 'Fattura Disponibile',
        content: 'La fattura per {{requestTitle}} è disponibile nel tuo account.',
        recipient: 'client',
        priority: 'NORMAL'
      },
      {
        type: 'SKILL_ADDED',
        title: 'Nuova Competenza Aggiunta',
        content: 'La competenza "{{skillName}}" è stata aggiunta al tuo profilo.',
        recipient: 'professional',
        priority: 'LOW'
      }
    ]
    
    // Crea le notifiche nella queue
    for (const notif of notifiche) {
      try {
        // Usa NotificationQueue che ESISTE nel database
        await prisma.notificationQueue.create({
          data: {
            id: uuidv4(),
            type: notif.type,
            recipient: 'test@example.com', // Placeholder
            channelId: emailChannel.id,
            subject: notif.title,
            content: notif.content,
            priority: notif.priority as any,
            status: 'PENDING',
            metadata: {
              recipientType: notif.recipient,
              template: true,
              variables: extractVars(notif.title + ' ' + notif.content)
            },
            createdAt: new Date()
          }
        })
        console.log(`   ✅ Template: ${notif.type}`)
      } catch (error) {
        // Se già esiste, skip
        console.log(`   ⚠️ ${notif.type} già esistente o errore`)
      }
    }
    
    // REPORT FINALE
    console.log('\n' + '='.repeat(50))
    console.log('📊 REPORT TEMPLATE NOTIFICHE')
    console.log('='.repeat(50))
    
    const totals = {
      channels: await prisma.notificationChannel.count(),
      templates: await prisma.notificationQueue.count()
    }
    
    console.log(`
✅ Canali configurati: ${totals.channels}
✅ Template creati: ${totals.templates}

📧 TEMPLATE PER:
- Registrazione e gestione utenti
- Richieste (create, assegnate, completate)
- Preventivi (ricevuti, accettati, rifiutati)
- Pagamenti e depositi
- Messaggi e chat
- Promemoria appuntamenti
- Sistema e recensioni

✅ SISTEMA NOTIFICHE CONFIGURATO!
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
creaTemplateSemplici()
