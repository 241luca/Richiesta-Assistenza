#!/bin/bash

echo "💬 AGGIUNTA MESSAGGI ALLE RICHIESTE"
echo "===================================="

cd backend

npx tsx << 'EOF'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addMessages() {
  try {
    console.log('\n💬 Creazione messaggi nelle richieste...\n')
    
    // Recupera richieste e utenti
    const requests = await prisma.assistanceRequest.findMany({
      include: {
        client: true,
        professional: true
      }
    })
    
    console.log(`   Trovate ${requests.length} richieste`)
    
    let messagesCreated = 0
    
    for (const request of requests) {
      try {
        // Verifica se ci sono già messaggi
        const existingMessages = await prisma.message.count({
          where: { requestId: request.id }
        })
        
        if (existingMessages === 0 && request.clientId) {
          console.log(`   📝 Creando messaggi per: ${request.title}`)
          
          // Messaggio 1: Cliente chiede informazioni
          try {
            await prisma.message.create({
              data: {
                requestId: request.id,
                senderId: request.clientId,
                recipientId: request.professionalId || request.clientId, // Se non c'è professionista, manda a se stesso
                content: 'Buongiorno, ho bisogno urgente di questo intervento. Quando potrebbe venire per un sopralluogo?',
                type: 'TEXT'
              }
            })
            messagesCreated++
            console.log(`      ✅ Messaggio cliente creato`)
          } catch (e) {
            console.log(`      ⚠️ Errore: ${e.message}`)
          }
          
          // Se c'è un professionista assegnato, aggiungi la sua risposta
          if (request.professionalId) {
            try {
              // Messaggio 2: Risposta del professionista
              await prisma.message.create({
                data: {
                  requestId: request.id,
                  senderId: request.professionalId,
                  recipientId: request.clientId,
                  content: 'Buongiorno, posso venire domani mattina alle 9:00 per il sopralluogo. Le va bene come orario?',
                  type: 'TEXT'
                }
              })
              messagesCreated++
              console.log(`      ✅ Risposta professionista creata`)
              
              // Messaggio 3: Conferma del cliente
              await prisma.message.create({
                data: {
                  requestId: request.id,
                  senderId: request.clientId,
                  recipientId: request.professionalId,
                  content: 'Perfetto, l\'aspetto domani alle 9:00. Grazie mille!',
                  type: 'TEXT'
                }
              })
              messagesCreated++
              console.log(`      ✅ Conferma cliente creata`)
              
              // Messaggio 4: Dettagli aggiuntivi dal professionista
              await prisma.message.create({
                data: {
                  requestId: request.id,
                  senderId: request.professionalId,
                  recipientId: request.clientId,
                  content: 'Ottimo! Porto con me gli strumenti per fare subito una prima valutazione. Se ha documenti o foto del problema, li tenga pronti.',
                  type: 'TEXT'
                }
              })
              messagesCreated++
              console.log(`      ✅ Dettagli professionista creati`)
              
            } catch (e) {
              console.log(`      ⚠️ Errore risposta: ${e.message}`)
            }
          } else {
            // Se non c'è professionista, aggiungi un messaggio di sistema
            try {
              const adminUser = await prisma.user.findFirst({
                where: { role: 'SUPER_ADMIN' }
              })
              
              if (adminUser) {
                await prisma.message.create({
                  data: {
                    requestId: request.id,
                    senderId: adminUser.id,
                    recipientId: request.clientId,
                    content: 'La sua richiesta è stata ricevuta. Stiamo cercando il professionista più adatto per il suo intervento.',
                    type: 'SYSTEM'
                  }
                })
                messagesCreated++
                console.log(`      ✅ Messaggio sistema creato`)
              }
            } catch (e) {
              console.log(`      ⚠️ Errore sistema: ${e.message}`)
            }
          }
        }
      } catch (error) {
        console.log(`   ⚠️ Errore per richiesta ${request.id}: ${error.message}`)
      }
    }
    
    console.log(`\n   💬 Totale messaggi creati: ${messagesCreated}`)
    
    // Aggiungi anche le notifiche mancanti con priority corretta
    console.log('\n🔔 Completamento notifiche...')
    
    const users = await prisma.user.findMany()
    let notifCreated = 0
    
    for (const user of users) {
      try {
        // Verifica se l'utente ha già notifiche
        const existingNotif = await prisma.notification.count({
          where: { recipientId: user.id }
        })
        
        if (existingNotif === 0) {
          let notifData = {
            recipientId: user.id,
            title: '',
            type: 'SYSTEM',
            content: '',
            isRead: false
          }
          
          // Personalizza per ruolo
          switch (user.role) {
            case 'CLIENT':
              notifData.title = 'Benvenuto!'
              notifData.type = 'SYSTEM'
              notifData.content = 'Benvenuto nel sistema di richiesta assistenza. Puoi creare la tua prima richiesta.'
              break
            case 'PROFESSIONAL':
              notifData.title = 'Nuove richieste disponibili'
              notifData.type = 'REQUEST_ASSIGNED'
              notifData.content = 'Ci sono nuove richieste nella tua zona di competenza.'
              break
            case 'ADMIN':
            case 'SUPER_ADMIN':
              notifData.title = 'Sistema operativo'
              notifData.type = 'SYSTEM'
              notifData.content = 'Il sistema è stato popolato con successo con dati di esempio.'
              break
          }
          
          await prisma.notification.create({
            data: notifData
          })
          notifCreated++
          console.log(`   ✅ Notifica creata per ${user.email}`)
        }
      } catch (e) {
        // Ignora errori di notifiche duplicate
      }
    }
    
    console.log(`   🔔 Totale notifiche create: ${notifCreated}`)
    
    // RIEPILOGO FINALE
    console.log('\n' + '='.repeat(50))
    console.log('📊 RIEPILOGO FINALE DATABASE:')
    console.log('='.repeat(50))
    
    const counts = {
      users: await prisma.user.count(),
      categories: await prisma.category.count(),
      requests: await prisma.assistanceRequest.count(),
      quotes: await prisma.quote.count(),
      quoteItems: await prisma.quoteItem.count(),
      notifications: await prisma.notification.count(),
      messages: await prisma.message.count()
    }
    
    console.log(`👥 Utenti: ${counts.users}`)
    console.log(`📂 Categorie: ${counts.categories}`)
    console.log(`📋 Richieste: ${counts.requests}`)
    console.log(`💰 Preventivi: ${counts.quotes}`)
    console.log(`📝 Voci preventivo: ${counts.quoteItems}`)
    console.log(`🔔 Notifiche: ${counts.notifications}`)
    console.log(`💬 Messaggi: ${counts.messages}`)
    
    if (counts.messages > 0) {
      console.log('\n🎉 MESSAGGI AGGIUNTI CON SUCCESSO!')
      console.log('✅ Il database è ora COMPLETAMENTE popolato!')
    }
    
  } catch (error) {
    console.error('❌ Errore generale:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addMessages()
EOF

echo ""
echo "===================================="
echo "✅ Script messaggi completato!"
