#!/bin/bash

echo "🔧 Sistemazione endpoint Legal Documents..."
echo ""

# Test l'endpoint attuale per vedere cosa succede
echo "📡 Test endpoint /api/public/legal/all:"
curl -s http://localhost:3200/api/public/legal/all | head -c 200

echo ""
echo ""

# Verifica che il database abbia documenti
echo "📊 Verifica presenza documenti nel database:"
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# Query per verificare se ci sono documenti
cat << 'EOF' > /tmp/check-legal.sql
SELECT COUNT(*) as total_documents FROM "LegalDocument";
EOF

npx prisma db execute --file=/tmp/check-legal.sql --schema=./prisma/schema.prisma 2>/dev/null || echo "Nessun documento trovato"

echo ""
echo "✅ Verifica completata!"
