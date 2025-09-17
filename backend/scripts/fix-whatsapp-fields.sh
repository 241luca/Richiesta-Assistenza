#!/bin/bash

echo "🔧 CORREZIONE CAMPI WHATSAPP ROUTES"
echo "===================================="
echo ""

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# Backup del file
echo "1️⃣ Backup del file..."
cp src/routes/whatsapp.routes.ts src/routes/whatsapp.routes.backup-$(date +%Y%m%d-%H%M%S).ts

echo ""
echo "2️⃣ Correzione dei campi nel file..."

# Sostituisci 'type' con 'mediaType' dove viene usato con whatsAppMessage
sed -i '' "s/by: \['type'/by: \['mediaType'/g" src/routes/whatsapp.routes.ts
sed -i '' "s/\.type/.mediaType/g" src/routes/whatsapp.routes.ts

# Correggi anche altri campi se necessario
sed -i '' "s/'type', 'status'/'mediaType', 'status'/g" src/routes/whatsapp.routes.ts
sed -i '' "s/'type'/'mediaType'/g" src/routes/whatsapp.routes.ts

echo ""
echo "3️⃣ Verifica delle modifiche..."
echo ""
echo "Occorrenze di 'type' rimaste (che potrebbero essere corrette):"
grep -n "type" src/routes/whatsapp.routes.ts | grep -v "mediaType" | head -10

echo ""
echo "✅ Correzioni applicate!"
echo ""
echo "Il backend dovrebbe riavviarsi automaticamente."
echo "Testa di nuovo le funzionalità WhatsApp."
