#!/bin/bash

echo "🔍 CERCO COMPONENTE API KEYS NEL FRONTEND"
echo "========================================"

cd /Users/lucamambelli/Desktop/richiesta-assistenza

echo "1. Cerco file con ApiKey nel nome:"
find src -name "*[Aa]pi*[Kk]ey*" -o -name "*api-key*" | head -10

echo ""
echo "2. Cerco nei file di admin:"
find src -path "*/admin/*" -name "*.tsx" -o -name "*.jsx" | xargs grep -l "GOOGLE_MAPS\|OPENAI" 2>/dev/null | head -5

echo ""
echo "3. Cerco dove si usa apiKey:"
grep -r "apiKey\|api-key" src --include="*.tsx" --include="*.jsx" | grep -i "card\|component" | head -5

echo ""
echo "========================================"
