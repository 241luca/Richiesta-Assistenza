#!/bin/bash
# Test prezzi preventivi corretti

echo "🧪 Test Prezzi Preventivi"
echo "========================"

# Login come cliente
echo "1️⃣ Login come Luigi Bianchi (Cliente)..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "luigi.bianchi@gmail.com",
    "password": "password123"
  }')

echo "✅ Login effettuato"

# Recupera preventivi
echo ""
echo "2️⃣ Recupero preventivi..."
QUOTES_RESPONSE=$(curl -s http://localhost:3200/api/quotes \
  -b cookies.txt \
  -H "Content-Type: application/json")

echo ""
echo "📊 Preventivi ricevuti:"
echo "$QUOTES_RESPONSE" | python3 -m json.tool 2>/dev/null | grep -E '"amount"|"title"|"professional"' | head -20

echo ""
echo "3️⃣ Verifica conversione prezzi:"
echo "================================"

# Estrai gli amount e mostrali
AMOUNTS=$(echo "$QUOTES_RESPONSE" | python3 -c "
import json
import sys
try:
    data = json.load(sys.stdin)
    quotes = data.get('data', []) if isinstance(data, dict) else data
    for quote in quotes[:5]:
        if isinstance(quote, dict):
            amount = quote.get('amount', 0)
            title = quote.get('title', 'Senza titolo')
            # Converti da centesimi a euro
            euros = amount / 100
            print(f'📄 {title}')
            print(f'   💰 Valore in centesimi: {amount}')
            print(f'   💶 Valore in euro: €{euros:.2f}')
            print('')
except:
    print('Errore nel parsing JSON')
")

echo "$AMOUNTS"

echo ""
echo "✅ Test completato!"
echo ""
echo "Se i valori in euro sono corretti (es: €382.21 invece di €38221.00),"
echo "allora la correzione funziona!"

# Cleanup
rm -f cookies.txt
