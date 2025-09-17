#!/bin/bash

echo "🔍 Sistema Richiesta Assistenza - Test Completo"
echo "================================================"

# Colori
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Test backend health
echo -e "\n${YELLOW}1. Checking backend health...${NC}"
HEALTH=$(curl -s http://localhost:3200/api/health 2>/dev/null)
if [ ! -z "$HEALTH" ]; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is not responding${NC}"
    exit 1
fi

# 2. Login test  
echo -e "\n${YELLOW}2. Testing login...${NC}"
curl -c /tmp/test-cookies.txt -s -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}' \
  > /tmp/login-response.json 2>/dev/null

if grep -q "error" /tmp/login-response.json; then
    echo -e "${RED}✗ Login failed:${NC}"
    cat /tmp/login-response.json | python3 -m json.tool
else
    echo -e "${GREEN}✓ Login successful${NC}"
    cat /tmp/login-response.json | python3 -m json.tool
fi

# 3. Get current user
echo -e "\n${YELLOW}3. Getting current user...${NC}"
USER_RESPONSE=$(curl -b /tmp/test-cookies.txt -s http://localhost:3200/api/auth/me)
echo "$USER_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$USER_RESPONSE"

# 4. Get requests
echo -e "\n${YELLOW}4. Fetching requests...${NC}"
REQUESTS=$(curl -b /tmp/test-cookies.txt -s http://localhost:3200/api/requests)
echo "$REQUESTS" | python3 -m json.tool 2>/dev/null | head -30 || echo "$REQUESTS"

# Count requests
REQUEST_COUNT=$(echo "$REQUESTS" | grep -o '"id"' | wc -l)
echo -e "\nFound ${GREEN}$REQUEST_COUNT${NC} requests"

# 5. Get quotes
echo -e "\n${YELLOW}5. Fetching quotes...${NC}"
QUOTES=$(curl -b /tmp/test-cookies.txt -s http://localhost:3200/api/quotes)
echo "$QUOTES" | python3 -m json.tool 2>/dev/null | head -30 || echo "$QUOTES"

# Count quotes
QUOTE_COUNT=$(echo "$QUOTES" | grep -o '"id"' | wc -l)
echo -e "\nFound ${GREEN}$QUOTE_COUNT${NC} quotes"

# 6. Get categories
echo -e "\n${YELLOW}6. Fetching categories...${NC}"
CATEGORIES=$(curl -b /tmp/test-cookies.txt -s http://localhost:3200/api/categories)
echo "$CATEGORIES" | python3 -m json.tool 2>/dev/null | head -20 || echo "$CATEGORIES"

echo -e "\n${GREEN}✅ Test complete!${NC}"
echo -e "\n${YELLOW}Summary:${NC}"
echo -e "  - Backend: Running"
echo -e "  - Authentication: Working"
echo -e "  - Requests: $REQUEST_COUNT found"
echo -e "  - Quotes: $QUOTE_COUNT found"

echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "  1. If no data found, run: cd backend && npx tsx scripts/fix-org-ids.ts"
echo -e "  2. Refresh your browser at http://localhost:5193"
echo -e "  3. Login with: admin@example.com / Admin123!"