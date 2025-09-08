#!/bin/bash

# Authentication System Health Check
# Verifica completa del sistema di autenticazione

echo "🔐 AUTH SYSTEM CHECK"
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
PROJECT_DIR="$(pwd)"
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

# 1. Verifica file di autenticazione
echo "📂 VERIFICA FILE SISTEMA AUTENTICAZIONE"
echo "----------------------------------------"

if [ -f "$BACKEND_DIR/src/middleware/auth.ts" ]; then
    check_pass "Middleware auth.ts presente"
else
    check_fail "Middleware auth.ts MANCANTE"
fi

if [ -f "$BACKEND_DIR/src/services/auth.service.ts" ]; then
    check_pass "Service auth.service.ts presente"
else
    check_fail "Service auth.service.ts MANCANTE"
fi

if [ -f "$BACKEND_DIR/src/routes/auth.routes.ts" ]; then
    check_pass "Routes auth.routes.ts presente"
else
    check_fail "Routes auth.routes.ts MANCANTE"
fi

echo ""

# 2. Verifica configurazione JWT
echo "🔑 VERIFICA CONFIGURAZIONE JWT"
echo "-------------------------------"

if [ -f "$PROJECT_DIR/.env" ]; then
    if grep -q "JWT_SECRET" "$PROJECT_DIR/.env"; then
        JWT_SECRET_LENGTH=$(grep "JWT_SECRET" "$PROJECT_DIR/.env" | cut -d'=' -f2 | tr -d '"' | wc -c)
        if [ $JWT_SECRET_LENGTH -gt 32 ]; then
            check_pass "JWT_SECRET configurato (lunghezza: $JWT_SECRET_LENGTH caratteri)"
        else
            check_warn "JWT_SECRET troppo corto (minimo 32 caratteri, attuale: $JWT_SECRET_LENGTH)"
        fi
    else
        check_fail "JWT_SECRET non trovato in .env"
    fi
    
    if grep -q "JWT_EXPIRE" "$PROJECT_DIR/.env"; then
        check_pass "JWT_EXPIRE configurato"
    else
        check_warn "JWT_EXPIRE non configurato (usando default)"
    fi
else
    check_fail "File .env non trovato"
fi

echo ""

# 3. Verifica 2FA
echo "🔐 VERIFICA SISTEMA 2FA"
echo "-----------------------"

# Verifica se speakeasy è installato
if [ -f "$BACKEND_DIR/package.json" ]; then
    if grep -q "speakeasy" "$BACKEND_DIR/package.json"; then
        check_pass "Speakeasy (2FA) installato"
    else
        check_warn "Speakeasy non installato - 2FA non disponibile"
    fi
    
    if grep -q "qrcode" "$BACKEND_DIR/package.json"; then
        check_pass "QRCode library installata"
    else
        check_warn "QRCode library non installata"
    fi
fi

echo ""

# 4. Verifica Database Utenti
echo "📊 VERIFICA DATABASE UTENTI"
echo "---------------------------"

# Controlla se il database è raggiungibile
cd "$BACKEND_DIR"
if npx prisma db pull --print 2>/dev/null | grep -q "User"; then
    check_pass "Tabella User presente nel database"
    
    # Conta utenti
    USER_COUNT=$(npx ts-node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        prisma.user.count().then(c => console.log(c)).finally(() => prisma.\$disconnect());
    " 2>/dev/null)
    
    if [ -n "$USER_COUNT" ] && [ "$USER_COUNT" -gt 0 ]; then
        check_pass "Utenti nel database: $USER_COUNT"
    else
        check_warn "Nessun utente nel database"
    fi
else
    check_fail "Impossibile connettersi al database o tabella User mancante"
fi

cd "$PROJECT_DIR"
echo ""

# 5. Verifica Rate Limiting
echo "⏱️ VERIFICA RATE LIMITING"
echo "-------------------------"

if [ -f "$BACKEND_DIR/package.json" ]; then
    if grep -q "express-rate-limit" "$BACKEND_DIR/package.json"; then
        check_pass "Express rate limit installato"
    else
        check_warn "Express rate limit non installato - sistema vulnerabile a brute force"
    fi
fi

if [ -f "$BACKEND_DIR/src/middleware/rateLimit.ts" ]; then
    check_pass "Middleware rate limit configurato"
else
    check_warn "Middleware rate limit non trovato"
fi

echo ""

# 6. Verifica Session Management
echo "🔄 VERIFICA GESTIONE SESSIONI"
echo "-----------------------------"

if [ -f "$PROJECT_DIR/.env" ]; then
    if grep -q "SESSION_SECRET" "$PROJECT_DIR/.env"; then
        check_pass "SESSION_SECRET configurato"
    else
        check_warn "SESSION_SECRET non configurato"
    fi
fi

# Verifica Redis per sessioni
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        check_pass "Redis attivo per gestione sessioni"
        SESSION_COUNT=$(redis-cli --scan --pattern "sess:*" | wc -l 2>/dev/null)
        echo "   Sessioni attive: $SESSION_COUNT"
    else
        check_warn "Redis non attivo - usando memoria per sessioni"
    fi
else
    check_warn "Redis non installato"
fi

echo ""

# 7. Test endpoint autenticazione
echo "🌐 TEST ENDPOINT AUTENTICAZIONE"
echo "--------------------------------"

# Verifica se il backend è attivo
if curl -s http://localhost:3200/health > /dev/null 2>&1; then
    check_pass "Backend attivo su porta 3200"
    
    # Test endpoint login
    if curl -s http://localhost:3200/api/auth/login -X POST > /dev/null 2>&1; then
        check_pass "Endpoint /api/auth/login raggiungibile"
    else
        check_warn "Endpoint /api/auth/login non raggiungibile"
    fi
    
    # Test endpoint register
    if curl -s http://localhost:3200/api/auth/register -X POST > /dev/null 2>&1; then
        check_pass "Endpoint /api/auth/register raggiungibile"
    else
        check_warn "Endpoint /api/auth/register non raggiungibile"
    fi
else
    check_warn "Backend non attivo - impossibile testare endpoint"
fi

echo ""

# 8. Verifica sicurezza password
echo "🔒 VERIFICA SICUREZZA PASSWORD"
echo "-------------------------------"

if [ -f "$BACKEND_DIR/package.json" ]; then
    if grep -q "bcrypt" "$BACKEND_DIR/package.json"; then
        check_pass "Bcrypt installato per hashing password"
    else
        check_fail "Bcrypt non installato - password non sicure!"
    fi
    
    if grep -q "zxcvbn" "$BACKEND_DIR/package.json"; then
        check_pass "Password strength checker installato"
    else
        check_warn "Password strength checker non installato"
    fi
fi

echo ""

# 9. Verifica CORS
echo "🌐 VERIFICA CONFIGURAZIONE CORS"
echo "--------------------------------"

if [ -f "$BACKEND_DIR/src/server.ts" ]; then
    if grep -q "cors" "$BACKEND_DIR/src/server.ts"; then
        check_pass "CORS configurato nel server"
    else
        check_warn "CORS non configurato - possibili problemi cross-origin"
    fi
fi

echo ""

# 10. Summary e raccomandazioni
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
        [ ! -f "$BACKEND_DIR/src/middleware/auth.ts" ] && echo "  - Creare middleware di autenticazione"
        [ ! -f "$PROJECT_DIR/.env" ] && echo "  - Creare file .env con configurazioni"
        echo ""
    fi
    
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}MIGLIORAMENTI CONSIGLIATI:${NC}"
        echo "  - Installare express-rate-limit per protezione brute force"
        echo "  - Configurare 2FA con Speakeasy"
        echo "  - Aumentare lunghezza JWT_SECRET a minimo 32 caratteri"
        echo "  - Configurare Redis per gestione sessioni scalabile"
    fi
fi

echo ""
echo "✅ Auth System Check completato!"

exit $ERRORS
