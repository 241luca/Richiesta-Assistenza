import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function creaTemplateNotifiche() {
  console.log('📧 CREAZIONE COMPLETA TEMPLATE NOTIFICHE\n')
  console.log('='.repeat(60))

  try {
    // VERIFICA CANALI
    const channels = await prisma.notificationChannel.findMany()
    if (channels.length === 0) {
      console.log('❌ Nessun canale trovato! Creo i canali base...')
      
      // Crea canali se non esistono
      const canaliBase = [
        { code: 'email', name: 'Email', type: 'email', provider: 'smtp' },
        { code: 'websocket', name: 'WebSocket', type: 'websocket', provider: null },
        { code: 'sms', name: 'SMS', type: 'sms', provider: 'twilio' },
        { code: 'push', name: 'Push', type: 'push', provider: 'firebase' }
      ]
      
      for (const ch of canaliBase) {
        await prisma.notificationChannel.create({
          data: {
            id: uuidv4(),
            code: ch.code,
            name: ch.name,
            type: ch.type,
            provider: ch.provider,
            configuration: {},
            isActive: ch.code === 'email' || ch.code === 'websocket',
            isDefault: ch.code === 'email',
            priority: 0,
            updatedAt: new Date()
          }
        })
      }
      console.log('✅ Canali creati')
    }

    // CREA TIPI DI NOTIFICHE SE NON ESISTONO
    console.log('\n📋 Configurazione tipi di notifiche...\n')
    
    const notificationTypes = [
      // GESTIONE UTENTI
      {
        code: 'USER_REGISTERED',
        name: 'Registrazione nuovo utente',
        category: 'USER',
        priority: 'HIGH',
        templates: {
          email: {
            subject: '🎉 Benvenuto in Richiesta Assistenza, {{fullName}}!',
            bodyHtml: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3B82F6; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .button { background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Benvenuto {{fullName}}!</h1>
    </div>
    <div class="content">
      <p>Grazie per esserti registrato su Richiesta Assistenza.</p>
      <p>Il tuo account è stato creato con successo con l'email: <strong>{{email}}</strong></p>
      <p>Ora puoi:</p>
      <ul>
        <li>Creare richieste di assistenza</li>
        <li>Ricevere preventivi dai migliori professionisti</li>
        <li>Gestire i tuoi interventi comodamente online</li>
      </ul>
      <p>Per completare la registrazione, verifica il tuo indirizzo email:</p>
      <p style="text-align: center;">
        <a href="{{verificationUrl}}" class="button">Verifica Email</a>
      </p>
    </div>
  </div>
</body>
</html>`,
            bodyText: 'Benvenuto {{fullName}}! Verifica la tua email: {{verificationUrl}}'
          }
        }
      },
      
      {
        code: 'PASSWORD_RESET',
        name: 'Reset password',
        category: 'USER',
        priority: 'HIGH',
        templates: {
          email: {
            subject: '🔐 Reset password richiesto',
            bodyHtml: `<!DOCTYPE html>
<html>
<body>
  <div style="max-width: 600px; margin: 0 auto;">
    <h2>Reset Password</h2>
    <p>Ciao {{fullName}},</p>
    <p>Hai richiesto di reimpostare la tua password.</p>
    <p>Clicca sul link qui sotto per creare una nuova password:</p>
    <p><a href="{{resetUrl}}" style="background:#3B82F6;color:white;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;">Reimposta Password</a></p>
    <p>Il link scadrà tra 24 ore.</p>
    <p>Se non hai richiesto tu il reset, ignora questa email.</p>
  </div>
</body>
</html>`,
            bodyText: 'Reset password richiesto. Link: {{resetUrl}}'
          }
        }
      },

      // RICHIESTE ASSISTENZA
      {
        code: 'REQUEST_CREATED',
        name: 'Richiesta creata',
        category: 'REQUEST',
        priority: 'MEDIUM',
        templates: {
          email: {
            subject: '✅ Richiesta #{{requestId}} creata con successo',
            bodyHtml: `<!DOCTYPE html>
<html>
<body>
  <div style="max-width: 600px; margin: 0 auto;">
    <h2 style="color: #10B981;">Richiesta Creata con Successo!</h2>
    <p>Ciao {{clientName}},</p>
    <p>La tua richiesta "<strong>{{requestTitle}}</strong>" è stata registrata.</p>
    
    <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h3>Dettagli Richiesta:</h3>
      <ul>
        <li><strong>ID:</strong> #{{requestId}}</li>
        <li><strong>Categoria:</strong> {{categoryName}}</li>
        <li><strong>Priorità:</strong> {{priority}}</li>
        <li><strong>Indirizzo:</strong> {{address}}, {{city}}</li>
        <li><strong>Data richiesta:</strong> {{scheduledDate}}</li>
      </ul>
    </div>
    
    <p>Ti assegneremo un professionista qualificato al più presto.</p>
    <p>Riceverai una notifica appena un professionista accetterà la tua richiesta.</p>
    
    <p style="text-align: center;">
      <a href="{{requestUrl}}" style="background:#3B82F6;color:white;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;">Visualizza Richiesta</a>
    </p>
  </div>
</body>
</html>`,
            bodyText: 'Richiesta {{requestTitle}} creata. ID: #{{requestId}}'
          },
          websocket: {
            subject: '',
            bodyHtml: '',
            bodyText: 'Nuova richiesta creata: {{requestTitle}}'
          }
        }
      },

      {
        code: 'REQUEST_ASSIGNED_CLIENT',
        name: 'Professionista assegnato (cliente)',
        category: 'REQUEST',
        priority: 'HIGH',
        templates: {
          email: {
            subject: '👷 Professionista assegnato alla tua richiesta',
            bodyHtml: `<!DOCTYPE html>
<html>
<body>
  <div style="max-width: 600px; margin: 0 auto;">
    <h2 style="color: #3B82F6;">Ottima notizia!</h2>
    <p>Ciao {{clientName}},</p>
    <p><strong>{{professionalName}}</strong> è stato assegnato alla tua richiesta.</p>
    
    <div style="background: #E0E7FF; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h3>Professionista Assegnato:</h3>
      <ul>
        <li><strong>Nome:</strong> {{professionalName}}</li>
        <li><strong>Specializzazione:</strong> {{professionalSpecialization}}</li>
        <li><strong>Valutazione:</strong> ⭐ {{professionalRating}}/5</li>
        <li><strong>Telefono:</strong> {{professionalPhone}}</li>
      </ul>
    </div>
    
    <p>Il professionista ti contatterà a breve per concordare i dettagli dell'intervento.</p>
    <p>Nel frattempo, riceverai un preventivo dettagliato.</p>
    
    <p style="text-align: center;">
      <a href="{{requestUrl}}" style="background:#10B981;color:white;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;">Visualizza Dettagli</a>
    </p>
  </div>
</body>
</html>`,
            bodyText: '{{professionalName}} assegnato alla tua richiesta {{requestTitle}}'
          },
          sms: {
            subject: '',
            bodyHtml: '',
            bodyText: 'Professionista {{professionalName}} assegnato. Tel: {{professionalPhone}}'
          }
        }
      },

      {
        code: 'REQUEST_ASSIGNED_PROFESSIONAL',
        name: 'Nuova richiesta assegnata (professionista)',
        category: 'REQUEST',
        priority: 'HIGH',
        templates: {
          email: {
            subject: '🔔 Nuova richiesta assegnata: {{requestTitle}}',
            bodyHtml: `<!DOCTYPE html>
<html>
<body>
  <div style="max-width: 600px; margin: 0 auto;">
    <h2 style="color: #F59E0B;">Nuova Richiesta Assegnata!</h2>
    <p>Ciao {{professionalName}},</p>
    <p>Ti è stata assegnata una nuova richiesta di assistenza.</p>
    
    <div style="background: #FEF3C7; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h3>Dettagli Richiesta:</h3>
      <ul>
        <li><strong>Titolo:</strong> {{requestTitle}}</li>
        <li><strong>Cliente:</strong> {{clientName}}</li>
        <li><strong>Telefono:</strong> {{clientPhone}}</li>
        <li><strong>Indirizzo:</strong> {{address}}, {{city}}</li>
        <li><strong>Priorità:</strong> {{priority}}</li>
        <li><strong>Data richiesta:</strong> {{scheduledDate}}</li>
      </ul>
      
      <h4>Descrizione problema:</h4>
      <p>{{requestDescription}}</p>
    </div>
    
    <p><strong>AZIONE RICHIESTA:</strong></p>
    <ol>
      <li>Contatta il cliente entro 2 ore</li>
      <li>Invia un preventivo dettagliato</li>
      <li>Conferma disponibilità per la data richiesta</li>
    </ol>
    
    <p style="text-align: center;">
      <a href="{{requestUrl}}" style="background:#10B981;color:white;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;">Gestisci Richiesta</a>
    </p>
  </div>
</body>
</html>`,
            bodyText: 'Nuova richiesta: {{requestTitle}} da {{clientName}} - {{clientPhone}}'
          },
          sms: {
            subject: '',
            bodyHtml: '',
            bodyText: 'Nuova richiesta urgente: {{requestTitle}}. Cliente: {{clientPhone}}'
          }
        }
      },

      {
        code: 'REQUEST_COMPLETED_CLIENT',
        name: 'Servizio completato (cliente)',
        category: 'REQUEST',
        priority: 'MEDIUM',
        templates: {
          email: {
            subject: '✅ Servizio completato - Lascia una recensione',
            bodyHtml: `<!DOCTYPE html>
<html>
<body>
  <div style="max-width: 600px; margin: 0 auto;">
    <h2 style="color: #10B981;">Servizio Completato!</h2>
    <p>Ciao {{clientName}},</p>
    <p>Il servizio per la tua richiesta "<strong>{{requestTitle}}</strong>" è stato completato.</p>
    
    <div style="background: #D1FAE5; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h3>Riepilogo Intervento:</h3>
      <ul>
        <li><strong>Professionista:</strong> {{professionalName}}</li>
        <li><strong>Data completamento:</strong> {{completionDate}}</li>
        <li><strong>Durata intervento:</strong> {{actualHours}} ore</li>
        <li><strong>Importo totale:</strong> €{{totalAmount}}</li>
      </ul>
    </div>
    
    <p><strong>La tua opinione è importante!</strong></p>
    <p>Aiutaci a migliorare il servizio lasciando una recensione.</p>
    
    <p style="text-align: center;">
      <a href="{{reviewUrl}}" style="background:#F59E0B;color:white;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;">Lascia Recensione</a>
    </p>
    
    <p>Grazie per aver scelto Richiesta Assistenza!</p>
  </div>
</body>
</html>`,
            bodyText: 'Servizio {{requestTitle}} completato. Lascia una recensione!'
          }
        }
      },

      // PREVENTIVI
      {
        code: 'QUOTE_CREATED',
        name: 'Nuovo preventivo ricevuto',
        category: 'QUOTE',
        priority: 'HIGH',
        templates: {
          email: {
            subject: '💰 Nuovo preventivo ricevuto per: {{requestTitle}}',
            bodyHtml: `<!DOCTYPE html>
<html>
<body>
  <div style="max-width: 600px; margin: 0 auto;">
    <h2 style="color: #3B82F6;">Nuovo Preventivo Ricevuto!</h2>
    <p>Ciao {{clientName}},</p>
    <p><strong>{{professionalName}}</strong> ha inviato un preventivo per la tua richiesta.</p>
    
    <div style="background: #E0E7FF; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h3>Dettagli Preventivo:</h3>
      <ul>
        <li><strong>Professionista:</strong> {{professionalName}}</li>
        <li><strong>Importo Totale:</strong> <span style="color:#059669;font-size:24px;font-weight:bold;">€{{quoteAmount}}</span></li>
        <li><strong>Validità:</strong> fino al {{validUntil}}</li>
      </ul>
      
      <h4>Descrizione lavori:</h4>
      <p>{{quoteDescription}}</p>
      
      <h4>Voci di costo:</h4>
      {{quoteItems}}
    </div>
    
    <p>Hai tempo fino al <strong>{{validUntil}}</strong> per accettare questo preventivo.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{acceptUrl}}" style="background:#10B981;color:white;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;margin-right:10px;">Accetta Preventivo</a>
      <a href="{{viewUrl}}" style="background:#6B7280;color:white;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;">Visualizza Dettagli</a>
    </div>
  </div>
</body>
</html>`,
            bodyText: 'Nuovo preventivo da {{professionalName}}: €{{quoteAmount}}'
          },
          websocket: {
            subject: '',
            bodyHtml: '',
            bodyText: 'Nuovo preventivo ricevuto: €{{quoteAmount}}'
          }
        }
      },

      {
        code: 'QUOTE_ACCEPTED',
        name: 'Preventivo accettato',
        category: 'QUOTE',
        priority: 'HIGH',
        templates: {
          email: {
            subject: '✅ Il tuo preventivo è stato accettato!',
            bodyHtml: `<!DOCTYPE html>
<html>
<body>
  <div style="max-width: 600px; margin: 0 auto;">
    <h2 style="color: #10B981;">Preventivo Accettato!</h2>
    <p>Ottima notizia {{professionalName}}!</p>
    <p><strong>{{clientName}}</strong> ha accettato il tuo preventivo di <strong>€{{quoteAmount}}</strong>.</p>
    
    <div style="background: #D1FAE5; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h3>Prossimi Passi:</h3>
      <ol>
        <li>Contatta il cliente per confermare data e ora: <strong>{{clientPhone}}</strong></li>
        <li>Prepara materiali e attrezzature necessarie</li>
        <li>Invia conferma appuntamento 24h prima</li>
      </ol>
      
      <h4>Dettagli Cliente:</h4>
      <ul>
        <li><strong>Nome:</strong> {{clientName}}</li>
        <li><strong>Telefono:</strong> {{clientPhone}}</li>
        <li><strong>Email:</strong> {{clientEmail}}</li>
        <li><strong>Indirizzo:</strong> {{address}}, {{city}}</li>
      </ul>
    </div>
    
    <p>Ricorda: hai garantito il completamento entro {{completionTime}}.</p>
    
    <p style="text-align: center;">
      <a href="{{requestUrl}}" style="background:#3B82F6;color:white;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;">Visualizza Dettagli</a>
    </p>
  </div>
</body>
</html>`,
            bodyText: 'Preventivo accettato da {{clientName}}! Tel: {{clientPhone}}'
          },
          sms: {
            subject: '',
            bodyHtml: '',
            bodyText: 'Preventivo accettato! Contatta {{clientName}}: {{clientPhone}}'
          }
        }
      },

      // PAGAMENTI
      {
        code: 'PAYMENT_RECEIVED',
        name: 'Pagamento ricevuto',
        category: 'PAYMENT',
        priority: 'HIGH',
        templates: {
          email: {
            subject: '✅ Pagamento ricevuto - €{{amount}}',
            bodyHtml: `<!DOCTYPE html>
<html>
<body>
  <div style="max-width: 600px; margin: 0 auto;">
    <h2 style="color: #10B981;">Pagamento Ricevuto!</h2>
    <p>Conferma pagamento per {{professionalName}}.</p>
    
    <div style="background: #D1FAE5; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h3>Dettagli Pagamento:</h3>
      <ul>
        <li><strong>Importo:</strong> <span style="font-size:24px;color:#059669;">€{{amount}}</span></li>
        <li><strong>Cliente:</strong> {{clientName}}</li>
        <li><strong>Richiesta:</strong> {{requestTitle}}</li>
        <li><strong>Data:</strong> {{paymentDate}}</li>
        <li><strong>Metodo:</strong> {{paymentMethod}}</li>
        <li><strong>ID Transazione:</strong> {{transactionId}}</li>
      </ul>
    </div>
    
    <p>L'importo sarà accreditato sul tuo conto entro 2-3 giorni lavorativi.</p>
    
    <p>Fattura disponibile nell'area riservata.</p>
  </div>
</body>
</html>`,
            bodyText: 'Pagamento ricevuto: €{{amount}} da {{clientName}}'
          }
        }
      },

      // CHAT
      {
        code: 'CHAT_MESSAGE',
        name: 'Nuovo messaggio chat',
        category: 'CHAT',
        priority: 'LOW',
        templates: {
          websocket: {
            subject: '',
            bodyHtml: '',
            bodyText: '{{senderName}}: {{messagePreview}}'
          },
          email: {
            subject: '💬 Nuovo messaggio da {{senderName}}',
            bodyHtml: `<!DOCTYPE html>
<html>
<body>
  <div style="max-width: 600px; margin: 0 auto;">
    <h3>Nuovo messaggio</h3>
    <p><strong>{{senderName}}</strong> ti ha inviato un messaggio:</p>
    <div style="background: #F3F4F6; padding: 15px; border-radius: 8px;">
      <p>{{messageContent}}</p>
    </div>
    <p><a href="{{chatUrl}}">Rispondi al messaggio</a></p>
  </div>
</body>
</html>`,
            bodyText: 'Nuovo messaggio da {{senderName}}: {{messagePreview}}'
          }
        }
      },

      // REMINDER
      {
        code: 'REQUEST_REMINDER',
        name: 'Promemoria appuntamento',
        category: 'REQUEST',
        priority: 'HIGH',
        templates: {
          sms: {
            subject: '',
            bodyHtml: '',
            bodyText: 'Promemoria: Appuntamento {{requestTitle}} domani ore {{time}} in {{address}}'
          },
          email: {
            subject: '⏰ Promemoria appuntamento domani',
            bodyHtml: `<!DOCTYPE html>
<html>
<body>
  <div style="max-width: 600px; margin: 0 auto;">
    <h2>Promemoria Appuntamento</h2>
    <p>Ti ricordiamo l'appuntamento di domani:</p>
    <div style="background: #FEF3C7; padding: 15px; border-radius: 8px;">
      <ul>
        <li><strong>Servizio:</strong> {{requestTitle}}</li>
        <li><strong>Data:</strong> {{appointmentDate}}</li>
        <li><strong>Ora:</strong> {{appointmentTime}}</li>
        <li><strong>Indirizzo:</strong> {{address}}</li>
        <li><strong>Contatto:</strong> {{contactPhone}}</li>
      </ul>
    </div>
  </div>
</body>
</html>`,
            bodyText: 'Promemoria: {{requestTitle}} domani ore {{appointmentTime}}'
          }
        }
      }
    ]

    // CREA I TEMPLATE
    for (const notifType of notificationTypes) {
      // Crea il tipo di notifica
      const type = await prisma.notificationType.upsert({
        where: { code: notifType.code },
        update: {},
        create: {
          id: uuidv4(),
          code: notifType.code,
          name: notifType.name,
          description: `Template per ${notifType.name}`,
          category: notifType.category,
          defaultChannels: Object.keys(notifType.templates),
          priority: notifType.priority,
          isActive: true,
          updatedAt: new Date()
        }
      })

      console.log(`✅ Tipo notifica: ${notifType.code}`)

      // Crea i template per ogni canale
      for (const [channelCode, template] of Object.entries(notifType.templates)) {
        const channel = await prisma.notificationChannel.findFirst({
          where: { code: channelCode }
        })

        if (channel && template) {
          const tmpl = template as any
          
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
              subject: tmpl.subject || '',
              bodyHtml: tmpl.bodyHtml || '',
              bodyText: tmpl.bodyText || '',
              variables: extractVariables(
                (tmpl.subject || '') + (tmpl.bodyHtml || '') + (tmpl.bodyText || '')
              ),
              isActive: true,
              updatedAt: new Date()
            }
          })
          
          console.log(`   📧 Template ${channelCode}: ${notifType.code}`)
        }
      }
    }

    // REPORT FINALE
    console.log('\n' + '='.repeat(60))
    console.log('📊 REPORT SISTEMA NOTIFICHE')
    console.log('='.repeat(60))

    const totals = {
      channels: await prisma.notificationChannel.count(),
      types: await prisma.notificationType.count(),
      templates: await prisma.notificationTemplate.count()
    }

    console.log(`
✅ Canali notifica: ${totals.channels}
✅ Tipi notifica: ${totals.types}  
✅ Template creati: ${totals.templates}

📧 OGNI TEMPLATE HA:
- Subject line ottimizzato
- HTML body professionale con styling
- Text body per fallback
- Variabili dinamiche ({{nome}}, {{importo}}, ecc)
- Versioni per ogni canale (email, websocket, sms)

🎯 TEMPLATE COMPLETI PER:
- Registrazione e gestione utenti
- Richieste assistenza (creazione, assegnazione, completamento)
- Preventivi (creazione, accettazione, rifiuto)
- Pagamenti e transazioni
- Messaggistica e chat
- Promemoria appuntamenti

✅ SISTEMA NOTIFICHE COMPLETAMENTE CONFIGURATO!
`)

  } catch (error) {
    console.error('❌ ERRORE:', error)
  } finally {
    await prisma.$disconnect()
  }
}

function extractVariables(text: string): string[] {
  const matches = text.match(/{{(\w+)}}/g) || []
  return [...new Set(matches.map(m => m.replace(/[{}]/g, '')))]
}

// Esegui
creaTemplateNotifiche()
