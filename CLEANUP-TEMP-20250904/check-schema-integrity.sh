#!/bin/bash

echo "🔍 VERIFICA INTEGRITÀ SCHEMA PRISMA"
echo "===================================="

cd backend

echo "1. Validazione schema:"
npx prisma validate

echo ""
echo "2. Test query base:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    // Test semplice
    await prisma.user.findFirst()
    console.log('✅ User funziona')
    
    await prisma.assistanceRequest.findFirst()
    console.log('✅ AssistanceRequest funziona')
    
    await prisma.category.findFirst()
    console.log('✅ Category funziona')
    
    await prisma.quote.findFirst()
    console.log('✅ Quote funziona')
    
    console.log('\n✅ SCHEMA INTEGRO!')
  } catch (e) {
    console.log('❌ Problema:', e.message)
  }
  
  await prisma.$disconnect()
}

test()
EOF

echo ""
echo "===================================="
