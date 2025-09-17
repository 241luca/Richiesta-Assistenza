#!/bin/bash

echo "🌱 POPOLAMENTO DATABASE COMPLETO"
echo "================================="

cd backend

npx tsx << 'EOF'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function populateDatabase() {
  try {
    console.log('\n📝 Inizio popolamento database...\n')
    
    // 1. RECUPERA UTENTI ESISTENTI
    console.log('👥 Recupero utenti esistenti...')
    const users = await prisma.user.findMany()
    const client = users.find(u => u.role === 'CLIENT')
    const professional = users.find(u => u.role === 'PROFESSIONAL')
    const admin = users.find(u => u.role === 'SUPER_ADMIN')
    
    console.log(`   ✓ Trovati ${users.length} utenti`)
    
    // 2. CREA CATEGORIE (con slug obbligatorio)
    console.log('\n📂 Creazione categorie...')
    
    const categories = [
      { 
        name: 'Idraulica', 
        slug: 'idraulica',
        color: '#3B82F6', 
        icon: '🚰', 
        description: 'Servizi idraulici professionali',
        isActive: true
      },
      { 
        name: 'Elettricità', 
        slug: 'elettricita',
        color: '#EF4444', 
        icon: '⚡', 
        description: 'Impianti e riparazioni elettriche',
        isActive: true
      },
      { 
        name: 'Climatizzazione', 
        slug: 'climatizzazione',
        color: '#10B981', 
        icon: '❄️', 
        description: 'Condizionatori e riscaldamento',
        isActive: true
      },
      { 
        name: 'Edilizia', 
        slug: 'edilizia',
        color: '#F59E0B', 
        icon: '🏗️', 
        description: 'Lavori edili e ristrutturazioni',
        isActive: true
      },
      { 
        name: 'Falegnameria', 
        slug: 'falegnameria',
        color: '#8B5CF6', 
        icon: '🪵', 
        description: 'Lavori in legno e mobili',
        isActive: true
      },
      { 
        name: 'Pulizie', 
        slug: 'pulizie',
        color: '#EC4899', 
        icon: '🧹', 
        description: 'Servizi di pulizia professionale',
        isActive: true
      },
      { 
        name: 'Giardinaggio', 
        slug: 'giardinaggio',
        color: '#84CC16', 
        icon: '🌱', 
        description: 'Manutenzione giardini',
        isActive: true
      },
      { 
        name: 'Traslochi', 
        slug: 'traslochi',
        color: '#6366F1', 
        icon: '📦', 
        description: 'Servizi di trasloco',
        isActive: true
      }
    ]
    
    const createdCategories = []
    
    for (const catData of categories) {
      try {
        const existing = await prisma.category.findFirst({
          where: { slug: catData.slug }
        })
        
        if (existing) {
          console.log(`   ✓ ${catData.name} già esistente`)
          createdCategories.push(existing)
        } else {
          const newCat = await prisma.category.create({ data: catData })
          console.log(`   ✅ Creata: ${catData.name}`)
          createdCategories.push(newCat)
        }
      } catch (error) {
        console.log(`   ⚠️ Errore creando ${catData.name}:`, error.message)
      }
    }
    
    // 3. CREA RICHIESTE DI ASSISTENZA
    console.log('\n📋 Creazione richieste di assistenza...')
    
    if (client && professional && createdCategories.length > 0) {
      const requests = [
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
        },
        {
          title: 'Riparazione armadio',
          description: 'L\'anta dell\'armadio è rotta e necessita riparazione.',
          status: 'COMPLETED',
          priority: 'LOW',
          clientId: client.id,
          professionalId: professional.id,
          categoryId: createdCategories[4].id,
          address: 'Via Firenze 12',
          city: 'Firenze',
          province: 'FI',
          postalCode: '50100',
          completedAt: new Date('2025-08-20')
        }
      ]
      
      const createdRequests = []
      
      for (const reqData of requests) {
        try {
          const existing = await prisma.assistanceRequest.findFirst({
            where: { title: reqData.title }
          })
          
          if (!existing) {
            const newReq = await prisma.assistanceRequest.create({ data: reqData })
            console.log(`   ✅ Creata: "${reqData.title}"`)
            createdRequests.push(newReq)
          } else {
            console.log(`   ✓ "${reqData.title}" già esistente`)
            createdRequests.push(existing)
          }
        } catch (error) {
          console.log(`   ⚠️ Errore creando richiesta:`, error.message)
        }
      }
      
      // 4. CREA PREVENTIVI
      console.log('\n💰 Creazione preventivi...')
      
      for (const request of createdRequests.slice(0, 3)) {
        if (request.professionalId) {
          try {
            const existing = await prisma.quote.findFirst({
              where: { requestId: request.id }
            })
            
            if (!existing) {
              const quote = await prisma.quote.create({
                data: {
                  requestId: request.id,
                  professionalId: request.professionalId,
                  amount: Math.floor(Math.random() * 50000) + 10000, // 100-500 euro in cents
                  description: `Preventivo per: ${request.title}`,
                  status: request.status === 'COMPLETED' ? 'ACCEPTED' : 'PENDING',
                  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 giorni
                }
              })
              console.log(`   ✅ Creato preventivo per: "${request.title}" (€${(quote.amount/100).toFixed(2)})`)
            } else {
              console.log(`   ✓ Preventivo già esistente per: "${request.title}"`)
            }
          } catch (error) {
            console.log(`   ⚠️ Errore creando preventivo:`, error.message)
          }
        }
      }
      
      // 5. CREA NOTIFICHE
      console.log('\n🔔 Creazione notifiche di esempio...')
      
      const notifications = [
        {
          userId: client.id,
          title: 'Nuova richiesta creata',
          message: 'La tua richiesta "Perdita rubinetto cucina urgente" è stata creata con successo',
          type: 'REQUEST_CREATED',
          isRead: false
        },
        {
          userId: professional.id,
          title: 'Nuova richiesta assegnata',
          message: 'Ti è stata assegnata la richiesta "Interruttore camera non funziona"',
          type: 'REQUEST_ASSIGNED',
          isRead: false
        },
        {
          userId: client.id,
          title: 'Preventivo ricevuto',
          message: 'Hai ricevuto un nuovo preventivo per la tua richiesta',
          type: 'QUOTE_RECEIVED',
          isRead: true
        }
      ]
      
      for (const notif of notifications) {
        try {
          const existing = await prisma.notification.findFirst({
            where: { 
              userId: notif.userId,
              title: notif.title 
            }
          })
          
          if (!existing) {
            await prisma.notification.create({ data: notif })
            console.log(`   ✅ Creata notifica: "${notif.title}"`)
          } else {
            console.log(`   ✓ Notifica già esistente: "${notif.title}"`)
          }
        } catch (error) {
          console.log(`   ⚠️ Errore creando notifica:`, error.message)
        }
      }
      
    } else {
      console.log('   ⚠️ Nessuna categoria creata o utenti mancanti')
    }
    
    // RIEPILOGO FINALE
    console.log('\n' + '='.repeat(50))
    console.log('📊 RIEPILOGO DATABASE:')
    console.log('='.repeat(50))
    
    const finalCounts = {
      users: await prisma.user.count(),
      categories: await prisma.category.count(),
      requests: await prisma.assistanceRequest.count(),
      quotes: await prisma.quote.count(),
      notifications: await prisma.notification.count()
    }
    
    console.log(`👥 Utenti: ${finalCounts.users}`)
    console.log(`📂 Categorie: ${finalCounts.categories}`)
    console.log(`📋 Richieste: ${finalCounts.requests}`)
    console.log(`💰 Preventivi: ${finalCounts.quotes}`)
    console.log(`🔔 Notifiche: ${finalCounts.notifications}`)
    
    if (finalCounts.categories > 0 && finalCounts.requests > 0) {
      console.log('\n✅ DATABASE POPOLATO CON SUCCESSO!')
    } else {
      console.log('\n⚠️ Database parzialmente popolato')
    }
    
  } catch (error) {
    console.error('\n❌ ERRORE GENERALE:', error)
  } finally {
    await prisma.$disconnect()
  }
}

populateDatabase()
EOF

echo ""
echo "================================="
echo "✅ Script completato!"
