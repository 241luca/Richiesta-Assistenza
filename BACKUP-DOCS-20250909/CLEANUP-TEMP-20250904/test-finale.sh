#!/bin/bash

echo "🎯 VERIFICA FINALE E TEST COMPLETO"
echo "=================================="

cd backend

echo "1️⃣ Stato Prisma Client..."
npx prisma generate 2>&1 | tail -5

echo ""
echo "2️⃣ Test completo database e tabelle:"
echo "====================================="

npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testCompleto() {
  try {
    console.log('📊 TEST COMPLETO DATABASE\n')
    
    // Test tutte le tabelle
    const tests = [
      { name: 'Users', fn: () => prisma.user.count() },
      { name: 'Categories', fn: () => prisma.category.count() },
      { name: 'Subcategories', fn: () => prisma.professionalSubcategory.count() },
      { name: 'Requests', fn: () => prisma.assistanceRequest.count() },
      { name: 'Quotes', fn: () => prisma.quote.count() },
      { name: 'Quote Items', fn: () => prisma.quoteItem.count() },
      { name: 'Notifications', fn: () => prisma.notification.count() },
      { name: 'Notification Channels', fn: () => prisma.notificationChannel.count() },
      { name: 'Notification Types', fn: () => prisma.notificationType.count() },
      { name: 'System Settings', fn: () => prisma.systemSetting.count() }
    ]
    
    let tuttoOk = true
    
    for (const test of tests) {
      try {
        const count = await test.fn()
        console.log(`✅ ${test.name.padEnd(25)}: ${count} record`)
      } catch (err) {
        console.log(`❌ ${test.name.padEnd(25)}: ERRORE - ${err.message}`)
        tuttoOk = false
      }
    }
    
    if (tuttoOk) {
      console.log('\n🎉 PRISMA FUNZIONA PERFETTAMENTE!')
      
      // Mostra credenziali per test login
      console.log('\n🔐 UTENTI PER TEST LOGIN:')
      console.log('========================')
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { role: 'SUPER_ADMIN' },
            { role: 'ADMIN' },
            { role: 'CLIENT' }
          ]
        },
        take: 3,
        select: {
          email: true,
          role: true,
          fullName: true
        }
      })
      
      users.forEach(u => {
        console.log(`Email: ${u.email.padEnd(30)} | Ruolo: ${u.role}`)
      })
      console.log('\nPassword default: password123 (se non modificata)')
      
    } else {
      console.log('\n⚠️ CI SONO ANCORA PROBLEMI DA RISOLVERE')
    }
    
  } catch (error) {
    console.error('❌ Errore generale:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testCompleto()
EOF

echo ""
echo "=================================="
echo "📋 CONTROLLO BACKEND:"
echo ""
# Test se il backend risponde
curl -s http://localhost:3200/api/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Backend in esecuzione su porta 3200"
else
    echo "❌ Backend NON raggiungibile"
    echo "   Avvialo con: cd backend && npm run dev"
fi

# Test se il frontend risponde
curl -s http://localhost:5193 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Frontend in esecuzione su porta 5193"
else
    echo "❌ Frontend NON raggiungibile"
    echo "   Avvialo con: npm run dev (dalla root del progetto)"
fi
