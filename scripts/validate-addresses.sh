#!/bin/bash

# Script per validare tutti gli indirizzi delle richieste con Google Maps
# Aggiorna le coordinate latitude/longitude per ogni richiesta

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     VALIDAZIONE INDIRIZZI CON GOOGLE MAPS                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Salva la directory corrente
ORIGINAL_DIR=$(pwd)

# Vai nella directory backend
cd backend 2>/dev/null
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Errore: Directory backend non trovata${NC}"
    echo "Assicurati di essere nella directory del progetto richiesta-assistenza"
    exit 1
fi

# Controlla se il file dello script esiste
if [ ! -f "src/scripts/validate-all-addresses.ts" ]; then
    echo -e "${RED}❌ Errore: Script validate-all-addresses.ts non trovato${NC}"
    echo "Path cercato: $(pwd)/src/scripts/validate-all-addresses.ts"
    exit 1
fi

# Controlla se TypeScript è installato
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ Errore: npx non trovato. Installa Node.js${NC}"
    exit 1
fi

# Crea backup del database prima di procedere
echo -e "${BLUE}📦 Creazione backup database...${NC}"
BACKUP_DIR="../backups"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/db-backup-$(date +%Y%m%d-%H%M%S).sql"

# Esegui backup (adatta il comando al tuo database)
if command -v pg_dump &> /dev/null; then
    # PostgreSQL - prova a leggere DATABASE_URL dal .env
    if [ -f ".env" ]; then
        DATABASE_URL=$(grep DATABASE_URL .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
        if [ ! -z "$DATABASE_URL" ]; then
            pg_dump "$DATABASE_URL" > "$BACKUP_FILE" 2>/dev/null
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✅ Backup creato: $BACKUP_FILE${NC}"
            else
                echo -e "${YELLOW}⚠️  Backup database non riuscito${NC}"
            fi
        fi
    fi
fi

echo ""
echo -e "${YELLOW}⚠️  ATTENZIONE:${NC}"
echo "Questo script aggiornerà TUTTI gli indirizzi nel database con le coordinate di Google Maps."
echo "Assicurati di:"
echo "1. Avere una API key Google Maps valida configurata"
echo "2. Avere fatto un backup del database"
echo "3. Essere in un ambiente di test/sviluppo"
echo ""
echo -e "${YELLOW}Vuoi continuare? (s/n)${NC}"
read -r response

if [[ ! "$response" =~ ^[Ss]$ ]]; then
    echo -e "${RED}❌ Operazione annullata${NC}"
    cd "$ORIGINAL_DIR"
    exit 0
fi

echo ""
echo -e "${BLUE}🚀 Avvio validazione indirizzi...${NC}"
echo -e "${BLUE}📂 Directory corrente: $(pwd)${NC}"
echo ""

# Esegui lo script TypeScript
npx ts-node src/scripts/validate-all-addresses.ts

# Salva il codice di uscita
EXIT_CODE=$?

# Torna alla directory originale
cd "$ORIGINAL_DIR"

# Controlla il risultato
if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Validazione completata con successo!${NC}"
    echo ""
    echo "Prossimi passi:"
    echo "1. Verifica che gli indirizzi siano stati aggiornati correttamente"
    echo "2. Testa l'applicazione per verificare che le mappe funzionino"
    echo "3. Se tutto è ok, puoi eliminare il backup: rm $BACKUP_FILE"
else
    echo ""
    echo -e "${RED}❌ Errore durante la validazione${NC}"
    echo "Controlla i log per maggiori dettagli"
    echo ""
    if [ -f "$BACKUP_FILE" ]; then
        echo "Per ripristinare il database dal backup:"
        echo "psql DATABASE_URL < $BACKUP_FILE"
    fi
    exit 1
fi
