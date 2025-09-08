#!/bin/bash

echo "💰 POPOLAMENTO PREVENTIVI E NOTIFICHE"
echo "======================================"

cd backend

npx tsx << 'EOF'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function populateQuotesAndNotifications() {
  try {
    console.log('\n📝 Popolamento preventivi e notifiche...\n')
    
    // Recupera dati esistenti
    const requests = await prisma.assistanceRequest.findMany()
    const users = await prisma.user.findMany()
    const client = users.find(u => u.role === 'CLIENT')
    const professional = users.find(u => u.role === 'PROFESSIONAL')
    
    console.log(`   ✓ Trovate ${requests.length} richieste`)
    
    // 1. CREA PREVENTIVI
    console.log('\n💰 Creazione preventivi...')
    
    let quotesCreated = 0
    for (const request of requests) {
      // Solo per richieste con professionista assegnato
      if (request.professionalId) {
        try {
          // Verifica se esiste già un preventivo
          const existing = await prisma.quote.findFirst({
            where: { requestId: request.id }
          })
          
          if (!existing) {
            const amount = 10000 + Math.floor(Math.random() * 40000) // 100-500 euro
            
            const quote = await prisma.quote.create({
              data: {
                requestId: request.id,
                professionalId: request.professionalId,
                title: `Preventivo: ${request.title}`,
                description: `Preventivo dettagliato per l'intervento richiesto: ${request.title}`,
                amount: amount,
                status: 'PENDING',
                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 giorni
                metadata: {
                  createdBy: 'system',
                  version: 1
                }
              }
            })
            
            quotesCreated++
            console.log(`   ✅ Preventivo creato: €${(quote.amount/100).toFixed(2)} - ${quote.title}`)
            
            // Crea voci del preventivo
            await prisma.quoteItem.create({
              data: {
                quoteId: quote.id,
                description: 'Manodopera specializzata (2 ore)',
                quantity: 2,
                unitPrice: 5000, // 50 euro/ora
                totalPrice: 10000,
                unit: 'ore',
                order: 1
              }
            })
            
            await prisma.quoteItem.create({
              data: {
                quoteId: quote.id,
                description: 'Materiali e componenti necessari',
                quantity: 1,
                unitPrice: amount - 10000,
                totalPrice: amount - 10000,
                unit: 'forfait',
                order: 2
              }
            })
            
            console.log(`      📝 Create 2 voci per il preventivo`)
          }
        } catch (error) {
          console.log(`   ⚠️ Errore creando preventivo: ${error.message}`)
        }
      }
    }
    
    // Crea anche preventivi per richieste senza professionista (simulazione)
    const pendingRequests = requests.filter(r => !r.professionalId)
    for (const request of pendingRequests.slice(0, 2)) {
      if (professional) {
        try {
          const amount = 15000 + Math.floor(Math.random() * 35000)
          
          const quote = await prisma.quote.create({
            data: {
              requestId: request.id,
              professionalId: professional.id,
              title: `Preventivo: ${request.title}`,
              description: `Offerta per: ${request.title}`,
              amount: amount,
              status: 'DRAFT',
              validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
            }
          })
          
          quotesCreated++
          console.log(`   ✅ Preventivo creato (draft): €${(quote.amount/100).toFixed(2)} - ${quote.title}`)
        } catch (error) {
          console.log(`   ⚠️ Errore: ${error.message}`)
        }
      }
    }
    
    console.log(`   💰 Totale preventivi creati: ${quotesCreated}`)
    
    // 2. CREA NOTIFICHE
    console.log('\n🔔 Creazione notifiche...')
    
    const notificationsData = [
      {
        recipientId: client?.id,
        type: 'REQUEST_CREATED',
        content: 'La tua richiesta "Perdita rubinetto cucina urgente" è stata creata con successo',
        priority: 'MEDIUM'
      },
      {
        recipientId: professional?.id,
        type: 'REQUEST_ASSIGNED',
        content: 'Ti è stata assegnata la richiesta "Interruttore camera non funziona"',
        priority: 'HIGH'
      },
      {
        recipientId: client?.id,
        type: 'QUOTE_RECEIVED',
        content: 'Hai ricevuto un nuovo preventivo per la tua richiesta',
        priority: 'MEDIUM'
      },
      {
        recipientId: users.find(u => u.role === 'SUPER_ADMIN')?.id,
        type: 'SYSTEM',
        content: 'Sistema popolato con successo - 4 richieste, 8 categorie attive',
        priority: 'LOW'
      },
      {
        recipientId: users.find(u => u.role === 'ADMIN')?.id,
        type: 'SYSTEM',
        content: 'Nuove richieste in attesa di assegnazione',
        priority: 'MEDIUM'
      }
    ]
    
    let notifCreated = 0
    for (const notif of notificationsData) {
      if (notif.recipientId) {
        try {
          const existing = await prisma.notification.findFirst({
            where: {
              recipientId: notif.recipientId,
              type: notif.type,
              content: notif.content
            }
          })
          
          if (!existing) {
            await prisma.notification.create({
              data: {
                ...notif,
                isRead: false,
                metadata: {
                  source: 'system_populate'
                }
              }
            })
            notifCreated++
            console.log(`   ✅ Notifica creata: ${notif.type} per ${notif.priority}`)
          }
        } catch (error) {
          console.log(`   ⚠️ Errore notifica: ${error.message}`)
        }
      }
    }
    
    console.log(`   🔔 Totale notifiche create: ${notifCreated}`)
    
    // 3. CREA MESSAGGI
    console.log('\n💬 Creazione messaggi nelle richieste...')
    
    let messagesCreated = 0
    for (const request of requests) {
      if (request.clientId) {
        try {
          const existingMessages = await prisma.message.count({
            where: { requestId: request.id }
          })
          
          if (existingMessages === 0) {
            // Messaggio iniziale del cliente
            await prisma.message.create({
              data: {
                requestId: request.id,
                senderId: request.clientId,
                content: 'Salve, ho bisogno di questo intervento urgentemente. Quando potrebbe venire?',
                type: 'TEXT'
              }
            })
            messagesCreated++
            
            // Se c'è un professionista, aggiungi la sua risposta
            if (request.professionalId) {
              await prisma.message.create({
                data: {
                  requestId: request.id,
                  senderId: request.professionalId,
                  content: 'Buongiorno, posso venire domani mattina alle 9:00 per un sopralluogo gratuito.',
                  type: 'TEXT'
                }
              })
              messagesCreated++
              
              // Risposta del cliente
              await prisma.message.create({
                data: {
                  requestId: request.id,
                  senderId: request.clientId,
                  content: 'Perfetto, l\'aspetto. Grazie!',
                  type: 'TEXT'
                }
              })
              messagesCreated++
            }
          }
        } catch (error) {
          console.log(`   ⚠️ Errore messaggi: ${error.message}`)
        }
      }
    }
    
    console.log(`   💬 Totale messaggi creati: ${messagesCreated}`)
    
    // RIEPILOGO FINALE
    console.log('\n' + '='.repeat(50))
    console.log('📊 RIEPILOGO FINALE:')
    console.log('='.repeat(50))
    
    const finalCounts = {
      users: await prisma.user.count(),
      categories: await prisma.category.count(),
      requests: await prisma.assistanceRequest.count(),
      quotes: await prisma.quote.count(),
      quoteItems: await prisma.quoteItem.count(),
      notifications: await prisma.notification.count(),
      messages: await prisma.message.count()
    }
    
    console.log(`👥 Utenti: ${finalCounts.users}`)
    console.log(`📂 Categorie: ${finalCounts.categories}`)
    console.log(`📋 Richieste: ${finalCounts.requests}`)
    console.log(`💰 Preventivi: ${finalCounts.quotes}`)
    console.log(`📝 Voci preventivo: ${finalCounts.quoteItems}`)
    console.log(`🔔 Notifiche: ${finalCounts.notifications}`)
    console.log(`💬 Messaggi: ${finalCounts.messages}`)
    
    if (finalCounts.quotes > 0 && finalCounts.notifications > 0) {
      console.log('\n✅ DATABASE COMPLETAMENTE POPOLATO!')
      console.log('🚀 Tutti i moduli sono pronti per l\'uso!')
    }
    
  } catch (error) {
    console.error('\n❌ Errore:', error)
  } finally {
    await prisma.$disconnect()
  }
}

populateQuotesAndNotifications()
EOF

echo ""
echo "======================================"
echo "✅ Script completato!"
