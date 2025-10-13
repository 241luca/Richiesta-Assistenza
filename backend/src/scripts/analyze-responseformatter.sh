#!/bin/bash

# Script di analisi utilizzo ResponseFormatter
# Data: 27 Settembre 2025

echo "📊 ANALISI UTILIZZO RESPONSEFORMATTER"
echo "====================================="
echo ""

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ROUTES_DIR="/Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/src/routes"

# Conta totale file routes
TOTAL_FILES=$(find "$ROUTES_DIR" -name "*.ts" -type f | wc -l | tr -d ' ')
echo "📁 File totali nelle routes: $TOTAL_FILES"
echo ""

# Conta file che usano ResponseFormatter
FILES_WITH_FORMATTER=$(grep -l "ResponseFormatter" "$ROUTES_DIR"/*.ts 2>/dev/null | wc -l | tr -d ' ')
echo "✅ File che usano ResponseFormatter: $FILES_WITH_FORMATTER"

# Conta file che NON usano ResponseFormatter
FILES_WITHOUT_FORMATTER=$((TOTAL_FILES - FILES_WITH_FORMATTER))
echo "❌ File che NON usano ResponseFormatter: $FILES_WITHOUT_FORMATTER"

# Percentuale di utilizzo
if [ $TOTAL_FILES -gt 0 ]; then
    PERCENTAGE=$(echo "scale=1; $FILES_WITH_FORMATTER * 100 / $TOTAL_FILES" | bc)
    echo "📈 Percentuale di utilizzo: ${PERCENTAGE}%"
fi

echo ""
echo "================================"
echo "📋 FILE CHE NON USANO RESPONSEFORMATTER:"
echo "================================"
echo ""

COUNT=1
for file in "$ROUTES_DIR"/*.ts; do
    if ! grep -q "ResponseFormatter" "$file" 2>/dev/null; then
        filename=$(basename "$file")
        echo -e "${RED}❌ $COUNT. $filename${NC}"
        
        # Mostra come formatta le risposte
        echo "   Metodi di risposta trovati:"
        grep -o "res\.\(json\|status\|send\)" "$file" | sort | uniq -c | while read count method; do
            echo "      - $method: $count volte"
        done
        
        # Mostra esempio di risposta
        echo "   Esempio risposta:"
        grep -A 2 "res.json\|res.status" "$file" | head -3 | sed 's/^/      /'
        echo ""
        
        COUNT=$((COUNT + 1))
    fi
done

echo ""
echo "================================"
echo "📊 ANALISI PATTERN DI RISPOSTA:"
echo "================================"
echo ""

# Analizza i pattern usati nei file SENZA ResponseFormatter
echo "Pattern trovati nei file SENZA ResponseFormatter:"
for file in "$ROUTES_DIR"/*.ts; do
    if ! grep -q "ResponseFormatter" "$file" 2>/dev/null; then
        grep -ho "res\.\(json\|status\).*{" "$file" 2>/dev/null
    fi
done | sort | uniq -c | sort -rn | head -10

echo ""
echo "================================"
echo "✅ ESEMPIO CORRETTO (con ResponseFormatter):"
echo "================================"
echo ""

# Mostra esempio corretto
if [ -f "$ROUTES_DIR/auth.routes.ts" ]; then
    echo "Da auth.routes.ts:"
    grep -A 3 "ResponseFormatter\.\(success\|error\)" "$ROUTES_DIR/auth.routes.ts" | head -8
fi

echo ""
echo "================================"
echo "🔍 ANALISI CONSISTENZA:"
echo "================================"
echo ""

# Conta diversi pattern di risposta
SUCCESS_PATTERN_1=$(grep -r "success: true" "$ROUTES_DIR" | wc -l | tr -d ' ')
SUCCESS_PATTERN_2=$(grep -r "ResponseFormatter.success" "$ROUTES_DIR" | wc -l | tr -d ' ')
ERROR_PATTERN_1=$(grep -r "success: false" "$ROUTES_DIR" | wc -l | tr -d ' ')
ERROR_PATTERN_2=$(grep -r "ResponseFormatter.error" "$ROUTES_DIR" | wc -l | tr -d ' ')

echo "Pattern 'success: true' (manuale): $SUCCESS_PATTERN_1"
echo "Pattern 'ResponseFormatter.success': $SUCCESS_PATTERN_2"
echo "Pattern 'success: false' (manuale): $ERROR_PATTERN_1"
echo "Pattern 'ResponseFormatter.error': $ERROR_PATTERN_2"

echo ""
echo "================================"
echo "⚠️ RACCOMANDAZIONI:"
echo "================================"
echo ""

if [ $FILES_WITHOUT_FORMATTER -gt 0 ]; then
    echo -e "${YELLOW}⚠️ Ci sono $FILES_WITHOUT_FORMATTER file che NON usano ResponseFormatter${NC}"
    echo -e "${YELLOW}   Questo può causare INCONSISTENZA nelle risposte API${NC}"
    echo ""
    echo "📝 AZIONE RICHIESTA:"
    echo "   1. Aggiornare tutti i file per usare ResponseFormatter"
    echo "   2. Rimuovere pattern manuali come {success: true/false, ...}"
    echo "   3. Usare sempre:"
    echo "      - ResponseFormatter.success(data, message)"
    echo "      - ResponseFormatter.error(message, code, details)"
else
    echo -e "${GREEN}✅ OTTIMO! Tutti i file usano ResponseFormatter${NC}"
fi

echo ""
echo "================================"
echo "📈 RIEPILOGO FINALE:"
echo "================================"
echo ""

# Calcola consistency score
CONSISTENCY_SCORE=$((SUCCESS_PATTERN_2 * 100 / (SUCCESS_PATTERN_1 + SUCCESS_PATTERN_2)))

echo "🎯 Consistency Score: ${CONSISTENCY_SCORE}%"
echo ""

if [ $CONSISTENCY_SCORE -lt 50 ]; then
    echo -e "${RED}❌ BASSA CONSISTENZA - Azione urgente richiesta${NC}"
elif [ $CONSISTENCY_SCORE -lt 80 ]; then
    echo -e "${YELLOW}⚠️ MEDIA CONSISTENZA - Miglioramenti necessari${NC}"
else
    echo -e "${GREEN}✅ ALTA CONSISTENZA - Sistema ben strutturato${NC}"
fi

echo ""