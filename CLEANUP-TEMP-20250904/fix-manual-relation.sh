#!/bin/bash

echo "🔧 FIX MANUALE DOPPIO @relation"
echo "==============================="

cd backend

echo "1. Fix diretto della riga 27:"
# Sostituisci la riga con doppio @relation con uno solo che include fields
sed -i '' '27s/.*/  aiSettings SubcategoryAiSettings? @relation("subcategory_ai", fields: [subcategoryId], references: [id])/' prisma/schema.prisma

echo "✅ Riga 27 corretta"

echo ""
echo "2. Verifica la correzione:"
sed -n '25,29p' prisma/schema.prisma

echo ""
echo "3. Formattazione schema:"
npx prisma format

echo ""
echo "4. Generazione Prisma Client:"
npx prisma generate

echo ""
echo "5. Test finale:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    const sub = await prisma.subcategory.findFirst({
      include: {
        category: true,
        aiSettings: true
      }
    })
    console.log('✅✅✅ FUNZIONA!')
    if (sub) {
      console.log('Sottocategoria:', sub.name)
      console.log('Categoria:', sub.category?.name)
      console.log('AI Settings:', sub.aiSettings ? 'Configurate' : 'Non configurate')
    }
  } catch (e) {
    console.log('❌ Errore:', e.message.split('\n')[0])
  }
  
  await prisma.$disconnect()
}

test()
EOF

echo ""
echo "==============================="
echo "RIAVVIA IL BACKEND!"
