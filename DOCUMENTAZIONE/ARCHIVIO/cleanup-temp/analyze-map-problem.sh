#!/bin/bash

echo "🔍 ANALISI COMPLETA PROBLEMA MAPPA"
echo "=================================="

echo "1️⃣ Verificando se RequestMap usa geocode..."
grep -r "geocode\|/api/maps" src/ --include="*.tsx" --include="*.ts" 2>/dev/null

echo ""
echo "2️⃣ Verificando utils/googleMapsLoader..."
cat src/utils/googleMapsLoader.ts 2>/dev/null | head -50

echo ""
echo "3️⃣ Verificando se c'è un componente ShowMapButton..."
find src -name "*Map*" -type f | head -10
