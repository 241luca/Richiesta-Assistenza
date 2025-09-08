#!/bin/bash

echo "🔧 AGGIUNGIAMO @relation A SUBCATEGORY"
echo "======================================"

cd backend

echo "1. Backup schema:"
cp prisma/schema.prisma prisma/schema.prisma.backup-$(date +%Y%m%d-%H%M%S)

echo ""
echo "2. Vediamo le relazioni di Subcategory:"
sed -n '/^model Subcategory/,/^model /p' prisma/schema.prisma | grep -E "^\s+[A-Z]" | head -10

echo ""
echo "3. Aggiungo @relation dove manca in Subcategory:"

cat > /tmp/fix-subcategory.js << 'SCRIPT'
const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// In Subcategory, cambia:
// Category Category -> category Category @relation("subcategory_category")
// AssistanceRequest AssistanceRequest[] -> requests AssistanceRequest[] @relation("subcategory_requests")
// ProfessionalUserSubcategory ProfessionalUserSubcategory[] -> professionals ProfessionalUserSubcategory[] @relation("subcategory_professionals")

// Trova e sostituisci nel modello Subcategory
schema = schema.replace(
  /(\s+)Category\s+Category\s+@relation\(fields: \[categoryId\], references: \[id\]\)/,
  '$1category Category @relation("subcategory_category", fields: [categoryId], references: [id])'
);

// E nel modello Category aggiungi il lato opposto
schema = schema.replace(
  /model Category \{([^}]+)Subcategory\s+Subcategory\[\]/s,
  'model Category {$1subcategories Subcategory[] @relation("subcategory_category")'
);

console.log('✅ Relazioni Subcategory sistemate');

fs.writeFileSync('prisma/schema.prisma', schema);
SCRIPT

node /tmp/fix-subcategory.js

echo ""
echo "4. Formattazione schema:"
npx prisma format

echo ""
echo "5. Generazione Prisma Client:"
npx prisma generate

echo ""
echo "6. Aggiorno il codice per usare i nuovi nomi:"
# Cambia Category: in category: per Subcategory
find src -name "*.ts" -exec sed -i '' 's/Category:/category:/g' {} \;
# Se ci sono riferimenti a Subcategory come array
find src -name "*.ts" -exec sed -i '' 's/Subcategory:/subcategories:/g' {} \;

echo ""
echo "7. Test finale:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    // Test Subcategory
    await prisma.subcategory.findMany({
      include: {
        category: true
      }
    })
    console.log('✅ Subcategory -> category funziona')
    
    // Test Category -> subcategories
    await prisma.category.findFirst({
      include: {
        subcategories: true
      }
    })
    console.log('✅ Category -> subcategories funziona')
    
  } catch (e) {
    console.log('❌ Errore:', e.message.split('\n')[0])
  }
  
  await prisma.$disconnect()
}

test()
EOF

rm -f /tmp/fix-subcategory.js

echo ""
echo "======================================"
echo "RIAVVIA IL BACKEND!"
echo ""
echo "Ora anche le sottocategorie hanno @relation!"
