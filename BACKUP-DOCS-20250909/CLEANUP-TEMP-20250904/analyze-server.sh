#!/bin/bash

echo "🔍 ANALISI COMPLETA SERVER.TS"
echo "=============================="
echo ""

echo "1️⃣ Cerco dove sono registrate le route API..."
echo ""

# Cerca pattern di registrazione route
grep -n "app.use.*api" backend/src/server.ts | head -20

echo ""
echo "2️⃣ Cerco simpleBackupRoutes..."
echo ""

grep -n "simpleBackupRoutes" backend/src/server.ts

echo ""
echo "3️⃣ Controllo import..."
echo ""

grep -n "import.*simple-backup" backend/src/server.ts

echo ""
echo "=============================="
