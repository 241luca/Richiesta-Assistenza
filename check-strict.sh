#!/bin/bash
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend
echo "=== BACKEND STRICT CHECK ===" > ../strict-check-results.txt
npx tsc --noEmit --strict 2>&1 | head -150 >> ../strict-check-results.txt
echo "" >> ../strict-check-results.txt
echo "=== CONTEGGIO ERRORI ===" >> ../strict-check-results.txt
npx tsc --noEmit --strict 2>&1 | grep "error TS" | wc -l >> ../strict-check-results.txt
