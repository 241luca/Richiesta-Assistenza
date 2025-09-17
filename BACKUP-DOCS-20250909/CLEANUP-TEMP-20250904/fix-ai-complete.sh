#!/bin/bash

echo "🔧 FIX COMPLETO RELAZIONI AI"
echo "============================"

cd backend

echo "1. Ripristino schema pulito:"
LATEST_BACKUP=$(ls -t prisma/schema.prisma.backup* | head -1)
cp "$LATEST_BACKUP" prisma/schema.prisma

echo ""
echo "2. Fix manuale delle relazioni problematiche:"

cat > /tmp/fix-ai-complete.js << 'SCRIPT'
const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// 1. Fix in Subcategory: SubcategoryAiSettings -> aiSettings
if (schema.includes('SubcategoryAiSettings       SubcategoryAiSettings?')) {
  schema = schema.replace(
    /(\s+)SubcategoryAiSettings\s+SubcategoryAiSettings\?/,
    '$1aiSettings SubcategoryAiSettings? @relation("subcategory_ai")'
  );
  console.log('✅ Subcategory -> aiSettings');
}

// 2. Fix in SubcategoryAiSettings: Subcategory con @relation
schema = schema.replace(
  /model SubcategoryAiSettings \{([^}]+)(\s+)Subcategory\s+Subcategory\s+@relation\(fields: \[subcategoryId\], references: \[id\]\)/s,
  'model SubcategoryAiSettings {$1$2subcategory Subcategory @relation("subcategory_ai", fields: [subcategoryId], references: [id])'
);
console.log('✅ SubcategoryAiSettings -> subcategory');

// 3. Fix AiConversation se c'è duplicato
// Rimuovi eventuali duplicati di AiConversation
let lines = schema.split('\n');
let inSubcategoryAiSettings = false;
let aiConversationCount = 0;
let newLines = [];

for (let line of lines) {
  if (line.includes('model SubcategoryAiSettings')) {
    inSubcategoryAiSettings = true;
  } else if (inSubcategoryAiSettings && line.trim().startsWith('}')) {
    inSubcategoryAiSettings = false;
    aiConversationCount = 0;
  }
  
  if (inSubcategoryAiSettings && line.includes('AiConversation')) {
    aiConversationCount++;
    if (aiConversationCount > 1) {
      continue; // Salta il duplicato
    }
  }
  
  newLines.push(line);
}

schema = newLines.join('\n');
console.log('✅ Rimossi duplicati AiConversation');

fs.writeFileSync('prisma/schema.prisma', schema);
SCRIPT

node /tmp/fix-ai-complete.js

echo ""
echo "3. Formattazione schema:"
npx prisma format

echo ""
echo "4. Generazione Prisma Client:"
npx prisma generate

echo ""
echo "5. Aggiorno il codice:"
sed -i '' 's/SubcategoryAiSettings:/aiSettings:/g' src/services/subcategory.service.ts

echo ""
echo "6. Test finale:"
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
    console.log('Sottocategoria:', sub?.name)
    console.log('Categoria:', sub?.category?.name)
    console.log('AI Settings:', sub?.aiSettings ? 'Sì' : 'No')
  } catch (e) {
    console.log('❌ Errore:', e.message.split('\n')[0])
  }
  
  await prisma.$disconnect()
}

test()
EOF

rm -f /tmp/fix-ai-complete.js

echo ""
echo "============================"
echo "RIAVVIA IL BACKEND!"
