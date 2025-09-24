#!/bin/bash

# ===========================================
# WhatsApp Test Suite - Shell Script Version
# Sistema Richiesta Assistenza
# ===========================================

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Configurazione
API_BASE="http://localhost:3200/api"
FRONTEND_URL="http://localhost:5193"
TOKEN=""

# Banner iniziale
show_banner() {
    clear
    echo "==========================================="
    echo -e "${CYAN}${BOLD}   📱 WHATSAPP TEST SUITE v1.0${NC}"
    echo -e "${CYAN}   Sistema Richiesta Assistenza${NC}"
    echo "==========================================="
    echo
}

# Verifica che il backend sia attivo
check_backend() {
    echo -e "${YELLOW}🔍 Verifica backend...${NC}"
    
    if curl -s -o /dev/null -w "%{http_code}" "${API_BASE}/health" | grep -q "200"; then
        echo -e "${GREEN}✅ Backend attivo su porta 3200${NC}"
        return 0
    else
        echo -e "${RED}❌ Backend non raggiungibile!${NC}"
        echo "Avvia il backend con: cd backend && npm run dev"
        exit 1
    fi
}

# Login al sistema
do_login() {
    echo -e "\n${CYAN}🔐 Login al sistema...${NC}"
    
    # Prima prova con credenziali default
    RESPONSE=$(curl -s -X POST "${API_BASE}/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@test.com","password":"Admin123!@#"}')
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
        echo -e "${GREEN}✅ Login riuscito!${NC}"
        return 0
    else
        echo -e "${YELLOW}Credenziali default non valide${NC}"
        read -p "Email: " EMAIL
        read -s -p "Password: " PASSWORD
        echo
        
        RESPONSE=$(curl -s -X POST "${API_BASE}/auth/login" \
            -H "Content-Type: application/json" \
            -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
        
        if echo "$RESPONSE" | grep -q '"success":true'; then
            TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
            echo -e "${GREEN}✅ Login riuscito!${NC}"
            return 0
        else
            echo -e "${RED}❌ Login fallito!${NC}"
            exit 1
        fi
    fi
}

# Verifica stato WhatsApp
check_status() {
    echo -e "\n${BOLD}========== STATO WHATSAPP ==========${NC}"
    
    RESPONSE=$(curl -s -X GET "${API_BASE}/whatsapp/status" \
        -H "Authorization: Bearer $TOKEN")
    
    if echo "$RESPONSE" | grep -q '"connected":true'; then
        echo -e "${GREEN}✅ WhatsApp CONNESSO${NC}"
    else
        echo -e "${RED}❌ WhatsApp NON CONNESSO${NC}"
        echo -e "${YELLOW}Vai su ${FRONTEND_URL}/admin/whatsapp per il QR code${NC}"
    fi
    
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
}

# Inizializza WhatsApp
initialize_whatsapp() {
    echo -e "\n${CYAN}🚀 Inizializzazione WhatsApp...${NC}"
    
    RESPONSE=$(curl -s -X POST "${API_BASE}/whatsapp/initialize" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json")
    
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    
    if echo "$RESPONSE" | grep -q '"qrCode"'; then
        echo -e "\n${YELLOW}📱 QR CODE DISPONIBILE!${NC}"
        echo "1. Apri WhatsApp sul telefono"
        echo "2. Vai su Impostazioni > Dispositivi collegati"
        echo "3. Clicca su 'Collega un dispositivo'"
        echo -e "4. Scansiona il QR su ${BLUE}${FRONTEND_URL}/admin/whatsapp${NC}"
        echo
        read -p "Premi ENTER quando hai scansionato il QR..."
    fi
}

# Invia messaggio
send_message() {
    echo -e "\n${BOLD}========== INVIO MESSAGGIO ==========${NC}"
    
    read -p "Numero telefono (es: 393351234567): " PHONE
    read -p "Messaggio: " MESSAGE
    
    echo -e "\n${CYAN}📤 Invio in corso...${NC}"
    
    RESPONSE=$(curl -s -X POST "${API_BASE}/whatsapp/send" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"phoneNumber\":\"$PHONE\",\"message\":\"$MESSAGE\"}")
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Messaggio inviato con successo!${NC}"
    else
        echo -e "${RED}❌ Errore invio messaggio${NC}"
    fi
    
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
}

# Mostra messaggi recenti
show_messages() {
    echo -e "\n${BOLD}========== MESSAGGI RECENTI ==========${NC}"
    
    RESPONSE=$(curl -s -X GET "${API_BASE}/whatsapp/messages?limit=5" \
        -H "Authorization: Bearer $TOKEN")
    
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
}

# Mostra statistiche
show_stats() {
    echo -e "\n${BOLD}========== STATISTICHE ==========${NC}"
    
    RESPONSE=$(curl -s -X GET "${API_BASE}/whatsapp/stats" \
        -H "Authorization: Bearer $TOKEN")
    
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
}

# Test invio multiplo
bulk_send() {
    echo -e "\n${BOLD}========== TEST INVIO MULTIPLO ==========${NC}"
    
    read -p "Numero telefono: " PHONE
    
    MESSAGES=(
        "🧪 Test 1: Primo messaggio di prova"
        "🔧 Test 2: Secondo messaggio"
        "✅ Test 3: Terzo e ultimo messaggio"
    )
    
    for i in "${!MESSAGES[@]}"; do
        echo -e "\n${CYAN}📤 Invio messaggio $((i+1))/3...${NC}"
        
        curl -s -X POST "${API_BASE}/whatsapp/send" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "{\"phoneNumber\":\"$PHONE\",\"message\":\"${MESSAGES[$i]}\"}" > /dev/null
        
        echo -e "${GREEN}✅ Messaggio $((i+1)) inviato${NC}"
        sleep 2
    done
}

# Test completo
complete_test() {
    echo -e "\n${CYAN}${BOLD}🚀 ESECUZIONE TEST COMPLETO${NC}"
    
    check_status
    
    echo -e "\n${YELLOW}Premi ENTER per continuare...${NC}"
    read
    
    show_stats
    
    echo -e "\n${YELLOW}Premi ENTER per continuare...${NC}"
    read
    
    show_messages
    
    read -p "Vuoi testare l'invio di un messaggio? (s/n): " CHOICE
    if [[ "$CHOICE" == "s" ]]; then
        send_message
    fi
}

# Menu principale
show_menu() {
    echo
    echo "========================================="
    echo -e "${BOLD}       MENU PRINCIPALE${NC}"
    echo "========================================="
    echo "1. Verifica stato connessione"
    echo "2. Inizializza/Connetti WhatsApp"
    echo "3. Invia messaggio singolo"
    echo "4. Visualizza messaggi recenti"
    echo "5. Mostra statistiche"
    echo "6. Test invio multiplo"
    echo "7. Test completo"
    echo "0. Esci"
    echo "========================================="
    echo
    read -p "Scegli opzione: " CHOICE
    
    case $CHOICE in
        1)
            check_status
            ;;
        2)
            initialize_whatsapp
            ;;
        3)
            send_message
            ;;
        4)
            show_messages
            ;;
        5)
            show_stats
            ;;
        6)
            bulk_send
            ;;
        7)
            complete_test
            ;;
        0)
            echo -e "\n${YELLOW}👋 Arrivederci!${NC}\n"
            exit 0
            ;;
        *)
            echo -e "${RED}Opzione non valida${NC}"
            ;;
    esac
    
    show_menu
}

# Main
main() {
    show_banner
    check_backend
    do_login
    show_menu
}

# Gestione interruzione
trap 'echo -e "\n${YELLOW}👋 Chiusura...${NC}"; exit 0' INT

# Avvia il programma
main
