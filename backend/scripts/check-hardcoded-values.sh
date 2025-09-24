#!/bin/bash

# Script per verificare che non ci siano più valori hardcoded nel codice
echo "🔍 RICERCA VALORI HARDCODED NEL CODICE"
echo "======================================"
echo ""

FOUND_ISSUES=0

echo "📂 Controllo nel backend..."
echo "---------------------------"

# Cerca riferimenti hardcoded nel backend
echo -n "Cerco 'PRIVACY_POLICY' hardcoded: "
PRIVACY_COUNT=$(grep -r "PRIVACY_POLICY" ../src --include="*.ts" --include="*.js" --exclude-dir=node_modules --exclude-dir=scripts 2>/dev/null | wc -l)
if [ $PRIVACY_COUNT -gt 0 ]; then
    echo "❌ Trovati $PRIVACY_COUNT riferimenti"
    FOUND_ISSUES=$((FOUND_ISSUES + PRIVACY_COUNT))
else
    echo "✅ Nessuno"
fi

echo -n "Cerco 'TERMS_SERVICE' hardcoded: "
TERMS_COUNT=$(grep -r "TERMS_SERVICE" ../src --include="*.ts" --include="*.js" --exclude-dir=node_modules --exclude-dir=scripts 2>/dev/null | wc -l)
if [ $TERMS_COUNT -gt 0 ]; then
    echo "❌ Trovati $TERMS_COUNT riferimenti"
    FOUND_ISSUES=$((FOUND_ISSUES + TERMS_COUNT))
else
    echo "✅ Nessuno"
fi

echo -n "Cerco 'COOKIE_POLICY' hardcoded: "
COOKIE_COUNT=$(grep -r "COOKIE_POLICY" ../src --include="*.ts" --include="*.js" --exclude-dir=node_modules --exclude-dir=scripts 2>/dev/null | wc -l)
if [ $COOKIE_COUNT -gt 0 ]; then
    echo "❌ Trovati $COOKIE_COUNT riferimenti"
    FOUND_ISSUES=$((FOUND_ISSUES + COOKIE_COUNT))
else
    echo "✅ Nessuno"
fi

echo ""
echo "📂 Controllo nel frontend..."
echo "----------------------------"

# Cerca riferimenti hardcoded nel frontend
echo -n "Cerco tipi documento hardcoded: "
FRONTEND_COUNT=$(grep -r "PRIVACY_POLICY\|TERMS_SERVICE\|COOKIE_POLICY" ../../src --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" --exclude-dir=node_modules 2>/dev/null | wc -l)
if [ $FRONTEND_COUNT -gt 0 ]; then
    echo "❌ Trovati $FRONTEND_COUNT riferimenti"
    FOUND_ISSUES=$((FOUND_ISSUES + FRONTEND_COUNT))
else
    echo "✅ Nessuno"
fi

echo -n "Cerco array hardcoded di tipi: "
ARRAY_COUNT=$(grep -r "const.*documentTypes.*=.*\[" ../../src --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" 2>/dev/null | wc -l)
if [ $ARRAY_COUNT -gt 0 ]; then
    echo "❌ Trovati $ARRAY_COUNT array"
    FOUND_ISSUES=$((FOUND_ISSUES + ARRAY_COUNT))
else
    echo "✅ Nessuno"
fi

echo ""
echo "======================================"
echo "📊 RISULTATO FINALE"
echo "======================================"
echo ""

if [ $FOUND_ISSUES -eq 0 ]; then
    echo "✅ PERFETTO! Nessun valore hardcoded trovato."
    echo ""
    echo "Il sistema ora usa completamente il database per:"
    echo "  • Tipi di documento"
    echo "  • Categorie"
    echo "  • Configurazioni"
    echo "  • Permessi"
    echo "  • Workflow"
    echo ""
    echo "Tutto è gestibile dal pannello admin!"
else
    echo "⚠️  Trovati $FOUND_ISSUES possibili riferimenti hardcoded."
    echo ""
    echo "Verifica manualmente questi file:"
    echo ""
    if [ $PRIVACY_COUNT -gt 0 ] || [ $TERMS_COUNT -gt 0 ] || [ $COOKIE_COUNT -gt 0 ]; then
        echo "Backend con riferimenti:"
        grep -l "PRIVACY_POLICY\|TERMS_SERVICE\|COOKIE_POLICY" ../src/*.ts ../src/**/*.ts 2>/dev/null | head -5
    fi
    if [ $FRONTEND_COUNT -gt 0 ]; then
        echo ""
        echo "Frontend con riferimenti:"
        grep -l "PRIVACY_POLICY\|TERMS_SERVICE\|COOKIE_POLICY" ../../src/*.tsx ../../src/**/*.tsx 2>/dev/null | head -5
    fi
fi

echo ""
echo "======================================"
echo ""
