#!/bin/bash

# Script per registrare le routes del sistema pagamenti
# Data: 28/09/2025

echo "========================================="
echo "REGISTRAZIONE ROUTES PAGAMENTI"
echo "========================================="

# Colori per output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Backup del server.ts
echo -e "${YELLOW}📦 Backup server.ts...${NC}"
cp src/server.ts "src/server.ts.backup-payment-routes-$(date +%Y%m%d-%H%M%S)"
echo -e "${GREEN}✅ Backup creato${NC}"

# 2. Crea un file temporaneo con le modifiche
echo -e "${YELLOW}📝 Aggiunta routes pagamenti...${NC}"

# Aggiungi gli import delle routes (dopo gli altri import di routes, circa riga 230)
sed -i '' '/import.*routes.*from/a\
\
// Payment and Invoice routes\
import paymentRoutes from '"'"'./routes/payment.routes'"'"';\
import invoiceRoutes from '"'"'./routes/invoice.routes'"'"';' src/server.ts

# Aggiungi la registrazione delle routes (dopo le altre app.use, cerca un buon punto)
# Cerchiamo l'ultima route API e aggiungiamo dopo
sed -i '' '/app.use.*\/api\/.*Routes/a\
\
// Payment routes\
app.use('"'"'/api/payments'"'"', authenticate, paymentRoutes);\
logger.info('"'"'💳 Payment routes registered at /api/payments'"'"');\
\
// Invoice routes\
app.use('"'"'/api/invoices'"'"', authenticate, invoiceRoutes);\
logger.info('"'"'📄 Invoice routes registered at /api/invoices'"'"');' src/server.ts

echo -e "${GREEN}✅ Routes aggiunte${NC}"

# 3. Verifica che il file sia valido
echo -e "${YELLOW}🔍 Verifica sintassi TypeScript...${NC}"
npx tsc --noEmit src/server.ts

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ File server.ts valido${NC}"
else
    echo -e "${YELLOW}⚠️ Possibili errori di sintassi - controllare manualmente${NC}"
fi

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✅ ROUTES REGISTRATE!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Le routes sono state aggiunte a server.ts"
echo ""
echo "Ora riavvia il server:"
echo "  npm run dev"
echo ""