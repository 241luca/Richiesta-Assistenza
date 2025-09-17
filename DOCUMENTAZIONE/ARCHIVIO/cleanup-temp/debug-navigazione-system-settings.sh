#!/bin/bash

echo "🔧 DEBUG PROBLEMA NAVIGAZIONE IMPOSTAZIONI SISTEMA"
echo "=================================================="

echo "📝 1. Controlli da fare nella console del browser:"
echo ""
echo "   🌐 Apri Developer Tools (F12)"
echo "   📊 Vai nella tab 'Console'"
echo "   🔍 Cerca errori JavaScript quando clicchi il tab"
echo "   📡 Vai nella tab 'Network' e controlla se ci sono richieste fallite"
echo ""

echo "📝 2. Verifica URL e route:"
echo "   🔗 Quando clicchi il tab, l'URL dovrebbe cambiare"
echo "   📍 URL atteso: http://localhost:5193/admin/system-settings"
echo "   ⚠️ Se l'URL non cambia, c'è un problema di routing"
echo ""

echo "📝 3. Test manuale navigazione:"
echo "   🎯 Prova a navigare direttamente a: http://localhost:5193/admin/system-settings"
echo "   ✅ Se funziona → problema nel link/tab"
echo "   ❌ Se non funziona → problema nella route o componente"
echo ""

echo "📝 4. Controllo file di routing..."

# Controllo se esiste il file di routing
if [ -f "/Users/lucamambelli/Desktop/Richiesta-Assistenza/src/routes.tsx" ]; then
    echo "✅ File routes.tsx trovato"
    echo "🔍 Cerco la route system-settings..."
    if grep -q "system-settings" "/Users/lucamambelli/Desktop/Richiesta-Assistenza/src/routes.tsx"; then
        echo "✅ Route system-settings trovata"
    else
        echo "❌ Route system-settings NON trovata!"
    fi
else
    echo "❌ File routes.tsx non trovato!"
fi

echo ""
echo "💡 PROSSIMI PASSI:"
echo "   1. Controlla la console del browser per errori"
echo "   2. Verifica che l'URL cambi quando clicchi"
echo "   3. Se necessario, controlleremo il file di routing"

echo ""
echo "🚨 POSSIBILI CAUSE:"
echo "   - Errore JavaScript che blocca il clic"
echo "   - Route non configurata correttamente"
echo "   - Problema di autenticazione/autorizzazione"
echo "   - Componente che crashsa prima di renderizzarsi"
