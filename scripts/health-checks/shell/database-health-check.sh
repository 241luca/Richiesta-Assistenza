#!/bin/bash

# Database Health Check
# Verifica completa del database PostgreSQL

echo "📊 DATABASE HEALTH CHECK"
echo "========================"
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

# 1. Verifica file .env e DATABASE_URL
echo "🔧 VERIFICA CONFIGURAZIONE"
echo "--------------------------"

if [ -f "$PROJECT_DIR/.env" ]; then
    check_pass "File .env presente"
    
    if grep -q "DATABASE_URL" "$PROJECT_DIR/.env"; then
        check_pass "DATABASE_URL configurato"
        
        # Estrai informazioni database (senza mostrare password)
        DB_URL=$(grep "DATABASE_URL" "$PROJECT_DIR/.env" | cut -d'=' -f2-)
        if echo "$DB_URL" | grep -q "postgresql://"; then
            DB_NAME=$(echo "$DB_URL" | sed 's/.*\///' | cut -d'?' -f1)
            echo "   Database: $DB_NAME"
        fi
    else
        check_fail "DATABASE_URL non trovato in .env"
    fi
else
    check_fail "File .env non trovato"
fi

echo ""

# 2. Test connessione database con Prisma
echo "🗄️ TEST CONNESSIONE DATABASE"
echo "----------------------------"

cd "$BACKEND_DIR" 2>/dev/null
if [ $? -eq 0 ]; then
    # Test con prisma db pull (non modifica nulla, solo verifica connessione)
    echo "   Testing connection..."
    
    # Usa timeout per evitare hang infiniti
    timeout 10 npx prisma db pull --print 2>&1 | head -5 > /tmp/db_test_$$.txt
    
    if grep -q "model" /tmp/db_test_$$.txt 2>/dev/null; then
        check_pass "Connessione al database OK"
    elif grep -q "P1001" /tmp/db_test_$$.txt 2>/dev/null; then
        check_fail "Database non raggiungibile (connection refused)"
    elif grep -q "P1000" /tmp/db_test_$$.txt 2>/dev/null; then
        check_fail "Credenziali database errate"
    else
        check_warn "Stato connessione incerto"
    fi
    
    rm -f /tmp/db_test_$$.txt
    cd "$PROJECT_DIR"
else
    check_fail "Directory backend non trovata"
fi

echo ""

# 3. Verifica Prisma Client
echo "📦 VERIFICA PRISMA CLIENT"
echo "-------------------------"

if [ -d "$BACKEND_DIR/node_modules/@prisma/client" ]; then
    check_pass "Prisma Client installato"
else
    check_fail "Prisma Client non installato"
    echo "   Esegui: cd backend && npx prisma generate"
fi

if [ -f "$BACKEND_DIR/prisma/schema.prisma" ]; then
    check_pass "Schema Prisma presente"
    
    # Conta modelli nello schema
    MODEL_COUNT=$(grep "^model " "$BACKEND_DIR/prisma/schema.prisma" 2>/dev/null | wc -l | tr -d ' ')
    echo "   Modelli definiti: $MODEL_COUNT"
else
    check_fail "Schema Prisma non trovato"
fi

echo ""

# 4. Verifica migrazioni
echo "🔄 VERIFICA MIGRAZIONI"
echo "----------------------"

MIGRATIONS_DIR="$BACKEND_DIR/prisma/migrations"

if [ -d "$MIGRATIONS_DIR" ]; then
    # Conta migrazioni
    MIGRATION_COUNT=$(find "$MIGRATIONS_DIR" -type d -name "2*" 2>/dev/null | wc -l | tr -d ' ')
    
    if [ "$MIGRATION_COUNT" -gt 0 ]; then
        check_pass "$MIGRATION_COUNT migrazioni trovate"
        
        # Trova ultima migrazione
        LATEST_MIGRATION=$(ls -1 "$MIGRATIONS_DIR" | grep "^2" | tail -1)
        if [ -n "$LATEST_MIGRATION" ]; then
            echo "   Ultima: $LATEST_MIGRATION"
        fi
    else
        check_warn "Nessuna migrazione trovata"
        echo "   Database potrebbe non essere sincronizzato"
    fi
else
    check_warn "Directory migrazioni non trovata"
    echo "   Usa: npx prisma migrate dev"
fi

echo ""

# 5. Test query veloce (se possibile)
echo "⚡ TEST PERFORMANCE"
echo "-------------------"

cd "$BACKEND_DIR" 2>/dev/null
if [ $? -eq 0 ]; then
    # Crea script Node.js temporaneo per test query
    cat > /tmp/db_perf_test_$$.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    const start = Date.now();
    try {
        // Query semplice per test
        await prisma.$queryRaw`SELECT 1`;
        const time = Date.now() - start;
        console.log(`QUERY_TIME:${time}`);
        
        // Conta utenti
        const userCount = await prisma.user.count().catch(() => 0);
        console.log(`USER_COUNT:${userCount}`);
        
    } catch (error) {
        console.log(`ERROR:${error.code || 'UNKNOWN'}`);
    } finally {
        await prisma.$disconnect();
    }
}
test();
EOF

    # Esegui test
    RESULT=$(timeout 5 node /tmp/db_perf_test_$$.js 2>/dev/null)
    
    # Analizza risultato
    QUERY_TIME=$(echo "$RESULT" | grep "QUERY_TIME:" | cut -d':' -f2)
    USER_COUNT=$(echo "$RESULT" | grep "USER_COUNT:" | cut -d':' -f2)
    DB_ERROR=$(echo "$RESULT" | grep "ERROR:" | cut -d':' -f2)
    
    if [ -n "$QUERY_TIME" ]; then
        echo "   Tempo query: ${QUERY_TIME}ms"
        
        if [ "$QUERY_TIME" -lt 100 ]; then
            check_pass "Performance ottima (<100ms)"
        elif [ "$QUERY_TIME" -lt 500 ]; then
            check_warn "Performance accettabile (${QUERY_TIME}ms)"
        else
            check_fail "Performance lenta (${QUERY_TIME}ms)"
        fi
        
        if [ -n "$USER_COUNT" ]; then
            echo "   Utenti nel database: $USER_COUNT"
        fi
    elif [ -n "$DB_ERROR" ]; then
        check_fail "Errore query: $DB_ERROR"
    else
        check_warn "Test performance non completato"
    fi
    
    rm -f /tmp/db_perf_test_$$.js
    cd "$PROJECT_DIR"
fi

echo ""

# 6. Verifica connection pool e configurazione
echo "⚙️ CONFIGURAZIONE AVANZATA"
echo "--------------------------"

if [ -f "$PROJECT_DIR/.env" ]; then
    # Controlla se ci sono parametri di connection pool
    if grep -q "connection_limit" "$PROJECT_DIR/.env" 2>/dev/null; then
        CONN_LIMIT=$(grep "connection_limit" "$PROJECT_DIR/.env" | cut -d'=' -f2)
        echo "   Connection limit: $CONN_LIMIT"
        check_pass "Connection pool configurato"
    else
        check_warn "Connection pool non configurato (usando default)"
        echo "   Considera di aggiungere ?connection_limit=20 al DATABASE_URL"
    fi
fi

echo ""

# 7. Controllo processi PostgreSQL (se locale)
echo "🔍 PROCESSI DATABASE"
echo "--------------------"

# Verifica se PostgreSQL è in esecuzione localmente
if pgrep -x "postgres" > /dev/null 2>&1; then
    check_pass "PostgreSQL in esecuzione (locale)"
    
    # Conta connessioni attive (se possibile)
    CONN_COUNT=$(ps aux | grep postgres | grep -v grep | wc -l | tr -d ' ')
    echo "   Processi PostgreSQL attivi: $CONN_COUNT"
else
    echo "   PostgreSQL non rilevato localmente (potrebbe essere remoto)"
fi

echo ""

# 8. Summary e raccomandazioni
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
        [ ! -f "$PROJECT_DIR/.env" ] && echo "  - Creare file .env con DATABASE_URL"
        echo "  - Verificare che il database sia in esecuzione"
        echo "  - Controllare credenziali di accesso"
        echo ""
    fi
    
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}MIGLIORAMENTI CONSIGLIATI:${NC}"
        echo "  - Configurare connection pool"
        echo "  - Eseguire migrazioni pendenti"
        echo "  - Ottimizzare query lente"
        echo "  - Implementare monitoring database"
    fi
fi

echo ""
echo "✅ Database Health Check completato!"

# Exit sempre con 0 per non causare errori nel backend
exit 0
