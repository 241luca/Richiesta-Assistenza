#!/bin/bash

echo "🔍 DEBUG AI-SETTINGS PROFESSIONISTI"
echo "===================================="

cd backend

echo "1. Cerco l'errore in professionals ai-settings:"
grep -n "ai-settings" src/routes/professionals.routes.ts | head -5

echo ""
echo "2. Cerco dove viene usato:"
grep -A5 -B5 "GET.*ai-settings" src/routes/professionals.routes.ts | head -20

echo ""
echo "3. Test diretto del modello ProfessionalAiCustomization:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    // Verifica che il modello esista
    const customization = await prisma.professionalAiCustomization.findFirst()
    console.log('✅ ProfessionalAiCustomization accessibile')
    
    // Prova con include
    await prisma.professionalAiCustomization.findFirst({
      include: {
        User: true,
        SubcategoryAiSettings: true
      }
    })
    console.log('✅ Include funziona')
    
  } catch (e) {
    console.log('❌ Errore:', e.message)
  }
  
  await prisma.$disconnect()
}

test()
EOF

echo ""
echo "===================================="
