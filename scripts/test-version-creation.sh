#!/bin/bash

echo "🧪 Test Completo Sistema Legal Documents API"
echo "==========================================="
echo ""

# Test creazione nuova versione
echo "📝 Test creazione nuova versione..."
echo ""

# Prima ottieni un documento esistente
DOC_ID=$(curl -s http://localhost:3200/api/admin/legal-documents 2>/dev/null | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['data'][0]['id'] if data.get('data') else '')" 2>/dev/null)

if [ -z "$DOC_ID" ]; then
    echo "❌ Nessun documento trovato nel database"
    echo "   Esegui prima: node backend/scripts/seed-legal-documents.js"
    exit 1
fi

echo "✅ Documento trovato: $DOC_ID"
echo ""

# Prepara i dati per la nuova versione
VERSION_DATA=$(cat <<EOF
{
  "version": "1.0.1",
  "title": "Test Version 1.0.1",
  "content": "<h1>Test Content</h1><p>This is a test version</p>",
  "contentPlain": "Test Content. This is a test version",
  "summary": "Test version for debugging",
  "versionNotes": "Created for testing",
  "effectiveDate": "2025-09-18",
  "language": "it",
  "notifyUsers": false
}
EOF
)

echo "📤 Invio richiesta creazione versione..."
echo ""
echo "Payload:"
echo "$VERSION_DATA" | python3 -m json.tool
echo ""

# Invia la richiesta (senza auth per test)
RESPONSE=$(curl -X POST \
  -H "Content-Type: application/json" \
  -d "$VERSION_DATA" \
  "http://localhost:3200/api/admin/legal-documents/$DOC_ID/versions" \
  -w "\nHTTP_STATUS:%{http_code}" \
  2>/dev/null)

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d')

echo "📊 Risposta:"
echo "Status Code: $HTTP_CODE"
echo ""
echo "Body:"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "201" ]; then
    echo "✅ Versione creata con successo!"
elif [ "$HTTP_CODE" = "401" ]; then
    echo "⚠️  Autenticazione richiesta (normale per endpoint protetti)"
    echo "   Per testare completamente, usa l'interfaccia web con login admin"
elif [ "$HTTP_CODE" = "400" ]; then
    echo "❌ Errore di validazione - Controlla i dati inviati"
else
    echo "❌ Errore: HTTP $HTTP_CODE"
fi

echo ""
echo "🔗 Per testare con interfaccia grafica:"
echo "1. Vai su: http://localhost:5193/admin/legal-documents"
echo "2. Clicca su un documento"
echo "3. Clicca su 'Nuova Versione' o 'Aggiungi Versione'"
