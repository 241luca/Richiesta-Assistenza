#!/bin/bash

# ==========================================
# SCRIPT UPDATE RAPIDO
# ==========================================
# Scarica nuove immagini da GitHub e riavvia
# ==========================================

set -e

echo "================================================"
echo "🔄 UPDATE APPLICAZIONE"
echo "================================================"
echo ""

# ==========================================
# PULL NUOVE IMMAGINI
# ==========================================
echo "📥 Download nuove immagini..."
docker-compose -f docker-compose.prod.yml pull

echo "✅ Immagini aggiornate"
echo ""

# ==========================================
# RIAVVIO CONTAINER
# ==========================================
echo "🔄 Riavvio container..."
docker-compose -f docker-compose.prod.yml up -d

echo "✅ Container riavviati"
echo ""

# ==========================================
# MIGRAZIONI (se necessario)
# ==========================================
read -p "Eseguire migrazioni database? (s/n): " run_migrations
if [ "$run_migrations" = "s" ]; then
    echo "📊 Esecuzione migrazioni..."
    docker-compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy
    echo "✅ Migrazioni completate"
fi

echo ""

# ==========================================
# PULIZIA
# ==========================================
echo "🧹 Pulizia immagini vecchie..."
docker image prune -f
echo "✅ Pulizia completata"
echo ""

# ==========================================
# VERIFICA
# ==========================================
echo "🔍 Stato container:"
docker-compose -f docker-compose.prod.yml ps
echo ""

echo "✅ UPDATE COMPLETATO!"
echo ""
echo "📋 Vedi log con:"
echo "   docker-compose -f docker-compose.prod.yml logs -f"
