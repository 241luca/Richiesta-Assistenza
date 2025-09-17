#!/bin/bash

echo "🔍 DIAGNOSI ERRORI SUPERADMIN"
echo "=============================="

cd backend

echo "1. Verifica quali relazioni usa il codice admin:"
echo "-------------------------------------------------"
grep -h "include:" src/routes/admin/*.ts 2>/dev/null | head -20

echo ""
echo "2. Errori specifici in admin.routes.ts:"
echo "----------------------------------------"
grep -n "prisma\." src/routes/admin.routes.ts | grep "find" | head -10

echo ""
echo "3. Test rapido delle query admin:"
echo "----------------------------------"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testAdminQueries() {
  console.log('Test query utenti:')
  try {
    const users = await prisma.user.findMany({
      take: 1,
      include: {
        clientRequests: true,
        professionalRequests: true
      }
    })
    console.log('✅ Query utenti funziona')
  } catch (e) {
    console.log('❌ Errore query utenti:', e.message)
  }

  console.log('\nTest query richieste:')
  try {
    const requests = await prisma.assistanceRequest.findMany({
      take: 1,
      include: {
        client: true,
        professional: true,
        category: true
      }
    })
    console.log('✅ Query richieste funziona')
  } catch (e) {
    console.log('❌ Errore query richieste:', e.message)
  }

  await prisma.$disconnect()
}

testAdminQueries()
EOF
