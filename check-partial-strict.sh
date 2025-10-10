#!/bin/bash
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend
echo "=== TEST PARZIALE STRICT MODE ===" > ../strict-partial-results.txt
echo "" >> ../strict-partial-results.txt
echo "Controlli attivi:" >> ../strict-partial-results.txt
echo "- noImplicitAny: true" >> ../strict-partial-results.txt
echo "- strictFunctionTypes: true" >> ../strict-partial-results.txt
echo "" >> ../strict-partial-results.txt
npx tsc --noEmit --noImplicitAny --strictFunctionTypes 2>&1 | head -100 >> ../strict-partial-results.txt
echo "" >> ../strict-partial-results.txt
echo "=== CONTEGGIO ERRORI ===" >> ../strict-partial-results.txt
npx tsc --noEmit --noImplicitAny --strictFunctionTypes 2>&1 | grep "error TS" | wc -l >> ../strict-partial-results.txt
