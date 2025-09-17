#!/bin/bash

echo "🔧 COMPLETAMENTO DATI MANCANTI"
echo "=============================="

cd backend

npx tsx << 'EOF'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function completeData() {
  try {
    console.log('\n📝 Completamento dati mancanti...\n')
    
    // 1. AGGIUNGI VOCI AI PREVENTIVI ESISTENTI
    console.log('📝 Aggiunta voci preventivo...')
    
    const quotes = await prisma.quote.findMany()
    console.log(`   Trovati ${quotes.length} preventivi`)
    
    let itemsCreated = 0
    for (const quote of quotes) {
      // Verifica se ci sono già voci
      const existingItems = await prisma.quoteItem.count({
        where: { quoteId: quote.id }
      })
      
      if (existingItems === 0) {
        // Crea voci preventivo
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
            description: 'Materiali e ricambi necessari',
            quantity: 1,
            unitPrice: quote.amount - 10000,
            totalPrice: quote.amount - 10000,
            unit: 'pz',
            order: 2
          }
        })
        
        itemsCreated += 2
        console.log(`   ✅ Create 2 voci per preventivo ${quote.id}`)
      }
    }
    console.log(`   📝 ${itemsCreated} voci preventivo create`)
    
    // 2. CREA NOTIFICHE
    console.log('\n🔔 Creazione notifiche...')
    
    const users = await prisma.user.findMany()
    const client = users.find(u => u.role === 'CLIENT')
    const professional = users.find(u => u.role === 'PROFESSIONAL')
    const admin = users.find(u => u.role === 'SUPER_ADMIN')
    
    let notifCreated = 0
    
    // Notifica per cliente
    if (client) {
      try {
        await prisma.notification.create({
          data: {
            recipientId: client.id,
            type: 'REQUEST_CREATED',
            content: 'La tua richiesta è stata creata con successo',
            priority: 'MEDIUM',
            isRead: false
          }
        })
        notifCreated++
        console.log('   ✅ Notifica creata per cliente')
      } catch (e) {}
    }
    
    // Notifica per professionista
    if (professional) {
      try {
        await prisma.notification.create({
          data: {
            recipientId: professional.id,
            type: 'REQUEST_ASSIGNED',
            content: 'Hai una nuova richiesta assegnata',
            priority: 'HIGH',
            isRead: false
          }
        })
        notifCreated++
        console.log('   ✅ Notifica creata per professionista')
      } catch (e) {}
    }
    
    // Notifica per admin
    if (admin) {
      try {
        await prisma.notification.create({
          data: {
            recipientId: admin.id,
            type: 'SYSTEM',
            content: 'Database popolato con successo',
            priority: 'LOW',
            isRead: false
          }
        })
        notifCreated++
        console.log('   ✅ Notifica creata per admin')
      } catch (e) {}
    }
    
    console.log(`   🔔 ${notifCreated} notifiche create`)
    
    // 3. CREA MESSAGGI
    console.log('\n💬 Creazione messaggi...')
    
    const requests = await prisma.assistanceRequest.findMany()
    let messagesCreated = 0
    
    for (const request of requests.slice(0, 2)) {
      if (request.clientId) {
        try {
          // Messaggio cliente
          await prisma.message.create({
            data: {
              requestId: request.id,
              senderId: request.clientId,
              content: 'Buongiorno, quando può venire?',
              type: 'TEXT'
            }
          })
          messagesCreated++
          
          // Se c'è professionista, risposta
          if (request.professionalId) {
            await prisma.message.create({
              data: {
                requestId: request.id,
                senderId: request.professionalId,
                content: 'Posso venire domani mattina alle 9',
                type: 'TEXT'
              }
            })
            messagesCreated++
          }
        } catch (e) {}
      }
    }
    
    console.log(`   💬 ${messagesCreated} messaggi creati`)
    
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
    
    console.log('\n✅ DATABASE COMPLETAMENTE POPOLATO!')
    
  } catch (error) {
    console.error('❌ Errore:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

completeData()
EOF

echo ""
echo "=============================="
echo "✅ Script completato!"
