#!/bin/bash

echo "🔧 FIX COMPETENZE PROFESSIONALI"
echo "==============================="

cd backend

echo "1. Fix ProfessionalUserSubcategory (subcategory -> Subcategory):"
sed -i '' 's/subcategory:/Subcategory:/g' src/routes/user-subcategories.routes.ts
sed -i '' 's/subcategory\./Subcategory\./g' src/routes/user-subcategories.routes.ts
echo "✅ user-subcategories.routes.ts"

echo ""
echo "2. Fix anche in altri file che usano ProfessionalUserSubcategory:"
grep -r "professionalUserSubcategory" src --include="*.ts" | grep "subcategory:" | head -5
sed -i '' 's/subcategory:/Subcategory:/g' src/services/professional.service.ts 2>/dev/null
sed -i '' 's/subcategory:/Subcategory:/g' src/routes/professionals.routes.ts 2>/dev/null

echo ""
echo "3. Test rapido:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    await prisma.professionalUserSubcategory.findFirst({
      include: {
        Subcategory: {
          include: {
            category: true
          }
        },
        User: true
      }
    })
    console.log('✅ ProfessionalUserSubcategory funziona!')
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
echo ""
echo "Le competenze professionali dovrebbero funzionare"
