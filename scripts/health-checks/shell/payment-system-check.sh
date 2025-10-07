#!/bin/bash

# Payment System Health Check
# Verifica completa del sistema di pagamenti

echo "💳 PAYMENT SYSTEM CHECK"
echo "======================="
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

# 1. Verifica configurazione Stripe
echo "💳 VERIFICA CONFIGURAZIONE STRIPE"
echo "---------------------------------"

if [ -f "$PROJECT_DIR/.env" ]; then
    # Stripe Secret Key
    if grep -q "STRIPE_SECRET_KEY" "$PROJECT_DIR/.env"; then
        check_pass "Stripe Secret Key configurata"
        
        # Verifica se è test o live
        KEY=$(grep "STRIPE_SECRET_KEY" "$PROJECT_DIR/.env" | cut -d'=' -f2 | tr -d '"' | tr -d "'")
        if [[ "$KEY" == sk_test_* ]]; then
            check_pass "Modalità TEST attiva (sicuro per sviluppo)"
        elif [[ "$KEY" == sk_live_* ]]; then
            check_warn "⚠️ Modalità LIVE attiva - Attenzione!"
        else
            check_warn "Formato chiave Stripe non riconosciuto"
        fi
    else
        check_fail "STRIPE_SECRET_KEY non configurata"
    fi
    
    # Stripe Publishable Key
    if grep -q "STRIPE_PUBLISHABLE_KEY" "$PROJECT_DIR/.env"; then
        check_pass "Stripe Publishable Key configurata"
    else
        check_warn "STRIPE_PUBLISHABLE_KEY non configurata"
    fi
    
    # Webhook Secret
    if grep -q "STRIPE_WEBHOOK_SECRET" "$PROJECT_DIR/.env"; then
        check_pass "Stripe Webhook Secret configurato"
    else
        check_warn "Webhook Secret non configurato"
        echo "   I webhook non funzioneranno senza questo"
    fi
else
    check_fail "File .env non trovato"
fi

echo ""

# 2. Verifica dipendenze Stripe
echo "📦 VERIFICA DIPENDENZE STRIPE"
echo "-----------------------------"

if [ -f "$BACKEND_DIR/package.json" ]; then
    if grep -q '"stripe"' "$BACKEND_DIR/package.json"; then
        check_pass "Stripe SDK installato"
        
        # Verifica versione
        VERSION=$(grep '"stripe"' "$BACKEND_DIR/package.json" | sed 's/.*"stripe".*"\([^"]*\)".*/\1/')
        echo "   Versione Stripe: $VERSION"
    else
        check_fail "Stripe SDK non installato"
        echo "   Esegui: cd backend && npm install stripe"
    fi
fi

echo ""

# 3. Verifica servizi pagamento
echo "🔧 VERIFICA SERVIZI PAGAMENTO"
echo "-----------------------------"

if [ -f "$BACKEND_DIR/src/services/payment.service.ts" ] || [ -f "$BACKEND_DIR/src/services/stripe.service.ts" ]; then
    check_pass "Payment service presente"
else
    check_fail "Payment service MANCANTE"
fi

if [ -f "$BACKEND_DIR/src/routes/payment.routes.ts" ] || [ -f "$BACKEND_DIR/src/routes/stripe.routes.ts" ]; then
    check_pass "Payment routes configurate"
else
    check_warn "Payment routes non trovate"
fi

# Verifica webhook handler
if [ -f "$BACKEND_DIR/src/routes/webhook.routes.ts" ] || grep -r "stripe.*webhook" "$BACKEND_DIR/src/routes/" 2>/dev/null | grep -q "webhook"; then
    check_pass "Webhook handler presente"
else
    check_warn "Webhook handler non trovato"
fi

echo ""

# 4. Verifica database pagamenti
echo "🗄️ VERIFICA DATABASE PAGAMENTI"
echo "------------------------------"

if [ -f "$BACKEND_DIR/prisma/schema.prisma" ]; then
    # Cerca modello Payment
    if grep -q "model Payment" "$BACKEND_DIR/prisma/schema.prisma"; then
        check_pass "Modello Payment presente nel database"
    else
        check_warn "Modello Payment non trovato nello schema"
    fi
    
    # Cerca modello Transaction
    if grep -q "model Transaction" "$BACKEND_DIR/prisma/schema.prisma"; then
        check_pass "Modello Transaction presente"
    else
        check_warn "Modello Transaction non trovato"
    fi
    
    # Cerca modello Invoice
    if grep -q "model Invoice" "$BACKEND_DIR/prisma/schema.prisma"; then
        check_pass "Modello Invoice presente"
    else
        echo "   Modello Invoice non presente (opzionale)"
    fi
fi

echo ""

# 5. Test endpoint pagamenti
echo "🌐 TEST ENDPOINT PAGAMENTI"
echo "--------------------------"

if curl -s http://localhost:3200/health > /dev/null 2>&1; then
    check_pass "Backend attivo"
    
    # Test payment health endpoint
    if curl -s http://localhost:3200/api/payment/health > /dev/null 2>&1; then
        check_pass "Endpoint payment health raggiungibile"
    else
        echo "   Endpoint payment health non disponibile"
    fi
    
    # Test webhook endpoint
    if curl -s -X POST http://localhost:3200/api/webhook/stripe > /dev/null 2>&1; then
        echo "   Webhook endpoint risponde"
    else
        echo "   Webhook endpoint non raggiungibile"
    fi
else
    check_warn "Backend non attivo - impossibile testare endpoint"
fi

echo ""

# 6. Verifica configurazione sicurezza
echo "🔒 VERIFICA SICUREZZA PAGAMENTI"
echo "-------------------------------"

# PCI Compliance checks
if [ -f "$BACKEND_DIR/src/services/payment.service.ts" ]; then
    # Verifica che non ci siano log di carte di credito
    if grep -q "card_number\|cardNumber\|ccnum" "$BACKEND_DIR/src/services/payment.service.ts" 2>/dev/null; then
        check_fail "⚠️ Possibile logging di dati sensibili rilevato!"
    else
        check_pass "Nessun logging di dati carte rilevato"
    fi
fi

# HTTPS check
if [ -f "$PROJECT_DIR/.env" ]; then
    if grep -q "FORCE_HTTPS\|SECURE_COOKIES" "$PROJECT_DIR/.env"; then
        check_pass "HTTPS/Secure cookies configurato"
    else
        check_warn "HTTPS non forzato in produzione"
    fi
fi

echo ""

# 7. Statistiche pagamenti
echo "📊 STATISTICHE PAGAMENTI"
echo "------------------------"

LOG_DIR="$PROJECT_DIR/logs"

if [ -d "$LOG_DIR" ]; then
    TODAY=$(date +%Y-%m-%d)
    
    # Conta transazioni oggi
    TRANS_TODAY=$(grep -h "payment.*success\|transaction.*complete" "$LOG_DIR"/*.log 2>/dev/null | grep "$TODAY" | wc -l | tr -d ' ')
    if [ "$TRANS_TODAY" -gt 0 ]; then
        echo "   Transazioni oggi: $TRANS_TODAY"
        check_pass "Sistema pagamenti attivo oggi"
    else
        echo "   Nessuna transazione registrata oggi"
    fi
    
    # Cerca errori pagamento
    PAY_ERRORS=$(grep -h "payment.*error\|stripe.*failed" "$LOG_DIR"/*.log 2>/dev/null | grep "$TODAY" | wc -l | tr -d ' ')
    if [ "$PAY_ERRORS" -gt 0 ]; then
        check_warn "Trovati $PAY_ERRORS errori pagamento oggi"
    fi
else
    echo "   Directory log non trovata"
fi

echo ""

# 8. Verifica backup transazioni
echo "💾 VERIFICA BACKUP TRANSAZIONI"
echo "------------------------------"

BACKUP_DIR="$PROJECT_DIR/database-backups"

if [ -d "$BACKUP_DIR" ]; then
    # Cerca backup recenti con dati pagamenti
    PAYMENT_BACKUPS=$(find "$BACKUP_DIR" -name "*payment*" -o -name "*transaction*" 2>/dev/null | wc -l | tr -d ' ')
    
    if [ "$PAYMENT_BACKUPS" -gt 0 ]; then
        check_pass "Backup transazioni presenti: $PAYMENT_BACKUPS"
    else
        check_warn "Nessun backup specifico per transazioni"
    fi
else
    check_warn "Directory backup non trovata"
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
        echo "  - Configurare STRIPE_SECRET_KEY"
        echo "  - Installare Stripe SDK"
        echo "  - Creare payment service"
        echo "  - Rimuovere logging dati sensibili"
        echo ""
    fi
    
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}MIGLIORAMENTI CONSIGLIATI:${NC}"
        echo "  - Configurare webhook secret"
        echo "  - Implementare modelli database pagamenti"
        echo "  - Forzare HTTPS in produzione"
        echo "  - Configurare backup automatici transazioni"
        echo "  - Usare sempre modalità TEST in sviluppo"
    fi
fi

echo ""
echo "✅ Payment System Check completato!"

exit 0
