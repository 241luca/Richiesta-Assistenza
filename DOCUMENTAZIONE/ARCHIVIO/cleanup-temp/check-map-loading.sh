#!/bin/bash

echo "🔍 FIX CARICAMENTO MAPPA AL PRIMO CLICK"
echo "======================================="

echo "Verifico il componente RequestMap..."

# Cerca il problema nel componente
grep -n "isLoaded\|isLoading\|useEffect" src/components/maps/RequestMap.tsx | head -20

echo ""
echo "======================================="
echo "Verifico googleMapsLoader..."

cat src/utils/googleMapsLoader.ts
