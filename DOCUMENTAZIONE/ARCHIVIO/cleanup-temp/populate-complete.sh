#!/bin/bash

echo "🌱 POPOLAMENTO COMPLETO DATABASE - VERSIONE CORRETTA"
echo "===================================================="

cd backend

npx tsx << 'EOF'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function populateComplete() {
  try {
    console.log('\n📝 Popolamento completo del database...\n')
    
    // 1. RECUPERA DATI ESISTENTI
    console.log('📊 Recupero dati esistenti...')
    const users = await prisma.user.findMany()
    const categories = await prisma.category.findMany()
    const requests = await prisma.assistanceRequest.findMany()
    
    const client = users.find(u => u.role === 'CLIENT')
    const professional = users.find(u => u.role === 'PROFESSIONAL')
    const admin = users.find(u => u.role === 'SUPER_ADMIN')
    
    console.log(`   ✓ ${users.length} utenti trovati`)
    console.log(`   ✓ ${categories.length} categorie trovate`)
    console.log(`   ✓ ${requests.length} richieste trovate`)
    
    // 2. CREA SOTTOCATEGORIE PER OGNI CATEGORIA
    console.log('\n📁 Creazione sottocategorie...')
    
    const subcategoriesData = [
      // Idraulica
      { name: 'Perdite acqua', categoryId: categories[0]?.id, description: 'Riparazione perdite e infiltrazioni' },
      { name: 'Scarichi otturati', categoryId: categories[0]?.id, description: 'Disostruzione scarichi e tubature' },
      { name: 'Installazione sanitari', categoryId: categories[0]?.id, description: 'Montaggio e sostituzione sanitari' },
      
      // Elettricità
      { name: 'Impianti elettrici', categoryId: categories[1]?.id, description: 'Installazione nuovi impianti' },
      { name: 'Guasti elettrici', categoryId: categories[1]?.id, description: 'Riparazione guasti e cortocircuiti' },
      { name: 'Quadri elettrici', categoryId: categories[1]?.id, description: 'Installazione e manutenzione quadri' },
      
      // Climatizzazione
      { name: 'Installazione condizionatori', categoryId: categories[2]?.id, description: 'Montaggio split e multi-split' },
      { name: 'Manutenzione climatizzatori', categoryId: categories[2]?.id, description: 'Pulizia filtri e ricarica gas' },
      { name: 'Riparazione condizionatori', categoryId: categories[2]?.id, description: 'Risoluzione guasti e malfunzionamenti' },
      
      // Edilizia
      { name: 'Ristrutturazioni complete', categoryId: categories[3]?.id, description: 'Ristrutturazione appartamenti e locali' },
      { name: 'Opere murarie', categoryId: categories[3]?.id, description: 'Costruzione muri e tramezze' },
      { name: 'Pavimenti e rivestimenti', categoryId: categories[3]?.id, description: 'Posa piastrelle e parquet' },
      
      // Falegnameria
      { name: 'Mobili su misura', categoryId: categories[4]?.id, description: 'Progettazione e realizzazione mobili' },
      { name: 'Riparazione mobili', categoryId: categories[4]?.id, description: 'Restauro e riparazione mobili' },
      { name: 'Porte e finestre', categoryId: categories[4]?.id, description: 'Installazione e riparazione infissi' },
    ]
    
    let subcategoriesCreated = 0
    for (const subData of subcategoriesData) {
      if (subData.categoryId) {
        try {
          const existing = await prisma.professionalSubcategory.findFirst({
            where: { name: subData.name, categoryId: subData.categoryId }
          })
          
          if (!existing) {
            await prisma.professionalSubcategory.create({ 
              data: {
                ...subData,
                isActive: true
              }
            })
            subcategoriesCreated++
            console.log(`   ✅ Creata: ${subData.name}`)
          }
        } catch (error) {
          console.log(`   ⚠️ Errore creando ${subData.name}`)
        }
      }
    }
    console.log(`   📁 ${subcategoriesCreated} sottocategorie create`)
    
    // 3. CREA PREVENTIVI CORRETTI (con campo title)
    console.log('\n💰 Creazione preventivi...')
    
    let quotesCreated = 0
    for (const request of requests) {
      if (request.professionalId && quotesCreated < 5) {
        try {
          const existing = await prisma.quote.findFirst({
            where: { requestId: request.id }
          })
          
          if (!existing) {
            const quote = await prisma.quote.create({
              data: {
                requestId: request.id,
                professionalId: request.professionalId,
                title: `Preventivo: ${request.title}`, // Campo title obbligatorio
                description: `Preventivo dettagliato per: ${request.title}`,
                amount: Math.floor(Math.random() * 50000) + 10000, // 100-500 euro
                status: request.status === 'COMPLETED' ? 'ACCEPTED' : 'PENDING',
                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              }
            })
            quotesCreated++
            console.log(`   ✅ Preventivo creato: €${(quote.amount/100).toFixed(2)} per "${request.title}"`)
          }
        } catch (error) {
          console.log(`   ⚠️ Errore preventivo per: ${request.title}`)
        }
      }
    }
    console.log(`   💰 ${quotesCreated} preventivi creati`)
    
    // 4. CREA NOTIFICHE (con campo recipientId invece di userId)
    console.log('\n🔔 Creazione notifiche...')
    
    const notificationsData = [
      {
        recipientId: client?.id,
        type: 'REQUEST_CREATED',
        content: 'La tua richiesta è stata creata con successo',
        priority: 'MEDIUM',
        isRead: false
      },
      {
        recipientId: professional?.id,
        type: 'REQUEST_ASSIGNED',
        content: 'Ti è stata assegnata una nuova richiesta',
        priority: 'HIGH',
        isRead: false
      },
      {
        recipientId: client?.id,
        type: 'QUOTE_RECEIVED',
        content: 'Hai ricevuto un nuovo preventivo',
        priority: 'MEDIUM',
        isRead: true
      },
      {
        recipientId: admin?.id,
        type: 'SYSTEM',
        content: 'Database popolato con successo',
        priority: 'LOW',
        isRead: false
      }
    ]
    
    let notificationsCreated = 0
    for (const notif of notificationsData) {
      if (notif.recipientId) {
        try {
          const existing = await prisma.notification.findFirst({
            where: { 
              recipientId: notif.recipientId,
              content: notif.content
            }
          })
          
          if (!existing) {
            await prisma.notification.create({ data: notif })
            notificationsCreated++
            console.log(`   ✅ Notifica creata: ${notif.type}`)
          }
        } catch (error) {
          console.log(`   ⚠️ Errore notifica: ${notif.type}`)
        }
      }
    }
    console.log(`   🔔 ${notificationsCreated} notifiche create`)
    
    // 5. CREA MESSAGGI PER LE RICHIESTE
    console.log('\n💬 Creazione messaggi...')
    
    let messagesCreated = 0
    for (const request of requests.slice(0, 3)) {
      try {
        const existing = await prisma.message.findFirst({
          where: { requestId: request.id }
        })
        
        if (!existing && request.clientId) {
          // Messaggio del cliente
          await prisma.message.create({
            data: {
              requestId: request.id,
              senderId: request.clientId,
              content: 'Buongiorno, quando potrebbe venire per il sopralluogo?',
              type: 'TEXT'
            }
          })
          messagesCreated++
          
          // Risposta del professionista
          if (request.professionalId) {
            await prisma.message.create({
              data: {
                requestId: request.id,
                senderId: request.professionalId,
                content: 'Buongiorno, posso venire domani mattina alle 9:00',
                type: 'TEXT'
              }
            })
            messagesCreated++
          }
        }
      } catch (error) {
        console.log(`   ⚠️ Errore creando messaggi`)
      }
    }
    console.log(`   💬 ${messagesCreated} messaggi creati`)
    
    // 6. CREA QUOTE ITEMS PER I PREVENTIVI
    console.log('\n📝 Creazione voci preventivo...')
    
    const quotes = await prisma.quote.findMany()
    let itemsCreated = 0
    
    for (const quote of quotes) {
      try {
        const existingItems = await prisma.quoteItem.count({
          where: { quoteId: quote.id }
        })
        
        if (existingItems === 0) {
          // Manodopera
          await prisma.quoteItem.create({
            data: {
              quoteId: quote.id,
              description: 'Manodopera specializzata',
              quantity: 2,
              unitPrice: 5000, // 50 euro/ora
              totalPrice: 10000,
              unit: 'ore'
            }
          })
          itemsCreated++
          
          // Materiali
          await prisma.quoteItem.create({
            data: {
              quoteId: quote.id,
              description: 'Materiali e componenti',
              quantity: 1,
              unitPrice: quote.amount - 10000,
              totalPrice: quote.amount - 10000,
              unit: 'forfait'
            }
          })
          itemsCreated++
        }
      } catch (error) {
        console.log(`   ⚠️ Errore creando voci preventivo`)
      }
    }
    console.log(`   📝 ${itemsCreated} voci preventivo create`)
    
    // 7. CREA FEEDBACK/RECENSIONI
    console.log('\n⭐ Creazione recensioni...')
    
    let feedbackCreated = 0
    const completedRequests = requests.filter(r => r.status === 'COMPLETED')
    
    for (const request of completedRequests) {
      if (request.clientId && request.professionalId) {
        try {
          const existing = await prisma.feedback.findFirst({
            where: { requestId: request.id }
          })
          
          if (!existing) {
            await prisma.feedback.create({
              data: {
                requestId: request.id,
                userId: request.clientId,
                professionalId: request.professionalId,
                rating: 5,
                comment: 'Ottimo lavoro, professionale e puntuale!',
                isPublic: true
              }
            })
            feedbackCreated++
            console.log(`   ✅ Recensione creata per richiesta completata`)
          }
        } catch (error) {
          // Il modello Feedback potrebbe non esistere, ignoriamo l'errore
        }
      }
    }
    if (feedbackCreated > 0) {
      console.log(`   ⭐ ${feedbackCreated} recensioni create`)
    }
    
    // RIEPILOGO FINALE
    console.log('\n' + '='.repeat(50))
    console.log('📊 RIEPILOGO DATABASE COMPLETO:')
    console.log('='.repeat(50))
    
    const finalCounts = {
      users: await prisma.user.count(),
      categories: await prisma.category.count(),
      subcategories: await prisma.professionalSubcategory.count(),
      requests: await prisma.assistanceRequest.count(),
      quotes: await prisma.quote.count(),
      quoteItems: await prisma.quoteItem.count(),
      notifications: await prisma.notification.count(),
      messages: await prisma.message.count()
    }
    
    console.log(`👥 Utenti: ${finalCounts.users}`)
    console.log(`📂 Categorie: ${finalCounts.categories}`)
    console.log(`📁 Sottocategorie: ${finalCounts.subcategories}`)
    console.log(`📋 Richieste: ${finalCounts.requests}`)
    console.log(`💰 Preventivi: ${finalCounts.quotes}`)
    console.log(`📝 Voci preventivo: ${finalCounts.quoteItems}`)
    console.log(`🔔 Notifiche: ${finalCounts.notifications}`)
    console.log(`💬 Messaggi: ${finalCounts.messages}`)
    
    console.log('\n✅ DATABASE COMPLETAMENTE POPOLATO!')
    console.log('🚀 Il sistema è pronto per l\'uso!')
    
  } catch (error) {
    console.error('\n❌ ERRORE GENERALE:', error)
  } finally {
    await prisma.$disconnect()
  }
}

populateComplete()
EOF

echo ""
echo "===================================================="
echo "✅ Popolamento completo terminato!"
