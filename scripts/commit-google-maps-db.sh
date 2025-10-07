#!/bin/bash
# Script per commit modifiche Google Maps API Key dal Database
# Versione: 5.1.2
# Data: 3 Ottobre 2025

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza

# Rimuovi lock se esiste
rm -f .git/index.lock

# Aggiungi tutti i file
git add -A

# Mostra stato
echo "📊 File modificati:"
git status --short

# Commit
git commit -m "feat(config): Google Maps API key caricata da database

BREAKING CHANGE: Rimossa dipendenza da .env per Google Maps

✨ Features:
- Nuovo endpoint pubblico GET /api/public/config/google-maps-key
- GoogleMapsContext aggiornato per caricare da database
- Servizio googleMapsConfig per gestione centralizzata
- Hook useGoogleMaps per uso facilitato nei componenti

🔧 Technical:
- Backend: public.routes.ts (+43 righe)
- Frontend: GoogleMapsContext.tsx (refactored)
- Nuovi file: googleMapsConfig.ts, useGoogleMaps.ts
- Documentazione completa e guida test

📊 Benefits:
- Nessuna dipendenza da .env
- Cambio API key senza rideploy
- Sistema più sicuro e centralizzato
- Gestione multi-ambiente semplificata

📚 Docs:
- DOCUMENTAZIONE/REPORT-SESSIONI/2025-10-03-google-maps-db-config.md
- DOCUMENTAZIONE/ATTUALE/04-GUIDE/TEST-GOOGLE-MAPS-DB.md

Version: 5.1.2
Closes #XXX"

# Push
echo ""
echo "🚀 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Done! Verificare su GitHub che il push sia riuscito."
