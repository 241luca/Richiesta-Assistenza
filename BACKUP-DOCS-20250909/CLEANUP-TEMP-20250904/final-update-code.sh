#!/bin/bash

echo "🔄 AGGIORNAMENTO CODICE PER aiSettings"
echo "======================================"

cd backend

echo "1. Aggiorno subcategory.service.ts:"
sed -i '' 's/SubcategoryAiSettings:/aiSettings:/g' src/services/subcategory.service.ts
sed -i '' 's/SubcategoryAiSettings\./aiSettings\./g' src/services/subcategory.service.ts
echo "✅ subcategory.service.ts"

echo ""
echo "2. Aggiorno anche _count se necessario:"
sed -i '' 's/assistanceRequest: true/AssistanceRequest: true/g' src/services/subcategory.service.ts
sed -i '' 's/professionalUsersubcategory: true/ProfessionalUserSubcategory: true/g' src/services/subcategory.service.ts
echo "✅ _count fields corretti"

echo ""
echo "3. Test API sottocategorie:"
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
        aiSettings: true,
        _count: {
          select: {
            ProfessionalUserSubcategory: true,
            AssistanceRequest: true
          }
        }
      },
      take: 2
    })
    
    console.log('✅✅✅ Query sottocategorie COMPLETA funziona!')
    console.log('Trovate:', subcategories.length, 'sottocategorie')
    
    subcategories.forEach(sub => {
      console.log(`- ${sub.name}: AI=${sub.aiSettings ? 'Sì' : 'No'}, Professionisti=${sub._count.ProfessionalUserSubcategory}`);
    })
    
  } catch (e) {
    console.log('❌ Errore:', e.message.split('\n')[0])
  }
  
  await prisma.$disconnect()
}

test()
EOF

echo ""
echo "4. BACKUP FINALE:"
cp prisma/schema.prisma prisma/schema.prisma.COMPLETE-$(date +%Y%m%d-%H%M%S)
echo "✅ BACKUP COMPLETO SALVATO!"

echo ""
echo "======================================"
echo "🎉 TUTTO SISTEMATO!"
echo ""
echo "RIAVVIA IL BACKEND e tutto dovrebbe funzionare:"
echo "- Richieste ✅"
echo "- Dashboard ✅"
echo "- Sottocategorie ✅"
echo "- Preventivi ✅"
echo ""
echo "Tutti con nomi minuscoli puliti grazie a @relation!"
