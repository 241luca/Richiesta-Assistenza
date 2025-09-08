#!/bin/bash

echo "🔧 FIX SUBCATEGORY ROUTES"
echo "========================"

cd backend

echo "1. Aggiungo logging migliore all'errore:"
cat > /tmp/fix-subcategory-error.js << 'SCRIPT'
const fs = require('fs');

let content = fs.readFileSync('src/routes/subcategory.routes.ts', 'utf8');

// Cerca il catch con [object Object] e sostituiscilo con logging migliore
content = content.replace(
  /console\.error\(\[object Object\]\)/g,
  'console.error("Subcategory error:", error)'
);

// Se c'è un logger.error con solo error
content = content.replace(
  /logger\.error\(error\)/g,
  'logger.error("Subcategory error:", error)'
);

fs.writeFileSync('src/routes/subcategory.routes.ts', content);
console.log('✅ Logging migliorato');
SCRIPT

node /tmp/fix-subcategory-error.js

echo ""
echo "2. Controllo se ci sono problemi con Category o altre relazioni:"
grep -n "Category\|Subcategory" src/routes/subcategory.routes.ts | grep -v "// \|import\|model" | head -10

echo ""
echo "3. Fix possibili problemi di naming:"
# Cambia Category: in category: se c'è
sed -i '' 's/Category:/category:/g' src/routes/subcategory.routes.ts
sed -i '' 's/Category\./category\./g' src/routes/subcategory.routes.ts

echo ""
echo "4. Fix anche nel service:"
sed -i '' 's/Category:/category:/g' src/services/subcategory.service.ts
sed -i '' 's/Category\./category\./g' src/services/subcategory.service.ts

rm -f /tmp/fix-subcategory-error.js

echo ""
echo "========================"
echo "RIAVVIA IL BACKEND!"
echo ""
echo "Ora dovremmo vedere l'errore reale invece di [object Object]"
