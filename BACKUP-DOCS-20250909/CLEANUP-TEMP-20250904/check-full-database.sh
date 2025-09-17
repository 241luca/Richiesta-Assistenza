#!/bin/bash

echo "📊 VERIFICA DETTAGLIATA DATABASE"
echo "================================"

cd backend

npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkFullDatabase() {
  try {
    console.log('\n📋 CONTROLLO COMPLETO DATABASE:\n')
    
    // 1. UTENTI
    const users = await prisma.user.findMany({
      select: { email: true, role: true, fullName: true }
    })
    console.log(`👥 UTENTI: ${users.length}`)
    users.forEach(u => console.log(`   - ${u.email} (${u.role})`))
    
    // 2. CATEGORIE
    const categories = await prisma.category.findMany({
      select: { name: true, id: true }
    })
    console.log(`\n📂 CATEGORIE: ${categories.length}`)
    categories.forEach(c => console.log(`   - ${c.name}`))
    
    // 3. SOTTOCATEGORIE
    try {
      const subcategories = await prisma.professionalSubcategory.count()
      console.log(`\n📁 SOTTOCATEGORIE: ${subcategories}`)
    } catch (e) {
      console.log(`\n📁 SOTTOCATEGORIE: Errore - ${e.message}`)
    }
    
    // 4. RICHIESTE
    const requests = await prisma.assistanceRequest.findMany({
      select: { title: true, status: true }
    })
    console.log(`\n📋 RICHIESTE: ${requests.length}`)
    requests.forEach(r => console.log(`   - ${r.title} (${r.status})`))
    
    // 5. PREVENTIVI
    try {
      const quotes = await prisma.quote.findMany({
        select: { title: true, amount: true }
      })
      console.log(`\n💰 PREVENTIVI: ${quotes.length}`)
      quotes.forEach(q => console.log(`   - ${q.title} - €${(q.amount/100).toFixed(2)}`))
    } catch (e) {
      console.log(`\n💰 PREVENTIVI: ${e.message}`)
    }
    
    // 6. VOCI PREVENTIVO
    try {
      const items = await prisma.quoteItem.count()
      console.log(`\n📝 VOCI PREVENTIVO: ${items}`)
    } catch (e) {
      console.log(`\n📝 VOCI PREVENTIVO: ${e.message}`)
    }
    
    // 7. NOTIFICHE
    try {
      const notifications = await prisma.notification.count()
      console.log(`\n🔔 NOTIFICHE: ${notifications}`)
    } catch (e) {
      console.log(`\n🔔 NOTIFICHE: ${e.message}`)
    }
    
    // 8. MESSAGGI
    try {
      const messages = await prisma.message.count()
      console.log(`\n💬 MESSAGGI: ${messages}`)
    } catch (e) {
      console.log(`\n💬 MESSAGGI: ${e.message}`)
    }
    
    console.log('\n' + '='.repeat(50))
    console.log('✅ Controllo completato!')
    
  } catch (error) {
    console.error('❌ Errore generale:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkFullDatabase()
EOF
