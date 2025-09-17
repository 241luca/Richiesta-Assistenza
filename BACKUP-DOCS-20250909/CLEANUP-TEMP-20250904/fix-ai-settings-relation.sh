#!/bin/bash

echo "🔧 AGGIUNGIAMO @relation A SubcategoryAiSettings"
echo "=============================================="

cd backend

echo "1. Backup schema:"
cp prisma/schema.prisma prisma/schema.prisma.backup-$(date +%Y%m%d-%H%M%S)

echo ""
echo "2. Aggiungo @relation al modello SubcategoryAiSettings:"

cat > /tmp/fix-ai-settings.js << 'SCRIPT'
const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// In Subcategory, aggiungi relazione con nome personalizzato
schema = schema.replace(
  /(\s+)SubcategoryAiSettings\s+SubcategoryAiSettings\?/,
  '$1aiSettings SubcategoryAiSettings? @relation("subcategory_ai_settings")'
);

// In SubcategoryAiSettings, aggiungi il lato opposto
schema = schema.replace(
  /model SubcategoryAiSettings \{([^}]+)Subcategory\s+Subcategory\s+@relation\(fields: \[subcategoryId\], references: \[id\]\)/s,
  'model SubcategoryAiSettings {$1subcategory Subcategory @relation("subcategory_ai_settings", fields: [subcategoryId], references: [id])'
);

// Se ci sono altre relazioni senza @relation in SubcategoryAiSettings, sistemiamole
// Per esempio ProfessionalAiCustomization
schema = schema.replace(
  /(\s+)ProfessionalAiCustomization\s+ProfessionalAiCustomization\[\]/,
  '$1customizations ProfessionalAiCustomization[] @relation("ai_settings_customizations")'
);

console.log('✅ Relazioni SubcategoryAiSettings sistemate');

fs.writeFileSync('prisma/schema.prisma', schema);
SCRIPT

node /tmp/fix-ai-settings.js

echo ""
echo "3. Formattazione schema:"
npx prisma format

echo ""
echo "4. Generazione Prisma Client:"
npx prisma generate

echo ""
echo "5. Aggiorno il codice per usare i nuovi nomi:"
# SubcategoryAiSettings -> aiSettings
sed -i '' 's/SubcategoryAiSettings:/aiSettings:/g' src/services/subcategory.service.ts
sed -i '' 's/SubcategoryAiSettings\./aiSettings\./g' src/services/subcategory.service.ts

echo ""
echo "6. Test finale:"
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
        category: true,
        aiSettings: true  // ora minuscolo!
      },
      take: 2
    })
    
    console.log('✅✅✅ Sottocategorie con aiSettings funziona!')
    console.log('Trovate:', subcategories.length)
    
    subcategories.forEach(sub => {
      console.log(`- ${sub.name}: AI settings = ${sub.aiSettings ? 'Sì' : 'No'}`);
    })
    
  } catch (e) {
    console.log('❌ Errore:', e.message)
  }
  
  await prisma.$disconnect()
}

test()
EOF

rm -f /tmp/fix-ai-settings.js

echo ""
echo "=============================================="
echo "RIAVVIA IL BACKEND!"
echo ""
echo "Ora anche SubcategoryAiSettings ha @relation con nome pulito!"
