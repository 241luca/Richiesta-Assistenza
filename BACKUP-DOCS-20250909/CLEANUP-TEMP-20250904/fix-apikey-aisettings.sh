#!/bin/bash

echo "🔧 FIX APIKEY E SUBCATEGORY AI SETTINGS"
echo "========================================"

cd backend

echo "1. Fix ApiKey service (user -> User):"
sed -i '' 's/user:/User:/g' src/services/apiKey.service.ts
echo "✅ apiKey.service.ts"

echo ""
echo "2. Fix SubcategoryAiSettings in subcategory.service.ts:"
# Il problema è che usa subcategoryAiSettings invece di SubcategoryAiSettings
sed -i '' 's/prisma\.subcategoryAiSettings/prisma.SubcategoryAiSettings/g' src/services/subcategory.service.ts
echo "✅ subcategory.service.ts (SubcategoryAiSettings maiuscolo)"

echo ""
echo "3. Test ApiKey:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    await prisma.apiKey.findFirst({
      include: {
        User: true
      }
    })
    console.log('✅ ApiKey con User funziona')
  } catch (e) {
    console.log('❌ ApiKey:', e.message.split('\n')[0])
  }
  
  await prisma.$disconnect()
}

test()
EOF

echo ""
echo "4. Test SubcategoryAiSettings:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    await prisma.subcategoryAiSettings.findFirst()
    console.log('✅ SubcategoryAiSettings funziona')
  } catch (e) {
    console.log('❌ SubcategoryAiSettings:', e.message.split('\n')[0])
  }
  
  await prisma.$disconnect()
}

test()
EOF

echo ""
echo "========================================"
echo "RIAVVIA IL BACKEND!"
echo ""
echo "ApiKey e SubcategoryAiSettings dovrebbero funzionare ora"
