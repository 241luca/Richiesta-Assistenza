#!/bin/bash

# Script per installare whatsapp-web.js e sistemare il sistema WhatsApp

echo "🚀 Installazione dipendenze WhatsApp..."

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# Installa whatsapp-web.js
npm install whatsapp-web.js qrcode

# Installa tipi TypeScript
npm install --save-dev @types/qrcode

echo "✅ Dipendenze installate"
echo ""
echo "🔄 Riavvia il backend con: npm run dev"
echo ""
echo "📱 Poi vai su http://localhost:5193/admin/whatsapp"
