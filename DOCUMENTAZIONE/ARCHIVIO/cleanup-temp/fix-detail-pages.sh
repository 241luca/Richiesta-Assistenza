#!/bin/bash

echo "🔧 FIX DETTAGLIO RICHIESTE E PREVENTIVI"
echo "======================================="

cd backend

echo "1. Fix user -> User in quote.routes.ts..."
sed -i '' 's/user: true/User: true/g' src/routes/quote.routes.ts
sed -i '' 's/user: {/User: {/g' src/routes/quote.routes.ts

echo "✅ quote.routes.ts corretto"

echo ""
echo "2. Fix request.routes.ts per il dettaglio..."
sed -i '' 's/user: true/User: true/g' src/routes/request.routes.ts
sed -i '' 's/user: {/User: {/g' src/routes/request.routes.ts
sed -i '' 's/quotes: {/Quote: {/g' src/routes/request.routes.ts
sed -i '' 's/attachments: true/RequestAttachment: true/g' src/routes/request.routes.ts

echo "✅ request.routes.ts corretto"

echo ""
echo "3. Cerca e correggi tutti i file con pattern simili..."
find src/routes -name "*.ts" -exec sed -i '' 's/user: true/User: true/g' {} \;
find src/routes -name "*.ts" -exec sed -i '' 's/user: {/User: {/g' {} \;

echo "✅ Tutti i file routes corretti"

echo ""
echo "Verifica correzioni:"
echo "quote.routes.ts:"
grep -n "User: true" src/routes/quote.routes.ts | head -2
echo ""
echo "request.routes.ts:"
grep -n "User: true" src/routes/request.routes.ts | head -2

echo ""
echo "======================================="
echo "✅ CORREZIONI COMPLETATE!"
echo ""
echo "RIAVVIA IL BACKEND!"
echo ""
echo "Riepilogo nomi corretti:"
echo "- User (NON user)"
echo "- Quote (NON quotes)"
echo "- RequestAttachment (NON attachments)"
echo "- QuoteItem (NON quoteItems)"
