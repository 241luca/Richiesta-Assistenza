#!/bin/bash

echo "🧪 Test Completo Sistema Documenti Legali"
echo "========================================="
echo ""

# Colori
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test 1: Endpoint all documents
echo "1️⃣  Test /api/public/legal/all:"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" http://localhost:3200/api/public/legal/all)
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Status: 200 OK${NC}"
    DOC_COUNT=$(echo "$BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('data', [])))" 2>/dev/null)
    if [ -n "$DOC_COUNT" ] && [ "$DOC_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ Documenti trovati: $DOC_COUNT${NC}"
    else
        echo -e "${RED}❌ Nessun documento trovato${NC}"
    fi
else
    echo -e "${RED}❌ Status: $HTTP_CODE${NC}"
fi

echo ""

# Test 2: Privacy Policy
echo "2️⃣  Test /api/public/legal/privacy-policy:"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" http://localhost:3200/api/public/legal/privacy-policy)
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Privacy Policy disponibile${NC}"
else
    echo -e "${RED}❌ Privacy Policy non trovata (Status: $HTTP_CODE)${NC}"
fi

# Test 3: Terms of Service
echo "3️⃣  Test /api/public/legal/terms-service:"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" http://localhost:3200/api/public/legal/terms-service)
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Terms of Service disponibili${NC}"
else
    echo -e "${RED}❌ Terms of Service non trovati (Status: $HTTP_CODE)${NC}"
fi

# Test 4: Cookie Policy
echo "4️⃣  Test /api/public/legal/cookie-policy:"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" http://localhost:3200/api/public/legal/cookie-policy)
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Cookie Policy disponibile${NC}"
else
    echo -e "${RED}❌ Cookie Policy non trovata (Status: $HTTP_CODE)${NC}"
fi

echo ""
echo "📊 Verifica database:"
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# Conta documenti
DOC_COUNT=$(echo "SELECT COUNT(*) FROM \"LegalDocument\";" | npx prisma db execute --stdin --schema=./prisma/schema.prisma 2>/dev/null | grep -o '[0-9]*' | tail -1)
VER_COUNT=$(echo "SELECT COUNT(*) FROM \"LegalDocumentVersion\";" | npx prisma db execute --stdin --schema=./prisma/schema.prisma 2>/dev/null | grep -o '[0-9]*' | tail -1)

if [ -n "$DOC_COUNT" ] && [ "$DOC_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Documenti nel DB: $DOC_COUNT${NC}"
else
    echo -e "${RED}❌ Nessun documento nel database${NC}"
fi

if [ -n "$VER_COUNT" ] && [ "$VER_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Versioni nel DB: $VER_COUNT${NC}"
else
    echo -e "${RED}❌ Nessuna versione nel database${NC}"
fi

echo ""
echo "🔗 URL da testare nel browser:"
echo -e "${YELLOW}Admin Panel:${NC} http://localhost:5193/admin/legal-documents"
echo -e "${YELLOW}Public Page:${NC} http://localhost:5193/legal"
echo -e "${YELLOW}Privacy:${NC} http://localhost:5193/legal/privacy-policy"
echo -e "${YELLOW}Terms:${NC} http://localhost:5193/legal/terms-service"
echo -e "${YELLOW}Cookie:${NC} http://localhost:5193/legal/cookie-policy"
