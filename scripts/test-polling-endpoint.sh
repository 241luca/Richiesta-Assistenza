#!/bin/bash

# Test rapido endpoint WhatsApp Polling
echo "🔍 Test Endpoint WhatsApp Polling"
echo "================================"
echo ""

# Base URL
BASE_URL="http://localhost:3200/api/whatsapp"

# Test endpoints polling
echo "📡 Test Polling Status:"
curl -s "$BASE_URL/polling/status" | head -20
echo ""
echo ""

echo "✅ Se vedi una risposta JSON, le route funzionano!"
echo "❌ Se vedi 404, c'è un problema con le route"
