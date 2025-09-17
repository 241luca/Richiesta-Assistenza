#!/bin/bash

echo "🔍 DEBUG: COSA RITORNA SENDAPP"
echo "==============================="
echo ""

DB_URL=$(grep DATABASE_URL /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/.env | cut -d '=' -f2- | tr -d '"')
TOKEN=$(psql "$DB_URL" -t -c "SELECT key FROM \"ApiKey\" WHERE service='whatsapp' AND \"isActive\"=true;" 2>/dev/null | tr -d ' ')
INSTANCE_ID=$(psql "$DB_URL" -t -c "SELECT permissions->>'instanceId' FROM \"ApiKey\" WHERE service='whatsapp';" 2>/dev/null | tr -d ' ')

echo "📱 Recupero chat da SendApp..."
echo "-------------------------------"

# Chiama l'API e salva la risposta
curl -s -X GET "https://app.sendapp.cloud/api/chats/list" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"instanceId\": \"$INSTANCE_ID\"}" > /tmp/sendapp_response.json

echo "Dimensione risposta: $(wc -c < /tmp/sendapp_response.json) bytes"
echo ""
echo "Prime 500 caratteri della risposta:"
head -c 500 /tmp/sendapp_response.json | python3 -m json.tool 2>/dev/null || head -c 500 /tmp/sendapp_response.json
echo ""
echo ""

echo "📝 Analisi struttura dati:"
echo "--------------------------"
python3 << EOF
import json
import sys

try:
    with open('/tmp/sendapp_response.json', 'r') as f:
        data = json.load(f)
    
    print(f"Tipo risposta: {type(data)}")
    
    if isinstance(data, dict):
        print(f"Chiavi principali: {list(data.keys())[:5]}")
        
        # Se c'è una chiave 'data' o 'chats'
        if 'data' in data:
            print(f"Tipo data: {type(data['data'])}")
            if isinstance(data['data'], list) and len(data['data']) > 0:
                print(f"Numero elementi in data: {len(data['data'])}")
                print(f"Esempio primo elemento:")
                print(json.dumps(data['data'][0], indent=2)[:500])
        
        if 'chats' in data:
            print(f"Tipo chats: {type(data['chats'])}")
            if isinstance(data['chats'], list) and len(data['chats']) > 0:
                print(f"Numero chat: {len(data['chats'])}")
                print(f"Esempio prima chat:")
                print(json.dumps(data['chats'][0], indent=2)[:500])
    
    elif isinstance(data, list) and len(data) > 0:
        print(f"Numero elementi: {len(data)}")
        print(f"Esempio primo elemento:")
        print(json.dumps(data[0], indent=2)[:500])
        
except Exception as e:
    print(f"Errore parsing JSON: {e}")
    print("La risposta potrebbe non essere JSON valido")
EOF

echo ""
echo "💡 SOLUZIONE:"
echo "------------"
echo "Dobbiamo capire il formato esatto dei dati per estrarli correttamente."
echo "Probabilmente le chat non contengono i messaggi ma solo info sui contatti."
echo "Potremmo dover chiamare un altro endpoint per i messaggi di ogni chat."
