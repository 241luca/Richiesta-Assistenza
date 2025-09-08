#!/bin/bash

echo "🔍 DEBUG: Errore 'Cannot Patch Request'"
echo "======================================"

echo ""
echo "⚠️  ERRORE IDENTIFICATO:"
echo "Frontend mostra: 'cannot patch request'"
echo "Backend: nessun errore nei log"
echo ""

echo "🔧 DEBUG APPLICATO:"
echo "✅ Aggiunto console.log dettagliato in travelApi.ts"
echo "✅ Ora vedrai esattamente cosa viene inviato e ricevuto"
echo ""

echo "📋 PROCEDURA DEBUG:"
echo "1. Ricarica la pagina profilo (per caricare il nuovo codice)"
echo "2. Apri Console del browser (F12 → Console)"
echo "3. Vai a Profilo → Viaggi"
echo "4. Compila form e clicca Salva"
echo "5. Controlla console per vedere:"
echo ""

echo "🎯 LOG ATTESI IN CONSOLE:"
echo "🔍 TravelAPI: updateWorkAddress chiamata con: {useResidenceAsWorkAddress: true, travelRatePerKm: 50, ...}"
echo "✅ TravelAPI: updateWorkAddress risposta: {data: {...}, message: '...'}"
echo ""

echo "❌ SE VEDI ERRORE IN CONSOLE:"
echo "❌ TravelAPI: updateWorkAddress errore: [dettagli errore]"
echo ""

echo "🚨 POSSIBILI CAUSE:"
echo "A) Errore di rete/timeout"
echo "B) Autenticazione scaduta (401 Unauthorized)"
echo "C) CORS issues"
echo "D) Backend non raggiungibile"
echo "E) Payload malformato"
echo ""

echo "💡 SOLUZIONI PER CAUSE COMUNI:"
echo "- Se 401: Logout + Login per refresh token"
echo "- Se CORS: Riavvia backend"
echo "- Se timeout: Controlla connessione di rete"
echo "- Se payload: Verranno mostrati i dati inviati"
echo ""

echo "🎯 ESEGUI ADESSO:"
echo "1. Ricarica pagina profilo"
echo "2. Apri F12 → Console"
echo "3. Testa salvataggio viaggi"
echo "4. Leggi i log in console"
echo "5. Riporta quello che vedi!"
