#!/bin/bash

echo "🔍 VERIFICA PORTA 8080 SU VPS"
echo "=============================="
echo ""

# Configurazione SSH per il VPS
VPS_IP="37.27.89.35"
VPS_USER="root"  # Cambia se usi un altro utente

echo "📍 VPS: $VPS_USER@$VPS_IP"
echo ""
echo "Connessione al VPS e verifica servizi sulla porta 8080..."
echo "=========================================================="
echo ""

# Comando SSH con tutti i controlli
ssh "$VPS_USER@$VPS_IP" << 'EOF'

echo "1️⃣ PROCESSI IN ASCOLTO SULLA PORTA 8080:"
echo "-----------------------------------------"
sudo lsof -i :8080 2>/dev/null || sudo netstat -tlnp | grep :8080 || sudo ss -tlnp | grep :8080
echo ""

echo "2️⃣ CONTROLLO CON NETSTAT:"
echo "-------------------------"
sudo netstat -tlnp | grep 8080 2>/dev/null || echo "netstat non disponibile"
echo ""

echo "3️⃣ CONTROLLO CON SS:"
echo "--------------------"
sudo ss -tlnp | grep 8080 2>/dev/null || echo "ss non disponibile"
echo ""

echo "4️⃣ PROCESSI DOCKER:"
echo "-------------------"
if command -v docker &> /dev/null; then
    echo "Container in esecuzione:"
    sudo docker ps | grep -E "8080|evolution" || echo "Nessun container Evolution trovato"
    echo ""
    
    echo "Port mapping Docker:"
    sudo docker ps --format "table {{.Names}}\t{{.Ports}}" | grep -E "8080|PORTS"
    echo ""
    
    echo "Logs Evolution API (ultime 20 righe):"
    sudo docker logs evolution_api --tail 20 2>&1 || echo "Container evolution_api non trovato"
else
    echo "Docker non installato"
fi
echo ""

echo "5️⃣ PROCESSI EVOLUTION:"
echo "----------------------"
ps aux | grep -E "evolution|node.*8080" | grep -v grep || echo "Nessun processo Evolution trovato"
echo ""

echo "6️⃣ TEST LOCALE DAL VPS:"
echo "-----------------------"
echo "Test connessione locale:"
curl -s -o /dev/null -w "HTTP Status: %{http_code} - Time: %{time_total}s\n" \
  -X GET "http://localhost:8080/" \
  --max-time 5 || echo "Connessione fallita"
echo ""

echo "7️⃣ FIREWALL STATUS:"
echo "-------------------"
# UFW
if command -v ufw &> /dev/null; then
    echo "UFW Status:"
    sudo ufw status | grep 8080 || echo "Porta 8080 non configurata in UFW"
fi

# iptables
echo "iptables (porta 8080):"
sudo iptables -L -n | grep 8080 2>/dev/null || echo "Nessuna regola iptables per 8080"
echo ""

echo "8️⃣ DIRECTORY EVOLUTION:"
echo "-----------------------"
if [ -d "/opt/evolution-api" ]; then
    echo "Directory Evolution trovata:"
    ls -la /opt/evolution-api/ | head -10
    echo ""
    
    if [ -f "/opt/evolution-api/docker-compose.yml" ]; then
        echo "Docker Compose config:"
        grep -A5 -B5 "8080" /opt/evolution-api/docker-compose.yml
    fi
else
    echo "Directory /opt/evolution-api non trovata"
fi
echo ""

echo "9️⃣ MEMORIA E CPU:"
echo "-----------------"
free -h
echo ""
top -bn1 | head -10
echo ""

echo "🔟 TEST API EVOLUTION:"
echo "--------------------"
if curl -s http://localhost:8080/ > /dev/null 2>&1; then
    echo "✅ Evolution API risponde su localhost:8080"
    curl -s http://localhost:8080/ | python3 -m json.tool 2>/dev/null | head -20
else
    echo "❌ Evolution API non risponde su localhost:8080"
fi

EOF

echo ""
echo "✅ Verifica completata!"
