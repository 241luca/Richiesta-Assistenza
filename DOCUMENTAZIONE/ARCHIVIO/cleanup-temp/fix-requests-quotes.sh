#!/bin/bash

echo "🔧 FIX PAGINE RICHIESTE E PREVENTIVI"
echo "===================================="

cd backend

echo "1. Fix requests.routes.ts..."
if [ -f src/routes/requests.routes.ts ]; then
    # Sostituisci i nomi sbagliati con quelli giusti
    sed -i '' 's/client:/User_AssistanceRequest_clientIdToUser:/g' src/routes/requests.routes.ts
    sed -i '' 's/professional:/User_AssistanceRequest_professionalIdToUser:/g' src/routes/requests.routes.ts
    sed -i '' 's/category:/Category:/g' src/routes/requests.routes.ts
    sed -i '' 's/subcategory:/Subcategory:/g' src/routes/requests.routes.ts
    
    # Fix accesso ai dati
    sed -i '' 's/\.client\./\.User_AssistanceRequest_clientIdToUser\./g' src/routes/requests.routes.ts
    sed -i '' 's/\.professional\./\.User_AssistanceRequest_professionalIdToUser\./g' src/routes/requests.routes.ts
    sed -i '' 's/\.category\./\.Category\./g' src/routes/requests.routes.ts
    sed -i '' 's/\.subcategory\./\.Subcategory\./g' src/routes/requests.routes.ts
    
    echo "✅ requests.routes.ts corretto"
else
    echo "⚠️ requests.routes.ts non trovato"
fi

echo ""
echo "2. Fix quotes.routes.ts..."
if [ -f src/routes/quotes.routes.ts ]; then
    # Fix relazioni Quote
    sed -i '' 's/assistanceRequest:/AssistanceRequest:/g' src/routes/quotes.routes.ts
    sed -i '' 's/professional:/User:/g' src/routes/quotes.routes.ts  # Nel Quote il professional è User
    sed -i '' 's/user:/User:/g' src/routes/quotes.routes.ts
    
    # Fix accesso ai dati
    sed -i '' 's/\.assistanceRequest\./\.AssistanceRequest\./g' src/routes/quotes.routes.ts
    sed -i '' 's/\.professional\./\.User\./g' src/routes/quotes.routes.ts
    
    echo "✅ quotes.routes.ts corretto"
else
    echo "⚠️ quotes.routes.ts non trovato"
fi

echo ""
echo "3. Cerco altri file correlati..."
find src -name "*request*.ts" -o -name "*quote*.ts" | while read file; do
    echo "   Controllo $file..."
    # Applica le stesse correzioni
    sed -i '' 's/client:/User_AssistanceRequest_clientIdToUser:/g' "$file" 2>/dev/null
    sed -i '' 's/professional:/User_AssistanceRequest_professionalIdToUser:/g' "$file" 2>/dev/null
    sed -i '' 's/assistanceRequest:/AssistanceRequest:/g' "$file" 2>/dev/null
done

echo ""
echo "===================================="
echo "✅ CORREZIONI COMPLETATE!"
echo ""
echo "Riavvia il backend e prova:"
echo "- Pagina Richieste"
echo "- Pagina Preventivi"
