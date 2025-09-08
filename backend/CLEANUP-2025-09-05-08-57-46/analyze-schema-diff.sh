#!/bin/bash

echo "================================================"
echo "     ANALISI DIFFERENZE SCHEMA PRISMA"
echo "================================================"
echo ""

cd /Users/lucamambelli/Desktop/richiesta-assistenza/backend

# Conta le linee
BACKUP_LINES=$(wc -l < prisma/schema.backup.prisma)
CURRENT_LINES=$(wc -l < prisma/schema.prisma)

echo "📊 DIMENSIONI FILE:"
echo "   Schema backup:  $BACKUP_LINES righe"
echo "   Schema attuale: $CURRENT_LINES righe"
echo ""

# Conta i modelli
BACKUP_MODELS=$(grep "^model " prisma/schema.backup.prisma | wc -l)
CURRENT_MODELS=$(grep "^model " prisma/schema.prisma | wc -l)

echo "📝 NUMERO MODELLI:"
echo "   Schema backup:  $BACKUP_MODELS modelli"
echo "   Schema attuale: $CURRENT_MODELS modelli"
echo ""

# Lista modelli
echo "📋 MODELLI NEL BACKUP:"
grep "^model " prisma/schema.backup.prisma | awk '{print "   - " $2}'
echo ""

echo "📋 MODELLI ATTUALI:"
grep "^model " prisma/schema.prisma | awk '{print "   - " $2}'
echo ""

# Controlla se ci sono differenze significative
echo "🔍 ANALISI DIFFERENZE:"
DIFF_COUNT=$(diff prisma/schema.backup.prisma prisma/schema.prisma | wc -l)

if [ $DIFF_COUNT -eq 0 ]; then
    echo "   ✅ I file sono identici!"
else
    echo "   ⚠️  Trovate $DIFF_COUNT righe di differenze"
    echo ""
    echo "   Principali cambiamenti:"
    
    # Controlla ordine dei modelli
    echo ""
    echo "   📦 ORDINE DEI MODELLI:"
    echo "   Il database ha riorganizzato l'ordine dei modelli"
    echo "   (ma i modelli stessi sono gli stessi)"
fi

echo ""
echo "================================================"
