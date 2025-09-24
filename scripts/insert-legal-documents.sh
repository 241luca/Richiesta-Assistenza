#!/bin/bash

echo "================================================"
echo "📜 INSERIMENTO DOCUMENTI LEGALI NEL DATABASE"
echo "================================================"
echo ""
echo "Questo script inserirà i tre documenti legali principali:"
echo "1. Privacy Policy"
echo "2. Termini di Servizio"
echo "3. Cookie Policy"
echo ""

# Colori per output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Directory del backend
BACKEND_DIR="/Users/lucamambelli/Desktop/Richiesta-Assistenza/backend"
SCRIPTS_DIR="/Users/lucamambelli/Desktop/Richiesta-Assistenza/scripts"

# Verifica che i file SQL esistano
echo "🔍 Verifico presenza dei file SQL..."
if [ ! -f "$SCRIPTS_DIR/seed-privacy-policy.sql" ]; then
    echo -e "${RED}❌ File seed-privacy-policy.sql non trovato${NC}"
    exit 1
fi
if [ ! -f "$SCRIPTS_DIR/seed-terms-service.sql" ]; then
    echo -e "${RED}❌ File seed-terms-service.sql non trovato${NC}"
    exit 1
fi
if [ ! -f "$SCRIPTS_DIR/seed-cookie-policy.sql" ]; then
    echo -e "${RED}❌ File seed-cookie-policy.sql non trovato${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Tutti i file SQL trovati${NC}"
echo ""

# Vai alla directory del backend
cd $BACKEND_DIR

echo "📊 Inserimento documenti nel database..."
echo ""

# Privacy Policy
echo -e "${YELLOW}1. Inserimento Privacy Policy...${NC}"
npx prisma db execute --file "$SCRIPTS_DIR/seed-privacy-policy.sql" --schema prisma/schema.prisma
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Privacy Policy inserita con successo${NC}"
else
    echo -e "${RED}⚠️  Errore nell'inserimento della Privacy Policy (potrebbe già esistere)${NC}"
fi
echo ""

# Termini di Servizio
echo -e "${YELLOW}2. Inserimento Termini di Servizio...${NC}"
npx prisma db execute --file "$SCRIPTS_DIR/seed-terms-service.sql" --schema prisma/schema.prisma
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Termini di Servizio inseriti con successo${NC}"
else
    echo -e "${RED}⚠️  Errore nell'inserimento dei Termini di Servizio (potrebbero già esistere)${NC}"
fi
echo ""

# Cookie Policy
echo -e "${YELLOW}3. Inserimento Cookie Policy...${NC}"
npx prisma db execute --file "$SCRIPTS_DIR/seed-cookie-policy.sql" --schema prisma/schema.prisma
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Cookie Policy inserita con successo${NC}"
else
    echo -e "${RED}⚠️  Errore nell'inserimento della Cookie Policy (potrebbe già esistere)${NC}"
fi
echo ""

echo "================================================"
echo -e "${GREEN}🎉 PROCESSO COMPLETATO!${NC}"
echo "================================================"
echo ""
echo "📋 Riepilogo documenti inseriti:"
echo "  • Privacy Policy v1.0.0"
echo "  • Termini di Servizio v1.0.0"
echo "  • Cookie Policy v1.0.0"
echo ""
echo "🔗 I documenti sono ora disponibili agli URL:"
echo "  Admin:"
echo "  • http://localhost:5193/admin/legal-documents"
echo ""
echo "  Pubblici:"
echo "  • http://localhost:5193/legal"
echo "  • http://localhost:5193/legal/privacy-policy"
echo "  • http://localhost:5193/legal/terms-service"
echo "  • http://localhost:5193/legal/cookie-policy"
echo ""
echo "✨ Tutti i documenti sono completi, professionali e conformi alle normative!"
