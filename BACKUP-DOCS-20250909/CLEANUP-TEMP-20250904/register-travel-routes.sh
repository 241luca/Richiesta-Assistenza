#!/bin/bash

echo "🔧 REGISTRAZIONE TRAVEL ROUTES"
echo "=============================="

cd backend

echo "1. Verifica contenuto di travelCostRoutes.ts:"
grep -n "cost-settings" src/routes/travelCostRoutes.ts | head -5

echo ""
echo "2. Cerco dove registrare le route:"
find src -name "*.ts" -exec grep -l "app.use.*routes" {} \; | head -5

echo ""
echo "3. Registra le route in routes.ts:"

cat > /tmp/register-travel.js << 'SCRIPT'
const fs = require('fs');

// Cerca il file routes.ts o index.ts
let targetFile = null;
if (fs.existsSync('src/routes.ts')) {
  targetFile = 'src/routes.ts';
} else if (fs.existsSync('src/index.ts')) {
  targetFile = 'src/index.ts';
}

if (targetFile) {
  let content = fs.readFileSync(targetFile, 'utf8');
  
  // Aggiungi import se non c'è
  if (!content.includes('travelCostRoutes')) {
    // Trova dove aggiungere l'import
    const importRegex = /import.*from.*['"]\.\/routes\//;
    if (importRegex.test(content)) {
      content = content.replace(
        /(import.*from.*['"]\.\/routes\/[^'"]+['"];?)/,
        `$1\nimport travelCostRoutes from './routes/travelCostRoutes';`
      );
    }
    
    // Aggiungi app.use
    const useRegex = /app\.use\(['"]\/api\//;
    if (useRegex.test(content)) {
      content = content.replace(
        /(app\.use\(['"]\/api\/[^)]+\);)/,
        `$1\n  app.use('/api/travel', travelCostRoutes);`
      );
    }
    
    fs.writeFileSync(targetFile, content);
    console.log('✅ Route registrate in', targetFile);
  } else {
    console.log('⚠️ Route già registrate');
  }
} else {
  console.log('❌ Non trovo il file routes.ts o index.ts');
}
SCRIPT

node /tmp/register-travel.js

echo ""
echo "4. Verifica se ora sono registrate:"
grep -n "travelCost\|travel" src/routes.ts 2>/dev/null | head -10

rm -f /tmp/register-travel.js

echo ""
echo "=============================="
echo "RIAVVIA IL BACKEND!"
echo ""
echo "Le route travel dovrebbero ora essere registrate"
