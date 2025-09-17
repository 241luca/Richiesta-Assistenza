#!/bin/bash

echo "🔧 COMPLETAMENTO DATABASE - PREVENTIVI E API KEYS"
echo "================================================="

cd backend

npx tsx << 'EOF'
import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function completaDatabase() {
  try {
    console.log('\n📝 Completamento database con preventivi e API keys...\n')
    
    // 1. INSERISCI/AGGIORNA API KEYS
    console.log('🔑 Configurazione API Keys...\n')
    
    const apiKeysData = [
      {
        service: 'google-maps',
        key: 'AIzaSyB7zix_8OrL9ks3d6XcjHShHIQDDhI1lCI',
        name: 'Google Maps API Key',
        isActive: true
      },
      {
        service: 'openai',
        key: process.env.OPENAI_API_KEY || 'sk-proj-inserire-chiave-vera',
        name: 'OpenAI API Key',
        isActive: true
      },
      {
        service: 'stripe',
        key: process.env.STRIPE_SECRET_KEY || 'sk_test_inserire-chiave-vera',
        name: 'Stripe Secret Key',
        isActive: false // Disattivata finché non hai la chiave vera
      },
      {
        service: 'brevo',
        key: process.env.BREVO_API_KEY || 'xkeysib-inserire-chiave-vera',
        name: 'Brevo (SendinBlue) API Key',
        isActive: false // Disattivata finché non hai la chiave vera
      }
    ]
    
    for (const apiKeyData of apiKeysData) {
      try {
        await prisma.apiKey.upsert({
          where: { service: apiKeyData.service },
          update: {
            key: apiKeyData.key,
            name: apiKeyData.name,
            isActive: apiKeyData.isActive,
            updatedAt: new Date()
          },
          create: {
            id: uuidv4(),
            ...apiKeyData,
            updatedAt: new Date()
          }
        })
        console.log(`✅ ${apiKeyData.name}: ${apiKeyData.isActive ? 'ATTIVA' : 'DISATTIVATA (chiave placeholder)'}`)
      } catch (error) {
        console.log(`⚠️ Errore con ${apiKeyData.service}`)
      }
    }
    
    // 2. CREA PIÙ PREVENTIVI
    console.log('\n💰 Creazione preventivi aggiuntivi...\n')
    
    // Prendi tutte le richieste che non hanno preventivi
    const richiesteSenzaPreventivi = await prisma.assistanceRequest.findMany({
      where: {
        quotes: {
          none: {}
        },
        professionalId: {
          not: null
        }
      },
      include: {
        professional: true,
        category: true
      }
    })
    
    console.log(`   Trovate ${richiesteSenzaPreventivi.length} richieste senza preventivi`)
    
    for (const richiesta of richiesteSenzaPreventivi) {
      if (richiesta.professional) {
        const amount = Math.floor(Math.random() * 50000) + 15000 // 150-650 euro
        
        try {
          const quote = await prisma.quote.create({
            data: {
              id: uuidv4(),
              requestId: richiesta.id,
              professionalId: richiesta.professional.id,
              title: `Preventivo - ${richiesta.title}`,
              description: `Intervento professionale per: ${richiesta.description}
              
Include:
- Sopralluogo e valutazione
- Manodopera specializzata
- Materiali di consumo base
- Garanzia 12 mesi sul lavoro`,
              amount: amount,
              currency: 'EUR',
              status: richiesta.status === 'COMPLETED' ? 'ACCEPTED' : 'PENDING',
              validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              terms: 'Pagamento 30% all\'accettazione, saldo a fine lavori. Garanzia 12 mesi.',
              updatedAt: new Date()
            }
          })
          
          // Crea anche gli items del preventivo
          await prisma.quoteItem.create({
            data: {
              id: uuidv4(),
              quoteId: quote.id,
              description: 'Manodopera',
              quantity: Math.floor(Math.random() * 4) + 1,
              unitPrice: Math.floor(amount * 0.6),
              totalPrice: Math.floor(amount * 0.6),
              order: 1
            }
          })
          
          await prisma.quoteItem.create({
            data: {
              id: uuidv4(),
              quoteId: quote.id,
              description: 'Materiali',
              quantity: 1,
              unitPrice: Math.floor(amount * 0.3),
              totalPrice: Math.floor(amount * 0.3),
              order: 2
            }
          })
          
          await prisma.quoteItem.create({
            data: {
              id: uuidv4(),
              quoteId: quote.id,
              description: 'Trasporto e sopralluogo',
              quantity: 1,
              unitPrice: Math.floor(amount * 0.1),
              totalPrice: Math.floor(amount * 0.1),
              order: 3
            }
          })
          
          console.log(`✅ Preventivo creato per: ${richiesta.title} - €${(amount/100).toFixed(2)}`)
        } catch (error) {
          console.log(`⚠️ Errore creando preventivo per ${richiesta.title}`)
        }
      }
    }
    
    // 3. CREA PREVENTIVI MULTIPLI PER ALCUNE RICHIESTE PENDING
    console.log('\n💰 Creazione preventivi multipli per richieste pending...\n')
    
    const richiestePending = await prisma.assistanceRequest.findMany({
      where: {
        status: 'PENDING'
      },
      take: 10
    })
    
    const professionisti = await prisma.user.findMany({
      where: {
        role: 'PROFESSIONAL'
      }
    })
    
    for (const richiesta of richiestePending.slice(0, 5)) {
      // Crea 2-3 preventivi per ogni richiesta
      const numPreventivi = Math.floor(Math.random() * 2) + 2
      
      for (let i = 0; i < numPreventivi && i < professionisti.length; i++) {
        const prof = professionisti[i]
        const amount = Math.floor(Math.random() * 40000) + 10000 // 100-500 euro
        
        try {
          // Verifica che non esista già un preventivo
          const esistente = await prisma.quote.findFirst({
            where: {
              requestId: richiesta.id,
              professionalId: prof.id
            }
          })
          
          if (!esistente) {
            await prisma.quote.create({
              data: {
                id: uuidv4(),
                requestId: richiesta.id,
                professionalId: prof.id,
                title: `Preventivo ${prof.fullName} - ${richiesta.title}`,
                description: `Proposta di intervento da ${prof.profession || 'Tecnico'}`,
                amount: amount,
                currency: 'EUR',
                status: 'PENDING',
                validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
                updatedAt: new Date()
              }
            })
            console.log(`✅ Preventivo da ${prof.fullName} per: ${richiesta.title}`)
          }
        } catch (error) {
          // Ignora errori duplicati
        }
      }
    }
    
    // 4. REPORT FINALE
    console.log('\n' + '='.repeat(60))
    console.log('📊 REPORT FINALE DATABASE')
    console.log('='.repeat(60))
    
    const quotes = await prisma.quote.count()
    const quotesPerStatus = await prisma.quote.groupBy({
      by: ['status'],
      _count: true
    })
    
    const apiKeys = await prisma.apiKey.findMany({
      where: { isActive: true }
    })
    
    console.log(`
💰 PREVENTIVI TOTALI: ${quotes}`)
    
    quotesPerStatus.forEach(q => {
      console.log(`   • ${q.status}: ${q._count}`)
    })
    
    console.log(`
🔑 API KEYS ATTIVE: ${apiKeys.length}`)
    apiKeys.forEach(key => {
      console.log(`   • ${key.service}: ${key.name}`)
    })
    
    // Statistiche richieste con preventivi
    const requestsWithQuotes = await prisma.assistanceRequest.count({
      where: {
        quotes: {
          some: {}
        }
      }
    })
    
    const totalRequests = await prisma.assistanceRequest.count()
    
    console.log(`
📋 RICHIESTE CON PREVENTIVI: ${requestsWithQuotes}/${totalRequests}`)
    
    // Media preventivi per richiesta
    if (requestsWithQuotes > 0) {
      const mediaPreventivi = quotes / requestsWithQuotes
      console.log(`   • Media preventivi per richiesta: ${mediaPreventivi.toFixed(1)}`)
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ DATABASE COMPLETATO CON SUCCESSO!')
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('❌ Errore:', error)
  } finally {
    await prisma.$disconnect()
  }
}

completaDatabase()
EOF

echo ""
echo "================================================="
echo "✅ Script completato!"
