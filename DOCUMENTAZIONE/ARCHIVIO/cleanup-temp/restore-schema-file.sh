#!/bin/bash

echo "🚨 RIPRISTINO SCHEMA.PRISMA MANCANTE"
echo "===================================="

cd backend

echo "1. Verifica se esiste un backup:"
if [ -f prisma/schema.prisma.corrupted ]; then
    echo "Trovato schema.prisma.corrupted, lo ripristino"
    cp prisma/schema.prisma.corrupted prisma/schema.prisma
elif [ -f prisma/schema.prisma.backup-relations ]; then
    echo "Trovato backup-relations, lo uso"
    cp prisma/schema.prisma.backup-relations prisma/schema.prisma
else
    # Cerca qualsiasi backup
    BACKUP=$(ls -t prisma/schema.prisma.backup-* 2>/dev/null | head -1)
    if [ -f "$BACKUP" ]; then
        echo "Uso backup: $BACKUP"
        cp "$BACKUP" prisma/schema.prisma
    else
        echo "Nessun backup, creo schema minimo per db pull"
        cat > prisma/schema.prisma << 'SCHEMA'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
SCHEMA
    fi
fi

echo ""
echo "2. Pull dal database:"
npx prisma db pull --force

echo ""
echo "3. Generazione client:"
npx prisma generate

echo ""
echo "4. Test finale:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    const req = await prisma.assistanceRequest.findFirst()
    console.log('✅ PRISMA FUNZIONA!')
    
    // Verifica quali relazioni esistono
    const testWithRelations = await prisma.assistanceRequest.findFirst({
      include: {
        User_AssistanceRequest_clientIdToUser: true,
        User_AssistanceRequest_professionalIdToUser: true,
        Category: true
      }
    })
    console.log('\n✅ Le relazioni da usare sono:')
    console.log('   User_AssistanceRequest_clientIdToUser')
    console.log('   User_AssistanceRequest_professionalIdToUser')
    console.log('   Category (maiuscola)')
  } catch (e) {
    console.log('Errore:', e.message)
  }
  await prisma.$disconnect()
}

test()
EOF

echo ""
echo "===================================="
