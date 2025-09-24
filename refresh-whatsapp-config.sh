#!/bin/bash

echo "🔄 Forzando refresh configurazione WhatsApp..."
echo ""

# Chiama l'endpoint di refresh
curl -X POST http://localhost:3200/api/whatsapp/config/refresh \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer IL_TUO_TOKEN_JWT" \
  | json_pp

echo ""
echo "✅ Configurazione refreshata!"
echo ""
echo "Ora prova di nuovo a inviare un messaggio."