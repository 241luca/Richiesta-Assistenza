#!/bin/bash

# Script per inizializzare il database SmartDocs

echo "🔧 Inizializzazione Database SmartDocs..."

# Controlla che Docker sia in esecuzione
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker non è in esecuzione. Avvia Docker e riprova."
  exit 1
fi

# Avvia solo il database
echo "📦 Avvio container PostgreSQL..."
docker-compose up -d smartdocs-db

# Attendi che il database sia pronto
echo "⏳ Attendo che il database sia pronto..."
sleep 5

# Esegui il file di init
echo "🗄️  Esecuzione script di inizializzazione..."
docker exec -i smartdocs-db psql -U smartdocs -d smartdocs < scripts/init-db.sql

echo "✅ Database inizializzato con successo!"
echo ""
echo "📊 Verifica connessione:"
echo "   docker exec -it smartdocs-db psql -U smartdocs -d smartdocs -c '\\dt smartdocs.*'"
