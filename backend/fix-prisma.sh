#!/bin/bash

echo "🔧 Fixing Prisma Client Generation..."

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

echo "1. Cleaning old files..."
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

echo "2. Installing Prisma..."
npm install @prisma/client prisma --save

echo "3. Generating Prisma Client..."
npx prisma generate

echo "4. Verifying generation..."
if [ -d "node_modules/.prisma/client" ]; then
    echo "✅ Prisma client generated successfully!"
    ls -la node_modules/.prisma/client/
else
    echo "❌ Prisma client generation failed!"
fi

echo "5. Testing connection..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => {
    console.log('✅ Database connection successful');
    const models = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('\$') && k !== 'constructor');
    console.log('📋 Models found:', models.length);
    if (models.length > 0) {
      console.log('First 5 models:', models.slice(0, 5).join(', '));
    }
    return prisma.\$disconnect();
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
"

echo "✅ Done!"
