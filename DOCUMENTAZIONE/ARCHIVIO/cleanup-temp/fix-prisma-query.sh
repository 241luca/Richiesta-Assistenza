#!/bin/bash

echo "🔧 FIX QUERY PRISMA KNOWLEDGE BASE"
echo "================================="

cd backend

echo "1. Fix la query in professionals.routes.ts:"

cat > /tmp/fix-kb-query.js << 'SCRIPT'
const fs = require('fs');

let content = fs.readFileSync('src/routes/professionals.routes.ts', 'utf8');

// Trova e sostituisci la query problematica
const oldQuery = `const kbDocuments = await prisma.knowledgeBaseDocument.findMany({
          where: {
            uploadedById: professionalId,
            subcategoryIds: {
              has: sub.subcategoryId
            },
            metadata: {
              path: ['professional'],
              equals: true
            }
          },`;

const newQuery = `const kbDocuments = await prisma.knowledgeBaseDocument.findMany({
          where: {
            uploadedById: professionalId,
            subcategoryIds: {
              array_contains: sub.subcategoryId
            }
          },`;

// Sostituisci has con array_contains per JSON array
content = content.replace(/subcategoryIds:\s*{\s*has:/g, 'subcategoryIds: {\n              array_contains:');

// Rimuovi anche il metadata query che potrebbe dare problemi
content = content.replace(/,\s*metadata:\s*{\s*path:\s*\['professional'\],\s*equals:\s*true\s*}/g, '');

fs.writeFileSync('src/routes/professionals.routes.ts', content);
console.log('✅ Query fixed');
SCRIPT

node /tmp/fix-kb-query.js
rm -f /tmp/fix-kb-query.js

echo ""
echo "2. Verifica che SubcategoryAiSettings sia aiSettings:"
sed -i '' 's/SubcategoryAiSettings/aiSettings/g' src/routes/professionals.routes.ts
echo "✅ Nomi corretti"

echo ""
echo "3. Fix anche l'altro errore nell'endpoint AI:"
# Trova e correggi eventuali altri problemi
grep -n "SubcategoryAiSettings" src/routes/professionals.routes.ts || echo "✅ Nessun riferimento errato trovato"

echo ""
echo "================================="
echo "RIAVVIA IL BACKEND!"
echo ""
echo "Gli errori Prisma dovrebbero essere risolti"
