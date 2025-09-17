#!/bin/bash

echo "📝 MODIFICA DIRETTA SCHEMA PER NOMI PULITI"
echo "=========================================="

cd backend

echo "1. Cerco il modello AssistanceRequest nello schema..."
LINE=$(grep -n "model AssistanceRequest" prisma/schema.prisma | cut -d: -f1)
echo "Trovato alla riga: $LINE"

echo ""
echo "2. Modifica manuale delle relazioni..."

# Usa sed per sostituire i nomi lunghi con nomi corti
sed -i '' 's/User_AssistanceRequest_clientIdToUser[[:space:]]*User[[:space:]]*@relation("AssistanceRequest_clientIdToUser"/client User @relation("client"/g' prisma/schema.prisma
sed -i '' 's/User_AssistanceRequest_professionalIdToUser[[:space:]]*User?[[:space:]]*@relation("AssistanceRequest_professionalIdToUser"/professional User? @relation("professional"/g' prisma/schema.prisma

# Per Category e Subcategory, verifica come sono nel database
echo ""
echo "3. Vediamo cosa c'è effettivamente nello schema per Category e Subcategory:"
grep -A1 -B1 "Category" prisma/schema.prisma | grep -v "^--$" | head -10

echo ""
echo "4. Rigenero Prisma Client:"
npx prisma generate

echo ""
echo "5. Test finale - proviamo vari nomi:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  console.log('Test con vari nomi...\n')
  
  // Test 1: nomi lunghi originali
  try {
    await prisma.assistanceRequest.findFirst({
      include: {
        User_AssistanceRequest_clientIdToUser: true,
        User_AssistanceRequest_professionalIdToUser: true,
        Category: true,
        Subcategory: true
      }
    })
    console.log('✅ Funziona con nomi LUNGHI')
  } catch (e) {
    console.log('❌ Non funziona con nomi lunghi')
  }
  
  // Test 2: nomi corti  
  try {
    await prisma.assistanceRequest.findFirst({
      include: {
        client: true,
        professional: true,
        Category: true,
        Subcategory: true
      }
    })
    console.log('✅ Funziona con nomi CORTI (client, professional)')
  } catch (e) {
    console.log('❌ Non funziona con nomi corti')
  }
  
  await prisma.$disconnect()
}

test()
EOF

echo ""
echo "=========================================="
echo "USA I NOMI CHE HANNO ✅ sopra!"
