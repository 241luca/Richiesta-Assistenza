#!/bin/bash

echo "✅ COMPLETAMENTO FINALE DATABASE"
echo "================================"

cd backend

npx tsx << 'EOF'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function finalComplete() {
  try {
    console.log('\n📝 Completamento finale del database...\n')
    
    // 1. VOCI PREVENTIVO (senza campo 'unit')
    console.log('📝 Aggiunta voci preventivo...')
    
    const quotes = await prisma.quote.findMany()
    console.log(`   Trovati ${quotes.length} preventivi`)
    
    let itemsCreated = 0
    for (const quote of quotes) {
      const existingItems = await prisma.quoteItem.count({
        where: { quoteId: quote.id }
      })
      
      if (existingItems === 0) {
        try {
          // Prima voce - Manodopera
          await prisma.quoteItem.create({
            data: {
              quoteId: quote.id,
              description: 'Manodopera specializzata',
              quantity: 2,
              unitPrice: 5000,
              totalPrice: 10000,
              order: 1
            }
          })
          itemsCreated++
          
          // Seconda voce - Materiali
          await prisma.quoteItem.create({
            data: {
              quoteId: quote.id,
              description: 'Materiali e componenti',
              quantity: 1,
              unitPrice: quote.amount - 10000,
              totalPrice: quote.amount - 10000,
              order: 2
            }
          })
          itemsCreated++
          console.log(`   ✅ Create 2 voci per preventivo €${(quote.amount/100).toFixed(2)}`)
        } catch (e) {
          console.log(`   ⚠️ Errore voci: ${e.message}`)
        }
      }
    }
    console.log(`   📝 Totale voci create: ${itemsCreated}`)
    
    // 2. NOTIFICHE (con campo title)
    console.log('\n🔔 Creazione notifiche...')
    
    const users = await prisma.user.findMany()
    const client = users.find(u => u.role === 'CLIENT')
    const professional = users.find(u => u.role === 'PROFESSIONAL')
    const admin = users.find(u => u.role === 'SUPER_ADMIN')
    const staff = users.find(u => u.role === 'ADMIN')
    
    const notifications = [
      {
        recipientId: client?.id,
        title: 'Richiesta creata',
        type: 'REQUEST_CREATED',
        content: 'La tua richiesta è stata creata con successo',
        priority: 'MEDIUM'
      },
      {
        recipientId: professional?.id,
        title: 'Nuova richiesta',
        type: 'REQUEST_ASSIGNED',
        content: 'Ti è stata assegnata una nuova richiesta',
        priority: 'HIGH'
      },
      {
        recipientId: client?.id,
        title: 'Preventivo ricevuto',
        type: 'QUOTE_RECEIVED',
        content: 'Hai ricevuto un nuovo preventivo',
        priority: 'MEDIUM'
      },
      {
        recipientId: admin?.id,
        title: 'Sistema aggiornato',
        type: 'SYSTEM',
        content: 'Database popolato con successo',
        priority: 'LOW'
      },
      {
        recipientId: staff?.id,
        title: 'Richieste pendenti',
        type: 'SYSTEM',
        content: 'Ci sono richieste in attesa di assegnazione',
        priority: 'MEDIUM'
      }
    ]
    
    let notifCreated = 0
    for (const notif of notifications) {
      if (notif.recipientId) {
        try {
          const existing = await prisma.notification.findFirst({
            where: {
              recipientId: notif.recipientId,
              type: notif.type
            }
          })
          
          if (!existing) {
            await prisma.notification.create({
              data: {
                ...notif,
                isRead: false
              }
            })
            notifCreated++
            console.log(`   ✅ Notifica creata: ${notif.title}`)
          }
        } catch (e) {
          console.log(`   ⚠️ Errore: ${e.message}`)
        }
      }
    }
    console.log(`   🔔 Totale notifiche create: ${notifCreated}`)
    
    // 3. MESSAGGI (con relazione sender corretta)
    console.log('\n💬 Creazione messaggi...')
    
    const requests = await prisma.assistanceRequest.findMany()
    let messagesCreated = 0
    
    for (const request of requests.slice(0, 2)) {
      if (request.clientId) {
        try {
          const existingMessages = await prisma.message.count({
            where: { requestId: request.id }
          })
          
          if (existingMessages === 0) {
            // Messaggio del cliente
            await prisma.message.create({
              data: {
                request: {
                  connect: { id: request.id }
                },
                sender: {
                  connect: { id: request.clientId }
                },
                content: 'Buongiorno, quando potrebbe venire per un sopralluogo?',
                type: 'TEXT'
              }
            })
            messagesCreated++
            console.log(`   ✅ Messaggio cliente creato per richiesta`)
            
            // Se c'è professionista, aggiungi risposta
            if (request.professionalId) {
              await prisma.message.create({
                data: {
                  request: {
                    connect: { id: request.id }
                  },
                  sender: {
                    connect: { id: request.professionalId }
                  },
                  content: 'Posso venire domani mattina alle 9:00.',
                  type: 'TEXT'
                }
              })
              messagesCreated++
              console.log(`   ✅ Risposta professionista creata`)
            }
          }
        } catch (e) {
          console.log(`   ⚠️ Errore messaggi: ${e.message}`)
        }
      }
    }
    console.log(`   💬 Totale messaggi creati: ${messagesCreated}`)
    
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
    
    if (counts.quotes > 0 && counts.quoteItems > 0 && counts.notifications > 0) {
      console.log('\n🎉 DATABASE COMPLETAMENTE POPOLATO!')
      console.log('✅ Tutti i moduli sono pronti per l\'uso!')
    } else {
      console.log('\n⚠️ Alcuni dati potrebbero mancare')
    }
    
  } catch (error) {
    console.error('❌ Errore generale:', error)
  } finally {
    await prisma.$disconnect()
  }
}

finalComplete()
EOF

echo ""
echo "================================"
echo "✅ Completamento finale eseguito!"
