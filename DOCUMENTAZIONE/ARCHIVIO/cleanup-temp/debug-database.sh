#!/bin/bash

echo "🔍 DEBUG DATABASE - STATO ATTUALE"
echo "================================="

cd backend

npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function debugDatabase() {
  try {
    console.log('\n📊 CONTEGGIO RECORD PER TABELLA:\n')
    
    // Conteggio di tutte le tabelle principali
    const counts = {
      users: await prisma.user.count(),
      categories: await prisma.category.count(),
      subcategories: await prisma.professionalSubcategory.count(),
      requests: await prisma.assistanceRequest.count(),
      quotes: await prisma.quote.count(),
      quoteItems: await prisma.quoteItem.count(),
      notifications: await prisma.notification.count(),
      systemSettings: await prisma.systemSetting.count(),
      apiKeys: await prisma.apiKey.count()
    }
    
    for (const [table, count] of Object.entries(counts)) {
      console.log(`${table.padEnd(20)} : ${count} record`)
    }
    
    console.log('\n👥 UTENTI NEL SISTEMA:')
    console.log('----------------------')
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        emailVerified: true
      },
      take: 10
    })
    
    users.forEach((u, i) => {
      console.log(`${i+1}. ${u.email.padEnd(30)} | ${u.role.padEnd(15)} | ${u.fullName || 'N/A'}`)
    })
    
    if (counts.users > 10) {
      console.log(`... e altri ${counts.users - 10} utenti`)
    }
    
    console.log('\n📂 CATEGORIE PRESENTI:')
    console.log('----------------------')
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        isActive: true
      }
    })
    
    categories.forEach((c, i) => {
      console.log(`${i+1}. ${c.name.padEnd(25)} | ${c.isActive ? '✅ Attiva' : '❌ Disattivata'}`)
    })
    
    console.log('\n💰 ULTIMI 5 PREVENTIVI:')
    console.log('----------------------')
    const quotes = await prisma.quote.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        createdAt: true
      }
    })
    
    if (quotes.length > 0) {
      quotes.forEach((q, i) => {
        console.log(`${i+1}. ID: ${q.id} | Status: ${q.status} | €${q.totalAmount/100} | ${q.createdAt.toLocaleDateString()}`)
      })
    } else {
      console.log('Nessun preventivo trovato')
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.message)
    if (error.code === 'P2021') {
      console.error('⚠️ Tabella non trovata nel database')
    }
  } finally {
    await prisma.$disconnect()
  }
}

debugDatabase()
EOF
