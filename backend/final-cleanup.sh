#!/bin/bash

# Script definitivo per pulire completamente lo schema
# Data: 28/09/2025

echo "========================================="
echo "PULIZIA DEFINITIVA SCHEMA"
echo "========================================="

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Backup
echo -e "${YELLOW}📦 Backup schema...${NC}"
cp prisma/schema.prisma "prisma/schema.prisma.backup-final-$(date +%Y%m%d-%H%M%S)"
echo -e "${GREEN}✅ Backup creato${NC}"

# 2. Rimuovi le righe errate del modello backups (1837-1843) e gli indici duplicati
echo -e "${YELLOW}🔧 Rimozione righe errate (1837-1843 e indici duplicati)...${NC}"

# Rimuovi le righe problematiche
sed -i '' '1837,1843d' prisma/schema.prisma

# Rimuovi anche gli indici duplicati nelle righe successive
sed -i '' '/@@index(\[email\])/d' prisma/schema.prisma
sed -i '' '/@@index(\[latitude, longitude\])/d' prisma/schema.prisma
sed -i '' '/@@index(\[created_at\])/d' prisma/schema.prisma
sed -i '' '/@@index(\[type\])/d' prisma/schema.prisma

# Aggiungi gli indici corretti alla fine del modello User (prima della chiusura })
# Trova la chiusura del modello User e aggiungi gli indici
awk '
/^model User {/,/^}/ {
    if (/^}/) {
        print "  @@index([email])"
        print "  @@index([latitude, longitude])"
        print "  @@index([role])"
        print "  @@index([workLatitude, workLongitude])"
        print "  @@index([createdAt])"
    }
    print
    next
}
{ print }
' prisma/schema.prisma > prisma/schema.tmp && mv prisma/schema.tmp prisma/schema.prisma

echo -e "${GREEN}✅ Pulizia completata${NC}"

# 3. Formatta lo schema
echo -e "${YELLOW}🎨 Formattazione schema...${NC}"
npx prisma format

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Schema valido!${NC}"
    
    # 4. Genera client
    echo -e "${YELLOW}🔧 Generazione client Prisma...${NC}"
    npx prisma generate
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Client generato con successo!${NC}"
        
        echo ""
        echo -e "${GREEN}=========================================${NC}"
        echo -e "${GREEN}🎉🎉🎉 SISTEMA PRONTO! 🎉🎉🎉${NC}"
        echo -e "${GREEN}=========================================${NC}"
        echo ""
        echo "Schema completamente pulito e corretto!"
        echo ""
        echo "Ora puoi fare la migration finale:"
        echo "  npx prisma migrate dev --name payment-system-final"
        echo ""
        echo "Vuoi eseguire la migration ora? (y/n)"
        read -r response
        
        if [[ "$response" == "y" ]]; then
            echo -e "${YELLOW}🗄️ Esecuzione migration finale...${NC}"
            npx prisma migrate dev --name payment-system-final --skip-seed
            
            if [ $? -eq 0 ]; then
                echo ""
                echo -e "${GREEN}=========================================${NC}"
                echo -e "${GREEN}🚀🚀🚀 INSTALLAZIONE COMPLETATA! 🚀🚀🚀${NC}"
                echo -e "${GREEN}=========================================${NC}"
                echo ""
                echo "✅ Database aggiornato con successo!"
                echo "✅ Sistema pagamenti installato!"
                echo "✅ Tutto pronto per l'uso!"
                echo ""
                echo "📋 CHECKLIST FINALE:"
                echo ""
                echo "1. [ ] Installa Stripe:"
                echo "       npm install stripe pdfkit"
                echo ""
                echo "2. [ ] Configura .env:"
                echo "       STRIPE_SECRET_KEY=sk_test_..."
                echo "       STRIPE_WEBHOOK_SECRET=whsec_..."
                echo ""
                echo "3. [ ] Registra routes in src/app.ts"
                echo ""
                echo "4. [ ] Testa il sistema:"
                echo "       npm run dev"
                echo ""
            fi
        fi
    else
        echo -e "${RED}❌ Errore generazione client${NC}"
    fi
else
    echo -e "${RED}❌ Ancora errori nello schema${NC}"
    echo "Mostra prime righe di errore:"
    npx prisma format 2>&1 | head -20
fi