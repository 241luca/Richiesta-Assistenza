#!/bin/bash
echo "=== Controllo tabelle Payment nel database ==="

# Controlla se esistono le tabelle nel file schema.prisma
echo -e "\n📋 Verifico schema.prisma..."

# Cerca model ApiKey
if grep -q "model ApiKey" /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/prisma/schema.prisma; then
    echo "✅ model ApiKey TROVATO"
    grep -A 5 "model ApiKey" /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/prisma/schema.prisma | head -10
else
    echo "❌ model ApiKey NON TROVATO"
fi

# Cerca model Payment
if grep -q "model Payment" /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/prisma/schema.prisma; then
    echo -e "\n✅ model Payment TROVATO"
    grep -A 5 "model Payment" /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/prisma/schema.prisma | head -10
else
    echo "❌ model Payment NON TROVATO"
fi

# Cerca model PaymentSplit
if grep -q "model PaymentSplit" /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/prisma/schema.prisma; then
    echo -e "\n✅ model PaymentSplit TROVATO"
else
    echo -e "\n❌ model PaymentSplit MANCANTE - DA AGGIUNGERE"
fi

# Cerca model ProfessionalPaymentSettings
if grep -q "model ProfessionalPaymentSettings" /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/prisma/schema.prisma; then
    echo "✅ model ProfessionalPaymentSettings TROVATO"
else
    echo "❌ model ProfessionalPaymentSettings MANCANTE - DA AGGIUNGERE"
fi

# Conta il numero di righe nel file
echo -e "\n📊 Info file:"
wc -l /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/prisma/schema.prisma

echo -e "\n✅ Verifica completata"
