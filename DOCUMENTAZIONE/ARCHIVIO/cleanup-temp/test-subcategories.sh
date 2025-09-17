#!/bin/bash

echo "=== Test Subcategories API ==="
echo ""
echo "1. Checking current subcategories:"
curl -s http://localhost:3200/api/test/subcategories | python3 -m json.tool

echo ""
echo "2. Creating subcategories if missing:"
curl -s -X POST http://localhost:3200/api/test/create-subcategories | python3 -m json.tool

echo ""
echo "3. Verifying subcategories after creation:"
curl -s http://localhost:3200/api/test/subcategories | python3 -m json.tool | head -50

echo ""
echo "=== Test Complete ==="
