#!/bin/bash

echo "🧪 Testing Backup Delete Functionality..."

# Prima otteniamo la lista dei backup
echo ""
echo "📋 Getting backup list..."
response=$(curl -s -X GET http://localhost:3200/api/backup \
  -H "Content-Type: application/json" \
  -b cookies.txt)

# Estrai l'ID del primo backup FAILED
backup_id=$(echo $response | grep -oE '"id":"[^"]+","name":"[^"]*","description":"[^"]*","type":"[^"]*","status":"FAILED"' | head -1 | grep -oE '"id":"[^"]+"' | cut -d'"' -f4)

if [ -z "$backup_id" ]; then
  echo "❌ No FAILED backups found to delete"
  echo ""
  echo "Trying to find ANY backup to delete..."
  backup_id=$(echo $response | grep -oE '"id":"[^"]+"' | head -1 | cut -d'"' -f4)
fi

if [ -z "$backup_id" ]; then
  echo "❌ No backups found at all"
  exit 1
fi

echo "✅ Found backup to delete: $backup_id"

# Prova a eliminare il backup
echo ""
echo "🗑️ Attempting to delete backup..."
delete_response=$(curl -s -X DELETE "http://localhost:3200/api/backup/$backup_id?permanent=true" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -w "\nHTTP_STATUS:%{http_code}")

http_code=$(echo "$delete_response" | grep "HTTP_STATUS" | cut -d':' -f2)
response_body=$(echo "$delete_response" | sed '/HTTP_STATUS/d')

echo "Response: $response_body"
echo "Status Code: $http_code"

if [ "$http_code" = "200" ]; then
  echo ""
  echo "✅ Backup deleted successfully!"
  
  # Verifica che sia stato eliminato
  echo ""
  echo "🔍 Verifying deletion..."
  verify_response=$(curl -s -X GET http://localhost:3200/api/backup \
    -H "Content-Type: application/json" \
    -b cookies.txt)
  
  if echo "$verify_response" | grep -q "$backup_id"; then
    echo "❌ Backup still exists in the list!"
  else
    echo "✅ Backup confirmed deleted from database!"
  fi
else
  echo ""
  echo "❌ Delete failed with status code: $http_code"
  echo "Error: $response_body"
fi

echo ""
echo "✅ Test completed!"
