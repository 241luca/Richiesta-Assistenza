#!/bin/bash

# Fix per evitare problemi con grep multipli
export GREP_OPTIONS=""

# Script semplificato per test
echo "Test versioning..."

cd backend 2>/dev/null || { echo "Backend non trovato"; exit 1; }

# Test semplice
echo "Cerco versioning in routes..."
VERSION_COUNT=0
for file in src/routes/*.ts; do
    if [ -f "$file" ]; then
        COUNT=$(grep -c "/v[0-9]" "$file" 2>/dev/null || echo 0)
        VERSION_COUNT=$((VERSION_COUNT + COUNT))
    fi
done
echo "Trovati $VERSION_COUNT riferimenti a versioning"

echo "Fine test"
