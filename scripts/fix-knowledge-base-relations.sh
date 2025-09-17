#!/bin/bash

echo "🔧 Fixing Prisma schema relations..."

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# Prima formattiamo automaticamente lo schema per aggiungere le relazioni mancanti
echo "1️⃣ Running Prisma format to fix relations..."
npx prisma format

echo ""
echo "2️⃣ Generating Prisma Client..."
npx prisma generate

echo ""
echo "3️⃣ Pushing schema to database..."
npx prisma db push --skip-generate

echo ""
echo "✅ Database relations fixed!"
echo ""
echo "📝 The KnowledgeBase table is now properly connected to:"
echo "   - User table (professional and uploader relations)"
echo "   - Subcategory table"
echo ""
echo "🚀 Now restart the backend:"
echo "   cd backend"
echo "   npm run dev"
