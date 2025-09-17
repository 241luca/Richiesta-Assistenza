#!/bin/bash

echo "🔍 ANALISI RESPONSEFORMATTER - Sistema Richiesta Assistenza"
echo "==========================================================="

echo ""
echo "📁 Controllo ROUTES per uso corretto ResponseFormatter..."
echo ""

# Cerco tutti i file .routes.ts
find backend/src/routes -name "*.routes.ts" -not -path "*/backup*" | while read file; do
    echo "📄 $file:"
    
    # Controllo se importa ResponseFormatter
    if grep -q "ResponseFormatter" "$file"; then
        echo "  ✅ Importa ResponseFormatter"
    else
        echo "  ❌ NON importa ResponseFormatter"
    fi
    
    # Controllo se usa res.json direttamente
    if grep -q "res\.json" "$file"; then
        echo "  ⚠️  Contiene res.json diretto"
        grep -n "res\.json" "$file" | head -3
    fi
    
    # Controllo se usa ResponseFormatter nei return
    if grep -q "ResponseFormatter\." "$file"; then
        echo "  ✅ Usa ResponseFormatter"
    else
        echo "  ❌ NON usa ResponseFormatter"
    fi
    
    echo ""
done

echo ""
echo "📁 Controllo SERVICES per uso ERRATO di ResponseFormatter..."
echo ""

# Cerco tutti i file .service.ts
find backend/src/services -name "*.service.ts" -not -path "*/backup*" | while read file; do
    echo "📄 $file:"
    
    # I services NON devono usare ResponseFormatter
    if grep -q "ResponseFormatter" "$file"; then
        echo "  ❌ ERRORE: Service usa ResponseFormatter (non deve!)"
        grep -n "ResponseFormatter" "$file"
    else
        echo "  ✅ Corretto: NON usa ResponseFormatter"
    fi
    
    echo ""
done
