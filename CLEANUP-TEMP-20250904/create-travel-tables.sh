#!/bin/bash

# Script per creare le tabelle del sistema tariffe trasferimento
# Data: 31/08/2025

echo "==========================================="
echo "🚀 CREAZIONE TABELLE TARIFFE TRASFERIMENTO"
echo "==========================================="

# Carica le variabili d'ambiente
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Verifica che DATABASE_URL sia impostato
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Errore: DATABASE_URL non trovato nel file .env"
    exit 1
fi

echo "📊 Connessione al database..."
echo "🔧 Creazione tabelle travel_cost..."

# Esegui il file SQL
psql "$DATABASE_URL" < create-travel-cost-tables.sql

if [ $? -eq 0 ]; then
    echo "✅ Tabelle create con successo!"
    
    # Verifica che le tabelle siano state create
    echo ""
    echo "🔍 Verifica tabelle create:"
    psql "$DATABASE_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'travel_%' ORDER BY table_name;"
    
    echo ""
    echo "✨ Sistema tariffe trasferimento pronto all'uso!"
    echo ""
    echo "📋 Prossimi passi:"
    echo "1. Riavvia il backend se è in esecuzione"
    echo "2. Vai nel profilo come professionista"
    echo "3. Configura le tue tariffe nella sezione 'Viaggi e Distanze'"
    echo ""
else
    echo "❌ Errore durante la creazione delle tabelle"
    echo "Verifica la connessione al database e riprova"
    exit 1
fi

echo "==========================================="
echo "✅ OPERAZIONE COMPLETATA"
echo "==========================================="