#!/bin/bash

# Script definitivo per rimuovere duplicati
# Data: 28/09/2025

echo "========================================="
echo "RIMOZIONE DEFINITIVA DUPLICATI"
echo "========================================="

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Backup
echo -e "${YELLOW}📦 Backup schema attuale...${NC}"
cp prisma/schema.prisma "prisma/schema.prisma.backup-final-fix-$(date +%Y%m%d-%H%M%S)"
echo -e "${GREEN}✅ Backup creato${NC}"

# 2. Trova e mostra le righe duplicate
echo -e "${YELLOW}🔍 Ricerca righe duplicate nel modello User...${NC}"

# Mostra le righe problematiche
echo "Righe con PaymentReconciliation:"
grep -n "PaymentReconciliation.*PaymentReconciliation\[\]" prisma/schema.prisma

echo ""
echo "Righe con Subscription:"
grep -n "Subscription.*Subscription\[\]" prisma/schema.prisma

# 3. Rimuovi ESATTAMENTE le righe duplicate (linea 1844 e 1846)
echo -e "${YELLOW}🔧 Rimozione righe duplicate (1844 e 1846)...${NC}"

# Usa sed per rimuovere le righe specifiche
sed -i '' '1844d;1845d' prisma/schema.prisma

echo -e "${GREEN}✅ Righe rimosse${NC}"

# 4. Verifica il risultato
echo -e "${YELLOW}🔍 Verifica rimozione duplicati...${NC}"

DUPLICATES_PAYMENT=$(grep -c "PaymentReconciliation.*PaymentReconciliation\[\]" prisma/schema.prisma)
DUPLICATES_SUB=$(grep -c "Subscription.*Subscription\[\]" prisma/schema.prisma)

if [ "$DUPLICATES_PAYMENT" -eq 1 ] && [ "$DUPLICATES_SUB" -eq 1 ]; then
    echo -e "${GREEN}✅ Nessun duplicato trovato!${NC}"
else
    echo -e "${RED}❌ Ci sono ancora duplicati${NC}"
    echo "PaymentReconciliation occorrenze: $DUPLICATES_PAYMENT (dovrebbe essere 1)"
    echo "Subscription occorrenze: $DUPLICATES_SUB (dovrebbe essere 1)"
fi

# 5. Test formattazione
echo -e "${YELLOW}🎨 Test formattazione schema...${NC}"
npx prisma format

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Schema valido!${NC}"
    
    # 6. Genera client
    echo -e "${YELLOW}🔧 Generazione client Prisma...${NC}"
    npx prisma generate
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Client generato con successo${NC}"
        
        # 7. Crea migration
        echo -e "${YELLOW}🗄️ Creazione migration database...${NC}"
        echo "Vuoi creare la migration ora? (y/n)"
        read -r response
        
        if [[ "$response" == "y" ]]; then
            npx prisma migrate dev --name complete-payment-system --skip-seed
            echo -e "${GREEN}✅ Migration completata!${NC}"
        else
            echo -e "${YELLOW}⚠️ Migration saltata. Esegui manualmente:${NC}"
            echo "npx prisma migrate dev --name complete-payment-system"
        fi
    else
        echo -e "${RED}❌ Errore nella generazione del client${NC}"
    fi
else
    echo -e "${RED}❌ Ci sono ancora errori nello schema${NC}"
    echo -e "${YELLOW}Controllare manualmente prisma/schema.prisma${NC}"
fi

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}PROCESSO COMPLETATO${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""