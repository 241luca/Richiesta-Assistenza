#!/bin/bash

echo "🔧 APPLICAZIONE MIGRAZIONE COORDINATE USER"
echo "=========================================="

# Crea il file SQL di migrazione
cat > /tmp/add_user_coordinates.sql << 'SQL'
-- Aggiungi campi coordinate alla tabella User
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "workLatitude" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "workLongitude" DOUBLE PRECISION;

-- Aggiungi indici per performance
CREATE INDEX IF NOT EXISTS "User_latitude_longitude_idx" ON "User"("latitude", "longitude");
CREATE INDEX IF NOT EXISTS "User_workLatitude_workLongitude_idx" ON "User"("workLatitude", "workLongitude");

-- Verifica che i campi siano stati aggiunti
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'User' 
AND column_name IN ('latitude', 'longitude', 'workLatitude', 'workLongitude');
SQL

echo "File SQL creato: /tmp/add_user_coordinates.sql"
echo ""
echo "Applicazione migrazione al database..."

# Applica la migrazione
psql -U lucamambelli -d assistenza_db -f /tmp/add_user_coordinates.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migrazione applicata con successo!"
    
    echo ""
    echo "Aggiornamento schema Prisma..."
    cd backend
    npx prisma db pull
    
    if [ $? -eq 0 ]; then
        echo "✅ Schema Prisma aggiornato!"
        
        echo ""
        echo "Rigenerazione Prisma Client..."
        npx prisma generate
        
        if [ $? -eq 0 ]; then
            echo "✅ Prisma Client rigenerato!"
            echo ""
            echo "🎉 TUTTO COMPLETATO! Ora puoi aggiornare le coordinate dei professionisti."
        fi
    fi
else
    echo "❌ Errore nell'applicazione della migrazione"
fi

# Cleanup
rm -f /tmp/add_user_coordinates.sql
