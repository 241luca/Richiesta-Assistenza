#!/bin/bash

echo "🔧 FIX PRISMA CLIENT"
echo "===================="

cd backend

echo "1️⃣ Generazione Prisma Client..."
npx prisma generate

echo -e "\n2️⃣ Verifica schema database..."
npx prisma db pull

echo -e "\n3️⃣ Test connessione database..."
npx prisma db execute --stdin << EOF
SELECT COUNT(*) as total_tables FROM information_schema.tables 
WHERE table_schema = 'public';
EOF

echo -e "\n✅ Prisma Client rigenerato"
