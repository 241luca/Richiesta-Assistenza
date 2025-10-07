#!/bin/bash

# Script per correggere l'errore critico nello schema
# Data: 28/09/2025

echo "========================================="
echo "FIX CRITICO SCHEMA PRISMA"
echo "========================================="

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Backup di emergenza
echo -e "${YELLOW}🚨 Backup di emergenza...${NC}"
cp prisma/schema.prisma "prisma/schema.prisma.CORRUPTED-$(date +%Y%m%d-%H%M%S)"
echo -e "${GREEN}✅ Backup salvato${NC}"

# 2. Ripristina da un backup funzionante
echo -e "${YELLOW}🔄 Ripristino da backup pulito...${NC}"

# Trova un backup valido (senza "payment" nel nome che sono corrotti)
GOOD_BACKUP=$(ls -t prisma/schema.prisma.backup-2025* 2>/dev/null | grep -v "payment" | grep -v "final" | grep -v "duplicate" | head -1)

if [ -z "$GOOD_BACKUP" ]; then
    echo -e "${RED}❌ Nessun backup valido trovato!${NC}"
    echo "Prova a ripristinare manualmente da:"
    ls -lt prisma/*.backup* | head -5
    exit 1
fi

echo -e "${GREEN}📁 Ripristino da: $GOOD_BACKUP${NC}"
cp "$GOOD_BACKUP" prisma/schema.prisma

# 3. Verifica che non ci sia la linea corrotta
echo -e "${YELLOW}🔍 Verifica assenza errore 'model backups' dentro User...${NC}"
if grep -q "model backups {" prisma/schema.prisma; then
    echo -e "${RED}❌ TROVATO ERRORE! Rimozione in corso...${NC}"
    
    # Rimuovi la linea errata e le successive fino alla fine del modello User
    sed -i '' '/^  model backups {/,/^  @@index\[email\]/d' prisma/schema.prisma
    
    # Aggiungi correttamente gli indici alla fine del modello User
    sed -i '' '/^model User {/,/^}/ { 
        /^}/ i\
\
  @@index([email])\
  @@index([latitude, longitude])\
  @@index([createdAt])\
  @@index([role])
    }' prisma/schema.prisma
    
    echo -e "${GREEN}✅ Errore rimosso${NC}"
else
    echo -e "${GREEN}✅ Nessun errore 'model backups' trovato${NC}"
fi

# 4. Verifica che le tabelle Payment esistano
echo -e "${YELLOW}🔍 Verifica tabelle sistema pagamenti...${NC}"

if grep -q "model Payment " prisma/schema.prisma; then
    echo -e "${GREEN}✅ Payment trovata${NC}"
else
    echo -e "${YELLOW}⚠️ Payment non trovata${NC}"
fi

if grep -q "model Invoice " prisma/schema.prisma; then
    echo -e "${GREEN}✅ Invoice trovata${NC}"
else
    echo -e "${YELLOW}⚠️ Invoice non trovata${NC}"
fi

if grep -q "model ProfessionalPaymentSettings " prisma/schema.prisma; then
    echo -e "${GREEN}✅ ProfessionalPaymentSettings trovata${NC}"
else
    echo -e "${YELLOW}⚠️ ProfessionalPaymentSettings non trovata${NC}"
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
        
        echo ""
        echo -e "${GREEN}=========================================${NC}"
        echo -e "${GREEN}✅ SCHEMA RIPARATO CON SUCCESSO!${NC}"
        echo -e "${GREEN}=========================================${NC}"
        echo ""
        echo "Ora puoi eseguire la migration:"
        echo "  npx prisma migrate dev --name fix-payment-system"
        echo ""
        
        # 7. Chiedi se vuole fare la migration
        echo "Vuoi eseguire la migration ora? (y/n)"
        read -r response
        
        if [[ "$response" == "y" ]]; then
            npx prisma migrate dev --name fix-payment-system --skip-seed
        fi
    else
        echo -e "${RED}❌ Errore nella generazione del client${NC}"
    fi
else
    echo -e "${RED}❌ Ci sono ancora errori nello schema${NC}"
    
    # Mostra gli errori
    echo ""
    echo -e "${YELLOW}Errori trovati:${NC}"
    npx prisma format 2>&1 | grep -A5 "error:"
fi

echo ""