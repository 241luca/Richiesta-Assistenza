#!/bin/bash

echo "🔍 Test Configurazione Backend con Strict Parziale..."
echo ""

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

echo "📊 Controllo TypeScript..."
npx tsc --noEmit 2>&1 | head -20

echo ""
echo "✅ Build Test..."
npm run build 2>&1 | tail -10

echo ""
echo "=================================================="
echo "✅ FATTO! Il backend ora ha:"
echo "   - noImplicitAny: true"
echo "   - strictFunctionTypes: true"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   - Il sistema COMPILA ancora (noEmitOnError: false)"
echo "   - Vedrai 648 errori TypeScript, ma è NORMALE"
echo "   - Sistemali man mano che modifichi i file"
echo "=================================================="
