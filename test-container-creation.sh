#!/bin/bash

echo "=== Testing Container Instance Creation ==="
echo ""
echo "Step 1: Check available templates..."
curl -s http://localhost:3500/api/container-categories/grouped | jq '.data | to_entries | .[0] | .value[0] | {code, name}' || echo "Failed to fetch templates"

echo ""
echo "Step 2: Create test container with valid template..."
curl -X POST http://localhost:3500/api/container-instances \
  -H "Content-Type: application/json" \
  -d '{
    "template_code": "administrative",
    "owner_id": "test-user-' $(date +%s) '",
    "owner_type": "PROFESSIONAL",
    "name": "Test Container ' $(date +%H:%M:%S) '",
    "description": "Automated test container"
  }' | jq '.'

echo ""
echo "Done!"
