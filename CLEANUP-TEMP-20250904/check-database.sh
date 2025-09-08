#!/bin/bash

echo "📊 VERIFICA COMPLETA DATABASE"
echo "=============================="

cd backend

npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    console.log('\n📋 STATO DATABASE:\n')
    
    // 1. Utenti
    const users = await prisma.user.count()
    console.log(`👥 Utenti: ${users}`)
    if (users > 0) {
      const userList = await prisma.user.findMany({
        select: { email: true, role: true, fullName: true }
      })
      userList.forEach(u => console.log(`   - ${u.email} (${u.role})`))
    }
    
    // 2. Richieste
    const requests = await prisma.assistanceRequest.count()
    console.log(`\n📋 Richieste Assistenza: ${requests}`)
    
    // 3. Preventivi
    const quotes = await prisma.quote.count()
    console.log(`💰 Preventivi: ${quotes}`)
    
    // 4. Categorie
    const categories = await prisma.category.count()
    console.log(`📂 Categorie: ${categories}`)
    if (categories > 0) {
      const catList = await prisma.category.findMany({
        select: { name: true }
      })
      catList.forEach(c => console.log(`   - ${c.name}`))
    }
    
    // 5. Sottocategorie
    const subcategories = await prisma.professionalSubcategory.count()
    console.log(`\n📁 Sottocategorie: ${subcategories}`)
    
    // 6. Notifiche
    const notifications = await prisma.notification.count()
    console.log(`🔔 Notifiche: ${notifications}`)
    
    console.log('\n' + '='.repeat(50))
    
    if (users === 0) {
      console.log('\n⚠️  DATABASE VUOTO!')
      console.log('Esegui: ./populate-database.sh per popolare il database')
    } else if (categories === 0) {
      console.log('\n⚠️  MANCANO LE CATEGORIE!')
      console.log('Esegui: ./populate-categories.sh per creare le categorie')
    } else {
      console.log('\n✅ Database operativo')
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()
EOF
