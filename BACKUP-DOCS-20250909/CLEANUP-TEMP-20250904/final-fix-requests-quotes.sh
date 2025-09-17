#!/bin/bash

echo "🔧 FIX DEFINITIVO REQUESTS E QUOTES"
echo "==================================="

cd backend

echo "1. Fix request.routes.ts..."
# Il problema è che category e subcategory devono essere Category e Subcategory (maiuscole!)
sed -i '' 's/category: true/Category: true/g' src/routes/request.routes.ts
sed -i '' 's/subcategory: true/Subcategory: true/g' src/routes/request.routes.ts
sed -i '' 's/quotes: {/Quote: {/g' src/routes/request.routes.ts
sed -i '' 's/attachments: true/RequestAttachment: true/g' src/routes/request.routes.ts
sed -i '' 's/user: true/User: true/g' src/routes/request.routes.ts

echo "✅ request.routes.ts corretto"

echo ""
echo "2. Fix quote.routes.ts..."
# Stesso problema in quote.routes.ts
sed -i '' 's/category: true/Category: true/g' src/routes/quote.routes.ts
sed -i '' 's/subcategory: true/Subcategory: true/g' src/routes/quote.routes.ts
sed -i '' 's/user: {/User: {/g' src/routes/quote.routes.ts

echo "✅ quote.routes.ts corretto"

echo ""
echo "3. Fix category.service.ts..."
# Nel _count deve essere AssistanceRequest non assistanceRequest
sed -i '' 's/assistanceRequest: true/AssistanceRequest: true/g' src/services/category.service.ts

echo "✅ category.service.ts corretto"

echo ""
echo "4. Verifica correzioni..."
echo "request.routes.ts:"
grep -n "Category: true" src/routes/request.routes.ts | head -2
echo ""
echo "quote.routes.ts:"
grep -n "Category: true" src/routes/quote.routes.ts | head -2
echo ""
echo "category.service.ts:"
grep -n "AssistanceRequest: true" src/services/category.service.ts | head -2

echo ""
echo "==================================="
echo "✅ CORREZIONI COMPLETATE!"
echo ""
echo "RIAVVIA IL BACKEND!"
echo ""
echo "Ricorda: TUTTI i nomi delle relazioni sono con la MAIUSCOLA:"
echo "- Category (non category)"
echo "- Subcategory (non subcategory)"
echo "- Quote (non quotes)"
echo "- User (non user)"
echo "- AssistanceRequest (non assistanceRequest)"
