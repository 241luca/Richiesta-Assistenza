#!/bin/bash

echo "🔧 Aggiungendo WhatsApp alle API Keys..."

cd backend

# Esegui lo script TypeScript
npx ts-node src/scripts/seed-whatsapp-apikey.ts

echo "✅ Fatto! Ora ricarica la pagina API Keys nel browser."
