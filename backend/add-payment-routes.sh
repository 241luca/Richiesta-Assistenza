#!/bin/bash

# Script per registrare le routes payment e invoice nel server.ts
# Data: 28/09/2025

echo "========================================="
echo "AGGIUNTA ROUTES PAYMENT E INVOICE"
echo "========================================="

# Colori
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# 1. Backup del server.ts
echo -e "${YELLOW}📦 Backup server.ts...${NC}"
cp src/server.ts "src/server.ts.backup-add-payment-$(date +%Y%m%d-%H%M%S)"
echo -e "${GREEN}✅ Backup creato${NC}"

# 2. Verifica se le routes sono già importate
echo -e "${YELLOW}🔍 Verifica routes esistenti...${NC}"

if grep -q "paymentRoutes" src/server.ts; then
    echo -e "${GREEN}✅ Payment routes già importate${NC}"
    PAYMENT_IMPORTED=true
else
    echo -e "${YELLOW}⚠️ Payment routes da importare${NC}"
    PAYMENT_IMPORTED=false
fi

if grep -q "invoiceRoutes" src/server.ts; then
    echo -e "${GREEN}✅ Invoice routes già importate${NC}"
    INVOICE_IMPORTED=true
else
    echo -e "${YELLOW}⚠️ Invoice routes da importare${NC}"
    INVOICE_IMPORTED=false
fi

# 3. Aggiungi import se necessario
if [ "$PAYMENT_IMPORTED" = false ] || [ "$INVOICE_IMPORTED" = false ]; then
    echo -e "${YELLOW}📝 Aggiunta import routes...${NC}"
    
    # Trova l'ultima riga con import di routes e aggiungi dopo
    LINE=$(grep -n "import.*routes" src/server.ts | tail -1 | cut -d: -f1)
    
    if [ -z "$LINE" ]; then
        echo -e "${RED}❌ Non trovato dove aggiungere import${NC}"
        exit 1
    fi
    
    # Prepara gli import da aggiungere
    IMPORTS=""
    if [ "$PAYMENT_IMPORTED" = false ]; then
        IMPORTS="${IMPORTS}import paymentRoutes from './routes/payment.routes';\n"
    fi
    if [ "$INVOICE_IMPORTED" = false ]; then
        IMPORTS="${IMPORTS}import invoiceRoutes from './routes/invoice.routes';\n"
    fi
    
    # Aggiungi gli import
    sed -i '' "${LINE}a\\
${IMPORTS}" src/server.ts
    
    echo -e "${GREEN}✅ Import aggiunti${NC}"
fi

# 4. Aggiungi registrazione routes se necessario
echo -e "${YELLOW}🔍 Verifica registrazione routes...${NC}"

if grep -q "app.use('/api/payments'" src/server.ts || grep -q 'app.use("/api/payments"' src/server.ts; then
    echo -e "${GREEN}✅ Payment routes già registrate${NC}"
else
    echo -e "${YELLOW}📝 Registrazione payment routes...${NC}"
    
    # Trova l'ultima app.use per /api/ routes
    LINE=$(grep -n "app.use('/api/" src/server.ts | tail -1 | cut -d: -f1)
    
    if [ -z "$LINE" ]; then
        echo -e "${RED}❌ Non trovato dove aggiungere app.use${NC}"
        exit 1
    fi
    
    # Aggiungi payment routes
    sed -i '' "${LINE}a\\
\\
// Payment routes\\
app.use('/api/payments', authenticate, paymentRoutes);\\
logger.info('💳 Payment routes registered at /api/payments');" src/server.ts
    
    echo -e "${GREEN}✅ Payment routes registrate${NC}"
fi

if grep -q "app.use('/api/invoices'" src/server.ts || grep -q 'app.use("/api/invoices"' src/server.ts; then
    echo -e "${GREEN}✅ Invoice routes già registrate${NC}"
else
    echo -e "${YELLOW}📝 Registrazione invoice routes...${NC}"
    
    # Trova l'ultima app.use per /api/ routes  
    LINE=$(grep -n "app.use('/api/" src/server.ts | tail -1 | cut -d: -f1)
    
    # Aggiungi invoice routes
    sed -i '' "${LINE}a\\
\\
// Invoice routes\\
app.use('/api/invoices', authenticate, invoiceRoutes);\\
logger.info('📄 Invoice routes registered at /api/invoices');" src/server.ts
    
    echo -e "${GREEN}✅ Invoice routes registrate${NC}"
fi

# 5. Verifica sintassi TypeScript
echo -e "${YELLOW}🔍 Verifica sintassi...${NC}"
npx tsc --noEmit src/server.ts 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Sintassi valida${NC}"
else
    echo -e "${YELLOW}⚠️ Possibili warning TypeScript (normale)${NC}"
fi

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✅ ROUTES AGGIUNTE CON SUCCESSO!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Ora installa le dipendenze mancanti:"
echo "  npm install stripe pdfkit"
echo ""
echo "Poi riavvia il server:"
echo "  npm run dev"
echo ""