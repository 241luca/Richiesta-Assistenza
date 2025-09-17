#!/bin/bash

echo "🔍 VERIFICA ERRORI CONSOLE BACKEND"
echo "=================================="

echo "Ultimi errori nel backend (se presenti):"
echo ""

# Cerca errori nei file di log se esistono
if [ -d "backend/logs" ]; then
    echo "📁 Controllo logs directory..."
    ls -la backend/logs/ 2>/dev/null
    
    if [ -f "backend/logs/error.log" ]; then
        echo "📄 Ultimi errori da error.log:"
        tail -20 backend/logs/error.log
    fi
else
    echo "📁 Nessuna directory logs trovata"
fi

echo ""
echo "=================================="
echo "🔍 TEST RAPIDO MODELLI DATABASE:"
echo ""

cd backend

npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testModels() {
  console.log('Test accesso tabelle problematiche:\n')
  
  // Test Subcategory (vari nomi possibili)
  try {
    if (prisma.subcategory) {
      const count = await prisma.subcategory.count()
      console.log(`✅ Subcategory: ${count} record`)
    }
  } catch(e) {}
  
  try {
    if (prisma.professionalSubcategory) {
      const count = await prisma.professionalSubcategory.count()
      console.log(`✅ ProfessionalSubcategory: ${count} record`)
    }
  } catch(e) {}
  
  // Mostra un utente admin per test
  console.log('\n🔐 Admin per test login:')
  const admin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
    select: { email: true, fullName: true }
  })
  console.log(`Email: ${admin.email}`)
  console.log(`Nome: ${admin.fullName}`)
  console.log('Password: password123\n')
  
  await prisma.$disconnect()
}

testModels().catch(console.error)
EOF
