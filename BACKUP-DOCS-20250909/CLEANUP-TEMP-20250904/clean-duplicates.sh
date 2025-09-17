#!/bin/bash

echo "🧹 PULIZIA COMPLETA DUPLICATI"
echo "============================="

cd backend

echo "1. Rimuovo tutti i duplicati nello schema:"

cat > /tmp/clean-duplicates.js << 'SCRIPT'
const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// 1. In Subcategory, rimuovi il campo SubcategoryAiSettings duplicato
// Tieni solo aiSettings con @relation
schema = schema.replace(
  /(\s+)SubcategoryAiSettings\s+SubcategoryAiSettings\?\s*\n/g,
  ''
);

// 2. In SubcategoryAiSettings, rimuovi AiConversation duplicato
let lines = schema.split('\n');
let newLines = [];
let seenFields = new Set();
let currentModel = '';

for (let line of lines) {
  if (line.includes('model ')) {
    currentModel = line.split(' ')[1];
    seenFields.clear();
  }
  
  // Estrai il nome del campo
  let fieldMatch = line.trim().match(/^(\w+)\s+/);
  if (fieldMatch) {
    let fieldName = fieldMatch[1];
    if (seenFields.has(fieldName) && !line.includes('@@')) {
      console.log(`Rimosso duplicato: ${fieldName} in ${currentModel}`);
      continue; // Salta i duplicati
    }
    seenFields.add(fieldName);
  }
  
  newLines.push(line);
}

schema = newLines.join('\n');

// 3. Assicurati che le relazioni siano corrette
// AiConversation -> SubcategoryAiSettings dovrebbe avere la relazione opposta
schema = schema.replace(
  /model AiConversation \{([^}]+)\}/s,
  (match, content) => {
    // Se c'è già aiSettings, ok, altrimenti correggilo
    if (!content.includes('conversations AiConversation[]')) {
      // Aggiungi la relazione opposta in SubcategoryAiSettings
      schema = schema.replace(
        /model SubcategoryAiSettings \{([^}]+)\}/s,
        (m, c) => {
          if (!c.includes('conversations')) {
            c = c.replace(
              /(\s+updatedAt\s+DateTime)/,
              '$1\n  conversations AiConversation[] @relation("subcategory_ai")'
            );
          }
          return `model SubcategoryAiSettings {${c}}`;
        }
      );
    }
    return match;
  }
);

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('✅ Schema pulito');
SCRIPT

node /tmp/clean-duplicates.js

echo ""
echo "2. Formattazione schema:"
npx prisma format

echo ""
echo "3. Generazione Prisma Client:"
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
        category: true,
        aiSettings: true
      }
    })
    console.log('✅✅✅ TUTTO FUNZIONA!')
    if (sub) {
      console.log('Sottocategoria:', sub.name)
      console.log('Categoria:', sub.category?.name || 'N/A')
      console.log('AI Settings:', sub.aiSettings ? 'Sì' : 'No')
    }
  } catch (e) {
    console.log('❌ Errore:', e.message.split('\n')[0])
  }
  
  await prisma.$disconnect()
}

test()
EOF

rm -f /tmp/clean-duplicates.js

echo ""
echo "============================="
echo "RIAVVIA IL BACKEND!"
