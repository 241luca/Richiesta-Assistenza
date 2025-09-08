#!/bin/bash

echo "🎯 COMPLETAMENTO SETUP PRISMA"
echo "============================="

cd backend

echo "1️⃣ Generazione Prisma Client..."
npx prisma generate

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Prisma Client generato con successo!"
    
    echo ""
    echo "2️⃣ Test database connection..."
    
    npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testDatabase() {
  try {
    console.log('\n📊 TEST CONNESSIONE DATABASE:\n')
    
    // Test connessione
    await prisma.$connect()
    console.log('✅ Connessione al database riuscita!')
    
    // Conta record nelle tabelle principali
    const counts = {
      users: await prisma.user.count(),
      categories: await prisma.category.count(),
      subcategories: await prisma.professionalSubcategory.count(),
      requests: await prisma.assistanceRequest.count(),
      quotes: await prisma.quote.count(),
      notifications: await prisma.notification.count()
    }
    
    console.log('\n📈 STATO DATABASE:')
    console.log('==================')
    for (const [table, count] of Object.entries(counts)) {
      console.log(`${table.padEnd(15)}: ${count} record`)
    }
    
    // Mostra alcuni utenti
    console.log('\n👥 UTENTI NEL SISTEMA:')
    console.log('=====================')
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true
      }
    })
    
    if (users.length > 0) {
      users.forEach((u, i) => {
        console.log(`${i+1}. ${u.email.padEnd(30)} | ${u.role.padEnd(12)} | ${u.fullName || 'N/A'}`)
      })
      
      if (counts.users > 5) {
        console.log(`... e altri ${counts.users - 5} utenti`)
      }
    } else {
      console.log('⚠️  Nessun utente trovato nel database')
    }
    
    // Test categorie
    console.log('\n📂 CATEGORIE ATTIVE:')
    console.log('===================')
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { name: true }
    })
    
    if (categories.length > 0) {
      categories.forEach((c, i) => {
        console.log(`${i+1}. ${c.name}`)
      })
    } else {
      console.log('⚠️  Nessuna categoria trovata')
    }
    
    console.log('\n✅ DATABASE OPERATIVO E ACCESSIBILE!')
    
  } catch (error) {
    console.error('❌ Errore:', error.message)
    console.error('\nDettagli:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()
EOF

else
    echo "❌ Errore nella generazione del Prisma Client"
fi

echo ""
echo "============================="
echo "📋 PROSSIMI PASSI:"
echo "1. Verificare che il backend sia in esecuzione"
echo "2. Testare il login con gli utenti mostrati sopra"
echo "3. Verificare eventuali errori specifici nell'applicazione"
