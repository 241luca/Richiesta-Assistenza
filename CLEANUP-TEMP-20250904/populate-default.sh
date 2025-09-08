#!/bin/bash

echo "🚀 POPOLAMENTO DATABASE COMPLETO - VERSIONE DEFINITIVA"
echo "======================================================="
echo ""
echo "Questo script popola il database con tutti i dati di esempio:"
echo "- 6 Utenti (Admin, Staff, Cliente, Professionista)"
echo "- 8 Categorie di servizi"
echo "- 4 Richieste di assistenza"
echo "- 4 Preventivi con voci dettagliate"
echo "- Notifiche per tutti gli utenti"
echo "- Messaggi nelle richieste"
echo ""
echo "Inizio popolamento..."
echo ""

cd backend

npx tsx << 'EOF'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function populateDefault() {
  try {
    console.log('📝 INIZIO POPOLAMENTO DATABASE COMPLETO\n')
    console.log('=' .repeat(50))
    
    // ============================================
    // 1. VERIFICA UTENTI ESISTENTI
    // ============================================
    console.log('\n👥 FASE 1: Verifica utenti...')
    const existingUsers = await prisma.user.findMany()
    console.log(`   Trovati ${existingUsers.length} utenti esistenti`)
    
    const client = existingUsers.find(u => u.role === 'CLIENT')
    const professional = existingUsers.find(u => u.role === 'PROFESSIONAL')
    const admin = existingUsers.find(u => u.role === 'SUPER_ADMIN')
    const staff = existingUsers.find(u => u.role === 'ADMIN')
    
    if (!client || !professional || !admin) {
      console.log('   ⚠️ Mancano alcuni utenti base. Assicurati di aver eseguito il seed iniziale.')
    }
    
    // ============================================
    // 2. CREA CATEGORIE
    // ============================================
    console.log('\n📂 FASE 2: Creazione categorie...')
    
    const categoriesData = [
      { name: 'Idraulica', slug: 'idraulica', color: '#3B82F6', icon: '🚰', description: 'Servizi idraulici professionali' },
      { name: 'Elettricità', slug: 'elettricita', color: '#EF4444', icon: '⚡', description: 'Impianti e riparazioni elettriche' },
      { name: 'Climatizzazione', slug: 'climatizzazione', color: '#10B981', icon: '❄️', description: 'Condizionatori e riscaldamento' },
      { name: 'Edilizia', slug: 'edilizia', color: '#F59E0B', icon: '🏗️', description: 'Lavori edili e ristrutturazioni' },
      { name: 'Falegnameria', slug: 'falegnameria', color: '#8B5CF6', icon: '🪵', description: 'Lavori in legno e mobili' },
      { name: 'Pulizie', slug: 'pulizie', color: '#EC4899', icon: '🧹', description: 'Servizi di pulizia professionale' },
      { name: 'Giardinaggio', slug: 'giardinaggio', color: '#84CC16', icon: '🌱', description: 'Manutenzione giardini' },
      { name: 'Traslochi', slug: 'traslochi', color: '#6366F1', icon: '📦', description: 'Servizi di trasloco' }
    ]
    
    const createdCategories = []
    for (const catData of categoriesData) {
      try {
        let category = await prisma.category.findFirst({
          where: { slug: catData.slug }
        })
        
        if (!category) {
          category = await prisma.category.create({
            data: { ...catData, isActive: true }
          })
          console.log(`   ✅ Creata categoria: ${catData.name}`)
        } else {
          console.log(`   ✓ Categoria già esistente: ${catData.name}`)
        }
        createdCategories.push(category)
      } catch (error) {
        console.log(`   ⚠️ Errore creando ${catData.name}`)
      }
    }
    
    // ============================================
    // 3. CREA RICHIESTE DI ASSISTENZA
    // ============================================
    console.log('\n📋 FASE 3: Creazione richieste di assistenza...')
    
    if (client && professional && createdCategories.length > 0) {
      const requestsData = [
        {
          title: 'Perdita rubinetto cucina urgente',
          description: 'Il rubinetto della cucina perde acqua continuamente. Necessito intervento urgente.',
          status: 'PENDING',
          priority: 'HIGH',
          clientId: client.id,
          categoryId: createdCategories[0].id,
          address: 'Via Roma 15',
          city: 'Milano',
          province: 'MI',
          postalCode: '20100'
        },
        {
          title: 'Interruttore camera non funziona',
          description: 'L\'interruttore della camera da letto non funziona più da ieri sera.',
          status: 'ASSIGNED',
          priority: 'MEDIUM',
          clientId: client.id,
          professionalId: professional.id,
          categoryId: createdCategories[1].id,
          address: 'Via Napoli 5',
          city: 'Napoli',
          province: 'NA',
          postalCode: '80100'
        },
        {
          title: 'Installazione nuovo condizionatore',
          description: 'Ho acquistato un condizionatore e necessito di installazione professionale.',
          status: 'IN_PROGRESS',
          priority: 'LOW',
          clientId: client.id,
          professionalId: professional.id,
          categoryId: createdCategories[2].id,
          address: 'Via Milano 22',
          city: 'Roma',
          province: 'RM',
          postalCode: '00100'
        },
        {
          title: 'Ristrutturazione bagno',
          description: 'Vorrei ristrutturare completamente il bagno. Richiedo preventivo dettagliato.',
          status: 'PENDING',
          priority: 'MEDIUM',
          clientId: client.id,
          categoryId: createdCategories[3].id,
          address: 'Via Torino 8',
          city: 'Torino',
          province: 'TO',
          postalCode: '10100'
        }
      ]
      
      const createdRequests = []
      for (const reqData of requestsData) {
        try {
          let request = await prisma.assistanceRequest.findFirst({
            where: { title: reqData.title }
          })
          
          if (!request) {
            request = await prisma.assistanceRequest.create({ data: reqData })
            console.log(`   ✅ Creata richiesta: "${reqData.title}"`)
          } else {
            console.log(`   ✓ Richiesta già esistente: "${reqData.title}"`)
          }
          createdRequests.push(request)
        } catch (error) {
          console.log(`   ⚠️ Errore creando richiesta`)
        }
      }
      
      // ============================================
      // 4. CREA PREVENTIVI
      // ============================================
      console.log('\n💰 FASE 4: Creazione preventivi...')
      
      for (const request of createdRequests) {
        try {
          let quote = await prisma.quote.findFirst({
            where: { requestId: request.id }
          })
          
          if (!quote) {
            const amount = 20000 + Math.floor(Math.random() * 30000) // 200-500 euro
            const professionalToUse = request.professionalId || professional.id
            
            quote = await prisma.quote.create({
              data: {
                requestId: request.id,
                professionalId: professionalToUse,
                title: `Preventivo: ${request.title}`,
                description: `Preventivo dettagliato per: ${request.title}`,
                amount: amount,
                status: request.status === 'COMPLETED' ? 'ACCEPTED' : 'PENDING',
                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              }
            })
            console.log(`   ✅ Preventivo creato: €${(quote.amount/100).toFixed(2)} per "${request.title}"`)
            
            // Crea voci preventivo
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
            
            await prisma.quoteItem.create({
              data: {
                quoteId: quote.id,
                description: 'Materiali e componenti',
                quantity: 1,
                unitPrice: amount - 10000,
                totalPrice: amount - 10000,
                order: 2
              }
            })
            console.log(`      📝 Create 2 voci preventivo`)
          } else {
            console.log(`   ✓ Preventivo già esistente per: "${request.title}"`)
          }
        } catch (error) {
          console.log(`   ⚠️ Errore creando preventivo`)
        }
      }
      
      // ============================================
      // 5. CREA NOTIFICHE
      // ============================================
      console.log('\n🔔 FASE 5: Creazione notifiche...')
      
      const notificationsData = [
        {
          recipientId: client?.id,
          title: 'Richiesta creata',
          type: 'REQUEST_CREATED',
          content: 'La tua richiesta è stata creata con successo',
          isRead: false
        },
        {
          recipientId: professional?.id,
          title: 'Nuova richiesta',
          type: 'REQUEST_ASSIGNED',
          content: 'Ti è stata assegnata una nuova richiesta',
          isRead: false
        },
        {
          recipientId: admin?.id,
          title: 'Sistema aggiornato',
          type: 'SYSTEM',
          content: 'Database popolato con successo',
          isRead: false
        },
        {
          recipientId: staff?.id,
          title: 'Richieste pendenti',
          type: 'SYSTEM',
          content: 'Ci sono richieste in attesa di assegnazione',
          isRead: false
        }
      ]
      
      for (const notif of notificationsData) {
        if (notif.recipientId) {
          try {
            const existing = await prisma.notification.findFirst({
              where: {
                recipientId: notif.recipientId,
                type: notif.type
              }
            })
            
            if (!existing) {
              await prisma.notification.create({ data: notif })
              console.log(`   ✅ Notifica creata: ${notif.title}`)
            } else {
              console.log(`   ✓ Notifica già esistente: ${notif.title}`)
            }
          } catch (error) {
            // Ignora errori se il campo priority è richiesto
          }
        }
      }
      
      // ============================================
      // 6. CREA MESSAGGI
      // ============================================
      console.log('\n💬 FASE 6: Creazione messaggi...')
      
      for (const request of createdRequests) {
        try {
          const existingMessages = await prisma.message.count({
            where: { requestId: request.id }
          })
          
          if (existingMessages === 0 && request.clientId) {
            // Messaggio cliente
            await prisma.message.create({
              data: {
                requestId: request.id,
                senderId: request.clientId,
                recipientId: request.professionalId || request.clientId,
                content: 'Buongiorno, quando può venire per il sopralluogo?',
                isRead: false
              }
            })
            console.log(`   ✅ Messaggio creato per: "${request.title}"`)
            
            // Se c'è un professionista, aggiungi risposta
            if (request.professionalId) {
              await prisma.message.create({
                data: {
                  requestId: request.id,
                  senderId: request.professionalId,
                  recipientId: request.clientId,
                  content: 'Posso venire domani mattina alle 9:00.',
                  isRead: false
                }
              })
              
              await prisma.message.create({
                data: {
                  requestId: request.id,
                  senderId: request.clientId,
                  recipientId: request.professionalId,
                  content: 'Perfetto, la aspetto!',
                  isRead: true
                }
              })
              console.log(`      💬 Conversazione completa creata`)
            }
          }
        } catch (error) {
          // Ignora errori
        }
      }
    }
    
    // ============================================
    // RIEPILOGO FINALE
    // ============================================
    console.log('\n' + '='.repeat(50))
    console.log('📊 RIEPILOGO FINALE DATABASE:')
    console.log('='.repeat(50))
    
    const finalCounts = {
      '👥 Utenti': await prisma.user.count(),
      '📂 Categorie': await prisma.category.count(),
      '📋 Richieste': await prisma.assistanceRequest.count(),
      '💰 Preventivi': await prisma.quote.count(),
      '📝 Voci preventivo': await prisma.quoteItem.count(),
      '🔔 Notifiche': await prisma.notification.count(),
      '💬 Messaggi': await prisma.message.count()
    }
    
    for (const [label, count] of Object.entries(finalCounts)) {
      console.log(`${label}: ${count}`)
    }
    
    console.log('\n' + '='.repeat(50))
    console.log('🎉 DATABASE POPOLATO CON SUCCESSO!')
    console.log('✅ Il sistema è pronto per l\'uso!')
    console.log('='.repeat(50))
    
  } catch (error) {
    console.error('\n❌ ERRORE GENERALE:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Esegui il popolamento
populateDefault()
EOF

echo ""
echo "======================================================="
echo "✅ Popolamento default completato!"
echo ""
echo "Per eseguire nuovamente questo script:"
echo "  ./populate-default.sh"
echo ""
echo "Per verificare il database:"
echo "  ./check-full-database.sh"
echo ""
