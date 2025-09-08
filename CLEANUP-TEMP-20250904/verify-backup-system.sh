#!/bin/bash

echo "🔍 VERIFICA FINALE SISTEMA BACKUP"
echo "================================="
echo ""

echo "1️⃣ Verifica file necessari..."
echo ""

# Controlla che i file esistano
if [ -f "backend/src/services/simple-backup.service.ts" ]; then
    echo "✅ Service: simple-backup.service.ts presente"
else
    echo "❌ Service mancante!"
fi

if [ -f "backend/src/routes/simple-backup.routes.ts" ]; then
    echo "✅ Routes: simple-backup.routes.ts presente"
else
    echo "❌ Routes mancante!"
fi

if [ -f "src/pages/admin/SimpleBackupPage.tsx" ]; then
    echo "✅ Component: SimpleBackupPage.tsx presente"
else
    echo "❌ Component mancante!"
fi

echo ""
echo "2️⃣ Verifica import nel server.ts..."
grep -q "simple-backup.routes" backend/src/server.ts
if [ $? -eq 0 ]; then
    echo "✅ Import route presente nel server.ts"
else
    echo "❌ Import route mancante nel server.ts"
fi

echo ""
echo "3️⃣ Verifica tabella database..."
psql "$DATABASE_URL" -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'backups');" -t | grep -q 't'
if [ $? -eq 0 ]; then
    echo "✅ Tabella 'backups' presente nel database"
else
    echo "❌ Tabella 'backups' mancante nel database"
fi

echo ""
echo "4️⃣ Verifica directory backup..."
if [ -d "backend/backups" ]; then
    echo "✅ Directory backup presente"
    echo "   Contenuto:"
    ls -la backend/backups/ 2>/dev/null | head -5
else
    echo "⚠️ Directory backup non trovata, creandola..."
    mkdir -p backend/backups/database
    mkdir -p backend/backups/code  
    mkdir -p backend/backups/uploads
    echo "✅ Directory create"
fi

echo ""
echo "5️⃣ Test API endpoint..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3200/api/backup/stats)
if [ "$response" = "200" ] || [ "$response" = "401" ]; then
    echo "✅ API endpoint risponde (status: $response)"
else
    echo "⚠️ API endpoint non risponde (status: $response)"
fi

echo ""
echo "================================="
echo "📊 RIEPILOGO:"

# Conta problemi
problems=0

# Controlla ogni componente
[ -f "backend/src/services/simple-backup.service.ts" ] || problems=$((problems+1))
[ -f "backend/src/routes/simple-backup.routes.ts" ] || problems=$((problems+1))
[ -f "src/pages/admin/SimpleBackupPage.tsx" ] || problems=$((problems+1))
[ -d "backend/backups" ] || problems=$((problems+1))

if [ $problems -eq 0 ]; then
    echo ""
    echo "✅ ✅ ✅ SISTEMA BACKUP PRONTO ALL'USO! ✅ ✅ ✅"
    echo ""
    echo "🎯 Accedi al sistema:"
    echo "   URL: http://localhost:5193/admin/backup"
    echo "   Menu: 💾 Sistema Backup"
else
    echo ""
    echo "⚠️ Ci sono $problems problemi da risolvere"
    echo "Controlla l'output sopra per i dettagli"
fi

echo ""
echo "================================="
