#!/bin/bash
# Script Completamento Fix TypeScript
# Data: 09/10/2025

echo "🚀 COMPLETAMENTO FIX TYPESCRIPT"
echo "==============================="
echo ""

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# Step 1: Formatta Schema
echo "📝 1. Formattazione schema Prisma..."
npx prisma format
if [ $? -eq 0 ]; then
    echo "   ✅ Schema formattato!"
else
    echo "   ❌ Errore formattazione schema!"
    exit 1
fi

echo ""

# Step 2: Genera Client
echo "🔨 2. Generazione Prisma Client..."
npx prisma generate
if [ $? -eq 0 ]; then
    echo "   ✅ Client generato!"
else
    echo "   ❌ Errore generazione client!"
    exit 1
fi

echo ""

# Step 3: Push Database
echo "📤 3. Push modifiche al database..."
echo "   ⚠️  Questo creerà 4 nuove tabelle:"
echo "      - NotificationDelivery"
echo "      - PushSubscription"
echo "      - ScheduledNotification"
echo "      - ModuleHistory"
echo ""
read -p "   Vuoi continuare? (s/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Ss]$ ]]; then
    npx prisma db push
    if [ $? -eq 0 ]; then
        echo "   ✅ Database aggiornato!"
    else
        echo "   ❌ Errore push database!"
        exit 1
    fi
else
    echo "   ⏸️  Push database saltato"
fi

echo ""

# Step 4: Test Compilazione
echo "🧪 4. Test compilazione TypeScript..."
npx tsc --noEmit 2>&1 | head -20
ERRORS=$(npx tsc --noEmit 2>&1 | grep -c "error TS")

if [ $ERRORS -eq 0 ]; then
    echo ""
    echo "   ✅ Nessun errore TypeScript!"
else
    echo ""
    echo "   ⚠️  Trovati $ERRORS errori TypeScript"
    echo "   📝 Vedi sopra per i dettagli"
fi

echo ""
echo "==============================="
echo "✅ SCRIPT COMPLETATO!"
echo ""
echo "📋 PROSSIMI STEP:"
echo "   1. Leggi REPORT-FIX-TYPESCRIPT-09-10-2025.md"
echo "   2. Decommenta i TODO nei file"
echo "   3. Verifica auditService API"
echo "   4. Testa il sistema"
echo ""
echo "🚀 Buon lavoro!"
