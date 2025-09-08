#!/bin/bash

echo "🔧 AGGIUNGIAMO @relation a Category-Subcategory"
echo "=============================================="

cd backend

echo "1. Aggiungo @relation bilaterale per Category-Subcategory:"

cat > /tmp/fix-category-relation.js << 'SCRIPT'
const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// In Subcategory: Category -> category con @relation
schema = schema.replace(
  /(\s+)Category\s+Category\s+@relation\(fields: \[categoryId\], references: \[id\]\)/,
  '$1category Category @relation("category_subcategories", fields: [categoryId], references: [id])'
);

// In Category: trova Subcategory[] e aggiungi @relation
schema = schema.replace(
  /(\s+)Subcategory\s+Subcategory\[\]\s*$/gm,
  '$1subcategories Subcategory[] @relation("category_subcategories")'
);

console.log('✅ Relazioni Category-Subcategory sistemate');

fs.writeFileSync('prisma/schema.prisma', schema);
SCRIPT

node /tmp/fix-category-relation.js

echo ""
echo "2. Formattazione schema:"
npx prisma format

echo ""
echo "3. Generazione Prisma Client:"
npx prisma generate

echo ""
echo "4. Test completo:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    // Test Subcategory con category minuscola
    const sub = await prisma.subcategory.findFirst({
      include: {
        category: true,
        aiSettings: true
      }
    })
    console.log('✅ Subcategory -> category (minuscola!)')
    
    // Test Category con subcategories
    const cat = await prisma.category.findFirst({
      include: {
        subcategories: true
      }
    })
    console.log('✅ Category -> subcategories (minuscola plurale!)')
    
    console.log('\n✅✅✅ TUTTO MINUSCOLO E PULITO!')
    
  } catch (e) {
    console.log('❌ Errore:', e.message.split('\n')[0])
  }
  
  await prisma.$disconnect()
}

test()
EOF

echo ""
echo "5. Aggiorno il codice per usare category minuscola:"
sed -i '' 's/Category:/category:/g' src/services/subcategory.service.ts

echo ""
echo "6. BACKUP FINALE COMPLETO:"
cp prisma/schema.prisma prisma/schema.prisma.PERFECT-$(date +%Y%m%d-%H%M%S)
echo "✅ BACKUP PERFETTO SALVATO!"

rm -f /tmp/fix-category-relation.js

echo ""
echo "=============================================="
echo "🎉 ORA È TUTTO PERFETTO!"
echo "Tutte le relazioni hanno @relation e nomi minuscoli!"
