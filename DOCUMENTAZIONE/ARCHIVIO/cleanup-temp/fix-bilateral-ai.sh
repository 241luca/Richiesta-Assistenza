#!/bin/bash

echo "🔧 FIX DUPLICATO E RELAZIONE BILATERALE"
echo "========================================"

cd backend

echo "1. Rimuovo il duplicato Subcategory in SubcategoryAiSettings:"

cat > /tmp/fix-bilateral-ai.js << 'SCRIPT'
const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Rimuovi la riga duplicata "Subcategory Subcategory[]" in SubcategoryAiSettings
let lines = schema.split('\n');
let newLines = [];
let inSubcategoryAiSettings = false;
let foundSubcategoryRelation = false;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  
  if (line.includes('model SubcategoryAiSettings {')) {
    inSubcategoryAiSettings = true;
    foundSubcategoryRelation = false;
  } else if (inSubcategoryAiSettings && line.trim() === '}') {
    inSubcategoryAiSettings = false;
  }
  
  // Se siamo in SubcategoryAiSettings
  if (inSubcategoryAiSettings) {
    // Se è la riga "Subcategory Subcategory[]" (array), rimuovila
    if (line.includes('Subcategory') && line.includes('Subcategory[]')) {
      console.log('Rimosso duplicato:', line.trim());
      continue; // Salta questa riga
    }
    // Se è la riga con @relation, modificala per includere il nome della relazione
    if (line.includes('Subcategory') && line.includes('@relation(fields:')) {
      line = line.replace(
        /@relation\(fields: \[subcategoryId\], references: \[id\]\)/,
        '@relation("subcategory_ai_settings", fields: [subcategoryId], references: [id])'
      );
      console.log('Aggiornata relazione:', line.trim());
    }
  }
  
  newLines.push(line);
}

fs.writeFileSync('prisma/schema.prisma', newLines.join('\n'));
console.log('✅ Fix applicato');
SCRIPT

node /tmp/fix-bilateral-ai.js

echo ""
echo "2. Formattazione schema:"
npx prisma format

echo ""
echo "3. Generazione client:"
npx prisma generate

echo ""
echo "4. Test finale:"
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
    console.log('✅✅✅ aiSettings FUNZIONA!')
    if (sub) {
      console.log('Sottocategoria:', sub.name)
      console.log('AI Settings:', sub.aiSettings ? 'Configurate' : 'Non configurate')
    }
  } catch (e) {
    console.log('Test con aiSettings fallito, provo SubcategoryAiSettings')
    try {
      await prisma.subcategory.findFirst({
        include: {
          SubcategoryAiSettings: true
        }
      })
      console.log('✅ Funziona con SubcategoryAiSettings (maiuscolo)')
    } catch (e2) {
      console.log('❌ Errore:', e2.message.split('\n')[0])
    }
  }
  
  await prisma.$disconnect()
}

test()
EOF

echo ""
echo "5. Se funziona, BACKUP:"
if [ $? -eq 0 ]; then
    cp prisma/schema.prisma prisma/schema.prisma.AIFIX-WORKING-$(date +%Y%m%d-%H%M%S)
    echo "✅ BACKUP SALVATO con nome descrittivo!"
else
    echo "⚠️ Non faccio backup perché c'è un errore"
fi

rm -f /tmp/fix-bilateral-ai.js

echo ""
echo "========================================"
echo "RIAVVIA IL BACKEND se funziona!"
