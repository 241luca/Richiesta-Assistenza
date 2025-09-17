#!/bin/bash

echo "🔍 Test API System Settings..."

# Test con curl
echo "Testing /api/admin/system-settings endpoint..."
curl -X GET http://localhost:3200/api/admin/system-settings \
  -H "Content-Type: application/json" \
  -v

echo ""
echo "---"
echo "Se vedi un errore 401 (Unauthorized), è normale - serve il token JWT"
echo "Se vedi un errore 500, c'è un problema nel backend"
echo "Se vedi 'Cannot GET', la route non è registrata"
