#!/bin/bash

cd /Users/lucamambelli/Desktop/richiesta-assistenza/backend

# Trova npx
NPX_PATH=$(which npx 2>/dev/null)
if [ -z "$NPX_PATH" ]; then
    # Prova percorsi comuni
    if [ -f "/usr/local/bin/npx" ]; then
        NPX_PATH="/usr/local/bin/npx"
    elif [ -f "/opt/homebrew/bin/npx" ]; then
        NPX_PATH="/opt/homebrew/bin/npx"
    elif [ -f "$HOME/.npm-global/bin/npx" ]; then
        NPX_PATH="$HOME/.npm-global/bin/npx"
    else
        echo "npx non trovato, uso ts-node direttamente"
        # Prova ad usare ts-node direttamente
        if [ -f "node_modules/.bin/ts-node" ]; then
            node_modules/.bin/ts-node src/scripts/diagnose-dashboard.ts --create-test-data
        else
            echo "Installo ts-node..."
            npm install --save-dev ts-node
            node_modules/.bin/ts-node src/scripts/diagnose-dashboard.ts --create-test-data
        fi
        exit $?
    fi
fi

$NPX_PATH ts-node src/scripts/diagnose-dashboard.ts --create-test-data
