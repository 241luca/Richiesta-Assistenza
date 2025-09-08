#!/bin/bash

# Backup della cartella quotes prima di eliminarla
echo "Creating backup of quotes folder..."
cp -r /Users/lucamambelli/Desktop/Richiesta-Assistenza/src/pages/quotes /Users/lucamambelli/Desktop/Richiesta-Assistenza/src/pages/quotes.backup-20250824

# Elimina la cartella quotes duplicata
echo "Removing duplicate quotes folder..."
rm -rf /Users/lucamambelli/Desktop/Richiesta-Assistenza/src/pages/quotes

echo "Done! Duplicate quotes folder removed."
