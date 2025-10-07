#!/bin/bash

echo "🔍 RICERCA COMPLETA DATI WHATSAPP"
echo "================================="
echo ""

DB_URL=$(grep DATABASE_URL /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/.env | cut -d '=' -f2- | tr -d '"')

echo "1️⃣ CERCA IN ApiKey (TUTTE le righe, anche maiuscolo/minuscolo):"
echo "---------------------------------------------------------------"
psql "$DB_URL" -c "
SELECT 
    id,
    service,
    LEFT(key, 30) || '...' as token_preview,
    permissions,
    \"isActive\"
FROM \"ApiKey\" 
WHERE LOWER(service) LIKE '%whatsapp%' 
   OR LOWER(service) LIKE '%sendapp%'
   OR LOWER(name) LIKE '%whatsapp%';
" 2>/dev/null

echo ""
echo "2️⃣ CERCA IN SystemConfiguration:"
echo "---------------------------------"
psql "$DB_URL" -c "
SELECT 
    key,
    LEFT(value, 50) || '...' as value_preview
FROM \"SystemConfiguration\" 
WHERE LOWER(key) LIKE '%whatsapp%' 
   OR LOWER(key) LIKE '%sendapp%'
   OR LOWER(value) LIKE '%68c67956807c8%';
" 2>/dev/null

echo ""
echo "3️⃣ TUTTI i servizi in ApiKey:"
echo "------------------------------"
psql "$DB_URL" -c "
SELECT DISTINCT service FROM \"ApiKey\" ORDER BY service;
" 2>/dev/null

echo ""
echo "4️⃣ Conta TUTTE le righe in ApiKey:"
echo "-----------------------------------"
psql "$DB_URL" -c "
SELECT COUNT(*) as total_rows FROM \"ApiKey\";
" 2>/dev/null

echo ""
echo "Se il token funziona, DEVE essere salvato da qualche parte!"
