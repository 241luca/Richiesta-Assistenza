#!/bin/bash

echo "🔧 AGGIUNGI CAMPI COORDINATE A USER"
echo "==================================="

cd backend

# Prima verifichiamo se i campi esistono già
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAndAddCoordinates() {
  try {
    // Test se i campi esistono
    console.log('Verifico se i campi coordinate esistono nella tabella User...\n')
    
    const testUser = await prisma.user.findFirst()
    
    if (testUser && ('latitude' in testUser || 'longitude' in testUser)) {
      console.log('✅ I campi coordinate esistono già!')
      return
    }
    
    console.log('❌ I campi coordinate non esistono nella tabella User')
    console.log('\n📝 Per aggiungere i campi, esegui questa migrazione SQL:\n')
    
    const migrationSQL = `
-- Aggiungi campi coordinate alla tabella User
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "workLatitude" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "workLongitude" DOUBLE PRECISION;

-- Aggiungi indici per performance
CREATE INDEX IF NOT EXISTS "User_latitude_longitude_idx" ON "User"("latitude", "longitude");
CREATE INDEX IF NOT EXISTS "User_workLatitude_workLongitude_idx" ON "User"("workLatitude", "workLongitude");
`;

    console.log(migrationSQL)
    
    console.log('\nPer applicare la migrazione:')
    console.log('1. Salva il SQL sopra in un file migration.sql')
    console.log('2. Esegui: psql -U lucamambelli -d assistenza_db -f migration.sql')
    console.log('3. Poi esegui: npx prisma db pull per aggiornare lo schema')
    
  } catch (error) {
    console.error('Errore:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkAndAddCoordinates()
EOF
