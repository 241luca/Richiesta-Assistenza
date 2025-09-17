#!/bin/bash

echo "🔧 FIX NOMI IN PROFESSIONALS ROUTES"
echo "==================================="

cd backend

echo "1. Fix SubcategoryAiSettings -> aiSettings:"
sed -i '' 's/SubcategoryAiSettings:/aiSettings:/g' src/routes/professionals.routes.ts
sed -i '' 's/SubcategoryAiSettings\./aiSettings\./g' src/routes/professionals.routes.ts
echo "✅ professionals.routes.ts"

echo ""
echo "2. Verifica che il professionista abbia sottocategorie:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function check() {
  try {
    // Verifica se ci sono sottocategorie per questo professionista
    const prof = await prisma.user.findUnique({
      where: { id: '348ba304-26ff-4c43-9fa7-6ea7b414d67b' },
      include: {
        ProfessionalUserSubcategory: true
      }
    })
    
    if (prof) {
      console.log('Professionista:', prof.firstName, prof.lastName)
      console.log('Sottocategorie associate:', prof.ProfessionalUserSubcategory.length)
      
      if (prof.ProfessionalUserSubcategory.length === 0) {
        console.log('⚠️ Il professionista non ha sottocategorie associate!')
        console.log('Per questo la pagina competenze è vuota')
      }
    } else {
      console.log('❌ Professionista non trovato')
    }
    
  } catch (e) {
    console.log('Errore:', e.message)
  }
  
  await prisma.$disconnect()
}

check()
EOF

echo ""
echo "==================================="
echo "RIAVVIA IL BACKEND!"
echo ""
echo "Se il professionista non ha sottocategorie,"
echo "devi aggiungerle dalla pagina admin"
