#!/bin/bash
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

echo "📝 Formattazione schema Prisma..."
/usr/local/bin/npx prisma format

echo ""
echo "🔨 Generazione Prisma Client..."
/usr/local/bin/npx prisma generate

echo ""
echo "✅ Fatto! Schema formattato e client generato."
