#!/bin/bash

echo "Verifica metodi in payment.service.ts"
echo "======================================"

FILE="/Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/src/services/payment.service.ts"

if [ ! -f "$FILE" ]; then
    echo "❌ ERRORE: File non trovato!"
    exit 1
fi

echo "File trovato: $FILE"
echo ""

# Metodi da cercare
METHODS=(
    "getPayments"
    "getPaymentById" 
    "getAdminStats"
    "getProfessionalStats"
    "getProfessionalPayments"
    "requestPayout"
    "exportProfessionalPayments"
)

echo "Ricerca metodi:"
for method in "${METHODS[@]}"; do
    if grep -q "async $method(" "$FILE"; then
        echo "✅ $method: TROVATO"
        # Mostra la riga
        grep -n "async $method(" "$FILE" | head -1
    else
        echo "❌ $method: MANCANTE"
    fi
done

echo ""
echo "Totale righe nel file:"
wc -l "$FILE"
