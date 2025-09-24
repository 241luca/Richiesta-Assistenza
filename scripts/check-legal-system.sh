#!/bin/bash

echo "🔍 Verifica Sistema Documenti Legali"
echo "===================================="

# Check Backend
echo ""
echo "📡 Backend Status:"
if lsof -i :3200 > /dev/null 2>&1; then
  echo "✅ Backend running on port 3200"
  
  # Test API endpoint
  echo "   Testing Legal Documents API..."
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3200/api/public/legal/all)
  if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "500" ]; then
    echo "   ✅ API endpoints registered"
  else
    echo "   ⚠️  API might have issues (HTTP $RESPONSE)"
  fi
else
  echo "❌ Backend not running"
fi

# Check Frontend
echo ""
echo "🎨 Frontend Status:"
if lsof -i :5193 > /dev/null 2>&1; then
  echo "✅ Frontend running on port 5193"
else
  echo "❌ Frontend not running"
fi

# Check Database Tables
echo ""
echo "🗄️ Database Tables:"
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# Check if tables exist
TABLE_CHECK=$(echo "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('LegalDocument', 'LegalDocumentVersion', 'UserLegalAcceptance');" | npx prisma db execute --stdin 2>/dev/null | grep -o '[0-9]' | head -1)

if [ "$TABLE_CHECK" = "3" ]; then
  echo "✅ All legal document tables exist"
else
  echo "⚠️  Some tables might be missing (found $TABLE_CHECK/3)"
  echo "   Run: npx prisma db push"
fi

echo ""
echo "📋 Admin Access URLs:"
echo "   Dashboard: http://localhost:5193/admin/legal-documents"
echo "   Create New: http://localhost:5193/admin/legal-documents/new"

echo ""
echo "📖 Public Access URLs:"
echo "   Legal Center: http://localhost:5193/legal"
echo "   Privacy Policy: http://localhost:5193/legal/privacy-policy"
echo "   Terms of Service: http://localhost:5193/legal/terms-service"
echo "   Cookie Policy: http://localhost:5193/legal/cookie-policy"

echo ""
echo "✨ Sistema Documenti Legali - Check Completato!"
