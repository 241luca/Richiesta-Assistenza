#!/bin/bash

echo "🔍 DEBUG DATABASE SYSTEM SETTINGS"
echo "================================="

echo "📝 1. Testiamo direttamente l'endpoint..."
echo "🌐 GET /api/admin/system-settings"

# Test completo dell'endpoint con headers dettagliati
curl -s -w "\n\nResponse Details:\nHTTP Code: %{http_code}\nContent Type: %{content_type}\nResponse Time: %{time_total}s\n" \
  -X GET "http://localhost:3200/api/admin/system-settings" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_ID"

echo ""
echo ""

echo "📝 2. Verifica se la tabella system_setting esiste..."
echo "🔍 Controlliamo il schema del database..."

echo ""
echo "📝 3. Possibili problemi:"
echo "   ❌ Tabella system_setting non esiste"
echo "   ❌ Tabella system_setting vuota"
echo "   ❌ Problema di autenticazione/autorizzazione"
echo "   ❌ Service restituisce dati malformati"

echo ""
echo "💡 PROSSIMO STEP:"
echo "   Se l'endpoint restituisce un errore 500, il problema è nel database"
echo "   Se restituisce un oggetto vuoto {}, la tabella è vuota"
echo "   Se restituisce 401/403, problema di autenticazione"
