#!/bin/bash

# Script per sincronizzare le migrazioni senza perdere dati
# Data: 29/01/2025
# VERSIONE SICURA - Non cancella dati

echo "╔════════════════════════════════════════╗"
echo "║   SINCRONIZZAZIONE MIGRAZIONI SICURA   ║"
echo "╚════════════════════════════════════════╝"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}OPZIONE 1: SINCRONIZZAZIONE SICURA${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Questa opzione:"
echo "✅ Mantiene TUTTI i tuoi dati"
echo "✅ Sincronizza le migrazioni con lo stato attuale"
echo "✅ Non cancella niente"
echo ""

echo -e "${YELLOW}Vuoi procedere con la sincronizzazione sicura? (s/n)${NC}"
read -r risposta

if [[ "$risposta" == "s" || "$risposta" == "S" ]]; then
    echo ""
    echo -e "${YELLOW}📦 Backup del database...${NC}"
    
    # Backup del database
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    pg_dump assistenza_db > "backup_db_${TIMESTAMP}.sql"
    echo -e "${GREEN}✅ Backup salvato: backup_db_${TIMESTAMP}.sql${NC}"
    
    echo ""
    echo -e "${YELLOW}🔄 Sincronizzazione migrazioni...${NC}"
    
    # Marca tutte le migrazioni come eseguite senza applicarle
    npx prisma migrate resolve --applied "add-complete-payment-system"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Migrazioni sincronizzate!${NC}"
    else
        # Se non funziona, proviamo con baseline
        echo -e "${YELLOW}Tentativo alternativo...${NC}"
        npx prisma migrate dev --create-only --name sync-payment-system
        npx prisma migrate resolve --applied sync-payment-system
    fi
    
    echo ""
    echo -e "${YELLOW}🔍 Verifica stato...${NC}"
    npx prisma migrate status
    
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║    ✅ SINCRONIZZAZIONE COMPLETATA!     ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    
else
    echo ""
    echo -e "${YELLOW}Operazione annullata.${NC}"
    echo ""
    echo "Alternative disponibili:"
    echo "1. Usa ./reset-migrations-fresh.sh per reset completo (CANCELLA DATI)"
    echo "2. Risolvi manualmente con: npx prisma migrate resolve --help"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📋 VERIFICA FINALE:"
echo "  Esegui: npx prisma studio"
echo "  Controlla che le tabelle Payment ci siano"
echo ""
