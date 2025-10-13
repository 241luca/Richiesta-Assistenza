#!/bin/bash

# Script per installare ngrok su macOS
# Usage: ./install-ngrok.sh

echo "📦 Installazione ngrok"
echo "====================="
echo ""

# Metodo 1: Prova con Homebrew
if command -v brew &> /dev/null; then
    echo "✅ Homebrew trovato, installo ngrok..."
    brew install ngrok
    if [ $? -eq 0 ]; then
        echo "✅ ngrok installato con successo via Homebrew!"
        ngrok version
        exit 0
    fi
fi

# Metodo 2: Download diretto
echo "📥 Download diretto di ngrok..."
echo ""

# Determina architettura
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
    # Apple Silicon (M1/M2)
    DOWNLOAD_URL="https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-darwin-arm64.zip"
    echo "🖥️ Rilevato Apple Silicon (M1/M2)"
else
    # Intel
    DOWNLOAD_URL="https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-darwin-amd64.zip"
    echo "🖥️ Rilevato Intel Mac"
fi

# Crea directory temporanea
TEMP_DIR="/tmp/ngrok-install"
mkdir -p $TEMP_DIR
cd $TEMP_DIR

# Download ngrok
echo "📥 Download in corso..."
curl -L -o ngrok.zip $DOWNLOAD_URL

if [ $? -ne 0 ]; then
    echo "❌ Errore nel download di ngrok"
    exit 1
fi

# Estrai
echo "📦 Estrazione..."
unzip -o ngrok.zip

if [ $? -ne 0 ]; then
    echo "❌ Errore nell'estrazione"
    exit 1
fi

# Sposta in /usr/local/bin
echo "📁 Installazione..."
sudo mv ngrok /usr/local/bin/ngrok
sudo chmod +x /usr/local/bin/ngrok

# Verifica installazione
if command -v ngrok &> /dev/null; then
    echo ""
    echo "✅ ngrok installato con successo!"
    echo ""
    ngrok version
    echo ""
    echo "📝 Per usare ngrok:"
    echo "   ngrok http 3200"
    echo ""
    echo "🔑 Se richiede un token, registrati su:"
    echo "   https://dashboard.ngrok.com/signup"
    echo "   e poi esegui:"
    echo "   ngrok config add-authtoken YOUR_TOKEN"
else
    echo "❌ Installazione fallita"
    exit 1
fi

# Pulizia
rm -rf $TEMP_DIR

echo ""
echo "✅ Installazione completata!"
