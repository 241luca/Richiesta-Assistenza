#!/bin/bash

echo "📦 Setup TinyMCE self-hosted..."

# Crea la directory per TinyMCE se non esiste
mkdir -p public/tinymce

# Copia i file di TinyMCE
cp -r node_modules/tinymce/* public/tinymce/

echo "✅ TinyMCE copiato in public/tinymce"
echo "🔄 Ora riavvia il server di sviluppo"
