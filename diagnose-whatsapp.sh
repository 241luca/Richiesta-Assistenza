#!/bin/bash

echo "======================================"
echo "🔍 DIAGNOSTICA WHATSAPP DASHBOARD"
echo "======================================"
echo ""

# Colori
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Check Backend
echo "1️⃣ Verifico Backend (porta 3200)..."
BACKEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3200/api/health)
if [ "$BACKEND" == "200" ]; then
    echo -e "${GREEN}✅ Backend attivo${NC}"
else
    echo -e "${RED}❌ Backend non attivo (HTTP $BACKEND)${NC}"
    echo "   Avvia con: cd backend && npm run dev"
fi

# 2. Check Frontend
echo ""
echo "2️⃣ Verifico Frontend (porta 5193)..."
FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5193/)
if [ "$FRONTEND" == "200" ]; then
    echo -e "${GREEN}✅ Frontend attivo${NC}"
else
    echo -e "${RED}❌ Frontend non attivo (HTTP $FRONTEND)${NC}"
    echo "   Avvia con: npm run dev"
fi

# 3. Check WhatsApp Endpoint
echo ""
echo "3️⃣ Verifico endpoint WhatsApp..."
WHATSAPP_STATUS=$(curl -s http://localhost:3200/api/whatsapp/status 2>/dev/null | grep -c "success" || echo "0")
if [ "$WHATSAPP_STATUS" -gt "0" ]; then
    echo -e "${GREEN}✅ Endpoint WhatsApp funzionante${NC}"
else
    echo -e "${YELLOW}⚠️ Endpoint WhatsApp richiede autenticazione${NC}"
fi

# 4. Check Database
echo ""
echo "4️⃣ Verifico tabella WhatsAppMessage..."
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend 2>/dev/null
if npx prisma db pull 2>/dev/null | grep -q "WhatsAppMessage"; then
    echo -e "${GREEN}✅ Tabella WhatsAppMessage presente${NC}"
else
    echo -e "${RED}❌ Tabella WhatsAppMessage non trovata${NC}"
    echo "   Esegui: cd backend && npx prisma db push"
fi

# 5. Check Files
echo ""
echo "5️⃣ Verifico file dashboard..."
if [ -f "/Users/lucamambelli/Desktop/Richiesta-Assistenza/src/pages/admin/WhatsAppDashboard.tsx" ]; then
    echo -e "${GREEN}✅ File WhatsAppDashboard.tsx presente${NC}"
else
    echo -e "${RED}❌ File WhatsAppDashboard.tsx mancante${NC}"
fi

# 6. Check Route
echo ""
echo "6️⃣ Verifico route nel file routes.tsx..."
if grep -q "WhatsAppDashboard" /Users/lucamambelli/Desktop/Richiesta-Assistenza/src/routes.tsx 2>/dev/null; then
    echo -e "${GREEN}✅ Route WhatsAppDashboard configurata${NC}"
else
    echo -e "${RED}❌ Route WhatsAppDashboard non configurata${NC}"
fi

# 7. Check Menu Link
echo ""
echo "7️⃣ Verifico link nel menu..."
if grep -q "WhatsApp Dashboard" /Users/lucamambelli/Desktop/Richiesta-Assistenza/src/components/Layout.tsx 2>/dev/null; then
    echo -e "${GREEN}✅ Link menu presente${NC}"
else
    echo -e "${RED}❌ Link menu mancante${NC}"
fi

# Summary
echo ""
echo "======================================"
echo "📊 RIEPILOGO"
echo "======================================"
echo ""
echo "Per accedere alla dashboard:"
echo "1. Vai su: http://localhost:5193"
echo "2. Fai login come ADMIN o SUPER_ADMIN"
echo "3. Nel menu laterale cerca 'WhatsApp Dashboard' (con badge NEW)"
echo "4. Oppure vai direttamente su: http://localhost:5193/admin/whatsapp/dashboard"
echo ""
echo "Se non vedi la dashboard:"
echo "1. Controlla la console del browser (F12) per errori"
echo "2. Riavvia il frontend: Ctrl+C e npm run dev"
echo "3. Svuota la cache del browser: Ctrl+Shift+R"
echo ""
echo "Per vedere i messaggi salvati:"
echo "cd backend && npx prisma studio"
echo "Poi apri la tabella WhatsAppMessage"
echo ""

# Check if processes are running
echo "======================================"
echo "🔄 PROCESSI ATTIVI"
echo "======================================"
echo ""
echo "Backend (porta 3200):"
lsof -i :3200 2>/dev/null | grep LISTEN | head -1 || echo "   Nessun processo"
echo ""
echo "Frontend (porta 5193):"
lsof -i :5193 2>/dev/null | grep LISTEN | head -1 || echo "   Nessun processo"
echo ""

echo -e "${GREEN}✅ Diagnostica completata${NC}"
