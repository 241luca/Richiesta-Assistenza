#!/bin/bash

echo "🔧 DIAGNOSI COMPLETA PROBLEMA IMPOSTAZIONI SISTEMA"
echo "================================================="

echo "📝 1. Test endpoint backend direttamente..."
echo "🌐 Testing /api/admin/system-settings..."

# Test dell'endpoint system-settings
curl -s -w "\nStatus Code: %{http_code}\n" \
  -X GET "http://localhost:3200/api/admin/system-settings" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json"

echo ""
echo ""

echo "📝 2. Test sessione utente..."
curl -s -X GET "http://localhost:3200/backend/session-check" \
  -H "Content-Type: application/json" | head -c 300

echo ""
echo ""

echo "📝 3. Controlla anche questi punti nel browser:"
echo "   🌐 URL attuale quando sei nella pagina"
echo "   📊 Network tab - ci sono richieste bloccate?"
echo "   🔍 Elementi tab - sono cliccabili nel DOM?"
echo "   ⚠️ Errori React nella console?"

echo ""
echo "📝 4. Test navigazione diretta:"
echo "   🎯 Vai direttamente a: http://localhost:5193/admin/system-settings"
echo "   ✅ Se funziona = problema nel link"
echo "   ❌ Se non funziona = problema nel componente"

echo ""
echo "💡 Se l'endpoint risponde correttamente, il problema è nel frontend"
