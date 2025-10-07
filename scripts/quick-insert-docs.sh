#!/bin/bash

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

echo "🔄 Inserimento documenti legali nel database..."
echo ""

# Privacy Policy
echo "📋 Inserimento Privacy Policy..."
npx prisma db execute --file ../scripts/seed-privacy-policy.sql --schema prisma/schema.prisma 2>&1
echo ""

# Terms of Service  
echo "📋 Inserimento Termini di Servizio..."
npx prisma db execute --file ../scripts/seed-terms-service.sql --schema prisma/schema.prisma 2>&1
echo ""

# Cookie Policy
echo "📋 Inserimento Cookie Policy..."
npx prisma db execute --file ../scripts/seed-cookie-policy.sql --schema prisma/schema.prisma 2>&1
echo ""

echo "✅ Processo completato!"
echo ""
echo "🌐 I documenti sono ora disponibili su:"
echo "   Admin: http://localhost:5193/admin/legal-documents"
echo "   Pubblico: http://localhost:5193/legal"
