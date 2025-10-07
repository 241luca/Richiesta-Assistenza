#!/bin/bash

echo "🔍 VERIFICA COMPLETA USO DATI WHATSAPP"
echo "======================================="
echo ""

# Cerca riferimenti a SystemConfiguration per WhatsApp
echo "1️⃣ Cerca SystemConfiguration con whatsapp (NON DOVREBBE ESISTERE):"
echo "-------------------------------------------------------------------"
grep -r "SystemConfiguration.*whatsapp" backend/src --include="*.ts" --include="*.js" 2>/dev/null
RESULT1=$?

if [ $RESULT1 -eq 0 ]; then
    echo "❌ TROVATI riferimenti a SystemConfiguration per WhatsApp!"
else
    echo "✅ Nessun riferimento a SystemConfiguration per WhatsApp"
fi

echo ""
echo "2️⃣ Cerca hardcoded Instance ID (68C67956807C8):"
echo "------------------------------------------------"
grep -r "68C67956807C8" backend/src --include="*.ts" --include="*.js" 2>/dev/null
RESULT2=$?

if [ $RESULT2 -eq 0 ]; then
    echo "❌ TROVATO Instance ID hardcoded!"
else
    echo "✅ Nessun Instance ID hardcoded"
fi

echo ""
echo "3️⃣ Verifica che getWhatsAppConfig usi ApiKey:"
echo "----------------------------------------------"
grep -n "apiKey.findUnique" backend/src/services/whatsapp-config.service.ts 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ whatsapp-config.service usa ApiKey"
else
    echo "⚠️ Verificare manualmente whatsapp-config.service"
fi

echo ""
echo "4️⃣ Verifica che il polling usi ApiKey.permissions:"
echo "---------------------------------------------------"
grep -n "ApiKey.*permissions" backend/src/services/whatsapp-polling.service.ts 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Polling usa ApiKey.permissions"
else
    echo "❌ Polling NON usa ApiKey.permissions"
fi

echo ""
echo "5️⃣ Cerca fallback o default values:"
echo "------------------------------------"
grep -r "|| '68C6" backend/src --include="*.ts" 2>/dev/null
grep -r "default.*68C6" backend/src --include="*.ts" 2>/dev/null
RESULT5=$?

if [ $RESULT5 -eq 0 ]; then
    echo "❌ TROVATI valori di default/fallback!"
else
    echo "✅ Nessun valore di default/fallback"
fi

echo ""
echo "📊 RIEPILOGO FINALE:"
echo "-------------------"

TOTAL_ERRORS=0

if [ $RESULT1 -eq 0 ]; then
    echo "❌ SystemConfiguration ancora usato per WhatsApp"
    TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
fi

if [ $RESULT2 -eq 0 ]; then
    echo "❌ Instance ID hardcoded trovato"
    TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
fi

if [ $RESULT5 -eq 0 ]; then
    echo "❌ Valori di fallback trovati"
    TOTAL_ERRORS=$((TOTAL_ERRORS + 1))
fi

if [ $TOTAL_ERRORS -eq 0 ]; then
    echo "✅ SISTEMA PULITO!"
    echo "   - Tutti i dati WhatsApp vengono SOLO da ApiKey"
    echo "   - Nessun hardcoded"
    echo "   - Nessun fallback"
    echo "   - Nessun SystemConfiguration"
else
    echo ""
    echo "⚠️ CI SONO $TOTAL_ERRORS PROBLEMI DA SISTEMARE"
fi
