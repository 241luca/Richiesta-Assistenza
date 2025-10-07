#!/bin/bash

# Script finale per correggere i riferimenti Request -> AssistanceRequest
# Data: 28/09/2025

echo "========================================="
echo "CORREZIONE FINALE RIFERIMENTI"
echo "========================================="

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Backup prima della correzione
echo -e "${YELLOW}📦 Backup schema attuale...${NC}"
cp prisma/schema.prisma "prisma/schema.prisma.backup-before-request-fix-$(date +%Y%m%d-%H%M%S)"
echo -e "${GREEN}✅ Backup creato${NC}"

# 2. Correggi i riferimenti Request -> AssistanceRequest
echo -e "${YELLOW}🔧 Correzione riferimenti Request -> AssistanceRequest...${NC}"

# Correggi alla riga 2992
sed -i '' 's/request[[:space:]]*Request?/request       AssistanceRequest?/g' prisma/schema.prisma

echo -e "${GREEN}✅ Riferimenti corretti${NC}"

# 3. Verifica che non ci siano più errori di tipo Request
echo -e "${YELLOW}🔍 Verifica correzioni...${NC}"

if grep -q "Request?" prisma/schema.prisma | grep -v "AssistanceRequest"; then
    echo -e "${YELLOW}⚠️ Potrebbero esserci ancora riferimenti a Request${NC}"
else
    echo -e "${GREEN}✅ Tutti i riferimenti corretti${NC}"
fi

# 4. Test formattazione
echo -e "${YELLOW}🎨 Formattazione schema...${NC}"
npx prisma format

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Schema valido!${NC}"
    
    # 5. Genera client
    echo -e "${YELLOW}🔧 Generazione client Prisma...${NC}"
    npx prisma generate
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Client generato con successo!${NC}"
        
        echo ""
        echo -e "${GREEN}=========================================${NC}"
        echo -e "${GREEN}🎉 SISTEMA PRONTO!${NC}"
        echo -e "${GREEN}=========================================${NC}"
        echo ""
        echo "Tutto è stato corretto con successo!"
        echo ""
        echo "Tabelle sistema pagamenti presenti:"
        echo "  ✅ Payment"
        echo "  ✅ Invoice"
        echo "  ✅ ProfessionalPaymentSettings"
        echo "  ✅ Payout"
        echo "  ✅ Refund"
        echo "  ✅ CommissionRule"
        echo "  ✅ StripeConnect"
        echo ""
        echo "Ora puoi eseguire la migration finale:"
        echo "  npx prisma migrate dev --name complete-payment-system"
        echo ""
        echo -e "${YELLOW}Vuoi eseguire la migration ora? (y/n)${NC}"
        read -r response
        
        if [[ "$response" == "y" ]]; then
            echo -e "${YELLOW}🗄️ Esecuzione migration...${NC}"
            npx prisma migrate dev --name complete-payment-system --skip-seed
            
            if [ $? -eq 0 ]; then
                echo ""
                echo -e "${GREEN}=========================================${NC}"
                echo -e "${GREEN}🚀 MIGRATION COMPLETATA CON SUCCESSO!${NC}"
                echo -e "${GREEN}=========================================${NC}"
                echo ""
                echo "Il sistema di pagamenti è ora completamente installato!"
                echo ""
                echo "Prossimi passi:"
                echo "1. Configura Stripe nel file .env:"
                echo "   STRIPE_SECRET_KEY=sk_test_..."
                echo "   STRIPE_WEBHOOK_SECRET=whsec_..."
                echo ""
                echo "2. Registra le routes in src/app.ts:"
                echo "   import paymentRoutes from './routes/payment.routes';"
                echo "   import invoiceRoutes from './routes/invoice.routes';"
                echo "   app.use('/api/payments', paymentRoutes);"
                echo "   app.use('/api/invoices', invoiceRoutes);"
                echo ""
                echo "3. Testa il sistema:"
                echo "   npm run dev"
                echo ""
            else
                echo -e "${RED}❌ Errore durante la migration${NC}"
            fi
        else
            echo -e "${YELLOW}Migration saltata. Esegui manualmente quando sei pronto.${NC}"
        fi
    else
        echo -e "${RED}❌ Errore nella generazione del client${NC}"
    fi
else
    echo -e "${RED}❌ Ci sono ancora errori nello schema${NC}"
    echo ""
    echo -e "${YELLOW}Prova correzione manuale:${NC}"
    echo "1. Apri prisma/schema.prisma"
    echo "2. Cerca 'Request?' (senza Assistance davanti)"
    echo "3. Sostituisci con 'AssistanceRequest?'"
    echo "4. Salva e riprova"
fi