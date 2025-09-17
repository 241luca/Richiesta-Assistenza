#!/bin/bash

echo "🔧 TEST AUTORIZZAZIONE SUPER_ADMIN"
echo "=================================="

echo "📝 1. Test endpoint con autenticazione:"
echo "🌐 Testing user session..."

# Test session endpoint per vedere il ruolo dell'utente
curl -s -X GET "http://localhost:3200/backend/session-check" \
  -H "Content-Type: application/json" | jq '.' || echo "Formato non JSON"

echo ""
echo ""

echo "📝 2. Se l'utente NON è SUPER_ADMIN:"
echo "   ❌ La route è protetta e reindirizza automaticamente"
echo "   🔧 Soluzione: Cambia il ruolo utente a SUPER_ADMIN nel database"
echo ""

echo "📝 3. Se l'utente È SUPER_ADMIN ma il clic non funziona:"
echo "   🔍 Controlla la console del browser per errori JavaScript"
echo "   🔗 Prova navigazione diretta: http://localhost:5193/admin/system-settings"
echo ""

echo "📝 4. Test navigazione diretta:"
echo "   💻 Copia e incolla nel browser: http://localhost:5193/admin/system-settings"
echo "   ✅ Se funziona → problema nel link del menu"
echo "   ❌ Se non funziona → problema nella route o componente"

echo ""
echo "💡 PROSSIMO PASSO:"
echo "   Fai questi test e dimmi i risultati per identificare il problema esatto!"
