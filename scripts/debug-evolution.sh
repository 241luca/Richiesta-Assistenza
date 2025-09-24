#!/bin/bash

echo "🔍 DEBUG EVOLUTION API TIMEOUT"
echo "=============================="

API_URL="http://localhost:8080"
API_KEY="evolution_key_luca_2025_secure_21806"
INSTANCE="assistenza"
NUMBER="393403803728"

# Test 1: Connessione base
echo -e "\n1️⃣ Test connessione API (dovrebbe essere immediato):"
time curl -s "$API_URL/" -H "apikey: $API_KEY" | python3 -c "import json,sys; print(json.load(sys.stdin)['message'])" 2>/dev/null || echo "ERRORE"

# Test 2: Stato istanza
echo -e "\n2️⃣ Stato istanza (dovrebbe essere immediato):"
time curl -s "$API_URL/instance/connectionState/$INSTANCE" -H "apikey: $API_KEY" | python3 -m json.tool | grep state

# Test 3: Verifica numero SENZA inviare
echo -e "\n3️⃣ Verifica se il numero esiste (potrebbe essere lento):"
time curl -X POST "$API_URL/chat/whatsappNumbers/$INSTANCE" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"numbers":["'$NUMBER'"]}' \
  --max-time 3 2>/dev/null | python3 -m json.tool 2>/dev/null || echo "TIMEOUT"

# Test 4: Invio con strace per vedere dove si blocca
echo -e "\n4️⃣ Tentativo invio con trace (max 5 secondi):"
echo "Preparazione messaggio..."

# Usa strace se disponibile
if command -v strace &> /dev/null; then
    echo "Tracciamento chiamate di sistema..."
    timeout 5 strace -f -e trace=network curl -X POST "$API_URL/message/sendText/$INSTANCE" \
      -H "apikey: $API_KEY" \
      -H "Content-Type: application/json" \
      -d '{"number":"'$NUMBER'","text":"Debug test"}' 2>&1 | tail -20
else
    echo "Invio normale..."
    timeout 5 curl -X POST "$API_URL/message/sendText/$INSTANCE" \
      -H "apikey: $API_KEY" \
      -H "Content-Type: application/json" \
      -d '{"number":"'$NUMBER'","text":"Debug test"}' \
      -v 2>&1
fi

# Test 5: Controlla processi Node
echo -e "\n5️⃣ Processi Node.js in esecuzione:"
ps aux | grep node | grep -v grep | awk '{print $1, $2, $3, $4, $11}' | head -5

# Test 6: Connessioni di rete aperte
echo -e "\n6️⃣ Connessioni Evolution API:"
netstat -anp 2>/dev/null | grep 8080 | head -5 || ss -anp | grep 8080 | head -5

# Test 7: Docker resources
echo -e "\n7️⃣ Risorse Docker:"
docker stats evolution_api --no-stream --format "CPU: {{.CPUPerc}} | RAM: {{.MemUsage}}"

# Test 8: Ultimi errori Evolution
echo -e "\n8️⃣ Ultimi errori nei log:"
docker logs evolution_api 2>&1 | grep -i "error\|timeout\|failed" | tail -5

# Test 9: Test invio a numero SICURAMENTE inesistente
echo -e "\n9️⃣ Test con numero fake (dovrebbe fallire velocemente):"
time curl -X POST "$API_URL/message/sendText/$INSTANCE" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"number":"390000000000","text":"Test"}' \
  --max-time 3 2>&1 | grep -o "HTTP/[0-9.]* [0-9]*\|error\|timeout" || echo "TIMEOUT anche con numero fake"

echo -e "\n✅ Debug completato"
echo ""
echo "POSSIBILI CAUSE:"
echo "1. Evolution API sta verificando il numero e va in timeout"
echo "2. Il numero potrebbe non essere registrato su WhatsApp"  
echo "3. Evolution ha un bug con numeri italiani"
echo "4. La connessione WhatsApp è instabile"
