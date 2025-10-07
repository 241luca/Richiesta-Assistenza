#!/bin/bash

# Test Memory Leak WebSocket Fix
# Simula connessioni multiple per verificare che non ci sia memory leak

echo "🧪 TEST MEMORY LEAK WEBSOCKET FIX"
echo "================================="
echo ""

# Configurazione
SERVER_URL="http://localhost:3200"
WS_URL="ws://localhost:3200"
NUM_CONNECTIONS=50
TEST_DURATION=60  # secondi

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funzione per ottenere un token di test
get_test_token() {
    echo "🔑 Getting test token..."
    
    # Login con account di test (modifica con credenziali reali)
    RESPONSE=$(curl -s -X POST "$SERVER_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "test@example.com",
            "password": "Test123!"
        }')
    
    TOKEN=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$TOKEN" ]; then
        echo -e "${RED}❌ Failed to get token. Please check credentials.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Token obtained${NC}"
    echo ""
}

# Funzione per controllare memoria iniziale
check_initial_memory() {
    echo "📊 Checking initial memory..."
    
    INITIAL_STATS=$(curl -s -H "Authorization: Bearer $TOKEN" \
        "$SERVER_URL/api/admin/websocket/stats")
    
    if [ $? -eq 0 ]; then
        echo "$INITIAL_STATS" | python3 -m json.tool | grep -E "rss|heapUsed|activeConnections"
    fi
    echo ""
}

# Funzione per simulare connessioni
simulate_connections() {
    echo -e "${BLUE}🚀 Starting $NUM_CONNECTIONS WebSocket connections...${NC}"
    echo ""
    
    # Crea file Node.js temporaneo per test
    cat > /tmp/ws-test.js << 'EOF'
const io = require('socket.io-client');

const SERVER = process.argv[2] || 'http://localhost:3200';
const TOKEN = process.argv[3];
const NUM = parseInt(process.argv[4]) || 10;

const sockets = [];

console.log(`Connecting ${NUM} clients to ${SERVER}`);

for (let i = 0; i < NUM; i++) {
    setTimeout(() => {
        const socket = io(SERVER, {
            auth: { token: TOKEN },
            transports: ['websocket', 'polling']
        });
        
        socket.on('connect', () => {
            console.log(`✅ Client ${i + 1}/${NUM} connected: ${socket.id}`);
        });
        
        socket.on('disconnect', (reason) => {
            console.log(`❌ Client ${i + 1} disconnected: ${reason}`);
        });
        
        socket.on('error', (error) => {
            console.error(`Error on client ${i + 1}:`, error.message);
        });
        
        // Simula attività periodica
        setInterval(() => {
            if (socket.connected) {
                socket.emit('ping');
            }
        }, 10000);
        
        sockets.push(socket);
    }, i * 100); // Connetti gradualmente
}

// Disconnetti metà dopo 30 secondi
setTimeout(() => {
    console.log('\n🔄 Disconnecting half of clients...');
    for (let i = 0; i < NUM / 2; i++) {
        if (sockets[i]) {
            sockets[i].disconnect();
        }
    }
}, 30000);

// Keep alive
setTimeout(() => {
    console.log('\n✅ Test completed. Cleaning up...');
    sockets.forEach(s => s.disconnect());
    process.exit(0);
}, 60000);
EOF
    
    # Installa dipendenze se necessario
    if ! npm list socket.io-client > /dev/null 2>&1; then
        echo "Installing socket.io-client..."
        npm install -g socket.io-client > /dev/null 2>&1
    fi
    
    # Esegui test
    node /tmp/ws-test.js "$SERVER_URL" "$TOKEN" "$NUM_CONNECTIONS" &
    TEST_PID=$!
    
    echo -e "${GREEN}✅ Test started with PID: $TEST_PID${NC}"
    echo ""
}

# Funzione per monitorare memoria
monitor_memory() {
    echo "📈 Monitoring memory usage..."
    echo "Time | RSS (MB) | Heap (MB) | Connections"
    echo "----------------------------------------"
    
    for i in {1..12}; do
        sleep 5
        
        STATS=$(curl -s -H "Authorization: Bearer $TOKEN" \
            "$SERVER_URL/api/admin/websocket/stats" 2>/dev/null)
        
        if [ $? -eq 0 ]; then
            RSS=$(echo "$STATS" | grep -o '"rss":[0-9]*' | cut -d: -f2)
            HEAP=$(echo "$STATS" | grep -o '"heapUsed":[0-9]*' | cut -d: -f2)
            CONN=$(echo "$STATS" | grep -o '"activeConnections":[0-9]*' | cut -d: -f2)
            
            printf "%3ds | %8s | %9s | %11s\n" \
                $((i*5)) \
                "${RSS:-0}" \
                "${HEAP:-0}" \
                "${CONN:-0}"
            
            # Check for memory leak
            if [ ! -z "$RSS" ] && [ ! -z "$INITIAL_RSS" ]; then
                DIFF=$((RSS - INITIAL_RSS))
                if [ $DIFF -gt 100 ]; then
                    echo -e "${YELLOW}⚠️ Memory increased by ${DIFF}MB${NC}"
                fi
            fi
        fi
    done
    echo ""
}

# Funzione per cleanup finale
final_cleanup() {
    echo "🧹 Final cleanup..."
    
    # Trigger manual cleanup
    curl -s -X POST -H "Authorization: Bearer $TOKEN" \
        "$SERVER_URL/api/admin/websocket/cleanup" > /dev/null
    
    # Kill test process if still running
    if [ ! -z "$TEST_PID" ]; then
        kill $TEST_PID 2>/dev/null
    fi
    
    # Check final memory
    sleep 5
    FINAL_STATS=$(curl -s -H "Authorization: Bearer $TOKEN" \
        "$SERVER_URL/api/admin/websocket/stats")
    
    echo "📊 Final memory state:"
    echo "$FINAL_STATS" | python3 -m json.tool | grep -E "rss|heapUsed|activeConnections"
    echo ""
}

# Funzione per analizzare risultati
analyze_results() {
    echo "📊 ANALYSIS"
    echo "==========="
    
    # Get final stats
    FINAL_RSS=$(echo "$FINAL_STATS" | grep -o '"rss":[0-9]*' | cut -d: -f2)
    FINAL_CONN=$(echo "$FINAL_STATS" | grep -o '"activeConnections":[0-9]*' | cut -d: -f2)
    
    if [ "$FINAL_CONN" = "0" ] || [ "$FINAL_CONN" -lt 5 ]; then
        echo -e "${GREEN}✅ Connections cleaned up properly${NC}"
    else
        echo -e "${YELLOW}⚠️ Some connections still active: $FINAL_CONN${NC}"
    fi
    
    # Memory leak check
    if [ ! -z "$INITIAL_RSS" ] && [ ! -z "$FINAL_RSS" ]; then
        MEMORY_DIFF=$((FINAL_RSS - INITIAL_RSS))
        
        if [ $MEMORY_DIFF -lt 50 ]; then
            echo -e "${GREEN}✅ NO MEMORY LEAK DETECTED! (+${MEMORY_DIFF}MB is normal)${NC}"
        elif [ $MEMORY_DIFF -lt 100 ]; then
            echo -e "${YELLOW}⚠️ Slight memory increase: +${MEMORY_DIFF}MB${NC}"
        else
            echo -e "${RED}❌ POSSIBLE MEMORY LEAK: +${MEMORY_DIFF}MB${NC}"
        fi
    fi
    
    echo ""
    echo "✅ Test completed!"
}

# Main execution
main() {
    echo -e "${BLUE}Starting WebSocket Memory Leak Test...${NC}"
    echo ""
    
    # Check if server is running
    if ! curl -s "$SERVER_URL/health" > /dev/null; then
        echo -e "${RED}❌ Server is not running on $SERVER_URL${NC}"
        exit 1
    fi
    
    # Get token
    get_test_token
    
    # Check initial memory
    check_initial_memory
    INITIAL_RSS=$(echo "$INITIAL_STATS" | grep -o '"rss":[0-9]*' | cut -d: -f2)
    
    # Start test
    simulate_connections
    
    # Monitor
    monitor_memory
    
    # Cleanup
    final_cleanup
    
    # Analyze
    analyze_results
}

# Trap per cleanup su interruzione
trap final_cleanup EXIT

# Esegui
main