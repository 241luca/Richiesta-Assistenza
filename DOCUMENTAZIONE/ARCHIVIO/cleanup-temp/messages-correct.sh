#!/bin/bash

echo "💬 MESSAGGI - VERSIONE CORRETTA"
echo "================================"

cd backend

npx tsx << 'EOF'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addMessagesCorrect() {
  try {
    console.log('\n💬 Aggiunta messaggi senza campo type...\n')
    
    const requests = await prisma.assistanceRequest.findMany()
    const users = await prisma.user.findMany()
    
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
          
          // Messaggio 1: Cliente
          try {
            await prisma.message.create({
              data: {
                requestId: request.id,
                senderId: request.clientId,
                recipientId: request.professionalId || request.clientId,
                content: 'Buongiorno, ho bisogno di questo intervento. Quando può venire?',
                isRead: false
              }
            })
            messagesCreated++
            console.log(`      ✅ Messaggio cliente creato`)
          } catch (e) {
            console.log(`      ⚠️ Errore: ${e.message.split('\n')[0]}`)
          }
          
          // Se c'è un professionista
          if (request.professionalId) {
            try {
              // Risposta professionista
              await prisma.message.create({
                data: {
                  requestId: request.id,
                  senderId: request.professionalId,
                  recipientId: request.clientId,
                  content: 'Posso venire domani mattina alle 9:00. Va bene?',
                  isRead: false
                }
              })
              messagesCreated++
              console.log(`      ✅ Risposta professionista`)
              
              // Conferma cliente
              await prisma.message.create({
                data: {
                  requestId: request.id,
                  senderId: request.clientId,
                  recipientId: request.professionalId,
                  content: 'Perfetto, l\'aspetto! Grazie.',
                  isRead: true
                }
              })
              messagesCreated++
              console.log(`      ✅ Conferma cliente`)
              
            } catch (e) {
              console.log(`      ⚠️ Errore: ${e.message.split('\n')[0]}`)
            }
          } else {
            // Messaggio di sistema (dall'admin)
            const admin = users.find(u => u.role === 'SUPER_ADMIN')
            if (admin) {
              try {
                await prisma.message.create({
                  data: {
                    requestId: request.id,
                    senderId: admin.id,
                    recipientId: request.clientId,
                    content: 'Richiesta ricevuta. Stiamo cercando un professionista.',
                    isRead: false
                  }
                })
                messagesCreated++
                console.log(`      ✅ Messaggio sistema`)
              } catch (e) {
                console.log(`      ⚠️ Errore sistema: ${e.message.split('\n')[0]}`)
              }
            }
          }
        }
      } catch (error) {
        console.log(`   ⚠️ Errore generale: ${error.message}`)
      }
    }
    
    console.log(`\n   💬 TOTALE MESSAGGI CREATI: ${messagesCreated}`)
    
    // RIEPILOGO
    console.log('\n' + '='.repeat(50))
    console.log('📊 DATABASE FINALE:')
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
    
    for (const [key, value] of Object.entries(counts)) {
      console.log(`${key}: ${value}`)
    }
    
    if (counts.messages > 0) {
      console.log('\n🎉 MESSAGGI CREATI CON SUCCESSO!')
      console.log('✅ DATABASE COMPLETAMENTE POPOLATO!')
    } else {
      console.log('\n⚠️ Nessun messaggio creato')
    }
    
  } catch (error) {
    console.error('❌ Errore:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addMessagesCorrect()
EOF

echo "================================"
echo "✅ Script eseguito!"
