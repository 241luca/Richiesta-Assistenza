#!/bin/bash

echo "🧹 PULIZIA COMPLETA WHATSAPP"
echo "=============================="
echo ""

# 1. Ferma il backend se è in esecuzione
echo "1. Fermando eventuali processi..."
pkill -f "node.*backend" 2>/dev/null || true
sleep 2

# 2. Elimina TUTTA la sessione WhatsApp
echo "2. Eliminando sessione WhatsApp..."
rm -rf backend/tokens/assistenza-wpp
rm -rf backend/tokens/assistenza
rm -rf backend/.wppconnect
rm -rf .wppconnect
echo "   ✅ Sessioni eliminate"

# 3. Pulisci i file temporanei
echo "3. Pulizia file temporanei..."
rm -f backend/session.data.json
rm -f backend/whatsapp-session.json
rm -rf backend/temp
echo "   ✅ File temporanei eliminati"

# 4. Crea cartella tokens pulita
echo "4. Ricreando cartella tokens..."
mkdir -p backend/tokens
echo "   ✅ Cartella tokens ricreata"

echo ""
echo "✅ PULIZIA COMPLETATA!"
echo ""
echo "PROSSIMI PASSI:"
echo "1. Riavvia il backend: cd backend && npm run dev"
echo "2. Vai su: http://localhost:5193/admin/whatsapp"
echo "3. Ora dovrebbe mostrarti il QR code da scansionare"
echo ""
echo "Se ancora non funziona, esegui:"
echo "  node force-disconnect-whatsapp.mjs"
