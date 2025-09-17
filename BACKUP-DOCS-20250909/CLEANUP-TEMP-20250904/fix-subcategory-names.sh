#!/bin/bash

echo "🔧 FIX NOMI RELAZIONI SOTTOCATEGORIE"
echo "===================================="

cd backend

echo "1. Fix subcategory.service.ts:"
# subcategoryAiSettings -> SubcategoryAiSettings
sed -i '' 's/subcategoryAiSettings/SubcategoryAiSettings/g' src/services/subcategory.service.ts
# professionalUsersubcategory -> ProfessionalUserSubcategory
sed -i '' 's/professionalUsersubcategory/ProfessionalUserSubcategory/g' src/services/subcategory.service.ts
# assistanceRequest -> requests (perché abbiamo aggiunto @relation)
sed -i '' 's/assistanceRequest: true/requests: true/g' src/services/subcategory.service.ts

echo "✅ subcategory.service.ts corretto"

echo ""
echo "2. Fix anche altri possibili errori di naming:"
find src/services -name "*.ts" -exec sed -i '' 's/subcategoryAiSettings/SubcategoryAiSettings/g' {} \;
find src/routes -name "*.ts" -exec sed -i '' 's/subcategoryAiSettings/SubcategoryAiSettings/g' {} \;

echo "✅ Tutti i file corretti"

echo ""
echo "3. Test finale sottocategorie:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    const subcategories = await prisma.subcategory.findMany({
      where: {
        isActive: true
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true
          }
        },
        SubcategoryAiSettings: true,
        _count: {
          select: {
            ProfessionalUserSubcategory: true,
            AssistanceRequest: true
          }
        }
      },
      orderBy: [
        {
          name: "asc"
        }
      ]
    })
    
    console.log('✅✅✅ Query sottocategorie FUNZIONA!')
    console.log('Trovate:', subcategories.length, 'sottocategorie')
    
  } catch (e) {
    console.log('❌ Errore:', e.message)
  }
  
  await prisma.$disconnect()
}

test()
EOF

echo ""
echo "===================================="
echo "RIAVVIA IL BACKEND!"
echo ""
echo "Le sottocategorie dovrebbero finalmente funzionare!"
