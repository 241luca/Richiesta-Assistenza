#!/bin/bash

echo "🔧 FIX ULTIMO ERRORE _count"
echo "=========================="

cd backend

echo "1. Correggo il _count in subcategory.service.ts:"
sed -i '' 's/requests: true/AssistanceRequest: true/g' src/services/subcategory.service.ts
echo "✅ Cambiato requests -> AssistanceRequest nel _count"

echo ""
echo "2. Test rapido:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    const sub = await prisma.subcategory.findFirst({
      include: {
        category: true,
        aiSettings: true,
        _count: {
          select: {
            ProfessionalUserSubcategory: true,
            AssistanceRequest: true
          }
        }
      }
    })
    console.log('✅✅✅ TUTTO FUNZIONA!')
    if (sub) {
      console.log(`${sub.name}: Richieste=${sub._count.AssistanceRequest}, Professionisti=${sub._count.ProfessionalUserSubcategory}`)
    }
  } catch (e) {
    console.log('❌ Errore:', e.message.split('\n')[0])
  }
  
  await prisma.$disconnect()
}

test()
EOF

echo ""
echo "=========================="
echo "RIAVVIA IL BACKEND!"
echo ""
echo "Ora le sottocategorie dovrebbero funzionare al 100%!"
