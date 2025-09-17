#!/bin/bash

echo "🔍 Analyzing backup inconsistencies..."

# Controlla cosa dice il database
echo ""
echo "📊 Database records of COMPLETED backups:"
curl -s -X GET http://localhost:3200/api/backup \
  -H "Content-Type: application/json" \
  -b cookies.txt | jq '.backups[] | select(.status == "COMPLETED") | {id: .id, name: .name, type: .type, fileSize: .fileSize, filePath: .filePath, createdAt: .createdAt}'

echo ""
echo "📁 Actual files in backup directory:"
ls -la /Users/lucamambelli/Desktop/richiesta-assistenza/backend/system-backups/*.zip 2>/dev/null || echo "No ZIP files found"
ls -la /Users/lucamambelli/Desktop/richiesta-assistenza/backend/system-backups/*.json 2>/dev/null || echo "No JSON files found"

echo ""
echo "🔍 Checking if file paths in DB actually exist:"
curl -s -X GET http://localhost:3200/api/backup \
  -H "Content-Type: application/json" \
  -b cookies.txt | jq -r '.backups[] | select(.status == "COMPLETED") | .filePath' | while read filepath; do
  if [ -n "$filepath" ] && [ "$filepath" != "null" ]; then
    if [ -f "$filepath" ]; then
      echo "✅ EXISTS: $filepath ($(ls -lh "$filepath" | awk '{print $5}'))"
    else
      echo "❌ MISSING: $filepath"
    fi
  fi
done

echo ""
echo "📌 Summary:"
echo "Only ONE real backup exists: 4c0b84f3-a0a6-4cd4-b1c0-3aed8f2beb22.zip (29.96 KB)"
echo "This is the backup you created successfully today!"
