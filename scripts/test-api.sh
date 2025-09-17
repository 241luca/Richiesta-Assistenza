#!/bin/bash

# ===============================================
# 🔌 TEST API - RICHIESTA ASSISTENZA
# ===============================================
# Test di tutte le API del sistema
# ===============================================

set -e

# Configurazione
API_BASE="http://localhost:3200/api"
TOKEN=""  # Verrà popolato dopo il login

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Contatori
PASSED=0
FAILED=0

# Utenti esistenti nel sistema (dalla login page)
SUPER_ADMIN_EMAIL="admin@assistenza.it"
SUPER_ADMIN_PASSWORD="password123"
CLIENT_EMAIL="luigi.bianchi@gmail.com"
CLIENT_PASSWORD="password123"

# Funzione per testare una API
test_api() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local description="$4"
    
    echo -e "\n${YELLOW}Testing:${NC} $description"
    echo "  $method $API_BASE$endpoint"
    
    local curl_cmd="curl -s -X $method"
    
    # Aggiungi header se abbiamo un token
    if [ ! -z "$TOKEN" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $TOKEN'"
    fi
    
    # Aggiungi Content-Type per POST/PUT
    if [ "$method" = "POST" ] || [ "$method" = "PUT" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json'"
    fi
    
    # Aggiungi dati se presenti
    if [ ! -z "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi
    
    curl_cmd="$curl_cmd $API_BASE$endpoint"
    
    # Esegui il comando
    if response=$(eval "$curl_cmd" 2>/dev/null); then
        # Controlla se la risposta contiene success:false o error
        if echo "$response" | grep -q '"success":false' || echo "$response" | grep -q '"error"'; then
            echo -e "  ${RED}❌ FAILED${NC}"
            echo "  Response: $(echo $response | head -c 200)..."
            FAILED=$((FAILED + 1))
        else
            echo -e "  ${GREEN}✅ PASSED${NC}"
            PASSED=$((PASSED + 1))
            
            # Salva il token se è un login
            if [ "$endpoint" = "/auth/login" ] && echo "$response" | grep -q '"token"'; then
                TOKEN=$(echo "$response" | grep -o '"token":"[^"]*' | sed 's/"token":"//')
                echo "  Token salvato: ${TOKEN:0:20}..."
            fi
        fi
    else
        echo -e "  ${RED}❌ FAILED (Connection error)${NC}"
        FAILED=$((FAILED + 1))
    fi
}

# Header
echo "========================================"
echo "🔌 TEST SUITE API - RICHIESTA ASSISTENZA"
echo "========================================"
echo "API Base: $API_BASE"
echo "Data: $(date)"

# 1. TEST AUTENTICAZIONE
echo -e "\n${BLUE}1️⃣ TEST AUTENTICAZIONE${NC}"

# Login come Super Admin
test_api "POST" "/auth/login" "{\"email\":\"$SUPER_ADMIN_EMAIL\",\"password\":\"$SUPER_ADMIN_PASSWORD\"}" "Login Super Admin"

# 2. TEST ENDPOINT CON TOKEN
if [ ! -z "$TOKEN" ]; then
    echo -e "\n${BLUE}2️⃣ TEST ENDPOINT PROTETTI (con token)${NC}"
    
    # Test profilo utente
    test_api "GET" "/users/profile" "" "Profilo Utente Corrente"
    
    # Test lista utenti (admin only)
    test_api "GET" "/users" "" "Lista Utenti (admin)"
    
    # Test richieste
    test_api "GET" "/requests" "" "Lista Richieste"
    
    # Test categorie
    test_api "GET" "/categories" "" "Lista Categorie"
    
    # Test sottocategorie
    test_api "GET" "/subcategories" "" "Lista Sottocategorie"
    
    # Test preventivi
    test_api "GET" "/quotes" "" "Lista Preventivi"
    
    # Test notifiche
    test_api "GET" "/notifications" "" "Lista Notifiche"
    
    # Test dashboard admin
    test_api "GET" "/admin/dashboard" "" "Dashboard Admin Stats"
    
    # Test backup system
    test_api "GET" "/admin/backup/list" "" "Lista Backup"
    
    # Test health check
    test_api "GET" "/admin/health" "" "Health Check Admin"
else
    echo -e "\n${RED}⚠️ Login fallito, impossibile testare endpoint protetti${NC}"
fi

# 3. TEST LOGIN ALTRI UTENTI
echo -e "\n${BLUE}3️⃣ TEST LOGIN ALTRI RUOLI${NC}"

# Logout (reset token)
TOKEN=""

# Login come Client
test_api "POST" "/auth/login" "{\"email\":\"$CLIENT_EMAIL\",\"password\":\"$CLIENT_PASSWORD\"}" "Login Client"

if [ ! -z "$TOKEN" ]; then
    # Test endpoint come client
    test_api "GET" "/requests" "" "Lista Richieste (come Client)"
    test_api "GET" "/users/profile" "" "Profilo Client"
    
    # Questo dovrebbe fallire (solo admin)
    test_api "GET" "/users" "" "Lista Utenti (come Client - dovrebbe fallire)"
fi

# 4. TEST FILTRI E PARAMETRI
echo -e "\n${BLUE}4️⃣ TEST FILTRI E PARAMETRI${NC}"

# Re-login come admin per test completi
TOKEN=""
test_api "POST" "/auth/login" "{\"email\":\"$SUPER_ADMIN_EMAIL\",\"password\":\"$SUPER_ADMIN_PASSWORD\"}" "Re-login Admin"

if [ ! -z "$TOKEN" ]; then
    # Test con parametri
    test_api "GET" "/requests?status=PENDING" "" "Richieste PENDING"
    test_api "GET" "/requests?priority=HIGH" "" "Richieste HIGH Priority"
    test_api "GET" "/users?role=PROFESSIONAL" "" "Utenti PROFESSIONAL"
    test_api "GET" "/notifications?read=false" "" "Notifiche Non Lette"
fi

# 5. TEST ERROR HANDLING
echo -e "\n${BLUE}5️⃣ TEST ERROR HANDLING${NC}"

# Test senza token
TOKEN=""
test_api "GET" "/users" "" "Accesso senza token (dovrebbe fallire)"

# Test endpoint non esistente
test_api "GET" "/endpoint-inesistente" "" "Endpoint non esistente (404)"

# Test con dati invalidi
test_api "POST" "/auth/login" "{\"email\":\"invalidemail\",\"password\":\"123\"}" "Login con dati invalidi"

# Report finale
echo -e "\n${BLUE}========================================"
echo "📊 REPORT FINALE"
echo "========================================"
echo "Test Totali:  $((PASSED + FAILED))"
echo -e "Test Passati: ${GREEN}$PASSED${NC}"
echo -e "Test Falliti: ${RED}$FAILED${NC}"

# Calcola percentuale
if [ $((PASSED + FAILED)) -gt 0 ]; then
    PERCENT=$((PASSED * 100 / (PASSED + FAILED)))
    echo "Success Rate: $PERCENT%"
    
    if [ $PERCENT -ge 80 ]; then
        echo -e "\n${GREEN}✅ Test suite passata con successo!${NC}"
        exit 0
    elif [ $PERCENT -ge 50 ]; then
        echo -e "\n${YELLOW}⚠️ Test suite con alcuni problemi${NC}"
        exit 1
    else
        echo -e "\n${RED}❌ Test suite fallita${NC}"
        exit 1
    fi
else
    echo -e "\n${RED}❌ Nessun test eseguito${NC}"
    exit 1
fi
