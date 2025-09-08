#!/bin/bash

echo "🔧 FIX DOPPIO @relation"
echo "======================"

cd backend

echo "1. Ripristino schema dal backup:"
LATEST_BACKUP=$(ls -t prisma/schema.prisma.backup* | head -1)
cp "$LATEST_BACKUP" prisma/schema.prisma
echo "Ripristinato da: $LATEST_BACKUP"

echo ""
echo "2. Vediamo come è la relazione attuale in Subcategory:"
sed -n '/^model Subcategory/,/^model /p' prisma/schema.prisma | grep "SubcategoryAiSettings" | head -2

echo ""
echo "3. Se non ha @relation, aggiungiamolo correttamente:"

cat > /tmp/fix-ai-single.js << 'SCRIPT'
const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// In Subcategory: se SubcategoryAiSettings non ha @relation, aggiungiamolo
// Ma dobbiamo metterlo nella posizione giusta con i fields
schema = schema.replace(
  /(\s+)SubcategoryAiSettings\s+SubcategoryAiSettings\?\s+@relation\(fields: \[subcategoryId\], references: \[id\]\)/,
  '$1aiSettings SubcategoryAiSettings? @relation("subcategory_ai", fields: [subcategoryId], references: [id])'
);

// Se non ha @relation (caso senza fields)
schema = schema.replace(
  /(\s+)SubcategoryAiSettings\s+SubcategoryAiSettings\?\s*$/gm,
  '$1aiSettings SubcategoryAiSettings? @relation("subcategory_ai")'
);

// In SubcategoryAiSettings: aggiungi il lato opposto
schema = schema.replace(
  /model SubcategoryAiSettings \{([^}]+)Subcategory\s+Subcategory\s+@relation\(fields: \[subcategoryId\], references: \[id\]\)/s,
  'model SubcategoryAiSettings {$1subcategory Subcategory @relation("subcategory_ai", fields: [subcategoryId], references: [id])'
);

console.log('✅ Relazione sistemata');

fs.writeFileSync('prisma/schema.prisma', schema);
SCRIPT

node /tmp/fix-ai-single.js

echo ""
echo "4. Formattazione schema:"
npx prisma format

echo ""
echo "5. Generazione Prisma Client:"
npx prisma generate

echo ""
echo "6. Test con aiSettings:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    const sub = await prisma.subcategory.findFirst({
      include: {
        aiSettings: true
      }
    })
    console.log('✅ aiSettings funziona!')
  } catch (e) {
    console.log('❌ Errore:', e.message.split('\n')[0])
  }
  
  await prisma.$disconnect()
}

test()
EOF

rm -f /tmp/fix-ai-single.js

echo ""
echo "======================"
