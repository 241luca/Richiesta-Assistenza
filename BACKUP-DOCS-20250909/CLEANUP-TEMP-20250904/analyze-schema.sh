#!/bin/bash

echo "🔍 ANALISI COMPLETA SCHEMA E RELAZIONI"
echo "======================================"

cd backend

echo "1. Mostra il modello AssistanceRequest completo:"
echo "------------------------------------------------"
sed -n '/^model AssistanceRequest/,/^model /p' prisma/schema.prisma | head -30

echo ""
echo "2. Test diretto di cosa Prisma vede:"
echo "------------------------------------"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Mostra quali campi sono disponibili
console.log('Campi disponibili per AssistanceRequest:')
const fields = Object.keys(prisma.assistanceRequest.fields)
fields.forEach(field => {
  console.log('  -', field)
})

prisma.$disconnect()
EOF

echo ""
echo "======================================"
echo "Dimmi cosa mostra e decidiamo come procedere"
