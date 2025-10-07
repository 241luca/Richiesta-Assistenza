#!/bin/bash

# Chat System Health Check
# Verifica completa del sistema di chat e messaggistica

echo "💬 CHAT SYSTEM CHECK"
echo "===================="
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contatori
ERRORS=0
WARNINGS=0
CHECKS=0

# Directory progetto
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/../../.." && pwd )"
BACKEND_DIR="$PROJECT_DIR/backend"

echo "📍 Directory progetto: $PROJECT_DIR"
echo ""

# Funzione per incrementare contatori
check_pass() {
    CHECKS=$((CHECKS + 1))
    echo -e "${GREEN}✅ $1${NC}"
}

check_warn() {
    CHECKS=$((CHECKS + 1))
    WARNINGS=$((WARNINGS + 1))
    echo -e "${YELLOW}⚠️  $1${NC}"
}

check_fail() {
    CHECKS=$((CHECKS + 1))
    ERRORS=$((ERRORS + 1))
    echo -e "${RED}❌ $1${NC}"
}

# 1. Verifica Socket.io
echo "🔌 VERIFICA SOCKET.IO"
echo "---------------------"

if [ -f "$BACKEND_DIR/package.json" ]; then
    if grep -q '"socket.io"' "$BACKEND_DIR/package.json"; then
        check_pass "Socket.io installato"
        
        # Verifica versione
        VERSION=$(grep '"socket.io"' "$BACKEND_DIR/package.json" | sed 's/.*"socket.io".*"\([^"]*\)".*/\1/')
        echo "   Versione Socket.io: $VERSION"
    else
        check_fail "Socket.io non installato"
        echo "   Esegui: cd backend && npm install socket.io"
    fi
    
    # Verifica socket.io client
    if grep -q '"socket.io-client"' "$PROJECT_DIR/package.json" 2>/dev/null; then
        check_pass "Socket.io client installato (frontend)"
    else
        check_warn "Socket.io client non trovato nel frontend"
    fi
fi

echo ""

# 2. Verifica file WebSocket
echo "📂 VERIFICA FILE WEBSOCKET"
echo "--------------------------"

WEBSOCKET_DIR="$BACKEND_DIR/src/websocket"

if [ -d "$WEBSOCKET_DIR" ]; then
    check_pass "Directory websocket presente"
    
    # Conta file WebSocket
    WS_FILES=$(find "$WEBSOCKET_DIR" -name "*.ts" -o -name "*.js" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$WS_FILES" -gt 0 ]; then
        check_pass "$WS_FILES file WebSocket trovati"
    else
        check_warn "Directory websocket vuota"
    fi
else
    check_fail "Directory websocket MANCANTE"
fi

# Verifica handler specifici
if [ -f "$WEBSOCKET_DIR/server.ts" ] || [ -f "$WEBSOCKET_DIR/index.ts" ]; then
    check_pass "WebSocket server configurato"
else
    check_warn "File server WebSocket non trovato"
fi

echo ""

# 3. Verifica configurazione chat
echo "⚙️ VERIFICA CONFIGURAZIONE CHAT"
echo "-------------------------------"

if [ -f "$PROJECT_DIR/.env" ]; then
    # Porta WebSocket
    if grep -q "WS_PORT\|SOCKET_PORT" "$PROJECT_DIR/.env"; then
        WS_PORT=$(grep "WS_PORT\|SOCKET_PORT" "$PROJECT_DIR/.env" | cut -d'=' -f2)
        check_pass "Porta WebSocket configurata: $WS_PORT"
    else
        check_warn "Porta WebSocket non configurata (usando default)"
    fi
    
    # CORS per WebSocket
    if grep -q "WS_CORS\|SOCKET_CORS" "$PROJECT_DIR/.env"; then
        check_pass "CORS WebSocket configurato"
    else
        check_warn "CORS WebSocket non configurato"
    fi
fi

echo ""

# 4. Verifica database messaggi
echo "🗄️ VERIFICA DATABASE MESSAGGI"
echo "-----------------------------"

if [ -f "$BACKEND_DIR/prisma/schema.prisma" ]; then
    # Cerca modello Message o Chat
    if grep -q "model Message\|model Chat" "$BACKEND_DIR/prisma/schema.prisma"; then
        check_pass "Modello Message/Chat presente nel database"
    else
        check_warn "Modello Message/Chat non trovato nello schema"
    fi
    
    # Cerca modello Conversation
    if grep -q "model Conversation" "$BACKEND_DIR/prisma/schema.prisma"; then
        check_pass "Modello Conversation presente"
    else
        check_warn "Modello Conversation non trovato"
    fi
fi

echo ""

# 5. Test connessione WebSocket
echo "🌐 TEST CONNESSIONE WEBSOCKET"
echo "-----------------------------"

# Verifica se il backend è attivo
if curl -s http://localhost:3200/health > /dev/null 2>&1; then
    check_pass "Backend attivo"
    
    # Test WebSocket endpoint (di solito sulla stessa porta)
    if timeout 2 curl -s http://localhost:3200/socket.io/ > /dev/null 2>&1; then
        check_pass "Socket.io endpoint raggiungibile"
    else
        check_warn "Socket.io endpoint non raggiungibile"
    fi
else
    check_warn "Backend non attivo - impossibile testare WebSocket"
fi

echo ""

# 6. Verifica Redis per sessioni chat
echo "💾 VERIFICA REDIS PER CHAT"
echo "--------------------------"

if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        # Conta chiavi socket.io
        SOCKET_KEYS=$(redis-cli --scan --pattern "socket.io:*" 2>/dev/null | wc -l | tr -d ' ')
        
        if [ "$SOCKET_KEYS" -gt 0 ]; then
            check_pass "Sessioni Socket.io in Redis: $SOCKET_KEYS"
        else
            echo "   Nessuna sessione Socket.io attiva"
        fi
        
        # Conta chiavi chat
        CHAT_KEYS=$(redis-cli --scan --pattern "chat:*" 2>/dev/null | wc -l | tr -d ' ')
        if [ "$CHAT_KEYS" -gt 0 ]; then
            echo "   Dati chat in cache: $CHAT_KEYS"
        fi
    else
        check_warn "Redis non attivo"
    fi
else
    check_warn "Redis non disponibile"
fi

echo ""

# 7. Verifica servizi chat
echo "🔧 VERIFICA SERVIZI CHAT"
echo "------------------------"

if [ -f "$BACKEND_DIR/src/services/chat.service.ts" ] || [ -f "$BACKEND_DIR/src/services/message.service.ts" ]; then
    check_pass "Chat/Message service presente"
else
    check_warn "Chat service non trovato"
fi

if [ -f "$BACKEND_DIR/src/routes/chat.routes.ts" ] || [ -f "$BACKEND_DIR/src/routes/message.routes.ts" ]; then
    check_pass "Chat routes configurate"
else
    check_warn "Chat routes non trovate"
fi

echo ""

# 8. Statistiche chat
echo "📊 STATISTICHE CHAT"
echo "-------------------"

LOG_DIR="$PROJECT_DIR/logs"

if [ -d "$LOG_DIR" ]; then
    TODAY=$(date +%Y-%m-%d)
    
    # Conta messaggi inviati oggi
    MSG_TODAY=$(grep -h "message.*sent\|chat.*message" "$LOG_DIR"/*.log 2>/dev/null | grep "$TODAY" | wc -l | tr -d ' ')
    if [ "$MSG_TODAY" -gt 0 ]; then
        echo "   Messaggi oggi: $MSG_TODAY"
        check_pass "Sistema chat attivo oggi"
    else
        echo "   Nessun messaggio registrato oggi"
    fi
    
    # Conta connessioni WebSocket
    WS_CONN=$(grep -h "socket.*connect\|websocket.*connect" "$LOG_DIR"/*.log 2>/dev/null | grep "$TODAY" | wc -l | tr -d ' ')
    if [ "$WS_CONN" -gt 0 ]; then
        echo "   Connessioni WebSocket oggi: $WS_CONN"
    fi
else
    echo "   Directory log non trovata"
fi

echo ""

# 9. Summary e raccomandazioni
echo "📊 RIEPILOGO"
echo "============"
echo ""
echo "Controlli eseguiti: $CHECKS"
echo -e "${GREEN}✅ Passati: $((CHECKS - WARNINGS - ERRORS))${NC}"
echo -e "${YELLOW}⚠️  Warning: $WARNINGS${NC}"
echo -e "${RED}❌ Errori: $ERRORS${NC}"
echo ""

# Calcola health score
SCORE=$((100 - (ERRORS * 20) - (WARNINGS * 5)))
if [ $SCORE -lt 0 ]; then
    SCORE=0
fi

echo "🏥 Health Score: $SCORE/100"
echo ""

# Raccomandazioni
if [ $ERRORS -gt 0 ] || [ $WARNINGS -gt 0 ]; then
    echo "📋 RACCOMANDAZIONI"
    echo "=================="
    
    if [ $ERRORS -gt 0 ]; then
        echo -e "${RED}CRITICHE (da risolvere subito):${NC}"
        echo "  - Installare Socket.io"
        echo "  - Creare directory websocket"
        echo "  - Configurare WebSocket server"
        echo ""
    fi
    
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}MIGLIORAMENTI CONSIGLIATI:${NC}"
        echo "  - Installare Socket.io client nel frontend"
        echo "  - Configurare modelli database per chat"
        echo "  - Implementare servizi chat"
        echo "  - Configurare Redis per sessioni"
    fi
fi

echo ""
echo "✅ Chat System Check completato!"

exit 0
