#!/bin/bash

echo "🔧 Aggiunta tabelle professionisti al database..."

# Esegui la migrazione SQL
psql $DATABASE_URL < add-professional-tables.sql

if [ $? -eq 0 ]; then
    echo "✅ Tabelle aggiunte con successo!"
    echo ""
    echo "Tabelle create:"
    echo "- ProfessionalPricing (tariffe)"
    echo "- ProfessionalAiSettings (impostazioni AI per sottocategoria)"
    echo "- ProfessionalSkill (competenze)"
    echo "- ProfessionalCertification (certificazioni)"
    echo ""
    echo "Aggiunto campo experienceLevel a ProfessionalUserSubcategory"
else
    echo "❌ Errore durante l'aggiunta delle tabelle"
    exit 1
fi
