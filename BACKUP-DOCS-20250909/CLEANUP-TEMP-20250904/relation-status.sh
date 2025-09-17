#!/bin/bash

echo "📋 LISTA COMPLETA RELAZIONI: CON E SENZA @relation"
echo "=================================================="

cd backend

echo "ANALISI MODELLO AssistanceRequest:"
echo "-----------------------------------"

echo ""
echo "✅ CON @relation (nomi personalizzati minuscoli):"
echo ""
grep -A1 "@relation" prisma/schema.prisma | grep -B1 "AssistanceRequest" | grep -E "client|professional|subcategory" | sed 's/^/  /'

echo ""
echo "❌ SENZA @relation (nomi automatici MAIUSCOLI):"
echo ""
# Cerca le relazioni senza @relation
sed -n '/^model AssistanceRequest/,/^model /p' prisma/schema.prisma | grep -E "^\s+[A-Z]" | grep -v "@relation" | grep -v "AiConversation\|Request" | head -10 | sed 's/^/  /'

echo ""
echo "=================================================="
echo "RIEPILOGO PRATICO PER IL CODICE:"
echo ""
echo "Quando scrivi codice, usa:"
echo ""
echo "  include: {"
echo "    client: true,              // ✅ minuscolo (ha @relation)"
echo "    professional: true,        // ✅ minuscolo (ha @relation)"  
echo "    subcategory: true,         // ✅ minuscolo (ha @relation)"
echo "    Category: true,            // ❌ MAIUSCOLO (senza @relation)"
echo "    Quote: true,               // ❌ MAIUSCOLO (senza @relation)"
echo "    Message: true,             // ❌ MAIUSCOLO (senza @relation)"
echo "    RequestAttachment: true    // ❌ MAIUSCOLO (senza @relation)"
echo "  }"
echo ""
echo "=================================================="
echo ""
echo "PIANO:"
echo "1. Sistemiamo prima le cose che non funzionano con questi nomi"
echo "2. Poi aggiungiamo @relation gradualmente dove manca"
echo ""
echo "Per esempio, quando sistemiamo Quote, aggiungiamo:"
echo "  quotes Quote[] @relation(\"request_quotes\")"
echo "E poi usiamo 'quotes' minuscolo nel codice"
