#!/bin/bash

echo "🔧 FIX DETTAGLIO RICHIESTA E DOWNLOAD PDF"
echo "========================================"

cd backend

echo "1. Cerca file per dettaglio richiesta..."
if [ -f src/routes/request.routes.ts ]; then
    echo "Fix GET /requests/:id in request.routes.ts..."
    
    # Fix per il dettaglio (findUnique)
    sed -i '' 's/client: true/User_AssistanceRequest_clientIdToUser: true/g' src/routes/request.routes.ts
    sed -i '' 's/professional: true/User_AssistanceRequest_professionalIdToUser: true/g' src/routes/request.routes.ts
    sed -i '' 's/category: true/Category: true/g' src/routes/request.routes.ts
    sed -i '' 's/subcategory: true/Subcategory: true/g' src/routes/request.routes.ts
    
    echo "✅ Dettaglio richiesta corretto"
fi

echo ""
echo "2. Cerca file per download PDF preventivi..."
# Probabilmente in quote.routes.ts o quote-pdf.routes.ts
if [ -f src/routes/quote-pdf.routes.ts ]; then
    echo "Fix quote-pdf.routes.ts..."
    sed -i '' 's/user: true/User: true/g' src/routes/quote-pdf.routes.ts
    sed -i '' 's/assistanceRequest:/AssistanceRequest:/g' src/routes/quote-pdf.routes.ts
    echo "✅ quote-pdf.routes.ts corretto"
fi

# Cerca endpoint PDF in quote.routes.ts
if grep -q "pdf" src/routes/quote.routes.ts; then
    echo "Fix PDF endpoint in quote.routes.ts..."
    sed -i '' 's/\.user\./\.User\./g' src/routes/quote.routes.ts
    sed -i '' 's/\.assistanceRequest\./\.AssistanceRequest\./g' src/routes/quote.routes.ts
fi

echo ""
echo "3. Cerca tutti i file con 'pdf' nel nome..."
find src -name "*pdf*.ts" | while read file; do
    echo "   Controllo $file..."
    sed -i '' 's/user:/User:/g' "$file" 2>/dev/null
    sed -i '' 's/assistanceRequest:/AssistanceRequest:/g' "$file" 2>/dev/null
    sed -i '' 's/quoteItems:/QuoteItem:/g' "$file" 2>/dev/null
done

echo ""
echo "========================================"
echo "✅ CORREZIONI COMPLETATE!"
echo ""
echo "Prova ora:"
echo "1. Clicca su una richiesta per vedere il dettaglio"
echo "2. Vai ai preventivi e prova a scaricare un PDF"
echo ""
echo "Se ci sono ancora errori, dimmi l'errore esatto!"
