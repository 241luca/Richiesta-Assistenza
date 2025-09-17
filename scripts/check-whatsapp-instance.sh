#!/bin/bash

# Script per verificare e sistemare l'Instance ID di WhatsApp
echo "🔍 Verifica Instance ID WhatsApp"
echo "================================"
echo ""

# Connessione al database
DB_URL=$(grep DATABASE_URL /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/.env | cut -d '=' -f2- | tr -d '"')

if [ -z "$DB_URL" ]; then
    echo "❌ DATABASE_URL non trovato nel file .env"
    exit 1
fi

echo "📊 Controllo nel database..."
echo ""

# Verifica se l'instance ID esiste
INSTANCE_ID=$(psql "$DB_URL" -t -c "SELECT value FROM \"SystemConfiguration\" WHERE key='whatsapp_instance_id';" 2>/dev/null | tr -d ' ')

if [ -z "$INSTANCE_ID" ] || [ "$INSTANCE_ID" = "" ]; then
    echo "❌ Instance ID non trovato nel database!"
    echo ""
    echo "🔧 SOLUZIONE:"
    echo "1. Vai su http://localhost:5193/admin/whatsapp"
    echo "2. Nel tab 'Connessione', genera un nuovo QR Code"
    echo "3. Scansiona il QR con WhatsApp"
    echo "4. L'Instance ID verrà salvato automaticamente"
    echo ""
    echo "Se hai già connesso WhatsApp ma continua a dare errore,"
    echo "potrebbe essere necessario disconnettere e riconnettere."
else
    echo "✅ Instance ID trovato: $INSTANCE_ID"
    echo ""
    echo "Se continui a vedere l'errore, potrebbe essere che:"
    echo "1. L'Instance ID è scaduto"
    echo "2. La connessione WhatsApp è stata persa"
    echo ""
    echo "Prova a:"
    echo "1. Andare su http://localhost:5193/admin/whatsapp"
    echo "2. Cliccare 'Disconnetti' (se disponibile)"
    echo "3. Generare un nuovo QR Code"
    echo "4. Riconnettersi"
fi

echo ""
echo "📝 Altri dati WhatsApp nel database:"
echo "------------------------------------"

# Mostra tutte le configurazioni WhatsApp
psql "$DB_URL" -c "SELECT key, LEFT(value, 50) as value_preview, \"updatedAt\" FROM \"SystemConfiguration\" WHERE key LIKE '%whatsapp%' ORDER BY key;" 2>/dev/null

echo ""
echo "✅ Verifica completata!"
