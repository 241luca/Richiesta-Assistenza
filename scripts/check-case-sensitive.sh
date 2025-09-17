#!/bin/bash

echo "🔍 VERIFICA CASE-SENSITIVE PROBLEMA"
echo "===================================="
echo ""

DB_URL=$(grep DATABASE_URL /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/.env | cut -d '=' -f2- | tr -d '"')

echo "1️⃣ Cerca WHATSAPP (maiuscolo):"
psql "$DB_URL" -c "SELECT id, service, LEFT(key, 20) || '...' as token, permissions FROM \"ApiKey\" WHERE service = 'WHATSAPP';" 2>/dev/null

echo ""
echo "2️⃣ Cerca whatsapp (minuscolo):"
psql "$DB_URL" -c "SELECT id, service, LEFT(key, 20) || '...' as token, permissions FROM \"ApiKey\" WHERE service = 'whatsapp';" 2>/dev/null

echo ""
echo "3️⃣ TUTTI i service (per vedere esattamente come sono salvati):"
psql "$DB_URL" -c "SELECT DISTINCT service FROM \"ApiKey\";" 2>/dev/null

echo ""
echo "Se c'è WHATSAPP maiuscolo ma il codice cerca whatsapp minuscolo,"
echo "ecco perché non trova niente!"
