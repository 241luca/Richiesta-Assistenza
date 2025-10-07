#!/bin/bash

# Script ALTERNATIVO - Reset completo (CANCELLA DATI)
# Data: 29/01/2025
# ⚠️ ATTENZIONE: QUESTO CANCELLA TUTTI I DATI!

echo "╔════════════════════════════════════════╗"
echo "║   ⚠️  RESET COMPLETO DATABASE ⚠️        ║"
echo "╚════════════════════════════════════════╝"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

echo ""
echo -e "${RED}⚠️  ATTENZIONE: QUESTO SCRIPT CANCELLERÀ TUTTI I DATI! ⚠️${NC}"
echo ""
echo "Cosa fa questo script:"
echo "❌ CANCELLA tutto il database"
echo "❌ RIMUOVE tutti i dati esistenti"
echo "✅ Ricrea il database da zero"
echo "✅ Applica tutte le migrazioni"
echo "✅ Esegue il seed con dati di test"
echo ""

echo -e "${RED}Sei SICURO di voler procedere? Scrivi 'CANCELLA TUTTO' per confermare:${NC}"
read -r conferma

if [[ "$conferma" == "CANCELLA TUTTO" ]]; then
    echo ""
    echo -e "${YELLOW}📦 Ultimo backup prima del reset...${NC}"
    
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    pg_dump assistenza_db > "backup_prima_reset_${TIMESTAMP}.sql"
    echo -e "${GREEN}✅ Backup salvato: backup_prima_reset_${TIMESTAMP}.sql${NC}"
    
    echo ""
    echo -e "${RED}🔥 RESET DATABASE IN CORSO...${NC}"
    
    # Reset completo
    npx prisma migrate reset --force
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║    ✅ RESET COMPLETATO CON SUCCESSO!    ║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
        
        echo ""
        echo "Database ricreato con:"
        echo "✅ Tutte le tabelle Payment"
        echo "✅ Tutti gli enum corretti"
        echo "✅ Dati di test (seed)"
        
    else
        echo -e "${RED}❌ Errore durante il reset${NC}"
        echo "Puoi ripristinare il backup con:"
        echo "  psql assistenza_db < backup_prima_reset_${TIMESTAMP}.sql"
    fi
    
else
    echo ""
    echo -e "${YELLOW}Reset annullato. Il database non è stato modificato.${NC}"
    echo ""
    echo "Se vuoi solo sincronizzare le migrazioni senza perdere dati:"
    echo "  ./sync-migrations-safe.sh"
fi

echo ""
