#!/bin/bash

# Script per rimuovere indici duplicati nel modello User
# Data: 28/09/2025

echo "========================================="
echo "RIMOZIONE INDICI DUPLICATI"
echo "========================================="

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Backup
echo -e "${YELLOW}📦 Backup schema...${NC}"
cp prisma/schema.prisma "prisma/schema.prisma.backup-before-index-fix-$(date +%Y%m%d-%H%M%S)"
echo -e "${GREEN}✅ Backup creato${NC}"

# 2. Rimuovi gli indici duplicati (righe 1846-1849)
echo -e "${YELLOW}🔧 Rimozione indici duplicati...${NC}"

# Rimuovi le righe duplicate degli indici
sed -i '' '1846,1849d' prisma/schema.prisma

echo -e "${GREEN}✅ Indici duplicati rimossi${NC}"

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
        echo -e "${GREEN}🎉 TUTTO PRONTO PER LA MIGRATION!${NC}"
        echo -e "${GREEN}=========================================${NC}"
        echo ""
        echo "Schema completamente corretto!"
        echo ""
        echo "Esegui ora la migration finale:"
        echo -e "${YELLOW}npx prisma migrate dev --name payment-system-complete${NC}"
        echo ""
        echo "Vuoi eseguire la migration automaticamente? (y/n)"
        read -r response
        
        if [[ "$response" == "y" ]]; then
            echo -e "${YELLOW}🗄️ Esecuzione migration...${NC}"
            npx prisma migrate dev --name payment-system-complete --skip-seed
            
            if [ $? -eq 0 ]; then
                echo ""
                echo -e "${GREEN}=========================================${NC}"
                echo -e "${GREEN}✅✅✅ SISTEMA PAGAMENTI INSTALLATO! ✅✅✅${NC}"
                echo -e "${GREEN}=========================================${NC}"
                echo ""
                echo "🎉 Complimenti! Il sistema di pagamenti è ora completamente operativo!"
                echo ""
                echo "📝 PROSSIMI PASSI:"
                echo ""
                echo "1. Configura Stripe in .env:"
                echo "   STRIPE_SECRET_KEY=sk_test_..."
                echo "   STRIPE_WEBHOOK_SECRET=whsec_..."
                echo "   VITE_STRIPE_PUBLIC_KEY=pk_test_..."
                echo ""
                echo "2. Installa dipendenze Stripe:"
                echo "   npm install stripe pdfkit"
                echo ""
                echo "3. Registra le routes in src/app.ts aggiungendo:"
                echo "   import paymentRoutes from './routes/payment.routes';"
                echo "   import invoiceRoutes from './routes/invoice.routes';"
                echo "   app.use('/api/payments', paymentRoutes);"
                echo "   app.use('/api/invoices', invoiceRoutes);"
                echo ""
                echo "4. Nel frontend installa:"
                echo "   cd .. && npm install @stripe/react-stripe-js @stripe/stripe-js"
                echo ""
                echo "5. Avvia e testa:"
                echo "   npm run dev"
                echo ""
            else
                echo -e "${RED}❌ Errore durante la migration${NC}"
            fi
        fi
    else
        echo -e "${RED}❌ Errore generazione client${NC}"
    fi
else
    echo -e "${RED}❌ Errore nella formattazione${NC}"
fi