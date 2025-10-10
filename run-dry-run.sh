#!/bin/bash

echo "🚀 Running Auto-Fix Dry-Run..."
echo ""

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza
node scripts/autofix-master.cjs --dry-run > autofix-dry-run-results.txt 2>&1

echo "✅ Dry-run completed!"
echo ""
echo "📄 Full results saved in: autofix-dry-run-results.txt"
echo ""
echo "📊 Summary:"
tail -30 autofix-dry-run-results.txt
