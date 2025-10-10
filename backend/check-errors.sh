#!/bin/bash
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend
npm run build 2>&1 | tee build-output.txt
echo "---SUMMARY---"
grep "Found .* errors" build-output.txt || echo "No errors found or build failed"
echo "---ERROR COUNT---"
grep -c "error TS" build-output.txt || echo "0"
